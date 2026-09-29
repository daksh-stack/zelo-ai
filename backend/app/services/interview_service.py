import re
from app.content.skill_banks import INTERVIEW_QUESTIONS


def get_questions(domain: str, count: int = 5) -> list[dict]:
    bank = INTERVIEW_QUESTIONS.get(domain) or INTERVIEW_QUESTIONS["sde"]
    return bank[:count]


def score_answer(model_answer: str, user_answer: str) -> tuple[float, str]:
    """
    Phase 2: lightweight keyword overlap scoring.
    Replace with LLM later without changing API shape.
    """
    if not user_answer or not user_answer.strip():
        return 0.0, "Empty answer. State the definition and one example."

    def tokens(s: str) -> set[str]:
        return set(re.findall(r"[a-z0-9]+", s.lower()))

    m = tokens(model_answer)
    u = tokens(user_answer)
    if not m:
        return 0.5, "Recorded. Compare with the model answer and tighten keywords."

    overlap = len(m & u) / len(m)
    score = max(0.0, min(1.0, overlap * 1.2))

    if score >= 0.75:
        feedback = "Strong. You hit the main points. Add a short example next time."
    elif score >= 0.4:
        feedback = "Partial. Cover the missing keywords from the model answer and structure: definition → why → example."
    else:
        feedback = "Weak match. Re-read the model answer; answer in 3–5 sentences with the core definition first."

    return round(score, 2), feedback