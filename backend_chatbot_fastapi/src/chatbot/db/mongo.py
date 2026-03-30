"""
MongoDB connection using Motor (async driver).

connect_db() is called on FastAPI startup.
close_db() is called on FastAPI shutdown.
get_db() is used as a FastAPI dependency in route handlers.
"""

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.server_api import ServerApi
from src.chatbot.config.settings import settings
import logging

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient = None


async def connect_db():
    global _client
    logger.info("Connecting to MongoDB...")
    _client = AsyncIOMotorClient(settings.mongodb_uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
    # Ping to confirm the connection is valid before accepting traffic
    await _client.admin.command("ping")
    logger.info(f"Connected to MongoDB — database: {settings.mongodb_db_name}")


async def close_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return _client[settings.mongodb_db_name]
