import { expect, test } from "bun:test"
import fc from "fast-check"
import {
  _Agent_,
  modelAfter__Command,
  nextOf__Mailbox,
  jobOf__Request,
  MS_LAPSE__OFFER,
  type _Model_Agent_,
  type _Command_Agent_,
  type _Job_Agent_
} from "../source/agent/index.ts"

const MODEL_EMPTY: _Model_Agent_ = { jobs: [] }
const after = (model_Agent: _Model_Agent_, ...commands: Array<_Command_Agent_>) => commands.reduce((model, command) => modelAfter__Command({ model_Agent: model, command }), model_Agent)
const queue = (id_Job: string, id_Task: string, ids_Request: Array<string>, at: number): _Command_Agent_ => ({ kind: "QUEUE", id_Job, id_Task, scope: { kind: "REQUESTS", ids_Request }, ids_Request, at })
const jobIn = (model_Agent: _Model_Agent_, id: string): _Job_Agent_ => {
  const job = model_Agent.jobs.find((each) => each.id === id)
  if (job === undefined) throw new Error(`no job ${id}`)
  return job
}
const statesIn = (model_Agent: _Model_Agent_) => model_Agent.jobs.map((job) => `${job.id} ${job.state.kind}`)
const nextIn = (model_Agent: _Model_Agent_) => nextOf__Mailbox({ model_Agent, from: { kind: "ANY" } })?.id ?? "none"

test("a start made is a job, queued, with the task, the scope and the requests it started; made again with the same id, or starting nothing, nothing changes", () => {
  const queued = after(MODEL_EMPTY, queue("j-1", "T-1", ["r-1", "r-2"], 100))
  expect(jobIn(queued, "j-1")).toEqual({ id: "j-1", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-1", "r-2"] }, ids_Request: ["r-1", "r-2"], queued: 100, state: { kind: "QUEUED" } })
  expect(after(queued, queue("j-1", "T-2", ["r-9"], 200))).toBe(queued)
  expect(after(queued, queue("j-2", "T-1", [], 200))).toBe(queued)
})

test("a wait's given the oldest queued job of any task, one job at a time within a task, in the order they were made, at once across tasks; or, kept to a task, only that task's", () => {
  const model = after(MODEL_EMPTY, queue("j-1", "T-1", ["r-1"], 100), queue("j-2", "T-1", ["r-2"], 200), queue("j-3", "T-2", ["r-3"], 300))
  expect(nextIn(model)).toBe("j-1")
  expect(nextOf__Mailbox({ model_Agent: model, from: { kind: "TASK", id_Task: "T-2" } })?.id).toBe("j-3")
  const offered = after(model, { kind: "OFFER", id_Job: "j-1", at: 400 })
  expect(nextIn(offered)).toBe("j-3")
  expect(after(offered, { kind: "OFFER", id_Job: "j-2", at: 410 })).toBe(offered)
  const both = after(offered, { kind: "OFFER", id_Job: "j-3", at: 420 })
  expect([statesIn(both), nextIn(both)]).toEqual([["j-1 OFFERED", "j-2 QUEUED", "j-3 OFFERED"], "none"])
  expect(nextIn(after(both, { kind: "HAND_BACK", id_Job: "j-1", at: 500 }))).toBe("j-2")
  expect(nextIn(after(both, { kind: "CANCEL", id_Job: "j-1", at: 500 }))).toBe("j-2")
})

test("a job offered is taken by its agent's first check-in, which later ones keep heard of, a note kept till another's given; handed back, it's done, from offered or taken; a job done or cancelled stays so", () => {
  const offered = after(MODEL_EMPTY, queue("j-1", "T-1", ["r-1"], 100), { kind: "OFFER", id_Job: "j-1", at: 200 })
  expect(jobIn(offered, "j-1").state).toEqual({ kind: "OFFERED", offered: 200 })
  const taken = after(offered, { kind: "CHECK", id_Job: "j-1", note: "starting", at: 210 })
  expect(jobIn(taken, "j-1").state).toEqual({ kind: "BEING_WORKED_ON", taken: 210, heard: 210, note: "starting" })
  const heard = after(taken, { kind: "CHECK", id_Job: "j-1", note: "reading the editor's files", at: 300 }, { kind: "CHECK", id_Job: "j-1", note: "", at: 400 })
  expect(jobIn(heard, "j-1").state).toEqual({ kind: "BEING_WORKED_ON", taken: 210, heard: 400, note: "reading the editor's files" })
  const done = after(heard, { kind: "HAND_BACK", id_Job: "j-1", at: 500 })
  expect(jobIn(done, "j-1").state).toEqual({ kind: "DONE", done: 500 })
  expect(jobIn(after(offered, { kind: "HAND_BACK", id_Job: "j-1", at: 250 }), "j-1").state).toEqual({ kind: "DONE", done: 250 })
  expect(after(done, { kind: "CHECK", id_Job: "j-1", note: "again", at: 600 }, { kind: "CANCEL", id_Job: "j-1", at: 600 }, { kind: "HAND_BACK", id_Job: "j-1", at: 600 })).toBe(done)
})

test("Stop cancels a job queued, offered or being worked on; a check-in or a hand back on it after changes nothing, so it's answered stopped, its work refused", () => {
  const model = after(MODEL_EMPTY, queue("j-1", "T-1", ["r-1"], 100), queue("j-2", "T-2", ["r-2"], 110), queue("j-3", "T-3", ["r-3"], 120), { kind: "OFFER", id_Job: "j-2", at: 200 }, { kind: "OFFER", id_Job: "j-3", at: 200 }, { kind: "CHECK", id_Job: "j-3", note: "starting", at: 210 })
  const stopped = after(model, { kind: "CANCEL", id_Job: "j-1", at: 300 }, { kind: "CANCEL", id_Job: "j-2", at: 300 }, { kind: "CANCEL", id_Job: "j-3", at: 300 })
  expect(statesIn(stopped)).toEqual(["j-1 CANCELLED", "j-2 CANCELLED", "j-3 CANCELLED"])
  expect(after(stopped, { kind: "CHECK", id_Job: "j-3", note: "still reading", at: 310 }, { kind: "HAND_BACK", id_Job: "j-3", at: 320 })).toBe(stopped)
})

test("an offer not taken within a minute lapses, queued again, keeping its place, ahead of jobs made after it; one taken in time doesn't", () => {
  const offered = after(MODEL_EMPTY, queue("j-1", "T-1", ["r-1"], 100), queue("j-2", "T-2", ["r-2"], 200), { kind: "OFFER", id_Job: "j-1", at: 1_000 })
  expect(nextIn(offered)).toBe("j-2")
  expect(after(offered, { kind: "LAPSE", at: 1_000 + MS_LAPSE__OFFER - 1 })).toBe(offered)
  const lapsed = after(offered, { kind: "LAPSE", at: 1_000 + MS_LAPSE__OFFER })
  expect([statesIn(lapsed), nextIn(lapsed)]).toEqual([["j-1 QUEUED", "j-2 QUEUED"], "j-1"])
  const taken = after(offered, { kind: "CHECK", id_Job: "j-1", note: "starting", at: 2_000 })
  expect(after(taken, { kind: "LAPSE", at: 1_000 + MS_LAPSE__OFFER * 5 })).toBe(taken)
})

test("a request's job is the latest it was started in, a request stopped and started again found in its new job", () => {
  const model = after(MODEL_EMPTY, queue("j-1", "T-1", ["r-1", "r-2"], 100), { kind: "CANCEL", id_Job: "j-1", at: 150 }, queue("j-2", "T-1", ["r-1"], 200))
  expect(jobOf__Request({ model_Agent: model, id_Request: "r-1" })?.id).toBe("j-2")
  expect(jobOf__Request({ model_Agent: model, id_Request: "r-2" })?.id).toBe("j-1")
  expect(jobOf__Request({ model_Agent: model, id_Request: "r-9" })).toBeUndefined()
})

test("the agent part holds its model, telling its observers what changed, and only when something did", () => {
  const told: Array<number> = []
  const agent = new _Agent_({ model_Agent: MODEL_EMPTY, observers: [{ changed: (model_Agent) => told.push(model_Agent.jobs.length) }] })
  agent.handle(queue("j-1", "T-1", ["r-1"], 100))
  agent.handle(queue("j-1", "T-1", ["r-1"], 100))
  agent.handle({ kind: "OFFER", id_Job: "j-9", at: 200 })
  expect([told, agent.model_Agent.jobs.length]).toEqual([[1], 1])
})

test("over any sequence of moves: a task never has more than one job offered or being worked on, its jobs leave the mailbox in the order they were made, and a job done or cancelled never changes again", () => {
  const move = fc.oneof(
    fc.record({ kind: fc.constant("QUEUE" as const), task: fc.integer({ min: 0, max: 2 }) }),
    fc.record({ kind: fc.constant("WAIT" as const), task: fc.option(fc.integer({ min: 0, max: 2 }), { nil: undefined }) }),
    fc.record({ kind: fc.constantFrom("CHECK" as const, "HAND_BACK" as const, "CANCEL" as const), job: fc.integer({ min: 0, max: 9 }) }),
    fc.record({ kind: fc.constant("LAPSE" as const), seconds: fc.integer({ min: 0, max: 90 }) })
  )
  fc.assert(
    fc.property(fc.array(move, { maxLength: 60 }), (moves) => {
      let model = MODEL_EMPTY
      let at = 0
      let count = 0
      for (const each of moves) {
        at += 1_000
        const ids = model.jobs.map((job) => job.id)
        const command: _Command_Agent_ | undefined = each.kind === "QUEUE"
          ? queue(`j-${count++}`, `T-${each.task}`, [`r-${count}`], at)
          : each.kind === "WAIT"
            ? (() => {
              const next = nextOf__Mailbox({ model_Agent: model, from: each.task === undefined ? { kind: "ANY" } : { kind: "TASK", id_Task: `T-${each.task}` } })
              return next === undefined ? undefined : { kind: "OFFER", id_Job: next.id, at }
            })()
            : each.kind === "LAPSE"
              ? { kind: "LAPSE", at: (at += each.seconds * 1_000) }
              : ids.length === 0 ? undefined : each.kind === "CHECK" ? { kind: "CHECK", id_Job: ids[each.job % ids.length]!, note: "", at } : { kind: each.kind, id_Job: ids[each.job % ids.length]!, at }
        if (command === undefined) continue
        const before = model
        model = after(model, command)
        for (const job of before.jobs) {
          if (job.state.kind === "DONE" || job.state.kind === "CANCELLED") expect(jobIn(model, job.id).state).toBe(job.state)
        }
        for (const task of new Set(model.jobs.map((job) => job.id_Task))) {
          const jobs = model.jobs.filter((job) => job.id_Task === task)
          const busy = jobs.filter((job) => job.state.kind === "OFFERED" || job.state.kind === "BEING_WORKED_ON")
          expect(busy.length).toBeLessThanOrEqual(1)
          for (const job of busy) expect(jobs.some((other) => other.state.kind === "QUEUED" && other.queued < job.queued)).toBe(false)
        }
      }
    }),
    { numRuns: 300 }
  )
})
