import { expect, test } from "bun:test"
import fc from "fast-check"
import { _Tasks_ } from "../source/core/tasks/index.ts"
import { _Documents_, parseTexts_Line } from "../source/core/documents/index.ts"
import { _Shell_, LANDING_NONE, type _Job_Shell_, type _Stop_Shell_, type _Landing_Job_ } from "../source/core/shell/index.ts"
import { jobsAfter__Command, isTakeable__Job, jobOf__Request, type _Command_Jobs_ } from "../source/core/shell/Jobs_Shell.ts"

// the core's jobs, what a Start sets going and where each stands, whoever
// does it: the model's own rules first, then the shell keeping them, a Start
// a job, Stop cancelling it whole, a task ended cancelling its own, and a
// job handed back landing what it was asked

const STAMP = { at: "2026-11-27T00:00:00.000Z", by: "HUMAN" as const }
const jobMade = (id: string, id_Task: string, ids_Request: Array<string>, queued: number): _Job_Shell_ => ({
  id,
  id_Task,
  scope: { kind: "REQUESTS", ids_Request },
  requests: ids_Request.map((id_Request) => ({ id: id_Request, notes: id_Request, made: STAMP, aim: { kind: "TASK", words: { kind: "ALL" } }, status: { kind: "WITH_AGENT", stamp: STAMP } })),
  sources: [],
  path: "README.md",
  version: "v-1",
  proposed: [],
  queued,
  state: { kind: "QUEUED" }
})
const after = (jobs: Array<_Job_Shell_>, ...commands: Array<_Command_Jobs_>) => commands.reduce((jobs_Before, command) => jobsAfter__Command({ jobs: jobs_Before, command }), jobs)
const queue = (id: string, id_Task: string, ids_Request: Array<string>, at: number): _Command_Jobs_ => ({ kind: "QUEUE", job_Shell: jobMade(id, id_Task, ids_Request, at) })
const jobIn = (jobs: Array<_Job_Shell_>, id: string): _Job_Shell_ => {
  const job = jobs.find((each) => each.id === id)
  if (job === undefined) throw new Error(`no job ${id}`)
  return job
}
const statesIn = (jobs: Array<_Job_Shell_>) => jobs.map((job) => `${job.id} ${job.state.kind}`)
const takeableIn = (jobs: Array<_Job_Shell_>) => jobs.filter((job) => isTakeable__Job({ jobs, job })).map((job) => job.id)

test("a job queued is the core's, as a Start made it; queued again with the same id, or starting nothing, nothing changes", () => {
  const queued = after([], queue("j-1", "T-1", ["r-1", "r-2"], 100))
  expect(jobIn(queued, "j-1")).toEqual(jobMade("j-1", "T-1", ["r-1", "r-2"], 100))
  expect(after(queued, queue("j-1", "T-2", ["r-9"], 200))).toBe(queued)
  expect(after(queued, queue("j-2", "T-1", [], 200))).toBe(queued)
})

test("a job may be taken only queued, the first of its task's still queued, none of its task's being worked on: one at a time within a task, in the order they were made, at once across tasks", () => {
  const jobs = after([], queue("j-1", "T-1", ["r-1"], 100), queue("j-2", "T-1", ["r-2"], 200), queue("j-3", "T-2", ["r-3"], 300))
  expect(takeableIn(jobs)).toEqual(["j-1", "j-3"])
  expect(after(jobs, { kind: "TAKE", id_Job: "j-2", note: "", givens: [], at: 400 })).toBe(jobs)
  const taken = after(jobs, { kind: "TAKE", id_Job: "j-1", note: "starting", givens: [], at: 400 })
  expect(takeableIn(taken)).toEqual(["j-3"])
  expect(takeableIn(after(taken, { kind: "HAND_BACK", id_Job: "j-1", at: 500 }))).toEqual(["j-2", "j-3"])
  expect(takeableIn(after(jobs, { kind: "CANCEL", id_Job: "j-1", at: 500 }))).toEqual(["j-2", "j-3"])
})

test("taken, a job's being worked on, its check-ins keeping it heard of, a note kept till another's given; handed back, it's done; one never taken can't be handed back, and a job done or cancelled stays so", () => {
  const jobs = after([], queue("j-1", "T-1", ["r-1"], 100))
  const taken = after(jobs, { kind: "TAKE", id_Job: "j-1", note: "starting", givens: [], at: 210 })
  expect(jobIn(taken, "j-1").state).toEqual({ kind: "BEING_WORKED_ON", taken: 210, heard: 210, note: "starting", givens: [] })
  const heard = after(taken, { kind: "CHECK_IN", id_Job: "j-1", note: "reading the editor's files", at: 300 }, { kind: "CHECK_IN", id_Job: "j-1", note: "", at: 400 })
  expect(jobIn(heard, "j-1").state).toEqual({ kind: "BEING_WORKED_ON", taken: 210, heard: 400, note: "reading the editor's files", givens: [] })
  const done = after(heard, { kind: "HAND_BACK", id_Job: "j-1", at: 500 })
  expect(jobIn(done, "j-1").state).toEqual({ kind: "DONE", done: 500 })
  expect(after(jobs, { kind: "HAND_BACK", id_Job: "j-1", at: 250 }, { kind: "CHECK_IN", id_Job: "j-1", note: "here", at: 260 })).toBe(jobs)
  expect(after(done, { kind: "TAKE", id_Job: "j-1", note: "again", givens: [], at: 600 }, { kind: "CHECK_IN", id_Job: "j-1", note: "again", at: 600 }, { kind: "CANCEL", id_Job: "j-1", at: 600 }, { kind: "HAND_BACK", id_Job: "j-1", at: 600 })).toBe(done)
})

test("cancelled, a job queued or being worked on is so, and nothing after changes it", () => {
  const jobs = after([], queue("j-1", "T-1", ["r-1"], 100), queue("j-2", "T-2", ["r-2"], 110), { kind: "TAKE", id_Job: "j-2", note: "starting", givens: [], at: 210 })
  const stopped = after(jobs, { kind: "CANCEL", id_Job: "j-1", at: 300 }, { kind: "CANCEL", id_Job: "j-2", at: 300 })
  expect(statesIn(stopped)).toEqual(["j-1 CANCELLED", "j-2 CANCELLED"])
  expect(after(stopped, { kind: "TAKE", id_Job: "j-1", note: "", givens: [], at: 310 }, { kind: "CHECK_IN", id_Job: "j-2", note: "still reading", at: 310 }, { kind: "HAND_BACK", id_Job: "j-2", at: 320 })).toBe(stopped)
})

test("a request's job is the latest of its task it was started in, a request stopped and started again found in its new job", () => {
  const jobs = after([], queue("j-1", "T-1", ["r-1", "r-2"], 100), { kind: "CANCEL", id_Job: "j-1", at: 150 }, queue("j-2", "T-1", ["r-1"], 200), queue("j-3", "T-2", ["r-1"], 300))
  expect(jobOf__Request({ jobs, id_Task: "T-1", id_Request: "r-1" })?.id).toBe("j-2")
  expect(jobOf__Request({ jobs, id_Task: "T-1", id_Request: "r-2" })?.id).toBe("j-1")
  expect(jobOf__Request({ jobs, id_Task: "T-1", id_Request: "r-9" })).toBeUndefined()
})

test("over any sequence of moves: a task never has more than one job being worked on, never one with a job made before it still queued, and a job done or cancelled never changes again", () => {
  const move = fc.oneof(
    fc.record({ kind: fc.constant("QUEUE" as const), task: fc.integer({ min: 0, max: 2 }) }),
    fc.record({ kind: fc.constantFrom("TAKE" as const, "CHECK_IN" as const, "HAND_BACK" as const, "CANCEL" as const), job: fc.integer({ min: 0, max: 9 }) })
  )
  fc.assert(
    fc.property(fc.array(move, { maxLength: 60 }), (moves) => {
      let jobs: Array<_Job_Shell_> = []
      let at = 0
      let count = 0
      for (const each of moves) {
        at += 1_000
        const ids = jobs.map((job) => job.id)
        const command: _Command_Jobs_ | undefined = each.kind === "QUEUE"
          ? queue(`j-${count++}`, `T-${each.task}`, [`r-${count}`], at)
          : ids.length === 0
            ? undefined
            : each.kind === "TAKE"
              ? { kind: "TAKE", id_Job: ids[each.job % ids.length]!, note: "", givens: [], at }
              : each.kind === "CHECK_IN"
              ? { kind: "CHECK_IN", id_Job: ids[each.job % ids.length]!, note: "", at }
              : { kind: each.kind, id_Job: ids[each.job % ids.length]!, at }
        if (command === undefined) continue
        const before = jobs
        jobs = after(jobs, command)
        for (const job of before) {
          if (job.state.kind === "DONE" || job.state.kind === "CANCELLED") expect(jobIn(jobs, job.id).state).toBe(job.state)
        }
        for (const task of new Set(jobs.map((job) => job.id_Task))) {
          const jobs_Task = jobs.filter((job) => job.id_Task === task)
          const busy = jobs_Task.filter((job) => job.state.kind === "BEING_WORKED_ON")
          expect(busy.length).toBeLessThanOrEqual(1)
          for (const job of busy) expect(jobs_Task.some((other) => other.state.kind === "QUEUED" && other.queued < job.queued)).toBe(false)
        }
      }
    }),
    { numRuns: 300 }
  )
})

const shellMade = () => {
  const told = { started: [] as Array<string>, stopped: [] as Array<_Stop_Shell_>, landed: [] as Array<_Landing_Job_> }
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: () => {}, started: (job_Shell) => told.started.push(job_Shell.id), stopped: (stop_Shell) => told.stopped.push(stop_Shell), landed: (landing_Job) => told.landed.push(landing_Job) }]
  })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "README.md", text: { lines: parseTexts_Line("# retry\n"), marks: [] } })
  return { shell, told }
}
const madeOf = (notes: string) => ({ id: `r-${notes}`, notes, aim: { kind: "DOCUMENT" as const, path: "README.md", words: { kind: "ALL" as const } } })
const requestIn = (shell: _Shell_, notes: string) => shell.taskOf("T-1")?.requests.find((request) => request.notes === notes)

test("in the shell, a Start is a job, in the core's state, with the requests it started, a Start of nothing none; one may be taken only in its turn; Stop cancels a job whole, its other requests staged again; handed back, a job's done and lands, its requests addressed with the note; a task ended cancels its jobs left", () => {
  const { shell, told } = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("one"), isStarting: true, path: "README.md" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("two"), isStarting: true, path: "README.md" })
  shell.handle({ kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, path: "README.md" })
  shell.handle({ kind: "TAKE", id_Job: "j-2", note: "" })
  const state_Queued = statesIn(shell.state().jobs)
  shell.handle({ kind: "TAKE", id_Job: "j-1", note: "starting" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("three"), isStarting: false, path: "README.md" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("four"), isStarting: false, path: "README.md" })
  shell.handle({ kind: "START", id_Task: "T-1", scope: { kind: "TASK" }, path: "README.md" })
  const requests_Job = shell.jobOf("j-3")?.requests.map((request) => request.id)
  shell.handle({ kind: "STOP", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-three"] } })
  const status_Rest = requestIn(shell, "four")?.status.kind
  shell.handle({ kind: "HAND_BACK", id_Job: "j-2", landing: LANDING_NONE, note: "Not taken." })
  shell.handle({ kind: "HAND_BACK", id_Job: "j-1", landing: LANDING_NONE, note: "Nothing needs to change." })
  const status_Done = requestIn(shell, "one")?.status
  shell.handle({ kind: "END", id_Task: "T-1", kind_End: "CANCEL" })
  expect(state_Queued).toEqual(["j-1 QUEUED", "j-2 QUEUED"])
  expect(told.started).toEqual(["j-1", "j-2", "j-3"])
  expect(requests_Job).toEqual(["r-three", "r-four"])
  expect(told.stopped.map((stop_Shell) => [stop_Shell.ids_Request, stop_Shell.ids_Job])).toEqual([[["r-three", "r-four"], ["j-3"]]])
  expect(status_Rest).toBe("STAGED")
  expect(told.landed.map((landing_Job) => [landing_Job.job_Shell.id, landing_Job.sources, landing_Job.ids_Addressed])).toEqual([["j-1", [], ["r-one"]]])
  expect([status_Done?.kind, JSON.stringify(status_Done)]).toEqual(["ADDRESSED", expect.stringContaining("Nothing needs to change.")])
  expect(statesIn(shell.state().jobs)).toEqual(["j-1 DONE", "j-2 CANCELLED", "j-3 CANCELLED"])
})
