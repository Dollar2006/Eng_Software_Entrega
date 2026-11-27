from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user_id
from app.models.game import Game
from app.models.notification import Notification
from app.models.profile import Profile
from app.models.review import Review
from app.schema.notification import (
    NotificationActorOut,
    NotificationOut,
    NotificationReviewOut,
    UnreadCountOut,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    q = (
        db.query(Notification, Profile, Review, Game)
        .outerjoin(Profile, Profile.user_id == Notification.actor_id)
        .outerjoin(Review, Review.id == Notification.review_id)
        .outerjoin(Game, Game.id == Review.game_id)
        .filter(Notification.recipient_id == user_id)
    )
    if unread_only:
        q = q.filter(Notification.read_at.is_(None))
    rows = q.order_by(Notification.created_at.desc(), Notification.id.desc()).offset(offset).limit(limit).all()

    result: list[NotificationOut] = []
    for notif, actor_profile, review, game in rows:
        actor_name = None
        actor_avatar = None
        actor_gamertag = None
        if actor_profile is not None:
            actor_name = (actor_profile.display_name or "").strip() or None
            actor_avatar = actor_profile.avatar
            actor_gamertag = actor_profile.gamertag

        review_out = None
        if notif.type == "review_like" and review is not None and game is not None:
            review_out = NotificationReviewOut(
                review_id=review.id,
                game_id=game.id,
                game_name=game.name,
                cover_url=game.cover_url,
            )

        result.append(
            NotificationOut(
                id=notif.id,
                type=notif.type,
                read_at=notif.read_at,
                created_at=notif.created_at,
                actor=NotificationActorOut(
                    user_id=notif.actor_id,
                    display_name=actor_name,
                    avatar=actor_avatar,
                    gamertag=actor_gamertag,
                ),
                review=review_out,
            )
        )
    return result


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.recipient_id == user_id, Notification.read_at.is_(None))
        .scalar()
        or 0
    )
    return {"unread_count": int(count)}


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.recipient_id == user_id)
        .first()
    )
    if notif is None:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    if notif.read_at is None:
        notif.read_at = func.now()
        db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id, Notification.read_at.is_(None))
        .update({"read_at": func.now()}, synchronize_session=False)
    )
    db.commit()
