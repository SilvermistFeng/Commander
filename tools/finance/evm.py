#!/usr/bin/env python3
"""Earned Value Management (EVM) Calculator.

Usage:
    python evm.py --bac 100000 --pv 40000 --ev 35000 --ac 42000
    python evm.py --bac 100000 --pv 40000 --ev 35000 --ac 42000 --format json
"""

import argparse
import json
import sys


def calculate_evm(bac: float, pv: float, ev: float, ac: float) -> dict:
    """Calculate all EVM metrics from the four base values.

    Args:
        bac: Budget at Completion — total approved budget
        pv:  Planned Value — budgeted cost of work scheduled
        ev:  Earned Value — budgeted cost of work performed
        ac:  Actual Cost — actual cost of work performed
    """
    # Variances (positive = good)
    sv = ev - pv          # Schedule Variance
    cv = ev - ac          # Cost Variance

    # Performance Indices (>1.0 = good)
    spi = ev / pv if pv else 0.0   # Schedule Performance Index
    cpi = ev / ac if ac else 0.0   # Cost Performance Index

    # Forecasts
    eac_cum = bac / cpi if cpi else 0.0           # Estimate at Completion (CPI trend)
    eac_mixed = ac + (bac - ev) / (cpi * spi) if (cpi and spi) else 0.0  # EAC (CPI×SPI trend)
    etc = eac_cum - ac                              # Estimate to Complete
    vac = bac - eac_cum                             # Variance at Completion

    # To Complete Performance Index — what CPI is needed to finish on budget
    tcpi_bac = (bac - ev) / (bac - ac) if (bac - ac) else 0.0   # TCPI against BAC
    tcpi_eac = (bac - ev) / (eac_cum - ac) if (eac_cum - ac) else 0.0  # TCPI against EAC

    # Percent complete
    pct_complete = (ev / bac * 100) if bac else 0.0
    pct_spent = (ac / bac * 100) if bac else 0.0

    return {
        "inputs": {"BAC": bac, "PV": pv, "EV": ev, "AC": ac},
        "variances": {"SV": round(sv, 2), "CV": round(cv, 2)},
        "indices": {"SPI": round(spi, 4), "CPI": round(cpi, 4)},
        "forecasts": {
            "EAC_cpi": round(eac_cum, 2),
            "EAC_mixed": round(eac_mixed, 2),
            "ETC": round(etc, 2),
            "VAC": round(vac, 2),
        },
        "tcpi": {"TCPI_BAC": round(tcpi_bac, 4), "TCPI_EAC": round(tcpi_eac, 4)},
        "progress": {
            "pct_complete": round(pct_complete, 1),
            "pct_spent": round(pct_spent, 1),
        },
    }


def interpret(r: dict) -> str:
    """Generate plain-language interpretation of EVM results."""
    lines = []
    inp = r["inputs"]
    var = r["variances"]
    idx = r["indices"]
    frc = r["forecasts"]
    tcpi = r["tcpi"]
    prg = r["progress"]

    lines.append(f"项目预算 (BAC): {inp['BAC']:,.0f}")
    lines.append(f"完成进度: {prg['pct_complete']}% | 已花费: {prg['pct_spent']}% 预算")
    lines.append("")

    # Schedule
    if var["SV"] > 0:
        lines.append(f"进度: 超前 {var['SV']:,.0f} (SPI={idx['SPI']})")
    elif var["SV"] < 0:
        lines.append(f"进度: 落后 {abs(var['SV']):,.0f} (SPI={idx['SPI']})")
    else:
        lines.append(f"进度: 按计划 (SPI={idx['SPI']})")

    # Cost
    if var["CV"] > 0:
        lines.append(f"成本: 节省 {var['CV']:,.0f} (CPI={idx['CPI']})")
    elif var["CV"] < 0:
        lines.append(f"成本: 超支 {abs(var['CV']):,.0f} (CPI={idx['CPI']})")
    else:
        lines.append(f"成本: 按预算 (CPI={idx['CPI']})")

    lines.append("")
    lines.append(f"预计总成本 (EAC): {frc['EAC_cpi']:,.0f} (按当前CPI趋势)")
    lines.append(f"预计总成本 (EAC): {frc['EAC_mixed']:,.0f} (按CPI×SPI趋势)")
    lines.append(f"剩余预算需求 (ETC): {frc['ETC']:,.0f}")
    lines.append(f"完工偏差 (VAC): {frc['VAC']:,.0f}")
    lines.append("")

    # TCPI assessment
    if tcpi["TCPI_BAC"] > 1.1:
        lines.append(f"TCPI: {tcpi['TCPI_BAC']} — 要在预算内完成，需要大幅提高效率。困难。")
    elif tcpi["TCPI_BAC"] > 1.0:
        lines.append(f"TCPI: {tcpi['TCPI_BAC']} — 要在预算内完成，需要略微提高效率。可行。")
    else:
        lines.append(f"TCPI: {tcpi['TCPI_BAC']} — 按预算完成的压力不大。")

    # Overall health
    lines.append("")
    if idx["CPI"] >= 1.0 and idx["SPI"] >= 1.0:
        lines.append("综合评估: 🟢 项目健康 — 进度和成本均在控制内。")
    elif idx["CPI"] >= 0.9 and idx["SPI"] >= 0.9:
        lines.append("综合评估: 🟡 需关注 — 轻微偏差，建议采取纠正措施。")
    else:
        lines.append("综合评估: 🔴 需干预 — 显著偏差，需要立即行动。")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Earned Value Management Calculator")
    parser.add_argument("--bac", type=float, required=True, help="Budget at Completion")
    parser.add_argument("--pv", type=float, required=True, help="Planned Value")
    parser.add_argument("--ev", type=float, required=True, help="Earned Value")
    parser.add_argument("--ac", type=float, required=True, help="Actual Cost")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    result = calculate_evm(args.bac, args.pv, args.ev, args.ac)

    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(interpret(result))


if __name__ == "__main__":
    main()
