import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

export {
  readingTime,
  code
}

// a small TypeScript file, indented with spaces, one line far too long
const readingTime = `// counts the words in a text, as a person reading it would
export function countWords(text: string, locale = "en"): number {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  let count = 0;
  for (const segment of segmenter.segment(text)) {
    if (segment.isWordLike) count += 1;
  }
  return count;
}

// the reading time of a text, in whole minutes, at least one
export function readingTime(text: string, wordsPerMinute = 230): number {
  if (!Number.isInteger(wordsPerMinute) || wordsPerMinute <= 0) {
    throw new RangeError("wordsPerMinute has to be a whole number of words greater than zero, as many as a person reads in a minute, and " + wordsPerMinute + " isn't one");
  }
  return Math.max(1, Math.round(countWords(text) / wordsPerMinute));
}

type Summary = {
  words: number;
  minutes: number;
  longestLine: string;
};

export function summarize(text: string): Summary {
  const lines = text.split("\\n");
  const longestLine = lines.reduce((longest, line) => (line.length > longest.length ? line : longest), "");
  return { words: countWords(text), minutes: readingTime(text), longestLine };
}`

const code: _Scene_ = {
  name: "code",
  title: "Code",
  look: "A TypeScript file, as text: indentation in spaces lines up, the font being monospace; the one line too long for the view wraps, and carries on from the left edge, not under its indent.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text(readingTime, MODULE_PLAINTEXT)),
}
