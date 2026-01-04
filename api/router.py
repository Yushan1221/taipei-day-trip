from fastapi import APIRouter
from .attraction import router as attr_router
from .user import router as user_router


# 前墜有 /api
router = APIRouter(prefix="/api")

# 景點相關 api
router.include_router(attr_router, tags=["Attraction"])
router.include_router(user_router, tags=["User"])
