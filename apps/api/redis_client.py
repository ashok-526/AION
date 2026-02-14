"""Redis client for caching, pub/sub, and circuit breaker state."""

from __future__ import annotations

import json
import time
from datetime import datetime
from typing import Optional

import redis.asyncio as aioredis

from apps.api.config import get_settings
from packages.shared.constants import (
    CACHE_TTL_FEED,
    CIRCUIT_BREAKER_COOLDOWN,
    CIRCUIT_BREAKER_THRESHOLD,
)

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = aioredis.from_url(
            settings.redis_url, decode_responses=True, max_connections=20
        )
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


# ── Cache helpers ────────────────────────────────────────────────
async def cache_get(key: str) -> Optional[dict]:
    r = await get_redis()
    raw = await r.get(f"cache:{key}")
    if raw:
        return json.loads(raw)
    return None


async def cache_set(key: str, data: dict, ttl: int = CACHE_TTL_FEED):
    r = await get_redis()
    await r.set(f"cache:{key}", json.dumps(data, default=str), ex=ttl)


async def cache_get_with_stale(key: str, stale_ttl: int = 600) -> tuple[Optional[dict], bool]:
    """Get cached data, returning stale data if fresh cache expired.

    Returns (data, is_stale). Stale data kept for stale_ttl seconds beyond normal TTL.
    """
    r = await get_redis()
    raw = await r.get(f"cache:{key}")
    if raw:
        return json.loads(raw), False
    raw_stale = await r.get(f"stale:{key}")
    if raw_stale:
        return json.loads(raw_stale), True
    return None, False


async def cache_set_with_stale(key: str, data: dict, ttl: int = CACHE_TTL_FEED, stale_ttl: int = 600):
    r = await get_redis()
    serialized = json.dumps(data, default=str)
    pipe = r.pipeline()
    pipe.set(f"cache:{key}", serialized, ex=ttl)
    pipe.set(f"stale:{key}", serialized, ex=ttl + stale_ttl)
    await pipe.execute()


# ── Circuit Breaker ──────────────────────────────────────────────
class CircuitBreaker:
    """Per-provider circuit breaker using Redis state."""

    def __init__(self, provider_name: str):
        self.provider = provider_name
        self.key = f"cb:{provider_name}"

    async def _state(self) -> dict:
        r = await get_redis()
        raw = await r.get(self.key)
        if raw:
            return json.loads(raw)
        return {"failures": 0, "state": "closed", "opened_at": None, "last_error": None}

    async def _save(self, state: dict):
        r = await get_redis()
        await r.set(self.key, json.dumps(state, default=str), ex=CIRCUIT_BREAKER_COOLDOWN * 10)

    async def is_open(self) -> bool:
        state = await self._state()
        if state["state"] == "open":
            opened = state.get("opened_at", 0)
            if time.time() - opened > CIRCUIT_BREAKER_COOLDOWN:
                state["state"] = "half_open"
                await self._save(state)
                return False
            return True
        return False

    async def record_success(self):
        state = await self._state()
        state["failures"] = 0
        state["state"] = "closed"
        await self._save(state)

    async def record_failure(self, error: str = ""):
        state = await self._state()
        state["failures"] = state.get("failures", 0) + 1
        state["last_error"] = error
        if state["failures"] >= CIRCUIT_BREAKER_THRESHOLD:
            state["state"] = "open"
            state["opened_at"] = time.time()
        await self._save(state)

    async def get_status(self) -> dict:
        state = await self._state()
        return {
            "name": self.provider,
            "status": state["state"],
            "failures": state["failures"],
            "last_error": state.get("last_error"),
            "cooldown_until": (
                datetime.fromtimestamp(state["opened_at"] + CIRCUIT_BREAKER_COOLDOWN).isoformat()
                if state.get("opened_at") and state["state"] == "open"
                else None
            ),
        }


# ── Streams (replaces Pub/Sub for SSE) ───────────────────────────
async def stream_add(channel: str, data: dict, maxlen: int = 1000) -> str:
    """Append an event to a Redis Stream. Returns the stream entry ID."""
    r = await get_redis()
    stream_key = f"stream:{channel}"
    payload = json.dumps(data, default=str)
    entry_id = await r.xadd(
        stream_key,
        {"payload": payload},
        maxlen=maxlen,
        approximate=True,
    )
    return entry_id


async def stream_read(channel: str, last_id: str = "$", block_ms: int = 15000) -> list[tuple[str, str]]:
    """Blocking read from a Redis Stream. Returns list of (entry_id, payload_json)."""
    r = await get_redis()
    stream_key = f"stream:{channel}"
    result = await r.xread({stream_key: last_id}, block=block_ms, count=10)
    entries = []
    if result:
        for _stream_name, messages in result:
            for msg_id, fields in messages:
                entries.append((msg_id, fields.get("payload", "{}")))
    return entries


async def stream_read_since(channel: str, last_id: str) -> list[tuple[str, str]]:
    """Non-blocking read of all entries after last_id. For replaying missed events on reconnect."""
    r = await get_redis()
    stream_key = f"stream:{channel}"
    result = await r.xread({stream_key: last_id}, count=100)
    entries = []
    if result:
        for _stream_name, messages in result:
            for msg_id, fields in messages:
                entries.append((msg_id, fields.get("payload", "{}")))
    return entries


async def publish_event(channel: str, event_type: str, data: dict):
    """Publish an event to a Redis Stream (backward-compatible wrapper)."""
    payload = {"event": event_type, "channel": channel, "data": data}
    await stream_add(channel, payload)


# ── Single-flight refresh ────────────────────────────────────────
async def acquire_refresh_lock(key: str, ttl: int = 30) -> bool:
    r = await get_redis()
    return await r.set(f"lock:{key}", "1", nx=True, ex=ttl)


async def release_refresh_lock(key: str):
    r = await get_redis()
    await r.delete(f"lock:{key}")
