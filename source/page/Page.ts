import {
  _TextEditor_,
  type _Setup_TextEditor_,
  type _Applied_Edit_,
  type _Asked_Host_
} from "../editor/index.ts"
import {
  _Board_,
  COMPONENTMAP__VIEW_BOARD
} from "../board/index.ts"
import {
  PROPOSAL_YOURS,
  type _Shown_Shell_,
  type _Message_Page_,
  type _Message_Shell_,
  type __BASE_Message_Shell_,
  type _SHOWN_Message_Shell_
} from "../shell/index.ts"

export {
  _Page_,
  type _Api__Page_,
  handle__Message_Shell,
  type _Api___handle__Message_Shell_,
  type _Hearer_Shell_,
  type _HandlerMap__Message_Shell_,
  HANDLERMAP__MESSAGE_SHELL,
  openedOf__Page,
  type _Api___openedOf__Page_
}

class _Page_<State> {
  socket: WebSocket
  containerElement_Board: HTMLElement
  containerElement_Status: HTMLElement
  count_Edit: number
  editor: _TextEditor_<State>
  board: _Board_

  constructor({
    socket,
    shown_Shell,
    setup,
    containerElement_Editor,
    containerElement_Board,
    containerElement_Status
  }: _Api__Page_<State>) {
    this.socket = socket
    this.containerElement_Board = containerElement_Board
    this.containerElement_Status = containerElement_Status
    this.count_Edit = 0
    this.editor = new _TextEditor_({
      containerElement: containerElement_Editor,
      setup,
      model_TextEditor: shown_Shell.update_Host.model_TextEditor,
      name_Document: shown_Shell.update_Host.name_Document,
      proposals: shown_Shell.update_Host.proposals,
      mode: shown_Shell.update_Host.mode,
      tasks: shown_Shell.update_Host.tasks,
      files: shown_Shell.update_Host.files,
      rounds_Landed: shown_Shell.update_Host.rounds_Landed,
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
      tasks: shown_Shell.update_Board.tasks,
      paths_Shown: shown_Shell.update_Board.paths_Shown,
      observers: [
        {
          asked: (asked_Board) => this.sent({
            kind: "ASKED_BOARD",
            count_Edit: this.count_Edit,
            asked_Board
          })
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
  }

  applied(
    applied_Edit: _Applied_Edit_
  ): void {
    this.count_Edit += 1
    this.sent({
      kind: "APPLIED",
      count_Edit: this.count_Edit,
      name_Document: this.editor.name_Document,
      applied_Edit
    })
  }

  asked(
    asked_Host: _Asked_Host_
  ): void {
    if (asked_Host.kind === "SHOW_BOARD") this.containerElement_Board.hidden = !this.containerElement_Board.hidden
    this.sent({
      kind: "ASKED",
      count_Edit: this.count_Edit,
      asked_Host
    })
  }

  heard(
    message_Shell: _Message_Shell_
  ): void {
    handle__Message_Shell({
      page: this,
      message_Shell
    })
  }

  shown(
    message_Shell: _SHOWN_Message_Shell_
  ): void {
    const update_Host = message_Shell.shown_Shell.update_Host
    const isAhead = this.count_Edit > message_Shell.count_Edit && update_Host.name_Document === this.editor.name_Document
    const isSame = JSON.stringify(update_Host.model_TextEditor) === JSON.stringify(this.editor.model_TextEditor)
    this.editor.update({
      model_TextEditor: isAhead || isSame ? this.editor.model_TextEditor : update_Host.model_TextEditor,
      name_Document: update_Host.name_Document,
      proposals: update_Host.proposals,
      mode: update_Host.mode,
      tasks: update_Host.tasks,
      files: update_Host.files,
      rounds_Landed: update_Host.rounds_Landed
    })
    this.board.update(message_Shell.shown_Shell.update_Board)
  }

  sent(
    message_Page: _Message_Page_
  ): void {
    if (this.socket.readyState !== WebSocket.OPEN) return
    this.socket.send(JSON.stringify(message_Page))
  }

  closed(): void {
    this.containerElement_Status.textContent = "doctor's stopped: start it again, then reload."
    this.containerElement_Status.hidden = false
  }
}

interface _Api__Page_<State> {
  socket: WebSocket
  shown_Shell: _Shown_Shell_
  setup: _Setup_TextEditor_<State>
  containerElement_Editor: HTMLElement
  containerElement_Board: HTMLElement
  containerElement_Status: HTMLElement
}

interface _Api___handle__Message_Shell_<Kind extends _Message_Shell_["kind"]> {
  page: _Hearer_Shell_
  message_Shell: Extract<
    _Message_Shell_,
    __BASE_Message_Shell_<Kind>
  >
}

function handle__Message_Shell<Kind extends _Message_Shell_["kind"]>({
  page,
  message_Shell
}: _Api___handle__Message_Shell_<Kind>): void {
  const handle = HANDLERMAP__MESSAGE_SHELL[message_Shell.kind]
  handle({
    page,
    message_Shell
  })
}

interface _Hearer_Shell_ {
  shown: (message_Shell: _SHOWN_Message_Shell_) => void
}

type _HandlerMap__Message_Shell_ = {
  [Kind in _Message_Shell_["kind"]]: (api_Handler: _Api___handle__Message_Shell_<Kind>) => void
}

const HANDLERMAP__MESSAGE_SHELL: _HandlerMap__Message_Shell_ = {
  SHOWN: ({
    page,
    message_Shell
  }) => page.shown(message_Shell)
}

interface _Api___openedOf__Page_<State> {
  url_Socket: URL
  setup: _Setup_TextEditor_<State>
  containerElement_Editor: HTMLElement
  containerElement_Board: HTMLElement
  containerElement_Status: HTMLElement
}

async function openedOf__Page<State>({
  url_Socket,
  setup,
  containerElement_Editor,
  containerElement_Board,
  containerElement_Status
}: _Api___openedOf__Page_<State>): Promise<_Page_<State>> {
  const socket = new WebSocket(url_Socket)
  const message_Shell = await new Promise<_Message_Shell_>((resolve, reject) => {
    socket.addEventListener(
      "message",
      (event) => resolve(JSON.parse(String(event.data))),
      {
        once: true
      }
    )
    socket.addEventListener(
      "close",
      () => reject(new Error("doctor's program closed the socket before it showed anything")),
      {
        once: true
      }
    )
  })
  return new _Page_({
    socket,
    shown_Shell: message_Shell.shown_Shell,
    setup,
    containerElement_Editor,
    containerElement_Board,
    containerElement_Status
  })
}
