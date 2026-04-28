import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from src.config.config import CORS_ORIGINS, PORT
from src.db.database import init_db
from src.routes.auth import router as auth_router
from src.routes.repo import router as repo_router
from src.routes.issues import router as issues_router
from src.routes.pulls import router as pulls_router


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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a proper JSONResponse."""
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"success": False, "detail": "Internal server error"},
    )
    # Manually add CORS headers to ensure they are present even on errors
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(issues_router)
app.include_router(repo_router)
app.include_router(pulls_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=PORT, reload=True)
