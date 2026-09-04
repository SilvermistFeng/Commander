"use client";

import { ArrowUpRight, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { HeroArt } from "@/components/layout/HeroArt";
import { formatCurrency } from "@/lib/utils";
import type { DestinationDTO } from "@/types";

export function DestinationCard({
  destination,
  onOpen,
}: {
  destination: DestinationDTO;
  onOpen: (destination: DestinationDTO) => void;
}) {
  const days = destination.blueprintData?.dayTitles?.length ?? 5;

  return (
    <button
      onClick={() => onOpen(destination)}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface text-left shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
    >
      <HeroArt gradient={destination.heroImage} className="h-40 shrink-0">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex justify-end">
            <span className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {days}-day blueprint
            </span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-medium leading-tight text-white drop-shadow-sm">
              {destination.name}
            </h3>
            <p className="text-sm text-white/80">{destination.country}</p>
          </div>
        </div>
      </HeroArt>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">{destination.summary}</p>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {destination.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} tone={tag === "Budget-Friendly" ? "sage" : "neutral"}>
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-sm text-ink-2">
            <Wallet className="h-3.5 w-3.5 text-muted" />
            <span className="tnum font-medium">
              {formatCurrency(destination.avgDailyBudget, "USD")}
            </span>
            <span className="text-muted">/ day</span>
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-accent">
            View plan
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
