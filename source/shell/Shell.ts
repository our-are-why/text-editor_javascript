import {
  isOwn__Source,
  type _Tasks_,
  type _Task_Tasks_,
  type _Model_Tasks_,
  type _Request_Tasks_,
  type _Aim_Request_Tasks_,
  type _Scope_Tasks_,
  type _Proposal_Tasks_,
  type _Decision_Proposal_Tasks_,
  type _Command_Tasks_,
  type _Stamp_Tasks_,
  type _Author_Tasks_
} from "../tasks/index.ts"
import {
  carriedOf__Head,
  checkedOf__Head,
  settledOf__Head,
  type _Documents_,
  type _Document_Documents_,
  type _Head_Document_,
  type _Changes_Source_,
  type _Text_Model_,
  type _Transaction_Model_,
  type _Way_Settle_
} from "../documents/index.ts"

export {
  _Shell_,
  type _Api__Shell_,
  type _Observer_Shell_,
  type _State_Shell_,
  type _Document_Shell_,
  type _Dismissed_Task_,
  type _Round_Shell_,
  type _Stop_Shell_,
  type _Base_Round_,
  type _Again_Request_,
  type _Landing_Round_,
  type _Answer_Landing_,
  type _Api___headOf__Shell_,
  type _Api___requestsOf__Rerun__Shell_,
  type _Api___restated__Shell_,
  type _Api___carried__Shell_,
  type _Api___landedOn__Shell_,
  type _Api___freshened__Shell_,
  type _Api___started__Shell_,
  type _Api___stopped__Shell_,
  type _Api___accepted__Shell_,
  type _Api___ended__Shell_,
  handle__Command_Shell,
  type _Api___handle__Command_Shell_,
  type _Command_Shell_,
  type __BASE_Command_Shell_,
  type _OPEN_DOCUMENT__Command_Shell_,
  type _EDIT_Command_Shell_,
  type _Mode_Edit_,
  type __BASE_Mode_Edit_,
  type _MANUAL_Mode_Edit_,
  type _TASK_Mode_Edit_,
  type _REQUEST_Command_Shell_,
  type _Request_Made_,
  type _DRAFT_Command_Shell_,
  type _START_Command_Shell_,
  type _STOP_Command_Shell_,
  type _TASKS_Command_Shell_,
  type _DECIDE_Command_Shell_,
  type _DISMISS_PROPOSAL__Command_Shell_,
  type _ACCEPT_Command_Shell_,
  type _SETTLE_Command_Shell_,
  type _END_Command_Shell_,
  type _Kind_End_,
  type _RERUN_Command_Shell_,
  type _HandlerMap__Shell_,
  HANDLERMAP__SHELL,
  waitingOf__Task,
  type _Api___waitingOf__Task_,
  isAsked__Proposal,
  type _Api___isAsked__Proposal_,
  keyIn__Task,
  type _Api___keyIn__Task_,
  idsOf__Started,
  type _Api___idsOf__Started_,
  stampOf,
  type _Api___stampOf_,
  idOf__Task_Next,
  type _Api___idOf__Task_Next_
}

class _Shell_ {
  tasks: _Tasks_
  documents: _Documents_
  dismissed: Map<string, Set<string>>
  bases_Round: Map<string, _Base_Round_>
  rounds_Request: Map<string, number>
  count_Round: number
  count_Request: number
  observers: Array<_Observer_Shell_>

  constructor({
    tasks,
    documents,
    observers
  }: _Api__Shell_) {
    this.tasks = tasks
    this.documents = documents
    this.dismissed = new Map()
    this.bases_Round = new Map()
    this.rounds_Request = new Map()
    this.count_Round = 0
    this.count_Request = 0
    this.observers = observers
  }

  handle(
    command_Shell: _Command_Shell_
  ): void {
    const model_Tasks = this.tasks.model_Tasks
    const model_Documents = this.documents.model_Documents
    const json_Dismissed = JSON.stringify(this.stateOf__Dismissed())
    handle__Command_Shell({
      shell: this,
      command_Shell
    })
    const isChanged = this.tasks.model_Tasks !== model_Tasks || this.documents.model_Documents !== model_Documents || JSON.stringify(this.stateOf__Dismissed()) !== json_Dismissed
    if (isChanged) this.changed()
  }

  state(): _State_Shell_ {
    return {
      model_Tasks: this.tasks.model_Tasks,
      documents: this.documents.model_Documents.documents.map((document) => ({
        path: document.path,
        version: document.version,
        text: document.text
      })),
      dismissed: this.stateOf__Dismissed()
    }
  }

  stateOf__Dismissed(): Array<_Dismissed_Task_> {
    return [...this.dismissed].map(([
      id_Task,
      sources
    ]) => ({
      id_Task,
      sources: [...sources]
    }))
  }

  changed(): void {
    this.released()
    const state_Shell = this.state()
    for (const observer of this.observers) observer.changed(state_Shell)
  }

  taskOf(
    id_Task: string
  ): _Task_Tasks_ | undefined {
    return this.tasks.model_Tasks.tasks.find((task) => task.id === id_Task)
  }

  headOf({
    task,
    path
  }: _Api___headOf__Shell_): _Head_Document_ | undefined {
    return task.heads.find((head) => head.path === path)
  }

  documentOf(
    path: string
  ): _Document_Documents_ {
    const document = this.documents.model_Documents.documents.find((document_Each) => document_Each.path === path)
    if (document === undefined) throw new Error(`${path} isn't kept`)
    return document
  }

  isKept(
    path: string
  ): boolean {
    return this.documents.model_Documents.documents.some((document) => document.path === path)
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
    const sources_Landing = round_Shell.sources.filter((source) => idsOf(source).length > 0 && landing_Round.proposed.some((changes_Source) => changes_Source.source === source))
    const ids_Addressed = round_Shell.requests.flatMap((request) => ids_Current.includes(request.id) && !(request.aim.kind === "PROPOSAL" && sources_Landing.includes(request.aim.id_Proposal)) ? [request.id] : [])
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
        path: round_Shell.path,
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
          note: landing_Round.note
        }
      })
    }
    this.changed()
    return {
      sources: sources_Landing,
      ids_Addressed
    }
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
          aim: {
            kind: "PROPOSAL",
            id_Proposal: source,
            words: {
              kind: "ALL"
            }
          }
        }
      ]
  }

  idOf__Request_Next(
    prefix: string
  ): string {
    this.count_Request += 1
    return `${prefix}-again-${this.count_Request}`
  }

  restated({
    id_Task,
    path,
    change
  }: _Api___restated__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined) return
    this.tasks.handle({
      kind: "RESTATE",
      id_Task,
      head: change(this.headOf({
        task,
        path
      }) ?? {
        path,
        version: this.documentOf(path).version,
        proposed: [],
        stale: []
      })
    })
  }

  carried({
    path,
    ids_Except
  }: _Api___carried__Shell_): void {
    const document = this.documentOf(path)
    for (const task of this.tasks.model_Tasks.tasks) {
      const head = this.headOf({
        task,
        path
      })
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
    for (const document of this.documents.model_Documents.documents) {
      const versions = [...this.bases_Round.values()].flatMap((base_Round) => {
        const isRunning = (this.taskOf(base_Round.id_Task)?.requests ?? []).some((request) => request.status.kind === "WITH_AGENT" && request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === base_Round.source)
        return isRunning && base_Round.path === document.path ? [base_Round.version] : []
      })
      this.documents.handle({
        kind: "RELEASE",
        path: document.path,
        versions
      })
    }
  }

  landedOn({
    id_Task,
    source,
    path,
    version,
    proposed
  }: _Api___landedOn__Shell_): void {
    const head_Round = carriedOf__Head({
      document: this.documentOf(path),
      head: {
        path,
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
      path,
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
    const task = this.taskOf(id_Task)
    for (const head of task?.heads ?? []) {
      if (!head.stale.some((stale_Source) => sources.includes(stale_Source.source))) continue
      this.restated({
        id_Task,
        path: head.path,
        change: (head_Each) => ({
          ...head_Each,
          stale: head_Each.stale.filter((stale_Source) => !sources.includes(stale_Source.source))
        })
      })
    }
  }

  started({
    id_Task,
    scope,
    path
  }: _Api___started__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined || task.kind !== "OPEN") return
    const ids_Before = idsOf__Started({
      task
    })
    this.tasks.handle({
      kind: "START",
      id_Task,
      scope,
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
      scope,
      requests: requests_Started,
      sources,
      path,
      version: this.documentOf(path).version,
      proposed: (this.headOf({
        task,
        path
      })?.proposed ?? []).filter((changes_Source) => sources.includes(changes_Source.source))
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
          path,
          version: round_Shell.version,
          requests: requests_Started.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === source
            ? [
              {
                notes: request.notes,
                aim: request.aim
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
    scope
  }: _Api___stopped__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined) return
    const ids_Before = idsOf__Started({
      task
    })
    this.tasks.handle({
      kind: "STOP",
      id_Task,
      scope
    })
    const roundOf = (id: string) => this.rounds_Request.get(keyIn__Task({
      id_Task,
      id
    }))
    const ids_Round = [
      ...new Set(ids_Before.flatMap((id) => {
        const id_Round = roundOf(id)
        return idsOf__Started({
          task: this.taskOf(id_Task)
        }).includes(id) || id_Round === undefined ? [] : [id_Round]
      }))
    ]
    const ids_Rest = idsOf__Started({
      task: this.taskOf(id_Task)
    }).filter((id) => ids_Round.some((id_Round) => id_Round === roundOf(id)))
    if (ids_Rest.length > 0) {
      this.tasks.handle({
        kind: "STOP",
        id_Task,
        scope: {
          kind: "REQUESTS",
          ids_Request: ids_Rest
        }
      })
    }
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
        scope,
        ids_Request: ids_Stopped,
        ids_Round
      })
    }
  }

  accepted({
    id_Task,
    paths
  }: _Api___accepted__Shell_): void {
    const task = this.taskOf(id_Task)
    if (task === undefined) return
    const sources_Accepted = paths.flatMap((path) => waitingOf__Task({
      task,
      path
    }).map((proposal) => proposal.id))
    for (const id_Proposal of sources_Accepted) {
      this.tasks.handle({
        kind: "DECIDE",
        id_Task,
        id_Proposal,
        decision: "ACCEPTED"
      })
    }
    this.freshened({
      id_Task,
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
    if (task === undefined || task.kind !== "RESOLVED" || task.resolution.how !== "APPLIED") return
    for (const head of task.heads) {
      if (!this.isKept(head.path)) continue
      this.documents.handle({
        kind: "APPLY",
        path: head.path,
        version: head.version,
        proposed: head.proposed,
        sources: head.proposed.flatMap((changes_Source) => isOwn__Source({
          task,
          source: changes_Source.source
        })
          ? [changes_Source.source]
          : [])
      })
      this.carried({
        path: head.path,
        ids_Except: [id_Task]
      })
    }
  }
}

interface _Api__Shell_ {
  tasks: _Tasks_
  documents: _Documents_
  observers: Array<_Observer_Shell_>
}

interface _Observer_Shell_ {
  changed: (state_Shell: _State_Shell_) => void
  started: (round_Shell: _Round_Shell_) => void
  stopped: (stop_Shell: _Stop_Shell_) => void
}

interface _State_Shell_ {
  model_Tasks: _Model_Tasks_
  documents: Array<_Document_Shell_>
  dismissed: Array<_Dismissed_Task_>
}

interface _Document_Shell_ {
  path: string
  version: string
  text: _Text_Model_
}

interface _Dismissed_Task_ {
  id_Task: string
  sources: Array<string>
}

interface _Round_Shell_ {
  id: number
  id_Task: string
  scope: _Scope_Tasks_
  requests: Array<_Request_Tasks_>
  sources: Array<string>
  path: string
  version: string
  proposed: Array<_Changes_Source_>
}

interface _Stop_Shell_ {
  id_Task: string
  scope: _Scope_Tasks_
  ids_Request: Array<string>
  ids_Round: Array<number>
}

interface _Base_Round_ {
  id_Task: string
  source: string
  path: string
  version: string
  requests: Array<_Again_Request_>
}

interface _Again_Request_ {
  notes: string
  aim: _Aim_Request_Tasks_
}

interface _Landing_Round_ {
  round_Shell: _Round_Shell_
  proposed: Array<_Changes_Source_>
  note: string
}

interface _Answer_Landing_ {
  sources: Array<string>
  ids_Addressed: Array<string>
}

interface _Api___headOf__Shell_ {
  task: _Task_Tasks_
  path: string
}

interface _Api___requestsOf__Rerun__Shell_ {
  id_Task: string
  source: string
}

interface _Api___restated__Shell_ {
  id_Task: string
  path: string
  change: (head: _Head_Document_) => _Head_Document_
}

interface _Api___carried__Shell_ {
  path: string
  ids_Except: Array<string>
}

interface _Api___landedOn__Shell_ {
  id_Task: string
  source: string
  path: string
  version: string
  proposed: Array<_Changes_Source_>
}

interface _Api___freshened__Shell_ {
  id_Task: string
  sources: Array<string>
}

interface _Api___started__Shell_ {
  id_Task: string
  scope: _Scope_Tasks_
  path: string
}

interface _Api___stopped__Shell_ {
  id_Task: string
  scope: _Scope_Tasks_
}

interface _Api___accepted__Shell_ {
  id_Task: string
  paths: Array<string>
}

interface _Api___ended__Shell_ {
  id_Task: string
  kind_End: _Kind_End_
}

interface _Api___handle__Command_Shell_<Kind extends _Command_Shell_["kind"]> {
  shell: _Shell_
  command_Shell: Extract<
    _Command_Shell_,
    __BASE_Command_Shell_<Kind>
  >
}

function handle__Command_Shell<Kind extends _Command_Shell_["kind"]>({
  shell,
  command_Shell
}: _Api___handle__Command_Shell_<Kind>): void {
  const handle = HANDLERMAP__SHELL[command_Shell.kind]
  handle({
    shell,
    command_Shell
  })
}

type _Command_Shell_ = _OPEN_DOCUMENT__Command_Shell_ | _EDIT_Command_Shell_ | _REQUEST_Command_Shell_ | _DRAFT_Command_Shell_ | _START_Command_Shell_ | _STOP_Command_Shell_ | _TASKS_Command_Shell_ | _DECIDE_Command_Shell_ | _DISMISS_PROPOSAL__Command_Shell_ | _ACCEPT_Command_Shell_ | _SETTLE_Command_Shell_ | _END_Command_Shell_ | _RERUN_Command_Shell_

interface __BASE_Command_Shell_<Kind extends string> {
  kind: Kind
}

interface _OPEN_DOCUMENT__Command_Shell_ extends __BASE_Command_Shell_<"OPEN_DOCUMENT"> {
  path: string
  text: _Text_Model_
}

interface _EDIT_Command_Shell_ extends __BASE_Command_Shell_<"EDIT"> {
  path: string
  transaction: _Transaction_Model_
  mode: _Mode_Edit_
}

type _Mode_Edit_ = _MANUAL_Mode_Edit_ | _TASK_Mode_Edit_

interface __BASE_Mode_Edit_<Kind extends string> {
  kind: Kind
}

interface _MANUAL_Mode_Edit_ extends __BASE_Mode_Edit_<"MANUAL"> {}

interface _TASK_Mode_Edit_ extends __BASE_Mode_Edit_<"TASK"> {
  id_Task: string
  proposed: Array<_Changes_Source_>
}

interface _REQUEST_Command_Shell_ extends __BASE_Command_Shell_<"REQUEST"> {
  id_Task: string
  request: _Request_Made_
  isStarting: boolean
  path: string
}

interface _Request_Made_ {
  id: string
  notes: string
  aim: _Aim_Request_Tasks_
}

interface _DRAFT_Command_Shell_ extends __BASE_Command_Shell_<"DRAFT"> {
  request: _Request_Made_
  isStarting: boolean
  path: string
}

interface _START_Command_Shell_ extends __BASE_Command_Shell_<"START"> {
  id_Task: string
  scope: _Scope_Tasks_
  path: string
}

interface _STOP_Command_Shell_ extends __BASE_Command_Shell_<"STOP"> {
  id_Task: string
  scope: _Scope_Tasks_
}

interface _TASKS_Command_Shell_ extends __BASE_Command_Shell_<"TASKS"> {
  command_Tasks: _Command_Tasks_
}

interface _DECIDE_Command_Shell_ extends __BASE_Command_Shell_<"DECIDE"> {
  id_Task: string
  id_Proposal: string
  decision: _Decision_Proposal_Tasks_
}

interface _DISMISS_PROPOSAL__Command_Shell_ extends __BASE_Command_Shell_<"DISMISS_PROPOSAL"> {
  id_Task: string
  id_Proposal: string
}

interface _ACCEPT_Command_Shell_ extends __BASE_Command_Shell_<"ACCEPT"> {
  id_Task: string
  paths: Array<string>
}

interface _SETTLE_Command_Shell_ extends __BASE_Command_Shell_<"SETTLE"> {
  id_Task: string
  path: string
  source: string
  way: _Way_Settle_
}

interface _END_Command_Shell_ extends __BASE_Command_Shell_<"END"> {
  id_Task: string
  kind_End: _Kind_End_
}

type _Kind_End_ = "APPLY" | "CANCEL" | "DISCARD"

interface _RERUN_Command_Shell_ extends __BASE_Command_Shell_<"RERUN"> {
  id_Task: string
  id_Proposal: string
  path: string
}

type _HandlerMap__Shell_ = {
  [Kind in _Command_Shell_["kind"]]: (api_Handler: _Api___handle__Command_Shell_<Kind>) => void
}

const HANDLERMAP__SHELL: _HandlerMap__Shell_ = {
  OPEN_DOCUMENT: ({
    shell,
    command_Shell
  }) => {
    if (shell.isKept(command_Shell.path)) return
    shell.documents.handle({
      kind: "OPEN",
      path: command_Shell.path,
      text: command_Shell.text
    })
  },
  EDIT: ({
    shell,
    command_Shell
  }) => {
    const path = command_Shell.path
    const mode = command_Shell.mode
    if (!shell.isKept(path)) return
    shell.documents.handle({
      kind: "EDIT",
      path,
      version: shell.documentOf(path).version,
      transaction: command_Shell.transaction
    })
    if (mode.kind === "TASK") {
      shell.restated({
        id_Task: mode.id_Task,
        path,
        change: (head) => checkedOf__Head({
          document: shell.documentOf(path),
          head: {
            ...head,
            version: shell.documentOf(path).version,
            proposed: mode.proposed
          }
        })
      })
    }
    shell.carried({
      path,
      ids_Except: mode.kind === "TASK" ? [mode.id_Task] : []
    })
  },
  REQUEST: ({
    shell,
    command_Shell
  }) => {
    shell.tasks.handle({
      kind: "REQUEST",
      id_Task: command_Shell.id_Task,
      request: command_Shell.request,
      stamp: stampOf({
        by: "HUMAN"
      })
    })
    if (!command_Shell.isStarting) return
    shell.started({
      id_Task: command_Shell.id_Task,
      scope: {
        kind: "REQUESTS",
        ids_Request: [command_Shell.request.id]
      },
      path: command_Shell.path
    })
  },
  DRAFT: ({
    shell,
    command_Shell
  }) => {
    const id_Task = idOf__Task_Next({
      tasks: shell.tasks.model_Tasks.tasks
    })
    shell.tasks.handle({
      kind: "DRAFT",
      id_Task,
      name: command_Shell.request.notes,
      request: command_Shell.request,
      stamp: stampOf({
        by: "HUMAN"
      })
    })
    if (!command_Shell.isStarting) return
    shell.started({
      id_Task,
      scope: {
        kind: "REQUESTS",
        ids_Request: [command_Shell.request.id]
      },
      path: command_Shell.path
    })
  },
  START: ({
    shell,
    command_Shell
  }) => shell.started({
    id_Task: command_Shell.id_Task,
    scope: command_Shell.scope,
    path: command_Shell.path
  }),
  STOP: ({
    shell,
    command_Shell
  }) => shell.stopped({
    id_Task: command_Shell.id_Task,
    scope: command_Shell.scope
  }),
  TASKS: ({
    shell,
    command_Shell
  }) => shell.tasks.handle(command_Shell.command_Tasks),
  DECIDE: ({
    shell,
    command_Shell
  }) => {
    shell.freshened({
      id_Task: command_Shell.id_Task,
      sources: [command_Shell.id_Proposal]
    })
    shell.tasks.handle({
      kind: "DECIDE",
      id_Task: command_Shell.id_Task,
      id_Proposal: command_Shell.id_Proposal,
      decision: command_Shell.decision
    })
  },
  DISMISS_PROPOSAL: ({
    shell,
    command_Shell
  }) => {
    const task = shell.taskOf(command_Shell.id_Task)
    const proposal = task?.proposals.find((proposal_Each) => proposal_Each.id === command_Shell.id_Proposal)
    if (proposal === undefined) return
    shell.freshened({
      id_Task: command_Shell.id_Task,
      sources: [command_Shell.id_Proposal]
    })
    shell.restated({
      id_Task: command_Shell.id_Task,
      path: proposal.path,
      change: (head) => ({
        ...head,
        proposed: head.proposed.filter((changes_Source) => changes_Source.source !== command_Shell.id_Proposal)
      })
    })
    shell.dismissed.set(
      command_Shell.id_Task,
      new Set([
        ...shell.dismissed.get(command_Shell.id_Task) ?? [],
        command_Shell.id_Proposal
      ])
    )
  },
  ACCEPT: ({
    shell,
    command_Shell
  }) => shell.accepted({
    id_Task: command_Shell.id_Task,
    paths: command_Shell.paths
  }),
  SETTLE: ({
    shell,
    command_Shell
  }) => shell.restated({
    id_Task: command_Shell.id_Task,
    path: command_Shell.path,
    change: (head) => settledOf__Head({
      document: shell.documentOf(command_Shell.path),
      head,
      source: command_Shell.source,
      way: command_Shell.way
    })
  }),
  END: ({
    shell,
    command_Shell
  }) => shell.ended({
    id_Task: command_Shell.id_Task,
    kind_End: command_Shell.kind_End
  }),
  RERUN: ({
    shell,
    command_Shell
  }) => {
    for (const request_Again of shell.requestsOf__Rerun({
      id_Task: command_Shell.id_Task,
      source: command_Shell.id_Proposal
    })) {
      shell.tasks.handle({
        kind: "REQUEST",
        id_Task: command_Shell.id_Task,
        request: {
          id: shell.idOf__Request_Next(command_Shell.id_Proposal),
          notes: request_Again.notes,
          aim: request_Again.aim
        },
        stamp: stampOf({
          by: "HUMAN"
        })
      })
    }
    shell.started({
      id_Task: command_Shell.id_Task,
      scope: {
        kind: "PROPOSALS",
        ids_Proposal: [command_Shell.id_Proposal]
      },
      path: command_Shell.path
    })
  }
}

interface _Api___waitingOf__Task_ {
  task: _Task_Tasks_
  path: string
}

function waitingOf__Task({
  task,
  path
}: _Api___waitingOf__Task_): Array<_Proposal_Tasks_> {
  return task.proposals.filter((proposal) => proposal.path === path && proposal.decision === "OPEN" && !isAsked__Proposal({
    task,
    proposal
  }))
}

interface _Api___isAsked__Proposal_ {
  task: _Task_Tasks_
  proposal: _Proposal_Tasks_
}

function isAsked__Proposal({
  task,
  proposal
}: _Api___isAsked__Proposal_): boolean {
  return task.requests.some((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === proposal.id && request.status.kind !== "ADDRESSED")
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
