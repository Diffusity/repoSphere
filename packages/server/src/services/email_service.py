from dataclasses import dataclass
from email.message import EmailMessage
from html import escape

import aiosmtplib

from src.config.config import (
    OTP_EXPIRY_MINUTES,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
)


@dataclass(frozen=True)
class RenderedEmail:
    html: str
    text: str


def _display_name(name: str) -> str:
    cleaned = (name or "").strip()
    return cleaned if cleaned else "there"


def _render_auth_email(
    *,
    eyebrow: str,
    title: str,
    intro: str,
    code_label: str,
    otp: str,
    support_copy: str,
    safety_copy: str,
    recipient_name: str,
) -> RenderedEmail:
    safe_eyebrow = escape(eyebrow)
    safe_title = escape(title)
    safe_intro = escape(intro)
    safe_code_label = escape(code_label)
    safe_otp = escape(otp)
    safe_support = escape(support_copy)
    safe_safety = escape(safety_copy)
    safe_name = escape(_display_name(recipient_name))
    expiry_copy = f"This code expires in {OTP_EXPIRY_MINUTES} minutes."

    html = f"""\
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#020617;color:#e2e8f0;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      {safe_title} for RepoSphere.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#020617;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:linear-gradient(180deg,#0f172a 0%,#020617 100%);border:1px solid rgba(148,163,184,0.16);border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(135deg,rgba(14,165,233,0.16),rgba(15,23,42,0));border-bottom:1px solid rgba(148,163,184,0.12);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left">
                      <div style="display:inline-block;padding:10px 14px;border-radius:18px;border:1px solid rgba(125,211,252,0.18);background:rgba(14,165,233,0.1);color:#bae6fd;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">
                        {safe_eyebrow}
                      </div>
                      <div style="margin-top:22px;font-size:14px;color:#93c5fd;letter-spacing:0.22em;text-transform:uppercase;">
                        RepoSphere
                      </div>
                      <h1 style="margin:12px 0 0;font-size:32px;line-height:1.15;color:#f8fafc;font-weight:700;">
                        {safe_title}
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#e2e8f0;">
                  Hi {safe_name},
                </p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#cbd5e1;">
                  {safe_intro}
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 20px;">
                  <tr>
                    <td style="padding:22px;border-radius:24px;border:1px solid rgba(125,211,252,0.18);background:rgba(15,23,42,0.88);text-align:center;">
                      <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#7dd3fc;margin-bottom:12px;">
                        {safe_code_label}
                      </div>
                      <div style="font-size:34px;line-height:1;letter-spacing:0.42em;font-weight:700;color:#f8fafc;padding-left:0.42em;">
                        {safe_otp}
                      </div>
                      <div style="margin-top:14px;font-size:13px;line-height:1.6;color:#94a3b8;">
                        {escape(expiry_copy)}
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#cbd5e1;">
                  {safe_support}
                </p>
                <p style="margin:0;font-size:14px;line-height:1.75;color:#94a3b8;">
                  {safe_safety}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;border-top:1px solid rgba(148,163,184,0.12);">
                <div style="font-size:13px;line-height:1.7;color:#64748b;">
                  This message was sent by RepoSphere to help secure your account and keep browser and CLI access in sync.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    text = "\n".join(
        [
            f"RepoSphere - {title}",
            "",
            f"Hi {_display_name(recipient_name)},",
            "",
            intro,
            "",
            f"{code_label}: {otp}",
            expiry_copy,
            "",
            support_copy,
            safety_copy,
            "",
            "This message was sent by RepoSphere to help secure your account and keep browser and CLI access in sync.",
        ]
    )

    return RenderedEmail(html=html, text=text)


def render_verification_email(name: str, otp: str) -> RenderedEmail:
    return _render_auth_email(
        eyebrow="Verify account",
        title="Verify your RepoSphere account",
        intro="Use the code below to confirm your email address and continue setting up your account.",
        code_label="Verification code",
        otp=otp,
        support_copy="Once verified, you can jump back into RepoSphere and finish account setup without restarting the flow.",
        safety_copy="If you did not request this verification code, you can safely ignore this email.",
        recipient_name=name,
    )


def render_password_reset_email(name: str, otp: str) -> RenderedEmail:
    return _render_auth_email(
        eyebrow="Reset password",
        title="Reset your RepoSphere password",
        intro="Use the code below to set a new password and regain access to your RepoSphere account.",
        code_label="Reset code",
        otp=otp,
        support_copy="After you enter this code, RepoSphere will let you choose a new password and sign back in.",
        safety_copy="If you did not request a password reset, you can ignore this email and your password will remain unchanged.",
        recipient_name=name,
    )


async def send_email(to: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD or not SMTP_FROM_EMAIL:
        return False

    message = EmailMessage()
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text_body or "Please use an HTML-compatible email client.")
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
    rendered = render_verification_email(name, otp)
    return await send_email(to, "RepoSphere verification code", rendered.html, rendered.text)


async def send_password_reset_otp(to: str, otp: str, name: str) -> bool:
    rendered = render_password_reset_email(name, otp)
    return await send_email(to, "RepoSphere reset code", rendered.html, rendered.text)
