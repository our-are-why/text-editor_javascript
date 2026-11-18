import { expect, test } from "bun:test"
import { parseModel_TextEditor, type _Changes_Host_, type _Change_Host_, type _Model_TextEditor_ } from "../source/Model_TextEditor.ts"
import { viewModelOf__Model, type _Proposal_Host_ } from "../source/Projection_TextEditor.ts"
import { MODULE_READING_TEXT } from "../source/readings/text.ts"
import { MODULE_PLAINTEXT, type _Range_Lines_, type _ViewModel_TextEditor_, type _Line_Run_, type _Underlay_Text_, type _Run_Lines_ } from "../source/ViewModel_TextEditor.ts"
import { actions_Review } from "../playground/items.ts"
import { model_retry, proposals_retry, ranges_retry, setup_retry } from "../playground/examples/javascript.ts"
import { model_readme, proposals_readme, ranges_readme, setup_readme } from "../playground/examples/markdown.ts"
import { perspective_Markdown } from "../playground/readings.ts"
import { PERSPECTIVE_CHANGES } from "../source/perspectives/changes.ts"
import { changes } from "../playground/documents/changes.ts"
import { proposalsCode } from "../playground/scenes/proposalsCode.ts"
import { proposalsThread } from "../playground/scenes/proposalsThread.ts"
import { proposalsProse } from "../playground/scenes/proposalsProse.ts"

// a model from a document and its changes as a host writes them, the test
// failing, with why, if it's refused
function modelOf(
  multilineText: string,
  proposed: Array<_Changes_Host_>
): _Model_TextEditor_ {
  const result = parseModel_TextEditor({ multilineText, marks: [], proposed })
  if (result.kind === "REFUSED") throw new Error(result.refusals.map((refusal) => `${refusal.source}: ${refusal.reason}`).join("\n"))
  return result.model_TextEditor
}

// a whole line, or lines, replaced, as an agent quotes them and writes what
// they become
function linesOf(
  multilineText: string,
  first: number,
  last: number,
  next: string
): _Change_Host_ {
  const lines = multilineText.split("\n")
  return { kind: "REPLACE", range: { from: { line: first, offset: 0 }, to: { line: last, offset: (lines[last] ?? "").length } }, multilineText: next, marks: [] }
}

// what the playground, as host, says of a proposal
function proposalOf(
  source: string,
  title: string,
  rationale: string
): _Proposal_Host_ {
  return { source, title, state: "OPEN", status: "", rationale, requests: [], actions: actions_Review, attributes: {} }
}

const round = proposalOf("round", "Call the attempt counter round", "n says nothing; round says what it counts.")
// a span of text, from one position to another, and what it becomes
function spanOf(
  from: [number, number],
  to: [number, number],
  next: string
): _Change_Host_ {
  return { kind: "REPLACE", range: { from: { line: from[0], offset: from[1] }, to: { line: to[0], offset: to[1] } }, multilineText: next, marks: [] }
}

// a view model as text, for its snapshot: every field of it, a line of text
// for each line drawn, and under it where its text is from, each stretch of
// it the document's or a change's, from a line and a character in it, and
// where it's drawn in the line; its rings after its lines, its list after
// its runs.
// Run ids, and each proposal's places, are numbered as they come, as what a
// scene calls them is no part of what's drawn. A field it doesn't know is a
// mistake in it, and throws, so nothing's left out unseen
function drawnAs(
  viewModel: _ViewModel_TextEditor_
): string {
  const ids = new Map<string, string>()
  const places = new Map<string, string>()
  const idOf = (id: string) => {
    if (!ids.has(id)) ids.set(id, `run ${ids.size + 1}`)
    return ids.get(id)
  }
  const placeOf = (source: string, place: string) => {
    const key = `${source} ${place}`
    if (!places.has(key)) places.set(key, String([...places.keys()].filter((each) => each.startsWith(`${source} `)).length + 1))
    return places.get(key)
  }
  // an object's fields, each one it's known to have, or a mistake
  const known = (object: object, fields: Array<string>, what: string) => {
    for (const field of Object.keys(object)) if (!fields.includes(field)) throw new Error(`a ${what} has a field the snapshot doesn't draw: ${field}`)
  }
  const attributesOf = (attributes: Record<string, string>) => {
    const entries = Object.entries(attributes).toSorted(([one], [other]) => one.localeCompare(other))
    return entries.length === 0 ? "" : `{${entries.map(([name, value]) => `${name}=${name === "data-place" ? placeOf(attributes["data-source"] ?? "", value) : value}`).join(" ")}}`
  }
  // an item as JSON, its fields in order of their names, as the order a
  // host writes them in is no part of what it says
  const sortedOf = (item: object) => JSON.stringify(item, (_, value: unknown) => value !== null && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).toSorted(([one], [other]) => one.localeCompare(other))) : value)
  const lineOf = (line: _Line_Run_) => {
    known(line, ["gutter", "note", "segments", "origins"], "line")
    for (const origin of line.origins) known(origin, ["from", "to", "id_Text", "position"], "origin")
    known(line.gutter, ["label", "marker", "pointed"], "gutter")
    if (line.note !== null) known(line.note, ["label", "target"], "note")
    for (const segment of line.segments) known(segment, ["text", "attributes"], "segment")
    const note = line.note === null ? "" : ` (${line.note.label} → ${line.note.target.source} ${line.note.target.side})`
    const origins = line.origins.map((origin) => `${origin.id_Text.kind === "DOCUMENT" ? "document" : `${origin.id_Text.source}#${origin.id_Text.index}`} ${origin.position.line}:${origin.position.offset} [${origin.from},${origin.to})`).join(" | ")
    return [
      `    ${JSON.stringify(line.gutter.label)} ${line.gutter.marker} ${line.gutter.pointed}${note}: ${line.segments.map((segment) => `${JSON.stringify(segment.text)}${attributesOf(segment.attributes)}`).join(" ")}`,
      `      ⟵ ${origins}`
    ]
  }
  const underlayOf = (underlay: _Underlay_Text_) => {
    const attributes = attributesOf(underlay.attributes)
    if (underlay.kind === "STRETCH") {
      known(underlay, ["kind", "from", "to", "attributes"], "ring")
      return `      STRETCH ${underlay.from.line}:${underlay.from.offset}-${underlay.to.line}:${underlay.to.offset} ${attributes}`
    }
    if (underlay.kind === "POINT") {
      known(underlay, ["kind", "at", "attributes"], "notch")
      return `      POINT ${underlay.at.line}:${underlay.at.offset} ${attributes}`
    }
    known(underlay, ["kind", "line", "attributes"], "notch")
    return `      BOUNDARY ${underlay.line} ${attributes}`
  }
  const runOf = (kind: string, run: _Run_Lines_) => {
    known(run, ["id", "lines", "groups"], "run")
    for (const group of run.groups) known(group, ["attributes", "underlays"], "group")
    return [
      `  ${kind} ${idOf(run.id)}`,
      ...run.lines.flatMap(lineOf),
      ...run.groups.flatMap((group) => [`    ring ${attributesOf(group.attributes)}`, ...group.underlays.map(underlayOf)])
    ]
  }
  known(viewModel, ["charCount_Max__Label_Gutter", "blocks", "runs", "selection", "menu", "request"], "view model")
  if (viewModel.selection !== null) throw new Error("the projection draws no selection; the viewer does, from its state")
  if (viewModel.menu !== null || viewModel.request !== null) throw new Error("the projection draws no menu or request; the viewer does, from its state")
  return [
    `label width ${viewModel.charCount_Max__Label_Gutter}`,
    ...viewModel.blocks.flatMap((block) => {
      if (block.kind === "LINES") {
        known(block, ["kind", "run"], "block")
        return runOf("LINES", block.run)
      }
      if (block.kind === "FOLDED") {
        known(block, ["kind", "range", "run"], "block")
        return [`FOLDED ${block.range.first}-${block.range.last}`, ...runOf("FOLDED", block.run)]
      }
      known(block, ["kind", "range", "parts"], "block")
      return [
        `FRAME ${block.range.first}-${block.range.last}`,
        ...block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST"
          ? [`  PROPOSAL_LIST`, ...part.items.map((item) => `    ${sortedOf(item)}`)]
          : runOf(part.kind, part.run))
      ]
    })
  ].join("\n")
}

// the runs a view model lists beside its blocks: the runs in its blocks,
// the same ones, in the same order
function runsIn(
  viewModel: _ViewModel_TextEditor_
): Array<_Run_Lines_> {
  return viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? [] : [part.run]) : [block.run])
}

test("frames are the lines changes touch, run together only where they share a line, so frames back to back stay two; a host's range joins the frames it shares a line with, and widens them, but makes none where nothing changes, and never cuts a change", () => {
  const text = "a\nb\nc\nd\ne"
  const framesOf = (proposed: Array<_Changes_Host_>, ranges_Frame: Array<_Range_Lines_>) => viewModelOf__Model({
    model_TextEditor: modelOf(text, proposed),
    proposals: [proposalOf("one", "One", ""), proposalOf("other", "Other", "")],
    ranges_Frame,
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  }).blocks.flatMap((block) => block.kind === "FRAME" ? [`${block.range.first}-${block.range.last}`] : [])
  const backToBack: Array<_Changes_Host_> = [{ source: "one", changes: [linesOf(text, 1, 1, "B")] }, { source: "other", changes: [linesOf(text, 2, 2, "C")] }]
  expect(framesOf(backToBack, [])).toEqual(["2-2", "3-3"])
  expect(framesOf(backToBack, [{ first: 2, last: 3 }])).toEqual(["2-3"])
  expect(framesOf(backToBack, [{ first: 1, last: 4 }])).toEqual(["1-4"])
  expect(framesOf(backToBack, [{ first: 5, last: 5 }])).toEqual(["2-2", "3-3"])
  expect(framesOf([{ source: "one", changes: [linesOf(text, 1, 2, "B\nC")] }], [{ first: 3, last: 3 }])).toEqual(["2-3"])
})

test("lines put in at a frame's first line's start, or at its last line's end, are the frame's, as proposed, where they were typed; ones put in by a line no frame holds are a frame of their own, named for that line, so no two runs share a name", () => {
  const text = "a\nb\nc\nd\ne"
  const drawnWith = (insert: _Change_Host_) => {
    const viewModel = viewModelOf__Model({
      model_TextEditor: modelOf(text, [{ source: "one", changes: [spanOf([1, 0], [1, 1], "B")] }, { source: "other", changes: [insert] }]),
      proposals: [proposalOf("one", "One", ""), proposalOf("other", "Other", "")],
      ranges_Frame: [],
      module_Language: MODULE_PLAINTEXT,
      module_Reading: MODULE_READING_TEXT
    })
    return viewModel.runs.filter((run_Lines) => run_Lines.id.startsWith("frame")).map((run_Lines) => `${run_Lines.id} ${run_Lines.lines.map((line_Run) => line_Run.segments.map((segment) => segment.text).join("")).join("/")}`)
  }
  expect(drawnWith(spanOf([1, 0], [1, 0], "x\n"))).toEqual(["frame-2-current b", "frame-2-proposed x/B"])
  expect(drawnWith(spanOf([1, 0], [1, 0], "\n"))).toEqual(["frame-2-current b", "frame-2-proposed /B"])
  expect(drawnWith(spanOf([1, 1], [1, 1], "\ny"))).toEqual(["frame-2-current b", "frame-2-proposed B/y"])
  expect(drawnWith(spanOf([2, 1], [2, 1], "\nz"))).toEqual(["frame-2-current b", "frame-2-proposed B", "frame-3-proposed z"])
})

test("a change inside another's span, where the other keeps its words, is no condition of it: on the lines as proposed it's in the other's text, ringed as its own, and its item says nothing of the other", () => {
  const line = "      if (n === attempts) break;"
  const viewModel = viewModelOf__Model({
    model_TextEditor: modelOf(line, [
      { source: "loop", changes: [linesOf(line, 0, 0, "      if (n === attempts) return;")] },
      { source: "round", changes: [spanOf([0, 10], [0, 11], "round")] }
    ]),
    proposals: [proposalOf("loop", "Return, don't break", ""), round],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const frame = viewModel.blocks.find((block) => block.kind === "FRAME")
  const parts = frame?.kind === "FRAME" ? frame.parts : []
  const proposed = parts.find((part) => part.kind === "PROPOSAL_LINES")
  const list = parts.find((part) => part.kind === "PROPOSAL_LIST")
  expect(proposed?.kind === "PROPOSAL_LINES" ? proposed.run.lines.map((each) => each.segments.map((segment) => `${segment.attributes["data-source"] ?? "-"}:${segment.text}`).join("|")) : []).toEqual(["-:      if (|round:round|-: === attempts) |loop:return|-:;"])
  expect(list?.kind === "PROPOSAL_LIST" ? list.items.map((item) => `${item.source} ${item.places.kind}`) : []).toEqual(["loop NONE", "round NONE"])
})

test("a change inside words another restyles is no condition of it either, as the other keeps them: on the lines as proposed it's in the other's text, and the other's ring goes round what's left of them", () => {
  const line = "one two three"
  const viewModel = viewModelOf__Model({
    model_TextEditor: modelOf(line, [
      { source: "bold", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 13 } }, multilineText: line, marks: [{ range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 13 } }, data: { "data-marks": "bold" } }] }] },
      { source: "digit", changes: [spanOf([0, 4], [0, 7], "2")] }
    ]),
    proposals: [proposalOf("bold", "Stress the last two", ""), proposalOf("digit", "Write two as a digit", "")],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const frame = viewModel.blocks.find((block) => block.kind === "FRAME")
  const parts = frame?.kind === "FRAME" ? frame.parts : []
  const proposed = parts.find((part) => part.kind === "PROPOSAL_LINES")
  const list = parts.find((part) => part.kind === "PROPOSAL_LIST")
  expect(proposed?.kind === "PROPOSAL_LINES" ? proposed.run.lines.map((each) => each.segments.map((segment) => `${segment.attributes["data-source"] ?? "-"}:${segment.text}`).join("|")) : []).toEqual(["-:one |digit:2|bold: three"])
  expect(list?.kind === "PROPOSAL_LIST" ? list.items.map((item) => `${item.source} ${item.places.kind}`) : []).toEqual(["bold NONE", "digit NONE"])
})

// what the editor draws of the JavaScript example, and of each of the
// changes document's cases: each what was drawn by hand before the editor
// drew it, kept when it was, but for a removal's notch right after a
// replacement's ring, which the hand-drawn cases' stand-in for the
// projection put before the ring, counting only the text left unchanged,
// and which is after it, where the words taken out were
// each example as the editor draws it, put together as the example puts it:
// the JavaScript one in its one perspective, the editor's changes; the
// Markdown one in that, and read as Markdown
const viewModel_retry = viewModelOf__Model({ model_TextEditor: model_retry, proposals: proposals_retry, ranges_Frame: ranges_retry, module_Language: setup_retry.module_Language, module_Reading: setup_retry.perspectives[0].module_Reading })
const viewModel_readme = viewModelOf__Model({ model_TextEditor: model_readme, proposals: proposals_readme, ranges_Frame: ranges_readme, module_Language: setup_readme.module_Language, module_Reading: PERSPECTIVE_CHANGES.module_Reading })
const viewModel_readme_Markdown = viewModelOf__Model({ model_TextEditor: model_readme, proposals: proposals_readme, ranges_Frame: ranges_readme, module_Language: setup_readme.module_Language, module_Reading: perspective_Markdown.module_Reading })

test("the JavaScript example draws as it was drawn by hand", () => {
  expect(viewModel_retry.runs).toEqual(runsIn(viewModel_retry))
  expect(drawnAs(viewModel_retry)).toMatchSnapshot()
})

// what the editor draws of the Markdown example, drawn by the editor from the
// first, so kept as it was when it was looked over
test("the Markdown example draws as it did when it was looked over", () => {
  expect(viewModel_readme.runs).toEqual(runsIn(viewModel_readme))
  expect(drawnAs(viewModel_readme)).toMatchSnapshot()
})

test("the Markdown example, its changes read as Markdown, draws as it did when it was looked over", () => {
  expect(viewModel_readme_Markdown.runs).toEqual(runsIn(viewModel_readme_Markdown))
  expect(drawnAs(viewModel_readme_Markdown)).toMatchSnapshot()
})

for (const each of changes.sections.flatMap((section) => section.cases)) {
  if (each.viewModel_TextEditor === null) continue
  const viewModel_TextEditor = each.viewModel_TextEditor
  test(`the changes document's ${each.name} draws as it was drawn by hand`, () => {
    expect(viewModel_TextEditor.runs).toEqual(runsIn(viewModel_TextEditor))
    expect(drawnAs(viewModel_TextEditor)).toMatchSnapshot()
  })
}

for (const scene of [proposalsCode, proposalsThread, proposalsProse]) {
  test(`the scene ${scene.name} draws as it was drawn by hand`, () => {
    expect(scene.viewModel_TextEditor.runs).toEqual(runsIn(scene.viewModel_TextEditor))
    expect(drawnAs(scene.viewModel_TextEditor)).toMatchSnapshot()
  })
}

test("what's asked of a proposal: each request listed on its item, the words it's on quoted; the item saying while they're queued, so each can be removed and they can be started, not while they're being revised; and those words underlined where they're proposed, the document's and the proposal's own, each marked requested in its frame's lines as proposed, not as they are", () => {
  const parsed = parseModel_TextEditor({
    multilineText: "one two three",
    marks: [],
    proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 7 } }, multilineText: "2", marks: [] }] }]
  })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const viewModelIn = (state: "REQUESTED" | "REVISING") => viewModelOf__Model({
    model_TextEditor: parsed.model_TextEditor,
    proposals: [{ source: "digit", title: "Write two as a digit", state, status: "", rationale: "", requests: [{ notes: "Both.", selected: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }, { id_Text: { kind: "CHANGE", source: "digit", index: 0 }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }], text: "one 2" } }, { notes: "And this.", selected: null }], actions: actions_Review, attributes: {} }],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const partsOf = (viewModel: _ViewModel_TextEditor_) => viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : [])
  const requestedIn = (viewModel: _ViewModel_TextEditor_, kind: "PROPOSAL_LINES" | "CURRENT_LINES") => partsOf(viewModel).flatMap((part) => part.kind === kind ? part.run.lines.flatMap((line) => line.segments.filter((segment) => "data-requested" in segment.attributes).map((segment): string => segment.text)) : [])
  const requestsIn = (viewModel: _ViewModel_TextEditor_) => partsOf(viewModel).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => [item.isQueued, item.requests]) : [])
  expect(requestedIn(viewModelIn("REQUESTED"), "PROPOSAL_LINES")).toEqual(["one", "2"])
  expect(requestedIn(viewModelIn("REQUESTED"), "CURRENT_LINES")).toEqual([])
  const requests = [{ notes: "Both.", quote: "one 2" }, { notes: "And this.", quote: null }]
  expect(requestsIn(viewModelIn("REQUESTED"))).toEqual([[true, requests]])
  expect(requestsIn(viewModelIn("REVISING"))).toEqual([[false, requests]])
})
