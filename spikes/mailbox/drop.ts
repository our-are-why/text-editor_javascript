// your side of the spike's mailbox: drop a job in, see where things stand,
// stop a job

import { readFileSync } from "node:fs"

const file_Endpoint = new URL(".state/endpoint.json", import.meta.url).pathname

const usage = `the spike's mailbox, your side:

  bun spikes/mailbox/drop.ts "<what the job asks>"   drop a job in
  bun spikes/mailbox/drop.ts status                  jobs, and waits open
  bun spikes/mailbox/drop.ts stop <job>              stop a job`

const endpoint = (() => {
  try {
    return JSON.parse(readFileSync(file_Endpoint, "utf8")) as { address: string, token_You: string }
  } catch {
    return null
  }
})()

const ask = async (
  method: string,
  path: string,
  body: unknown
) => {
  if (endpoint === null) {
    console.log("the mailbox isn't running: bun spikes/mailbox/server.ts")
    return
  }
  const response = await fetch(`${endpoint.address}${path}`, {
    method,
    headers: {
      "authorization": `Bearer ${endpoint.token_You}`,
      "content-type": "application/json"
    },
    ...body === undefined ? {} : { body: JSON.stringify(body) }
  })
  console.log(JSON.stringify(await response.json(), null, 2))
}

const [first, second] = process.argv.slice(2)
if (first === undefined || first === "help") console.log(usage)
else if (first === "status") await ask("GET", "/status", undefined)
else if (first === "stop" && second !== undefined) await ask("POST", `/job/${second}/stop`, undefined)
else await ask("POST", "/drop", { notes: first })
