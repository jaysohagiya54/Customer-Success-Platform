import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, InteractionServiceDep
from app.models.interaction import InteractionType
from app.schemas.common import Page
from app.schemas.interaction import InteractionCreate, InteractionOut, InteractionUpdate

router = APIRouter(prefix="/interactions", tags=["interactions"])


@router.get("", response_model=Page[InteractionOut])
async def list_interactions(
    service: InteractionServiceDep,
    _: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    customer_id: uuid.UUID | None = None,
    type_filter: Annotated[InteractionType | None, Query(alias="type")] = None,
    occurred_from: datetime | None = None,
    occurred_to: datetime | None = None,
) -> Page[InteractionOut]:
    return await service.list(
        page=page,
        page_size=page_size,
        customer_id=customer_id,
        type_filter=type_filter,
        occurred_from=occurred_from,
        occurred_to=occurred_to,
    )


@router.post("", response_model=InteractionOut, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    data: InteractionCreate, service: InteractionServiceDep, current_user: CurrentUser
) -> InteractionOut:
    return await service.create(data, current_user)


@router.get("/{interaction_id}", response_model=InteractionOut)
async def get_interaction(interaction_id: uuid.UUID, service: InteractionServiceDep, _: CurrentUser) -> InteractionOut:
    return await service.get(interaction_id)


@router.patch("/{interaction_id}", response_model=InteractionOut)
async def update_interaction(
    interaction_id: uuid.UUID, data: InteractionUpdate, service: InteractionServiceDep, current_user: CurrentUser
) -> InteractionOut:
    return await service.update(interaction_id, data, current_user)


@router.delete("/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interaction(
    interaction_id: uuid.UUID, service: InteractionServiceDep, current_user: CurrentUser
) -> None:
    await service.delete(interaction_id, current_user)


@router.post("/{interaction_id}/insight", response_model=InteractionOut)
async def generate_insight(
    interaction_id: uuid.UUID, service: InteractionServiceDep, _: CurrentUser
) -> InteractionOut:
    """Generate (or regenerate) the AI insight for an interaction's notes."""
    return await service.generate_insight(interaction_id)
