import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import { getSessionUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { ThemeProvider, THEME_COOKIE } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WanderCraft — plan the trip, then sign up",
  description:
    "Search a destination, open a curated blueprint, and start planning immediately. Itinerary builder, route map, document locker, split budgets and a weather-driven packing list.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the session on the server so the header renders signed-in on first paint.
  let user = null;
  try {
    user = await getSessionUser();
  } catch {
    // A missing database shouldn't take the whole app down — the landing page
    // still works, and the error surfaces where it's actionable.
  }

  // Stamping the saved choice here means the first byte of HTML already carries
  // the right theme — no inline script, no flash, nothing for React to correct.
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = stored === "light" || stored === "dark" ? stored : undefined;

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body className={`${newsreader.variable} ${inter.variable} min-h-screen antialiased`}>
        <ThemeProvider>
          <SessionProvider initialUser={user}>
            <ToastProvider>
              <AuthProvider>
                <Navbar />
                {children}
              </AuthProvider>
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
