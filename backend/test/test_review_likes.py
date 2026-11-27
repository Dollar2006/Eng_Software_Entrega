import os
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException

os.environ.setdefault("DATABASE_URL", "postgresql://user:password@localhost:5432/test")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

from app.routers.review_likes import like_review


def test_user_cannot_like_own_review():
    db = Mock()
    db.get.return_value = SimpleNamespace(id=1, user_id="author-id", likes=0)

    with pytest.raises(HTTPException) as error:
        like_review(1, db, {"id": "author-id"})

    assert error.value.status_code == 403
    db.scalar.assert_not_called()
    db.commit.assert_not_called()


def test_liking_an_already_liked_review_does_not_increment_count():
    review = SimpleNamespace(id=1, user_id="author-id", likes=2)
    db = Mock()
    db.get.return_value = review
    db.scalar.return_value = None

    result = like_review(1, db, {"id": "liker-id"})

    assert result.likes == 2
    assert result.liked_by_me is True
    db.execute.assert_not_called()
    db.commit.assert_called_once()
