import uuid
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, CustomerServiceDep
from app.models.customer import CustomerStatus
from app.schemas.common import Page
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=Page[CustomerOut])
async def list_customers(
    service: CustomerServiceDep,
    _: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    search: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[CustomerStatus | None, Query(alias="status")] = None,
) -> Page[CustomerOut]:
    return await service.list(page=page, page_size=page_size, search=search, status_filter=status_filter)


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(data: CustomerCreate, service: CustomerServiceDep, current_user: CurrentUser) -> CustomerOut:
    return await service.create(data, current_user)


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: uuid.UUID, service: CustomerServiceDep, _: CurrentUser) -> CustomerOut:
    return await service.get(customer_id)


@router.patch("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: uuid.UUID, data: CustomerUpdate, service: CustomerServiceDep, current_user: CurrentUser
) -> CustomerOut:
    return await service.update(customer_id, data, current_user)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: uuid.UUID, service: CustomerServiceDep, current_user: CurrentUser
) -> None:
    await service.delete(customer_id, current_user)
