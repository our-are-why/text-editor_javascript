import {
  expect,
  test
} from "bun:test"
import {
  mkdtemp,
  rm
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { madeOf__Demo } from "../scripts/demo.ts"
import {
  filesOf__Project,
  openedOf__Program
} from "../source/program/index.ts"
import type {
  _Message_Page_,
  _Message_Shell_
} from "../source/core/shell/index.ts"

// the agent's side of doctor, end to end: doctor open on a fresh demo of the
// retry sample, held here, and the doctor command run as an agent runs it,
// from inside the project, finding the endpoint by .doctor/; a request made
// and started as the editor asks, by the shell, its job waited for, taken,
// checked in on and handed back, its request then addressed with the
// agent's note; a job stopped, the agent told so, what it hands back
// refused; a caller that's gone never given a job; a wait kept to another
// task given none; a call without the agent's token refused; a project with
// no doctor open said so; the project's files listed for the page's token,
// as VS Code's adapter asks them; two pages told the core's state alike, a
// request made through one seen by the other, the core knowing nothing of
// either; and a wait answered closed as doctor stops

const dir_Demos = await mkdtemp(join(tmpdir(), "doctor-test-"))
const dir_Demo = await madeOf__Demo({
  name_Sample: "retry",
  dir_Demos
})
const program = await openedOf__Program({
  dir_Project: dir_Demo,
  files: await filesOf__Project({
    dir_Project: dir_Demo
  }),
  path_First: "README.md",
  port: 0
})

interface _Ran_Doctor_ {
  answer: Record<string, unknown>
  code: number
}

const doctorIn = async (
  dir: string,
  ...args: Array<string>
): Promise<_Ran_Doctor_> => {
  const subprocess = Bun.spawn(
    [
      "bun",
      join(import.meta.dir, "..", "source", "program", "doctor.ts"),
      ...args
    ],
    {
      cwd: dir,
      stdout: "pipe"
    }
  )
  const out = await new Response(subprocess.stdout).text()
  return {
    answer: JSON.parse(out),
    code: await subprocess.exited
  }
}
const doctor = (...args: Array<string>) => doctorIn(
  dir_Demo,
  ...args
)
const requested = (notes: string) => program.shell.handle(program.shell.taskOf("T-1") === undefined
  ? {
    kind: "DRAFT",
    request: {
      id: `request-${notes}`,
      notes,
      aim: {
        kind: "DOCUMENT",
        path: "README.md",
        words: {
          kind: "ALL"
        }
      }
    },
    isStarting: true,
    path: "README.md"
  }
  : {
    kind: "REQUEST",
    id_Task: "T-1",
    request: {
      id: `request-${notes}`,
      notes,
      aim: {
        kind: "DOCUMENT",
        path: "README.md",
        words: {
          kind: "ALL"
        }
      }
    },
    isStarting: true,
    path: "README.md"
  })
await program.kept("README.md")
const stateOf = (id_Job: string) => program.shell.state().jobs.find((job) => job.id === id_Job)?.state.kind
const requestOf = (notes: string) => program.shell.tasks.model_Tasks.tasks.flatMap((task) => task.requests).find((request) => request.notes === notes)

interface _Page_Test_ {
  messages: Array<_Message_Shell_>
  socket: WebSocket
}

const pageOpened = async (): Promise<_Page_Test_> => {
  const url = new URL(`socket?token=${program.token_Page}`, program.server.url)
  url.protocol = "ws:"
  const socket = new WebSocket(url)
  const messages: Array<_Message_Shell_> = []
  socket.addEventListener("message", (event) => messages.push(JSON.parse(String(event.data))))
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }))
  return {
    messages,
    socket
  }
}
const page_Listening = await pageOpened()
await Bun.sleep(200)
const listening_Before = page_Listening.messages.map((message) => message.isListening_Agent)
const ran_Nothing = await doctor("wait", "--for", "1")
const listening_After = page_Listening.messages.map((message) => message.isListening_Agent)
page_Listening.socket.close()
const waiting = doctor("wait", "--for", "20")
await Bun.sleep(600)
requested("Say what it retries.")
const ran_Job = await waiting
const ran_Taken = await doctor("check", "j-1", "starting")
const state_Taken = stateOf("j-1")
const ran_Still = await doctor("check", "j-1", "reading README.md")
const ran_Done = await doctor("done", "j-1", "Nothing needs to change: its first line says what it retries.")
const request_Done = requestOf("Say what it retries.")

requested("Stop me.")
const ran_Stopping = await doctor("take")
program.shell.handle({
  kind: "STOP",
  id_Task: "T-1",
  scope: {
    kind: "TASK"
  }
})
const ran_Stopped = await doctor("check", "j-2", "still reading")
const ran_Refused = await doctor("done", "j-2", "Did it anyway.")
const request_Stopped = requestOf("Stop me.")

const controller = new AbortController()
const gone = fetch(
  `${program.server.url}agent/wait?for=20`,
  {
    headers: {
      authorization: `Bearer ${program.token_Agent}`
    },
    signal: controller.signal
  }
).catch(() => "aborted")
await Bun.sleep(200)
controller.abort()
await gone
await Bun.sleep(100)
requested("Wait for an agent that's here.")
await Bun.sleep(200)
const state_Gone = stateOf("j-3")
const ran_Elsewhere = await doctor("wait", "--for", "1", "--task", "T-9")
const status_Unasked = (await fetch(`${program.server.url}agent/take`)).status
const ran_Nowhere = await doctorIn(dir_Demos, "wait", "--for", "1")
const ran_Help = await Bun.$`bun ${join(import.meta.dir, "..", "source", "program", "doctor.ts")} help`.cwd(dir_Demo).quiet()

const listedFor = (token: string) => fetch(
  `${program.server.url}page/files`,
  {
    headers: {
      authorization: `Bearer ${token}`
    }
  }
)
const status_Unlisted = (await listedFor(program.token_Agent)).status
const files_Listed: unknown = await (await listedFor(program.token_Page)).json()

const page_A = await pageOpened()
const page_B = await pageOpened()
await Bun.sleep(200)
const sent = (page: _Page_Test_, message_Page: _Message_Page_) => page.socket.send(JSON.stringify(message_Page))
sent(page_A, {
  kind: "OPEN",
  path: "retry.js"
})
await Bun.sleep(300)
sent(page_A, {
  kind: "COMMAND",
  command_Shell: {
    kind: "DRAFT",
    request: {
      id: "request-two-pages",
      notes: "Two pages.",
      aim: {
        kind: "DOCUMENT",
        path: "retry.js",
        words: {
          kind: "ALL"
        }
      }
    },
    isStarting: false,
    path: "retry.js"
  }
})
await Bun.sleep(300)
const lastOf = (page: _Page_Test_) => page.messages.at(-1)
const seen_Pages = [page_A, page_B].map((page) => ({
  isOpened: lastOf(page)?.state_Shell.documents.some((document) => document.path === "retry.js") ?? false,
  isDrafted: lastOf(page)?.state_Shell.model_Tasks.tasks.some((task) => task.requests.some((request) => request.id === "request-two-pages")) ?? false,
  files: lastOf(page)?.files ?? []
}))
page_A.socket.close()
page_B.socket.close()

const closing = doctor("wait", "--for", "20", "--task", "T-9")
await Bun.sleep(600)
await program.stop()
const ran_Closed = await closing
await rm(
  dir_Demos,
  {
    recursive: true
  }
)

test("a wait with nothing queued is answered nothing yet, in time, saying to wait again as it was asked", () => {
  expect(ran_Nothing.answer["kind"]).toBe("NOTHING_YET")
  expect(String(ran_Nothing.answer["next"])).toContain("wait --for 1`")
  expect(ran_Nothing.code).toBe(0)
})

test("a request started while an agent waits is its job at once, offered with its brief: the task, its requests, the rest of the task to inform it, and the next step, to take it", () => {
  expect(ran_Job.answer["kind"]).toBe("JOB")
  const job = ran_Job.answer["job"] as { id: string, brief: { task: { name: string }, requests: Array<{ notes: string }>, files: Array<string> } }
  expect(job.id).toBe("j-1")
  expect(job.brief.task.name).toBe("Say what it retries.")
  expect(job.brief.requests.map((request) => request.notes)).toEqual(["Say what it retries."])
  expect(job.brief.files).toEqual(["README.md"])
  expect(String(ran_Job.answer["next"])).toContain("check j-1 \"starting\"")
})

test("a first check-in takes the job, later ones keep it heard of, each saying what's next", () => {
  expect([ran_Taken.answer["kind"], state_Taken, ran_Still.answer["kind"]]).toEqual(["TAKEN", "BEING_WORKED_ON", "STILL_ON"])
})

test("handed back, the job's done, and its request addressed with the agent's note, nothing changed", () => {
  expect(ran_Done.answer["kind"]).toBe("HANDED_BACK")
  expect(request_Done?.status).toEqual({
    kind: "ADDRESSED",
    answer: {
      kind: "NOTHING",
      note: "Nothing needs to change: its first line says what it retries."
    }
  })
})

test("Stop cancels a job taken: its agent's told at its next check-in, what it hands back after refused, and its request staged again", () => {
  expect(ran_Stopping.answer["kind"]).toBe("JOB")
  expect([ran_Stopped.answer["kind"], ran_Refused.answer["kind"]]).toEqual(["STOPPED", "STOPPED"])
  expect(request_Stopped?.status.kind).toBe("STAGED")
})

test("a wait whose caller's gone is never given a job, which stays queued for the next", () => {
  expect(state_Gone).toBe("QUEUED")
})

test("a wait kept to one task is given none of another's", () => {
  expect(ran_Elsewhere.answer["kind"]).toBe("NOTHING_YET")
  expect(String(ran_Elsewhere.answer["next"])).toContain("--task T-9")
})

test("a call without the agent's token is refused, and the command run where no doctor's open says so", () => {
  expect(status_Unasked).toBe(401)
  expect([ran_Nowhere.answer["kind"], ran_Nowhere.code]).toEqual(["NO_DOCTOR", 1])
})

test("a page is told whether an agent's listening: no agent having called, none is; a wait open, one is, told at once; and still, the wait answered, an agent having called within the minute", () => {
  expect(listening_Before).toEqual([false])
  expect(listening_After).toEqual([false, true])
})

test("help says the loop, each of the agent's commands, and the person's", () => {
  const help = ran_Help.stdout.toString()
  for (const command of ["wait [--for <seconds>] [--task <id>]", "take [--task <id>]", "check <job>", "done <job>", "open [folder]"]) expect(help).toContain(command)
})

test("the project's files are listed for the page's token, as VS Code's adapter asks them, never for another's", () => {
  expect(status_Unlisted).toBe(403)
  expect(files_Listed).toEqual(["README.md", "package.json", "retry.js"])
})

test("two pages are told the core's state alike: a file one opens, and a task one drafts, seen by both, with the project's files; the core knowing nothing of either", () => {
  expect(seen_Pages).toEqual([
    {
      isOpened: true,
      isDrafted: true,
      files: ["README.md", "package.json", "retry.js"]
    },
    {
      isOpened: true,
      isDrafted: true,
      files: ["README.md", "package.json", "retry.js"]
    }
  ])
})

test("a wait open as doctor stops is answered closed, so none hangs", () => {
  expect(ran_Closed.answer["kind"]).toBe("CLOSED")
})
