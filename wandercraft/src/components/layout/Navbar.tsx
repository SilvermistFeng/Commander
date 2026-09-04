"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Compass, LogOut, Moon, Sun, Monitor, User as UserIcon, Settings, Map } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Misc";
import { useSession } from "@/components/providers/SessionProvider";
import { useAuthModal } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, setUser } = useSession();
  const { open } = useAuthModal();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
            <Compass className="h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-xl font-medium tracking-tight">WanderCraft</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href="/trips"
                className={cn(
                  "hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition sm:inline-flex",
                  pathname === "/trips" ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                )}
              >
                <Map className="h-4 w-4" />
                My trips
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-surface-2"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size={30} />
                </button>

                {menuOpen ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                    <div className="anim-fade-up absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-float">
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                      <MenuLink href="/trips" icon={<Map className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                        My trips
                      </MenuLink>
                      <MenuLink href="/profile" icon={<UserIcon className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                        Profile
                      </MenuLink>
                      <MenuLink href="/settings" icon={<Settings className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                        Settings
                      </MenuLink>
                      <button
                        onClick={signOut}
                        className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-left text-sm text-ink-2 transition hover:bg-surface-2 hover:text-ink"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => open({ mode: "signin" })}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => open({ mode: "signup" })}>
                Create account
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 transition hover:bg-surface-2 hover:text-ink"
    >
      {icon}
      {children}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${theme}. Switch to ${next}.`}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      className="rounded-lg p-2 text-ink-2 transition hover:bg-surface-2 hover:text-ink"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
