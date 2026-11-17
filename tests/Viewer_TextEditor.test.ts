import { expect, test } from "bun:test"
import { parseModel_TextEditor } from "../source/Model_TextEditor.ts"
import { viewModelOf__Model } from "../source/Projection_TextEditor.ts"
import { MODULE_READING_TEXT } from "../source/readings/text.ts"
import { MODULE_PLAINTEXT, placeIn__Line, positionIn__Run, textOf__Line, type _Selection_TextEditor_, type _End_Selection_ } from "../source/ViewModel_TextEditor.ts"
import { HANDLERMAP__TEXTEDITOR, type _State__Viewer_TextEditor_, type _Command_TextEditor_ } from "../source/Viewer_TextEditor.ts"
import type { _Layout_View_ } from "../source/View_TextEditor.tsx"
import { actions_Review } from "../playground/items.ts"

// a document of four lines, the first framed, a proposal replacing its "two"
// with "2"; the third blank; the last holding an emoji of two code points,
// four UTF-16 units, drawn as one character. Drawn: the frame's line as it
// is, run frame-1-current, as proposed, frame-1-proposed, its "2" the
// proposal's own text, the rest the document's; then the other three lines,
// run lines-2
const result = parseModel_TextEditor({
  multilineText: "one two three\nfour\n\nfive 👍🏽 six",
  marks: [],
  proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 7 } }, multilineText: "2", marks: [] }] }]
})
if (result.kind === "REFUSED") throw new Error("refused")
const viewModel = viewModelOf__Model({
  model_TextEditor: result.model_TextEditor,
  proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", request: "", actions: actions_Review, attributes: {} }],
  ranges_Frame: [],
  module_Language: MODULE_PLAINTEXT,
  module_Reading: MODULE_READING_TEXT
})

// the view, faked as a grid, as the notes say lowering's tested: each line
// drawn a row 20 high, one under another in the runs' order, each character
// 10 wide, its caret 15 high in its row
const rows = viewModel.runs.flatMap((run_Lines) => run_Lines.lines.map((line_Run, line) => ({ id_Run: run_Lines.id, line, text: textOf__Line(line_Run) })))
const layout_View: _Layout_View_ = {
  sourceAt: () => null,
  placeAt: () => null,
  targetAt: () => null,
  foldAt: () => null,
  positionAt: ({ x, y }) => {
    const row = rows[Math.floor(y / 20)]
    return row === undefined ? null : { id_Run: row.id_Run, position: { line: row.line, offset: Math.max(0, Math.min(row.text.length, Math.round(x / 10))) } }
  },
  caretOf: ({ id_Run, position }) => {
    const index = rows.findIndex((row) => row.id_Run === id_Run && row.line === position.line)
    return index === -1 ? null : { x: position.offset * 10, top: index * 20 + 2, bottom: index * 20 + 17, height_Row: 20 }
  },
}

// the viewer's state with nothing pointed at, folded or drafted, and the
// selection given
function stateOf(
  selection: _Selection_TextEditor_ | null
): _State__Viewer_TextEditor_ {
  return { viewModel_TextEditor: viewModel, source_Pointed: null, place_Pointed: null, target_Pointed: null, target_Revealed: null, ranges_Folded: [], range_Peeked: null, items_Drafted: [], focus_Draft: null, visit_Item: null, selection, isSelecting: false, x_Goal: null, isRevealing_Caret: false }
}

// the state after each command in turn, as the viewer works it out
function after(
  state: _State__Viewer_TextEditor_,
  commands: Array<_Command_TextEditor_>
): _State__Viewer_TextEditor_ {
  return commands.reduce((state_Each, command) => (HANDLERMAP__TEXTEDITOR[command.kind] as (api: { state: _State__Viewer_TextEditor_, command: _Command_TextEditor_, layout_View: _Layout_View_ }) => _State__Viewer_TextEditor_)({ state: state_Each, command, layout_View }), state)
}

// an end of a selection as text: its run, its text, where in it
function saidOf(
  end_Selection: _End_Selection_
): string {
  const text = end_Selection.id_Text.kind === "DOCUMENT" ? "document" : `${end_Selection.id_Text.source}#${end_Selection.id_Text.index}`
  return `${end_Selection.id_Run} ${text} ${end_Selection.position.line}:${end_Selection.position.offset}`
}

// a selection as text: its anchor, and its head where it's not the anchor
function said(
  selection: _Selection_TextEditor_ | null
): string {
  if (selection === null) return "none"
  const anchor = saidOf(selection.anchor)
  const head = saidOf(selection.head)
  return anchor === head ? anchor : `${anchor} → ${head}`
}

// a caret, collapsed, in the document's text, in a run
const caretOf = (id_Run: string, line: number, offset: number): _Selection_TextEditor_ => {
  const end_Selection: _End_Selection_ = { id_Run, id_Text: { kind: "DOCUMENT" }, position: { line, offset } }
  return { anchor: end_Selection, head: end_Selection }
}

// the selection after the commands, from the one given
function movedFrom(
  selection: _Selection_TextEditor_,
  commands: Array<_Command_TextEditor_>
): string {
  return said(after(stateOf(selection), commands).selection)
}

test("where a drawn position is in the model: the text its character's from, a change's own words its text's, the document's round them, at a boundary the character after's; and back, a place in a text to where it's drawn in a run", () => {
  const run_Proposed = viewModel.runs.find((run_Lines) => run_Lines.id === "frame-1-proposed")
  const line_Run = run_Proposed?.lines[0]
  if (run_Proposed === undefined || line_Run === undefined) throw new Error("no line as proposed")
  expect(textOf__Line(line_Run)).toBe("one 2 three")
  expect([2, 4, 5].map((offset) => placeIn__Line({ line_Run, offset, id_Text: null }))).toEqual([
    { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 2 } },
    { id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 0 } },
    { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 7 } },
  ])
  expect(placeIn__Line({ line_Run, offset: 5, id_Text: { kind: "CHANGE", source: "digit", index: 0 } })).toEqual({ id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 1 } })
  expect(positionIn__Run({ run_Lines: run_Proposed, place_Text: { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 7 } } })).toEqual({ line: 0, offset: 5 })
  expect(positionIn__Run({ run_Lines: run_Proposed, place_Text: { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 5 } } })).toBe(null)
})

test("a click places the caret where it's drawn, in the text it's from; a drag from there, the button held, moves its head wherever it's drawn in the section it began in, out of a proposal's words into the document's round them, at a boundary staying in the anchor's text, out of the section stopping at its edge; once let go, a drag does nothing", () => {
  const placed = after(stateOf(null), [{ kind: "PLACE", point_Screen: { x: 40, y: 25 }, isExtending: false }])
  expect(said(placed.selection)).toBe("frame-1-proposed digit#0 0:0")
  expect(said(after(placed, [{ kind: "DRAG", point_Screen: { x: 50, y: 25 } }]).selection)).toBe("frame-1-proposed digit#0 0:0 → frame-1-proposed digit#0 0:1")
  expect(said(after(placed, [{ kind: "DRAG", point_Screen: { x: 100, y: 25 } }]).selection)).toBe("frame-1-proposed digit#0 0:0 → frame-1-proposed document 0:12")
  expect(said(after(placed, [{ kind: "DRAG", point_Screen: { x: 30, y: 85 } }]).selection)).toBe("frame-1-proposed digit#0 0:0 → frame-1-proposed document 0:13")
  expect(said(after(placed, [{ kind: "DRAG", point_Screen: { x: 30, y: 5 } }]).selection)).toBe("frame-1-proposed digit#0 0:0 → frame-1-proposed document 0:0")
  const released = after(placed, [{ kind: "RELEASE" }])
  expect(after(released, [{ kind: "DRAG", point_Screen: { x: 0, y: 25 } }])).toBe(released)
})

test("moving by character steps over a whole grapheme, an emoji of several code points one; at a line's end to the next line's start, a blank one too, and at a run's to the next run's", () => {
  expect(movedFrom(caretOf("lines-2", 3, 5), [{ kind: "MOVE", by: "CHARACTER", direction: "FORWARD" }])).toBe("lines-2 document 3:7")
  expect(movedFrom(caretOf("lines-2", 3, 7), [{ kind: "MOVE", by: "CHARACTER", direction: "BACKWARD" }])).toBe("lines-2 document 3:5")
  expect(movedFrom(caretOf("lines-2", 1, 4), [{ kind: "MOVE", by: "CHARACTER", direction: "FORWARD" }])).toBe("lines-2 document 2:0")
  expect(movedFrom(caretOf("frame-1-proposed", 0, 13), [{ kind: "MOVE", by: "CHARACTER", direction: "FORWARD" }])).toBe("lines-2 document 1:0")
})

test("moving by word goes to the end of the next word, or the start of the one before, past what isn't one, a blank line among it; to a line's edge, its start or its end", () => {
  expect(movedFrom(caretOf("lines-2", 3, 0), [{ kind: "MOVE", by: "WORD", direction: "FORWARD" }])).toBe("lines-2 document 3:4")
  expect(movedFrom(caretOf("lines-2", 3, 4), [{ kind: "MOVE", by: "WORD", direction: "FORWARD" }])).toBe("lines-2 document 3:11")
  expect(movedFrom(caretOf("lines-2", 3, 11), [{ kind: "MOVE", by: "WORD", direction: "BACKWARD" }])).toBe("lines-2 document 3:8")
  expect(movedFrom(caretOf("lines-2", 1, 4), [{ kind: "MOVE", by: "WORD", direction: "FORWARD" }])).toBe("lines-2 document 3:4")
  expect(movedFrom(caretOf("lines-2", 3, 0), [{ kind: "MOVE", by: "WORD", direction: "BACKWARD" }])).toBe("lines-2 document 1:0")
  expect(movedFrom(caretOf("lines-2", 3, 2), [{ kind: "MOVE", by: "EDGE", direction: "FORWARD" }])).toBe("lines-2 document 3:11")
  expect(movedFrom(caretOf("lines-2", 3, 2), [{ kind: "MOVE", by: "EDGE", direction: "BACKWARD" }])).toBe("lines-2 document 3:0")
})

test("moving a line goes to the row above or below, whatever run it's in, keeping the column it started at through a shorter line, till it moves otherwise", () => {
  expect(movedFrom(caretOf("lines-2", 1, 2), [{ kind: "MOVE", by: "LINE", direction: "BACKWARD" }])).toBe("frame-1-proposed document 0:2")
  expect(movedFrom(caretOf("lines-2", 1, 3), [{ kind: "MOVE", by: "LINE", direction: "FORWARD" }, { kind: "MOVE", by: "LINE", direction: "FORWARD" }])).toBe("lines-2 document 3:3")
  expect(movedFrom(caretOf("lines-2", 1, 3), [{ kind: "MOVE", by: "LINE", direction: "FORWARD" }, { kind: "MOVE", by: "EDGE", direction: "BACKWARD" }, { kind: "MOVE", by: "LINE", direction: "FORWARD" }])).toBe("lines-2 document 3:0")
  expect(movedFrom(caretOf("lines-2", 3, 2), [{ kind: "MOVE", by: "LINE", direction: "FORWARD" }])).toBe("lines-2 document 3:2")
})

test("extending moves the head alone, wherever it's drawn in the section the anchor's in: past a proposal's own words into the document's, across lines, out of the section stopping at its edge; moved by character without extending, a selection collapses to its start or its end", () => {
  const in_Change: _Selection_TextEditor_ = { anchor: { id_Run: "frame-1-proposed", id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 0 } }, head: { id_Run: "frame-1-proposed", id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 0 } } }
  expect(movedFrom(in_Change, [{ kind: "EXTEND", by: "EDGE", direction: "FORWARD" }])).toBe("frame-1-proposed digit#0 0:0 → frame-1-proposed document 0:13")
  expect(movedFrom(in_Change, [{ kind: "EXTEND", by: "CHARACTER", direction: "FORWARD" }])).toBe("frame-1-proposed digit#0 0:0 → frame-1-proposed digit#0 0:1")
  expect(movedFrom(caretOf("lines-2", 1, 2), [{ kind: "EXTEND", by: "LINE", direction: "BACKWARD" }])).toBe("lines-2 document 1:2 → lines-2 document 1:0")
  expect(movedFrom(caretOf("frame-1-proposed", 0, 13), [{ kind: "EXTEND", by: "CHARACTER", direction: "FORWARD" }])).toBe("frame-1-proposed document 0:13")
  expect(movedFrom(caretOf("lines-2", 1, 0), [{ kind: "EXTEND", by: "WORD", direction: "BACKWARD" }])).toBe("lines-2 document 1:0")
  expect(movedFrom(caretOf("lines-2", 1, 2), [{ kind: "EXTEND", by: "LINE", direction: "FORWARD" }, { kind: "EXTEND", by: "LINE", direction: "FORWARD" }])).toBe("lines-2 document 1:2 → lines-2 document 3:2")
  const selected: _Selection_TextEditor_ = { anchor: caretOf("lines-2", 3, 0).anchor, head: caretOf("lines-2", 3, 4).head }
  expect(movedFrom(selected, [{ kind: "MOVE", by: "CHARACTER", direction: "BACKWARD" }])).toBe("lines-2 document 3:0")
  expect(movedFrom(selected, [{ kind: "MOVE", by: "CHARACTER", direction: "FORWARD" }])).toBe("lines-2 document 3:4")
})
