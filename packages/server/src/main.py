from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from src.config.config import CORS_ORIGINS, PORT
from src.db.database import init_db
from src.routes.auth import router as auth_router
from src.routes.repo import router as repo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: nothing special."""
    await init_db()
    print("Database tables created / verified")
    yield


app = FastAPI(
    title="RepoSphere Server",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "sessionId",
        "X-Session-ID",
        "session-id",
        "x-session-id",
        "x-sessionid",
    ],
    max_age=86400,
)


# --- Health checks ---
@app.get("/", response_class=PlainTextResponse)
async def root():
    return "Server is running"


@app.get("/api/v1/health", response_class=PlainTextResponse)
async def health():
    return "OK"


# --- Routes ---
app.include_router(auth_router)
app.include_router(repo_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=PORT, reload=True)
