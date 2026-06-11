import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer, CustomerStatus
from app.models.interaction import Interaction


class CustomerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, customer_id: uuid.UUID) -> Customer | None:
        return await self.session.get(Customer, customer_id)

    async def get_by_email(self, email: str) -> Customer | None:
        result = await self.session.execute(select(Customer).where(Customer.email == email.lower()))
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        status: CustomerStatus | None = None,
    ) -> tuple[list[tuple[Customer, int]], int]:
        """Returns ([(customer, interaction_count)], total). Interaction counts come
        from a grouped subquery to avoid N+1 per-row counting."""
        filters = []
        if search:
            pattern = f"%{search.lower()}%"
            filters.append(
                or_(
                    func.lower(Customer.name).like(pattern),
                    func.lower(Customer.company).like(pattern),
                    func.lower(Customer.email).like(pattern),
                )
            )
        if status:
            filters.append(Customer.status == status)

        count_sq = (
            select(Interaction.customer_id, func.count(Interaction.id).label("cnt"))
            .group_by(Interaction.customer_id)
            .subquery()
        )

        query = (
            select(Customer, func.coalesce(count_sq.c.cnt, 0))
            .outerjoin(count_sq, count_sq.c.customer_id == Customer.id)
            .where(*filters)
            .order_by(Customer.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        total_query = select(func.count()).select_from(Customer).where(*filters)

        rows = (await self.session.execute(query)).all()
        total = (await self.session.execute(total_query)).scalar_one()
        return [(row[0], row[1]) for row in rows], total

    async def create(self, customer: Customer) -> Customer:
        self.session.add(customer)
        await self.session.commit()
        await self.session.refresh(customer)
        return customer

    async def save(self, customer: Customer) -> Customer:
        await self.session.commit()
        await self.session.refresh(customer)
        return customer

    async def delete(self, customer: Customer) -> None:
        await self.session.delete(customer)
        await self.session.commit()

    async def interaction_count(self, customer_id: uuid.UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(Interaction).where(Interaction.customer_id == customer_id)
        )
        return result.scalar_one()
