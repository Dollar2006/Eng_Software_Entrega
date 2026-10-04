import os

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql://user:password@localhost:5432/test")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

from fastapi.testclient import TestClient

from app.main import app
from app.routers import auth as auth_router
from app.services.supabase_auth import AuthProviderError


class FakeAuthService:
    def register(self, email: str, password: str) -> dict[str, str]:
        return {"id": "user-123", "email": email}

    def login(self, email: str, password: str):
        if password == "wrong-password":
            raise AuthProviderError("E-mail ou senha inválidos", 401)
        return type(
            "FakeSession",
            (),
            {
                "user": {"id": "user-123", "email": email},
                "access_token": "access-token",
                "refresh_token": "refresh-token",
            },
        )()

    def current_user(self, access_token: str) -> dict[str, str]:
        return {"id": "user-123", "email": "visitor@example.com"}

    def logout(self, access_token: str, refresh_token: str) -> None:
        return None


@pytest.fixture(autouse=True)
def fake_auth_service(monkeypatch):
    monkeypatch.setattr(auth_router, "auth_service", FakeAuthService())


@pytest.fixture
def client():
    return TestClient(app)


def test_register_creates_account(client):
    response = client.post(
        "/auth/register",
        json={"email": "visitor@example.com", "password": "StrongPassword123!"},
    )

    assert response.status_code == 201
    assert response.json() == {
        "user": {"id": "user-123", "email": "visitor@example.com"}
    }


def test_register_rejects_invalid_password(client):
    response = client.post(
        "/auth/register",
        json={"email": "visitor@example.com", "password": "short"},
    )

    assert response.status_code == 422


def test_login_sets_http_only_auth_cookies(client):
    response = client.post(
        "/auth/login",
        json={"email": "visitor@example.com", "password": "StrongPassword123!"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "user": {"id": "user-123", "email": "visitor@example.com"}
    }
    assert response.cookies.get("access_token") == "access-token"
    assert response.cookies.get("refresh_token") == "refresh-token"


def test_login_rejects_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={"email": "visitor@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_me_requires_an_authenticated_session(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_logout_clears_auth_cookies(client):
    response = client.post("/auth/logout")

    assert response.status_code == 204
    set_cookie_headers = response.headers.get_list("set-cookie")
    assert any("access_token=" in header and "Max-Age=0" in header for header in set_cookie_headers)
    assert any("refresh_token=" in header and "Max-Age=0" in header for header in set_cookie_headers)