#!/usr/bin/env python3
"""Budget vs Actual Variance Analysis.

Usage:
    python variance.py data.csv
    python variance.py data.csv --format json

Input CSV format:
    item,budget,actual
    Labour,50000,53000
    Materials,30000,28500
    Equipment,20000,22000

Also accepts: category/description instead of item, planned instead of budget.
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def load_data(filepath: str) -> list[dict]:
    """Load CSV and normalise column names."""
    rows = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Normalise column names
            norm = {k.strip().lower(): v.strip() for k, v in row.items()}
            item = norm.get("item") or norm.get("category") or norm.get("description") or "Unknown"
            budget = float(norm.get("budget") or norm.get("planned") or 0)
            actual = float(norm.get("actual") or norm.get("spent") or 0)
            rows.append({"item": item, "budget": budget, "actual": actual})
    return rows


def analyse(rows: list[dict]) -> dict:
    """Calculate variance for each line and totals."""
    results = []
    total_budget = 0
    total_actual = 0

    for row in rows:
        b, a = row["budget"], row["actual"]
        var = b - a
        pct = (var / b * 100) if b else 0.0
        results.append({
            "item": row["item"],
            "budget": b,
            "actual": a,
            "variance": round(var, 2),
            "variance_pct": round(pct, 1),
            "status": "under" if var > 0 else "over" if var < 0 else "on_budget",
        })
        total_budget += b
        total_actual += a

    total_var = total_budget - total_actual
    total_pct = (total_var / total_budget * 100) if total_budget else 0.0

    # Sort by worst variance first
    flagged = sorted([r for r in results if r["variance"] < 0], key=lambda x: x["variance"])

    return {
        "lines": results,
        "totals": {
            "budget": round(total_budget, 2),
            "actual": round(total_actual, 2),
            "variance": round(total_var, 2),
            "variance_pct": round(total_pct, 1),
        },
        "flagged": flagged,
    }


def interpret(r: dict) -> str:
    """Generate plain-language variance report."""
    lines = []
    t = r["totals"]

    lines.append("预算 vs 实际 — 偏差分析")
    lines.append("=" * 40)
    lines.append("")

    # Table header
    lines.append(f"{'项目':<20} {'预算':>12} {'实际':>12} {'偏差':>12} {'偏差%':>8}")
    lines.append("-" * 66)

    for row in r["lines"]:
        flag = " ⚠" if row["status"] == "over" else ""
        lines.append(
            f"{row['item']:<20} {row['budget']:>12,.0f} {row['actual']:>12,.0f} "
            f"{row['variance']:>12,.0f} {row['variance_pct']:>7.1f}%{flag}"
        )

    lines.append("-" * 66)
    lines.append(
        f"{'合计':<20} {t['budget']:>12,.0f} {t['actual']:>12,.0f} "
        f"{t['variance']:>12,.0f} {t['variance_pct']:>7.1f}%"
    )
    lines.append("")

    # Summary
    if t["variance"] > 0:
        lines.append(f"总体: 节省 {t['variance']:,.0f} ({t['variance_pct']}%) — 预算内。")
    elif t["variance"] < 0:
        lines.append(f"总体: 超支 {abs(t['variance']):,.0f} ({abs(t['variance_pct'])}%) — 需要关注。")
    else:
        lines.append("总体: 完全按预算执行。")

    # Flagged items
    if r["flagged"]:
        lines.append("")
        lines.append("⚠ 需要关注的超支项目:")
        for f in r["flagged"]:
            lines.append(f"  • {f['item']}: 超支 {abs(f['variance']):,.0f} ({abs(f['variance_pct'])}%)")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Budget vs Actual Variance Analysis")
    parser.add_argument("file", help="CSV file with budget vs actual data")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    rows = load_data(args.file)
    result = analyse(rows)

    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(interpret(result))


if __name__ == "__main__":
    main()
