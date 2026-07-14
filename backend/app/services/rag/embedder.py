"""
向量化服务 (Embedding Service)

使用 sentence-transformers 将中文文本转为向量嵌入。
默认模型: BAAI/bge-small-zh-v1.5
模型不可用时自动降级为基于哈希的简单向量。
"""

from __future__ import annotations

import hashlib
import logging
import time
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from app.config import PROJECT_ROOT

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

DEFAULT_MODEL_NAME = "BAAI/bge-small-zh-v1.5"
EMBEDDING_DIM = 512  # bge-small-zh-v1.5 输出维度
CACHE_MAXSIZE = 1024

# 本地模型目录：优先于 Hub 下载，避免运行期联网（模型文件由 curl 预下载）
LOCAL_MODEL_DIR = PROJECT_ROOT / "models" / "bge-small-zh-v1.5"

# ---------------------------------------------------------------------------
# 嵌入器
# ---------------------------------------------------------------------------


class EmbeddingService:
    """
    文本向量化服务。

    默认使用 BAAI/bge-small-zh-v1.5 模型。
    GPU 可用时自动使用 GPU，否则使用 CPU。
    模型加载失败时降级为基于哈希的确定性向量。
    """

    def __init__(self, model_name: str = DEFAULT_MODEL_NAME) -> None:
        self._model_name = model_name
        self._model = None
        self._fallback_mode = False
        self._dimension = EMBEDDING_DIM
        self._load_model()

    def _load_model(self) -> None:
        """尝试加载 sentence-transformers 模型。"""
        try:
            from sentence_transformers import SentenceTransformer

            # 优先使用本地模型目录（离线、稳定，无需运行期联网）
            if LOCAL_MODEL_DIR.exists() and (LOCAL_MODEL_DIR / "model.safetensors").exists():
                model_path: str = str(LOCAL_MODEL_DIR)
                logger.info("加载本地 embedding 模型: %s", model_path)
            else:
                model_path = self._model_name
                logger.info("本地模型不存在，尝试从 Hub 加载: %s", model_path)

            start = time.time()
            self._model = SentenceTransformer(
                model_path,
                trust_remote_code=True,
            )
            elapsed = time.time() - start
            dim = self._model.get_sentence_embedding_dimension()
            if dim:
                self._dimension = dim
            logger.info("模型加载完成（耗时 %.2fs），维度: %d", elapsed, self._dimension)
        except Exception as exc:
            logger.warning(
                "无法加载 embedding 模型 '%s': %s。将使用降级方案。",
                self._model_name,
                exc,
            )
            self._fallback_mode = True
            self._dimension = EMBEDDING_DIM

    @lru_cache(maxsize=CACHE_MAXSIZE)
    def _cached_embed(self, text: str) -> Tuple[float, ...]:
        """缓存单个文本的嵌入结果。"""
        if self._fallback_mode or self._model is None:
            vec = self._fallback_embed(text)
        else:
            vec = self._model.encode(text, normalize_embeddings=True)
        return tuple(float(v) for v in vec)

    def _fallback_embed(self, text: str) -> np.ndarray:
        """
        降级方案：基于文本哈希生成确定性向量。
        虽然不是真正的语义嵌入，但保证了服务的可用性。
        """
        vec = np.zeros(self._dimension, dtype=np.float32)
        for i in range(min(32, len(text))):
            h = hashlib.md5(f"{text}:{i}".encode("utf-8")).hexdigest()
            seed = int(h[:8], 16)
            idx = i * (self._dimension // 32) % self._dimension
            vec[idx] = (seed % 20000 - 10000) / 10000.0
        # 归一化
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        批量嵌入文本列表。
        返回: List[embedding_vector]
        """
        if not texts:
            return []

        if self._fallback_mode or self._model is None:
            return [list(self._cached_embed(t)) for t in texts]

        try:
            # 使用模型批量编码（GPU/CPU 均自动处理）
            embeddings = self._model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            return [emb.tolist() for emb in embeddings]
        except Exception as exc:
            logger.error("批量编码失败: %s，回退到逐个编码", exc)
            return [list(self._cached_embed(t)) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        """
        嵌入单个查询文本。
        返回: embedding_vector
        """
        return list(self._cached_embed(query))

    @property
    def dimension(self) -> int:
        """返回嵌入向量的维度。"""
        return self._dimension

    @property
    def is_fallback(self) -> bool:
        """是否处于降级模式（模型未加载）。"""
        return self._fallback_mode
