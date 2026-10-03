from functools import lru_cache

from fastapi import Cookie, Depends, HTTPException

from app.services.supabase_auth import AuthProviderError, SupabaseAuthService


@lru_cache
def get_auth_service() -> SupabaseAuthService:
    return SupabaseAuthService()


def get_current_user(
    access_token: str | None = Cookie(default=None),
    auth: SupabaseAuthService = Depends(get_auth_service),
) -> dict[str, str]:
    if not access_token:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    try:
        return auth.current_user(access_token)
    except AuthProviderError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from error