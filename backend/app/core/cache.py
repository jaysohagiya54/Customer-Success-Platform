import json
import logging
from typing import Any

import redis.asyncio as aioredis
from redis.exceptions import RedisError

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DASHBOARD_METRICS_KEY = "dashboard:metrics"
TOKEN_BLOCKLIST_PREFIX = "token:blocklist:"


class CacheService:
    """Thin Redis wrapper. Cache failures are logged and swallowed so a Redis
    outage degrades to uncached reads instead of taking the API down."""

    def __init__(self, client: aioredis.Redis):
        self._client = client

    async def get_json(self, key: str) -> Any | None:
        try:
            raw = await self._client.get(key)
            return json.loads(raw) if raw else None
        except (RedisError, json.JSONDecodeError) as exc:
            logger.warning("Cache read failed for %s: %s", key, exc)
            return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        try:
            ttl = ttl_seconds if ttl_seconds is not None else get_settings().cache_ttl_seconds
            await self._client.set(key, json.dumps(value, default=str), ex=ttl)
        except RedisError as exc:
            logger.warning("Cache write failed for %s: %s", key, exc)

    async def delete(self, *keys: str) -> None:
        try:
            if keys:
                await self._client.delete(*keys)
        except RedisError as exc:
            logger.warning("Cache delete failed for %s: %s", keys, exc)

    async def set_nx(self, key: str, value: str, ttl_seconds: int) -> None:
        """Set key only if it doesn't exist, with TTL. Used for token blocklist."""
        try:
            await self._client.set(key, value, ex=ttl_seconds, nx=True)
        except RedisError as exc:
            logger.warning("Cache setnx failed for %s: %s", key, exc)

    async def exists(self, key: str) -> bool:
        try:
            return bool(await self._client.exists(key))
        except RedisError as exc:
            logger.warning("Cache exists check failed for %s: %s", key, exc)
            return False

    async def ping(self) -> bool:
        try:
            return bool(await self._client.ping())
        except RedisError:
            return False


_cache: CacheService | None = None


def get_cache() -> CacheService:
    global _cache
    if _cache is None:
        client = aioredis.from_url(get_settings().redis_url, decode_responses=True)
        _cache = CacheService(client)
    return _cache


def set_cache(cache: CacheService) -> None:
    """Override the cache singleton (used by tests with fakeredis)."""
    global _cache
    _cache = cache
