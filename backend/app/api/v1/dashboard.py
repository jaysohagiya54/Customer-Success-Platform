from fastapi import APIRouter

from app.api.deps import CurrentUser, DashboardServiceDep
from app.schemas.dashboard import DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_metrics(service: DashboardServiceDep, _: CurrentUser) -> DashboardMetrics:
    return await service.get_metrics()
