import { expect, test } from "bun:test"
import { parseModel_TextEditor, textWith__Sources, applied__Transaction, type _Model_TextEditor_, type _Range_Text_, type _Id_Text_ } from "../source/Model_TextEditor.ts"
import type { _Proposal_Host_ } from "../source/Projection_TextEditor.ts"
import { editedOf__Request, HISTORY_EMPTY, type _History_TextEditor_, type _Edited_Model_ } from "../source/Editing_TextEditor.ts"
import type { _Selection_TextEditor_, _Decision_Proposal_, _Status_Request_ } from "../source/ViewModel_TextEditor.ts"
import { actions_Review } from "../playground/items.ts"
import { MODULE_WORDS_TEXT } from "../source/words/text.ts"

// a range on one line, from a character to another
function on(
  line: number,
  from: number,
  to: number
): _Range_Text_ {
  return { from: { line, offset: from }, to: { line, offset: to } }
}

// "one two three", a proposal, "digit", replacing its "two" with "2", in the
// state given
function modelOf(): _Model_TextEditor_ {
  const result = parseModel_TextEditor({ multilineText: "one two three\nfour", marks: [], proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: on(0, 4, 7), multilineText: "2", marks: [] }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  return result.model_TextEditor
}

function proposalsIn(
  state: _Decision_Proposal_
): Array<_Proposal_Host_> {
  return [
    { source: "digit", title: "Write two as a digit", state, status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} },
    { source: "yours", title: "Your edits", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} },
  ]
}

const document_Text: _Id_Text_ = { kind: "DOCUMENT" }
const digit_Text: _Id_Text_ = { kind: "CHANGE", source: "digit", index: 0 }

// a caret, collapsed, in a text, in a run
const caretAt = (id_Text: _Id_Text_, line: number, offset: number): _Selection_TextEditor_ => {
  const end_Selection = { id_Run: "run", id_Text, position: { line, offset } }
  return { anchor: end_Selection, head: end_Selection }
}

// the model after text typed, or pasted, over a range of a text
function typed(
  model_TextEditor: _Model_TextEditor_,
  history: _History_TextEditor_,
  state: _Decision_Proposal_,
  id_Text: _Id_Text_,
  range: _Range_Text_,
  multilineText: string,
  isTyping: boolean
): _Edited_Model_ | null {
  return editedOf__Request({ model_TextEditor, proposals: proposalsIn(state), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history, request_Edit: { kind: "TEXT", id_Text, range, multilineText, id_Run: "run", selection_Before: caretAt(id_Text, range.from.line, range.from.offset), isTyping, isProposed: false, places_Caret: null } })
}

test("the document's text inside what a pending or accepted proposal's span holds is locked, its edges not, nor what a rejected or withdrawn one's would; a proposal's own text, shown, is edited whatever its decision, revisions queued on it or not, but not while a round of it's under way, a request of it running, as the agent's rewriting it", () => {
  const model = modelOf()
  expect(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 5, 5), "x", true)).toBe(null)
  expect(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 2, 5), "", false)).toBe(null)
  expect(typed(model, HISTORY_EMPTY, "ACCEPTED", document_Text, on(0, 5, 6), "", false)).toBe(null)
  expect<unknown>(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 4, 4), "x", true)?.model_TextEditor.document.lines).toEqual(["one xtwo three", "four"])
  expect<unknown>(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 7, 8), "", false)?.model_TextEditor.document.lines).toEqual(["one twothree", "four"])
  expect<unknown>(typed(model, HISTORY_EMPTY, "REJECTED", document_Text, on(0, 5, 5), "x", true)?.model_TextEditor.document.lines).toEqual(["one txwo three", "four"])
  expect(typed(model, HISTORY_EMPTY, "OPEN", digit_Text, on(0, 1, 1), "!", true)?.model_TextEditor.proposed[0]?.changes[0]).toMatchObject({ next: { lines: ["2!"] } })
  expect(typed(model, HISTORY_EMPTY, "ACCEPTED", digit_Text, on(0, 1, 1), "!", true)?.model_TextEditor.proposed[0]?.changes[0]).toMatchObject({ next: { lines: ["2!"] } })
  const asked = (status: _Status_Request_) => editedOf__Request({ model_TextEditor: model, proposals: proposalsIn("OPEN").map((proposal_Host) => proposal_Host.source === "digit" ? { ...proposal_Host, requests: [{ id: "spell", notes: "Spell it.", reference: null, status }] } : proposal_Host), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: digit_Text, range: on(0, 1, 1), multilineText: "!", id_Run: "run", selection_Before: caretAt(digit_Text, 0, 1), isTyping: true, isProposed: false, places_Caret: null } })
  expect(asked("QUEUED")?.model_TextEditor.proposed[0]?.changes[0]).toMatchObject({ next: { lines: ["2!"] } })
  expect(asked("RUNNING")).toBe(null)
  for (const state of ["REJECTED", "WITHDRAWN"] as const) expect(typed(model, HISTORY_EMPTY, state, digit_Text, on(0, 1, 1), "!", true)).toBe(null)
})

test("an edit leaves the caret after what it put in, on the line it ends on, a line break among it or not", () => {
  const model = modelOf()
  expect(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(1, 2, 2), "ab", true)?.selection.head.position).toEqual({ line: 1, offset: 4 })
  expect(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(1, 2, 2), "ab\ncde", false)?.selection.head.position).toEqual({ line: 2, offset: 3 })
  expect(typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(1, 0, 4), "", false)?.selection.head.position).toEqual({ line: 1, offset: 0 })
})

test("typing runs together into one undo while the caret's where the last left it; a paste, or a caret moved, starts another; undoing gives back the model exactly, and the selection before; redoing, the model after", () => {
  const model = modelOf()
  const first = typed(model, HISTORY_EMPTY, "OPEN", document_Text, on(1, 4, 4), "a", true)
  if (first === null) throw new Error("refused")
  const second = typed(first.model_TextEditor, first.history, "OPEN", document_Text, on(1, 5, 5), "b", true)
  if (second === null) throw new Error("refused")
  expect(second.history.undos.length).toBe(1)
  const pasted = typed(second.model_TextEditor, second.history, "OPEN", document_Text, on(1, 6, 6), "c", false)
  if (pasted === null) throw new Error("refused")
  expect<unknown>(pasted.model_TextEditor.document.lines).toEqual(["one two three", "fourabc"])
  expect(pasted.history.undos.length).toBe(2)
  const apart = typed(second.model_TextEditor, second.history, "OPEN", document_Text, on(1, 0, 0), "z", true)
  expect(apart?.history.undos.length).toBe(2)
  const undoOf = (edited: _Edited_Model_) => editedOf__Request({ model_TextEditor: edited.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: edited.history, request_Edit: { kind: "UNDO" } })
  const redoOf = (edited: _Edited_Model_) => editedOf__Request({ model_TextEditor: edited.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: edited.history, request_Edit: { kind: "REDO" } })
  const undone_Paste = undoOf(pasted)
  if (undone_Paste === null) throw new Error("nothing to undo")
  expect(undone_Paste.model_TextEditor).toEqual(second.model_TextEditor)
  const undone_Typing = undoOf(undone_Paste)
  if (undone_Typing === null) throw new Error("nothing to undo")
  expect(undone_Typing.model_TextEditor).toEqual(model)
  expect(undone_Typing.selection).toEqual(caretAt(document_Text, 1, 4))
  expect(undoOf(undone_Typing)).toBe(null)
  const redone = redoOf(undone_Typing)
  if (redone === null) throw new Error("nothing to redo")
  expect(redone.model_TextEditor).toEqual(second.model_TextEditor)
  expect(redone.selection.head.position).toEqual({ line: 1, offset: 6 })
  expect(redoOf(pasted)).toBe(null)
})

// what's typed among what a frame's lines propose, where it's the document's
// own words, made a change of yours
function typedAmong(
  model_TextEditor: _Model_TextEditor_,
  history: _History_TextEditor_,
  range: _Range_Text_,
  multilineText: string
): _Edited_Model_ | null {
  return editedOf__Request({ model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history, request_Edit: { kind: "TEXT", id_Text: document_Text, range, multilineText, id_Run: "run", selection_Before: caretAt(document_Text, range.from.line, range.from.offset), isTyping: true, isProposed: true, places_Caret: null } })
}

test("typed among what's proposed, where it's the document's own words, an edit's a change of yours over the whole word it's in, the caret in it after what's typed: the document, and so the lines as they are, as they were; typed on in it, the same change; undone, gone", () => {
  const model = modelOf()
  const first = typedAmong(model, HISTORY_EMPTY, on(0, 2, 2), "X")
  if (first === null) throw new Error("refused")
  expect<unknown>(first.model_TextEditor.document).toEqual(model.document)
  expect(first.model_TextEditor.proposed.map((changes_Source) => changes_Source.source)).toEqual(["digit", "yours"])
  expect(first.model_TextEditor.proposed[1]?.changes).toMatchObject([{ kind: "REPLACE", range: on(0, 0, 3), next: { lines: ["onXe"] } }])
  expect<unknown>(textWith__Sources({ model_TextEditor: first.model_TextEditor, sources: ["digit", "yours"] }).lines).toEqual(["onXe 2 three", "four"])
  expect(first.selection.head).toEqual({ id_Run: "run", id_Text: { kind: "CHANGE", source: "yours", index: 0 }, position: { line: 0, offset: 3 } })
  const again = editedOf__Request({ model_TextEditor: first.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: first.history, request_Edit: { kind: "TEXT", id_Text: first.selection.head.id_Text, range: on(0, 3, 3), multilineText: "Y", id_Run: "run", selection_Before: first.selection, isTyping: true, isProposed: true, places_Caret: null } })
  if (again === null) throw new Error("refused")
  expect(again.model_TextEditor.proposed[1]?.changes.length).toBe(1)
  expect<unknown>(textWith__Sources({ model_TextEditor: again.model_TextEditor, sources: ["digit", "yours"] }).lines).toEqual(["onXYe 2 three", "four"])
  const undone = editedOf__Request({ model_TextEditor: first.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: first.history, request_Edit: { kind: "UNDO" } })
  expect(undone?.model_TextEditor).toEqual(model)
})

test("typed among a move's words, as they land, an edit's a change of yours the move carries; one that would cross another proposal's span is refused", () => {
  const result = parseModel_TextEditor({ multilineText: "alpha beta\ngamma", marks: [], proposed: [{ source: "swap", changes: [{ kind: "MOVE", range: on(0, 6, 10), at: { line: 0, offset: 0 } }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  const carried = editedOf__Request({ model_TextEditor: result.model_TextEditor, proposals: [{ source: "swap", title: "Beta first", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }, { source: "yours", title: "Your edits", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }], source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: document_Text, range: on(0, 8, 8), multilineText: "!", id_Run: "run", selection_Before: caretAt(document_Text, 0, 8), isTyping: true, isProposed: true, places_Caret: null } })
  expect<unknown>(carried === null ? null : textWith__Sources({ model_TextEditor: carried.model_TextEditor, sources: ["swap", "yours"] }).lines).toEqual(["be!taalpha ", "gamma"])
  expect<unknown>(carried?.model_TextEditor.document.lines).toEqual(["alpha beta", "gamma"])
  expect(typedAmong(modelOf(), HISTORY_EMPTY, on(0, 2, 5), "")).toBe(null)
})

test("typed at the very start of what a move carries, as it lands, an edit's still the move's to carry: the change of yours takes in the first character it carries, as it is, its text put before it", () => {
  const result = parseModel_TextEditor({ multilineText: "one\n\nmoved\ntwo", marks: [], proposed: [{ source: "lift", changes: [{ kind: "MOVE", range: { from: { line: 1, offset: 0 }, to: { line: 3, offset: 0 } }, at: { line: 0, offset: 0 } }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  const edited = editedOf__Request({ model_TextEditor: result.model_TextEditor, proposals: [{ source: "lift", title: "Lift it", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }, { source: "yours", title: "Your edits", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }], source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: document_Text, range: on(1, 0, 0), multilineText: "Q", id_Run: "run", selection_Before: caretAt(document_Text, 1, 0), isTyping: true, isProposed: true, places_Caret: null } })
  expect<unknown>(edited === null ? null : textWith__Sources({ model_TextEditor: edited.model_TextEditor, sources: ["lift", "yours"] }).lines).toEqual(["Q", "moved", "one", "two"])
  expect(edited?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: { from: { line: 1, offset: 0 }, to: { line: 2, offset: 0 } }, next: { lines: ["Q", ""] } }])
})

// what's typed in a text, as asked from among what's proposed
function typedIn(
  model_TextEditor: _Model_TextEditor_,
  history: _History_TextEditor_,
  state: _Decision_Proposal_,
  id_Text: _Id_Text_,
  range: _Range_Text_,
  multilineText: string
): _Edited_Model_ | null {
  return editedOf__Request({ model_TextEditor, proposals: proposalsIn(state), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history, request_Edit: { kind: "TEXT", id_Text, range, multilineText, id_Run: "run", selection_Before: caretAt(id_Text, range.from.line, range.from.offset), isTyping: true, isProposed: true, places_Caret: null } })
}

// the lines as proposed, by digit and yours both
const linesOf = (edited: _Edited_Model_ | null): unknown => edited === null ? null : textWith__Sources({ model_TextEditor: edited.model_TextEditor, sources: ["digit", "yours"] }).lines

test("deleting the document's words among what's proposed takes them out, a change of yours over the whole word they were in, as it becomes; deleting on in it, still one change; a word typed over is replaced", () => {
  const model = modelOf()
  const first = typedIn(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 9, 10), "")
  expect(linesOf(first)).toEqual(["one 2 tree", "four"])
  expect(first?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 8, 13), next: { lines: ["tree"] } }])
  const second = first === null ? null : typedIn(first.model_TextEditor, first.history, "OPEN", { kind: "CHANGE", source: "yours", index: 0 }, on(0, 0, 1), "")
  expect(linesOf(second)).toEqual(["one 2 ree", "four"])
  expect(second?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 8, 13), next: { lines: ["ree"] } }])
  expect(linesOf(typedIn(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 8, 13), "3"))).toEqual(["one 2 3", "four"])
})

test("a change of yours that's back to what the document says stays while the caret's in it, changing nothing, and goes with the next edit made elsewhere", () => {
  const typed_X = typedIn(modelOf(), HISTORY_EMPTY, "OPEN", document_Text, on(0, 9, 9), "x")
  const yours_Text: _Id_Text_ = { kind: "CHANGE", source: "yours", index: 0 }
  const back = typed_X === null ? null : typedIn(typed_X.model_TextEditor, typed_X.history, "OPEN", yours_Text, on(0, 1, 2), "")
  expect(linesOf(back)).toEqual(["one 2 three", "four"])
  expect(back?.model_TextEditor.proposed[1]?.changes.length).toBe(1)
  expect(back?.selection.head).toEqual({ id_Run: "run", id_Text: yours_Text, position: { line: 0, offset: 1 } })
  const elsewhere = back === null ? null : typedIn(back.model_TextEditor, back.history, "OPEN", document_Text, on(1, 0, 0), "y")
  expect(elsewhere?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(1, 0, 4), next: { lines: ["yfour"] } }])
})

test("an edit of yours that would cross a proposal not shown, rejected or withdrawn, takes in its whole span, holding it as the document has it; one shown, still refused", () => {
  for (const state of ["REJECTED", "WITHDRAWN"] as const) {
    const edited = typedIn(modelOf(), HISTORY_EMPTY, state, document_Text, on(0, 6, 9), "X")
    expect(edited?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 4, 13), next: { lines: ["twXhree"] } }])
    expect<unknown>(edited === null ? null : textWith__Sources({ model_TextEditor: edited.model_TextEditor, sources: ["yours"] }).lines).toEqual(["one twXhree", "four"])
  }
  expect(typedIn(modelOf(), HISTORY_EMPTY, "OPEN", document_Text, on(0, 6, 9), "X")).toBe(null)
})

test("typed just after another proposal's words put in, a change of yours takes in the next character too, as no two changes can be the same span, and so the word it's in, its text coming after theirs", () => {
  const result = parseModel_TextEditor({ multilineText: "one three", marks: [], proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: on(0, 4, 4), multilineText: "two ", marks: [] }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  const edited = typedIn(result.model_TextEditor, HISTORY_EMPTY, "OPEN", document_Text, on(0, 4, 4), "X")
  expect(edited?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 4, 9), next: { lines: ["Xthree"] } }])
  expect(linesOf(edited)).toEqual(["one two Xthree"])
})

// what's typed over a selection drawn across texts, each its piece of it
function typedAcross(
  model_TextEditor: _Model_TextEditor_,
  pieces: [{ id_Text: _Id_Text_, range: _Range_Text_ }, ...Array<{ id_Text: _Id_Text_, range: _Range_Text_ }>],
  multilineText: string
): _Edited_Model_ | null {
  return editedOf__Request({ model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: HISTORY_EMPTY, request_Edit: { kind: "ACROSS", pieces, multilineText, id_Run: "run", selection_Before: caretAt(pieces[0].id_Text, pieces[0].range.from.line, pieces[0].range.from.offset), isTyping: true } })
}

test("typed over a selection across texts, a proposal's words and the document's, each text's piece is edited in it: the proposal's, in the proposal; the document's, as changes of yours; what's typed goes where the selection starts, the caret after it", () => {
  const over_Digit = typedAcross(modelOf(), [{ id_Text: document_Text, range: on(0, 2, 4) }, { id_Text: digit_Text, range: on(0, 0, 1) }, { id_Text: document_Text, range: on(0, 7, 9) }], "Z")
  expect(linesOf(over_Digit)).toEqual(["onZhree", "four"])
  expect(over_Digit?.model_TextEditor.proposed[0]?.changes).toMatchObject([{ range: on(0, 4, 7), next: { lines: [""] } }])
  expect(over_Digit?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 0, 4), next: { lines: ["onZ"] } }, { range: on(0, 7, 13), next: { lines: ["hree"] } }])
  expect(over_Digit?.selection.head).toEqual({ id_Run: "run", id_Text: { kind: "CHANGE", source: "yours", index: 0 }, position: { line: 0, offset: 3 } })
  const from_Digit = typedAcross(modelOf(), [{ id_Text: digit_Text, range: on(0, 0, 1) }, { id_Text: document_Text, range: on(0, 7, 9) }], "Q")
  expect(linesOf(from_Digit)).toEqual(["one Qhree", "four"])
  expect(from_Digit?.selection.head).toEqual({ id_Run: "run", id_Text: digit_Text, position: { line: 0, offset: 1 } })
})

test("across texts, the pieces after the first are edited first, so a change of yours the first makes, before your others, doesn't change which one a later piece names; a later piece with nothing in it is left be", () => {
  const result = parseModel_TextEditor({ multilineText: "abc def", marks: [], proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: on(0, 3, 4), multilineText: "", marks: [] }] }, { source: "yours", changes: [{ kind: "REPLACE", range: on(0, 4, 4), multilineText: "\n", marks: [] }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  expect<unknown>(textWith__Sources({ model_TextEditor: result.model_TextEditor, sources: ["digit", "yours"] }).lines).toEqual(["abc", "def"])
  const edited = typedAcross(result.model_TextEditor, [{ id_Text: document_Text, range: on(0, 2, 3) }, { id_Text: digit_Text, range: on(0, 0, 0) }, { id_Text: { kind: "CHANGE", source: "yours", index: 0 }, range: { from: { line: 0, offset: 0 }, to: { line: 1, offset: 0 } } }], "_")
  expect(linesOf(edited)).toEqual(["ab_def"])
  expect(edited?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 0, 3), next: { lines: ["ab_"] } }])
})

// "one three", with "two" put in after "one" by a proposal: as proposed,
// "one two three", the caret typed at where "one" ends and their words
// begin, what's drawn either side of it said
function typedBetween(
  multilineText: string,
  module_Words: typeof MODULE_WORDS_TEXT
): _Edited_Model_ | null {
  const result = parseModel_TextEditor({ multilineText: "one three", marks: [], proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: on(0, 3, 3), multilineText: " two", marks: [] }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  return editedOf__Request({ model_TextEditor: result.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: digit_Text, range: on(0, 0, 0), multilineText, id_Run: "run", selection_Before: caretAt(digit_Text, 0, 0), isTyping: true, isProposed: true, places_Caret: { place_Before: { id_Text: document_Text, position: { line: 0, offset: 3 } }, place_After: { id_Text: digit_Text, position: { line: 0, offset: 0 } } } } })
}

test("where two texts meet, what's typed goes to the text whose word it joins: a letter after the document's word, a change of yours over that word, never in the proposal's words after it; what joins no word, yours too, before their words; what joins their word, theirs", () => {
  const appended = typedBetween("s", MODULE_WORDS_TEXT)
  expect(linesOf(appended)).toEqual(["ones two three"])
  expect(appended?.model_TextEditor.proposed[0]?.changes).toMatchObject([{ range: on(0, 3, 3), next: { lines: [" two"] } }])
  expect(appended?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(0, 0, 3), next: { lines: ["ones"] } }])
  const spaced = typedBetween(",", MODULE_WORDS_TEXT)
  expect(linesOf(spaced)).toEqual(["one, two three"])
  expect(spaced?.model_TextEditor.proposed[0]?.changes).toMatchObject([{ next: { lines: [" two"] } }])
  const result = parseModel_TextEditor({ multilineText: "one three", marks: [], proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: on(0, 4, 4), multilineText: "two ", marks: [] }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  const prefixed = editedOf__Request({ model_TextEditor: result.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: digit_Text, range: on(0, 0, 0), multilineText: "X", id_Run: "run", selection_Before: caretAt(digit_Text, 0, 0), isTyping: true, isProposed: true, places_Caret: { place_Before: { id_Text: document_Text, position: { line: 0, offset: 4 } }, place_After: { id_Text: digit_Text, position: { line: 0, offset: 0 } } } } })
  expect(linesOf(prefixed)).toEqual(["one Xtwo three"])
  expect(prefixed?.model_TextEditor.proposed[0]?.changes).toMatchObject([{ next: { lines: ["Xtwo "] } }])
  expect(prefixed?.model_TextEditor.proposed.length).toBe(1)
})

// a host's own words: anything between spaces
const module_Words_Spaced = {
  wordsOf: (text: string) => [...text.matchAll(/\S+/g)].map((match) => ({ from: match.index, to: match.index + match[0].length }))
}

test("what a word is, the host says, by the words module it passes: as text, letters and digits, so what's typed after a closing bracket is a word of its own; with words as anything between spaces, it's part of the word before", () => {
  const result = parseModel_TextEditor({ multilineText: "push(error); next", marks: [], proposed: [] })
  if (result.kind === "REFUSED") throw new Error("refused")
  const typedWith = (module_Words: typeof MODULE_WORDS_TEXT) => editedOf__Request({ model_TextEditor: result.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: document_Text, range: on(0, 11, 11), multilineText: "X", id_Run: "run", selection_Before: caretAt(document_Text, 0, 11), isTyping: true, isProposed: true, places_Caret: null } })?.model_TextEditor.proposed[0]?.changes
  expect(typedWith(MODULE_WORDS_TEXT)).toMatchObject([{ range: on(0, 11, 11), next: { lines: ["X"] } }])
  expect(typedWith(module_Words_Spaced)).toMatchObject([{ range: on(0, 0, 12), next: { lines: ["push(error)X;"] } }])
})

test("each edit says what it did, its own transaction, the model before made the model after by it, and its inverse, the model after made the one before: a keystroke run into the one before it, only its own; an undo, its own", () => {
  const model = modelOf()
  const first = typedIn(model, HISTORY_EMPTY, "OPEN", document_Text, on(0, 9, 9), "x")
  if (first === null) throw new Error("refused")
  const second = editedOf__Request({ model_TextEditor: first.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: first.history, request_Edit: { kind: "TEXT", id_Text: first.selection.head.id_Text, range: { from: first.selection.head.position, to: first.selection.head.position }, multilineText: "y", id_Run: "run", selection_Before: first.selection, isTyping: true, isProposed: true, places_Caret: null } })
  if (second === null) throw new Error("refused")
  expect(second.history.undos.length).toBe(1)
  const undone = editedOf__Request({ model_TextEditor: second.model_TextEditor, proposals: proposalsIn("OPEN"), source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: second.history, request_Edit: { kind: "UNDO" } })
  if (undone === null) throw new Error("refused")
  for (const [before, edited] of [[model, first], [first.model_TextEditor, second], [second.model_TextEditor, undone]] as const) {
    expect(applied__Transaction({ model_TextEditor: before, transaction: edited.transaction }).model_TextEditor).toEqual(edited.model_TextEditor)
    expect(applied__Transaction({ model_TextEditor: edited.model_TextEditor, transaction: edited.transaction_Inverse }).model_TextEditor).toEqual(before)
  }
  expect(undone.model_TextEditor).toEqual(model)
})

test("where a move leaves, a change of yours put in just after the gap, and one deleting what's after it, meet as they're drawn, side by side, so they run together; only one inside what the move carries is kept apart from one outside", () => {
  const result = parseModel_TextEditor({ multilineText: "a\nb\nc d", marks: [], proposed: [{ source: "lift", changes: [{ kind: "MOVE", range: { from: { line: 1, offset: 0 }, to: { line: 2, offset: 0 } }, at: { line: 0, offset: 0 } }] }, { source: "yours", changes: [{ kind: "REPLACE", range: on(2, 0, 0), multilineText: "Q", marks: [] }] }] })
  if (result.kind === "REFUSED") throw new Error("refused")
  const proposals: Array<_Proposal_Host_> = [{ source: "lift", title: "Lift b", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }, { source: "yours", title: "Your edits", state: "OPEN", status: "", rationale: "", requests: [], actions: [], attributes: {} }]
  const deleted = editedOf__Request({ model_TextEditor: result.model_TextEditor, proposals, source_Yours: "yours", module_Words: MODULE_WORDS_TEXT, history: HISTORY_EMPTY, request_Edit: { kind: "TEXT", id_Text: document_Text, range: on(2, 0, 1), multilineText: "", id_Run: "run", selection_Before: caretAt(document_Text, 2, 0), isTyping: false, isProposed: true, places_Caret: null } })
  expect(deleted?.model_TextEditor.proposed[1]?.changes).toMatchObject([{ range: on(2, 0, 1), next: { lines: ["Q"] } }])
  expect<unknown>(deleted === null ? null : textWith__Sources({ model_TextEditor: deleted.model_TextEditor, sources: ["lift", "yours"] }).lines).toEqual(["b", "a", "Q d"])
})
