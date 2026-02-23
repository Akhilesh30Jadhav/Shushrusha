"""Scenario loader — reads JSON files from the data/scenarios directory."""

import json
import os
from typing import Any

SCENARIOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "scenarios")

_cache: dict[str, dict] = {}


def _load_all() -> dict[str, dict]:
    """Load all scenario JSON files, cached after first call."""
    if _cache:
        return _cache
    for filename in os.listdir(SCENARIOS_DIR):
        if filename.endswith(".json"):
            path = os.path.join(SCENARIOS_DIR, filename)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                _cache[data["id"]] = data
    return _cache


def get_all_scenarios() -> dict[str, dict]:
    return _load_all()


def get_scenarios_for_language(lang: str) -> list[dict]:
    """Return scenario metadata list for a given language."""
    results = []
    for sid, s in _load_all().items():
        if lang in s.get("supported_languages", []):
            results.append({
                "id": s["id"],
                "title": s.get("title", {}).get(lang, s.get("title", {}).get("en", "")),
                "category": s.get("category", {}).get(lang, s.get("category", {}).get("en", "")),
                "difficulty": s.get("difficulty", "beginner"),
                "estimated_minutes": s.get("estimated_minutes", 10),
                "description": s.get("description", {}).get(lang, s.get("description", {}).get("en", "")),
            })
    return results


def get_scenario(scenario_id: str) -> dict | None:
    return _load_all().get(scenario_id)


def get_node(scenario_id: str, node_key: str, lang: str = "en") -> dict | None:
    """Get a specific node with text resolved to the requested language."""
    scenario = get_scenario(scenario_id)
    if not scenario:
        return None
    node = scenario.get("nodes", {}).get(node_key)
    if not node:
        return None
    return {
        "node_key": node_key,
        "patient_text": node.get("patient_text", {}).get(lang, node.get("patient_text", {}).get("en", "")),
        "expected_checklist": node.get("expected_checklist", []),
        "transitions": node.get("transitions", []),
    }


def get_next_node_key(scenario_id: str, current_node_key: str, user_text: str = "") -> str:
    """Determine the next node based on transition rules. Returns '__end__' if scenario is complete."""
    scenario = get_scenario(scenario_id)
    if not scenario:
        return "__end__"
    node = scenario.get("nodes", {}).get(current_node_key)
    if not node:
        return "__end__"
    transitions = node.get("transitions", [])
    # For MVP, just use the default transition
    for t in transitions:
        if t.get("condition") == "default":
            return t["next_node_key"]
    return "__end__"
