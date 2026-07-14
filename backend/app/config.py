import os
from pathlib import Path


def _get_project_root() -> Path:
    """Auto-detect project root: the parent of the app/ directory."""
    return Path(__file__).resolve().parent.parent


PROJECT_ROOT: Path = _get_project_root()

# LLM configuration
LLM_API_KEY: str = os.environ.get("LLM_API_KEY", "")
LLM_API_URL: str = os.environ.get(
    "LLM_API_URL",
    "https://api.deepseek.com/v1/chat/completions",
)
LLM_MODEL: str = os.environ.get("LLM_MODEL", "deepseek-chat")

# ChromaDB persistent storage
CHROMA_PERSIST_DIR: str = os.environ.get(
    "CHROMA_PERSIST_DIR",
    str(PROJECT_ROOT / "data" / "chroma"),
)

# CORS: allowed origins for development
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
