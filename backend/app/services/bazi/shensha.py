"""
神煞查询模块 (Auspicious & Inauspicious Deities / 神煞)

基于日干、年支等基准查询各种神煞，
包括天乙贵人、文昌贵人、驿马、桃花、华盖、空亡等，
并关联现代事件解读。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge.data_loader import load_all_knowledge, load_mappings

from .engine import TIAN_GAN, DI_ZHI, BaziResult, JIA_ZI_CYCLE

# ---------------------------------------------------------------------------
# 数据类
# ---------------------------------------------------------------------------

@dataclass
class ShenShaDetail:
    """单个神煞的详细信息。"""
    name: str                           # 神煞名称
    description: str                    # 传统描述
    found_in_branches: List[str]        # 出现在哪些地支
    found_in_branches_index: List[str]  # 出现在哪些柱子 (年/月/日/时)
    is_auspicious: bool = True          # 是否吉神
    tags: List[str] = field(default_factory=list)        # 现代事件标签
    modern_description: str = ""        # 现代解读


@dataclass
class ShenShaAnalysis:
    """完整的神煞分析结果。"""
    # 按地支分组的神煞
    by_branch: Dict[str, List[ShenShaDetail]] = field(default_factory=dict)
    
    # 按柱子分组的神煞
    by_pillar: Dict[str, List[ShenShaDetail]] = field(default_factory=dict)
    
    # 所有吉神
    auspicious: List[ShenShaDetail] = field(default_factory=list)
    
    # 所有凶神
    inauspicious: List[ShenShaDetail] = field(default_factory=list)
    
    # 空亡的地支
    kong_wang: List[str] = field(default_factory=list)
    
    # 空亡的柱子
    kong_wang_pillars: List[str] = field(default_factory=list)


# 吉凶分类
AUSPICIOUS_SHENSHA: List[str] = [
    "天乙贵人", "天德贵人", "月德贵人", "文昌贵人",
    "太极贵人", "将星", "天喜", "红鸾",
    "福星", "禄神", "天医", "金舆", "天赦",
]

INAUSPICIOUS_SHENSHA: List[str] = [
    "劫煞", "灾煞", "孤辰", "寡宿",
    "丧门", "吊客", "亡神", "元辰（大耗）",
    "勾神",
]

NEUTRAL_SHENSHA: List[str] = [
    "驿马", "桃花（咸池）", "华盖", "空亡", "羊刃",
]


# ---------------------------------------------------------------------------
# 神煞查询器
# ---------------------------------------------------------------------------

class ShenShaLookup:
    """神煞查询器。"""

    def __init__(self) -> None:
        self._knowledge: Dict[str, Any] = load_all_knowledge()
        self._mappings: Dict[str, Any] = load_mappings()
        self._rules: List[Dict[str, Any]] = (
            self._knowledge.get("shensha_rules", {}).get("shensha_list", [])
        )
        self._events: Dict[str, Dict[str, Any]] = {}
        self._init_events()

    def _init_events(self) -> None:
        """加载神煞事件映射。"""
        events_data = self._mappings.get("shensha_events", {})
        mappings = events_data.get("mappings", [])
        for item in mappings:
            name = item.get("shensha", "")
            if name:
                self._events[name] = item

    def lookup(self, bazi: BaziResult) -> ShenShaAnalysis:
        """
        查询八字中所有神煞。
        
        Args:
            bazi: 八字排盘结果
        
        Returns:
            神煞分析结果
        """
        analysis = ShenShaAnalysis()
        
        day_stem = bazi.day_stem
        year_stem = bazi.year_pillar.tiangan
        day_branch = bazi.day_pillar.dizhi
        year_branch = bazi.year_pillar.dizhi
        
        branches = bazi.all_branches  # [年支, 月支, 日支, 时支]
        pillar_names = ["年柱", "月柱", "日柱", "时柱"]
        
        for rule in self._rules:
            name = rule.get("name", "")
            lookup_type = rule.get("lookup_type", "")
            method = rule.get("method", "")
            raw_rules = rule.get("rules", {})
            
            results: List[Tuple[str, int]] = []  # (branch, pillar_index)
            
            # ---- 根据查询类型执行 ----
            if lookup_type == "日干":
                results = self._lookup_by_day_stem(
                    day_stem, raw_rules, branches, pillar_names
                )
            elif lookup_type == "年干":
                results = self._lookup_by_day_stem(
                    year_stem, raw_rules, branches, pillar_names
                )
            elif lookup_type in ("日支或年支", "日支或年支"):
                results = self._lookup_by_sanhe(
                    day_branch, year_branch, raw_rules,
                    branches, pillar_names
                )
            elif lookup_type == "日柱":
                results = self._lookup_by_rizhu(
                    bazi, raw_rules, branches, pillar_names
                )
            elif lookup_type == "月份":
                results = self._lookup_by_month(
                    bazi, bazi.month_pillar.dizhi, raw_rules,
                    branches, pillar_names
                )
            elif lookup_type == "日干或年干":
                results = self._lookup_by_day_and_year_stem(
                    day_stem, year_stem, raw_rules,
                    branches, pillar_names
                )
            
            if not results:
                continue
            
            # 构建神煞详情
            detail_branches: List[str] = []
            detail_pillars: List[str] = []
            for br, pi in results:
                if br not in detail_branches:
                    detail_branches.append(br)
                if pillar_names[pi] not in detail_pillars:
                    detail_pillars.append(pillar_names[pi])
            
            is_good = name in AUSPICIOUS_SHENSHA
            is_bad = name in INAUSPICIOUS_SHENSHA
            
            event_info = self._events.get(name, {})
            tags = event_info.get("tags", [])
            modern_desc = event_info.get("description", "")
            
            detail = ShenShaDetail(
                name=name,
                description=rule.get("description", ""),
                found_in_branches=detail_branches,
                found_in_branches_index=detail_pillars,
                is_auspicious=is_good or (not is_bad and name not in NEUTRAL_SHENSHA),
                tags=tags,
                modern_description=modern_desc,
            )
            
            # 分组存储
            for br in detail_branches:
                if br not in analysis.by_branch:
                    analysis.by_branch[br] = []
                analysis.by_branch[br].append(detail)
            
            for pn in detail_pillars:
                if pn not in analysis.by_pillar:
                    analysis.by_pillar[pn] = []
                analysis.by_pillar[pn].append(detail)
            
            if is_good:
                analysis.auspicious.append(detail)
            elif is_bad:
                analysis.inauspicious.append(detail)
            else:
                analysis.auspicious.append(detail)  # neutral treated as good
        
        # ---- 单独处理空亡 ----
        kong_wang_result = self._lookup_kong_wang(bazi)
        analysis.kong_wang = kong_wang_result["branches"]
        analysis.kong_wang_pillars = kong_wang_result["pillars"]
        
        return analysis

    # ---- 内部查询方法 ----

    def _lookup_by_day_stem(
        self,
        stem: str,
        rules: Dict[str, Any],
        branches: List[str],
        pillar_names: List[str],
    ) -> List[Tuple[str, int]]:
        """以日干/年干查地支。"""
        results: List[Tuple[str, int]] = []
        target_branches = rules.get(stem, [])
        if isinstance(target_branches, str):
            target_branches = [target_branches]
        
        for target_branch in target_branches:
            for i, br in enumerate(branches):
                if br == target_branch:
                    results.append((br, i))
        return results

    def _lookup_by_day_and_year_stem(
        self,
        day_stem: str,
        year_stem: str,
        rules: Dict[str, Any],
        branches: List[str],
        pillar_names: List[str],
    ) -> List[Tuple[str, int]]:
        """以日干或年干查地支 (如太极贵人)。"""
        results: List[Tuple[str, int]] = []
        for key, target_branches in rules.items():
            # key 可以是 "甲乙" "丙丁" 等形式
            if day_stem in key or year_stem in key:
                if isinstance(target_branches, str):
                    target_branches = [target_branches]
                for target_branch in target_branches:
                    for i, br in enumerate(branches):
                        if br == target_branch:
                            results.append((br, i))
        return results

    def _lookup_by_sanhe(
        self,
        day_branch: str,
        year_branch: str,
        rules: Dict[str, Any],
        branches: List[str],
        pillar_names: List[str],
    ) -> List[Tuple[str, int]]:
        """以三合局查地支 (驿马、桃花、华盖等)。"""
        results: List[Tuple[str, int]] = []
        
        # 判断 day_branch 或 year_branch 属于哪个三合局
        key_used = None
        for key, _ in rules.items():
            if day_branch in key or year_branch in key:
                key_used = key
                break
        
        if key_used is None:
            return results
        
        target_branch = rules.get(key_used, "")
        if isinstance(target_branch, str):
            target_branch = [target_branch]
        
        for tb in target_branch:
            for i, br in enumerate(branches):
                if br == tb:
                    results.append((br, i))
        
        return results

    def _lookup_by_rizhu(
        self,
        bazi: BaziResult,
        rules: Dict[str, Any],
        branches: List[str],
        pillar_names: List[str],
    ) -> List[Tuple[str, int]]:
        """以日柱查空亡等。"""
        results: List[Tuple[str, int]] = []
        
        day_ganzhi = bazi.day_pillar.ganzhi
        xun_map = rules.get("旬空_map", {})
        
        if day_ganzhi in xun_map:
            xun_name = xun_map[day_ganzhi]
            kong_branches = rules.get(xun_name, [])
            for kb in kong_branches:
                for i, br in enumerate(branches):
                    if br == kb:
                        results.append((br, i))
        
        return results

    def _lookup_by_month(
        self,
        bazi: BaziResult,
        month_branch: str,
        rules: Dict[str, Any],
        branches: List[str],
        pillar_names: List[str],
    ) -> List[Tuple[str, int]]:
        """以月支查 (天德贵人、月德贵人)。"""
        results: List[Tuple[str, int]] = []
        
        for key, value in rules.items():
            # month_branch 可能与 key 相等
            if month_branch == key:
                target = value
                if isinstance(target, str):
                    target = [target]
                for t in target:
                    for i, br in enumerate(branches):
                        if br == t:
                            results.append((br, i))
                break
            
            # 月德贵人的 key 是三合局
            if month_branch in key:
                target_stem = value
                # 月德贵人返回的是天干, 需要找对应的地支
                for i, pillar in enumerate(bazi.four_pillars):
                    if pillar.tiangan == target_stem:
                        results.append((pillar.dizhi, i))
                break
        
        return results

    def _lookup_kong_wang(self, bazi: BaziResult) -> Dict[str, Any]:
        """查询空亡。"""
        day_ganzhi = bazi.day_pillar.ganzhi
        
        # 从 shensha_rules 中获取空亡规则
        for rule in self._rules:
            if rule.get("name") == "空亡":
                xun_map = rule.get("rules", {}).get("旬空_map", {})
                kong_rules = rule.get("rules", {})
                
                if day_ganzhi in xun_map:
                    xun_name = xun_map[day_ganzhi]
                    kong_branches = kong_rules.get(xun_name, [])
                    
                    pillars_found: List[str] = []
                    pillar_names = ["年柱", "月柱", "日柱", "时柱"]
                    for i, br in enumerate(bazi.all_branches):
                        if br in kong_branches:
                            pillars_found.append(pillar_names[i])
                    
                    return {
                        "branches": kong_branches,
                        "pillars": pillars_found,
                    }
        
        return {"branches": [], "pillars": []}
