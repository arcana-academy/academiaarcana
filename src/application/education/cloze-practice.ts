/** Generate bounded, deterministic blanks from learner-authored text only. */
export type ClozePart =
  | { kind: "text"; text: string }
  | { kind: "gap"; answer: string; number: number };

export const MAX_CLOZE_GAPS_PER_BLOCK = 3;

export function buildClozeParts(text: string): ClozePart[] {
  if (!text.trim()) return [];

  const parts: ClozePart[] = [];
  const used = new Set<string>();
  let cursor = 0;
  let count = 0;

  for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]{5,}/gu)) {
    const answer = match[0];
    const start = match.index;
    const key = answer.normalize("NFC").toLocaleLowerCase("pt-BR");
    if (used.has(key)) continue;
    if (count === MAX_CLOZE_GAPS_PER_BLOCK) break;

    if (start > cursor) parts.push({ kind: "text", text: text.slice(cursor, start) });
    count += 1;
    parts.push({ kind: "gap", answer, number: count });
    used.add(key);
    cursor = start + answer.length;
  }

  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });
  return parts;
}

/** Returns precisely the supplied source text when the gaps are revealed. */
export function reconstructCloze(parts: readonly ClozePart[]): string {
  return parts.map((part) => (part.kind === "gap" ? part.answer : part.text)).join("");
}
