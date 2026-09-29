# from datetime import date
# from typing import List, Dict
# from app.models.task import TaskStatus


# def generate_daily_tasks(profile: dict, roadmap_phases: list, current_phase: int) -> List[Dict]:
#     """
#     Simple rule-based daily task generator (MVP)
#     """
#     daily_hours = profile.get("daily_hours") or 2
#     preferred_style = (profile.get("preferred_style") or "video").lower()
#     weak_areas = [w.lower() for w in (profile.get("weak_areas") or [])]

#     # Decide how many tasks based on available time
#     if daily_hours <= 1.5:
#         num_tasks = 3
#     elif daily_hours <= 3:
#         num_tasks = 4
#     else:
#         num_tasks = 5

#     phase = roadmap_phases[current_phase] if current_phase < len(roadmap_phases) else roadmap_phases[-1]
#     focus_areas = phase.get("focus", ["DSA"])

#     tasks = []

#     # Task 1: Main learning
#     if "video" in preferred_style:
#         tasks.append({
#             "title": f"Watch: {focus_areas[0]} core concepts",
#             "description": f"Complete a focused video lesson on {focus_areas[0]}. Take short notes.",
#             "resource_url": "https://www.youtube.com/results?search_query=" + focus_areas[0].replace(" ", "+") + "+for+beginners",
#             "estimated_minutes": 25,
#             "xp_value": 15,
#             "order": 1
#         })
#     else:
#         tasks.append({
#             "title": f"Read: {focus_areas[0]} fundamentals",
#             "description": f"Read quality free material on {focus_areas[0]} and write key points.",
#             "resource_url": "https://www.geeksforgeeks.org/",
#             "estimated_minutes": 25,
#             "xp_value": 15,
#             "order": 1
#         })

#     # Task 2 & 3: Practice
#     tasks.append({
#         "title": "Solve 2 Easy problems",
#         "description": "Pick 2 easy problems related to today's topic. Focus on clean code.",
#         "resource_url": "https://leetcode.com/problemset/?difficulty=EASY",
#         "estimated_minutes": 30,
#         "xp_value": 20,
#         "order": 2
#     })

#     if num_tasks >= 4:
#         tasks.append({
#             "title": "Solve 1 Medium problem",
#             "description": "Attempt one medium problem. Even if you can't fully solve it, understand the approach.",
#             "resource_url": "https://leetcode.com/problemset/?difficulty=MEDIUM",
#             "estimated_minutes": 35,
#             "xp_value": 25,
#             "order": 3
#         })

#     # Weak area revision
#     if weak_areas:
#         weak = weak_areas[0]
#         tasks.append({
#             "title": f"Revise weak area: {weak}",
#             "description": f"Spend focused time revising {weak}. Write 5 key points from memory.",
#             "resource_url": None,
#             "estimated_minutes": 20,
#             "xp_value": 15,
#             "order": 4
#         })

#     # Final review task
#     if num_tasks >= 5 or not weak_areas:
#         tasks.append({
#             "title": "Daily Review & Notes",
#             "description": "Review everything you did today. Update your notes and mark confusing parts.",
#             "resource_url": None,
#             "estimated_minutes": 15,
#             "xp_value": 10,
#             "order": 5
#         })

#     return tasks[:num_tasks]




"""This Python function, generate_daily_tasks, is a rule-based task generator that acts as the core business logic (MVP) for creating tailored, daily learning actions. It links a user's onboarding profile constraints to the specific phase they are currently working on in their curriculum.
Here is a step-by-step breakdown of how the engine dynamically builds a day's itinerary:
------------------------------
## ⏱️ 1. Dynamic Sizing (Calculating num_tasks)
The function reads daily_hours from the user's profile and uses conditional rules to determine how many tasks they can reasonably complete in a day without burnout:

* $\le$ 1.5 hours: Assigns 3 tasks.
* 1.5 to 3 hours: Assigns 4 tasks.
* > 3 hours: Assigns 5 tasks.

------------------------------
## 📚 2. Connecting to the Learning Phase
It identifies the user's specific roadmap milestone using roadmap_phases[current_phase] and pulls out its specific focus_areas. If none are explicitly provided, it safely defaults to "DSA".
------------------------------
## 🛠️ 3. Rules-Based Adaptive Task Generation
The engine constructs an array of tasks sequentially based on user constraints:

* Task 1: Adaptive Learning Component:
* If the user prefers videos: It creates a task to watch a tutorial and generates a dynamic YouTube search link using the active topic (e.g., ...search_query=DSA+Basics+for+beginners).
   * If the user prefers reading: It creates a reading assignment pointing directly to GeeksforGeeks to explore structured engineering guides.
* Tasks 2 & 3: Hands-On Practice Components:
* It generates an unconditional LeetCode Easy practice block worth 20 XP.
   * If the user has enough available daily study hours (num_tasks >= 4), it dynamically appends a harder LeetCode Medium problem block worth a higher 25 XP.
* Task 4: Targeted Weakness Reinforcement:
* If a user has logged specific learning gaps, it intercepts the workflow and inserts a dedicated revision block focusing purely on their top problem area (e.g., "Revise weak area: system design").
* Task 5: Review & Consolidation:
* If the user has a long study block (num_tasks >= 5) or has no active weak areas, it attaches a wrap-up session to summarize notes.

------------------------------
## 🗃️ 4. Clean Slicing Output
At the very end, the function runs return tasks[:num_tasks]. This acts as an automated safety guard. No matter how many tasks were appended by the conditional checks, it strictly clips the list so the final output array never exceeds the calculated threshold for that user's daily study window.
------------------------------
Would you like to write a FastAPI service layer method that hooks this function up to automatically save these generated items into the DailyPlan and Task database tables?

"""

from typing import List, Dict
from app.services.adaptation_service import recent_task_stats


# High-quality free resources mapped by topic
FREE_RESOURCES = {
    "dsa": {
        "video": "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",  # Striver
        "practice_easy": "https://leetcode.com/problemset/?difficulty=EASY&page=1",
        "practice_medium": "https://leetcode.com/problemset/?difficulty=MEDIUM&page=1",
        "notes": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/"
    },
    "arrays": {
        "video": "https://www.youtube.com/watch?v=n60Dn0UsbEk",
        "practice": "https://leetcode.com/tag/array/",
        "notes": "https://takeuforward.org/category/array/"
    },
    "strings": {
        "video": "https://www.youtube.com/watch?v=tX-1qerWq6E",
        "practice": "https://leetcode.com/tag/string/",
        "notes": "https://takeuforward.org/category/string/"
    },
    "linked list": {
        "video": "https://www.youtube.com/watch?v=iRtLEoL-r-g",
        "practice": "https://leetcode.com/tag/linked-list/",
        "notes": "https://takeuforward.org/category/linked-list/"
    },
    "trees": {
        "video": "https://www.youtube.com/watch?v=QqtG_2d7Q0A",
        "practice": "https://leetcode.com/tag/tree/",
        "notes": "https://takeuforward.org/category/tree/"
    },
    "graphs": {
        "video": "https://www.youtube.com/watch?v=UeE1qAS5l4Y",
        "practice": "https://leetcode.com/tag/graph/",
        "notes": "https://takeuforward.org/category/graph/"
    },
    "dp": {
        "video": "https://www.youtube.com/watch?v=FfXoiwwnxFw",
        "practice": "https://leetcode.com/tag/dynamic-programming/",
        "notes": "https://takeuforward.org/category/dynamic-programming/"
    },
    "system design": {
        "video": "https://www.youtube.com/playlist?list=PLMCXHnyXnXu9F9Pv_1TqkZL28F8q4zWqX",
        "notes": "https://github.com/donnemartin/system-design-primer",
        "practice": "https://github.com/donnemartin/system-design-primer"
    },
    "os": {
        "video": "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
        "notes": "https://www.geeksforgeeks.org/operating-systems/"
    },
    "dbms": {
        "video": "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y",
        "notes": "https://www.geeksforgeeks.org/dbms/"
    },
    "python": {
        "video": "https://www.youtube.com/watch?v=kqtD5dpn9C8",
        "notes": "https://docs.python.org/3/tutorial/"
    }
}


def get_resource(topic: str, preferred_style: str = "video") -> Dict[str, str]:
    topic = topic.lower()
    for key in FREE_RESOURCES:
        if key in topic:
            res = FREE_RESOURCES[key]
            if preferred_style == "video" and "video" in res:
                return {"type": "video", "url": res["video"]}
            if "notes" in res:
                return {"type": "notes", "url": res["notes"]}
            return {"type": "practice", "url": res.get("practice") or res.get("notes")}
    
    # fallback
    return {
        "type": "video",
        "url": "https://www.youtube.com/results?search_query=" + topic.replace(" ", "+")
    }


def generate_daily_tasks(
    profile: dict,
    roadmap_phases: list,
    current_phase: int,
    stats: dict | None = None,
) -> list[dict]:
    stats = stats or {}
    daily_hours = profile.get("daily_hours") or 2.5
    preferred_style = (profile.get("preferred_style") or "video").lower()
    weak_areas = [w.lower() for w in (profile.get("weak_areas") or [])]
    skip_rate = stats.get("skip_rate") or 0
    completion = stats.get("completion_rate") or 0.5

    # Adapt load
    if skip_rate > 0.4 or daily_hours <= 1.5:
        num_tasks = 3
    elif completion > 0.8 and daily_hours >= 3:
        num_tasks = 5
    else:
        num_tasks = 4

    phase = roadmap_phases[current_phase] if current_phase < len(roadmap_phases) else roadmap_phases[-1]
    focus_areas = phase.get("focus") or ["DSA"]
    main_topic = focus_areas[0]

    # If they skip practice often, bias toward shorter learning + 1 practice
    prefer_short_practice = skip_rate > 0.35

    resource = get_resource(main_topic, preferred_style)
    tasks = [{
        "title": f"Learn: {main_topic}",
        "description": f"Focused study on {main_topic}. Write 5 bullets.",
        "resource_url": resource["url"],
        "estimated_minutes": 25 if prefer_short_practice else 30,
        "xp_value": 20,
        "order": 1,
        "quiz_topic": main_topic,
    }, {
        "title": f"Practice Easy ({main_topic})",
        "description": "Solve 2 easy problems. Clean code over speed.",
        "resource_url": "https://leetcode.com/problemset/?difficulty=EASY",
        "estimated_minutes": 25 if prefer_short_practice else 30,
        "xp_value": 20,
        "order": 2,
        "quiz_topic": main_topic,
    }]

    if num_tasks >= 4 and not prefer_short_practice:
        tasks.append({
            "title": "Attempt 1 Medium problem",
            "description": "One medium. Capture the pattern even if unsolved.",
            "resource_url": "https://leetcode.com/problemset/?difficulty=MEDIUM",
            "estimated_minutes": 35,
            "xp_value": 25,
            "order": 3,
            "quiz_topic": main_topic,
        })

    # Weak area / quiz misses get priority revision
    extra_weak = (stats.get("weak_quiz_topics") or []) + weak_areas
    if extra_weak and len(tasks) < num_tasks:
        weak = extra_weak[0]
        wr = get_resource(str(weak), preferred_style)
        tasks.append({
            "title": f"Revise weak area: {str(weak).title()}",
            "description": f"Revisit {weak}. One problem + 5-point recap.",
            "resource_url": wr["url"],
            "estimated_minutes": 20,
            "xp_value": 20,
            "order": 4,
            "quiz_topic": str(weak),
        })

    if len(tasks) < num_tasks:
        tasks.append({
            "title": "Daily Review & Notes",
            "description": "5 takeaways. Mark one doubt for tomorrow.",
            "resource_url": None,
            "estimated_minutes": 15,
            "xp_value": 10,
            "order": 5,
            "quiz_topic": main_topic,
        })

    return tasks[:num_tasks]