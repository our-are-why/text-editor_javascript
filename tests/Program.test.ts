import {
  expect,
  test
} from "bun:test"
import {
  mkdtemp,
  mkdir,
  rm
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { madeOf__Demo } from "../scripts/demo.ts"
import {
  filesOf__Project,
  openedOf__Program,
  checkedOf__Project
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
// no doctor open said so; a job taken given a working copy, a git worktree
// of the project, outside it, as the task has it, a file the agent deleted
// in it, the program's first, one it made and its edit, numbered, its
// grouping verified and handed back, a proposal landed for review for each,
// the project as it was till the deletion and the new file are accepted and
// the task applied, then the one deleted and the other made, and the copy
// taken away once the task ends; the project's files listed for the page's
// token, as they are, its first one still there,
// as VS Code's adapter asks them; two pages told the core's state alike, a
// request made through one seen by the other, the core knowing nothing of
// either; and a wait answered closed as doctor stops

const dir_Demos = await mkdtemp(join(tmpdir(), "doctor-test-"))
const dir_Demo = await madeOf__Demo({
  name_Sample: "retry",
  dir_Demos
})
const dir_Loose = await mkdtemp(join(dir_Demos, "loose-"))
await Bun.write(join(dir_Loose, "notes.md"), "# notes\n")
const dir_Fresh = join(dir_Demos, "fresh")
await mkdir(dir_Fresh)
await Bun.write(join(dir_Fresh, "notes.md"), "# notes\n")
await Bun.$`git -C ${dir_Fresh} init -q`.quiet()
const dir_Sub = join(dir_Demo, "sub")
await mkdir(dir_Sub)
const checked_Projects = await Promise.all([dir_Loose, dir_Sub, dir_Fresh, dir_Demo].map((dir_Project) => checkedOf__Project({ dir_Project })))
const opened_Loose = await openedOf__Program({ dir_Project: dir_Loose, files: ["notes.md"], path_First: "notes.md", dir_Copies: join(dir_Demos, "copies-loose"), port: 0 }).then(() => "opened", (error: unknown) => error instanceof Error ? error.message : String(error))
const ran_Loose = await Bun.$`bun ${join(import.meta.dir, "..", "source", "program", "doctor.ts")} open ${dir_Loose}`.quiet().nothrow()
const program = await openedOf__Program({
  dir_Project: dir_Demo,
  files: await filesOf__Project({
    dir_Project: dir_Demo
  }),
  path_First: "README.md",
  dir_Copies: join(dir_Demos, "copies"),
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
const isClocked = page_Listening.messages.every((message) => Math.abs(message.at - Date.now()) < 10_000)
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

await doctor("take")
const ran_Copied = await doctor("check", "j-3", "starting")
const dir_Copy = String(ran_Copied.answer["copy"])
const text_README = await Bun.file(join(dir_Demo, "README.md")).text()
const copy_Given = {
  isOutside: !dir_Copy.startsWith(dir_Demo),
  isAsGiven: await Bun.file(join(dir_Copy, "README.md")).text() === text_README,
  diff: (await Bun.$`git -C ${dir_Copy} status --porcelain`.quiet().text()).trim(),
  worktrees: (await Bun.$`git -C ${dir_Demo} worktree list --porcelain`.quiet().text()).includes(dir_Copy)
}
const text_Retry = await Bun.file(join(dir_Demo, "retry.js")).text()
const text_Backoff = "# Backoff\n\nEach retry waits twice as long as the one before.\n"
await rm(join(dir_Copy, "README.md"))
await Bun.write(join(dir_Copy, "docs", "backoff.md"), text_Backoff)
await Bun.write(join(dir_Copy, "retry.js"), text_Retry.replace("const ATTEMPTS = 5;", "const ATTEMPTS = 3;"))
const ran_Changes = await doctorIn(dir_Copy, "changes", "j-3")
const path_Grouping = join(dir_Demos, "grouping.json")
await Bun.write(path_Grouping, JSON.stringify({
  stamp: ran_Changes.answer["stamp"],
  frames: [
    {
      path: "README.md",
      first: 1,
      last: text_README.split("\n").length
    },
    {
      path: "docs/backoff.md",
      first: 1,
      last: 1
    },
    {
      path: "retry.js",
      first: 4,
      last: 5
    }
  ],
  proposals: [
    {
      title: "Drop the README",
      why: "Its doc comment says it all.",
      changes: [1],
      answers: ["request-Wait for an agent that's here."]
    },
    {
      title: "Say how it backs off",
      why: "How long each wait is is worth a page of its own.",
      changes: [2],
      answers: ["request-Wait for an agent that's here."]
    },
    {
      title: "Fewer attempts",
      why: "Five is too many.",
      changes: [3],
      answers: ["request-Wait for an agent that's here."]
    }
  ]
}))
const ran_Changes_Said = await doctorIn(dir_Copy, "changes", "j-3", path_Grouping)
const ran_Verified = await doctorIn(dir_Copy, "verify", "j-3", path_Grouping)
const ran_Previewed = await doctorIn(dir_Copy, "preview", "j-3", path_Grouping)
const ran_Landed = await doctorIn(dir_Copy, "done", "j-3", "Named its backoff.", path_Grouping)
const landed_Copy = {
  proposals: program.shell.taskOf("T-1")?.proposals.map((proposal) => [proposal.id, proposal.effect, proposal.title]),
  status: requestOf("Wait for an agent that's here.")?.status,
  frames: program.shell.taskOf("T-1")?.heads.map((head) => [head.path, head.frames]),
  isUnchanged: await Bun.file(join(dir_Demo, "README.md")).text() === text_README && await Bun.file(join(dir_Demo, "retry.js")).text() === text_Retry && !(await Bun.file(join(dir_Demo, "docs", "backoff.md")).exists()),
  files: program.files
}
for (const [
  id_Proposal,
  decision
] of [
  ["j-3.1", "ACCEPTED"],
  ["j-3.2", "ACCEPTED"],
  ["j-3.3", "REJECTED"]
] as const) {
  program.shell.handle({
    kind: "DECIDE",
    id_Task: "T-1",
    id_Proposal,
    decision
  })
}
program.shell.handle({
  kind: "END",
  id_Task: "T-1",
  kind_End: "APPLY"
})
await Bun.sleep(1500)
const applied_Copy = {
  isREADME_Gone: !(await Bun.file(join(dir_Demo, "README.md")).exists()),
  text_Backoff: await Bun.file(join(dir_Demo, "docs", "backoff.md")).text().catch(() => "none"),
  text_Retry: await Bun.file(join(dir_Demo, "retry.js")).text() === text_Retry,
  files: program.files,
  path_First: program.pathFirst()
}
const isCopy_Gone = !(await Bun.file(join(dir_Copy, "retry.js")).exists())

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
  files: lastOf(page)?.files ?? [],
  path_First: lastOf(page)?.path_First
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

test("every state a page is told carries the program's clock, so a page anywhere measures how long a job's been quiet by it", () => {
  expect(isClocked).toBe(true)
})

test("help says the loop, each of the agent's commands, and the person's", () => {
  const help = ran_Help.stdout.toString()
  for (const command of ["wait [--for <seconds>] [--task <id>]", "take [--task <id>]", "check <job>", "changes <job>", "verify <job> <file>", "done <job>", "open [folder]"]) expect(help).toContain(command)
})

test("a job taken is given a working copy, a git worktree of the project outside it, its files as given, nothing changed in it to git, doctor found from inside it; a file deleted there, the request's and the program's first, one made and an edit, numbered, the file each made or deleted one change of its whole text, said so, its grouping verified and handed back, a proposal landed for review for each, a deletion, a new file and a change, its request answered by them, the project itself unchanged; the deletion and the new file accepted and the task applied, the one deleted and the other made, the project's files listed as they now are, and its first file one still there; the copy taken away once the task ends", () => {
  expect([ran_Copied.answer["kind"], copy_Given]).toEqual(["TAKEN", { isOutside: true, isAsGiven: true, diff: "", worktrees: true }])
  expect(ran_Changes.answer["changes"]).toEqual([
    { number: 1, path: "README.md", file: "deleted", move: "", lines: `1–${text_README.split("\n").length}`, before: text_README, after: "" },
    { number: 2, path: "docs/backoff.md", file: "made", move: "", lines: "1", before: "", after: text_Backoff },
    { number: 3, path: "retry.js", file: "changed", move: "", lines: "4", before: "5", after: "3" }
  ])
  expect([ran_Changes.answer["frames"], ran_Changes_Said.answer["kind"], ran_Changes_Said.answer["stamp"], ran_Changes_Said.answer["issues"]]).toEqual([[], "CHANGES", ran_Changes.answer["stamp"], []])
  expect([ran_Verified.answer["kind"], ran_Verified.answer["issues"]]).toEqual(["VERIFIED", []])
  expect([ran_Previewed.answer["kind"], ran_Previewed.answer["issues"]]).toEqual(["PREVIEW", []])
  expect((ran_Previewed.answer["files"] as Array<{ path: string, frames: Array<{ lines: string, proposals: Array<{ proposal: string, whose: string, file: string, changes: Array<string> }> }> }>).map((file) => [file.path, file.frames.map((frame) => [frame.lines, frame.proposals.map((proposal) => [proposal.proposal, proposal.whose, proposal.file, proposal.changes.length])])])).toEqual([
    ["README.md", [["lines 1–44", [["Drop the README", "yours, new", "deleted", 1]]]]],
    ["retry.js", [["lines 4–5", [["Fewer attempts", "yours, new", "changed", 1]]]]],
    ["docs/backoff.md", [["line 1", [["Say how it backs off", "yours, new", "made", 1]]]]]
  ])
  expect(JSON.stringify(ran_Previewed.answer["files"])).toContain(`"line 4: \\"5\\" becomes \\"3\\""`)
  expect([ran_Landed.answer["kind"], ran_Landed.answer["reports"]]).toEqual(["HANDED_BACK", ["docs/backoff.md is in no request of this job: its changes are proposed all the same, for review", "retry.js is in no request of this job: its changes are proposed all the same, for review"]])
  expect(landed_Copy).toEqual({
    proposals: [["j-3.1", "REMOVE", "Drop the README"], ["j-3.2", "MAKE", "Say how it backs off"], ["j-3.3", "CHANGE", "Fewer attempts"]],
    status: { kind: "ADDRESSED", answer: { kind: "PROPOSALS", ids_Proposal: ["j-3.1", "j-3.2", "j-3.3"] } },
    frames: [["README.md", [{ first: 0, last: text_README.split("\n").length - 1 }]], ["docs/backoff.md", [{ first: 0, last: 0 }]], ["retry.js", [{ first: 3, last: 4 }]]],
    isUnchanged: true,
    files: ["README.md", "package.json", "retry.js"]
  })
  expect(applied_Copy).toEqual({
    isREADME_Gone: true,
    text_Backoff,
    text_Retry: true,
    files: ["docs/backoff.md", "package.json", "retry.js"],
    path_First: "docs/backoff.md"
  })
  expect(isCopy_Gone).toBe(true)
})

test("the project's files are listed for the page's token, as VS Code's adapter asks them, never for another's", () => {
  expect(status_Unlisted).toBe(403)
  expect(files_Listed).toEqual(["docs/backoff.md", "package.json", "retry.js"])
})

test("two pages are told the core's state alike: a file one opens, and a task one drafts, seen by both, with the project's files and its first, one that's there; the core knowing nothing of either", () => {
  expect(seen_Pages).toEqual([
    {
      isOpened: true,
      isDrafted: true,
      files: ["docs/backoff.md", "package.json", "retry.js"],
      path_First: "docs/backoff.md"
    },
    {
      isOpened: true,
      isDrafted: true,
      files: ["docs/backoff.md", "package.json", "retry.js"],
      path_First: "docs/backoff.md"
    }
  ])
})

test("doctor opens only a git repository's root with a commit: a folder outside git, one inside a repository, and a repository with no commit each refused with why, by the program and by doctor open, which leaves no .doctor behind", async () => {
  expect(checked_Projects).toEqual([
    { kind: "REFUSED", why: `${dir_Loose} isn't a git repository, and doctor works on git projects: run git init there and make a first commit, then open it again` },
    { kind: "REFUSED", why: `${dir_Sub} is inside the git repository at ${dir_Demo}: open doctor there, on the repository's root` },
    { kind: "REFUSED", why: `${dir_Fresh} has no commit yet, and doctor's working copies start from one: make a first commit, then open it again` },
    { kind: "GIT" }
  ])
  expect(opened_Loose).toBe(checked_Projects[0]?.kind === "REFUSED" ? checked_Projects[0].why : "")
  expect([ran_Loose.exitCode, ran_Loose.stdout.toString().trim(), await Bun.file(join(dir_Loose, ".doctor", "endpoint.json")).exists()]).toEqual([1, `doctor won't open: ${dir_Loose} isn't a git repository, and doctor works on git projects: run git init there and make a first commit, then open it again.`, false])
})

test("a wait open as doctor stops is answered closed, so none hangs", () => {
  expect(ran_Closed.answer["kind"]).toBe("CLOSED")
})
