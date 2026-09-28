from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from logging.config import dictConfig
from app.api.v1.auth import router as auth_router
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.profile import router as profile_router
from app.api.v1.roadmap import router as roadmap_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.gamification import router as gamification_router
from app.api.v1.progress import router as progress_router
from app.api.v1.exam_rescue import router as exam_rescue_router



# Later you will add more routers here
# from app.api.v1.auth import router as auth_router
# from app.api.v1.users import router as users_router

# ---------- Logging Setup ----------
def setup_logging():
    dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
            },
        },
        "root": {
            "level": "DEBUG" if settings.DEBUG else "INFO",
            "handlers": ["console"],
        },
    })

setup_logging()
logger = logging.getLogger(__name__)

# ---------- Create FastAPI App ----------
app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,      # Hide docs in production
    redoc_url=None,
)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Register Routers ----------
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(roadmap_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(gamification_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(exam_rescue_router, prefix="/api/v1")

# Later you will add:
# app.include_router(auth_router, prefix="/api/v1")
# app.include_router(users_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    logger.info(f"{settings.APP_NAME} started in {settings.APP_ENV} mode")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"{settings.APP_NAME} is shutting down")