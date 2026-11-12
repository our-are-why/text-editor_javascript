import type { _Example_ } from "../example.ts"
import { COMPONENTMAP__VIEW_TEXTEDITOR } from "../../source/View_TextEditor.tsx"
import { _TextEditor_ } from "../../source/TextEditor.ts"
import { MODULE_MOUSE } from "../../source/modules/mouse.ts"
import { viewModelOf__Blocks, parseTexts_Line, type _FRAME_Block__ViewModel_, type _Item_Proposals_ } from "../../source/ViewModel_TextEditor.ts"
import { actions_Review } from "../items.ts"
import { blocksWith__Frames, lineOf, type _Move_Proposal_ } from "../lines.ts"
import { attributesOf__Change, attributesOf__Nested, type _Kind_Change_, type _Side_Change_, attributesOf__Edit } from "../looks.ts"
import { module_JavaScript } from "../syntax.ts"

export {
  retry,
  javascript
}

// a JavaScript module, as one would find it in a project: a doc comment with
// a line too long for most views, template literals, optional chaining, an
// async loop, a nested callback, indented with spaces
const retry = `// Retries a flaky async call, backing off further each time, until it
// succeeds, runs out of attempts, or the caller gives up on it.

const ATTEMPTS = 5;
const DELAY_MS = 100;

/**
 * @template T
 * @param {() => Promise<T>} attempt
 * @param {{ attempts?: number, signal?: AbortSignal, onRetry?: (error: unknown, n: number) => void }} [options]
 * @returns {Promise<T>}
 */
export async function retry(attempt, { attempts = ATTEMPTS, signal, onRetry } = {}) {
  let lastError;
  for (let n = 1; n <= attempts; n++) {
    signal?.throwIfAborted();
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (n === attempts || !isRetryable(error)) break;
      onRetry?.(error, n);
      await sleep(backoff(n), signal);
    }
  }
  throw new AggregateError([lastError], \`gave up after \${attempts} attempts\`);
}

// 100ms, 200ms, 400ms, ..., and up to half as long again at random, so that
// many clients retrying at once don't all come back at the same moment
export function backoff(n) {
  const delay = DELAY_MS * 2 ** (n - 1);
  return delay + Math.random() * (delay / 2);
}

function isRetryable(error) {
  if (error instanceof TypeError) return true; // the network failed, not the server
  const status = error?.response?.status ?? 0;
  return status === 429 || (status >= 500 && status !== 501);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}
`

// the module's lines, numbered from 1, for the frames' lines as they are to
// be exactly the module's
const texts_retry = parseTexts_Line(retry)
const textAt = (number: number): string => texts_retry[number - 1] ?? ""

// each proposal's change, as data, on a segment of the lines as they are,
// "before", or as proposed, "after"
const header = attributesOf__Change({ side: "before", kind: "removed", source: "header" })
const hook = attributesOf__Change({ side: "before", kind: "removed", source: "hook" })
const round = (side: _Side_Change_) => attributesOf__Change({ side, kind: "replaced", source: "round" })
const hookAndRound = { ...hook, ...attributesOf__Nested({ kind: "replaced", source: "round" }) }
const errors = (side: _Side_Change_) => attributesOf__Change({ side, kind: "replaced", source: "errors" })
const aborted = attributesOf__Change({ side: "after", kind: "inserted", source: "aborted" })
const cap = (side: _Side_Change_, kind: _Kind_Change_) => attributesOf__Change({ side, kind, source: "cap" })
const timeout = (side: _Side_Change_, kind: _Kind_Change_) => attributesOf__Change({ side, kind, source: "timeout" })
const sleep = (side: _Side_Change_) => attributesOf__Change({ side, kind: "moved", source: "sleep" })
const sleepRenamed = (side: _Side_Change_) => ({ ...sleep(side), ...attributesOf__Edit("replaced") })
const status = (side: _Side_Change_) => attributesOf__Change({ side, kind: "moved", source: "status" })

// each proposal's item, listed in every frame it's in
const item_Header: _Item_Proposals_ = {
  source: "header",
  title: "Drop the module's opening comment",
  places: "",
  rationale: "retry's doc comment says what it does, where it's read; the comment at the top only says it again.",
  actions: actions_Review,
  attributes: {},
}

const item_Hook: _Item_Proposals_ = {
  source: "hook",
  title: "Drop the onRetry hook",
  places: "",
  rationale: "Nothing passes onRetry any more: the callers log their retries in their own catch blocks.",
  actions: actions_Review,
  attributes: {},
}

const item_Errors: _Item_Proposals_ = {
  source: "errors",
  title: "Keep every error, not only the last",
  places: "",
  rationale: "When every attempt fails, the AggregateError should hold all of them: the first is often the telling one, a timeout before the server's 503s.",
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

const item_Aborted: _Item_Proposals_ = {
  source: "aborted",
  title: "Stop retrying once the caller aborts",
  places: "",
  rationale: "An abort during an attempt has already happened by the time sleep listens for it, so sleep waits out the whole delay before throwIfAborted notices.",
  actions: actions_Review,
  attributes: {},
}

const item_Cap: _Item_Proposals_ = {
  source: "cap",
  title: "Cap the delay at 30 seconds",
  places: "",
  rationale: "A caller passing many attempts waits minutes by the tenth; capped, a long outage never goes quiet for longer than half a minute.",
  actions: actions_Review,
  attributes: {},
}

const item_Timeout: _Item_Proposals_ = {
  source: "timeout",
  title: "Retry a request that timed out",
  places: "",
  rationale: "A 408 means the server stopped waiting for the request, not that the request failed: sent again, it usually goes through.",
  actions: actions_Review,
  attributes: {},
}

const item_Sleep: _Item_Proposals_ = {
  source: "sleep",
  title: "Move sleep up, beside the delays it waits out",
  places: "",
  rationale: "Read from the top, sleep comes before retry, which waits on it, next to the constants it's given; on the way, its ms is named delayMs, as DELAY_MS is.",
  actions: actions_Review,
  attributes: {},
}

const item_Status: _Item_Proposals_ = {
  source: "status",
  title: "Work out the status first",
  places: "",
  rationale: "With the status read before either check, isRetryable reads top to bottom as its answers: the network failing, then the server's codes.",
  actions: actions_Review,
  attributes: {},
}

// the module's frames, seven, nine proposals through them, every case so
// far once: the opening comment taken out whole, leaving nothing proposed;
// the blank line after the constants, where sleep lands, moved up from the
// module's end, renamed on the way, its two ends in two frames, the one it
// leaves leaving nothing; the doc comment's options, a removal inside a
// line, a thread's place nested in it; retry, replacements far apart, words
// put into a line, a line taken out whole, the thread's place in it nested
// too; backoff, the thread's last places, and a line put in, with
// replacements under it; and isRetryable, a function the agent sent whole,
// of which only a comment's last words and a line's middle differ, the
// lines round them as they are, and a line moved up, both its ends there.
// The thread, round, runs through three frames, its nine places counted in
// each
const frames_retry: Array<_FRAME_Block__ViewModel_> = [
  {
    kind: "FRAME",
    range: { first: 1, last: 2 },
    parts: [
      {
        kind: "CURRENT_LINES",
        run: { id: "header-current", lines: [
          lineOf({ text: textAt(1), attributes: header }),
          lineOf({ text: textAt(2), attributes: header }),
        ], groups: [] },
      },
      { kind: "PROPOSAL_LINES", run: { id: "header-proposed", lines: [], groups: [] } },
      { kind: "PROPOSAL_LIST", items: [item_Header] },
    ],
  },
  {
    kind: "FRAME",
    range: { first: 6, last: 6 },
    parts: [
      {
        kind: "CURRENT_LINES",
        run: { id: "constants-current", lines: [
          lineOf(textAt(6)),
        ], groups: [] },
      },
      {
        kind: "PROPOSAL_LINES",
        run: { id: "constants-proposed", lines: [
          lineOf(textAt(41)),
          lineOf({ text: "function sleep(", attributes: sleep("after") }, { text: "delayMs", attributes: sleepRenamed("after") }, { text: ", signal) {", attributes: sleep("after") }),
          lineOf({ text: textAt(43), attributes: sleep("after") }),
          lineOf({ text: "    const timer = setTimeout(resolve, ", attributes: sleep("after") }, { text: "delayMs", attributes: sleepRenamed("after") }, { text: ");", attributes: sleep("after") }),
          lineOf({ text: textAt(45), attributes: sleep("after") }),
          lineOf({ text: textAt(46), attributes: sleep("after") }),
          lineOf({ text: textAt(47), attributes: sleep("after") }),
          lineOf({ text: textAt(48), attributes: sleep("after") }),
          lineOf({ text: textAt(49), attributes: sleep("after") }),
          lineOf({ text: textAt(50), attributes: sleep("after") }),
          lineOf(textAt(6)),
        ], groups: [] },
      },
      { kind: "PROPOSAL_LIST", items: [item_Sleep] },
    ],
  },
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
          lineOf("  ", { text: "let lastError", attributes: errors("before") }, ";"),
          lineOf("  for (let ", { text: "n", attributes: round("before") }, " = 1; ", { text: "n", attributes: round("before") }, " <= attempts; ", { text: "n", attributes: round("before") }, "++) {"),
          lineOf(textAt(16)),
          lineOf(textAt(17)),
          lineOf(textAt(18)),
          lineOf(textAt(19)),
          lineOf("      ", { text: "lastError = error", attributes: errors("before") }, ";"),
          lineOf("      if (", { text: "n", attributes: round("before") }, " === attempts || !isRetryable(error)) break;"),
          lineOf({ text: "      onRetry?.(error, ", attributes: hook }, { text: "n", attributes: hookAndRound }, { text: ");", attributes: hook }),
          lineOf("      await sleep(backoff(", { text: "n", attributes: round("before") }, "), signal);"),
          lineOf(textAt(24)),
          lineOf(textAt(25)),
          lineOf("  throw new AggregateError(", { text: "[lastError]", attributes: errors("before") }, ", `gave up after ${attempts} attempts`);"),
          lineOf(textAt(27)),
        ], groups: [] },
      },
      {
        kind: "PROPOSAL_LINES",
        run: { id: "retry-proposed", lines: [
          lineOf("export async function retry(attempt, { attempts = ATTEMPTS, signal } = {}) {"),
          lineOf("  ", { text: "const errors = []", attributes: errors("after") }, ";"),
          lineOf("  for (let ", { text: "round", attributes: round("after") }, " = 1; ", { text: "round", attributes: round("after") }, " <= attempts; ", { text: "round", attributes: round("after") }, "++) {"),
          lineOf(textAt(16)),
          lineOf(textAt(17)),
          lineOf(textAt(18)),
          lineOf(textAt(19)),
          lineOf("      ", { text: "errors.push(error)", attributes: errors("after") }, ";"),
          lineOf("      if (", { text: "round", attributes: round("after") }, " === attempts || !isRetryable(error)", { text: " || signal?.aborted", attributes: aborted }, ") break;"),
          lineOf("      await sleep(backoff(", { text: "round", attributes: round("after") }, "), signal);"),
          lineOf(textAt(24)),
          lineOf(textAt(25)),
          lineOf("  throw new AggregateError(", { text: "errors", attributes: errors("after") }, ", `gave up after ${attempts} attempts`);"),
          lineOf(textAt(27)),
        ], groups: [] },
      },
      { kind: "PROPOSAL_LIST", items: [item_Hook, item_Errors, item_Round, item_Aborted] },
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
          lineOf("  return ", { text: "delay", attributes: cap("before", "replaced") }, " + Math.random() * (", { text: "delay", attributes: cap("before", "replaced") }, " / 2);"),
          lineOf(textAt(34)),
        ], groups: [] },
      },
      {
        kind: "PROPOSAL_LINES",
        run: { id: "backoff-proposed", lines: [
          lineOf("export function backoff(", { text: "round", attributes: round("after") }, ") {"),
          lineOf("  const delay = DELAY_MS * 2 ** (", { text: "round", attributes: round("after") }, " - 1);"),
          lineOf({ text: "  const capped = Math.min(delay, 30_000);", attributes: cap("after", "inserted") }),
          lineOf("  return ", { text: "capped", attributes: cap("after", "replaced") }, " + Math.random() * (", { text: "capped", attributes: cap("after", "replaced") }, " / 2);"),
          lineOf(textAt(34)),
        ], groups: [] },
      },
      { kind: "PROPOSAL_LIST", items: [item_Round, item_Cap] },
    ],
  },
  {
    kind: "FRAME",
    range: { first: 36, last: 40 },
    parts: [
      {
        kind: "CURRENT_LINES",
        run: { id: "retryable-current", lines: [
          lineOf(textAt(36)),
          lineOf("  if (error instanceof TypeError) return true; // the network failed, ", { text: "not the server", attributes: timeout("before", "replaced") }),
          lineOf({ text: textAt(38), attributes: status("before") }),
          lineOf(textAt(39)),
          lineOf(textAt(40)),
        ], groups: [] },
      },
      {
        kind: "PROPOSAL_LINES",
        run: { id: "retryable-proposed", lines: [
          lineOf(textAt(36)),
          lineOf({ text: textAt(38), attributes: status("after") }),
          lineOf("  if (error instanceof TypeError) return true; // the network failed, ", { text: "before any answer", attributes: timeout("after", "replaced") }),
          lineOf("  return ", { text: "status === 408 || ", attributes: timeout("after", "inserted") }, "status === 429 || (status >= 500 && status !== 501);"),
          lineOf(textAt(40)),
        ], groups: [] },
      },
      { kind: "PROPOSAL_LIST", items: [item_Timeout, item_Status] },
    ],
  },
  {
    kind: "FRAME",
    range: { first: 41, last: 50 },
    parts: [
      {
        kind: "CURRENT_LINES",
        run: { id: "sleep-current", lines: [
          lineOf(textAt(41)),
          lineOf({ text: "function sleep(", attributes: sleep("before") }, { text: "ms", attributes: sleepRenamed("before") }, { text: ", signal) {", attributes: sleep("before") }),
          lineOf({ text: textAt(43), attributes: sleep("before") }),
          lineOf({ text: "    const timer = setTimeout(resolve, ", attributes: sleep("before") }, { text: "ms", attributes: sleepRenamed("before") }, { text: ");", attributes: sleep("before") }),
          lineOf({ text: textAt(45), attributes: sleep("before") }),
          lineOf({ text: textAt(46), attributes: sleep("before") }),
          lineOf({ text: textAt(47), attributes: sleep("before") }),
          lineOf({ text: textAt(48), attributes: sleep("before") }),
          lineOf({ text: textAt(49), attributes: sleep("before") }),
          lineOf({ text: textAt(50), attributes: sleep("before") }),
        ], groups: [] },
      },
      { kind: "PROPOSAL_LINES", run: { id: "sleep-proposed", lines: [], groups: [] } },
      { kind: "PROPOSAL_LIST", items: [item_Sleep] },
    ],
  },
]

// the module's moves: sleep, its blank line before it taken along, up to
// before the blank line after the constants; and isRetryable's status, up a
// line
const moves_retry: Array<_Move_Proposal_> = [
  { source: "sleep", range: { first: 41, last: 50 }, to: 6 },
  { source: "status", range: { first: 38, last: 38 }, to: 37 },
]

const javascript: _Example_ = {
  name: "javascript",
  title: "JavaScript",
  about: "A JavaScript module, drawn whole by the view on a page of its own, as code is: numbered from 1, its indents kept as they're written, its syntax coloured, a language module's, the playground's JavaScript tokenizer, the colours the playground's, as a host's theme. Seven frames, nine proposals through them, each case so far once. The opening comment, taken out whole, leaves nothing proposed. The doc comment's options lose onRetry, inside the line. In retry: every error kept, three lines far apart changed; words put into a line, so as it is, it shows nowhere; the onRetry call taken out whole. In backoff: a line put in, with replacements under it. Through three frames, a thread: the counter n renamed round, in nine places, each frame listing it with how many are there; two of them, in the doc comment and the onRetry call, inside the onRetry removal, ringed faint, applying only if it's rejected. In isRetryable, a function the agent sent whole, of which only a comment's last words and the middle of its return differ; and its status worked out a line earlier, a move with both its ends in the frame. Another move takes sleep from the module's end up beside the constants, naming its ms delayMs on the way: its two ends in two frames, each with a note beside its first line: press it to go to the other end. Where it leaves, the note says only which way it moves, as the line it goes to would mean little, and needn't hold once other proposals are decided. A move is ringed blue, numbered blue where it leaves and signed → where it lands, its edits on the way ringed inside it. Point at a change, or an item, to see its proposal: its rings heavier, its items lit, in every frame it's in.",
  // the editor, in the "changes" perspective, drawing the module into the
  // stage, its syntax JavaScript's, its frames as above, with the mouse, so
  // pointing at a proposal shows it; nothing to report
  mount: (root) => {
    const containerElement = document.createElement("div")
    containerElement.dataset["perspective"] = "changes"
    root.append(containerElement)
    new _TextEditor_({
      containerElement,
      componentMap: COMPONENTMAP__VIEW_TEXTEDITOR,
      modules: [MODULE_MOUSE],
      viewModel_TextEditor: viewModelOf__Blocks(blocksWith__Frames({
        multilineText: retry,
        module_Language: module_JavaScript,
        frames: frames_retry,
        moves: moves_retry
      }))
    })
  },
}
