from dataclasses import dataclass

from supabase import Client, create_client
from supabase_auth.errors import AuthApiError

from app.config import settings
from app.services.supabase_auth import AuthProviderError

# código de erro do Supabase -> (mensagem, status HTTP)
_UPDATE_ERRORS = {
    "email_exists": ("Este e-mail já está em uso.", 409),
    "email_address_invalid": ("Este endereço não foi aceito. Use um e-mail real, com domínio que receba mensagens.", 422),
    "weak_password": ("A nova senha é muito fraca. Misture letras, números e símbolos.", 422),
    "same_password": ("A nova senha deve ser diferente da atual.", 422),
    "over_email_send_rate_limit": ("Muitas tentativas. Aguarde um pouco e tente de novo.", 429),
    "over_request_rate_limit": ("Muitas tentativas. Aguarde um pouco e tente de novo.", 429),
}


@dataclass(frozen=True)
class EmailChange:
    email: str
    pending_email: str | None


class AccountService:
    """Troca de e-mail e senha da conta no Supabase.

    Cada operação usa um cliente novo: o cliente guarda a sessão em memória, e
    compartilhar um só entre usuários misturaria as sessões.
    """

    def _reauthenticate(self, email: str, current_password: str) -> Client:
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        try:
            response = client.auth.sign_in_with_password(
                {"email": email, "password": current_password}
            )
        except AuthApiError as error:
            if error.code == "invalid_credentials":
                raise AuthProviderError("Senha atual incorreta.", 400) from error
            message, status_code = _UPDATE_ERRORS.get(
                error.code, ("Não foi possível confirmar sua senha.", 502)
            )
            raise AuthProviderError(message, status_code) from error
        except Exception as error:
            raise AuthProviderError("Não foi possível confirmar sua senha.", 502) from error

        if response.session is None:
            raise AuthProviderError("Senha atual incorreta.", 400)
        return client

    def _update(self, client: Client, attributes: dict, fallback: str):
        try:
            return client.auth.update_user(attributes)
        except AuthApiError as error:
            message, status_code = _UPDATE_ERRORS.get(error.code, (fallback, 502))
            raise AuthProviderError(message, status_code) from error
        except Exception as error:
            raise AuthProviderError(fallback, 502) from error

    def change_email(
        self,
        user_id: str,
        current_email: str,
        current_password: str,
        new_email: str,
    ) -> EmailChange:
        # A senha atual continua sendo conferida antes de qualquer troca.
        client = self._reauthenticate(current_email, current_password)

        if not settings.supabase_service_role_key:
            # Caminho padrão: com "Confirm email" desligado no Supabase, o e-mail
            # muda na hora. Com ele ligado, fica pendente até confirmar o link.
            response = self._update(
                client, {"email": new_email}, "Não foi possível atualizar o e-mail."
            )
            user = response.user
            return EmailChange(
                email=str(user.email),
                pending_email=getattr(user, "new_email", None) or None,
            )

        # Com a chave de administrador configurada, aplica na hora sem depender
        # da configuração do projeto (e sem link de confirmação).
        admin = create_client(settings.supabase_url, settings.supabase_service_role_key)
        try:
            response = admin.auth.admin.update_user_by_id(
                user_id, {"email": new_email, "email_confirm": True}
            )
        except AuthApiError as error:
            message, status_code = _UPDATE_ERRORS.get(
                error.code, ("Não foi possível atualizar o e-mail.", 502)
            )
            raise AuthProviderError(message, status_code) from error
        except Exception as error:
            raise AuthProviderError("Não foi possível atualizar o e-mail.", 502) from error

        return EmailChange(email=str(response.user.email), pending_email=None)

    def change_password(
        self, current_email: str, current_password: str, new_password: str
    ) -> None:
        client = self._reauthenticate(current_email, current_password)
        self._update(
            client, {"password": new_password}, "Não foi possível atualizar a senha."
        )