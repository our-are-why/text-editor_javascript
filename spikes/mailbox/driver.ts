// drops the spike's jobs on a schedule, as you would by hand, so a session
// can be tried without anyone at the keyboard: `hour`, quick jobs spread
// over an hour, `long`, over 22 minutes, for a wait held a quarter of an
// hour, or `short`, over four minutes, each with a slower one stopped once
// it's been worked on a while; its clock starting once an agent's waiting;
// exits once the last is handed back, or the schedule's run well over

import { readFileSync } from "node:fs"

interface _Step_Driver_ {
  at_Minutes: number
  notes: string
  stop_After_Seconds: number | null
}

const file_Endpoint = new URL(".state/endpoint.json", import.meta.url).pathname
const endpoint = JSON.parse(readFileSync(file_Endpoint, "utf8")) as { address: string, token_You: string }

const schedules: Record<string, { steps: Array<_Step_Driver_>, over_Minutes: number }> = {
  hour: {
    steps: [
      { at_Minutes: 0.5, notes: "Append the line 'one' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 3, notes: "Append the line 'two' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 10, notes: "Read every file in source/documents/ and write a one-paragraph summary of each to spikes/mailbox/sandbox/summary.md", stop_After_Seconds: 30 },
      { at_Minutes: 20, notes: "Append the line 'three' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 40, notes: "Append the line 'four' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 60, notes: "Append the line 'last' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null }
    ],
    over_Minutes: 90
  },
  long: {
    steps: [
      { at_Minutes: 1, notes: "Append the line 'long one' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 8, notes: "Append the line 'long two' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 12, notes: "Read every file directly in source/editor/, not its folders, one at a time, checking in after each, and write a one-paragraph summary of each to spikes/mailbox/sandbox/summary-editor.md", stop_After_Seconds: 45 },
      { at_Minutes: 22, notes: "Append the line 'long last' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null }
    ],
    over_Minutes: 45
  },
  short: {
    steps: [
      { at_Minutes: 0.25, notes: "Append the line 'short one' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 1, notes: "Append the line 'short two' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null },
      { at_Minutes: 2, notes: "Read every file directly in source/editor/, not its folders, and write a one-paragraph summary of each to spikes/mailbox/sandbox/summary-editor.md", stop_After_Seconds: 10 },
      { at_Minutes: 4, notes: "Append the line 'short last' to spikes/mailbox/sandbox/notes.md", stop_After_Seconds: null }
    ],
    over_Minutes: 15
  }
}
const schedule = schedules[process.argv[2] ?? "hour"]
if (schedule === undefined) throw new Error(`no schedule ${process.argv[2]}: hour or short`)
const steps = schedule.steps

const ask = async (
  method: string,
  path: string,
  body: unknown
) => {
  const response = await fetch(`${endpoint.address}${path}`, {
    method,
    headers: {
      "authorization": `Bearer ${endpoint.token_You}`,
      "content-type": "application/json"
    },
    ...body === undefined ? {} : { body: JSON.stringify(body) }
  })
  return await response.json() as { kind: string, job?: string, jobs?: Array<{ id: string, state: string }> }
}

const said = (line: string) => console.log(`${new Date().toLocaleTimeString()} ${line}`)

// the clock starts once an agent's waiting, so the schedule's timing holds
// however long it takes to open one
for (;;) {
  const status = await ask("GET", "/status", undefined) as { waits_Open?: number }
  if ((status.waits_Open ?? 0) > 0) break
  await Bun.sleep(1000)
}
said("an agent's waiting: the schedule starts")
const started = Date.now()
const ids: Array<string> = []
for (const step of steps) {
  await Bun.sleep(Math.max(started + step.at_Minutes * 60_000 - Date.now(), 0))
  const dropped = await ask("POST", "/drop", { notes: step.notes })
  const id = dropped.job ?? ""
  ids.push(id)
  said(`dropped ${id}: ${step.notes}`)
  if (step.stop_After_Seconds !== null) {
    for (;;) {
      const status = await ask("GET", "/status", undefined)
      if (status.jobs?.find((job) => job.id === id)?.state !== "QUEUED") break
      await Bun.sleep(1000)
    }
    said(`${id} taken`)
    await Bun.sleep(step.stop_After_Seconds * 1000)
    said(`stopping ${id}: ${(await ask("POST", `/job/${id}/stop`, undefined)).kind}`)
  }
}
const until = started + schedule.over_Minutes * 60_000
for (;;) {
  const status = await ask("GET", "/status", undefined)
  const last = status.jobs?.find((job) => job.id === ids.at(-1))
  if (last?.state === "DONE" || Date.now() > until) {
    said(`finished: ${status.jobs?.map((job) => `${job.id} ${job.state}`).join(", ")}`)
    break
  }
  await Bun.sleep(5000)
}
