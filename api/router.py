from fastapi import APIRouter
from .attraction import router as attr_router
from .user import router as user_router
from .booking import router as booking_router


# 前墜有 /api
router = APIRouter(prefix="/api")

# 連接其他 /api 為開頭的 router
router.include_router(attr_router, tags=["Attraction"])
router.include_router(user_router, tags=["User"])
router.include_router(booking_router, tags=["Booking"])

