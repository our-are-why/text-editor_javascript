import {
  isOwn__Source,
  pathsOf__Task,
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
  textWith__Sources,
  flatOf__Text,
  refusalsIn__Source,
  refusalsAcross__Sources,
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
import {
  jobsAfter__Command,
  jobOf__Request,
  isLive__Job,
  type _Job_Shell_,
  type _Given_Job_,
  type _Command_Jobs_
} from "./Jobs_Shell.ts"
import type { _Landing_Handed_ } from "./Copy_Shell.ts"

export {
  _Shell_,
  type _Api__Shell_,
  type _Observer_Shell_,
  type _State_Shell_,
  type _Document_Shell_,
  type _Dismissed_Task_,
  type _Stop_Shell_,
  type _Landing_Job_,
  type _Base_Round_,
  type _Again_Request_,
  type _Api___headOf__Shell_,
  type _Api___landed__Shell_,
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
  type _TAKE_Command_Shell_,
  type _CHECK_IN__Command_Shell_,
  type _HAND_BACK__Command_Shell_,
  type _HandlerMap__Shell_,
  HANDLERMAP__SHELL,
  isPresentWith__Sources,
  type _Api___isPresentWith__Sources_,
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
  jobs: Array<_Job_Shell_>
  count_Job: number
  bases_Round: Map<string, _Base_Round_>
  count_Request: number
  observers: Array<_Observer_Shell_>

  constructor({
    tasks,
    documents,
    jobs,
    observers
  }: _Api__Shell_) {
    this.tasks = tasks
    this.documents = documents
    this.dismissed = new Map()
    this.jobs = jobs
    this.count_Job = 0
    this.bases_Round = new Map()
    this.count_Request = 0
    this.observers = observers
  }

  handle(
    command_Shell: _Command_Shell_
  ): void {
    const model_Tasks = this.tasks.model_Tasks
    const model_Documents = this.documents.model_Documents
    const json_Dismissed = JSON.stringify(this.stateOf__Dismissed())
    const jobs = this.jobs
    handle__Command_Shell({
      shell: this,
      command_Shell
    })
    this.dropped()
    const isChanged = this.tasks.model_Tasks !== model_Tasks || this.documents.model_Documents !== model_Documents || JSON.stringify(this.stateOf__Dismissed()) !== json_Dismissed || this.jobs !== jobs
    if (isChanged) this.changed()
  }

  state(): _State_Shell_ {
    return {
      model_Tasks: this.tasks.model_Tasks,
      documents: this.documents.model_Documents.documents.map((document) => ({
        path: document.path,
        version: document.version,
        text: document.text,
        isPresent: document.isPresent
      })),
      dismissed: this.stateOf__Dismissed(),
      jobs: this.jobs
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

  jobOf(
    id_Job: string
  ): _Job_Shell_ | undefined {
    return this.jobs.find((job) => job.id === id_Job)
  }

  clashesOf({
    id_Task,
    landing
  }: _Api___clashesOf__Shell_): Array<string> {
    const task = this.taskOf(id_Task)
    if (task === undefined) return []
    const carrieds = landing.proposals.flatMap((proposal) => this.isKept(proposal.path)
      ? carriedOf__Head({
        document: this.documentOf(proposal.path),
        head: {
          path: proposal.path,
          version: proposal.version,
          proposed: [
            {
              source: proposal.id,
              changes: proposal.changes
            }
          ],
          stale: []
        }
      }).proposed.map((changes_Source) => ({
        proposal,
        changes_Source
      }))
      : [])
    return [...new Set(carrieds.map((carried) => carried.proposal.path))].flatMap((path) => {
      const head = this.headOf({
        task,
        path
      })
      const carrieds_Path = carrieds.filter((carried) => carried.proposal.path === path)
      const ids_Landing = carrieds_Path.map((carried) => carried.proposal.id)
      const proposed_Task = head === undefined
        ? []
        : carriedOf__Head({
          document: this.documentOf(path),
          head
        }).proposed.filter((changes_Source) => !ids_Landing.includes(changes_Source.source))
      const refusals_Before = new Set(refusalsAcross__Sources(proposed_Task).map((refusal) => JSON.stringify(refusal)))
      return [
        ...carrieds_Path.flatMap((carried) => refusalsIn__Source({
          document: this.documentOf(path).text,
          changes_Source: carried.changes_Source
        })),
        ...refusalsAcross__Sources([
          ...proposed_Task,
          ...carrieds_Path.map((carried) => carried.changes_Source)
        ])
      ]
        .filter((refusal) => !refusals_Before.has(JSON.stringify(refusal)))
        .map((refusal) => {
          const isIn = (source: string) => source === refusal.source || refusal.reason.includes(`${source}'s`)
          const carried = carrieds_Path.find((each) => isIn(each.proposal.id))
          const source_Other = proposed_Task.find((changes_Source) => isIn(changes_Source.source))?.source
          const proposal_Other = task.proposals.find((proposal) => proposal.id === source_Other)
          const name_Other = source_Other === undefined
            ? "another of its own changes"
            : proposal_Other === undefined
              ? "the person's own edits"
              : `proposal "${proposal_Other.title}"`
          return `${carried === undefined ? "a proposal" : `proposal "${carried.proposal.title}"`} can't be drawn with ${name_Other} on ${path}: one of its changes shares the span of one of theirs, or crosses its edge; a change has to take in another's whole span, or stay apart from it`
        })
    })
  }

  givensOf(
    job_Shell: _Job_Shell_
  ): Array<_Given_Job_> {
    const task = this.taskOf(job_Shell.id_Task)
    if (task === undefined) return []
    const paths = [
      ...new Set([
        job_Shell.path,
        ...pathsOf__Task({
          task
        })
      ])
    ].filter((path) => this.isKept(path))
    return paths.map((path) => {
      const document = this.documentOf(path)
      const head = this.headOf({
        task,
        path
      })
      const proposed = head === undefined
        ? []
        : carriedOf__Head({
          document,
          head
        }).proposed
      const sources = proposed.flatMap((changes_Source) => isOwn__Source({
        task,
        source: changes_Source.source
      }) || job_Shell.sources.includes(changes_Source.source)
        ? [changes_Source.source]
        : [])
      const text = textWith__Sources({
        model_TextEditor: {
          document: document.text,
          proposed
        },
        sources
      })
      return {
        path,
        version: document.version,
        text_Document: document.text,
        proposed,
        sources,
        text,
        isPresent: isPresentWith__Sources({
          task,
          document,
          sources,
          text
        })
      }
    })
  }

  jobsHandled(
    command_Jobs: _Command_Jobs_
  ): void {
    this.jobs = jobsAfter__Command({
      jobs: this.jobs,
      command: command_Jobs
    })
  }

  landed({
    job_Shell,
    landing,
    note
  }: _Api___landed__Shell_): _Landing_Job_ {
    const id_Task = job_Shell.id_Task
    const isCurrent = (id: string) => jobOf__Request({
      jobs: this.jobs,
      id_Task,
      id_Request: id
    })?.id === job_Shell.id && idsOf__Started({
      task: this.taskOf(id_Task)
    }).includes(id)
    const ids_Current = job_Shell.requests.flatMap((request) => isCurrent(request.id) ? [request.id] : [])
    for (const proposal of landing.proposals) {
      this.tasks.handle({
        kind: "PROPOSE",
        id_Task,
        proposal: {
          id: proposal.id,
          path: proposal.path,
          effect: proposal.effect,
          title: proposal.title,
          rationale: proposal.rationale
        },
        stamp: stampOf({
          by: "AGENT"
        })
      })
      this.landedOn({
        id_Task,
        source: proposal.id,
        path: proposal.path,
        version: proposal.version,
        proposed: [
          {
            source: proposal.id,
            changes: proposal.changes
          }
        ]
      })
    }
    const ids_Proposed = ids_Current.filter((id) => landing.proposals.some((proposal) => proposal.ids_Request.includes(id)))
    for (const id of ids_Proposed) {
      this.tasks.handle({
        kind: "ADDRESS",
        id_Task,
        ids_Request: [id],
        answer: {
          kind: "PROPOSALS",
          ids_Proposal: landing.proposals.flatMap((proposal) => proposal.ids_Request.includes(id) ? [proposal.id] : [])
        }
      })
    }
    const ids_Nothing = ids_Current.filter((id) => !ids_Proposed.includes(id))
    for (const id of ids_Nothing) {
      this.tasks.handle({
        kind: "ADDRESS",
        id_Task,
        ids_Request: [id],
        answer: {
          kind: "NOTHING",
          note: landing.nothings.find((nothing) => nothing.id_Request === id)?.note ?? note
        }
      })
    }
    return {
      job_Shell,
      sources: landing.proposals.map((proposal) => proposal.id),
      ids_Addressed: ids_Nothing
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
      const versions = [
        ...[...this.bases_Round.values()].flatMap((base_Round) => {
          const isRunning = (this.taskOf(base_Round.id_Task)?.requests ?? []).some((request) => request.status.kind === "WITH_AGENT" && request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === base_Round.source)
          return isRunning && base_Round.path === document.path ? [base_Round.version] : []
        }),
        ...this.jobs.flatMap((job) => job.state.kind === "BEING_WORKED_ON"
          ? job.state.givens.flatMap((given) => given.path === document.path ? [given.version] : [])
          : [])
      ]
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
          : head.proposed.some((changes_Source) => changes_Source.source === source)
            ? head.proposed.map((changes_Source) => changes_Source.source === source ? changes_Round : changes_Source)
            : [
              ...head.proposed,
              changes_Round
            ],
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
    if (requests_Started.length === 0) return
    this.count_Job += 1
    const job_Shell: _Job_Shell_ = {
      id: `j-${this.count_Job}`,
      id_Task,
      scope,
      requests: requests_Started,
      sources,
      path,
      version: this.documentOf(path).version,
      proposed: (this.headOf({
        task,
        path
      })?.proposed ?? []).filter((changes_Source) => sources.includes(changes_Source.source)),
      queued: Date.now(),
      state: {
        kind: "QUEUED"
      }
    }
    this.jobsHandled({
      kind: "QUEUE",
      job_Shell
    })
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
          version: job_Shell.version,
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
    for (const observer of this.observers) observer.started(job_Shell)
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
    const jobOf = (id: string) => jobOf__Request({
      jobs: this.jobs,
      id_Task,
      id_Request: id
    })
    const ids_Job = [
      ...new Set(ids_Before.flatMap((id) => {
        const job = jobOf(id)
        return idsOf__Started({
          task: this.taskOf(id_Task)
        }).includes(id) || job === undefined || !isLive__Job({
          job
        })
          ? []
          : [job.id]
      }))
    ]
    const ids_Rest = idsOf__Started({
      task: this.taskOf(id_Task)
    }).filter((id) => ids_Job.includes(jobOf(id)?.id ?? ""))
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
    for (const id_Job of ids_Job) {
      this.jobsHandled({
        kind: "CANCEL",
        id_Job,
        at: Date.now()
      })
    }
    for (const observer of this.observers) {
      observer.stopped({
        id_Task,
        scope,
        ids_Request: ids_Stopped,
        ids_Job
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
      const document = this.documentOf(head.path)
      const sources = head.proposed.flatMap((changes_Source) => isOwn__Source({
        task,
        source: changes_Source.source
      })
        ? [changes_Source.source]
        : [])
      this.documents.handle({
        kind: "APPLY",
        path: head.path,
        version: head.version,
        proposed: head.proposed,
        sources,
        isPresent: isPresentWith__Sources({
          task,
          document,
          sources,
          text: textWith__Sources({
            model_TextEditor: {
              document: document.text,
              proposed: head.proposed
            },
            sources
          })
        })
      })
      this.carried({
        path: head.path,
        ids_Except: [id_Task]
      })
    }
  }

  dropped(): void {
    for (const job of this.jobs) {
      if (!isLive__Job({
        job
      }) || this.taskOf(job.id_Task)?.kind === "OPEN") continue
      this.jobsHandled({
        kind: "CANCEL",
        id_Job: job.id,
        at: Date.now()
      })
    }
  }
}

interface _Api__Shell_ {
  tasks: _Tasks_
  documents: _Documents_
  jobs: Array<_Job_Shell_>
  observers: Array<_Observer_Shell_>
}

interface _Observer_Shell_ {
  changed: (state_Shell: _State_Shell_) => void
  started: (job_Shell: _Job_Shell_) => void
  stopped: (stop_Shell: _Stop_Shell_) => void
  landed: (landing_Job: _Landing_Job_) => void
}

interface _State_Shell_ {
  model_Tasks: _Model_Tasks_
  documents: Array<_Document_Shell_>
  dismissed: Array<_Dismissed_Task_>
  jobs: Array<_Job_Shell_>
}

interface _Document_Shell_ {
  path: string
  version: string
  text: _Text_Model_
  isPresent: boolean
}

interface _Dismissed_Task_ {
  id_Task: string
  sources: Array<string>
}

interface _Stop_Shell_ {
  id_Task: string
  scope: _Scope_Tasks_
  ids_Request: Array<string>
  ids_Job: Array<string>
}

interface _Landing_Job_ {
  job_Shell: _Job_Shell_
  sources: Array<string>
  ids_Addressed: Array<string>
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

interface _Api___headOf__Shell_ {
  task: _Task_Tasks_
  path: string
}

interface _Api___clashesOf__Shell_ {
  id_Task: string
  landing: _Landing_Handed_
}

interface _Api___landed__Shell_ {
  job_Shell: _Job_Shell_
  landing: _Landing_Handed_
  note: string
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

type _Command_Shell_ = _OPEN_DOCUMENT__Command_Shell_ | _EDIT_Command_Shell_ | _REQUEST_Command_Shell_ | _DRAFT_Command_Shell_ | _START_Command_Shell_ | _STOP_Command_Shell_ | _TASKS_Command_Shell_ | _DECIDE_Command_Shell_ | _DISMISS_PROPOSAL__Command_Shell_ | _ACCEPT_Command_Shell_ | _SETTLE_Command_Shell_ | _END_Command_Shell_ | _RERUN_Command_Shell_ | _TAKE_Command_Shell_ | _CHECK_IN__Command_Shell_ | _HAND_BACK__Command_Shell_

interface __BASE_Command_Shell_<Kind extends string> {
  kind: Kind
}

interface _OPEN_DOCUMENT__Command_Shell_ extends __BASE_Command_Shell_<"OPEN_DOCUMENT"> {
  path: string
  text: _Text_Model_
  isPresent: boolean
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

interface _TAKE_Command_Shell_ extends __BASE_Command_Shell_<"TAKE"> {
  id_Job: string
  note: string
}

interface _CHECK_IN__Command_Shell_ extends __BASE_Command_Shell_<"CHECK_IN"> {
  id_Job: string
  note: string
}

interface _HAND_BACK__Command_Shell_ extends __BASE_Command_Shell_<"HAND_BACK"> {
  id_Job: string
  landing: _Landing_Handed_
  note: string
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
      text: command_Shell.text,
      isPresent: command_Shell.isPresent
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
  },
  TAKE: ({
    shell,
    command_Shell
  }) => {
    const job_Shell = shell.jobOf(command_Shell.id_Job)
    if (job_Shell === undefined) return
    shell.jobsHandled({
      kind: "TAKE",
      id_Job: job_Shell.id,
      note: command_Shell.note,
      givens: shell.givensOf(job_Shell),
      at: Date.now()
    })
  },
  CHECK_IN: ({
    shell,
    command_Shell
  }) => shell.jobsHandled({
    kind: "CHECK_IN",
    id_Job: command_Shell.id_Job,
    note: command_Shell.note,
    at: Date.now()
  }),
  HAND_BACK: ({
    shell,
    command_Shell
  }) => {
    const job_Shell = shell.jobOf(command_Shell.id_Job)
    if (job_Shell === undefined || job_Shell.state.kind !== "BEING_WORKED_ON") return
    shell.jobsHandled({
      kind: "HAND_BACK",
      id_Job: job_Shell.id,
      at: Date.now()
    })
    const landing_Job = shell.landed({
      job_Shell,
      landing: command_Shell.landing,
      note: command_Shell.note
    })
    for (const observer of shell.observers) observer.landed(landing_Job)
  }
}

interface _Api___isPresentWith__Sources_ {
  task: _Task_Tasks_
  document: _Document_Documents_
  sources: Array<string>
  text: _Text_Model_
}

function isPresentWith__Sources({
  task,
  document,
  sources,
  text
}: _Api___isPresentWith__Sources_): boolean {
  const effects = task.proposals.flatMap((proposal) => proposal.path === document.path && sources.includes(proposal.id) ? [proposal.effect] : [])
  const isEmpty = flatOf__Text(text) === ""
  return effects.includes("REMOVE") && isEmpty
    ? false
    : document.isPresent || effects.includes("MAKE") || !isEmpty
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
