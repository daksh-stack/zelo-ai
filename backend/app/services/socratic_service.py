def generate_recall_probe(topic_title: str, notes_summary: str | None = None) -> list[dict]:
    base = topic_title or "this topic"
    probes = [
        {
            "question": f"In one sentence, what is the core idea of {base}?",
            "hint": "Lead with a definition, not an example.",
        },
        {
            "question": f"Name one common exam/interview pitfall related to {base}.",
            "hint": "Think confusion with a similar concept.",
        },
    ]
    if notes_summary:
        probes[0]["context"] = notes_summary[:400]
    return probes[:2]


def evaluate_probe_answer(question: str, user_answer: str) -> dict:
    if not user_answer or len(user_answer.strip()) < 12:
        return {
            "ok": False,
            "feedback": "Too short. Answer in at least 2 sentences: definition + one detail.",
        }
    return {
        "ok": True,
        "feedback": "Logged. If you used the correct term and one supporting detail, you’re fine — refine clarity next pass.",
    }