from dataclasses import dataclass
from typing import Any

from supabase import Client, create_client
from supabase_auth.errors import AuthApiError

from app.config import settings

EMAIL_ALREADY_REGISTERED_CODE = "user_already_exists"


class AuthProviderError(Exception):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass(frozen=True)
class AuthSession:
    user: dict[str, str]
    access_token: str
    refresh_token: str


@dataclass(frozen=True)
class Registration:
    user: dict[str, str]
    session: AuthSession | None


class SupabaseAuthService:
    def __init__(self, client: Client | None = None):
        self.client = client or create_client(
            settings.supabase_url, settings.supabase_anon_key
        )

    @staticmethod
    def _user_response(user: Any) -> dict[str, str]:
        if user is None or not getattr(user, "id", None) or not getattr(user, "email", None):
            raise AuthProviderError("O provedor não retornou um usuário válido")
        return {"id": str(user.id), "email": str(user.email)}

    def register(self, email: str, password: str) -> Registration:
        try:
            response = self.client.auth.sign_up(
                {"email": email, "password": password}
            )
        except AuthApiError as error:
            if error.code == EMAIL_ALREADY_REGISTERED_CODE:
                raise AuthProviderError("Este e-mail já está cadastrado", 409) from error
            raise AuthProviderError("Não foi possível criar a conta", 400) from error
        except Exception as error:
            raise AuthProviderError("Não foi possível criar a conta", 400) from error

        user = self._user_response(response.user)

        if response.session is None:
            return Registration(user=user, session=None)

        return Registration(
            user=user,
            session=AuthSession(
                user=user,
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
            ),
        )

    def login(self, email: str, password: str) -> AuthSession:
        try:
            response = self.client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except Exception as error:
            raise AuthProviderError("E-mail ou senha inválidos", 401) from error

        if response.session is None:
            raise AuthProviderError("O provedor não criou uma sessão", 401)
        return AuthSession(
            user=self._user_response(response.user),
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
        )

    def current_user(self, access_token: str) -> dict[str, str]:
        try:
            response = self.client.auth.get_user(access_token)
        except Exception as error:
            raise AuthProviderError("Sessão inválida", 401) from error
        return self._user_response(response.user)

    def logout(self, access_token: str, refresh_token: str) -> None:
        try:
            self.client.auth.set_session(access_token, refresh_token)
            self.client.auth.sign_out()
        except Exception as error:
            raise AuthProviderError("Não foi possível encerrar a sessão") from error