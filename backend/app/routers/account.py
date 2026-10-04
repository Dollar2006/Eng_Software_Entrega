from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.schema.account import ChangeEmailIn, ChangePasswordIn, EmailChangeOut
from app.services.account_service import AccountService
from app.services.supabase_auth import AuthProviderError

router = APIRouter(prefix="/users/me/account", tags=["account"])
account_service = AccountService()


def _raise_provider_error(error: AuthProviderError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.detail) from error


@router.put("/email", response_model=EmailChangeOut)
def change_email(
    body: ChangeEmailIn,
    user: dict[str, str] = Depends(get_current_user),
):
    if body.new_email.strip().lower() == user["email"].lower():
        raise HTTPException(
            status_code=422, detail="O novo e-mail é igual ao atual."
        )

    try:
        result = account_service.change_email(
            user["id"], user["email"], body.current_password, body.new_email.strip()
        )
    except AuthProviderError as error:
        _raise_provider_error(error)

    return {"email": result.email, "pending_email": result.pending_email}


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: ChangePasswordIn,
    user: dict[str, str] = Depends(get_current_user),
):
    try:
        account_service.change_password(
            user["email"], body.current_password, body.new_password
        )
    except AuthProviderError as error:
        _raise_provider_error(error)