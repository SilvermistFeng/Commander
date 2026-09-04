"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SessionUser } from "@/types";

const SessionContext = createContext<{
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  refresh: () => Promise<void>;
}>({ user: null, setUser: () => {}, refresh: async () => {} });

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = (await res.json()) as { user: SessionUser | null };
      setUser(json.user);
    } catch {
      /* leave the current value alone if the check fails */
    }
  }, []);

  const value = useMemo(() => ({ user, setUser, refresh }), [user, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
