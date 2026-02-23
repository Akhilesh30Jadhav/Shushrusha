import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import languages, scenarios, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="SUSHRUSHA API",
    description="Protocol-based ASHA training simulator backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Setup CORS for production
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(languages.router)
app.include_router(scenarios.router)
app.include_router(sessions.router)


@app.get("/")
async def root():
    return {"message": "SUSHRUSHA API is running", "version": "1.0.0"}
