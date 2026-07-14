"""
十神推导模块 (Ten Gods / 十神)

以日干为基准，判断其他天干与日干的五行生克及阴阳关系，
确定正官、七杀、正印、偏印、正财、偏财、比肩、劫财、食神、伤官。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.knowledge.data_loader import load_all_knowledge, load_mappings

from .engine import TIAN_GAN, BaziResult, Pillar

# ---------------------------------------------------------------------------
# 十神列表
# ---------------------------------------------------------------------------

SHI_SHEN_NAMES: List[str] = [
    "正官", "七杀", "正印", "偏印",
    "正财", "偏财", "比肩", "劫财",
    "食神", "伤官",
]


# ---------------------------------------------------------------------------
# 数据类
# ---------------------------------------------------------------------------

@dataclass
class ShiShenResult:
    """单个天干的十神分析结果。"""
    tiangan: str                            # 天干
    shishen: str                            # 十神名称
    relationship: str                       # 五行关系 (生我/我生/克我/我克/同我)
    same_yinyang: bool                      # 阴阳是否相同
    meaning: str = ""                       # 含义描述
    modern_roles: List[str] = field(default_factory=list)  # 现代角色映射


@dataclass
class ShiShenAnalysis:
    """完整的十神分析结果。"""
    day_stem: str                                     # 日干
    day_stem_wuxing: str                              # 日干五行

    # 四柱天干十神 (年、月、日、时)
    stem_analysis: List[ShiShenResult] = field(default_factory=list)

    # 四柱地支藏干十神
    branch_hidden_analysis: Dict[str, List[ShiShenResult]] = field(
        default_factory=dict
    )

    # 按十神类型统计
    shishen_count: Dict[str, int] = field(default_factory=dict)

    # 按五行关系统计
    relationship_count: Dict[str, int] = field(default_factory=dict)

    # 现代角色映射
    modern_mappings: Dict[str, Dict[str, Any]] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# 核心逻辑
# ---------------------------------------------------------------------------

class ShiShenCalculator:
    """十神计算器。"""

    def __init__(self) -> None:
        self._knowledge: Dict[str, Any] = load_all_knowledge()
        self._mappings: Dict[str, Any] = load_mappings()
        self._shishen_rules: Dict[str, Any] = self._knowledge.get(
            "shishen_rules", {}
        )
        self._day_stem_lookup: Dict[str, Dict[str, str]] = (
            self._shishen_rules.get("day_stem_lookup", {})
        )
        self._modern_mapping: Dict[str, Dict[str, Any]] = {}
        self._init_modern_mapping()

    def _init_modern_mapping(self) -> None:
        """加载十神到现代角色的映射关系。"""
        shishen_modern = self._mappings.get("shishen_modern", {})
        mappings = shishen_modern.get("mappings", [])
        for item in mappings:
            shen_name = item.get("shen", "")
            if shen_name:
                self._modern_mapping[shen_name] = item

    def _get_shishen_for_stem(self, day_stem: str, target_stem: str) -> str:
        """
        查表获取指定天干相对于日干的十神。
        
        Args:
            day_stem: 日干
            target_stem: 要判断的天干
        
        Returns:
            十神名称
        """
        lookup = self._day_stem_lookup.get(day_stem, {})
        return lookup.get(target_stem, "")

    def _get_wuxing_relation(
        self, day_stem: str, target_stem: str, knowledge: Dict[str, Any]
    ) -> str:
        """
        判断两个天干的五行关系。
        
        Returns: "生我", "我生", "克我", "我克", "同我"
        """
        tg = knowledge.get("tiangandizhi", {}).get("tiangan", {})
        day_info = tg.get(day_stem, {})
        target_info = tg.get(target_stem, {})
        
        day_wx = day_info.get("wuxing", "")
        target_wx = target_info.get("wuxing", "")
        
        if day_wx == target_wx:
            return "同我"
        
        # 生克关系: 木火土金水
        wx_cycle = ["木", "火", "土", "金", "水"]
        day_idx = wx_cycle.index(day_wx) if day_wx in wx_cycle else -1
        target_idx = wx_cycle.index(target_wx) if target_wx in wx_cycle else -1
        
        if day_idx == -1 or target_idx == -1:
            return ""
        
        # 我生: target_wx is next in cycle
        if target_idx == (day_idx + 1) % 5:
            return "我生"
        # 生我: target_wx is previous in cycle
        if target_idx == (day_idx - 1) % 5:
            return "生我"
        # 我克: target_wx is two steps ahead
        if target_idx == (day_idx + 2) % 5:
            return "我克"
        # 克我: target_wx is two steps behind
        if target_idx == (day_idx - 2) % 5:
            return "克我"
        
        return ""

    def _get_yinyang(self, stem: str, knowledge: Dict[str, Any]) -> str:
        """获取天干的阴阳属性。"""
        tg = knowledge.get("tiangandizhi", {}).get("tiangan", {})
        info = tg.get(stem, {})
        return info.get("yinyang", "")

    def analyze_pillar(self, bazi: BaziResult) -> ShiShenAnalysis:
        """
        对八字进行完整的十神分析。
        
        Args:
            bazi: 八字排盘结果
        
        Returns:
            十神分析结果
        """
        day_stem = bazi.day_stem
        knowledge = self._knowledge
        
        analysis = ShiShenAnalysis(
            day_stem=day_stem,
            day_stem_wuxing=bazi.day_stem_wuxing,
        )
        
        shishen_count: Dict[str, int] = {s: 0 for s in SHI_SHEN_NAMES}
        rel_count: Dict[str, int] = {
            "生我": 0, "我生": 0, "克我": 0, "我克": 0, "同我": 0
        }
        
        # ---- 四柱天干分析 ----
        for i, pillar in enumerate(bazi.four_pillars):
            stem = pillar.tiangan
            if stem == day_stem and i == 2:
                # 日干本身: 比肩
                ss_name = "比肩"
            else:
                ss_name = self._get_shishen_for_stem(day_stem, stem)
            
            if ss_name:
                shishen_count[ss_name] = shishen_count.get(ss_name, 0) + 1
            
            wx_rel = self._get_wuxing_relation(day_stem, stem, knowledge)
            if wx_rel:
                rel_count[wx_rel] = rel_count.get(wx_rel, 0) + 1
            
            day_yy = self._get_yinyang(day_stem, knowledge)
            stem_yy = self._get_yinyang(stem, knowledge)
            same_yy = day_yy == stem_yy
            
            # 含义查询
            shishen_info = self._shishen_rules.get("shishen_wuxing_relation", {})
            meaning = shishen_info.get(ss_name, {}).get("meaning", "") if ss_name else ""
            
            # 现代角色
            mapping = self._modern_mapping.get(ss_name, {})
            modern_roles = mapping.get("modern_roles", [])
            
            result = ShiShenResult(
                tiangan=stem,
                shishen=ss_name if ss_name else "",
                relationship=wx_rel if wx_rel else "",
                same_yinyang=same_yy,
                meaning=meaning,
                modern_roles=modern_roles,
            )
            analysis.stem_analysis.append(result)
        
        # ---- 地支藏干分析 ----
        for pillar in bazi.four_pillars:
            branch = pillar.dizhi
            hidden_results: List[ShiShenResult] = []
            
            for hidden_stem in pillar.canggan:
                ss_name = self._get_shishen_for_stem(day_stem, hidden_stem)
                if ss_name:
                    shishen_count[ss_name] = shishen_count.get(ss_name, 0) + 1
                
                wx_rel = self._get_wuxing_relation(day_stem, hidden_stem, knowledge)
                if wx_rel:
                    rel_count[wx_rel] = rel_count.get(wx_rel, 0) + 1
                
                day_yy = self._get_yinyang(day_stem, knowledge)
                stem_yy = self._get_yinyang(hidden_stem, knowledge)
                
                shishen_info = self._shishen_rules.get("shishen_wuxing_relation", {})
                meaning = shishen_info.get(ss_name, {}).get("meaning", "") if ss_name else ""
                
                mapping = self._modern_mapping.get(ss_name, {})
                modern_roles = mapping.get("modern_roles", [])
                
                hidden_results.append(ShiShenResult(
                    tiangan=hidden_stem,
                    shishen=ss_name if ss_name else "",
                    relationship=wx_rel if wx_rel else "",
                    same_yinyang=day_yy == stem_yy,
                    meaning=meaning,
                    modern_roles=modern_roles,
                ))
            
            analysis.branch_hidden_analysis[branch] = hidden_results
        
        analysis.shishen_count = shishen_count
        analysis.relationship_count = rel_count
        analysis.modern_mappings = self._modern_mapping
        
        return analysis
