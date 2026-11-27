import {
  basename,
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
  _Shell_,
  handle__Message_Page,
  type _Shown_Shell_,
  type _Message_Page_,
  type _Message_Shell_
} from "../shell/index.ts"

export {
  _Program_,
  type _Api__Program_,
  type _Built_Page_,
  type _File_Page_,
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
  DIR_DOCTOR,
  NAME_ENDPOINT
}

class _Program_ {
  dir_Project: string
  files: Array<string>
  page_Built: _Built_Page_
  token_Page: string
  texts_Written: Map<string, string>
  writing: Promise<void>
  documents: _Documents_
  shell: _Shell_
  sockets_Page: Set<ServerWebSocket<undefined>>
  count_Edit: number
  server: Server<undefined>

  constructor({
    dir_Project,
    files,
    path_Shown,
    text_Shown,
    page_Built,
    token_Page,
    port
  }: _Api__Program_) {
    this.dir_Project = dir_Project
    this.files = files
    this.page_Built = page_Built
    this.token_Page = token_Page
    const text_Model = {
      lines: parseTexts_Line(text_Shown),
      marks: []
    }
    this.texts_Written = new Map([
      [
        path_Shown,
        flatOf__Text(text_Model)
      ]
    ])
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
    this.documents.handle({
      kind: "OPEN",
      path: path_Shown,
      text: text_Model
    })
    this.shell = new _Shell_({
      tasks: new _Tasks_({
        model_Tasks: {
          tasks: []
        },
        observers: []
      }),
      documents: this.documents,
      name_Document: path_Shown,
      files: this.files,
      target_Mode: {
        kind: "MANUAL"
      },
      references: new Map(),
      contents: new Map(),
      observers: [
        {
          shown: (shown_Shell) => this.shown(shown_Shell),
          started: () => {},
          stopped: () => {},
          opening: (path) => this.opening(path)
        }
      ]
    })
    this.sockets_Page = new Set()
    this.count_Edit = 0
    this.server = Bun.serve({
      hostname: "127.0.0.1",
      port,
      fetch: (request) => this.fetched(request),
      websocket: {
        open: (socket) => this.connected(socket),
        message: (socket, data) => {
          if (this.sockets_Page.has(socket)) this.heard(String(data))
        },
        close: (socket) => {
          this.sockets_Page.delete(socket)
        }
      }
    })
  }

  fetched(
    request: Request
  ): Response | undefined {
    const url = new URL(request.url)
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
          data: undefined
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

  connected(
    socket: ServerWebSocket<undefined>
  ): void {
    for (const socket_Other of this.sockets_Page) {
      socket_Other.close(
        4000,
        "opened in another page"
      )
    }
    this.sockets_Page = new Set([socket])
    this.count_Edit = 0
    this.sent({
      kind: "SHOWN",
      shown_Shell: this.shell.shown(),
      count_Edit: this.count_Edit
    })
  }

  heard(
    data: string
  ): void {
    const message_Page: _Message_Page_ = JSON.parse(data)
    this.count_Edit = message_Page.count_Edit
    handle__Message_Page({
      shell: this.shell,
      message_Page
    })
  }

  shown(
    shown_Shell: _Shown_Shell_
  ): void {
    this.sent({
      kind: "SHOWN",
      shown_Shell,
      count_Edit: this.count_Edit
    })
  }

  sent(
    message_Shell: _Message_Shell_
  ): void {
    const data = JSON.stringify(message_Shell)
    for (const socket of this.sockets_Page) socket.send(data)
  }

  opening(
    path: string
  ): void {
    if (!this.files.includes(path)) return
    Bun.file(join(this.dir_Project, path)).text().then((text) => {
      const text_Model = {
        lines: parseTexts_Line(text),
        marks: []
      }
      if (!this.texts_Written.has(path)) {
        this.texts_Written.set(
          path,
          flatOf__Text(text_Model)
        )
      }
      this.shell.opened({
        path,
        text: text_Model
      })
    })
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
  path_Shown: string
  text_Shown: string
  page_Built: _Built_Page_
  token_Page: string
  port: number
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
  path_Shown: string
  port: number
}

async function openedOf__Program({
  dir_Project,
  files,
  path_Shown,
  port
}: _Api___openedOf__Program_): Promise<_Program_> {
  if (!files.includes(path_Shown)) throw new Error(`${path_Shown} isn't one of the project's files`)
  const program = new _Program_({
    dir_Project,
    files,
    path_Shown,
    text_Shown: await Bun.file(join(dir_Project, path_Shown)).text(),
    page_Built: await builtOf__Page({
      title: basename(dir_Project)
    }),
    token_Page: tokenOf(),
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
