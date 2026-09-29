import os

os.environ.setdefault("DATABASE_URL", "postgresql://user:password@localhost:5432/test")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_register_creates_account():
    response = client.post(
        "/auth/register",
        json={"email": "visitor@example.com", "password": "StrongPassword123!"},
    )

    assert response.status_code == 201
    assert response.json() == {
        "user": {"id": "user-123", "email": "visitor@example.com"}
    }


def test_register_rejects_invalid_password():
    response = client.post(
        "/auth/register",
        json={"email": "visitor@example.com", "password": "short"},
    )

    assert response.status_code == 422


def test_login_sets_http_only_auth_cookies():
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


def test_login_rejects_invalid_credentials():
    response = client.post(
        "/auth/login",
        json={"email": "visitor@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_me_requires_an_authenticated_session():
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_logout_clears_auth_cookies():
    response = client.post("/auth/logout")

    assert response.status_code == 204
    assert response.cookies.get("access_token") == ""
    assert response.cookies.get("refresh_token") == ""