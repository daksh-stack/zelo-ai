import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from app.models.roadmap import Roadmap
from app.models.task import DailyPlan, Task
from app.models.gamification import Streak, UserXP
from app.models.exam_rescue import ExamSession, ExamTopicPlan
from app.models.skill_path import InterviewSession, InterviewAnswer, QuickRevisionCard, InterviewSessionStatus, InterviewDomain
from alembic import context
from app.models.quiz import QuizAttempt

# --------------------------------------------------
# Import your project settings and Base
# --------------------------------------------------
from app.core.config import settings
from app.core.database import Base

# Import all models here later so Alembic can detect them
from app.models.user import User
from app.models.profile import Profile
# from app.models.roadmap import Roadmap
# etc.

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --------------------------------------------------
# Force Alembic to use the DATABASE_URL from .env
# --------------------------------------------------
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL.replace("%", "%%")
)

# --------------------------------------------------
# Target metadata (your tables)
# --------------------------------------------------
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode using async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run the async migrations."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()