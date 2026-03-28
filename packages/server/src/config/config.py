import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "6020"))
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@localhost:5432/reposphere",
)
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "secret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
    return [FRONTEND_URL.rstrip("/")]


CORS_ORIGINS = _cors_origins()
