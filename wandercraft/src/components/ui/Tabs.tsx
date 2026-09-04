"use client";

import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string; icon?: React.ReactNode; badge?: string | number };

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("-mb-px flex gap-1 overflow-x-auto", className)} role="tablist">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition",
              isActive
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:border-line-strong hover:text-ink"
            )}
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && item.badge !== 0 ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tnum",
                  isActive ? "bg-accent-wash text-accent" : "bg-surface-2 text-muted"
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
