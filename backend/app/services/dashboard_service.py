import asyncio

from app.core.cache import DASHBOARD_METRICS_KEY, CacheService
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import DashboardMetrics


class DashboardService:
    def __init__(self, repo: DashboardRepository, cache: CacheService):
        self.repo = repo
        self.cache = cache

    async def get_metrics(self) -> DashboardMetrics:
        cached = await self.cache.get_json(DASHBOARD_METRICS_KEY)
        if cached is not None:
            return DashboardMetrics(**cached, cached=True)

        # Run all four DB queries in parallel
        (
            (total_customers, by_status),
            (total_interactions, recent_count),
            (sentiment_breakdown, insights_generated),
            recent,
        ) = await asyncio.gather(
            self.repo.customer_counts(),
            self.repo.interaction_counts(),
            self.repo.sentiment_breakdown(),
            self.repo.recent_interactions(),
        )

        metrics = DashboardMetrics(
            total_customers=total_customers,
            customers_by_status=by_status,
            total_interactions=total_interactions,
            interactions_last_30_days=recent_count,
            sentiment_breakdown=sentiment_breakdown,
            insights_generated=insights_generated,
            recent_interactions=recent,
        )
        await self.cache.set_json(DASHBOARD_METRICS_KEY, metrics.model_dump(exclude={"cached"}, mode="json"))
        return metrics
