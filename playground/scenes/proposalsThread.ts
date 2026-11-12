import type { _Scene_ } from "../scene.ts"
import { parseTexts_Line, viewModelOf__Blocks, type _Item_Proposals_ } from "../../source/ViewModel_TextEditor.ts"
import { retry } from "../examples/javascript.ts"
import { actions_Review } from "../items.ts"
import { blocksWith__Frames, lineOf } from "../lines.ts"
import { attributesOf__Change, attributesOf__Nested, type _Side_Change_ } from "../looks.ts"
import { module_JavaScript } from "../syntax.ts"

export {
  proposalsThread
}

// the module's lines, numbered from 1, for the frames' lines as they are to
// be exactly the module's
const texts_retry = parseTexts_Line(retry)
const textAt = (number: number): string => texts_retry[number - 1] ?? ""

// the thread: the loop's counter, n, renamed round, wherever it is, in the
// doc comment, in retry and in backoff, one decision
const round = (side: _Side_Change_) => attributesOf__Change({ side, kind: "replaced", source: "round" })

// the removal: the onRetry hook taken out, in the doc comment, retry's
// options and its call; and where it takes out an n, the thread's renaming
// of it nested inside, applying only if the removal's rejected
const hook = attributesOf__Change({ side: "before", kind: "removed", source: "hook" })
const hookAndRound = { ...hook, ...attributesOf__Nested({ kind: "replaced", source: "round" }) }

// each proposal's item, listed in every frame it's in
const item_Hook: _Item_Proposals_ = {
  source: "hook",
  title: "Drop the onRetry hook",
  places: "",
  rationale: "Nothing passes onRetry any more: the callers log their retries in their own catch blocks.",
  actions: actions_Review,
  attributes: {},
}

const item_Round: _Item_Proposals_ = {
  source: "round",
  title: "Call the attempt counter round",
  places: "",
  rationale: "n says nothing; round says what it counts, in retry and in backoff alike, and in the doc comment that names it.",
  actions: actions_Review,
  attributes: {},
}

// the retry module with three frames: its doc comment's options, retry, and
// backoff; a rename threaded through all three, and a removal through the
// first two, the rename's places inside the removal nested in it
const proposalsThread: _Scene_ = {
  name: "proposals-thread",
  title: "A thread through frames, and a removal around it",
  look: "The JavaScript module with three frames: its doc comment's options, line 10; retry, lines 13 to 27; and backoff, lines 31 to 34. One proposal, a thread, renames the loop's counter, n, to round, in nine places through all three frames: each frame lists it, saying how many of its places are there, of how many, its actions deciding it everywhere. Another takes out the onRetry hook, in three places through the first two frames. Two of the thread's places are inside what the removal takes out, line 10's n and line 22's: they're the thread's fallback there, ringed faint, at half strength, applying only if the removal's rejected, and its items say so; as proposed, with every proposal taken, they're gone with the removal.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksWith__Frames({
    multilineText: retry,
    module_Language: module_JavaScript,
    frames: [
      {
        kind: "FRAME",
        range: { first: 10, last: 10 },
        parts: [
          {
            kind: "CURRENT_LINES",
            run: { id: "options-current", lines: [
              lineOf(" * @param {{ attempts?: number, signal?: AbortSignal", { text: ", onRetry?: (error: unknown, ", attributes: hook }, { text: "n", attributes: hookAndRound }, { text: ": number) => void", attributes: hook }, " }} [options]"),
            ], groups: [] },
          },
          {
            kind: "PROPOSAL_LINES",
            run: { id: "options-proposed", lines: [
              lineOf(" * @param {{ attempts?: number, signal?: AbortSignal }} [options]"),
            ], groups: [] },
          },
          { kind: "PROPOSAL_LIST", items: [item_Hook, item_Round] },
        ],
      },
      {
        kind: "FRAME",
        range: { first: 13, last: 27 },
        parts: [
          {
            kind: "CURRENT_LINES",
            run: { id: "retry-current", lines: [
              lineOf("export async function retry(attempt, { attempts = ATTEMPTS, signal", { text: ", onRetry", attributes: hook }, " } = {}) {"),
              lineOf(textAt(14)),
              lineOf("  for (let ", { text: "n", attributes: round("before") }, " = 1; ", { text: "n", attributes: round("before") }, " <= attempts; ", { text: "n", attributes: round("before") }, "++) {"),
              lineOf(textAt(16)),
              lineOf(textAt(17)),
              lineOf(textAt(18)),
              lineOf(textAt(19)),
              lineOf(textAt(20)),
              lineOf("      if (", { text: "n", attributes: round("before") }, " === attempts || !isRetryable(error)) break;"),
              lineOf({ text: "      onRetry?.(error, ", attributes: hook }, { text: "n", attributes: hookAndRound }, { text: ");", attributes: hook }),
              lineOf("      await sleep(backoff(", { text: "n", attributes: round("before") }, "), signal);"),
              lineOf(textAt(24)),
              lineOf(textAt(25)),
              lineOf(textAt(26)),
              lineOf(textAt(27)),
            ], groups: [] },
          },
          {
            kind: "PROPOSAL_LINES",
            run: { id: "retry-proposed", lines: [
              lineOf("export async function retry(attempt, { attempts = ATTEMPTS, signal } = {}) {"),
              lineOf(textAt(14)),
              lineOf("  for (let ", { text: "round", attributes: round("after") }, " = 1; ", { text: "round", attributes: round("after") }, " <= attempts; ", { text: "round", attributes: round("after") }, "++) {"),
              lineOf(textAt(16)),
              lineOf(textAt(17)),
              lineOf(textAt(18)),
              lineOf(textAt(19)),
              lineOf(textAt(20)),
              lineOf("      if (", { text: "round", attributes: round("after") }, " === attempts || !isRetryable(error)) break;"),
              lineOf("      await sleep(backoff(", { text: "round", attributes: round("after") }, "), signal);"),
              lineOf(textAt(24)),
              lineOf(textAt(25)),
              lineOf(textAt(26)),
              lineOf(textAt(27)),
            ], groups: [] },
          },
          { kind: "PROPOSAL_LIST", items: [item_Hook, item_Round] },
        ],
      },
      {
        kind: "FRAME",
        range: { first: 31, last: 34 },
        parts: [
          {
            kind: "CURRENT_LINES",
            run: { id: "backoff-current", lines: [
              lineOf("export function backoff(", { text: "n", attributes: round("before") }, ") {"),
              lineOf("  const delay = DELAY_MS * 2 ** (", { text: "n", attributes: round("before") }, " - 1);"),
              lineOf(textAt(33)),
              lineOf(textAt(34)),
            ], groups: [] },
          },
          {
            kind: "PROPOSAL_LINES",
            run: { id: "backoff-proposed", lines: [
              lineOf("export function backoff(", { text: "round", attributes: round("after") }, ") {"),
              lineOf("  const delay = DELAY_MS * 2 ** (", { text: "round", attributes: round("after") }, " - 1);"),
              lineOf(textAt(33)),
              lineOf(textAt(34)),
            ], groups: [] },
          },
          { kind: "PROPOSAL_LIST", items: [item_Round] },
        ],
      },
    ],
    moves: [],
  })),
}
