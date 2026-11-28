import { expect, test } from "bun:test"
import { _Tasks_ } from "../source/core/tasks/index.ts"
import { _Documents_, parseTexts_Line, flatOf__Text, textWith__Sources, refusalsAcross__Sources, type _Text_Model_, type _Change_ } from "../source/core/documents/index.ts"
import { _Host_ } from "../source/ui/host/index.ts"
import { viewModelOf__Model, MODULE_PLAINTEXT } from "../source/ui/editor/index.ts"
import { MODULE_READING_TEXT } from "../source/ui/editor/readings/text.ts"
import { _Shell_, changesOf__Copy, stampOf__Changes, landingOf__Grouping, type _Grouping_Job_, type _Job_Shell_, type _Landing_Handed_ } from "../source/core/shell/index.ts"

// an agent's working copy as the core sees it: what it's given, each file
// of its task as the task has it; what it changed, numbered, narrowed to
// the words that differ; and its hand back, grouped into proposals, checked
// and mapped onto the file, through your edits, a revision a proposal's next
// version, landed on the task

const TEXT = "const ATTEMPTS = 5;\nconst DELAY_MS = 100;\n\nexport function retry() {}\n"
const textOf = (text: string): _Text_Model_ => ({ lines: parseTexts_Line(text), marks: [] })
const madeOf = (id: string, notes: string) => ({ id, notes, aim: { kind: "DOCUMENT" as const, path: "retry.js", words: { kind: "ALL" as const } } })
const shellMade = () => {
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: () => {}, started: () => {}, stopped: () => {}, landed: () => {} }]
  })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "retry.js", text: textOf(TEXT) })
  return shell
}
const takenOf = (shell: _Shell_, id_Job: string) => {
  shell.handle({ kind: "TAKE", id_Job, note: "starting" })
  const job_Shell = shell.jobOf(id_Job)
  if (job_Shell === undefined || job_Shell.state.kind !== "BEING_WORKED_ON") throw new Error(`${id_Job} isn't taken`)
  return { job_Shell, givens: job_Shell.state.givens }
}
const checkedOf = (shell: _Shell_, job_Shell: _Job_Shell_, text_Copy: string, grouping: (stamp: string) => Omit<_Grouping_Job_, "stamp">) => {
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens[0] : undefined
  const task = shell.taskOf(job_Shell.id_Task)
  if (given === undefined || task === undefined) throw new Error("no given")
  const files = [{ given, text_Copy: textOf(text_Copy) }]
  const stamp = stampOf__Changes({ changes: changesOf__Copy({ files }) })
  return landingOf__Grouping({ task, job_Shell, files, unplaceables: [], grouping: { stamp, ...grouping(stamp) } })
}

test("an agent's changes in its copy, numbered across its files, each narrowed to the words that differ, what was there and what's there now", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { givens } = takenOf(shell, "j-1")
  const changes = changesOf__Copy({ files: [{ given: givens[0]!, text_Copy: textOf(TEXT.replace("= 5;", "= 3;").replace("retry()", "retry(attempt)")) }] })
  expect(changes.map((change) => [change.number, change.path, change.range.from.line + 1, change.before, change.after])).toEqual([[1, "retry.js", 1, "5", "3"], [2, "retry.js", 4, "", "attempt"]])
})

test("handed back grouped, a new proposal lands on the task's head, its changes placed on the file as given, its request answered by it; the file itself unchanged, for review", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { job_Shell } = takenOf(shell, "j-1")
  const checked = checkedOf(shell, job_Shell, TEXT.replace("= 5;", "= 3;"), () => ({ proposals: [{ aim: { kind: "NEW" }, title: "Fewer attempts", why: "Five is too many.", numbers: [1], ids_Request: ["r-1"] }], nothings: [] }))
  expect([checked.issues, checked.reports]).toEqual([[], []])
  shell.handle({ kind: "HAND_BACK", id_Job: "j-1", landing: checked.landing, note: "Done." })
  const task = shell.taskOf("T-1")
  const head = task?.heads.find((head_Each) => head_Each.path === "retry.js")
  const model = { document: shell.documentOf("retry.js").text, proposed: head?.proposed ?? [] }
  expect(task?.proposals.map((proposal) => [proposal.id, proposal.title, proposal.rationale, proposal.decision])).toEqual([["j-1.1", "Fewer attempts", "Five is too many.", "OPEN"]])
  expect(task?.requests.map((request) => request.status)).toEqual([{ kind: "ADDRESSED", answer: { kind: "PROPOSALS", ids_Proposal: ["j-1.1"] } }])
  expect(flatOf__Text(textWith__Sources({ model_TextEditor: model, sources: ["j-1.1"] }))).toBe(TEXT.replace("= 5;", "= 3;"))
  expect(flatOf__Text(shell.documentOf("retry.js").text)).toBe(TEXT)
})

test("a hand back's issues, each said: a stamp that's not the changes', a change in no proposal and one in two, a request unanswered and one that isn't, a proposal without its title or why, and a file it can't place; a request answered with nothing, its why; and reports, never refusals, of a request outside the job answered", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: false, path: "retry.js" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("r-2", "Name it."), isStarting: false, path: "retry.js" })
  shell.handle({ kind: "START", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-1"] }, path: "retry.js" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("r-3", "Later."), isStarting: false, path: "retry.js" })
  const { job_Shell } = takenOf(shell, "j-1")
  const text_Copy = TEXT.replace("= 5;", "= 3;").replace("= 100;", "= 250;")
  const checked_Bad = checkedOf(shell, job_Shell, text_Copy, () => ({ proposals: [{ aim: { kind: "NEW" }, title: "", why: "", numbers: [1, 9], ids_Request: ["r-9"] }], nothings: [] }))
  const task = shell.taskOf("T-1")!
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens[0]! : undefined!
  const checked_Stale = landingOf__Grouping({ task, job_Shell, files: [{ given, text_Copy: textOf(text_Copy) }], unplaceables: [{ path: "notes.md", why: "was made in your copy" }], grouping: { stamp: "old", proposals: [], nothings: [{ id_Request: "r-1", why: "" }] } })
  const checked_Twice = checkedOf(shell, job_Shell, text_Copy, () => ({ proposals: [{ aim: { kind: "NEW" }, title: "One", why: "Why.", numbers: [1, 2], ids_Request: ["r-1"] }, { aim: { kind: "NEW" }, title: "Two", why: "Why.", numbers: [2], ids_Request: ["r-3"] }], nothings: [] }))
  expect(checked_Bad.issues).toEqual([
    "there's no change 9",
    "change 2 is in no proposal",
    "there's no request r-9",
    "request r-1 isn't answered: put it in the answers of the proposal it's answered by, or say why nothing needs to change",
    "a proposal with changes 1, 9 has no title",
    "proposal \"\" doesn't say why"
  ])
  expect(checked_Stale.issues).toEqual([
    "the copy's changed since you asked what you changed, or you've given no stamp: ask what you changed again, and hand back with the stamp it gives",
    "notes.md was made in your copy",
    "change 1 is in no proposal",
    "change 2 is in no proposal",
    "say why request r-1 needs nothing"
  ])
  expect([checked_Twice.issues, checked_Twice.reports]).toEqual([["change 2 is in more than one proposal"], ["request r-3 isn't this job's, so answering it here leaves it as it is"]])
})

// a job's work handed back on a task with changes of its own, the case's
// first job landing them, as given, whatever the editor would draw: yours,
// typed in the task, and proposals, open or accepted, a move among them
const landedBy = (shell: _Shell_, id_Job: string, id_Proposal: string, changes: [_Change_, ...Array<_Change_>]) => {
  shell.handle({ kind: "TAKE", id_Job, note: "" })
  shell.handle({ kind: "HAND_BACK", id_Job, landing: { proposals: [{ id: id_Proposal, path: "retry.js", title: id_Proposal, rationale: "", version: shell.documentOf("retry.js").version, changes, ids_Request: [] }], nothings: [] }, note: "" })
}
const yoursBy = (shell: _Shell_, changes: [_Change_, ...Array<_Change_>]) => shell.handle({ kind: "EDIT", path: "retry.js", transaction: { steps: [{ kind: "SOURCE", source: "yours", changes }] }, mode: { kind: "TASK", id_Task: "T-1", proposed: [{ source: "yours", changes }] } })
const replaceOf = (line: number, from: number, to: number, next: string): _Change_ => ({ kind: "REPLACE", range: { from: { line, offset: from }, to: { line, offset: to } }, next: textOf(next) })
const jobFor = (shell: _Shell_, id_Request: string) => {
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf(id_Request, "Tidy it."), isStarting: true, path: "retry.js" })
  return takenOf(shell, `j-${shell.count_Job}`)
}
const handedOf = (shell: _Shell_, job_Shell: _Job_Shell_, id_Request: string, edit: (text: string) => string) => {
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens[0] : undefined
  if (given === undefined) throw new Error("no given")
  const text_Copy = edit(flatOf__Text(given.text))
  const numbers = changesOf__Copy({ files: [{ given, text_Copy: textOf(text_Copy) }] }).map((change) => change.number)
  const checked = checkedOf(shell, job_Shell, text_Copy, () => ({ proposals: [{ aim: { kind: "NEW" }, title: "Agent's", why: "Why.", numbers, ids_Request: [id_Request] }], nothings: [] }))
  return { checked, clashes: checked.issues.length > 0 ? [] : shell.clashesOf({ id_Task: "T-1", landing: checked.landing }) }
}
const drawableAfter = (shell: _Shell_, job_Shell: _Job_Shell_, landing: _Landing_Handed_) => {
  shell.handle({ kind: "HAND_BACK", id_Job: job_Shell.id, landing, note: "" })
  const head = shell.taskOf("T-1")?.heads.find((head_Each) => head_Each.path === "retry.js")
  return { refusals: refusalsAcross__Sources(head?.proposed ?? []), head, sources_Drawn: sourcesDrawnOf(shell) }
}
// the task as the editor draws it, through the host, as a page would: the
// proposals it lists in its frames
const sourcesDrawnOf = (shell: _Shell_) => {
  const host = new _Host_({ name_Document: "retry.js", target_Mode: { kind: "TASK", id: "T-1" }, files: ["retry.js"], isListening_Agent: false, at: Date.now(), attributes: new Map(), state_Shell: shell.state(), suffix_Id: "", observers: [{ sent: () => {}, opening: () => {}, shown: () => {}, boarded: () => {} }] })
  const update_Host = host.showing()?.update_Host
  if (update_Host === undefined) throw new Error("nothing shown")
  const viewModel = viewModelOf__Model({ ...update_Host, source_Yours: "yours", ranges_Frame: [], module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT })
  return [...new Set(viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => item.source) : []) : []))].toSorted()
}

test("around your edits, as the editor nests: a change taking in the whole of what you typed lands with yours nested in it; one with just your span, which the editor can't draw, refused as a clash; one in part of what you typed refused, as no change goes in another's text", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: false, path: "retry.js" })
  yoursBy(shell, [replaceOf(0, 6, 14, "MAX_ATTEMPTS = 7")])
  const job = jobFor(shell, "r-2")
  const around = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("MAX_ATTEMPTS = 7 = 5", "RETRIES = 3"))
  const same = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("MAX_ATTEMPTS = 7", "TRIES"))
  const part = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("= 7", "= 3"))
  expect(flatOf__Text(job.givens[0]!.text).startsWith("const MAX_ATTEMPTS = 7 = 5;")).toBe(true)
  expect([around.checked.issues, around.clashes, around.checked.landing.proposals[0]?.changes]).toEqual([[], [], [replaceOf(0, 6, 18, "RETRIES = 3")]])
  expect(same.checked.issues).toEqual([])
  expect(same.clashes).toEqual(["proposal \"Agent's\" can't be drawn with the person's own edits on retry.js: one of its changes shares the span of one of theirs, or crosses its edge; a change has to take in another's whole span, or stay apart from it"])
  expect(part.checked.issues).toEqual(["change 1 is in part of the text your edits put in: a change can go around another's text, taking it all in, or stay apart from it, but not change part of it"])
  const drawn = drawableAfter(shell, job.job_Shell, around.checked.landing)
  expect([drawn.refusals, drawn.sources_Drawn]).toEqual([[], ["j-1.1", "yours"]])
})

test("an open proposal, not in the copy, its words the file's there: a change inside its span lands nested, applying only if it's rejected; one crossing its edge, which the editor can't draw, refused as a clash", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  landedBy(shell, "j-1", "p", [replaceOf(0, 6, 18, "TRIES = 3")])
  const job = jobFor(shell, "r-2")
  const inside = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("ATTEMPTS =", "RETRIES ="))
  const crossing = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("const ATTEMPTS", "let TRIES"))
  expect(flatOf__Text(job.givens[0]!.text)).toBe(TEXT)
  expect([inside.checked.issues, inside.clashes]).toEqual([[], []])
  expect(crossing.clashes).toEqual(["proposal \"Agent's\" can't be drawn with proposal \"p\" on retry.js: one of its changes shares the span of one of theirs, or crosses its edge; a change has to take in another's whole span, or stay apart from it"])
  const drawn = drawableAfter(shell, job.job_Shell, inside.checked.landing)
  expect([drawn.refusals, drawn.sources_Drawn]).toEqual([[], ["j-2.1", "p"]])
})

test("an accepted move, in the copy where it lands: a change inside the text it carries lands on that text where the move takes it from, carried by it; one reaching across its edge refused, as it takes in text from two places", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  landedBy(shell, "j-1", "m", [{ kind: "MOVE", range: { from: { line: 3, offset: 0 }, to: { line: 4, offset: 0 } }, at: { line: 0, offset: 0 } }])
  shell.handle({ kind: "DECIDE", id_Task: "T-1", id_Proposal: "m", decision: "ACCEPTED" })
  const job = jobFor(shell, "r-2")
  const inside = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("retry()", "retry(attempt)"))
  const across = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("retry() {}\nconst ATTEMPTS", "retryAttempts"))
  expect(flatOf__Text(job.givens[0]!.text).startsWith("export function retry() {}\nconst ATTEMPTS")).toBe(true)
  expect([inside.checked.issues, inside.clashes, inside.checked.landing.proposals[0]?.changes]).toEqual([[], [], [{ kind: "REPLACE", range: { from: { line: 3, offset: 22 }, to: { line: 3, offset: 22 } }, next: textOf("attempt") }]])
  expect(across.checked.issues).toEqual(["change 2 reaches across the edge of a move, taking in text from two places: change what's moved and what's around it apart"])
  const drawn = drawableAfter(shell, job.job_Shell, inside.checked.landing)
  expect([drawn.refusals, drawn.sources_Drawn]).toEqual([[], ["j-2.1", "m"]])
  expect(flatOf__Text(textWith__Sources({ model_TextEditor: { document: shell.documentOf("retry.js").text, proposed: drawn.head?.proposed ?? [] }, sources: ["m", "j-2.1"] })).startsWith("export function retry(attempt) {}\nconst ATTEMPTS")).toBe(true)
})

test("revising a proposal, its text in the copy in place, a change to it grouped as its revision makes its next version, compared with the file without it, landed in its place, its request answered by it", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const first = takenOf(shell, "j-1")
  const checked_First = checkedOf(shell, first.job_Shell, TEXT.replace("= 5;", "= 3;"), () => ({ proposals: [{ aim: { kind: "NEW" }, title: "Fewer attempts", why: "Five is too many.", numbers: [1], ids_Request: ["r-1"] }], nothings: [] }))
  shell.handle({ kind: "HAND_BACK", id_Job: "j-1", landing: checked_First.landing, note: "" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Two, not three.", aim: { kind: "PROPOSAL", id_Proposal: "j-1.1", words: { kind: "ALL" } } }, isStarting: true, path: "retry.js" })
  const second = takenOf(shell, "j-2")
  const text_Given = flatOf__Text(second.givens[0]!.text)
  const checked = checkedOf(shell, second.job_Shell, text_Given.replace("= 3;", "= 2;"), () => ({ proposals: [{ aim: { kind: "REVISION", id_Proposal: "j-1.1" }, title: "", why: "Two's enough.", numbers: [1], ids_Request: ["r-2"] }], nothings: [] }))
  shell.handle({ kind: "HAND_BACK", id_Job: "j-2", landing: checked.landing, note: "" })
  const task = shell.taskOf("T-1")
  const head = task?.heads.find((head_Each) => head_Each.path === "retry.js")
  expect(text_Given.startsWith("const ATTEMPTS = 3;")).toBe(true)
  expect(checked.issues).toEqual([])
  expect(task?.proposals.map((proposal) => [proposal.id, proposal.title, proposal.rationale])).toEqual([["j-1.1", "Fewer attempts", "Two's enough."]])
  expect(flatOf__Text(textWith__Sources({ model_TextEditor: { document: shell.documentOf("retry.js").text, proposed: head?.proposed ?? [] }, sources: ["j-1.1"] }))).toBe(TEXT.replace("= 5;", "= 2;"))
  expect(task?.requests.find((request) => request.id === "r-2")?.status).toEqual({ kind: "ADDRESSED", answer: { kind: "PROPOSALS", ids_Proposal: ["j-1.1"] } })
})
