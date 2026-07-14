"""
易经起卦解卦引擎 (Yijing Divination Engine)

提供随机起卦、数字起卦、卦象分析（本卦/变卦/错卦/综卦）
以及现代场景映射等完整功能。
"""

from __future__ import annotations

import os
import random
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.config import PROJECT_ROOT
from app.knowledge.data_loader import load_all_knowledge, load_mappings

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

# 数字起卦法中的数字 -> 八卦名称映射（先天八卦数）
_NUM_TO_TRIGRAM: Dict[int, str] = {
    1: "乾", 2: "兑", 3: "离", 4: "震",
    5: "巽", 6: "坎", 7: "艮", 0: "坤",
}

_YAO_VALUE_MAP: Dict[int, str] = {
    6: "老阴",  # 阴变阳（动爻）
    7: "少阳",  # 阳（静爻）
    8: "少阴",  # 阴（静爻）
    9: "老阳",  # 阳变阴（动爻）
}

_YAO_POSITION_NAMES: List[str] = [
    "初",  # 初爻 (line 0, bottom)
    "二",  # 二爻 (line 1)
    "三",  # 三爻 (line 2)
    "四",  # 四爻 (line 3)
    "五",  # 五爻 (line 4)
    "上",  # 上爻 (line 5, top)
]

_YAO_TEXT_PATTERNS: Dict[int, str] = {
    6: "阴（老阴）—— 变爻，阴将转阳",
    7: "阳（少阳）—— 静爻",
    8: "阴（少阴）—— 静爻",
    9: "阳（老阳）—— 变爻，阳将转阴",
}

# ---------------------------------------------------------------------------
# 数据结构
# ---------------------------------------------------------------------------


@dataclass
class YaoLine:
    """单爻数据。"""
    position: int                # 爻位 0-5（初到上）
    value: int                   # 6|7|8|9
    is_changing: bool            # 是否为动爻
    yin_yang: str                # "阴" | "阳"
    position_name: str           # "初" | "二" | ... | "上"
    text: str = ""               # 爻辞（如适用）
    changing_to: Optional[str] = None  # 变爻后的阴阳


@dataclass
class HexagramInfo:
    """卦象信息。"""
    xuhao: int                   # 卦序 1-64
    name: str                    # 卦名
    shang_gua: str               # 上卦（外卦）名称
    xia_gua: str                 # 下卦（内卦）名称
    binary: str                  # 六爻二进制（初到上）
    description: str = ""        # 卦象描述
    gua_ci: str = ""             # 卦辞


@dataclass
class DivinationResult:
    """完整的起卦解卦结果。"""
    primary_gua: HexagramInfo                      # 本卦
    all_yao: List[YaoLine]                         # 六爻详情
    changing_lines: List[YaoLine]                  # 动爻列表
    bian_gua: Optional[HexagramInfo] = None        # 变卦（有动爻时）
    cuo_gua: Optional[HexagramInfo] = None         # 错卦
    zong_gua: Optional[HexagramInfo] = None         # 综卦
    gua_meaning: str = ""                          # 卦意解读
    modern_scenes: List[Dict[str, Any]] = field(default_factory=list)  # 现代场景映射
    question_context: str = ""                     # 问题上下文
    raw_data: Dict[str, Any] = field(default_factory=dict)  # 原始数据


# ---------------------------------------------------------------------------
# 引擎
# ---------------------------------------------------------------------------


class YijingEngine:
    """易经起卦解卦主引擎。"""

    def __init__(self) -> None:
        self._knowledge = load_all_knowledge()
        self._mappings = load_mappings()
        self._gua_data = self._knowledge.get("liushisi_gua", {})
        self._hexagrams: List[Dict[str, Any]] = self._gua_data.get("hexagrams", [])
        self._trigrams: Dict[str, Any] = self._gua_data.get("eight_trigrams", {})

        # 建立索引
        self._by_xuhao: Dict[int, Dict[str, Any]] = {
            h["xuhao"]: h for h in self._hexagrams
        }
        self._by_binary: Dict[str, Dict[str, Any]] = {
            h["binary"]: h for h in self._hexagrams
        }
        self._by_trigrams: Dict[tuple, Dict[str, Any]] = {
            (h["shang_gua"], h["xia_gua"]): h for h in self._hexagrams
        }

        # 卦名 -> 现代场景
        scene_list = self._mappings.get("gua_scenes", {}).get("mappings", [])
        self._scene_by_name: Dict[str, Dict[str, Any]] = {
            s["gua_name"]: s for s in scene_list
        }

        # 加载卦辞和爻辞
        self._guaci_map: Dict[str, str] = {}
        self._yaoci_map: Dict[str, Dict[str, str]] = {}
        self._load_guaci_texts()

    # ------------------------------------------------------------------
    # 内部辅助
    # ------------------------------------------------------------------

    def _load_guaci_texts(self) -> None:
        """从 corpus/yijing/guaci.txt 加载卦辞和爻辞。"""
        guaci_path = (
            PROJECT_ROOT
            / "app"
            / "knowledge"
            / "corpus"
            / "yijing"
            / "guaci.txt"
        )
        if not guaci_path.exists():
            return

        text = guaci_path.read_text(encoding="utf-8")
        sections = re.split(r"\n---+\n", text)

        if len(sections) >= 1:
            self._parse_guaci_section(sections[0])

        # 爻辞部分（最后一个 "---" 之后）
        for sec in sections[1:]:
            if "爻辞" in sec:
                self._parse_yaoci_section(sec)

    def _parse_guaci_section(self, text: str) -> None:
        """解析卦辞部分，每行格式 '卦名：卦辞内容'"""
        for line in text.strip().split("\n"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "：" in line:
                parts = line.split("：", 1)
                name = parts[0].strip()
                content = parts[1].strip()
                self._guaci_map[name] = content

    def _parse_yaoci_section(self, text: str) -> None:
        """解析爻辞选录部分。"""
        current_gua: Optional[str] = None
        for line in text.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            # 匹配 "乾卦爻辞：" 或 "坤卦爻辞："
            header_match = re.match(r"^([\u4e00-\u9fff]+)[卦]爻辞[：:]", line)
            if header_match:
                current_gua = header_match.group(1)
                self._yaoci_map[current_gua] = {}
                continue
            # 匹配 "初九：xxx" 或 "六二：xxx"
            if current_gua and "：" in line:
                parts = line.split("：", 1)
                position_key = parts[0].strip()
                content = parts[1].strip()
                self._yaoci_map[current_gua][position_key] = content

    def _find_hexagram_by_trigrams(self, shang: str, xia: str) -> Optional[Dict[str, Any]]:
        """通过上下卦名查找卦象。"""
        return self._by_trigrams.get((shang, xia))

    def _find_hexagram_by_binary(self, binary: str) -> Optional[Dict[str, Any]]:
        """通过二进制字符串查找卦象。"""
        return self._by_binary.get(binary)

    def _find_hexagram_by_xuhao(self, xuhao: int) -> Optional[Dict[str, Any]]:
        """通过卦序号查找卦象。"""
        return self._by_xuhao.get(xuhao)

    def _build_hexagram_info(self, raw: Dict[str, Any]) -> HexagramInfo:
        """从原始数据构造 HexagramInfo。"""
        name = raw.get("name", "")
        return HexagramInfo(
            xuhao=raw.get("xuhao", 0),
            name=name,
            shang_gua=raw.get("shang_gua", ""),
            xia_gua=raw.get("xia_gua", ""),
            binary=raw.get("binary", ""),
            description=raw.get("description", ""),
            gua_ci=self._guaci_map.get(name, ""),
        )

    def _get_trigram_from_yao(self, yao_values: List[int], start: int, end: int) -> str:
        """
        从爻值列表中获取三爻对应的八卦二进制字符串。
        start/end: 切片范围，例如下卦是 [0:3]，上卦是 [3:6]。
        yao_values 中: 6/8(阴) → '0', 7/9(阳) → '1'
        """
        bits = []
        for v in yao_values[start:end]:
            bits.append("1" if v in (7, 9) else "0")
        return "".join(bits)

    def _get_trigram_name_by_binary(self, binary_3: str) -> Optional[str]:
        """根据3位二进制返回八卦名称。"""
        for name, info in self._trigrams.items():
            if info.get("binary") == binary_3:
                return name
        return None

    def _get_yao_yinyang(self, value: int) -> str:
        return "阳" if value in (7, 9) else "阴"

    def _get_yao_text(self, gua_name: str, position: int, yinyang: str) -> str:
        """尝试从已解析的爻辞中获取对应爻的文本。"""
        gua_yaoci = self._yaoci_map.get(gua_name, {})
        # 位置名: 初、二、三、四、五、上
        pos_name = _YAO_POSITION_NAMES[position]
        # 爻辞 key 如 "初九", "六二"
        prefix = "九" if yinyang == "阳" else "六"
        key = f"{pos_name}{prefix}"
        return gua_yaoci.get(key, "")

    # ------------------------------------------------------------------
    # 起卦方法
    # ------------------------------------------------------------------

    def divinate_by_random(self) -> List[int]:
        """
        随机起卦：模拟三枚铜钱摇卦法。
        返回 [初爻值, 二爻值, ..., 上爻值] (长度为6)
        值范围: 6(老阴/变), 7(少阳), 8(少阴), 9(老阳/变)
        """
        lines = []
        for _ in range(6):
            # 三枚铜钱，每枚 2(阴面) 或 3(阳面)
            total = sum(random.choice([2, 3]) for _ in range(3))
            lines.append(total)
        return lines

    def divinate_by_numbers(self, num1: int, num2: int, num3: int) -> List[int]:
        """
        数字起卦（梅花易数法）。
        
        用三个数字分别确定上卦、下卦和动爻。
        num1 -> 上卦（先天八卦数）
        num2 -> 下卦（先天八卦数）
        num3 -> 动爻位置（1-6，超过则取余）
        
        返回: [初爻值, ..., 上爻值]
        
        说明：此方法先生成上下卦对应的爻值，再根据动爻位置
        将对应爻设为变爻（6或9而非7或8）。
        """
        shang_num = num1 % 8  # 0-7
        xia_num = num2 % 8   # 0-7
        changing_pos = (num3 - 1) % 6  # 0-5 (初爻到上爻)

        shang_name = _NUM_TO_TRIGRAM.get(shang_num)
        xia_name = _NUM_TO_TRIGRAM.get(xia_num)
        if not shang_name or not xia_name:
            raise ValueError(f"无效的卦数: shang={shang_num}, xia={xia_num}")

        shang_binary = self._trigrams.get(shang_name, {}).get("binary", "000")
        xia_binary = self._trigrams.get(xia_name, {}).get("binary", "000")

        # 组合成六爻: 下卦(低3位) + 上卦(高3位)
        full_binary = shang_binary + xia_binary

        # 将二进制转换为爻值: '1' -> 7(少阳), '0' -> 8(少阴)
        lines = []
        for i, bit in enumerate(full_binary):
            if bit == "1":
                lines.append(7 if i != changing_pos else 9)
            else:
                lines.append(8 if i != changing_pos else 6)

        return lines

    # ------------------------------------------------------------------
    # 卦象分析
    # ------------------------------------------------------------------

    def get_hexagram_details(self, xuhao: int) -> Optional[Dict[str, Any]]:
        """根据卦序号获取原始卦象数据。"""
        raw = self._find_hexagram_by_xuhao(xuhao)
        if not raw:
            return None
        info = self._build_hexagram_info(raw)
        return {
            "xuhao": info.xuhao,
            "name": info.name,
            "shang_gua": info.shang_gua,
            "xia_gua": info.xia_gua,
            "binary": info.binary,
            "description": info.description,
            "gua_ci": info.gua_ci,
        }

    def _get_mapping_for_gua(self, gua_name: str) -> List[Dict[str, Any]]:
        """获取某卦对应的现代场景映射。"""
        scene_entry = self._scene_by_name.get(gua_name)
        if not scene_entry:
            return []
        return [
            {
                "gua_name": scene_entry.get("gua_name", ""),
                "gua_symbol": scene_entry.get("gua_symbol", ""),
                "scenes": scene_entry.get("scenes", []),
                "description": scene_entry.get("description", ""),
            }
        ]

    def analyze_gua(
        self,
        yao_values: List[int],
        question: Optional[str] = None,
    ) -> DivinationResult:
        """
        完整卦象分析。
        
        Args:
            yao_values: 6个爻值 [初,二,三,四,五,上]，范围 6|7|8|9
            question: 用户的问题文本（可选）
        
        Returns:
            DivinationResult 包含本卦、变卦、错卦、综卦及现代场景
        """
        if len(yao_values) != 6:
            raise ValueError(f"需要6个爻值，收到 {len(yao_values)} 个")

        # 1. 确定本卦
        xia_binary = self._get_trigram_from_yao(yao_values, 0, 3)  # 下卦
        shang_binary = self._get_trigram_from_yao(yao_values, 3, 6)  # 上卦
        full_binary = shang_binary + xia_binary

        primary_raw = self._find_hexagram_by_binary(full_binary)
        if not primary_raw:
            # 尝试通过上下卦查找
            xia_name = self._get_trigram_name_by_binary(xia_binary)
            shang_name = self._get_trigram_name_by_binary(shang_binary)
            if xia_name and shang_name:
                primary_raw = self._find_hexagram_by_trigrams(shang_name, xia_name)
        if not primary_raw:
            raise ValueError(f"无法识别卦象: binary={full_binary}")

        primary_gua = self._build_hexagram_info(primary_raw)

        # 2. 构建所有爻
        all_yao: List[YaoLine] = []
        changing_lines: List[YaoLine] = []
        for i in range(6):
            val = yao_values[i]
            yinyang = self._get_yao_yinyang(val)
            is_changing = val in (6, 9)
            yaotext = self._get_yao_text(primary_gua.name, i, yinyang)
            yao = YaoLine(
                position=i,
                value=val,
                is_changing=is_changing,
                yin_yang=yinyang,
                position_name=_YAO_POSITION_NAMES[i],
                text=yaotext,
                changing_to="阳" if val == 6 else ("阴" if val == 9 else None),
            )
            all_yao.append(yao)
            if is_changing:
                changing_lines.append(yao)

        # 3. 变卦
        bian_gua_info: Optional[HexagramInfo] = None
        if changing_lines:
            # 翻转变爻：6->1, 9->0, 7->1, 8->0
            bian_bits = []
            for v in yao_values:
                if v == 6:
                    bian_bits.append("1")
                elif v == 9:
                    bian_bits.append("0")
                else:
                    bian_bits.append("1" if v == 7 else "0")
            bian_binary = "".join(bian_bits)
            bian_raw = self._find_hexagram_by_binary(bian_binary)
            if bian_raw:
                bian_gua_info = self._build_hexagram_info(bian_raw)

        # 4. 错卦（所有爻阴阳全变）
        cuo_raw = None
        cuo_xuhao = primary_raw.get("cuo_gua")
        if cuo_xuhao:
            cuo_raw = self._find_hexagram_by_xuhao(cuo_xuhao)
        # 如果 JSON 中没有则按位取反计算
        if not cuo_raw:
            cuo_bits = []
            for v in yao_values:
                if v in (7, 9):
                    cuo_bits.append("0")
                else:
                    cuo_bits.append("1")
            cuo_binary = "".join(cuo_bits)
            cuo_raw = self._find_hexagram_by_binary(cuo_binary)
        cuo_gua = self._build_hexagram_info(cuo_raw) if cuo_raw else None

        # 5. 综卦（卦象颠倒）
        zong_raw = None
        zong_xuhao = primary_raw.get("zong_gua")
        if zong_xuhao:
            zong_raw = self._find_hexagram_by_xuhao(zong_xuhao)
        if not zong_raw:
            # 翻转二进制：从初爻到上爻反转
            reversed_binary = full_binary[::-1]
            zong_raw = self._find_hexagram_by_binary(reversed_binary)
        zong_gua = self._build_hexagram_info(zong_raw) if zong_raw else None

        # 6. 卦意解读（优先使用卦辞，其次使用 description）
        gua_meaning = primary_gua.gua_ci if primary_gua.gua_ci else primary_gua.description

        # 7. 现代场景
        modern_scenes = self._get_mapping_for_gua(primary_gua.name)
        # 如果有变卦，也加入变卦的场景
        if bian_gua_info and bian_gua_info.name != primary_gua.name:
            bian_scenes = self._get_mapping_for_gua(bian_gua_info.name)
            if bian_scenes:
                modern_scenes.append({
                    "type": "变卦参考",
                    "gua_name": bian_gua_info.name,
                    "description": bian_scenes[0].get("description", ""),
                    "scenes": bian_scenes[0].get("scenes", []),
                })

        # 8. 上下文
        question_context = question or "未提供具体问题"

        return DivinationResult(
            primary_gua=primary_gua,
            all_yao=all_yao,
            changing_lines=changing_lines,
            bian_gua=bian_gua_info,
            cuo_gua=cuo_gua,
            zong_gua=zong_gua,
            gua_meaning=gua_meaning,
            modern_scenes=modern_scenes,
            question_context=question_context,
            raw_data={
                "yao_values": yao_values,
                "full_binary": full_binary,
            },
        )

    # ------------------------------------------------------------------
    # 便捷方法
    # ------------------------------------------------------------------

    def divinate_full(
        self,
        question: Optional[str] = None,
        method: str = "random",
        numbers: Optional[List[int]] = None,
        yao_values: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """
        一键起卦解卦。

        Args:
            question: 用户问题
            method: "random" / "numbers" / "coins"
            numbers: method="numbers" 时提供 [num1, num2, num3]
            yao_values: method="coins" 时由前端投掷三枚铜钱生成，
                        为 6 个爻值 [初, 二, 三, 四, 五, 上]，范围 6|7|8|9

        Returns:
            可序列化的完整卦象分析字典
        """
        if yao_values and len(yao_values) == 6:
            # 前端铜钱投掷法：直接使用投掷结果解卦
            result = self.analyze_gua(yao_values, question=question)
        elif method == "numbers" and numbers and len(numbers) == 3:
            yao_values = self.divinate_by_numbers(numbers[0], numbers[1], numbers[2])
            result = self.analyze_gua(yao_values, question=question)
        else:
            yao_values = self.divinate_by_random()
            result = self.analyze_gua(yao_values, question=question)
        return self._result_to_dict(result)

    def _result_to_dict(self, result: DivinationResult) -> Dict[str, Any]:
        """将 DivinationResult 转为可序列化的字典。"""
        def _hex_to_dict(h: Optional[HexagramInfo]) -> Optional[Dict[str, Any]]:
            if not h:
                return None
            return {
                "xuhao": h.xuhao,
                "name": h.name,
                "shang_gua": h.shang_gua,
                "xia_gua": h.xia_gua,
                "binary": h.binary,
                "description": h.description,
                "gua_ci": h.gua_ci,
            }

        return {
            "primary_gua": _hex_to_dict(result.primary_gua),
            "changing_lines": [
                {
                    "position": y.position,
                    "position_name": y.position_name,
                    "value": y.value,
                    "yin_yang": y.yin_yang,
                    "is_changing": y.is_changing,
                    "text": y.text,
                    "changing_to": y.changing_to,
                }
                for y in result.changing_lines
            ],
            "all_yao": [
                {
                    "position": y.position,
                    "position_name": y.position_name,
                    "value": y.value,
                    "yin_yang": y.yin_yang,
                    "is_changing": y.is_changing,
                    "text": y.text,
                    "changing_to": y.changing_to,
                }
                for y in result.all_yao
            ],
            "bian_gua": _hex_to_dict(result.bian_gua),
            "cuo_gua": _hex_to_dict(result.cuo_gua),
            "zong_gua": _hex_to_dict(result.zong_gua),
            "gua_meaning": result.gua_meaning,
            "modern_scenes": result.modern_scenes,
            "question_context": result.question_context,
            "question": result.question_context,
        }
