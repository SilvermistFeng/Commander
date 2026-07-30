"""Command-line front door for the parser.

Two ways to use it:

    # One note as an argument
    parse-transaction "Bought 100 NVDA at $125 yesterday with $2 fee"

    # A stream of notes, one per line, from a file or a pipe
    cat trades.txt | parse-transaction

Per the schema contract, it prints *only* JSON to standard output — one JSON
object per input line — so it drops cleanly into a data pipeline. Any warnings
(unknown tickers and the like) go to standard error, where they won't corrupt
the JSON stream.
"""

from __future__ import annotations

import sys

from portfolio.parser import parse
from portfolio.schema import SchemaError


def _process(line: str) -> int:
    """Parse one line, print its JSON, return a process-style exit code."""
    line = line.strip()
    if not line:
        return 0
    try:
        result = parse(line)
    except (ValueError, SchemaError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(result.to_json())
    for warning in result.warnings:
        print(f"warning: {warning}", file=sys.stderr)
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]

    if argv:
        # Everything on the command line is treated as a single note.
        return _process(" ".join(argv))

    # No arguments: read notes from standard input, one per line.
    exit_code = 0
    for line in sys.stdin:
        exit_code |= _process(line)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
