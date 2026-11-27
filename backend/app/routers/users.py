from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.profile import Profile
from app.schema.profile import PublicProfileOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{gamertag}/profile", response_model=PublicProfileOut)
def get_public_profile(gamertag: str, db: Session = Depends(get_db)):
    profile = (
        db.query(Profile)
        .filter(func.lower(Profile.gamertag) == gamertag.lower())
        .first()
    )
    if profile is None or not profile.gamertag:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return PublicProfileOut.model_validate(profile)