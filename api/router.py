from fastapi import APIRouter
from .attraction import router as attr_router

# 前墜有 /api
router = APIRouter(prefix="/api")

# 景點相關 api
router.include_router(attr_router)