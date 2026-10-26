import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  knowledgeManifestSchema,
  visualEvidenceSchema,
  type KnowledgeManifest,
  type VisualEvidence,
} from "@/knowledge/schema";

const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
const publicPath = (root: string, url: string) =>
  join(root, "public", url.replace(/^\//, ""));

export function validateKnowledgePackage(input: {
  root: string;
  manifest: unknown;
  visualEvidence: unknown;
}): { pages: number; visualEvidence: number } {
  const manifest: KnowledgeManifest = knowledgeManifestSchema.parse(input.manifest);
  const visuals: VisualEvidence[] = visualEvidenceSchema.array().parse(input.visualEvidence);
  const pageIds = new Set<string>();

  for (const document of manifest.documents) {
    const sourcePath = join(input.root, document.sourcePath);
    if (!existsSync(sourcePath)) throw new Error(`missing source PDF: ${document.sourcePath}`);
    if (sha256(readFileSync(sourcePath)) !== document.sha256) {
      throw new Error(`stale source checksum: ${document.id}`);
    }
    const publishedPath = publicPath(input.root, document.publicUrl);
    if (!existsSync(publishedPath)) throw new Error(`missing public PDF: ${document.publicUrl}`);
    if (sha256(readFileSync(publishedPath)) !== document.sha256) {
      throw new Error(`public PDF differs from source: ${document.id}`);
    }
  }

  for (const page of manifest.pages) {
    if (pageIds.has(page.source.id)) throw new Error(`duplicate source id: ${page.source.id}`);
    pageIds.add(page.source.id);
    if (sha256(page.text) !== page.source.textSha256) {
      throw new Error(`stale page text checksum: ${page.source.id}`);
    }
    const assetPath = publicPath(input.root, page.source.assetUrl);
    if (!existsSync(assetPath)) throw new Error(`missing page asset: ${page.source.assetUrl}`);
    if (sha256(readFileSync(assetPath)) !== page.source.assetSha256) {
      throw new Error(`stale page asset checksum: ${page.source.id}`);
    }
  }

  for (const visual of visuals) {
    if (!pageIds.has(visual.sourceId)) throw new Error(`orphan visual: ${visual.id}`);
    const assetPath = publicPath(input.root, visual.assetUrl);
    if (!existsSync(assetPath)) throw new Error(`missing visual asset: ${visual.assetUrl}`);
    if (sha256(readFileSync(assetPath)) !== visual.assetSha256) {
      throw new Error(`stale visual asset checksum: ${visual.id}`);
    }
  }

  return { pages: manifest.pages.length, visualEvidence: visuals.length };
}
