import { normalizeSearch } from "./search";

export type SearchPassage = { anchor: string; label: string; text: string };
export type SearchSnippet = {
  anchor: string;
  label: string;
  before: string;
  match: string;
  after: string;
};

// Keep offsets into the original text: Serbian љ/њ/ђ/џ expand during normalization.
function normalizedOffsets(text: string, limit: number) {
  const starts: number[] = [],
    ends: number[] = [];
  let offset = 0;
  let separator = false;
  for (const character of text) {
    const value = normalizeSearch(character);
    if (value) {
      separator = false;
      for (let i = 0; i < value.length; i++) {
        starts.push(offset);
        ends.push(offset + character.length);
      }
    } else if (
      !/[\u0300-\u036f]/u.test(character) &&
      starts.length &&
      !separator
    ) {
      separator = true;
      starts.push(offset);
      ends.push(offset + character.length);
    }
    if (starts.length >= limit) break;
    offset += character.length;
  }
  return { starts, ends };
}

export function findSearchSnippet(
  passages: SearchPassage[],
  query: string,
): SearchSnippet | null {
  const needle = normalizeSearch(query);
  if (!needle) return null;
  for (const passage of passages) {
    const normalized = normalizeSearch(passage.text);
    const position = normalized.startsWith(needle)
      ? 0
      : normalized.indexOf(` ${needle}`) < 0
        ? -1
        : normalized.indexOf(` ${needle}`) + 1;
    if (position < 0) continue;
    const { starts, ends } = normalizedOffsets(
      passage.text,
      position + needle.length,
    );
    const start = starts[position],
      end = ends[position + needle.length - 1];
    let left = Math.max(0, start - 90),
      right = Math.min(passage.text.length, end + 160);
    while (left > 0 && left < start && !/\s/u.test(passage.text[left - 1]))
      left++;
    while (right < passage.text.length && !/\s/u.test(passage.text[right]))
      right++;
    return {
      anchor: passage.anchor,
      label: passage.label,
      before: (left ? "…" : "") + passage.text.slice(left, start),
      match: passage.text.slice(start, end),
      after:
        passage.text.slice(end, right) +
        (right < passage.text.length ? "…" : ""),
    };
  }
  return null;
}
