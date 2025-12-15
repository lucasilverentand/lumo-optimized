#!/usr/bin/env python3
"""
Generate badge JSON for shields.io based on benchmark results.
Usage: python generate-badge.py <summary_json>
"""

import json
import sys
from pathlib import Path


def get_color_for_score(score: float) -> str:
    """Get badge color based on score."""
    if score >= 90:
        return "brightgreen"
    elif score >= 80:
        return "green"
    elif score >= 70:
        return "yellowgreen"
    elif score >= 60:
        return "yellow"
    elif score >= 50:
        return "orange"
    else:
        return "red"


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate-badge.py <summary_json>")
        sys.exit(1)

    summary_path = Path(sys.argv[1])

    if not summary_path.exists():
        print(f"Summary not found: {summary_path}")
        sys.exit(1)

    with open(summary_path) as f:
        summary = json.load(f)

    output_dir = summary_path.parent

    # Generate badge for best overall edition
    best_edition = summary.get("best", {}).get("overall", "unknown")
    best_score = summary.get("editions", {}).get(best_edition, {}).get("score", 0)

    badge_data = {
        "schemaVersion": 1,
        "label": "benchmark",
        "message": f"{best_edition}: {best_score}/100",
        "color": get_color_for_score(best_score or 0),
    }

    badge_path = output_dir / "badge.json"
    with open(badge_path, 'w') as f:
        json.dump(badge_data, f)

    print(f"Badge JSON written to {badge_path}")

    # Generate individual edition badges
    for edition, data in summary.get("editions", {}).items():
        score = data.get("score", 0)

        edition_badge = {
            "schemaVersion": 1,
            "label": edition,
            "message": f"{score}/100" if score else "N/A",
            "color": get_color_for_score(score or 0),
        }

        edition_badge_path = output_dir / f"badge-{edition}.json"
        with open(edition_badge_path, 'w') as f:
            json.dump(edition_badge, f)

    print(f"Generated badges for {len(summary.get('editions', {}))} editions")


if __name__ == "__main__":
    main()
