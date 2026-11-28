import { expect, test } from "bun:test"
import fc from "fast-check"
import { segmentsOf__Stretches, parseLines_ViewModel, MODULE_PLAINTEXT, viewModelOf__Blocks, pointedAt__ViewModel, foldedAt__ViewModel, draftingAt__ViewModel, type _Id_Item_, type _Stretch_Line_, type _Module_Language_, type _Group_Underlay_, type _Item_Proposals_ } from "../source/ui/editor/ViewModel_TextEditor.ts"
import { parseTexts_Line } from "../source/core/documents/Model_TextEditor.ts"

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
const itemOf = (source: string): _Item_Proposals_ => ({ source, title: source, state: "OPEN", status: "", label_Effect: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })

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
  expect(marked(pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: "most", place: null, target_Note: null }))).toEqual(["document most pointed", "document all", "current most pointed", "item all", "item most pointed"])
  expect(marked(viewModel)).toEqual(["document most", "document all", "current most", "item all", "item most"])
  expect(pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: null, place: null, target_Note: null })).toBe(viewModel)
})

test("pointing at a note marks its target, the underlays of its proposal on its side, wherever they are, and nothing else: not the other side's, nor another proposal's, nor any group or item", () => {
  const lines = parseLines_ViewModel({ multilineText: "one", module_Language: MODULE_PLAINTEXT })
  const underlayOf = (source: string, side: string) => ({ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 }, attributes: { "data-change": "moved", "data-side": side, "data-source": source } })
  const viewModel = viewModelOf__Blocks([
    { kind: "LINES", run: { id: "document", lines, groups: [{ attributes: { "data-source": "move" }, underlays: [underlayOf("move", "before")] }] } },
    {
      kind: "FRAME",
      range: { first: 2, last: 1 },
      parts: [
        { kind: "PROPOSAL_LINES", run: { id: "proposed", lines, groups: [{ attributes: { "data-source": "move" }, underlays: [underlayOf("move", "after")] }, { attributes: { "data-source": "other" }, underlays: [underlayOf("other", "after")] }] } },
        { kind: "PROPOSAL_LIST", items: [itemOf("move")] },
      ],
    },
  ])
  const pointed = pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: null, place: null, target_Note: { source: "move", side: "after" } })
  expect(pointed.runs.flatMap((run) => run.groups.flatMap((group) => [
    `${run.id} ${group.attributes["data-source"]}${"data-pointed" in group.attributes ? " pointed" : ""}`,
    ...group.underlays.map((underlay) => `${underlay.attributes["data-source"]} ${underlay.attributes["data-side"]}${"data-targeted" in underlay.attributes ? " targeted" : ""}`),
  ]))).toEqual(["document move", "move before", "proposed move", "move after targeted", "proposed other", "other after"])
  expect(pointed.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => Object.keys(item.attributes)) : []) : [])).toEqual([[]])
})

test("pointing at a place of a proposal marks its rings, on both its sides, wherever they are, the one the pointer's on as well, as well as the proposal's groups: not the proposal's other places, nor another's with the same place", () => {
  const lines = parseLines_ViewModel({ multilineText: "one", module_Language: MODULE_PLAINTEXT })
  const underlayOf = (source: string, side: string, place: string) => ({ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 }, attributes: { "data-change": "replaced", "data-side": side, "data-source": source, "data-place": place } })
  const viewModel = viewModelOf__Blocks([{
    kind: "FRAME",
    range: { first: 1, last: 1 },
    parts: [
      { kind: "CURRENT_LINES", run: { id: "current", lines, groups: [{ attributes: { "data-source": "rename" }, underlays: [underlayOf("rename", "before", "1"), underlayOf("rename", "before", "2")] }, { attributes: { "data-source": "other" }, underlays: [underlayOf("other", "before", "1")] }] } },
      { kind: "PROPOSAL_LINES", run: { id: "proposed", lines, groups: [{ attributes: { "data-source": "rename" }, underlays: [underlayOf("rename", "after", "1"), underlayOf("rename", "after", "2")] }] } },
    ],
  }])
  const pointed = pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: "rename", place: { place: "1", side: "before" }, target_Note: null })
  expect(pointed.runs.flatMap((run) => run.groups.flatMap((group) => [
    `${run.id} ${group.attributes["data-source"]}${"data-pointed" in group.attributes ? " pointed" : ""}`,
    ...group.underlays.map((underlay) => `${underlay.attributes["data-source"]} ${underlay.attributes["data-side"]} ${underlay.attributes["data-place"]}${"data-pointed" in underlay.attributes ? " pointed" : ""}${"data-hovered" in underlay.attributes ? " hovered" : ""}`),
  ]))).toEqual(["current rename pointed", "rename before 1 pointed hovered", "rename before 2", "current other", "other before 1", "proposed rename pointed", "rename after 1 pointed", "rename after 2"])
})

test("pointing at a proposal marks the gutters of the lines its changes are on, and of those its place is on more, as the place; the lines it doesn't change, none", () => {
  const lines = parseLines_ViewModel({ multilineText: "one\ntwo\nthree", module_Language: MODULE_PLAINTEXT })
  const underlayOf = (line: number, place: string) => ({ kind: "STRETCH" as const, from: { line, offset: 0 }, to: { line, offset: 3 }, attributes: { "data-change": "replaced", "data-side": "before", "data-source": "rename", "data-place": place } })
  const viewModel = viewModelOf__Blocks([{ kind: "LINES", run: { id: "document", lines, groups: [{ attributes: { "data-source": "rename" }, underlays: [underlayOf(0, "1"), underlayOf(1, "2")] }] } }])
  const gutters = (place: string | null) => pointedAt__ViewModel({ viewModel_TextEditor: viewModel, source: "rename", place: place === null ? null : { place, side: "before" }, target_Note: null }).runs.flatMap((run) => run.lines.map((line) => line.gutter.pointed))
  expect(gutters("1")).toEqual(["place", "proposal", "none"])
  expect(gutters(null)).toEqual(["proposal", "proposal", "none"])
  expect(viewModel.runs.flatMap((run) => run.lines.map((line) => line.gutter.pointed))).toEqual(["none", "none", "none"])
})

test("folding a frame makes it a block of its own, its range and its lines as proposed alone, no rings; one with none proposed folds to none; other frames, and other blocks, as they were; folding none leaves the view model as it was", () => {
  const lines = parseLines_ViewModel({ multilineText: "one\ntwo", module_Language: MODULE_PLAINTEXT })
  const group: _Group_Underlay_ = { attributes: { "data-source": "most" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 }, attributes: { "data-change": "replaced", "data-source": "most" } }] }
  const viewModel = viewModelOf__Blocks([
    { kind: "FRAME", range: { first: 1, last: 1 }, parts: [{ kind: "CURRENT_LINES", run: { id: "one-current", lines, groups: [group] } }, { kind: "PROPOSAL_LINES", run: { id: "one-proposed", lines, groups: [group] } }, { kind: "PROPOSAL_LIST", items: [itemOf("most")] }] },
    { kind: "LINES", run: { id: "between", lines, groups: [] } },
    { kind: "FRAME", range: { first: 3, last: 4 }, parts: [{ kind: "CURRENT_LINES", run: { id: "gone-current", lines, groups: [] } }, { kind: "PROPOSAL_LINES", run: { id: "gone-proposed", lines: [], groups: [] } }] },
    { kind: "FRAME", range: { first: 5, last: 5 }, parts: [{ kind: "CURRENT_LINES", run: { id: "open-current", lines, groups: [] } }] },
  ])
  const folded = foldedAt__ViewModel({ viewModel_TextEditor: viewModel, ranges_Folded: [{ first: 1, last: 1 }, { first: 3, last: 4 }], range_Peeked: null })
  expect(folded.blocks.map((block) => block.kind === "FRAME" ? `FRAME ${block.range.first}-${block.range.last}` : block.kind === "FOLDED" ? `FOLDED ${block.range.first}-${block.range.last}: ${block.run.id}, ${block.run.lines.length} lines, ${block.run.groups.length} groups` : `LINES ${block.run.id}`)).toEqual([
    "FOLDED 1-1: one-proposed, 2 lines, 0 groups",
    "LINES between",
    "FOLDED 3-4: gone-proposed, 0 lines, 0 groups",
    "FRAME 5-5",
  ])
  expect(folded.runs.map((run) => run.id)).toEqual(["one-proposed", "between", "gone-proposed", "open-current"])
  expect(foldedAt__ViewModel({ viewModel_TextEditor: viewModel, ranges_Folded: [], range_Peeked: null })).toBe(viewModel)
})

test("a folded frame's lines carry no notes, a move's saying where it's from hidden with its rings, as review, not the preview; peeked at, its notes back with its rings; an unfolded frame's kept", () => {
  const [line_First, ...lines_Rest] = parseLines_ViewModel({ multilineText: "one\ntwo", module_Language: MODULE_PLAINTEXT })
  if (line_First === undefined) throw new Error("no line")
  const lines = [{ ...line_First, note: { label: "from line 9", target: { source: "move", side: "removed" } } }, ...lines_Rest]
  const viewModel = viewModelOf__Blocks([
    { kind: "FRAME", range: { first: 1, last: 2 }, parts: [{ kind: "PROPOSAL_LINES", run: { id: "folded", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("move")] }] },
    { kind: "FRAME", range: { first: 4, last: 5 }, parts: [{ kind: "PROPOSAL_LINES", run: { id: "open", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("move")] }] }
  ])
  const notesOf = (viewModel_TextEditor: typeof viewModel) => viewModel_TextEditor.runs.map((run) => `${run.id}: ${run.lines.map((line) => line.note?.label ?? "none").join(", ")}`)
  expect(notesOf(foldedAt__ViewModel({ viewModel_TextEditor: viewModel, ranges_Folded: [{ first: 1, last: 2 }], range_Peeked: null }))).toEqual(["folded: none, none", "open: from line 9, none"])
  expect(notesOf(foldedAt__ViewModel({ viewModel_TextEditor: viewModel, ranges_Folded: [{ first: 1, last: 2 }], range_Peeked: { first: 1, last: 2 } }))).toEqual(["folded: from line 9, none", "open: from line 9, none"])
})

test("a folded frame peeked has its rings, all of them, every proposal's; another folded frame, none", () => {
  const lines = parseLines_ViewModel({ multilineText: "one\ntwo", module_Language: MODULE_PLAINTEXT })
  const ring = (from: [number, number], to: [number, number]) => ({ kind: "STRETCH" as const, from: { line: from[0], offset: from[1] }, to: { line: to[0], offset: to[1] }, attributes: {} })
  const groups: Array<_Group_Underlay_> = [
    { attributes: { "data-source": "first" }, underlays: [ring([0, 0], [0, 3]), ring([1, 0], [1, 3])] },
    { attributes: { "data-source": "over" }, underlays: [ring([0, 1], [1, 2])] },
  ]
  const viewModel = viewModelOf__Blocks([
    { kind: "FRAME", range: { first: 1, last: 2 }, parts: [{ kind: "CURRENT_LINES", run: { id: "current", lines, groups } }, { kind: "PROPOSAL_LINES", run: { id: "proposed", lines, groups } }] },
    { kind: "FRAME", range: { first: 4, last: 5 }, parts: [{ kind: "CURRENT_LINES", run: { id: "other-current", lines, groups } }, { kind: "PROPOSAL_LINES", run: { id: "other-proposed", lines, groups } }] },
  ])
  const folded = foldedAt__ViewModel({ viewModel_TextEditor: viewModel, ranges_Folded: [{ first: 1, last: 2 }, { first: 4, last: 5 }], range_Peeked: { first: 1, last: 2 } })
  expect(folded.runs.map((run) => `${run.id}: ${run.groups.map((group) => `${group.attributes["data-source"]} ${group.underlays.length}`).join(", ")}`)).toEqual(["proposed: first 2, over 1", "other-proposed: "])
})

test("each item says where else its proposal's listed, the frame before and the frame after, none past the first or the last, none for one listed once; a folded frame, showing no list, passed over", () => {
  const lines = parseLines_ViewModel({ multilineText: "one", module_Language: MODULE_PLAINTEXT })
  const itemOf = (source: string) => ({ source, title: source, state: "OPEN" as const, status: "", label_Effect: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })
  const viewModel = viewModelOf__Blocks([
    { kind: "FRAME", range: { first: 1, last: 1 }, parts: [{ kind: "CURRENT_LINES", run: { id: "one", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round"), itemOf("cap")] }] },
    { kind: "FRAME", range: { first: 3, last: 3 }, parts: [{ kind: "CURRENT_LINES", run: { id: "three", lines, groups: [] } }, { kind: "PROPOSAL_LINES", run: { id: "three-proposed", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round")] }] },
    { kind: "FRAME", range: { first: 5, last: 5 }, parts: [{ kind: "CURRENT_LINES", run: { id: "five", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round")] }] },
  ])
  const neighborsOf = (viewModel_Neighbored: typeof viewModel) => viewModel_Neighbored.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => `${block.range.first} ${item.source}: ${item.neighbors.range_Previous?.first ?? "-"} ${item.neighbors.range_Next?.first ?? "-"}`) : []) : [])
  expect(neighborsOf(viewModel)).toEqual(["1 round: - 3", "1 cap: - -", "3 round: 1 5", "5 round: 3 -"])
  expect(neighborsOf(foldedAt__ViewModel({ viewModel_TextEditor: viewModel, ranges_Folded: [{ first: 3, last: 3 }], range_Peeked: null }))).toEqual(["1 round: - 5", "1 cap: - -", "5 round: 1 -"])
})

test("each item you're drafting notes in, of one proposal in one frame, says so, however many there are; that proposal's item in another frame, the frame's other items, and every item while none is drafted, don't", () => {
  const lines = parseLines_ViewModel({ multilineText: "one", module_Language: MODULE_PLAINTEXT })
  const itemOf = (source: string) => ({ source, title: source, state: "OPEN" as const, status: "", label_Effect: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })
  const viewModel = viewModelOf__Blocks([
    { kind: "FRAME", range: { first: 1, last: 1 }, parts: [{ kind: "CURRENT_LINES", run: { id: "first", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round"), itemOf("cap")] }] },
    { kind: "LINES", run: { id: "between", lines, groups: [] } },
    { kind: "FRAME", range: { first: 3, last: 3 }, parts: [{ kind: "CURRENT_LINES", run: { id: "second", lines, groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round")] }] },
  ])
  const drafted = (items_Drafted: Array<_Id_Item_>) => draftingAt__ViewModel({ viewModel_TextEditor: viewModel, items_Drafted }).blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => `${block.range.first} ${item.source}${item.isDrafting ? " drafting" : ""}`) : []) : [])
  expect(drafted([{ source: "round", range_Frame: { first: 3, last: 3 } }])).toEqual(["1 round", "1 cap", "3 round drafting"])
  expect(drafted([{ source: "cap", range_Frame: { first: 1, last: 1 } }, { source: "round", range_Frame: { first: 3, last: 3 } }])).toEqual(["1 round", "1 cap drafting", "3 round drafting"])
  expect(draftingAt__ViewModel({ viewModel_TextEditor: viewModel, items_Drafted: [] })).toBe(viewModel)
})

test("a proposal's state, its item's, is on its groups and on its words, each run's, for a perspective to show; its item where the host lists it, whatever its state, so deciding it never moves it", () => {
  const [line] = parseLines_ViewModel({ multilineText: "one two", module_Language: MODULE_PLAINTEXT })
  const [segment] = line?.segments ?? []
  if (line === undefined || segment === undefined) throw new Error("the line wasn't parsed")
  const segments = segmentsOf__Stretches({ text: segment.text, stretches: [{ from: 0, to: 3, attributes: { "data-source": "revised" } }, { from: 4, to: 7, attributes: { "data-source": "open" } }] })
  const itemIn = (source: string, state: _Item_Proposals_["state"]): _Item_Proposals_ => ({ ...itemOf(source), state })
  const viewModel = viewModelOf__Blocks([{
    kind: "FRAME",
    range: { first: 1, last: 1 },
    parts: [
      { kind: "CURRENT_LINES", run: { id: "current", lines: [{ ...line, segments }], groups: [groupOf("revised"), groupOf("open")] } },
      { kind: "PROPOSAL_LIST", items: [itemIn("accepted", "ACCEPTED"), itemIn("revised", "REVISING"), itemIn("rejected", "REJECTED"), itemIn("open", "OPEN"), itemIn("withdrawn", "WITHDRAWN"), itemIn("requested", "REQUESTED")] },
    ],
  }])
  const run = viewModel.runs[0]
  expect(run?.groups.map((group) => group.attributes)).toEqual([{ "data-source": "revised", "data-state": "REVISING" }, { "data-source": "open", "data-state": "OPEN" }])
  expect(run?.lines[0]?.segments.map((segment) => segment.attributes)).toEqual([{ "data-source": "revised", "data-state": "REVISING" }, {}, { "data-source": "open", "data-state": "OPEN" }])
  const list = viewModel.blocks[0]?.kind === "FRAME" ? viewModel.blocks[0].parts.find((part) => part.kind === "PROPOSAL_LIST") : undefined
  expect(list?.kind === "PROPOSAL_LIST" ? list.items.map((item) => item.source) : []).toEqual(["accepted", "revised", "rejected", "open", "withdrawn", "requested"])
})
