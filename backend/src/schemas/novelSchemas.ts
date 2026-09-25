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

export const novelCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.'),
  description: z.string().trim().max(2000, 'Description is too long.').default(''),
  authorName: z
    .string()
    .trim()
    .max(100, 'Author name is too long.')
    .nullable()
    .optional()
    .default(null),
  genre: z.string().trim().max(60, 'Genre name is too long.').default('Other'),
  coverImageUrl: z
    .string()
    .trim()
    .max(500, 'Cover URL is too long.')
    .nullable()
    .optional()
    .default(null),
  frontMatterContent: tipTapDoc.optional(),
});

function emptyDoc() {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export const novelUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  authorName: z.string().trim().max(100).nullable().optional(),
  genre: z.string().trim().max(60).optional(),
  coverImageUrl: z.string().trim().max(500).nullable().optional(),
});