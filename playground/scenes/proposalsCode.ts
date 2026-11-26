import type { _Scene_ } from "../scene.ts"
import {
  MODULE_PLAINTEXT,
  MODULE_READING_TEXT
} from "../../source/editor/index.ts"
import { parseTexts_Line } from "../../source/documents/index.ts"
import { ACTIONS_REVIEW } from "../../source/shell/index.ts"
import { projectedOf } from "../projected.ts"
import { readingTime } from "./code.ts"

export {
  proposalsCode
}

// the code file's lines, as its changes quote them: the number replaced, on
// readingTime's first line
const texts_readingTime = parseTexts_Line(readingTime)
const offset_230 = (texts_readingTime[11] ?? "").indexOf("230")

// the whole code file, a function in it framed in place, widened by the host
// to all of it, though its proposals touch only some of its lines: a number
// replaced, three lines taken out, and a line put in with a call replaced,
// those two one proposal; laid out beneath, as the doctor prototype lays out code
const proposalsCode: _Scene_ = {
  name: "proposals-code",
  title: "Proposals in a function",
  look: "The whole code file, with a frame in place of lines 11 to 17, a whole function, as a host would widen it, though its proposals touch only some of its lines: a number replaced; three lines taken out; and a line put in, with a call replaced further down, both one proposal. As the doctor prototype lays proposals out: the function as it is, numbered 11 to 17, each line banded for what it becomes, red taken out, yellow changed; then as the proposals would leave it, unnumbered but for a + on the line put in and a ~ on each line changed in place; then the frame's list of its proposals. The line after the frame is numbered 18, as before. Point at a change to outline all of its proposal's changes, in both.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: projectedOf({
    multilineText: readingTime,
    marks: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT,
    proposed: [
      { source: "faster", changes: [{ kind: "REPLACE", range: { from: { line: 11, offset: offset_230 }, to: { line: 11, offset: offset_230 + 3 } }, multilineText: "250", marks: [] }] },
      { source: "check", changes: [{ kind: "REPLACE", range: { from: { line: 12, offset: 0 }, to: { line: 15, offset: 0 } }, multilineText: "", marks: [] }] },
      { source: "minutes", changes: [{ kind: "REPLACE", range: { from: { line: 15, offset: 0 }, to: { line: 15, offset: (texts_readingTime[15] ?? "").length } }, multilineText: "  const minutes = countWords(text) / wordsPerMinute;\n  return Math.max(1, Math.round(minutes));", marks: [] }] }
    ],
    proposals: [
      { source: "faster", title: "A faster reader: 250 words a minute", state: "OPEN", status: "", rationale: "Adults read prose at about 250 words a minute; 230 makes every estimate a little long.", requests: [], actions: ACTIONS_REVIEW, attributes: {} },
      { source: "check", title: "Drop the check on wordsPerMinute", state: "OPEN", status: "", rationale: "Every caller passes a positive whole number, so the check only ever throws in tests.", requests: [], actions: ACTIONS_REVIEW, attributes: {} },
      { source: "minutes", title: "Name the minutes before rounding them", state: "OPEN", status: "", rationale: "With a name, the rounding reads as one step on a value you already understand.", requests: [], actions: ACTIONS_REVIEW, attributes: {} }
    ],
    rounds_Landed: [],
    ranges_Frame: [{ first: 11, last: 17 }]
  }),
}
