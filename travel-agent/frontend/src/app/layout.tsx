import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripOptimiser — AI Trip Planner",
  description:
    "Plan your perfect trip. Enter a city, dates, and budget — get an optimised day-by-day itinerary.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
