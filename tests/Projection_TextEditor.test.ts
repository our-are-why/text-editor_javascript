import { expect, test } from "bun:test"
import { parseModel_TextEditor, type _Changes_Host_, type _Change_Host_, type _Model_TextEditor_ } from "../source/Model_TextEditor.ts"
import { viewModelOf__Model, type _Proposal_Host_, type _Task_Host_, type _Mode_Host_, type _Standing_Task_ } from "../source/Projection_TextEditor.ts"
import { MODULE_READING_TEXT } from "../source/readings/text.ts"
import { MODULE_PLAINTEXT, isLines__Part_Frame, type _State_Task_, type _Header_ViewModel_, type _Decision_Proposal_, type _Status_Request_, type _Piece_Text_, type _Range_Lines_, type _ViewModel_TextEditor_, type _Line_Run_, type _Underlay_Text_, type _Run_Lines_ } from "../source/ViewModel_TextEditor.ts"
import { actions_Review } from "../playground/items.ts"
import { model_retry, proposals_retry, rounds_retry, ranges_retry, setup_retry } from "../playground/examples/javascript.ts"
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
    if (underlay.kind === "UNDERLINE") {
      known(underlay, ["kind", "from", "to", "attributes"], "underline")
      return `      UNDERLINE ${underlay.from.line}:${underlay.from.offset}-${underlay.to.line}:${underlay.to.offset} ${attributes}`
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
  known(viewModel, ["charCount_Max__Label_Gutter", "blocks", "runs", "selection", "menu", "request", "header", "footer"], "view model")
  if (viewModel.selection !== null) throw new Error("the projection draws no selection; the viewer does, from its state")
  if (viewModel.menu !== null || viewModel.request !== null) throw new Error("the projection draws no menu or request; the viewer does, from its state")
  return [
    `label width ${viewModel.charCount_Max__Label_Gutter}`,
    `header ${viewModel.header === null ? "none" : sortedOf(viewModel.header)}`,
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
          : part.kind === "PROPOSAL_HEAD"
            ? [`  PROPOSAL_HEAD ${sortedOf(part)}`]
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
  return viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => isLines__Part_Frame(part) ? [part.run] : []) : [block.run])
}

test("frames are the lines changes touch, run together only where they share a line, so frames back to back stay two; a host's range joins the frames it shares a line with, and widens them, but makes none where nothing changes, and never cuts a change", () => {
  const text = "a\nb\nc\nd\ne"
  const framesOf = (proposed: Array<_Changes_Host_>, ranges_Frame: Array<_Range_Lines_>) => viewModelOf__Model({
    model_TextEditor: modelOf(text, proposed),
    name_Document: "notes/digits.txt",
    proposals: [proposalOf("one", "One", ""), proposalOf("other", "Other", "")],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
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
      name_Document: "notes/digits.txt",
      proposals: [proposalOf("one", "One", ""), proposalOf("other", "Other", "")],
      rounds_Landed: [],
      mode: { kind: "MANUAL" },
      tasks: [],
      files: [],
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
    name_Document: "notes/digits.txt",
    proposals: [proposalOf("loop", "Return, don't break", ""), round],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
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
    name_Document: "notes/digits.txt",
    proposals: [proposalOf("bold", "Stress the last two", ""), proposalOf("digit", "Write two as a digit", "")],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
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
const viewModel_retry = viewModelOf__Model({ model_TextEditor: model_retry, name_Document: "notes/digits.txt", proposals: proposals_retry, rounds_Landed: rounds_retry, mode: { kind: "MANUAL" }, tasks: [], files: [], ranges_Frame: ranges_retry, module_Language: setup_retry.module_Language, module_Reading: setup_retry.perspectives[0].module_Reading })
const viewModel_readme = viewModelOf__Model({ model_TextEditor: model_readme, name_Document: "notes/digits.txt", proposals: proposals_readme, rounds_Landed: [], mode: { kind: "MANUAL" }, tasks: [], files: [], ranges_Frame: ranges_readme, module_Language: setup_readme.module_Language, module_Reading: PERSPECTIVE_CHANGES.module_Reading })
const viewModel_readme_Markdown = viewModelOf__Model({ model_TextEditor: model_readme, name_Document: "notes/digits.txt", proposals: proposals_readme, rounds_Landed: [], mode: { kind: "MANUAL" }, tasks: [], files: [], ranges_Frame: ranges_readme, module_Language: setup_readme.module_Language, module_Reading: perspective_Markdown.module_Reading })

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

const underlinedIn = (run: _Run_Lines_) => run.groups.flatMap((group) => "data-requested" in group.attributes ? group.underlays.flatMap((underlay): Array<string> => underlay.kind === "UNDERLINE" ? [(run.lines[underlay.from.line]?.segments.map((segment) => segment.text).join("") ?? "").slice(underlay.from.offset, underlay.to.offset)] : []) : [])

test("what's asked of a proposal: each request listed on its item, the words it was sent with quoted after what it says, and where they are, the lines of the change they're in, each with its own status, queued or running; the item shown requested while some are queued, revising while one's running, in the editor's words, whatever the host says of it open, decided as the host says; each queued one, and the proposal's, startable only while it's open and no round of it's under way; and the words a request was sent with underlined, behind the text, where they're proposed, the document's and the proposal's own, each in its frame's lines as proposed, not as they are", () => {
  const parsed = parseModel_TextEditor({
    multilineText: "one two three",
    marks: [],
    proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 7 } }, multilineText: "2", marks: [] }] }]
  })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const reference = { pieces: [{ id_Text: { kind: "DOCUMENT" as const }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }, { id_Text: { kind: "CHANGE" as const, source: "digit", index: 0 }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } } }] as [_Piece_Text_, ...Array<_Piece_Text_>], text: "one 2", side: "PROPOSED" as const }
  const viewModelIn = (state: _Decision_Proposal_, status: string, statuses: [_Status_Request_, _Status_Request_]) => viewModelOf__Model({
    model_TextEditor: parsed.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [{ source: "digit", title: "Write two as a digit", state, status, rationale: "", requests: [{ id: "both", notes: "Both.", reference, status: statuses[0] }, { id: "this", notes: "And this.", reference: null, status: statuses[1] }], actions: actions_Review, attributes: {} }],
    rounds_Landed: [],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const partsOf = (viewModel: _ViewModel_TextEditor_) => viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : [])
  const requestedIn = (viewModel: _ViewModel_TextEditor_, kind: "PROPOSAL_LINES" | "CURRENT_LINES") => partsOf(viewModel).flatMap((part) => part.kind === kind ? underlinedIn(part.run) : [])
  const itemsIn = (viewModel: _ViewModel_TextEditor_) => partsOf(viewModel).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => ({ state: item.state, status: item.status, isRunning: item.isRunning, isStartable: item.isStartable, requests: item.requests })) : [])
  const queued = viewModelIn("OPEN", "", ["QUEUED", "QUEUED"])
  expect(requestedIn(queued, "PROPOSAL_LINES")).toEqual(["one", "2"])
  expect(requestedIn(queued, "CURRENT_LINES")).toEqual([])
  expect(itemsIn(queued)).toEqual([{ state: "REQUESTED", status: "Revision requested", isRunning: false, isStartable: true, requests: [{ id: "both", notes: "Both.", reference: { side: "PROPOSED", head: "one 2", size: null, lines: "line 1", peek: null, pieces: reference.pieces }, status: "QUEUED", progress: "queued", isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }, { id: "this", notes: "And this.", reference: null, status: "QUEUED", progress: "queued", isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }] }])
  expect(itemsIn(viewModelIn("OPEN", "", ["RUNNING", "QUEUED"]))).toEqual([{ state: "REVISING", status: "Revising", isRunning: true, isStartable: false, requests: [{ id: "both", notes: "Both.", reference: { side: "PROPOSED", head: "one 2", size: null, lines: "line 1", peek: null, pieces: reference.pieces }, status: "RUNNING", progress: "running", isRunning: true, isStartable: false, isRemovable: false, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }, { id: "this", notes: "And this.", reference: null, status: "QUEUED", progress: "queued", isRunning: false, isStartable: false, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }] }])
  expect(itemsIn(viewModelIn("ACCEPTED", "Accepted", ["QUEUED", "QUEUED"])).map((item) => [item.state, item.status, item.isStartable, item.requests.map((request) => request.isStartable)])).toEqual([["ACCEPTED", "Accepted", false, [false, false]]])
})

test("the header over the document: how many of its proposals are decided, how many requests are queued, how many in progress, each only when there are some, with the host's task, if it gives one; startable while a proposal still open has requests queued and none running; spinning for what's in progress only where the task doesn't already; always there, with only what's decided to say where there's no task and nothing asked; each card asking for a change by Revise once the task's proposals are in front of you, anywhere it touches, or this document's, with no task, and by Add a request till then; for the task's card, its id, why it was canceled, if it was, and its proposals: how far they've got across the documents it touches, and, where it touches more than one, how many, and each of them, the one shown first, the rest in the host's order, its folder and its name apart, how far its own have got, and whether it has nothing left to decide, the one shown counted by the editor, the others as the host counts them, each figure's breakdown, by where each stands, those still open to review, one with revisions queued requested, one being revised revising, the decided by their decisions; what the agent says of this document; and the host's actions for the document beside its actions for the task", () => {
  const parsed = parseModel_TextEditor({
    multilineText: "one two three",
    marks: [],
    proposed: [
      { source: "digit", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 7 } }, multilineText: "2", marks: [] }] },
      { source: "first", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } }, multilineText: "1", marks: [] }] },
      { source: "unseen", changes: [] }
    ]
  })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const task = (state: _State_Task_): _Task_Host_ => ({ id: "tidy", name: "Tidy", state, summary: "Tidies it.", reason: state === "CANCELED" ? "Not needed." : "", documents: [{ name: "digits.txt", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] }, { name: "README.md", counts_Proposals: { OPEN: 2, REQUESTED: 1, REVISING: 0, ACCEPTED: 1, REJECTED: 1, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 1, RUNNING: 0 }, isShown: false, actions: [] }], summary_Document: "Here, the digits.", requests: [], actions: [], actions_Document: [{ command: "accept-here", label: "Accept the ones waiting here", section: "PROPOSALS" }] })
  const header_Task = (state: _State_Task_, label_State: string, figure_Task: { value: string, more: string }, here: { value: string, more: string }) => ({ id: "tidy", name: "Tidy", state, label_State, summary: "Tidies it.", reason: state === "CANCELED" ? "Not needed." : "", proposals: { figure: figure_Task, documents: [{ path: "digits.txt", folder: "", name: "digits.txt", ...here, isShown: true, isDecided: false, label_Open: "Open here", actions: [] }, { path: "README.md", folder: "", name: "README.md", value: "2 of 5 decided", more: "2 to review · 1 revision requested · 1 accepted · 1 rejected", isShown: false, isDecided: false, label_Open: "Open here", actions: [] }], actions: [] }, revisions_Scope: { figure: { value: "1 queued", more: "" }, start_All: { label: "Start all (1)", title: "Starts everything queued in the task, in every file it touches" }, stop_All: null, actions: [] }, revisions_Level: { requests: [], isStartable_Requests: false, isStoppable_Requests: false, ask: { label: "Revise", label_Form: "Revise the task" } } })
  const header_Document = (figure_Here: { value: string, more: string }, value_Revisions: string | null, count_Startable: number, count_Running: number, isTasked: boolean, state: "YOUR_TURN" | "WORKING", label_State: string) => ({ folder: "notes/", name: "digits.txt", state, label_State, summary: isTasked ? "Here, the digits." : "", proposals: { figure: figure_Here, documents: [], actions: isTasked ? [{ command: "accept-here", label: "Accept the ones waiting here", section: "PROPOSALS" as const }] : [] }, revisions_Scope: { figure: value_Revisions === null ? null : { value: value_Revisions, more: "" }, start_All: count_Startable === 0 ? null : { label: `Start all (${count_Startable})`, title: `Starts all ${count_Startable} requests queued in this file, its own and its proposals'` }, stop_All: count_Running === 0 ? null : { label: `Stop all (${count_Running})`, title: `Stops all ${count_Running} running in this file, its own and its proposals', putting them back in the queue` }, actions: [] }, revisions_Level: { requests: [], isStartable_Requests: false, isStoppable_Requests: false, ask: { label: "Revise", label_Form: "Revise this file" } } })
  const MANUAL: _Mode_Host_ = { kind: "MANUAL" }
  const inTask = (task_Host: _Task_Host_): _Mode_Host_ => ({ kind: "TASK", task: task_Host })
  const taskIn = (header: _Header_ViewModel_) => {
    if (header.mode.kind !== "TASK") throw new Error("not in a task")
    return header.mode.task
  }
  const mode_Manual = { kind: "MANUAL" as const, label: "Manual" }
  const switcher_None = { label: "Switch task", label_Here: "this editor", options: [] }
  const picker_None = { label: "Open a file", label_Here: "this editor", sections: [] }
  const picker_Task = (figure_Here: string) => ({ label: "Open a file", label_Here: "this editor", sections: [{ label: "Files in task", files: [{ path: "digits.txt", folder: "", name: "digits.txt", figure: figure_Here, isHere: true }, { path: "README.md", folder: "", name: "README.md", figure: "2 of 5 decided", isHere: false }] }] })
  const headerOf = (statuses_Digit: Array<_Status_Request_>, decision_First: _Decision_Proposal_, mode_Host: _Mode_Host_) => viewModelOf__Model({
    model_TextEditor: parsed.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [
      { source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: statuses_Digit.map((status, index) => ({ id: `digit-${index}`, notes: "Say it.", reference: null, status })), actions: actions_Review, attributes: {} },
      { source: "first", title: "Write one as a digit", state: decision_First, status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} },
      { source: "unseen", title: "Nothing here", state: "OPEN", status: "", rationale: "", requests: [{ id: "unseen-0", notes: "Never drawn.", reference: null, status: "QUEUED" }], actions: actions_Review, attributes: {} }
    ],
    mode: mode_Host,
    tasks: [],
    files: [],
    rounds_Landed: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  }).header
  expect(headerOf([], "OPEN", MANUAL)).toEqual({ mode: mode_Manual, switcher: switcher_None, parts: [{ text: "0 of 2 decided", isBusy: false }], document: header_Document({ value: "0 of 2 decided", more: "2 to review" }, null, 0, 0, false, "YOUR_TURN", "Your turn"), picker: picker_None })
  expect(headerOf([], "ACCEPTED", inTask(task("YOUR_TURN")))).toEqual({ mode: { kind: "TASK", task: header_Task("YOUR_TURN", "Your turn", { value: "3 of 7 decided", more: "3 to review · 1 revision requested · 2 accepted · 1 rejected" }, { value: "1 of 2 decided", more: "1 to review · 1 accepted" }) }, switcher: switcher_None, parts: [], document: header_Document({ value: "1 of 2 decided", more: "1 to review · 1 accepted" }, null, 0, 0, true, "YOUR_TURN", "Your turn"), picker: picker_Task("1 of 2 decided") })
  expect(headerOf(["QUEUED", "QUEUED"], "OPEN", MANUAL)).toEqual({ mode: mode_Manual, switcher: switcher_None, parts: [{ text: "0 of 2 decided", isBusy: false }, { text: "2 requests queued", isBusy: false }], document: header_Document({ value: "0 of 2 decided", more: "1 to review · 1 revision requested" }, "2 queued", 2, 0, false, "YOUR_TURN", "Your turn"), picker: picker_None })
  expect(headerOf(["RUNNING", "QUEUED"], "OPEN", MANUAL)).toEqual({ mode: mode_Manual, switcher: switcher_None, parts: [{ text: "0 of 2 decided", isBusy: false }, { text: "1 request queued", isBusy: false }, { text: "1 running", isBusy: true }], document: header_Document({ value: "0 of 2 decided", more: "1 to review · 1 revising" }, "1 queued · 1 running", 0, 1, false, "WORKING", "Working"), picker: picker_None })
  const task_Open = { value: "2 of 7 decided", more: "4 to review · 1 revision requested · 1 accepted · 1 rejected" }
  const here_Open = { value: "0 of 2 decided", more: "2 to review" }
  expect(taskIn(headerOf([], "OPEN", inTask(task("DRAFT"))))).toEqual(header_Task("DRAFT", "Draft", task_Open, here_Open))
  expect(taskIn(headerOf([], "OPEN", inTask(task("CANCELED"))))).toEqual(header_Task("CANCELED", "Canceled", task_Open, here_Open))
  const parsed_Unproposed = parseModel_TextEditor({ multilineText: "one two three", marks: [], proposed: [] })
  if (parsed_Unproposed.kind === "REFUSED") throw new Error("refused")
  const headerOf_Unproposed = (mode_Host: _Mode_Host_) => viewModelOf__Model({ model_TextEditor: parsed_Unproposed.model_TextEditor, name_Document: "notes/digits.txt", proposals: [], mode: mode_Host, tasks: [], files: [], rounds_Landed: [], ranges_Frame: [], module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT }).header
  const header_Draft = headerOf_Unproposed(inTask({ ...task("DRAFT"), documents: [{ name: "notes/digits.txt", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] }] }))
  expect([taskIn(header_Draft).revisions_Level.ask, header_Draft.document.revisions_Level.ask, headerOf_Unproposed(MANUAL).document.revisions_Level.ask]).toEqual([
    { label: "Add a request", label_Form: "Add a request to the task" },
    { label: "Add a request", label_Form: "Request a change to this file" },
    { label: "Add a request", label_Form: "Request a change to this file" }
  ])
  const header_Elsewhere = headerOf_Unproposed(inTask({ ...task("YOUR_TURN"), documents: [{ name: "notes/digits.txt", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] }, { name: "README.md", counts_Proposals: { OPEN: 1, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: false, actions: [] }] }))
  expect([taskIn(header_Elsewhere).revisions_Level.ask.label, header_Elsewhere.document.revisions_Level.ask.label]).toEqual(["Revise", "Revise"])
  const task_Here: _Task_Host_ = { ...task("YOUR_TURN"), documents: [{ name: "digits.txt", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] }] }
  expect([taskIn(headerOf([], "OPEN", inTask(task_Here))).proposals.figure, taskIn(headerOf([], "OPEN", inTask(task_Here))).proposals.documents]).toEqual([{ value: "0 of 2 decided", more: "2 to review" }, []])
  const task_Spread: _Task_Host_ = {
    ...task("YOUR_TURN"),
    documents: [
      { name: "docs/guide/retries.md", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 2, REJECTED: 1, WITHDRAWN: 1 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: false, actions: [] },
      { name: "source/numbers/digits.txt", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] },
      { name: "CHANGELOG.md", counts_Proposals: { OPEN: 1, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: false, actions: [] }
    ]
  }
  expect(taskIn(headerOf([], "OPEN", inTask(task_Spread))).proposals.documents.map((document_Card) => [document_Card.folder, document_Card.name, document_Card.value, document_Card.isShown, document_Card.isDecided])).toEqual([
    ["source/numbers/", "digits.txt", "0 of 2 decided", true, false],
    ["docs/guide/", "retries.md", "4 of 4 decided", false, true],
    ["", "CHANGELOG.md", "0 of 1 decided", false, false]
  ])
  expect(headerOf(["RUNNING"], "OPEN", inTask(task("WORKING"))).parts).toEqual([])
})

test("a round that landed after your edits: each change of it written before them, its ring marked stale, the others not; its item saying how many, and how many dropped, their text gone, with Run again while it's open and no round of it's under way; none said of a round that landed clean", () => {
  const parsed = parseModel_TextEditor({
    multilineText: "one two three",
    marks: [],
    proposed: [{ source: "digits", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } }, multilineText: "1", marks: [] }, { kind: "REPLACE", range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 7 } }, multilineText: "2", marks: [] }] }]
  })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const viewModelOf = (indexes_Stale: Array<number>, count_Dropped: number, status: _Status_Request_ | null) => viewModelOf__Model({
    model_TextEditor: parsed.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [{ source: "digits", title: "Write them as digits", state: "OPEN", status: "", rationale: "", requests: status === null ? [] : [{ id: "again", notes: "Again.", reference: null, status }], actions: actions_Review, attributes: {} }],
    rounds_Landed: [{ source: "digits", indexes_Stale, count_Dropped }],
    mode: { kind: "MANUAL" },
    tasks: [],
    files: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const staleOf = (viewModel: _ViewModel_TextEditor_) => viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts : []).flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => item.stale) : [])
  const placesStale = (viewModel: _ViewModel_TextEditor_) => [...new Set(viewModel.runs.flatMap((run) => run.groups.flatMap((group) => group.underlays.flatMap((underlay) => "data-stale" in underlay.attributes ? [underlay.attributes["data-place"]] : []))))]
  const landed = viewModelOf([1], 0, null)
  expect(staleOf(landed)).toEqual([{ label: "1 change written before your edits", isRerunnable: true }])
  expect(placesStale(landed)).toEqual(["2"])
  expect(staleOf(viewModelOf([0, 1], 1, null))).toEqual([{ label: "2 changes written before your edits · 1 dropped, its text gone", isRerunnable: true }])
  expect(staleOf(viewModelOf([], 2, "QUEUED"))).toEqual([{ label: "2 dropped, their text gone", isRerunnable: true }])
  expect(staleOf(viewModelOf([1], 0, "RUNNING"))).toEqual([{ label: "1 change written before your edits", isRerunnable: false }])
  expect(staleOf(viewModelOf([], 0, null))).toEqual([null])
  expect(placesStale(viewModelOf([], 0, null))).toEqual([])
})

test("requests' words underlined with one line however many requests are on them: dotted where one is, dashed where more than one overlap, each stretch as long as the words it's on", () => {
  const parsed = parseModel_TextEditor({
    multilineText: "one two three four",
    marks: [],
    proposed: []
  })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const requestOf = (id: string, from: number, to: number) => ({ id, notes: "Say it.", aim: { kind: "DOCUMENT" as const, reference: { pieces: [{ id_Text: { kind: "DOCUMENT" as const }, range: { from: { line: 0, offset: from }, to: { line: 0, offset: to } } }] as [_Piece_Text_, ...Array<_Piece_Text_>], text: "", side: "CURRENT" as const } }, status: "QUEUED" as const, sources_Answering: [] })
  const viewModel = viewModelOf__Model({
    model_TextEditor: parsed.model_TextEditor,
    name_Document: "notes/count.txt",
    proposals: [],
    mode: { kind: "TASK", task: { id: "T-3", name: "Tidy", state: "WORKING", summary: "", requests: [requestOf("a", 0, 7), requestOf("b", 4, 13), requestOf("c", 14, 18), requestOf("d", 14, 18)], reason: "", documents: [], summary_Document: "", actions: [], actions_Document: [] } },
    tasks: [],
    files: [],
    rounds_Landed: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const text = "one two three four"
  expect(viewModel.runs.flatMap((run) => run.groups.flatMap((group) => group.underlays.flatMap((underlay) => underlay.kind === "UNDERLINE" ? [`${text.slice(underlay.from.offset, underlay.to.offset)}|${"data-many" in underlay.attributes ? "dashed" : "dotted"}`] : [])))).toEqual(["one |dotted", "two|dashed", " three|dotted", "four|dashed"])
})

test("a task's own requests, on no proposal, aimed at the whole document or the task itself, with words for reference or none: those aimed here listed for this document, those at the task for the task, the words one's sent with quoted, and where they are while it waits or is under way, not once it's done with, all counted, each startable and removable while it's queued, in progress while it's worked on, and, addressed, saying by how many proposals, or that nothing needed changing; listed in the document's card, counted with the rest, its Start there while one's queued; the words one was sent with underlined, behind the text, while it's waiting or under way, wherever the document's text is drawn, outside frames, and in a frame's lines as they are, where they were selected, not as proposed too", () => {
  const parsed = parseModel_TextEditor({
    multilineText: "one two three\nfour five",
    marks: [],
    proposed: [{ source: "digit", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 4 }, to: { line: 0, offset: 7 } }, multilineText: "2", marks: [] }] }]
  })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const viewModel = viewModelOf__Model({
    model_TextEditor: parsed.model_TextEditor,
    name_Document: "notes/digits.txt",
    proposals: [{ source: "digit", title: "Write two as a digit", state: "OPEN", status: "", rationale: "", requests: [], actions: actions_Review, attributes: {} }],
    mode: {
      kind: "TASK",
      task: {
        id: "count",
        name: "Count them",
        state: "WORKING",
        summary: "",
        requests: [
          { id: "both", notes: "Say what they count.", aim: { kind: "DOCUMENT", reference: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }, { id_Text: { kind: "DOCUMENT" }, range: { from: { line: 1, offset: 0 }, to: { line: 1, offset: 4 } } }], text: "one four", side: "CURRENT" } }, status: "QUEUED", sources_Answering: [] },
          { id: "all", notes: "Number them all.", aim: { kind: "DOCUMENT", reference: null }, status: "RUNNING", sources_Answering: [] },
          { id: "whole", notes: "Tidy it all.", aim: { kind: "TASK", reference: null }, status: "QUEUED", sources_Answering: [] },
          { id: "digit", notes: "Write two as a digit.", aim: { kind: "DOCUMENT", reference: { pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 1, offset: 5 }, to: { line: 1, offset: 9 } } }], text: "five", side: "CURRENT" } }, status: "ADDRESSED", sources_Answering: ["digit"] },
          { id: "none", notes: "Check the rest.", aim: { kind: "DOCUMENT", reference: null }, status: "ADDRESSED", sources_Answering: [] }
        ],
        reason: "",
        documents: [{ name: "count.txt", counts_Proposals: { OPEN: 0, REQUESTED: 0, REVISING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }, counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] }],
        summary_Document: "Counts them here.",
        actions: [],
        actions_Document: [{ command: "accept-here", label: "Accept the ones waiting here", section: "PROPOSALS" }]
      }
    },
    tasks: [],
    files: [],
    rounds_Landed: [],
    ranges_Frame: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT
  })
  const request_Whole = { id: "whole", notes: "Tidy it all.", reference: null, status: "QUEUED" as const, progress: "queued", isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }
  expect(viewModel.header).toEqual({
    mode: {
      kind: "TASK",
      task: {
        id: "count",
        name: "Count them",
        state: "WORKING",
        label_State: "Working",
        summary: "",
        reason: "",
        proposals: { figure: { value: "0 of 1 decided", more: "1 to review" }, documents: [], actions: [] },
        revisions_Scope: {
          figure: { value: "2 queued · 1 running", more: "" },
          start_All: { label: "Start all (2)", title: "Starts everything queued in the task, in every file it touches" },
          stop_All: { label: "Stop all (1)", title: "Stops everything running in the task, in every file it touches, putting it back in the queue" },
          actions: []
        },
        revisions_Level: {
          requests: [request_Whole],
          isStartable_Requests: true,
          isStoppable_Requests: false,
          ask: { label: "Revise", label_Form: "Revise the task" }
        }
      }
    },
    switcher: { label: "Switch task", label_Here: "this editor", options: [] },
    parts: [],
    document: {
      folder: "notes/",
      name: "digits.txt",
      state: "WORKING",
      label_State: "Working",
      summary: "Counts them here.",
      proposals: {
        figure: { value: "0 of 1 decided", more: "1 to review" },
        documents: [],
        actions: [{ command: "accept-here", label: "Accept the ones waiting here", section: "PROPOSALS" }]
      },
      revisions_Scope: {
        figure: { value: "1 queued · 1 running", more: "" },
        start_All: { label: "Start all (1)", title: "Starts all 1 request queued in this file, its own and its proposals'" },
        stop_All: { label: "Stop all (1)", title: "Stops all 1 running in this file, its own and its proposals', putting them back in the queue" },
        actions: []
      },
      revisions_Level: {
        requests: [
          { id: "both", notes: "Say what they count.", reference: { side: "CURRENT", head: "one four", size: null, lines: "lines 1–2", peek: null, pieces: [{ id_Text: { kind: "DOCUMENT" }, range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 3 } } }, { id_Text: { kind: "DOCUMENT" }, range: { from: { line: 1, offset: 0 }, to: { line: 1, offset: 4 } } }] }, status: "QUEUED", progress: "queued", isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false },
          { id: "all", notes: "Number them all.", reference: null, status: "RUNNING", progress: "running", isRunning: true, isStartable: false, isRemovable: false, isEditing: false, isStoppable: true, detail_Progress: null, isDismissable: false },
          { id: "digit", notes: "Write two as a digit.", reference: { side: "CURRENT", head: "five", size: null, lines: null, peek: null, pieces: null }, status: "ADDRESSED", progress: "done", isRunning: false, isStartable: false, isRemovable: false, isEditing: false, isStoppable: false, detail_Progress: "1 proposal", isDismissable: true },
          { id: "none", notes: "Check the rest.", reference: null, status: "ADDRESSED", progress: "done", isRunning: false, isStartable: false, isRemovable: false, isEditing: false, isStoppable: false, detail_Progress: "nothing to change", isDismissable: true }
        ],
        isStartable_Requests: true,
        isStoppable_Requests: true,
        ask: { label: "Revise", label_Form: "Revise this file" }
      }
    },
    picker: { label: "Open a file", label_Here: "this editor", sections: [{ label: "Files in task", files: [{ path: "count.txt", folder: "", name: "count.txt", figure: "0 of 1 decided", isHere: true }] }] }
  })
  expect(viewModel.blocks.map((block) => block.kind === "FRAME" ? block.parts.map((part) => isLines__Part_Frame(part) ? underlinedIn(part.run) : []) : underlinedIn(block.run))).toEqual([[["one"], [], [], []], ["four"]])
})

test("the tasks a host gives: in the header, a switcher listing them, the one the editor's in first, then those on its document, then the rest, then Manual, each its parts, the most pressing of yours, a conflict over the rest, then the agent's, or a draft's requests; in the footer, counted by part, a task under each it has; none given, neither", () => {
  const parsed = parseModel_TextEditor({ multilineText: "one two three", marks: [], proposed: [] })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const standing = (id: string, name: string, state: _State_Task_, isOnDocument: boolean, counts: [number, number, number, number]): _Standing_Task_ => ({ id, name, state, isOnDocument, count_Undecided: counts[0], count_Conflicts: counts[1], count_Queued: counts[2], count_Running: counts[3] })
  const tasks = [
    standing("T-14", "Say what the README promises", "YOUR_TURN", false, [3, 0, 0, 0]),
    standing("T-12", "Tidy the retry loop", "WORKING", true, [14, 0, 8, 3]),
    standing("T-15", "Rename attempts to tries", "YOUR_TURN", true, [2, 1, 0, 0]),
    standing("T-16", "Add a timeout option", "DRAFT", true, [0, 0, 2, 0])
  ]
  const task_Here: _Task_Host_ = { id: "T-12", name: "Tidy the retry loop", state: "WORKING", summary: "", reason: "", documents: [], summary_Document: "", requests: [], actions: [], actions_Document: [] }
  const viewModelIn = (mode_Host: _Mode_Host_, tasks_Given: Array<_Standing_Task_>) => viewModelOf__Model({ model_TextEditor: parsed.model_TextEditor, name_Document: "retry.js", proposals: [], mode: mode_Host, tasks: tasks_Given, files: [], rounds_Landed: [], ranges_Frame: [], module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT })
  const optionsOf = (viewModel: _ViewModel_TextEditor_) => viewModel.header.switcher.options.map((option) => option.kind === "TASK" ? `${option.label} | ${option.parts.map((part) => `${part.kind} ${part.text}`).join(", ")}${option.isHere ? " | here" : ""}` : `${option.label} | ${option.note}${option.isHere ? " | here" : ""}`)
  const inTask = viewModelIn({ kind: "TASK", task: task_Here }, tasks)
  expect(optionsOf(inTask)).toEqual([
    "Tidy the retry loop | YOURS 14 to decide, AGENT 3 running | here",
    "Rename attempts to tries | CONFLICT 1 conflict",
    "Add a timeout option | PLAIN draft, PLAIN 2 requests",
    "Say what the README promises | YOURS 3 to decide",
    "Manual | the file itself"
  ])
  const inManual = viewModelIn({ kind: "MANUAL" }, tasks)
  expect(optionsOf(inManual)).toEqual([
    "Tidy the retry loop | YOURS 14 to decide, AGENT 3 running",
    "Rename attempts to tries | CONFLICT 1 conflict",
    "Add a timeout option | PLAIN draft, PLAIN 2 requests",
    "Say what the README promises | YOURS 3 to decide",
    "Manual | the file itself | here"
  ])
  expect(inManual.header.mode).toEqual({ kind: "MANUAL", label: "Manual" })
  expect(inManual.footer).toEqual({
    title: "4 tasks: 3 need you, 1 conflict, 1 working, 1 draft",
    counts: [{ kind: "YOURS", count: 3 }, { kind: "CONFLICTS", count: 1 }, { kind: "WORKING", count: 1 }, { kind: "DRAFTS", count: 1 }]
  })
  const none = viewModelIn({ kind: "MANUAL" }, [])
  expect([none.header.switcher.options, none.footer]).toEqual([[], { title: "", counts: [] }])
})

test("the files a host gives: in a task, the picker lists the task's files, how far each has got, the one shown here, then the project's others; in manual, the project's files; none given, and no task's, no picker", () => {
  const parsed = parseModel_TextEditor({ multilineText: "one two three", marks: [], proposed: [] })
  if (parsed.kind === "REFUSED") throw new Error("refused")
  const counts = (open: number, accepted: number) => ({ OPEN: open, REQUESTED: 0, REVISING: 0, ACCEPTED: accepted, REJECTED: 0, WITHDRAWN: 0 })
  const task_Here: _Task_Host_ = { id: "T-12", name: "Tidy the retry loop", state: "WORKING", summary: "", reason: "", documents: [{ name: "retry.js", counts_Proposals: counts(0, 0), counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: true, actions: [] }, { name: "README.md", counts_Proposals: counts(4, 2), counts_Requests: { QUEUED: 0, RUNNING: 0 }, isShown: false, actions: [] }], summary_Document: "", requests: [], actions: [], actions_Document: [] }
  const files_Project = ["retry.js", "README.md", "CHANGELOG.md", "source/backoff.js"]
  const pickerIn = (mode_Host: _Mode_Host_, files_Given: Array<string>) => viewModelOf__Model({ model_TextEditor: parsed.model_TextEditor, name_Document: "retry.js", proposals: [], mode: mode_Host, tasks: [], files: files_Given, rounds_Landed: [], ranges_Frame: [], module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT }).header.picker.sections.map((section) => [section.label, ...section.files.map((file) => `${file.folder}|${file.name}${file.figure === "" ? "" : ` ${file.figure}`}${file.isHere ? " here" : ""}`)])
  expect(pickerIn({ kind: "TASK", task: task_Here }, files_Project)).toEqual([
    ["Files in task", "|retry.js here", "|README.md 2 of 6 decided"],
    ["Other files", "|CHANGELOG.md", "source/|backoff.js"]
  ])
  expect(pickerIn({ kind: "MANUAL" }, files_Project)).toEqual([
    ["Files", "|retry.js here", "|README.md", "|CHANGELOG.md", "source/|backoff.js"]
  ])
  expect(pickerIn({ kind: "MANUAL" }, [])).toEqual([])
})
