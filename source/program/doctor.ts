import { resolve } from "node:path"
import { parseArgs } from "node:util"
import {
  commandOf__Doctor,
  filesOf__Project,
  pathFirstOf__Files,
  openedOf__Program,
  addressesOf__Program,
  endpointOf__Folder
} from "./index.ts"

const COMMAND_DOCTOR = commandOf__Doctor()

const USAGE = `doctor, the agent's side. Working through it is a loop: run \`${COMMAND_DOCTOR} wait\`, do what its "next" says, and wait again.

  ${COMMAND_DOCTOR} wait [--for <seconds>] [--task <id>]
      wait for a job: 50 seconds, or as long as you say, up to 3600; longer if
      your harness backgrounds a long command and wakes you when it ends;
      --task, only that task's jobs
  ${COMMAND_DOCTOR} take [--task <id>]
      take a job now, if one's queued
  ${COMMAND_DOCTOR} check <job> ["<note>"]
      take a job you're offered, then check in on it between big steps: says
      if it's been stopped; the note, what you're doing
  ${COMMAND_DOCTOR} done <job> "<note>"
      hand a job back, with what you did

Every answer is one line of JSON with "next", the step to take.

And the person's: ${COMMAND_DOCTOR} open [folder] [--file <path>] [--port <port>]
      open doctor on a project, its folder or this one, serving its editor`

const {
  values,
  positionals
} = parseArgs({
  args: process.argv.slice(2),
  options: {
    file: {
      type: "string"
    },
    port: {
      type: "string"
    },
    for: {
      type: "string"
    },
    task: {
      type: "string"
    }
  },
  allowPositionals: true
})
const [
  command,
  first,
  second
] = positionals

if (command === "open") {
  const dir_Project = resolve(first ?? ".")
  const files = await filesOf__Project({
    dir_Project
  })
  const path_Shown = values.file ?? pathFirstOf__Files({
    files
  })
  if (path_Shown === undefined) {
    console.log(`There's no text file in ${dir_Project} to open.`)
    process.exit(1)
  }
  const program = await openedOf__Program({
    dir_Project,
    files,
    path_First: path_Shown,
    port: Number(values.port ?? "0")
  })
  const addresses = addressesOf__Program({
    program,
    uri_Proxy: process.env["VSCODE_PROXY_URI"]
  })
  console.log(`doctor's open on ${dir_Project}, showing ${path_Shown}:`)
  if (addresses.page_Proxied === undefined) {
    console.log(`  ${addresses.page}`)
  } else {
    console.log(`  ${addresses.page_Proxied}`)
    console.log(`  (through code-server; inside its container, ${addresses.page})`)
  }
  console.log(`To point an agent at it, open Claude Code or agy in ${dir_Project}, and ask it to run \`${program.command_Agent} help\` and do as it says.`)
  process.on(
    "SIGINT",
    () => {
      program.stop().then(() => process.exit(0))
    }
  )
} else if (command === "wait" || command === "take" || (command === "check" && first !== undefined) || (command === "done" && first !== undefined && second !== undefined)) {
  const endpoint = await endpointOf__Folder({
    dir: process.cwd()
  })
  if (endpoint === undefined) {
    console.log(JSON.stringify({
      kind: "NO_DOCTOR",
      next: "doctor isn't open on this project: tell the person, and stop."
    }))
    process.exit(1)
  }
  const query = new URLSearchParams()
  if (values.for !== undefined) {
    query.set(
      "for",
      values.for
    )
  }
  if (values.task !== undefined) {
    query.set(
      "task",
      values.task
    )
  }
  const isPosted = command === "check" || command === "done"
  const path = isPosted ? `agent/job/${encodeURIComponent(first ?? "")}/${command}` : `agent/${command}?${query}`
  try {
    const response = await fetch(
      `${endpoint.address}${path}`,
      {
        method: isPosted ? "POST" : "GET",
        timeout: false,
        headers: {
          "authorization": `Bearer ${endpoint.token_Agent}`,
          "content-type": "application/json"
        },
        ...isPosted
          ? {
            body: JSON.stringify({
              note: second ?? ""
            })
          }
          : {}
      }
    )
    console.log(JSON.stringify(await response.json()))
    if (!response.ok) process.exitCode = 1
  } catch {
    console.log(JSON.stringify({
      kind: "NO_DOCTOR",
      next: "doctor isn't answering: tell the person, and stop."
    }))
    process.exitCode = 1
  }
} else {
  console.log(USAGE)
  if (command !== "help") process.exitCode = 1
}
