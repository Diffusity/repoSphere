from email.message import EmailMessage

import aiosmtplib

from src.config.config import (
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
)


async def send_email(to: str, subject: str, html_body: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD or not SMTP_FROM_EMAIL:
        return False

    message = EmailMessage()
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content("Please use an HTML-compatible email client.")
    message.add_alternative(html_body, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
        )
        return True
    except Exception:
        return False


async def send_verification_otp(to: str, otp: str, name: str) -> bool:
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Verify your RepoSphere account</h2>
      <p>Hi {name},</p>
      <p>Your verification code is:</p>
      <div style="font-size: 30px; letter-spacing: 8px; font-weight: bold;">{otp}</div>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
    """
    return await send_email(to, "RepoSphere verification code", html_body)


async def send_password_reset_otp(to: str, otp: str, name: str) -> bool:
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Reset your RepoSphere password</h2>
      <p>Hi {name},</p>
      <p>Your password reset code is:</p>
      <div style="font-size: 30px; letter-spacing: 8px; font-weight: bold;">{otp}</div>
      <p>If you did not request this, please ignore this email.</p>
    </div>
    """
    return await send_email(to, "RepoSphere reset code", html_body)
