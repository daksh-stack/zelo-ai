from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.roadmap import Roadmap
from app.schemas.roadmap import RoadmapResponse, GenerateRoadmapRequest
from app.services.roadmap_service import generate_roadmap_for_user

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])


@router.post("/generate", response_model=RoadmapResponse, status_code=status.HTTP_201_CREATED)
async def generate_roadmap(
    body: GenerateRoadmapRequest = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get profile
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete onboarding first")

    # Deactivate old roadmaps
    result = await db.execute(
        select(Roadmap).where(Roadmap.user_id == current_user.id, Roadmap.is_active == True)
    )
    old_roadmaps = result.scalars().all()
    for r in old_roadmaps:
        r.is_active = False

    # Decide target role
    target_role = (body.target_role if body and body.target_role else None)
    if not target_role:
        target_role = (profile.target_roles[0] if profile.target_roles else "SDE")

    profile_data = {
        "daily_hours": profile.daily_hours,
        "weak_areas": profile.weak_areas or [],
        "skill_levels": profile.skill_levels or {},
        "preferred_style": profile.preferred_style
    }

    roadmap_data = generate_roadmap_for_user(profile_data, target_role)

    new_roadmap = Roadmap(
        user_id=current_user.id,
        title=roadmap_data["title"],
        target_role=roadmap_data["target_role"],
        phases=roadmap_data["phases"],
        current_phase=0,
        is_active=True
    )

    db.add(new_roadmap)
    await db.commit()
    await db.refresh(new_roadmap)
    return new_roadmap


@router.get("/current", response_model=RoadmapResponse)
async def get_current_roadmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id, Roadmap.is_active == True)
        .order_by(Roadmap.created_at.desc())
    )
    roadmap = result.scalar_one_or_none()

    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found. Generate one first.")

    return roadmap


@router.get("/templates")
async def list_templates():
    return {
        "templates": [
            {"id": "sde", "label": "SDE / Backend"},
            {"id": "frontend", "label": "Frontend"},
            {"id": "data", "label": "Data / ML"},
            {"id": "devops", "label": "DevOps / Cloud"},
            {"id": "core", "label": "Core ECE/EEE"},
        ]
    }























"""This code is a FastAPI router file containing two asynchronous API endpoints (POST and GET) to handle your roadmap features. It ties together everything we’ve looked at so far: the database models, the Pydantic schemas, and the rule-based generation logic.
Here is a step-by-step breakdown of how each endpoint works:
------------------------------
## 📥 1. POST /roadmaps/generate (Creating a Roadmap)
This endpoint handles requests from a user who wants to generate a new custom roadmap. It returns a 201 Created status code and outputs the formatted RoadmapResponse.
## Step A: Authentication & Dependencies

* It protects the endpoint by making sure the user is logged in (Depends(get_current_user)).
* It injects an asynchronous database session (Depends(get_db)).

## Step B: Profile Check

* It searches the Profile database table to find an onboarding entry matching the user's ID.
* Error Handling: If no profile is found, it immediately stops and returns an error: "Please complete onboarding first".

## Step C: Archiving Old Roadmaps

* It searches for any existing active roadmaps (is_active == True) belonging to that user.
* It loops through them and switches them to False. This ensures the user only ever has one active roadmap running at a time.

## Step D: Determining the Goal & Compiling Data

* It evaluates the incoming JSON body. If the user didn't specify a target_role, it falls back to the first target role saved in their profile. If that's empty too, it defaults to "SDE".
* It packs up relevant profile variables (daily_hours, weak_areas, etc.) into a clean dictionary block called profile_data.

## Step E: Running the Logic & Saving to Database

* It invokes your generate_roadmap_for_user() engine function to build the title and phase objects.
* It constructs a brand-new Roadmap database record with the initialized settings.
* It inserts the record (db.add), saves it to the database (db.commit), reloads the fresh ID (db.refresh), and returns it to the client.

------------------------------
## 📤 2. GET /roadmaps/current (Fetching the Active Roadmap)
This endpoint is what the frontend calls whenever the user loads their primary dashboard.

* It searches the Roadmap table looking exclusively for a record linked to the logged-in user where is_active == True.
* It sorts by the most recent creation timestamp (order_by(Roadmap.created_at.desc())) just in case.
* Error Handling: If it finds nothing, it triggers a 404 Not Found telling the client to generate one first. Otherwise, it sends back the roadmap JSON block.

------------------------------
Would you like to write a unit test for this file using pytest and httpx, or do you need help testing this endpoint right inside your Swagger UI?

"""