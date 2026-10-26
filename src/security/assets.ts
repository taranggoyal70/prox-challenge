const trustedAssetPatterns = [
  /^\/manual-pages\/(owner-manual|quick-start|selection-chart)\/page-\d{3}\.webp$/,
  /^\/manual-regions\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/,
  /^\/manuals\/(owner-manual|quick-start-guide|selection-chart)\.pdf$/,
] as const;

const manualPdfByDocumentId = {
  "owner-manual": "/manuals/owner-manual.pdf",
  "quick-start": "/manuals/quick-start-guide.pdf",
  "selection-chart": "/manuals/selection-chart.pdf",
} as const;

export type TrustedDocumentId = keyof typeof manualPdfByDocumentId;

export function assertTrustedLocalAssetUrl(url: string): string {
  if (
    url.length > 180 ||
    url.includes("..") ||
    url.includes("\\") ||
    url.includes("%") ||
    !trustedAssetPatterns.some((pattern) => pattern.test(url))
  ) {
    throw new Error("Asset URL is not in the ArcLens local allowlist");
  }

  return url;
}

export function trustedManualPdfUrl(documentId: TrustedDocumentId): string {
  return assertTrustedLocalAssetUrl(manualPdfByDocumentId[documentId]);
}
