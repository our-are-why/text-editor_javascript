import type { _Module_Reading_, _Box_Reading_ } from "../source/Projection_TextEditor.ts"
import type { _Perspective_TextEditor_ } from "../source/TextEditor.ts"
import { comparisonOf__Texts, indexOf__Position, positionOf__Index, parseTexts_Line, type _Text_Model_, type _Run_Comparison_ } from "../source/Model_TextEditor.ts"
import { parseLines_ViewModel } from "../source/ViewModel_TextEditor.ts"
import { LOOK_CHANGES } from "../source/looks/changes.ts"
import { module_Markdown } from "./syntax.ts"

export {
  module_Reading_Markdown,
  perspective_Markdown
}

// Markdown's changes, read as what they mean, the playground's own reading,
// as a host's would be: what's compared is the words, its syntax aside, so
// words kept whose marks change, made bold from italic, are restyled, one
// box round the words and their markers as they were and as they become,
// `*5*` and `**5**`; words put in, taken out or replaced, a box round them
// and the markers that change with them. A change to the syntax alone,
// `*x*` to `_x_`, meaning nothing else, is still a change to the text, so
// what differs between the boxes is boxed as the editor's reading of text
// boxes it: no change is left out, what's outside the boxes the same on
// both sides. Each text is read as Markdown on its own, out of the lines
// round it, so a change inside a fence of code is read as Markdown too: a
// stand-in, enough for the playground's Markdown
const module_Reading_Markdown: _Module_Reading_ = {
  boxesOf__Replacement: ({ text_Before, text_After, runs }) => {
    const before = readOf(text_Before, runs.map((run) => run.range_Before), runs)
    const after = readOf(text_After, runs.map((run) => run.range_After), runs)
    const boxes = mergedOf(comparisonOf__Texts({ text_Before: before.text_Content, text_After: after.text_Content }).flatMap((run) => boxesOf(run, before, after)))
    const codePoints_Before = Array.from(text_Before.lines.join("\n"))
    const codePoints_After = Array.from(text_After.lines.join("\n"))
    const leftovers = [...boxes, null].flatMap((box, index) => boxesBetween(
      codePoints_Before,
      codePoints_After,
      boxes[index - 1]?.to_Before ?? 0,
      box?.from_Before ?? codePoints_Before.length,
      boxes[index - 1]?.to_After ?? 0,
      box?.from_After ?? codePoints_After.length
    ))
    return [...boxes, ...leftovers]
      .toSorted((one, other) => one.from_Before - other.from_Before || one.from_After - other.from_After)
      .map((box): _Box_Reading_ => ({
        range_Before: { from: positionOf__Index({ text_Model: text_Before, index: box.from_Before }), to: positionOf__Index({ text_Model: text_Before, index: box.to_Before }) },
        range_After: { from: positionOf__Index({ text_Model: text_After, index: box.from_After }), to: positionOf__Index({ text_Model: text_After, index: box.to_After }) },
        word: box.word,
      }))
  },
  word_Move: "moved",
}

// the editor's changes look, with Markdown's changes read as what they mean
const perspective_Markdown: _Perspective_TextEditor_ = {
  name: "markdown",
  module_Reading: module_Reading_Markdown,
  looks: [LOOK_CHANGES],
}

// a box, by the characters it covers on each side, counted from the start
// of each text, and its word
interface _Box_Indexes_ {
  from_Before: number
  to_Before: number
  from_After: number
  to_After: number
  word: string
}

// a text as Markdown reads it: each of its characters, a marker or not, and
// the kinds it's inside, its key; which of them a change touches; and its
// content, the characters that aren't markers, as a text of its own, each
// with where in the text it is, and its key
interface _Read_Text_ {
  characters: Array<_Character_Markdown_>
  isChanged: Array<boolean>
  text_Content: _Text_Model_
  entries_Content: Array<_Entry_Content_>
}

interface _Character_Markdown_ {
  isMarker: boolean
  key: string
}

// a character of the content, where in the text it is, or null for a break
// put between two words markers part, so they're two words still, as
// [x](a)'s x and a, compared apart
interface _Entry_Content_ {
  index: number | null
  key: string
}

// the break put between two words markers part, a character no text has
const BREAK_CONTENT = "\u0000"

// a text read, its characters worked out by the playground's Markdown
// module, the line break between two lines neither a marker nor inside
// anything, and those in a change's runs on this side, changed
function readOf(
  text_Model: _Text_Model_,
  ranges: Array<_Run_Comparison_["range_Before"]>,
  runs: Array<_Run_Comparison_>
): _Read_Text_ {
  const characters = parseLines_ViewModel({ multilineText: text_Model.lines.join("\n"), module_Language: module_Markdown }).flatMap((line, index) => [
    ...(index === 0 ? [] : [{ isMarker: false, key: "" }]),
    ...line.segments.flatMap((segment) => {
      const words = (segment.attributes["data-syntax"] ?? "").split(" ").filter((word) => word !== "")
      const character = { isMarker: words.includes("marker"), key: words.filter((word) => word !== "marker").toSorted().join(" ") }
      return Array.from(segment.text, () => character)
    }),
  ])
  const isChanged = characters.map(() => false)
  ranges.forEach((range, index) => {
    if (runs[index]?.kind !== "CHANGED") return
    const from = indexOf__Position({ text_Model, position: range.from })
    const to = indexOf__Position({ text_Model, position: range.to })
    for (let at = from; at < to; at++) isChanged[at] = true
  })
  const codePoints = Array.from(text_Model.lines.join("\n"))
  const entries_Content: Array<_Entry_Content_> = []
  let content = ""
  characters.forEach((character, index) => {
    if (character.isMarker) return
    if (entries_Content.length > 0 && characters[index - 1]?.isMarker === true) {
      entries_Content.push({ index: null, key: "" })
      content += BREAK_CONTENT
    }
    entries_Content.push({ index, key: character.key })
    content += codePoints[index] ?? ""
  })
  return {
    characters,
    isChanged,
    text_Content: { lines: parseTexts_Line(content), marks: [] },
    entries_Content,
  }
}

// the boxes a run of the content's comparison makes: kept words whose keys
// differ, restyled, wherever they differ, taking in every marker round them;
// words that changed, a box by what the change does, taking in the markers
// round them the change touches too
function boxesOf(
  run: _Run_Comparison_,
  before: _Read_Text_,
  after: _Read_Text_
): Array<_Box_Indexes_> {
  const from_Before = indexOf__Position({ text_Model: before.text_Content, position: run.range_Before.from })
  const to_Before = indexOf__Position({ text_Model: before.text_Content, position: run.range_Before.to })
  const from_After = indexOf__Position({ text_Model: after.text_Content, position: run.range_After.from })
  const to_After = indexOf__Position({ text_Model: after.text_Content, position: run.range_After.to })
  if (run.kind === "CHANGED") {
    const entries_Before = before.entries_Content.slice(from_Before, to_Before).filter((entry) => entry.index !== null)
    const entries_After = after.entries_Content.slice(from_After, to_After).filter((entry) => entry.index !== null)
    if (entries_Before.length + entries_After.length === 0) return []
    const isRestyled = [...new Set(entries_Before.map((entry) => entry.key))].toSorted().join("|") !== [...new Set(entries_After.map((entry) => entry.key))].toSorted().join("|")
    const word = wordOf(entries_Before.length, entries_After.length, isRestyled)
    return [boxIn(before, after, from_Before, to_Before, from_After, to_After, word, word === "replacedRestyled")]
  }
  const boxes: Array<_Box_Indexes_> = []
  let from_Restyled: number | null = null
  for (let index = from_Before; index <= to_Before; index++) {
    const isRestyled = index < to_Before && before.entries_Content[index]?.key !== after.entries_Content[from_After + index - from_Before]?.key
    if (isRestyled && from_Restyled === null) from_Restyled = index
    if (!isRestyled && from_Restyled !== null) {
      boxes.push(boxIn(before, after, from_Restyled, index, from_After + from_Restyled - from_Before, from_After + index - from_Before, "restyled", true))
      from_Restyled = null
    }
  }
  return boxes
}

// what a change does, by how much it covers on each side: puts in, takes
// out, or replaces, its marks changing too or not
function wordOf(
  length_Before: number,
  length_After: number,
  isRestyled: boolean
): string {
  return length_Before === 0 ? "inserted" : length_After === 0 ? "removed" : isRestyled ? "replacedRestyled" : "replaced"
}

// a box round content, from the content's characters to the text's, taking
// in the markers next to it on each side: every one, where its look
// changes, or only those a change touches. A side it covers nothing of
// stays a point, before the character after it
function boxIn(
  before: _Read_Text_,
  after: _Read_Text_,
  from_Before: number,
  to_Before: number,
  from_After: number,
  to_After: number,
  word: string,
  isEveryMarker: boolean
): _Box_Indexes_ {
  const [from_Before_Text, to_Before_Text] = spanIn(before, from_Before, to_Before, isEveryMarker)
  const [from_After_Text, to_After_Text] = spanIn(after, from_After, to_After, isEveryMarker)
  return { from_Before: from_Before_Text, to_Before: to_Before_Text, from_After: from_After_Text, to_After: to_After_Text, word }
}

function spanIn(
  read: _Read_Text_,
  from: number,
  to: number,
  isEveryMarker: boolean
): [number, number] {
  const indexes = read.entries_Content.slice(from, to).flatMap((entry) => entry.index === null ? [] : [entry.index])
  if (indexes.length === 0) {
    const at = read.entries_Content.slice(from).find((entry) => entry.index !== null)?.index ?? read.characters.length
    return [at, at]
  }
  let from_Text = indexes[0] ?? 0
  let to_Text = (indexes.at(-1) ?? 0) + 1
  const isTaken = (index: number) => read.characters[index]?.isMarker === true && (isEveryMarker || read.isChanged[index] === true)
  while (from_Text > 0 && isTaken(from_Text - 1)) from_Text--
  while (to_Text < read.characters.length && isTaken(to_Text)) to_Text++
  return [from_Text, to_Text]
}

// boxes, in order on both sides, none sharing a character on either side
// with the one before it: two that would, made one
function mergedOf(
  boxes: Array<_Box_Indexes_>
): Array<_Box_Indexes_> {
  const boxes_Merged: Array<_Box_Indexes_> = []
  for (const box of boxes.toSorted((one, other) => one.from_Before - other.from_Before || one.from_After - other.from_After)) {
    const last = boxes_Merged.at(-1)
    if (last === undefined || (box.from_Before >= last.to_Before && box.from_After >= last.to_After)) boxes_Merged.push({ ...box })
    else {
      last.to_Before = Math.max(last.to_Before, box.to_Before)
      last.to_After = Math.max(last.to_After, box.to_After)
      last.word = last.word === box.word ? last.word : "replaced"
    }
  }
  return boxes_Merged
}

// what differs between two boxes, the text there on each side compared as
// text, each run that changed a box, as the editor's reading of text boxes
// it; nothing where the two read the same
function boxesBetween(
  codePoints_Before: Array<string>,
  codePoints_After: Array<string>,
  from_Before: number,
  to_Before: number,
  from_After: number,
  to_After: number
): Array<_Box_Indexes_> {
  const between_Before = codePoints_Before.slice(from_Before, to_Before).join("")
  const between_After = codePoints_After.slice(from_After, to_After).join("")
  if (between_Before === between_After) return []
  const text_Before = { lines: parseTexts_Line(between_Before), marks: [] }
  const text_After = { lines: parseTexts_Line(between_After), marks: [] }
  return comparisonOf__Texts({ text_Before, text_After }).filter((run) => run.kind === "CHANGED").map((run) => {
    const from_Run_Before = from_Before + indexOf__Position({ text_Model: text_Before, position: run.range_Before.from })
    const to_Run_Before = from_Before + indexOf__Position({ text_Model: text_Before, position: run.range_Before.to })
    const from_Run_After = from_After + indexOf__Position({ text_Model: text_After, position: run.range_After.from })
    const to_Run_After = from_After + indexOf__Position({ text_Model: text_After, position: run.range_After.to })
    return { from_Before: from_Run_Before, to_Before: to_Run_Before, from_After: from_Run_After, to_After: to_Run_After, word: wordOf(to_Run_Before - from_Run_Before, to_Run_After - from_Run_After, false) }
  })
}
