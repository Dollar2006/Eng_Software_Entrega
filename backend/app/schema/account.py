from pydantic import BaseModel, Field


class ChangeEmailIn(BaseModel):
    # Regex simples em vez de EmailStr, que exigiria o pacote email-validator.
    new_email: str = Field(
        max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )
    current_password: str = Field(min_length=1, max_length=128)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class EmailChangeOut(BaseModel):
    email: str
    # Preenchido quando o Supabase exige confirmar o novo endereço por e-mail.
    pending_email: str | None = None
