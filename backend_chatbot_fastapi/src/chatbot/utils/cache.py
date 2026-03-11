"""
Simple caching utilities to reduce API calls
"""

from typing import Any, Dict, Optional
from datetime import datetime, timedelta
import hashlib
import json

from ..config.settings import settings


class SimpleCache:
    """Simple in-memory cache with TTL (time-to-live)"""

    def __init__(self, ttl_seconds: int = 300):
        """
        Initialize cache

        Args:
            ttl_seconds: Time-to-live in seconds (default: 5 minutes)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds

    def _get_cache_key(self, key: str) -> str:
        """Generate cache key hash"""
        return hashlib.md5(key.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache if not expired

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        cache_key = self._get_cache_key(key)

        if cache_key not in self.cache:
            return None

        entry = self.cache[cache_key]

        # Check if expired
        if datetime.now() > entry['expires_at']:
            del self.cache[cache_key]
            return None

        return entry['value']

    def set(self, key: str, value: Any) -> None:
        """
        Set value in cache with TTL

        Args:
            key: Cache key
            value: Value to cache
        """
        cache_key = self._get_cache_key(key)

        self.cache[cache_key] = {
            'value': value,
            'expires_at': datetime.now() + timedelta(seconds=self.ttl_seconds),
            'created_at': datetime.now()
        }

    def clear(self) -> None:
        """Clear all cached entries"""
        self.cache.clear()

    def size(self) -> int:
        """Get number of cached entries"""
        # Clean up expired entries first
        self._cleanup_expired()
        return len(self.cache)

    def _cleanup_expired(self) -> None:
        """Remove expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self.cache.items()
            if now > entry['expires_at']
        ]

        for key in expired_keys:
            del self.cache[key]


# Global cache instances (using settings for TTL)
query_cache = SimpleCache(ttl_seconds=settings.query_cache_ttl)
corpus_cache = SimpleCache(ttl_seconds=settings.corpus_cache_ttl)
