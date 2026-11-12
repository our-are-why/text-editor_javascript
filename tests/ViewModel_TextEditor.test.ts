import { expect, test } from "bun:test"
import fc from "fast-check"
import { parseTexts_Line, segmentsOf__Stretches, parseLines_ViewModel, MODULE_PLAINTEXT, viewModelOf__Blocks, pointedAt__ViewModel, type _Stretch_Line_, type _Module_Language_, type _Group_Underlay_, type _Item_Proposals_ } from "../source/ViewModel_TextEditor.ts"

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

// a line's text, short, so stretches often share edges and overlap
const text_Line = fc.string({ unit: fc.constantFrom("a", "b", " "), maxLength: 12 }).map((text) => parseTexts_Line(text)[0])

// stretches over it, from overlays of their own, some past its ends, some
// empty or backwards, their data from a small pool, so the same names recur
const stretches = fc.array(
  fc.record({
    from: fc.integer({ min: -2, max: 14 }),
    to: fc.integer({ min: -2, max: 14 }),
    attributes: fc.dictionary(
      fc.constantFrom("data-syntax", "data-marks", "data-source"),
      fc.constantFrom("keyword", "string", "bold", "bold italic", "most"),
      { maxKeys: 2 }
    )
  }),
  { maxLength: 5 }
)

// what a segment from `from` to `to` carries, worked out from the stretches,
// not by the cutting: of each stretch over all of it, every attribute, and
// where stretches give the same one, their values' words together, once each
function attributesOver(
  stretches: Array<_Stretch_Line_>,
  from: number,
  to: number
): Record<string, string> {
  const words: Record<string, Array<string>> = {}
  for (const stretch of stretches) {
    if (stretch.from > from || stretch.to < to) continue
    for (const [name, value] of Object.entries(stretch.attributes)) {
      for (const word of value.split(" ")) if (!(words[name] ?? []).includes(word)) words[name] = [...(words[name] ?? []), word]
    }
  }
  return Object.fromEntries(Object.entries(words).map(([name, each]) => [name, each.join(" ")]))
}

test("a line's text is cut wherever a stretch over it begins or ends, and nowhere else: its segments are the text, in order, none empty, each carrying the data of every stretch over it", () => {
  fc.assert(
    fc.property(text_Line, stretches, (text, stretches) => {
      const segments = segmentsOf__Stretches({ text, stretches })
      const starts = segments.map((_, index) => segments.slice(0, index).reduce((length, each) => length + each.text.length, 0))
      const edges = stretches.flatMap((stretch) => {
        const from = Math.max(0, stretch.from)
        const to = Math.min(text.length, stretch.to)
        return from < to ? [from, to] : []
      })
      expect(segments.map((segment) => segment.text).join("")).toBe(text)
      expect(segments.every((segment) => segment.text !== "")).toBe(true)
      expect(starts.slice(1).toSorted((a, b) => a - b)).toEqual([...new Set(edges)].filter((edge) => edge > 0 && edge < text.length).toSorted((a, b) => a - b))
      segments.forEach((segment, index) => {
        const from = starts[index] ?? 0
        expect(segment.attributes).toEqual(attributesOver(stretches.map((stretch) => ({ ...stretch, from: Math.max(0, stretch.from), to: Math.min(text.length, stretch.to) })).filter((stretch) => stretch.from < stretch.to), from, from + segment.text.length))
      })
    }),
    { numRuns: 1000 }
  )
})

// a language module as small as one can be: what's in square brackets is
// "bracketed", on one line or across several, its state whether a line
// starts inside them; what it's asked kept, to see what the editor asks it
function bracketsModule(
  asked: Array<string>
): _Module_Language_<boolean> {
  return {
    state_Start: false,
    syntaxOf__Line: ({ text, state_Before }) => {
      asked.push(`${JSON.stringify(text)}, ${state_Before ? "inside" : "outside"}`)
      const stretches: Array<_Stretch_Line_> = []
      let inside = state_Before
      let from = 0
      for (const [at, character] of [...text].entries()) {
        if (!inside && character === "[") {
          inside = true
          from = at
        }
        if (inside && character === "]") {
          inside = false
          stretches.push({ from, to: at + 1, attributes: { "data-syntax": "bracketed" } })
        }
      }
      if (inside) stretches.push({ from, to: text.length, attributes: { "data-syntax": "bracketed" } })
      return { stretches, state_After: inside }
    },
  }
}

test("a language module is asked for each line's syntax once, in order, from the state the line before it left, and its stretches cut the line", () => {
  const asked: Array<string> = []
  const lines = parseLines_ViewModel({ multilineText: "a [b\nc d\n\ne] f [g]", module_Language: bracketsModule(asked) })
  expect(asked).toEqual([`"a [b", outside`, `"c d", inside`, `"", inside`, `"e] f [g]", inside`])
  expect(lines.map((line) => [line.gutter.label, ...line.segments.map((segment) => `${segment.text}${segment.attributes["data-syntax"] === undefined ? "" : " *"}`)])).toEqual([
    ["1", "a ", "[b *"],
    ["2", "c d *"],
    ["3"],
    ["4", "e] *", " f ", "[g] *"],
  ])
})

test("plain text's module marks nothing: each line is one segment, its text, carrying nothing, and an empty line none", () => {
  const lines = parseLines_ViewModel({ multilineText: "one\n\ntwo", module_Language: MODULE_PLAINTEXT })
  expect(lines.map((line) => line.segments.map((segment) => [String(segment.text), segment.attributes]))).toEqual([[["one", {}]], [], [["two", {}]]])
})

// a group behind a run, and an item in a list, of a proposal, by its source
const groupOf = (source: string): _Group_Underlay_ => ({ attributes: { "data-source": source }, underlays: [] })
const itemOf = (source: string): _Item_Proposals_ => ({ source, title: source, places: "", rationale: "", actions: [], attributes: {} })

test("pointing at a proposal marks its groups and its items, in every run and list, and nothing else; pointing at none leaves the view model as it was", () => {
  const lines = parseLines_ViewModel({ multilineText: "one", module_Language: MODULE_PLAINTEXT })
  const viewModel = viewModelOf__Blocks([
    { kind: "LINES", run: { id: "document", lines, groups: [groupOf("most"), groupOf("all")] } },
    {
      kind: "FRAME",
      range: { first: 2, last: 2 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "current", lines, groups: [groupOf("most")] } },
        { kind: "PROPOSAL_LIST", items: [itemOf("all"), itemOf("most")] },
      ],
    },
  ])
  const marked = (viewModel_TextEditor: typeof viewModel) => [
    ...viewModel_TextEditor.runs.flatMap((run) => run.groups.map((group) => `${run.id} ${group.attributes["data-source"]}${"data-pointed" in group.attributes ? " pointed" : ""}`)),
    ...viewModel_TextEditor.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => `item ${item.source}${"data-pointed" in item.attributes ? " pointed" : ""}`) : []) : []),
  ]
  expect(marked(pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: "most" }))).toEqual(["document most pointed", "document all", "current most pointed", "item all", "item most pointed"])
  expect(marked(viewModel)).toEqual(["document most", "document all", "current most", "item all", "item most"])
  expect(pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: null })).toBe(viewModel)
})
