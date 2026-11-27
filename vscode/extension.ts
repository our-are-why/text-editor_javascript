import * as vscode from "vscode"
import {
  _Adapter_,
  TYPE_EDITOR,
  isDoctor__Folder
} from "./Adapter.ts"

export {
  activate,
  deactivate,
  associatedOn__Startup,
  type _Api___associatedOn__Startup_,
  isTrusted__Workspace,
  folderOf__Workspace,
  shownOf__Error
}

declare const PATH_PROGRAM__DOCTOR: string

function activate(
  context: vscode.ExtensionContext
): void {
  const adapter = new _Adapter_({
    path_Program: PATH_PROGRAM__DOCTOR
  })
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      TYPE_EDITOR,
      {
        openCustomDocument: (uri) => ({
          uri,
          dispose: () => {}
        }),
        resolveCustomEditor: (document, panel) => adapter.resolved({
          uri_File: document.uri,
          panel
        }).catch(shownOf__Error)
      },
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    ),
    vscode.commands.registerCommand(
      "doctor.open",
      () => folderOf__Workspace()
        .then(async (folder) => {
          if (folder === undefined) return
          await adapter.opened(folder)
          const uri_Active = vscode.window.activeTextEditor?.document.uri
          if (uri_Active !== undefined && vscode.workspace.getWorkspaceFolder(uri_Active) === folder) {
            await vscode.commands.executeCommand(
              "vscode.openWith",
              uri_Active,
              TYPE_EDITOR
            )
            return
          }
          vscode.window.showInformationMessage(`doctor's open on ${folder.name}: the files you open here open in it.`)
        })
        .catch(shownOf__Error)
    ),
    vscode.commands.registerCommand(
      "doctor.openFile",
      (uri_Pressed: vscode.Uri | undefined) => {
        const uri_File = uri_Pressed ?? vscode.window.activeTextEditor?.document.uri
        if (!isTrusted__Workspace()) return
        if (uri_File === undefined) {
          vscode.window.showInformationMessage("Open a file, or choose one in the Explorer, to open it in doctor.")
          return
        }
        return vscode.commands.executeCommand(
          "vscode.openWith",
          uri_File,
          TYPE_EDITOR
        )
      }
    ),
    vscode.commands.registerCommand(
      "doctor.openText",
      (uri_Pressed: vscode.Uri | undefined) => {
        const uri_File = uri_Pressed ?? vscode.window.activeTextEditor?.document.uri
        if (uri_File === undefined) return
        return vscode.commands.executeCommand(
          "vscode.openWith",
          uri_File,
          "default"
        )
      }
    ),
    vscode.commands.registerCommand(
      "doctor.stop",
      () => folderOf__Workspace()
        .then((folder) => folder === undefined ? undefined : adapter.stopped(folder))
        .catch(shownOf__Error)
    ),
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      associatedOn__Startup({
        adapter
      }).catch(shownOf__Error)
    })
  )
  if (vscode.workspace.isTrusted) {
    associatedOn__Startup({
      adapter
    }).catch(shownOf__Error)
  }
}

function deactivate(): void {}

interface _Api___associatedOn__Startup_ {
  adapter: _Adapter_
}

// a doctor project, a folder with .doctor/, its files opening in doctor,
// breadcrumbs off, so doctor's header is the only bar under a tab
async function associatedOn__Startup({
  adapter
}: _Api___associatedOn__Startup_): Promise<void> {
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (await isDoctor__Folder({
      folder
    })) await adapter.associated()
  }
}

function isTrusted__Workspace(): boolean {
  if (vscode.workspace.isTrusted) return true
  vscode.window.showInformationMessage(
    "doctor opens on a folder once you trust it: it reads and writes the folder's files, and agents work in it.",
    "Manage Workspace Trust"
  ).then((chosen) => {
    if (chosen === "Manage Workspace Trust") vscode.commands.executeCommand("workbench.trust.manage")
  })
  return false
}

async function folderOf__Workspace(): Promise<vscode.WorkspaceFolder | undefined> {
  if (!isTrusted__Workspace()) return undefined
  const folders = vscode.workspace.workspaceFolders ?? []
  if (folders.length === 0) {
    vscode.window.showInformationMessage("Open a project's folder first: doctor opens on a folder.")
    return undefined
  }
  return folders.length === 1 ? folders[0] : vscode.window.showWorkspaceFolderPick()
}

function shownOf__Error(
  error: unknown
): void {
  vscode.window.showErrorMessage(`doctor: ${error instanceof Error ? error.message : String(error)}`)
}
