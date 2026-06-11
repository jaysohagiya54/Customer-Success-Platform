import uuid

from fastapi import HTTPException, status

from app.core.cache import DASHBOARD_METRICS_KEY, CacheService
from app.models.customer import Customer, CustomerStatus
from app.models.user import User, UserRole
from app.repositories.customer_repository import CustomerRepository
from app.schemas.common import Page
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate


class CustomerService:
    def __init__(self, customers: CustomerRepository, cache: CacheService):
        self.customers = customers
        self.cache = cache

    async def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        status_filter: CustomerStatus | None,
    ) -> Page[CustomerOut]:
        rows, total = await self.customers.list(
            page=page, page_size=page_size, search=search, status=status_filter
        )
        items = [self._to_out(customer, count) for customer, count in rows]
        return Page.build(items, total, page, page_size)

    async def get(self, customer_id: uuid.UUID) -> CustomerOut:
        customer = await self._get_or_404(customer_id)
        count = await self.customers.interaction_count(customer_id)
        return self._to_out(customer, count)

    async def create(self, data: CustomerCreate, current_user: User) -> CustomerOut:
        if await self.customers.get_by_email(data.email):
            raise HTTPException(status.HTTP_409_CONFLICT, detail="A customer with this email already exists")
        customer = Customer(
            name=data.name,
            company=data.company,
            email=data.email.lower(),
            phone=data.phone,
            status=data.status,
            owner_id=current_user.id,
        )
        customer = await self.customers.create(customer)
        await self._invalidate()
        return self._to_out(customer, 0)

    async def update(self, customer_id: uuid.UUID, data: CustomerUpdate, current_user: User) -> CustomerOut:
        customer = await self._get_or_404(customer_id)
        self._check_ownership(customer, current_user)
        if data.email and data.email.lower() != customer.email:
            if await self.customers.get_by_email(data.email):
                raise HTTPException(status.HTTP_409_CONFLICT, detail="A customer with this email already exists")
            customer.email = data.email.lower()
        for field in ("name", "company", "phone", "status"):
            value = getattr(data, field)
            if value is not None:
                setattr(customer, field, value)
        customer = await self.customers.save(customer)
        await self._invalidate()
        count = await self.customers.interaction_count(customer_id)
        return self._to_out(customer, count)

    async def delete(self, customer_id: uuid.UUID, current_user: User) -> None:
        customer = await self._get_or_404(customer_id)
        self._check_ownership(customer, current_user)
        await self.customers.delete(customer)
        await self._invalidate()

    async def _get_or_404(self, customer_id: uuid.UUID) -> Customer:
        customer = await self.customers.get(customer_id)
        if customer is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return customer

    @staticmethod
    def _check_ownership(customer: Customer, user: User) -> None:
        if user.role == UserRole.ADMIN:
            return
        if customer.owner_id != user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this customer")

    async def _invalidate(self) -> None:
        await self.cache.delete(DASHBOARD_METRICS_KEY)

    @staticmethod
    def _to_out(customer: Customer, interaction_count: int) -> CustomerOut:
        out = CustomerOut.model_validate(customer)
        out.owner_name = customer.owner.full_name if customer.owner else None
        out.interaction_count = interaction_count
        return out
