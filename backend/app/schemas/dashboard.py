from datetime import datetime

from pydantic import BaseModel


class RecentInteraction(BaseModel):
    id: str
    title: str
    customer_name: str
    type: str
    sentiment: str | None
    occurred_at: datetime


class DashboardMetrics(BaseModel):
    total_customers: int
    customers_by_status: dict[str, int]
    total_interactions: int
    interactions_last_30_days: int
    sentiment_breakdown: dict[str, int]
    insights_generated: int
    recent_interactions: list[RecentInteraction]
    cached: bool = False
