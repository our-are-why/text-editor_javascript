import { expect, test } from "bun:test"
import {
  _Tasks_,
  modelAfter__Command,
  stateOf__Task,
  countsOf__Task,
  pathsOf__Task,
  type _Model_Tasks_,
  type _Command_Tasks_,
  type _Task_Tasks_,
  type _Stamp_Tasks_,
  type _Aim_Request_Tasks_
} from "../source/tasks/index.ts"
import { parseTexts_Line, type _Head_Document_ } from "../source/documents/index.ts"

const stampAt = (at: string): _Stamp_Tasks_ => ({ at, by: "HUMAN" })
const MODEL_EMPTY: _Model_Tasks_ = { tasks: [] }
const AIM_TASK: _Aim_Request_Tasks_ = { kind: "TASK", words: { kind: "ALL" } }
const aimDocument = (path: string): _Aim_Request_Tasks_ => ({ kind: "DOCUMENT", path, words: { kind: "ALL" } })
const aimProposal = (id_Proposal: string): _Aim_Request_Tasks_ => ({ kind: "PROPOSAL", id_Proposal, words: { kind: "ALL" } })
const after = (model_Tasks: _Model_Tasks_, ...commands: Array<_Command_Tasks_>) => commands.reduce((model, command) => modelAfter__Command({ model_Tasks: model, command }), model_Tasks)
const taskIn = (model_Tasks: _Model_Tasks_, id: string): _Task_Tasks_ => {
  const task = model_Tasks.tasks.find((each) => each.id === id)
  if (task === undefined) throw new Error(`no task ${id}`)
  return task
}
const statusesIn = (model_Tasks: _Model_Tasks_, id: string) => taskIn(model_Tasks, id).requests.map((request) => `${request.id} ${request.status.kind}`)
const drafted = after(MODEL_EMPTY, { kind: "DRAFT", id_Task: "T-1", name: "Tidy the retry loop", request: { id: "r-1", notes: "Keep every error.", aim: AIM_TASK }, stamp: stampAt("1") })

test("a task's made with its first request, staged, as a draft: open, never started, its state worked out, never stored; made again with the same id, nothing changes", () => {
  const task = taskIn(drafted, "T-1")
  expect(task).toEqual({ kind: "OPEN", id: "T-1", name: "Tidy the retry loop", made: stampAt("1"), summary: "", summaries_Document: [], requests: [{ id: "r-1", notes: "Keep every error.", made: stampAt("1"), aim: AIM_TASK, status: { kind: "STAGED" } }], proposals: [], heads: [], start: { kind: "UNSTARTED" } })
  expect(stateOf__Task({ task })).toBe("DRAFT")
  expect(after(drafted, { kind: "DRAFT", id_Task: "T-1", name: "Again", request: { id: "r-9", notes: "", aim: AIM_TASK }, stamp: stampAt("2") })).toBe(drafted)
})

test("a start, at any scope, sets what's staged there running and the task working, started once, when it was first started; the last run addressed, it's your turn; Stop stages what's running again, your turn, never a draft again", () => {
  const started = after(drafted, { kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, stamp: stampAt("2") })
  expect(statusesIn(started, "T-1")).toEqual(["r-1 WITH_AGENT"])
  expect([stateOf__Task({ task: taskIn(started, "T-1") }), taskIn(started, "T-1").start]).toEqual(["WORKING", { kind: "STARTED", stamp: stampAt("2") }])
  const addressed = after(started, { kind: "ADDRESS", id_Task: "T-1", ids_Request: ["r-1"], answer: { kind: "NOTHING", note: "Nothing needed changing." } })
  expect([stateOf__Task({ task: taskIn(addressed, "T-1") }), taskIn(addressed, "T-1").requests[0]?.status]).toEqual(["YOUR_TURN", { kind: "ADDRESSED", answer: { kind: "NOTHING", note: "Nothing needed changing." } }])
  const stopped = after(started, { kind: "STOP", id_Task: "T-1", scope: { kind: "TASK" } })
  expect([statusesIn(stopped, "T-1"), stateOf__Task({ task: taskIn(stopped, "T-1") })]).toEqual([["r-1 STAGED"], "YOUR_TURN"])
  const restarted = after(stopped, { kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, stamp: stampAt("3") })
  expect(taskIn(restarted, "T-1").start).toEqual({ kind: "STARTED", stamp: stampAt("2") })
  expect(after(drafted, { kind: "START", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-9"] }, stamp: stampAt("2") })).toBe(drafted)
})

test("each scope starts what's in it: a file's, its own requests and its proposals'; some proposals'; some requests; a proposal's revision never two rounds at once, what's asked of it while one runs waiting for the next", () => {
  const model = after(drafted,
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-1", path: "retry.js", title: "Keep every error", rationale: "" }, stamp: stampAt("2") },
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-2", path: "README.md", title: "Say so", rationale: "" }, stamp: stampAt("2") },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Name the counter.", aim: aimDocument("retry.js") }, stamp: stampAt("3") },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-3", notes: "Shorter.", aim: aimProposal("p-1") }, stamp: stampAt("3") },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-4", notes: "Plainer.", aim: aimProposal("p-2") }, stamp: stampAt("3") }
  )
  expect(statusesIn(after(model, { kind: "START", id_Task: "T-1", scope: { kind: "DOCUMENT", path: "retry.js" }, stamp: stampAt("4") }), "T-1")).toEqual(["r-1 STAGED", "r-2 WITH_AGENT", "r-3 WITH_AGENT", "r-4 STAGED"])
  expect(statusesIn(after(model, { kind: "START", id_Task: "T-1", scope: { kind: "PROPOSALS", ids_Proposal: ["p-2"] }, stamp: stampAt("4") }), "T-1")).toEqual(["r-1 STAGED", "r-2 STAGED", "r-3 STAGED", "r-4 WITH_AGENT"])
  expect(statusesIn(after(model, { kind: "START", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-1", "r-2"] }, stamp: stampAt("4") }), "T-1")).toEqual(["r-1 WITH_AGENT", "r-2 WITH_AGENT", "r-3 STAGED", "r-4 STAGED"])
  const revising = after(model, { kind: "START", id_Task: "T-1", scope: { kind: "PROPOSALS", ids_Proposal: ["p-1"] }, stamp: stampAt("4") }, { kind: "REQUEST", id_Task: "T-1", request: { id: "r-5", notes: "And clearer.", aim: aimProposal("p-1") }, stamp: stampAt("5") })
  expect(statusesIn(after(revising, { kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, stamp: stampAt("6") }), "T-1")).toEqual(["r-1 WITH_AGENT", "r-2 WITH_AGENT", "r-3 WITH_AGENT", "r-4 WITH_AGENT", "r-5 STAGED"])
})

test("a request's notes edited, or the request removed, only while it's staged; a request added twice by its id, once", () => {
  const model = after(drafted, { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Name the counter.", aim: AIM_TASK }, stamp: stampAt("2") }, { kind: "START", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-2"] }, stamp: stampAt("3") })
  expect(taskIn(after(model, { kind: "EDIT", id_Task: "T-1", id_Request: "r-1", notes: "Keep them all." }), "T-1").requests.map((request) => request.notes)).toEqual(["Keep them all.", "Name the counter."])
  expect(after(model, { kind: "EDIT", id_Task: "T-1", id_Request: "r-2", notes: "Changed." })).toBe(model)
  expect(statusesIn(after(model, { kind: "REMOVE", id_Task: "T-1", id_Request: "r-1" }), "T-1")).toEqual(["r-2 WITH_AGENT"])
  expect(after(model, { kind: "REMOVE", id_Task: "T-1", id_Request: "r-2" })).toBe(model)
  expect(after(model, { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Again.", aim: AIM_TASK }, stamp: stampAt("4") })).toBe(model)
})

test("a proposal made, then revised by a new round, open again; decided, what was asked of it and not yet started let go; reopened, nothing let go; counted: what's open to decide, what's staged, what's running", () => {
  const proposed = after(drafted,
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-1", path: "retry.js", title: "Keep every error", rationale: "Callers need them." }, stamp: stampAt("2") },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Shorter.", aim: aimProposal("p-1") }, stamp: stampAt("3") }
  )
  expect(countsOf__Task({ task: taskIn(proposed, "T-1") })).toEqual({ count_Undecided: 1, count_Conflicts: 0, count_Staged: 2, count_Running: 0 })
  const accepted = after(proposed, { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-1", decision: "ACCEPTED" })
  expect([taskIn(accepted, "T-1").proposals[0]?.decision, statusesIn(accepted, "T-1"), countsOf__Task({ task: taskIn(accepted, "T-1") })]).toEqual(["ACCEPTED", ["r-1 STAGED"], { count_Undecided: 0, count_Conflicts: 0, count_Staged: 1, count_Running: 0 }])
  expect(statusesIn(after(accepted, { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-1", decision: "OPEN" }), "T-1")).toEqual(["r-1 STAGED"])
  const revised = after(accepted, { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-1", path: "retry.js", title: "Keep each error", rationale: "Shorter." }, stamp: stampAt("4") })
  expect(taskIn(revised, "T-1").proposals).toEqual([{ id: "p-1", path: "retry.js", title: "Keep each error", rationale: "Shorter.", made: stampAt("2"), decision: "OPEN" }])
  expect(after(accepted, { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-1", decision: "ACCEPTED" })).toBe(accepted)
})

test("the ways a task ends: Apply, once nothing's running; Cancel, a started task's, what's running stopped; Discard, a draft's; each kept with how, when and by whom, nothing changing it after; collected, gone, only what's resolved", () => {
  const started = after(drafted, { kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, stamp: stampAt("2") })
  expect(after(started, { kind: "APPLY", id_Task: "T-1", stamp: stampAt("3") })).toBe(started)
  const applied = after(started, { kind: "ADDRESS", id_Task: "T-1", ids_Request: ["r-1"], answer: { kind: "PROPOSALS", ids_Proposal: [] } }, { kind: "APPLY", id_Task: "T-1", stamp: stampAt("3") })
  const task_Applied = taskIn(applied, "T-1")
  expect([task_Applied.kind, task_Applied.kind === "RESOLVED" ? task_Applied.resolution : null, stateOf__Task({ task: task_Applied })]).toEqual(["RESOLVED", { how: "APPLIED", stamp: stampAt("3") }, "APPLIED"])
  expect(after(applied, { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "More.", aim: AIM_TASK }, stamp: stampAt("4") }, { kind: "CANCEL", id_Task: "T-1", stamp: stampAt("4") })).toBe(applied)
  const canceled = after(started, { kind: "CANCEL", id_Task: "T-1", stamp: stampAt("3") })
  expect([stateOf__Task({ task: taskIn(canceled, "T-1") }), statusesIn(canceled, "T-1")]).toEqual(["CANCELED", ["r-1 STAGED"]])
  expect(after(drafted, { kind: "CANCEL", id_Task: "T-1", stamp: stampAt("2") })).toBe(drafted)
  expect(after(started, { kind: "DISCARD", id_Task: "T-1", stamp: stampAt("3") })).toBe(started)
  const discarded = after(drafted, { kind: "DISCARD", id_Task: "T-1", stamp: stampAt("2") }, { kind: "DRAFT", id_Task: "T-2", name: "Log each retry", request: { id: "r-9", notes: "Log them.", aim: AIM_TASK }, stamp: stampAt("3") })
  expect(discarded.tasks.map((task) => stateOf__Task({ task }))).toEqual(["DISCARDED", "DRAFT"])
  expect(after(discarded, { kind: "COLLECT", ids_Task: ["T-1", "T-2"] }).tasks.map((task) => task.id)).toEqual(["T-2"])
  expect(after(discarded, { kind: "COLLECT", ids_Task: ["T-2"] })).toBe(discarded)
})

test("the files a task touches, each once, in the order it met them: its proposals', its requests' on a file, and those it's summarized on", () => {
  const model = after(drafted,
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-1", path: "retry.js", title: "", rationale: "" }, stamp: stampAt("2") },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "", aim: aimDocument("README.md") }, stamp: stampAt("2") },
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-2", path: "retry.js", title: "", rationale: "" }, stamp: stampAt("2") },
    { kind: "SUMMARIZE", id_Task: "T-1", summary: "Tidies it.", summaries_Document: [{ path: "CHANGELOG.md", summary: "Says so." }] }
  )
  expect(pathsOf__Task({ task: taskIn(model, "T-1") })).toEqual(["retry.js", "README.md", "CHANGELOG.md"])
  expect(taskIn(model, "T-1").summary).toBe("Tidies it.")
})

test("the tasks held, each command taken, its observers told only when something's changed", () => {
  const told: Array<number> = []
  const tasks = new _Tasks_({ model_Tasks: drafted, observers: [{ changed: (model_Tasks) => told.push(model_Tasks.tasks.length) }] })
  tasks.handle({ kind: "RENAME", id_Task: "T-1", name: "Tidy the retry loop" })
  tasks.handle({ kind: "RENAME", id_Task: "T-1", name: "Tidy retry" })
  tasks.handle({ kind: "DRAFT", id_Task: "T-2", name: "Log each retry", request: { id: "r-9", notes: "", aim: AIM_TASK }, stamp: stampAt("2") })
  expect([told, taskIn(tasks.model_Tasks, "T-1").name]).toEqual([[1, 2], "Tidy retry"])
})

test("an addressed request dismissed, let go; one not yet addressed, kept; a proposal decided while a revision of it runs, what's running let go with what's staged, what's addressed kept", () => {
  const model = after(drafted,
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-1", path: "retry.js", title: "", rationale: "" }, stamp: stampAt("2") },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Shorter.", aim: aimProposal("p-1") }, stamp: stampAt("2") },
    { kind: "START", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-1", "r-2"] }, stamp: stampAt("3") },
    { kind: "ADDRESS", id_Task: "T-1", ids_Request: ["r-1"], answer: { kind: "NOTHING", note: "" } },
    { kind: "REQUEST", id_Task: "T-1", request: { id: "r-3", notes: "And clearer.", aim: aimProposal("p-1") }, stamp: stampAt("4") }
  )
  expect(statusesIn(after(model, { kind: "DISMISS", id_Task: "T-1", id_Request: "r-1" }), "T-1")).toEqual(["r-2 WITH_AGENT", "r-3 STAGED"])
  expect(after(model, { kind: "DISMISS", id_Task: "T-1", id_Request: "r-3" })).toBe(model)
  expect(statusesIn(after(model, { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-1", decision: "REJECTED" }), "T-1")).toEqual(["r-1 ADDRESSED"])
})

// a task's head on retry.js: one change of a source's, replacing the first
// letters, what's stale of each source as the documents part found it
const headOf = (proposed: Array<string>, stale: Array<string>): _Head_Document_ => ({
  path: "retry.js",
  version: "v1",
  proposed: proposed.map((source) => ({ source, changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } }, next: { lines: parseTexts_Line("x"), marks: [] } }] })),
  stale: stale.map((source) => ({ source, changes_Stale: [{ index: 0, over: { kind: "RANGE", version: "v0", text: { lines: parseTexts_Line("t"), marks: [] }, written: { lines: { lines: parseTexts_Line("t"), marks: [] }, change: { kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 1 } }, next: { lines: parseTexts_Line("x"), marks: [] } } } } }], count_Dropped: 0 }))
})

test("a task's changes on a document, its head there, restated as they now stand: added, replaced, let go once there's nothing in it; the same head, nothing changes; a resolved task's kept as it ended; the documents it touches with it", () => {
  const head = headOf(["yours"], [])
  const restated = after(drafted, { kind: "RESTATE", id_Task: "T-1", head })
  expect([taskIn(restated, "T-1").heads, pathsOf__Task({ task: taskIn(restated, "T-1") })]).toEqual([[head], ["retry.js"]])
  expect(after(restated, { kind: "RESTATE", id_Task: "T-1", head })).toBe(restated)
  const replaced = headOf(["yours", "p-1"], [])
  expect(taskIn(after(restated, { kind: "RESTATE", id_Task: "T-1", head: replaced }), "T-1").heads).toEqual([replaced])
  expect(taskIn(after(restated, { kind: "RESTATE", id_Task: "T-1", head: headOf([], []) }), "T-1").heads).toEqual([])
  expect(after(drafted, { kind: "RESTATE", id_Task: "T-1", head: headOf([], []) })).toBe(drafted)
  const discarded = after(restated, { kind: "DISCARD", id_Task: "T-1", stamp: stampAt("2") })
  expect(after(discarded, { kind: "RESTATE", id_Task: "T-1", head: replaced })).toBe(discarded)
  expect(taskIn(discarded, "T-1").heads).toEqual([head])
})

test("a conflict is a change of the task's own the document moved under, yours or a proposal accepted, each stale change one, each dropped one too; a proposal still to decide only stale, one rejected neither; Apply held while there's any, as it is while anything runs", () => {
  const proposed = after(drafted,
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-1", path: "retry.js", title: "", rationale: "" }, stamp: stampAt("2") },
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-2", path: "retry.js", title: "", rationale: "" }, stamp: stampAt("2") },
    { kind: "PROPOSE", id_Task: "T-1", proposal: { id: "p-3", path: "retry.js", title: "", rationale: "" }, stamp: stampAt("2") },
    { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-2", decision: "ACCEPTED" },
    { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-3", decision: "REJECTED" },
    { kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, stamp: stampAt("3") },
    { kind: "ADDRESS", id_Task: "T-1", ids_Request: ["r-1"], answer: { kind: "NOTHING", note: "" } }
  )
  const conflictsOf = (stale: Array<string>) => countsOf__Task({ task: taskIn(after(proposed, { kind: "RESTATE", id_Task: "T-1", head: headOf(["yours", "p-1", "p-2", "p-3"], stale) }), "T-1") }).count_Conflicts
  expect([conflictsOf([]), conflictsOf(["yours"]), conflictsOf(["p-1"]), conflictsOf(["p-2"]), conflictsOf(["p-3"]), conflictsOf(["yours", "p-1", "p-2", "p-3"])]).toEqual([0, 1, 0, 1, 0, 2])
  const dropped = after(proposed, { kind: "RESTATE", id_Task: "T-1", head: { ...headOf(["yours"], []), stale: [{ source: "yours", changes_Stale: [], count_Dropped: 2 }] } })
  expect(countsOf__Task({ task: taskIn(dropped, "T-1") }).count_Conflicts).toBe(2)
  const decided = after(proposed, { kind: "DECIDE", id_Task: "T-1", id_Proposal: "p-1", decision: "ACCEPTED" })
  const conflicted = after(decided, { kind: "RESTATE", id_Task: "T-1", head: headOf(["yours", "p-1"], ["yours"]) })
  expect(after(conflicted, { kind: "APPLY", id_Task: "T-1", stamp: stampAt("4") })).toBe(conflicted)
  const settled = after(conflicted, { kind: "RESTATE", id_Task: "T-1", head: headOf(["yours", "p-1"], []) })
  expect(stateOf__Task({ task: taskIn(after(settled, { kind: "APPLY", id_Task: "T-1", stamp: stampAt("4") }), "T-1") })).toBe("APPLIED")
})
