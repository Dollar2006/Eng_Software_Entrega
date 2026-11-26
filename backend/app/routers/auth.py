from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import get_db
from app.models.profile import Profile
from app.schema.auth import AuthCredentials, AuthResponse, RegisterCredentials, UserResponse
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


def _ensure_gamertag_available(db: Session, gamertag: str | None) -> None:
    if gamertag is None:
        return
    taken = (
        db.query(Profile.user_id)
        .filter(func.lower(Profile.gamertag) == gamertag.lower())
        .first()
    )
    if taken is not None:
        raise HTTPException(status_code=409, detail="Essa gamertag já está em uso.")


def _set_profile_gamertag(db: Session, user_id: str, gamertag: str | None) -> None:
    if gamertag is None:
        return
    uid = UUID(user_id)
    taken = (
        db.query(Profile.user_id)
        .filter(func.lower(Profile.gamertag) == gamertag.lower(), Profile.user_id != uid)
        .first()
    )
    if taken is not None:
        raise HTTPException(status_code=409, detail="Essa gamertag já está em uso.")
    profile = db.get(Profile, uid)
    if profile is None:
        profile = Profile(user_id=uid, gamertag=gamertag)
        db.add(profile)
    else:
        profile.gamertag = gamertag
    db.commit()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(credentials: RegisterCredentials, response: Response, db: Session = Depends(get_db)):
    _ensure_gamertag_available(db, credentials.gamertag)
    try:
        registration = auth_service.register(credentials.email, credentials.password)
    except AuthProviderError as error:
        _raise_provider_error(error)

    _set_profile_gamertag(db, registration.user["id"], credentials.gamertag)

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