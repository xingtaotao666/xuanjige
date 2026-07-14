"""
五行分析模块 (Five Elements / 五行)

计算八字中木火土金水的强弱分布，
整合纳音、十二长生、健康建议等内容。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge.data_loader import load_all_knowledge, load_mappings

from .engine import TIAN_GAN, DI_ZHI, BaziResult

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

WU_XING = ["木", "火", "土", "金", "水"]
WU_XING_CYCLE = {"木": 0, "火": 1, "土": 2, "金": 3, "水": 4}

CHANG_SHENG_STATES: List[str] = [
    "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养",
]

# 五行生克制化权重 (天干=1, 地支藏干本气=0.7, 中气=0.3, 余气=0.1)
WEIGHT_STEM = 1.0        # 天干权重
WEIGHT_BRANCH = 0.5      # 地支本气
WEIGHT_BRANCH_MID = 0.3  # 地支中气
WEIGHT_BRANCH_TAIL = 0.1 # 地支余气

# 特殊权重: 日干和月支权重加倍
WEIGHT_DAY_STEM_MULTIPLIER = 2.0
WEIGHT_MONTH_BRANCH_MULTIPLIER = 1.5


# ---------------------------------------------------------------------------
# 数据类
# ---------------------------------------------------------------------------

@dataclass
class WuXingScore:
    """单个五行的评分详情。"""
    wuxing: str                    # 五行名称
    score: float = 0.0             # 总评分
    stem_count: int = 0            # 天干出现次数
    hidden_count: int = 0          # 藏干出现次数
    sources: List[str] = field(default_factory=list)  # 来源说明

    @property
    def status(self) -> str:
        """判断五行状态: 旺/偏旺/中和/偏弱/弱。"""
        if self.score >= 4.0:
            return "旺"
        elif self.score >= 2.5:
            return "偏旺"
        elif self.score >= 1.5:
            return "中和"
        elif self.score >= 0.5:
            return "偏弱"
        else:
            return "弱"


@dataclass
class NaYinInfo:
    """纳音信息。"""
    ganzhi: str                    # 干支组合
    nayin: str                     # 纳音名称
    wuxing: str                    # 纳音五行


@dataclass
class ChangShengInfo:
    """十二长生信息。"""
    tiangan: str                   # 天干
    dizhi: str                     # 地支
    state: str                     # 状态 (长生/沐浴/...)
    state_index: int               # 状态索引 (0-11)
    description: str = ""          # 状态描述


@dataclass
class HealthAdvice:
    """健康建议。"""
    wuxing: str                    # 五行
    state: str                     # 状态 (旺/弱)
    body_parts: List[str]          # 相关身体部位
    color_advice: str              # 颜色建议
    direction: str                 # 方位建议
    description: str               # 健康描述


@dataclass
class WuXingAnalysis:
    """完整的五行分析结果。"""
    # 各五行评分
    scores: Dict[str, WuXingScore] = field(default_factory=dict)

    # 五行状态摘要 (旺/偏旺/中和/偏弱/弱)
    status_summary: Dict[str, str] = field(default_factory=dict)

    # 日干五行
    day_stem_wuxing: str = ""

    # 日干状态强弱
    day_stem_status: str = "中和"

    # 纳音信息 (年柱纳音为主)
    nayin_info: Dict[str, NaYinInfo] = field(default_factory=dict)

    # 十二长生信息
    chang_sheng: Dict[str, List[ChangShengInfo]] = field(default_factory=dict)

    # 健康建议
    health_advice: List[HealthAdvice] = field(default_factory=list)

    # 五行生克分析
    generates: List[str] = field(default_factory=list)    # 日干所生
    controlled_by: List[str] = field(default_factory=list) # 克日干
    controls: List[str] = field(default_factory=list)     # 日干所克
    generated_by: List[str] = field(default_factory=list)  # 生日干

    # 最旺/最弱五行
    strongest: Optional[str] = None
    weakest: Optional[str] = None


# ---------------------------------------------------------------------------
# 核心逻辑
# ---------------------------------------------------------------------------

class WuXingAnalyzer:
    """五行分析器。"""

    def __init__(self) -> None:
        self._knowledge: Dict[str, Any] = load_all_knowledge()
        self._mappings: Dict[str, Any] = load_mappings()
        self._health_mappings: List[Dict[str, Any]] = (
            self._mappings.get("wuxing_health", {}).get("mappings", [])
        )

    def _get_stem_wuxing(self, stem: str) -> str:
        """获取天干的五行。"""
        tg = self._knowledge.get("tiangandizhi", {}).get("tiangan", {})
        info = tg.get(stem, {})
        return info.get("wuxing", "")

    def _get_branch_wuxing(self, branch: str) -> str:
        """获取地支的五行。"""
        dz = self._knowledge.get("tiangandizhi", {}).get("dizhi", {})
        info = dz.get(branch, {})
        return info.get("wuxing", "")

    def _get_hidden_stem_weight(
        self, dizhi: str, stem: str
    ) -> Tuple[float, str]:
        """
        获取藏干的权重。
        Returns: (weight, 类型描述)
        """
        cg_data = self._knowledge.get("dizhi_canggan", {}).get(
            "dizhi_canggan", {}
        )
        if dizhi not in cg_data:
            return WEIGHT_BRANCH, "本气"

        info = cg_data[dizhi]
        if stem == info.get("benqi"):
            return WEIGHT_BRANCH, "本气"
        elif stem == info.get("zhongqi"):
            return WEIGHT_BRANCH_MID, "中气"
        elif stem == info.get("yuqi"):
            return WEIGHT_BRANCH_TAIL, "余气"
        
        # fallback: 按列表索引分配权重
        stems_list = info.get("list", [])
        if len(stems_list) == 1:
            return WEIGHT_BRANCH, "本气"
        elif len(stems_list) == 2:
            idx = stems_list.index(stem)
            return (WEIGHT_BRANCH, "本气") if idx == 0 else (WEIGHT_BRANCH_MID, "中气")
        else:
            idx = stems_list.index(stem)
            weights = [WEIGHT_BRANCH, WEIGHT_BRANCH_MID, WEIGHT_BRANCH_TAIL]
            types = ["本气", "中气", "余气"]
            return weights[idx], types[idx]

    def analyze(self, bazi: BaziResult) -> WuXingAnalysis:
        """
        对八字进行五行分析。
        
        Args:
            bazi: 八字排盘结果
        
        Returns:
            五行分析结果
        """
        analysis = WuXingAnalysis()
        analysis.day_stem_wuxing = bazi.day_stem_wuxing
        
        # 初始化评分
        scores: Dict[str, WuXingScore] = {}
        for wx in WU_XING:
            scores[wx] = WuXingScore(wuxing=wx)
        
        # ---- 统计天干 ----
        for i, stem in enumerate(bazi.all_stems):
            wx = self._get_stem_wuxing(stem)
            if not wx:
                continue
            
            weight = WEIGHT_STEM
            if i == 2:  # 日干
                weight *= WEIGHT_DAY_STEM_MULTIPLIER
            
            scores[wx].score += weight
            scores[wx].stem_count += 1
            source = f"{['年','月','日','时'][i]}干{stem}"
            if i == 2:
                source += " (日干×2)"
            scores[wx].sources.append(source)
        
        # ---- 统计地支本气 (通过藏干) ----
        for i, pillar in enumerate(bazi.four_pillars):
            branch = pillar.dizhi
            hidden_stems = pillar.canggan
            
            if not hidden_stems:
                # 使用地支五行作为本气
                wx = self._get_branch_wuxing(branch)
                if wx:
                    weight = WEIGHT_BRANCH
                    if i == 1:  # 月支
                        weight *= WEIGHT_MONTH_BRANCH_MULTIPLIER
                    scores[wx].score += weight
                    scores[wx].hidden_count += 1
                    source = f"{['年','月','日','时'][i]}支{branch} (本气×{weight/WEIGHT_BRANCH:.1f})"
                    scores[wx].sources.append(source)
                continue
            
            for hidden_stem in hidden_stems:
                wx = self._get_stem_wuxing(hidden_stem)
                if not wx:
                    continue
                
                weight, weight_type = self._get_hidden_stem_weight(
                    branch, hidden_stem
                )
                
                if i == 1:  # 月支加倍
                    weight *= WEIGHT_MONTH_BRANCH_MULTIPLIER
                
                scores[wx].score += weight
                scores[wx].hidden_count += 1
                source = (
                    f"{['年','月','日','时'][i]}支{branch}藏{hidden_stem}"
                    f" ({weight_type}"
                    f"{'×月支' if i == 1 else ''})"
                )
                scores[wx].sources.append(source)
        
        # ---- 纳音信息 ----
        nayin_info: Dict[str, NaYinInfo] = {}
        for i, p in enumerate(bazi.four_pillars):
            if p.nayin:
                pillar_name = ["年柱", "月柱", "日柱", "时柱"][i]
                nayin_info[pillar_name] = NaYinInfo(
                    ganzhi=p.ganzhi,
                    nayin=p.nayin,
                    wuxing=p.nayin_wuxing or "",
                )
        analysis.nayin_info = nayin_info
        
        # ---- 十二月柱 ----
        chang_sheng: Dict[str, List[ChangShengInfo]] = {}
        cs_data = self._knowledge.get("shier_changsheng", {})
        cs_map = cs_data.get("changsheng_map_by_dizhi", {})
        
        for pillar in bazi.four_pillars:
            branch = pillar.dizhi
            branch_cs = cs_map.get(branch, {})
            state = branch_cs.get(bazi.day_stem, "")
            
            if state:
                state_idx = CHANG_SHENG_STATES.index(state) if state in CHANG_SHENG_STATES else -1
                if pillar.tiangan not in chang_sheng:
                    chang_sheng[pillar.tiangan] = []
                chang_sheng[pillar.tiangan].append(ChangShengInfo(
                    tiangan=pillar.tiangan,
                    dizhi=branch,
                    state=state,
                    state_index=state_idx,
                    description=_get_changsheng_description(state),
                ))
        analysis.chang_sheng = chang_sheng
        
        # ---- 五行生克分析 ----
        day_wx = bazi.day_stem_wuxing
        if day_wx in WU_XING_CYCLE:
            day_idx = WU_XING_CYCLE[day_wx]
            analysis.generates = [WU_XING[(day_idx + 1) % 5]]
            analysis.generated_by = [WU_XING[(day_idx - 1) % 5]]
            analysis.controls = [WU_XING[(day_idx + 2) % 5]]
            analysis.controlled_by = [WU_XING[(day_idx - 2) % 5]]
        
        # ---- 找出最旺和最弱 ----
        sorted_scores = sorted(scores.values(), key=lambda s: s.score, reverse=True)
        if sorted_scores:
            analysis.strongest = sorted_scores[0].wuxing if sorted_scores[0].score > 0 else None
            analysis.weakest = sorted_scores[-1].wuxing if sorted_scores[-1].score < sorted_scores[0].score else None
        
        # ---- 状态摘要 ----
        status_summary: Dict[str, str] = {}
        for wx, score in scores.items():
            status_summary[wx] = score.status
        analysis.status_summary = status_summary
        analysis.scores = scores
        
        # 日干状态
        if day_wx in scores:
            analysis.day_stem_status = scores[day_wx].status
        
        # ---- 健康建议 ----
        analysis.health_advice = self._get_health_advice(scores)
        
        return analysis

    def _get_health_advice(
        self, scores: Dict[str, WuXingScore]
    ) -> List[HealthAdvice]:
        """根据五行评分获取健康建议。"""
        advice_list: List[HealthAdvice] = []
        
        for mapping in self._health_mappings:
            wx = mapping.get("wuxing", "")
            state = mapping.get("state", "")
            
            if wx not in scores:
                continue
            
            score = scores[wx]
            
            # 判断是否需要该建议: 旺+旺/偏旺, 弱+偏弱/弱
            matched = False
            if state == "旺" and score.status in ("旺", "偏旺"):
                matched = True
            elif state == "弱" and score.status in ("弱", "偏弱"):
                matched = True
            
            if matched:
                advice_list.append(HealthAdvice(
                    wuxing=wx,
                    state=state,
                    body_parts=mapping.get("body_parts", []),
                    color_advice=mapping.get("color_advice", ""),
                    direction=mapping.get("direction", ""),
                    description=mapping.get("description", ""),
                ))
        
        return advice_list


# ---------------------------------------------------------------------------
# 模块级工具函数 (供外部调用)
# ---------------------------------------------------------------------------

def _get_hidden_stem_weight_impl(
    dizhi: str, stem: str, knowledge: Dict[str, Any]
) -> Tuple[float, str]:
    """
    获取藏干权重 (模块级函数，供外部导入)。
    Returns: (weight, type_description)
    """
    cg_data = knowledge.get("dizhi_canggan", {}).get("dizhi_canggan", {})
    if dizhi not in cg_data:
        return WEIGHT_BRANCH, "本气"

    info = cg_data[dizhi]
    if stem == info.get("benqi"):
        return WEIGHT_BRANCH, "本气"
    elif stem == info.get("zhongqi"):
        return WEIGHT_BRANCH_MID, "中气"
    elif stem == info.get("yuqi"):
        return WEIGHT_BRANCH_TAIL, "余气"

    stems_list = info.get("list", [])
    if len(stems_list) == 1:
        return WEIGHT_BRANCH, "本气"
    elif len(stems_list) == 2:
        idx = stems_list.index(stem)
        return (WEIGHT_BRANCH, "本气") if idx == 0 else (WEIGHT_BRANCH_MID, "中气")
    else:
        idx = stems_list.index(stem)
        weights = [WEIGHT_BRANCH, WEIGHT_BRANCH_MID, WEIGHT_BRANCH_TAIL]
        types = ["本气", "中气", "余气"]
        return weights[idx], types[idx]


def _get_changsheng_description(state: str) -> str:
    """获取十二长生状态的描述。"""
    descriptions = {
        "长生": "如初生之婴儿，充满生机与活力",
        "沐浴": "如婴儿洗浴，柔嫩脆弱，易受外界影响",
        "冠带": "如少年加冠，逐渐成长，开始展现才华",
        "临官": "如壮年入仕，事业有成，处于上升期",
        "帝旺": "如日中天，极盛之时，但盛极必衰",
        "衰": "盛极而衰，开始走下坡路",
        "病": "如人患病，精力衰退，诸事不顺",
        "死": "如死亡沉寂，事情停滞，旧事物终结",
        "墓": "如入墓库，收藏沉淀，蓄势待发",
        "绝": "如绝处逢生之极点，旧气已尽，新气未生",
        "胎": "如胚胎孕育，新生命开始萌动",
        "养": "如胎儿养育，积蓄力量，等待新生",
    }
    return descriptions.get(state, "")
