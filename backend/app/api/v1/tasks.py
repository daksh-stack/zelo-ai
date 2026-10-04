from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime, timezone

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.roadmap import Roadmap
from app.models.task import DailyPlan, Task, TaskStatus
from app.schemas.task import DailyTasksResponse, TaskResponse, CompleteTaskRequest
from app.services.task_generator import generate_daily_tasks
from app.services.adaptation_service import recent_task_stats
from app.services.task_generator import generate_daily_tasks
from app.services.habit_service import sync_challenge_progress, grant_badges

router = APIRouter(prefix="/tasks", tags=["Daily Tasks"])


@router.get("/today", response_model=DailyTasksResponse)
async def get_today_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today().isoformat()

    # Check if plan already exists
    result = await db.execute(
        select(DailyPlan).where(
            DailyPlan.user_id == current_user.id,
            DailyPlan.date == today
        )
    )
    plan = result.scalar_one_or_none()

    if plan:
        # Return existing tasks
        result = await db.execute(
            select(Task).where(Task.daily_plan_id == plan.id).order_by(Task.order)
        )
        tasks = result.scalars().all()
        return {"date": today, "tasks": tasks}

    # Need to generate new tasks
    # Get profile
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(400, "Complete onboarding first")

    # Get active roadmap
    result = await db.execute(
        select(Roadmap).where(Roadmap.user_id == current_user.id, Roadmap.is_active == True)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(400, "Generate a roadmap first")

    profile_data = {
        "daily_hours": profile.daily_hours,
        "weak_areas": profile.weak_areas or [],
        "preferred_style": profile.preferred_style
    }

    stats = await recent_task_stats(db, current_user.id)

    generated = generate_daily_tasks(
    profile_data,
    roadmap.phases,
    roadmap.current_phase,
    stats=stats,
    )

    # Create plan + tasks
    plan = DailyPlan(user_id=current_user.id, date=today)
    db.add(plan)
    await db.flush()  # get plan.id

    task_objects = []
    for t in generated:
        task = Task(
            daily_plan_id=plan.id,
            user_id=current_user.id,
            title=t["title"],
            description=t.get("description"),
            resource_url=t.get("resource_url"),
            estimated_minutes=t.get("estimated_minutes", 30),
            xp_value=t.get("xp_value", 10),
            order=t.get("order", 0),
            status=TaskStatus.pending
        )
        db.add(task)
        task_objects.append(task)

    await db.commit()

    # Refresh
    for t in task_objects:
        await db.refresh(t)

    return {"date": today, "tasks": task_objects}


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    body: CompleteTaskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(404, "Task not found")

    if task.status == TaskStatus.done:
        raise HTTPException(400, "Task already completed")

    task.status = body.status

    if body.status in [TaskStatus.done, TaskStatus.partial]:
        task.completed_at = datetime.now(timezone.utc)

        # Award XP + update streak only when fully done
        if body.status == TaskStatus.done:
            from app.services.gamification_service import process_task_completion
            await process_task_completion(db, current_user.id, task.xp_value)

    await db.commit()
    await db.refresh(task)

    # Phase 4: update daily/weekly challenges + badges
    await sync_challenge_progress(db, current_user.id)
    await grant_badges(db, current_user.id)

    return task




"""This Python script is a FastAPI router file containing two asynchronous endpoints that manage a user's daily planner system. It bridges the rule-based task generator with your database, ensuring tasks are created once per day and can be marked as complete.
------------------------------
## 📅 1. GET /tasks/today (Get or Create Daily Schedule)
This endpoint handles what happens when a user opens their dashboard. It uses a "get-or-create" pattern so it never generates duplicate tasks for the same calendar date.
## Path A: The Plan Already Exists

   1. It grabs today's date in YYYY-MM-DD format.
   2. It queries the DailyPlan table for a record matching the logged-in user and today's date.
   3. If it finds one, it immediately fetches all related Task objects, orders them sequentially, and returns them to the frontend.

## Path B: First Visit of the Day (Task Generation)
If no plan exists yet, the script kicks off the generation pipeline:

   1. Safety Checks: It verifies that the user has a Profile and an active Roadmap. If either is missing, it raises a 400 Bad Request error.
   2. Task Construction: It feeds the user's profile and current roadmap phase data into your generate_daily_tasks rule engine.
   3. Database Insertion:
   * It instantiates a new DailyPlan object.
      * It runs await db.flush(). This reserves an ID for the plan from the database without completing the transaction yet, which is needed to link the tasks.
      * It loops through the engine's output, creates individual Task database objects, links them to the new plan's ID, and saves everything with await db.commit().
   
------------------------------
## ✅ 2. POST /tasks/{task_id}/complete (Updating Progress)
This endpoint runs when a user clicks a button to change a task's status (e.g., ticking off an array question).

   1. Authentication Guard: It searches for the target task using both the task_id and the current_user.id. This prevents users from altering tasks belonging to someone else.
   2. Validation Errors:
   * If the task doesn't exist, it throws a 404 Not Found.
      * If the task status is already set to done, it throws a 400 Bad Request to avoid double-processing.
   3. State Mutation:
   * It updates the task's status to the incoming request payload (done, partial, skipped).
      * If the task is marked as done or partial, it automatically appends a timezone-aware timestamp (timezone.utc) to the completed_at field.
   4. Finalize: It commits the change, refreshes the row details, and returns the updated task structure.

------------------------------
Would you like to write a gamification service that listens to this complete endpoint to dynamically increase the user's total profile XP and level when a task hits done?

"""