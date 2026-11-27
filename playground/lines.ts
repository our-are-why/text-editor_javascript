import {
  type _Attributes_Element_,
  type _Line_Run_,
  type _Segment_Line_,
  type _Origin_Line_,
  type _Block_ViewModel_,
  parseLines_ViewModel,
  type _Module_Language_,
  type _Group_Underlay_,
  type _STRETCH_Underlay_Text_,
  type _Position_Run_
} from "../source/ui/editor/index.ts"
import { parseTexts_Line } from "../source/core/documents/index.ts"

export {
  type _Piece_Line_,
  type _Marked_Piece_,
  lineOf,
  originsOf__Document,
  blocksOf__Text,
  blocksOf__Lines,
  textElementsIn,
  groupsOf__Lines
}

// a segment as a scene writes it: plain text, or text with what's over it,
// as data
type _Piece_Line_ = string | _Marked_Piece_

interface _Marked_Piece_ {
  text: string
  attributes: _Attributes_Element_
}

// a line written piece by piece, a segment each. Each piece's text is parsed
// as a line's, so one holding a line break is a mistake in the scene, and
// throws; an empty one is left out, as an empty line has no segments. Its
// text is the document's, from the start of its first line, till the scene
// says which line it is
function lineOf(
  ...pieces: Array<_Piece_Line_>
): _Line_Run_ {
  const segments = pieces.flatMap((piece): Array<_Segment_Line_> => {
    const { text, attributes } = typeof piece === "string" ? { text: piece, attributes: {} } : piece
    const [text_line, ...more] = parseTexts_Line(text)
    if (more.length > 0) throw new Error(`a segment can't hold a line break: ${JSON.stringify(text)}`)
    return text_line === "" ? [] : [{ text: text_line, attributes }]
  })
  return {
    layer: "DOCUMENT",
    gutter: { label: "", marker: "none", pointed: "none" },
    note: null,
    segments,
    origins: originsOf__Document(segments.map((segment) => segment.text).join(""), 0),
  }
}

// where a line of the document's text is from: the document, the line it is,
// from its start
function originsOf__Document(
  text: string,
  line: number
): Array<_Origin_Line_> {
  return [{ from: 0, to: text.length, id_Text: { kind: "DOCUMENT" }, position: { line, offset: 0 } }]
}

// a document's text, its lines numbered from 1, as one run, "document", with
// nothing behind it, its syntax as the language module given says
function blocksOf__Text<State>(
  multilineText: string,
  module_Language: _Module_Language_<State>
): Array<_Block_ViewModel_> {
  return blocksOf__Lines("document", parseLines_ViewModel({ multilineText, module_Language }))
}

// lines as one run, by its id, unique in the view, with nothing behind them;
// none when there are no lines, as before a frame at the document's start
function blocksOf__Lines(
  id: string,
  lines: Array<_Line_Run_>
): Array<_Block_ViewModel_> {
  return lines.length === 0 ? [] : [{ kind: "LINES", run: { id, lines, groups: [] } }]
}

// the text of each line a view draws, in order, wherever the line sits: in a
// frame, or not; its cell, beside its gutter
function textElementsIn(
  containerElement: HTMLElement
): Array<Element> {
  return [...containerElement.querySelectorAll(".line_htmlView > .text_htmlView")]
}

// a stretch of a run's text one change covers, and the change's data
interface _Stretch_Change_ {
  source: string
  underlay: _STRETCH_Underlay_Text_
}

// the data a change's segments carry that's the change's, not their marks'
const names_Change = ["data-change", "data-side", "data-source"]

// each proposal's group behind a run of lines, in the order they first come,
// its changes in it and nothing else, no path for the proposal as a whole:
// those inside another proposal's removal too, as a segment's nested change
// says them, saying whose, data-within; and the edits other proposals make
// to what a move carries, as a segment's edit says them, each its own
// proposal's, saying whose move carries it, data-carried; a change's segments
// that run on into each other, along a line or from one line's end to the
// next one's start, as one, however many edits are inside it, without the
// spaces at its ends, so its ring is round its words alone; in the order
// they start
function groupsOf__Lines(
  lines: Array<_Line_Run_>
): Array<_Group_Underlay_> {
  const stretches = lines.flatMap((line, index_Line) => line.segments.flatMap((segment, index): Array<_Stretch_Change_> => {
    const offset = line.segments.slice(0, index).reduce((length, each) => length + each.text.length, 0)
    const source = segment.attributes["data-source"]
    const from = { line: index_Line, offset }
    const to = { line: index_Line, offset: offset + segment.text.length }
    const nested_Source = segment.attributes["data-nested-source"]
    const nested_Change = segment.attributes["data-nested-change"]
    const edit_Change = segment.attributes["data-edit-change"]
    const edit_Source = segment.attributes["data-edit-source"]
    const stretchOf = (source_Stretch: string, attributes: _Attributes_Element_): _Stretch_Change_ => ({ source: source_Stretch, underlay: { kind: "STRETCH", from, to, attributes } })
    return source === undefined ? [] : [
      stretchOf(source, Object.fromEntries(Object.entries(segment.attributes).filter(([name]) => names_Change.includes(name)))),
      ...(nested_Source === undefined || nested_Change === undefined ? [] : [stretchOf(nested_Source, { "data-change": nested_Change, "data-side": segment.attributes["data-side"] ?? "before", "data-source": nested_Source, "data-within": source })]),
      ...(edit_Change === undefined || edit_Source === undefined ? [] : [stretchOf(edit_Source, { "data-change": edit_Change, "data-side": segment.attributes["data-side"] ?? "before", "data-source": edit_Source, "data-carried": source })]),
    ]
  }))
  const alike = ({ underlay }: _Stretch_Change_) => JSON.stringify(Object.entries(underlay.attributes).toSorted())
  return [...Map.groupBy(stretches, (stretch) => stretch.source)].map(([source, stretches_Source]) => {
    const changes = [...Map.groupBy(stretches_Source, alike).values()]
      .flatMap((stretches_Alike) => stretches_Alike.reduce((merged: Array<_STRETCH_Underlay_Text_>, { underlay }) => {
        const last = merged.at(-1)
        return last !== undefined && runsInto(lines, last, underlay)
          ? [...merged.slice(0, -1), { ...last, to: underlay.to }]
          : [...merged, underlay]
      }, []))
      .map((change) => trimmed(lines, change))
      .toSorted((one, other) => one.from.line - other.from.line || one.from.offset - other.from.offset)
    return {
      attributes: { "data-source": source },
      underlays: changes,
    }
  })
}


// whether a change's stretch runs straight on from the one before: the same
// data, starting where it ends, on its line, or at the next line's start
// when it ends its line
function runsInto(
  lines: Array<_Line_Run_>,
  before: _STRETCH_Underlay_Text_,
  after: _STRETCH_Underlay_Text_
): boolean {
  const length = (lines[before.to.line]?.segments ?? []).reduce((total, segment) => total + segment.text.length, 0)
  const contiguous =
    (after.from.line === before.to.line && after.from.offset === before.to.offset) ||
    (after.from.line === before.to.line + 1 && after.from.offset === 0 && before.to.offset === length)
  return contiguous && JSON.stringify(Object.entries(before.attributes).toSorted()) === JSON.stringify(Object.entries(after.attributes).toSorted())
}

// a change's stretch without the spaces at its ends, its start moved on past
// them and its end back, across a line's end where it runs across lines;
// the lines between keep theirs, so it stays one shape. One that's only
// spaces is kept as it is, so it still shows
function trimmed(
  lines: Array<_Line_Run_>,
  underlay: _STRETCH_Underlay_Text_
): _STRETCH_Underlay_Text_ {
  const textAt = (line: number) => (lines[line]?.segments ?? []).map((segment) => segment.text).join("")
  const isBefore = (one: _Position_Run_, other: _Position_Run_) => one.line < other.line || (one.line === other.line && one.offset < other.offset)
  let from = underlay.from
  let to = underlay.to
  while (isBefore(from, to)) {
    const text = textAt(from.line)
    if (from.offset >= text.length) from = { line: from.line + 1, offset: 0 }
    else if (/\s/.test(text[from.offset] ?? "")) from = { line: from.line, offset: from.offset + 1 }
    else break
  }
  while (isBefore(from, to)) {
    if (to.offset === 0) to = { line: to.line - 1, offset: textAt(to.line - 1).length }
    else if (/\s/.test(textAt(to.line)[to.offset - 1] ?? "")) to = { line: to.line, offset: to.offset - 1 }
    else break
  }
  return isBefore(from, to) ? { ...underlay, from, to } : underlay
}
