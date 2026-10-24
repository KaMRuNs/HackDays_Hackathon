from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import MODEL_NAME
from .db import init_db
from .model_client import ModelError, ModelTimeout
from .routers import gaps, learn, viva


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="VivaBridge", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ModelTimeout)
async def model_timeout(_: Request, exc: ModelTimeout):
    return JSONResponse(status_code=504, content={"detail": str(exc)})


@app.exception_handler(ModelError)
async def model_error(_: Request, exc: ModelError):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


app.include_router(learn.router)
app.include_router(viva.router)
app.include_router(gaps.router)
