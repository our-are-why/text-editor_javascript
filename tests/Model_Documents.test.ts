import { expect, test } from "bun:test"
import fc from "fast-check"
import { modelAfter__Command, versionOf__Text, sha256Of__Text, transactionOf__Texts, carriedOf__Head, textAt__Version, checkedOf__Head, type _Model_Documents_, type _Command_Documents_, type _Document_Documents_, type _Head_Document_ } from "../source/documents/Model_Documents.ts"
import { _Documents_ } from "../source/documents/Documents.ts"
import { parseTexts_Line, applied__Transaction, textWith__Sources, textIn__Range, positionOf__Index, type _Text_Model_, type _Transaction_Model_, type _Range_Text_, type _Changes_Source_ } from "../source/documents/Model_TextEditor.ts"

const textOf = (multilineText: string): _Text_Model_ => ({ lines: parseTexts_Line(multilineText), marks: [] })
const on = (from: number, to: number): _Range_Text_ => ({ from: { line: 0, offset: from }, to: { line: 0, offset: to } })
const editOf = (range: _Range_Text_, multilineText: string): _Transaction_Model_ => ({ steps: [{ kind: "TEXT", id_Text: { kind: "DOCUMENT" }, range, next: textOf(multilineText) }] })
const replacing = (source: string, range: _Range_Text_, multilineText: string): _Changes_Source_ => ({ source, changes: [{ kind: "REPLACE", range, next: textOf(multilineText) }] })
const after = (model_Documents: _Model_Documents_, ...commands: Array<_Command_Documents_>) => commands.reduce((model, command) => modelAfter__Command({ model_Documents: model, command }), model_Documents)
const documentIn = (model_Documents: _Model_Documents_, path: string): _Document_Documents_ => {
  const document = model_Documents.documents.find((each) => each.path === path)
  if (document === undefined) throw new Error(`no document ${path}`)
  return document
}
const flatOf = (text_Model: _Text_Model_) => text_Model.lines.join("\n")
const versionOf = (multilineText: string) => versionOf__Text({ text_Model: textOf(multilineText) })
const sha256OfBun = (text: string) => new Bun.CryptoHasher("sha256").update(text).digest("hex")
const opened = after({ documents: [] }, { kind: "OPEN", path: "retry.js", text: textOf("let n = attempts") })
// what's stale of a head, each source's stale changes by their index and the
// text each was written over, and how many it dropped
const staleOf = (head: _Head_Document_) => head.stale.map((stale_Source) => ({ source: stale_Source.source, indexes: stale_Source.changes_Stale.map((stale_Change) => stale_Change.index), texts: stale_Source.changes_Stale.map((stale_Change) => `${stale_Change.over.kind} ${flatOf(stale_Change.over.text)}`), count_Dropped: stale_Source.count_Dropped }))

test("a document's version is the SHA-256 of its text, its lines joined by \\n, as any SHA-256 says it, across a block's edges and in any script", () => {
  expect(sha256Of__Text({ text: "" })).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
  expect(sha256Of__Text({ text: "abc" })).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  expect(sha256Of__Text({ text: "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq" })).toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1")
  for (let length = 0; length < 200; length = length + 1) expect(sha256Of__Text({ text: "x".repeat(length) })).toBe(sha256OfBun("x".repeat(length)))
  fc.assert(
    fc.property(fc.string({ unit: "grapheme", maxLength: 300 }), (text) => {
      expect(sha256Of__Text({ text })).toBe(sha256OfBun(text))
    }),
    { numRuns: 300 }
  )
  expect(versionOf__Text({ text_Model: textOf("let n = 1\r\nreturn n") })).toBe(sha256OfBun("let n = 1\nreturn n"))
})

test("a document opened is kept as it is: its version, its copy, no edits; opened again as it was, nothing changes; changed since, what changed recorded as an edit, as when it's read", () => {
  expect(documentIn(opened, "retry.js")).toEqual({ path: "retry.js", version: versionOf("let n = attempts"), text: textOf("let n = attempts"), edits: [] })
  expect(after(opened, { kind: "OPEN", path: "retry.js", text: textOf("let n = attempts") })).toBe(opened)
  const changed = documentIn(after(opened, { kind: "OPEN", path: "retry.js", text: textOf("let n = tries") }), "retry.js")
  expect([changed.version, flatOf(changed.text), changed.edits.map((edit) => [edit.version_From, edit.version_To])]).toEqual([versionOf("let n = tries"), "let n = tries", [[versionOf("let n = attempts"), versionOf("let n = tries")]]])
})

test("an edit made on its version makes a new one: the copy edited, the edit recorded from the old version to the new; only the document's own steps, a proposal's text and its changes not the document's; one leaving the text as it was, no new version, nothing to carry; made on another version, it's refused", () => {
  const version = documentIn(opened, "retry.js").version
  const edited = documentIn(after(opened, { kind: "EDIT", path: "retry.js", version, transaction: editOf(on(4, 5), "round") }), "retry.js")
  expect([edited.version, flatOf(edited.text), edited.edits]).toEqual([versionOf("let round = attempts"), "let round = attempts", [{ version_From: version, version_To: versionOf("let round = attempts"), transaction: editOf(on(4, 5), "round"), transaction_Inverse: editOf(on(4, 9), "n") }]])
  const proposal: _Transaction_Model_ = { steps: [{ kind: "TEXT", id_Text: { kind: "CHANGE", source: "P-1", index: 0 }, range: on(0, 0), next: textOf("!") }, { kind: "SOURCE", source: "P-1", changes: [] }] }
  expect(after(opened, { kind: "EDIT", path: "retry.js", version, transaction: proposal })).toBe(opened)
  const mixed: _Transaction_Model_ = { steps: [proposal.steps[0], ...editOf(on(4, 5), "round").steps] }
  expect(documentIn(after(opened, { kind: "EDIT", path: "retry.js", version, transaction: mixed }), "retry.js").edits[0]?.transaction).toEqual(editOf(on(4, 5), "round"))
  expect(documentIn(after(opened, { kind: "EDIT", path: "retry.js", version, transaction: editOf(on(4, 5), "n") }), "retry.js").edits).toEqual([])
  expect(() => after(opened, { kind: "EDIT", path: "retry.js", version: versionOf("something else"), transaction: editOf(on(0, 0), "x") })).toThrow("isn't on retry.js as it is")
  expect(() => after(opened, { kind: "EDIT", path: "README.md", version, transaction: editOf(on(0, 0), "x") })).toThrow("README.md isn't kept")
})

test("read from outside, as it is now: unchanged, nothing; changed, the copy what was read, and the edits between worked out by comparing it with the copy, which make the one from the other, whatever the texts", () => {
  expect(after(opened, { kind: "READ", path: "retry.js", text: textOf("let n = attempts") })).toBe(opened)
  const read = documentIn(after(opened, { kind: "READ", path: "retry.js", text: textOf("// tries\nlet n = tries") }), "retry.js")
  expect([read.version, flatOf(read.text), read.edits.length]).toEqual([versionOf("// tries\nlet n = tries"), "// tries\nlet n = tries", 1])
  const lines = fc.array(fc.stringMatching(/^[ab ]{0,6}$/), { minLength: 1, maxLength: 8 })
  fc.assert(
    fc.property(lines, lines, (lines_Before, lines_After) => {
      const text_Before = textOf(lines_Before.join("\n"))
      const text_After = textOf(lines_After.join("\n"))
      const transaction = transactionOf__Texts({ text_Before, text_After })
      if (transaction === null) return expect(lines_After).toEqual(lines_Before)
      expect(applied__Transaction({ model_TextEditor: { document: text_Before, proposed: [] }, transaction }).model_TextEditor.document.lines).toEqual(text_After.lines)
    }),
    { numRuns: 2000 }
  )
})

// a document, a change of a task's in it, and an edit to the document, each
// a stretch of the text by where it starts and ends, and what it puts there
const carrying = fc.record({
  lines: fc.array(fc.stringMatching(/^[ab ]{0,6}$/), { minLength: 1, maxLength: 5 }),
  change: fc.tuple(fc.nat(), fc.nat(), fc.stringMatching(/^[xy\n]{0,3}$/)),
  edit: fc.tuple(fc.nat(), fc.nat(), fc.stringMatching(/^[uv\n]{0,3}$/))
}).map(({ lines, change, edit }) => {
  const flat = lines.join("\n")
  const stretchOf = ([one, other, next]: [number, number, string]) => {
    const [from, to] = [one % (flat.length + 1), other % (flat.length + 1)].toSorted((a, b) => a - b) as [number, number]
    return { from, to, next }
  }
  return { flat, change: stretchOf(change), edit: stretchOf(edit) }
})
const rangeIn = (flat: string, from: number, to: number): _Range_Text_ => ({ from: positionOf__Index({ text_Model: textOf(flat), index: from }), to: positionOf__Index({ text_Model: textOf(flat), index: to }) })
const headCarried = (flat: string, change: { from: number, to: number, next: string }, edit: { from: number, to: number, next: string }) => {
  const model = after({ documents: [] }, { kind: "OPEN", path: "retry.js", text: textOf(flat) })
  const head: _Head_Document_ = { path: "retry.js", version: versionOf(flat), proposed: [replacing("T-1", rangeIn(flat, change.from, change.to), change.next)], stale: [] }
  const edited = documentIn(after(model, { kind: "EDIT", path: "retry.js", version: versionOf(flat), transaction: editOf(rangeIn(flat, edit.from, edit.to), edit.next) }), "retry.js")
  return { edited, carried: carriedOf__Head({ document: edited, head }) }
}

test("a head carried across the edits since its version, restated against the document as it is: a change no edit touched still replaces the text it did, the head the document's edit and the change together, and it's not stale", () => {
  fc.assert(
    fc.property(carrying, ({ flat, change, edit }) => {
      fc.pre(edit.to < change.from || change.to < edit.from)
      const { edited, carried } = headCarried(flat, change, edit)
      const [first, second] = edit.to < change.from ? [edit, change] : [change, edit]
      const expected = flat.slice(0, first.from) + first.next + flat.slice(first.to, second.from) + second.next + flat.slice(second.to)
      expect(carried.version).toBe(edited.version)
      expect(flatOf(textIn__Range({ text_Model: edited.text, range: carried.proposed[0]!.changes[0]!.range }))).toBe(flat.slice(change.from, change.to))
      expect(flatOf(textWith__Sources({ model_TextEditor: { document: edited.text, proposed: carried.proposed }, sources: ["T-1"] }))).toBe(expected)
      expect(carried.stale).toEqual([])
    }),
    { numRuns: 3000 }
  )
})

test("a change an edit cut into, or replaced, or took the place of, is stale, carried as near as it can be, a conflict for you to decide, the text it was written over kept, an insertion's line; nothing's lost", () => {
  fc.assert(
    fc.property(carrying, ({ flat, change, edit }) => {
      const isEmpty_Edit = edit.from === edit.to
      fc.pre(flat.slice(edit.from, edit.to) !== edit.next)
      fc.pre(isEmpty_Edit ? change.from < edit.from && edit.from < change.to : edit.from < change.to && change.from < edit.to)
      const { carried } = headCarried(flat, change, edit)
      expect(carried.proposed.map((changes_Source) => changes_Source.changes.length)).toEqual([1])
      const start_Line = change.from === 0 ? 0 : flat.lastIndexOf("\n", change.from - 1) + 1
      const end_Line = flat.indexOf("\n", change.from) === -1 ? flat.length : flat.indexOf("\n", change.from)
      const over = change.from === change.to ? `LINE ${flat.slice(start_Line, end_Line)}` : `RANGE ${flat.slice(change.from, change.to)}`
      expect(staleOf(carried)).toEqual([{ source: "T-1", indexes: [0], texts: [over], count_Dropped: 0 }])
    }),
    { numRuns: 3000 }
  )
  const deleted = headCarried("let n = attempts;", { from: 8, to: 16, next: "tries" }, { from: 0, to: 17, next: "" }).carried
  expect([deleted.proposed[0]?.changes[0]?.range, staleOf(deleted)]).toEqual([on(0, 0), [{ source: "T-1", indexes: [0], texts: ["RANGE attempts"], count_Dropped: 0 }]])
  const same = headCarried("let n = attempts;", { from: 8, to: 16, next: "tries" }, { from: 8, to: 16, next: "tries" }).carried
  expect(staleOf(same)).toEqual([{ source: "T-1", indexes: [0], texts: ["RANGE attempts"], count_Dropped: 0 }])
})

test("stale stays stale as it's carried further, a source's other changes carried as they are; a head already on the document as it is, as it was", () => {
  const model = after({ documents: [] }, { kind: "OPEN", path: "retry.js", text: textOf("let n = attempts;") })
  const version = versionOf("let n = attempts;")
  const head: _Head_Document_ = { path: "retry.js", version, proposed: [{ source: "T-1", changes: [{ kind: "REPLACE", range: on(4, 5), next: textOf("round") }, { kind: "REPLACE", range: on(8, 16), next: textOf("tries") }] }], stale: [{ source: "T-1", changes_Stale: [{ index: 0, over: { kind: "RANGE", version: "v0", text: textOf("x") } }], count_Dropped: 0 }] }
  const edited = documentIn(after(model, { kind: "EDIT", path: "retry.js", version, transaction: editOf(on(0, 3), "const") }), "retry.js")
  const carried = carriedOf__Head({ document: edited, head })
  expect(carried.proposed[0]?.changes.map((change) => change.range)).toEqual([on(6, 7), on(10, 18)])
  expect(staleOf(carried)).toEqual([{ source: "T-1", indexes: [0], texts: ["RANGE x"], count_Dropped: 0 }])
  expect(carriedOf__Head({ document: edited, head: carried })).toBe(carried)
})

test("a move carried across an edit outside it moves the same text to the same place; an edit cutting through where it lands makes it stale; one whose text's all gone, dropped, counted", () => {
  const model = after({ documents: [] }, { kind: "OPEN", path: "retry.js", text: textOf("abc def ghi") })
  const version = versionOf("abc def ghi")
  const headOf = (at: number): _Head_Document_ => ({ path: "retry.js", version, proposed: [{ source: "T-1", changes: [{ kind: "MOVE", range: on(0, 4), at: { line: 0, offset: at } }] }], stale: [] })
  const carriedAcross = (head: _Head_Document_, transaction: _Transaction_Model_) => carriedOf__Head({ document: documentIn(after(model, { kind: "EDIT", path: "retry.js", version, transaction }), "retry.js"), head })
  const outside = carriedAcross(headOf(8), editOf(on(5, 6), "E"))
  expect([outside.proposed[0]?.changes[0], outside.stale]).toEqual([{ kind: "MOVE", range: on(0, 4), at: { line: 0, offset: 8 } }, []])
  expect(staleOf(carriedAcross(headOf(9), editOf(on(8, 10), "x")))).toEqual([{ source: "T-1", indexes: [0], texts: ["RANGE abc def g"], count_Dropped: 0 }])
  const gone = carriedAcross(headOf(8), editOf(on(0, 4), ""))
  expect([gone.proposed, gone.stale]).toEqual([[], []])
})

test("a stale change keeps the version it was written on and the text it was written over, the stretch it covers, an insertion's line, a move's from its words to where they land; once the document's back at that version, by undo or by hand, it's clean, no conflict left, or, a change of text, once it has that text there again, its stretch whole, as a head carried, or one rechecked as it is; an insertion's line alone saying nothing, a blank line like any other; a document's text at a version it's moved on from worked back from the edits since", () => {
  const model = after({ documents: [] }, { kind: "OPEN", path: "retry.js", text: textOf("let n = attempts;") })
  const v1 = versionOf("let n = attempts;")
  const head: _Head_Document_ = { path: "retry.js", version: v1, proposed: [replacing("T-1", on(8, 16), "tries")], stale: [] }
  const typed = documentIn(after(model, { kind: "EDIT", path: "retry.js", version: v1, transaction: editOf(on(10, 10), "X") }), "retry.js")
  const conflicted = carriedOf__Head({ document: typed, head })
  expect(staleOf(conflicted)).toEqual([{ source: "T-1", indexes: [0], texts: ["RANGE attempts"], count_Dropped: 0 }])
  expect(conflicted.stale[0]?.changes_Stale[0]?.over.version).toBe(v1)
  expect(flatOf(textAt__Version({ document: typed, version: v1 }))).toBe("let n = attempts;")
  const undone = documentIn(after({ documents: [typed] }, { kind: "EDIT", path: "retry.js", version: typed.version, transaction: typed.edits[0]!.transaction_Inverse }), "retry.js")
  expect([undone.version, carriedOf__Head({ document: undone, head: conflicted }).stale]).toEqual([v1, []])
  const retyped = documentIn(after({ documents: [typed] }, { kind: "EDIT", path: "retry.js", version: typed.version, transaction: editOf(on(10, 11), "") }), "retry.js")
  expect(carriedOf__Head({ document: retyped, head: conflicted }).stale).toEqual([])
  expect(checkedOf__Head({ document: typed, head: conflicted })).toBe(conflicted)
  expect(checkedOf__Head({ document: retyped, head: { ...conflicted, version: retyped.version } }).stale).toEqual([])
  const elsewhere = documentIn(after({ documents: [typed] }, { kind: "EDIT", path: "retry.js", version: typed.version, transaction: editOf(on(0, 3), "const") }), "retry.js")
  expect(staleOf(carriedOf__Head({ document: elsewhere, head: conflicted }))).toEqual(staleOf(conflicted))
  const inserting: _Head_Document_ = { path: "retry.js", version: v1, proposed: [replacing("T-1", on(6, 6), " /* tries */")], stale: [] }
  const cut = documentIn(after(model, { kind: "EDIT", path: "retry.js", version: v1, transaction: editOf(on(4, 8), "") }), "retry.js")
  const insertion_Cut = carriedOf__Head({ document: cut, head: inserting })
  expect(staleOf(insertion_Cut)).toEqual([{ source: "T-1", indexes: [0], texts: ["LINE let n = attempts;"], count_Dropped: 0 }])
  const restored = documentIn(after({ documents: [cut] }, { kind: "EDIT", path: "retry.js", version: cut.version, transaction: cut.edits[0]!.transaction_Inverse }), "retry.js")
  expect(carriedOf__Head({ document: restored, head: insertion_Cut }).stale).toEqual([])
  const blank = after({ documents: [] }, { kind: "OPEN", path: "notes.md", text: textOf("\n\n") })
  const blank_Cut = documentIn(after(blank, { kind: "EDIT", path: "notes.md", version: versionOf("\n\n"), transaction: editOf({ from: { line: 0, offset: 0 }, to: { line: 2, offset: 0 } }, "") }), "notes.md")
  const insertion_Blank = carriedOf__Head({ document: blank_Cut, head: { path: "notes.md", version: versionOf("\n\n"), proposed: [replacing("T-1", { from: { line: 1, offset: 0 }, to: { line: 1, offset: 0 } }, "x")], stale: [] } })
  expect(staleOf(insertion_Blank)).toEqual([{ source: "T-1", indexes: [0], texts: ["LINE "], count_Dropped: 0 }])
  const blank_Typed = documentIn(after({ documents: [blank_Cut] }, { kind: "EDIT", path: "notes.md", version: blank_Cut.version, transaction: editOf(on(0, 0), "y") }), "notes.md")
  expect(staleOf(carriedOf__Head({ document: blank_Typed, head: insertion_Blank }))).toEqual(staleOf(insertion_Blank))
})

test("Release lets go of the edits nothing's stated against, kept from the oldest version still needed, none when nothing is; a version the document came back to is carried from its last time; carrying from a version let go is refused", () => {
  const [v1, v2, v3] = ["let n = attempts", "let round = attempts", "let round = tries"].map(versionOf) as [string, string, string]
  const model = after(opened, { kind: "EDIT", path: "retry.js", version: v1, transaction: editOf(on(4, 5), "round") }, { kind: "EDIT", path: "retry.js", version: v2, transaction: editOf(on(12, 20), "tries") })
  expect(documentIn(model, "retry.js").edits.map((edit) => edit.version_From)).toEqual([v1, v2])
  expect(documentIn(after(model, { kind: "RELEASE", path: "retry.js", versions: [v2, v3] }), "retry.js").edits.map((edit) => edit.version_From)).toEqual([v2])
  expect(documentIn(after(model, { kind: "RELEASE", path: "retry.js", versions: [v3] }), "retry.js").edits).toEqual([])
  expect(after(model, { kind: "RELEASE", path: "retry.js", versions: [v1] })).toBe(model)
  const released = after(model, { kind: "RELEASE", path: "retry.js", versions: [] })
  expect(() => carriedOf__Head({ document: documentIn(released, "retry.js"), head: { path: "retry.js", version: v1, proposed: [], stale: [] } })).toThrow("edits from")
  const back = documentIn(after(opened, { kind: "EDIT", path: "retry.js", version: v1, transaction: editOf(on(4, 5), "round") }, { kind: "EDIT", path: "retry.js", version: v2, transaction: editOf(on(4, 9), "n") }), "retry.js")
  expect(back.version).toBe(v1)
  const head: _Head_Document_ = { path: "retry.js", version: v1, proposed: [replacing("T-1", on(4, 5), "round")], stale: [] }
  expect(carriedOf__Head({ document: back, head })).toBe(head)
})

test("Apply makes a head the document: the sources it's told to, your edits and what's accepted, applied, the rest not; recorded as an edit, so another task's head is carried across it; a head not on the document as it is is refused", () => {
  const version = documentIn(opened, "retry.js").version
  const proposed = [replacing("yours", on(4, 5), "round"), replacing("P-1", on(8, 16), "tries")]
  const applied = documentIn(after(opened, { kind: "APPLY", path: "retry.js", version, proposed, sources: ["yours"] }), "retry.js")
  expect([flatOf(applied.text), applied.version, applied.edits.map((edit) => edit.version_From)]).toEqual(["let round = attempts", versionOf("let round = attempts"), [version]])
  const other = carriedOf__Head({ document: applied, head: { path: "retry.js", version, proposed: [replacing("T-2", on(8, 16), "count")], stale: [] } })
  expect([other.proposed[0]?.changes[0]?.range, other.stale]).toEqual([on(12, 20), []])
  expect(after(opened, { kind: "APPLY", path: "retry.js", version, proposed, sources: [] })).toBe(opened)
  expect(() => after(opened, { kind: "APPLY", path: "retry.js", version: versionOf("elsewhere"), proposed, sources: ["yours"] })).toThrow("isn't on retry.js as it is")
})

test("Collect lets go of the copies no open task needs; all still needed, nothing changes", () => {
  const two = after(opened, { kind: "OPEN", path: "README.md", text: textOf("# retry") })
  expect(after(two, { kind: "COLLECT", paths: ["retry.js"] }).documents.map((document) => document.path)).toEqual(["retry.js"])
  expect(after(two, { kind: "COLLECT", paths: ["retry.js", "README.md"] })).toBe(two)
})

test("_Documents_ holds the documents, taking each command, telling its observers only what changed", () => {
  const told: Array<_Model_Documents_> = []
  const documents = new _Documents_({ model_Documents: opened, observers: [{ changed: (model_Documents) => told.push(model_Documents) }] })
  documents.handle({ kind: "OPEN", path: "retry.js", text: textOf("let n = attempts") })
  expect(told).toEqual([])
  documents.handle({ kind: "READ", path: "retry.js", text: textOf("let n = tries") })
  expect([told.length, flatOf(documentIn(documents.model_Documents, "retry.js").text)]).toEqual([1, "let n = tries"])
})
