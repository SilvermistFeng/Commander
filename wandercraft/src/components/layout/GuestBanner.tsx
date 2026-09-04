"use client";

import { Info } from "lucide-react";
import { useAuthModal } from "@/components/providers/AuthProvider";

/**
 * Sits above the trip workspace while the trip only exists in this browser.
 * Deliberately a strip rather than a modal: it informs without blocking.
 */
export function GuestBanner() {
  const { open } = useAuthModal();

  return (
    <div className="border-b border-accent/20 bg-accent-wash">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5 text-sm sm:px-8">
        <Info className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-ink-2">
          You&rsquo;re planning as a Guest. This trip is saved in this browser only.
        </p>
        <button
          onClick={() => open({ mode: "signup", reason: "Create an account to invite friends and sync this trip across your devices." })}
          className="font-semibold text-accent underline underline-offset-2 transition hover:text-accent-hover"
        >
          Sign in or create an account
        </button>
        <span className="text-muted">to invite friends and sync across devices.</span>
      </div>
    </div>
  );
}
