import uuid
from datetime import datetime

from fastapi import HTTPException, status

from app.core.cache import DASHBOARD_METRICS_KEY, CacheService
from app.models.interaction import Interaction, InteractionType
from app.models.user import User, UserRole
from app.repositories.customer_repository import CustomerRepository
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.common import Page
from app.schemas.interaction import InteractionCreate, InteractionOut, InteractionUpdate
from app.services.insight_service import InsightService


class InteractionService:
    def __init__(
        self,
        interactions: InteractionRepository,
        customers: CustomerRepository,
        cache: CacheService,
        insights: InsightService,
    ):
        self.interactions = interactions
        self.customers = customers
        self.cache = cache
        self.insights = insights

    async def list(
        self,
        *,
        page: int,
        page_size: int,
        customer_id: uuid.UUID | None,
        type_filter: InteractionType | None,
        occurred_from: datetime | None,
        occurred_to: datetime | None,
    ) -> Page[InteractionOut]:
        items, total = await self.interactions.list(
            page=page,
            page_size=page_size,
            customer_id=customer_id,
            type=type_filter,
            occurred_from=occurred_from,
            occurred_to=occurred_to,
        )
        return Page.build([self._to_out(i) for i in items], total, page, page_size)

    async def get(self, interaction_id: uuid.UUID) -> InteractionOut:
        return self._to_out(await self._get_or_404(interaction_id))

    async def create(self, data: InteractionCreate, current_user: User) -> InteractionOut:
        if await self.customers.get(data.customer_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found")
        interaction = Interaction(
            customer_id=data.customer_id,
            type=data.type,
            title=data.title,
            notes=data.notes,
            occurred_at=data.occurred_at,
            created_by=current_user.id,
        )
        interaction = await self.interactions.create(interaction)
        # Auto-generate insight on creation; failure is non-fatal
        try:
            insight = await self.insights.generate(interaction)
            await self.interactions.upsert_insight(interaction, insight)
        except Exception:
            pass
        await self.cache.delete(DASHBOARD_METRICS_KEY)
        return self._to_out(await self._get_or_404(interaction.id))

    async def update(self, interaction_id: uuid.UUID, data: InteractionUpdate, current_user: User | None = None) -> InteractionOut:
        interaction = await self._get_or_404(interaction_id)
        if current_user is not None:
            self._check_ownership(interaction, current_user)
        notes_changed = data.notes is not None and data.notes != interaction.notes
        for field in ("type", "title", "notes", "occurred_at"):
            value = getattr(data, field)
            if value is not None:
                setattr(interaction, field, value)
        interaction = await self.interactions.save(interaction)
        # Only regenerate insight when notes content actually changed
        if notes_changed:
            try:
                insight = await self.insights.generate(interaction)
                await self.interactions.upsert_insight(interaction, insight)
            except Exception:
                pass
        await self.cache.delete(DASHBOARD_METRICS_KEY)
        return self._to_out(await self._get_or_404(interaction_id))

    async def delete(self, interaction_id: uuid.UUID, current_user: User) -> None:
        interaction = await self._get_or_404(interaction_id)
        self._check_ownership(interaction, current_user)
        await self.interactions.delete(interaction)
        await self.cache.delete(DASHBOARD_METRICS_KEY)

    async def generate_insight(self, interaction_id: uuid.UUID) -> InteractionOut:
        interaction = await self._get_or_404(interaction_id)
        insight = await self.insights.generate(interaction)
        await self.interactions.upsert_insight(interaction, insight)
        await self.cache.delete(DASHBOARD_METRICS_KEY)
        return self._to_out(await self._get_or_404(interaction_id))

    @staticmethod
    def _check_ownership(interaction: Interaction, user: User) -> None:
        if user.role == UserRole.ADMIN:
            return
        if interaction.created_by != user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this interaction")

    async def _get_or_404(self, interaction_id: uuid.UUID) -> Interaction:
        interaction = await self.interactions.get(interaction_id)
        if interaction is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Interaction not found")
        return interaction

    @staticmethod
    def _to_out(interaction: Interaction) -> InteractionOut:
        out = InteractionOut.model_validate(interaction)
        out.customer_name = interaction.customer.name if interaction.customer else None
        out.author_name = interaction.author.full_name if interaction.author else None
        return out
