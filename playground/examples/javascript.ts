import type { _Example_ } from "../example.ts"
import { COMPONENTMAP__VIEW_TEXTEDITOR } from "../../source/View_TextEditor.tsx"
import { _TextEditor_, type _Setup_TextEditor_ } from "../../source/TextEditor.ts"
import { MODULE_MOUSE } from "../../source/modules/mouse.ts"
import { MODULE_KEYBOARD } from "../../source/modules/keyboard.ts"
import { parseTexts_Line, type _Range_Text_, type _Changes_Host_, type _Change_Host_ } from "../../source/Model_TextEditor.ts"
import type { _Proposal_Host_ } from "../../source/Projection_TextEditor.ts"
import type { _Range_Lines_ } from "../../source/ViewModel_TextEditor.ts"
import { MODULE_WORDS_TEXT } from "../../source/words/text.ts"
import { PERSPECTIVE_CHANGES } from "../../source/perspectives/changes.ts"
import { modelOf } from "../projected.ts"
import { actions_Review, actions_Reopen, actions_Dismiss, proposal_Yours } from "../items.ts"
import { module_JavaScript, type _State_JavaScript_ } from "../syntax.ts"

export {
  retry,
  proposed_retry,
  proposals_retry,
  model_retry,
  ranges_retry,
  setup_retry,
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

// the module's lines, numbered from 1, as an agent quotes them
const texts_retry = parseTexts_Line(retry)

// the words an agent quotes on a line, by its number from 1, the first of
// them at or after a character on it
function quoteOf(
  number: number,
  quote: string,
  after: number
): _Range_Text_ {
  const from = (texts_retry[number - 1] ?? "").indexOf(quote, after)
  if (from === -1) throw new Error(`no "${quote}" on line ${number}`)
  return { from: { line: number - 1, offset: from }, to: { line: number - 1, offset: from + quote.length } }
}

// the point on a line right before the words quoted, where words are put in
function pointOf(
  number: number,
  quote: string
): _Range_Text_ {
  const range = quoteOf(number, quote, 0)
  return { from: range.from, to: range.from }
}

// lines, by their numbers from 1, with the line break after the last
function linesOf(
  first: number,
  last: number
): _Range_Text_ {
  return { from: { line: first - 1, offset: 0 }, to: { line: last, offset: 0 } }
}

// what a span becomes
function replacing(
  range: _Range_Text_,
  multilineText: string
): _Change_Host_ {
  return { kind: "REPLACE", range, multilineText, marks: [] }
}

const condition = quoteOf(21, "n === attempts", 0)
const retryable = quoteOf(21, "!isRetryable(error)", 0)

// each proposal's changes, as an agent writes them, the words it changes
// quoted where they are, whole lines with their line breaks: the opening
// comment taken out whole; sleep, with the blank line before it, moved up
// from the module's end to before the blank line after the constants, its
// ms named delayMs by a proposal of its own; the doc comment's options
// losing onRetry inside a line, and the call to it taken out whole; every
// error kept, three lines far apart changed; the counter n named round in
// nine places through three functions, one of them inside the options'
// removal, one inside the call's, and one in what the loop's condition's
// swap moves, two moves within a line, the || between them as it was; the
// abort asked about, words put into a line; logging each retry, withdrawn;
// the delay capped, a line put in, with replacements under it, a revision
// of it asked for; the base delay's name, accepted, its words the module's
// already; in isRetryable, a 408 retried too, being revised, a comment's
// last words and a line's middle; its status worked out a line earlier, a
// move with both its ends in one function; and a 501 retried, rejected
const proposed_retry: Array<_Changes_Host_> = [
  { source: "header", changes: [replacing(linesOf(1, 2), "")] },
  { source: "sleep", changes: [{ kind: "MOVE", range: linesOf(41, 50), at: { line: 5, offset: 0 } }] },
  { source: "delay", changes: [replacing(quoteOf(42, "ms", 0), "delayMs"), replacing(quoteOf(44, "ms", 0), "delayMs")] },
  { source: "hook", changes: [replacing(quoteOf(10, ", onRetry?: (error: unknown, n: number) => void", 0), ""), replacing(quoteOf(13, ", onRetry", 0), ""), replacing(linesOf(22, 22), "")] },
  { source: "errors", changes: [replacing(quoteOf(14, "let lastError", 0), "const errors = []"), replacing(quoteOf(20, "lastError = error", 0), "errors.push(error)"), replacing(quoteOf(26, "[lastError]", 0), "errors")] },
  { source: "round", changes: [
    replacing(quoteOf(10, "n", quoteOf(10, "n: number", 0).from.offset), "round"),
    replacing(quoteOf(15, "for (let n = 1; n <= attempts; n++) {", 0), "for (let round = 1; round <= attempts; round++) {"),
    replacing(quoteOf(21, "n", condition.from.offset), "round"),
    replacing(quoteOf(22, "n", quoteOf(22, "n);", 0).from.offset), "round"),
    replacing(quoteOf(23, "n", quoteOf(23, "n)", 0).from.offset), "round"),
    replacing(quoteOf(31, "n", quoteOf(31, "n)", 0).from.offset), "round"),
    replacing(quoteOf(32, "n", quoteOf(32, "n - 1", 0).from.offset), "round"),
  ] },
  { source: "order", changes: [{ kind: "MOVE", range: condition, at: retryable.to }, { kind: "MOVE", range: retryable, at: condition.from }] },
  { source: "aborted", changes: [replacing(pointOf(21, ") break"), " || signal?.aborted")] },
  { source: "log", changes: [replacing(pointOf(23, "      await sleep(backoff(n), signal);"), "      console.warn(`retry ${n} of ${attempts}`, error);\n")] },
  { source: "cap", changes: [replacing(quoteOf(33, "  return delay + Math.random() * (delay / 2);", 0), "  const capped = Math.min(delay, 30_000);\n  return capped + Math.random() * (capped / 2);")] },
  { source: "base", changes: [replacing(quoteOf(32, "DELAY_MS", 0), "DELAY_MS")] },
  { source: "timeout", changes: [replacing(quoteOf(37, "not the server", 0), "before any answer"), replacing(pointOf(39, "status === 429"), "status === 408 || ")] },
  { source: "status", changes: [{ kind: "MOVE", range: linesOf(38, 38), at: { line: 36, offset: 0 } }] },
  { source: "retry501", changes: [replacing(quoteOf(39, " && status !== 501", 0), "")] },
]

// what the playground, as host, says of each proposal, listed in every
// frame its changes are in
const proposal_Header: _Proposal_Host_ = {
  source: "header",
  title: "Drop the module's opening comment",
  state: "OPEN",
  status: "",
  rationale: "retry's doc comment says what it does, where it's read; the comment at the top only says it again.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Hook: _Proposal_Host_ = {
  source: "hook",
  title: "Drop the onRetry hook",
  state: "OPEN",
  status: "",
  rationale: "Nothing passes onRetry any more: the callers log their retries in their own catch blocks.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Errors: _Proposal_Host_ = {
  source: "errors",
  title: "Keep every error, not only the last",
  state: "OPEN",
  status: "",
  rationale: "When every attempt fails, the AggregateError should hold all of them: the first is often the telling one, a timeout before the server's 503s.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Round: _Proposal_Host_ = {
  source: "round",
  title: "Call the attempt counter round",
  state: "OPEN",
  status: "",
  rationale: "n says nothing; round says what it counts, in retry and in backoff alike, and in the doc comment that names it.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Aborted: _Proposal_Host_ = {
  source: "aborted",
  title: "Stop retrying once the caller aborts",
  state: "OPEN",
  status: "",
  rationale: "An abort during an attempt has already happened by the time sleep listens for it, so sleep waits out the whole delay before throwIfAborted notices.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

// a revision asked for, what you asked under its words, the agent not yet
// at it: only to be reopened, to walk the request back
const proposal_Cap: _Proposal_Host_ = {
  source: "cap",
  title: "Cap the delay at 30 seconds",
  state: "REQUESTED",
  status: "Revision requested",
  rationale: "A caller passing many attempts waits minutes by the tenth; capped, a long outage never goes quiet for longer than half a minute.",
  request: "make the cap an option, 30 seconds unless the caller gives another.",
  actions: actions_Reopen,
  attributes: {},
}

// the agent at its revision, what you asked under its words, its rings and
// the words it proposes faded, breathing, nothing to do with it till its
// next round
const proposal_Timeout: _Proposal_Host_ = {
  source: "timeout",
  title: "Retry a request that timed out",
  state: "REVISING",
  status: "Revising",
  rationale: "A 408 means the server stopped waiting for the request, not that the request failed: sent again, it usually goes through.",
  request: "only when the request is safe to send twice, a GET or a PUT.",
  actions: [],
  attributes: {},
}

// accepted, its words the document's, nothing left to ring, where it named
// the base delay, on line 32
const proposal_Base: _Proposal_Host_ = {
  source: "base",
  title: "Name the base delay DELAY_MS",
  state: "ACCEPTED",
  status: "Accepted",
  rationale: "BASE said nothing of what it's the base of, or in what unit.",
  request: "",
  actions: actions_Reopen,
  attributes: {},
}

// rejected, its change gone from the lines proposed, only to be reopened
const proposal_Retry501: _Proposal_Host_ = {
  source: "retry501",
  title: "Retry a 501 too",
  state: "REJECTED",
  status: "Rejected",
  rationale: "A 501 from a proxy can clear once the server behind it is back; sent again, it sometimes goes through.",
  request: "",
  actions: actions_Reopen,
  attributes: {},
}

// withdrawn by the agent, superseded by dropping the onRetry hook, its change
// gone from the lines proposed, nothing to do with it but dismiss it
const proposal_Log: _Proposal_Host_ = {
  source: "log",
  title: "Log each retry",
  state: "WITHDRAWN",
  status: "Withdrawn",
  rationale: "So a slow call shows in the logs as it happens, not only when it finally fails.",
  request: "",
  actions: actions_Dismiss,
  attributes: {},
}

const proposal_Sleep: _Proposal_Host_ = {
  source: "sleep",
  title: "Move sleep up, beside the delays it waits out",
  state: "OPEN",
  status: "",
  rationale: "Read from the top, sleep comes before retry, which waits on it, next to the constants it's given.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Delay: _Proposal_Host_ = {
  source: "delay",
  title: "Call sleep's ms delayMs",
  state: "OPEN",
  status: "",
  rationale: "As DELAY_MS is: the unit in the name, where the number's read, wherever sleep ends up.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Order: _Proposal_Host_ = {
  source: "order",
  title: "Ask about the error before the round",
  state: "OPEN",
  status: "",
  rationale: "An error that can't be retried ends the loop in any round: asked first, it reads as the reason to stop, and the round as the limit.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

const proposal_Status: _Proposal_Host_ = {
  source: "status",
  title: "Work out the status first",
  state: "OPEN",
  status: "",
  rationale: "With the status read before either check, isRetryable reads top to bottom as its answers: the network failing, then the server's codes.",
  request: "",
  actions: actions_Review,
  attributes: {},
}

// the proposals, in the order a frame lists them, decided ones after the
// rest whatever their place here
const proposals_retry: Array<_Proposal_Host_> = [
  proposal_Yours,
  proposal_Header,
  proposal_Sleep,
  proposal_Delay,
  proposal_Hook,
  proposal_Errors,
  proposal_Round,
  proposal_Order,
  proposal_Aborted,
  proposal_Log,
  proposal_Cap,
  proposal_Base,
  proposal_Timeout,
  proposal_Status,
  proposal_Retry501,
]

// the module and the changes proposed for it, as the editor holds them
const model_retry = modelOf({
  multilineText: retry,
  marks: [],
  proposed: proposed_retry
})

// the lines the playground, as host, frames whole, beyond what the changes
// touch, as a frame a function each reads: retry, backoff and isRetryable,
// so the editor draws seven frames
const ranges_retry: Array<_Range_Lines_> = [{ first: 13, last: 27 }, { first: 31, last: 34 }, { first: 36, last: 40 }]

// what the playground, as host, puts together for the editor, each piece
// named once: the editor's own components, the mouse, the playground's
// JavaScript, and the editor's changes perspective, its text reading in its
// changes look
const setup_retry: _Setup_TextEditor_<_State_JavaScript_> = {
  componentMap: COMPONENTMAP__VIEW_TEXTEDITOR,
  modules: [MODULE_MOUSE, MODULE_KEYBOARD],
  module_Language: module_JavaScript,
  module_Words: MODULE_WORDS_TEXT,
  perspectives: [PERSPECTIVE_CHANGES]
}

const javascript: _Example_ = {
  name: "javascript",
  title: "JavaScript",
  about: "A JavaScript module, drawn whole by the view on a page of its own, as code is: numbered from 1, its indents kept as they're written, its syntax coloured, a language module's, the playground's JavaScript tokenizer, the colours the playground's, as a host's theme. Seven frames, eleven proposals through them, each case so far once. The opening comment, taken out whole, leaves nothing proposed. The doc comment's options lose onRetry, inside the line. In retry: every error kept, three lines far apart changed; words put into a line, so as it is, it shows nowhere; the onRetry call taken out whole; and the loop's condition's operands swapped within its line, the error asked about first: two moves inside a line, each ringed on the line as it is and as proposed, the || between them as it was, the round's rename carried in one. In backoff: a line put in, with replacements under it. Through three frames, a thread: the counter n renamed round, in nine places, each frame listing it with how many are there, its arrows going to its item in the frame before and the frame after; two of them, in the doc comment and the onRetry call, inside the onRetry removal, ringed faint, applying only if it's rejected. In isRetryable, framed whole: a comment's last words and the middle of its return changed; and its status worked out a line earlier, a move with both its ends in the frame. Another move takes sleep from the module's end up beside the constants, the blank line before it going with it, its two ends in two frames; its ms named delayMs is a proposal of its own, ringed inside it at both ends, applying wherever sleep ends up. Each end has a note beside its first line: press it to go to the other end. Where it leaves, the note says only \"moved\", as the line it goes to would mean little, and needn't hold once other proposals are decided; where it lands, where it's from. A move is ringed brown, as doctor's are, numbered brown where it leaves and signed → where it lands, what other proposals change in it ringed inside it. Point at a change, or an item, to see its proposal: its rings heavier, its items lit, in every frame it's in. Press an open proposal's Revise to write what should change, under its words: Submit or Cancel, or ⌘ or Ctrl with Enter, or Escape, closes it; nothing's sent yet. Its proposals are in every state: most open; Cap the delay at 30 seconds has a revision requested, what you asked under it, Reopen its one action; Retry a request that timed out is being revised, its rings and the words it proposes faded, breathing, its dots brightening in turn, nothing to do with it yet; and, below the open ones in their lists, three decided: Name the base delay DELAY_MS accepted, its words the document's, and Retry a 501 too rejected and Log each retry withdrawn, nothing of either in the lines proposed, the withdrawn one's only action to dismiss it.",
  // the editor, put together as above, drawing the module and its
  // proposals into the stage; nothing to report
  mount: (root) => {
    const containerElement = document.createElement("div")
    root.append(containerElement)
    new _TextEditor_({
      containerElement,
      setup: setup_retry,
      model_TextEditor: model_retry,
      proposals: proposals_retry,
      source_Yours: proposal_Yours.source,
      ranges_Frame: ranges_retry
    })
  },
}
