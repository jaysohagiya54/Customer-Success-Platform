import logging

from app.core.config import get_settings
from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


async def seed_admin() -> None:
    """Idempotently create the bootstrap admin account from env config."""
    settings = get_settings()
    async with async_session_maker() as session:
        repo = UserRepository(session)
        if await repo.get_by_email(settings.admin_email):
            return
        await repo.create(
            User(
                email=settings.admin_email.lower(),
                hashed_password=hash_password(settings.admin_password),
                full_name="Platform Admin",
                role=UserRole.ADMIN,
            )
        )
        logger.info("Seeded admin user %s", settings.admin_email)
