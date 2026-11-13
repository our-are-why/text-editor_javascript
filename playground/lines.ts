import { type _Attributes_Element_, type _Line_Run_, type _Segment_Line_, parseTexts_Line, type _Block_ViewModel_, parseLines_ViewModel, type _Module_Language_, segmentsOf__Stretches, type _Stretch_Line_, type _FRAME_Block__ViewModel_, type _Part_Frame_, type _Run_Lines_, type _Marker_Gutter_, type _Group_Underlay_, type _Underlay_Text_, type _Position_Run_, type _Item_Proposals_, type _NonEmpty_, type _Range_Lines_ } from "../source/ViewModel_TextEditor.ts"

export {
  type _Piece_Line_,
  type _Marked_Piece_,
  lineOf,
  blankOf,
  blocksOf__Text,
  blocksOf__Lines,
  textElementsIn,
  type _Move_Proposal_,
  blocksWith__Frames,
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
    note: null,
    segments: pieces.flatMap((piece): Array<_Segment_Line_> => {
      const { text, attributes } = typeof piece === "string" ? { text: piece, attributes: {} } : piece
      const [text_line, ...more] = parseTexts_Line(text)
      if (more.length > 0) throw new Error(`a segment can't hold a line break: ${JSON.stringify(text)}`)
      return text_line === "" ? [] : [{ text: text_line, attributes }]
    }),
  }
}

// a blank line a proposal takes out, puts in or moves: having no words to
// carry the change, it says it only in the gutter, by its marker, which the
// frame keeps, as there are none to work it out from
function blankOf(
  marker: _Marker_Gutter_
): _Line_Run_ {
  return { gutter: { label: "", marker }, note: null, segments: [] }
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

interface _Api___blocksWith__Frames_<State> {
  multilineText: string
  module_Language: _Module_Language_<State>
  frames: Array<_FRAME_Block__ViewModel_>
  moves: Array<_Move_Proposal_>
}

// a proposal's move: the lines it takes, numbered as the document numbers
// them, and the line, as it is, it puts them before. Its words are written
// on the frames' lines, moved, as every change's are; this says where it
// goes, as the projection will know it from the move
interface _Move_Proposal_ {
  source: string
  range: _Range_Lines_
  to: number
}

// a document's lines with frames in place of the lines they're of, numbered
// from 1 as the document numbers them: the lines between frames, each
// stretch of them a run of its own, its id "lines-" and its first line's
// number; each frame, its sections' runs by the ids the scene gives them.
// Every line's syntax is the language module's, a frame's lines' too: those
// as they are, as the document's are; those proposed, as they'd be in the
// document the proposals would leave, so each starts from the state the line
// before it would leave. Each end of a move, on its first line with words,
// has a note that goes to its other end: where it leaves, only "moved", as a
// line number there would mean little, and needn't hold once other
// proposals are decided; where it lands, only where it's from, the
// document's lines as they are. Then each proposal's item, in every frame's
// list, says where it is, from the places of it every frame has, or, a
// move's, where it goes. A frame whose lines as they are aren't the
// document's, or that overlaps another, is a mistake in the scene, and
// throws, as is a proposal that moves text and changes text too: one that
// moves holds only moves. A frame whose range is empty, its last line the
// one before its first, is a point between two lines, before its first,
// with no lines as they are: where a move lands, as nothing there changes
function blocksWith__Frames<State>({
  multilineText,
  module_Language,
  frames,
  moves
}: _Api___blocksWith__Frames_<State>): Array<_Block_ViewModel_> {
  const lines = parseLines_ViewModel({ multilineText, module_Language })
  const texts = parseTexts_Line(multilineText)
  const ordered = frames.toSorted((one, other) => one.range.first - other.range.first)
  ordered.forEach((frame, index) => {
    const next = ordered[index + 1]
    if (next !== undefined && next.range.first <= frame.range.last) throw new Error(`frames of lines ${frame.range.first} to ${frame.range.last} and ${next.range.first} to ${next.range.last} overlap`)
  })
  const framed = ordered.map((frame) => framedOf(frame, lines, texts, module_Language, moves))
  checkMovesOnly(framed)
  const titles = new Map(framed.flatMap((frame) => frame.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item): [string, string] => [item.source, item.title]) : [])))
  const places_All = framed.flatMap(placesOf)
  const blocks: Array<_Block_ViewModel_> = []
  let next = 1
  for (const frame of framed) {
    blocks.push(...blocksOf__Lines(`lines-${next}`, lines.slice(next - 1, frame.range.first - 1)))
    const places_Here = placesOf(frame)
    const [part, ...more] = frame.parts
    const placed = (part_Frame: _Part_Frame_): _Part_Frame_ =>
      part_Frame.kind !== "PROPOSAL_LIST" ? part_Frame : {
        ...part_Frame,
        items: placedItems(part_Frame.items, (item) => ({ ...item, places: placesText(item.source, places_Here, places_All, titles, moves) })),
      }
    blocks.push({ ...frame, parts: [placed(part), ...more.map(placed)] })
    next = frame.range.last + 1
  }
  blocks.push(...blocksOf__Lines(`lines-${next}`, lines.slice(next - 1)))
  return blocks
}

// a frame, its lines numbered, signed and given their syntax and groups. A
// line as it is, numbered as the document numbers it, with its syntax in
// the document; one proposed, unnumbered, but for a sign: + where it's put
// in, ~ where it's changed, → where it's moved in, with its syntax in the
// document the proposals would leave; each run with its proposals' groups
// behind it. A move's first line with words, where it leaves, and its first
// line moved in, where it lands, each have a note going to the other
function framedOf<State>(
  frame: _FRAME_Block__ViewModel_,
  lines: Array<_Line_Run_>,
  texts: Array<string>,
  module_Language: _Module_Language_<State>,
  moves: Array<_Move_Proposal_>
): _FRAME_Block__ViewModel_ {
  const before = texts.slice(0, frame.range.first - 1)
  const size = frame.range.last - frame.range.first + 1
  for (const part of frame.parts) {
    if (part.kind === "CURRENT_LINES" && part.run.lines.length !== size) throw new Error(`a frame of ${size} lines shows ${part.run.lines.length} as they are`)
  }
  const numbered = (line: _Line_Run_, index: number): _Line_Run_ => {
    const leaving = moves.find((move) => firstWordedOf(move.range, texts) === frame.range.first + index)
    return {
      ...withSyntax(line, lines[frame.range.first - 1 + index]),
      gutter: { label: String(frame.range.first + index), marker: markerOf(line) },
      note: leaving === undefined ? null : { label: "moved", target: { source: leaving.source, side: "after" } },
    }
  }
  const signedIn = (lines_Proposed: Array<_Line_Run_>): Array<_Line_Run_> => {
    const syntax = parseLines_ViewModel({ multilineText: [...before, ...lines_Proposed.map(textOf)].join("\n"), module_Language }).slice(before.length)
    const landing = (index: number) => moves.find((move) => lines_Proposed.findIndex((each) => each.segments.some((segment) => segment.attributes["data-change"] === "moved" && segment.attributes["data-side"] === "after" && segment.attributes["data-source"] === move.source)) === index)
    return lines_Proposed.map((line, index) => {
      const move = landing(index)
      return {
        ...withSyntax(line, syntax[index]),
        gutter: { label: signs[markerOf(line)], marker: markerOf(line) },
        note: move === undefined ? null : { label: `from ${linesText(move.range)}`, target: { source: move.source, side: "before" } },
      }
    })
  }
  const runOf = (run: _Run_Lines_, lines_Run: Array<_Line_Run_>): _Run_Lines_ => ({ id: run.id, lines: lines_Run, groups: groupsOf__Lines(lines_Run) })
  const withGutters = (part: _Part_Frame_): _Part_Frame_ => {
    switch (part.kind) {
      case "CURRENT_LINES":
        return { kind: "CURRENT_LINES", run: runOf(part.run, part.run.lines.map(numbered)) }
      case "PROPOSAL_LINES":
        return { kind: "PROPOSAL_LINES", run: runOf(part.run, signedIn(part.run.lines)) }
      case "PROPOSAL_LIST":
        return part
    }
  }
  const [part, ...more] = frame.parts
  return { ...frame, parts: [withGutters(part), ...more.map(withGutters)] }
}

// a proposal that moves holds only moves: text taken from one place and put
// in another, as it was; what else changes in what it moves is another
// proposal's, carried, decided apart. One that moves text and changes text
// too is a mistake in the scene, and throws
function checkMovesOnly(
  frames: Array<_FRAME_Block__ViewModel_>
): void {
  const changes = frames.flatMap((frame) => frame.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? [] : part.run.groups.flatMap((group) => group.underlays)))
  for (const [source, underlays] of Map.groupBy(changes, (underlay) => underlay.attributes["data-source"] ?? "")) {
    const kinds = new Set(underlays.map((underlay) => underlay.attributes["data-change"]))
    if (kinds.has("moved") && kinds.size > 1) throw new Error(`the proposal ${source} moves text and changes it too, ${[...kinds].join(", ")}: one that moves holds only moves, and what else changes is another's`)
  }
}

// a move's first line with words on it, by its number, which says where the
// move goes: its first line may be a blank one, taken along to keep the
// lines apart where it lands
function firstWordedOf(
  range: _Range_Lines_,
  texts: Array<string>
): number {
  for (let number = range.first; number <= range.last; number++) {
    if ((texts[number - 1] ?? "").trim() !== "") return number
  }
  return range.first
}

// which way a move goes in the document: up, to before its lines, or down
function wayOf(
  move: _Move_Proposal_
): _Way_Move_ {
  return move.to < move.range.first ? "up" : "down"
}

type _Way_Move_ = "up" | "down"

// lines, by their numbers, as an item or a note says them
function linesText(
  range: _Range_Lines_
): string {
  return range.first === range.last ? `line ${range.first}` : `lines ${range.first}–${range.last}`
}

// a place of a proposal: one of its changes, by its source; when it's
// inside another proposal's removal, that one's source; when it's in what a
// move carries, that one's; and whether it's where the move lands, the same
// place again
interface _Place_Proposal_ {
  source: string
  within: string | null
  carried: string | null
  isLanded: boolean
}

// a frame's places, each counted once: on its lines as they are, every
// change but a put-in one, which has no words there; on its lines as
// proposed, every put-in one, and every one a move carries, there where it
// lands, counted once in all, where it leaves
function placesOf(
  frame: _FRAME_Block__ViewModel_
): Array<_Place_Proposal_> {
  return frame.parts.flatMap((part) => {
    if (part.kind === "PROPOSAL_LIST") return []
    return part.run.groups.flatMap((group) => group.underlays.flatMap((underlay) => {
      const change = underlay.attributes["data-change"]
      const source = underlay.attributes["data-source"]
      const carried = underlay.attributes["data-carried"] ?? null
      const isLanded = part.kind === "PROPOSAL_LINES" && carried !== null
      const counted = part.kind === "CURRENT_LINES" ? change !== "inserted" : change === "inserted" || isLanded
      return change === undefined || source === undefined || !counted ? [] : [{ source, within: underlay.attributes["data-within"] ?? null, carried, isLanded }]
    }))
  })
}

// a list's items, each made anew, the list still none empty
function placedItems(
  items: _NonEmpty_<_Item_Proposals_>,
  place: (item: _Item_Proposals_) => _Item_Proposals_
): _NonEmpty_<_Item_Proposals_> {
  const [item, ...more] = items
  return [place(item), ...more.map(place)]
}

// where a proposal is, as its item says it in a frame: a move, which lines
// and which way, at both its ends; otherwise, how many of its places are here, of how
// many in all, when that's not all of them; and of those here, how many only
// if another proposal, whose removal they're inside, is rejected; and how
// many are in what a move carries, so here at one of its ends, whichever
// it's left at, counted once where both its ends are here. Nothing for a
// proposal wholly here, inside nothing
function placesText(
  source: string,
  places_Here: Array<_Place_Proposal_>,
  places_All: Array<_Place_Proposal_>,
  titles: Map<string, string>,
  moves: Array<_Move_Proposal_>
): string {
  const move = moves.find((each) => each.source === source)
  if (move !== undefined) return `moves ${linesText(move.range)} ${wayOf(move)}`
  const here_Both = places_Here.filter((place) => place.source === source)
  const here = here_Both.filter((place) => !place.isLanded || !here_Both.some((other) => !other.isLanded && other.carried === place.carried))
  const all = places_All.filter((place) => place.source === source && !place.isLanded)
  const within = Map.groupBy(here.flatMap((place) => place.within === null ? [] : [place.within]), (source_Within) => source_Within)
  const carried = Map.groupBy(here.flatMap((place) => place.carried === null ? [] : [place.carried]), (source_Carried) => source_Carried)
  if (here.length === all.length && within.size === 0 && carried.size === 0) return ""
  const count = here.length === all.length ? `${here.length} ${here.length === 1 ? "place" : "places"}` : `${here.length} of ${all.length} places`
  return [
    count,
    ...[...within].map(([source_Within, places]) => `${places.length} only if “${titles.get(source_Within) ?? source_Within}” is rejected`),
    ...[...carried].map(([source_Carried, places]) => `${places.length === here.length ? "" : `${places.length} `}in what “${titles.get(source_Carried) ?? source_Carried}” moves`),
  ].join(", ")
}

// what a line becomes, as its changes say: taken out, when it's all taken
// out; put in, when it's all put in; moved, when it's all moved, edited on
// the way or not; changed in place, when any of it's changed; or nothing. A
// blank line, with no words to say it, as its gutter already says
function markerOf(
  line: _Line_Run_
): _Marker_Gutter_ {
  if (line.segments.length === 0) return line.gutter.marker
  const all = (change: string) => line.segments.length > 0 && line.segments.every((segment) => segment.attributes["data-change"] === change)
  if (all("removed")) return "removed"
  if (all("inserted")) return "inserted"
  if (all("moved")) return "moved"
  return line.segments.some((segment) => "data-source" in segment.attributes) ? "changed" : "none"
}

// the sign a proposed line's gutter shows for what it is: + put in, ~ changed
// in place, → moved in from elsewhere; none for a line the proposals leave as
// it was
const signs: Record<_Marker_Gutter_, string> = {
  inserted: "+",
  changed: "~",
  moved: "→",
  removed: "",
  none: ""
}

// a line's text: its segments', run together
function textOf(
  line: _Line_Run_
): string {
  return line.segments.map((segment) => segment.text).join("")
}

// a line, with the syntax of the same text, worked out on its own, over it
// too: cut wherever either's segments begin or end, each segment carrying
// the data of both. Syntax of another text is a mistake in the scene, and
// throws
function withSyntax(
  line: _Line_Run_,
  syntax: _Line_Run_ | undefined
): _Line_Run_ {
  const text = textOf(line)
  if (syntax === undefined || textOf(syntax) !== text) throw new Error(`a frame's line isn't the document's: ${JSON.stringify(text)}`)
  return { ...line, segments: segmentsOf__Stretches({ text: parseTexts_Line(text)[0], stretches: [...stretchesOf(line.segments), ...stretchesOf(syntax.segments)] }) }
}

// a line's segments as stretches of its text, each where it lies, carrying
// its data
function stretchesOf(
  segments: Array<_Segment_Line_>
): Array<_Stretch_Line_> {
  return segments.map((segment, index) => {
    const from = segments.slice(0, index).reduce((length, each) => length + each.text.length, 0)
    return { from, to: from + segment.text.length, attributes: segment.attributes }
  })
}

// a stretch of a run's text one change covers, and the change's data
interface _Stretch_Change_ {
  source: string
  underlay: _Underlay_Text_
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
    return source === undefined ? [] : [
      {
        source,
        underlay: { from, to, attributes: Object.fromEntries(Object.entries(segment.attributes).filter(([name]) => names_Change.includes(name))) },
      },
      ...(nested_Source === undefined || nested_Change === undefined ? [] : [{
        source: nested_Source,
        underlay: { from, to, attributes: { "data-change": nested_Change, "data-side": segment.attributes["data-side"] ?? "before", "data-source": nested_Source, "data-within": source } },
      }]),
      ...(edit_Change === undefined || edit_Source === undefined ? [] : [{
        source: edit_Source,
        underlay: { from, to, attributes: { "data-change": edit_Change, "data-side": segment.attributes["data-side"] ?? "before", "data-source": edit_Source, "data-carried": source } },
      }]),
    ]
  }))
  const alike = ({ underlay }: _Stretch_Change_) => JSON.stringify(Object.entries(underlay.attributes).toSorted())
  return [...Map.groupBy(stretches, (stretch) => stretch.source)].map(([source, stretches_Source]) => {
    const changes = [...Map.groupBy(stretches_Source, alike).values()]
      .flatMap((stretches_Alike) => stretches_Alike.reduce((merged: Array<_Underlay_Text_>, { underlay }) => {
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
  before: _Underlay_Text_,
  after: _Underlay_Text_
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
  underlay: _Underlay_Text_
): _Underlay_Text_ {
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
