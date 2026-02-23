"""
Deterministic rule-based evaluation engine.

Each scenario node defines expected checklist items with keywords.
Worker text is matched against those keywords to produce deterministic results.
"""

import re
from typing import Any


def _normalize(text: str) -> str:
    """Lowercase, strip extra whitespace, remove common punctuation."""
    text = text.lower().strip()
    text = re.sub(r"[.,!?;:'\"-]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def evaluate_turn(user_text: str, expected_checklist: list[dict]) -> dict:
    """
    Evaluate a single turn against the node's checklist.

    Each checklist item has:
        {
            "item": "Ask about danger signs",
            "type": "normal" | "critical",
            "keywords": ["danger", "bleeding", "headache", "swelling"]
        }

    Returns:
        {
            "matched_items": [...],
            "missed_items": [...],
            "critical_missed": [...],
            "notes": "..."
        }
    """
    normalized = _normalize(user_text)
    matched = []
    missed = []
    critical_missed = []

    for check in expected_checklist:
        item_name = check.get("item", "")
        keywords = check.get("keywords", [])
        item_type = check.get("type", "normal")

        # An item is matched if ANY of its keywords appear in the user text
        is_matched = any(kw.lower() in normalized for kw in keywords)

        if is_matched:
            matched.append(item_name)
        else:
            missed.append(item_name)
            if item_type == "critical":
                critical_missed.append(item_name)

    notes = ""
    if critical_missed:
        notes = f"⚠️ Critical protocol items missed: {', '.join(critical_missed)}"
    elif missed:
        notes = f"Some items missed — review protocol guidelines."
    else:
        notes = "✅ All checklist items addressed!"

    return {
        "matched_items": matched,
        "missed_items": missed,
        "critical_missed": critical_missed,
        "notes": notes,
    }


def generate_report(turns: list[dict], scenario_data: dict) -> dict:
    """
    Generate final session report from all turn evaluations.

    Args:
        turns: list of { node_key, matched_items, missed_items, critical_missed, user_text }
        scenario_data: the full scenario JSON with nodes

    Returns:
        {
            "score": 0-100,
            "checklist_results": [{ "item", "status", "is_critical" }],
            "critical_misses": [...],
            "suggestions": [...],
            "transcript": [...]
        }
    """
    # Aggregate all checklist items across all visited nodes
    all_items: dict[str, dict[str, Any]] = {}  # item_name -> { matched, is_critical }
    nodes_map = scenario_data.get("nodes", {})

    for turn in turns:
        node_key = turn.get("node_key", "")
        node = nodes_map.get(node_key, {})
        checklist = node.get("expected_checklist", [])

        for check in checklist:
            item_name = check.get("item", "")
            item_type = check.get("type", "normal")
            if item_name not in all_items:
                all_items[item_name] = {
                    "matched": False,
                    "is_critical": item_type == "critical",
                }
            # If matched in any turn, mark as matched
            if item_name in turn.get("matched_items", []):
                all_items[item_name]["matched"] = True

    # Build checklist results
    checklist_results = []
    critical_misses = []
    total_weight = 0
    earned_weight = 0

    for item_name, info in all_items.items():
        weight = 2.0 if info["is_critical"] else 1.0
        total_weight += weight

        status = "done" if info["matched"] else "missed"
        checklist_results.append({
            "item": item_name,
            "status": status,
            "is_critical": info["is_critical"],
        })

        if info["matched"]:
            earned_weight += weight
        elif info["is_critical"]:
            critical_misses.append(item_name)

    # Score calculation
    score = round((earned_weight / total_weight) * 100, 1) if total_weight > 0 else 0

    # Generate suggestions based on misses
    suggestions = _generate_suggestions(checklist_results, critical_misses)

    # Build transcript
    transcript = []
    for turn in turns:
        node_key = turn.get("node_key", "")
        node = nodes_map.get(node_key, {})
        transcript.append({
            "turn": turn.get("turn_index", 0),
            "patient": node.get("patient_text", {}).get("en", ""),
            "worker": turn.get("user_text", ""),
            "matched": turn.get("matched_items", []),
            "missed": turn.get("missed_items", []),
        })

    return {
        "score": score,
        "checklist_results": checklist_results,
        "critical_misses": critical_misses,
        "suggestions": suggestions,
        "transcript": transcript,
    }


def _generate_suggestions(checklist_results: list[dict], critical_misses: list[str]) -> list[str]:
    """Generate actionable suggestions based on missed items."""
    suggestions = []

    if critical_misses:
        suggestions.append(
            "🚨 You missed critical danger signs. Always ask about danger signs "
            "early in the conversation and refer immediately if present."
        )

    missed_items = [r["item"] for r in checklist_results if r["status"] == "missed" and not r["is_critical"]]

    if any("follow-up" in m.lower() or "schedule" in m.lower() for m in missed_items):
        suggestions.append(
            "📅 Remember to schedule a follow-up visit and confirm the date with the patient."
        )
    if any("nutrition" in m.lower() or "diet" in m.lower() or "iron" in m.lower() for m in missed_items):
        suggestions.append(
            "🥗 Counsel on nutrition, iron/folate supplementation, and dietary advice."
        )
    if any("hygiene" in m.lower() for m in missed_items):
        suggestions.append(
            "🧼 Advise on hygiene practices for mother and newborn."
        )
    if any("breastfeed" in m.lower() or "feeding" in m.lower() for m in missed_items):
        suggestions.append(
            "🍼 Counsel on proper breastfeeding technique and feeding frequency."
        )
    if any("ors" in m.lower() or "zinc" in m.lower() or "fluid" in m.lower() for m in missed_items):
        suggestions.append(
            "💧 Always counsel on ORS + Zinc for diarrhea and ensure adequate fluid intake."
        )

    if not suggestions:
        suggestions.append(
            "👏 Great job! Review the protocol periodically to maintain your skills."
        )

    return suggestions
