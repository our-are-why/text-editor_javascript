import type { _Scene_ } from "../scene.ts"
import { parseTexts_Line, viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { actions_Review } from "../items.ts"
import { blocksWith__Frames, lineOf } from "../lines.ts"
import { attributesOf__Change } from "../looks.ts"
import { readingTime } from "./code.ts"

export {
  proposalsCode
}

// the code file's lines, numbered from 1, for the frame's lines as they are
// to be exactly the file's
const texts_readingTime = parseTexts_Line(readingTime)
const textAt = (number: number): string => texts_readingTime[number - 1] ?? ""

// the whole code file, a function in it framed in place, widened by the host
// to all of it, though its proposals touch only some of its lines: a number
// replaced, three lines taken out, and a line put in with a call replaced,
// those two one proposal; laid out beneath, as doctor lays out code
const proposalsCode: _Scene_ = {
  name: "proposals-code",
  title: "Proposals in a function",
  look: "The whole code file, with a frame in place of lines 11 to 17, a whole function, as a host would widen it, though its proposals touch only some of its lines: a number replaced; three lines taken out; and a line put in, with a call replaced further down, both one proposal. As doctor lays proposals out: the function as it is, numbered 11 to 17, each line banded for what it becomes, red taken out, yellow changed; then as the proposals would leave it, unnumbered but for a + on the line put in and a ~ on each line changed in place; then the frame's list of its proposals. The line after the frame is numbered 18, as before. Point at a change to outline all of its proposal's changes, in both.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksWith__Frames({
    multilineText: readingTime,
    module_Language: MODULE_PLAINTEXT,
    frames: [{
      kind: "FRAME",
      range: { first: 11, last: 17 },
      parts: [
        {
          kind: "CURRENT_LINES",
          run: { id: "current", lines: [
            lineOf(textAt(11)),
            lineOf(
              "export function readingTime(text: string, wordsPerMinute = ",
              { text: "230", attributes: attributesOf__Change({ side: "before", kind: "replaced", source: "faster" }) },
              "): number {"
            ),
            lineOf({ text: textAt(13), attributes: attributesOf__Change({ side: "before", kind: "removed", source: "check" }) }),
            lineOf({ text: textAt(14), attributes: attributesOf__Change({ side: "before", kind: "removed", source: "check" }) }),
            lineOf({ text: textAt(15), attributes: attributesOf__Change({ side: "before", kind: "removed", source: "check" }) }),
            lineOf(
              "  return Math.max(1, Math.round(",
              { text: "countWords(text) / wordsPerMinute", attributes: attributesOf__Change({ side: "before", kind: "replaced", source: "minutes" }) },
              "));"
            ),
            lineOf(textAt(17)),
          ], groups: [] },
        },
        {
          kind: "PROPOSAL_LINES",
          run: { id: "proposed", lines: [
            lineOf(textAt(11)),
            lineOf(
              "export function readingTime(text: string, wordsPerMinute = ",
              { text: "250", attributes: attributesOf__Change({ side: "after", kind: "replaced", source: "faster" }) },
              "): number {"
            ),
            lineOf({ text: "  const minutes = countWords(text) / wordsPerMinute;", attributes: attributesOf__Change({ side: "after", kind: "inserted", source: "minutes" }) }),
            lineOf(
              "  return Math.max(1, Math.round(",
              { text: "minutes", attributes: attributesOf__Change({ side: "after", kind: "replaced", source: "minutes" }) },
              "));"
            ),
            lineOf(textAt(17)),
          ], groups: [] },
        },
        {
          kind: "PROPOSAL_LIST",
          items: [
            {
              source: "faster",
              title: "A faster reader: 250 words a minute",
              rationale: "Adults read prose at about 250 words a minute; 230 makes every estimate a little long.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
            {
              source: "check",
              title: "Drop the check on wordsPerMinute",
              rationale: "Every caller passes a positive whole number, so the check only ever throws in tests.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
            {
              source: "minutes",
              title: "Name the minutes before rounding them",
              rationale: "With a name, the rounding reads as one step on a value you already understand.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
          ],
        },
      ],
    }],
    moves: [],
  })),
}
