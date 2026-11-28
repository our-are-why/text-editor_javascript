import {
  _TextEditor_,
  type _Setup_TextEditor_,
  type _Target_Switch_,
  type _Applied_Edit_,
  type _Asked_Host_,
  type _Update_Host_
} from "../editor/index.ts"
import {
  _Board_,
  COMPONENTMAP__VIEW_BOARD
} from "../board/index.ts"
import {
  _Host_,
  PROPOSAL_YOURS
} from "../host/index.ts"
import type {
  _Message_Page_,
  _Message_Shell_,
  _STATE_Message_Shell_
} from "../../core/shell/index.ts"

export {
  _Page_,
  type _Api__Page_,
  type _Host_Page_,
  MS_TICK__PAGE,
  type _Remembered_Editor_,
  rememberedOf__Editor,
  type _Api___rememberedOf__Editor_,
  openedOf__Page,
  type _Api___openedOf__Page_
}

class _Page_<State> {
  socket: WebSocket
  id_Editor: string
  containerElement_Board: HTMLElement
  containerElement_Status: HTMLElement
  host_Page: _Host_Page_
  host: _Host_
  editor: _TextEditor_<State>
  board: _Board_

  constructor({
    socket,
    message_Shell,
    id_Editor,
    name_Document,
    target_Mode,
    setup,
    containerElement_Editor,
    containerElement_Board,
    containerElement_Status,
    host_Page
  }: _Api__Page_<State>) {
    this.socket = socket
    this.id_Editor = id_Editor
    this.containerElement_Board = containerElement_Board
    this.containerElement_Status = containerElement_Status
    this.host_Page = host_Page
    this.host = new _Host_({
      name_Document,
      target_Mode,
      files: message_Shell.files,
      isListening_Agent: message_Shell.isListening_Agent,
      at: message_Shell.at,
      attributes: new Map(),
      state_Shell: message_Shell.state_Shell,
      suffix_Id: `-${Array.from(
        crypto.getRandomValues(new Uint8Array(3)),
        (byte) => byte.toString(16).padStart(2, "0")
      ).join("")}`,
      observers: [
        {
          sent: (command_Shell) => this.sent({
            kind: "COMMAND",
            command_Shell
          }),
          opening: (path) => this.sent({
            kind: "OPEN",
            path
          }),
          gone: () => this.gone(),
          shown: (update_Host) => this.shown(update_Host),
          boarded: (update_Board) => this.board.update(update_Board)
        }
      ]
    })
    const shown_Host = this.host.showing()
    if (shown_Host === undefined) throw new Error(`${name_Document} isn't open in doctor`)
    this.editor = new _TextEditor_({
      containerElement: containerElement_Editor,
      setup,
      model_TextEditor: shown_Host.update_Host.model_TextEditor,
      name_Document: shown_Host.update_Host.name_Document,
      proposals: shown_Host.update_Host.proposals,
      mode: shown_Host.update_Host.mode,
      tasks: shown_Host.update_Host.tasks,
      files: shown_Host.update_Host.files,
      rounds_Landed: shown_Host.update_Host.rounds_Landed,
      isListening_Agent: shown_Host.update_Host.isListening_Agent,
      source_Yours: PROPOSAL_YOURS.source,
      ranges_Frame: [],
      observers: [
        {
          applied: (applied_Edit) => this.applied(applied_Edit),
          asked: (asked_Host) => this.asked(asked_Host)
        }
      ]
    })
    this.board = new _Board_({
      containerElement: this.containerElement_Board,
      componentMap: COMPONENTMAP__VIEW_BOARD,
      tasks: shown_Host.update_Board.tasks,
      paths_Shown: shown_Host.update_Board.paths_Shown,
      observers: [
        {
          asked: (asked_Board) => {
            this.host.askedBoard(asked_Board)
            this.remembered()
          }
        }
      ]
    })
    this.socket.addEventListener(
      "message",
      (event) => this.heard(JSON.parse(String(event.data)))
    )
    this.socket.addEventListener(
      "close",
      () => this.closed()
    )
    setInterval(
      () => this.host.ticked(),
      MS_TICK__PAGE
    )
  }

  heard(
    message_Shell: _Message_Shell_
  ): void {
    this.host.heard({
      state_Shell: message_Shell.state_Shell,
      files: message_Shell.files,
      isListening_Agent: message_Shell.isListening_Agent,
      at: message_Shell.at,
      count_Edit: message_Shell.count_Edit
    })
  }

  shown(
    update_Host: _Update_Host_
  ): void {
    this.editor.update(update_Host)
    this.remembered()
  }

  applied(
    applied_Edit: _Applied_Edit_
  ): void {
    this.host.edited(applied_Edit)
  }

  asked(
    asked_Host: _Asked_Host_
  ): void {
    if (asked_Host.kind === "SHOW_BOARD") this.containerElement_Board.hidden = !this.containerElement_Board.hidden
    if (asked_Host.kind === "OPEN_FILE" && this.host_Page === "FRAMED") {
      window.parent.postMessage(
        {
          kind: "OPEN_FILE",
          path: asked_Host.path
        },
        "*"
      )
      return
    }
    this.host.asked(asked_Host)
    this.remembered()
  }

  gone(): void {
    if (this.host_Page === "FRAMED") {
      window.parent.postMessage(
        {
          kind: "CLOSE"
        },
        "*"
      )
      return
    }
    this.host.left()
  }

  sent(
    message_Page: _Message_Page_
  ): void {
    if (this.socket.readyState !== WebSocket.OPEN) return
    this.socket.send(JSON.stringify(message_Page))
  }

  remembered(): void {
    const remembered_Editor: _Remembered_Editor_ = {
      path: this.host.path_Wanted,
      target_Mode: this.host.target_Mode
    }
    try {
      localStorage.setItem(
        `doctor:editor:${this.id_Editor}`,
        JSON.stringify(remembered_Editor)
      )
    } catch {
      return
    }
  }

  closed(): void {
    this.containerElement_Status.textContent = "doctor's stopped: start it again, then reload."
    this.containerElement_Status.hidden = false
  }
}

interface _Api__Page_<State> {
  socket: WebSocket
  message_Shell: _STATE_Message_Shell_
  id_Editor: string
  name_Document: string
  target_Mode: _Target_Switch_
  setup: _Setup_TextEditor_<State>
  containerElement_Editor: HTMLElement
  containerElement_Board: HTMLElement
  containerElement_Status: HTMLElement
  host_Page: _Host_Page_
}

type _Host_Page_ = "ALONE" | "FRAMED"

const MS_TICK__PAGE = 15_000

interface _Remembered_Editor_ {
  path: string
  target_Mode: _Target_Switch_
}

interface _Api___rememberedOf__Editor_ {
  id_Editor: string
}

function rememberedOf__Editor({
  id_Editor
}: _Api___rememberedOf__Editor_): _Remembered_Editor_ | undefined {
  try {
    const text = localStorage.getItem(`doctor:editor:${id_Editor}`)
    if (text === null) return undefined
    const remembered: _Remembered_Editor_ = JSON.parse(text)
    return remembered
  } catch {
    return undefined
  }
}

interface _Api___openedOf__Page_<State> {
  url_Socket: URL
  id_Editor: string
  path_Asked: string | undefined
  setup: _Setup_TextEditor_<State>
  containerElement_Editor: HTMLElement
  containerElement_Board: HTMLElement
  containerElement_Status: HTMLElement
  host_Page: _Host_Page_
}

async function openedOf__Page<State>({
  url_Socket,
  id_Editor,
  path_Asked,
  setup,
  containerElement_Editor,
  containerElement_Board,
  containerElement_Status,
  host_Page
}: _Api___openedOf__Page_<State>): Promise<_Page_<State>> {
  const socket = new WebSocket(url_Socket)
  const messages: Array<_STATE_Message_Shell_> = []
  const wakers: Array<() => void> = []
  const listener = (event: MessageEvent) => {
    messages.push(JSON.parse(String(event.data)))
    for (const wake of wakers.splice(0)) wake()
  }
  socket.addEventListener(
    "message",
    listener
  )
  const closed = new Promise<never>((_resolve, reject) => socket.addEventListener(
    "close",
    () => reject(new Error("doctor's program closed the socket before it showed anything")),
    {
      once: true
    }
  ))
  closed.catch(() => {})
  const nextOf = async (): Promise<_STATE_Message_Shell_> => {
    for (;;) {
      const message = messages.shift()
      if (message !== undefined) return message
      await Promise.race([
        new Promise<void>((resolve) => wakers.push(resolve)),
        closed
      ])
    }
  }
  let message_Shell = await nextOf()
  const remembered = rememberedOf__Editor({
    id_Editor
  })
  const files = message_Shell.files
  const name_Document = [
    path_Asked,
    remembered?.path
  ].find((path) => path !== undefined && files.includes(path)) ?? message_Shell.path_First
  const isKept = (message: _STATE_Message_Shell_) => message.state_Shell.documents.some((document) => document.path === name_Document)
  if (!isKept(message_Shell)) {
    const message_Page: _Message_Page_ = {
      kind: "OPEN",
      path: name_Document
    }
    socket.send(JSON.stringify(message_Page))
    while (!isKept(message_Shell)) message_Shell = await nextOf()
  }
  socket.removeEventListener(
    "message",
    listener
  )
  return new _Page_({
    socket,
    message_Shell: messages.at(-1) ?? message_Shell,
    id_Editor,
    name_Document,
    target_Mode: remembered?.target_Mode ?? {
      kind: "MANUAL"
    },
    setup,
    containerElement_Editor,
    containerElement_Board,
    containerElement_Status,
    host_Page
  })
}
