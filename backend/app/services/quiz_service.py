from datetime import datetime, timezone
from app.models.quiz import QuizAttempt, QuizKind

QUESTION_BANK = {
    "dsa": [
        {"question": "Binary search time complexity on a sorted array?",
         "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "correct_index": 1},
        {"question": "BFS is best for?",
         "options": ["Shortest path unweighted", "MST always", "Sorting", "Hashing"], "correct_index": 0},
    ],
    "os": [
        {"question": "Four Coffman conditions imply?",
         "options": ["Starvation", "Deadlock possible", "Paging", "Context switch"], "correct_index": 1},
    ],
    "system design": [
        {"question": "Cache-aside means?",
         "options": ["DB writes cache first", "App fills cache on miss", "Only CDN", "No invalidation"], "correct_index": 1},
    ],
}


def _topic_key(title: str) -> str:
    t = (title or "").lower()
    for k in QUESTION_BANK:
        if k in t:
            return k
    return "dsa"


def make_micro_quiz(task) -> dict:
    key = _topic_key(task.title)
    q = QUESTION_BANK[key][0]
    return {
        "question": q["question"],
        "options": q["options"],
        "correct_index": q["correct_index"],
        "topic": key,
        "kind": QuizKind.task_micro,
        "task_id": task.id,
    }