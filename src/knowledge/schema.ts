import { z } from "zod";

export const documentIds = [
  "owner-manual",
  "quick-start",
  "selection-chart",
] as const;
export const documentIdSchema = z.enum(documentIds);
export type DocumentId = z.infer<typeof documentIdSchema>;

export const normalizedRegionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .superRefine((region, context) => {
    if (region.x + region.width > 1.000001) {
      context.addIssue({ code: "custom", message: "region extends past the right page edge" });
    }
    if (region.y + region.height > 1.000001) {
      context.addIssue({ code: "custom", message: "region extends past the bottom page edge" });
    }
  });
export type NormalizedRegion = z.infer<typeof normalizedRegionSchema>;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const sourceRefSchema = z
  .object({
    id: z.string().regex(/^(owner-manual|quick-start|selection-chart):pdf-[1-9]\d*$/),
    documentId: documentIdSchema,
    documentTitle: z.string().min(1),
    pdfPageNumber: z.number().int().positive(),
    printedPageLabel: z.string().min(1).nullable(),
    section: z.string().min(1),
    assetUrl: z
      .string()
      .regex(/^\/manual-pages\/(owner-manual|quick-start|selection-chart)\/page-\d{3}\.webp$/),
    assetSha256: sha256Schema,
    textSha256: sha256Schema,
    region: normalizedRegionSchema.optional(),
  })
  .superRefine((source, context) => {
    const expectedId = `${source.documentId}:pdf-${source.pdfPageNumber}`;
    if (source.id !== expectedId) {
      context.addIssue({ code: "custom", path: ["id"], message: `source id must be ${expectedId}` });
    }
  });
export type SourceRef = z.infer<typeof sourceRefSchema>;

export const knowledgePageSchema = z.object({
  source: sourceRefSchema,
  text: z.string(),
  tags: z.array(z.string().min(1)),
  safety: z.boolean(),
});
export type KnowledgePage = z.infer<typeof knowledgePageSchema>;

export const visualEvidenceSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  caption: z.string().min(1),
  entities: z.array(z.string().min(1)),
  relationships: z.array(z.string().min(1)),
  aliases: z.array(z.string().min(1)),
  intents: z.array(z.string().min(1)),
  regions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      bounds: normalizedRegionSchema,
    }),
  ),
  assetUrl: z.string().regex(/^\/manual-regions\/[a-z0-9-]+\.webp$/),
  assetSha256: sha256Schema,
});
export type VisualEvidence = z.infer<typeof visualEvidenceSchema>;

export const sourceDocumentSchema = z.object({
  id: documentIdSchema,
  title: z.string().min(1),
  sourcePath: z.string().min(1),
  publicUrl: z.string().regex(/^\/manuals\/[a-z0-9-]+\.pdf$/),
  sha256: sha256Schema,
  pages: z.number().int().positive(),
});

export const knowledgeManifestSchema = z.object({
  schemaVersion: z.literal(1),
  corpusVersion: z.string().min(1),
  generatorVersion: z.string().min(1),
  toolchain: z.record(z.string(), z.string().min(1)),
  documents: z.array(sourceDocumentSchema).length(3),
  pages: z.array(knowledgePageSchema).length(51),
});
export type KnowledgeManifest = z.infer<typeof knowledgeManifestSchema>;

export type SearchHit = {
  source: SourceRef;
  excerpt: string;
  score: number;
  matchedTerms: string[];
  visualEvidenceIds: string[];
};
