from datetime import datetime, timezone
from app.content.exam_subjects import SUBJECTS, normalize_subject
from app.models.exam_rescue import TopicImportance


def _pick_topics(subject_key: str, hours: float, strategy: str) -> list[dict]:
    bank = SUBJECTS.get(subject_key)
    if not bank:
        # fallback generic skeleton
        return [{
            "title": f"{subject_key} core revision",
            "unit_name": "General",
            "importance": "must_know",
            "notes_summary": "No curated bank for this subject yet. Revise definitions, diagrams, last-year repeated topics.",
            "key_formulas": [],
            "likely_questions": [],
        }]

    topics = list(bank["topics"])
    if strategy == "high_yield":
        topics = [t for t in topics if t["importance"] in ("must_know", "should_know")]

    # Time budget: keep 30 min for final revision sheet
    usable_minutes = max(40, int(hours * 60) - 30)

    # Target block size
    if hours <= 3:
        block = 25
    elif hours <= 6:
        block = 35
    else:
        block = 40

    max_topics = max(2, usable_minutes // block)

    # Order: must → should → low
    rank = {"must_know": 0, "should_know": 1, "low_priority": 2}
    topics.sort(key=lambda t: rank[t["importance"]])
    topics = topics[:max_topics]

    n = len(topics)
    base = usable_minutes // n
    rem = usable_minutes % n
    for i, t in enumerate(topics):
        t = dict(t)
        t["allocated_minutes"] = base + (1 if i < rem else 0)
        topics[i] = t
    return topics


def generate_plan(subject: str, hours_available: float, strategy: str) -> list[dict]:
    key = normalize_subject(subject)
    return _pick_topics(key, hours_available, strategy)


def compile_revision_sheet(session, topics: list) -> dict:
    covered = [t for t in topics if t.status.value == "covered"]
    skipped = [t for t in topics if t.status.value == "skipped"]
    pending = [t for t in topics if t.status.value in ("pending", "in_progress")]

    formulas = []
    qas = []
    for t in covered:
        if t.key_formulas:
            formulas.extend([{"topic": t.title, "item": f} for f in t.key_formulas])
        if t.likely_questions:
            qas.extend(t.likely_questions)

    return {
        "session_id": session.id,
        "subject": session.subject,
        "exam_time": session.exam_time,
        "strategy": session.strategy.value,
        "covered_count": len(covered),
        "skipped_count": len(skipped),
        "pending_count": len(pending),
        "covered_titles": [t.title for t in covered],
        "skipped_titles": [t.title for t in skipped],
        "formulas": formulas[:30],
        "top_questions": qas[:10],
        "generated_at": datetime.now(timezone.utc),
    }