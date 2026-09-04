"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "./SessionProvider";
import { clearGuestTrips, loadAllGuestTrips } from "@/lib/storage";
import { isGuestTripId } from "@/lib/guestPrefix";
import type { SessionUser } from "@/types";

type AuthMode = "signup" | "signin";
type OpenOptions = { mode?: AuthMode; reason?: string };

const AuthContext = createContext<{ open: (options?: OpenOptions) => void }>({ open: () => {} });

export function useAuthModal() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [reason, setReason] = useState<string | undefined>();

  const open = useCallback((options?: OpenOptions) => {
    setMode(options?.mode ?? "signup");
    setReason(options?.reason);
    setIsOpen(true);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={isOpen}
        mode={mode}
        reason={reason}
        onModeChange={setMode}
        onClose={() => setIsOpen(false)}
      />
    </AuthContext.Provider>
  );
}

function AuthModal({
  open,
  mode,
  reason,
  onModeChange,
  onClose,
}: {
  open: boolean;
  mode: AuthMode;
  reason?: string;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const { setUser } = useSession();
  const { push } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "form" | "demo">(null);

  /**
   * Everything built as a guest is posted to /api/users/sync-guest, which
   * writes it into Postgres under the new account. The response maps temporary
   * ids to real ones, so if the user is standing on a guest trip page we move
   * them to the saved version of the same trip without a visible jump.
   */
  const syncGuestWork = useCallback(async () => {
    const guestTrips = await loadAllGuestTrips();
    if (guestTrips.length === 0) return { synced: 0 };

    const res = await fetch("/api/users/sync-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trips: guestTrips }),
    });
    if (!res.ok) return { synced: 0 };

    const json = (await res.json()) as { synced: number; idMap: Record<string, string> };
    await clearGuestTrips();

    const currentId = pathname?.startsWith("/trips/") ? pathname.split("/")[2] : null;
    if (currentId && isGuestTripId(currentId) && json.idMap[currentId]) {
      router.replace(`/trips/${json.idMap[currentId]}`);
    } else {
      router.refresh();
    }
    return json;
  }, [pathname, router]);

  const finish = useCallback(
    async (user: SessionUser) => {
      setUser(user);
      const { synced } = await syncGuestWork();
      onClose();
      setPassword("");
      push(
        synced > 0 ? "Welcome aboard!" : `Signed in as ${user.name}`,
        "success",
        synced === 1
          ? "Your trip has been linked to your account."
          : synced > 1
            ? `${synced} trips have been linked to your account.`
            : undefined
      );
    },
    [onClose, push, setUser, syncGuestWork]
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy("form");
    try {
      const res = await fetch(mode === "signup" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "That didn't work. Try again.");
        return;
      }
      await finish(json.user as SessionUser);
    } catch {
      setError("Couldn't reach the server. Is it still running?");
    } finally {
      setBusy(null);
    }
  }

  async function loginAsDemo() {
    setError(null);
    setBusy("demo");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "The demo account isn't available.");
        return;
      }
      await finish(json.user as SessionUser);
    } catch {
      setError("Couldn't reach the server. Is it still running?");
    } finally {
      setBusy(null);
    }
  }

  const isSignup = mode === "signup";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={isSignup ? "Create your account" : "Welcome back"}
      subtitle={reason ?? (isSignup ? "Keep your trips, invite friends, and sync across devices." : "Sign in to pick up where you left off.")}
    >
      <form onSubmit={submit} className="space-y-4">
        {isSignup ? (
          <Field label="Your name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              autoComplete="name"
            />
          </Field>
        ) : null}

        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" hint={isSignup ? "At least 8 characters." : undefined}>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full justify-center" size="lg" disabled={busy !== null}>
          {busy === "form" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSignup ? "Create account" : "Sign in"}
        </Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full justify-center"
          onClick={loginAsDemo}
          disabled={busy !== null}
        >
          {busy === "demo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
          Login as Demo User
        </Button>

        <p className="pt-1 text-center text-sm text-muted">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => {
              onModeChange(isSignup ? "signin" : "signup");
              setError(null);
            }}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </button>
        </p>
      </form>
    </Modal>
  );
}
