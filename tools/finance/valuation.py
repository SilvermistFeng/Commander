#!/usr/bin/env python3
"""Financial Valuation Calculator — NPV, IRR, WACC, Payback Period.

Bridges FlexiMasters theory to practical application.

Usage:
    python valuation.py npv --rate 0.10 --cf=-100000,30000,35000,40000,45000
    python valuation.py irr --cf=-100000,30000,35000,40000,45000
    python valuation.py wacc --equity 600000 --debt 400000 --ke 0.12 --kd 0.06 --tax 0.25
    python valuation.py payback --cf=-100000,30000,35000,40000,45000
"""

import argparse
import json
import sys


def npv(rate: float, cashflows: list[float]) -> dict:
    """Net Present Value calculation."""
    pv_flows = []
    total = 0
    for t, cf in enumerate(cashflows):
        pv = cf / (1 + rate) ** t
        pv_flows.append({"year": t, "cashflow": cf, "pv": round(pv, 2)})
        total += pv

    return {
        "method": "NPV",
        "discount_rate": rate,
        "npv": round(total, 2),
        "flows": pv_flows,
        "decision": "接受" if total > 0 else "拒绝",
        "interpretation": f"以 {rate*100:.1f}% 折现率计算，净现值为 {total:,.0f}。"
            + (f" 项目创造 {total:,.0f} 的价值。" if total > 0 else " 项目会损毁价值。"),
    }


def irr(cashflows: list[float], precision: float = 0.0001) -> dict:
    """Internal Rate of Return via bisection method."""
    low, high = -0.5, 5.0

    def calc_npv(r):
        return sum(cf / (1 + r) ** t for t, cf in enumerate(cashflows))

    # Bisection
    for _ in range(1000):
        mid = (low + high) / 2
        val = calc_npv(mid)
        if abs(val) < precision:
            break
        if val > 0:
            low = mid
        else:
            high = mid

    return {
        "method": "IRR",
        "irr": round(mid, 6),
        "irr_pct": f"{mid * 100:.2f}%",
        "interpretation": f"内部收益率为 {mid*100:.2f}%。如果这高于你的资本成本/门槛收益率，项目值得投资。",
    }


def wacc(equity: float, debt: float, ke: float, kd: float, tax: float) -> dict:
    """Weighted Average Cost of Capital."""
    total = equity + debt
    we = equity / total if total else 0
    wd = debt / total if total else 0
    result = we * ke + wd * kd * (1 - tax)

    return {
        "method": "WACC",
        "inputs": {
            "equity": equity, "debt": debt, "total": total,
            "ke": ke, "kd": kd, "tax_rate": tax,
            "weight_equity": round(we, 4), "weight_debt": round(wd, 4),
        },
        "wacc": round(result, 6),
        "wacc_pct": f"{result * 100:.2f}%",
        "interpretation": f"加权平均资本成本为 {result*100:.2f}%。"
            f" 这是评估项目可行性的最低门槛 — NPV折现率应用此值。",
    }


def payback(cashflows: list[float]) -> dict:
    """Payback Period calculation."""
    cumulative = 0
    for t, cf in enumerate(cashflows):
        cumulative += cf
        if cumulative >= 0 and t > 0:
            # Interpolate
            prev_cum = cumulative - cf
            fraction = abs(prev_cum) / cf if cf else 0
            period = (t - 1) + fraction
            return {
                "method": "Payback Period",
                "payback_years": round(period, 2),
                "interpretation": f"投资回收期为 {period:.1f} 年。",
                "cumulative_by_year": [
                    {"year": i, "cumulative": round(sum(cashflows[:i+1]), 2)}
                    for i in range(len(cashflows))
                ],
            }

    return {
        "method": "Payback Period",
        "payback_years": None,
        "interpretation": "在预测期内无法收回投资。",
    }


def main():
    parser = argparse.ArgumentParser(description="Financial Valuation Calculator")
    sub = parser.add_subparsers(dest="command")

    # Use --cf= syntax to handle negative numbers safely
    p_npv = sub.add_parser("npv")
    p_npv.add_argument("--rate", type=float, required=True, help="Discount rate (e.g. 0.10)")
    p_npv.add_argument("--cf", required=True, help="Comma-separated cashflows (e.g. --cf=-100000,30000,35000)")
    p_npv.add_argument("--format", choices=["text", "json"], default="text")

    p_irr = sub.add_parser("irr")
    p_irr.add_argument("--cf", required=True, help="Comma-separated cashflows")
    p_irr.add_argument("--format", choices=["text", "json"], default="text")

    p_wacc = sub.add_parser("wacc")
    p_wacc.add_argument("--equity", type=float, required=True)
    p_wacc.add_argument("--debt", type=float, required=True)
    p_wacc.add_argument("--ke", type=float, required=True, help="Cost of equity")
    p_wacc.add_argument("--kd", type=float, required=True, help="Cost of debt")
    p_wacc.add_argument("--tax", type=float, required=True, help="Tax rate")
    p_wacc.add_argument("--format", choices=["text", "json"], default="text")

    p_pb = sub.add_parser("payback")
    p_pb.add_argument("--cf", required=True, help="Comma-separated cashflows")
    p_pb.add_argument("--format", choices=["text", "json"], default="text")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "npv":
        cfs = [float(x) for x in args.cf.split(",")]
        result = npv(args.rate, cfs)
    elif args.command == "irr":
        cfs = [float(x) for x in args.cf.split(",")]
        result = irr(cfs)
    elif args.command == "wacc":
        result = wacc(args.equity, args.debt, args.ke, args.kd, args.tax)
    elif args.command == "payback":
        cfs = [float(x) for x in args.cf.split(",")]
        result = payback(cfs)

    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        for k, v in result.items():
            if k not in ("method", "flows", "cumulative_by_year", "inputs"):
                print(f"{k}: {v}")


if __name__ == "__main__":
    main()
