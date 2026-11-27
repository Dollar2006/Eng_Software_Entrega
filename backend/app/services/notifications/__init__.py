from functools import lru_cache

from app.services.notifications.base import NotificationDispatcher, NotificationObserver
from app.services.notifications.events import FollowCreated, NotificationEvent, ReviewLiked
from app.services.notifications.observers import InAppNotificationObserver


@lru_cache
def get_notification_dispatcher() -> NotificationDispatcher:
    dispatcher = NotificationDispatcher()
    dispatcher.register(InAppNotificationObserver())
    return dispatcher


__all__ = [
    "FollowCreated",
    "InAppNotificationObserver",
    "NotificationDispatcher",
    "NotificationEvent",
    "NotificationObserver",
    "ReviewLiked",
    "get_notification_dispatcher",
]
