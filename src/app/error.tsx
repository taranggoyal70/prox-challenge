"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="route-error">
      <p className="section-label">ARCLENS_INTERNAL</p>
      <h1>ArcLens could not open this workspace.</h1>
      <p>The local application hit an unexpected error. Your source files were not changed.</p>
      <button type="button" onClick={reset}>Try opening it again</button>
    </main>
  );
}
