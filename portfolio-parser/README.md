# portfolio-parser

Turns plain-English trade notes into strict, validated JSON — the ingestion
layer for the investment dashboard.

You type this:

```
Bought 100 shares of NVDA at $125 yesterday in my Fidelity account with $2 fee
```

It produces this:

```json
{"type":"BUY","symbol":"NVDA","asset_class":"STOCK","date":"2026-07-29","units":100,"unit_price":125,"fee":2,"currency":"USD","exchange_rate_to_base":1,"account_id":"Fidelity","tax_details":{"cost_basis_method":"FIFO"}}
```

## Why it's built this way

- **Deterministic and offline.** Pure Python standard library, no dependencies,
  no network calls. The same note with the same reference date always gives the
  same result — which is exactly what you want from financial data.
- **Safe by design.** It never runs the input as code, never fetches a URL, and
  never looks a ticker up over the wire. Unknown tickers are *flagged* for a
  later validation check, not silently trusted. Hostile input can't do more than
  produce a warning.
- **Readable rules.** Each field (price, fee, date, account…) has its own small
  extractor, so the logic is easy to follow, test, and extend — no single
  impenetrable mega-regex.

This matches the project's standing rule: no live broker connections and no API
keys with trading permissions until explicitly authorised. This module is the
parsing brain only; wiring it to a real brokerage feed is a separate, deliberate
step.

## What it understands

| Field | Examples it reads |
|---|---|
| Transaction type | bought, sold, dividend, split, deposit, withdrew, transferred |
| Asset class | stocks/ETFs, crypto (`BTC`, `ETH`…), options (call/put), bonds, forex pairs (`EUR/USD`) |
| Date | `today`, `yesterday`, `3 days ago`, `last Friday`, `2026-01-15`, `Aug 20 2026` |
| Amounts | `100 shares`, `0.5 BTC`, `1,500 units`, `at $125`, `$150 each`, `$2 fee` |
| Currency | `$`, `€`, `£`, `¥`, or codes like `SGD`; defaults to USD |
| Account | `in my Fidelity account`, `on Coinbase`, `account: X` |
| Option detail | strike (`$180 strike`) and expiry (`exp 2026-08-20`) |
| Bond detail | coupon (`4.5% coupon`), maturity, annual / semi-annual |
| Tax | cost-basis method (FIFO / LIFO / AVG), withheld dividend tax |

## Usage

### From Python

```python
from portfolio import parse

result = parse("Sold 50 TSLA at $250 today using LIFO")
print(result.to_json(indent=2))   # strict schema JSON
print(result.warnings)            # advisory notes, e.g. unknown ticker
```

### From the command line

```bash
# a single note
parse-transaction "Bought 0.5 BTC at $60000 on Coinbase"

# or a batch, one note per line
cat trades.txt | parse-transaction
```

JSON goes to standard output (one object per line); warnings go to standard
error, so a downstream pipeline receives clean JSON.

## Developing

```bash
cd portfolio-parser
pip install -e ".[dev]"
pytest          # 50 tests, including the two spec examples as golden tests
ruff check .
```

## Layout

```
src/portfolio/
  schema.py   # the data shape: enums, dataclasses, validation, JSON output
  dates.py    # human date phrases → calendar dates
  parser.py   # sentence → validated Transaction (one extractor per field)
  cli.py      # command-line / pipe front door
tests/        # golden, parser, date, and schema tests
```
