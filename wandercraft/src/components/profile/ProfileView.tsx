"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe2, MapPin, Plane, Save } from "lucide-react";
import { Panel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/components/providers/SessionProvider";
import { formatDate } from "@/lib/utils";

type ProfileUser = {
  id: string; email: string; name: string; username: string;
  avatarUrl: string | null; bio: string | null; homeCity: string | null;
  homeAirport: string | null; preferredCurrency: string; createdAt: string;
};

// Fixed gradients rather than uploads — an avatar that never 404s and needs no
// storage bucket.
const AVATARS = [
  "linear-gradient(135deg, #D95338, #E8A33D)",
  "linear-gradient(135deg, #2D5A46, #7FB79A)",
  "linear-gradient(135deg, #2E6F8E, #4A8FA8)",
  "linear-gradient(135deg, #4A3350, #A8577A)",
  "linear-gradient(135deg, #B45309, #E8A33D)",
  "linear-gradient(135deg, #0F766E, #5EC5B6)",
];

export function ProfileView({
  user,
  stats,
}: {
  user: ProfileUser;
  stats: { trips: number; activities: number; countries: number };
}) {
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio ?? "",
    homeCity: user.homeCity ?? "",
    homeAirport: user.homeAirport ?? "",
    avatarUrl: user.avatarUrl ?? "",
  });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const { refresh } = useSession();
  const router = useRouter();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const res = await fetch("/api/users/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      push("Profile saved.", "success");
      await refresh();
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      push(json?.error ?? "Couldn't save your profile.", "error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center gap-5">
        <span
          className="grain flex h-20 w-20 items-center justify-center rounded-2xl font-display text-3xl font-medium text-white"
          style={{ background: form.avatarUrl || AVATARS[0] }}
        >
          {form.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-medium tracking-tight">{user.name}</h1>
          <p className="text-[15px] text-muted">@{user.username} · joined {formatDate(user.createdAt, { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3">
        <Stat icon={<Plane className="h-4 w-4" />} label="Trips planned" value={stats.trips} />
        <Stat icon={<MapPin className="h-4 w-4" />} label="Activities" value={stats.activities} />
        <Stat icon={<Globe2 className="h-4 w-4" />} label="Countries" value={stats.countries} />
      </div>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-xl font-medium tracking-tight">Your details</h2>
        <form onSubmit={save} className="mt-5 space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>

          <Field label="About you">
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Slow traveller. Collects train tickets and market receipts."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home city">
              <Input
                value={form.homeCity}
                onChange={(e) => setForm((f) => ({ ...f, homeCity: e.target.value }))}
                placeholder="Manchester"
              />
            </Field>
            <Field label="Home airport" hint="Used to suggest flight routes later.">
              <Input
                value={form.homeAirport}
                onChange={(e) => setForm((f) => ({ ...f, homeAirport: e.target.value.toUpperCase() }))}
                placeholder="MAN"
                maxLength={4}
              />
            </Field>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((gradient) => (
                <button
                  key={gradient}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, avatarUrl: gradient }))}
                  aria-label="Choose avatar colour"
                  aria-pressed={form.avatarUrl === gradient}
                  className={
                    "grain relative flex h-11 w-11 items-center justify-center rounded-xl border-2 transition " +
                    (form.avatarUrl === gradient ? "border-accent" : "border-transparent hover:border-line-strong")
                  }
                  style={{ background: gradient }}
                >
                  {form.avatarUrl === gradient ? <Check className="h-4 w-4 text-white" /> : null}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" />
            Save profile
          </Button>
        </form>
      </Panel>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <Avatar name={user.name} size={32} />
        <p className="text-sm text-muted">
          Signed in as <strong className="font-medium text-ink">{user.email}</strong>
        </p>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-ambient">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </p>
      <p className="tnum mt-1 font-display text-2xl font-medium">{value}</p>
    </div>
  );
}
