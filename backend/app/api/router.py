from fastapi import APIRouter

from app.api.v1.router import api_v1_router
from app.modules.health.router import router as health_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(api_v1_router, prefix="/api/v1")
