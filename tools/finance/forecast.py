#!/usr/bin/env python3
"""Cost Forecast Calculator — project future costs based on current burn rate.

Usage:
    python forecast.py --budget 500000 --spent 180000 --elapsed 4 --total 12
    python forecast.py --budget 500000 --spent 180000 --elapsed 4 --total 12 --pct-complete 25
"""

import argparse
import json


def forecast(budget: float, spent: float, elapsed: int, total: int,
             pct_complete: float | None = None) -> dict:
    """Calculate cost forecast based on burn rate.

    Args:
        budget: Total approved budget
        spent: Amount spent so far
        elapsed: Months elapsed
        total: Total project duration in months
        pct_complete: Actual % complete (if known). If None, assume linear.
    """
    remaining_months = total - elapsed
    monthly_burn = spent / elapsed if elapsed else 0

    # Linear forecast (time-based)
    forecast_linear = monthly_burn * total
    remaining_linear = budget - spent

    # If % complete is provided, use it for a more accurate forecast
    if pct_complete is not None and pct_complete > 0:
        pct = pct_complete / 100
        forecast_performance = spent / pct
        remaining_performance = forecast_performance - spent
    else:
        pct = elapsed / total if total else 0
        forecast_performance = forecast_linear
        remaining_performance = remaining_linear

    # Budget health
    budget_remaining = budget - spent
    months_of_runway = budget_remaining / monthly_burn if monthly_burn else 0

    return {
        "inputs": {
            "budget": budget,
            "spent": spent,
            "elapsed_months": elapsed,
            "total_months": total,
            "pct_complete": pct_complete,
        },
        "burn_rate": {
            "monthly": round(monthly_burn, 2),
            "daily_approx": round(monthly_burn / 22, 2),  # ~22 working days
        },
        "forecast": {
            "linear": round(forecast_linear, 2),
            "performance_based": round(forecast_performance, 2),
            "remaining_cost": round(remaining_performance, 2),
        },
        "budget_health": {
            "remaining": round(budget_remaining, 2),
            "months_of_runway": round(months_of_runway, 1),
            "will_overrun": forecast_performance > budget,
            "projected_overrun": round(max(0, forecast_performance - budget), 2),
        },
    }


def interpret(r: dict) -> str:
    """Generate plain-language forecast."""
    lines = []
    inp = r["inputs"]
    burn = r["burn_rate"]
    frc = r["forecast"]
    health = r["budget_health"]

    lines.append("成本预测分析")
    lines.append("=" * 40)
    lines.append("")
    lines.append(f"项目预算: {inp['budget']:,.0f}")
    lines.append(f"已花费: {inp['spent']:,.0f} ({inp['elapsed_months']}/{inp['total_months']} 个月)")
    lines.append(f"月均烧钱速度: {burn['monthly']:,.0f}/月 (约 {burn['daily_approx']:,.0f}/工作日)")
    lines.append("")

    lines.append(f"线性预测 (按时间): {frc['linear']:,.0f}")
    if inp["pct_complete"]:
        lines.append(f"绩效预测 (按完成度{inp['pct_complete']}%): {frc['performance_based']:,.0f}")
    lines.append(f"预计剩余需求: {frc['remaining_cost']:,.0f}")
    lines.append("")

    lines.append(f"剩余预算: {health['remaining']:,.0f}")
    lines.append(f"按当前速度可撑: {health['months_of_runway']} 个月 (需要 {inp['total_months'] - inp['elapsed_months']} 个月)")
    lines.append("")

    if health["will_overrun"]:
        lines.append(f"🔴 预计超支: {health['projected_overrun']:,.0f}")
        lines.append("建议: 立即审查成本驱动因素，考虑范围调整或追加预算申请。")
    elif health["months_of_runway"] < (inp["total_months"] - inp["elapsed_months"]) * 1.1:
        lines.append("🟡 预算紧张 — 跑道不足，需密切监控。")
    else:
        lines.append("🟢 预算健康 — 按当前趋势可在预算内完成。")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Cost Forecast Calculator")
    parser.add_argument("--budget", type=float, required=True)
    parser.add_argument("--spent", type=float, required=True)
    parser.add_argument("--elapsed", type=int, required=True, help="Months elapsed")
    parser.add_argument("--total", type=int, required=True, help="Total project months")
    parser.add_argument("--pct-complete", type=float, default=None, help="Actual % complete")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    result = forecast(args.budget, args.spent, args.elapsed, args.total, args.pct_complete)

    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(interpret(result))


if __name__ == "__main__":
    main()
