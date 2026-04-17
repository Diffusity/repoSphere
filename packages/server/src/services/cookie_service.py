from fastapi import Request, Response

from src.config.config import AUTH_COOKIE_NAME, COOKIE_SECURE, JWT_EXPIRY_HOURS

_MAX_AGE_SECONDS = JWT_EXPIRY_HOURS * 3600


def set_auth_cookie(response: Response, token: str) -> Response:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=_MAX_AGE_SECONDS,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none" if COOKIE_SECURE else "lax",
        path="/",
    )
    return response


def clear_auth_cookie(response: Response) -> Response:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value="",
        max_age=0,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none" if COOKIE_SECURE else "lax",
        path="/",
    )
    return response


def get_auth_cookie(request: Request) -> str | None:
    return request.cookies.get(AUTH_COOKIE_NAME)
