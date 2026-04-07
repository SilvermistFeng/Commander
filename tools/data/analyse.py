#!/usr/bin/env python3
"""CSV Data Analyser — summary statistics, anomaly detection, trends.

Usage:
    python analyse.py data.csv
    python analyse.py data.csv --top 10
    python analyse.py data.csv --format json
    python analyse.py data.csv --columns "budget,actual,variance"
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def load_csv(filepath: str) -> tuple[list[str], list[dict]]:
    """Load CSV, return headers and rows."""
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)
    return headers, rows


def detect_type(values: list[str]) -> str:
    """Detect if a column is numeric, date-like, or text."""
    numeric_count = 0
    for v in values:
        v = v.strip().replace(",", "").replace("%", "")
        if not v:
            continue
        try:
            float(v)
            numeric_count += 1
        except ValueError:
            pass
    ratio = numeric_count / max(len(values), 1)
    return "numeric" if ratio > 0.7 else "text"


def parse_number(v: str) -> float | None:
    """Parse a string as a number, handling commas and percentages."""
    v = v.strip().replace(",", "")
    is_pct = v.endswith("%")
    if is_pct:
        v = v[:-1]
    try:
        n = float(v)
        return n / 100 if is_pct else n
    except ValueError:
        return None


def analyse_numeric(col_name: str, values: list[str]) -> dict:
    """Compute statistics for a numeric column."""
    nums = [n for v in values if (n := parse_number(v)) is not None]
    if not nums:
        return {"column": col_name, "type": "numeric", "count": 0}

    nums_sorted = sorted(nums)
    n = len(nums)
    total = sum(nums)
    mean = total / n
    median = nums_sorted[n // 2] if n % 2 else (nums_sorted[n // 2 - 1] + nums_sorted[n // 2]) / 2
    variance = sum((x - mean) ** 2 for x in nums) / n if n > 1 else 0
    std = variance ** 0.5

    # Detect outliers (beyond 2 standard deviations)
    outliers = []
    if std > 0:
        for i, v in enumerate(values):
            num = parse_number(v)
            if num is not None and abs(num - mean) > 2 * std:
                outliers.append({"row": i + 1, "value": num, "z_score": round((num - mean) / std, 2)})

    return {
        "column": col_name,
        "type": "numeric",
        "count": n,
        "sum": round(total, 2),
        "mean": round(mean, 2),
        "median": round(median, 2),
        "min": round(nums_sorted[0], 2),
        "max": round(nums_sorted[-1], 2),
        "std": round(std, 2),
        "outliers": outliers[:5],  # Top 5 outliers
    }


def analyse_text(col_name: str, values: list[str]) -> dict:
    """Compute frequency distribution for a text column."""
    freq = {}
    for v in values:
        v = v.strip()
        if v:
            freq[v] = freq.get(v, 0) + 1

    sorted_freq = sorted(freq.items(), key=lambda x: -x[1])
    return {
        "column": col_name,
        "type": "text",
        "unique_values": len(freq),
        "total": sum(freq.values()),
        "top_values": [{"value": k, "count": v, "pct": round(v / sum(freq.values()) * 100, 1)}
                       for k, v in sorted_freq[:10]],
        "empty_count": sum(1 for v in values if not v.strip()),
    }


def analyse_file(filepath: str, columns: list[str] | None = None) -> dict:
    """Full analysis of a CSV file."""
    headers, rows = load_csv(filepath)
    if not rows:
        return {"error": "Empty file", "rows": 0}

    target_cols = columns if columns else headers
    target_cols = [c for c in target_cols if c in headers]

    col_analyses = []
    for col in target_cols:
        values = [row.get(col, "") for row in rows]
        col_type = detect_type(values)
        if col_type == "numeric":
            col_analyses.append(analyse_numeric(col, values))
        else:
            col_analyses.append(analyse_text(col, values))

    return {
        "file": filepath,
        "rows": len(rows),
        "columns": len(headers),
        "column_names": headers,
        "analyses": col_analyses,
    }


def interpret(result: dict) -> str:
    """Generate plain-language summary."""
    lines = []
    lines.append(f"数据分析: {result['file']}")
    lines.append(f"行数: {result['rows']} | 列数: {result['columns']}")
    lines.append(f"列名: {', '.join(result['column_names'])}")
    lines.append("=" * 50)

    for a in result["analyses"]:
        lines.append("")
        if a["type"] == "numeric":
            lines.append(f"📊 {a['column']} (数值型)")
            lines.append(f"   数量: {a['count']} | 合计: {a['sum']:,.2f}")
            lines.append(f"   平均: {a['mean']:,.2f} | 中位数: {a['median']:,.2f}")
            lines.append(f"   最小: {a['min']:,.2f} | 最大: {a['max']:,.2f}")
            lines.append(f"   标准差: {a['std']:,.2f}")
            if a.get("outliers"):
                lines.append(f"   ⚠ 异常值: {len(a['outliers'])} 个")
                for o in a["outliers"]:
                    lines.append(f"     第{o['row']}行: {o['value']:,.2f} (z={o['z_score']})")
        else:
            lines.append(f"📋 {a['column']} (文本型)")
            lines.append(f"   唯一值: {a['unique_values']} | 空值: {a['empty_count']}")
            if a.get("top_values"):
                lines.append("   分布:")
                for tv in a["top_values"][:5]:
                    lines.append(f"     {tv['value']}: {tv['count']} ({tv['pct']}%)")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="CSV Data Analyser")
    parser.add_argument("file", help="CSV file to analyse")
    parser.add_argument("--columns", help="Comma-separated column names to analyse (default: all)")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    columns = args.columns.split(",") if args.columns else None
    result = analyse_file(args.file, columns)

    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(interpret(result))


if __name__ == "__main__":
    main()
