// the agent's side of the spike's mailbox: wait for a job, as long as you
// ask, take one at once, check in on one, and hand one back; every answer
// one line of JSON saying the next step

import { readFileSync } from "node:fs"

const file_Endpoint = new URL(".state/endpoint.json", import.meta.url).pathname
const command_Agent = "bun spikes/mailbox/agent.ts"

const usage = `the spike's mailbox, the agent's side. Working through it is a loop:
run \`${command_Agent} wait\`, do what its "next" says, and wait again.

  ${command_Agent} wait [--for <seconds>]  wait for a job, and take it: 50 seconds,
                                          or as long as you say, up to 3600; longer
                                          if your harness backgrounds a long command
                                          and wakes you when it ends
  ${command_Agent} take                    take a job now, if one's queued
  ${command_Agent} check <job> ["<note>"]  check in on a job: says if it's been
                                          stopped; the note, what you're doing
  ${command_Agent} done <job> "<summary>"  hand a job back, with one line on what you did

Every answer is one line of JSON with "next", the step to take.`

// the names of the environment's variables that look like a harness's, never
// their values, so the log can tell harnesses apart; and a short hash of any
// session id among them, never the id itself, so it can tell sessions apart
const labels = Object.keys(process.env).filter((name) => /claude|agy|antigravity|gemini|codex|cursor|copilot/i.test(name)).sort()
const session = new Bun.CryptoHasher("sha256").update(labels.filter((name) => /session_?id/i.test(name)).map((name) => process.env[name] ?? "").join("|")).digest("hex").slice(0, 8)

const endpointOf = () => {
  try {
    return JSON.parse(readFileSync(file_Endpoint, "utf8")) as { address: string, token_Agent: string }
  } catch {
    return null
  }
}

const said = (body: unknown) => {
  console.log(JSON.stringify(body))
}

const [command, id, summary] = process.argv.slice(2)
const seconds_For = command === "wait" && id === "--for" ? Number(summary) : null
const endpoint = endpointOf()
if (command === undefined || command === "help") {
  console.log(usage)
} else if (endpoint === null) {
  said({ kind: "NO_MAILBOX", next: "The mailbox isn't running: tell the person, and stop." })
  process.exitCode = 1
} else {
  const ask = async (
    method: string,
    path: string,
    body: unknown
  ) => {
    try {
      const response = await fetch(`${endpoint.address}${path}`, {
        method,
        timeout: false,
        headers: {
          "authorization": `Bearer ${endpoint.token_Agent}`,
          "content-type": "application/json",
          "x-labels": labels.join(","),
          "x-session": session
        },
        ...body === undefined ? {} : { body: JSON.stringify(body) }
      })
      said(await response.json())
      if (!response.ok) process.exitCode = 1
    } catch {
      said({ kind: "NO_MAILBOX", next: "The mailbox isn't answering: tell the person, and stop." })
      process.exitCode = 1
    }
  }
  if (command === "wait" && (id === undefined || (seconds_For !== null && Number.isFinite(seconds_For)))) await ask("GET", `/wait${seconds_For === null ? "" : `?for=${seconds_For}`}`, undefined)
  else if (command === "take") await ask("GET", "/take", undefined)
  else if (command === "check" && id !== undefined) await ask("POST", `/job/${id}/check`, { note: summary ?? "" })
  else if (command === "done" && id !== undefined && summary !== undefined) await ask("POST", `/job/${id}/done`, { summary })
  else {
    console.log(usage)
    process.exitCode = 1
  }
}
