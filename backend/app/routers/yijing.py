"""
易经占卜 API 路由。

提供起卦解卦（含 LLM 解读）和按卦序查询卦象详情两个端点。
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import CHROMA_PERSIST_DIR
from app.services.yijing.engine import YijingEngine
from app.services.rag.retriever import RetrieverService
from app.services.rag.prompt_builder import PromptBuilder
from app.services.rag.llm_client import LLMClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/yijing", tags=["易经占卜"])

# ---------------------------------------------------------------------------
# 单例服务实例（惰性初始化）
# ---------------------------------------------------------------------------

_yijing_engine: Optional[YijingEngine] = None
_retriever: Optional[RetrieverService] = None
_llm_client: Optional[LLMClient] = None


def _get_yijing_engine() -> YijingEngine:
    global _yijing_engine
    if _yijing_engine is None:
        _yijing_engine = YijingEngine()
    return _yijing_engine


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
# Pydantic 请求 / 响应模型
# ---------------------------------------------------------------------------


class DivinateRequest(BaseModel):
    question: str = Field(..., min_length=1, description="占卜问题")
    method: str = Field(default="coins", description="起卦方法: coins(铜钱投掷) / numbers(数字) / random(随机)")
    num1: Optional[int] = Field(default=None, ge=1, description="数字起卦-第一个数字（定上卦）")
    num2: Optional[int] = Field(default=None, ge=1, description="数字起卦-第二个数字（定下卦）")
    num3: Optional[int] = Field(default=None, ge=1, description="数字起卦-第三个数字（定动爻）")
    yao_values: Optional[List[int]] = Field(
        default=None,
        description="铜钱投掷法：前端投掷三枚铜钱生成的 6 个爻值 [初,二,三,四,五,上]，范围 6|7|8|9",
    )


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------


@router.post("/divinate", summary="起卦解卦")
def divinate(req: DivinateRequest):
    """
    根据用户问题起卦解卦，返回本卦、变卦、错卦、综卦等完整信息，
    并通过 RAG 检索古籍文献结合 LLM 提供 AI 解读。
    """
    try:
        # 1. 起卦
        engine = _get_yijing_engine()

        numbers: Optional[List[int]] = None
        if req.method == "numbers":
            if req.num1 is None or req.num2 is None or req.num3 is None:
                raise ValueError(
                    "数字起卦需要提供 num1、num2、num3 三个数字"
                )
            numbers = [req.num1, req.num2, req.num3]

        gua_result = engine.divinate_full(
            question=req.question,
            method=req.method,
            numbers=numbers,
            yao_values=req.yao_values,
        )

        # 2. RAG 检索
        retriever = _get_retriever()
        primary_name = gua_result.get("primary_gua", {}).get("name", "")
        rag_query = f"《周易》{primary_name}卦 {req.question}"
        rag_sources = retriever.search(
            query=rag_query,
            n_results=5,
        )
        gua_result["rag_sources"] = rag_sources

        # 3. LLM 解读
        prompt = PromptBuilder.build_yijing_prompt(
            gua_result=gua_result,
            rag_sources=rag_sources,
        )
        llm = _get_llm_client()
        messages = [
            {"role": "system", "content": prompt["system"]},
            {"role": "user", "content": prompt["user"]},
        ]
        llm_interpretation = llm.call_llm(messages)
        gua_result["llm_interpretation"] = llm_interpretation

        # 统一返回结构，与前端 DivinateResponse 契约对齐：
        # data.gua 包装完整卦象，llm_interpretation / rag_sources 置于顶层
        _llm = gua_result.pop("llm_interpretation", None)
        _rag = gua_result.pop("rag_sources", [])
        return {
            "success": True,
            "data": {
                "gua": gua_result,
                "llm_interpretation": _llm,
                "rag_sources": _rag,
            },
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("起卦解卦失败")
        raise HTTPException(status_code=500, detail=f"起卦解卦失败: {str(e)}")


@router.get("/hexagram/{sequence}", summary="按卦序查询卦象详情")
def get_hexagram(sequence: int):
    """
    根据卦序号（1-64）获取卦象详细信息，包括卦名、上下卦、卦象描述、卦辞等。
    """
    if sequence < 1 or sequence > 64:
        raise HTTPException(status_code=400, detail="卦序号必须在 1-64 之间")

    try:
        engine = _get_yijing_engine()
        details = engine.get_hexagram_details(xuhao=sequence)

        if details is None:
            raise HTTPException(
                status_code=404,
                detail=f"未找到第 {sequence} 卦的信息",
            )

        return {"success": True, "data": details}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("获取卦象详情失败")
        raise HTTPException(status_code=500, detail=f"获取卦象详情失败: {str(e)}")
