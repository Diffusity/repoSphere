import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import OTP_EXPIRY_MINUTES
from src.db.models.otp import OTP
from src.db.models.user import User


def generate_otp() -> str:
    return f"{secrets.randbelow(1000000):06d}"


async def create_otp(db: AsyncSession, user_id: uuid.UUID, purpose: str) -> str:
    await db.execute(
        update(OTP)
        .where(and_(OTP.user_id == user_id, OTP.purpose == purpose, OTP.used.is_(False)))
        .values(used=True)
    )

    code = generate_otp()
    otp_row = OTP(
        user_id=user_id,
        code=code,
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    db.add(otp_row)
    await db.commit()
    return code


async def verify_otp(
    db: AsyncSession, email: str, otp: str, purpose: str
) -> User | None:
    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()
    if not user:
        return None

    otp_result = await db.execute(
        select(OTP)
        .where(
            and_(
                OTP.user_id == user.id,
                OTP.code == otp,
                OTP.purpose == purpose,
                OTP.used.is_(False),
            )
        )
        .order_by(OTP.created_at.desc())
    )
    otp_entry = otp_result.scalar_one_or_none()
    if not otp_entry:
        return None

    if otp_entry.expires_at < datetime.now(timezone.utc):
        return None

    otp_entry.used = True
    await db.commit()
    await db.refresh(user)
    return user
