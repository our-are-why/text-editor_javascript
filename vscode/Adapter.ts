import * as vscode from "vscode"
import { spawn } from "node:child_process"
import {
  readFile,
  stat
} from "node:fs/promises"
import {
  join,
  relative,
  sep
} from "node:path"

export {
  _Adapter_,
  type _Api__Adapter_,
  type _Api___resolved__Adapter_,
  type _Message_Page_,
  type __BASE_Message_Page_,
  type _OPEN_FILE__Message_Page_,
  type _CLOSE__Message_Page_,
  type _Endpoint_Doctor_,
  type _Associations_Editor_,
  pathOf__File,
  type _Api___pathOf__File_,
  liveOf__Endpoint,
  type _Api___liveOf__Endpoint_,
  startedOf__Doctor,
  type _Api___startedOf__Doctor_,
  htmlOf__Panel,
  type _Api___htmlOf__Panel_,
  HTML_WAITING,
  isDoctor__Folder,
  type _Api___isDoctor__Folder_,
  TYPE_EDITOR
}

class _Adapter_ {
  path_Program: string
  files_Folder: Map<string, Array<string>>

  constructor({
    path_Program
  }: _Api__Adapter_) {
    this.path_Program = path_Program
    this.files_Folder = new Map()
  }

  async resolved({
    uri_File,
    panel
  }: _Api___resolved__Adapter_): Promise<void> {
    panel.webview.html = HTML_WAITING
    const folder = vscode.workspace.getWorkspaceFolder(uri_File)
    if (folder === undefined || !vscode.workspace.isTrusted) {
      await this.reopened({
        uri_File,
        panel
      })
      if (!vscode.workspace.isTrusted) vscode.window.showInformationMessage("doctor opens files once you trust this folder: it reads and writes them, and agents work in it.")
      return
    }
    const endpoint = await this.opened(folder)
    const path = pathOf__File({
      folder,
      uri_File
    })
    if (!(this.files_Folder.get(folder.uri.fsPath) ?? []).includes(path)) {
      await this.reopened({
        uri_File,
        panel
      })
      return
    }
    const uri_Page = await vscode.env.asExternalUri(vscode.Uri.parse(endpoint.address))
    const params = new URLSearchParams([
      [
        "token",
        endpoint.token_Page
      ],
      [
        "editor",
        `file:${path}`
      ],
      [
        "path",
        path
      ],
      [
        "host",
        "vscode"
      ]
    ])
    panel.webview.options = {
      enableScripts: true
    }
    panel.webview.html = htmlOf__Panel({
      url_Page: `${uri_Page.toString(true)}?${params}`
    })
    panel.webview.onDidReceiveMessage((message_Page: _Message_Page_) => {
      if (message_Page.kind === "CLOSE") {
        panel.dispose()
        return
      }
      vscode.commands.executeCommand(
        "vscode.openWith",
        vscode.Uri.joinPath(folder.uri, message_Page.path),
        TYPE_EDITOR
      )
    })
  }

  async reopened({
    uri_File,
    panel
  }: _Api___resolved__Adapter_): Promise<void> {
    await vscode.commands.executeCommand(
      "vscode.openWith",
      uri_File,
      "default"
    )
    panel.dispose()
  }

  async opened(
    folder: vscode.WorkspaceFolder
  ): Promise<_Endpoint_Doctor_> {
    const endpoint = await liveOf__Endpoint({
      dir_Project: folder.uri.fsPath
    }) ?? await startedOf__Doctor({
      dir_Project: folder.uri.fsPath,
      path_Program: this.path_Program
    })
    const text_Files = await fetch(
      `${endpoint.address}page/files`,
      {
        headers: {
          authorization: `Bearer ${endpoint.token_Page}`
        }
      }
    ).then((response) => response.text())
    const files: Array<string> = JSON.parse(text_Files)
    this.files_Folder.set(
      folder.uri.fsPath,
      files
    )
    await this.associated()
    return endpoint
  }

  async associated(): Promise<void> {
    const workbench = vscode.workspace.getConfiguration("workbench")
    const associations = workbench.inspect<_Associations_Editor_>("editorAssociations")?.workspaceValue ?? {}
    if (associations["*"] === undefined) {
      await workbench.update(
        "editorAssociations",
        {
          ...associations,
          "*": TYPE_EDITOR
        },
        vscode.ConfigurationTarget.Workspace
      )
    }
    const breadcrumbs = vscode.workspace.getConfiguration("breadcrumbs")
    if (breadcrumbs.inspect<boolean>("enabled")?.workspaceValue === undefined) {
      await breadcrumbs.update(
        "enabled",
        false,
        vscode.ConfigurationTarget.Workspace
      )
    }
  }

  async stopped(
    folder: vscode.WorkspaceFolder
  ): Promise<void> {
    const endpoint = await liveOf__Endpoint({
      dir_Project: folder.uri.fsPath
    })
    if (endpoint === undefined) {
      vscode.window.showInformationMessage(`doctor isn't open on ${folder.name}.`)
      return
    }
    process.kill(
      endpoint.pid,
      "SIGINT"
    )
  }
}

interface _Api__Adapter_ {
  path_Program: string
}

interface _Api___resolved__Adapter_ {
  uri_File: vscode.Uri
  panel: vscode.WebviewPanel
}

type _Message_Page_ = _OPEN_FILE__Message_Page_ | _CLOSE__Message_Page_

interface __BASE_Message_Page_<Kind extends string> {
  kind: Kind
}

interface _OPEN_FILE__Message_Page_ extends __BASE_Message_Page_<"OPEN_FILE"> {
  path: string
}

interface _CLOSE__Message_Page_ extends __BASE_Message_Page_<"CLOSE"> {}

interface _Endpoint_Doctor_ {
  address: string
  token_Page: string
  pid: number
}

interface _Associations_Editor_ {
  [pattern: string]: string
}

interface _Api___pathOf__File_ {
  folder: vscode.WorkspaceFolder
  uri_File: vscode.Uri
}

function pathOf__File({
  folder,
  uri_File
}: _Api___pathOf__File_): string {
  return relative(folder.uri.fsPath, uri_File.fsPath).split(sep).join("/")
}

interface _Api___liveOf__Endpoint_ {
  dir_Project: string
}

async function liveOf__Endpoint({
  dir_Project
}: _Api___liveOf__Endpoint_): Promise<_Endpoint_Doctor_ | undefined> {
  const text = await readFile(
    join(dir_Project, ".doctor", "endpoint.json"),
    "utf8"
  ).catch(() => undefined)
  if (text === undefined) return undefined
  const endpoint: _Endpoint_Doctor_ = JSON.parse(text)
  const isAnswering = await fetch(endpoint.address).then((response) => response.ok, () => false)
  return isAnswering ? endpoint : undefined
}

interface _Api___startedOf__Doctor_ {
  dir_Project: string
  path_Program: string
}

async function startedOf__Doctor({
  dir_Project,
  path_Program
}: _Api___startedOf__Doctor_): Promise<_Endpoint_Doctor_> {
  const subprocess = spawn(
    "bun",
    [
      path_Program,
      "open",
      dir_Project
    ],
    {
      cwd: dir_Project,
      detached: true,
      stdio: "ignore"
    }
  )
  subprocess.unref()
  for (let count_Tries = 0; count_Tries < 100; count_Tries += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    const endpoint = await liveOf__Endpoint({
      dir_Project
    })
    if (endpoint !== undefined) return endpoint
  }
  throw new Error(`doctor didn't open on ${dir_Project} in 15 seconds`)
}

interface _Api___htmlOf__Panel_ {
  url_Page: string
}

function htmlOf__Panel({
  url_Page
}: _Api___htmlOf__Panel_): string {
  const nonce = Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("")
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "  <head>",
    `    <meta charset="utf-8" />`,
    `    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${new URL(url_Page).origin}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />`,
    "    <style>html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: var(--vscode-editor-background); } iframe { display: block; width: 100%; height: 100%; border: 0; }</style>",
    "  </head>",
    "  <body>",
    `    <iframe src="${url_Page}" allow="clipboard-read; clipboard-write"></iframe>`,
    `    <script nonce="${nonce}">`,
    "      const api_VsCode = acquireVsCodeApi()",
    "      const iframe = document.querySelector(\"iframe\")",
    "      window.addEventListener(\"message\", (event) => {",
    "        if (event.source === iframe.contentWindow) api_VsCode.postMessage(event.data)",
    "      })",
    "    </script>",
    "  </body>",
    "</html>"
  ].join("\n")
}

const HTML_WAITING = [
  "<!doctype html>",
  `<html lang="en">`,
  "  <head>",
  `    <meta charset="utf-8" />`,
  `    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />`,
  "    <style>html, body { margin: 0; height: 100%; background: var(--vscode-editor-background); }</style>",
  "  </head>",
  "  <body></body>",
  "</html>"
].join("\n")

interface _Api___isDoctor__Folder_ {
  folder: vscode.WorkspaceFolder
}

async function isDoctor__Folder({
  folder
}: _Api___isDoctor__Folder_): Promise<boolean> {
  return stat(join(folder.uri.fsPath, ".doctor")).then(() => true, () => false)
}

const TYPE_EDITOR = "doctor.file"
