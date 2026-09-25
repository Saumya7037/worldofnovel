export interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
}

export interface TipTapDoc {
  type: 'doc';
  content?: TipTapNode[];
}

export function emptyDocument(): TipTapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function countWords(doc: unknown): number {
  if (!doc || typeof doc !== 'object') return 0;
  let words = 0;
  const stack: TipTapNode[] = [doc as TipTapNode];
  while (stack.length) {
    const node = stack.pop() as TipTapNode;
    if (typeof node.text === 'string') {
      words += node.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) stack.push(child);
    }
  }
  return words;
}

export function normalizeDocument(value: unknown): TipTapDoc {
  if (
    value &&
    typeof value === 'object' &&
    (value as { type?: unknown }).type === 'doc' &&
    Array.isArray((value as { content?: unknown }).content)
  ) {
    return value as TipTapDoc;
  }
  return emptyDocument();
}