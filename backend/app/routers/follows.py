from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.auth_user import auth_users
from app.models.follow import Follow
from app.models.profile import Profile
from app.schema.follow import FollowStatsOut, FollowStatusOut, FollowUserOut, UserSuggestionOut

router = APIRouter(prefix="/users", tags=["follows"])


def _current_user_id(user: dict[str, str]) -> UUID:
    try:
        return UUID(user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Sessão inválida") from error


def _ensure_user_exists(db: Session, user_id: UUID) -> None:
    found = db.execute(
        select(auth_users.c.id).where(auth_users.c.id == user_id)
    ).first()
    if found is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")


@router.post("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    me = _current_user_id(user)
    if user_id == me:
        raise HTTPException(status_code=400, detail="Você não pode seguir a si mesmo")
    _ensure_user_exists(db, user_id)

    # Idempotente: seguir quem já se segue não dá erro.
    stmt = (
        insert(Follow)
        .values(follower_id=me, followed_id=user_id)
        .on_conflict_do_nothing()
    )
    db.execute(stmt)
    db.commit()


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    me = _current_user_id(user)
    db.query(Follow).filter(
        Follow.follower_id == me, Follow.followed_id == user_id
    ).delete()
    db.commit()


@router.get("/{user_id}/follow", response_model=FollowStatusOut)
def get_follow_status(
    user_id: UUID,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    me = _current_user_id(user)
    exists = (
        db.query(Follow)
        .filter(Follow.follower_id == me, Follow.followed_id == user_id)
        .first()
    )
    return {"is_following": exists is not None}


@router.get("/{user_id}/follow-stats", response_model=FollowStatsOut)
def get_follow_stats(user_id: UUID, db: Session = Depends(get_db)):
    _ensure_user_exists(db, user_id)
    followers = (
        db.query(func.count())
        .select_from(Follow)
        .filter(Follow.followed_id == user_id)
        .scalar()
    )
    following = (
        db.query(func.count())
        .select_from(Follow)
        .filter(Follow.follower_id == user_id)
        .scalar()
    )
    return {"followers_count": followers, "following_count": following}


def _to_items(rows) -> list[FollowUserOut]:
    return [
        FollowUserOut(
            user_id=uid, followed_at=created_at, display_name=name, avatar=avatar
        )
        for uid, created_at, name, avatar in rows
    ]


@router.get("/{user_id}/followers", response_model=list[FollowUserOut])
def list_followers(
    user_id: UUID,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    _ensure_user_exists(db, user_id)
    rows = (
        db.query(
            Follow.follower_id, Follow.created_at, Profile.display_name, Profile.avatar
        )
        .outerjoin(Profile, Profile.user_id == Follow.follower_id)
        .filter(Follow.followed_id == user_id)
        .order_by(Follow.created_at.desc(), Follow.follower_id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return _to_items(rows)


@router.get("/{user_id}/following", response_model=list[FollowUserOut])
def list_following(
    user_id: UUID,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    _ensure_user_exists(db, user_id)
    rows = (
        db.query(
            Follow.followed_id, Follow.created_at, Profile.display_name, Profile.avatar
        )
        .outerjoin(Profile, Profile.user_id == Follow.followed_id)
        .filter(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc(), Follow.followed_id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return _to_items(rows)
@router.get("/suggestions", response_model=list[UserSuggestionOut])
def get_suggestions(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    me = _current_user_id(user)

    followers = (
        select(Follow.followed_id.label("uid"), func.count().label("n"))
        .group_by(Follow.followed_id)
        .subquery()
    )
    count = func.coalesce(followers.c.n, 0)
    already = select(Follow.followed_id).where(Follow.follower_id == me)

    rows = (
        db.query(Profile.user_id, Profile.display_name, Profile.avatar, count)
        .outerjoin(followers, followers.c.uid == Profile.user_id)
        .filter(Profile.user_id != me, ~Profile.user_id.in_(already))
        .order_by(count.desc(), Profile.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        UserSuggestionOut(
            user_id=uid, display_name=name, avatar=avatar, followers_count=n
        )
        for uid, name, avatar, n in rows
    ]