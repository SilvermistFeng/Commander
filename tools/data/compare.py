#!/usr/bin/env python3
"""Compare two CSV files — find differences, additions, removals.

Usage:
    python compare.py old.csv new.csv
    python compare.py old.csv new.csv --key "Project ID"
    python compare.py old.csv new.csv --key "Project ID" --format json
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def load_csv(filepath: str) -> tuple[list[str], list[dict]]:
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)
    return headers, rows


def compare(old_file: str, new_file: str, key_col: str | None = None) -> dict:
    """Compare two CSV files."""
    old_headers, old_rows = load_csv(old_file)
    new_headers, new_rows = load_csv(new_file)

    # Use first column as key if not specified
    if not key_col:
        key_col = old_headers[0] if old_headers else new_headers[0]

    # Build lookup by key
    old_map = {row.get(key_col, ""): row for row in old_rows}
    new_map = {row.get(key_col, ""): row for row in new_rows}

    old_keys = set(old_map.keys())
    new_keys = set(new_map.keys())

    added = sorted(new_keys - old_keys)
    removed = sorted(old_keys - new_keys)
    common = sorted(old_keys & new_keys)

    # Find changes in common rows
    changes = []
    for k in common:
        old_row = old_map[k]
        new_row = new_map[k]
        row_changes = []
        for col in old_headers:
            if col == key_col:
                continue
            old_val = old_row.get(col, "")
            new_val = new_row.get(col, "")
            if old_val != new_val:
                row_changes.append({
                    "column": col,
                    "old": old_val,
                    "new": new_val,
                })
        if row_changes:
            changes.append({"key": k, "changes": row_changes})

    # New columns
    added_cols = [c for c in new_headers if c not in old_headers]
    removed_cols = [c for c in old_headers if c not in new_headers]

    return {
        "key_column": key_col,
        "old_file": {"path": old_file, "rows": len(old_rows), "columns": len(old_headers)},
        "new_file": {"path": new_file, "rows": len(new_rows), "columns": len(new_headers)},
        "summary": {
            "added_rows": len(added),
            "removed_rows": len(removed),
            "changed_rows": len(changes),
            "unchanged_rows": len(common) - len(changes),
            "added_columns": added_cols,
            "removed_columns": removed_cols,
        },
        "added": added,
        "removed": removed,
        "changes": changes,
    }


def interpret(result: dict) -> str:
    lines = []
    s = result["summary"]

    lines.append("CSV 对比分析")
    lines.append("=" * 50)
    lines.append(f"旧文件: {result['old_file']['path']} ({result['old_file']['rows']}行)")
    lines.append(f"新文件: {result['new_file']['path']} ({result['new_file']['rows']}行)")
    lines.append(f"对比键: {result['key_column']}")
    lines.append("")

    lines.append(f"新增行: {s['added_rows']}")
    lines.append(f"删除行: {s['removed_rows']}")
    lines.append(f"修改行: {s['changed_rows']}")
    lines.append(f"未变行: {s['unchanged_rows']}")

    if s["added_columns"]:
        lines.append(f"新增列: {', '.join(s['added_columns'])}")
    if s["removed_columns"]:
        lines.append(f"删除列: {', '.join(s['removed_columns'])}")

    if result["added"]:
        lines.append("")
        lines.append("➕ 新增:")
        for k in result["added"][:10]:
            lines.append(f"  {k}")
        if len(result["added"]) > 10:
            lines.append(f"  ...及其他 {len(result['added']) - 10} 行")

    if result["removed"]:
        lines.append("")
        lines.append("➖ 删除:")
        for k in result["removed"][:10]:
            lines.append(f"  {k}")

    if result["changes"]:
        lines.append("")
        lines.append("✏️ 修改:")
        for c in result["changes"][:15]:
            lines.append(f"  [{c['key']}]")
            for ch in c["changes"]:
                lines.append(f"    {ch['column']}: {ch['old']} → {ch['new']}")
        if len(result["changes"]) > 15:
            lines.append(f"  ...及其他 {len(result['changes']) - 15} 行修改")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Compare two CSV files")
    parser.add_argument("old", help="Old/baseline CSV file")
    parser.add_argument("new", help="New/updated CSV file")
    parser.add_argument("--key", help="Column to use as row identifier (default: first column)")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    for f in [args.old, args.new]:
        if not Path(f).exists():
            print(f"Error: File not found: {f}", file=sys.stderr)
            sys.exit(1)

    result = compare(args.old, args.new, args.key)

    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(interpret(result))


if __name__ == "__main__":
    main()
