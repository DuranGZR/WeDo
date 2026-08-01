from fastapi import APIRouter
from sqlalchemy import text

from app.api.dependencies import SessionDep
from app.modules.health.schemas import HealthResponse
from app.modules.health.service import get_health

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Check API health")
def health_check() -> HealthResponse:
    return get_health()


@router.get("/ready", response_model=HealthResponse, summary="Check API readiness")
def readiness_check(session: SessionDep) -> HealthResponse:
    session.execute(text("SELECT 1"))
    return get_health()
