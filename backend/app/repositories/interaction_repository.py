import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.insight import AIInsight
from app.models.interaction import Interaction, InteractionType


class InteractionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, interaction_id: uuid.UUID) -> Interaction | None:
        result = await self.session.execute(
            select(Interaction)
            .options(selectinload(Interaction.insight))
            .where(Interaction.id == interaction_id)
            .execution_options(populate_existing=True)  # refresh insight after same-session upsert
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        page: int,
        page_size: int,
        customer_id: uuid.UUID | None = None,
        type: InteractionType | None = None,
        occurred_from: datetime | None = None,
        occurred_to: datetime | None = None,
    ) -> tuple[list[Interaction], int]:
        filters = []
        if customer_id:
            filters.append(Interaction.customer_id == customer_id)
        if type:
            filters.append(Interaction.type == type)
        if occurred_from:
            filters.append(Interaction.occurred_at >= occurred_from)
        if occurred_to:
            filters.append(Interaction.occurred_at <= occurred_to)

        query = (
            select(Interaction)
            .options(selectinload(Interaction.insight))
            .where(*filters)
            .order_by(Interaction.occurred_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        total_query = select(func.count()).select_from(Interaction).where(*filters)

        items = list((await self.session.execute(query)).scalars().unique().all())
        total = (await self.session.execute(total_query)).scalar_one()
        return items, total

    async def create(self, interaction: Interaction) -> Interaction:
        self.session.add(interaction)
        await self.session.commit()
        return await self.get(interaction.id)  # re-fetch with relationships loaded

    async def save(self, interaction: Interaction) -> Interaction:
        await self.session.commit()
        return await self.get(interaction.id)

    async def delete(self, interaction: Interaction) -> None:
        await self.session.delete(interaction)
        await self.session.commit()

    async def upsert_insight(self, interaction: Interaction, insight: AIInsight) -> AIInsight:
        if interaction.insight is not None:
            await self.session.delete(interaction.insight)
            await self.session.flush()
        insight.interaction_id = interaction.id
        self.session.add(insight)
        await self.session.commit()
        await self.session.refresh(insight)
        return insight
