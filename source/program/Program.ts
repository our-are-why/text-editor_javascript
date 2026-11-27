import {
  basename,
  dirname,
  join
} from "node:path"
import {
  mkdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises"
import type {
  Server,
  ServerWebSocket
} from "bun"
import {
  _Documents_,
  parseTexts_Line,
  flatOf__Text,
  type _Model_Documents_
} from "../documents/index.ts"
import { _Tasks_ } from "../tasks/index.ts"
import {
  _Agent_,
  answerOf__Refused,
  SECONDS_WAIT,
  commandOf__Wait,
  ANSWER_CLOSED,
  answerOf__NothingYet,
  nextOf__Mailbox,
  answeredOf__Offer,
  MS_LAPSE__OFFER,
  answeredOf__Check,
  answeredOf__Done,
  SECONDS_WAIT_MOST,
  type _From_Wait_,
  type _Answer_Agent_,
  type _Answered_Call_
} from "../agent/index.ts"
import {
  _Shell_,
  briefOf__Job,
  type _State_Shell_,
  type _Message_Page_,
  type __BASE_Message_Page_,
  type _Message_Shell_,
  type _Round_Shell_,
  type _Stop_Shell_
} from "../shell/index.ts"

export {
  _Program_,
  type _Api__Program_,
  type _Data_Socket_,
  type _Built_Page_,
  type _File_Page_,
  type _Api___heard__Program_,
  type _Api___sent__Program_,
  handle__Message_Page,
  type _Api___handle__Message_Page_,
  type _HandlerMap__Message_Page_,
  HANDLERMAP__MESSAGE_PAGE,
  type _Api___waited__Program_,
  type _Api___offeredOf__Program_,
  type _Api___called__Program_,
  type _Kind_Call_,
  type _Api___handedBack__Program_,
  responseOf__Answer,
  type _Api___responseOf__Answer_,
  secondsOf__Wait,
  type _Endpoint_Program_,
  openedOf__Program,
  type _Api___openedOf__Program_,
  filesOf__Project,
  type _Api___filesOf__Project_,
  pathFirstOf__Files,
  type _Api___pathFirstOf__Files_,
  builtOf__Page,
  type _Api___builtOf__Page_,
  tokenOf,
  addressesOf__Program,
  type _Api___addressesOf__Program_,
  type _Addresses_Program_,
  commandOf__Doctor,
  endpointOf__Folder,
  type _Api___endpointOf__Folder_,
  DIR_DOCTOR,
  NAME_ENDPOINT
}

class _Program_ {
  dir_Project: string
  files: Array<string>
  page_Built: _Built_Page_
  token_Page: string
  token_Agent: string
  command_Agent: string
  texts_Written: Map<string, string>
  writing: Promise<void>
  documents: _Documents_
  agent: _Agent_
  rounds_Job: Map<string, _Round_Shell_>
  wakers: Array<() => void>
  isClosing: boolean
  shell: _Shell_
  path_First: string
  sockets: Set<ServerWebSocket<_Data_Socket_>>
  server: Server<_Data_Socket_>

  constructor({
    dir_Project,
    files,
    path_First,
    page_Built,
    token_Page,
    token_Agent,
    command_Agent,
    port
  }: _Api__Program_) {
    this.dir_Project = dir_Project
    this.files = files
    this.page_Built = page_Built
    this.token_Page = token_Page
    this.token_Agent = token_Agent
    this.command_Agent = command_Agent
    this.texts_Written = new Map()
    this.writing = Promise.resolve()
    this.documents = new _Documents_({
      model_Documents: {
        documents: []
      },
      observers: [
        {
          changed: (model_Documents) => this.changed(model_Documents)
        }
      ]
    })
    this.agent = new _Agent_({
      model_Agent: {
        jobs: []
      },
      observers: [
        {
          changed: () => this.woken()
        }
      ]
    })
    this.rounds_Job = new Map()
    this.wakers = []
    this.isClosing = false
    this.shell = new _Shell_({
      tasks: new _Tasks_({
        model_Tasks: {
          tasks: []
        },
        observers: []
      }),
      documents: this.documents,
      observers: [
        {
          changed: (state_Shell) => this.told(state_Shell),
          started: (round_Shell) => this.queued(round_Shell),
          stopped: (stop_Shell) => this.cancelled(stop_Shell)
        }
      ]
    })
    this.path_First = path_First
    this.sockets = new Set()
    this.server = Bun.serve({
      hostname: "127.0.0.1",
      port,
      fetch: (request) => this.fetched(request),
      websocket: {
        open: (socket) => this.connected(socket),
        message: (socket, data) => this.heard({
          socket,
          data: String(data)
        }),
        close: (socket) => {
          this.sockets.delete(socket)
        }
      }
    })
  }

  fetched(
    request: Request
  ): Response | Promise<Response> | undefined {
    const url = new URL(request.url)
    if (url.pathname.startsWith("/agent/")) return this.answered(request)
    if (url.pathname === "/page/files") return this.listed(request)
    const name = url.pathname.slice(url.pathname.lastIndexOf("/") + 1)
    if (name === "socket") {
      if (url.searchParams.get("token") !== this.token_Page) {
        return new Response(
          "Not this page's.",
          {
            status: 403
          }
        )
      }
      return this.server.upgrade(
        request,
        {
          data: {
            count_Edit: 0
          }
        }
      )
        ? undefined
        : new Response(
          "Not a socket.",
          {
            status: 400
          }
        )
    }
    const file_Page = this.page_Built.files.find((file) => file.name === (name === "" ? "index.html" : name))
    return file_Page === undefined
      ? new Response(
        "Not here.",
        {
          status: 404
        }
      )
      : new Response(
        file_Page.contents,
        {
          headers: {
            "content-type": file_Page.type
          }
        }
      )
  }

  answered(
    request: Request
  ): Response | Promise<Response> {
    const url = new URL(request.url)
    if (request.headers.get("authorization") !== `Bearer ${this.token_Agent}`) {
      return responseOf__Answer({
        answer_Agent: answerOf__Refused({
          issues: ["that isn't this project's agent token: run the command from inside the project"],
          command_Agent: this.command_Agent
        }),
        status: 401
      })
    }
    const id_Task = url.searchParams.get("task")
    const from: _From_Wait_ = id_Task === null
      ? {
        kind: "ANY"
      }
      : {
        kind: "TASK",
        id_Task
      }
    const route = `${request.method} ${url.pathname}`
    if (route === "GET /agent/wait") {
      return this.waited({
        request,
        from,
        seconds: secondsOf__Wait(url.searchParams.get("for"))
      })
    }
    if (route === "GET /agent/take") {
      const command_Wait = commandOf__Wait({
        command_Agent: this.command_Agent,
        seconds: SECONDS_WAIT,
        from
      })
      return responseOf__Answer({
        answer_Agent: this.offeredOf({
          from,
          command_Wait
        }) ?? answerOf__NothingYet({
          command_Wait
        }),
        status: 200
      })
    }
    const call = url.pathname.match(/^\/agent\/job\/([^/]+)\/(check|done)$/)
    if (request.method === "POST" && call !== null) {
      return this.called({
        request,
        id_Job: call[1] ?? "",
        kind_Call: call[2] === "done" ? "DONE" : "CHECK"
      })
    }
    return responseOf__Answer({
      answer_Agent: answerOf__Refused({
        issues: [`there's no ${route}`],
        command_Agent: this.command_Agent
      }),
      status: 404
    })
  }

  listed(
    request: Request
  ): Response {
    if (request.headers.get("authorization") !== `Bearer ${this.token_Page}`) {
      return new Response(
        "Not this page's.",
        {
          status: 403
        }
      )
    }
    return Response.json(this.files)
  }

  async waited({
    request,
    from,
    seconds
  }: _Api___waited__Program_): Promise<Response> {
    this.server.timeout(
      request,
      0
    )
    const command_Wait = commandOf__Wait({
      command_Agent: this.command_Agent,
      seconds,
      from
    })
    const until = Date.now() + seconds * 1000
    const gone = new Promise<void>((resolve) => request.signal.addEventListener(
      "abort",
      () => resolve()
    ))
    for (;;) {
      if (this.isClosing) {
        return responseOf__Answer({
          answer_Agent: ANSWER_CLOSED,
          status: 200
        })
      }
      if (request.signal.aborted) {
        return new Response(
          null,
          {
            status: 499
          }
        )
      }
      const answer_Offer = this.offeredOf({
        from,
        command_Wait
      })
      if (answer_Offer !== undefined) {
        return responseOf__Answer({
          answer_Agent: answer_Offer,
          status: 200
        })
      }
      const left = until - Date.now()
      if (left <= 0) {
        return responseOf__Answer({
          answer_Agent: answerOf__NothingYet({
            command_Wait
          }),
          status: 200
        })
      }
      await Promise.race([
        new Promise<void>((resolve) => this.wakers.push(resolve)),
        gone,
        Bun.sleep(left)
      ])
    }
  }

  offeredOf({
    from,
    command_Wait
  }: _Api___offeredOf__Program_): _Answer_Agent_ | undefined {
    for (;;) {
      const job_Agent = nextOf__Mailbox({
        model_Agent: this.agent.model_Agent,
        from
      })
      if (job_Agent === undefined) return undefined
      const task = this.shell.taskOf(job_Agent.id_Task)
      if (task === undefined) {
        this.agent.handle({
          kind: "CANCEL",
          id_Job: job_Agent.id,
          at: Date.now()
        })
        continue
      }
      const answered_Call = answeredOf__Offer({
        job_Agent,
        brief: briefOf__Job({
          task,
          ids_Request: job_Agent.ids_Request
        }),
        at: Date.now(),
        command_Agent: this.command_Agent,
        command_Wait
      })
      this.applied(answered_Call)
      setTimeout(
        () => this.agent.handle({
          kind: "LAPSE",
          at: Date.now()
        }),
        MS_LAPSE__OFFER + 100
      ).unref()
      return answered_Call.answer_Agent
    }
  }

  async called({
    request,
    id_Job,
    kind_Call
  }: _Api___called__Program_): Promise<Response> {
    const body: unknown = await request.json().catch(() => ({}))
    const note = typeof body === "object" && body !== null && "note" in body && typeof body.note === "string" ? body.note : ""
    const answered_Call = kind_Call === "DONE"
      ? answeredOf__Done({
        model_Agent: this.agent.model_Agent,
        id_Job,
        at: Date.now(),
        command_Agent: this.command_Agent
      })
      : answeredOf__Check({
        model_Agent: this.agent.model_Agent,
        id_Job,
        note,
        at: Date.now(),
        command_Agent: this.command_Agent
      })
    this.applied(answered_Call)
    if (answered_Call.answer_Agent.kind === "HANDED_BACK") {
      this.handedBack({
        id_Job,
        note
      })
    }
    return responseOf__Answer({
      answer_Agent: answered_Call.answer_Agent,
      status: answered_Call.answer_Agent.kind === "REFUSED" ? 409 : 200
    })
  }

  applied(
    answered_Call: _Answered_Call_
  ): void {
    for (const command_Agent of answered_Call.commands_Agent) this.agent.handle(command_Agent)
  }

  handedBack({
    id_Job,
    note
  }: _Api___handedBack__Program_): void {
    const round_Shell = this.rounds_Job.get(id_Job)
    if (round_Shell === undefined) return
    this.shell.landed({
      round_Shell,
      proposed: [],
      note
    })
  }

  queued(
    round_Shell: _Round_Shell_
  ): void {
    if (round_Shell.requests.length === 0) return
    const id_Job = `j-${round_Shell.id}`
    this.rounds_Job.set(
      id_Job,
      round_Shell
    )
    this.agent.handle({
      kind: "QUEUE",
      id_Job,
      id_Task: round_Shell.id_Task,
      scope: round_Shell.scope,
      ids_Request: round_Shell.requests.map((request) => request.id),
      at: Date.now()
    })
  }

  cancelled(
    stop_Shell: _Stop_Shell_
  ): void {
    for (const id_Round of stop_Shell.ids_Round) {
      this.agent.handle({
        kind: "CANCEL",
        id_Job: `j-${id_Round}`,
        at: Date.now()
      })
    }
  }

  ended(): void {
    for (const job_Agent of this.agent.model_Agent.jobs) {
      const isLive = job_Agent.state.kind === "QUEUED" || job_Agent.state.kind === "OFFERED" || job_Agent.state.kind === "BEING_WORKED_ON"
      if (!isLive || this.shell.taskOf(job_Agent.id_Task)?.kind === "OPEN") continue
      this.agent.handle({
        kind: "CANCEL",
        id_Job: job_Agent.id,
        at: Date.now()
      })
    }
  }

  woken(): void {
    const wakers = this.wakers
    this.wakers = []
    for (const wake of wakers) wake()
  }

  connected(
    socket: ServerWebSocket<_Data_Socket_>
  ): void {
    this.sockets.add(socket)
    this.sent({
      socket,
      state_Shell: this.shell.state()
    })
  }

  async kept(
    path: string
  ): Promise<void> {
    if (this.shell.isKept(path)) return
    const text_Model = {
      lines: parseTexts_Line(await Bun.file(join(this.dir_Project, path)).text()),
      marks: []
    }
    if (this.shell.isKept(path)) return
    this.texts_Written.set(
      path,
      flatOf__Text(text_Model)
    )
    this.shell.handle({
      kind: "OPEN_DOCUMENT",
      path,
      text: text_Model
    })
  }

  heard({
    socket,
    data
  }: _Api___heard__Program_): void {
    if (!this.sockets.has(socket)) return
    try {
      const message_Page: _Message_Page_ = JSON.parse(data)
      handle__Message_Page({
        program: this,
        socket,
        message_Page
      })
    } catch (error) {
      console.error("doctor couldn't take a page's message:", error)
    }
  }

  told(
    state_Shell: _State_Shell_
  ): void {
    this.ended()
    for (const socket of this.sockets) {
      this.sent({
        socket,
        state_Shell
      })
    }
  }

  sent({
    socket,
    state_Shell
  }: _Api___sent__Program_): void {
    const message_Shell: _Message_Shell_ = {
      kind: "STATE",
      state_Shell,
      files: this.files,
      path_First: this.path_First,
      count_Edit: socket.data.count_Edit
    }
    socket.send(JSON.stringify(message_Shell))
  }

  changed(
    model_Documents: _Model_Documents_
  ): void {
    for (const document of model_Documents.documents) {
      const text = flatOf__Text(document.text)
      if (this.texts_Written.get(document.path) === text) continue
      this.texts_Written.set(
        document.path,
        text
      )
      this.writing = this.writing
        .then(() => writtenOf__File({
          dir_Project: this.dir_Project,
          path: document.path,
          text
        }))
        .catch((error: unknown) => console.error(`doctor couldn't write ${document.path}:`, error))
    }
  }

  async stop(): Promise<void> {
    this.isClosing = true
    this.woken()
    await Bun.sleep(50)
    await this.server.stop(true)
    await this.writing
    await rm(
      join(this.dir_Project, DIR_DOCTOR, NAME_ENDPOINT),
      {
        force: true
      }
    )
  }
}

interface _Api__Program_ {
  dir_Project: string
  files: Array<string>
  path_First: string
  page_Built: _Built_Page_
  token_Page: string
  token_Agent: string
  command_Agent: string
  port: number
}

interface _Data_Socket_ {
  count_Edit: number
}

interface _Api___heard__Program_ {
  socket: ServerWebSocket<_Data_Socket_>
  data: string
}

interface _Api___handle__Message_Page_<Kind extends _Message_Page_["kind"]> {
  program: _Program_
  socket: ServerWebSocket<_Data_Socket_>
  message_Page: Extract<
    _Message_Page_,
    __BASE_Message_Page_<Kind>
  >
}

function handle__Message_Page<Kind extends _Message_Page_["kind"]>({
  program,
  socket,
  message_Page
}: _Api___handle__Message_Page_<Kind>): void {
  const handle = HANDLERMAP__MESSAGE_PAGE[message_Page.kind]
  handle({
    program,
    socket,
    message_Page
  })
}

type _HandlerMap__Message_Page_ = {
  [Kind in _Message_Page_["kind"]]: (api_Handler: _Api___handle__Message_Page_<Kind>) => void
}

const HANDLERMAP__MESSAGE_PAGE: _HandlerMap__Message_Page_ = {
  COMMAND: ({
    program,
    socket,
    message_Page
  }) => {
    if (message_Page.command_Shell.kind === "EDIT") socket.data.count_Edit += 1
    program.shell.handle(message_Page.command_Shell)
  },
  OPEN: ({
    program,
    message_Page
  }) => {
    if (!program.files.includes(message_Page.path)) return
    program.kept(message_Page.path).catch((error: unknown) => console.error(`doctor couldn't open ${message_Page.path}:`, error))
  }
}

interface _Api___sent__Program_ {
  socket: ServerWebSocket<_Data_Socket_>
  state_Shell: _State_Shell_
}

interface _Api___waited__Program_ {
  request: Request
  from: _From_Wait_
  seconds: number
}

interface _Api___offeredOf__Program_ {
  from: _From_Wait_
  command_Wait: string
}

interface _Api___called__Program_ {
  request: Request
  id_Job: string
  kind_Call: _Kind_Call_
}

type _Kind_Call_ = "CHECK" | "DONE"

interface _Api___handedBack__Program_ {
  id_Job: string
  note: string
}

interface _Api___responseOf__Answer_ {
  answer_Agent: _Answer_Agent_
  status: number
}

function responseOf__Answer({
  answer_Agent,
  status
}: _Api___responseOf__Answer_): Response {
  return new Response(
    JSON.stringify(answer_Agent),
    {
      status,
      headers: {
        "content-type": "application/json"
      }
    }
  )
}

function secondsOf__Wait(
  text_Seconds: string | null
): number {
  const seconds = Number(text_Seconds ?? SECONDS_WAIT)
  return Number.isFinite(seconds) && seconds >= 1 ? Math.min(Math.round(seconds), SECONDS_WAIT_MOST) : SECONDS_WAIT
}

interface _Built_Page_ {
  files: Array<_File_Page_>
}

interface _File_Page_ {
  name: string
  type: string
  contents: string
}

interface _Endpoint_Program_ {
  address: string
  token_Page: string
  token_Agent: string
  pid: number
}

interface _Api___writtenOf__File_ {
  dir_Project: string
  path: string
  text: string
}

async function writtenOf__File({
  dir_Project,
  path,
  text
}: _Api___writtenOf__File_): Promise<void> {
  const path_Writing = join(dir_Project, DIR_DOCTOR, `${tokenOf()}.writing`)
  await mkdir(
    join(dir_Project, DIR_DOCTOR),
    {
      recursive: true
    }
  )
  await writeFile(
    path_Writing,
    text
  )
  await rename(
    path_Writing,
    join(dir_Project, path)
  )
}

const DIR_DOCTOR = ".doctor"

const NAME_ENDPOINT = "endpoint.json"

interface _Api___openedOf__Program_ {
  dir_Project: string
  files: Array<string>
  path_First: string
  port: number
}

async function openedOf__Program({
  dir_Project,
  files,
  path_First,
  port
}: _Api___openedOf__Program_): Promise<_Program_> {
  if (!files.includes(path_First)) throw new Error(`${path_First} isn't one of the project's files`)
  const program = new _Program_({
    dir_Project,
    files,
    path_First,
    page_Built: await builtOf__Page({
      title: basename(dir_Project)
    }),
    token_Page: tokenOf(),
    token_Agent: tokenOf(),
    command_Agent: commandOf__Doctor(),
    port
  })
  await mkdir(
    join(dir_Project, DIR_DOCTOR),
    {
      recursive: true
    }
  )
  const file_Ignore = Bun.file(join(dir_Project, DIR_DOCTOR, ".gitignore"))
  if (!(await file_Ignore.exists())) await Bun.write(file_Ignore, `${NAME_ENDPOINT}\n*.writing\n`)
  const endpoint_Program: _Endpoint_Program_ = {
    address: addressesOf__Program({
      program,
      uri_Proxy: undefined
    }).address,
    token_Page: program.token_Page,
    token_Agent: program.token_Agent,
    pid: process.pid
  }
  await Bun.write(
    join(dir_Project, DIR_DOCTOR, NAME_ENDPOINT),
    `${JSON.stringify(endpoint_Program, null, 2)}\n`
  )
  return program
}

interface _Api___filesOf__Project_ {
  dir_Project: string
}

async function filesOf__Project({
  dir_Project
}: _Api___filesOf__Project_): Promise<Array<string>> {
  const listed = await Bun.$`git ls-files --cached --others --exclude-standard -z`.cwd(dir_Project).nothrow().quiet()
  const paths = listed.exitCode === 0
    ? listed.stdout.toString().split("\0").filter((path) => path !== "")
    : await Array.fromAsync(new Bun.Glob("**/*").scan({
      cwd: dir_Project,
      onlyFiles: true
    }))
  const paths_Text = await Promise.all(paths
    .filter((path) => !path.startsWith(`${DIR_DOCTOR}/`) && !path.split("/").includes("node_modules"))
    .map(async (path) => {
      const head = new Uint8Array(await Bun.file(join(dir_Project, path)).slice(0, 8000).arrayBuffer())
      return head.includes(0) ? [] : [path]
    }))
  return paths_Text.flat().toSorted()
}

interface _Api___pathFirstOf__Files_ {
  files: Array<string>
}

function pathFirstOf__Files({
  files
}: _Api___pathFirstOf__Files_): string | undefined {
  return files.includes("README.md") ? "README.md" : files[0]
}

interface _Api___builtOf__Page_ {
  title: string
}

async function builtOf__Page({
  title
}: _Api___builtOf__Page_): Promise<_Built_Page_> {
  const built = await Bun.build({
    entrypoints: [join(import.meta.dir, "../page/start.ts")],
    target: "browser",
    naming: "[name].[ext]"
  })
  if (!built.success) throw new AggregateError(built.logs, "doctor's page didn't build")
  const files = await Promise.all(built.outputs.map(async (output) => ({
    name: basename(output.path),
    type: output.type,
    contents: await output.text()
  })))
  const tags = files.map((file) => file.name.endsWith(".css")
    ? `<link rel="stylesheet" href="./${file.name}" />`
    : `<script type="module" src="./${file.name}"></script>`)
  return {
    files: [
      {
        name: "index.html",
        type: "text/html;charset=utf-8",
        contents: [
          "<!doctype html>",
          `<html lang="en">`,
          "  <head>",
          `    <meta charset="utf-8" />`,
          `    <meta name="viewport" content="width=device-width, initial-scale=1" />`,
          `    <title>${Bun.escapeHTML(title)} · doctor</title>`,
          `    <link rel="icon" href="data:," />`,
          ...tags.map((tag) => `    ${tag}`),
          "  </head>",
          "  <body></body>",
          "</html>",
          ""
        ].join("\n")
      },
      ...files
    ]
  }
}

function tokenOf(): string {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("")
}

interface _Api___addressesOf__Program_ {
  program: _Program_
  uri_Proxy: string | undefined
}

interface _Addresses_Program_ {
  address: string
  page: string
  page_Proxied: string | undefined
}

function addressesOf__Program({
  program,
  uri_Proxy
}: _Api___addressesOf__Program_): _Addresses_Program_ {
  const address = `http://127.0.0.1:${program.server.port}/`
  const query = `?token=${program.token_Page}`
  return {
    address,
    page: `${address}${query}`,
    page_Proxied: uri_Proxy === undefined ? undefined : `${uri_Proxy.replace("{{port}}", String(program.server.port))}${query}`
  }
}

function commandOf__Doctor(): string {
  return Bun.which("doctor") === null ? `bun ${join(import.meta.dir, "doctor.ts")}` : "doctor"
}

interface _Api___endpointOf__Folder_ {
  dir: string
}

async function endpointOf__Folder({
  dir
}: _Api___endpointOf__Folder_): Promise<_Endpoint_Program_ | undefined> {
  const file_Endpoint = Bun.file(join(dir, DIR_DOCTOR, NAME_ENDPOINT))
  if (await file_Endpoint.exists()) return await file_Endpoint.json()
  return dirname(dir) === dir
    ? undefined
    : endpointOf__Folder({
      dir: dirname(dir)
    })
}
