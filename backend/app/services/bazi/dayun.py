"""
大运流年模块 (Decade Luck & Annual Fortune / 大运流年)

计算起运年龄、十年一大运的干支组合、
以及当前流年对原局的影响分析。
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge.data_loader import load_all_knowledge

from .engine import (
    TIAN_GAN,
    DI_ZHI,
    BaziResult,
    JIA_ZI_CYCLE,
    BaziEngine,
    _get_year_pillar,
    _get_jieqi_boundaries,
    _parse_jieqi_date,
)

# 阳干 (阳年)
YANG_GAN: List[str] = ["甲", "丙", "戊", "庚", "壬"]

# 大运顺逆判断: 阳男阴女顺排, 阴男阳女逆排
# 顺排: 从生日顺数到下一个"节"气
# 逆排: 从生日倒数到上一个"节"气

# 每个时辰(2小时) = 5天, 3天 = 1年大运
# 3天 = 1年, 1天 = 4个月, 1时辰(2小时) = 5天


# ---------------------------------------------------------------------------
# 数据类
# ---------------------------------------------------------------------------

@dataclass
class DaYunPeriod:
    """单个大运时期。"""
    index: int                    # 序号 (0=起运后第一个大运)
    age_start: int                # 开始年龄
    age_end: int                  # 结束年龄
    ganzhi: str                   # 干支组合
    tiangan: str                  # 天干
    dizhi: str                    # 地支
    tiangan_wuxing: str = ""      # 天干五行
    dizhi_wuxing: str = ""        # 地支五行
    is_forward: bool = True       # 是否顺排
    description: str = ""         # 运势简要描述


@dataclass
class LiuNianInfo:
    """流年信息。"""
    year: int                     # 公历年份
    ganzhi: str                   # 干支
    tiangan: str                  # 天干
    dizhi: str                    # 地支
    wuxing_tiangan: str = ""      # 天干五行
    wuxing_dizhi: str = ""        # 地支五行
    nian_gan_shishen: str = ""    # 年干十神 (对日干)
    influence_on_dayun: str = ""  # 对当前大运的影响


@dataclass
class DaYunAnalysis:
    """完整的大运流年分析结果。"""
    # 基本信息
    gender: str                                   # 性别
    is_forward: bool                              # 大运是否顺排
    year_stem: str                                # 年干
    is_yang_year: bool                            # 是否阳年

    # 起运信息
    qi_yun_age: float                             # 起运年龄 (可能含小数)
    qi_yun_age_int: int                           # 起运年龄 (整数岁)
    qi_yun_date: Optional[date] = None            # 起运日期（从出生日期起算）
    days_counted: int = 0                         # 计数天数
    days_description: str = ""                    # 计数说明

    # 大运列表
    da_yun_periods: List[DaYunPeriod] = field(default_factory=list)

    # 当前大运
    current_da_yun: Optional[DaYunPeriod] = None

    # 当前流年
    current_year: int = 0
    current_liu_nian: Optional[LiuNianInfo] = None


# ---------------------------------------------------------------------------
# 大运计算器
# ---------------------------------------------------------------------------

class DaYunCalculator:
    """大运流年计算器。"""

    def __init__(self) -> None:
        self._knowledge: Dict[str, Any] = load_all_knowledge()
        self._jieqi_boundaries: List[Dict[str, Any]] = _get_jieqi_boundaries(
            self._knowledge
        )

    def _get_wuxing(self, gan_or_zhi: str) -> str:
        """获取天干或地支的五行。"""
        data = self._knowledge.get("tiangandizhi", {})
        tg = data.get("tiangan", {})
        if gan_or_zhi in tg:
            return tg[gan_or_zhi].get("wuxing", "")
        dz = data.get("dizhi", {})
        if gan_or_zhi in dz:
            return dz[gan_or_zhi].get("wuxing", "")
        return ""

    def _is_yang_year(self, year_stem: str) -> bool:
        """判断年干是否为阳干。"""
        return year_stem in YANG_GAN

    def _is_forward(self, year_stem: str, gender: str) -> bool:
        """
        判断大运是顺排还是逆排。
        阳男阴女=顺排, 阴男阳女=逆排。
        """
        yang = self._is_yang_year(year_stem)
        if (yang and gender == "男") or (not yang and gender == "女"):
            return True
        return False

    def _find_next_jieqi(
        self, birth_date: date
    ) -> Tuple[date, int, str]:
        """
        从出生日期开始，找下一个"节"气。
        Returns: (jieqi_date, days_until, jieqi_name)
        """
        return self._find_jieqi_direction(birth_date, forward=True)

    def _find_prev_jieqi(
        self, birth_date: date
    ) -> Tuple[date, int, str]:
        """
        从出生日期开始，找上一个"节"气。
        Returns: (jieqi_date, days_since, jieqi_name)
        """
        return self._find_jieqi_direction(birth_date, forward=False)

    def _find_jieqi_direction(
        self, birth_date: date, forward: bool
    ) -> Tuple[date, int, str]:
        """
        向指定方向找最近的"节"气。
        
        Args:
            birth_date: 出生日期
            forward: True=向后找, False=向前找
        
        Returns:
            (节气日期, 相隔天数, 节气名称)
        """
        by = birth_date.year
        bm = birth_date.month
        bd = birth_date.day
        
        # 构建当前年和下一年的所有"节"气日期
        boundary_dates: List[Tuple[date, str]] = []
        
        for jieqi in self._jieqi_boundaries:
            jieqi_name = jieqi.get("name", "")
            start_str = jieqi.get("gongli_start", "")  # "MM-DD"
            
            # 对当前年份生成该节气的日期
            m_str, d_str = start_str.split("-")
            m, d = int(m_str), int(d_str)
            
            try:
                # 处理跨年: 小寒(1月)和大寒(1月)属于前一年的十二月
                if m == 1:
                    # 出生在1月, 小寒可能在当年1月
                    # 对于前一年的12月节气: 小寒和大寒在1月
                    # 先试当前年
                    try:
                        dt = date(year=by, month=m, day=d)
                        boundary_dates.append((dt, jieqi_name))
                    except ValueError:
                        pass
                    # 再试下一年 (因为有些算法需要跨年)
                    try:
                        dt = date(year=by + 1, month=m, day=d)
                        boundary_dates.append((dt, jieqi_name))
                    except ValueError:
                        pass
                else:
                    dt = date(year=by, month=m, day=d)
                    boundary_dates.append((dt, jieqi_name))
                    # 也加入下一年同月的
                    try:
                        dt2 = date(year=by + 1, month=m, day=d)
                        boundary_dates.append((dt2, jieqi_name))
                    except ValueError:
                        pass
            except ValueError:
                continue
        
        # 排序
        boundary_dates.sort(key=lambda x: x[0])
        
        if forward:
            # 找下一个节气
            for dt, name in boundary_dates:
                if dt > birth_date:
                    delta = (dt - birth_date).days
                    return dt, delta, name
        else:
            # 找上一个节气
            found_dt = None
            found_name = ""
            for dt, name in boundary_dates:
                if dt < birth_date:
                    found_dt = dt
                    found_name = name
            if found_dt:
                delta = (birth_date - found_dt).days
                return found_dt, delta, found_name
        
        # fallback
        fallback_delta = 1 if forward else -1
        return birth_date, max(1, abs(fallback_delta)), ""

    def _calculate_qi_yun_age(
        self, birth_date: date, year_stem: str, gender: str
    ) -> Tuple[float, int, str]:
        """
        计算起运年龄。
        
        规则:
        - 顺排: 从生日顺数到下一个"节", 每3天=1年
        - 逆排: 从生日倒数到上一个"节", 每3天=1年
        - 不足3天的: 1天=4个月, 1时辰(2小时)=5天
        
        Returns:
            (起运年龄浮点值, 整数岁, 说明文字)
        """
        forward = self._is_forward(year_stem, gender)
        
        if forward:
            _, days, jieqi_name = self._find_next_jieqi(birth_date)
            direction_desc = f"顺数到下一个节气{jieqi_name}"
        else:
            _, days, jieqi_name = self._find_prev_jieqi(birth_date)
            direction_desc = f"逆数到上一个节气{jieqi_name}"
        
        qi_yun_age = days / 3.0
        qi_yun_int = math.ceil(qi_yun_age)
        
        # 构建说明
        years_part = days // 3
        remaining_days = days % 3
        months_part = remaining_days * 4  # 1天=4个月
        
        desc_parts = [f"{direction_desc}, 共{days}天"]
        if years_part > 0:
            desc_parts.append(f"{years_part}年")
        if months_part > 0:
            desc_parts.append(f"{months_part}个月")
        desc_parts.append(f", 起运年龄: {qi_yun_int}岁")
        
        return qi_yun_age, qi_yun_int, " ".join(desc_parts)

    def _calculate_da_yun(
        self,
        year_stem: str,
        year_branch: str,
        is_forward: bool,
        qi_yun_age: int,
        num_periods: int = 8,
    ) -> List[DaYunPeriod]:
        """
        计算大运各时期的干支。
        
        Args:
            year_stem: 年干
            year_branch: 年支
            is_forward: 是否顺排
            qi_yun_age: 起运年龄
            num_periods: 计算多少个大运 (默认8个, 80年)
        
        Returns:
            大运时期列表
        """
        stem_idx = TIAN_GAN.index(year_stem) if year_stem in TIAN_GAN else 0
        branch_idx = DI_ZHI.index(year_branch) if year_branch in DI_ZHI else 0
        
        # 月柱开始: 大运从月柱起, 顺排或逆排
        # 实际上大运是从出生月柱开始的, 但我们需要获取月柱
        periods: List[DaYunPeriod] = []
        
        for i in range(num_periods):
            if is_forward:
                s_idx = (stem_idx + i) % 10
                b_idx = (branch_idx + i) % 12
            else:
                s_idx = (stem_idx - i) % 10
                b_idx = (branch_idx - i) % 12
            
            age_s = qi_yun_age + i * 10
            age_e = age_s + 10 - 1
            
            s = TIAN_GAN[s_idx]
            b = DI_ZHI[b_idx]
            
            period = DaYunPeriod(
                index=i,
                age_start=age_s,
                age_end=age_e,
                ganzhi=f"{s}{b}",
                tiangan=s,
                dizhi=b,
                tiangan_wuxing=self._get_wuxing(s),
                dizhi_wuxing=self._get_wuxing(b),
                is_forward=is_forward,
            )
            periods.append(period)
        
        return periods

    def _get_current_da_yun(
        self, age: int, periods: List[DaYunPeriod]
    ) -> Optional[DaYunPeriod]:
        """根据当前年龄获取当前所在的大运。"""
        for period in periods:
            if period.age_start <= age <= period.age_end:
                return period
        return None

    def _calculate_liu_nian(
        self,
        year: int,
        day_stem: str,
        current_da_yun: Optional[DaYunPeriod],
    ) -> LiuNianInfo:
        """
        计算指定流年的信息。
        
        Args:
            year: 公历年份
            day_stem: 日干 (用于十神判断)
            current_da_yun: 当前大运 (用于分析大运流年互动)
        
        Returns:
            流年信息
        """
        stem_idx = (year - 4) % 10
        branch_idx = (year - 4) % 12
        stem = TIAN_GAN[stem_idx]
        branch = DI_ZHI[branch_idx]
        
        # 年干对日干的十神关系 (简化版)
        # 使用 day_stem_lookup 表
        shishen_data = self._knowledge.get("shishen_rules", {})
        lookup = shishen_data.get("day_stem_lookup", {})
        day_lookup = lookup.get(day_stem, {})
        nian_gan_shishen = day_lookup.get(stem, "")
        
        # 大运流年互动 (简化)
        influence = ""
        if current_da_yun:
            influence = self._analyze_da_yun_liu_nian_interaction(
                current_da_yun, stem, branch
            )
        
        return LiuNianInfo(
            year=year,
            ganzhi=f"{stem}{branch}",
            tiangan=stem,
            dizhi=branch,
            wuxing_tiangan=self._get_wuxing(stem),
            wuxing_dizhi=self._get_wuxing(branch),
            nian_gan_shishen=nian_gan_shishen,
            influence_on_dayun=influence,
        )

    def _analyze_da_yun_liu_nian_interaction(
        self,
        da_yun: DaYunPeriod,
        liu_nian_stem: str,
        liu_nian_branch: str,
    ) -> str:
        """
        分析大运与流年的互动影响。
        
        考虑: 天干相合、地支冲合刑害
        """
        parts: List[str] = []
        
        # 天干互动: 五合
        he_map = {
            ("甲", "己"): "甲己合化土",
            ("乙", "庚"): "乙庚合化金",
            ("丙", "辛"): "丙辛合化水",
            ("丁", "壬"): "丁壬合化木",
            ("戊", "癸"): "戊癸合化火",
        }
        pair = (da_yun.tiangan, liu_nian_stem)
        pair_rev = (liu_nian_stem, da_yun.tiangan)
        if pair in he_map:
            parts.append(f"天干{he_map[pair]}")
        elif pair_rev in he_map:
            parts.append(f"天干{he_map[pair_rev]}")
        
        # 地支六冲
        chong_map = {
            "子": "午", "丑": "未", "寅": "申", "卯": "酉",
            "辰": "戌", "巳": "亥",
            "午": "子", "未": "丑", "申": "寅", "酉": "卯",
            "戌": "辰", "亥": "巳",
        }
        if chong_map.get(da_yun.dizhi) == liu_nian_branch:
            parts.append(
                f"地支{da_yun.dizhi}{liu_nian_branch}相冲, 变动较大"
            )
        
        # 地支三合
        sanhe_sets = [
            {"申", "子", "辰"},
            {"亥", "卯", "未"},
            {"寅", "午", "戌"},
            {"巳", "酉", "丑"},
        ]
        for sh_set in sanhe_sets:
            if da_yun.dizhi in sh_set and liu_nian_branch in sh_set:
                parts.append(
                    f"地支{da_yun.dizhi}{liu_nian_branch}三合, "
                    f"运势增强"
                )
                break
        
        return "；".join(parts) if parts else "无明显冲合"

    def calculate(
        self,
        bazi: BaziResult,
        current_age: Optional[int] = None,
        current_year: Optional[int] = None,
    ) -> DaYunAnalysis:
        """
        计算大运流年。
        
        Args:
            bazi: 八字排盘结果
            current_age: 当前年龄 (可选, 用于定位当前大运)
            current_year: 当前年份 (可选, 用于计算流年)
        
        Returns:
            大运流年分析结果
        """
        year_stem = bazi.year_pillar.tiangan
        year_branch = bazi.year_pillar.dizhi
        day_stem = bazi.day_stem
        gender = bazi.gender
        
        is_forward = self._is_forward(year_stem, gender)
        is_yang = self._is_yang_year(year_stem)
        
        # 起运年龄
        qi_yun_age_float, qi_yun_age_int, desc = self._calculate_qi_yun_age(
            bazi.birth_date, year_stem, gender
        )
        
        # 大运列表 (从月柱开始, 但这里用年柱作为起始, 实际应用中应使用月柱)
        # 为简化, 以年柱为起点计算, 但实际命理中应从月柱开始
        # 修正: 使用月柱作为大运起始
        month_stem = bazi.month_pillar.tiangan
        month_branch = bazi.month_pillar.dizhi
        
        periods = self._calculate_da_yun(
            month_stem, month_branch, is_forward, qi_yun_age_int
        )
        
        # 当前年龄和流年
        if current_age is None and current_year is None:
            current_year = date.today().year
            age = current_year - bazi.birth_date.year
        elif current_age is not None:
            age = current_age
            current_year = bazi.birth_date.year + age
        else:
            age = current_year - bazi.birth_date.year
        
        current_da_yun = self._get_current_da_yun(age, periods)
        liu_nian = self._calculate_liu_nian(current_year, day_stem, current_da_yun)
        
        return DaYunAnalysis(
            gender=gender,
            is_forward=is_forward,
            year_stem=year_stem,
            is_yang_year=is_yang,
            qi_yun_age=qi_yun_age_float,
            qi_yun_age_int=qi_yun_age_int,
            days_counted=0,
            days_description=desc,
            da_yun_periods=periods,
            current_da_yun=current_da_yun,
            current_year=current_year,
            current_liu_nian=liu_nian,
        )
