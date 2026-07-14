"""
八字排盘 API 路由。

提供完整的八字分析（含 LLM 解读）和快速排盘（无 LLM）两个端点。
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import CHROMA_PERSIST_DIR
from app.services.bazi.engine import BaziEngine, BaziResult, Pillar
from app.services.bazi.shishen import ShiShenCalculator, ShiShenAnalysis, ShiShenResult
from app.services.bazi.wuxing import WuXingAnalyzer, WuXingAnalysis, WuXingScore, NaYinInfo, ChangShengInfo, HealthAdvice
from app.services.bazi.shensha import ShenShaLookup, ShenShaAnalysis, ShenShaDetail
from app.services.bazi.dayun import DaYunCalculator, DaYunAnalysis, DaYunPeriod, LiuNianInfo
from app.services.rag.retriever import RetrieverService
from app.services.rag.prompt_builder import PromptBuilder
from app.services.rag.llm_client import LLMClient
from app.knowledge.data_loader import load_all_knowledge

# Load knowledge for yinyang lookup
_knowledge = load_all_knowledge()
_TIANGAN = _knowledge.get("tiangandizhi", {}).get("tiangan", {})
_DIZHI = _knowledge.get("tiangandizhi", {}).get("dizhi", {})

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bazi", tags=["八字排盘"])

# ---------------------------------------------------------------------------
# 单例服务实例（惰性初始化）
# ---------------------------------------------------------------------------

_bazi_engine: Optional[BaziEngine] = None
_shishen_calc: Optional[ShiShenCalculator] = None
_wuxing_analyzer: Optional[WuXingAnalyzer] = None
_shensha_lookup: Optional[ShenShaLookup] = None
_dayun_calc: Optional[DaYunCalculator] = None
_retriever: Optional[RetrieverService] = None
_llm_client: Optional[LLMClient] = None


def _get_bazi_engine() -> BaziEngine:
    global _bazi_engine
    if _bazi_engine is None:
        _bazi_engine = BaziEngine()
    return _bazi_engine


def _get_shishen_calc() -> ShiShenCalculator:
    global _shishen_calc
    if _shishen_calc is None:
        _shishen_calc = ShiShenCalculator()
    return _shishen_calc


def _get_wuxing_analyzer() -> WuXingAnalyzer:
    global _wuxing_analyzer
    if _wuxing_analyzer is None:
        _wuxing_analyzer = WuXingAnalyzer()
    return _wuxing_analyzer


def _get_shensha_lookup() -> ShenShaLookup:
    global _shensha_lookup
    if _shensha_lookup is None:
        _shensha_lookup = ShenShaLookup()
    return _shensha_lookup


def _get_dayun_calc() -> DaYunCalculator:
    global _dayun_calc
    if _dayun_calc is None:
        _dayun_calc = DaYunCalculator()
    return _dayun_calc


def _get_retriever() -> RetrieverService:
    global _retriever
    if _retriever is None:
        _retriever = RetrieverService(persist_dir=CHROMA_PERSIST_DIR)
        _retriever.initialize_vectorstore()
    return _retriever


def _get_llm_client() -> LLMClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client


# ---------------------------------------------------------------------------
# Pydantic 请求模型
# ---------------------------------------------------------------------------


class BaziRequest(BaseModel):
    birth_year: int = Field(..., ge=1900, le=2100, description="公历出生年份")
    birth_month: int = Field(..., ge=1, le=12, description="公历出生月份")
    birth_day: int = Field(..., ge=1, le=31, description="公历出生日期")
    birth_hour: int = Field(default=12, ge=0, le=23, description="出生小时 (0-23)")
    birth_minute: int = Field(default=0, ge=0, le=59, description="出生分钟 (0-59)")
    gender: str = Field(default="male", description="性别: male 或 female")
    calendar_type: str = Field(default="solar", description="历法类型: solar(公历) 或 lunar(农历)")
    question: Optional[str] = Field(default=None, description="用户咨询的问题")


class BasicBaziRequest(BaseModel):
    birth_year: int = Field(..., ge=1900, le=2100, description="公历出生年份")
    birth_month: int = Field(..., ge=1, le=12, description="公历出生月份")
    birth_day: int = Field(..., ge=1, le=31, description="公历出生日期")
    birth_hour: int = Field(default=12, ge=0, le=23, description="出生小时 (0-23)")
    birth_minute: int = Field(default=0, ge=0, le=59, description="出生分钟 (0-59)")
    gender: str = Field(default="male", description="性别: male 或 female")


# ---------------------------------------------------------------------------
# 序列化辅助函数
# ---------------------------------------------------------------------------


def _gender_to_cn(gender: str) -> str:
    return "男" if gender == "male" else "女"


def _wuxing_summary_to_str(summary) -> str:
    """将五行状态摘要（可能为 dict 或 str）转为可读字符串"""
    if isinstance(summary, dict):
        return "、".join(f"{wx}{state}" for wx, state in summary.items())
    return str(summary) if summary else ""


def _pillar_to_frontend(pillar: Pillar, pillar_name: str = "") -> Dict[str, Any]:
    """将后端 Pillar 对象转为前端期望的格式"""
    tiangan_info = _TIANGAN.get(pillar.tiangan, {})
    dizhi_info = _DIZHI.get(pillar.dizhi, {})
    return {
        "heavenly_stem": pillar.tiangan,
        "earthly_branch": pillar.dizhi,
        "stem_wuxing": pillar.wuxing_tiangan,
        "branch_wuxing": pillar.wuxing_dizhi,
        "stem_yinyang": tiangan_info.get("yinyang", ""),
        "branch_yinyang": dizhi_info.get("yinyang", ""),
        "canggan": pillar.canggan if pillar.canggan else [],
        "nayin": pillar.nayin or "",
    }


def _bazi_to_frontend_response(
    bazi: BaziResult,
    shishen: ShiShenAnalysis,
    wuxing: WuXingAnalysis,
    shensha: ShenShaAnalysis,
    dayun: DaYunAnalysis,
    llm_interpretation: str = "",
    rag_sources: list = None,
) -> Dict[str, Any]:
    """将后端所有分析结果组合成前端 BaziAnalyzeResponse 的格式"""

    # 1. 四柱八字
    bazi_frontend = {
        "year_pillar": _pillar_to_frontend(bazi.year_pillar, "年"),
        "month_pillar": _pillar_to_frontend(bazi.month_pillar, "月"),
        "day_pillar": _pillar_to_frontend(bazi.day_pillar, "日"),
        "hour_pillar": _pillar_to_frontend(bazi.hour_pillar, "时"),
    }

    # 2. 十神 → 前端 ShiShenItem[] 格式
    shishen_list = []
    for s in shishen.stem_analysis:
        shishen_list.append({
            "gan": s.tiangan,
            "shishen": s.shishen,
            "modern_roles": s.modern_roles or [],
        })
    bazi_frontend["shishen"] = shishen_list

    # 3. 五行 → 前端 WuXingAnalysis 格式
    scores = wuxing.scores if hasattr(wuxing, 'scores') and wuxing.scores else {}
    wuxing_frontend = {
        "wood": scores.get("木", type('o', (), {'score': 0})()).score if hasattr(scores.get("木", None), 'score') else 0,
        "fire": scores.get("火", type('o', (), {'score': 0})()).score if hasattr(scores.get("火", None), 'score') else 0,
        "earth": scores.get("土", type('o', (), {'score': 0})()).score if hasattr(scores.get("土", None), 'score') else 0,
        "metal": scores.get("金", type('o', (), {'score': 0})()).score if hasattr(scores.get("金", None), 'score') else 0,
        "water": scores.get("水", type('o', (), {'score': 0})()).score if hasattr(scores.get("水", None), 'score') else 0,
        "summary": _wuxing_summary_to_str(getattr(wuxing, 'status_summary', '')),
        "health_advice": [
            {
                "body_parts": getattr(h, 'body_parts', []),
                "color_advice": getattr(h, 'color_advice', ''),
                "direction": getattr(h, 'direction', ''),
                "description": getattr(h, 'description', ''),
            }
            for h in (getattr(wuxing, 'health_advice', []) or [])
        ],
    }
    # If wuxing has scores dict with .score attr, try to extract numeric scores
    for wx_key, eng_key in [("木", "wood"), ("火", "fire"), ("土", "earth"), ("金", "metal"), ("水", "water")]:
        score_obj = scores.get(wx_key)
        if score_obj is not None and hasattr(score_obj, 'score'):
            wuxing_frontend[eng_key] = score_obj.score

    bazi_frontend["wuxing"] = wuxing_frontend

    # 4. 神煞 → 前端 ShenSha[] 格式
    shensha_list = []
    seen_names = set()
    for d in (getattr(shensha, 'auspicious', []) or []) + (getattr(shensha, 'inauspicious', []) or []):
        if d.name not in seen_names:
            seen_names.add(d.name)
            shensha_list.append({
                "name": d.name,
                "tags": d.tags or [],
                "description": d.modern_description or d.description or "",
                "position": "",
            })
    # Also try by_pillar
    if not shensha_list:
        for branch, details in (getattr(shensha, 'by_branch', {}) or {}).items():
            for d in details:
                if d.name not in seen_names:
                    seen_names.add(d.name)
                    shensha_list.append({
                        "name": d.name,
                        "tags": getattr(d, 'tags', []) or [],
                        "description": getattr(d, 'modern_description', '') or getattr(d, 'description', '') or "",
                        "position": branch,
                    })
    bazi_frontend["shensha"] = shensha_list

    # 5. 大运 → 前端 DaYunPeriod[] 格式
    periods = getattr(dayun, 'da_yun_periods', None) or []
    bazi_frontend["dayun"] = []
    for p in periods:
        # Get shishen for this period from the day stem
        bazi_frontend["dayun"].append({
            "age_start": p.age_start,
            "age_end": p.age_end,
            "gan": p.tiangan,
            "zhi": p.dizhi,
            "shishen": getattr(p, 'shishen', '') or getattr(p, 'description', '').split('，')[0] if getattr(p, 'description', None) else '',
        })

    # 6. 组合最终响应
    response = {
        "bazi": bazi_frontend,
        "llm_interpretation": llm_interpretation,
        "rag_sources": rag_sources or [],
    }
    return response


def _build_bazi_prompt_context(
    bazi: BaziResult,
    shishen: ShiShenAnalysis,
    wuxing: WuXingAnalysis,
    shensha: ShenShaAnalysis,
    dayun: DaYunAnalysis,
) -> Dict[str, Any]:
    """
    构造供 PromptBuilder 使用的「后端格式」八字上下文。

    之前错误地传入了前端格式字典（heavenly_stem/stem_wuxing 等），
    而 PromptBuilder._format_bazi_data 期望的是后端字段
    （four_pillars/tiangan/wuxing_tiangan/shishen_analysis/wuxing_analysis...），
    导致 LLM 收到的八字信息几乎是空的，解读自然单薄。
    本函数生成与 PromptBuilder 完全匹配的结构化上下文。
    """
    pillar_names = ["年柱", "月柱", "日柱", "时柱"]

    # 1. 四柱
    four_pillars = []
    for p in bazi.four_pillars:
        four_pillars.append({
            "ganzhi": p.ganzhi,
            "tiangan": p.tiangan,
            "dizhi": p.dizhi,
            "wuxing_tiangan": p.wuxing_tiangan,
            "wuxing_dizhi": p.wuxing_dizhi,
            "canggan": p.canggan or [],
        })

    # 2. 十神（天干十神为主，附带藏干十神统计）
    shishen_analysis: Dict[str, Any] = {}
    for s in shishen.stem_analysis:
        if not s.shishen:
            continue
        detail = s.meaning or ""
        if s.modern_roles:
            detail += f"（现代映射：{'、'.join(s.modern_roles)}）"
        shishen_analysis[s.shishen] = {
            "detail": detail,
            "tiangan": s.tiangan,
            "relationship": s.relationship,
        }
    # 藏干十神（补充地支内蕴含的十神）
    hidden_summary: Dict[str, List[str]] = {}
    for branch, results in shishen.branch_hidden_analysis.items():
        for r in results:
            if r.shishen:
                hidden_summary.setdefault(branch, []).append(f"{r.tiangan}({r.shishen})")

    # 3. 五行
    elements = {wx: round(sc.score, 2) for wx, sc in wuxing.scores.items()}
    strength_parts = [f"{wx}{st}" for wx, st in wuxing.status_summary.items()]
    strength_analysis = "、".join(strength_parts)
    if wuxing.strongest:
        strength_analysis += f"；最旺: {wuxing.strongest}"
    if wuxing.weakest:
        strength_analysis += f"；最弱: {wuxing.weakest}"
    if wuxing.day_stem_status:
        strength_analysis += f"；日主({bazi.day_stem})强弱: {wuxing.day_stem_status}"
    if wuxing.generates:
        strength_analysis += (
            f"；日主所生({('、'.join(wuxing.generates))})，生日主者({('、'.join(wuxing.generated_by))})，"
            f"日主所克({('、'.join(wuxing.controls))})，克日主者({('、'.join(wuxing.controlled_by))})"
        )
    wuxing_analysis = {
        "elements": elements,
        "strength_analysis": strength_analysis,
        "day_stem_wuxing": wuxing.day_stem_wuxing,
    }

    # 4. 神煞
    shensha_list = []
    seen = set()
    for d in (shensha.auspicious or []) + (shensha.inauspicious or []):
        if d.name in seen:
            continue
        seen.add(d.name)
        shensha_list.append({
            "name": d.name,
            "type": "吉神" if d.is_auspicious else "凶神",
            "description": d.modern_description or d.description or "",
            "position": "、".join(d.found_in_branches_index) if d.found_in_branches_index else "",
        })
    if shensha.kong_wang:
        shensha_list.append({
            "name": "空亡",
            "type": "中性",
            "description": f"空亡地支: {'、'.join(shensha.kong_wang)}，位于: {'、'.join(shensha.kong_wang_pillars)}",
            "position": "、".join(shensha.kong_wang_pillars),
        })
    shensha_analysis = {"shensha_list": shensha_list}

    # 5. 大运
    current_dayun = ""
    current_age = ""
    if dayun.current_da_yun:
        cd = dayun.current_da_yun
        current_dayun = cd.ganzhi
        current_age = f"{cd.age_start}-{cd.age_end}岁"
    dayun_periods = [
        {"ganzhi": p.ganzhi, "age": f"{p.age_start}-{p.age_end}岁"}
        for p in (dayun.da_yun_periods or [])
    ]
    dayun_analysis = {
        "current_dayun": current_dayun,
        "current_age": current_age,
        "qi_yun_age": dayun.qi_yun_age_int,
        "periods": dayun_periods,
    }

    # 6. 纳音 & 十二长生
    nayin_info = {k: v.nayin for k, v in (wuxing.nayin_info or {}).items()}
    chang_sheng = {}
    for tg, states in (wuxing.chang_sheng or {}).items():
        chang_sheng[tg] = [f"{c.dizhi}宫{c.state}" for c in states]

    return {
        "four_pillars": four_pillars,
        "pillar_names": pillar_names,
        "day_stem": bazi.day_stem,
        "day_stem_wuxing": bazi.day_stem_wuxing,
        "shishen_analysis": shishen_analysis,
        "shishen_hidden": hidden_summary,
        "wuxing_analysis": wuxing_analysis,
        "shensha_analysis": shensha_analysis,
        "dayun_analysis": dayun_analysis,
        "nayin_info": nayin_info,
        "chang_sheng": chang_sheng,
        "gender": bazi.gender,
        "current_jieqi": bazi.current_jieqi or "",
    }


def _shishen_to_dict(analysis: ShiShenAnalysis) -> Dict[str, Any]:
    return {
        "day_stem": analysis.day_stem,
        "day_stem_wuxing": analysis.day_stem_wuxing,
        "stem_analysis": [
            {
                "tiangan": s.tiangan,
                "shishen": s.shishen,
                "relationship": s.relationship,
                "same_yinyang": s.same_yinyang,
                "meaning": s.meaning,
                "modern_roles": s.modern_roles,
            }
            for s in analysis.stem_analysis
        ],
        "branch_hidden_analysis": {
            branch: [
                {
                    "tiangan": s.tiangan,
                    "shishen": s.shishen,
                    "relationship": s.relationship,
                    "same_yinyang": s.same_yinyang,
                    "meaning": s.meaning,
                    "modern_roles": s.modern_roles,
                }
                for s in results
            ]
            for branch, results in analysis.branch_hidden_analysis.items()
        },
        "shishen_count": analysis.shishen_count,
        "relationship_count": analysis.relationship_count,
    }


def _wuxing_to_dict(analysis: WuXingAnalysis) -> Dict[str, Any]:
    return {
        "scores": {
            wx: {
                "wuxing": s.wuxing,
                "score": s.score,
                "stem_count": s.stem_count,
                "hidden_count": s.hidden_count,
                "sources": s.sources,
                "status": s.status,
            }
            for wx, s in analysis.scores.items()
        },
        "status_summary": analysis.status_summary,
        "day_stem_wuxing": analysis.day_stem_wuxing,
        "day_stem_status": analysis.day_stem_status,
        "nayin_info": {
            pillar: {
                "ganzhi": n.ganzhi,
                "nayin": n.nayin,
                "wuxing": n.wuxing,
            }
            for pillar, n in analysis.nayin_info.items()
        },
        "chang_sheng": {
            stem: [
                {
                    "tiangan": c.tiangan,
                    "dizhi": c.dizhi,
                    "state": c.state,
                    "state_index": c.state_index,
                    "description": c.description,
                }
                for c in states
            ]
            for stem, states in analysis.chang_sheng.items()
        },
        "health_advice": [
            {
                "wuxing": h.wuxing,
                "state": h.state,
                "body_parts": h.body_parts,
                "color_advice": h.color_advice,
                "direction": h.direction,
                "description": h.description,
            }
            for h in analysis.health_advice
        ],
        "generates": analysis.generates,
        "controls": analysis.controls,
        "generated_by": analysis.generated_by,
        "controlled_by": analysis.controlled_by,
        "strongest": analysis.strongest,
        "weakest": analysis.weakest,
    }


def _shensha_to_dict(analysis: ShenShaAnalysis) -> Dict[str, Any]:
    return {
        "by_branch": {
            branch: [
                {
                    "name": d.name,
                    "description": d.description,
                    "found_in_branches": d.found_in_branches,
                    "found_in_branches_index": d.found_in_branches_index,
                    "is_auspicious": d.is_auspicious,
                    "tags": d.tags,
                    "modern_description": d.modern_description,
                }
                for d in details
            ]
            for branch, details in analysis.by_branch.items()
        },
        "by_pillar": {
            pillar: [
                {
                    "name": d.name,
                    "description": d.description,
                    "found_in_branches": d.found_in_branches,
                    "found_in_branches_index": d.found_in_branches_index,
                    "is_auspicious": d.is_auspicious,
                    "tags": d.tags,
                    "modern_description": d.modern_description,
                }
                for d in details
            ]
            for pillar, details in analysis.by_pillar.items()
        },
        "auspicious": [
            {
                "name": d.name,
                "description": d.description,
                "found_in_branches": d.found_in_branches,
                "found_in_branches_index": d.found_in_branches_index,
                "tags": d.tags,
            }
            for d in analysis.auspicious
        ],
        "inauspicious": [
            {
                "name": d.name,
                "description": d.description,
                "found_in_branches": d.found_in_branches,
                "found_in_branches_index": d.found_in_branches_index,
                "tags": d.tags,
            }
            for d in analysis.inauspicious
        ],
        "kong_wang": analysis.kong_wang,
        "kong_wang_pillars": analysis.kong_wang_pillars,
    }


def _dayun_to_dict(analysis: DaYunAnalysis) -> Dict[str, Any]:
    return {
        "gender": analysis.gender,
        "is_forward": analysis.is_forward,
        "year_stem": analysis.year_stem,
        "is_yang_year": analysis.is_yang_year,
        "qi_yun_age": analysis.qi_yun_age,
        "qi_yun_age_int": analysis.qi_yun_age_int,
        "qi_yun_date": analysis.qi_yun_date.isoformat() if analysis.qi_yun_date else None,
        "days_description": analysis.days_description,
        "da_yun_periods": [
            {
                "index": p.index,
                "age_start": p.age_start,
                "age_end": p.age_end,
                "ganzhi": p.ganzhi,
                "tiangan": p.tiangan,
                "dizhi": p.dizhi,
                "tiangan_wuxing": p.tiangan_wuxing,
                "dizhi_wuxing": p.dizhi_wuxing,
                "is_forward": p.is_forward,
                "description": p.description,
            }
            for p in analysis.da_yun_periods
        ],
        "current_da_yun": (
            {
                "index": analysis.current_da_yun.index,
                "age_start": analysis.current_da_yun.age_start,
                "age_end": analysis.current_da_yun.age_end,
                "ganzhi": analysis.current_da_yun.ganzhi,
                "tiangan": analysis.current_da_yun.tiangan,
                "dizhi": analysis.current_da_yun.dizhi,
                "tiangan_wuxing": analysis.current_da_yun.tiangan_wuxing,
                "dizhi_wuxing": analysis.current_da_yun.dizhi_wuxing,
                "description": analysis.current_da_yun.description,
            }
            if analysis.current_da_yun
            else None
        ),
        "current_year": analysis.current_year,
        "current_liu_nian": (
            {
                "year": analysis.current_liu_nian.year,
                "ganzhi": analysis.current_liu_nian.ganzhi,
                "tiangan": analysis.current_liu_nian.tiangan,
                "dizhi": analysis.current_liu_nian.dizhi,
                "wuxing_tiangan": analysis.current_liu_nian.wuxing_tiangan,
                "wuxing_dizhi": analysis.current_liu_nian.wuxing_dizhi,
                "nian_gan_shishen": analysis.current_liu_nian.nian_gan_shishen,
                "influence_on_dayun": analysis.current_liu_nian.influence_on_dayun,
            }
            if analysis.current_liu_nian
            else None
        ),
    }


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------


@router.post("/analyze", summary="完整八字分析")
def analyze_bazi(req: BaziRequest):
    """
    进行完整的八字排盘、十神、五行、神煞、大运分析，
    并通过 RAG 检索古籍文献结合 LLM 提供 AI 解读。
    """
    try:
        # 1. 八字排盘
        engine = _get_bazi_engine()
        gender_cn = _gender_to_cn(req.gender)
        bazi = engine.calculate(
            year=req.birth_year,
            month=req.birth_month,
            day=req.birth_day,
            hour=req.birth_hour,
            minute=req.birth_minute,
            gender=gender_cn,
        )

        # 2. 十神分析
        shishen_calc = _get_shishen_calc()
        shishen = shishen_calc.analyze_pillar(bazi)

        # 3. 五行分析
        wuxing_analyzer = _get_wuxing_analyzer()
        wuxing = wuxing_analyzer.analyze(bazi)

        # 4. 神煞查询
        shensha_lookup = _get_shensha_lookup()
        shensha = shensha_lookup.lookup(bazi)

        # 5. 大运流年
        dayun_calc = _get_dayun_calc()
        dayun = dayun_calc.calculate(bazi)

        # 6. RAG 检索
        rag_query = req.question or f"{bazi.day_stem}日主{bazi.day_stem_wuxing}命理分析"
        retriever = _get_retriever()
        rag_sources = retriever.search_with_bazi_context(
            query=rag_query,
            bazi_data={"day_stem": bazi.day_stem, "day_stem_wuxing": bazi.day_stem_wuxing},
            n_results=5,
        )

        # 7. LLM 解读（使用后端格式上下文，确保 LLM 拿到完整八字信息）
        bazi_dict_for_prompt = _build_bazi_prompt_context(bazi, shishen, wuxing, shensha, dayun)
        prompt = PromptBuilder.build_bazi_prompt(bazi_result=bazi_dict_for_prompt, rag_sources=rag_sources)
        llm = _get_llm_client()
        messages = [
            {"role": "system", "content": prompt["system"]},
            {"role": "user", "content": prompt["user"]},
        ]
        llm_interpretation = llm.call_llm(messages)

        # 8. 组合前端格式响应
        response = _bazi_to_frontend_response(
            bazi, shishen, wuxing, shensha, dayun,
            llm_interpretation=llm_interpretation,
            rag_sources=rag_sources,
        )
        return {"success": True, "data": response}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("八字分析失败")
        raise HTTPException(status_code=500, detail=f"八字分析失败: {str(e)}")


@router.post("/basic", summary="快速八字排盘（无 LLM）")
def basic_bazi(req: BasicBaziRequest):
    """
    轻量级八字排盘，仅返回四柱、十神，不调用 LLM。
    """
    try:
        # 1. 八字排盘
        engine = _get_bazi_engine()
        gender_cn = _gender_to_cn(req.gender)
        bazi = engine.calculate(
            year=req.birth_year,
            month=req.birth_month,
            day=req.birth_day,
            hour=req.birth_hour,
            minute=req.birth_minute,
            gender=gender_cn,
        )

        # 2. 十神分析（仅天干）
        shishen_calc = _get_shishen_calc()
        shishen = shishen_calc.analyze_pillar(bazi)

        # 3. 五行
        wuxing_analyzer = _get_wuxing_analyzer()
        wuxing = wuxing_analyzer.analyze(bazi)

        # 4. 神煞
        shensha_lookup = _get_shensha_lookup()
        shensha = shensha_lookup.lookup(bazi)

        # 5. 大运
        dayun_calc = _get_dayun_calc()
        dayun = dayun_calc.calculate(bazi)

        response = _bazi_to_frontend_response(bazi, shishen, wuxing, shensha, dayun)
        return {"success": True, "data": response}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("快速排盘失败")
        raise HTTPException(status_code=500, detail=f"快速排盘失败: {str(e)}")
