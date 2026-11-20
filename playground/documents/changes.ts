import type { _Document_, _Section_Document_ } from "../document.ts"
import { MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import type { _Change_Host_ } from "../../source/Model_TextEditor.ts"
import type { _Proposal_Host_, _Request_Host_ } from "../../source/Projection_TextEditor.ts"
import type { _Piece_Text_, _Side_Text_ } from "../../source/ViewModel_TextEditor.ts"
import { MODULE_READING_TEXT } from "../../source/readings/text.ts"
import { projectedOf } from "../projected.ts"
import { actions_Review, actions_Reopen } from "../items.ts"
import { attributesOf__Marks } from "../looks.ts"
import { module_JavaScript } from "../syntax.ts"

export {
  changes
}

// every case of how the view draws a change, each drawn by the editor from
// a few lines of code and the changes proposed for them, as an agent would
// write them, and what the playground, as host, says of each proposal, the
// projection working out the rest, so a case shows one thing

// what a ring says: its colour, what the change does; its dash, whether
// only the look changes, or it was written before your edits, dotted,
// whether the words change too; its strength, whether it applies only if
// another proposal's rejected; filled, that it's accepted, not yet applied
const kinds: _Section_Document_ = {
  name: "kinds",
  title: "What a ring says",
  about: "A ring's colour says what the change does: red taken out, yellow replaced, green put in, brown moved. Its dash says only the look changes, or that its round wrote it before your edits; dotted, that the words change as well as their look; half strength, that it applies only if another proposal's rejected; filled, that it's accepted and waiting to be applied.",
  cases: [
    {
      name: "kinds-removed",
      title: "Words taken out",
      status: "normal",
      size: "wide",
      drawn: "Red, round the words on the lines as they are, past their ink into the space before them. On the lines as proposed they're gone, with nothing to ring: a notch over the row, its tip on the point, marks where they were. The line has no sign, though: nothing in the gutter says it changed.",
      open: {
        question: "A line that only loses words isn't signed ~ on the lines as proposed, as nothing on it is ringed, so reading down the gutter it looks unchanged.",
        recommend: "Sign it ~: the view model knows the line changed, whatever's left on it to ring; the notch says where."
      },
      viewModel_TextEditor: projectedOf({
        multilineText: "const ATTEMPTS = 5;\nconst DELAY_MS = 100; // in milliseconds",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "unit", changes: [replacing([1, 0], [1, 40], "const DELAY_MS = 100;")] }
        ],
        proposals: [
          proposalOf({ source: "unit", title: "Drop the unit comment", rationale: "DELAY_MS says its unit in its name." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "kinds-inserted",
      title: "Words put in",
      status: "normal",
      size: "wide",
      drawn: "Green, round the new words on the lines as proposed. On the lines as they are there's nothing yet to ring, so nothing is.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "for (let n = 1; n <= attempts; n++) {\n  if (n === attempts) break;\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "aborted", changes: [replacing([1, 20], [1, 20], " || signal?.aborted")] }
        ],
        proposals: [
          proposalOf({ source: "aborted", title: "Stop once the caller aborts", rationale: "Otherwise the loop sleeps a whole delay before it notices." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "kinds-replaced",
      title: "Words replaced",
      status: "normal",
      size: "wide",
      drawn: "Yellow, round the words on both sides: what they are, and what they'd become.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  return DELAY_MS * 2 ** (n - 1);\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "round", changes: [replacing([0, 0], [1, 33], "export function backoff(round) {\n  return DELAY_MS * 2 ** (round - 1);")] }
        ],
        proposals: [
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "kinds-restyled",
      title: "Only the look changed",
      status: "normal",
      size: "wide",
      drawn: "Dashed yellow on both sides: the words are the same, and only their look changes, here to bold. A dash bent round each corner, shared by the sides meeting there, and the dashes along each side evenly spaced, so every side's symmetric, as every dashed ring's are.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "The delay doubles each round, and never grows past thirty seconds.",
        marks: [],
        module_Language: MODULE_PLAINTEXT,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "bold", changes: [restyling([0, 34], [0, 39], "never", attributesOf__Marks("bold"))] }
        ],
        proposals: [
          proposalOf({ source: "bold", title: "Stress the cap", rationale: "It's the promise the caller relies on." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "kinds-replaced-restyled",
      title: "Replaced, and its look changed",
      status: "normal",
      size: "wide",
      drawn: "Dotted yellow, its dashes round dots, a dot on each corner and the rest evenly spaced along each side, its line a little heavier so they're seen: the words change, and their look too, so it's neither a restyle's dashes nor a replacement's solid line. Pointed at, heavier still, its dots spaced further apart as they grow.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "Between attempts it waits a second at most.",
        marks: [],
        module_Language: MODULE_PLAINTEXT,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "wait", changes: [restyling([0, 26], [0, 34], "two seconds", attributesOf__Marks("bold"))] }
        ],
        proposals: [
          proposalOf({ source: "wait", title: "Say the longer wait, and stress it", rationale: "The cap went up to two seconds." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "kinds-accepted",
      title: "Accepted, not yet applied",
      status: "normal",
      size: "wide",
      drawn: "Yellow, as any replacement, but each ring filled with a faint wash of its own colour: an outline is what's proposed, filled is what's taken. The host applies it when it chooses, perhaps once the whole task's settled; applied, its words are the document's and there's nothing left to ring.",
      open: {
        question: "Once it's applied, nothing marks where it was: the lines read as if they'd always been so.",
        recommend: "Leave it for now; decide whether an applied proposal leaves a trace once a task's history is shown."
      },
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  return DELAY_MS * 2 ** (n - 1);\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "round", changes: [replacing([0, 0], [1, 33], "export function backoff(round) {\n  return DELAY_MS * 2 ** (round - 1);")] }
        ],
        proposals: [
          { ...proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." }), state: "ACCEPTED", status: "Accepted", actions: actions_Reopen }
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "kinds-moved",
      title: "Moved",
      status: "normal",
      size: "wide",
      drawn: "Brown, at both its ends: numbered brown where it leaves, signed → where it lands, a note beside each end going to the other. Press a note to go there; point at one to light the ring at the other end.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "function isRetryable(error) {\n  if (error instanceof TypeError) return true;\n  const status = error?.response?.status ?? 0;\n  return status === 429 || status >= 500;\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "status", changes: [moving([2, 0], [3, 0], [1, 0])] }
        ],
        proposals: [
          proposalOf({ source: "status", title: "Work out the status first", rationale: "Then the function reads as its answers, top to bottom." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 2, last: 3 }]
      })
    },
    {
      name: "kinds-latent",
      title: "Inside another proposal's removal",
      status: "normal",
      size: "wide",
      drawn: "The rename's place inside the removal is ringed at half strength: it applies only if the removal's rejected, and its item says so. On the lines as proposed, every proposal taken, it's gone with the removal.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  if (n === attempts) break;\n  onRetry?.(error, n);",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "hook", changes: [replacing([0, 28], [1, 22], "")] },
          { source: "round", changes: [replacing([0, 6], [0, 7], "round"), replacing([1, 19], [1, 20], "round")] }
        ],
        proposals: [
          proposalOf({ source: "hook", title: "Drop the onRetry hook", rationale: "Nothing passes onRetry any more." }),
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 2 }]
      })
    },
    {
      name: "kinds-carried",
      title: "Carried by a move",
      status: "normal",
      size: "wide",
      drawn: "Another proposal's change to words the move carries is ringed inside the move's ring at both its ends, at full strength: it applies wherever the words end up.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "const DELAY_MS = 100;\nfunction sleep(ms) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "sleep", changes: [moving([0, 21], [1, 21], [0, 0])] },
          { source: "delay", changes: [replacing([1, 15], [1, 17], "delayMs")] }
        ],
        proposals: [
          proposalOf({ source: "sleep", title: "Move sleep up, beside the delays", rationale: "Read from the top, sleep comes before what waits on it." }),
          proposalOf({ source: "delay", title: "Call sleep's ms delayMs", rationale: "The unit in the name, as DELAY_MS has it." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 2 }]
      })
    },
    {
      name: "kinds-stale",
      title: "Written before your edits",
      status: "normal",
      size: "wide",
      drawn: "Dashed, in its kind's colour: a change its last round wrote before your edits touched what it was written on, as it may not say what it would now. Here the round took out the unit comment and renamed the attempts, and you'd edited the comment since: the removal's ring is dashed red, the rename's solid yellow, written on what you hadn't touched. Its item says how many, \"1 change written before your edits\", and offers Run again, starting the round's requests over from now, so the agent sees your edits.",
      open: {
        question: "A stale ring takes the restyled ring's dash, 3 2, whatever its kind: a stale restyle reads as any restyle, a stale replaced-and-restyled one, losing its dots, as only restyled, and a stale latent one is dashed, where latent rings never are.",
        recommend: "A dash of its own for stale, one no other ring has, so each dash says one thing."
      },
      viewModel_TextEditor: projectedOf({
        multilineText: "const ATTEMPTS = 5;\nconst DELAY_MS = 100; // in milliseconds",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "names", changes: [replacing([0, 6], [0, 14], "MAX_ATTEMPTS"), replacing([1, 21], [1, 40], "")] }
        ],
        proposals: [
          proposalOf({ source: "names", title: "Say the cap, drop the unit comment", rationale: "MAX_ATTEMPTS says it's a cap, and DELAY_MS says its unit in its name." })
        ],
        rounds_Landed: [{ source: "names", indexes_Stale: [1], count_Dropped: 0 }],
        ranges_Frame: [{ first: 1, last: 2 }]
      })
    },
  ],
}

// how a ring fits its words: round them, past their ink, clear of what's
// beyond, and never meeting another
const shape: _Section_Document_ = {
  name: "shape",
  title: "How a ring fits its words",
  about: "A ring goes round its words past their ink, clear of the characters beyond, over every row and line they're on as one shape, and never meets another ring, side by side, one over another, or one inside another.",
  cases: [
    {
      name: "shape-free",
      title: "Free space either side",
      status: "normal",
      size: "wide",
      drawn: "Past its words' ink into the spaces either side, clear of the characters beyond. Nothing moves.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  const delay = DELAY_MS * 2;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "base", changes: [replacing([0, 0], [0, 29], "  const delay = BASE_MS * 2;")] }
        ],
        proposals: [
          proposalOf({ source: "base", title: "Call it the base delay", rationale: "It's where the doubling starts." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-pressed",
      title: "Pressed on by punctuation",
      status: "normal",
      size: "wide",
      drawn: "Brackets press on both its ends, so the view makes the room the ring lacks: the text after it moves along a few pixels, and the ring is as far past its words, and as clear of the brackets, as anywhere.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "    await sleep(backoff(n), signal);",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "round", changes: [replacing([0, 0], [0, 36], "    await sleep(backoff(round), signal);")] }
        ],
        proposals: [
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-side-by-side",
      title: "Two rings meeting on a row",
      status: "edge",
      size: "wide",
      drawn: "One ring ends where the next starts. Each keeps its reach past its words, and the view makes room between them, so they're apart by twice the block inset and never touch, even pointed at.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  signal?.throwIfAborted();",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "abort", changes: [replacing([0, 2], [0, 8], "abortSignal")] },
          { source: "chain", changes: [replacing([0, 8], [0, 9], "")] }
        ],
        proposals: [
          proposalOf({ source: "abort", title: "Call it abortSignal", rationale: "As the DOM does." }),
          proposalOf({ source: "chain", title: "Drop the optional call", rationale: "signal is always given." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-stacked",
      title: "Rings on rows one over the other",
      status: "edge",
      size: "wide",
      drawn: "Each ring stops short of its row's top and bottom, so rings on rows one over the other are apart, the room between lines being all there is.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "const MIN_MS = 100;\nconst MAX_MS = 30_000;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "bounds", changes: [replacing([0, 0], [1, 22], "const FLOOR_MS = 100;\nconst CEILING_MS = 30_000;")] }
        ],
        proposals: [
          proposalOf({ source: "bounds", title: "Name the bounds floor and ceiling", rationale: "They bound the delay, not the attempts." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-lines",
      title: "Over several lines",
      status: "normal",
      size: "wide",
      drawn: "One shape over every line its words are on, its side stepping in and out with their ends, never by less than half an em.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay + Math.random() * (delay / 2);\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "jitter", changes: [replacing([1, 0], [2, 45], "  return withJitter(n);")] }
        ],
        proposals: [
          proposalOf({ source: "jitter", title: "Use the shared jitter", rationale: "Every client backs off the same way." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-wrapped",
      title: "Cut by a wrap",
      status: "edge",
      size: "narrow",
      drawn: "Where a wrap cuts it, its sides at the cut are dashed, a dash at each end, so its two parts read as one.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: " * @param {{ attempts?: number, onRetry?: (error: unknown, n: number) => void }} [options]",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "hook", changes: [replacing([0, 0], [0, 90], " * @param {{ attempts?: number }} [options]")] }
        ],
        proposals: [
          proposalOf({ source: "hook", title: "Drop the onRetry hook", rationale: "Nothing passes onRetry any more." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-nested",
      title: "One inside another, sharing an end",
      status: "edge",
      size: "wide",
      drawn: "The rename's ring starts where the move's does. It keeps its own reach past its words, and the move's ring reaches a nest further, with room made at that end for both, so the inner ring is as far inside on every side they share, and the two never meet, even pointed at.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "    if (n === attempts || !isRetryable(error)) break;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "order", changes: [moving([0, 8], [0, 22], [0, 45]), moving([0, 26], [0, 45], [0, 8])] },
          { source: "round", changes: [replacing([0, 8], [0, 9], "round")] }
        ],
        proposals: [
          proposalOf({ source: "order", title: "Ask about the error before the round", rationale: "An error that can't be retried ends the loop in any round." }),
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "shape-start",
      title: "At a line's start",
      status: "edge",
      size: "wide",
      drawn: "Its left end reaches past the first character into the gap before the text, so the line keeps its left edge.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "private", changes: [replacing([0, 0], [0, 29], "function backoff(n) {}")] }
        ],
        proposals: [
          proposalOf({ source: "private", title: "Keep backoff to the module", rationale: "Nothing else calls it." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
  ],
}

// a move's two ends, wherever they are
const moves: _Section_Document_ = {
  name: "moves",
  title: "Moves",
  about: "A move is neither lost nor new, so it's ringed brown at both its ends, which may be in two frames, or one, or one line.",
  cases: [
    {
      name: "moves-frames",
      title: "To another frame",
      status: "normal",
      size: "wide",
      drawn: "Each end in a frame of its own, ringed brown. Where it leaves, its number's brown and its note says only moved; where it lands there are no lines as they are, only a point between two lines, its sign → and its note saying where it's from. The blank line before it goes with it, said only in the gutter, having no words to ring. Press a note to go to the other end; point at it to light that end's ring.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "const DELAY_MS = 100;\n\nexport function retry(attempt) {}\n\nfunction sleep(ms) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "sleep", changes: [moving([2, 33], [4, 21], [1, 0])] }
        ],
        proposals: [
          proposalOf({ source: "sleep", title: "Move sleep up, beside the delays", rationale: "Read from the top, sleep comes before what waits on it." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "moves-line",
      title: "Within a line",
      status: "edge",
      size: "wide",
      drawn: "Each operand ringed brown at both its ends, on one line as it is and as proposed. The || between them isn't ringed, as it stays where it is.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "    if (n === attempts || !isRetryable(error)) break;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "order", changes: [moving([0, 8], [0, 22], [0, 45]), moving([0, 26], [0, 45], [0, 8])] }
        ],
        proposals: [
          proposalOf({ source: "order", title: "Ask about the error before the round", rationale: "An error that can't be retried ends the loop in any round." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
  ],
}

// lines taken out or put in whole
const lines: _Section_Document_ = {
  name: "lines",
  title: "Whole lines",
  about: "A line taken out or put in whole is ringed as words are, and its gutter says it: a red number, or a green +. A blank line, with no words to ring, says it only in the gutter.",
  cases: [
    {
      name: "lines-removed",
      title: "A line taken out",
      status: "normal",
      size: "wide",
      drawn: "Ringed red, its number red. On the lines as proposed it's gone: a notch on the frame's bar, at the boundary where it was, marks where.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  if (n === attempts) break;\n  onRetry?.(error, n);\n  await sleep(backoff(n));",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "hook", changes: [replacing([1, 0], [2, 0], "")] }
        ],
        proposals: [
          proposalOf({ source: "hook", title: "Drop the onRetry hook", rationale: "Nothing passes onRetry any more." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 3 }]
      })
    },
    {
      name: "lines-inserted",
      title: "A line put in",
      status: "normal",
      size: "wide",
      drawn: "Ringed green, signed + in the gutter.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "cap", changes: [replacing([1, 0], [1, 15], "  const capped = Math.min(delay, 30_000);\n  return capped;")] }
        ],
        proposals: [
          proposalOf({ source: "cap", title: "Cap the delay at 30 seconds", rationale: "A long outage never goes quiet for longer than half a minute." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 2 }]
      })
    },
    {
      name: "lines-blank",
      title: "A blank line taken out",
      status: "edge",
      size: "wide",
      drawn: "Having no words to ring, it says it only in the gutter, its number red.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "const ATTEMPTS = 5;\n\n\nconst DELAY_MS = 100;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "gap", changes: [replacing([1, 0], [2, 0], "")] }
        ],
        proposals: [
          proposalOf({ source: "gap", title: "One blank line between constants", rationale: "As everywhere else in the file." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 2, last: 3 }]
      })
    },
    {
      name: "lines-all",
      title: "Every line of a frame taken out",
      status: "edge",
      size: "wide",
      drawn: "The lines as proposed have no lines, so the frame goes from its lines as they are straight to its list; folded, it's a slim strip. The ring over the three lines steps with their ends.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  if (n < 1) {\n    throw new RangeError(\"n starts at 1\");\n  }\n  return DELAY_MS * 2 ** (n - 1);\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "check", changes: [replacing([1, 0], [4, 0], "")] }
        ],
        proposals: [
          proposalOf({ source: "check", title: "Drop the range check", rationale: "Every caller counts from 1." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
  ],
}

// a proposal whose places are in more than one frame
const threads: _Section_Document_ = {
  name: "threads",
  title: "One proposal, many places",
  about: "A proposal can change words in several frames: each frame lists it, and deciding it anywhere decides it everywhere.",
  cases: [
    {
      name: "threads-frames",
      title: "Through several frames",
      status: "normal",
      size: "wide",
      drawn: "Each frame lists it, saying how many of its places are there, of how many. Point at any of its places, or its item, to light them all, in every frame.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  return DELAY_MS * 2 ** (n - 1);\n}\n\nfor (let n = 1; n <= attempts; n++) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "round", changes: [replacing([0, 0], [1, 33], "export function backoff(round) {\n  return DELAY_MS * 2 ** (round - 1);"), replacing([4, 0], [4, 38], "for (let round = 1; round <= attempts; round++) {}")] }
        ],
        proposals: [
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
  ],
}

// pointing, the one way the view answers a question now: whose is this?
const pointing: _Section_Document_ = {
  name: "pointing",
  title: "Pointing at a change",
  about: "Pointing at a change, or an item, shows its proposal, and keeps it shown: its rings move together, and the change under the pointer moves on its own.",
  cases: [
    {
      name: "pointing-proposal",
      title: "A proposal, and the change under the pointer",
      status: "normal",
      size: "wide",
      drawn: "Point at a ring: every ring of its proposal heavier, breathing together, in every frame; the change under the pointer heavier again, both its sides, a faint light running round each, clockwise as proposed and counterclockwise as it is, both in step. The gutter's labels of its lines are drawn heavier too, by a stroke, so nothing moves. Point at an item to light its proposal the same way.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay + Math.random() * (delay / 2);\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "round", changes: [replacing([0, 0], [1, 40], "export function backoff(round) {\n  const delay = DELAY_MS * 2 ** (round - 1);")] },
          { source: "cap", changes: [replacing([2, 0], [2, 45], "  const capped = Math.min(delay, 30_000);\n  return capped + Math.random() * (capped / 2);")] }
        ],
        proposals: [
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." }),
          proposalOf({ source: "cap", title: "Cap the delay at 30 seconds", rationale: "A long outage never goes quiet for longer than half a minute." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 3 }]
      })
    },
  ],
}

// folding, the editor's own state, and the peek
const folding: _Section_Document_ = {
  name: "folding",
  title: "Folded frames",
  about: "A folded frame is a preview of its lines as proposed: no lines as they are, no rings, no list. Its chevron peeks at its rings.",
  cases: [
    {
      name: "folding-peek",
      title: "Folded, and peeked at",
      status: "normal",
      size: "wide",
      drawn: "Hover the frame to see its chevron, left of its first line, and press it, or the bar, to fold it: its lines as proposed alone, no rings, no list. Hover the chevron to peek: every ring in it, plain, with room made for them. Press it again to unfold.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "export function backoff(n) {\n  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay;\n}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "round", changes: [replacing([0, 0], [1, 40], "export function backoff(round) {\n  const delay = DELAY_MS * 2 ** (round - 1);")] },
          { source: "cap", changes: [replacing([2, 0], [2, 15], "  const capped = Math.min(delay, 30_000);\n  return capped;")] }
        ],
        proposals: [
          proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." }),
          proposalOf({ source: "cap", title: "Cap the delay at 30 seconds", rationale: "A long outage never goes quiet for longer than half a minute." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 3 }]
      })
    },
    {
      name: "folding-removals",
      title: "A frame of removals only, folded",
      status: "edge",
      size: "wide",
      drawn: "Fold it: with nothing left to show, it's a slim strip, its bar and chevron in it.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "// Retries a flaky async call, backing off each time,\n// until it succeeds, or the caller gives up on it.\n\nconst ATTEMPTS = 5;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "header", changes: [replacing([0, 0], [2, 0], "")] }
        ],
        proposals: [
          proposalOf({ source: "header", title: "Drop the opening comment", rationale: "The doc comment says it, where it's read." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
  ],
}

// where words are taken out, the lines as proposed have nothing to ring:
// a notch for it, at the point the words left, what's still to build of it
// planned
const marks: _Section_Document_ = {
  name: "marks",
  title: "Removal marks",
  about: "Where a removal takes words out, the lines as proposed have nothing left to ring. Its ring collapses to a notch, a small red wedge, at the point its text left: where words left a line, over the row, its tip down on the point; where whole lines left, in the gutter, on the frame's bar at the boundary between the lines either side, its tip toward the text. Neither takes room or moves the text. What's still to build is planned, each such case drawn as the view draws it now.",
  cases: [
    {
      name: "marks-notch",
      title: "Words out of a line: a notch",
      status: "normal",
      size: "wide",
      drawn: "A notch on the point between the two closing brackets, over the row, its tip down on the point, filled in the removal's red. It takes no room, so nothing moves.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "    await sleep(backoff(n), signal);",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "signal", changes: [replacing([0, 0], [0, 36], "    await sleep(backoff(n));")] }
        ],
        proposals: [
          proposalOf({ source: "signal", title: "Don't pass the signal to sleep", rationale: "The loop checks it itself." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "marks-lines",
      title: "Whole lines out: a notch in the gutter",
      status: "normal",
      size: "wide",
      drawn: "A notch in the gutter, cut into the frame's bar at the boundary between the two lines left, its tip toward the text, as a notch in a line points down at its point. The bar is the frame's own lane, where nothing else is drawn, so the notch reads as lines cut out of the frame. It's found reading down the gutter, as every other change is; it takes no room; and nothing's drawn near the text for it, so it's never taken for an underline.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  if (n === attempts) break;\n  onRetry?.(error, n);\n  await sleep(backoff(n));",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "hook", changes: [replacing([1, 0], [2, 0], "")] }
        ],
        proposals: [
          proposalOf({ source: "hook", title: "Drop the onRetry hook", rationale: "Nothing passes onRetry any more." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 3 }]
      })
    },
    {
      name: "marks-one-point",
      title: "Removals on one point: one notch",
      status: "planned",
      size: "wide",
      drawn: "Two proposals take out words that meet, so both fall on one point. Now: a notch each, drawn one over the other, so they look like one, and pointing finds only one of them. Planned: one notch for both, as several removals on one point always share one, in a line or between lines; pointing at it lights both removals, and its hover shows what each took out, in the order it was.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "function retry(attempt, options, legacy) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "options", changes: [replacing([0, 22], [0, 31], "")] },
          { source: "legacy", changes: [replacing([0, 31], [0, 39], "")] }
        ],
        proposals: [
          proposalOf({ source: "options", title: "Drop the options", rationale: "Every caller uses the defaults." }),
          proposalOf({ source: "legacy", title: "Drop the legacy flag", rationale: "The old path is gone." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "marks-beside-ring",
      title: "Beside another change's ring",
      status: "planned",
      size: "wide",
      drawn: "Now: the notch beside the rename's ring, where its edge may touch the notch. Planned: the words after it moved along a few pixels so the ring's edge clears the notch, as two rings beside each other are kept apart.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  signal?.throwIfAborted();",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "abort", changes: [replacing([0, 2], [0, 8], "abortSignal")] },
          { source: "chain", changes: [replacing([0, 8], [0, 9], "")] }
        ],
        proposals: [
          proposalOf({ source: "abort", title: "Call it abortSignal", rationale: "As the DOM does." }),
          proposalOf({ source: "chain", title: "Drop the optional call", rationale: "signal is always given." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "marks-in-move",
      title: "Inside a moved stretch",
      status: "planned",
      size: "wide",
      drawn: "Another proposal takes words out of what the move carries. Now: no notch, as where those words were is at the move's other end. Planned: where the move lands, the notch hangs from the brown ring's top edge, a notch cut in the move's ring where words were taken out of it.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "const DELAY_MS = 100;\nfunction sleep(ms, signal) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "sleep", changes: [moving([0, 21], [1, 29], [0, 0])] },
          { source: "signal", changes: [replacing([1, 17], [1, 25], "")] }
        ],
        proposals: [
          proposalOf({ source: "sleep", title: "Move sleep up, beside the delays", rationale: "Read from the top, sleep comes before what waits on it." }),
          proposalOf({ source: "signal", title: "Drop sleep's signal", rationale: "The loop checks it itself." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 2 }]
      })
    },
    {
      name: "marks-strip",
      title: "A frame of removals only",
      status: "edge",
      size: "wide",
      drawn: "The lines as proposed have no lines, so the frame goes from its lines as they are straight to its list. The whole frame is a removal, and its empty band says so, so there's no notch, on the bar or anywhere: one there would say nothing more. Folded, it's a slim strip.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "// Retries a flaky async call, backing off each time,\n// until it succeeds, or the caller gives up on it.\n\nconst ATTEMPTS = 5;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "header", changes: [replacing([0, 0], [2, 0], "")] }
        ],
        proposals: [
          proposalOf({ source: "header", title: "Drop the opening comment", rationale: "The doc comment says it, where it's read." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "marks-end",
      title: "The document's last lines",
      status: "edge",
      size: "wide",
      drawn: "The document ends at line 3, with no line break after it, so the removal takes the line break before its lines: by position it ends at the end of line 1, a point in a line. It takes whole lines, so it's a notch on the bar, below the last line left: the view model decides by what was taken, not by where the line breaks fall.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "function sleep(ms) {}\n\nexport { sleep };",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "exports", changes: [replacing([0, 21], [2, 17], "")] }
        ],
        proposals: [
          proposalOf({ source: "exports", title: "Drop the export", rationale: "sleep is the module's own." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 3 }]
      })
    },
    {
      name: "marks-pointing",
      title: "Pointing at a mark",
      status: "planned",
      size: "wide",
      drawn: "A notch is its removal's other side, as a move has two ends. Now: pointing at the ring lights the notch, larger, and pointing at the notch, or at the bar where it's on it, lights the ring; its hit area reaches past it. Planned: hovering a notch shows what was taken out there, words or lines.",
      open: null,
      viewModel_TextEditor: null
    },
    {
      name: "marks-whitespace",
      title: "Only whitespace",
      status: "edge",
      size: "wide",
      drawn: "As any removal: a notch where an indent's spaces were.",
      open: {
        question: "Re-indenting a block marks every line in it, which may be more noise than help.",
        recommend: "Draw them: text is text. Whoever derives the proposals can say a re-indent is one change, and the editor draws what it's given."
      },
      viewModel_TextEditor: projectedOf({
        multilineText: "    signal?.throwIfAborted();",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "indent", changes: [replacing([0, 0], [0, 2], "")] }
        ],
        proposals: [
          proposalOf({ source: "indent", title: "Indent by two", rationale: "As the rest of the file is." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "marks-start-to-middle",
      title: "From a line's start into a later line",
      status: "edge",
      size: "wide",
      drawn: "A whole line goes, and part of the next; the rest of that line is left where the first one was, so the point is in a line, at its start: a notch over column 0.",
      open: {
        question: "This loses the sign that whole lines went. It could instead be drawn as a notch in the gutter for the whole lines and a notch in the text for the rest.",
        recommend: "One notch, in the text, where its text was: one removal, one other side. How much went is for its ring to show, on the lines as they are."
      },
      viewModel_TextEditor: projectedOf({
        multilineText: "// 100ms, 200ms, 400ms, and so on,\n// up to half as long again",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "words", changes: [replacing([0, 0], [1, 3], "")] }
        ],
        proposals: [
          proposalOf({ source: "words", title: "Shorten the comment", rationale: "The numbers are in the code." })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "marks-between-lines",
      title: "Saying \"between lines\"",
      status: "normal",
      size: "wide",
      drawn: "Taking export from line 2's start, and taking line 1 whole, leave the same place in the text, the start of line 2, as proposed: a notch over column 0 for the words, a notch on the bar above the line for the line. The view model says which: each removal's other side is an underlay of a kind of its own, a point in a line or a boundary between lines, beside the stretch a ring goes round, with the removal's data, sharing its place, as every change's other side does. The view draws each kind as its map of kinds says.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "// backoff\nexport function backoff(n) {}",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "comment", changes: [replacing([0, 0], [1, 0], "")] },
          { source: "private", changes: [replacing([1, 0], [1, 7], "")] }
        ],
        proposals: [
          proposalOf({ source: "comment", title: "Drop the comment", rationale: "The name says it." }),
          proposalOf({ source: "private", title: "Keep backoff to the module", rationale: "Nothing else calls it." })
        ],
        rounds_Landed: [],
        ranges_Frame: [{ first: 1, last: 2 }]
      })
    },
  ],
}

// what's asked of a proposal, its words marked where they are: a dotted
// line under them, behind the text; where requests overlap, dashed; where
// the line meets a ring, the line over it, the ring's edge stopping short;
// the proposal pointed at, its rings over the line
const requests: _Section_Document_ = {
  name: "requests",
  title: "Request lines",
  about: "A request sent with words marks them where they are, while it waits or is worked on: a dotted line under them, in the revision's plum, behind the text, never the text's own underline. Where requests overlap, one line, dashed. Where the line meets a ring, along its edge or across it, the line goes over and the ring's edge stops short of it; point at the ring's proposal and it's the other way round.",
  cases: [
    {
      name: "requests-words",
      title: "Words a request's on",
      status: "normal",
      size: "wide",
      drawn: "A dotted plum line under the words the request was sent with, here in what the change puts in, a whole dot flush with each end of them. The proposal's item lists the request with its words in a chip, and where they are, \"line 1\", to go to them.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "const DELAY_MS = 100;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "delay", changes: [replacing([0, 17], [0, 20], "250")] }
        ],
        proposals: [
          requestedOf({
            proposal: proposalOf({ source: "delay", title: "Start from a quarter of a second", rationale: "A tenth of a second is gone before most servers have noticed." }),
            requests: [requestOf({ id: "why", notes: "Say why 250, in a comment.", pieces: [{ id_Text: { kind: "CHANGE", source: "delay", index: 0 }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }], text: "250", side: "PROPOSED" })]
          })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "requests-overlap",
      title: "Requests on the same words",
      status: "edge",
      size: "wide",
      drawn: "One line, however many requests are on the words: dotted where one is, dashed where two overlap, on Math.random, with a gap where the dots meet the dashes so they don't run together. Which request is on what is the list's to say: point at a request's chip to light its words.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "  return delay + Math.random() * (delay / 2);",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "third", changes: [replacing([0, 42], [0, 43], "3")] }
        ],
        proposals: [
          requestedOf({
            proposal: proposalOf({ source: "third", title: "Add up to a third more", rationale: "Half again spreads the retries further than they need." }),
            requests: [
              requestOf({ id: "jitter", notes: "Name the jitter.", pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 9 }, to: { line: 0, offset: 28 } } }], text: "delay + Math.random", side: "PROPOSED" }),
              requestOf({ id: "share", notes: "Say what share of the delay it adds.", pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 17 }, to: { line: 0, offset: 39 } } }], text: "Math.random() * (delay", side: "PROPOSED" })
            ]
          })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "requests-crossing",
      title: "Across a ring's edge",
      status: "edge",
      size: "wide",
      drawn: "The request's words start inside the replacement's ring and end past it. The line runs on whole, and the ring's side stops short of it, a band cut from the ring as far round the line as --view-underlay-knockout, 2.5px given none.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "      lastError = error;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "errors", changes: [replacing([0, 6], [0, 23], "errors.push(error)")] }
        ],
        proposals: [
          requestedOf({
            proposal: proposalOf({ source: "errors", title: "Keep every error, not only the last", rationale: "The first is often the telling one." }),
            requests: [requestOf({ id: "count", notes: "Count them too, for the message.", pieces: [{ id_Text: { kind: "CHANGE", source: "errors", index: 0 }, range: { from: { line: 0, offset: 7 }, to: { line: 0, offset: 18 } } }, { id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 23 }, to: { line: 0, offset: 24 } } }], text: "push(error);", side: "PROPOSED" })]
          })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
    {
      name: "requests-nested",
      title: "Along a nested ring's edge",
      status: "edge",
      size: "wide",
      drawn: "The request's words, round === attempts, sit in the move's ring, and the rename's ring inside it has its bottom edge where the line runs. The line goes over, and that stretch of the rename's bottom edge is cut away under it; its top and sides still say what it rings. Point at the rename: its ring comes over the line instead, and the line's cut away under it.",
      open: null,
      viewModel_TextEditor: projectedOf({
        multilineText: "    if (n === attempts || !isRetryable(error)) break;",
        marks: [],
        module_Language: module_JavaScript,
        module_Reading: MODULE_READING_TEXT,
        proposed: [
          { source: "order", changes: [moving([0, 8], [0, 22], [0, 45]), moving([0, 26], [0, 45], [0, 8])] },
          { source: "round", changes: [replacing([0, 8], [0, 9], "round")] }
        ],
        proposals: [
          proposalOf({ source: "order", title: "Ask about the error before the round", rationale: "An error that can't be retried ends the loop in any round." }),
          requestedOf({
            proposal: proposalOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." }),
            requests: [requestOf({ id: "which", notes: "Say which round it gives up at.", pieces: [{ id_Text: { kind: "CHANGE", source: "round", index: 0 }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 5 } } }, { id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 9 }, to: { line: 0, offset: 22 } } }], text: "round === attempts", side: "PROPOSED" })]
          })
        ],
        rounds_Landed: [],
        ranges_Frame: []
      })
    },
  ],
}

const changes: _Document_ = {
  name: "changes",
  title: "Changes",
  about: "Every case of how the view draws a change, enumerated: the rings round words, the marks planned for where words are taken out, and the lines under words a request's on. Each case is drawn by the editor, in the changes look, from a few lines and the changes proposed for them, as an agent would write them, the editor working out what to draw; under it, what it shows, and what's still to decide. Normal cases are the usual; edge cases, where something presses on the usual; planned ones, settled but not built, drawn as the view draws them now. Point at changes and items, and fold frames, as the cases say.",
  sections: [kinds, shape, moves, lines, threads, pointing, folding, marks, requests],
}

// a span of a case's lines, from a line and a character in it to another,
// each from 0, and what it becomes
function replacing(
  from: [number, number],
  to: [number, number],
  multilineText: string
): _Change_Host_ {
  return { kind: "REPLACE", range: { from: { line: from[0], offset: from[1] }, to: { line: to[0], offset: to[1] } }, multilineText, marks: [] }
}

// a span of a case's lines and what it becomes, a line's words, marked whole
// with a mark of the playground's, as host, its data
function restyling(
  from: [number, number],
  to: [number, number],
  multilineText: string,
  data: Record<string, string>
): _Change_Host_ {
  return { kind: "REPLACE", range: { from: { line: from[0], offset: from[1] }, to: { line: to[0], offset: to[1] } }, multilineText, marks: [{ range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: [...multilineText].length } }, data }] }
}

// a span of a case's lines taken from where it is and put at another place
function moving(
  from: [number, number],
  to: [number, number],
  at: [number, number]
): _Change_Host_ {
  return { kind: "MOVE", range: { from: { line: from[0], offset: from[1] }, to: { line: to[0], offset: to[1] } }, at: { line: at[0], offset: at[1] } }
}

interface _Api___proposalOf_ {
  source: string
  title: string
  rationale: string
}

// what the playground, as host, says of a proposal: open, with its review
// actions
function proposalOf({
  source,
  title,
  rationale
}: _Api___proposalOf_): _Proposal_Host_ {
  return { source, title, state: "OPEN", status: "", rationale, requests: [], actions: actions_Review, attributes: {} }
}

interface _Api___requestedOf_ {
  proposal: _Proposal_Host_
  requests: Array<_Request_Host_>
}

// a proposal with what's been asked of it
function requestedOf({
  proposal,
  requests
}: _Api___requestedOf_): _Proposal_Host_ {
  return { ...proposal, requests }
}

interface _Api___requestOf_ {
  id: string
  notes: string
  pieces: [_Piece_Text_, ...Array<_Piece_Text_>]
  text: string
  side: _Side_Text_
}

// a request queued, sent with words: where they are, what they say, and
// the side they were selected on, as they are or as proposed
function requestOf({
  id,
  notes,
  pieces,
  text,
  side
}: _Api___requestOf_): _Request_Host_ {
  return { id, notes, reference: { pieces, text, side }, status: "QUEUED" }
}
