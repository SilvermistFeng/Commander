"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "dark" | "system";

export const THEME_COOKIE = "wc_theme";
const STORAGE_KEY = "wandercraft.theme";

/**
 * Three states, no flash, no inline script.
 *
 * "system" needs no JavaScript at all — the stylesheet answers it with
 * prefers-color-scheme. An explicit choice is written to a cookie as well as
 * localStorage, and the server layout stamps data-theme onto <html> from that
 * cookie, so the correct theme is in the very first byte of HTML.
 *
 * The choice lives in the cookie and in the DOM — both outside React — so it's
 * read through useSyncExternalStore rather than mirrored into state.
 */

let cached: ThemeChoice = "system";

function readChoice(): ThemeChoice {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* private browsing — fall through */
  }
  return "system";
}

function subscribe(onChange: () => void) {
  const handle = () => onChange();
  window.addEventListener("storage", handle);
  window.addEventListener("wc:themechange", handle);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener("wc:themechange", handle);
  };
}

// The snapshot must be referentially stable between renders or React loops.
function getSnapshot(): ThemeChoice {
  const next = readChoice();
  if (next !== cached) cached = next;
  return cached;
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

const ThemeContext = createContext<{ theme: ThemeChoice; setTheme: (t: ThemeChoice) => void }>({
  theme: "system",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((choice: ThemeChoice) => {
    // "system" means "stop overriding" — remove the attribute and let the
    // stylesheet's media query take over again.
    if (choice === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = choice;
    }

    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* the attribute above still applies for this session */
    }
    // One year, lax: enough for the server to render the right theme next visit.
    document.cookie = `${THEME_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;

    cached = choice;
    window.dispatchEvent(new Event("wc:themechange"));
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
