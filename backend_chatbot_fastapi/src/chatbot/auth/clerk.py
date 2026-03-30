"""
Clerk JWT authentication for FastAPI.

How it works:
1. Frontend sends Clerk JWT in Authorization: Bearer <token> header
2. We extract the issuer from the token (without verifying yet)
3. We fetch Clerk's public JWKS from {issuer}/.well-known/jwks.json
4. We verify the token signature using those keys
5. We return a ClerkUser with user_id, is_admin, and raw claims

Usage:
    # Any authenticated user
    @app.get("/some-route")
    async def handler(user: ClerkUser = Depends(get_current_user)):
        return {"user_id": user.user_id}

    # Admin only
    @app.post("/admin-route")
    async def handler(user: ClerkUser = Depends(require_admin)):
        ...
"""

import logging
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

logger = logging.getLogger(__name__)

security = HTTPBearer()

# Cache one PyJWKClient per Clerk issuer URL so we don't re-fetch JWKS on every request.
# In practice there's only ever one issuer, so this stays at size 1.
_jwks_clients: dict[str, PyJWKClient] = {}


def _get_jwks_client(issuer: str) -> PyJWKClient:
    if issuer not in _jwks_clients:
        jwks_url = f"{issuer}/.well-known/jwks.json"
        logger.debug(f"Creating JWKS client for {jwks_url}")
        _jwks_clients[issuer] = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwks_clients[issuer]


def _verify_token(token: str) -> dict:
    """Verify a Clerk JWT and return its claims."""
    # Decode without verification first — we just need the issuer to find the right JWKS
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
    except jwt.DecodeError as e:
        raise HTTPException(status_code=401, detail=f"Malformed token: {e}")

    issuer = unverified.get("iss")
    if not issuer:
        raise HTTPException(status_code=401, detail="Token missing issuer claim")

    jwks_client = _get_jwks_client(issuer)

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
    except Exception as e:
        logger.error(f"JWKS key lookup failed: {e}")
        raise HTTPException(status_code=401, detail="Unable to verify token signature")

    claims = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        options={"verify_aud": False},
        issuer=issuer,
    )
    return claims


@dataclass
class ClerkUser:
    user_id: str
    is_admin: bool
    claims: dict


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> ClerkUser:
    """
    FastAPI dependency — verifies the Clerk JWT and returns the current user.
    Raises 401 if the token is missing, expired, or invalid.
    """
    try:
        claims = _verify_token(credentials.credentials)
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except Exception as e:
        logger.error(f"Unexpected auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")

    # Clerk puts publicMetadata in the JWT session claims under "publicMetadata"
    # (configured in Clerk dashboard → Sessions → Customize session token)
    role = claims.get("publicMetadata", {}).get("role", "")
    is_admin = role == "admin"

    return ClerkUser(user_id=user_id, is_admin=is_admin, claims=claims)


async def require_admin(user: ClerkUser = Depends(get_current_user)) -> ClerkUser:
    """
    FastAPI dependency — same as get_current_user but also enforces admin role.
    Raises 403 if the user is not an admin.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
