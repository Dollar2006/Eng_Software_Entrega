import logging
from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.services.notifications.events import NotificationEvent

logger = logging.getLogger(__name__)


class NotificationObserver(ABC):
    @abstractmethod
    def update(self, event: NotificationEvent, db: Session) -> None:
        raise NotImplementedError


class NotificationDispatcher:
    def __init__(self) -> None:
        self._observers: list[NotificationObserver] = []

    def register(self, observer: NotificationObserver) -> None:
        self._observers.append(observer)

    def notify(self, event: NotificationEvent, db: Session) -> None:
        for observer in self._observers:
            try:
                observer.update(event, db)
            except Exception:
                logger.exception(
                    "notification observer failed",
                    extra={
                        "observer": type(observer).__name__,
                        "event_type": event.type,
                        "recipient_id": str(event.recipient_id),
                    },
                )
