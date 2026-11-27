import type { _Example_ } from "../example.ts"
import {
  COMPONENTMAP__VIEW_TEXTEDITOR,
  type _Setup_TextEditor_,
  type _Perspective_TextEditor_,
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
  type _Change_Host_
} from "../../source/core/documents/index.ts"
import { carriedOf__Model, type _Edit_Example_ } from "../projected.ts"
import { ACTIONS_REVIEW, ACTIONS_REOPEN, ACTIONS_DISMISS, PROPOSAL_YOURS } from "../../source/ui/host/index.ts"
import { module_Markdown, type _State_Markdown_ } from "../syntax.ts"
import { perspective_Markdown } from "../readings.ts"
import { hostedOf__Editor } from "../host.ts"

export {
  readme,
  proposed_readme,
  proposals_readme,
  model_readme,
  stale_readme,
  ranges_readme,
  setup_readme,
  markdown
}

// the JavaScript example's module's README, in Markdown, as one would find
// it beside the module: headings, a fenced block of shell and one of
// JavaScript, inline code, emphasis, a list, a table, a quote and a link,
// its long lines unwrapped, as Markdown's paragraphs are written; as the
// task's rounds were written on it, before the edit made to it since, below
const readme = `# retry

Retries a flaky async call, backing off further each time, until it succeeds, runs out of attempts, or the caller gives up on it.

## Install

\`\`\`sh
bun add @tools/retry
\`\`\`

## Use

Wrap the call in a function, and pass it to \`retry\`, with any options:

\`\`\`js
import { retry } from "@tools/retry";

const user = await retry(() => fetchUser(id), { attempts: 3 });
\`\`\`

## Options

- \`attempts\`: how many times to try, *5* unless you say otherwise.
- \`signal\`: an \`AbortSignal\`; once it aborts, retry stops waiting and throws.
- \`onRetry\`: called before each new attempt, with the error and the attempt's number.

## What it retries

A call that throws is tried again when the network failed, or when the server answered with a status that says it may work later:

| status        | retried |
|---------------|---------|
| 429           | yes     |
| 5xx, but 501  | yes     |
| 501           | no      |

## How long it waits

Each wait is twice the one before, starting at \`DELAY_MS\`, 100 ms, with up to half as much again added at random, so callers that failed together don't all retry together.

> A call that keeps failing waits longer each round: by the tenth attempt, almost a minute.

See [why the waits grow](https://example.com/backoff), and **please** say if anything's odd.`

const texts_readme = parseTexts_Line(readme)

// the words an agent quotes on a line, by its number from 1
function quoteOf(
  number: number,
  quote: string
): _Range_Text_ {
  const from = (texts_readme[number - 1] ?? "").indexOf(quote)
  if (from === -1) throw new Error(`no "${quote}" on line ${number}`)
  return { from: { line: number - 1, offset: from }, to: { line: number - 1, offset: from + quote.length } }
}

// the point on a line right before the words quoted, where words are put in
function pointOf(
  number: number,
  quote: string
): _Range_Text_ {
  const range = quoteOf(number, quote)
  return { from: range.from, to: range.from }
}

// lines, by their numbers from 1, with the line break after the last
function linesOf(
  first: number,
  last: number
): _Range_Text_ {
  return { from: { line: first - 1, offset: 0 }, to: { line: last, offset: 0 } }
}

// what a span becomes. Markdown's marks are its syntax, so what a change
// makes bold it makes bold with asterisks, in its text: a change, as the
// document, has no marks over it
function replacing(
  range: _Range_Text_,
  multilineText: string
): _Change_Host_ {
  return { kind: "REPLACE", range, multilineText, marks: [] }
}

// each proposal's changes, as an agent writes them, keeping the README in
// step with the module's own proposals, the words it changes quoted where
// they are, whole lines with their line breaks: in its opening words, how a
// caller gives up said, inline code put in; the example's call given a
// signal, inside the fence, its code JavaScript's; in the options' list, a
// default made bold, its emphasis's one asterisk each side made two, words
// replaced in a line, and onRetry's line taken out whole; what's retried,
// its heading, words and table, moved up whole before the options, a row
// put into the table, being revised, and a row taken out, rejected, both in
// what the move carries; and in how long it waits, the base delay's name,
// accepted, applied already, its words the README's, the quote's last words
// changed, a revision of it asked for, and the link's address, withdrawn.
// And your edit, typed in the task, its own: how long it waits said as the
// module's comment says it, most of a long line, in that frame beside its
// proposals, cut where the line wraps, as long lines are
const proposed_readme: Array<_Changes_Host_> = [
  { source: "signal", changes: [replacing(quoteOf(3, "gives up on it"), "gives up on it through its `signal`")] },
  { source: "example", changes: [replacing(quoteOf(18, "fetchUser(id), { attempts: 3 }"), "fetchUser(id, { signal }), { attempts: 3, signal }")] },
  { source: "stress", changes: [replacing(quoteOf(23, "*5*"), "**5**")] },
  { source: "aborted", changes: [replacing(quoteOf(24, "stops waiting"), "stops, mid-wait or between attempts,")] },
  { source: "hook", changes: [replacing(linesOf(25, 25), "")] },
  { source: "order", changes: [{ kind: "MOVE", range: linesOf(27, 36), at: { line: 20, offset: 0 } }] },
  { source: "timeout", changes: [replacing(pointOf(33, "| 429"), "| 408           | yes     |\n")] },
  { source: "retry501", changes: [replacing(quoteOf(34, ", but 501"), ""), replacing(linesOf(35, 35), "")] },
  { source: "base", changes: [replacing(quoteOf(39, "`DELAY_MS`"), "`DELAY_MS`")] },
  { source: "cap", changes: [replacing(quoteOf(41, "by the tenth attempt, almost a minute"), "but never longer than 30 seconds")] },
  { source: "link", changes: [replacing(quoteOf(43, "https://example.com/backoff"), "https://example.com/guides/backoff")] },
  { source: PROPOSAL_YOURS.source, changes: [replacing(quoteOf(39, "with up to half as much again added at random, so callers that failed together don't all retry together"), "and up to half as long again at random, so that many callers retrying at once don't all come back at the same moment")] },
]

// what the playground, as host, says of each proposal, listed in every
// frame its changes are in
const proposal_Signal: _Proposal_Host_ = {
  source: "signal",
  title: "Say how a caller gives up",
  state: "OPEN",
  status: "",
  rationale: "Giving up is aborting the signal; saying so sends the reader to the option that does it.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Example: _Proposal_Host_ = {
  source: "example",
  title: "Pass a signal in the example",
  state: "OPEN",
  status: "",
  rationale: "A caller who can cancel should see where the signal goes: to the call, so a request in flight stops, and to retry, so a wait does.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Stress: _Proposal_Host_ = {
  source: "stress",
  title: "Make the default bold",
  state: "OPEN",
  status: "",
  rationale: "It's the number most callers live with, so it's the one to find at a glance.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

const proposal_Aborted: _Proposal_Host_ = {
  source: "aborted",
  title: "Say an abort stops the attempts too",
  state: "OPEN",
  status: "",
  rationale: "With the module's own proposal, retry asks about the signal between attempts as well as while it waits; said as it is, an abort only cuts a wait short.",
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

const proposal_Order: _Proposal_Host_ = {
  source: "order",
  title: "Say what it retries before its options",
  state: "OPEN",
  status: "",
  rationale: "Whether a call's retried at all is the first thing a caller asks; the options only tune how.",
  requests: [],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

// open, being revised, as the module's own proposal is, its words not to
// be typed into until the agent's done
const proposal_Timeout: _Proposal_Host_ = {
  source: "timeout",
  title: "Retry a request that timed out",
  state: "OPEN",
  status: "",
  rationale: "A 408 means the server stopped waiting for the request, not that the request failed: sent again, it usually goes through.",
  requests: [
    {
      id: "timeout-0",
      notes: "only when the request is safe to send twice, a GET or a PUT.",
      reference: null,
      status: "RUNNING"
    }
  ],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

// rejected, as the module's own proposal is: not applied, so not ringed,
// listed with its decision
const proposal_Retry501: _Proposal_Host_ = {
  source: "retry501",
  title: "Retry a 501 too",
  state: "REJECTED",
  status: "Rejected",
  rationale: "Some servers send a 501 for a method they'll support after a deploy; tried again a minute later, it works.",
  requests: [],
  actions: ACTIONS_REOPEN,
  attributes: {},
}

// accepted, and applied, as the host would once the task's settled: its
// words the README's already, so nothing's left to ring
const proposal_Base: _Proposal_Host_ = {
  source: "base",
  title: "Name the base delay DELAY_MS",
  state: "ACCEPTED",
  status: "Accepted",
  rationale: "It's the name a caller finds in the module, and would search for.",
  requests: [],
  actions: ACTIONS_REOPEN,
  attributes: {},
}

// a revision asked for, staged, as the module's own proposal is
const proposal_Cap: _Proposal_Host_ = {
  source: "cap",
  title: "Cap the delay at 30 seconds",
  state: "OPEN",
  status: "",
  rationale: "With the module's cap, a long outage never goes quiet for longer than half a minute; the README should say so.",
  requests: [
    {
      id: "cap-0",
      notes: "make the cap an option, 30 seconds unless the caller gives another.",
      reference: null,
      status: "STAGED"
    }
  ],
  actions: ACTIONS_REVIEW,
  attributes: {},
}

// withdrawn by the agent, the old address redirecting after all, its
// change gone from the lines proposed, nothing to do with it but dismiss it
const proposal_Link: _Proposal_Host_ = {
  source: "link",
  title: "Link the guide where it's moved",
  state: "WITHDRAWN",
  status: "Withdrawn",
  rationale: "The guides moved under /guides.",
  requests: [],
  actions: ACTIONS_DISMISS,
  attributes: {},
}

// the proposals, in the order a frame lists them, decided ones after the
// rest whatever their place here
const proposals_readme: Array<_Proposal_Host_> = [
  PROPOSAL_YOURS,
  proposal_Signal,
  proposal_Example,
  proposal_Stress,
  proposal_Aborted,
  proposal_Hook,
  proposal_Order,
  proposal_Timeout,
  proposal_Retry501,
  proposal_Base,
  proposal_Cap,
  proposal_Link,
]

// what moved the README under the task's rounds since they were written:
// in its opening words, "on it" taken out after "gives up", where an open
// proposal's last round says how a caller gives up, so it's stale, the long
// line drawn as it was written on, above the file's, both wrapping, and Run
// again offered
const edits_readme: Array<_Edit_Example_> = [
  { range: quoteOf(3, " on it"), multilineText: "" },
]

// the README as it now is, and the changes proposed for it, as the editor
// holds them, carried across the edit made since they were written, by the
// documents part, as the playground, as host, carries a task's head; what
// it touched stale
const carried_readme = carriedOf__Model({
  multilineText: readme,
  marks: [],
  proposed: proposed_readme,
  stale: [],
  edits: edits_readme
})
const model_readme = carried_readme.model_TextEditor
const stale_readme = carried_readme.stale

// the lines the playground, as host, frames whole, beyond what the changes
// touch, as a frame each reads: the options' list, and how long it waits,
// from its words to its link
const ranges_readme: Array<_Range_Lines_> = [{ first: 23, last: 25 }, { first: 39, last: 43 }]

// what the playground, as host, puts together for the editor, each piece
// named once: the editor's own components, the mouse, the playground's
// Markdown, and two perspectives on its changes, both in the editor's
// changes look: first, the playground's, reading them as Markdown, what
// they mean, a word made bold one box round it and its asterisks; then the
// editor's, reading them as text, each character that changed boxed, as
// code's are
const setup_readme: _Setup_TextEditor_<_State_Markdown_> = {
  componentMap: COMPONENTMAP__VIEW_TEXTEDITOR,
  modules: [MODULE_MOUSE, MODULE_KEYBOARD],
  module_Language: module_Markdown,
  module_Words: MODULE_WORDS_TEXT,
  perspectives: [perspective_Markdown, PERSPECTIVE_CHANGES]
}

// what the playground's buttons call each perspective
const labels_Perspective = new Map<_Perspective_TextEditor_, string>([
  [perspective_Markdown, "As Markdown"],
  [PERSPECTIVE_CHANGES, "As text"],
])

// what's asked of the README on no proposal: words a link's, its own
// underline kept, the request's dotted line under it
const requests_readme: Array<_Request_Task_> = [
  {
    id: "asked-1",
    notes: "Link the section on why they grow, not the whole guide.",
    aim: { kind: "DOCUMENT", reference: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: quoteOf(43, "why the waits grow") }], text: "why the waits grow", side: "CURRENT" } },
    status: "STAGED",
    sources_Answering: []
  }
]

const markdown: _Example_ = {
  name: "markdown",
  title: "Markdown",
  about: "The JavaScript example's module's README, in Markdown, drawn whole as its source, its syntax worked out by a language module, the playground's Markdown tokenizer, and styled by the playground, as a host's theme: its syntax kept as it's written, faint, and what that marks shown as it marks it, headings and strong words bold, emphasis italic, code and links coloured. Its marks are its syntax, so the document holds none, and a proposal that makes words bold puts in asterisks. Its changes are read two ways, a button over it for each, both in the editor's changes look: as Markdown, the playground's reading, first, what a change means, a word made bold one dashed ring, restyled, round it and its asterisks, as it was and as it becomes; and as text, the editor's reading, every character that changed ringed, the asterisks put in green, as code's are. The fenced JavaScript is the JavaScript module's to colour, the Markdown module handing its lines on. Eleven proposals, keeping the README in step with the module's: in its opening words, how a caller gives up, inline code put in; a signal passed in the example's call, inside the fence; in the options, framed whole, a default made bold, words replaced, and onRetry's line taken out; what it retries, its heading, words and table, moved up before the options, carrying a row put in, being revised, and a row taken out, rejected, so not ringed; and in how long it waits, framed from its words to its link, the base delay's name, accepted and applied, its words the README's already, so nothing to ring, the quote's last words changed, a revision asked for, and the link's address, withdrawn, so not ringed. The README moved under a round since it was written, \"on it\" taken out after \"gives up\" in its opening words, so how a caller gives up is stale, its long line drawn as the round was written on it and as the file has it, both wrapping, Run again offered. And your edit, the task's own, in how long it waits, says it as the module's comment does: most of a long line, its ring waved, cut where the line wraps. The README has a request of its own, on the link's words: the link keeps its own underline, the request's dotted line drawn under it. Point at a ring or an item to see a proposal; press a move's note to go to its other end.",
  // the editor, put together as above, drawing the README and its
  // proposals into the stage, over it a button for each perspective, the
  // one shown pressed; pressing another shows it, and reports which; and
  // each edit reported as it's told
  mount: (root, log) => {
    const switcher = document.createElement("div")
    switcher.className = "perspectives"
    const containerElement = document.createElement("div")
    containerElement.className = "host"
    const containerElement_Board = document.createElement("div")
    containerElement_Board.className = "board"
    containerElement_Board.hidden = true
    root.append(switcher, containerElement, containerElement_Board)
    const editor = hostedOf__Editor({
      containerElement,
      setup: setup_readme,
      model_TextEditor: model_readme,
      name_Document: "README.md",
      proposals: proposals_readme,
      stale: stale_readme,
      about_Task: {
        id: "T-7",
        name: "Bring the README up to date",
        summary: "Says what retry retries and how long it waits, with the module's cap and its options.",
        summary_Document: "In the README: what's retried, the delays, and the options, moved before the example.",
        requests: requests_readme,
        documents_Elsewhere: []
      },
      tasks_Other: [
        {
          id: "T-12",
          name: "Tidy the retry loop",
          isStarted: true,
          requests: [],
          documents_Elsewhere: [
            {
              name: "retry.js",
              counts_Proposals: { OPEN: 14, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 },
              counts_Requests: { STAGED: 8, RUNNING: 3 }
            }
          ]
        }
      ],
      tasks_Resolved: [
        {
          id: "T-6",
          name: "Say which errors are retried",
          state: "APPLIED"
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
      ranges_Frame: ranges_readme,
      log
    })
    const buttons = setup_readme.perspectives.map((perspective) => {
      const button = document.createElement("button")
      button.type = "button"
      button.textContent = labels_Perspective.get(perspective) ?? perspective.name
      button.addEventListener("click", () => {
        editor.show(perspective)
        for (const [index, each] of buttons.entries()) each.setAttribute("aria-pressed", String(setup_readme.perspectives[index] === editor.perspective_Shown))
        log({ perspective: perspective.name })
      })
      button.setAttribute("aria-pressed", String(perspective === editor.perspective_Shown))
      return button
    })
    switcher.append(...buttons)
  },
}
