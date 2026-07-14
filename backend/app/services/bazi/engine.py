"""
八字排盘核心引擎 (Ba Zi Calculation Engine)

将公历出生日期转换为四柱八字（年柱、月柱、日柱、时柱），
返回包含天干地支及藏干的完整排盘结果。
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge.data_loader import load_all_knowledge

# ---------------------------------------------------------------------------
# 常量定义
# ---------------------------------------------------------------------------

TIAN_GAN: List[str] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
DI_ZHI: List[str] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# 六十甲子周期
JIA_ZI_CYCLE: List[str] = [
    f"{TIAN_GAN[i % 10]}{DI_ZHI[i % 12]}" for i in range(60)
]

# 参考点: 1900-01-01 = 甲子日 (cycle index 0)
REFERENCE_DATE = datetime.date(1900, 1, 1)

# 五虎遁: 年干 -> 正月(寅月)天干索引
_WU_HU_DUN: Dict[str, int] = {
    "甲": 2, "乙": 4, "丙": 6, "丁": 8, "戊": 0,
    "己": 2, "庚": 4, "辛": 6, "壬": 8, "癸": 0,
}

# 五鼠遁: 日干 -> 子时天干索引
_WU_SHU_DUN: Dict[str, int] = {
    "甲": 0, "乙": 2, "丙": 4, "丁": 6, "戊": 8,
    "己": 0, "庚": 2, "辛": 4, "壬": 6, "癸": 8,
}

# 时辰对应地支索引 (hour -> branch index, minute determines boundary edge)
_HOUR_BRANCH_MAP: List[Tuple[int, int, int]] = [
    # (start_hour, start_minute, branch_index)
    (23, 0, 0),   # 子
    (1, 0, 1),    # 丑
    (3, 0, 2),    # 寅
    (5, 0, 3),    # 卯
    (7, 0, 4),    # 辰
    (9, 0, 5),    # 巳
    (11, 0, 6),   # 午
    (13, 0, 7),   # 未
    (15, 0, 8),   # 申
    (17, 0, 9),   # 酉
    (19, 0, 10),  # 戌
    (21, 0, 11),  # 亥
]


# ---------------------------------------------------------------------------
# 数据类
# ---------------------------------------------------------------------------

@dataclass
class Pillar:
    """单柱数据。"""
    ganzhi: str            # 干支组合，如 "甲子"
    tiangan: str           # 天干
    dizhi: str             # 地支
    canggan: List[str]     # 地支藏干列表
    wuxing_tiangan: str    # 天干五行
    wuxing_dizhi: str      # 地支五行
    hide_stems_full: Optional[Dict[str, Any]] = None  # 藏干详情 (本中余气)
    nayin: Optional[str] = None       # 纳音
    nayin_wuxing: Optional[str] = None  # 纳音五行

    @property
    def ganzhi_index(self) -> int:
        """六十甲子中的序号 (0-59)。"""
        if self.ganzhi in JIA_ZI_CYCLE:
            return JIA_ZI_CYCLE.index(self.ganzhi)
        return -1


@dataclass
class BaziResult:
    """完整的八字排盘结果。"""
    birth_date: datetime.date         # 公历出生日期
    birth_hour: int                   # 出生小时 (0-23)
    birth_minute: int                 # 出生分钟 (0-59)
    gender: str                       # 性别: "男" / "女"

    year_pillar: Pillar               # 年柱
    month_pillar: Pillar              # 月柱
    day_pillar: Pillar                # 日柱
    hour_pillar: Pillar               # 时柱

    year_stem_index: int              # 年干索引
    month_stem_index: int             # 月干索引
    day_stem_index: int               # 日干索引
    hour_stem_index: int              # 时干索引
    year_branch_index: int            # 年支索引
    month_branch_index: int           # 月支索引
    day_branch_index: int             # 日支索引
    hour_branch_index: int            # 时支索引

    day_stem: str                     # 日干 (简写)
    day_stem_wuxing: str              # 日干五行

    current_jieqi: Optional[str] = None        # 当前所处的节气
    li_chun_adjusted: bool = False             # 年柱是否因立春调整
    raw_data: Dict[str, Any] = field(default_factory=dict)  # 原始数据

    @property
    def four_pillars(self) -> List[Pillar]:
        """四柱列表: 年、月、日、时。"""
        return [self.year_pillar, self.month_pillar, self.day_pillar, self.hour_pillar]

    @property
    def all_stems(self) -> List[str]:
        """所有天干 (年干、月干、日干、时干)。"""
        return [p.tiangan for p in self.four_pillars]

    @property
    def all_branches(self) -> List[str]:
        """所有地支 (年支、月支、日支、时支)。"""
        return [p.dizhi for p in self.four_pillars]

    @property
    def all_hidden_stems(self) -> List[str]:
        """所有藏干 (去重)。"""
        seen: set = set()
        result: List[str] = []
        for p in self.four_pillars:
            for g in p.canggan:
                if g not in seen:
                    seen.add(g)
                    result.append(g)
        return result


# ---------------------------------------------------------------------------
# 核心工具函数
# ---------------------------------------------------------------------------

def _init_knowledge() -> Dict[str, Any]:
    """初始化并返回所有知识库数据。"""
    return load_all_knowledge()


def _get_jieqi_boundaries(knowledge: Dict[str, Any]) -> List[Dict[str, Any]]:
    """从知识库提取'节'气边界 (用于确定月份)。"""
    jieqi_data = knowledge.get("jieqi", {})
    all_jieqi = jieqi_data.get("all_jieqi", [])
    boundaries = [j for j in all_jieqi if j.get("jieqi_type") == "节"]
    # 按 (month, day) 排序；处理跨年 (小寒在1月)
    def _sort_key(j: Dict[str, Any]) -> Tuple[int, int]:
        md = j["gongli_start"]  # "MM-DD"
        parts = md.split("-")
        m, d = int(parts[0]), int(parts[1])
        # 小寒/大寒在1月，排序时视为第13/14个月
        if m == 1:
            m += 12
        return (m, d)
    boundaries.sort(key=_sort_key)
    return boundaries


def _parse_jieqi_date(start_str: str) -> Tuple[int, int]:
    """将 'MM-DD' 格式的节气日期转为 (month, day)。"""
    parts = start_str.split("-")
    return int(parts[0]), int(parts[1])


def _get_li_chun_adjusted_year(birth_date: datetime.date, knowledge: Dict[str, Any]) -> Tuple[int, bool]:
    """
    确定八字年份（考虑立春调整）。
    
    八字年柱以立春为界，立春前用上一年。
    """
    jieqi_data = knowledge.get("jieqi", {})
    all_jieqi = jieqi_data.get("all_jieqi", [])
    li_chun = None
    for j in all_jieqi:
        if j.get("name") == "立春":
            li_chun = j
            break
    if li_chun is None:
        # 默认使用 2月4日
        li_chun_day = 4
    else:
        _, li_chun_day = _parse_jieqi_date(li_chun["gongli_start"])
        # adjust: 立春可能跨年 (一般在2月，不跨年)
    
    year = birth_date.year
    adjusted = False
    if birth_date.month == 1 or (birth_date.month == 2 and birth_date.day < li_chun_day):
        year -= 1
        adjusted = True
    return year, adjusted


def _get_year_pillar(year: int) -> Tuple[int, int, str, str]:
    """
    根据年份计算年柱天干地支。
    
    公式: 年干索引 = (year - 4) % 10, 年支索引 = (year - 4) % 12
    """
    stem_idx = (year - 4) % 10
    branch_idx = (year - 4) % 12
    return stem_idx, branch_idx, TIAN_GAN[stem_idx], DI_ZHI[branch_idx]


def _determine_solar_month(birth_date: datetime.date, boundaries: List[Dict[str, Any]]) -> int:
    """
    根据节气边界确定当前的太阳月 (0-based, 寅月=0, 卯月=1, ..., 丑月=11)。
    
    返回 month_order: 0=寅月, 1=卯月, ..., 11=丑月
    """
    m = birth_date.month
    d = birth_date.day

    # 处理跨年情况: 将1月的日期映射为13月
    sort_month = m if m > 1 else m + 12

    # 查找最近的 "节" 气边界
    for i, boundary in enumerate(boundaries):
        bm, bd = _parse_jieqi_date(boundary["gongli_start"])
        if bm == 1:
            bm += 12
        
        if sort_month < bm or (sort_month == bm and d < bd):
            # 当前日期在此节气之前, 取上一个节气
            prev_idx = (i - 1) % len(boundaries)
            return prev_idx  # 0-based 索引对应地支顺序 (寅=0)
    
    # 如果过了最后一个节气, 取最后一个
    return len(boundaries) - 1


def _get_month_pillar(
    year_stem_idx: int, solar_month_order: int
) -> Tuple[int, int, str, str]:
    """
    根据年干和太阳月序号计算月柱。
    
    五虎遁: 年干决定正月(寅月)的天干，然后顺推。
    solar_month_order: 0=寅月, 1=卯月, ..., 11=丑月
    """
    year_stem = TIAN_GAN[year_stem_idx]
    yin_stem_idx = _WU_HU_DUN[year_stem]
    stem_idx = (yin_stem_idx + solar_month_order) % 10
    branch_idx = (solar_month_order + 2) % 12  # 寅=index 2
    return stem_idx, branch_idx, TIAN_GAN[stem_idx], DI_ZHI[branch_idx]


def _get_day_pillar(birth_date: datetime.date) -> Tuple[int, int, str, str]:
    """
    计算日柱天干地支。
    
    参考: 1900-01-01 = 甲子日 (cycle index 0)
    公式: days_from_ref % 60, 天干 = % 10, 地支 = % 12
    """
    delta = birth_date - REFERENCE_DATE
    days = delta.days
    cycle_idx = days % 60
    stem_idx = cycle_idx % 10
    branch_idx = cycle_idx % 12
    return stem_idx, branch_idx, TIAN_GAN[stem_idx], DI_ZHI[branch_idx]


def _get_hour_branch(hour: int, minute: int) -> int:
    """
    根据出生时间获取时辰地支索引。
    
    子时: 23:00-00:59, 丑时: 01:00-02:59, ...
    """
    if hour == 23 or hour == 0:
        return 0  # 子
    return ((hour + 1) // 2) % 12


def _get_hour_pillar(
    day_stem_idx: int, hour_branch_idx: int
) -> Tuple[int, int, str, str]:
    """
    根据日干和时支计算时柱天干。
    
    五鼠遁: 日干决定子时的天干，然后顺推。
    """
    day_stem = TIAN_GAN[day_stem_idx]
    zi_stem_idx = _WU_SHU_DUN[day_stem]
    stem_idx = (zi_stem_idx + hour_branch_idx) % 10
    return stem_idx, hour_branch_idx, TIAN_GAN[stem_idx], DI_ZHI[hour_branch_idx]


def _get_canggan(dizhi: str, knowledge: Dict[str, Any]) -> List[str]:
    """获取地支对应的藏干列表。"""
    dz_data = knowledge.get("tiangandizhi", {}).get("dizhi", {})
    if dizhi in dz_data:
        return dz_data[dizhi].get("canggan", [])
    # fallback to dizhi_canggan.json
    cg_data = knowledge.get("dizhi_canggan", {}).get("dizhi_canggan", {})
    if dizhi in cg_data:
        return cg_data[dizhi].get("list", [])
    return []


def _get_hide_stems_full(dizhi: str, knowledge: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """获取地支藏干详情 (本气、中气、余气)。"""
    cg_data = knowledge.get("dizhi_canggan", {}).get("dizhi_canggan", {})
    if dizhi in cg_data:
        return cg_data[dizhi]
    return None


def _get_wuxing(gan_or_zhi: str, knowledge: Dict[str, Any]) -> str:
    """获取天干或地支的五行属性。"""
    data = knowledge.get("tiangandizhi", {})
    # 先查天干
    tg = data.get("tiangan", {})
    if gan_or_zhi in tg:
        return tg[gan_or_zhi].get("wuxing", "")
    # 再查地支
    dz = data.get("dizhi", {})
    if gan_or_zhi in dz:
        return dz[gan_or_zhi].get("wuxing", "")
    return ""


def _get_nayin(stem_idx: int, branch_idx: int, knowledge: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    """获取六十甲子的纳音和纳音五行。"""
    ganzhi = f"{TIAN_GAN[stem_idx]}{DI_ZHI[branch_idx]}"
    jiazi_data = knowledge.get("liushi_jiazi", {}).get("jiazi", [])
    for item in jiazi_data:
        if item.get("ganzhi") == ganzhi:
            return item.get("nayin"), item.get("wuxing")
    return None, None


def _get_current_jieqi_name(birth_date: datetime.date, knowledge: Dict[str, Any]) -> str:
    """获取当前日期所在的节气名称。"""
    jieqi_data = knowledge.get("jieqi", {})
    all_jieqi = jieqi_data.get("all_jieqi", [])
    
    m = birth_date.month
    d = birth_date.day
    
    for j in all_jieqi:
        start_m, start_d = _parse_jieqi_date(j["gongli_start"])
        end_m, end_d = _parse_jieqi_date(j["gongli_end"])
        
        # 处理跨月范围
        if start_m == end_m:
            if m == start_m and start_d <= d <= end_d:
                return j["name"]
        else:
            # 跨月 (如 12-22 ~ 01-05)
            if (m == start_m and d >= start_d) or (m == end_m and d <= end_d):
                return j["name"]
    
    return ""


def _build_pillar(
    stem_idx: int,
    branch_idx: int,
    knowledge: Dict[str, Any],
) -> Pillar:
    """根据天干地支索引构造一个 Pillar 对象。"""
    stem = TIAN_GAN[stem_idx]
    branch = DI_ZHI[branch_idx]
    ganzhi = f"{stem}{branch}"
    canggan = _get_canggan(branch, knowledge)
    hide_full = _get_hide_stems_full(branch, knowledge)
    nayin, nayin_wx = _get_nayin(stem_idx, branch_idx, knowledge)
    wx_stem = _get_wuxing(stem, knowledge)
    wx_branch = _get_wuxing(branch, knowledge)
    
    return Pillar(
        ganzhi=ganzhi,
        tiangan=stem,
        dizhi=branch,
        canggan=canggan,
        wuxing_tiangan=wx_stem,
        wuxing_dizhi=wx_branch,
        hide_stems_full=hide_full,
        nayin=nayin,
        nayin_wuxing=nayin_wx,
    )


# ---------------------------------------------------------------------------
# 主引擎
# ---------------------------------------------------------------------------

class BaziEngine:
    """八字排盘主引擎。"""

    def __init__(self) -> None:
        self._knowledge: Dict[str, Any] = _init_knowledge()
        self._jieqi_boundaries: List[Dict[str, Any]] = _get_jieqi_boundaries(
            self._knowledge
        )

    def calculate(
        self,
        year: int,
        month: int,
        day: int,
        hour: int = 12,
        minute: int = 0,
        gender: str = "男",
    ) -> BaziResult:
        """
        计算八字排盘。
        
        Args:
            year: 公历出生年份 (四位数)
            month: 公历出生月份 (1-12)
            day: 公历出生日期 (1-31)
            hour: 出生小时 (0-23)
            minute: 出生分钟 (0-59)
            gender: 性别 ("男" 或 "女")
        
        Returns:
            包含四柱八字的 BaziResult 对象
        """
        birth_date = datetime.date(year, month, day)
        
        # ---- 年柱 ----
        bazi_year, li_chun_adjust = _get_li_chun_adjusted_year(
            birth_date, self._knowledge
        )
        ys_idx, yb_idx, ys, yb = _get_year_pillar(bazi_year)
        year_pillar = _build_pillar(ys_idx, yb_idx, self._knowledge)
        
        # ---- 月柱 ----
        solar_month_order = _determine_solar_month(
            birth_date, self._jieqi_boundaries
        )
        ms_idx, mb_idx, ms, mb = _get_month_pillar(ys_idx, solar_month_order)
        month_pillar = _build_pillar(ms_idx, mb_idx, self._knowledge)
        
        # ---- 日柱 ----
        ds_idx, db_idx, ds, db = _get_day_pillar(birth_date)
        day_pillar = _build_pillar(ds_idx, db_idx, self._knowledge)
        
        # ---- 时柱 ----
        hb_idx = _get_hour_branch(hour, minute)
        hs_idx, _, hs, hb = _get_hour_pillar(ds_idx, hb_idx)
        hour_pillar = _build_pillar(hs_idx, hb_idx, self._knowledge)
        
        # ---- 当前节气 ----
        current_jieqi = _get_current_jieqi_name(birth_date, self._knowledge)
        
        return BaziResult(
            birth_date=birth_date,
            birth_hour=hour,
            birth_minute=minute,
            gender=gender,
            year_pillar=year_pillar,
            month_pillar=month_pillar,
            day_pillar=day_pillar,
            hour_pillar=hour_pillar,
            year_stem_index=ys_idx,
            month_stem_index=ms_idx,
            day_stem_index=ds_idx,
            hour_stem_index=hs_idx,
            year_branch_index=yb_idx,
            month_branch_index=mb_idx,
            day_branch_index=db_idx,
            hour_branch_index=hb_idx,
            day_stem=ds,
            day_stem_wuxing=_get_wuxing(ds, self._knowledge),
            current_jieqi=current_jieqi,
            li_chun_adjusted=li_chun_adjust,
            raw_data={
                "bazi_year": bazi_year,
                "solar_month_order": solar_month_order,
            },
        )
    
    def calculate_from_date(
        self,
        birth_date: datetime.date,
        hour: int = 12,
        minute: int = 0,
        gender: str = "男",
    ) -> BaziResult:
        """使用 datetime.date 对象计算八字。"""
        return self.calculate(
            birth_date.year,
            birth_date.month,
            birth_date.day,
            hour,
            minute,
            gender,
        )
