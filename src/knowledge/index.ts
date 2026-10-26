import rawManifest from "@/knowledge/generated/manifest.json";
import rawVisualEvidence from "@/knowledge/generated/visual-evidence.json";
import { validateKnowledgePackage } from "@/knowledge/integrity";

import {
  documentIdSchema,
  knowledgeManifestSchema,
  visualEvidenceSchema,
  type DocumentId,
  type KnowledgePage,
  type SearchHit,
  type VisualEvidence,
} from "@/knowledge/schema";

const manifest = knowledgeManifestSchema.parse(rawManifest);
const visualEvidence = visualEvidenceSchema.array().parse(rawVisualEvidence);
const pagesById = new Map(manifest.pages.map((page) => [page.source.id, page]));
const visualsById = new Map(visualEvidence.map((visual) => [visual.id, visual]));
const visualsBySource = new Map<string, VisualEvidence[]>();

for (const visual of visualEvidence) {
  const existing = visualsBySource.get(visual.sourceId) ?? [];
  existing.push(visual);
  visualsBySource.set(visual.sourceId, existing);
}

const stopWords = new Set([
  "a", "an", "and", "at", "but", "do", "does", "for", "how", "i", "in", "is", "it",
  "my", "of", "on", "or", "the", "to", "what", "which", "with",
]);
const aliases: Record<string, string[]> = {
  dcen: ["electrode negative", "direct current electrode negative"],
  dcep: ["electrode positive", "direct current electrode positive"],
  ground: ["work clamp", "ground clamp"],
  tig: ["gtaw"],
  mig: ["gmaw"],
  stick: ["smaw"],
  "flux-core": ["flux cored", "fcaw", "gasless"],
  mcu: ["microcontroller", "control board"],
  generator: ["specifications", "input current", "kva", "circuit amperage"],
  "spool-gun": ["spool gun", "optional spool gun", "aluminum wire setup"],
  porosity: ["porosity in the weld metal", "possible causes", "likely solutions"],
  penetration: ["workpiece heat control", "stick weld diagnosis", "wire weld penetration"],
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9+.-]+/g, " ")
    .trim();
}

function termsFor(query: string): string[] {
  const normalized = normalize(query);
  const expanded = new Set(
    normalized
      .split(/\s+/)
      .filter((term) => term.length > 1 && !stopWords.has(term)),
  );
  for (const [canonical, related] of Object.entries(aliases)) {
    if (normalized.includes(canonical) || related.some((candidate) => normalized.includes(candidate))) {
      expanded.add(canonical);
      for (const candidate of related) {
        for (const term of candidate.split(" ")) expanded.add(term);
      }
    }
  }
  return [...expanded];
}

function stemToken(value: string): string {
  return value.length > 4 && value.endsWith("s") ? value.slice(0, -1) : value;
}

function proximityBonus(query: string, candidate: string): number {
  const needles = normalize(query)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term))
    .map(stemToken);
  if (needles.length < 2) return 0;
  const tokens = normalize(candidate).split(/\s+/).map(stemToken);
  let best = 0;
  for (let start = 0; start < tokens.length; start += 1) {
    const window = new Set(tokens.slice(start, start + 12));
    best = Math.max(best, needles.filter((needle) => window.has(needle)).length);
  }
  return best >= Math.min(4, needles.length) ? best * 6 : 0;
}

function excerptFor(page: KnowledgePage, visual: VisualEvidence[]): string {
  const collapsed = page.text.replace(/\s+/g, " ").trim();
  return (collapsed || visual.map((item) => item.caption).join(" ")).slice(0, 320);
}

export function searchManual(
  query: string,
  options: { limit?: number; documentIds?: DocumentId[] } = {},
): SearchHit[] {
  const terms = termsFor(query);
  if (terms.length === 0) return [];
  const allowedDocuments = options.documentIds
    ? new Set(options.documentIds.map((id) => documentIdSchema.parse(id)))
    : undefined;

  return manifest.pages
    .filter((page) => !allowedDocuments || allowedDocuments.has(page.source.documentId))
    .map((page) => {
      const visual = visualsBySource.get(page.source.id) ?? [];
      const text = normalize(page.text);
      const sectionText = normalize(page.source.section);
      const tagText = normalize(page.tags.join(" "));
      const visualText = normalize(
        visual
          .flatMap((item) => [
            item.caption,
            ...item.entities,
            ...item.relationships,
            ...item.aliases,
            ...item.intents,
            ...item.regions.map((region) => region.label),
          ])
          .join(" "),
      );
      const matchedTerms = terms.filter(
        (term) => text.includes(term) || tagText.includes(term) || visualText.includes(term),
      );
      const diagnosticIntent = /\b(?:diagnos|troubleshoot|problem|solution|cause|fix|check|porosity)\w*\b/.test(normalize(query));
      const score = matchedTerms.reduce(
        (total, term) =>
          total +
          (text.includes(term) ? 1 : 0) +
          (sectionText.includes(term) ? 5 : 0) +
          (tagText.includes(term) ? 2 : 0) +
          (visualText.includes(term) ? 4 : 0),
        0,
      ) + proximityBonus(query, `${page.source.section} ${page.text}`)
        + (diagnosticIntent && sectionText.includes("maintenance and troubleshooting") ? 30 : 0);
      return {
        source: page.source,
        excerpt: excerptFor(page, visual),
        score,
        matchedTerms,
        visualEvidenceIds: visual.map((item) => item.id),
      } satisfies SearchHit;
    })
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score || left.source.id.localeCompare(right.source.id))
    .slice(0, options.limit ?? 8);
}

export function getSource(id: string) {
  return pagesById.get(id)?.source;
}

export function getPageText(id: string): string | undefined {
  return pagesById.get(id)?.text;
}

export function isSafetySource(id: string): boolean {
  return pagesById.get(id)?.safety ?? false;
}

export function getPage(
  documentId: DocumentId,
  pdfPageNumber: number,
): KnowledgePage | undefined {
  if (!Number.isInteger(pdfPageNumber) || pdfPageNumber < 1) return undefined;
  return pagesById.get(`${documentId}:pdf-${pdfPageNumber}`);
}

export function getVisualEvidence(id: string): VisualEvidence | undefined {
  return visualsById.get(id);
}

export function getKnowledgeStatus(): {
  valid: true;
  corpusVersion: string;
  schemaVersion: number;
} {
  validateKnowledgePackage({
    root: process.cwd(),
    manifest: rawManifest,
    visualEvidence: rawVisualEvidence,
  });
  return {
    valid: true,
    corpusVersion: manifest.corpusVersion,
    schemaVersion: manifest.schemaVersion,
  };
}

export { manifest as knowledgeManifest, visualEvidence };
