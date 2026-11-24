import {
  _TextEditor_,
  type _Setup_TextEditor_,
  type _Model_TextEditor_,
  type _Transaction_Model_,
  type _Change_,
  rebasedOf__Changes,
  type _Proposal_Host_,
  type _Mode_Host_,
  type _Standing_Task_,
  type _Task_Host_,
  type _Request_Task_,
  type _Counts_Proposals_,
  type _Counts_Requests_,
  type _Landed_Round_,
  type _Request_Host_,
  type _Scope_Work_,
  type _Target_Switch_,
  type _Range_Lines_,
  type _Decision_Proposal_,
  type _State_Proposal_,
  type _State_Task_,
  type _Kind_End_
} from "../source/editor/index.ts"
import {
  _Board_,
  COMPONENTMAP__VIEW_BOARD,
  type _Task_Board_
} from "../source/board/index.ts"
import type { _Entry_Log_ } from "./example.ts"
import { proposal_Yours, shownMap_State } from "./items.ts"

export {
  hostedOf__Editor,
  type _Other_Task_,
  type _Resolved_Task_
}

interface _Api___hostedOf__Editor_<State> {
  containerElement: HTMLElement
  setup: _Setup_TextEditor_<State>
  model_TextEditor: _Model_TextEditor_
  name_Document: string
  proposals: Array<_Proposal_Host_>
  rounds_Landed: Array<_Landed_Round_>
  about_Task: _About_Task_
  tasks_Other: Array<_Other_Task_>
  tasks_Resolved: Array<_Resolved_Task_>
  containerElement_Board: HTMLElement
  files: Array<string>
  ranges_Frame: Array<_Range_Lines_>
  log: (entry: _Entry_Log_) => void
}

// what the playground says of a task: its id, a counter, as a host keeps
// one, mechanical, so it stays put however its name and its scope change,
// its name saying what it's about; what the agent says of it and of this
// document; and the other documents it says it touches, each with its
// proposals there
interface _About_Task_ {
  id: string
  name: string
  summary: string
  summary_Document: string
  requests: Array<_Request_Task_>
  documents_Elsewhere: Array<_Elsewhere_Task_>
}

interface _Elsewhere_Task_ {
  name: string
  counts_Proposals: _Counts_Proposals_
  counts_Requests: _Counts_Requests_
}

// one of the project's other tasks, as the editor's told it, and the files
// it touches, as the board shows it
interface _Other_Task_ extends _Standing_Task_ {
  paths: Array<string>
}

// a task the project's resolved, completed, canceled or discarded, kept
// till it's collected
interface _Resolved_Task_ {
  id: string
  name: string
  state: _State_Task_
}

interface _Base_Run_ {
  version: number
  changes: Array<_Change_>
  requests: Array<_Request_Host_>
}

interface _Logged_Transaction_ {
  version: number
  transaction: _Transaction_Model_
}

// the playground as a host: an editor of a document and its proposals,
// told of each edit, keeping the model it leaves, and of each action asked
// of a proposal, taking it at once: decided, its state the action's, what
// it says and offers what that state's are, what was asked of it dropped;
// a revision's notes queued on it, with the words they're on, if they are,
// each its own id, one removed when you remove it; dismissed, it's gone,
// its changes with it; and sending the editor what it now has. Start, on
// one request, a proposal's, or the whole document's, sets what's queued
// there going, unless a round of that proposal's under way already, one at
// a time, and, with no agent to revise them, a moment later they're done
// with, as a new round would answer them, what's queued since left for the
// next. A round's written on the document as it was when it started, its
// base, here the proposal's changes as they were then, as there's no agent
// to write others, and lands on the document as it is, through every edit
// since, by the editor's rebasing, its landing told the editor, so changes
// written before your edits are marked; Run again puts that round's
// requests back in the queue and starts them, or, for a round it didn't
// start, asks again, on the document as it is now. Its task in the editor's
// header, named, working while a round's under way, with Stop then, which
// puts what's running back in the queue.
// A request for a change on no proposal, the document's own or the task's,
// with the words it was sent with, or none, queued with the rest, started with them, or
// at once when asked to, and done with a moment later, with no agent to
// answer it with proposals. Each reported as it's told.
// The editor's mode, its task at first: switched, to manual or to another
// of the project's tasks, the example's others, the document's shown as it
// is, nothing proposed on it, as the others have nothing here, and edited,
// the task's proposals carried across each edit, so they're as they should
// be once the editor's switched back to it. The project's files, the
// example's, listed for the editor to open, an opening reported, as the
// playground has one document an example, and an editor's language its
// setup's.
// The board, every task of the project, under the editor, hidden till the
// editor's footer is pressed, and hidden again when it's pressed again, as
// a host shows and hides a view, told the file the editor shows, as the
// one that matters of the files a task touches: a task pressed switches
// the editor to it,
// as switching from the board moves every editor; a draft started works a
// moment, with no agent, then waits on you, its requests become proposals
// to decide, and the editor's own task starts and stops as its header's
// Start and Stop do; completed, canceled or discarded, from the board or
// from the card of the task an editor's in, a task's resolved, an editor
// in it going to manual; collected, it's gone. Another task, switched to,
// told the editor as the example says it stands, counted on the first
// file it touches, and started and stopped from its card as from the
// board. Each reported as it's asked
function hostedOf__Editor<State>({
  containerElement,
  setup,
  model_TextEditor,
  name_Document,
  proposals,
  rounds_Landed,
  about_Task,
  tasks_Other,
  tasks_Resolved,
  containerElement_Board,
  files,
  ranges_Frame,
  log
}: _Api___hostedOf__Editor_<State>): _TextEditor_<State> {
  let target_Mode: _Target_Switch_ = {
    kind: "TASK",
    id: about_Task.id
  }
  const isOwn = () => target_Mode.kind === "TASK" && target_Mode.id === about_Task.id
  let model_Host = model_TextEditor
  let proposals_Host = proposals
  let rounds_Host = rounds_Landed
  let requests_Task: Array<_Request_Task_> = about_Task.requests
  let count_Request = 0
  let version = 0
  let count_Round = 0
  const rounds_Request = new Map<string, number>()
  const transactions_Logged: Array<_Logged_Transaction_> = []
  const bases_Source = new Map<string, _Base_Run_>()
  let documents_Elsewhere = about_Task.documents_Elsewhere
  let tasks_Open = tasks_Other
  let tasks_Done = tasks_Resolved
  const isDone = (id: string) => tasks_Done.some((task_Done) => task_Done.id === id)
  const isShown = (id: string) => target_Mode.kind === "TASK" && target_Mode.id === id
  const taskOf = () => taskOf__Proposals({
    model_TextEditor: model_Host,
    name_Document,
    proposals: proposals_Host,
    requests_Task,
    about_Task,
    documents_Elsewhere
  })
  const standingOwn = (): _Standing_Task_ => {
    const requests_All = [
      ...proposals_Host.flatMap((proposal_Host) => proposal_Host.requests),
      ...requests_Task
    ]
    return {
      id: about_Task.id,
      name: about_Task.name,
      state: taskOf().state,
      isOnDocument: true,
      count_Undecided: proposals_Host.filter((proposal_Host) => proposal_Host.state === "OPEN").length + documents_Elsewhere.reduce((sum, elsewhere_Task) => sum + elsewhere_Task.counts_Proposals.OPEN, 0),
      count_Conflicts: 0,
      count_Queued: requests_All.filter((request_Host) => request_Host.status === "QUEUED").length,
      count_Running: requests_All.filter((request_Host) => request_Host.status === "RUNNING").length
    }
  }
  const tasksOf = () => [
    ...isDone(about_Task.id) ? [] : [standingOwn()],
    ...tasks_Open
  ]
  const boardTasksOf = (): Array<_Task_Board_> => [
    ...isDone(about_Task.id)
      ? []
      : [
        boardedOf__Standing({
          standing_Task: standingOwn(),
          paths: [
            name_Document,
            ...documents_Elsewhere.map((elsewhere_Task) => elsewhere_Task.name)
          ],
          isShown: isShown(about_Task.id)
        })
      ],
    ...tasks_Open.map((task_Open) => boardedOf__Standing({
      standing_Task: task_Open,
      paths: task_Open.paths,
      isShown: isShown(task_Open.id)
    })),
    ...tasks_Done.map((task_Done) => ({
      id: task_Done.id,
      name: task_Done.name,
      state: task_Done.state,
      paths: [],
      count_Undecided: 0,
      count_Conflicts: 0,
      count_Running: 0,
      count_Queued: 0,
      count_Editors: 0
    }))
  ]
  const restated = (id: string, restate: (task_Open: _Other_Task_) => _Other_Task_) => {
    tasks_Open = tasks_Open.map((task_Open) => task_Open.id === id ? restate(task_Open) : task_Open)
  }
  const resolved = (id: string, state: _State_Task_) => {
    const name = tasks_Open.find((task_Open) => task_Open.id === id)?.name ?? about_Task.name
    tasks_Open = tasks_Open.filter((task_Open) => task_Open.id !== id)
    tasks_Done = [
      ...tasks_Done,
      {
        id,
        name,
        state
      }
    ]
    if (isShown(id)) target_Mode = {
      kind: "MANUAL"
    }
  }
  const startedOther = (id: string) => {
    restated(id, (task_Open) => ({
      ...task_Open,
      state: "WORKING",
      count_Running: task_Open.count_Queued,
      count_Queued: 0
    }))
    setTimeout(() => {
      restated(id, (task_Open) => task_Open.state !== "WORKING"
        ? task_Open
        : {
          ...task_Open,
          state: "YOUR_TURN",
          count_Undecided: task_Open.count_Undecided + task_Open.count_Running,
          count_Running: 0
        })
      updated()
    }, 1500)
  }
  const stoppedOther = (id: string) => restated(id, (task_Open) => ({
    ...task_Open,
    state: "YOUR_TURN",
    count_Queued: task_Open.count_Queued + task_Open.count_Running,
    count_Running: 0
  }))
  const modeOf = (): _Mode_Host_ => {
    if (target_Mode.kind === "MANUAL") return {
      kind: "MANUAL"
    }
    const id = target_Mode.id
    const standing_Other = tasks_Open.find((standing_Task) => standing_Task.id === id)
    return isOwn()
      ? {
        kind: "TASK",
        task: taskOf()
      }
      : standing_Other === undefined
        ? {
          kind: "MANUAL"
        }
        : {
          kind: "TASK",
          task: taskOf__Other(standing_Other)
        }
  }
  const updated = () => {
    editor.update({
      model_TextEditor: isOwn()
        ? model_Host
        : {
          document: model_Host.document,
          proposed: []
        },
      name_Document,
      proposals: isOwn() ? proposals_Host : [],
      mode: modeOf(),
      tasks: tasksOf(),
      files,
      rounds_Landed: isOwn() ? rounds_Host : []
    })
    board.update({
      tasks: boardTasksOf(),
      paths_Shown: [name_Document]
    })
  }
  const landed = (source: string) => {
    const base = bases_Source.get(source)
    if (base === undefined) return
    const rebased = rebasedOf__Changes({
      changes: base.changes,
      transactions: transactions_Logged
        .filter((transaction_Logged) => transaction_Logged.version > base.version)
        .map((transaction_Logged) => transaction_Logged.transaction)
    })
    const [
      change_First,
      ...changes_Rest
    ] = rebased.changes
    if (change_First !== undefined) {
      model_Host = {
        document: model_Host.document,
        proposed: model_Host.proposed.map((changes_Source) => changes_Source.source === source
          ? {
            source,
            changes: [
              change_First,
              ...changes_Rest
            ]
          }
          : changes_Source)
      }
    }
    rounds_Host = [
      ...rounds_Host.filter((round_Landed) => round_Landed.source !== source),
      ...rebased.indexes_Stale.length + rebased.count_Dropped === 0
        ? []
        : [
          {
            source,
            indexes_Stale: rebased.indexes_Stale,
            count_Dropped: rebased.count_Dropped
          }
        ]
    ]
  }
  // what a Start takes, everything queued within its scope, or a Stop,
  // everything in progress within it: a request alone; a proposal's; a
  // frame's, those of the proposals it lists; the document's own, or the
  // task's own, requests; everything in the
  // document, its own and its proposals'; or everything in the task, here
  // as much as the playground has of it, this document's
  const isInScope__Request_Proposal = (
    scope: _Scope_Work_,
    source: string,
    id: string
  ) => scope.kind === "DOCUMENT"
    || scope.kind === "TASK"
    || (scope.kind === "FRAME" && scope.sources.includes(source))
    || (scope.kind === "PROPOSAL" && scope.source === source)
    || (scope.kind === "REQUEST" && scope.source === source && scope.id === id)
  const isInScope__Request_Task = (
    scope: _Scope_Work_,
    request_Task: _Request_Task_
  ) => scope.kind === "TASK"
    || (scope.kind === "TASK_REQUESTS" && request_Task.aim.kind === "TASK")
    || ((scope.kind === "DOCUMENT" || scope.kind === "DOCUMENT_REQUESTS") && request_Task.aim.kind !== "TASK")
    || (scope.kind === "REQUEST" && scope.source === null && scope.id === request_Task.id)
  const started = (scope: _Scope_Work_) => {
    const ids_Started = proposals_Host.flatMap((proposal_Host) => proposal_Host.state !== "OPEN" || proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING")
      ? []
      : proposal_Host.requests
        .filter((request_Host) => request_Host.status === "QUEUED" && isInScope__Request_Proposal(scope, proposal_Host.source, request_Host.id))
        .map((request_Host) => request_Host.id))
    const ids_Document = requests_Task
      .filter((request_Task) => request_Task.status === "QUEUED" && isInScope__Request_Task(scope, request_Task))
      .map((request_Task) => request_Task.id)
    const sources_Revising = proposals_Host
      .filter((proposal_Host) => proposal_Host.requests.some((request_Host) => ids_Started.includes(request_Host.id)))
      .map((proposal_Host) => proposal_Host.source)
    log({
      revising: [
        ...sources_Revising,
        ...requests_Task.some((request_Task) => ids_Document.includes(request_Task.id) && request_Task.aim.kind !== "TASK") ? ["document"] : [],
        ...requests_Task.some((request_Task) => ids_Document.includes(request_Task.id) && request_Task.aim.kind === "TASK") ? ["task"] : []
      ].join(", "),
      requests: ids_Started.length + ids_Document.length
    })
    if (scope.kind === "TASK") {
      documents_Elsewhere = documents_Elsewhere.map((elsewhere_Task) => ({
        ...elsewhere_Task,
        counts_Proposals: {
          ...elsewhere_Task.counts_Proposals,
          REQUESTED: 0,
          REVISING: elsewhere_Task.counts_Proposals.REVISING + elsewhere_Task.counts_Proposals.REQUESTED
        },
        counts_Requests: {
          QUEUED: 0,
          RUNNING: elsewhere_Task.counts_Requests.RUNNING + elsewhere_Task.counts_Requests.QUEUED
        }
      }))
    }
    if (ids_Started.length + ids_Document.length === 0) return
    count_Round += 1
    const round = count_Round
    for (const id of [...ids_Started, ...ids_Document]) rounds_Request.set(id, round)
    const isCurrent = (id: string) => rounds_Request.get(id) === round
    requests_Task = requests_Task.map((request_Host) => ids_Document.includes(request_Host.id)
      ? {
        ...request_Host,
        status: "RUNNING"
      }
      : request_Host)
    for (const source of sources_Revising) {
      bases_Source.set(
        source,
        {
          version,
          changes: model_Host.proposed.find((changes_Source) => changes_Source.source === source)?.changes ?? [],
          requests: proposals_Host.find((proposal_Host) => proposal_Host.source === source)?.requests.filter((request_Host) => ids_Started.includes(request_Host.id)) ?? []
        }
      )
    }
    proposals_Host = proposals_Host.map((proposal_Host) => ({
      ...proposal_Host,
      requests: proposal_Host.requests.map((request_Host) => ids_Started.includes(request_Host.id)
        ? {
          ...request_Host,
          status: "RUNNING"
        }
        : request_Host)
    }))
    setTimeout(
      () => {
        const sources_Landing = sources_Revising.filter((source) => proposals_Host
          .find((proposal_Host) => proposal_Host.source === source)
          ?.requests.some((request_Host) => ids_Started.includes(request_Host.id) && isCurrent(request_Host.id)))
        const ids_Addressed = ids_Document.filter(isCurrent)
        if (sources_Landing.length + ids_Addressed.length === 0) return
        proposals_Host = proposals_Host.map((proposal_Host) => ({
          ...proposal_Host,
          requests: proposal_Host.requests.filter((request_Host) => !(ids_Started.includes(request_Host.id) && isCurrent(request_Host.id)))
        }))
        requests_Task = requests_Task.map((request_Task) => ids_Addressed.includes(request_Task.id)
          ? {
            ...request_Task,
            status: "ADDRESSED"
          }
          : request_Task)
        for (const source of sources_Landing) landed(source)
        log({
          revised: [
            ...sources_Landing,
            ...ids_Addressed.length === 0 ? [] : ["document"]
          ].join(", ")
        })
        updated()
      },
      1600
    )
  }
  // a Stop: what's in progress within its scope back in the queue, its
  // round no longer its own, so the round's end leaves it as it is
  const stopped = (scope: _Scope_Work_) => {
    const ids_Stopped = [
      ...proposals_Host.flatMap((proposal_Host) => proposal_Host.requests
        .filter((request_Host) => request_Host.status === "RUNNING" && isInScope__Request_Proposal(scope, proposal_Host.source, request_Host.id))
        .map((request_Host) => request_Host.id)),
      ...requests_Task
        .filter((request_Task) => request_Task.status === "RUNNING" && isInScope__Request_Task(scope, request_Task))
        .map((request_Task) => request_Task.id)
    ]
    log({
      stopped: scope.kind,
      requests: ids_Stopped.length
    })
    for (const id of ids_Stopped) rounds_Request.delete(id)
    if (scope.kind === "TASK") {
      documents_Elsewhere = documents_Elsewhere.map((elsewhere_Task) => ({
        ...elsewhere_Task,
        counts_Proposals: {
          ...elsewhere_Task.counts_Proposals,
          REQUESTED: elsewhere_Task.counts_Proposals.REQUESTED + elsewhere_Task.counts_Proposals.REVISING,
          REVISING: 0
        },
        counts_Requests: {
          QUEUED: elsewhere_Task.counts_Requests.QUEUED + elsewhere_Task.counts_Requests.RUNNING,
          RUNNING: 0
        }
      }))
    }
    proposals_Host = proposals_Host.map((proposal_Host) => ({
      ...proposal_Host,
      requests: proposal_Host.requests.map((request_Host) => ids_Stopped.includes(request_Host.id)
        ? {
          ...request_Host,
          status: "QUEUED"
        }
        : request_Host)
    }))
    requests_Task = requests_Task.map((request_Task) => ids_Stopped.includes(request_Task.id)
      ? {
        ...request_Task,
        status: "QUEUED"
      }
      : request_Task)
  }
  const editor: _TextEditor_<State> = new _TextEditor_({
    containerElement,
    setup,
    model_TextEditor,
    name_Document,
    proposals,
    mode: modeOf(),
    tasks: tasksOf(),
    files,
    rounds_Landed,
    source_Yours: proposal_Yours.source,
    ranges_Frame,
    observers: [
      {
        applied: (applied_Edit) => {
          model_Host = isOwn()
            ? applied_Edit.model_After
            : {
              document: applied_Edit.model_After.document,
              proposed: model_Host.proposed.flatMap((changes_Source) => {
                const [change_First, ...changes_Rest] = rebasedOf__Changes({
                  changes: changes_Source.changes,
                  transactions: [applied_Edit.transaction]
                }).changes
                return change_First === undefined
                  ? []
                  : [
                    {
                      source: changes_Source.source,
                      changes: [
                        change_First,
                        ...changes_Rest
                      ]
                    }
                  ]
              })
            }
          version += 1
          transactions_Logged.push({
            version,
            transaction: applied_Edit.transaction
          })
          log({
            edited: applied_Edit.request_Edit.kind,
            proposals: applied_Edit.sources_Changed.join(", "),
            document: applied_Edit.isChanged_Document
          })
        },
        asked: (asked_Host) => {
          if (asked_Host.kind === "REQUEST") {
            log({
              requested: asked_Host.notes,
              words: asked_Host.aim.reference?.text ?? null
            })
            count_Request += 1
            const id = `document-${count_Request}`
            requests_Task = [
              ...requests_Task,
              {
                id,
                notes: asked_Host.notes,
                aim: asked_Host.aim,
                status: "QUEUED",
                sources_Answering: []
              }
            ]
            if (asked_Host.isStarting) {
              started({
                kind: "REQUEST",
                source: null,
                id
              })
            }
          } else if (asked_Host.kind === "TASK" && (asked_Host.command === "accept-here" || asked_Host.command === "accept-task")) {
            log({
              task: asked_Host.command
            })
            const sources_Waiting = waitingOf__Proposals(proposals_Host).map((proposal_Host) => proposal_Host.source)
            proposals_Host = proposals_Host.map((proposal_Host) => sources_Waiting.includes(proposal_Host.source)
              ? statedOf__Proposal({
                proposal_Host,
                state: "ACCEPTED"
              })
              : proposal_Host)
            rounds_Host = rounds_Host.filter((round_Landed) => !sources_Waiting.includes(round_Landed.source))
            if (asked_Host.command === "accept-task") {
              documents_Elsewhere = documents_Elsewhere.map((elsewhere_Task) => ({
                ...elsewhere_Task,
                counts_Proposals: {
                  ...elsewhere_Task.counts_Proposals,
                  OPEN: 0,
                  ACCEPTED: elsewhere_Task.counts_Proposals.ACCEPTED + elsewhere_Task.counts_Proposals.OPEN
                }
              }))
            }
          } else if (asked_Host.kind === "TASK" && asked_Host.command.startsWith("accept-in:")) {
            const name_Elsewhere = asked_Host.command.slice("accept-in:".length)
            log({
              task: asked_Host.command
            })
            documents_Elsewhere = documents_Elsewhere.map((elsewhere_Task) => elsewhere_Task.name === name_Elsewhere
              ? {
                ...elsewhere_Task,
                counts_Proposals: {
                  ...elsewhere_Task.counts_Proposals,
                  OPEN: 0,
                  ACCEPTED: elsewhere_Task.counts_Proposals.ACCEPTED + elsewhere_Task.counts_Proposals.OPEN
                }
              }
              : elsewhere_Task)
          } else if (asked_Host.kind === "TASK") {
            log({
              task: asked_Host.command
            })
          } else if (asked_Host.kind === "SWITCH") {
            log({
              switched: asked_Host.target.kind === "TASK" ? asked_Host.target.id : asked_Host.target.kind
            })
            target_Mode = asked_Host.target
          } else if (asked_Host.kind === "OPEN_FILE") {
            log({
              opened: asked_Host.path
            })
          } else if (asked_Host.kind === "SHOW_BOARD") {
            containerElement_Board.hidden = !containerElement_Board.hidden
            log({
              board: containerElement_Board.hidden ? "hidden" : "shown"
            })
          } else if (asked_Host.kind === "START") {
            if (target_Mode.kind === "TASK" && !isOwn()) {
              log({
                started: asked_Host.scope.kind,
                task: target_Mode.id
              })
              startedOther(target_Mode.id)
            } else started(asked_Host.scope)
          } else if (asked_Host.kind === "STOP") {
            if (target_Mode.kind === "TASK" && !isOwn()) {
              log({
                stopped: asked_Host.scope.kind,
                task: target_Mode.id
              })
              stoppedOther(target_Mode.id)
            } else stopped(asked_Host.scope)
          } else if (asked_Host.kind === "END") {
            log({
              ended: asked_Host.end,
              task: target_Mode.kind === "TASK" ? target_Mode.id : null
            })
            if (target_Mode.kind === "TASK") resolved(target_Mode.id, stateMap_End[asked_Host.end])
          } else if (asked_Host.kind === "RERUN") {
            const source = asked_Host.source
            const requests_Base = bases_Source.get(source)?.requests ?? []
            const requests_Again: Array<_Request_Host_> = requests_Base.length > 0
              ? requests_Base
              : [
                {
                  id: `${source}-again`,
                  notes: "Again, on the document as it is now.",
                  reference: null,
                  status: "QUEUED"
                }
              ]
            log({
              rerun: source,
              requests: requests_Again.length
            })
            proposals_Host = proposals_Host.map((proposal_Host) => proposal_Host.source === source
              ? {
                ...proposal_Host,
                requests: [
                  ...proposal_Host.requests,
                  ...requests_Again.map((request_Host) => {
                    count_Request += 1
                    return {
                      ...request_Host,
                      id: `${source}-${count_Request}`,
                      status: "QUEUED" as const
                    }
                  })
                ]
              }
              : proposal_Host)
            started({
              kind: "PROPOSAL",
              source
            })
          } else if (asked_Host.kind === "REMOVE") {
            const asked_Remove = asked_Host
            log({
              removed: asked_Remove.id,
              proposal: asked_Remove.source
            })
            proposals_Host = proposals_Host.map((proposal_Host) => proposal_Host.source === asked_Remove.source
              ? {
                ...proposal_Host,
                requests: proposal_Host.requests.filter((request_Host) => request_Host.id !== asked_Remove.id)
              }
              : proposal_Host)
            if (asked_Remove.source === null) requests_Task = requests_Task.filter((request_Host) => request_Host.id !== asked_Remove.id)
          } else if (asked_Host.kind === "DISMISS") {
            const asked_Dismiss = asked_Host
            log({
              dismissed: asked_Dismiss.id,
              proposal: asked_Dismiss.source
            })
            if (asked_Dismiss.source === null) requests_Task = requests_Task.filter((request_Task) => !(request_Task.id === asked_Dismiss.id && request_Task.status === "ADDRESSED"))
          } else if (asked_Host.kind === "EDIT") {
            const asked_Edit = asked_Host
            log({
              edited: asked_Edit.id,
              proposal: asked_Edit.source,
              notes: asked_Edit.notes
            })
            proposals_Host = proposals_Host.map((proposal_Host) => proposal_Host.source === asked_Edit.source
              ? {
                ...proposal_Host,
                requests: proposal_Host.requests.map((request_Host) => request_Host.id === asked_Edit.id && request_Host.status === "QUEUED"
                  ? {
                    ...request_Host,
                    notes: asked_Edit.notes
                  }
                  : request_Host)
              }
              : proposal_Host)
            if (asked_Edit.source === null) {
              requests_Task = requests_Task.map((request_Task) => request_Task.id === asked_Edit.id && request_Task.status === "QUEUED"
                ? {
                  ...request_Task,
                  notes: asked_Edit.notes
                }
                : request_Task)
            }
          } else {
            const asked_Action = asked_Host
            log({
              asked: asked_Action.command,
              proposal: asked_Action.source,
              notes: asked_Action.notes,
              words: asked_Action.reference?.text ?? null
            })
            const action_Item = proposals_Host.find((proposal_Host) => proposal_Host.source === asked_Action.source)?.actions.find((action_Each) => action_Each.command === asked_Action.command)
            if (action_Item === undefined) return
            const stateAfter = action_Item.stateAfter
            if (stateAfter !== "REQUESTED" && stateAfter !== "REVISING") rounds_Host = rounds_Host.filter((round_Landed) => round_Landed.source !== asked_Action.source)
            if (stateAfter === null) {
              proposals_Host = proposals_Host.filter((proposal_Host) => proposal_Host.source !== asked_Action.source)
              model_Host = {
                document: model_Host.document,
                proposed: model_Host.proposed.filter((changes_Source) => changes_Source.source !== asked_Action.source)
              }
            } else if (stateAfter === "REQUESTED" || stateAfter === "REVISING") {
              const notes = asked_Action.notes
              count_Request += 1
              const id = `${asked_Action.source}-${count_Request}`
              proposals_Host = proposals_Host.map((proposal_Host) => proposal_Host.source === asked_Action.source && notes !== null
                ? {
                  ...proposal_Host,
                  requests: [
                    ...proposal_Host.requests,
                    {
                      id,
                      notes,
                      reference: asked_Action.reference,
                      status: "QUEUED"
                    }
                  ]
                }
                : proposal_Host)
            } else {
              proposals_Host = proposals_Host.map((proposal_Host) => proposal_Host.source === asked_Action.source
                ? {
                  ...statedOf__Proposal({
                    proposal_Host,
                    state: stateAfter
                  }),
                  requests: []
                }
                : proposal_Host)
            }
          }
          updated()
        }
      }
    ]
  })
  const board: _Board_ = new _Board_({
    containerElement: containerElement_Board,
    componentMap: COMPONENTMAP__VIEW_BOARD,
    tasks: boardTasksOf(),
    paths_Shown: [name_Document],
    observers: [
      {
        asked: (asked_Board) => {
          log({
            board: asked_Board.kind,
            tasks: asked_Board.kind === "COLLECT" ? asked_Board.ids.join(", ") : asked_Board.kind === "NEW_TASK" ? null : asked_Board.id
          })
          if (asked_Board.kind === "SWITCH") {
            target_Mode = {
              kind: "TASK",
              id: asked_Board.id
            }
          } else if (asked_Board.kind === "START") {
            if (asked_Board.id === about_Task.id) started({
              kind: "TASK"
            })
            else startedOther(asked_Board.id)
          } else if (asked_Board.kind === "STOP") {
            if (asked_Board.id === about_Task.id) stopped({
              kind: "TASK"
            })
            else stoppedOther(asked_Board.id)
          } else if (asked_Board.kind === "COMPLETE") {
            resolved(asked_Board.id, "COMPLETED")
          } else if (asked_Board.kind === "CANCEL") {
            resolved(asked_Board.id, "CANCELED")
          } else if (asked_Board.kind === "DISCARD") {
            resolved(asked_Board.id, "DISCARDED")
          } else if (asked_Board.kind === "COLLECT") {
            const ids = asked_Board.ids
            tasks_Done = tasks_Done.filter((task_Done) => !ids.includes(task_Done.id))
          }
          updated()
        }
      }
    ]
  })
  return editor
}

interface _Api___boardedOf__Standing_ {
  standing_Task: _Standing_Task_
  paths: Array<string>
  isShown: boolean
}

// a task as the board's told it: where it stands, what it touches, and,
// the playground having one editor, whether it's showing it
function boardedOf__Standing({
  standing_Task,
  paths,
  isShown
}: _Api___boardedOf__Standing_): _Task_Board_ {
  return {
    id: standing_Task.id,
    name: standing_Task.name,
    state: standing_Task.state,
    paths,
    count_Undecided: standing_Task.count_Undecided,
    count_Conflicts: standing_Task.count_Conflicts,
    count_Running: standing_Task.count_Running,
    count_Queued: standing_Task.count_Queued,
    count_Editors: isShown ? 1 : 0
  }
}

// one of the project's other tasks as the editor's told it, switched to:
// what the example says of where it stands, counted on the first file it
// touches, none on the rest, and none as the file shown, which the editor
// would count itself, as nothing of it's here
function taskOf__Other(
  task_Other: _Other_Task_
): _Task_Host_ {
  return {
    id: task_Other.id,
    name: task_Other.name,
    state: task_Other.state,
    summary: "",
    reason: "",
    documents: task_Other.paths.map((
      path,
      index
    ) => ({
      name: path,
      counts_Proposals: {
        OPEN: index === 0 ? task_Other.count_Undecided : 0,
        REQUESTED: 0,
        REVISING: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        WITHDRAWN: 0
      },
      counts_Requests: {
        QUEUED: index === 0 ? task_Other.count_Queued : 0,
        RUNNING: index === 0 ? task_Other.count_Running : 0
      },
      isShown: false,
      actions: []
    })),
    summary_Document: "",
    requests: [],
    actions: [],
    actions_Document: []
  }
}

type _StateMap__Kind_End_ = {
  [Kind in _Kind_End_]: _State_Task_
}

// the state each way of ending a task leaves it in
const stateMap_End: _StateMap__Kind_End_ = {
  COMPLETE: "COMPLETED",
  CANCEL: "CANCELED",
  DISCARD: "DISCARDED"
}

interface _Api___statedOf__Proposal_ {
  proposal_Host: _Proposal_Host_
  state: _Decision_Proposal_
}

// a proposal in a state, saying and offering what that state's do
function statedOf__Proposal({
  proposal_Host,
  state
}: _Api___statedOf__Proposal_): _Proposal_Host_ {
  return {
    ...proposal_Host,
    state,
    status: shownMap_State[state].status,
    actions: shownMap_State[state].actions
  }
}

interface _Api___taskOf__Proposals_ {
  model_TextEditor: _Model_TextEditor_
  name_Document: string
  proposals: Array<_Proposal_Host_>
  requests_Task: Array<_Request_Task_>
  about_Task: _About_Task_
  documents_Elsewhere: Array<_Elsewhere_Task_>
}

// the task the playground's on, as the editor's told it: its id, its name,
// what the agent says of it and of this document, the example's; the
// agent's at work on it while a round of its proposals', or of its own
// requests, is under way, and otherwise it's your turn;
// the documents it touches, this one, its proposals counted by where each
// stands, and those the example says it has elsewhere, with theirs; its requests, aimed at it, the document or
// some words, in progress or addressed, answered by no proposals, as
// there's no agent to write any; and, of the document, the proposals
// waiting on nothing but you accepted at once
function taskOf__Proposals({
  model_TextEditor,
  name_Document,
  proposals,
  requests_Task,
  about_Task,
  documents_Elsewhere
}: _Api___taskOf__Proposals_): _Task_Host_ {
  const states = proposals
    .filter((proposal_Host) => model_TextEditor.proposed.some((changes_Source) => changes_Source.source === proposal_Host.source))
    .map((proposal_Host): _State_Proposal_ => proposal_Host.state !== "OPEN"
      ? proposal_Host.state
      : proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING")
        ? "REVISING"
        : proposal_Host.requests.some((request_Host) => request_Host.status === "QUEUED")
          ? "REQUESTED"
          : "OPEN")
  const countOf = (state: _State_Proposal_) => states.filter((state_Each) => state_Each === state).length
  const count_Waiting = waitingOf__Proposals(proposals).length
  const count_Waiting_Task = count_Waiting + documents_Elsewhere.reduce((sum, elsewhere_Task) => sum + elsewhere_Task.counts_Proposals.OPEN, 0)
  const isBusy = [
    ...proposals.flatMap((proposal_Host) => proposal_Host.requests),
    ...requests_Task
  ].some((request_Host) => request_Host.status === "RUNNING")
  const state: _State_Task_ = isBusy ? "WORKING" : "YOUR_TURN"
  const requests_Here = [
    ...proposals.flatMap((proposal_Host) => proposal_Host.requests),
    ...requests_Task.filter((request_Task) => request_Task.aim.kind !== "TASK")
  ]
  return {
    id: about_Task.id,
    name: about_Task.name,
    state,
    summary: about_Task.summary,
    reason: "",
    documents: [
      {
        name: name_Document,
        counts_Proposals: {
          OPEN: countOf("OPEN"),
          REQUESTED: countOf("REQUESTED"),
          REVISING: countOf("REVISING"),
          ACCEPTED: countOf("ACCEPTED"),
          REJECTED: countOf("REJECTED"),
          WITHDRAWN: countOf("WITHDRAWN")
        },
        counts_Requests: {
          QUEUED: requests_Here.filter((request_Host) => request_Host.status === "QUEUED").length,
          RUNNING: requests_Here.filter((request_Host) => request_Host.status === "RUNNING").length
        },
        isShown: true,
        actions: count_Waiting === 0
          ? []
          : [
            {
              command: "accept-here",
              label: `Accept all (${count_Waiting})`,
              section: "PROPOSALS"
            }
          ]
      },
      ...documents_Elsewhere.map((elsewhere_Task) => ({
        name: elsewhere_Task.name,
        counts_Proposals: elsewhere_Task.counts_Proposals,
        counts_Requests: elsewhere_Task.counts_Requests,
        isShown: false,
        actions: elsewhere_Task.counts_Proposals.OPEN === 0
          ? []
          : [
            {
              command: `accept-in:${elsewhere_Task.name}`,
              label: `Accept all (${elsewhere_Task.counts_Proposals.OPEN})`,
              section: "PROPOSALS" as const
            }
          ]
      }))
    ],
    summary_Document: about_Task.summary_Document,
    requests: requests_Task,
    actions: count_Waiting_Task === 0
      ? []
      : [
        {
          command: "accept-task",
          label: `Accept all (${count_Waiting_Task})`,
          section: "PROPOSALS"
        }
      ],
    actions_Document: count_Waiting === 0
      ? []
      : [
        {
          command: "accept-here",
          label: `Accept all (${count_Waiting})`,
          section: "PROPOSALS"
        }
      ]
  }
}

// the proposals waiting on nothing but you: open, nothing asked of them,
// and theirs to accept
function waitingOf__Proposals(
  proposals: Array<_Proposal_Host_>
): Array<_Proposal_Host_> {
  return proposals.filter((proposal_Host) => proposal_Host.state === "OPEN" && proposal_Host.requests.length === 0 && proposal_Host.actions.some((action_Item) => action_Item.stateAfter === "ACCEPTED"))
}
