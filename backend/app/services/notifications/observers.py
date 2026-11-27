from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.services.notifications.base import NotificationObserver
from app.services.notifications.events import NotificationEvent


class InAppNotificationObserver(NotificationObserver):
    def update(self, event: NotificationEvent, db: Session) -> None:
        values = {
            "recipient_id": event.recipient_id,
            "actor_id": event.actor_id,
            "type": event.type,
            "review_id": event.review_id,
            "read_at": None,
            "created_at": func.now(),
        }
        stmt = insert(Notification).values(**values)
        if event.review_id is None:
            stmt = stmt.on_conflict_do_update(
                index_elements=["recipient_id", "actor_id", "type"],
                index_where=Notification.review_id.is_(None),
                set_={"read_at": None, "created_at": func.now()},
            )
        else:
            stmt = stmt.on_conflict_do_update(
                index_elements=["recipient_id", "actor_id", "type", "review_id"],
                index_where=Notification.review_id.is_not(None),
                set_={"read_at": None, "created_at": func.now()},
            )
        db.execute(stmt)
        db.commit()
