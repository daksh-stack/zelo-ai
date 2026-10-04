from datetime import date

DAILY_CHALLENGES = [
    {
        "code": "daily_finish_all",
        "title": "Clear the board",
        "description": "Mark all of today's Skill Path tasks done.",
        "target": 1,
        "xp_reward": 25,
    },
    {
        "code": "daily_no_skip",
        "title": "No skips",
        "description": "Complete or partial at least 1 task. Skip none today.",
        "target": 1,
        "xp_reward": 15,
    },
]

WEEKLY_CHALLENGES = [
    {
        "code": "weekly_5_days",
        "title": "Five-day campaign",
        "description": "Have a daily plan on 5 different days this week.",
        "target": 5,
        "xp_reward": 60,
    },
    {
        "code": "weekly_focus_3",
        "title": "Focus warrior",
        "description": "Finish 3 focus sessions this week.",
        "target": 3,
        "xp_reward": 40,
    },
]

BADGE_DEFS = [
    {"code": "first_blood", "title": "First Blood", "description": "Complete your first daily task.", "min_tasks": 1},
    {"code": "streak_7", "title": "7-Day Flame", "description": "Hold a 7-day streak.", "min_streak": 7},
    {"code": "streak_30", "title": "30-Day Flame", "description": "Hold a 30-day streak.", "min_streak": 30},
    {"code": "xp_500", "title": "Apprentice", "description": "Reach 500 XP.", "min_xp": 500},
    {"code": "xp_2000", "title": "Campaigner", "description": "Reach 2000 XP.", "min_xp": 2000},
    {"code": "focus_10", "title": "Deep Work", "description": "Complete 10 focus sessions.", "min_focus": 10},
]


def week_key(d: date | None = None) -> str:
    d = d or date.today()
    iso = d.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"