from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.profile import Profile
from app.schema.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/users/me/profile", tags=["profile"])


def _current_user_id(user: dict[str, str]) -> UUID:
    """get_current_user devolve dict[str, str], entao o id chega como string.

    Um id que nao seja UUID indica token invalido, entao 401 em vez de deixar o
    Value estourar no db.get e virar 500.
    """
    try:
        return UUID(user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Sessão inválida") from error


def _get_or_create(db: Session, user_id: UUID) -> Profile:
    profile = db.get(Profile, user_id)
    if profile is None:
        profile = Profile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=ProfileOut)
def get_my_profile(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_or_create(db, _current_user_id(user))


@router.put("", response_model=ProfileOut)
def update_my_profile(
    payload: ProfileUpdate,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create(db, _current_user_id(user))
    profile.display_name = payload.display_name or None
    profile.bio = payload.bio or None
    profile.avatar = payload.avatar
    db.commit()
    db.refresh(profile)
    return profile