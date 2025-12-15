#!/usr/bin/env python3
"""
Parse Minecraft server logs to extract benchmark metrics.
Usage: python parse-benchmark.py <log_file> <output_json>
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime


def parse_spark_tps(log_content: str) -> dict:
    """Extract TPS data from Spark output in logs."""
    tps_data = {
        "tps_5s": None,
        "tps_10s": None,
        "tps_1m": None,
        "tps_5m": None,
        "tps_15m": None,
    }

    # Spark TPS format: "TPS from last 5s, 10s, 1m, 5m, 15m:"
    # "20.0, 20.0, 20.0, 20.0, 20.0"
    tps_pattern = r"TPS from last.*?(\d+\.?\d*),\s*(\d+\.?\d*),\s*(\d+\.?\d*),\s*(\d+\.?\d*),\s*(\d+\.?\d*)"
    match = re.search(tps_pattern, log_content, re.IGNORECASE)

    if match:
        tps_data["tps_5s"] = float(match.group(1))
        tps_data["tps_10s"] = float(match.group(2))
        tps_data["tps_1m"] = float(match.group(3))
        tps_data["tps_5m"] = float(match.group(4))
        tps_data["tps_15m"] = float(match.group(5))

    return tps_data


def parse_spark_health(log_content: str) -> dict:
    """Extract health/memory data from Spark output."""
    health_data = {
        "cpu_process": None,
        "cpu_system": None,
        "memory_used_mb": None,
        "memory_max_mb": None,
        "gc_avg_ms": None,
    }

    # CPU usage pattern
    cpu_pattern = r"CPU Process:.*?(\d+\.?\d*)%.*?System:.*?(\d+\.?\d*)%"
    match = re.search(cpu_pattern, log_content, re.IGNORECASE)
    if match:
        health_data["cpu_process"] = float(match.group(1))
        health_data["cpu_system"] = float(match.group(2))

    # Memory pattern
    mem_pattern = r"Memory:.*?(\d+)\s*MB\s*/\s*(\d+)\s*MB"
    match = re.search(mem_pattern, log_content, re.IGNORECASE)
    if match:
        health_data["memory_used_mb"] = int(match.group(1))
        health_data["memory_max_mb"] = int(match.group(2))

    return health_data


def parse_tick_times(log_content: str) -> dict:
    """Extract tick timing data."""
    tick_data = {
        "avg_tick_ms": None,
        "max_tick_ms": None,
        "min_tick_ms": None,
    }

    # Spark tick duration pattern
    tick_pattern = r"Tick durations.*?avg:?\s*(\d+\.?\d*)\s*ms.*?max:?\s*(\d+\.?\d*)\s*ms"
    match = re.search(tick_pattern, log_content, re.IGNORECASE | re.DOTALL)
    if match:
        tick_data["avg_tick_ms"] = float(match.group(1))
        tick_data["max_tick_ms"] = float(match.group(2))

    return tick_data


def parse_startup_time(log_content: str) -> float:
    """Extract server startup time."""
    # Pattern: "Done (X.XXXs)! For help, type "help""
    startup_pattern = r'Done \((\d+\.?\d*)s\)'
    match = re.search(startup_pattern, log_content)

    if match:
        return float(match.group(1))
    return None


def parse_chunk_loading(log_content: str) -> dict:
    """Extract chunk loading metrics."""
    chunk_data = {
        "chunks_loaded": None,
        "chunks_generated": None,
    }

    # Count chunk generation messages
    gen_count = len(re.findall(r"Preparing spawn area", log_content))
    chunk_data["chunks_generated"] = gen_count

    return chunk_data


def parse_errors(log_content: str) -> list:
    """Extract any errors or warnings."""
    errors = []

    # Find ERROR and WARN lines
    for line in log_content.split('\n'):
        if '/ERROR]' in line or '/WARN]' in line:
            # Skip common non-critical warnings
            if any(skip in line for skip in [
                'Ambiguity between arguments',
                'Unknown or incomplete command',
                'Caching',
            ]):
                continue
            errors.append(line.strip()[-200:])  # Limit line length

    return errors[:20]  # Limit to 20 errors


def main():
    if len(sys.argv) < 3:
        print("Usage: python parse-benchmark.py <log_file> <output_json>")
        sys.exit(1)

    log_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    if not log_path.exists():
        print(f"Log file not found: {log_path}")
        # Create empty results
        results = {
            "status": "no_logs",
            "timestamp": datetime.now().isoformat(),
        }
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        sys.exit(0)

    with open(log_path) as f:
        log_content = f.read()

    results = {
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "startup_time_s": parse_startup_time(log_content),
        "tps": parse_spark_tps(log_content),
        "health": parse_spark_health(log_content),
        "tick_times": parse_tick_times(log_content),
        "chunks": parse_chunk_loading(log_content),
        "errors": parse_errors(log_content),
        "error_count": len(parse_errors(log_content)),
    }

    # Calculate overall score (simple heuristic)
    score = 100

    if results["tps"]["tps_1m"]:
        # Deduct points for TPS below 20
        tps_penalty = max(0, (20 - results["tps"]["tps_1m"]) * 5)
        score -= tps_penalty

    if results["tick_times"]["avg_tick_ms"]:
        # Deduct points for high tick times (50ms = 20 TPS target)
        if results["tick_times"]["avg_tick_ms"] > 50:
            score -= (results["tick_times"]["avg_tick_ms"] - 50) * 0.5

    if results["error_count"] > 0:
        score -= results["error_count"] * 2

    results["score"] = max(0, min(100, round(score, 1)))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Results written to {output_path}")
    print(f"Score: {results['score']}/100")


if __name__ == "__main__":
    main()
