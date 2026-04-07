#!/usr/bin/env python3
"""Pivot/group CSV data — aggregate by category.

Usage:
    python pivot.py data.csv --group "Department" --sum "Budget,Actual"
    python pivot.py data.csv --group "Status" --count
    python pivot.py data.csv --group "Category,Year" --sum "Amount" --avg "Score"
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def parse_number(v: str) -> float | None:
    v = v.strip().replace(",", "")
    try:
        return float(v)
    except ValueError:
        return None


def load_csv(filepath: str) -> tuple[list[str], list[dict]]:
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)
    return headers, rows


def pivot(filepath: str, group_cols: list[str],
          sum_cols: list[str] | None = None,
          avg_cols: list[str] | None = None,
          count: bool = False) -> dict:
    """Group and aggregate CSV data."""
    headers, rows = load_csv(filepath)

    groups = {}
    for row in rows:
        key = tuple(row.get(g, "").strip() for g in group_cols)
        if key not in groups:
            groups[key] = {"rows": [], "count": 0}
        groups[key]["rows"].append(row)
        groups[key]["count"] += 1

    results = []
    for key, grp in sorted(groups.items()):
        entry = {}
        for i, g in enumerate(group_cols):
            entry[g] = key[i]
        entry["count"] = grp["count"]

        if sum_cols:
            for col in sum_cols:
                nums = [n for r in grp["rows"] if (n := parse_number(r.get(col, ""))) is not None]
                entry[f"sum_{col}"] = round(sum(nums), 2) if nums else 0

        if avg_cols:
            for col in avg_cols:
                nums = [n for r in grp["rows"] if (n := parse_number(r.get(col, ""))) is not None]
                entry[f"avg_{col}"] = round(sum(nums) / len(nums), 2) if nums else 0

        results.append(entry)

    return {
        "file": filepath,
        "total_rows": len(rows),
        "groups": len(results),
        "group_by": group_cols,
        "results": results,
    }


def interpret(result: dict) -> str:
    lines = []
    lines.append(f"分组汇总: {result['file']}")
    lines.append(f"总行数: {result['total_rows']} | 分组数: {result['groups']}")
    lines.append(f"分组依据: {', '.join(result['group_by'])}")
    lines.append("=" * 60)

    if not result["results"]:
        lines.append("无数据")
        return "\n".join(lines)

    # Build table
    cols = list(result["results"][0].keys())
    # Calculate column widths
    widths = {c: max(len(c), max(len(str(r.get(c, ""))) for r in result["results"])) for c in cols}

    # Header
    header = " | ".join(f"{c:<{widths[c]}}" for c in cols)
    lines.append(header)
    lines.append("-" * len(header))

    # Rows
    for r in result["results"]:
        line = " | ".join(f"{str(r.get(c, '')):<{widths[c]}}" for c in cols)
        lines.append(line)

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Pivot/Group CSV Data")
    parser.add_argument("file", help="CSV file to analyse")
    parser.add_argument("--group", required=True, help="Column(s) to group by (comma-separated)")
    parser.add_argument("--sum", help="Column(s) to sum (comma-separated)")
    parser.add_argument("--avg", help="Column(s) to average (comma-separated)")
    parser.add_argument("--count", action="store_true", help="Include row count per group")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    group_cols = [c.strip() for c in args.group.split(",")]
    sum_cols = [c.strip() for c in args.sum.split(",")] if args.sum else None
    avg_cols = [c.strip() for c in args.avg.split(",")] if args.avg else None

    result = pivot(args.file, group_cols, sum_cols, avg_cols, args.count)

    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(interpret(result))


if __name__ == "__main__":
    main()
