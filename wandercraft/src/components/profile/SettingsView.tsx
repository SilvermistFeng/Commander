"use client";

import { useState } from "react";
import { Monitor, Moon, Save, Sun } from "lucide-react";
import { Panel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

type Settings = {
  preferredCurrency: string;
  unitSystem: "METRIC" | "IMPERIAL";
  weekStartDay: "MONDAY" | "SUNDAY";
  theme: "LIGHT" | "DARK" | "SYSTEM";
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "MXN", "ZAR", "TRY", "VND", "NZD", "PEN", "MAD", "ISK", "DKK"];

export function SettingsView({ user }: { user: Settings }) {
  const [form, setForm] = useState<Settings>(user);
  const [busy, setBusy] = useState(false);
  const { setTheme } = useTheme();
  const { push } = useToast();

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
      // Apply the theme immediately rather than on next load.
      setTheme(form.theme.toLowerCase() as "light" | "dark" | "system");
      push("Settings saved.", "success");
    } else {
      push("Couldn't save your settings.", "error");
    }
  }

  const themes: { value: Settings["theme"]; label: string; icon: React.ReactNode }[] = [
    { value: "LIGHT", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "DARK", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { value: "SYSTEM", label: "Match system", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="font-display text-4xl font-medium tracking-tight">Settings</h1>
      <p className="mt-1 text-[15px] text-ink-2">How WanderCraft behaves for you across every trip.</p>

      <Panel className="mt-7 p-6">
        <form onSubmit={save} className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Appearance</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, theme: t.value }));
                    setTheme(t.value.toLowerCase() as "light" | "dark" | "system");
                  }}
                  aria-pressed={form.theme === t.value}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-medium transition active:scale-[0.98]",
                    form.theme === t.value
                      ? "border-accent bg-accent-wash text-accent"
                      : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Preferred currency" hint="Used as the default for new trips.">
            <Select
              value={form.preferredCurrency}
              onChange={(e) => setForm((f) => ({ ...f, preferredCurrency: e.target.value }))}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>

          <Field label="Units">
            <Select
              value={form.unitSystem}
              onChange={(e) => setForm((f) => ({ ...f, unitSystem: e.target.value as Settings["unitSystem"] }))}
            >
              <option value="METRIC">Metric — °C, km</option>
              <option value="IMPERIAL">Imperial — °F, miles</option>
            </Select>
          </Field>

          <Field label="Weeks start on">
            <Select
              value={form.weekStartDay}
              onChange={(e) => setForm((f) => ({ ...f, weekStartDay: e.target.value as Settings["weekStartDay"] }))}
            >
              <option value="MONDAY">Monday</option>
              <option value="SUNDAY">Sunday</option>
            </Select>
          </Field>

          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </form>
      </Panel>
    </main>
  );
}
