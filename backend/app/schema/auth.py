from pydantic import BaseModel, EmailStr, Field


class AuthCredentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: str
    email: EmailStr


class AuthResponse(BaseModel):
    user: UserResponse