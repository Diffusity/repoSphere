from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_BCRYPT_MAX_BYTES = 72


def validate_password_for_bcrypt(password: str) -> None:
    if len(password.encode("utf-8")) > _BCRYPT_MAX_BYTES:
        raise ValueError("Password is too long. Maximum supported length is 72 bytes.")


def hash_password(plain: str) -> str:
    validate_password_for_bcrypt(plain)
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    # Prevent backend exceptions on oversize inputs and return auth failure.
    if len(plain.encode("utf-8")) > _BCRYPT_MAX_BYTES:
        return False
    return _pwd_context.verify(plain, hashed)
