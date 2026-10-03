from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileUpdate(BaseModel):
    display_name: str = Field(max_length=50)
    bio: str = Field(max_length=280)
    avatar: str | None = None

    @field_validator("display_name", "bio", mode="before")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        # Espelha o .trim() do profileSchema.ts: o corte acontece antes de contar
        # os caracteres, senao "   " passaria por um max de 50 no front e tomaria
        # 422 aqui.
        return value.strip() if isinstance(value, str) else value

    @field_validator("display_name")
    @classmethod
    def check_display_name(cls, value: str) -> str:
        # Vazio e valido: sem nome, o perfil mostra a parte antes do @ do e-mail.
        if len(value) == 1:
            raise ValueError("O nome precisa ter pelo menos 2 caracteres.")
        return value


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    display_name: str | None = None
    bio: str | None = None
    avatar: str | None = None