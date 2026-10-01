from fastapi import APIRouter, Cookie, HTTPException, Response, status

from app.config import settings
from app.schema.auth import AuthCredentials, AuthResponse, UserResponse
from app.services.supabase_auth import AuthProviderError, SupabaseAuthService


router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = SupabaseAuthService()


def _raise_provider_error(error: AuthProviderError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.detail) from error


def _set_session_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    cookie_options = {
        "httponly": True,
        "secure": settings.auth_cookie_secure,
        "samesite": settings.auth_cookie_samesite,
        "path": "/",
    }
    response.set_cookie("access_token", access_token, max_age=3600, **cookie_options)
    response.set_cookie(
        "refresh_token", refresh_token, max_age=60 * 60 * 24 * 30, **cookie_options
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(credentials: AuthCredentials, response: Response):
    try:
        registration = auth_service.register(credentials.email, credentials.password)
    except AuthProviderError as error:
        _raise_provider_error(error)

    if registration.session is not None:
        session = registration.session
        _set_session_cookies(response, session.access_token, session.refresh_token)
        return {"user": registration.user}

    return {
        "user": registration.user,
        "email_confirmation_required": True,
    }


@router.post("/login", response_model=AuthResponse)
def login(credentials: AuthCredentials, response: Response):
    try:
        session = auth_service.login(credentials.email, credentials.password)
    except AuthProviderError as error:
        _raise_provider_error(error)
    _set_session_cookies(response, session.access_token, session.refresh_token)
    return {"user": session.user}


@router.post("/refresh", response_model=AuthResponse)
def refresh(response: Response, refresh_token: str | None = Cookie(default=None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    try:
        session = auth_service.refresh(refresh_token)
    except AuthProviderError as error:
        _raise_provider_error(error)
    _set_session_cookies(response, session.access_token, session.refresh_token)
    return {"user": session.user}


@router.get("/me", response_model=AuthResponse)
def me(access_token: str | None = Cookie(default=None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    try:
        user = auth_service.current_user(access_token)
    except AuthProviderError as error:
        _raise_provider_error(error)
    return {"user": user}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    access_token: str | None = Cookie(default=None),
    refresh_token: str | None = Cookie(default=None),
):
    if access_token and refresh_token:
        try:
            auth_service.logout(access_token, refresh_token)
        except AuthProviderError:
            pass
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")