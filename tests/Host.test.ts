import { expect, test } from "bun:test"
import { _Tasks_ } from "../source/core/tasks/index.ts"
import { _Documents_, parseTexts_Line } from "../source/core/documents/index.ts"
import { _Shell_ } from "../source/core/shell/index.ts"
import { _Host_ } from "../source/ui/host/index.ts"
import { statusHostOf__Request } from "../source/ui/host/Projection_Host.ts"
import type { _Update_Host_ } from "../source/ui/editor/index.ts"
import type { _Update_Board_ } from "../source/ui/board/index.ts"

// the editor's host over a real core: what it tells the editor and the
// board of a request with the agent, waiting while its job's queued and
// running once an agent takes it, worked out from the core's jobs; and
// whether an agent's listening, as its page is told; and the file it shows
// gone, deleted, nothing proposing it, the editor taken back to the file
// it showed before

test("a request with the agent is waiting while its job's queued, no agent on it, and running once one takes it: in the editor's task, the task's state, its standing and the board's; with no job at all, as a playground's seed, running, as before; and whether an agent's listening, as the host's told", () => {
  let host: _Host_ | undefined
  const files = ["README.md"]
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: (state_Shell) => host?.heard({ at: Date.now(), state_Shell, files, isListening_Agent: false, count_Edit: 0 }), started: () => {}, stopped: () => {}, landed: () => {} }]
  })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "README.md", text: { lines: parseTexts_Line("# retry\n"), marks: [] }, isPresent: true })
  const shown: Array<_Update_Host_> = []
  const boarded: Array<_Update_Board_> = []
  host = new _Host_({
    at: Date.now(),
    name_Document: "README.md",
    target_Mode: { kind: "MANUAL" },
    files,
    isListening_Agent: false,
    attributes: new Map(),
    state_Shell: shell.state(),
    suffix_Id: "",
    observers: [{ sent: (command_Shell) => shell.handle(command_Shell), opening: () => {}, gone: () => {}, shown: (update_Host) => shown.push(update_Host), boarded: (update_Board) => boarded.push(update_Board) }]
  })
  host.showing()
  const seenOf = () => {
    const update_Host = shown.at(-1)
    const task = update_Host?.mode.kind === "TASK" ? update_Host.mode.task : undefined
    const task_Board = boarded.at(-1)?.tasks[0]
    return {
      state: task?.state,
      statuses: task?.requests.map((request) => request.status),
      counts_Here: task?.documents[0]?.counts_Requests,
      standing: update_Host?.tasks.map((standing_Task) => [standing_Task.state, standing_Task.count_Waiting, standing_Task.count_Running]),
      board: [task_Board?.state, task_Board?.count_Waiting, task_Board?.count_Running],
      isListening_Agent: update_Host?.isListening_Agent
    }
  }
  host.asked({ kind: "REQUEST", aim: { kind: "DOCUMENT", reference: null }, notes: "Say what it retries.", isStarting: true })
  const seen_Queued = seenOf()
  shell.handle({ kind: "TAKE", id_Job: "j-1", note: "starting" })
  const seen_Taken = seenOf()
  host.heard({ at: Date.now(), state_Shell: shell.state(), files, isListening_Agent: true, count_Edit: 0 })
  const seen_Listening = seenOf()
  const task = shell.taskOf("T-1")
  const request = task?.requests[0]
  expect(seen_Queued).toEqual({
    state: "WAITING",
    statuses: ["WAITING"],
    counts_Here: { STAGED: 0, WAITING: 1, RUNNING: 0, QUIET: 0 },
    standing: [["WAITING", 1, 0]],
    board: ["WAITING", 1, 0],
    isListening_Agent: false
  })
  expect(seen_Taken).toEqual({
    state: "WORKING",
    statuses: ["RUNNING"],
    counts_Here: { STAGED: 0, WAITING: 0, RUNNING: 1, QUIET: 0 },
    standing: [["WORKING", 0, 1]],
    board: ["WORKING", 0, 1],
    isListening_Agent: false
  })
  expect(seen_Listening.isListening_Agent).toBe(true)
  expect(task === undefined || request === undefined ? undefined : statusHostOf__Request({ at: Date.now(), task, request, jobs: [] })).toBe("RUNNING")
})

test("a job being worked on that nothing's heard of for five minutes is quiet, its requests saying how many minutes, the task Quiet; checked in on, it's running again; time's the program's, as its page is told it, whatever the page's own clock says; ticked with nothing changed, nothing's shown", () => {
  let host: _Host_ | undefined
  const files = ["README.md"]
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: (state_Shell) => host?.heard({ state_Shell, files, isListening_Agent: true, at: Date.now(), count_Edit: 0 }), started: () => {}, stopped: () => {}, landed: () => {} }]
  })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "README.md", text: { lines: parseTexts_Line("# retry\n"), marks: [] }, isPresent: true })
  const shown: Array<_Update_Host_> = []
  host = new _Host_({ name_Document: "README.md", target_Mode: { kind: "MANUAL" }, files, isListening_Agent: true, at: Date.now(), attributes: new Map(), state_Shell: shell.state(), suffix_Id: "", observers: [{ sent: (command_Shell) => shell.handle(command_Shell), opening: () => {}, gone: () => {}, shown: (update_Host) => shown.push(update_Host), boarded: () => {} }] })
  host.showing()
  host.asked({ kind: "REQUEST", aim: { kind: "DOCUMENT", reference: null }, notes: "Say what it retries.", isStarting: true })
  shell.handle({ kind: "TAKE", id_Job: "j-1", note: "starting" })
  const seenOf = () => {
    const update_Host = shown.at(-1)
    const task = update_Host?.mode.kind === "TASK" ? update_Host.mode.task : undefined
    return [task?.state, task?.requests.map((request) => `${request.status} ${request.minutes_Quiet}`), update_Host?.tasks.map((standing_Task) => [standing_Task.count_Running, standing_Task.count_Quiet])]
  }
  const seen_Taken = seenOf()
  host.heard({ state_Shell: shell.state(), files, isListening_Agent: true, at: Date.now() + 4 * 60_000, count_Edit: 0 })
  const seen_Four = seenOf()
  host.heard({ state_Shell: shell.state(), files, isListening_Agent: true, at: Date.now() + 6 * 60_000 + 500, count_Edit: 0 })
  const seen_Six = seenOf()
  const count_Before = shown.length
  host.ticked()
  const count_Ticked = shown.length
  shell.handle({ kind: "CHECK_IN", id_Job: "j-1", note: "still at it" })
  const seen_Heard = seenOf()
  expect(seen_Taken).toEqual(["WORKING", ["RUNNING 0"], [[1, 0]]])
  expect(seen_Four).toEqual(["WORKING", ["RUNNING 0"], [[1, 0]]])
  expect(seen_Six).toEqual(["QUIET", ["QUIET 6"], [[0, 1]]])
  expect(count_Ticked).toBe(count_Before)
  expect(seen_Heard).toEqual(["WORKING", ["RUNNING 0"], [[1, 0]]])
})

test("the file an editor shows, deleted by a task applied, nothing proposing it, is gone: the host says so, once, and taken back, as a page takes it, to the file it showed before; a new file an open task proposes, not there yet, isn't gone till the task's cancelled", () => {
  let host: _Host_ | undefined
  const textOf = (text: string) => ({ lines: parseTexts_Line(text), marks: [] })
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: (state_Shell) => host?.heard({ at: Date.now(), state_Shell, files: ["README.md", "retry.js"], isListening_Agent: false, count_Edit: 0 }), started: () => {}, stopped: () => {}, landed: () => {} }]
  })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "README.md", text: textOf("# retry\n"), isPresent: true })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "retry.js", text: textOf("let n = 1\n"), isPresent: true })
  const gones: Array<string> = []
  host = new _Host_({
    at: Date.now(),
    name_Document: "README.md",
    target_Mode: { kind: "MANUAL" },
    files: ["README.md", "retry.js"],
    isListening_Agent: false,
    attributes: new Map(),
    state_Shell: shell.state(),
    suffix_Id: "",
    observers: [{ sent: (command_Shell) => shell.handle(command_Shell), opening: () => {}, gone: (path) => {
      gones.push(path)
      host?.left()
    }, shown: () => {}, boarded: () => {} }]
  })
  const landedOn = (path: string, effect: "MAKE" | "REMOVE", next: string, id_Job: string) => {
    shell.handle({ kind: "DRAFT", request: { id: `r-${id_Job}`, notes: "Do it.", aim: { kind: "DOCUMENT", path, words: { kind: "ALL" } } }, isStarting: true, path })
    shell.handle({ kind: "TAKE", id_Job, note: "" })
    const document = shell.documentOf(path)
    const lines = document.text.lines
    shell.handle({ kind: "HAND_BACK", id_Job, landing: { proposals: [{ id: `${id_Job}.1`, path, effect, title: effect, rationale: "", version: document.version, changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: lines.length - 1, offset: (lines.at(-1) ?? "").length } }, next: textOf(next) }], ids_Request: [`r-${id_Job}`] }], nothings: [], frames: [] }, note: "" })
    return shell.taskOf(`T-${id_Job.slice(2)}`)?.id ?? ""
  }
  host.asked({ kind: "OPEN_FILE", path: "retry.js" })
  const id_Deleting = landedOn("retry.js", "REMOVE", "", "j-1")
  shell.handle({ kind: "DECIDE", id_Task: id_Deleting, id_Proposal: "j-1.1", decision: "ACCEPTED" })
  const shown_Proposed = host.name_Document
  shell.handle({ kind: "END", id_Task: id_Deleting, kind_End: "APPLY" })
  const shown_Applied = [host.name_Document, host.path_Wanted, gones.slice()]
  shell.handle({ kind: "OPEN_DOCUMENT", path: "docs/new.md", text: textOf(""), isPresent: false })
  const id_Making = landedOn("docs/new.md", "MAKE", "# New\n", "j-2")
  host.asked({ kind: "OPEN_FILE", path: "docs/new.md" })
  const shown_Made = [host.name_Document, gones.slice()]
  shell.handle({ kind: "END", id_Task: id_Making, kind_End: "CANCEL" })
  expect([shell.documentOf("retry.js").isPresent, shown_Proposed]).toEqual([false, "retry.js"])
  expect(shown_Applied).toEqual(["README.md", "README.md", ["retry.js"]])
  expect(shown_Made).toEqual(["docs/new.md", ["retry.js"]])
  expect([host.name_Document, gones]).toEqual(["README.md", ["retry.js", "docs/new.md"]])
})
