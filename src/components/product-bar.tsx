import type { ArcLensMode } from "@/config";

const modeLabels: Record<ArcLensMode, string> = {
  "build-no-key": "Recorded proof",
  "live-local": "Live · local",
  "hosted-read-only": "Live · hosted read-only",
  "hosted-admin": "Live · hosted admin",
};

export function ProductBar({ mode }: { mode: ArcLensMode }) {
  const modeLabel = modeLabels[mode];

  return (
    <header className="product-bar">
      <a className="wordmark" href="#top" aria-label="ArcLens home">
        <span className="wordmark__mark" aria-hidden="true">A</span>
        <span>ArcLens</span>
      </a>
      <div className="product-bar__machine">
        <span
          className={mode === "build-no-key" ? "status-light status-light--recorded" : "status-light"}
          aria-hidden="true"
        />
        Vulcan OmniPro 220
      </div>
      <div className="mode-badge">{modeLabel}</div>
    </header>
  );
}
