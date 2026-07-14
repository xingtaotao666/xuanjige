import json
import os
from typing import Any


def load_all_knowledge() -> dict[str, dict[str, Any]]:
    """读取 knowledge/structured/ 下所有 JSON 文件，返回 {文件名(不含扩展): 数据} 的字典。"""
    base = os.path.join(os.path.dirname(__file__), "structured")
    return _load_json_dir(base)


def load_corpus_texts() -> dict[str, str]:
    """递归读取 knowledge/corpus/ 下所有 .txt 文件，返回 {书名: 文本内容} 的字典。"""
    base = os.path.join(os.path.dirname(__file__), "corpus")
    result: dict[str, str] = {}
    if not os.path.isdir(base):
        return result
    for root, _dirs, files in os.walk(base):
        for fname in sorted(files):
            if fname.endswith(".txt"):
                rel_dir = os.path.relpath(root, base)
                key = os.path.join(rel_dir, os.path.splitext(fname)[0]) if rel_dir != "." else os.path.splitext(fname)[0]
                fpath = os.path.join(root, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    result[key] = f.read()
    return result


def load_mappings() -> dict[str, dict[str, Any]]:
    """读取 knowledge/mappings/ 下所有 JSON 文件，返回 {文件名(不含扩展): 数据} 的字典。"""
    base = os.path.join(os.path.dirname(__file__), "mappings")
    return _load_json_dir(base)


def _load_json_dir(directory: str) -> dict[str, dict[str, Any]]:
    """Helper: 读取指定目录下所有 JSON 文件。"""
    result: dict[str, dict[str, Any]] = {}
    if not os.path.isdir(directory):
        return result
    for fname in sorted(os.listdir(directory)):
        if fname.endswith(".json"):
            key = os.path.splitext(fname)[0]
            fpath = os.path.join(directory, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                result[key] = json.load(f)
    return result
