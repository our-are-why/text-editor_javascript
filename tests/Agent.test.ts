import { expect, test } from "bun:test"
import { _Tasks_ } from "../source/core/tasks/index.ts"
import { _Documents_, parseTexts_Line } from "../source/core/documents/index.ts"
import { _Shell_ } from "../source/core/shell/index.ts"
import { _Agent_, MS_LAPSE__OFFER, type _Answer_Agent_, type _From_Wait_, type _Copy_Agent_ } from "../source/agent/protocol/index.ts"

// the agent's adapter over a real core: a wait offered the job it may take,
// an offer lapsing a minute on, and each call answered by where its job
// stands, a check-in taking an offered job in the core, a hand back landing
// it; the core holding the jobs, the adapter only its offers

const COMMAND = "doctor"
const COPY_NONE: _Copy_Agent_ = { kind: "NONE", why: "these tests make no copies" }
const wired = () => {
  let agent: _Agent_ | undefined
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: (state_Shell) => agent?.heard(state_Shell), started: () => {}, stopped: () => {}, landed: () => {} }]
  })
  agent = new _Agent_({ state_Shell: shell.state(), observers: [{ sent: (command_Shell) => shell.handle(command_Shell) }] })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "README.md", text: { lines: parseTexts_Line("# retry\n"), marks: [] } })
  return { shell, agent }
}
const madeOf = (notes: string) => ({ id: `r-${notes}`, notes, aim: { kind: "DOCUMENT" as const, path: "README.md", words: { kind: "ALL" as const } } })
const ANY: _From_Wait_ = { kind: "ANY" }
const offered = (agent: _Agent_, from: _From_Wait_, at: number) => {
  const answer: _Answer_Agent_ | undefined = agent.offeredOf({ from, at, copyOf: () => COPY_NONE, command_Agent: COMMAND, command_Wait: `${COMMAND} wait` })
  return answer === undefined ? "none" : answer.kind === "JOB" ? answer.job.id : answer.kind
}

test("a wait's offered the first job it may take, of any task, one at a time within a task, at once across tasks; kept to a task, only that task's; an offer not taken isn't offered again till it lapses, a minute on, keeping its place", () => {
  const { shell, agent } = wired()
  shell.handle({ kind: "DRAFT", request: madeOf("a"), isStarting: true, path: "README.md" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("b"), isStarting: true, path: "README.md" })
  shell.handle({ kind: "DRAFT", request: madeOf("c"), isStarting: true, path: "README.md" })
  const offers = [offered(agent, { kind: "TASK", id_Task: "T-2" }, 1_000), offered(agent, ANY, 1_000), offered(agent, ANY, 1_000)]
  const lapsed = [offered(agent, { kind: "TASK", id_Task: "T-1" }, 1_000 + MS_LAPSE__OFFER - 1), offered(agent, { kind: "TASK", id_Task: "T-1" }, 1_000 + MS_LAPSE__OFFER)]
  expect(offers).toEqual(["j-3", "j-1", "none"])
  expect(lapsed).toEqual(["none", "j-1"])
  expect(shell.state().jobs.map((job) => job.state.kind)).toEqual(["QUEUED", "QUEUED", "QUEUED"])
})

test("a check-in on a job offered takes it in the core, later ones keeping it heard of; handed back, it's done, its request addressed with the agent's note; once done, refused; an offer lapsed is told so; a job stopped is answered stopped, what it hands back refused; a job that isn't, refused", () => {
  const { shell, agent } = wired()
  const called = (kind_Call: "CHECK" | "DONE", id_Job: string, note: string, at: number) => agent.called({ kind_Call, id_Job, note, said: {}, copy: COPY_NONE, clashesOf: () => [], at, command_Agent: COMMAND }).kind
  shell.handle({ kind: "DRAFT", request: madeOf("a"), isStarting: true, path: "README.md" })
  offered(agent, ANY, 0)
  const answers_Worked = [called("CHECK", "j-1", "starting", 10), called("CHECK", "j-1", "reading README.md", 20)]
  const state_Worked = shell.jobOf("j-1")?.state
  const answers_Done = [called("DONE", "j-1", "Nothing needs to change.", 30), called("DONE", "j-1", "Again.", 40)]
  const status_Done = shell.taskOf("T-1")?.requests.find((request) => request.id === "r-a")?.status
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("b"), isStarting: true, path: "README.md" })
  offered(agent, ANY, 100)
  const answer_Lapsed = called("CHECK", "j-2", "starting", 100 + MS_LAPSE__OFFER)
  shell.handle({ kind: "STOP", id_Task: "T-1", scope: { kind: "TASK" } })
  const answers_Stopped = [called("CHECK", "j-2", "still reading", 200), called("DONE", "j-2", "Did it anyway.", 210), called("CHECK", "j-9", "", 220)]
  expect(answers_Worked).toEqual(["TAKEN", "STILL_ON"])
  expect(state_Worked).toEqual({ kind: "BEING_WORKED_ON", taken: expect.any(Number), heard: expect.any(Number), note: "reading README.md", givens: expect.any(Array) })
  expect(answers_Done).toEqual(["HANDED_BACK", "REFUSED"])
  expect([status_Done?.kind, JSON.stringify(status_Done)]).toEqual(["ADDRESSED", expect.stringContaining("Nothing needs to change.")])
  expect(answer_Lapsed).toBe("LAPSED")
  expect(answers_Stopped).toEqual(["STOPPED", "STOPPED", "REFUSED"])
  expect(shell.state().jobs.map((job) => `${job.id} ${job.state.kind}`)).toEqual(["j-1 DONE", "j-2 CANCELLED"])
})

test("done on a job offered and never checked in on takes it and hands it back at once", () => {
  const { shell, agent } = wired()
  shell.handle({ kind: "DRAFT", request: madeOf("a"), isStarting: true, path: "README.md" })
  offered(agent, ANY, 0)
  const answer = agent.called({ kind_Call: "DONE", id_Job: "j-1", note: "Nothing needs to change.", said: {}, copy: COPY_NONE, clashesOf: () => [], at: 10, command_Agent: COMMAND })
  expect([answer.kind, shell.jobOf("j-1")?.state.kind]).toEqual(["HANDED_BACK", "DONE"])
})
