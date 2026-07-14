"""
RAG 检索器 (Retriever Service)

纯 numpy 实现的向量检索，避免 chromadb/onnxruntime 与 torch 在同一进程内
因重复链接 OpenMP/MKL 造成的段错误 (Segmentation fault)。

初始化时一次性将 knowledge/corpus/ 下所有古籍语料用 BGE 中文模型向量化，
存入内存 numpy 矩阵；检索时对 query 向量做点积（余弦相似度）取 top-k。
若嵌入模型不可用，则自动降级为中文友好的关键字检索（仍返回古籍片段）。
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.config import PROJECT_ROOT
from app.services.rag.embedder import EmbeddingService

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

CORPUS_BASE = PROJECT_ROOT / "app" / "knowledge" / "corpus"
CHUNK_MIN_CHARS = 50  # 最小分块字符数

# 语料子目录名 -> 古籍典标题（用于前端与提示词展示）
BOOK_TITLE_MAP = {
    "yuanhai_ziping": "渊海子平",
    "sanming_tonghui": "三命通会",
    "ditian_sui": "滴天髓",
    "qiongton_baojian": "穷通宝鉴",
    "yijing": "周易",
    "meihua_yishu": "梅花易数",
    "xieji_bianfang": "协纪辨方",
}


def pretty_book(name: str) -> str:
    """将语料目录名转换为可读的古籍标题。"""
    return BOOK_TITLE_MAP.get(name, name)


# ---------------------------------------------------------------------------
# 检索器
# ---------------------------------------------------------------------------


class RetrieverService:
    """
    基于 numpy 的语义检索器。

    初始化时自动扫描知识库语料并建立内存向量索引（仅一次）。
    嵌入模型不可用时降级为中文关键字检索，RAG 仍可用。
    """

    def __init__(
        self,
        persist_dir: str = "",
        collection_name: str = "yijing_corpus",
    ) -> None:
        # 保留参数以兼容调用方（persist_dir 不再使用）
        self._collection_name = collection_name
        self._embedder = EmbeddingService()
        self._initialized = False
        # 嵌入模式：real=真实语义向量；hash=降级哈希向量（应退回关键字检索）
        self._embedding_mode = "hash" if self._embedder.is_fallback else "real"
        self._use_keyword_fallback = self._embedder.is_fallback
        # 内存向量索引
        self._matrix: Optional[np.ndarray] = None  # shape: (N, dim)
        self._texts: List[str] = []
        self._metas: List[Dict[str, str]] = []

    # ------------------------------------------------------------------
    # 初始化
    # ------------------------------------------------------------------

    def initialize_vectorstore(self) -> bool:
        """
        建立或加载内存向量索引。

        真实模式：扫描语料 -> 分块 -> BGE 向量化 -> 存入 numpy 矩阵。
        降级模式：不向量化，检索时走中文关键字匹配。
        返回 True 表示初始化成功（无论哪种模式）。
        """
        if self._initialized:
            return True

        try:
            if self._use_keyword_fallback:
                logger.warning(
                    "嵌入模型不可用，RAG 将使用中文关键字匹配检索古籍语料。"
                )
                self._initialized = True
                return True

            chunks = self._scan_and_chunk_corpus()
            if not chunks:
                logger.warning("语料目录为空，未建立向量索引")
                self._initialized = True
                return True

            texts = [c["text"] for c in chunks]
            metas = [
                {"book": pretty_book(c["book"]), "source_file": c["source_file"]}
                for c in chunks
            ]

            logger.info("正在对 %d 个语料块进行中文向量化...", len(chunks))
            embs = self._embedder.embed_texts(texts)
            self._matrix = np.asarray(embs, dtype=np.float32)
            self._texts = texts
            self._metas = metas
            logger.info(
                "向量索引建立完成：%d 块，维度 %d（模式: %s）",
                self._matrix.shape[0],
                self._matrix.shape[1],
                self._embedding_mode,
            )
            self._initialized = True
            return True

        except Exception as exc:
            logger.error("初始化向量检索失败: %s，回退关键字检索", exc)
            self._use_keyword_fallback = True
            self._initialized = True
            return True

    # ------------------------------------------------------------------
    # 语料扫描与分块
    # ------------------------------------------------------------------

    def _scan_and_chunk_corpus(self) -> List[Dict[str, Any]]:
        """
        扫描 corpus 下所有子目录中的 .txt 文件，按行分块。
        返回: [{"text": str, "book": str, "source_file": str}, ...]
        """
        chunks: List[Dict[str, Any]] = []
        corpus_path = Path(CORPUS_BASE)
        if not corpus_path.is_dir():
            logger.warning("语料目录不存在: %s", corpus_path)
            return chunks

        # 遍历所有子目录中的 .txt 文件
        for txt_file in sorted(corpus_path.rglob("*.txt")):
            relative = txt_file.relative_to(corpus_path)
            book = relative.parent.name  # 子目录名作为 book

            try:
                text = txt_file.read_text(encoding="utf-8")
            except Exception as exc:
                logger.warning("无法读取文件 %s: %s", txt_file, exc)
                continue

            # 按行分块
            lines = text.strip().split("\n")
            current_chunk: List[str] = []
            for line in lines:
                line = line.strip()
                if not line:
                    if current_chunk:
                        chunk_text = "\n".join(current_chunk).strip()
                        if len(chunk_text) >= CHUNK_MIN_CHARS:
                            chunks.append(self._make_chunk(chunk_text, book, relative))
                        current_chunk = []
                    continue
                # 跳过注释行
                if line.startswith("#"):
                    continue
                current_chunk.append(line)

            # 处理最后一块
            if current_chunk:
                chunk_text = "\n".join(current_chunk).strip()
                if len(chunk_text) >= CHUNK_MIN_CHARS:
                    chunks.append(self._make_chunk(chunk_text, book, relative))

        return chunks

    def _make_chunk(
        self, text: str, book: str, source_file: Path
    ) -> Dict[str, Any]:
        """构造一个文档块条目。"""
        return {
            "text": text,
            "book": book,
            "source_file": str(source_file.as_posix()),
        }

    # ------------------------------------------------------------------
    # 检索方法
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        n_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        语义搜索知识库。

        Args:
            query: 查询文本
            n_results: 返回结果数量

        Returns:
            每个结果包含 text, book, source_file, score 字段
        """
        if not self._initialized:
            self.initialize_vectorstore()

        # 降级模式或索引未建立：走中文关键字检索
        if self._use_keyword_fallback or self._matrix is None:
            return self._fallback_search(query, n_results)

        try:
            q = np.asarray(self._embedder.embed_query(query), dtype=np.float32)
            # 向量已归一化，余弦相似度 = 点积
            sims = self._matrix @ q  # shape: (N,)
            k = min(n_results, len(sims))
            top_idx = np.argsort(-sims)[:k]

            results: List[Dict[str, Any]] = []
            for i in top_idx:
                ii = int(i)
                results.append({
                    "id": f"doc_{ii:06d}",
                    "text": self._texts[ii][:500],
                    "book": pretty_book(self._metas[ii]["book"]),
                    "source_file": self._metas[ii]["source_file"],
                    "score": round(float(sims[ii]), 4),
                })
            return results

        except Exception as exc:
            logger.error("向量检索失败: %s，回退关键字检索", exc)
            return self._fallback_search(query, n_results)

    def search_with_bazi_context(
        self,
        query: str,
        bazi_data: Dict[str, Any],
        n_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        结合八字上下文进行增强检索。

        将八字的四柱、日干五行等信息融入查询，提升相关性。
        """
        day_stem = bazi_data.get("day_stem", "")
        day_stem_wuxing = bazi_data.get("day_stem_wuxing", "")
        year_stem = bazi_data.get("year_pillar", {}).get("tiangan", "")
        month_stem = bazi_data.get("month_pillar", {}).get("tiangan", "")
        hour_stem = bazi_data.get("hour_pillar", {}).get("tiangan", "")

        augment_parts = [
            f"日主{day_stem}（{day_stem_wuxing}）",
            f"年干{year_stem}",
            f"月干{month_stem}",
            f"时干{hour_stem}",
        ]
        augment_str = "，".join(p for p in augment_parts if p)

        enhanced_query = f"{query} 八字信息：{augment_str}"

        return self.search(enhanced_query, n_results=n_results)

    # ------------------------------------------------------------------
    # 中文友好的关键字回退检索
    # ------------------------------------------------------------------

    def _tokenize_query(self, query: str) -> List[str]:
        """
        将查询切分为可匹配的 token。
        中文按单字（去除标点与停用字），拉丁文按空白分词，
        以保证无空格的中文查询也能有效命中语料。
        """
        tokens: List[str] = []
        # 拉丁/数字按空白与前缀切分
        for part in query.lower().split():
            if any(ord(c) < 128 for c in part):
                tokens.append(part)

        # 中文按字符切分（保留 CJK 统一表意文字及其扩展）
        for ch in query:
            if "一" <= ch <= "鿿":  # CJK 基本汉字范围
                tokens.append(ch)

        # 去重并去掉常见无语义字
        stop = set("的了的在是与和及之其此该等年月日时柱干支五行")
        return [t for t in dict.fromkeys(tokens) if t not in stop and len(t) > 0]

    def _fallback_search(
        self,
        query: str,
        n_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        降级检索：当真实嵌入不可用时，
        使用中文友好的关键字匹配从语料文件中搜索。
        """
        results: List[Dict[str, Any]] = []
        corpus_path = Path(CORPUS_BASE)
        if not corpus_path.is_dir():
            return results

        query_keywords = self._tokenize_query(query)
        if not query_keywords:
            return results

        for txt_file in sorted(corpus_path.rglob("*.txt")):
            relative = txt_file.relative_to(corpus_path)
            book = relative.parent.name
            try:
                text = txt_file.read_text(encoding="utf-8")
            except Exception:
                continue

            # 按段落分割并匹配关键字
            paragraphs = text.split("\n\n")
            for para in paragraphs:
                para = para.strip()
                if len(para) < CHUNK_MIN_CHARS:
                    continue

                para_lower = para.lower()
                # 计算命中关键词（字符）数量
                matched = sum(1 for kw in query_keywords if kw in para_lower)

                if matched > 0:
                    score = min(matched / len(query_keywords), 1.0)
                    results.append({
                        "id": f"fallback_{len(results):04d}",
                        "text": para[:500],
                        "book": pretty_book(book),
                        "source_file": str(relative.as_posix()),
                        "score": round(score, 4),
                    })

        # 按分数降序排列
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:n_results]

    @property
    def is_ready(self) -> bool:
        """检索器是否已初始化。"""
        return self._initialized

    @property
    def embedding_mode(self) -> str:
        """当前嵌入模式：real 或 hash。"""
        return self._embedding_mode
