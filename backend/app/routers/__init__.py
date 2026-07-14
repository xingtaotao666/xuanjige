"""
路由聚合模块。
将各功能子路由注册到主路由器，由 main.py 以 /api 前缀统一挂载。
"""

from fastapi import APIRouter

from app.routers.bazi import router as bazi_router
from app.routers.yijing import router as yijing_router
from app.routers.consult import router as consult_router
from app.routers.knowledge import router as knowledge_router

router = APIRouter()

# 健康检查
@router.get("/health")
def health():
    return {"status": "ok"}

# 注册子路由
router.include_router(bazi_router)
router.include_router(yijing_router)
router.include_router(consult_router)
router.include_router(knowledge_router)
