"""
知识库查询 API 路由。

提供结构化数据、古籍语料和映射表的查询接口，
供前端直接浏览知识库内容。
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.knowledge.data_loader import load_all_knowledge, load_corpus_texts, load_mappings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["知识库查询"])

# ---------------------------------------------------------------------------
# 缓存（惰性加载）
# ---------------------------------------------------------------------------

_knowledge_cache: Optional[Dict[str, Any]] = None
_corpus_cache: Optional[Dict[str, str]] = None
_mappings_cache: Optional[Dict[str, Any]] = None


def _get_knowledge() -> Dict[str, Any]:
    global _knowledge_cache
    if _knowledge_cache is None:
        _knowledge_cache = load_all_knowledge()
    return _knowledge_cache


def _get_corpus() -> Dict[str, str]:
    global _corpus_cache
    if _corpus_cache is None:
        _corpus_cache = load_corpus_texts()
    return _corpus_cache


def _get_mappings() -> Dict[str, Any]:
    global _mappings_cache
    if _mappings_cache is None:
        _mappings_cache = load_mappings()
    return _mappings_cache


# ---------------------------------------------------------------------------
# 结构化数据
# ---------------------------------------------------------------------------


@router.get("/structured", summary="列出所有结构化知识表")
def list_structured():
    """返回所有已加载的结构化知识表名称列表。"""
    try:
        data = _get_knowledge()
        tables = sorted(data.keys())
        return {
            "success": True,
            "data": {
                "tables": tables,
                "count": len(tables),
            },
        }
    except Exception as e:
        logger.exception("获取结构化数据列表失败")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/structured/{name}", summary="获取指定结构化数据")
def get_structured(name: str):
    """
    根据表名获取指定的结构化数据内容。
    
    常用表名：
    - tiangandizhi : 天干地支数据
    - liushi_jiazi : 六十甲子（含纳音）
    - jieqi       : 二十四节气
    - shishen_rules : 十神规则
    - shensha_rules : 神煞规则
    - dizhi_canggan : 地支藏干
    - shier_changsheng : 十二长生
    - liushisi_gua : 六十四卦
    """
    try:
        data = _get_knowledge()
        if name not in data:
            raise HTTPException(
                status_code=404,
                detail=f"未找到名为 '{name}' 的结构化数据表。可用表名: {', '.join(sorted(data.keys()))}",
            )
        return {"success": True, "data": {name: data[name]}}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("获取结构化数据失败")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# 古籍语料
# ---------------------------------------------------------------------------


@router.get("/corpus", summary="列出所有可用的古籍语料")
def list_corpus():
    """返回所有已加载的古籍语料文件名称列表。"""
    try:
        data = _get_corpus()
        books = sorted(data.keys())
        return {
            "success": True,
            "data": {
                "books": books,
                "count": len(books),
            },
        }
    except Exception as e:
        logger.exception("获取语料列表失败")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/corpus/{book}", summary="获取指定古籍语料内容")
def get_corpus_book(book: str):
    """
    根据书名获取古籍语料的完整文本内容。
    
    注意：部分古籍篇幅较长，返回的文本可能很大。
    """
    try:
        data = _get_corpus()
        if book not in data:
            raise HTTPException(
                status_code=404,
                detail=f"未找到名为 '{book}' 的古籍语料。可用书名: {', '.join(sorted(data.keys()))}",
            )
        content = data[book]
        # 返回文本预览（前 3000 字符）+ 总长度信息
        preview = content[:3000]
        return {
            "success": True,
            "data": {
                "book": book,
                "total_length": len(content),
                "preview": preview,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("获取古籍语料失败")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# 映射表
# ---------------------------------------------------------------------------


@router.get("/mappings", summary="列出所有映射表")
def list_mappings():
    """返回所有已加载的映射表名称列表（如十神现代角色、健康建议等）。"""
    try:
        data = _get_mappings()
        mapping_names = sorted(data.keys())
        # 仅返回名称和结构概览，不返回完整数据
        overview = {
            name: _get_mapping_overview(value)
            for name, value in data.items()
        }
        return {
            "success": True,
            "data": {
                "mappings": overview,
                "count": len(mapping_names),
            },
        }
    except Exception as e:
        logger.exception("获取映射表列表失败")
        raise HTTPException(status_code=500, detail=str(e))


def _get_mapping_overview(value: Any) -> Dict[str, Any]:
    """获取映射表的概览信息。"""
    if isinstance(value, dict):
        keys = list(value.keys())
        return {
            "type": "dict",
            "keys": keys[:20],  # 限制展示数量
            "key_count": len(keys),
        }
    elif isinstance(value, list):
        return {
            "type": "list",
            "length": len(value),
        }
    else:
        return {
            "type": type(value).__name__,
        }
