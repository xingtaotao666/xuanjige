"""
LLM API 调用客户端 (LLM Client)

支持 DeepSeek / OpenAI 兼容格式的 API 调用。
未配置 API Key 时自动降级为基于映射数据的规则式回应。
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.config import LLM_API_KEY, LLM_API_URL, LLM_MODEL
from app.knowledge.data_loader import load_mappings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

REQUEST_TIMEOUT = 45  # 请求超时（秒）
DEFAULT_MAX_TOKENS = 3000  # 默认最大生成 token（满足详尽解读需求）

# ---------------------------------------------------------------------------
# 客户端
# ---------------------------------------------------------------------------


class LLMClient:
    """
    LLM API 调用客户端。

    支持:
    - DeepSeek / OpenAI 兼容 API
    - 自定义 temperature 和 max_tokens
    - API Key 未配置时自动使用规则式降级回应
    """

    def __init__(self) -> None:
        self._api_key = LLM_API_KEY
        self._api_url = LLM_API_URL
        self._model = LLM_MODEL
        self._mappings = load_mappings()

    # ------------------------------------------------------------------
    # 核心调用
    # ------------------------------------------------------------------

    def call_llm(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        """
        调用 LLM API。
        
        Args:
            messages: [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
            temperature: 生成温度 (0.0-2.0)
            max_tokens: 最大生成 token 数
        
        Returns:
            LLM 生成的文本（已清除 Markdown 符号）
        """
        if not self._api_key:
            logger.info("LLM API Key 未配置，使用规则式降级回应")
            return self._clean_output(self._fallback_response(messages))

        try:
            raw = self._call_api(messages, temperature, max_tokens)
        except Exception as exc:
            logger.error("LLM API 调用失败: %s，使用降级回应", exc)
            return self._clean_output(self._fallback_response(messages))

        return self._clean_output(raw)

    # ------------------------------------------------------------------
    # 输出清洗
    # ------------------------------------------------------------------

    @staticmethod
    def _clean_output(text: str) -> str:
        """
        清除 LLM 输出中的 Markdown 符号（星号、井号、引用符、反引号），
        避免前端显示杂乱的 * # > ` 字符。
        """
        if not text:
            return text
        import re

        # 加粗/斜体 ** 与 __
        text = text.replace("**", "").replace("__", "")
        # 行首标题 # 号
        text = re.sub(r"(?m)^#{1,6}\s*", "", text)
        # 引用符 >
        text = re.sub(r"(?m)^\s*>\s?", "", text)
        # 行首无序列表 * - + 标记
        text = re.sub(r"(?m)^\s*[\*\-\+]\s+", "", text)
        # 残留的反引号
        text = text.replace("`", "")
        # 清除所有残余的孤立星号
        text = text.replace("*", "")
        return text.strip()

    # ------------------------------------------------------------------
    # API 调用
    # ------------------------------------------------------------------

    def _call_api(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """实际的 API 调用。"""
        import httpx

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        logger.debug("LLM 请求: model=%s, messages=%d条", self._model, len(messages))

        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            response = client.post(
                self._api_url,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        # 兼容 OpenAI / DeepSeek 响应格式
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("API 返回的 choices 为空")

        content = choices[0].get("message", {}).get("content", "")
        logger.debug("LLM 响应完成: %d 字符", len(content))
        return content

    # ------------------------------------------------------------------
    # 降级回应
    # ------------------------------------------------------------------

    def _fallback_response(
        self,
        messages: List[Dict[str, str]],
    ) -> str:
        """
        API 不可用时的规则式降级回应。
        使用 mappings 库中的数据进行基础解读。
        """
        # 提取用户消息
        user_content = self._extract_user_content(messages)

        # 判断咨询类型
        if "卦" in user_content or "易经" in user_content or "起卦" in user_content:
            return self._generate_yijing_fallback(user_content)
        elif "八字" in user_content or "命理" in user_content or "排盘" in user_content:
            return self._generate_bazi_fallback(user_content)
        else:
            return self._generate_general_fallback(user_content)

    def _extract_user_content(self, messages: List[Dict[str, str]]) -> str:
        """从消息列表中提取最后一条用户消息。"""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                return msg.get("content", "")
        return ""

    def _generate_yijing_fallback(self, user_content: str) -> str:
        """基于卦象映射的降级易经解读。"""
        scenes = self._mappings.get("gua_scenes", {}).get("mappings", [])

        # 尝试从用户消息中提取卦名
        gua_name = self._extract_gua_name(user_content, scenes)

        if gua_name:
            scene_data = self._find_scene(gua_name, scenes)
            if scene_data:
                tags = scene_data.get("scenes", [])
                desc = scene_data.get("description", "")
                return (
                    f"基于已知卦象库分析（LLM 服务暂不可用）：\n\n"
                    f"卦象：{gua_name} {scene_data.get('gua_symbol', '')}\n"
                    f"现代场景标签：{'、'.join(tags)}\n\n"
                    f"{desc}\n\n"
                    f"【提示】此为基础解读。如需更深入、个性化的分析，请联系管理员配置 LLM API Key。"
                )

        return (
            "易经参考解读（LLM 服务暂不可用）：\n\n"
            "根据《周易》卦象资料库中的现代场景映射，"
            "可参考相关卦象的现代解读作为初步指引。\n\n"
            "建议：\n"
            "1. 请提供具体问题以便定向起卦\n"
            "2. 联系管理员配置 LLM API Key 以获得 AI 深度解读"
        )

    def _generate_bazi_fallback(self, user_content: str) -> str:
        """基于十神映射的降级八字解读。"""
        shishen_map = self._mappings.get("shishen_modern", {}).get("mappings", [])

        if not shishen_map:
            return "八字基础解读（LLM 服务暂不可用）：请配置 LLM API Key 以获得详细分析。"

        lines = ["基于十神现代角色库分析（LLM 服务暂不可用）：\n"]
        lines.append("各十神在现代社会的映射参考：\n")
        for item in shishen_map[:5]:  # 取前5个
            shen = item.get("shen", "")
            roles = item.get("modern_roles", [])
            desc = item.get("description_cn", "")
            lines.append(f"  【{shen}】{desc}")
            lines.append(f"    对应现代角色：{'、'.join(roles)}\n")

        lines.append(
            "【提示】此为基础参考，具体解读需结合八字排盘的实际十神组合。\n"
            "建议联系管理员配置 LLM API Key 以获得个性化的 AI 深度解读。"
        )
        return "\n".join(lines)

    def _generate_general_fallback(self, user_content: str) -> str:
        """通用降级回应。"""
        return (
            "感谢您的咨询。\n\n"
            "当前 LLM 服务暂未配置 API Key，已启用基础模式：\n"
            "1. 八字排盘和卦象计算功能正常运行\n"
            "2. 规则式解读基于命理学映射数据库\n\n"
            "如需获得 AI 深度解读，请联系管理员配置 LLM_API_KEY。\n\n"
            "您可以继续使用以下功能：\n"
            "• 八字排盘计算\n"
            "• 易经起卦解卦\n"
            "• RAG 知识库检索（古籍文献）"
        )

    # ------------------------------------------------------------------
    # 辅助方法
    # ------------------------------------------------------------------

    def _extract_gua_name(
        self, text: str, scenes: List[Dict[str, Any]]
    ) -> Optional[str]:
        """从文本中尝试提取卦名。"""
        for scene in scenes:
            name = scene.get("gua_name", "")
            if name and name in text:
                return name
        return None

    def _find_scene(
        self, gua_name: str, scenes: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """根据卦名查找场景映射。"""
        for s in scenes:
            if s.get("gua_name") == gua_name:
                return s
        return None
