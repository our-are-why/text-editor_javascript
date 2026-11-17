import { expect, test } from "bun:test"
import fc from "fast-check"
import { comparisonOf__Texts, parseTexts_Line, type _Mark_Text_, type _Position_Text_, type _Range_Text_ } from "../source/Model_TextEditor.ts"
import { MODULE_READING_TEXT } from "../source/readings/text.ts"
import { module_Reading_Markdown } from "../playground/readings.ts"

// a range on one line, from a character to another
function on(
  line: number,
  from: number,
  to: number
): _Range_Text_ {
  return { from: { line, offset: from }, to: { line, offset: to } }
}

// the text a range covers, in a text as written
function sliceIn(
  text: string,
  range: _Range_Text_
): string {
  const indexOf = (position: _Position_Text_) => text.split("\n").slice(0, position.line).reduce((index, line) => index + line.length + 1, 0) + position.offset
  return text.slice(indexOf(range.from), indexOf(range.to))
}

// what the editor's reading of text makes of a replacement, from what it
// was to what it becomes, each with its marks: each box as its word, what
// it covers of the text as it was, and of the text it becomes
function boxesOf(
  before: string,
  marks_Before: Array<_Mark_Text_>,
  after: string,
  marks_After: Array<_Mark_Text_>
): Array<string> {
  const text_Before = { lines: parseTexts_Line(before), marks: marks_Before }
  const text_After = { lines: parseTexts_Line(after), marks: marks_After }
  return MODULE_READING_TEXT.boxesOf__Replacement({
    text_Before,
    text_After,
    runs: comparisonOf__Texts({ text_Before, text_After })
  }).map((box) => `${box.word} ${JSON.stringify(sliceIn(before, box.range_Before))} ${JSON.stringify(sliceIn(after, box.range_After))}`)
}

const bold = { "data-marks": "bold" }
const italic = { "data-marks": "italic" }

test("the editor's reading of text: a box for each run that changed, called by what it does to the text, removed, inserted or replaced; none for what's kept", () => {
  expect(boxesOf("  return delay;\n  done();", [], "  const capped = Math.min(delay, 30_000);\n  return capped;", [])).toEqual([
    'inserted "" "  const capped = Math.min(delay, 30_000);\\n"',
    'replaced "delay" "capped"',
    'removed "\\n  done();" ""'
  ])
  expect(boxesOf("one two", [], "one two", [])).toEqual([])
})

test("the editor's reading of text, with marks: words kept whose marks differ, restyled, only where they differ; words replaced by words marked otherwise, replaced and restyled", () => {
  expect(boxesOf("a bold word", [], "a bold word", [{ range: on(0, 2, 6), data: bold }])).toEqual(['restyled "bold" "bold"'])
  expect(boxesOf("a bold word", [{ range: on(0, 0, 6), data: bold }], "a bold word", [{ range: on(0, 0, 1), data: bold }, { range: on(0, 7, 11), data: bold }])).toEqual(['restyled " bold" " bold"', 'restyled "word" "word"'])
  expect(boxesOf("a bold word", [{ range: on(0, 2, 6), data: bold }], "a loud word", [{ range: on(0, 2, 6), data: bold }])).toEqual(['replaced "bold" "loud"'])
  expect(boxesOf("a bold word", [{ range: on(0, 2, 6), data: bold }], "a loud word", [{ range: on(0, 2, 6), data: italic }])).toEqual(['replacedRestyled "bold" "loud"'])
})

test("the editor's reading of text calls a move moved", () => {
  expect(MODULE_READING_TEXT.word_Move).toBe("moved")
})

// what the playground's reading of Markdown makes of a replacement, from what
// it was to what it becomes: each box as its word, what it covers of the
// text as it was, and of the text it becomes
function boxesOf_Markdown(
  before: string,
  after: string
): Array<string> {
  const text_Before = { lines: parseTexts_Line(before), marks: [] }
  const text_After = { lines: parseTexts_Line(after), marks: [] }
  return module_Reading_Markdown.boxesOf__Replacement({
    text_Before,
    text_After,
    runs: comparisonOf__Texts({ text_Before, text_After })
  }).map((box) => `${box.word} ${JSON.stringify(sliceIn(before, box.range_Before))} ${JSON.stringify(sliceIn(after, box.range_After))}`)
}

test("the playground's reading of Markdown: words kept whose marks change are restyled, one box round them and every marker round them, as they were and as they become", () => {
  expect(boxesOf_Markdown("*5*", "**5**")).toEqual(['restyled "*5*" "**5**"'])
  expect(boxesOf_Markdown("a 5 b", "a **5** b")).toEqual(['restyled "5" "**5**"'])
  expect(boxesOf_Markdown("a *bold* word", "a **loud** word")).toEqual(['replacedRestyled "*bold*" "**loud**"'])
})

test("the playground's reading of Markdown: words put in, taken out or replaced, boxed with the markers that change with them, not those kept; words markers part compared apart", () => {
  expect(boxesOf_Markdown("100 ms", "`DELAY_MS`, 100 ms")).toEqual(['inserted "" "`DELAY_MS`, "'])
  expect(boxesOf_Markdown("", "**new** words")).toEqual(['inserted "" "**new** words"'])
  expect(boxesOf_Markdown("- `onRetry`: called\n", "")).toEqual(['removed "- `onRetry`: called\\n" ""'])
  expect(boxesOf_Markdown("[x](a)", "[x](b)")).toEqual(['replaced "a" "b"'])
})

test("the playground's reading of Markdown: a change to the syntax alone, meaning nothing else, is still boxed, as text, so no change is left out", () => {
  expect(boxesOf_Markdown("*x*", "_x_")).toEqual(['replaced "*x*" "_x_"'])
  expect(boxesOf_Markdown("- one", "* one")).toEqual(['replaced "-" "*"'])
})

// a short text of Markdown's syntax and a few words, in any order
const text_Markdown = fc.array(fc.constantFrom("*", "**", "_", "`", "[", "](", ")", "# ", "- ", " ", "a", "bc", "\n"), { maxLength: 12 }).map((pieces) => pieces.join(""))

test("the playground's reading of Markdown leaves no change out: what's outside its boxes reads the same on both sides, and its boxes are in order on both, none sharing a character", () => {
  fc.assert(
    fc.property(text_Markdown, text_Markdown, (before, after) => {
      const text_Before = { lines: parseTexts_Line(before), marks: [] }
      const text_After = { lines: parseTexts_Line(after), marks: [] }
      const boxes = module_Reading_Markdown.boxesOf__Replacement({ text_Before, text_After, runs: comparisonOf__Texts({ text_Before, text_After }) })
      const indexIn = (text: string) => (position: _Position_Text_) => text.split("\n").slice(0, position.line).reduce((index, line) => index + line.length + 1, 0) + position.offset
      const outsideOf = (text: string, side: "range_Before" | "range_After") => {
        const spans = boxes.map((box) => [indexIn(text)(box[side].from), indexIn(text)(box[side].to)] as const)
        spans.forEach(([from], index) => expect(from).toBeGreaterThanOrEqual(spans[index - 1]?.[1] ?? 0))
        return [...spans, [text.length, text.length] as const].map(([from], index) => text.slice(spans[index - 1]?.[1] ?? 0, from))
      }
      expect(outsideOf(before, "range_Before")).toEqual(outsideOf(after, "range_After"))
    }),
    { numRuns: 2000 }
  )
})
