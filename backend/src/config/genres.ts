export const GENRES = [
  'Fantasy',
  'Romance',
  'Thriller',
  'Mystery',
  'Science Fiction',
  'Horror',
  'Adventure',
  'Historical',
  'Literary',
  'Young Adult',
  'Other',
] as const;

export function isGenre(value: string): boolean {
  return (GENRES as readonly string[]).includes(value);
}