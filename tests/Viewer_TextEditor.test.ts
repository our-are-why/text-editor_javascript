import { expect, test } from "bun:test"
import { parseModel_TextEditor, type _Changes_Host_ } from "../source/Model_TextEditor.ts"
import { viewModelOf__Model } from "../source/Projection_TextEditor.ts"
import { MODULE_READING_TEXT } from "../source/readings/text.ts"
import { MODULE_PLAINTEXT, confirmingAt__ViewModel, placeIn__Line, positionIn__Run, textOf__Line, type _Selection_TextEditor_, type _End_Selection_ } from "../source/ViewModel_TextEditor.ts"
import { HANDLERMAP__TEXTEDITOR, type _State__Viewer_TextEditor_, type _Command_TextEditor_ } from "../source/Viewer_TextEditor.ts"
import type { _Request_Edit_ } from "../source/Editing_TextEditor.ts"
import type { _Layout_View_ } from "../source/View_TextEditor.tsx"
import { actions_Review } from "../playground/items.ts"
import { MODULE_WORDS_TEXT } from "../source/words/text.ts"

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
  proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} }],
  requests_Document: [],
  rounds_Landed: [],
  task_Header: null,
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
  return { viewModel_TextEditor: viewModel, source_Pointed: null, place_Pointed: null, target_Pointed: null, target_Revealed: null, ranges_Folded: [], range_Peeked: null, items_Drafted: [], focus_Draft: null, visit_Item: null, selection, isSelecting: false, x_Goal: null, isRevealing_Caret: false, isFocusing_Input: false, menu: null, request: null, focus_Asking: null, confirm_Item: null }
}

// the state after each command in turn, as the viewer works it out
function after(
  state: _State__Viewer_TextEditor_,
  commands: Array<_Command_TextEditor_>
): _State__Viewer_TextEditor_ {
  return commands.reduce((state_Each, command) => (HANDLERMAP__TEXTEDITOR[command.kind] as (api: { state: _State__Viewer_TextEditor_, command: _Command_TextEditor_, layout_View: _Layout_View_, module_Words: typeof MODULE_WORDS_TEXT, ask_View: () => void, edit_View: () => null }) => _State__Viewer_TextEditor_)({ state: state_Each, command, layout_View, module_Words: MODULE_WORDS_TEXT, ask_View: () => {}, edit_View: () => null }), state)
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
  expect([2, 4, 5].map((offset) => placeIn__Line({ line_Run, line_Run_Next: null, offset, id_Text: null }))).toEqual([
    { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 2 } },
    { id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 0 } },
    { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 7 } },
  ])
  expect(placeIn__Line({ line_Run, line_Run_Next: null, offset: 5, id_Text: { kind: "CHANGE", source: "digit", index: 0 } })).toEqual({ id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 1 } })
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

// the request an edit's command makes of whoever holds the model, or none,
// the viewer asking with what's selected, refusing what crosses texts
function requestedFrom(
  selection: _Selection_TextEditor_,
  command: _Command_TextEditor_
): _Request_Edit_ | null {
  const requests: Array<_Request_Edit_> = []
  ;(HANDLERMAP__TEXTEDITOR[command.kind] as (api: { state: _State__Viewer_TextEditor_, command: _Command_TextEditor_, layout_View: _Layout_View_, module_Words: typeof MODULE_WORDS_TEXT, ask_View: () => void, edit_View: (request_Edit: _Request_Edit_) => null }) => _State__Viewer_TextEditor_)({ state: stateOf(selection), command, layout_View, module_Words: MODULE_WORDS_TEXT, ask_View: () => {}, edit_View: (request_Edit) => {
    requests.push(request_Edit)
    return null
  } })
  return requests[0] ?? null
}

// a request as text: its kind, and for text, which, where, and what it puts in
function saidOfRequest(
  request_Edit: _Request_Edit_ | null
): string {
  if (request_Edit === null) return "none"
  if (request_Edit.kind === "ACROSS") return `across ${request_Edit.pieces.map((piece) => `${piece.id_Text.kind === "DOCUMENT" ? "document" : `${piece.id_Text.source}#${piece.id_Text.index}`} ${piece.range.from.line}:${piece.range.from.offset}-${piece.range.to.line}:${piece.range.to.offset}`).join(" + ")} ${JSON.stringify(request_Edit.multilineText)}${request_Edit.isTyping ? " typed" : ""}`
  if (request_Edit.kind !== "TEXT") return request_Edit.kind
  const text = request_Edit.id_Text.kind === "DOCUMENT" ? "document" : `${request_Edit.id_Text.source}#${request_Edit.id_Text.index}`
  return `${text} ${request_Edit.range.from.line}:${request_Edit.range.from.offset}-${request_Edit.range.to.line}:${request_Edit.range.to.offset} ${JSON.stringify(request_Edit.multilineText)}${request_Edit.isTyping ? " typed" : ""}${request_Edit.isProposed ? " proposed" : ""}`
}

const caretIn_Digit = (offset: number): _Selection_TextEditor_ => {
  const end_Selection: _End_Selection_ = { id_Run: "frame-1-proposed", id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset } }
  return { anchor: end_Selection, head: end_Selection }
}

test("typing puts its text in at the caret, in the text the caret's in, a proposal's own words too, as typed", () => {
  expect(saidOfRequest(requestedFrom(caretIn_Digit(1), { kind: "INSERT", text: "x", isTyping: true }))).toBe('digit#0 0:1-0:1 "x" typed proposed')
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 3, 4), { kind: "INSERT", text: "\n", isTyping: false }))).toBe('document 3:4-3:4 "\\n"')
})

test("deleting takes out what's drawn next to the caret, in the text that's from: a proposal's own words, as proposed; a line break where a line starts; nothing across a section's edge", () => {
  expect(saidOfRequest(requestedFrom(caretIn_Digit(1), { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe('digit#0 0:0-0:1 "" proposed')
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 3, 7), { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe('document 3:5-3:7 ""')
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 2, 0), { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe('document 1:4-2:0 ""')
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 1, 0), { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe("none")
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 3, 11), { kind: "DELETE", by: "WORD", direction: "BACKWARD" }))).toBe('document 3:8-3:11 ""')
})

test("what's typed over a selection replaces it, and deleting takes it out, where it's all one text, running on, over lines too; a selection with another text's words inside it, a proposal's, is asked across them, each text's piece of it in turn", () => {
  const over_Lines: _Selection_TextEditor_ = { anchor: caretOf("lines-2", 1, 2).anchor, head: caretOf("lines-2", 3, 3).head }
  expect(saidOfRequest(requestedFrom(over_Lines, { kind: "INSERT", text: "x", isTyping: true }))).toBe('document 1:2-3:3 "x" typed')
  expect(saidOfRequest(requestedFrom(over_Lines, { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe('document 1:2-3:3 ""')
  const over_Digit: _Selection_TextEditor_ = { anchor: caretOf("frame-1-proposed", 0, 2).anchor, head: caretOf("frame-1-proposed", 0, 9).head }
  expect(saidOfRequest(requestedFrom(over_Digit, { kind: "INSERT", text: "x", isTyping: true }))).toBe('across document 0:2-0:4 + digit#0 0:0-0:1 + document 0:7-0:9 "x" typed')
  expect(saidOfRequest(requestedFrom(over_Digit, { kind: "CUT" }))).toBe('across document 0:2-0:4 + digit#0 0:0-0:1 + document 0:7-0:9 ""')
})

test("undo and redo are asked of whoever holds the model, as they are", () => {
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 1, 0), { kind: "UNDO" }))).toBe("UNDO")
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 1, 0), { kind: "REDO" }))).toBe("REDO")
})

test("a selection all in one text, but not running on in it, as across a move's words and the words they've come before, is asked across them, each stretch that runs on a piece of its own", () => {
  const result_Move = parseModel_TextEditor({ multilineText: "alpha beta", marks: [], proposed: [{ source: "swap", changes: [{ kind: "MOVE", range: { from: { line: 0, offset: 6 }, to: { line: 0, offset: 10 } }, at: { line: 0, offset: 0 } }] }] })
  if (result_Move.kind === "REFUSED") throw new Error("refused")
  const viewModel_Move = viewModelOf__Model({
    model_TextEditor: result_Move.model_TextEditor,
    proposals: [{ source: "swap", title: "Beta first", state: "OPEN", status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} }],
    requests_Document: [],
    rounds_Landed: [],
    task_Header: null,
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const line_Run = viewModel_Move.runs.find((run_Lines) => run_Lines.id === "frame-1-proposed")?.lines[0]
  expect(line_Run === undefined ? "" : textOf__Line(line_Run)).toBe("betaalpha ")
  const requests: Array<_Request_Edit_> = []
  HANDLERMAP__TEXTEDITOR.INSERT({ state: { ...stateOf({ anchor: { id_Run: "frame-1-proposed", id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 8 } }, head: { id_Run: "frame-1-proposed", id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 2 } } }), viewModel_TextEditor: viewModel_Move }, command: { kind: "INSERT", text: "x", isTyping: true }, layout_View, module_Words: MODULE_WORDS_TEXT, ask_View: () => {}, edit_View: (request_Edit) => {
    requests.push(request_Edit)
    return null
  } })
  expect(requests.map(saidOfRequest)).toEqual(['across document 0:8-0:10 + document 0:0-0:2 "x" typed'])
})

test("each section edits its own: the document's lines, the document's text; a frame's lines as proposed, all of them, asked as made among what's proposed, so the document's words round a proposal's are made changes of yours, never the document's, and the lines as they are stay as they were; a frame's lines as they are, nothing", () => {
  expect(saidOfRequest(requestedFrom(caretOf("lines-2", 1, 2), { kind: "INSERT", text: "x", isTyping: true }))).toBe('document 1:2-1:2 "x" typed')
  expect(saidOfRequest(requestedFrom(caretIn_Digit(1), { kind: "INSERT", text: "x", isTyping: true }))).toBe('digit#0 0:1-0:1 "x" typed proposed')
  expect(saidOfRequest(requestedFrom(caretOf("frame-1-proposed", 0, 2), { kind: "INSERT", text: "x", isTyping: true }))).toBe('document 0:2-0:2 "x" typed proposed')
  expect(saidOfRequest(requestedFrom(caretIn_Digit(0), { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe('document 0:3-0:4 "" proposed')
  expect(saidOfRequest(requestedFrom(caretOf("frame-1-proposed", 0, 7), { kind: "DELETE", by: "CHARACTER", direction: "FORWARD" }))).toBe('document 0:7-0:8 "" proposed')
  expect(saidOfRequest(requestedFrom(caretOf("frame-1-current", 0, 2), { kind: "INSERT", text: "x", isTyping: true }))).toBe("none")
  expect(saidOfRequest(requestedFrom(caretOf("frame-1-current", 0, 2), { kind: "PASTE", text: "x" }))).toBe("none")
})

// a document of two lines with changes of yours among it, drawn as the
// editor draws them, a frame round each change
function viewModelWith(
  multilineText: string,
  changes: _Changes_Host_["changes"]
) {
  const result_Yours = parseModel_TextEditor({ multilineText, marks: [], proposed: [{ source: "yours", changes }] })
  if (result_Yours.kind === "REFUSED") throw new Error("refused")
  return viewModelOf__Model({
    model_TextEditor: result_Yours.model_TextEditor,
    proposals: [{ source: "yours", title: "Your edits", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }],
    requests_Document: [],
    rounds_Landed: [],
    task_Header: null,
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
}

const yours_Text = { kind: "CHANGE" as const, source: "yours", index: 0 }

test("at a line's end, where nothing on it comes after, a position's in the text whose line break comes next, the one going on at the next line's start", () => {
  const viewModel_Break = viewModelWith("ab\ncd", [{ kind: "REPLACE", range: { from: { line: 0, offset: 1 }, to: { line: 0, offset: 1 } }, multilineText: "\n", marks: [] }])
  const [line_First, line_Second] = viewModel_Break.runs.find((run_Lines) => run_Lines.id === "frame-1-proposed")?.lines ?? []
  if (line_First === undefined || line_Second === undefined) throw new Error("no lines as proposed")
  expect([textOf__Line(line_First), textOf__Line(line_Second)]).toEqual(["a", "b"])
  expect(placeIn__Line({ line_Run: line_First, line_Run_Next: line_Second, offset: 1, id_Text: null })).toEqual({ id_Text: yours_Text, position: { line: 0, offset: 0 } })
  expect(placeIn__Line({ line_Run: line_First, line_Run_Next: null, offset: 1, id_Text: null })).toEqual({ id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 1 } })
})

// the state after commands, over a view model of its own
function afterIn(
  viewModel_TextEditor: ReturnType<typeof viewModelWith>,
  selection: _Selection_TextEditor_,
  commands: Array<_Command_TextEditor_>
): _State__Viewer_TextEditor_ {
  return commands.reduce((state_Each, command) => (HANDLERMAP__TEXTEDITOR[command.kind] as (api: { state: _State__Viewer_TextEditor_, command: _Command_TextEditor_, layout_View: _Layout_View_, module_Words: typeof MODULE_WORDS_TEXT, ask_View: () => void, edit_View: () => null }) => _State__Viewer_TextEditor_)({ state: state_Each, command, layout_View, module_Words: MODULE_WORDS_TEXT, ask_View: () => {}, edit_View: () => null }), { ...stateOf(selection), viewModel_TextEditor })
}

test("a caret's put where it's drawn back: after words of yours put in a blank line, where the blank line's place is drawn before them too, it's at their end, not the line's", () => {
  const viewModel_Blank = viewModelWith("one\n\nthree", [{ kind: "REPLACE", range: { from: { line: 1, offset: 0 }, to: { line: 1, offset: 0 } }, multilineText: "x", marks: [] }])
  const before_X: _End_Selection_ = { id_Run: "frame-2-proposed", id_Text: yours_Text, position: { line: 0, offset: 0 } }
  expect(said(afterIn(viewModel_Blank, { anchor: before_X, head: before_X }, [{ kind: "MOVE", by: "CHARACTER", direction: "FORWARD" }]).selection)).toBe("frame-2-proposed yours#0 0:1")
})

// the request an edit asks, over a view model of its own
function requestedIn(
  viewModel_TextEditor: ReturnType<typeof viewModelWith>,
  selection: _Selection_TextEditor_,
  command: _Command_TextEditor_
): _Request_Edit_ | null {
  const requests: Array<_Request_Edit_> = []
  ;(HANDLERMAP__TEXTEDITOR[command.kind] as (api: { state: _State__Viewer_TextEditor_, command: _Command_TextEditor_, layout_View: _Layout_View_, module_Words: typeof MODULE_WORDS_TEXT, ask_View: () => void, edit_View: (request_Edit: _Request_Edit_) => null }) => _State__Viewer_TextEditor_)({ state: { ...stateOf(selection), viewModel_TextEditor }, command, layout_View, module_Words: MODULE_WORDS_TEXT, ask_View: () => {}, edit_View: (request_Edit) => {
    requests.push(request_Edit)
    return null
  } })
  return requests[0] ?? null
}

test("where words of yours took the document's out, deleting on takes the character before that spot, its range ending where the document's text before it does; typed at the spot, from the document's side, it goes in there", () => {
  const viewModel_Deleted = viewModelWith("abcd efg\nh", [{ kind: "REPLACE", range: { from: { line: 0, offset: 3 }, to: { line: 0, offset: 4 } }, multilineText: "", marks: [] }])
  const line_Run = viewModel_Deleted.runs.find((run_Lines) => run_Lines.id === "frame-1-proposed")?.lines[0]
  expect(line_Run === undefined ? "" : textOf__Line(line_Run)).toBe("abc efg")
  const in_Deletion: _End_Selection_ = { id_Run: "frame-1-proposed", id_Text: yours_Text, position: { line: 0, offset: 0 } }
  expect(saidOfRequest(requestedIn(viewModel_Deleted, { anchor: in_Deletion, head: in_Deletion }, { kind: "DELETE", by: "CHARACTER", direction: "BACKWARD" }))).toBe('document 0:2-0:3 "" proposed')
  const after_Deletion: _End_Selection_ = { id_Run: "frame-1-proposed", id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 4 } }
  expect(saidOfRequest(requestedIn(viewModel_Deleted, { anchor: after_Deletion, head: after_Deletion }, { kind: "INSERT", text: "x", isTyping: true }))).toBe('document 0:4-0:4 "x" typed proposed')
})

test("typed at a caret where two texts meet, the request says what's drawn either side of it, for the editor to say whose word it joins; inside one text, nothing", () => {
  const between = requestedFrom(caretIn_Digit(1), { kind: "INSERT", text: "x", isTyping: true })
  expect(between?.kind === "TEXT" ? between.places_Caret : "none").toEqual({ place_Before: { id_Text: { kind: "CHANGE", source: "digit", index: 0 }, position: { line: 0, offset: 1 } }, place_After: { id_Text: { kind: "DOCUMENT" }, position: { line: 0, offset: 7 } } })
  const inside = requestedFrom(caretOf("frame-1-proposed", 0, 2), { kind: "INSERT", text: "x", isTyping: true })
  expect(inside?.kind === "TEXT" ? inside.places_Caret : "none").toBe(null)
})

test("a word step goes by the words the host's module says: as text, to the next word's end; with a line one word, to its end", () => {
  const caret = caretOf("lines-2", 3, 0)
  const steppedWith = (module_Words: typeof MODULE_WORDS_TEXT) => said((HANDLERMAP__TEXTEDITOR.MOVE as (api: unknown) => _State__Viewer_TextEditor_)({ state: stateOf(caret), command: { kind: "MOVE", by: "WORD", direction: "FORWARD" }, layout_View, module_Words, ask_View: () => {}, edit_View: () => null }).selection)
  expect(steppedWith(MODULE_WORDS_TEXT)).toBe("lines-2 document 3:4")
  expect(steppedWith({ wordsOf: (text) => text === "" ? [] : [{ from: 0, to: text.length }] })).toBe("lines-2 document 3:11")
})

test("a folded frame's lines, its lines as proposed, are edited as they are unfolded: typed into, among what's proposed, its words and the proposal's", () => {
  const range_Frame = viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? [block.range] : [])[0]
  if (range_Frame === undefined) throw new Error("no frame")
  const requestedFolded = (selection: _Selection_TextEditor_) => {
    const requests: Array<_Request_Edit_> = []
    HANDLERMAP__TEXTEDITOR.INSERT({ state: { ...stateOf(selection), ranges_Folded: [range_Frame] }, command: { kind: "INSERT", text: "x", isTyping: true }, layout_View, module_Words: MODULE_WORDS_TEXT, ask_View: () => {}, edit_View: (request_Edit) => {
      requests.push(request_Edit)
      return null
    } })
    return requests[0] ?? null
  }
  expect(saidOfRequest(requestedFolded(caretOf("frame-1-proposed", 0, 2)))).toBe('document 0:2-0:2 "x" typed proposed')
  expect(saidOfRequest(requestedFolded(caretIn_Digit(1)))).toBe('digit#0 0:1-0:1 "x" typed proposed')
})

test("a proposal's action pressed is asked of the host, its command, the viewer deciding nothing; a revision's notes sent, the same, its notes with it, and its draft closed", () => {
  const id_Item = { source: "digit", range_Frame: { first: 1, last: 1 } }
  const asked: Array<unknown> = []
  const ask_View = (asked_Action: unknown) => {
    asked.push(asked_Action)
  }
  const state = stateOf(null)
  const acted = HANDLERMAP__TEXTEDITOR.ACT({ state, command: { kind: "ACT", id_Item, command: "accept" }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(acted).toBe(state)
  const drafting = { ...state, items_Drafted: [id_Item] }
  const sent = HANDLERMAP__TEXTEDITOR.SEND({ state: drafting, command: { kind: "SEND", id_Item, command: "revise", notes: "Say what it's for." , isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(sent.items_Drafted).toEqual([])
  expect(asked).toEqual([{ kind: "ACTION", source: "digit", command: "accept", notes: null, selected: null }, { kind: "ACTION", source: "digit", command: "revise", notes: "Say what it's for.", selected: null }])
})

test("a right-click's menu offers what can be asked there: on a proposal's words, a note on them, or on the whole proposal; on the document's words, a request for a change aimed at them; with nothing selected, one for the document; a choice opens a form, what it's aimed at quoted, and what's written there's asked of the host, with where it was aimed, never an empty one", () => {
  const menuOf = (selection: _Selection_TextEditor_) => HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: stateOf(selection), command: { kind: "OPEN_MENU", point_Screen: { x: 40, y: 40 } }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View: () => {} })
  const digit_Text = { kind: "CHANGE" as const, source: "digit", index: 0 }
  const over_Digit: _Selection_TextEditor_ = { anchor: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 0 } }, head: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 1 } } }
  const over_One: _Selection_TextEditor_ = { anchor: caretOf("frame-1-proposed", 0, 0).anchor, head: caretOf("frame-1-proposed", 0, 3).head }
  expect(menuOf(over_Digit).menu?.items.map((item) => `${item.label} | ${item.quote}`)).toEqual(["Note on these words of “Write two as a digit” | 2", "Note on “Write two as a digit” | null"])
  expect(menuOf(over_One).menu?.items.map((item) => `${item.label} | ${item.quote}`)).toEqual(["Request a change | one"])
  expect(menuOf(caretOf("lines-2", 1, 2)).menu?.items.map((item) => `${item.label} | ${item.quote}`)).toEqual(["Request a change to this document | null"])
  const asked: Array<unknown> = []
  const ask_View = (asked_Host: unknown) => {
    asked.push(asked_Host)
  }
  const chosen = HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state: menuOf(over_Digit), command: { kind: "CHOOSE_MENU", index: 0 }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(chosen.menu).toBe(null)
  expect(chosen.request).toMatchObject({ point_Screen: { x: 40, y: 40 }, label: "Note on these words of “Write two as a digit”", quote: "2" })
  const unsent = HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: chosen, command: { kind: "SEND_REQUEST", notes: "  ", isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(unsent).toBe(chosen)
  const sent = HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: chosen, command: { kind: "SEND_REQUEST", notes: "Spell it out.", isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(sent.request).toBe(null)
  const requested = HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state: menuOf(over_One), command: { kind: "CHOOSE_MENU", index: 0 }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View }), command: { kind: "SEND_REQUEST", notes: "Say which one.", isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(requested.request).toBe(null)
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "revise", notes: "Spell it out.", selected: { pieces: [{ id_Text: digit_Text, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }], text: "2" } },
    { kind: "REQUEST", selected: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }], text: "one" }, notes: "Say which one.", isStarting: false }
  ])
})

test("revisions queued: a revision's notes added, asked of the host, its draft closed; with Start, its proposal's queued requests started after them, and with nothing written, Start alone; with nothing written, not now, nothing; from the menu's form, a note on a proposal queued the same, and a request for a change, on what's selected or the document, queued the same, the document's own, Start asked with it, as the host starts it at once", () => {
  const id_Item = { source: "digit", range_Frame: { first: 1, last: 1 } }
  const asked: Array<unknown> = []
  const ask_View = (asked_Host: unknown) => {
    asked.push(asked_Host)
  }
  const drafting = { ...stateOf(null), items_Drafted: [id_Item] }
  const sent = (notes: string, isStarting: boolean) => HANDLERMAP__TEXTEDITOR.SEND({ state: drafting, command: { kind: "SEND", id_Item, command: "revise", notes, isStarting }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(sent("  ", false)).toBe(drafting)
  expect(sent("Say it.", true).items_Drafted).toEqual([])
  expect(sent("", true).items_Drafted).toEqual([])
  expect(asked).toEqual([{ kind: "ACTION", source: "digit", command: "revise", notes: "Say it.", selected: null }, { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } }, { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } }])
  asked.length = 0
  const digit_Text = { kind: "CHANGE" as const, source: "digit", index: 0 }
  const over_Digit: _Selection_TextEditor_ = { anchor: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 0 } }, head: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 1 } } }
  const over_One: _Selection_TextEditor_ = { anchor: caretOf("frame-1-proposed", 0, 0).anchor, head: caretOf("frame-1-proposed", 0, 3).head }
  const formOf = (selection: _Selection_TextEditor_) => HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state: HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: stateOf(selection), command: { kind: "OPEN_MENU", point_Screen: { x: 40, y: 40 } }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View }), command: { kind: "CHOOSE_MENU", index: 0 }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect([formOf(over_Digit).request?.isStartable, formOf(over_One).request?.isStartable]).toEqual([true, true])
  const startedFrom = (selection: _Selection_TextEditor_, notes: string) => HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: formOf(selection), command: { kind: "SEND_REQUEST", notes, isStarting: true }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(startedFrom(over_Digit, "Spell it out.").request).toBe(null)
  expect(startedFrom(over_Digit, "").request).toBe(null)
  expect(startedFrom(over_One, "").request).not.toBe(null)
  expect(startedFrom(over_One, "Say which one.").request).toBe(null)
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "revise", notes: "Spell it out.", selected: { pieces: [{ id_Text: digit_Text, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }], text: "2" } },
    { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } },
    { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } },
    { kind: "REQUEST", selected: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }], text: "one" }, notes: "Say which one.", isStarting: true }
  ])
})

test("an action that would drop revisions queued is asked first: pressed, nothing asked of the host, the item asking in its place, which action and how many it'd drop, the keyboard on Cancel; confirmed, asked; cancelled, nothing; one with nothing queued asked at once; a queued request removed, asked of the host by its id; Start, on one request, a proposal's or the document's, from the header, asked with that scope; a host's task action, from the header, asked as it is; Run again, on a round that landed after your edits, asked for its proposal; the document's own requests removed and started, on no proposal; Request a change, from the header, a form for the whole document; and one being revised, accepted, asks to stop its revision, dropping what's asked of it", () => {
  const id_Item = { source: "digit", range_Frame: { first: 1, last: 1 } }
  const viewModel_Queued = viewModelOf__Model({
    model_TextEditor: result.model_TextEditor,
    proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [{ id: "say", notes: "Say it.", selected: null, status: "QUEUED" }, { id: "spell", notes: "Spell it.", selected: null, status: "QUEUED" }], actions: actions_Review, attributes: {} }],
    requests_Document: [],
    rounds_Landed: [],
    task_Header: null,
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const asked: Array<unknown> = []
  const ask_View = (asked_Host: unknown) => {
    asked.push(asked_Host)
  }
  const state_Queued = { ...stateOf(null), viewModel_TextEditor: viewModel_Queued }
  const handled = <Kind extends _Command_TextEditor_["kind"]>(state: _State__Viewer_TextEditor_, command: Extract<_Command_TextEditor_, { kind: Kind }>) => (HANDLERMAP__TEXTEDITOR[command.kind] as (api: unknown) => _State__Viewer_TextEditor_)({ state, command, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  const acted = handled(state_Queued, { kind: "ACT", id_Item, command: "accept" })
  expect(asked).toEqual([])
  expect([acted.confirm_Item, acted.focus_Asking]).toEqual([{ id_Item, command: "accept" }, "CONFIRM"])
  const item_Confirming = confirmingAt__ViewModel({ viewModel_TextEditor: viewModel_Queued, confirm_Item: acted.confirm_Item }).blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : []).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items : [])[0]
  expect(item_Confirming?.confirming).toEqual({ command: "accept", label_Question: "Accept and drop 2 queued requests?", label_Action: "Accept" })
  expect(handled(acted, { kind: "CONFIRM", isConfirmed: false }).confirm_Item).toBe(null)
  expect(asked).toEqual([])
  expect(handled(acted, { kind: "CONFIRM", isConfirmed: true }).confirm_Item).toBe(null)
  expect(handled(stateOf(null), { kind: "ACT", id_Item, command: "reject" }).confirm_Item).toBe(null)
  expect(handled(state_Queued, { kind: "REMOVE", source: "digit", id: "spell" })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "START", scope: { kind: "REQUEST", source: "digit", id: "say" } })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "START", scope: { kind: "DOCUMENT" } })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "TASK", command: "stop" })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "RERUN", id_Item })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "REMOVE", source: null, id: "all" })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "START", scope: { kind: "REQUEST", source: null, id: "all" } })).toBe(state_Queued)
  const opened = handled(state_Queued, { kind: "OPEN_REQUEST", point_Screen: { x: 900, y: 40 } })
  expect([opened.menu, opened.request, opened.focus_Asking]).toEqual([null, { point_Screen: { x: 900, y: 40 }, label: "Request a change to this document", quote: null, isStartable: true, target: { kind: "DOCUMENT" } }, "REQUEST"])
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "accept", notes: null, selected: null },
    { kind: "ACTION", source: "digit", command: "reject", notes: null, selected: null },
    { kind: "REMOVE", source: "digit", id: "spell" },
    { kind: "START", scope: { kind: "REQUEST", source: "digit", id: "say" } },
    { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } },
    { kind: "START", scope: { kind: "DOCUMENT" } },
    { kind: "TASK", command: "stop" },
    { kind: "RERUN", source: "digit" },
    { kind: "REMOVE", source: null, id: "all" },
    { kind: "START", scope: { kind: "REQUEST", source: null, id: "all" } }
  ])
  const viewModel_Running = viewModelOf__Model({
    model_TextEditor: result.model_TextEditor,
    proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [{ id: "say", notes: "Say it.", selected: null, status: "RUNNING" }, { id: "spell", notes: "Spell it.", selected: null, status: "QUEUED" }], actions: actions_Review, attributes: {} }],
    requests_Document: [],
    rounds_Landed: [],
    task_Header: null,
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const acted_Running = handled({ ...stateOf(null), viewModel_TextEditor: viewModel_Running }, { kind: "ACT", id_Item, command: "accept" })
  const item_Running = confirmingAt__ViewModel({ viewModel_TextEditor: viewModel_Running, confirm_Item: acted_Running.confirm_Item }).blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : []).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items : [])[0]
  expect(item_Running?.confirming?.label_Question).toBe("Accept and stop its revision, dropping 2 requests?")
})
