import { z } from 'zod';

const tipTapDoc = z
  .unknown()
  .refine(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      (v as Record<string, unknown>).type === 'doc' &&
      Array.isArray((v as Record<string, unknown>).content),
    'Invalid document format.',
  );

export const chapterCreateSchema = z.object({
  title: z.string().trim().min(1).max(200).default('Untitled Chapter'),
  content: tipTapDoc.default({ type: 'doc', content: [{ type: 'paragraph' }] }),
});

export const chapterUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: tipTapDoc.optional(),
});

export const chapterReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, 'At least one chapter ID is required.'),
});

export const frontMatterUpdateSchema = z.object({
  content: tipTapDoc,
});