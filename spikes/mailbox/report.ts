// what the log says of each agent session: by its harness, told by the
// names of the variables it set, and its session, by a hash, how many waits, how long
// between one answer and its next call, its longest silence, and how fast a
// job dropped in was taken

import { readFileSync } from "node:fs"

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

const file_Log = new URL(".state/log.jsonl", import.meta.url).pathname
const entries: Array<_Entry_Log_> = readFileSync(file_Log, "utf8").split("\n").filter((line) => line !== "").map((line) => JSON.parse(line))

const minutes = (ms: number) => `${(ms / 60_000).toFixed(1)} min`
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`

const harnessOf = (labels: Array<string>) => labels.some((name) => /^CLAUDE/.test(name)) ? "claude" : labels.some((name) => /agy|antigravity/i.test(name)) ? "agy" : labels.length === 0 ? "no harness variables" : labels.join(" ")

const sessions = new Map<string, Array<_Entry_Log_>>()
for (const entry of entries.filter((each) => each.who === "AGENT")) {
  const key = `${harnessOf(entry.labels)} · session ${entry.session}`
  sessions.set(key, [...sessions.get(key) ?? [], entry])
}

for (const [key, calls] of sessions) {
  const gaps = calls.slice(1).map((call, index) => {
    const before = calls[index]!
    return call.at - (before.at + before.held)
  })
  const first = calls[0]!
  const last = calls.at(-1)!
  console.log(`\n${key}`)
  console.log(`  from ${new Date(first.at).toLocaleTimeString()} to ${new Date(last.at + last.held).toLocaleTimeString()}, ${minutes(last.at + last.held - first.at)}`)
  console.log(`  ${calls.length} calls: ${calls.filter((call) => call.route === "GET /wait").length} waits, ${calls.filter((call) => call.kind === "JOB").length} jobs taken, ${calls.filter((call) => call.kind === "HANDED_BACK").length} handed back`)
  console.log(`  answers' bytes: ${calls.reduce((sum, call) => sum + call.bytes, 0)} in all, nothing-yet ones ${calls.filter((call) => call.kind === "NOTHING_YET").reduce((sum, call) => sum + call.bytes, 0)}`)
  if (gaps.length > 0) {
    const sorted = gaps.toSorted((one, other) => one - other)
    console.log(`  between an answer and its next call: median ${seconds(sorted[Math.floor(sorted.length / 2)]!)}, longest ${seconds(sorted.at(-1)!)}`)
  }
}

const drops = entries.filter((entry) => entry.who === "YOU" && entry.route === "POST /drop")
const takes = entries.filter((entry) => entry.kind === "JOB")
for (const [index, drop] of drops.entries()) {
  const take = takes[index]
  console.log(`\njob ${index + 1}: dropped ${new Date(drop.at).toLocaleTimeString()}, ${take === undefined ? "not taken" : `taken ${seconds(take.at + take.held - drop.at)} later`}`)
}
