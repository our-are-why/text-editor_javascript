import "./Page.css"
import {
  COMPONENTMAP__VIEW_TEXTEDITOR,
  MODULE_MOUSE,
  MODULE_KEYBOARD,
  MODULE_PLAINTEXT,
  MODULE_WORDS_TEXT,
  PERSPECTIVE_CHANGES
} from "../editor/index.ts"
import { openedOf__Page } from "./Page.ts"

const containerElement_Editor = document.createElement("div")
containerElement_Editor.className = "editor_page"
const containerElement_Board = document.createElement("div")
containerElement_Board.className = "board_page"
containerElement_Board.hidden = true
const containerElement_Status = document.createElement("p")
containerElement_Status.className = "status_page"
containerElement_Status.hidden = true
document.body.append(
  containerElement_Status,
  containerElement_Editor,
  containerElement_Board
)
const params = new URLSearchParams(location.search)
const url_Socket = new URL(
  "socket",
  location.href
)
url_Socket.protocol = location.protocol === "https:" ? "wss:" : "ws:"
url_Socket.search = new URLSearchParams([
  [
    "token",
    params.get("token") ?? ""
  ]
]).toString()
await openedOf__Page({
  url_Socket,
  id_Editor: params.get("editor") ?? "page",
  path_Asked: params.get("path") ?? undefined,
  setup: {
    componentMap: COMPONENTMAP__VIEW_TEXTEDITOR,
    modules: [
      MODULE_MOUSE,
      MODULE_KEYBOARD
    ],
    module_Language: MODULE_PLAINTEXT,
    module_Words: MODULE_WORDS_TEXT,
    perspectives: [
      PERSPECTIVE_CHANGES
    ]
  },
  containerElement_Editor,
  containerElement_Board,
  containerElement_Status,
  host_Page: params.get("host") === "vscode" ? "FRAMED" : "ALONE"
}).catch((error: unknown) => {
  containerElement_Status.textContent = `doctor's page couldn't open: ${error instanceof Error ? error.message : String(error)}`
  containerElement_Status.hidden = false
})
