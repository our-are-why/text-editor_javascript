import type {
  _Target_Switch_,
  _Attributes_Element_,
  _Update_Host_,
  _Applied_Edit_,
  _Asked_Host_,
  __BASE_Asked_Host_
} from "../editor/index.ts"
import type {
  _Update_Board_,
  _Task_Board_,
  _Asked_Board_,
  __BASE_Asked_Board_
} from "../board/index.ts"
import type {
  _Task_Tasks_,
  _OPEN_Task_Tasks_
} from "../../core/tasks/index.ts"
import type { _Model_TextEditor_ } from "../../core/documents/index.ts"
import type {
  _State_Shell_,
  _Command_Shell_
} from "../../core/shell/index.ts"
import {
  taskHostOf__Task,
  proposalsHostOf__Task,
  standingOf__Tasks,
  boardedOf__Tasks,
  roundsOf__Stale,
  scopeOf__Work,
  aimOf__Reference,
  SHOWNMAP_STATE
} from "./Projection_Host.ts"

export {
  _Host_,
  type _Api__Host_,
  type _Observer_Host_,
  type _Heard_Host_,
  type _Shown_Host_,
  handle__Asked_Host,
  type _Api___handle__Asked_Host_,
  type _HandlerMap__Asked_Host_,
  HANDLERMAP__ASKED_HOST,
  handle__Asked_Board,
  type _Api___handle__Asked_Board_,
  type _HandlerMap__Asked_Board_,
  HANDLERMAP__ASKED_BOARD,
  type _Api___END_handle__Asked_Board_
}

class _Host_ {
  name_Document: string
  path_Wanted: string
  target_Mode: _Target_Switch_
  files: Array<string>
  attributes: Map<string, _Attributes_Element_>
  state_Shell: _State_Shell_
  ids_Drafting: Array<string>
  count_Request: number
  suffix_Id: string
  count_Sent: number
  count_Acked: number
  model_Editor: _Model_TextEditor_ | undefined
  path_Editor: string
  json_Host: string
  json_Board: string
  observers: Array<_Observer_Host_>

  constructor({
    name_Document,
    target_Mode,
    files,
    attributes,
    state_Shell,
    suffix_Id,
    observers
  }: _Api__Host_) {
    this.name_Document = name_Document
    this.path_Wanted = name_Document
    this.target_Mode = target_Mode
    this.files = files
    this.attributes = attributes
    this.state_Shell = state_Shell
    this.ids_Drafting = []
    this.count_Request = 0
    this.suffix_Id = suffix_Id
    this.count_Sent = 0
    this.count_Acked = 0
    this.model_Editor = undefined
    this.path_Editor = ""
    this.json_Host = ""
    this.json_Board = ""
    this.observers = observers
  }

  heard({
    state_Shell,
    files,
    count_Edit
  }: _Heard_Host_): void {
    const isOwn = count_Edit > this.count_Acked
    this.count_Acked = count_Edit
    this.state_Shell = state_Shell
    this.files = files
    for (const id_Request of this.ids_Drafting) {
      const task = this.state_Shell.model_Tasks.tasks.find((task_Each) => task_Each.kind === "OPEN" && task_Each.requests.some((request) => request.id === id_Request))
      if (task === undefined) continue
      this.target_Mode = {
        kind: "TASK",
        id: task.id
      }
      this.ids_Drafting = this.ids_Drafting.filter((id) => id !== id_Request)
    }
    if (this.path_Wanted !== this.name_Document && this.isKept(this.path_Wanted)) this.name_Document = this.path_Wanted
    this.shown(isOwn)
  }

  showing(): _Shown_Host_ | undefined {
    const update_Host = this.updateOf__Host(undefined)
    if (update_Host === undefined) return undefined
    const update_Board = this.updateOf__Board()
    this.recorded(update_Host)
    this.json_Board = JSON.stringify(update_Board)
    return {
      update_Host,
      update_Board
    }
  }

  shown(
    isOwn: boolean
  ): void {
    const update_Host = this.updateOf__Host(isOwn ? this.model_Editor : undefined)
    if (update_Host !== undefined && (JSON.stringify(this.restOf(update_Host)) !== this.json_Host || update_Host.model_TextEditor !== this.model_Editor)) {
      this.recorded(update_Host)
      for (const observer of this.observers) observer.shown(update_Host)
    }
    const update_Board = this.updateOf__Board()
    const json_Board = JSON.stringify(update_Board)
    if (json_Board === this.json_Board) return
    this.json_Board = json_Board
    for (const observer of this.observers) observer.boarded(update_Board)
  }

  recorded(
    update_Host: _Update_Host_
  ): void {
    this.json_Host = JSON.stringify(this.restOf(update_Host))
    this.model_Editor = update_Host.model_TextEditor
    this.path_Editor = update_Host.name_Document
  }

  restOf(
    update_Host: _Update_Host_
  ): Omit<_Update_Host_, "model_TextEditor"> {
    return {
      name_Document: update_Host.name_Document,
      proposals: update_Host.proposals,
      mode: update_Host.mode,
      tasks: update_Host.tasks,
      files: update_Host.files,
      rounds_Landed: update_Host.rounds_Landed
    }
  }

  updateOf__Host(
    model_Kept: _Model_TextEditor_ | undefined
  ): _Update_Host_ | undefined {
    const document = this.state_Shell.documents.find((document_Each) => document_Each.path === this.name_Document)
    if (document === undefined) return undefined
    if (this.target_Mode.kind === "TASK" && this.taskIn() === undefined) {
      this.target_Mode = {
        kind: "MANUAL"
      }
    }
    const task = this.taskIn()
    const head = task?.heads.find((head_Each) => head_Each.path === this.name_Document)
    const model_Shell: _Model_TextEditor_ = {
      document: document.text,
      proposed: head?.proposed ?? []
    }
    const isAhead = this.count_Sent > this.count_Acked
    const isOwnFile = this.model_Editor !== undefined && this.path_Editor === this.name_Document
    const isSame = isOwnFile && JSON.stringify(model_Shell) === JSON.stringify(this.model_Editor)
    const model_TextEditor = model_Kept !== undefined && isOwnFile
      ? model_Kept
      : (isAhead || isSame) && this.model_Editor !== undefined && isOwnFile
        ? this.model_Editor
        : model_Shell
    return {
      model_TextEditor,
      name_Document: this.name_Document,
      proposals: task === undefined
        ? []
        : proposalsHostOf__Task({
          task,
          content: {
            attributes: this.attributes,
            sources_Dismissed: new Set(this.state_Shell.dismissed.find((dismissed) => dismissed.id_Task === task.id)?.sources ?? [])
          },
          name_Document: this.name_Document
        }),
      mode: task === undefined
        ? {
          kind: "MANUAL"
        }
        : {
          kind: "TASK",
          task: taskHostOf__Task({
            task,
            name_Document: this.name_Document
          })
        },
      tasks: this.state_Shell.model_Tasks.tasks.flatMap((task_Each) => task_Each.kind === "OPEN"
        ? [
          standingOf__Tasks({
            task: task_Each,
            name_Document: this.name_Document
          })
        ]
        : []),
      files: this.files,
      rounds_Landed: roundsOf__Stale({
        stale: head?.stale ?? []
      })
    }
  }

  updateOf__Board(): _Update_Board_ {
    const tasks = this.state_Shell.model_Tasks.tasks
    const tasks_Board: Array<_Task_Board_> = [
      ...tasks.filter((task) => task.kind === "OPEN"),
      ...tasks
        .flatMap((task) => task.kind === "RESOLVED" ? [task] : [])
        .toSorted((
          task,
          task_Other
        ) => task.resolution.stamp.at.localeCompare(task_Other.resolution.stamp.at))
    ].map((task) => boardedOf__Tasks({
      task,
      count_Editors: this.target_Mode.kind === "TASK" && this.target_Mode.id === task.id ? 1 : 0
    }))
    return {
      tasks: tasks_Board,
      paths_Shown: [this.name_Document]
    }
  }

  taskIn(): _OPEN_Task_Tasks_ | undefined {
    const target_Mode = this.target_Mode
    const task = target_Mode.kind === "TASK" ? this.taskOf(target_Mode.id) : undefined
    return task?.kind === "OPEN" ? task : undefined
  }

  taskOf(
    id_Task: string
  ): _Task_Tasks_ | undefined {
    return this.state_Shell.model_Tasks.tasks.find((task) => task.id === id_Task)
  }

  isKept(
    path: string
  ): boolean {
    return this.state_Shell.documents.some((document) => document.path === path)
  }

  edited(
    applied_Edit: _Applied_Edit_
  ): void {
    const task = this.taskIn()
    this.model_Editor = applied_Edit.model_After
    this.path_Editor = this.name_Document
    this.count_Sent += 1
    this.sent({
      kind: "EDIT",
      path: this.name_Document,
      transaction: applied_Edit.transaction,
      mode: task === undefined
        ? {
          kind: "MANUAL"
        }
        : {
          kind: "TASK",
          id_Task: task.id,
          proposed: applied_Edit.model_After.proposed
        }
    })
  }

  asked(
    asked_Host: _Asked_Host_
  ): void {
    handle__Asked_Host({
      host: this,
      asked_Host
    })
    this.shown(false)
  }

  askedBoard(
    asked_Board: _Asked_Board_
  ): void {
    handle__Asked_Board({
      host: this,
      asked_Board
    })
    this.shown(false)
  }

  sent(
    command_Shell: _Command_Shell_
  ): void {
    for (const observer of this.observers) observer.sent(command_Shell)
  }

  opened(
    path: string
  ): void {
    this.path_Wanted = path
    if (this.isKept(path)) {
      this.name_Document = path
      return
    }
    for (const observer of this.observers) observer.opening(path)
  }

  idOf__Request(
    prefix: string
  ): string {
    this.count_Request += 1
    return `${prefix}-${this.count_Request}${this.suffix_Id}`
  }
}

interface _Api__Host_ {
  name_Document: string
  target_Mode: _Target_Switch_
  files: Array<string>
  attributes: Map<string, _Attributes_Element_>
  state_Shell: _State_Shell_
  suffix_Id: string
  observers: Array<_Observer_Host_>
}

interface _Observer_Host_ {
  sent: (command_Shell: _Command_Shell_) => void
  opening: (path: string) => void
  shown: (update_Host: _Update_Host_) => void
  boarded: (update_Board: _Update_Board_) => void
}

interface _Heard_Host_ {
  state_Shell: _State_Shell_
  files: Array<string>
  count_Edit: number
}

interface _Shown_Host_ {
  update_Host: _Update_Host_
  update_Board: _Update_Board_
}

interface _Api___handle__Asked_Host_<Kind extends _Asked_Host_["kind"]> {
  host: _Host_
  asked_Host: Extract<
    _Asked_Host_,
    __BASE_Asked_Host_<Kind>
  >
}

function handle__Asked_Host<Kind extends _Asked_Host_["kind"]>({
  host,
  asked_Host
}: _Api___handle__Asked_Host_<Kind>): void {
  const handle = HANDLERMAP__ASKED_HOST[asked_Host.kind]
  handle({
    host,
    asked_Host
  })
}

type _HandlerMap__Asked_Host_ = {
  [Kind in _Asked_Host_["kind"]]: (api_Handler: _Api___handle__Asked_Host_<Kind>) => void
}

const HANDLERMAP__ASKED_HOST: _HandlerMap__Asked_Host_ = {
  ACTION: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    const proposal = task?.proposals.find((proposal_Each) => proposal_Each.id === asked_Host.source)
    const action_Item = proposal === undefined ? undefined : SHOWNMAP_STATE[proposal.decision].actions.find((action_Each) => action_Each.command === asked_Host.command)
    if (task === undefined || action_Item === undefined) return
    const stateAfter = action_Item.stateAfter
    if (stateAfter === null) {
      host.sent({
        kind: "DISMISS_PROPOSAL",
        id_Task: task.id,
        id_Proposal: asked_Host.source
      })
    } else if (stateAfter === "REQUESTED" || stateAfter === "REVISING") {
      if (asked_Host.notes === null) return
      host.sent({
        kind: "REQUEST",
        id_Task: task.id,
        request: {
          id: host.idOf__Request(asked_Host.source),
          notes: asked_Host.notes,
          aim: aimOf__Reference({
            kind: "PROPOSAL",
            reference: asked_Host.reference,
            path: asked_Host.source
          })
        },
        isStarting: false,
        path: host.name_Document
      })
    } else {
      host.sent({
        kind: "DECIDE",
        id_Task: task.id,
        id_Proposal: asked_Host.source,
        decision: stateAfter
      })
    }
  },
  REQUEST: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    const request = {
      id: host.idOf__Request("document"),
      notes: asked_Host.notes,
      aim: aimOf__Reference({
        kind: asked_Host.aim.kind,
        reference: asked_Host.aim.reference,
        path: host.name_Document
      })
    }
    if (task === undefined) {
      host.ids_Drafting = [
        ...host.ids_Drafting,
        request.id
      ]
      host.sent({
        kind: "DRAFT",
        request,
        isStarting: asked_Host.isStarting,
        path: host.name_Document
      })
      return
    }
    host.sent({
      kind: "REQUEST",
      id_Task: task.id,
      request,
      isStarting: asked_Host.isStarting,
      path: host.name_Document
    })
  },
  EDIT: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "TASKS",
      command_Tasks: {
        kind: "EDIT",
        id_Task: task.id,
        id_Request: asked_Host.id,
        notes: asked_Host.notes
      }
    })
  },
  REMOVE: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "TASKS",
      command_Tasks: {
        kind: "REMOVE",
        id_Task: task.id,
        id_Request: asked_Host.id
      }
    })
  },
  DISMISS: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "TASKS",
      command_Tasks: {
        kind: "DISMISS",
        id_Task: task.id,
        id_Request: asked_Host.id
      }
    })
  },
  START: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "START",
      id_Task: task.id,
      scope: scopeOf__Work({
        scope_Work: asked_Host.scope,
        task,
        name_Document: host.name_Document
      }),
      path: host.name_Document
    })
  },
  STOP: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "STOP",
      id_Task: task.id,
      scope: scopeOf__Work({
        scope_Work: asked_Host.scope,
        task,
        name_Document: host.name_Document
      })
    })
  },
  TASK: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    const command = asked_Host.command
    if (task === undefined) return
    const paths = command === "accept-here"
      ? [host.name_Document]
      : command === "accept-task"
        ? [...new Set(task.proposals.map((proposal) => proposal.path))]
        : command.startsWith("accept-in:")
          ? [command.slice("accept-in:".length)]
          : []
    if (paths.length === 0) return
    host.sent({
      kind: "ACCEPT",
      id_Task: task.id,
      paths
    })
  },
  END: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "END",
      id_Task: task.id,
      kind_End: asked_Host.end
    })
  },
  SWITCH: ({
    host,
    asked_Host
  }) => {
    host.target_Mode = asked_Host.target
  },
  OPEN_FILE: ({
    host,
    asked_Host
  }) => host.opened(asked_Host.path),
  SHOW_BOARD: () => {},
  RERUN: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "RERUN",
      id_Task: task.id,
      id_Proposal: asked_Host.source,
      path: host.name_Document
    })
  },
  SETTLE: ({
    host,
    asked_Host
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    host.sent({
      kind: "SETTLE",
      id_Task: task.id,
      path: host.name_Document,
      source: asked_Host.source,
      way: asked_Host.way
    })
  }
}

interface _Api___handle__Asked_Board_<Kind extends _Asked_Board_["kind"]> {
  host: _Host_
  asked_Board: Extract<
    _Asked_Board_,
    __BASE_Asked_Board_<Kind>
  >
}

function handle__Asked_Board<Kind extends _Asked_Board_["kind"]>({
  host,
  asked_Board
}: _Api___handle__Asked_Board_<Kind>): void {
  const handle = HANDLERMAP__ASKED_BOARD[asked_Board.kind]
  handle({
    host,
    asked_Board
  })
}

type _HandlerMap__Asked_Board_ = {
  [Kind in _Asked_Board_["kind"]]: (api_Handler: _Api___handle__Asked_Board_<Kind>) => void
}

type _Api___END_handle__Asked_Board_ = _Api___handle__Asked_Board_<"APPLY"> | _Api___handle__Asked_Board_<"CANCEL"> | _Api___handle__Asked_Board_<"DISCARD">

const ended__Board = ({
  host,
  asked_Board
}: _Api___END_handle__Asked_Board_) => host.sent({
  kind: "END",
  id_Task: asked_Board.id,
  kind_End: asked_Board.kind
})

const HANDLERMAP__ASKED_BOARD: _HandlerMap__Asked_Board_ = {
  SWITCH: ({
    host,
    asked_Board
  }) => {
    host.target_Mode = {
      kind: "TASK",
      id: asked_Board.id
    }
  },
  START: ({
    host,
    asked_Board
  }) => host.sent({
    kind: "START",
    id_Task: asked_Board.id,
    scope: {
      kind: "TASK"
    },
    path: host.name_Document
  }),
  STOP: ({
    host,
    asked_Board
  }) => host.sent({
    kind: "STOP",
    id_Task: asked_Board.id,
    scope: {
      kind: "TASK"
    }
  }),
  APPLY: ended__Board,
  CANCEL: ended__Board,
  DISCARD: ended__Board,
  COLLECT: ({
    host,
    asked_Board
  }) => host.sent({
    kind: "TASKS",
    command_Tasks: {
      kind: "COLLECT",
      ids_Task: asked_Board.ids
    }
  }),
  NEW_TASK: () => {}
}
