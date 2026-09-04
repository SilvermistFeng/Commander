import { Database } from "lucide-react";

/**
 * Shown when the app can reach the page but not the database. The point is to
 * name the exact commands that fix it rather than showing a stack trace.
 */
export function DatabaseNotice({ error }: { error: string | null }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5 py-16 sm:px-8">
      <div className="rounded-2xl border border-line bg-surface p-8 shadow-ambient">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-wash text-amber">
          <Database className="h-5 w-5" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">
          The database isn&rsquo;t ready yet
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          {error
            ? "WanderCraft is running, but it can't reach PostgreSQL or the destination catalogue is empty."
            : "WanderCraft is connected, but there are no destinations in the catalogue yet."}
        </p>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Run these three commands
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface-2 px-4 py-3.5 text-[13px] leading-7 text-ink-2">
{`docker compose up -d
npx prisma migrate deploy
npm run db:seed`}
        </pre>

        {error ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted transition hover:text-ink">
              Show the technical error
            </summary>
            <p className="mt-2 break-words rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-muted">
              {error}
            </p>
          </details>
        ) : null}
      </div>
    </main>
  );
}
