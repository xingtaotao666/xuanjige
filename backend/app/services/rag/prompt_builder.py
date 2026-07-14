"""
提示词构建器 (Prompt Builder)

为 LLM 调用构建结构化系统提示和用户提示，
支持八字解读、卦象分析和综合咨询三种场景。
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# 提示词模板
# ---------------------------------------------------------------------------

_SYSTEM_BAZI = """你是一位精通中国传统命理学的资深命理师，深谙《渊海子平》《三命通会》《滴天髓》《穷通宝鉴》等经典典籍，常年为他人批八字、断吉凶。

你的任务是像一位经验丰富的算命先生那样，依据用户提供的完整八字排盘数据（四柱干支、十神、五行强弱、纳音、十二长生、神煞、大运流年），做出专业、详尽、有画面感的解读。

行文要求：
1. 以"命主"或"你"称呼用户，语气从容、老练，如同当面批命，既有古文底蕴又通俗易懂。
2. 必须结合所提供的【参考典籍片段】，在适当处点出"《渊海子平》有云……""《滴天髓》谓……"之类的引证，使论断有据可依。
3. 解读要详尽展开，分板块层层递进，总篇幅力求 800 字以上，不要惜墨。
4. 严禁使用任何 Markdown 符号：不要出现星号（*）、井号（#）、大于号引用（>）、反引号（`）。如需分点，直接用中文序号（一、二、三 或 1. 2. 3.）或自然段落即可。
5. 客观中肯，强调命理趋势与修养调适之道，避免制造焦虑与绝对宿命论。
6. 结尾给出务实、可操作的人生建议（事业、财运、感情、健康、修身等方面）。"""

_SYSTEM_YIJING = """你是一位精通《周易》哲学的AI大师，擅长结合卦象、爻辞进行易经占卜解读。

你的任务是：
1. 根据起卦结果（本卦、变卦、综卦、错卦等）进行综合分析
2. 结合卦辞、爻辞和古籍文献提供专业解读
3. 将古老的易经智慧映射到用户的现代生活场景
4. 给出有指导意义的哲学思考和建议

注意事项：
- 重点解释卦象的核心含义和象征
- 如有动爻，重点分析动爻的含义和变化趋势
- 将卦象与用户的实际问题相结合
- 从变卦中分析事态发展的可能方向
- 从错卦和综卦提供补充视角"""

_SYSTEM_CONSULT = """你是一位融合八字命理与周易智慧的中国传统哲学顾问。

你的任务是：
1. 结合用户提供的背景信息和咨询问题
2. 综合运用八字命理和易经哲学知识
3. 从多个角度分析问题并提供建议
4. 引用古籍文献作为参考依据

注意事项：
- 回答要贴合用户的实际生活场景
- 如果信息不足，明确指出分析的局限性
- 保持开放、温和的语气，避免制造焦虑
- 建议要务实、可操作"""


# ---------------------------------------------------------------------------
# 构建器
# ---------------------------------------------------------------------------


class PromptBuilder:
    """提示词构建器，根据场景生成结构化的 LLM 提示。"""

    @staticmethod
    def _format_rag_sources(sources: List[Dict[str, Any]]) -> str:
        """将 RAG 检索结果格式化为可读的参考文本。"""
        if not sources:
            return ""

        lines = ["\n参考典籍片段："]
        for i, src in enumerate(sources, 1):
            raw_book = src.get("book", "未知典籍")
            book = raw_book.strip("《》")
            text = src.get("text", "")
            score = src.get("score", 0)
            lines.append(f"\n{i}. 《{book}》 (相关度: {score:.2f})")
            lines.append(f"   {text[:300]}")
        return "\n".join(lines)

    @staticmethod
    def _format_bazi_data(bazi_result: Dict[str, Any]) -> str:
        """将八字结果格式化为结构化的上下文信息（尽可能详尽，供 LLM 参考）。"""
        parts = ["\n八字排盘数据："]

        # 基本信息
        gender = bazi_result.get("gender", "")
        jieqi = bazi_result.get("current_jieqi", "")
        if gender:
            parts.append(f"  性别: {gender}")
        if jieqi:
            parts.append(f"  出生节气: {jieqi}")

        # 四柱
        pillars = bazi_result.get("four_pillars", [])
        pillar_names = bazi_result.get("pillar_names", ["年柱", "月柱", "日柱", "时柱"])
        if pillars:
            for name, pillar in zip(pillar_names, pillars):
                ganzhi = pillar.get("ganzhi", "")
                tiangan = pillar.get("tiangan", "")
                dizhi = pillar.get("dizhi", "")
                wx_tg = pillar.get("wuxing_tiangan", "")
                wx_dz = pillar.get("wuxing_dizhi", "")
                canggan = "、".join(pillar.get("canggan", []))
                parts.append(
                    f"  {name}: {ganzhi}（天干{tiangan}属{wx_tg}，地支{dizhi}属{wx_dz}，藏干: {canggan}）"
                )

        # 日干（日主）
        day_stem = bazi_result.get("day_stem", "")
        day_stem_wx = bazi_result.get("day_stem_wuxing", "")
        parts.append(f"  日主: {day_stem}（五行属{day_stem_wx}，为命局核心）")

        # 纳音
        nayin = bazi_result.get("nayin_info", {})
        if nayin:
            nayin_str = "，".join(f"{k}{v}" for k, v in nayin.items())
            parts.append(f"  纳音: {nayin_str}")

        # 十神（天干）
        shishen = bazi_result.get("shishen_analysis", {})
        if shishen:
            parts.append("  十神（天干）分析：")
            for shen_name, shen_data in shishen.items():
                if isinstance(shen_data, dict):
                    tg = shen_data.get("tiangan", "")
                    detail = shen_data.get("detail", "")
                    rel = shen_data.get("relationship", "")
                    rel_tag = f"（{rel}）" if rel else ""
                    parts.append(f"    {tg}坐{shen_name}{rel_tag}: {detail}")

        # 十神（地支藏干）
        hidden = bazi_result.get("shishen_hidden", {})
        if hidden:
            parts.append("  十神（地支藏干）补充：")
            for branch, items in hidden.items():
                parts.append(f"    {branch}支: {'、'.join(items)}")

        # 五行
        wuxing = bazi_result.get("wuxing_analysis", {})
        if wuxing:
            elements = wuxing.get("elements", {})
            if elements:
                el_str = "，".join(f"{k}: {v}" for k, v in elements.items())
                parts.append(f"  五行分值分布：{el_str}")
            strength = wuxing.get("strength_analysis", "")
            if strength:
                parts.append(f"  五行强弱与生克：{strength}")

        # 十二长生
        chang_sheng = bazi_result.get("chang_sheng", {})
        if chang_sheng:
            cs_parts = []
            for tg, states in chang_sheng.items():
                cs_parts.append(f"{tg}: {'、'.join(states)}")
            if cs_parts:
                parts.append(f"  十二长生: {'；'.join(cs_parts)}")

        # 神煞
        shensha = bazi_result.get("shensha_analysis", {})
        if shensha:
            shensha_list = shensha.get("shensha_list", [])
            if shensha_list:
                ss_items = []
                for s in shensha_list:
                    name = s.get("name", "")
                    typ = s.get("type", "")
                    pos = s.get("position", "")
                    pos_tag = f"[{pos}]" if pos else ""
                    ss_items.append(f"{name}({typ}){pos_tag}")
                parts.append(f"  神煞: {'、'.join(ss_items)}")

        # 大运
        dayun = bazi_result.get("dayun_analysis", {})
        if dayun:
            qi_yun = dayun.get("qi_yun_age", "")
            if qi_yun:
                parts.append(f"  起运年龄: {qi_yun}岁")
            current = dayun.get("current_dayun", "")
            age = dayun.get("current_age", "")
            if current:
                parts.append(f"  当前大运: {current}（{age}）")
            periods = dayun.get("periods", [])
            if periods:
                per_str = "，".join(f"{p.get('ganzhi','')}({p.get('age','')})" for p in periods[:8])
                parts.append(f"  大运走势: {per_str}")

        return "\n".join(parts)

    @staticmethod
    def _format_gua_result(gua_result: Dict[str, Any]) -> str:
        """将卦象结果格式化为结构化的上下文信息。"""
        parts = ["\n卦象数据："]

        primary = gua_result.get("primary_gua", {})
        if primary:
            xuhao = primary.get("xuhao", "")
            name = primary.get("name", "")
            binary = primary.get("binary", "")
            description = primary.get("description", "")
            gua_ci = primary.get("gua_ci", "")
            parts.append(
                f"  本卦: 第{xuhao}卦 {name}（{binary}）"
            )
            parts.append(f"  卦象描述: {description}")
            if gua_ci:
                parts.append(f"  卦辞: {gua_ci}")

        # 动爻
        changing = gua_result.get("changing_lines", [])
        if changing:
            parts.append("  动爻：")
            for y in changing:
                pos_name = y.get("position_name", "")
                yinyang = y.get("yin_yang", "")
                text = y.get("text", "")
                changing_to = y.get("changing_to", "")
                yao_str = f"    {pos_name}爻: {yinyang}"
                if text:
                    yao_str += f" → {text}"
                if changing_to:
                    yao_str += f"（将变为{changing_to}）"
                parts.append(yao_str)
        else:
            parts.append("  动爻: 无（静卦，六爻皆静）")

        # 变卦
        bian = gua_result.get("bian_gua")
        if bian:
            parts.append(
                f"  变卦: 第{bian['xuhao']}卦 {bian['name']}（{bian['binary']}）"
            )
            if bian.get("gua_ci"):
                parts.append(f"  变卦卦辞: {bian['gua_ci']}")

        # 错卦和综卦
        cuo = gua_result.get("cuo_gua")
        if cuo:
            parts.append(f"  错卦: 第{cuo['xuhao']}卦 {cuo['name']}（{cuo.get('description','')}）")
        zong = gua_result.get("zong_gua")
        if zong:
            parts.append(f"  综卦: 第{zong['xuhao']}卦 {zong['name']}（{zong.get('description','')}）")

        # 卦意解读
        meaning = gua_result.get("gua_meaning", "")
        if meaning:
            parts.append(f"  卦意解读: {meaning}")

        return "\n".join(parts)

    # ------------------------------------------------------------------
    # 公共方法
    # ------------------------------------------------------------------

    @staticmethod
    def build_bazi_prompt(
        bazi_result: Dict[str, Any],
        rag_sources: List[Dict[str, Any]],
    ) -> Dict[str, str]:
        """
        构造八字解读的提示词。
        
        Returns:
            {"system": str, "user": str}
        """
        sys_prompt = _SYSTEM_BAZI

        # 用户消息
        user_parts = ["请根据以下八字排盘数据，为用户进行专业解读。"]

        user_parts.append(PromptBuilder._format_bazi_data(bazi_result))

        if rag_sources:
            user_parts.append(PromptBuilder._format_rag_sources(rag_sources))

        user_parts.append(
            "\n请像资深算命先生那样，分板块详细解读，每个板块都要展开说明，篇幅要充足：\n"
            "一、命局总论：日主强弱、格局高低、寒暖燥湿、日主心性基调。\n"
            "二、五行喜忌：用神、喜神、忌神分别是什么，日主宜补何五行。\n"
            "三、十神论命：各十神（正官、七杀、正印、偏财、食神等）透干与藏支所主之性格、六亲、事业财运倾向。\n"
            "四、神煞吉凶：所带贵人或凶煞对命运的影响。\n"
            "五、大运流年：当前大运气象、起运早晚、近年流年吉凶起伏。\n"
            "六、人生指引：事业、财运、感情、健康、修身方面的具体建议。\n"
            "请务必引用所提供的参考典籍片段来佐证论断，让解读既有理据又有古韵。"
        )

        return {
            "system": sys_prompt,
            "user": "\n".join(user_parts),
        }

    @staticmethod
    def build_yijing_prompt(
        gua_result: Dict[str, Any],
        rag_sources: List[Dict[str, Any]],
    ) -> Dict[str, str]:
        """
        构造卦象解读的提示词。
        
        Returns:
            {"system": str, "user": str}
        """
        sys_prompt = _SYSTEM_YIJING

        user_parts = ["请根据以下卦象数据，为用户进行易经占卜解读。"]

        question = gua_result.get("question_context", "")
        if question and question != "未提供具体问题":
            user_parts.append(f"\n用户问题: {question}")

        user_parts.append(PromptBuilder._format_gua_result(gua_result))

        # 现代场景
        scenes = gua_result.get("modern_scenes", [])
        if scenes:
            user_parts.append("\n现代场景映射：")
            for s in scenes:
                scene_list = s.get("scenes", [])
                desc = s.get("description", "")
                if scene_list:
                    user_parts.append(f"  场景标签: {', '.join(scene_list)}")
                if desc:
                    user_parts.append(f"  现代解读: {desc}")

        if rag_sources:
            user_parts.append(PromptBuilder._format_rag_sources(rag_sources))

        user_parts.append(
            "\n请从以下角度分析：\n"
            "1. 本卦的核心含义和象征意义\n"
            "2. 动爻的解读（如有）\n"
            "3. 变卦揭示的发展趋势\n"
            "4. 错卦和综卦提供的补充视角\n"
            "5. 结合现代生活的实际建议"
        )

        return {
            "system": sys_prompt,
            "user": "\n".join(user_parts),
        }

    @staticmethod
    def build_consult_prompt(
        query: str,
        bazi_context: Optional[Dict[str, Any]] = None,
        rag_sources: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, str]:
        """
        构造综合咨询的提示词。
        
        Args:
            query: 用户咨询的问题
            bazi_context: 八字排盘数据（可选）
            rag_sources: RAG 检索结果（可选）
        
        Returns:
            {"system": str, "user": str}
        """
        sys_prompt = _SYSTEM_CONSULT

        user_parts = [f"用户咨询问题：{query}"]

        if bazi_context:
            user_parts.append(PromptBuilder._format_bazi_data(bazi_context))

        if rag_sources:
            user_parts.append(PromptBuilder._format_rag_sources(rag_sources))

        return {
            "system": sys_prompt,
            "user": "\n".join(user_parts),
        }
