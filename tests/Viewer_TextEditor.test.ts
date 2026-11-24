import { expect, test } from "bun:test"
import { parseModel_TextEditor, type _Changes_Host_ } from "../source/editor/Model_TextEditor.ts"
import { viewModelOf__Model } from "../source/editor/Projection_TextEditor.ts"
import { MODULE_READING_TEXT } from "../source/editor/readings/text.ts"
import { MODULE_PLAINTEXT, confirmingAt__ViewModel, editingAt__ViewModel, askingAt__ViewModel, wordsAt__ViewModel, headOf__Quote, sizeOf__Quote, peekOf__Quote, placeIn__Line, positionIn__Run, textOf__Line, type _Selection_TextEditor_, type _End_Selection_, type _Piece_Text_ } from "../source/editor/ViewModel_TextEditor.ts"
import { HANDLERMAP__TEXTEDITOR, type _State__Viewer_TextEditor_, type _Command_TextEditor_ } from "../source/editor/Viewer_TextEditor.ts"
import type { _Request_Edit_ } from "../source/editor/Editing_TextEditor.ts"
import type { _Layout_View_ } from "../source/editor/View_TextEditor.tsx"
import { actions_Review } from "../playground/items.ts"
import { MODULE_WORDS_TEXT } from "../source/editor/words/text.ts"

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
  name_Document: "notes/digits.txt",
  proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} }],
  rounds_Landed: [],
  mode: { kind: "MANUAL" },
  tasks: [],
  files: [],
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
  isMoved: () => false,
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
  return { viewModel_TextEditor: viewModel, source_Pointed: null, place_Pointed: null, target_Pointed: null, target_Revealed: null, ranges_Folded: [], range_Peeked: null, items_Drafted: [], focus_Draft: null, visit_Item: null, selection, isSelecting: false, x_Goal: null, isRevealing_Caret: false, isFocusing_Input: false, menu: null, request: null, focus_Asking: null, confirm_Item: null, editing_Request: null, focus_Edited: null, words_Pointed: null, words_Shown: null, isRevealing_Words: false }
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
    name_Document: "notes/digits.txt",
    proposals: [{ source: "swap", title: "Beta first", state: "OPEN", status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} }],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
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
    name_Document: "notes/digits.txt",
    proposals: [{ source: "yours", title: "Your edits", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
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

test("a frame's Accept all asks the host for each open proposal it lists, its own action to Accepted, as if each were pressed; one with requests waiting left to be decided by itself; nothing for another frame", () => {
  const range_Frame = viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? [block.range] : [])[0]
  if (range_Frame === undefined) throw new Error("no frame")
  const accepted = (range: typeof range_Frame) => {
    const asked: Array<unknown> = []
    const state = stateOf(null)
    const state_After = HANDLERMAP__TEXTEDITOR.ACCEPT_ALL({ state, command: { kind: "ACCEPT_ALL", range }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View: (asked_Host) => {
      asked.push(asked_Host)
    } })
    return { isSame: state_After === state, asked }
  }
  const items = viewModel.blocks.flatMap((block) => block.kind === "FRAME" && block.range.first === range_Frame.first ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items : []) : [])
  const opens = items.filter((item) => item.state === "OPEN").map((item) => item.source)
  expect(opens.length).toBeGreaterThan(0)
  expect(accepted(range_Frame)).toEqual({ isSame: true, asked: opens.map((source) => ({ kind: "ACTION", source, command: "accept", notes: null, reference: null })) })
  expect(accepted({ first: 900, last: 901 }).asked).toEqual([])
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
  expect(asked).toEqual([{ kind: "ACTION", source: "digit", command: "accept", notes: null, reference: null }, { kind: "ACTION", source: "digit", command: "revise", notes: "Say what it's for.", reference: null }])
})

test("a right-click's menu offers what can be asked there, in tiers, the narrowest first: on a proposal's words, the proposal's tier, its own actions, then a revision of it with the words, then the document's, a change to it with them; on the document's words, the document's tier alone, with them; with nothing selected, the document's tier alone, with nothing; a request chosen opens a form, the words quoted, and what's written there's asked of the host with them, never an empty one; sent, the selection let go, the caret where it was; put away, the selection kept", () => {
  const menuOf = (selection: _Selection_TextEditor_) => HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: stateOf(selection), command: { kind: "OPEN_MENU", point_Screen: { x: 40, y: 40 } }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View: () => {} })
  const digit_Text = { kind: "CHANGE" as const, source: "digit", index: 0 }
  const over_Digit: _Selection_TextEditor_ = { anchor: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 0 } }, head: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 1 } } }
  const over_One: _Selection_TextEditor_ = { anchor: caretOf("frame-1-proposed", 0, 0).anchor, head: caretOf("frame-1-proposed", 0, 3).head }
  expect(choicesOf(menuOf(over_Digit))).toEqual([
    "PROPOSAL PROPOSALS Proposal: Accept",
    "PROPOSAL PROPOSALS Proposal: Reject",
    "PROPOSAL REVISIONS Proposal: Request revision, with selection | 2",
    "DOCUMENT REVISIONS File: Request change, with selection | 2"
  ])
  expect(choicesOf(menuOf(over_One))).toEqual([
    "DOCUMENT REVISIONS File: Request change, with selection | one"
  ])
  expect(choicesOf(menuOf(caretOf("lines-2", 1, 2)))).toEqual(["DOCUMENT REVISIONS File: Request change"])
  const asked: Array<unknown> = []
  const ask_View = (asked_Host: unknown) => {
    asked.push(asked_Host)
  }
  const chosen = HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state: menuOf(over_Digit), command: { kind: "CHOOSE_MENU", index: 2 }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(chosen.menu).toBe(null)
  expect(chosen.request).toMatchObject({ place: { kind: "POINT", point_Screen: { x: 40, y: 40 } }, label: "Request a revision of “Write two as a digit”", quote: { text: "2" } })
  const unsent = HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: chosen, command: { kind: "SEND_REQUEST", notes: "  ", isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(unsent).toBe(chosen)
  const sent = HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: chosen, command: { kind: "SEND_REQUEST", notes: "Spell it out.", isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(sent.request).toBe(null)
  expect(sent.selection).toEqual({ anchor: over_Digit.head, head: over_Digit.head })
  expect(HANDLERMAP__TEXTEDITOR.CLOSE_REQUEST({ state: chosen, command: { kind: "CLOSE_REQUEST" }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View }).selection).toBe(chosen.selection)
  const requested = HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state: menuOf(over_One), command: { kind: "CHOOSE_MENU", index: 0 }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View }), command: { kind: "SEND_REQUEST", notes: "Say which one.", isStarting: false }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(requested.request).toBe(null)
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "revise", notes: "Spell it out.", reference: { pieces: [{ id_Text: digit_Text, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }], text: "2", side: "PROPOSED" } },
    { kind: "REQUEST", aim: { kind: "DOCUMENT", reference: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }], text: "one", side: "PROPOSED" } }, notes: "Say which one.", isStarting: false }
  ])
})

// each choice in a menu, as a line: its tier, its section, its label, which names it, and, for a
// request, the words it goes with
function choicesOf(
  state: _State__Viewer_TextEditor_
): Array<string> | undefined {
  return state.menu?.items.map((item) => {
    const quote = item.kind === "REQUEST" && item.quote !== null
      ? ` | ${item.quote.text}`
      : ""
    return `${item.tier} ${item.section} ${item.label_Tier}: ${item.label}${quote}`
  })
}

test("a right-click on a proposal, nothing selected, offers its tier and the document's, each its proposal actions first, then its revisions', the keyboard on the first request; words sent for reference reach the host with what they're on, the proposal or the document, not aimed at, unless left out; a proposal's action or a scope's Start chosen is asked as its button's is, the menu closed", () => {
  const asked: Array<unknown> = []
  const ask_View = (asked_Host: unknown) => {
    asked.push(asked_Host)
  }
  const layout_Pointed: _Layout_View_ = { ...layout_View, sourceAt: () => "digit" }
  const handlerOf = (layout: _Layout_View_) => ({ layout_View: layout, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  const menuAt = (selection: _Selection_TextEditor_, layout: _Layout_View_) => HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: stateOf(selection), command: { kind: "OPEN_MENU", point_Screen: { x: 40, y: 40 } }, ...handlerOf(layout) })
  const choose = (state: _State__Viewer_TextEditor_, index: number) => HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state, command: { kind: "CHOOSE_MENU", index }, ...handlerOf(layout_View) })
  const send = (state: _State__Viewer_TextEditor_, notes: string) => HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state, command: { kind: "SEND_REQUEST", notes, isStarting: false }, ...handlerOf(layout_View) })
  expect(choicesOf(menuAt(caretOf("lines-2", 1, 2), layout_Pointed))).toEqual([
    "PROPOSAL PROPOSALS Proposal: Accept",
    "PROPOSAL PROPOSALS Proposal: Reject",
    "PROPOSAL REVISIONS Proposal: Request revision",
    "DOCUMENT REVISIONS File: Request change"
  ])
  expect(menuAt(caretOf("lines-2", 1, 2), layout_Pointed).menu?.index_Focused).toBe(2)
  const opened_Keyboard = HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: stateOf(caretOf("lines-2", 1, 2)), command: { kind: "OPEN_MENU", point_Screen: null }, ...handlerOf(layout_View) })
  const stepped = HANDLERMAP__TEXTEDITOR.STEP_MENU({ state: menuAt(caretOf("lines-2", 1, 2), layout_Pointed), command: { kind: "STEP_MENU", direction: "FORWARD" }, ...handlerOf(layout_View) })
  expect([menuAt(caretOf("lines-2", 1, 2), layout_Pointed).menu?.isFocusShown, opened_Keyboard.menu?.isFocusShown, stepped.menu?.isFocusShown, stepped.menu?.index_Focused]).toEqual([false, true, true, 3])
  const digit_Text = { kind: "CHANGE" as const, source: "digit", index: 0 }
  const over_Digit: _Selection_TextEditor_ = { anchor: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 0 } }, head: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 1 } } }
  const selected_Digit = { pieces: [{ id_Text: digit_Text, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }], text: "2", side: "PROPOSED" as const }
  const referring = choose(menuAt(over_Digit, layout_View), 2)
  expect(referring.request).toMatchObject({ label: "Request a revision of “Write two as a digit”", head: { label_Tier: "Proposal", subject: "Write two as a digit" }, quote: { text: "2" }, target: { kind: "PROPOSAL", reference: selected_Digit } })
  const dropped = HANDLERMAP__TEXTEDITOR.DROP_QUOTE({ state: referring, command: { kind: "DROP_QUOTE" }, ...handlerOf(layout_View) })
  expect(dropped.request).toMatchObject({ label: "Request a revision of “Write two as a digit”", quote: null, target: { kind: "PROPOSAL", reference: null } })
  expect(dropped.focus_Asking).toBe("REQUEST")
  const marked = askingAt__ViewModel({ viewModel_TextEditor: viewModel, menu: null, request: referring.request })
  expect(marked.runs.flatMap((run_Lines) => run_Lines.lines.flatMap((line_Run) => line_Run.segments.filter((segment_Line) => "data-quoted" in segment_Line.attributes).map((segment_Line) => `${run_Lines.id} ${segment_Line.text}`)))).toEqual(["frame-1-proposed 2"])
  expect(askingAt__ViewModel({ viewModel_TextEditor: viewModel, menu: null, request: dropped.request }).runs).toBe(viewModel.runs)
  const over_One_Current: _Selection_TextEditor_ = { anchor: caretOf("frame-1-current", 0, 0).anchor, head: caretOf("frame-1-current", 0, 3).head }
  const chosen_Current = choose(menuAt(over_One_Current, layout_View), 0)
  expect(askingAt__ViewModel({ viewModel_TextEditor: viewModel, menu: null, request: chosen_Current.request }).runs.flatMap((run_Lines) => run_Lines.lines.flatMap((line_Run) => line_Run.segments.filter((segment_Line) => "data-quoted" in segment_Line.attributes).map((segment_Line) => `${run_Lines.id} ${segment_Line.text}`)))).toEqual(["frame-1-current one"])
  const returned = HANDLERMAP__TEXTEDITOR.FOCUS_REQUEST({ state: { ...referring, focus_Asking: null }, command: { kind: "FOCUS_REQUEST" }, ...handlerOf(layout_View) })
  expect([returned.request, returned.focus_Asking]).toEqual([referring.request, "REQUEST"])
  expect(HANDLERMAP__TEXTEDITOR.FOCUS_REQUEST({ state: stateOf(null), command: { kind: "FOCUS_REQUEST" }, ...handlerOf(layout_View) })).toEqual(stateOf(null))
  expect(HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: referring, command: { kind: "OPEN_MENU", point_Screen: { x: 40, y: 40 } }, ...handlerOf(layout_View) }).request).toBe(null)
  const layout_Moved: _Layout_View_ = { ...layout_View, isMoved: () => true }
  const scrolled = (state: _State__Viewer_TextEditor_, layout: _Layout_View_, isWritten_Form: boolean) => HANDLERMAP__TEXTEDITOR.SCROLL({ state, command: { kind: "SCROLL", isWritten_Form }, ...handlerOf(layout) })
  const menu_Open = menuAt(caretOf("lines-2", 1, 2), layout_Pointed)
  expect(scrolled(menu_Open, layout_View, false)).toBe(menu_Open)
  expect(scrolled(menu_Open, layout_Moved, false).menu).toBe(null)
  expect(scrolled(referring, layout_View, false)).toBe(referring)
  expect(scrolled(referring, layout_Moved, true)).toBe(referring)
  expect(scrolled(referring, layout_Moved, false).request).toBe(null)
  send(referring, "Keep it as a word here.")
  send(dropped, "Spell it out.")
  send(choose(menuAt(over_Digit, layout_View), 3), "Use digits throughout.")
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "revise", notes: "Keep it as a word here.", reference: selected_Digit },
    { kind: "ACTION", source: "digit", command: "revise", notes: "Spell it out.", reference: null },
    { kind: "REQUEST", aim: { kind: "DOCUMENT", reference: selected_Digit }, notes: "Use digits throughout.", isStarting: false }
  ])
  asked.length = 0
  const accepted = choose(menuAt(over_Digit, layout_View), 0)
  expect([accepted.menu, accepted.request]).toEqual([null, null])
  expect(asked).toEqual([{ kind: "ACTION", source: "digit", command: "accept", notes: null, reference: null }])
})

test("a listed request's words pointed at, by the pointer or the keyboard, lit where they are while it waits or is under way: only on the side they were selected on, as they are or as proposed, where they're underlined, not in a frame's other showing of the same words; once it's done with, not lit, what's there since perhaps not what was sent; pointed away from, nothing lit; pointed at again, nothing new; its lines pressed, the words shown, the document to scroll to them and the keyboard back on the text, and, a moment after, let go", () => {
  const digit_Text = { kind: "CHANGE" as const, source: "digit", index: 0 }
  const reference_Digit = { pieces: [{ id_Text: digit_Text, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }] as [_Piece_Text_, ...Array<_Piece_Text_>], text: "2", side: "PROPOSED" as const }
  const reference_One = { pieces: [{ id_Text: { kind: "DOCUMENT" as const }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }] as [_Piece_Text_, ...Array<_Piece_Text_>], text: "one", side: "CURRENT" as const }
  const reference_Four = { pieces: [{ id_Text: { kind: "DOCUMENT" as const }, range: { from: { line: 1, offset: 0 }, to: { line: 1, offset: 4 } } }] as [_Piece_Text_, ...Array<_Piece_Text_>], text: "four", side: "CURRENT" as const }
  const viewModel_Referring = viewModelOf__Model({
    model_TextEditor: result.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [{ id: "spell", notes: "Spell it.", reference: reference_Digit, status: "QUEUED" }], actions: actions_Review, attributes: {} }],
    rounds_Landed: [],
    mode: { kind: "TASK", task: { id: "T-3", name: "Tidy", state: "WORKING", summary: "", requests: [{ id: "count", notes: "Count them.", aim: { kind: "DOCUMENT", reference: reference_One }, status: "QUEUED", sources_Answering: [] }, { id: "done", notes: "Say it.", aim: { kind: "DOCUMENT", reference: reference_Four }, status: "ADDRESSED", sources_Answering: [] }], reason: "", documents: [], summary_Document: "", actions: [], actions_Document: [] } },
    tasks: [],
    files: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const state_Referring = { ...stateOf(null), viewModel_TextEditor: viewModel_Referring }
  const pointedAt = (state: _State__Viewer_TextEditor_, id_Request: { id_Item: { source: string, range_Frame: { first: number, last: number } } | null, id: string } | null) => HANDLERMAP__TEXTEDITOR.POINT_WORDS({ state, command: { kind: "POINT_WORDS", id_Request }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View: () => {} })
  const litIn = (state: _State__Viewer_TextEditor_) => wordsAt__ViewModel({ viewModel_TextEditor: state.viewModel_TextEditor, id_Request: state.words_Pointed, attributes: { "data-lit": "" } }).runs.flatMap((run_Lines) => run_Lines.lines.flatMap((line_Run) => line_Run.segments.filter((segment_Line) => "data-lit" in segment_Line.attributes).map((segment_Line) => `${run_Lines.id} ${segment_Line.text}`)))
  const id_Item = { source: "digit", range_Frame: { first: 1, last: 1 } }
  const pointed_Spell = pointedAt(state_Referring, { id_Item, id: "spell" })
  expect(litIn(pointed_Spell)).toEqual(["frame-1-proposed 2"])
  expect(litIn(pointedAt(state_Referring, { id_Item: null, id: "count" }))).toEqual(["frame-1-current one"])
  expect(litIn(pointedAt(state_Referring, { id_Item: null, id: "done" }))).toEqual([])
  expect(pointedAt(pointed_Spell, null).words_Pointed).toBe(null)
  expect(litIn(pointedAt(pointed_Spell, null))).toEqual([])
  expect(pointedAt(pointed_Spell, { id_Item, id: "spell" })).toBe(pointed_Spell)
  expect(pointedAt(state_Referring, null)).toBe(state_Referring)
  const shown = (state: _State__Viewer_TextEditor_, id_Request: { id_Item: { source: string, range_Frame: { first: number, last: number } } | null, id: string } | null) => HANDLERMAP__TEXTEDITOR.SHOW_WORDS({ state, command: { kind: "SHOW_WORDS", id_Request }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View: () => {} })
  const state_Shown = shown(state_Referring, { id_Item: null, id: "count" })
  expect([state_Shown.words_Shown, state_Shown.isRevealing_Words, state_Shown.isFocusing_Input]).toEqual([{ id_Item: null, id: "count" }, true, true])
  expect(shown(state_Shown, null).words_Shown).toBe(null)
  expect(shown(state_Referring, null)).toBe(state_Referring)
})

test("words quoted in a form are shown by their start, cut where there's more, and how many lines they run to; ones too long for the chip peeked at, their first six lines and how many more", () => {
  expect([headOf__Quote({ text: "aborted" }), sizeOf__Quote({ text: "aborted" }), peekOf__Quote({ text: "aborted" })]).toEqual(["aborted", null, null])
  const text_Lines = "  if (signal?.aborted) break\n  await sleep(delay)\n}"
  expect([headOf__Quote({ text: text_Lines }), sizeOf__Quote({ text: text_Lines }), peekOf__Quote({ text: text_Lines })]).toEqual(["if (signal?.aborted) break…", "3 lines", { text: text_Lines, more: null }])
  expect([headOf__Quote({ text: "\n  next()" }), sizeOf__Quote({ text: "\n  next()" })]).toEqual(["next()", "2 lines"])
  expect(peekOf__Quote({ text: "x".repeat(37) })).toEqual({ text: "x".repeat(37), more: null })
  const lines_Many = Array.from({ length: 13 }, (_, index) => `line ${index + 1}`)
  expect(peekOf__Quote({ text: lines_Many.join("\n") })).toEqual({ text: lines_Many.slice(0, 6).join("\n"), more: "… 7 more lines" })
  expect(peekOf__Quote({ text: lines_Many.slice(0, 7).join("\n") })?.more).toBe("… 1 more line")
})

test("revisions queued: a revision's notes added, asked of the host, its draft closed; with Start, its proposal's queued requests started after them, and with nothing written, Start alone; with nothing written, not now, nothing; from the menu's form, a revision of a proposal queued the same, and a request for a change to the document, the words with it, queued the same, the document's own, Start asked with it, as the host starts it at once", () => {
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
  expect(asked).toEqual([{ kind: "ACTION", source: "digit", command: "revise", notes: "Say it.", reference: null }, { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } }, { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } }])
  asked.length = 0
  const digit_Text = { kind: "CHANGE" as const, source: "digit", index: 0 }
  const over_Digit: _Selection_TextEditor_ = { anchor: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 0 } }, head: { id_Run: "frame-1-proposed", id_Text: digit_Text, position: { line: 0, offset: 1 } } }
  const over_One: _Selection_TextEditor_ = { anchor: caretOf("frame-1-proposed", 0, 0).anchor, head: caretOf("frame-1-proposed", 0, 3).head }
  const formOf = (selection: _Selection_TextEditor_) => {
    const opened = HANDLERMAP__TEXTEDITOR.OPEN_MENU({ state: stateOf(selection), command: { kind: "OPEN_MENU", point_Screen: { x: 40, y: 40 } }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
    return HANDLERMAP__TEXTEDITOR.CHOOSE_MENU({ state: opened, command: { kind: "CHOOSE_MENU", index: opened.menu?.index_Focused ?? 0 }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  }
  expect([formOf(over_Digit).request?.isStartable, formOf(over_One).request?.isStartable]).toEqual([true, true])
  const startedFrom = (selection: _Selection_TextEditor_, notes: string) => HANDLERMAP__TEXTEDITOR.SEND_REQUEST({ state: formOf(selection), command: { kind: "SEND_REQUEST", notes, isStarting: true }, layout_View, module_Words: MODULE_WORDS_TEXT, edit_View: () => null, ask_View })
  expect(startedFrom(over_Digit, "Spell it out.").request).toBe(null)
  expect(startedFrom(over_Digit, "").request).toBe(null)
  expect(startedFrom(over_One, "").request).not.toBe(null)
  expect(startedFrom(over_One, "Say which one.").request).toBe(null)
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "revise", notes: "Spell it out.", reference: { pieces: [{ id_Text: digit_Text, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }], text: "2", side: "PROPOSED" } },
    { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } },
    { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } },
    { kind: "REQUEST", aim: { kind: "DOCUMENT", reference: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }], text: "one", side: "PROPOSED" } }, notes: "Say which one.", isStarting: true }
  ])
})

test("an action that would drop revisions queued is asked first: pressed, nothing asked of the host, the item asking in its place, which action and how many it'd drop, the keyboard on Cancel; confirmed, asked; cancelled, nothing; one with nothing queued asked at once; a queued request removed, asked of the host by its id; Start, on one request, a proposal's or the document's, from the header, asked with that scope; Stop, by its scope, as Start is; a host's task action, from the header, asked as it is; Run again, on a round that landed after your edits, asked for its proposal; the document's own requests removed, started and, addressed, dismissed, on no proposal; Revise, from the document's card, a form for the whole document, in that card, saying it's a revision, the document's proposals being in, no point of its own, put away, the keyboard back on that card's Add a request; Revise, from the task's card, one for the task as a whole, aimed at no document, none with no task, in the task's card, sent or put away, the keyboard back on its Add a request, left empty, put away where the keyboard's gone; each form saying, where there's a task, where what's written goes; Escape in the task's card, the keyboard back on the text; a queued request's Edit, a proposal's in its frame's item, or the document's in its card, marked as being edited, the keyboard in its box; saved, asked of the host, its words trimmed, nothing written, nothing; cancelled, nothing asked; the keyboard back on its Edit either way; and one being revised, accepted, asks to stop its revision, dropping what's asked of it", () => {
  const id_Item = { source: "digit", range_Frame: { first: 1, last: 1 } }
  const viewModel_Queued = viewModelOf__Model({
    model_TextEditor: result.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [{ id: "say", notes: "Say it.", reference: null, status: "QUEUED" }, { id: "spell", notes: "Spell it.", reference: null, status: "QUEUED" }], actions: actions_Review, attributes: {} }],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
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
  expect(handled(state_Queued, { kind: "STOP", scope: { kind: "TASK_REQUESTS" } })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "STOP", scope: { kind: "REQUEST", source: null, id: "all" } })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "TASK", command: "accept-here" })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "RERUN", id_Item })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "CLOSE_CARD" }).isFocusing_Input).toBe(true)
  expect(handled(state_Queued, { kind: "REMOVE", source: null, id: "all" })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "DISMISS", source: null, id: "done" })).toBe(state_Queued)
  expect(handled(state_Queued, { kind: "START", scope: { kind: "REQUEST", source: null, id: "all" } })).toBe(state_Queued)
  const opened = handled(state_Queued, { kind: "OPEN_REQUEST", target: { kind: "DOCUMENT", reference: null } })
  expect([opened.menu, opened.request, opened.focus_Asking]).toEqual([null, { place: { kind: "DOCUMENT" }, label: "Revise this file", head: null, quote: null, isStartable: true, target: { kind: "DOCUMENT", reference: null } }, "REQUEST"])
  expect(handled(state_Queued, { kind: "OPEN_REQUEST", target: { kind: "TASK", reference: null } })).toBe(state_Queued)
  const closed = handled(opened, { kind: "CLOSE_REQUEST" })
  expect([closed.request, closed.focus_Asking, closed.isFocusing_Input]).toEqual([null, "ASK_DOCUMENT", false])
  const state_Task: _State__Viewer_TextEditor_ = {
    ...state_Queued,
    viewModel_TextEditor: {
      ...state_Queued.viewModel_TextEditor,
      header: {
        ...state_Queued.viewModel_TextEditor.header,
        mode: { kind: "TASK", task: { id: "T-3", name: "Tidy", state: "WORKING", label_State: "Working", ends: [], summary: "", reason: "", proposals: { figure: null, documents: [], actions: [] }, revisions_Scope: { figure: null, start_All: null, stop_All: null, actions: [] }, revisions_Level: { requests: [], isStartable_Requests: false, isStoppable_Requests: false, ask: { label: "Revise", label_Form: "Revise the task" } } } }
      }
    }
  }
  const opened_Task = handled(state_Task, { kind: "OPEN_REQUEST", target: { kind: "TASK", reference: null } })
  expect(opened_Task.request).toEqual({ place: { kind: "TASK" }, label: "Revise the task", head: null, quote: null, isStartable: true, target: { kind: "TASK", reference: null } })
  const sent_Task = handled(opened_Task, { kind: "SEND_REQUEST", notes: "Tidy it all.", isStarting: false })
  expect([sent_Task.request, sent_Task.focus_Asking, sent_Task.isFocusing_Input]).toEqual([null, "ASK_TASK", false])
  const closed_Task = handled(opened_Task, { kind: "CLOSE_REQUEST" })
  expect([closed_Task.request, closed_Task.focus_Asking, closed_Task.isFocusing_Input]).toEqual([null, "ASK_TASK", false])
  const left_Task = handled(opened_Task, { kind: "LEAVE_REQUEST" })
  expect([left_Task.request, left_Task.focus_Asking, left_Task.isFocusing_Input]).toEqual([null, opened_Task.focus_Asking, opened_Task.isFocusing_Input])
  expect(handled(state_Queued, { kind: "LEAVE_REQUEST" })).toBe(state_Queued)
  const editing = handled(state_Queued, { kind: "EDIT", id_Item, id: "spell" })
  expect([editing.editing_Request, editing.focus_Asking]).toEqual([{ id_Item, id: "spell" }, "EDIT"])
  const items_Editing = editingAt__ViewModel({ viewModel_TextEditor: editing.viewModel_TextEditor, editing_Request: editing.editing_Request }).blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : []).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items : [])
  expect(items_Editing.flatMap((item) => item.requests.map((request) => `${item.source} ${request.id} ${request.isEditing}`))).toEqual(["digit say false", "digit spell true"])
  expect(handled(editing, { kind: "SAVE_EDIT", notes: "  " })).toBe(editing)
  const saved = handled(editing, { kind: "SAVE_EDIT", notes: " Spell it out. " })
  expect([saved.editing_Request, saved.focus_Edited]).toEqual([null, { id_Item, id: "spell" }])
  const cancelled = handled(editing, { kind: "CLOSE_EDIT" })
  expect([cancelled.editing_Request, cancelled.focus_Edited]).toEqual([null, { id_Item, id: "spell" }])
  expect(handled(state_Queued, { kind: "CLOSE_EDIT" })).toBe(state_Queued)
  const header_Queued = state_Queued.viewModel_TextEditor.header
  const state_Requested: _State__Viewer_TextEditor_ = {
    ...state_Queued,
    viewModel_TextEditor: {
      ...state_Queued.viewModel_TextEditor,
      header: {
        ...header_Queued,
        document: {
          ...header_Queued.document,
          revisions_Level: {
            ...header_Queued.document.revisions_Level,
            requests: [{ id: "all", notes: "Number them all.", reference: null, status: "QUEUED" as const, progress: "queued", isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }]
          }
        }
      }
    }
  }
  const editing_Card = handled(state_Requested, { kind: "EDIT", id_Item: null, id: "all" })
  expect(editingAt__ViewModel({ viewModel_TextEditor: editing_Card.viewModel_TextEditor, editing_Request: editing_Card.editing_Request }).header.document.revisions_Level.requests.map((request) => `${request.id} ${request.isEditing}`)).toEqual(["all true"])
  expect(asked).toEqual([
    { kind: "ACTION", source: "digit", command: "accept", notes: null, reference: null },
    { kind: "ACTION", source: "digit", command: "reject", notes: null, reference: null },
    { kind: "REMOVE", source: "digit", id: "spell" },
    { kind: "START", scope: { kind: "REQUEST", source: "digit", id: "say" } },
    { kind: "START", scope: { kind: "PROPOSAL", source: "digit" } },
    { kind: "START", scope: { kind: "DOCUMENT" } },
    { kind: "STOP", scope: { kind: "TASK_REQUESTS" } },
    { kind: "STOP", scope: { kind: "REQUEST", source: null, id: "all" } },
    { kind: "TASK", command: "accept-here" },
    { kind: "RERUN", source: "digit" },
    { kind: "REMOVE", source: null, id: "all" },
    { kind: "DISMISS", source: null, id: "done" },
    { kind: "START", scope: { kind: "REQUEST", source: null, id: "all" } },
    { kind: "REQUEST", aim: { kind: "TASK", reference: null }, notes: "Tidy it all.", isStarting: false },
    { kind: "EDIT", source: "digit", id: "spell", notes: "Spell it out." }
  ])
  const viewModel_Running = viewModelOf__Model({
    model_TextEditor: result.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [{ id: "say", notes: "Say it.", reference: null, status: "RUNNING" }, { id: "spell", notes: "Spell it.", reference: null, status: "QUEUED" }], actions: actions_Review, attributes: {} }],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const acted_Running = handled({ ...stateOf(null), viewModel_TextEditor: viewModel_Running }, { kind: "ACT", id_Item, command: "accept" })
  const item_Running = confirmingAt__ViewModel({ viewModel_TextEditor: viewModel_Running, confirm_Item: acted_Running.confirm_Item }).blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : []).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items : [])[0]
  expect(item_Running?.confirming?.label_Question).toBe("Accept and stop its revision, dropping 2 requests?")
})
