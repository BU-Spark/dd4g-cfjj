"""
Chat CRUD routes — mirrors the Node.js /api/chats router.

All routes require a valid Clerk JWT. User isolation is enforced:
each user can only read/modify their own chats.
"""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from src.chatbot.auth.clerk import ClerkUser, get_current_user
from src.chatbot.db.mongo import get_db

router = APIRouter(prefix="/api/chats", tags=["chats"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serialisable dict."""
    doc["_id"] = str(doc["_id"])
    return doc


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CreateChatRequest(BaseModel):
    message: str


class AppendMessageRequest(BaseModel):
    role: str   # "user" | "assistant"
    content: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("")
async def list_chats(
    user: ClerkUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[dict[str, Any]]:
    """Return all chats for the current user, newest first."""
    cursor = db.chats.find(
        {"userId": user.user_id},
        {"title": 1, "createdAt": 1, "updatedAt": 1},
    ).sort("updatedAt", -1)

    return [_serialize(doc) async for doc in cursor]


@router.post("", status_code=201)
async def create_chat(
    body: CreateChatRequest,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    """Create a new chat seeded with the user's first message."""
    now = _now()
    doc = {
        "userId": user.user_id,
        "title": body.message[:60],
        "messages": [{"role": "user", "content": body.message, "createdAt": now}],
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db.chats.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/{chat_id}")
async def get_chat(
    chat_id: str,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    """Return a single chat with all messages."""
    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat["userId"] != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _serialize(chat)


@router.put("/{chat_id}/messages")
async def append_message(
    chat_id: str,
    body: AppendMessageRequest,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    """Append a message to an existing chat."""
    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat["userId"] != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    new_message = {"role": body.role, "content": body.content, "createdAt": _now()}
    now = _now()

    await db.chats.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$push": {"messages": new_message},
            "$set": {"updatedAt": now},
        },
    )

    # Return the updated document
    updated = await db.chats.find_one({"_id": ObjectId(chat_id)})
    return _serialize(updated)


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    """Delete a chat."""
    chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat["userId"] != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.chats.delete_one({"_id": ObjectId(chat_id)})
    return {"success": True}
