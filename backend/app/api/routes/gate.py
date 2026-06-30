from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.gate import issue_gate_token, verify_gate_password

router = APIRouter(prefix="/gate", tags=["gate"])


class GateVerifyRequest(BaseModel):
    password: str


@router.post("/verify", status_code=status.HTTP_204_NO_CONTENT)
def verify(payload: GateVerifyRequest, response: Response) -> None:
    if not verify_gate_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowe hasło.",
        )

    settings = get_settings()
    token = issue_gate_token()

    response.set_cookie(
        key=settings.gate_cookie_name,
        value=token,
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=settings.gate_token_ttl_days * 24 * 60 * 60,
        path="/",
    )
