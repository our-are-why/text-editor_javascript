import type {
  _Target_Switch_,
  _Selected_Text_,
  _Update_Host_,
  _Mode_Host_,
  _Proposal_Host_,
  _Standing_Task_,
  _Applied_Edit_,
  _Asked_Host_,
  __BASE_Asked_Host_,
  _Scope_Work_,
  _Kind_End_
} from "../editor/index.ts"
import type {
  _Update_Board_,
  _Task_Board_,
  _Asked_Board_,
  __BASE_Asked_Board_
} from "../board/index.ts"
import {
  isOwn__Source,
  type _Tasks_,
  type _Task_Tasks_,
  type _OPEN_Task_Tasks_,
  type _Request_Tasks_,
  type _Aim_Request_Tasks_,
  type _Stamp_Tasks_,
  type _Author_Tasks_,
  type _Words_Aim_
} from "../tasks/index.ts"
import {
  carriedOf__Head,
  checkedOf__Head,
  settledOf__Head,
  type _Documents_,
  type _Document_Documents_,
  type _Head_Document_,
  type _Changes_Source_,
  type _Model_TextEditor_,
  type _Text_Model_
} from "../documents/index.ts"
import {
  roundsOf__Stale,
  taskHostOf__Task,
  proposalsHostOf__Task,
  standingOf__Tasks,
  boardedOf__Tasks,
  scopeOf__Work,
  waitingOf__Task,
  SHOWNMAP_STATE,
  type _Content_Task_
} from "./Projection_Shell.ts"

export {
  _Shell_,
  type _Api__Shell_,
  type _Base_Round_,
  type _Again_Request_,
  type _Observer_Shell_,
  type _Shown_Shell_,
  type _Round_Shell_,
  type _Stop_Shell_,
  type _Landing_Round_,
  type _Answer_Landing_,
  type _Api___opened__Shell_,
  type _Api___requestsOf__Rerun__Shell_,
  type _Api___restated__Shell_,
  type _Api___landedOn__Shell_,
  type _Api___freshened__Shell_,
  type _Api___dismissedIn__Shell_,
  type _Api___started__Shell_,
  type _Api___stopped__Shell_,
  type _Api___requested__Shell_,
  type _Api___ended__Shell_,
  handle__Asked_Host,
  type _Api___handle__Asked_Host_,
  type _HandlerMap__Asked_Host_,
  HANDLERMAP__ASKED_HOST,
  handle__Asked_Board,
  type _Api___handle__Asked_Board_,
  type _HandlerMap__Asked_Board_,
  HANDLERMAP__ASKED_BOARD,
  type _Api___END_handle__Asked_Board_,
  keyIn__Task,
  type _Api___keyIn__Task_,
  idsOf__Started,
  type _Api___idsOf__Started_,
  stampOf,
  type _Api___stampOf_,
  idOf__Task_Next,
  type _Api___idOf__Task_Next_,
  aimOf__Reference,
  type _Api___aimOf__Reference_,
  wordsOf__Reference,
  type _Api___wordsOf__Reference_
}

class _Shell_ {
  tasks: _Tasks_
  documents: _Documents_
  name_Document: string
  files: Array<string>
  target_Mode: _Target_Switch_
  references: Map<string, _Selected_Text_ | null>
  contents: Map<string, _Content_Task_>
  bases_Round: Map<string, _Base_Round_>
  rounds_Request: Map<string, number>
  count_Request: number
  count_Round: number
  observers: Array<_Observer_Shell_>

  constructor({
    tasks,
    documents,
    name_Document,
    files,
    target_Mode,
    references,
    contents,
    observers
  }: _Api__Shell_) {
    this.tasks = tasks
    this.documents = documents
    this.name_Document = name_Document
    this.files = files
    this.target_Mode = target_Mode
    this.references = references
    this.contents = contents
    this.bases_Round = new Map()
    this.rounds_Request = new Map()
    this.count_Request = 0
    this.count_Round = 0
    this.observers = observers
  }

  shown(): _Shown_Shell_ {
    const task = this.taskIn()
    const head = task === undefined ? undefined : this.headOf(task)
    return this.shownOf({
      document: this.documentOf().text,
      proposed: head?.proposed ?? []
    })
  }

  shownOf(
    model_TextEditor: _Model_TextEditor_
  ): _Shown_Shell_ {
    const task = this.taskIn()
    const head = task === undefined ? undefined : this.headOf(task)
    return {
      update_Host: {
        model_TextEditor,
        name_Document: this.name_Document,
        proposals: this.proposalsOf(),
        mode: this.modeOf(),
        tasks: this.standingsOf(),
        files: this.files,
        rounds_Landed: roundsOf__Stale({
          stale: head?.stale ?? []
        })
      },
      update_Board: {
        tasks: this.boardedOf(),
        paths_Shown: [this.name_Document]
      }
    }
  }

  taskIn(): _OPEN_Task_Tasks_ | undefined {
    const task = this.target_Mode.kind === "TASK" ? this.taskOf(this.target_Mode.id) : undefined
    return task?.kind === "OPEN" ? task : undefined
  }

  taskOf(
    id_Task: string
  ): _Task_Tasks_ | undefined {
    return this.tasks.model_Tasks.tasks.find((task) => task.id === id_Task)
  }

  headOf(
    task: _Task_Tasks_
  ): _Head_Document_ | undefined {
    return task.heads.find((head) => head.path === this.name_Document)
  }

  documentOf(): _Document_Documents_ {
    const document = this.documents.model_Documents.documents.find((document_Each) => document_Each.path === this.name_Document)
    if (document === undefined) throw new Error(`${this.name_Document} isn't kept`)
    return document
  }

  proposalsOf(): Array<_Proposal_Host_> {
    const task = this.taskIn()
    return task === undefined
      ? []
      : proposalsHostOf__Task({
        task,
        content: this.contentOf(task.id),
        name_Document: this.name_Document,
        references: this.references
      })
  }

  contentOf(
    id_Task: string
  ): _Content_Task_ {
    return this.contents.get(id_Task) ?? {
      attributes: new Map(),
      sources_Dismissed: new Set()
    }
  }

  modeOf(): _Mode_Host_ {
    const task = this.taskIn()
    return task === undefined
      ? {
        kind: "MANUAL"
      }
      : {
        kind: "TASK",
        task: taskHostOf__Task({
          task,
          name_Document: this.name_Document,
          references: this.references
        })
      }
  }

  standingsOf(): Array<_Standing_Task_> {
    return this.tasks.model_Tasks.tasks.flatMap((task) => task.kind === "OPEN"
      ? [
        standingOf__Tasks({
          task,
          name_Document: this.name_Document
        })
      ]
      : [])
  }

  boardedOf(): Array<_Task_Board_> {
    return [
      ...this.tasks.model_Tasks.tasks.filter((task) => task.kind === "OPEN"),
      ...this.tasks.model_Tasks.tasks
        .flatMap((task) => task.kind === "RESOLVED" ? [task] : [])
        .toSorted((
          task,
          task_Other
        ) => task.resolution.stamp.at.localeCompare(task_Other.resolution.stamp.at))
    ].map((task) => boardedOf__Tasks({
      task,
      count_Editors: this.target_Mode.kind === "TASK" && this.target_Mode.id === task.id ? 1 : 0
    }))
  }

  edited(
    applied_Edit: _Applied_Edit_
  ): void {
    const task = this.taskIn()
    const standings_Before = JSON.stringify(this.standingsOf())
    this.documents.handle({
      kind: "EDIT",
      path: this.name_Document,
      version: this.documentOf().version,
      transaction: applied_Edit.transaction
    })
    if (task !== undefined) {
      this.restated({
        id_Task: task.id,
        change: (head) => checkedOf__Head({
          document: this.documentOf(),
          head: {
            ...head,
            version: this.documentOf().version,
            proposed: applied_Edit.model_After.proposed
          }
        })
      })
    }
    this.carried(task === undefined ? [] : [task.id])
    this.released()
    if (JSON.stringify(this.standingsOf()) !== standings_Before) this.told(applied_Edit.model_After)
  }

  asked(
    asked_Host: _Asked_Host_
  ): void {
    const isChanged = handle__Asked_Host({
      shell: this,
      asked_Host
    })
    if (isChanged) this.updated()
  }

  askedBoard(
    asked_Board: _Asked_Board_
  ): void {
    const isChanged = handle__Asked_Board({
      shell: this,
      asked_Board
    })
    if (isChanged) this.updated()
  }

  landed(
    landing_Round: _Landing_Round_
  ): _Answer_Landing_ {
    const round_Shell = landing_Round.round_Shell
    const id_Task = round_Shell.id_Task
    const isCurrent = (id: string) => this.rounds_Request.get(keyIn__Task({
      id_Task,
      id
    })) === round_Shell.id && idsOf__Started({
      task: this.taskOf(id_Task)
    }).includes(id)
    const ids_Current = round_Shell.requests.flatMap((request) => isCurrent(request.id) ? [request.id] : [])
    const idsOf = (source: string) => round_Shell.requests.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === source && ids_Current.includes(request.id) ? [request.id] : [])
    const sources_Landing = round_Shell.sources.filter((source) => idsOf(source).length > 0)
    const ids_Addressed = round_Shell.requests.flatMap((request) => request.aim.kind !== "PROPOSAL" && ids_Current.includes(request.id) ? [request.id] : [])
    if (sources_Landing.length + ids_Addressed.length === 0) {
      return {
        sources: [],
        ids_Addressed: []
      }
    }
    for (const source of sources_Landing) {
      this.tasks.handle({
        kind: "ADDRESS",
        id_Task,
        ids_Request: idsOf(source),
        answer: {
          kind: "PROPOSALS",
          ids_Proposal: [source]
        }
      })
      this.landedOn({
        id_Task,
        source,
        version: round_Shell.version,
        proposed: landing_Round.proposed.filter((changes_Source) => changes_Source.source === source)
      })
    }
    if (ids_Addressed.length > 0) {
      this.tasks.handle({
        kind: "ADDRESS",
        id_Task,
        ids_Request: ids_Addressed,
        answer: {
          kind: "NOTHING",
          note: ""
        }
      })
    }
    this.updated()
    return {
      sources: sources_Landing,
      ids_Addressed
    }
  }

  opened({
    path,
    text
  }: _Api___opened__Shell_): void {
    const isKept = this.documents.model_Documents.documents.some((document) => document.path === path)
    if (!isKept) {
      this.documents.handle({
        kind: "OPEN",
        path,
        text
      })
    }
    this.name_Document = path
    this.updated()
  }

  requestsOf__Rerun({
    id_Task,
    source
  }: _Api___requestsOf__Rerun__Shell_): Array<_Again_Request_> {
    const requests = this.bases_Round.get(keyIn__Task({
      id_Task,
      id: source
    }))?.requests ?? []
    return requests.length > 0
      ? requests
      : [
        {
          notes: "Again, on the document as it is now.",
          reference: null
        }
      ]
  }

  idOf__Request_Next(
    prefix: string
  ): string {
    this.count_Request += 1
    return `${prefix}-${this.count_Request}`
  }

  updated(): void {
    if (this.target_Mode.kind === "TASK" && this.taskIn() === undefined) {
      this.target_Mode = {
        kind: "MANUAL"
      }
    }
    this.released()
    const shown_Shell = this.shown()
    for (const observer of this.observers) observer.shown(shown_Shell)
  }

  told(
    model_TextEditor: _Model_TextEditor_
  ): void {
    const shown_Shell = this.shownOf(model_TextEditor)
    for (const observer of this.observers) observer.shown(shown_Shell)
  }

  restated({
    id_Task,
    change
  }: _Api___restated__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined) return
    this.tasks.handle({
      kind: "RESTATE",
      id_Task,
      head: change(this.headOf(task) ?? {
        path: this.name_Document,
        version: this.documentOf().version,
        proposed: [],
        stale: []
      })
    })
  }

  carried(
    ids_Except: Array<string>
  ): void {
    const document = this.documentOf()
    for (const task of this.tasks.model_Tasks.tasks) {
      const head = this.headOf(task)
      if (task.kind !== "OPEN" || ids_Except.includes(task.id) || head === undefined) continue
      this.tasks.handle({
        kind: "RESTATE",
        id_Task: task.id,
        head: carriedOf__Head({
          document,
          head
        })
      })
    }
  }

  released(): void {
    const versions = [...this.bases_Round.values()].flatMap((base_Round) => {
      const isRunning = (this.taskOf(base_Round.id_Task)?.requests ?? []).some((request) => request.status.kind === "WITH_AGENT" && request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === base_Round.source)
      return isRunning ? [base_Round.version] : []
    })
    this.documents.handle({
      kind: "RELEASE",
      path: this.name_Document,
      versions
    })
  }

  landedOn({
    id_Task,
    source,
    version,
    proposed
  }: _Api___landedOn__Shell_): void {
    const head_Round = carriedOf__Head({
      document: this.documentOf(),
      head: {
        path: this.name_Document,
        version,
        proposed,
        stale: []
      }
    })
    const [
      changes_Round
    ] = head_Round.proposed
    this.restated({
      id_Task,
      change: (head) => ({
        ...head,
        proposed: changes_Round === undefined
          ? head.proposed
          : head.proposed.map((changes_Source) => changes_Source.source === source ? changes_Round : changes_Source),
        stale: [
          ...head.stale.filter((stale_Source) => stale_Source.source !== source),
          ...head_Round.stale
        ]
      })
    })
  }

  freshened({
    id_Task,
    sources
  }: _Api___freshened__Shell_): void {
    this.restated({
      id_Task,
      change: (head) => ({
        ...head,
        stale: head.stale.filter((stale_Source) => !sources.includes(stale_Source.source))
      })
    })
  }

  dismissedIn({
    id_Task,
    source
  }: _Api___dismissedIn__Shell_): void {
    const content = this.contentOf(id_Task)
    this.contents.set(
      id_Task,
      {
        ...content,
        sources_Dismissed: new Set([
          ...content.sources_Dismissed,
          source
        ])
      }
    )
  }

  started({
    id_Task,
    scope_Work
  }: _Api___started__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined || task.kind !== "OPEN") return
    const ids_Before = idsOf__Started({
      task
    })
    this.tasks.handle({
      kind: "START",
      id_Task,
      scope: scopeOf__Work({
        scope_Work,
        task,
        name_Document: this.name_Document
      }),
      stamp: stampOf({
        by: "HUMAN"
      })
    })
    const ids_Started = idsOf__Started({
      task: this.taskOf(id_Task)
    }).filter((id) => !ids_Before.includes(id))
    const requests_Started = (this.taskOf(id_Task)?.requests ?? []).filter((request) => ids_Started.includes(request.id))
    const sources = task.proposals.flatMap((proposal) => requests_Started.some((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === proposal.id) ? [proposal.id] : [])
    this.count_Round += 1
    const round_Shell: _Round_Shell_ = {
      id: this.count_Round,
      id_Task,
      requests: requests_Started,
      sources,
      version: this.documentOf().version,
      proposed: (this.headOf(task)?.proposed ?? []).filter((changes_Source) => sources.includes(changes_Source.source))
    }
    for (const request of requests_Started) {
      this.rounds_Request.set(
        keyIn__Task({
          id_Task,
          id: request.id
        }),
        round_Shell.id
      )
    }
    for (const source of sources) {
      this.bases_Round.set(
        keyIn__Task({
          id_Task,
          id: source
        }),
        {
          id_Task,
          source,
          version: round_Shell.version,
          requests: requests_Started.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === source
            ? [
              {
                notes: request.notes,
                reference: this.references.get(request.id) ?? null
              }
            ]
            : [])
        }
      )
    }
    for (const observer of this.observers) observer.started(round_Shell)
  }

  stopped({
    id_Task,
    scope_Work
  }: _Api___stopped__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined) return
    const ids_Before = idsOf__Started({
      task
    })
    this.tasks.handle({
      kind: "STOP",
      id_Task,
      scope: scopeOf__Work({
        scope_Work,
        task,
        name_Document: this.name_Document
      })
    })
    const ids_After = idsOf__Started({
      task: this.taskOf(id_Task)
    })
    const ids_Stopped = ids_Before.filter((id) => !ids_After.includes(id))
    for (const id of ids_Stopped) {
      this.rounds_Request.delete(keyIn__Task({
        id_Task,
        id
      }))
    }
    for (const observer of this.observers) {
      observer.stopped({
        id_Task,
        scope_Work,
        ids_Request: ids_Stopped
      })
    }
  }

  requested({
    id,
    notes,
    aim,
    isStarting
  }: _Api___requested__Shell_): void {
    const task = this.taskIn()
    const id_Task = task?.id ?? idOf__Task_Next({
      tasks: this.tasks.model_Tasks.tasks
    })
    if (task === undefined) {
      this.tasks.handle({
        kind: "DRAFT",
        id_Task,
        name: notes,
        request: {
          id,
          notes,
          aim
        },
        stamp: stampOf({
          by: "HUMAN"
        })
      })
      this.target_Mode = {
        kind: "TASK",
        id: id_Task
      }
    } else {
      this.tasks.handle({
        kind: "REQUEST",
        id_Task,
        request: {
          id,
          notes,
          aim
        },
        stamp: stampOf({
          by: "HUMAN"
        })
      })
    }
    if (isStarting) {
      this.started({
        id_Task,
        scope_Work: {
          kind: "REQUEST",
          source: null,
          id
        }
      })
    }
  }

  acceptedIn(
    paths: Array<string>
  ): void {
    const task = this.taskIn()
    if (task === undefined) return
    const sources_Accepted = paths.flatMap((path) => waitingOf__Task({
      task,
      path
    }).map((proposal) => proposal.id))
    for (const id_Proposal of sources_Accepted) {
      this.tasks.handle({
        kind: "DECIDE",
        id_Task: task.id,
        id_Proposal,
        decision: "ACCEPTED"
      })
    }
    this.freshened({
      id_Task: task.id,
      sources: sources_Accepted
    })
  }

  ended({
    id_Task,
    kind_End
  }: _Api___ended__Shell_): void {
    this.tasks.handle({
      kind: kind_End,
      id_Task,
      stamp: stampOf({
        by: "HUMAN"
      })
    })
    const task = this.taskOf(id_Task)
    const head = task === undefined ? undefined : this.headOf(task)
    if (task === undefined || head === undefined || task.kind !== "RESOLVED" || task.resolution.how !== "APPLIED") return
    this.documents.handle({
      kind: "APPLY",
      path: this.name_Document,
      version: head.version,
      proposed: head.proposed,
      sources: head.proposed.flatMap((changes_Source) => isOwn__Source({
        task,
        source: changes_Source.source
      })
        ? [changes_Source.source]
        : [])
    })
    this.carried([id_Task])
  }
}

interface _Api__Shell_ {
  tasks: _Tasks_
  documents: _Documents_
  name_Document: string
  files: Array<string>
  target_Mode: _Target_Switch_
  references: Map<string, _Selected_Text_ | null>
  contents: Map<string, _Content_Task_>
  observers: Array<_Observer_Shell_>
}

interface _Base_Round_ {
  id_Task: string
  source: string
  version: string
  requests: Array<_Again_Request_>
}

interface _Again_Request_ {
  notes: string
  reference: _Selected_Text_ | null
}

interface _Observer_Shell_ {
  shown: (shown_Shell: _Shown_Shell_) => void
  started: (round_Shell: _Round_Shell_) => void
  stopped: (stop_Shell: _Stop_Shell_) => void
  opening: (path: string) => void
}

interface _Shown_Shell_ {
  update_Host: _Update_Host_
  update_Board: _Update_Board_
}

interface _Round_Shell_ {
  id: number
  id_Task: string
  requests: Array<_Request_Tasks_>
  sources: Array<string>
  version: string
  proposed: Array<_Changes_Source_>
}

interface _Stop_Shell_ {
  id_Task: string
  scope_Work: _Scope_Work_
  ids_Request: Array<string>
}

interface _Landing_Round_ {
  round_Shell: _Round_Shell_
  proposed: Array<_Changes_Source_>
}

interface _Answer_Landing_ {
  sources: Array<string>
  ids_Addressed: Array<string>
}

interface _Api___opened__Shell_ {
  path: string
  text: _Text_Model_
}

interface _Api___requestsOf__Rerun__Shell_ {
  id_Task: string
  source: string
}

interface _Api___restated__Shell_ {
  id_Task: string
  change: (head: _Head_Document_) => _Head_Document_
}

interface _Api___landedOn__Shell_ {
  id_Task: string
  source: string
  version: string
  proposed: Array<_Changes_Source_>
}

interface _Api___freshened__Shell_ {
  id_Task: string
  sources: Array<string>
}

interface _Api___dismissedIn__Shell_ {
  id_Task: string
  source: string
}

interface _Api___started__Shell_ {
  id_Task: string
  scope_Work: _Scope_Work_
}

interface _Api___stopped__Shell_ {
  id_Task: string
  scope_Work: _Scope_Work_
}

interface _Api___requested__Shell_ {
  id: string
  notes: string
  aim: _Aim_Request_Tasks_
  isStarting: boolean
}

interface _Api___ended__Shell_ {
  id_Task: string
  kind_End: _Kind_End_
}

interface _Api___handle__Asked_Host_<Kind extends _Asked_Host_["kind"]> {
  shell: _Shell_
  asked_Host: Extract<
    _Asked_Host_,
    __BASE_Asked_Host_<Kind>
  >
}

function handle__Asked_Host<Kind extends _Asked_Host_["kind"]>({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<Kind>): boolean {
  const handle = HANDLERMAP__ASKED_HOST[asked_Host.kind]
  return handle({
    shell,
    asked_Host
  })
}

type _HandlerMap__Asked_Host_ = {
  [Kind in _Asked_Host_["kind"]]: (api_Handler: _Api___handle__Asked_Host_<Kind>) => boolean
}

const HANDLERMAP__ASKED_HOST: _HandlerMap__Asked_Host_ = {
  ACTION: ACTION_handle__Asked_Host,
  REQUEST: REQUEST_handle__Asked_Host,
  EDIT: EDIT_handle__Asked_Host,
  REMOVE: REMOVE_handle__Asked_Host,
  DISMISS: DISMISS_handle__Asked_Host,
  START: START_handle__Asked_Host,
  STOP: STOP_handle__Asked_Host,
  TASK: TASK_handle__Asked_Host,
  END: END_handle__Asked_Host,
  SWITCH: SWITCH_handle__Asked_Host,
  OPEN_FILE: OPEN_FILE__handle__Asked_Host,
  SHOW_BOARD: SHOW_BOARD__handle__Asked_Host,
  RERUN: RERUN_handle__Asked_Host,
  SETTLE: SETTLE_handle__Asked_Host
}

function ACTION_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"ACTION">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return false
  const proposal = task.proposals.find((proposal_Each) => proposal_Each.id === asked_Host.source)
  const action_Item = proposal === undefined ? undefined : SHOWNMAP_STATE[proposal.decision].actions.find((action_Each) => action_Each.command === asked_Host.command)
  if (action_Item === undefined) return false
  const stateAfter = action_Item.stateAfter
  if (stateAfter !== "REQUESTED" && stateAfter !== "REVISING") {
    shell.freshened({
      id_Task: task.id,
      sources: [asked_Host.source]
    })
  }
  if (stateAfter === null) {
    shell.restated({
      id_Task: task.id,
      change: (head) => ({
        ...head,
        proposed: head.proposed.filter((changes_Source) => changes_Source.source !== asked_Host.source)
      })
    })
    shell.dismissedIn({
      id_Task: task.id,
      source: asked_Host.source
    })
  } else if (stateAfter === "REQUESTED" || stateAfter === "REVISING") {
    const notes = asked_Host.notes
    if (notes === null) return true
    const id = shell.idOf__Request_Next(asked_Host.source)
    shell.references.set(
      id,
      asked_Host.reference
    )
    shell.tasks.handle({
      kind: "REQUEST",
      id_Task: task.id,
      request: {
        id,
        notes,
        aim: aimOf__Reference({
          kind: "PROPOSAL",
          reference: asked_Host.reference,
          path: asked_Host.source
        })
      },
      stamp: stampOf({
        by: "HUMAN"
      })
    })
  } else {
    shell.tasks.handle({
      kind: "DECIDE",
      id_Task: task.id,
      id_Proposal: asked_Host.source,
      decision: stateAfter
    })
  }
  return true
}

function REQUEST_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"REQUEST">): boolean {
  const id = shell.idOf__Request_Next("document")
  shell.references.set(
    id,
    asked_Host.aim.reference
  )
  shell.requested({
    id,
    notes: asked_Host.notes,
    aim: aimOf__Reference({
      kind: asked_Host.aim.kind,
      reference: asked_Host.aim.reference,
      path: shell.name_Document
    }),
    isStarting: asked_Host.isStarting
  })
  return true
}

function EDIT_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"EDIT">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return true
  shell.tasks.handle({
    kind: "EDIT",
    id_Task: task.id,
    id_Request: asked_Host.id,
    notes: asked_Host.notes
  })
  return true
}

function REMOVE_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"REMOVE">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return true
  shell.tasks.handle({
    kind: "REMOVE",
    id_Task: task.id,
    id_Request: asked_Host.id
  })
  return true
}

function DISMISS_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"DISMISS">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return true
  shell.tasks.handle({
    kind: "DISMISS",
    id_Task: task.id,
    id_Request: asked_Host.id
  })
  return true
}

function START_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"START">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return true
  shell.started({
    id_Task: task.id,
    scope_Work: asked_Host.scope
  })
  return true
}

function STOP_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"STOP">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return true
  shell.stopped({
    id_Task: task.id,
    scope_Work: asked_Host.scope
  })
  return true
}

function TASK_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"TASK">): boolean {
  const command = asked_Host.command
  const task = shell.taskIn()
  if (command === "accept-here") {
    shell.acceptedIn([shell.name_Document])
  } else if (command === "accept-task") {
    shell.acceptedIn(task === undefined ? [] : [...new Set(task.proposals.map((proposal) => proposal.path))])
  } else if (command.startsWith("accept-in:")) {
    shell.acceptedIn([command.slice("accept-in:".length)])
  }
  return true
}

function END_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"END">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return true
  shell.ended({
    id_Task: task.id,
    kind_End: asked_Host.end
  })
  return true
}

function SWITCH_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"SWITCH">): boolean {
  shell.target_Mode = asked_Host.target
  return true
}

function OPEN_FILE__handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"OPEN_FILE">): boolean {
  for (const observer of shell.observers) observer.opening(asked_Host.path)
  return true
}

function SHOW_BOARD__handle__Asked_Host({}: _Api___handle__Asked_Host_<"SHOW_BOARD">): boolean {
  return true
}

function RERUN_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"RERUN">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return false
  const requests_Again = shell.requestsOf__Rerun({
    id_Task: task.id,
    source: asked_Host.source
  })
  for (const request_Again of requests_Again) {
    const id = shell.idOf__Request_Next(asked_Host.source)
    shell.references.set(
      id,
      request_Again.reference
    )
    shell.tasks.handle({
      kind: "REQUEST",
      id_Task: task.id,
      request: {
        id,
        notes: request_Again.notes,
        aim: aimOf__Reference({
          kind: "PROPOSAL",
          reference: request_Again.reference,
          path: asked_Host.source
        })
      },
      stamp: stampOf({
        by: "HUMAN"
      })
    })
  }
  shell.started({
    id_Task: task.id,
    scope_Work: {
      kind: "PROPOSAL",
      source: asked_Host.source
    }
  })
  return true
}

function SETTLE_handle__Asked_Host({
  shell,
  asked_Host
}: _Api___handle__Asked_Host_<"SETTLE">): boolean {
  const task = shell.taskIn()
  if (task === undefined) return false
  shell.restated({
    id_Task: task.id,
    change: (head) => settledOf__Head({
      document: shell.documentOf(),
      head,
      source: asked_Host.source,
      way: asked_Host.way
    })
  })
  return true
}

interface _Api___handle__Asked_Board_<Kind extends _Asked_Board_["kind"]> {
  shell: _Shell_
  asked_Board: Extract<
    _Asked_Board_,
    __BASE_Asked_Board_<Kind>
  >
}

function handle__Asked_Board<Kind extends _Asked_Board_["kind"]>({
  shell,
  asked_Board
}: _Api___handle__Asked_Board_<Kind>): boolean {
  const handle = HANDLERMAP__ASKED_BOARD[asked_Board.kind]
  return handle({
    shell,
    asked_Board
  })
}

type _HandlerMap__Asked_Board_ = {
  [Kind in _Asked_Board_["kind"]]: (api_Handler: _Api___handle__Asked_Board_<Kind>) => boolean
}

const HANDLERMAP__ASKED_BOARD: _HandlerMap__Asked_Board_ = {
  SWITCH: SWITCH_handle__Asked_Board,
  START: START_handle__Asked_Board,
  STOP: STOP_handle__Asked_Board,
  APPLY: END_handle__Asked_Board,
  CANCEL: END_handle__Asked_Board,
  DISCARD: END_handle__Asked_Board,
  COLLECT: COLLECT_handle__Asked_Board,
  NEW_TASK: NEW_TASK__handle__Asked_Board
}

function SWITCH_handle__Asked_Board({
  shell,
  asked_Board
}: _Api___handle__Asked_Board_<"SWITCH">): boolean {
  shell.target_Mode = {
    kind: "TASK",
    id: asked_Board.id
  }
  return true
}

function START_handle__Asked_Board({
  shell,
  asked_Board
}: _Api___handle__Asked_Board_<"START">): boolean {
  shell.started({
    id_Task: asked_Board.id,
    scope_Work: {
      kind: "TASK"
    }
  })
  return true
}

function STOP_handle__Asked_Board({
  shell,
  asked_Board
}: _Api___handle__Asked_Board_<"STOP">): boolean {
  shell.stopped({
    id_Task: asked_Board.id,
    scope_Work: {
      kind: "TASK"
    }
  })
  return true
}

type _Api___END_handle__Asked_Board_ = _Api___handle__Asked_Board_<"APPLY"> | _Api___handle__Asked_Board_<"CANCEL"> | _Api___handle__Asked_Board_<"DISCARD">

function END_handle__Asked_Board({
  shell,
  asked_Board
}: _Api___END_handle__Asked_Board_): boolean {
  shell.ended({
    id_Task: asked_Board.id,
    kind_End: asked_Board.kind
  })
  return true
}

function COLLECT_handle__Asked_Board({
  shell,
  asked_Board
}: _Api___handle__Asked_Board_<"COLLECT">): boolean {
  shell.tasks.handle({
    kind: "COLLECT",
    ids_Task: asked_Board.ids
  })
  return true
}

function NEW_TASK__handle__Asked_Board({}: _Api___handle__Asked_Board_<"NEW_TASK">): boolean {
  return true
}

interface _Api___keyIn__Task_ {
  id_Task: string
  id: string
}

function keyIn__Task({
  id_Task,
  id
}: _Api___keyIn__Task_): string {
  return `${id_Task}\n${id}`
}

interface _Api___idsOf__Started_ {
  task: _Task_Tasks_ | undefined
}

function idsOf__Started({
  task
}: _Api___idsOf__Started_): Array<string> {
  return (task?.requests ?? []).flatMap((request) => request.status.kind === "WITH_AGENT" ? [request.id] : [])
}

interface _Api___stampOf_ {
  by: _Author_Tasks_
}

function stampOf({
  by
}: _Api___stampOf_): _Stamp_Tasks_ {
  return {
    at: new Date().toISOString(),
    by
  }
}

interface _Api___idOf__Task_Next_ {
  tasks: Array<_Task_Tasks_>
}

function idOf__Task_Next({
  tasks
}: _Api___idOf__Task_Next_): string {
  const numbers = tasks.map((task) => Number(task.id.replace(/^T-/, ""))).filter((number) => Number.isInteger(number))
  return `T-${Math.max(0, ...numbers) + 1}`
}

interface _Api___aimOf__Reference_ {
  kind: "TASK" | "DOCUMENT" | "PROPOSAL"
  reference: _Selected_Text_ | null
  path: string
}

function aimOf__Reference({
  kind,
  reference,
  path
}: _Api___aimOf__Reference_): _Aim_Request_Tasks_ {
  const words = wordsOf__Reference({
    reference
  })
  return kind === "TASK"
    ? {
      kind: "TASK",
      words
    }
    : kind === "DOCUMENT"
      ? {
        kind: "DOCUMENT",
        path,
        words
      }
      : {
        kind: "PROPOSAL",
        id_Proposal: path,
        words
      }
}

interface _Api___wordsOf__Reference_ {
  reference: _Selected_Text_ | null
}

function wordsOf__Reference({
  reference
}: _Api___wordsOf__Reference_): _Words_Aim_ {
  return reference === null
    ? {
      kind: "ALL"
    }
    : {
      kind: "QUOTED",
      text: reference.text
    }
}
