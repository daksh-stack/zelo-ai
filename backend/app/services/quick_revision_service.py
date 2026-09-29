from app.content.skill_banks import REVISION_DECKS


def build_revision_deck(topics: list[str] | None, weak_areas: list[str] | None, limit: int = 12) -> list[dict]:
    """
    Pick cards from banks using weak_areas + optional topic filters.
    """
    weak = [w.lower() for w in (weak_areas or [])]
    wanted = [t.lower() for t in (topics or [])]

    pool: list[dict] = []
    for key, cards in REVISION_DECKS.items():
        if wanted and key not in wanted and not any(k in wanted for k in [key]):
            # still allow if weak area matches key
            if key not in weak and not any(key in w or w in key for w in weak):
                continue
        for c in cards:
            pool.append({**c, "source": "weak_area" if key in weak or any(key in w for w in weak) else "bank"})

    # If nothing matched, return mixed default
    if not pool:
        for cards in REVISION_DECKS.values():
            pool.extend([{**c, "source": "bank"} for c in cards])

    # Prefer weak-area tagged cards first
    pool.sort(key=lambda c: 0 if c.get("source") == "weak_area" else 1)
    return pool[:limit]