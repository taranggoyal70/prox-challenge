"use client";

import Image from "next/image";
import { type KeyboardEvent, useEffect, useRef } from "react";

import type { EvidenceSource } from "@/components/recorded-proof-data";
import {
  assertTrustedLocalAssetUrl,
  trustedManualPdfUrl,
} from "@/security/assets";

export function EvidenceDialog({
  source,
  onClose,
}: {
  source: EvidenceSource;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const assetUrl = assertTrustedLocalAssetUrl(source.evidenceAssetUrl ?? source.assetUrl);
  const manualPdfUrl = trustedManualPdfUrl(source.documentId);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, []);

  return (
    <div className="evidence-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="evidence-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Manual evidence"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="evidence-dialog__header">
          <div>
            <p className="artifact__kicker">
              Manual evidence · {source.region ? "exact region" : "page level"}
            </p>
            <h2>
              {source.documentTitle} · PDF page {source.pdfPageNumber}
            </h2>
          </div>
          <button ref={closeRef} className="icon-button" type="button" onClick={onClose}>
            Close proof
          </button>
        </div>
        <div className="evidence-dialog__body">
          <figure className="manual-page">
            <Image
              src={assetUrl}
              alt={`${source.region ? "Manual region" : "Manual page"} ${source.pdfPageNumber}: ${source.section}`}
              width={900}
              height={1273}
              sizes="(max-width: 720px) 92vw, 52vw"
            />
          </figure>
          <aside className="proof-rail" aria-label="Evidence details">
            <p className="proof-rail__label">SOURCE 1</p>
            <h3>{source.section}</h3>
            {source.excerpt ? <blockquote>{source.excerpt}</blockquote> : null}
            <dl>
              <div>
                <dt>Transformation</dt>
                <dd>Looked up</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{source.id}</dd>
              </div>
              <div>
                <dt>Precision</dt>
                <dd>{source.region ? "Exact region" : "Full page"}</dd>
              </div>
            </dl>
            <a href={`${manualPdfUrl}#page=${source.pdfPageNumber}`}>
              Open full PDF page
            </a>
          </aside>
        </div>
      </section>
    </div>
  );

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
