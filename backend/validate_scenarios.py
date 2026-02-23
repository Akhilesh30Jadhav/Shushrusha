"""Validate all scenario JSON files to ensure no dead-ends and valid structure."""

import json
import os
import sys


SCENARIOS_DIR = os.path.join(os.path.dirname(__file__), "data", "scenarios")


def validate_scenario(filepath: str) -> list[str]:
    errors = []
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    scenario_id = data.get("id", filepath)

    # Check required top-level fields
    for field in ["id", "title", "category", "supported_languages", "nodes"]:
        if field not in data:
            errors.append(f"[{scenario_id}] Missing required field: {field}")

    nodes = data.get("nodes", {})
    if "start" not in nodes:
        errors.append(f"[{scenario_id}] Missing 'start' node")

    all_node_keys = set(nodes.keys())

    for node_key, node in nodes.items():
        # Check patient_text exists
        if "patient_text" not in node:
            errors.append(f"[{scenario_id}] Node '{node_key}' missing patient_text")

        # Check transitions
        transitions = node.get("transitions", [])
        if not transitions:
            errors.append(f"[{scenario_id}] Node '{node_key}' has no transitions (dead-end!)")

        for t in transitions:
            next_key = t.get("next_node_key", "")
            if next_key != "__end__" and next_key not in all_node_keys:
                errors.append(
                    f"[{scenario_id}] Node '{node_key}' transitions to unknown node '{next_key}'"
                )

        # Check checklist items
        checklist = node.get("expected_checklist", [])
        for item in checklist:
            if "item" not in item:
                errors.append(f"[{scenario_id}] Node '{node_key}' has checklist item without 'item' name")
            if not item.get("keywords"):
                errors.append(f"[{scenario_id}] Node '{node_key}' checklist item '{item.get('item', '?')}' has no keywords")

    return errors


def main():
    all_errors = []
    count = 0

    for filename in os.listdir(SCENARIOS_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(SCENARIOS_DIR, filename)
            errors = validate_scenario(filepath)
            all_errors.extend(errors)
            count += 1
            status = "PASS" if not errors else "FAIL"
            print(f"[{status}] {filename}")

    if all_errors:
        print(f"\n[FAIL] {len(all_errors)} error(s) found:")
        for e in all_errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print(f"\n[PASS] All {count} scenario(s) validated successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
