import type { _Example_ } from "../example.ts"
import {
  COMPONENTMAP__VIEW_TEXTEDITOR,
  type _Setup_TextEditor_,
  MODULE_MOUSE,
  MODULE_KEYBOARD,
  type _Proposal_Host_,
  type _Request_Task_,
  type _Range_Lines_,
  MODULE_WORDS_TEXT,
  PERSPECTIVE_CHANGES
} from "../../source/ui/editor/index.ts"
import {
  parseTexts_Line,
  type _Range_Text_,
  type _Changes_Host_,
  type _Change_Host_,
  type _Selected_Text_
} from "../../source/core/documents/index.ts"
import { carriedOf__Model, type _Edit_Example_ } from "../projected.ts"
import { ACTIONS_REVIEW, ACTIONS_REOPEN, ACTIONS_DISMISS, PROPOSAL_YOURS } from "../../source/ui/host/index.ts"
import { module_JavaScript, type _State_JavaScript_ } from "../syntax.ts"
import { hostedOf__Editor, type _Other_Task_ } from "../host.ts"

export {
  retry,
  proposed_retry,
  proposals_retry,
  stale_retry,
  model_retry,
  ranges_retry,
  setup_retry,
  javascript
}

// a JavaScript module, as one would find it in a project: a doc comment with
// a line too long for most views, template literals, optional chaining, an
// async loop, a nested callback, indented with spaces; as the task's rounds
// were written on it, before the edits made to it since, below
const retry = `// Retries a flaky async call, backing off each time, until it
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

// the point at a line's end, by its number from 1, where words are put
// after it
function endOf(
  number: number
): _Range_Text_ {
  const offset = (texts_retry[number - 1] ?? "").length
  return { from: { line: number - 1, offset }, to: { line: number - 1, offset } }
}

// lines, by their numbers from 1, with the line break after the last
function linesOf(
  first: number,
  last: number
): _Range_Text_ {
  return { from: { line: first - 1, offset: 0 }, to: { line: last, offset: 0 } }
}

// the module's words, quoted, as a request is sent with them: where they
// are and what they say, over as many lines as they run to, selected as
// they are
function wordsOf(
  range: _Range_Text_
): _Selected_Text_ {
  const lines = texts_retry.slice(range.from.line, range.to.line + 1).map((text, index, texts) => text.slice(index === 0 ? range.from.offset : 0, index === texts.length - 1 ? range.to.offset : text.length))
  return { pieces: [{ id_Text: { kind: "DOCUMENT" }, range }], text: lines.join("\n"), side: "CURRENT" }
}

// words a proposal's one change puts in, quoted, as a request on it is sent
// with them
function wordsIn(
  source: string,
  quote: string
): _Selected_Text_ {
  const change = proposed_retry.find((changes_Source) => changes_Source.source === source)?.changes[0]
  const lines = change?.kind === "REPLACE" ? parseTexts_Line(change.multilineText) : []
  const line = lines.findIndex((text) => text.includes(quote))
  if (line === -1) throw new Error(`no "${quote}" in ${source}'s change`)
  const from = (lines[line] ?? "").indexOf(quote)
  return { pieces: [{ id_Text: { kind: "CHANGE", source, index: 0 }, range: { from: { line, offset: from }, to: { line, offset: from + quote.length } } }], text: quote, side: "PROPOSED" }
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
// move with both its ends in one function; and a 501 retried, rejected. And
// your edits, typed in the task, its own: the attempts made 3, a single
// letter, and the base delay 250, on lines next to each other, one frame of
// only yours; the template said in the doc comment, a frame of yours alone;
// and retry named in the message it gives up with, in retry's frame, beside
// its proposals
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
  { source: PROPOSAL_YOURS.source, changes: [
    replacing(quoteOf(4, "5", 0), "3"),
    replacing(quoteOf(5, "100", 0), "250"),
    replacing(endOf(8), " what attempt resolves to"),
    replacing(pointOf(26, "gave up"), "retry "),
  ] },
]

// what the playground, as host, says of each proposal, listed in every
// frame its changes are in
const proposal_Header: _Proposal_Host_ = {
  source: "header",
  title: "Drop the module's opening comment",
  state: "OPEN",
  status: "",
  rationale: "retry's doc comment says what it does, where it's read; the comment at the top only says it again.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Hook: _Proposal_Host_ = {
  source: "hook",
  title: "Drop the onRetry hook",
  state: "OPEN",
  status: "",
  rationale: "Nothing passes onRetry any more: the callers log their retries in their own catch blocks.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Errors: _Proposal_Host_ = {
  source: "errors",
  title: "Keep every error, not only the last",
  state: "OPEN",
  status: "",
  rationale: "When every attempt fails, the AggregateError should hold all of them: the first is often the telling one, a timeout before the server's 503s.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Round: _Proposal_Host_ = {
  source: "round",
  title: "Call the attempt counter round",
  state: "OPEN",
  status: "",
  rationale: "n says nothing; round says what it counts, in retry and in backoff alike, and in the doc comment that names it.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Aborted: _Proposal_Host_ = {
  source: "aborted",
  title: "Stop retrying once the caller aborts",
  state: "OPEN",
  status: "",
  rationale: "An abort during an attempt has already happened by the time sleep listens for it, so sleep waits out the whole delay before throwIfAborted notices.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

// open, a revision asked for, staged, what you asked listed under its
// words, the agent not yet at it: to ask more of it, start it, or decide it
// anyway; the second sent with words its change puts in, dotted under them
// where it's proposed
const proposal_Cap: _Proposal_Host_ = {
  source: "cap",
  title: "Cap the delay at 30 seconds",
  state: "OPEN",
  status: "",
  rationale: "A caller passing many attempts waits minutes by the tenth; capped, a long outage never goes quiet for longer than half a minute.",
  requests: [
    {
      minutes_Quiet: 0,
      id: "cap-0",
      notes: "make the cap an option, 30 seconds unless the caller gives another.",
      reference: null,
      status: "STAGED"
    },
    {
      minutes_Quiet: 0,
      id: "cap-1",
      notes: "Name it MAX_DELAY_MS, up with the other constants.",
      reference: wordsIn("cap", "30_000"),
      status: "STAGED"
    }
  ],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

// open, the agent at its revision, what you asked under its words, in
// progress, its rings and the words it proposes faded, breathing, its words
// not to be typed into till its next round; more asked of it already, for
// the round after, staged
const proposal_Timeout: _Proposal_Host_ = {
  source: "timeout",
  title: "Retry a request that timed out",
  state: "OPEN",
  status: "",
  rationale: "A 408 means the server stopped waiting for the request, not that the request failed: sent again, it usually goes through.",
  requests: [
    {
      minutes_Quiet: 0,
      id: "timeout-0",
      notes: "only when the request is safe to send twice, a GET or a PUT.",
      reference: null,
      status: "RUNNING"
    },
    {
      minutes_Quiet: 0,
      id: "timeout-1",
      notes: "Say timed out, as the status means, not before any answer.",
      reference: wordsIn("timeout", "before any answer"),
      status: "STAGED"
    }
  ],
  actions: ACTIONS_REVIEW,
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
  requests: [],
  actions: ACTIONS_REOPEN,
  attributes: {},
}

// rejected, its change gone from the lines proposed, only to be reopened
const proposal_Retry501: _Proposal_Host_ = {
  source: "retry501",
  title: "Retry a 501 too",
  state: "REJECTED",
  status: "Rejected",
  rationale: "A 501 from a proxy can clear once the server behind it is back; sent again, it sometimes goes through.",
  requests: [],
  actions: ACTIONS_REOPEN,
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
  requests: [],
  actions: ACTIONS_DISMISS,
  attributes: {},
}

const proposal_Sleep: _Proposal_Host_ = {
  source: "sleep",
  title: "Move sleep up, beside the delays it waits out",
  state: "OPEN",
  status: "",
  rationale: "Read from the top, sleep comes before retry, which waits on it, next to the constants it's given.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Delay: _Proposal_Host_ = {
  source: "delay",
  title: "Call sleep's ms delayMs",
  state: "OPEN",
  status: "",
  rationale: "As DELAY_MS is: the unit in the name, where the number's read, wherever sleep ends up.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Order: _Proposal_Host_ = {
  source: "order",
  title: "Ask about the error before the round",
  state: "OPEN",
  status: "",
  rationale: "An error that can't be retried ends the loop in any round: asked first, it reads as the reason to stop, and the round as the limit.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

// accepted, not yet applied: the host applies what's accepted once the
// task's settled, so its move's still ringed at both ends, filled
const proposal_Status: _Proposal_Host_ = {
  source: "status",
  title: "Work out the status first",
  state: "ACCEPTED",
  status: "Accepted",
  rationale: "With the status read before either check, isRetryable reads top to bottom as its answers: the network failing, then the server's codes.",
  requests: [],
  actions: ACTIONS_REOPEN,
  attributes: {},
}

// the proposals, in the order a frame lists them
const proposals_retry: Array<_Proposal_Host_> = [
  PROPOSAL_YOURS,
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

// what moved the module under the task's rounds since they were written,
// each edit on the module as the edits before it left it: "further" put in
// the opening comment, which an open proposal's last round takes out, so
// it's stale, its lines drawn as it was written on them, above the file's,
// and Run again offered, the comment as it was kept with it, so taking
// "further " back out makes it clean again; in backoff, DELAY_MS made
// BASE_MS, where an accepted proposal named it DELAY_MS, a conflict, Keep
// yours and Take the file's offered; and a comment put after the status, on
// the line an accepted proposal moves up, a conflict too, Both offered, the
// comment moving up with it
const edits_retry: Array<_Edit_Example_> = [
  { range: pointOf(1, "each time"), multilineText: "further " },
  { range: quoteOf(32, "DELAY_MS", 0), multilineText: "BASE_MS" },
  { range: endOf(38), multilineText: " // no response: 0" },
]

// what's asked of the task and of this module, on no proposal, as you'd
// have asked it: words quoted where a ring's edge cuts them, the request's
// dotted line cutting the ring; two on the loop's condition overlapping on
// attempts, dashed there, in rings nested in rings; one in progress on the
// two lines of the comment over backoff; one with a link too long to fit
// its line; two done with, one by a proposal, one with nothing to change;
// and one asked of the task as a whole
const requests_retry: Array<_Request_Task_> = [
  {
    minutes_Quiet: 0,
    id: "asked-1",
    notes: "Count the errors too, for the message.",
    aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(20, "lastError = error;", 0)) },
    status: "STAGED",
    sources_Answering: []
  },
  {
    minutes_Quiet: 0,
    id: "asked-2",
    notes: "Say which round it gives up at.",
    aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(21, "n === attempts", 0)) },
    status: "STAGED",
    sources_Answering: []
  },
  {
    minutes_Quiet: 0,
    id: "asked-3",
    notes: "Give up on an error that can't be retried before the count's checked.",
    aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(21, "attempts || !isRetryable(error)", 0)) },
    status: "STAGED",
    sources_Answering: []
  },
  {
    minutes_Quiet: 0,
    id: "asked-4",
    notes: "Say why half a delay at random, not a whole one.",
    aim: { kind: "DOCUMENT", reference: wordsOf({ from: { line: 28, offset: 0 }, to: { line: 29, offset: (texts_retry[29] ?? "").length } }) },
    status: "RUNNING",
    sources_Answering: []
  },
  {
    minutes_Quiet: 0,
    id: "asked-5",
    notes: "Say what this throws: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted",
    aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(16, "signal?.throwIfAborted();", 0)) },
    status: "STAGED",
    sources_Answering: []
  },
  {
    minutes_Quiet: 0,
    id: "asked-6",
    notes: "Keep every error the attempts throw, not only the last.",
    aim: { kind: "DOCUMENT", reference: null },
    status: "ADDRESSED",
    sources_Answering: ["errors"]
  },
  {
    minutes_Quiet: 0,
    id: "asked-7",
    notes: "Check the doc comment still says what retry takes.",
    aim: { kind: "DOCUMENT", reference: null },
    status: "ADDRESSED",
    sources_Answering: []
  },
  {
    minutes_Quiet: 0,
    id: "asked-8",
    notes: "Say in the README that onRetry is gone.",
    aim: { kind: "TASK", reference: null },
    status: "STAGED",
    sources_Answering: []
  }
]

// the module as it now is, and the changes proposed for it, as the editor
// holds them, carried across the edits made since they were written, by the
// documents part, as the playground, as host, carries a task's head; what
// they touched stale, with the order's last round, landed before them, a
// third move dropped, your edits having taken its text, said in its items,
// Run again offered too
const carried_retry = carriedOf__Model({
  multilineText: retry,
  marks: [],
  proposed: proposed_retry,
  stale: [{ source: "order", changes_Stale: [], count_Dropped: 1 }],
  edits: edits_retry
})
const model_retry = carried_retry.model_TextEditor
const stale_retry = carried_retry.stale

// the project's other tasks, each with what's asked of it on this
// module, on the words it was asked on, so all the editor's told of them is
// here to see once it's switched to them; what they'd propose, and what the
// agent would answer, left for the documents and the agent parts, as
// nothing here could stand for them

// logging each retry: one request running, on the catch, and one waiting
// behind it, on the task, its job queued till the one at work's done, as
// one job's worked on at a time within a task
const task_Log: _Other_Task_ = {
  id: "T-13",
  name: "Log each retry",
  isStarted: true,
  requests: [
    { minutes_Quiet: 0, id: "T-13 a", notes: "Log each attempt that fails, with its error and which round it was.", aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(19, "} catch (error) {", 0)) }, status: "RUNNING", sources_Answering: [] },
    { minutes_Quiet: 0, id: "T-13 b", notes: "Say in the README what's logged, and where.", aim: { kind: "TASK", reference: null }, status: "WAITING", sources_Answering: [] }
  ],
  documents_Elsewhere: []
}

// the README's promises, all of it in the README, decided, nothing left:
// nothing of it on this module
const task_Promises: _Other_Task_ = {
  id: "T-14",
  name: "Say what the README promises",
  isStarted: true,
  requests: [],
  documents_Elsewhere: [
    {
      name: "README.md",
      counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 2, REJECTED: 0, WITHDRAWN: 0 },
      counts_Requests: { QUIET: 0, WAITING: 0, STAGED: 0, RUNNING: 0 }
    }
  ]
}

// attempts renamed tries, asked of the option and the constant, staged
const task_Tries: _Other_Task_ = {
  id: "T-15",
  name: "Rename attempts to tries",
  isStarted: true,
  requests: [
    { minutes_Quiet: 0, id: "T-15 a", notes: "Call attempts tries, the option and the constant both.", aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(13, "attempts = ATTEMPTS", 0)) }, status: "STAGED", sources_Answering: [] }
  ],
  documents_Elsewhere: []
}

// the options named, started before, two requests staged since, on the
// options' type and on how they're taken
const task_Options: _Other_Task_ = {
  id: "T-17",
  name: "Name the retry options",
  isStarted: true,
  requests: [
    { minutes_Quiet: 0, id: "T-17 a", notes: "Name the options' type RetryOptions, in a typedef of its own.", aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(10, "{{ attempts?: number, signal?: AbortSignal, onRetry?: (error: unknown, n: number) => void }}", 0)) }, status: "STAGED", sources_Answering: [] },
    { minutes_Quiet: 0, id: "T-17 b", notes: "Take the options whole, as options, and take them apart in the body.", aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(13, "{ attempts = ATTEMPTS, signal, onRetry } = {}", 0)) }, status: "STAGED", sources_Answering: [] }
  ],
  documents_Elsewhere: []
}

// a timeout, drafted, never started, two requests staged, on the signal
// and on the doc comment
const task_Timeout: _Other_Task_ = {
  id: "T-16",
  name: "Add a timeout option",
  isStarted: false,
  requests: [
    { minutes_Quiet: 0, id: "T-16 a", notes: "Take a timeout, in milliseconds, and give up once it's passed.", aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(13, "signal", 0)) }, status: "STAGED", sources_Answering: [] },
    { minutes_Quiet: 0, id: "T-16 b", notes: "Say in the doc comment what timeout does.", aim: { kind: "DOCUMENT", reference: wordsOf(quoteOf(10, "signal?: AbortSignal", 0)) }, status: "STAGED", sources_Answering: [] }
  ],
  documents_Elsewhere: []
}

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
  about: "A JavaScript module, drawn whole by the view on a page of its own, as code is: numbered from 1, its indents kept as they're written, its syntax coloured, a language module's, the playground's JavaScript tokenizer, the colours the playground's, as a host's theme. Nine frames, eleven proposals through them, and your edits, each case so far once. The opening comment, taken out whole, leaves nothing proposed. The doc comment's options lose onRetry, inside the line. In retry: every error kept, three lines far apart changed; words put into a line, so as it is, it shows nowhere; the onRetry call taken out whole; and the loop's condition's operands swapped within its line, the error asked about first: two moves inside a line, each ringed on the line as it is and as proposed, the || between them as it was, the round's rename carried in one. In backoff: a line put in, with replacements under it. Through three frames, a thread: the counter n renamed round, in nine places, each frame listing it with how many are there, its arrows going to its item in the frame before and the frame after; two of them, in the doc comment and the onRetry call, inside the onRetry removal, ringed faint, applying only if it's rejected. In isRetryable, framed whole: a comment's last words and the middle of its return changed; and its status worked out a line earlier, a move with both its ends in the frame. Another move takes sleep from the module's end up beside the constants, the blank line before it going with it, its two ends in two frames; its ms named delayMs is a proposal of its own, ringed inside it at both ends, applying wherever sleep ends up. Each end has a note beside its first line: press it to go to the other end. Where it leaves, the note says only \"moved\", as the line it goes to would mean little, and needn't hold once other proposals are decided; where it lands, where it's from. A move is ringed brown, as the doctor prototype's are, numbered brown where it leaves and signed → where it lands, what other proposals change in it ringed inside it. Point at a change, or an item, to see its proposal: its rings heavier, its items lit, in every frame it's in. Press a proposal's Revise to write what should change, under its words: Cancel, or Escape, closes it; Add, or ⌘ or Ctrl with Enter, stages it, and the playground, as host, lists it under the proposal, a revision requested, Start and Remove after each; add as many as you like, to as many proposals; Start, after one request, starts it alone, and under them, or in the form, starts all of that proposal's, one round at a time, its words not to be typed into while it's revised; with no agent here, a moment later they're done with, what's asked meanwhile left for the next round. The playground stands in for an agent, always listening, the footer saying so, and works on one job at a time within a task, as any agent does: Log each retry has a request being worked on and one waiting behind it, its job next, so the task says 1 running and 1 waiting in the switcher and on the board; switch to it to see the one waiting, still, never shimmering, or stop the one at work and see the one waiting taken, running, and done with a moment later. Accepting or rejecting one with revisions staged asks first. Accept, Reject, Reopen and Dismiss it takes at once, as a host would; each, and each edit, reported beside it. Its proposals are in every state: most open; Cap the delay at 30 seconds has a revision requested, staged, what you asked under it, the second sent with words its change puts in, 30_000, dotted under them where it's proposed; Retry a request that timed out is being revised, its request running, the words it proposes shimmering with Revising and running, its rings dimming as the band passes, all in step, one more staged for its next round; and four decided, each where it's always been in its lists: Name the base delay DELAY_MS and Work out the status first accepted, not yet applied, their rings filled, both in conflict, below; and Retry a 501 too rejected and Log each retry withdrawn, nothing of either in the lines proposed, the withdrawn one's only action to dismiss it. The module moved under the task's rounds since they were written: \"further\" was put into the opening comment, which an open proposal takes out, so it's stale, its lines drawn as its round was written on them, numbered, and under them as the file has them, hatched forward in teal, what the file did ringed; and Ask about the error before the round's last round dropped a move, its text gone, stale too; each offers Run again. Where the file moved under an accepted change, it's a conflict, said in the file's teal, as its lines are, and counted so in the switcher, the footer and the board, Apply held till it's settled: in backoff, DELAY_MS made BASE_MS, Keep yours and Take the file's offered; and in isRetryable, a comment put after the status, which goes up with the move, ringed teal where it lands, Both offered, not Keep yours, as a move kept so would read as a replacement. Your edits are the task's own, typed in it, never the file's, their rings waved: the attempts and the base delay changed on lines next to each other, one small frame of only yours; the template said in the doc comment, a frame of yours alone; and retry named in the message it gives up with, in retry's frame, listed there with its proposals. The module has requests of its own, in its card: on lastError = error;, its dotted line cutting through the ring it crosses; two on the loop's condition, overlapping on attempts, dashed there, through rings nested in rings; one in progress on the two lines of the comment over backoff; one with a link too long for its line, broken where it runs out; and two done with, one by a proposal, one with nothing to change. The task has one of its own. Point at a request's words to light them, or at its lines to go to them; point at a proposal to lift its rings over the requests' lines.",
  // the editor, put together as above, drawing the module and its
  // proposals into the stage; each edit reported as it's told
  mount: (root, log) => {
    const containerElement = document.createElement("div")
    containerElement.className = "host"
    const containerElement_Board = document.createElement("div")
    containerElement_Board.className = "board"
    containerElement_Board.hidden = true
    root.append(containerElement, containerElement_Board)
    hostedOf__Editor({
      containerElement,
      setup: setup_retry,
      model_TextEditor: model_retry,
      name_Document: "retry.js",
      proposals: proposals_retry,
      stale: stale_retry,
      about_Task: {
        id: "T-12",
        name: "Tidy the retry loop",
        summary: "Keeps every error, names the attempt counter round, caps the delay, and stops once the caller aborts; drops the onRetry hook and the opening comment.",
        summary_Document: "In retry.js: the loop's errors, its counter's name, its delays and its abort, and two things it no longer needs.",
        requests: requests_retry,
        documents_Elsewhere: [
          {
            name: "README.md",
            counts_Proposals: {
              OPEN: 3,
              REQUESTED: 0,
              REVISING: 1,
              ACCEPTED: 2,
              REJECTED: 0,
              WITHDRAWN: 0
            },
            counts_Requests: {
              QUIET: 0,
              WAITING: 0,
              STAGED: 0,
              RUNNING: 1
            }
          }
        ]
      },
      tasks_Other: [
        task_Log,
        task_Promises,
        task_Tries,
        task_Options,
        task_Timeout
      ],
      tasks_Resolved: [
        {
          id: "T-9",
          name: "Fix the docs' typos",
          state: "APPLIED"
        },
        {
          id: "T-11",
          name: "Try a generator",
          state: "CANCELED"
        }
      ],
      containerElement_Board,
      files: [
        "retry.js",
        "README.md",
        "CHANGELOG.md",
        "package.json",
        "source/backoff.js",
        "tests/retry.test.js"
      ],
      ranges_Frame: ranges_retry,
      isListening_Agent: true,
      log
    })
  },
}
