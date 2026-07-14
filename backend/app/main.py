from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import router as main_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize services (vector store, etc.)
    yield
    # Shutdown: teardown resources


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI 算命",
        description="AI-powered fortune-telling backend service",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS middleware – allow all origins for development convenience
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include all routers
    app.include_router(main_router, prefix="/api")

    return app


app = create_app()


@app.get("/")
def root():
    return {
        "service": "AI 算命",
        "version": "0.1.0",
        "status": "running",
    }
