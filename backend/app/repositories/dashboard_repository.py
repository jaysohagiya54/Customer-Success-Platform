from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.insight import AIInsight
from app.models.interaction import Interaction


class DashboardRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def customer_counts(self) -> tuple[int, dict[str, int]]:
        rows = (
            await self.session.execute(select(Customer.status, func.count()).group_by(Customer.status))
        ).all()
        by_status = {status.value: count for status, count in rows}
        return sum(by_status.values()), by_status

    async def interaction_counts(self) -> tuple[int, int]:
        total = (await self.session.execute(select(func.count()).select_from(Interaction))).scalar_one()
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        recent = (
            await self.session.execute(
                select(func.count()).select_from(Interaction).where(Interaction.occurred_at >= cutoff)
            )
        ).scalar_one()
        return total, recent

    async def sentiment_breakdown(self) -> tuple[dict[str, int], int]:
        rows = (
            await self.session.execute(select(AIInsight.sentiment, func.count()).group_by(AIInsight.sentiment))
        ).all()
        breakdown = {sentiment.value: count for sentiment, count in rows}
        return breakdown, sum(breakdown.values())

    async def recent_interactions(self, limit: int = 5) -> list[dict]:
        rows = (
            await self.session.execute(
                select(
                    Interaction.id,
                    Interaction.title,
                    Customer.name,
                    Interaction.type,
                    AIInsight.sentiment,
                    Interaction.occurred_at,
                )
                .join(Customer, Customer.id == Interaction.customer_id)
                .outerjoin(AIInsight, AIInsight.interaction_id == Interaction.id)
                .order_by(Interaction.occurred_at.desc())
                .limit(limit)
            )
        ).all()
        return [
            {
                "id": str(row[0]),
                "title": row[1],
                "customer_name": row[2],
                "type": row[3].value,
                "sentiment": row[4].value if row[4] else None,
                "occurred_at": row[5],
            }
            for row in rows
        ]
