"""
综合咨询 API 路由。

提供通用命理咨询端点，可携带八字上下文让 LLM 进行综合分析。
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import CHROMA_PERSIST_DIR
from app.services.rag.retriever import RetrieverService
from app.services.rag.prompt_builder import PromptBuilder
from app.services.rag.llm_client import LLMClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["综合咨询"])

# ---------------------------------------------------------------------------
# 单例服务实例（惰性初始化）
# ---------------------------------------------------------------------------

_retriever: Optional[RetrieverService] = None
_llm_client: Optional[LLMClient] = None


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


class ConsultRequest(BaseModel):
    query: str = Field(..., min_length=1, description="用户咨询问题")
    bazi_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="八字上下文信息（可选），包含四柱等排盘数据",
    )


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------


@router.post("/consult", summary="综合命理咨询")
def consult(req: ConsultRequest):
    """
    结合八字上下文和 RAG 古籍知识进行综合命理咨询。

    如果提供了 bazi_context，LLM 会参考用户的命盘信息进行分析。
    否则仅基于问题和检索到的古籍文献进行回答。
    """
    try:
        # 1. RAG 检索
        retriever = _get_retriever()
        if req.bazi_context:
            rag_sources = retriever.search_with_bazi_context(
                query=req.query,
                bazi_data=req.bazi_context,
                n_results=5,
            )
        else:
            rag_sources = retriever.search(
                query=req.query,
                n_results=5,
            )

        # 2. 构建提示词
        prompt = PromptBuilder.build_consult_prompt(
            query=req.query,
            bazi_context=req.bazi_context,
            rag_sources=rag_sources,
        )

        # 3. 调用 LLM
        llm = _get_llm_client()
        messages = [
            {"role": "system", "content": prompt["system"]},
            {"role": "user", "content": prompt["user"]},
        ]
        answer = llm.call_llm(messages)

        # 4. 格式化 RAG 来源摘要
        sources_summary = [
            {
                "book": s.get("book", "未知"),
                "text_preview": s.get("text", "")[:200],
                "score": s.get("score", 0),
            }
            for s in rag_sources
        ]

        return {
            "success": True,
            "data": {
                "answer": answer,
                "rag_sources": sources_summary,
                "query": req.query,
            },
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("综合咨询失败")
        raise HTTPException(status_code=500, detail=f"综合咨询失败: {str(e)}")
