// the spike's endpoint: an in-memory mailbox of jobs, a wait held open till
// a job lands or as long as the agent asks, 50 seconds unless it says, a
// check-in telling an agent working a job whether it's been stopped, and
// every call logged, to see how a real harness session bears waiting on it;
// thrown away once it's answered that, as notes/AGENT.md says under a
// principle

import { mkdirSync, appendFileSync, writeFileSync } from "node:fs"

interface _Job_Spike_ {
  id: string
  notes: string
  state: "QUEUED" | "OFFERED" | "BEING_WORKED_ON" | "DONE" | "CANCELLED"
  made: number
  offered: number | null
  taken: number | null
  heard: number | null
  note_Last: string
  summary: string
}

interface _Entry_Log_ {
  at: number
  who: "AGENT" | "YOU"
  route: string
  held: number
  kind: string
  bytes: number
  labels: Array<string>
  session: string
}

const dir_State = new URL(".state/", import.meta.url).pathname
const seconds_Wait = 50
const command_Agent = "bun spikes/mailbox/agent.ts"

mkdirSync(dir_State, {
  recursive: true
})

const token_Agent = crypto.randomUUID()
const token_You = crypto.randomUUID()
const jobs: Array<_Job_Spike_> = []
let count_Jobs = 0
let waits_Open = 0
let wakers: Array<() => void> = []
let isClosing = false

const answerOf = (
  body: unknown,
  status: number
) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json"
  }
})

const logged = (entry: _Entry_Log_) => appendFileSync(`${dir_State}log.jsonl`, `${JSON.stringify(entry)}\n`)

const jobOf = (id: string) => jobs.find((job) => job.id === id)

const nextQueued = () => jobs.find((job) => job.state === "QUEUED")

const wakeAll = () => {
  const woken = wakers
  wakers = []
  for (const wake of woken) wake()
}

const waitCommandOf = (seconds: number) => `${command_Agent} wait${seconds === seconds_Wait ? "" : ` --for ${seconds}`}`

// a job a wait answers with is offered, not yet taken, till the agent's
// first check-in acknowledges it; an offer not acknowledged within a minute
// is queued again, at the front, so no job's lost to a caller that's gone
const ms_Offer = 60_000

const offered = (
  job: _Job_Spike_,
  seconds: number
) => {
  job.state = "OFFERED"
  job.offered = Date.now()
  job.heard = Date.now()
  setTimeout(() => {
    if (job.state !== "OFFERED") return
    job.state = "QUEUED"
    job.offered = null
    jobs.splice(jobs.indexOf(job), 1)
    jobs.unshift(job)
    wakeAll()
  }, ms_Offer)
  return {
    kind: "JOB",
    job: {
      id: job.id,
      notes: job.notes
    },
    next: `You're offered job ${job.id}. First, take it: run \`${command_Agent} check ${job.id} "starting"\` now, or it's offered to another agent in a minute. Then do what its notes ask, in this project. Between big steps, check in with \`${command_Agent} check ${job.id} "<what you're doing>"\`: it says whether the job's been stopped. When it's done, run \`${command_Agent} done ${job.id} "<one line on what you did>"\`, then run \`${waitCommandOf(seconds)}\` for the next job.`
  }
}

const nothingYetOf = (seconds: number) => ({
  kind: "NOTHING_YET",
  next: `Nothing yet. Run \`${waitCommandOf(seconds)}\` again.`
})

const closed = {
  kind: "CLOSED",
  next: "The mailbox has closed: stop waiting, and tell the person."
}

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  idleTimeout: 120,
  async fetch(request, server) {
    const url = new URL(request.url)
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "")
    const who = token === token_Agent ? "AGENT" : token === token_You ? "YOU" : null
    if (who === null) return answerOf({ issues: ["unknown token"] }, 401)
    const started = Date.now()
    const route = `${request.method} ${url.pathname}`
    const answered = (
      body: { kind: string },
      status: number
    ) => {
      const text = JSON.stringify(body)
      logged({
        at: started,
        who,
        route,
        held: Date.now() - started,
        kind: body.kind,
        bytes: text.length,
        labels: (request.headers.get("x-labels") ?? "").split(",").filter((label) => label !== ""),
        session: request.headers.get("x-session") ?? ""
      })
      return answerOf(body, status)
    }
    if (who === "AGENT" && route === "GET /wait") {
      const asked = Number(url.searchParams.get("for") ?? seconds_Wait)
      const seconds = Number.isFinite(asked) && asked >= 1 ? Math.min(Math.round(asked), 3600) : seconds_Wait
      server.timeout(request, 0)
      if (isClosing) return answered(closed, 200)
      const queued = nextQueued()
      if (queued !== undefined) return answered(offered(queued, seconds), 200)
      waits_Open += 1
      try {
        const until = started + seconds * 1000
        const gone = new Promise<void>((resolve) => request.signal.addEventListener("abort", () => resolve()))
        for (;;) {
          const woken = new Promise<void>((resolve) => wakers.push(resolve))
          const left = until - Date.now()
          if (left <= 0) return answered(nothingYetOf(seconds), 200)
          await Promise.race([
            woken,
            gone,
            Bun.sleep(left)
          ])
          if (request.signal.aborted) return answered({ kind: "GONE" }, 200)
          if (isClosing) return answered(closed, 200)
          const landed = nextQueued()
          if (landed !== undefined) return answered(offered(landed, seconds), 200)
        }
      } finally {
        waits_Open -= 1
      }
    }
    if (who === "AGENT" && route === "GET /take") {
      const queued = nextQueued()
      return answered(queued === undefined ? nothingYetOf(seconds_Wait) : offered(queued, seconds_Wait), 200)
    }
    const check = url.pathname.match(/^\/job\/([^/]+)\/check$/)
    if (who === "AGENT" && request.method === "POST" && check !== null) {
      const job = jobOf(check[1] ?? "")
      if (job === undefined) return answered({ kind: "REFUSED", issues: [`no job ${check[1]}`] } as { kind: string }, 404)
      const body = (await request.json()) as { note: string }
      if (job.state === "CANCELLED") return answered({ kind: "STOPPED", next: `Job ${job.id} was stopped: stop working on it, leave nothing half done, and run \`${command_Agent} wait\` for the next job.` }, 200)
      if (job.state === "QUEUED") return answered({ kind: "LAPSED", next: `Job ${job.id} wasn't taken in time, and is offered again: drop it, and run \`${command_Agent} wait\` for the next job.` }, 200)
      if (job.state === "OFFERED") {
        job.state = "BEING_WORKED_ON"
        job.taken = Date.now()
      }
      job.heard = Date.now()
      if (body.note !== "") job.note_Last = body.note
      return answered({ kind: "STILL_ON", next: `Job ${job.id}'s still yours: carry on, check in again between big steps, and when it's done run \`${command_Agent} done ${job.id} "<one line on what you did>"\`.` }, 200)
    }
    const done = url.pathname.match(/^\/job\/([^/]+)\/done$/)
    if (who === "AGENT" && request.method === "POST" && done !== null) {
      const job = jobOf(done[1] ?? "")
      if (job === undefined) return answered({ kind: "REFUSED", issues: [`no job ${done[1]}`] } as { kind: string }, 404)
      if (job.state === "CANCELLED") return answered({ kind: "STOPPED", next: `Job ${job.id} was stopped, so this isn't taken. Drop it, and run \`${command_Agent} wait\` for the next job.` }, 409)
      const body = (await request.json()) as { summary: string }
      job.state = "DONE"
      job.heard = Date.now()
      job.summary = body.summary
      return answered({ kind: "HANDED_BACK", next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same \`--for\` as before if you gave one.` }, 200)
    }
    if (who === "YOU" && route === "POST /drop") {
      const body = (await request.json()) as { notes: string }
      count_Jobs += 1
      const job: _Job_Spike_ = {
        id: `j-${count_Jobs}`,
        notes: body.notes,
        state: "QUEUED",
        made: Date.now(),
        offered: null,
        taken: null,
        heard: null,
        note_Last: "",
        summary: ""
      }
      jobs.push(job)
      wakeAll()
      return answered({ kind: "DROPPED", job: job.id } as { kind: string }, 200)
    }
    const stop = url.pathname.match(/^\/job\/([^/]+)\/stop$/)
    if (who === "YOU" && request.method === "POST" && stop !== null) {
      const job = jobOf(stop[1] ?? "")
      if (job === undefined || job.state === "DONE") return answered({ kind: "REFUSED" }, 409)
      job.state = "CANCELLED"
      return answered({ kind: "STOPPED" }, 200)
    }
    if (who === "YOU" && route === "GET /status") {
      return answered({
        kind: "STATUS",
        waits_Open,
        jobs: jobs.map((job) => ({
          ...job,
          quiet_Minutes: job.state === "BEING_WORKED_ON" && job.heard !== null ? Math.round((Date.now() - job.heard) / 60_000) : null
        }))
      } as { kind: string }, 200)
    }
    return answered({ kind: "REFUSED", issues: [`there's no route ${route} for you`] } as { kind: string }, 404)
  }
})

writeFileSync(`${dir_State}endpoint.json`, JSON.stringify({
  address: `http://127.0.0.1:${server.port}`,
  token_Agent,
  token_You
}))

// closing, every wait's answered closed, so none hangs, then the endpoint
// stops
const closing = () => {
  isClosing = true
  wakeAll()
  setTimeout(() => process.exit(0), 300)
}
process.on("SIGINT", closing)
process.on("SIGTERM", closing)

console.log(`mailbox at http://127.0.0.1:${server.port}, logging to ${dir_State}log.jsonl`)
