#!/usr/bin/env python3
"""
Analyze benchmark results from all editions and generate comparison report.
Usage: python analyze-benchmarks.py <benchmarks_dir> <output_dir>
"""

import json
import sys
from datetime import datetime
from pathlib import Path


def load_benchmark_results(benchmarks_dir: Path) -> dict:
    """Load all benchmark results from artifacts directory."""
    results = {}

    for artifact_dir in benchmarks_dir.iterdir():
        if not artifact_dir.is_dir():
            continue

        # Extract edition name from artifact name (benchmark-<edition>)
        edition = artifact_dir.name.replace('benchmark-', '')

        # Find results JSON
        for json_file in artifact_dir.glob('*-results.json'):
            with open(json_file) as f:
                results[edition] = json.load(f)
            break

    return results


def calculate_rankings(results: dict) -> dict:
    """Calculate rankings for each metric."""
    rankings = {
        "tps": [],
        "startup": [],
        "memory": [],
        "score": [],
    }

    for edition, data in results.items():
        if data.get("status") != "completed":
            continue

        # TPS ranking (higher is better)
        tps = data.get("tps", {}).get("tps_1m")
        if tps:
            rankings["tps"].append((edition, tps))

        # Startup time (lower is better)
        startup = data.get("startup_time_s")
        if startup:
            rankings["startup"].append((edition, startup))

        # Memory usage (lower is better)
        memory = data.get("health", {}).get("memory_used_mb")
        if memory:
            rankings["memory"].append((edition, memory))

        # Overall score (higher is better)
        score = data.get("score")
        if score:
            rankings["score"].append((edition, score))

    # Sort rankings
    rankings["tps"] = sorted(rankings["tps"], key=lambda x: x[1], reverse=True)
    rankings["startup"] = sorted(rankings["startup"], key=lambda x: x[1])
    rankings["memory"] = sorted(rankings["memory"], key=lambda x: x[1])
    rankings["score"] = sorted(rankings["score"], key=lambda x: x[1], reverse=True)

    return rankings


def generate_markdown_report(results: dict, rankings: dict) -> str:
    """Generate a Markdown report of benchmark results."""
    lines = [
        "# Lumo Optimized - Benchmark Results",
        "",
        f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}*",
        "",
        "## Summary",
        "",
        "| Edition | Score | TPS (1m) | Startup | Memory | Errors |",
        "|---------|-------|----------|---------|--------|--------|",
    ]

    # Sort by score for summary table
    sorted_editions = sorted(
        results.items(),
        key=lambda x: x[1].get("score", 0),
        reverse=True
    )

    for edition, data in sorted_editions:
        if data.get("status") != "completed":
            lines.append(f"| {edition} | N/A | N/A | N/A | N/A | - |")
            continue

        score = data.get("score", "N/A")
        tps = data.get("tps", {}).get("tps_1m", "N/A")
        startup = data.get("startup_time_s", "N/A")
        memory = data.get("health", {}).get("memory_used_mb", "N/A")
        errors = data.get("error_count", 0)

        # Format values
        if isinstance(tps, float):
            tps = f"{tps:.1f}"
        if isinstance(startup, float):
            startup = f"{startup:.1f}s"
        if isinstance(memory, int):
            memory = f"{memory}MB"

        # Add medal for top 3
        medal = ""
        for i, (e, _) in enumerate(rankings["score"][:3]):
            if e == edition:
                medal = ["🥇", "🥈", "🥉"][i]
                break

        lines.append(f"| {medal} {edition} | {score} | {tps} | {startup} | {memory} | {errors} |")

    lines.extend([
        "",
        "## Rankings",
        "",
        "### Best TPS (Server Performance)",
        "",
    ])

    for i, (edition, tps) in enumerate(rankings["tps"][:5], 1):
        lines.append(f"{i}. **{edition}**: {tps:.1f} TPS")

    lines.extend([
        "",
        "### Fastest Startup",
        "",
    ])

    for i, (edition, startup) in enumerate(rankings["startup"][:5], 1):
        lines.append(f"{i}. **{edition}**: {startup:.1f}s")

    lines.extend([
        "",
        "### Lowest Memory Usage",
        "",
    ])

    for i, (edition, memory) in enumerate(rankings["memory"][:5], 1):
        lines.append(f"{i}. **{edition}**: {memory}MB")

    lines.extend([
        "",
        "## Edition Details",
        "",
    ])

    for edition, data in sorted_editions:
        lines.extend([
            f"### {edition.replace('-', ' ').title()}",
            "",
        ])

        if data.get("status") != "completed":
            lines.append("*Benchmark did not complete successfully.*")
            lines.append("")
            continue

        lines.append("| Metric | Value |")
        lines.append("|--------|-------|")
        lines.append(f"| Score | {data.get('score', 'N/A')}/100 |")
        lines.append(f"| Startup Time | {data.get('startup_time_s', 'N/A')}s |")

        tps = data.get("tps", {})
        lines.append(f"| TPS (5s) | {tps.get('tps_5s', 'N/A')} |")
        lines.append(f"| TPS (1m) | {tps.get('tps_1m', 'N/A')} |")
        lines.append(f"| TPS (5m) | {tps.get('tps_5m', 'N/A')} |")

        health = data.get("health", {})
        lines.append(f"| CPU (Process) | {health.get('cpu_process', 'N/A')}% |")
        lines.append(f"| Memory Used | {health.get('memory_used_mb', 'N/A')}MB |")

        ticks = data.get("tick_times", {})
        lines.append(f"| Avg Tick | {ticks.get('avg_tick_ms', 'N/A')}ms |")
        lines.append(f"| Max Tick | {ticks.get('max_tick_ms', 'N/A')}ms |")

        lines.append(f"| Errors | {data.get('error_count', 0)} |")
        lines.append("")

        # Show errors if any
        errors = data.get("errors", [])
        if errors:
            lines.append("<details>")
            lines.append("<summary>Errors/Warnings</summary>")
            lines.append("")
            lines.append("```")
            for error in errors[:10]:
                lines.append(error)
            lines.append("```")
            lines.append("")
            lines.append("</details>")
            lines.append("")

    lines.extend([
        "",
        "## Recommendations",
        "",
    ])

    # Generate recommendations based on results
    if rankings["score"]:
        best = rankings["score"][0][0]
        lines.append(f"- **Best Overall**: {best} edition provides the best balance of performance and stability.")

    if rankings["memory"]:
        lowest_mem = rankings["memory"][0][0]
        lines.append(f"- **Low Memory Systems**: {lowest_mem} edition uses the least memory.")

    if rankings["startup"]:
        fastest = rankings["startup"][0][0]
        lines.append(f"- **Quick Loading**: {fastest} edition has the fastest startup time.")

    lines.extend([
        "",
        "---",
        "*Benchmarks run on GitHub Actions Ubuntu runners with 4GB RAM allocation.*",
    ])

    return "\n".join(lines)


def generate_json_summary(results: dict, rankings: dict) -> dict:
    """Generate JSON summary for badges and API."""
    summary = {
        "timestamp": datetime.now().isoformat(),
        "editions": {},
        "best": {
            "overall": rankings["score"][0][0] if rankings["score"] else None,
            "tps": rankings["tps"][0][0] if rankings["tps"] else None,
            "memory": rankings["memory"][0][0] if rankings["memory"] else None,
            "startup": rankings["startup"][0][0] if rankings["startup"] else None,
        },
    }

    for edition, data in results.items():
        summary["editions"][edition] = {
            "score": data.get("score"),
            "tps": data.get("tps", {}).get("tps_1m"),
            "memory_mb": data.get("health", {}).get("memory_used_mb"),
            "startup_s": data.get("startup_time_s"),
            "status": data.get("status"),
        }

    return summary


def main():
    if len(sys.argv) < 3:
        print("Usage: python analyze-benchmarks.py <benchmarks_dir> <output_dir>")
        sys.exit(1)

    benchmarks_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading benchmarks from {benchmarks_dir}...")
    results = load_benchmark_results(benchmarks_dir)

    if not results:
        print("No benchmark results found!")
        sys.exit(1)

    print(f"Found {len(results)} edition results")

    rankings = calculate_rankings(results)

    # Generate Markdown report
    md_report = generate_markdown_report(results, rankings)
    md_path = output_dir / "summary.md"
    with open(md_path, 'w') as f:
        f.write(md_report)
    print(f"Markdown report: {md_path}")

    # Generate JSON summary
    json_summary = generate_json_summary(results, rankings)
    json_path = output_dir / "summary.json"
    with open(json_path, 'w') as f:
        json.dump(json_summary, f, indent=2)
    print(f"JSON summary: {json_path}")

    # Copy raw results
    raw_path = output_dir / "raw-results.json"
    with open(raw_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Raw results: {raw_path}")

    # Print summary to console
    print("\n" + "="*60)
    print("BENCHMARK SUMMARY")
    print("="*60)

    if rankings["score"]:
        print(f"\n🏆 Best Overall: {rankings['score'][0][0]} (Score: {rankings['score'][0][1]})")

    print("\nAll Scores:")
    for edition, score in rankings["score"]:
        print(f"  {edition}: {score}/100")


if __name__ == "__main__":
    main()
