"""
Simple rate limiting to prevent quota exhaustion
"""

from typing import Dict
from datetime import datetime, timedelta
from collections import deque

from ..config.settings import settings


class RateLimiter:
    """Simple token bucket rate limiter"""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        """
        Initialize rate limiter

        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = {}

    def is_allowed(self, client_id: str = "default") -> bool:
        """
        Check if request is allowed under rate limit

        Args:
            client_id: Client identifier (IP, user ID, etc.)

        Returns:
            bool: True if request is allowed, False otherwise
        """
        now = datetime.now()

        # Initialize client if not exists
        if client_id not in self.requests:
            self.requests[client_id] = deque()

        # Clean up old requests outside the window
        cutoff_time = now - timedelta(seconds=self.window_seconds)
        while self.requests[client_id] and self.requests[client_id][0] < cutoff_time:
            self.requests[client_id].popleft()

        # Check if under limit
        if len(self.requests[client_id]) < self.max_requests:
            self.requests[client_id].append(now)
            return True

        return False

    def get_wait_time(self, client_id: str = "default") -> float:
        """
        Get seconds to wait before next request is allowed

        Args:
            client_id: Client identifier

        Returns:
            float: Seconds to wait (0 if allowed now)
        """
        if client_id not in self.requests or not self.requests[client_id]:
            return 0.0

        now = datetime.now()
        oldest_request = self.requests[client_id][0]
        wait_until = oldest_request + timedelta(seconds=self.window_seconds)

        if now >= wait_until:
            return 0.0

        return (wait_until - now).total_seconds()


# Global rate limiter instance (using settings for max requests)
# Conservative limit to stay well under Gemini free tier limits
query_rate_limiter = RateLimiter(
    max_requests=settings.max_requests_per_minute,
    window_seconds=60
)
