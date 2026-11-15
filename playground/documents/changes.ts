import type { _Document_, _Section_Document_ } from "../document.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT, type _ViewModel_TextEditor_, type _Module_Language_, type _FRAME_Block__ViewModel_, type _Range_Lines_, type _Line_Run_, type _NonEmpty_, type _Item_Proposals_, type _Part_Frame_, type _Attributes_Element_ } from "../../source/ViewModel_TextEditor.ts"
import { blocksWith__Frames, lineOf, blankOf, type _Move_Proposal_, type _Marked_Piece_ } from "../lines.ts"
import { actions_Review } from "../items.ts"
import { attributesOf__Change, attributesOf__Nested, attributesOf__Edit, attributesOf__Marks, type _Side_Change_, type _Kind_Change_ } from "../looks.ts"
import { module_JavaScript } from "../syntax.ts"

export {
  changes
}

// every case of how the view draws a change, each drawn by the editor from
// a view model written by hand: a few lines of code, a frame over some of
// them, and the proposals in it, each its own, so a case shows one thing

// the proposals more than one case has, each its item
const item_Round = itemOf({ source: "round", title: "Call the attempt counter round", rationale: "n says nothing; round says what it counts." })
const item_Hook = itemOf({ source: "hook", title: "Drop the onRetry hook", rationale: "Nothing passes onRetry any more." })
const item_Sleep = itemOf({ source: "sleep", title: "Move sleep up, beside the delays", rationale: "Read from the top, sleep comes before what waits on it." })
const item_Delay = itemOf({ source: "delay", title: "Call sleep's ms delayMs", rationale: "The unit in the name, as DELAY_MS has it." })
const item_Order = itemOf({ source: "order", title: "Ask about the error before the round", rationale: "An error that can't be retried ends the loop in any round." })
const item_Cap = itemOf({ source: "cap", title: "Cap the delay at 30 seconds", rationale: "A long outage never goes quiet for longer than half a minute." })
const item_Check = itemOf({ source: "check", title: "Drop the range check", rationale: "Every caller counts from 1." })
const item_Header = itemOf({ source: "header", title: "Drop the opening comment", rationale: "The doc comment says it, where it's read." })

// what a ring says: its colour, what the change does; its dash, whether
// only the look changes; its strength, whether it applies only if another
// proposal's rejected
const kinds: _Section_Document_ = {
  name: "kinds",
  title: "What a ring says",
  about: "A ring's colour says what the change does: red taken out, yellow replaced, green put in, brown moved. Its dash says only the look changes; half strength, that it applies only if another proposal's rejected.",
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
      viewModel_TextEditor: drawnOf({
        multilineText: "const ATTEMPTS = 5;\nconst DELAY_MS = 100; // in milliseconds",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "unit",
          range: { first: 2, last: 2 },
          current: [lineOf("const DELAY_MS = 100;", ringed(" // in milliseconds", "before", "removed", "unit"))],
          proposed: [lineOf("const DELAY_MS = 100;")],
          items: [itemOf({ source: "unit", title: "Drop the unit comment", rationale: "DELAY_MS says its unit in its name." })]
        })],
        moves: []
      })
    },
    {
      name: "kinds-inserted",
      title: "Words put in",
      status: "normal",
      size: "wide",
      drawn: "Green, round the new words on the lines as proposed. On the lines as they are there's nothing yet to ring, so nothing is.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "for (let n = 1; n <= attempts; n++) {\n  if (n === attempts) break;\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "aborted",
          range: { first: 2, last: 2 },
          current: [lineOf("  if (n === attempts) break;")],
          proposed: [lineOf("  if (n === attempts", ringed(" || signal?.aborted", "after", "inserted", "aborted"), ") break;")],
          items: [itemOf({ source: "aborted", title: "Stop once the caller aborts", rationale: "Otherwise the loop sleeps a whole delay before it notices." })]
        })],
        moves: []
      })
    },
    {
      name: "kinds-replaced",
      title: "Words replaced",
      status: "normal",
      size: "wide",
      drawn: "Yellow, round the words on both sides: what they are, and what they'd become.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {\n  return DELAY_MS * 2 ** (n - 1);\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "round",
          range: { first: 1, last: 2 },
          current: [
            lineOf("export function backoff(", ringed("n", "before", "replaced", "round"), ") {"),
            lineOf("  return DELAY_MS * 2 ** (", ringed("n", "before", "replaced", "round"), " - 1);"),
          ],
          proposed: [
            lineOf("export function backoff(", ringed("round", "after", "replaced", "round"), ") {"),
            lineOf("  return DELAY_MS * 2 ** (", ringed("round", "after", "replaced", "round"), " - 1);"),
          ],
          items: [item_Round]
        })],
        moves: []
      })
    },
    {
      name: "kinds-restyled",
      title: "Only the look changed",
      status: "normal",
      size: "wide",
      drawn: "Dashed yellow on both sides: the words are the same, and only their look changes, here to bold.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "The delay doubles each round, and never grows past thirty seconds.",
        module_Language: MODULE_PLAINTEXT,
        frames: [frameOf({
          id: "bold",
          range: { first: 1, last: 1 },
          current: [lineOf("The delay doubles each round, and ", ringed("never", "before", "restyled", "bold"), " grows past thirty seconds.")],
          proposed: [lineOf("The delay doubles each round, and ", { text: "never", attributes: { ...attributesOf__Change({ side: "after", kind: "restyled", source: "bold" }), ...attributesOf__Marks("bold") } }, " grows past thirty seconds.")],
          items: [itemOf({ source: "bold", title: "Stress the cap", rationale: "It's the promise the caller relies on." })]
        })],
        moves: []
      })
    },
    {
      name: "kinds-replaced-restyled",
      title: "Replaced, and its look changed",
      status: "normal",
      size: "wide",
      drawn: "Dashed yellow, its dashes longer than a restyle's: the words change, and their look too.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "Between attempts it waits a second at most.",
        module_Language: MODULE_PLAINTEXT,
        frames: [frameOf({
          id: "wait",
          range: { first: 1, last: 1 },
          current: [lineOf("Between attempts it waits ", ringed("a second", "before", "replacedRestyled", "wait"), " at most.")],
          proposed: [lineOf("Between attempts it waits ", { text: "two seconds", attributes: { ...attributesOf__Change({ side: "after", kind: "replacedRestyled", source: "wait" }), ...attributesOf__Marks("bold") } }, " at most.")],
          items: [itemOf({ source: "wait", title: "Say the longer wait, and stress it", rationale: "The cap went up to two seconds." })]
        })],
        moves: []
      })
    },
    {
      name: "kinds-moved",
      title: "Moved",
      status: "normal",
      size: "wide",
      drawn: "Brown, at both its ends: numbered brown where it leaves, signed → where it lands, a note beside each end going to the other. Press a note to go there; point at one to light the ring at the other end.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "function isRetryable(error) {\n  if (error instanceof TypeError) return true;\n  const status = error?.response?.status ?? 0;\n  return status === 429 || status >= 500;\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "status",
          range: { first: 2, last: 3 },
          current: [
            lineOf("  if (error instanceof TypeError) return true;"),
            lineOf(ringed("  const status = error?.response?.status ?? 0;", "before", "moved", "status")),
          ],
          proposed: [
            lineOf(ringed("  const status = error?.response?.status ?? 0;", "after", "moved", "status")),
            lineOf("  if (error instanceof TypeError) return true;"),
          ],
          items: [itemOf({ source: "status", title: "Work out the status first", rationale: "Then the function reads as its answers, top to bottom." })]
        })],
        moves: [{ source: "status", range: { first: 3, last: 3 }, to: 2 }]
      })
    },
    {
      name: "kinds-latent",
      title: "Inside another proposal's removal",
      status: "normal",
      size: "wide",
      drawn: "The rename's place inside the removal is ringed at half strength: it applies only if the removal's rejected, and its item says so. On the lines as proposed, every proposal taken, it's gone with the removal.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "  if (n === attempts) break;\n  onRetry?.(error, n);",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "hook",
          range: { first: 1, last: 2 },
          current: [
            lineOf("  if (", ringed("n", "before", "replaced", "round"), " === attempts) break;"),
            lineOf(ringed("  onRetry?.(error, ", "before", "removed", "hook"), { text: "n", attributes: { ...attributesOf__Change({ side: "before", kind: "removed", source: "hook" }), ...attributesOf__Nested({ kind: "replaced", source: "round" }) } }, ringed(");", "before", "removed", "hook")),
          ],
          proposed: [lineOf("  if (", ringed("round", "after", "replaced", "round"), " === attempts) break;")],
          items: [item_Hook, item_Round]
        })],
        moves: []
      })
    },
    {
      name: "kinds-carried",
      title: "Carried by a move",
      status: "normal",
      size: "wide",
      drawn: "Another proposal's change to words the move carries is ringed inside the move's ring at both its ends, at full strength: it applies wherever the words end up.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "const DELAY_MS = 100;\nfunction sleep(ms) {}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "sleep",
          range: { first: 1, last: 2 },
          current: [
            lineOf("const DELAY_MS = 100;"),
            lineOf(ringed("function sleep(", "before", "moved", "sleep"), carried({ text: "ms", side: "before", move: "sleep", kind: "replaced", source: "delay" }), ringed(") {}", "before", "moved", "sleep")),
          ],
          proposed: [
            lineOf(ringed("function sleep(", "after", "moved", "sleep"), carried({ text: "delayMs", side: "after", move: "sleep", kind: "replaced", source: "delay" }), ringed(") {}", "after", "moved", "sleep")),
            lineOf("const DELAY_MS = 100;"),
          ],
          items: [item_Sleep, item_Delay]
        })],
        moves: [{ source: "sleep", range: { first: 2, last: 2 }, to: 1 }]
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
      viewModel_TextEditor: drawnOf({
        multilineText: "  const delay = DELAY_MS * 2;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "base",
          range: { first: 1, last: 1 },
          current: [lineOf("  const delay = ", ringed("DELAY_MS", "before", "replaced", "base"), " * 2;")],
          proposed: [lineOf("  const delay = ", ringed("BASE_MS", "after", "replaced", "base"), " * 2;")],
          items: [itemOf({ source: "base", title: "Call it the base delay", rationale: "It's where the doubling starts." })]
        })],
        moves: []
      })
    },
    {
      name: "shape-pressed",
      title: "Pressed on by punctuation",
      status: "normal",
      size: "wide",
      drawn: "Brackets press on both its ends, so the view makes the room the ring lacks: the text after it moves along a few pixels, and the ring is as far past its words, and as clear of the brackets, as anywhere.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "    await sleep(backoff(n), signal);",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "round",
          range: { first: 1, last: 1 },
          current: [lineOf("    await sleep(backoff(", ringed("n", "before", "replaced", "round"), "), signal);")],
          proposed: [lineOf("    await sleep(backoff(", ringed("round", "after", "replaced", "round"), "), signal);")],
          items: [item_Round]
        })],
        moves: []
      })
    },
    {
      name: "shape-side-by-side",
      title: "Two rings meeting on a row",
      status: "edge",
      size: "wide",
      drawn: "One ring ends where the next starts. Each keeps its reach past its words, and the view makes room between them, so they're apart by twice the block inset and never touch, even pointed at.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "  signal?.throwIfAborted();",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "signal",
          range: { first: 1, last: 1 },
          current: [lineOf("  ", ringed("signal", "before", "replaced", "abort"), ringed("?", "before", "removed", "chain"), ".throwIfAborted();")],
          proposed: [lineOf("  ", ringed("abortSignal", "after", "replaced", "abort"), ".throwIfAborted();")],
          items: [
            itemOf({ source: "abort", title: "Call it abortSignal", rationale: "As the DOM does." }),
            itemOf({ source: "chain", title: "Drop the optional call", rationale: "signal is always given." }),
          ]
        })],
        moves: []
      })
    },
    {
      name: "shape-stacked",
      title: "Rings on rows one over the other",
      status: "edge",
      size: "wide",
      drawn: "Each ring stops short of its row's top and bottom, so rings on rows one over the other are apart, the room between lines being all there is.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "const MIN_MS = 100;\nconst MAX_MS = 30_000;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "bounds",
          range: { first: 1, last: 2 },
          current: [
            lineOf("const ", ringed("MIN_MS", "before", "replaced", "bounds"), " = 100;"),
            lineOf("const ", ringed("MAX_MS", "before", "replaced", "bounds"), " = 30_000;"),
          ],
          proposed: [
            lineOf("const ", ringed("FLOOR_MS", "after", "replaced", "bounds"), " = 100;"),
            lineOf("const ", ringed("CEILING_MS", "after", "replaced", "bounds"), " = 30_000;"),
          ],
          items: [itemOf({ source: "bounds", title: "Name the bounds floor and ceiling", rationale: "They bound the delay, not the attempts." })]
        })],
        moves: []
      })
    },
    {
      name: "shape-lines",
      title: "Over several lines",
      status: "normal",
      size: "wide",
      drawn: "One shape over every line its words are on, its side stepping in and out with their ends, never by less than half an em.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {\n  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay + Math.random() * (delay / 2);\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "jitter",
          range: { first: 2, last: 3 },
          current: [
            lineOf(ringed("  const delay = DELAY_MS * 2 ** (n - 1);", "before", "replaced", "jitter")),
            lineOf(ringed("  return delay + Math.random() * (delay / 2);", "before", "replaced", "jitter")),
          ],
          proposed: [lineOf(ringed("  return jittered(DELAY_MS * 2 ** (n - 1));", "after", "replaced", "jitter"))],
          items: [itemOf({ source: "jitter", title: "Use the shared jitter", rationale: "Every client backs off the same way." })]
        })],
        moves: []
      })
    },
    {
      name: "shape-wrapped",
      title: "Cut by a wrap",
      status: "edge",
      size: "narrow",
      drawn: "Where a wrap cuts it, its sides at the cut are dashed, a dash at each end, so its two parts read as one.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: " * @param {{ attempts?: number, onRetry?: (error: unknown, n: number) => void }} [options]",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "hook",
          range: { first: 1, last: 1 },
          current: [lineOf(" * @param {{ attempts?: number", ringed(", onRetry?: (error: unknown, n: number) => void", "before", "removed", "hook"), " }} [options]")],
          proposed: [lineOf(" * @param {{ attempts?: number }} [options]")],
          items: [item_Hook]
        })],
        moves: []
      })
    },
    {
      name: "shape-nested",
      title: "One inside another, sharing an end",
      status: "edge",
      size: "wide",
      drawn: "The rename's ring starts where the move's does. It keeps its own reach past its words, and the move's ring reaches a nest further, with room made at that end for both, so the inner ring is as far inside on every side they share, and the two never meet, even pointed at.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "    if (n === attempts || !isRetryable(error)) break;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "order",
          range: { first: 1, last: 1 },
          current: [lineOf("    if (", carried({ text: "n", side: "before", move: "order", kind: "replaced", source: "round" }), ringed(" === attempts", "before", "moved", "order"), " || ", ringed("!isRetryable(error)", "before", "moved", "order"), ") break;")],
          proposed: [lineOf("    if (", ringed("!isRetryable(error)", "after", "moved", "order"), " || ", carried({ text: "round", side: "after", move: "order", kind: "replaced", source: "round" }), ringed(" === attempts", "after", "moved", "order"), ") break;")],
          items: [item_Order, item_Round]
        })],
        moves: []
      })
    },
    {
      name: "shape-start",
      title: "At a line's start",
      status: "edge",
      size: "wide",
      drawn: "Its left end reaches past the first character into the gap before the text, so the line keeps its left edge.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "private",
          range: { first: 1, last: 1 },
          current: [lineOf(ringed("export ", "before", "removed", "private"), "function backoff(n) {}")],
          proposed: [lineOf("function backoff(n) {}")],
          items: [itemOf({ source: "private", title: "Keep backoff to the module", rationale: "Nothing else calls it." })]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "const DELAY_MS = 100;\n\nexport function retry(attempt) {}\n\nfunction sleep(ms) {}",
        module_Language: module_JavaScript,
        frames: [
          frameOf({
            id: "landing",
            range: { first: 2, last: 1 },
            current: [],
            proposed: [blankOf("moved"), lineOf(ringed("function sleep(ms) {}", "after", "moved", "sleep"))],
            items: [item_Sleep]
          }),
          frameOf({
            id: "leaving",
            range: { first: 4, last: 5 },
            current: [blankOf("moved"), lineOf(ringed("function sleep(ms) {}", "before", "moved", "sleep"))],
            proposed: [],
            items: [item_Sleep]
          }),
        ],
        moves: [{ source: "sleep", range: { first: 4, last: 5 }, to: 2 }]
      })
    },
    {
      name: "moves-line",
      title: "Within a line",
      status: "edge",
      size: "wide",
      drawn: "Each operand ringed brown at both its ends, on one line as it is and as proposed. The || between them isn't ringed, as it stays where it is.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "    if (n === attempts || !isRetryable(error)) break;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "order",
          range: { first: 1, last: 1 },
          current: [lineOf("    if (", ringed("n === attempts", "before", "moved", "order"), " || ", ringed("!isRetryable(error)", "before", "moved", "order"), ") break;")],
          proposed: [lineOf("    if (", ringed("!isRetryable(error)", "after", "moved", "order"), " || ", ringed("n === attempts", "after", "moved", "order"), ") break;")],
          items: [item_Order]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "  if (n === attempts) break;\n  onRetry?.(error, n);\n  await sleep(backoff(n));",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "hook",
          range: { first: 1, last: 3 },
          current: [
            lineOf("  if (n === attempts) break;"),
            lineOf(ringed("  onRetry?.(error, n);", "before", "removed", "hook")),
            lineOf("  await sleep(backoff(n));"),
          ],
          proposed: [lineOf("  if (n === attempts) break;"), lineOf("  await sleep(backoff(n));")],
          items: [item_Hook]
        })],
        moves: []
      })
    },
    {
      name: "lines-inserted",
      title: "A line put in",
      status: "normal",
      size: "wide",
      drawn: "Ringed green, signed + in the gutter.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "cap",
          range: { first: 1, last: 2 },
          current: [lineOf("  const delay = DELAY_MS * 2 ** (n - 1);"), lineOf("  return delay;")],
          proposed: [
            lineOf("  const delay = DELAY_MS * 2 ** (n - 1);"),
            lineOf(ringed("  const capped = Math.min(delay, 30_000);", "after", "inserted", "cap")),
            lineOf("  return ", ringed("capped", "after", "replaced", "cap"), ";"),
          ],
          items: [item_Cap]
        })],
        moves: []
      })
    },
    {
      name: "lines-blank",
      title: "A blank line taken out",
      status: "edge",
      size: "wide",
      drawn: "Having no words to ring, it says it only in the gutter, its number red.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "const ATTEMPTS = 5;\n\n\nconst DELAY_MS = 100;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "gap",
          range: { first: 2, last: 3 },
          current: [blankOf("removed"), lineOf("")],
          proposed: [lineOf("")],
          items: [itemOf({ source: "gap", title: "One blank line between constants", rationale: "As everywhere else in the file." })]
        })],
        moves: []
      })
    },
    {
      name: "lines-all",
      title: "Every line of a frame taken out",
      status: "edge",
      size: "wide",
      drawn: "The lines as proposed have no lines, so the frame goes from its lines as they are straight to its list; folded, it's a slim strip. The ring over the three lines steps with their ends.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {\n  if (n < 1) {\n    throw new RangeError(\"n starts at 1\");\n  }\n  return DELAY_MS * 2 ** (n - 1);\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "check",
          range: { first: 2, last: 4 },
          current: [
            lineOf(ringed("  if (n < 1) {", "before", "removed", "check")),
            lineOf(ringed("    throw new RangeError(\"n starts at 1\");", "before", "removed", "check")),
            lineOf(ringed("  }", "before", "removed", "check")),
          ],
          proposed: [],
          items: [item_Check]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {\n  return DELAY_MS * 2 ** (n - 1);\n}\n\nfor (let n = 1; n <= attempts; n++) {}",
        module_Language: module_JavaScript,
        frames: [
          frameOf({
            id: "backoff",
            range: { first: 1, last: 2 },
            current: [
              lineOf("export function backoff(", ringed("n", "before", "replaced", "round"), ") {"),
              lineOf("  return DELAY_MS * 2 ** (", ringed("n", "before", "replaced", "round"), " - 1);"),
            ],
            proposed: [
              lineOf("export function backoff(", ringed("round", "after", "replaced", "round"), ") {"),
              lineOf("  return DELAY_MS * 2 ** (", ringed("round", "after", "replaced", "round"), " - 1);"),
            ],
            items: [item_Round]
          }),
          frameOf({
            id: "loop",
            range: { first: 5, last: 5 },
            current: [lineOf("for (let ", ringed("n", "before", "replaced", "round"), " = 1; ", ringed("n", "before", "replaced", "round"), " <= attempts; ", ringed("n", "before", "replaced", "round"), "++) {}")],
            proposed: [lineOf("for (let ", ringed("round", "after", "replaced", "round"), " = 1; ", ringed("round", "after", "replaced", "round"), " <= attempts; ", ringed("round", "after", "replaced", "round"), "++) {}")],
            items: [item_Round]
          }),
        ],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {\n  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay + Math.random() * (delay / 2);\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "backoff",
          range: { first: 1, last: 3 },
          current: [
            lineOf("export function backoff(", ringed("n", "before", "replaced", "round"), ") {"),
            lineOf("  const delay = DELAY_MS * 2 ** (", ringed("n", "before", "replaced", "round"), " - 1);"),
            lineOf("  return ", ringed("delay", "before", "replaced", "cap"), " + Math.random() * (", ringed("delay", "before", "replaced", "cap"), " / 2);"),
          ],
          proposed: [
            lineOf("export function backoff(", ringed("round", "after", "replaced", "round"), ") {"),
            lineOf("  const delay = DELAY_MS * 2 ** (", ringed("round", "after", "replaced", "round"), " - 1);"),
            lineOf(ringed("  const capped = Math.min(delay, 30_000);", "after", "inserted", "cap")),
            lineOf("  return ", ringed("capped", "after", "replaced", "cap"), " + Math.random() * (", ringed("capped", "after", "replaced", "cap"), " / 2);"),
          ],
          items: [item_Round, item_Cap]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "export function backoff(n) {\n  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay;\n}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "backoff",
          range: { first: 1, last: 3 },
          current: [
            lineOf("export function backoff(", ringed("n", "before", "replaced", "round"), ") {"),
            lineOf("  const delay = DELAY_MS * 2 ** (", ringed("n", "before", "replaced", "round"), " - 1);"),
            lineOf("  return delay;"),
          ],
          proposed: [
            lineOf("export function backoff(", ringed("round", "after", "replaced", "round"), ") {"),
            lineOf("  const delay = DELAY_MS * 2 ** (", ringed("round", "after", "replaced", "round"), " - 1);"),
            lineOf(ringed("  const capped = Math.min(delay, 30_000);", "after", "inserted", "cap")),
            lineOf("  return ", ringed("capped", "after", "replaced", "cap"), ";"),
          ],
          items: [item_Round, item_Cap]
        })],
        moves: []
      })
    },
    {
      name: "folding-removals",
      title: "A frame of removals only, folded",
      status: "edge",
      size: "wide",
      drawn: "Fold it: with nothing left to show, it's a slim strip, its bar and chevron in it.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "// Retries a flaky async call, backing off each time,\n// until it succeeds, or the caller gives up on it.\n\nconst ATTEMPTS = 5;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "header",
          range: { first: 1, last: 2 },
          current: [
            lineOf(ringed("// Retries a flaky async call, backing off each time,", "before", "removed", "header")),
            lineOf(ringed("// until it succeeds, or the caller gives up on it.", "before", "removed", "header")),
          ],
          proposed: [],
          items: [item_Header]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "    await sleep(backoff(n), signal);",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "signal",
          range: { first: 1, last: 1 },
          current: [lineOf("    await sleep(backoff(n)", ringed(", signal", "before", "removed", "signal"), ");")],
          proposed: [lineOf("    await sleep(backoff(n));")],
          items: [itemOf({ source: "signal", title: "Don't pass the signal to sleep", rationale: "The loop checks it itself." })]
        })],
        moves: []
      })
    },
    {
      name: "marks-lines",
      title: "Whole lines out: a notch in the gutter",
      status: "normal",
      size: "wide",
      drawn: "A notch in the gutter, cut into the frame's bar at the boundary between the two lines left, its tip toward the text, as a notch in a line points down at its point. The bar is the frame's own lane, where nothing else is drawn, so the notch reads as lines cut out of the frame. It's found reading down the gutter, as every other change is; it takes no room; and nothing's drawn near the text for it, so it's never taken for an underline.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "  if (n === attempts) break;\n  onRetry?.(error, n);\n  await sleep(backoff(n));",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "hook",
          range: { first: 1, last: 3 },
          current: [
            lineOf("  if (n === attempts) break;"),
            lineOf(ringed("  onRetry?.(error, n);", "before", "removed", "hook")),
            lineOf("  await sleep(backoff(n));"),
          ],
          proposed: [lineOf("  if (n === attempts) break;"), lineOf("  await sleep(backoff(n));")],
          items: [item_Hook]
        })],
        moves: []
      })
    },
    {
      name: "marks-one-point",
      title: "Removals on one point: one notch",
      status: "planned",
      size: "wide",
      drawn: "Two proposals take out words that meet, so both fall on one point. Now: a notch each, drawn one over the other, so they look like one, and pointing finds only one of them. Planned: one notch for both, as several removals on one point always share one, in a line or between lines; pointing at it lights both removals, and its hover shows what each took out, in the order it was.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "function retry(attempt, options, legacy) {}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "params",
          range: { first: 1, last: 1 },
          current: [lineOf("function retry(attempt", ringed(", options", "before", "removed", "options"), ringed(", legacy", "before", "removed", "legacy"), ") {}")],
          proposed: [lineOf("function retry(attempt) {}")],
          items: [
            itemOf({ source: "options", title: "Drop the options", rationale: "Every caller uses the defaults." }),
            itemOf({ source: "legacy", title: "Drop the legacy flag", rationale: "The old path is gone." }),
          ]
        })],
        moves: []
      })
    },
    {
      name: "marks-beside-ring",
      title: "Beside another change's ring",
      status: "planned",
      size: "wide",
      drawn: "Now: the notch beside the rename's ring, where its edge may touch the notch. Planned: the words after it moved along a few pixels so the ring's edge clears the notch, as two rings beside each other are kept apart.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "  signal?.throwIfAborted();",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "signal",
          range: { first: 1, last: 1 },
          current: [lineOf("  ", ringed("signal", "before", "replaced", "abort"), ringed("?", "before", "removed", "chain"), ".throwIfAborted();")],
          proposed: [lineOf("  ", ringed("abortSignal", "after", "replaced", "abort"), ".throwIfAborted();")],
          items: [
            itemOf({ source: "abort", title: "Call it abortSignal", rationale: "As the DOM does." }),
            itemOf({ source: "chain", title: "Drop the optional call", rationale: "signal is always given." }),
          ]
        })],
        moves: []
      })
    },
    {
      name: "marks-in-move",
      title: "Inside a moved stretch",
      status: "planned",
      size: "wide",
      drawn: "Another proposal takes words out of what the move carries. Now: no notch, as where those words were is at the move's other end. Planned: where the move lands, the notch hangs from the brown ring's top edge, a notch cut in the move's ring where words were taken out of it.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "const DELAY_MS = 100;\nfunction sleep(ms, signal) {}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "sleep",
          range: { first: 1, last: 2 },
          current: [
            lineOf("const DELAY_MS = 100;"),
            lineOf(ringed("function sleep(ms", "before", "moved", "sleep"), carried({ text: ", signal", side: "before", move: "sleep", kind: "removed", source: "signal" }), ringed(") {}", "before", "moved", "sleep")),
          ],
          proposed: [
            lineOf(ringed("function sleep(ms) {}", "after", "moved", "sleep")),
            lineOf("const DELAY_MS = 100;"),
          ],
          items: [item_Sleep, itemOf({ source: "signal", title: "Drop sleep's signal", rationale: "The loop checks it itself." })]
        })],
        moves: [{ source: "sleep", range: { first: 2, last: 2 }, to: 1 }]
      })
    },
    {
      name: "marks-strip",
      title: "A frame of removals only",
      status: "edge",
      size: "wide",
      drawn: "The lines as proposed have no lines, so the frame goes from its lines as they are straight to its list. The whole frame is a removal, and its empty band says so, so there's no notch, on the bar or anywhere: one there would say nothing more. Folded, it's a slim strip.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "// Retries a flaky async call, backing off each time,\n// until it succeeds, or the caller gives up on it.\n\nconst ATTEMPTS = 5;",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "header",
          range: { first: 1, last: 2 },
          current: [
            lineOf(ringed("// Retries a flaky async call, backing off each time,", "before", "removed", "header")),
            lineOf(ringed("// until it succeeds, or the caller gives up on it.", "before", "removed", "header")),
          ],
          proposed: [],
          items: [item_Header]
        })],
        moves: []
      })
    },
    {
      name: "marks-end",
      title: "The document's last lines",
      status: "edge",
      size: "wide",
      drawn: "The document ends at line 3, with no line break after it, so the removal takes the line break before its lines: by position it ends at the end of line 1, a point in a line. It takes whole lines, so it's a notch on the bar, below the last line left: the view model decides by what was taken, not by where the line breaks fall.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "function sleep(ms) {}\n\nexport { sleep };",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "exports",
          range: { first: 1, last: 3 },
          current: [lineOf("function sleep(ms) {}"), blankOf("removed"), lineOf(ringed("export { sleep };", "before", "removed", "exports"))],
          proposed: [lineOf("function sleep(ms) {}")],
          items: [itemOf({ source: "exports", title: "Drop the export", rationale: "sleep is the module's own." })]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "    signal?.throwIfAborted();",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "indent",
          range: { first: 1, last: 1 },
          current: [lineOf(ringed("  ", "before", "removed", "indent"), "  signal?.throwIfAborted();")],
          proposed: [lineOf("  signal?.throwIfAborted();")],
          items: [itemOf({ source: "indent", title: "Indent by two", rationale: "As the rest of the file is." })]
        })],
        moves: []
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
      viewModel_TextEditor: drawnOf({
        multilineText: "// 100ms, 200ms, 400ms, and so on,\n// up to half as long again",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "words",
          range: { first: 1, last: 2 },
          current: [
            lineOf(ringed("// 100ms, 200ms, 400ms, and so on,", "before", "removed", "words")),
            lineOf(ringed("// ", "before", "removed", "words"), "up to half as long again"),
          ],
          proposed: [lineOf("up to half as long again")],
          items: [itemOf({ source: "words", title: "Shorten the comment", rationale: "The numbers are in the code." })]
        })],
        moves: []
      })
    },
    {
      name: "marks-between-lines",
      title: "Saying \"between lines\"",
      status: "normal",
      size: "wide",
      drawn: "Taking export from line 2's start, and taking line 1 whole, leave the same place in the text, the start of line 2, as proposed: a notch over column 0 for the words, a notch on the bar above the line for the line. The view model says which: each removal's other side is an underlay of a kind of its own, a point in a line or a boundary between lines, beside the stretch a ring goes round, with the removal's data, sharing its place, as every change's other side does. The view draws each kind as its map of kinds says.",
      open: null,
      viewModel_TextEditor: drawnOf({
        multilineText: "// backoff\nexport function backoff(n) {}",
        module_Language: module_JavaScript,
        frames: [frameOf({
          id: "exports",
          range: { first: 1, last: 2 },
          current: [
            lineOf(ringed("// backoff", "before", "removed", "comment")),
            lineOf(ringed("export ", "before", "removed", "private"), "function backoff(n) {}"),
          ],
          proposed: [lineOf("function backoff(n) {}")],
          items: [
            itemOf({ source: "comment", title: "Drop the comment", rationale: "The name says it." }),
            itemOf({ source: "private", title: "Keep backoff to the module", rationale: "Nothing else calls it." }),
          ]
        })],
        moves: []
      })
    },
  ],
}

const changes: _Document_ = {
  name: "changes",
  title: "Changes",
  about: "Every case of how the view draws a change, enumerated: the rings round words, and the marks planned for where words are taken out. Each case is drawn by the editor, in the changes perspective, from a view model written by hand; under it, what it shows, and what's still to decide. Normal cases are the usual; edge cases, where something presses on the usual; planned ones, settled but not built, drawn as the view draws them now. Point at changes and items, and fold frames, as the cases say.",
  sections: [kinds, shape, moves, lines, threads, pointing, folding, marks],
}

interface _Api___drawnOf_<State> {
  multilineText: string
  module_Language: _Module_Language_<State>
  frames: Array<_FRAME_Block__ViewModel_>
  moves: Array<_Move_Proposal_>
}

// a case's view model: its lines, the frames over them, and the moves
// between them, as the playground's stand-in for the projection works them
// out, each line's syntax the language module's
function drawnOf<State>({
  multilineText,
  module_Language,
  frames,
  moves
}: _Api___drawnOf_<State>): _ViewModel_TextEditor_ {
  return viewModelOf__Blocks(blocksWith__Frames({
    multilineText,
    module_Language,
    frames,
    moves
  }))
}

interface _Api___frameOf_ {
  id: string
  range: _Range_Lines_
  current: Array<_Line_Run_>
  proposed: Array<_Line_Run_>
  items: _NonEmpty_<_Item_Proposals_>
}

// a frame over a case's lines, its runs' ids from its own: its lines as
// they are, unless it's a point between lines, where nothing is; its lines
// as proposed, none where every line's taken out; and its list
function frameOf({
  id,
  range,
  current,
  proposed,
  items
}: _Api___frameOf_): _FRAME_Block__ViewModel_ {
  const part_Proposed: _Part_Frame_ = { kind: "PROPOSAL_LINES", run: { id: `${id}-proposed`, lines: proposed, groups: [] } }
  const part_List: _Part_Frame_ = { kind: "PROPOSAL_LIST", items }
  return {
    kind: "FRAME",
    range,
    parts: current.length === 0
      ? [part_Proposed, part_List]
      : [{ kind: "CURRENT_LINES", run: { id: `${id}-current`, lines: current, groups: [] } }, part_Proposed, part_List],
  }
}

// a stretch a proposal changes, written as a scene writes it
function ringed(
  text: string,
  side: _Side_Change_,
  kind: _Kind_Change_,
  source: string
): _Marked_Piece_ {
  return { text, attributes: attributesOf__Change({ side, kind, source }) }
}

interface _Api___carried_ {
  text: string
  side: _Side_Change_
  move: string
  kind: _Kind_Change_
  source: string
}

// a stretch another proposal changes inside what a move carries: the
// move's, with the change under names of its own
function carried({
  text,
  side,
  move,
  kind,
  source
}: _Api___carried_): _Marked_Piece_ {
  const attributes: _Attributes_Element_ = { ...attributesOf__Change({ side, kind: "moved", source: move }), ...attributesOf__Edit({ kind, source }) }
  return { text, attributes }
}

interface _Api___itemOf_ {
  source: string
  title: string
  rationale: string
}

// a proposal's item, as the playground, as host, lists it, with its review
// actions
function itemOf({
  source,
  title,
  rationale
}: _Api___itemOf_): _Item_Proposals_ {
  return { source, title, places: "", rationale, actions: actions_Review, attributes: {} }
}
