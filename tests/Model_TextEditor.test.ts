import { expect, test } from "bun:test"
import fc from "fast-check"
import { parseTexts_Line, type _Changes_Host_, type _Model_TextEditor_, parseModel_TextEditor, type _Range_Text_, textWith__Sources, piecesWith__Sources, type _Step_Transaction_, applied__Transaction, type _Position_Text_, carried__Position, comparisonOf__Texts } from "../source/Model_TextEditor.ts"

// every line break a text can hold: each ends a line, "\r\n" as one
const lineBreaks = ["\r\n", "\n", "\r", "\v", "\f", "\u0085", "\u2028", "\u2029"]

// a text, as the pieces it's made of: runs of anything but a line break, and
// line breaks, in any order
const pieces = fc.array(
  fc.oneof(
    fc.string({ minLength: 1, unit: "grapheme" }).filter((run) => !lineBreaks.some((lineBreak) => run.includes(lineBreak))),
    fc.constantFrom(...lineBreaks)
  ),
  { maxLength: 30 }
)

// the lines a text's pieces make, worked out from the pieces, not by the
// parser: each break starts a new line, but a "\n" right after a "\r" is the
// "\r\n" that "\r" began, and starts nothing
function linesOf(
  pieces: Array<string>
): Array<string> {
  const lines = [""]
  pieces.forEach((piece, index) => {
    if (!lineBreaks.includes(piece)) lines[lines.length - 1] += piece
    else if (!(piece === "\n" && pieces[index - 1] === "\r")) lines.push("")
  })
  return lines
}

test("a text parses into its lines, each without its line break, and nothing else lost", () => {
  fc.assert(
    fc.property(pieces, (pieces) => {
      const texts: Array<string> = parseTexts_Line(pieces.join(""))
      expect(texts).toEqual(linesOf(pieces))
    }),
    { numRuns: 1000 }
  )
})

// a model from a document and its changes as a host writes them, the test
// failing, with why, if it's refused
function modelOf(
  multilineText: string,
  proposed: Array<_Changes_Host_>
): _Model_TextEditor_ {
  const result = parseModel_TextEditor({ multilineText, proposed })
  if (result.kind === "REFUSED") throw new Error(result.refusals.map((refusal) => `${refusal.source}: ${refusal.reason}`).join("\n"))
  return result.model_TextEditor
}

// what's refused of a document and its changes, each its source and why
function refusalsOf(
  multilineText: string,
  proposed: Array<_Changes_Host_>
): Array<string> {
  const result = parseModel_TextEditor({ multilineText, proposed })
  return result.kind === "REFUSED" ? result.refusals.map((refusal) => `${refusal.source}: ${refusal.reason}`) : []
}

// a span within one line
function on(
  line: number,
  from: number,
  to: number
): _Range_Text_ {
  return { from: { line, offset: from }, to: { line, offset: to } }
}

// the span of a word on a line, its first after `after`, worked out from
// the line's text, so a test says which word, not where it is
function spanOf(
  line: number,
  text: string,
  word: string,
  after = 0
): _Range_Text_ {
  const from = text.indexOf(word, after)
  if (from === -1) throw new Error(`no ${word} in ${text}`)
  return on(line, from, from + word.length)
}

test("a model is the document, and each source's changes in the document's order; a source proposing nothing is left out", () => {
  expect<unknown>(modelOf("one two\nthree", [
    { source: "late", changes: [{ kind: "REPLACE", range: on(1, 0, 5), multilineText: "THREE" }, { kind: "REPLACE", range: on(0, 0, 3), multilineText: "ONE" }] },
    { source: "none", changes: [] }
  ])).toEqual({
    document: { lines: ["one two", "three"] },
    proposed: [{ source: "late", changes: [{ kind: "REPLACE", range: on(0, 0, 3), next: { lines: ["ONE"] } }, { kind: "REPLACE", range: on(1, 0, 5), next: { lines: ["THREE"] } }] }]
  })
})

test("a model's refused, each refusal its source and why: a span outside the document, or backwards; a source's changes overlapping; two sources' the same span, or crossing; a move of nothing, or to where it is, or inside another's span, or landing inside one. One source's change inside another's, a replacement in a replacement or in a move, is nested, not refused", () => {
  const text = "let n = 1;\nn <= attempts"
  const replace = (range: _Range_Text_) => ({ kind: "REPLACE" as const, range, multilineText: "x" })
  expect(refusalsOf(text, [{ source: "far", changes: [replace(on(4, 0, 1))] }])).toEqual(["far: its change at 4:0 to 4:1 isn't inside the document, or ends before it starts"])
  expect(refusalsOf(text, [{ source: "past", changes: [replace(on(0, 0, 11))] }])).toEqual(["past: its change at 0:0 to 0:11 isn't inside the document, or ends before it starts"])
  expect(refusalsOf(text, [{ source: "backwards", changes: [replace(on(0, 5, 2))] }])).toEqual(["backwards: its change at 0:5 to 0:2 isn't inside the document, or ends before it starts"])
  expect(refusalsOf(text, [{ source: "own", changes: [replace(on(0, 4, 6)), replace(on(0, 0, 5))] }])).toEqual(["own: its changes at 0:0 to 0:5 and at 0:4 to 0:6 overlap"])
  expect(refusalsOf(text, [{ source: "one", changes: [replace(on(0, 4, 5))] }, { source: "other", changes: [replace(on(0, 4, 5))] }])).toEqual(["other: its change at 0:4 to 0:5 is the same span as one's"])
  expect(refusalsOf(text, [{ source: "one", changes: [replace(on(0, 0, 6))] }, { source: "other", changes: [replace(on(0, 4, 9))] }])).toEqual(["other: its change at 0:4 to 0:9 crosses one's at 0:0 to 0:6"])
  expect(refusalsOf(text, [{ source: "empty", changes: [{ kind: "MOVE", range: on(0, 2, 2), at: { line: 1, offset: 0 } }] }])).toEqual(["empty: its move at 0:2 to 0:2 moves nothing"])
  expect(refusalsOf(text, [{ source: "still", changes: [{ kind: "MOVE", range: on(0, 0, 5), at: { line: 0, offset: 3 } }] }])).toEqual(["still: its move at 0:0 to 0:5 goes to 0:3, where it is already"])
  expect(refusalsOf(text, [{ source: "outer", changes: [replace(on(0, 0, 10))] }, { source: "inner", changes: [{ kind: "MOVE", range: on(0, 4, 5), at: { line: 1, offset: 0 } }] }])).toEqual(["inner: its move at 0:4 to 0:5 is inside outer's change at 0:0 to 0:10, which a move can't be yet"])
  expect(refusalsOf(text, [{ source: "there", changes: [replace(on(1, 0, 13))] }, { source: "landing", changes: [{ kind: "MOVE", range: on(0, 4, 5), at: { line: 1, offset: 2 } }] }])).toEqual(["landing: its move at 0:4 to 0:5 goes to 1:2, inside there's change at 1:0 to 1:13"])
  expect(refusalsOf(text, [{ source: "outer", changes: [replace(on(0, 0, 10))] }, { source: "inner", changes: [replace(on(0, 4, 5)), replace(on(1, 0, 0))] }])).toEqual([])
  expect(refusalsOf(text, [{ source: "move", changes: [{ kind: "MOVE", range: on(0, 0, 10), at: { line: 1, offset: 13 } }] }, { source: "inner", changes: [replace(on(0, 4, 5))] }])).toEqual([])
})

// a line of the example's doc comment, and the loop's condition, each
// proposal on them as the example draws it: the hook taken out of the
// options, the counter called round wherever it is, the operands of the
// condition swapped, two moves of one source, and the abort checked
const options = " * @param {{ attempts?: number, signal?: AbortSignal, onRetry?: (error: unknown, n: number) => void }} [options]"
const condition = "      if (n === attempts || !isRetryable(error)) break;"
const model_Retry = modelOf(`${options}\n${condition}`, [
  { source: "hook", changes: [{ kind: "REPLACE", range: spanOf(0, options, ", onRetry?: (error: unknown, n: number) => void"), multilineText: "" }] },
  { source: "round", changes: [{ kind: "REPLACE", range: spanOf(0, options, "n", options.indexOf("n: number")), multilineText: "round" }, { kind: "REPLACE", range: spanOf(1, condition, "n"), multilineText: "round" }] },
  { source: "order", changes: [{ kind: "MOVE", range: spanOf(1, condition, "n === attempts"), at: spanOf(1, condition, "!isRetryable(error)").to }, { kind: "MOVE", range: spanOf(1, condition, "!isRetryable(error)"), at: spanOf(1, condition, "n === attempts").from }] },
  { source: "aborted", changes: [{ kind: "REPLACE", range: on(1, condition.indexOf(") break"), condition.indexOf(") break")), multilineText: " || signal?.aborted" }] }
])

test("the document with some sources' changes applied: each its own; one inside another's removal gone with it, where both are; one inside a move carried where it lands; two at one point, the move's landing first", () => {
  const linesWith = (sources: Array<string>): Array<string> => textWith__Sources({ model_TextEditor: model_Retry, sources }).lines
  expect(linesWith([])).toEqual([options, condition])
  expect(linesWith(["hook"])).toEqual([" * @param {{ attempts?: number, signal?: AbortSignal }} [options]", condition])
  expect(linesWith(["round"])).toEqual([options.replace("n: number", "round: number"), condition.replace("(n ===", "(round ===")])
  expect(linesWith(["hook", "round"])).toEqual([" * @param {{ attempts?: number, signal?: AbortSignal }} [options]", condition.replace("(n ===", "(round ===")])
  expect(linesWith(["order"])).toEqual([options, "      if (!isRetryable(error) || n === attempts) break;"])
  expect(linesWith(["order", "round", "aborted"])).toEqual([options.replace("n: number", "round: number"), "      if (!isRetryable(error) || round === attempts || signal?.aborted) break;"])
})

test("the document with some sources' changes applied, as pieces, each saying whose text it is: the document's, wherever a move puts it, saying where in the document it's from; or a change's, saying which", () => {
  const pieces = piecesWith__Sources({ model_TextEditor: model_Retry, sources: ["order", "round", "aborted"], range: { from: { line: 1, offset: 0 }, to: { line: 1, offset: condition.length } } })
  expect(pieces.map((piece) => `${piece.kind === "CHANGE" ? `${piece.source} ${piece.index}` : "document"} ${JSON.stringify(piece.text)}`)).toEqual([
    'document "      if ("',
    'document "!isRetryable(error)"',
    'document " || "',
    'round 1 "round"',
    'document " === attempts"',
    'aborted 0 " || signal?.aborted"',
    'document ") break;"'
  ])
  expect(pieces[1]?.range).toEqual(spanOf(1, condition, "!isRetryable(error)"))
})

test("lines moved, the changes inside them carried with them, at either end of the move, or none", () => {
  const model_TextEditor = modelOf("retry()\nfunction sleep(ms) {\n  return ms;\n}\n", [
    { source: "sleep", changes: [{ kind: "MOVE", range: { from: { line: 1, offset: 0 }, to: { line: 4, offset: 0 } }, at: { line: 0, offset: 0 } }] },
    { source: "delay", changes: [{ kind: "REPLACE", range: on(1, 15, 17), multilineText: "delayMs" }, { kind: "REPLACE", range: on(2, 9, 11), multilineText: "delayMs" }] }
  ])
  const linesWith = (sources: Array<string>): Array<string> => textWith__Sources({ model_TextEditor, sources }).lines
  expect(linesWith(["sleep"])).toEqual(["function sleep(ms) {", "  return ms;", "}", "retry()", ""])
  expect(linesWith(["delay"])).toEqual(["retry()", "function sleep(delayMs) {", "  return delayMs;", "}", ""])
  expect(linesWith(["sleep", "delay"])).toEqual(["function sleep(delayMs) {", "  return delayMs;", "}", "retry()", ""])
})

test("a change inside another's span, where the outer keeps its words, applies inside the outer's text too; where the outer replaces them, only without it", () => {
  const model_TextEditor = modelOf(condition, [
    { source: "keeps", changes: [{ kind: "REPLACE", range: on(0, 0, condition.length), multilineText: condition.replace("break", "return") }] },
    { source: "round", changes: [{ kind: "REPLACE", range: spanOf(0, condition, "n"), multilineText: "round" }] }
  ])
  expect<Array<string>>(textWith__Sources({ model_TextEditor, sources: ["keeps", "round"] }).lines).toEqual(["      if (round === attempts || !isRetryable(error)) return;"])
  expect<Array<string>>(textWith__Sources({ model_TextEditor, sources: ["keeps"] }).lines).toEqual(["      if (n === attempts || !isRetryable(error)) return;"])
  const model_Replacing = modelOf(condition, [
    { source: "renames", changes: [{ kind: "REPLACE", range: on(0, 0, condition.length), multilineText: condition.replace("(n ===", "(attempt ===") }] },
    { source: "round", changes: [{ kind: "REPLACE", range: spanOf(0, condition, "n"), multilineText: "round" }] }
  ])
  expect<Array<string>>(textWith__Sources({ model_TextEditor: model_Replacing, sources: ["renames", "round"] }).lines).toEqual([condition.replace("(n ===", "(attempt ===")])
  expect<Array<string>>(textWith__Sources({ model_TextEditor: model_Replacing, sources: ["round"] }).lines).toEqual([condition.replace("(n ===", "(round ===")])
})

const document_Step = modelOf("one two three\nfour", [{ source: "two", changes: [{ kind: "REPLACE", range: on(0, 4, 7), multilineText: "TWO" }] }])
const atDocument = (range: _Range_Text_, multilineText: string): _Step_Transaction_ => ({ kind: "TEXT", id_Text: { kind: "DOCUMENT" }, range, next: { lines: parseTexts_Line(multilineText) } })

test("a step on the document carries every change's span with the text round it: what's typed at a span's edges stays out of it; and the transaction that undoes it gives back the model as it was", () => {
  const cases: Array<[_Step_Transaction_, Array<string>, _Range_Text_]> = [
    [atDocument(on(0, 4, 4), "X"), ["one Xtwo three", "four"], on(0, 5, 8)],
    [atDocument(on(0, 7, 7), "Y"), ["one twoY three", "four"], on(0, 4, 7)],
    [atDocument(on(0, 0, 0), "zero\n"), ["zero", "one two three", "four"], on(1, 4, 7)],
    [atDocument({ from: { line: 0, offset: 13 }, to: { line: 1, offset: 4 } }, ""), ["one two three"], on(0, 4, 7)],
    [atDocument(on(0, 0, 3), "an\nother"), ["an", "other two three", "four"], on(1, 6, 9)]
  ]
  for (const [step, lines, range] of cases) {
    const applied = applied__Transaction({ model_TextEditor: document_Step, transaction: { steps: [step] } })
    expect<Array<string>>(applied.model_TextEditor.document.lines).toEqual(lines)
    expect(applied.model_TextEditor.proposed[0]?.changes[0]?.range).toEqual(range)
    expect(applied__Transaction({ model_TextEditor: applied.model_TextEditor, transaction: applied.transaction_Inverse }).model_TextEditor).toEqual(document_Step)
  }
})

test("a step in what a change proposes edits that text alone, the document and the change's span as they were; a transaction's steps apply in order, and its inverse undoes them all; a step outside its text, or setting a change that isn't there, or to one outside the document, throws", () => {
  const atChange = (range: _Range_Text_, multilineText: string): _Step_Transaction_ => ({ kind: "TEXT", id_Text: { kind: "CHANGE", source: "two", index: 0 }, range, next: { lines: parseTexts_Line(multilineText) } })
  const applied = applied__Transaction({ model_TextEditor: document_Step, transaction: { steps: [atChange(on(0, 3, 3), "S"), atDocument(on(1, 4, 4), "!")] } })
  expect<unknown>(applied.model_TextEditor).toEqual({
    document: { lines: ["one two three", "four!"] },
    proposed: [{ source: "two", changes: [{ kind: "REPLACE", range: on(0, 4, 7), next: { lines: ["TWOS"] } }] }]
  })
  expect(applied__Transaction({ model_TextEditor: applied.model_TextEditor, transaction: applied.transaction_Inverse }).model_TextEditor).toEqual(document_Step)
  expect(() => applied__Transaction({ model_TextEditor: document_Step, transaction: { steps: [atChange(on(0, 4, 4), "!")] } })).toThrow()
  expect(() => applied__Transaction({ model_TextEditor: document_Step, transaction: { steps: [atDocument(on(2, 0, 0), "!")] } })).toThrow()
  expect(() => applied__Transaction({ model_TextEditor: document_Step, transaction: { steps: [{ kind: "CHANGE", source: "none", index: 0, change: { kind: "REPLACE", range: on(0, 0, 0), next: { lines: parseTexts_Line("") } } }] } })).toThrow()
  expect(() => applied__Transaction({ model_TextEditor: document_Step, transaction: { steps: [{ kind: "CHANGE", source: "two", index: 0, change: { kind: "REPLACE", range: on(5, 0, 0), next: { lines: parseTexts_Line("") } } }] } })).toThrow()
})

test("undoing taking text out puts each point where a change puts text in back where it was, though taking it out carried both its ends' to one place; and undoing the undo gives back what taking it out left", () => {
  const model_TextEditor = modelOf("ab cd", [
    { source: "start", changes: [{ kind: "REPLACE", range: on(0, 0, 0), multilineText: "<" }] },
    { source: "end", changes: [{ kind: "REPLACE", range: on(0, 2, 2), multilineText: ">" }] }
  ])
  const pointsOf = (model: _Model_TextEditor_) => model.proposed.map((changes_Source) => `${changes_Source.source} at ${changes_Source.changes[0].range.from.offset}`)
  const applied = applied__Transaction({ model_TextEditor, transaction: { steps: [atDocument(on(0, 0, 2), "")] } })
  expect(pointsOf(applied.model_TextEditor)).toEqual(["start at 0", "end at 0"])
  const undone = applied__Transaction({ model_TextEditor: applied.model_TextEditor, transaction: applied.transaction_Inverse })
  expect(undone.model_TextEditor).toEqual(model_TextEditor)
  expect(applied__Transaction({ model_TextEditor: undone.model_TextEditor, transaction: undone.transaction_Inverse }).model_TextEditor).toEqual(applied.model_TextEditor)
})

// a text of a few letters, spaces and line breaks, so words and lines recur
const text_Short = fc.string({ unit: fc.constantFrom("a", "b", " ", "\n"), maxLength: 16 })

// a position in a text, from its index among the text's characters
function positionAt(
  text: string,
  index: number
): _Position_Text_ {
  const before = text.slice(0, index).split("\n")
  return { line: before.length - 1, offset: (before.at(-1) ?? "").length }
}

test("a step on the document is its text spliced in where the step says; the step that undoes it gives back the model as it was, and undoing that, the model the step left; a change's span apart from the step keeps its text", () => {
  fc.assert(
    fc.property(text_Short, text_Short, fc.nat(), fc.nat(), fc.nat(), fc.nat(), (text, inserted, one, other, span_One, span_Other) => {
      const [from, to] = [one % (text.length + 1), other % (text.length + 1)].toSorted((a, b) => a - b) as [number, number]
      const [span_From, span_To] = [span_One % (text.length + 1), span_Other % (text.length + 1)].toSorted((a, b) => a - b) as [number, number]
      const isApart = to <= span_From || from >= span_To
      const model_TextEditor = modelOf(text, isApart ? [{ source: "span", changes: [{ kind: "REPLACE", range: { from: positionAt(text, span_From), to: positionAt(text, span_To) }, multilineText: "" }] }] : [])
      const applied = applied__Transaction({ model_TextEditor, transaction: { steps: [atDocument({ from: positionAt(text, from), to: positionAt(text, to) }, inserted)] } })
      const text_After = applied.model_TextEditor.document.lines.join("\n")
      expect(text_After).toBe(text.slice(0, from) + inserted + text.slice(to))
      const undone = applied__Transaction({ model_TextEditor: applied.model_TextEditor, transaction: applied.transaction_Inverse })
      expect(undone.model_TextEditor).toEqual(model_TextEditor)
      expect(applied__Transaction({ model_TextEditor: undone.model_TextEditor, transaction: undone.transaction_Inverse }).model_TextEditor).toEqual(applied.model_TextEditor)
      const range = applied.model_TextEditor.proposed[0]?.changes[0]?.range
      if (range === undefined) return
      const indexOf = (position: _Position_Text_) => text_After.split("\n").slice(0, position.line).reduce((index, line) => index + line.length + 1, 0) + position.offset
      expect(text_After.slice(indexOf(range.from), indexOf(range.to))).toBe(text.slice(span_From, span_To))
    }),
    { numRuns: 1000 }
  )
})

test("a position carried through a step: before it, as it was; after it, along with the text; where it puts text in, before or after what's put in, as asked; inside what it takes out, at its start or after what replaces it, as asked", () => {
  const carried = (line: number, offset: number, bias: "BEFORE" | "AFTER") => carried__Position({ position: { line, offset }, range: on(0, 4, 7), next: { lines: parseTexts_Line("X\nYY") }, bias })
  expect(carried(0, 2, "AFTER")).toEqual({ line: 0, offset: 2 })
  expect(carried(0, 9, "BEFORE")).toEqual({ line: 1, offset: 4 })
  expect(carried(2, 3, "BEFORE")).toEqual({ line: 3, offset: 3 })
  expect(carried(0, 7, "BEFORE")).toEqual({ line: 1, offset: 2 })
  expect(carried(0, 4, "AFTER")).toEqual({ line: 0, offset: 4 })
  expect(carried(0, 5, "BEFORE")).toEqual({ line: 0, offset: 4 })
  expect(carried(0, 5, "AFTER")).toEqual({ line: 1, offset: 2 })
  const atPoint = (bias: "BEFORE" | "AFTER") => carried__Position({ position: { line: 0, offset: 4 }, range: on(0, 4, 4), next: { lines: parseTexts_Line("ab") }, bias })
  expect(atPoint("BEFORE")).toEqual({ line: 0, offset: 4 })
  expect(atPoint("AFTER")).toEqual({ line: 0, offset: 6 })
})

test("two texts compared word by word: what's kept, and what's removed, put in or replaced, each word whole", () => {
  const runs = comparisonOf__Texts({ text_Before: { lines: parseTexts_Line("let n = 1; n <= attempts;\nreturn n") }, text_After: { lines: parseTexts_Line("let round = 1; round <= attempts;") } })
  expect(runs.map((run) => [run.kind, run.range_Before, run.range_After])).toEqual([
    ["KEPT", on(0, 0, 4), on(0, 0, 4)],
    ["REPLACED", on(0, 4, 5), on(0, 4, 9)],
    ["KEPT", on(0, 5, 11), on(0, 9, 15)],
    ["REPLACED", on(0, 11, 12), on(0, 15, 20)],
    ["KEPT", on(0, 12, 25), on(0, 20, 33)],
    ["REMOVED", { from: { line: 0, offset: 25 }, to: { line: 1, offset: 8 } }, on(0, 33, 33)]
  ])
})

test("two texts' comparison covers both, in order, what's kept the same in each, nothing kept twice running, what's removed nothing after, what's put in nothing before", () => {
  fc.assert(
    fc.property(text_Short, text_Short, (before, after) => {
      const runs = comparisonOf__Texts({ text_Before: { lines: parseTexts_Line(before) }, text_After: { lines: parseTexts_Line(after) } })
      const indexIn = (text: string) => (position: _Position_Text_) => text.split("\n").slice(0, position.line).reduce((index, line) => index + line.length + 1, 0) + position.offset
      const sliceOf = (text: string, range: _Range_Text_) => text.slice(indexIn(text)(range.from), indexIn(text)(range.to))
      expect(runs.map((run) => sliceOf(before, run.range_Before)).join("")).toBe(before)
      expect(runs.map((run) => sliceOf(after, run.range_After)).join("")).toBe(after)
      for (const [index, run] of runs.entries()) {
        const text_Before = sliceOf(before, run.range_Before)
        const text_After = sliceOf(after, run.range_After)
        if (run.kind === "KEPT") expect(text_Before).toBe(text_After)
        if (run.kind === "KEPT") expect(runs[index + 1]?.kind).not.toBe("KEPT")
        if (run.kind === "REMOVED") expect([text_Before.length > 0, text_After]).toEqual([true, ""])
        if (run.kind === "INSERTED") expect([text_Before, text_After.length > 0]).toEqual(["", true])
        if (run.kind === "REPLACED") expect([text_Before.length > 0, text_After.length > 0]).toEqual([true, true])
      }
    }),
    { numRuns: 1000 }
  )
})

// the text a run covers, in a text as written
function sliceIn(
  text: string,
  range: _Range_Text_
): string {
  const indexOf = (position: _Position_Text_) => text.split("\n").slice(0, position.line).reduce((index, line) => index + line.length + 1, 0) + position.offset
  return text.slice(indexOf(range.from), indexOf(range.to))
}

test("texts over several lines compared by their lines first: a changed line paired with the one it became most alike, its words compared; a line nothing's alike enough to taken out, or put in, whole; and what's kept between, kept", () => {
  const runsOf = (before: string, after: string) => comparisonOf__Texts({ text_Before: { lines: parseTexts_Line(before) }, text_After: { lines: parseTexts_Line(after) } }).map((run) => `${run.kind} ${JSON.stringify(sliceIn(before, run.range_Before))} ${JSON.stringify(sliceIn(after, run.range_After))}`)
  expect(runsOf("  return delay;", "  const capped = Math.min(delay, 30_000);\n  return capped;")).toEqual([
    'INSERTED "" "  const capped = Math.min(delay, 30_000);\\n"',
    'KEPT "  return " "  return "',
    'REPLACED "delay" "capped"',
    'KEPT ";" ";"'
  ])
  expect(runsOf("  const delay = DELAY_MS * 2 ** (n - 1);\n  return delay + Math.random() * (delay / 2);", "  return withJitter(n);")).toEqual([
    'REPLACED "  const delay = DELAY_MS * 2 ** (n - 1);\\n  return delay + Math.random() * (delay / 2);" "  return withJitter(n);"'
  ])
  expect(runsOf("one\ntwo\nthree", "one\nTWO 2\nthree")).toEqual([
    'KEPT "one" "one"',
    'REPLACED "\\ntwo" "\\nTWO 2"',
    'KEPT "\\nthree" "\\nthree"'
  ])
})

test("whole lines moved to a line's start or end keep their lines whole, the line break they bring going to the side that keeps them so: the last line, taking the break before it, put first; the first line, taking the break after it, put last", () => {
  const up = modelOf("const DELAY_MS = 100;\nfunction sleep(ms) {}", [{ source: "sleep", changes: [{ kind: "MOVE", range: { from: { line: 0, offset: 21 }, to: { line: 1, offset: 21 } }, at: { line: 0, offset: 0 } }] }])
  expect<Array<string>>(textWith__Sources({ model_TextEditor: up, sources: ["sleep"] }).lines).toEqual(["function sleep(ms) {}", "const DELAY_MS = 100;"])
  const down = modelOf("a\nb\nc", [{ source: "a", changes: [{ kind: "MOVE", range: { from: { line: 0, offset: 0 }, to: { line: 1, offset: 0 } }, at: { line: 2, offset: 1 } }] }])
  expect<Array<string>>(textWith__Sources({ model_TextEditor: down, sources: ["a"] }).lines).toEqual(["b", "c", "a"])
})
