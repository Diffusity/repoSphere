import ssl as _ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from src.config.config import DATABASE_URL

# Neon requires SSL; detect automatically from the URL
_connect_args = {}
if "neon.tech" in DATABASE_URL:
    ssl_ctx = _ssl.create_default_context()
    _connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,        # detect stale connections (Neon may drop idle)
    pool_size=5,               # keep small; Neon has its own pooler
    max_overflow=10,
    pool_recycle=300,           # recycle connections every 5 min
    connect_args=_connect_args,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore
    """FastAPI dependency that yields an async DB session."""
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables (for development; use Alembic in production)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
