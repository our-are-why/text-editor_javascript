import { type _Attributes_Element_, type _Line_Run_, type _Segment_Line_, parseTexts_Line, type _Block_ViewModel_, parseLines_ViewModel, type _FRAME_Block__ViewModel_, type _Part_Frame_, type _Run_Lines_, type _Marker_Gutter_, type _Group_Underlay_, type _Underlay_Text_, type _Position_Run_ } from "../source/ViewModel_TextEditor.ts"

export {
  type _Piece_Line_,
  type _Marked_Piece_,
  lineOf,
  blocksOf__Text,
  blocksOf__Lines,
  textElementsIn,
  blocksWith__Frame,
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
// throws; an empty one is left out, as an empty line has no segments
function lineOf(
  ...pieces: Array<_Piece_Line_>
): _Line_Run_ {
  return {
    gutter: { label: "", marker: "none" },
    segments: pieces.flatMap((piece): Array<_Segment_Line_> => {
      const { text, attributes } = typeof piece === "string" ? { text: piece, attributes: {} } : piece
      const [text_line, ...more] = parseTexts_Line(text)
      if (more.length > 0) throw new Error(`a segment can't hold a line break: ${JSON.stringify(text)}`)
      return text_line === "" ? [] : [{ text: text_line, attributes }]
    }),
  }
}

// a document's text, its lines numbered from 1, as one run, "document", with
// nothing behind it
function blocksOf__Text(
  multilineText: string
): Array<_Block_ViewModel_> {
  return blocksOf__Lines("document", parseLines_ViewModel(multilineText))
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

interface _Api___blocksWith__Frame_ {
  multilineText: string
  frame: _FRAME_Block__ViewModel_
}

// a document's lines with a frame in place of the lines it's of, numbered
// from 1 as the document numbers them: those before it, one run, "before",
// the frame, its sections' runs by the ids the scene gives them, those after
// it, another, "after". A frame whose lines as they are aren't as many as
// it's of is a mistake in the scene, and throws
function blocksWith__Frame({
  multilineText,
  frame
}: _Api___blocksWith__Frame_): Array<_Block_ViewModel_> {
  const lines = parseLines_ViewModel(multilineText)
  const size = frame.range.last - frame.range.first + 1
  for (const part of frame.parts) {
    if (part.kind === "CURRENT_LINES" && part.run.lines.length !== size) throw new Error(`a frame of ${size} lines shows ${part.run.lines.length} as they are`)
  }
  // a line as it is, numbered as the document numbers it; one proposed,
  // unnumbered, but for a sign: + where it's put in, ~ where it's changed;
  // each run with its proposals' groups behind it
  const numbered = (line: _Line_Run_, index: number): _Line_Run_ => ({
    ...line,
    gutter: { label: String(frame.range.first + index), marker: markerOf(line) },
  })
  const signed = (line: _Line_Run_): _Line_Run_ => ({
    ...line,
    gutter: { label: signs[markerOf(line)], marker: markerOf(line) },
  })
  const runOf = (run: _Run_Lines_, lines_Run: Array<_Line_Run_>): _Run_Lines_ => ({ id: run.id, lines: lines_Run, groups: groupsOf__Lines(lines_Run) })
  const withGutters = (part: _Part_Frame_): _Part_Frame_ => {
    switch (part.kind) {
      case "CURRENT_LINES":
        return { kind: "CURRENT_LINES", run: runOf(part.run, part.run.lines.map(numbered)) }
      case "PROPOSAL_LINES":
        return { kind: "PROPOSAL_LINES", run: runOf(part.run, part.run.lines.map(signed)) }
      case "PROPOSAL_LIST":
        return part
    }
  }
  const [part, ...more] = frame.parts
  return [
    ...blocksOf__Lines("before", lines.slice(0, frame.range.first - 1)),
    { ...frame, parts: [withGutters(part), ...more.map(withGutters)] },
    ...blocksOf__Lines("after", lines.slice(frame.range.last)),
  ]
}

// what a line becomes, as its changes say: taken out, when it's all taken
// out; put in, when it's all put in; changed in place, when any of it's
// changed; or nothing
function markerOf(
  line: _Line_Run_
): _Marker_Gutter_ {
  const all = (change: string) => line.segments.length > 0 && line.segments.every((segment) => segment.attributes["data-change"] === change)
  if (all("removed")) return "removed"
  if (all("inserted")) return "inserted"
  return line.segments.some((segment) => "data-source" in segment.attributes) ? "changed" : "none"
}

// the sign a proposed line's gutter shows for what it is: + put in, ~ changed
// in place; none for a line the proposals leave as it was
const signs: Record<_Marker_Gutter_, string> = {
  inserted: "+",
  changed: "~",
  removed: "",
  none: ""
}

// a stretch of a run's text one change covers, and the change's data
interface _Stretch_Change_ {
  source: string
  underlay: _Underlay_Text_
}

// the data a change's segments carry that's the change's, not their marks'
const names_Change = ["data-change", "data-side", "data-source"]

// each proposal's group behind a run of lines, in the order they first come:
// its target, from its first change in the run to its last, the words it
// leaves as they are between them too, on one line or across several; then
// each of its changes, a change's segments that run on into each other,
// along a line or from one line's end to the next one's start, as one
function groupsOf__Lines(
  lines: Array<_Line_Run_>
): Array<_Group_Underlay_> {
  const stretches = lines.flatMap((line, index_Line) => line.segments.flatMap((segment, index): Array<_Stretch_Change_> => {
    const offset = line.segments.slice(0, index).reduce((length, each) => length + each.text.length, 0)
    const source = segment.attributes["data-source"]
    return source === undefined ? [] : [{
      source,
      underlay: {
        from: { line: index_Line, offset },
        to: { line: index_Line, offset: offset + segment.text.length },
        attributes: Object.fromEntries(Object.entries(segment.attributes).filter(([name]) => names_Change.includes(name))),
      },
    }]
  }))
  return [...Map.groupBy(stretches, (stretch) => stretch.source)].map(([source, stretches_Source]) => {
    const changes = stretches_Source.reduce((merged: Array<_Underlay_Text_>, { underlay }) => {
      const last = merged.at(-1)
      return last !== undefined && runsInto(lines, last, underlay)
        ? [...merged.slice(0, -1), { ...last, to: underlay.to }]
        : [...merged, underlay]
    }, [])
    return {
      attributes: { "data-source": source },
      underlays: [
        { from: changes[0]?.from ?? start, to: changes.at(-1)?.to ?? start, attributes: { "data-underlay": "targets" } },
        ...changes,
      ],
    }
  })
}

// a run's start, where an underlay with nothing in it would be
const start: _Position_Run_ = { line: 0, offset: 0 }

// whether a change's stretch runs straight on from the one before: the same
// data, starting where it ends, on its line, or at the next line's start
// when it ends its line
function runsInto(
  lines: Array<_Line_Run_>,
  before: _Underlay_Text_,
  after: _Underlay_Text_
): boolean {
  const length = (lines[before.to.line]?.segments ?? []).reduce((total, segment) => total + segment.text.length, 0)
  const contiguous =
    (after.from.line === before.to.line && after.from.offset === before.to.offset) ||
    (after.from.line === before.to.line + 1 && after.from.offset === 0 && before.to.offset === length)
  return contiguous && JSON.stringify(Object.entries(before.attributes).toSorted()) === JSON.stringify(Object.entries(after.attributes).toSorted())
}
