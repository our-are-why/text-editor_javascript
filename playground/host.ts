import {
  _TextEditor_,
  type _Setup_TextEditor_,
  type _Model_TextEditor_,
  type _Transaction_Model_,
  type _Change_,
  rebasedOf__Changes,
  type _Proposal_Host_,
  type _Landed_Round_,
  type _Request_Host_,
  type _Selected_Text_,
  type _Scope_Work_,
  type _Target_Switch_,
  type _Range_Lines_,
  type _Mode_Host_
} from "../source/editor/index.ts"
import {
  _Board_,
  COMPONENTMAP__VIEW_BOARD
} from "../source/board/index.ts"
import {
  _Tasks_,
  type _Task_Tasks_,
  type _Scope_Tasks_,
  type _Stamp_Tasks_,
  type _Author_Tasks_,
  type _Aim_Request_Tasks_
} from "../source/tasks/index.ts"
import type { _Entry_Log_ } from "./example.ts"
import { proposal_Yours, shownMap_State } from "./items.ts"
import {
  seededOf__Example,
  standingOf__Tasks,
  boardedOf__Tasks,
  proposalsHostOf__Task,
  taskHostOf__Task,
  waitingOf__Task,
  scopeOf__Work,
  type _About_Task_,
  type _Other_Task_,
  type _Resolved_Task_
} from "./tasks.ts"

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

interface _Base_Run_ {
  version: number
  changes: Array<_Change_>
  requests: Array<_Request_Host_>
}

interface _Logged_Transaction_ {
  version: number
  transaction: _Transaction_Model_
}

// the playground as a host: an editor of a document, and the project's
// tasks, held by the tasks part, `_Tasks_`, from what the example says of
// them, the task the playground's on and the project's others alike, open
// or resolved; what's only the editor's kept here beside it: the words
// every request was sent on, and the content on the document of the task
// the playground's on, the one with proposals here, its proposals'
// changes, the rounds that landed and each proposal's attributes. The
// editor and the board told what they show from the tasks part, every
// count of it the tasks part's, the editor in any task shown what's asked
// of it on the document, and in the task the playground's on, its content.
// The editor told of each edit, keeping the document it leaves, and the
// changes of the task the playground's on, carried across it when the
// editor's elsewhere;
// and of each action asked of a proposal, taking it at once: decided, by
// the tasks part, what was asked of it and not addressed let go; a
// revision's notes queued on it, with the words they're on, if they are,
// each its own id, one removed when you remove it; dismissed, it's gone,
// its changes with it; and sending the editor what it now has. Start, at
// any scope, in any task, sets what's queued there going, a proposal never
// revised by two rounds at once, and, with no agent to revise them, a
// moment later they're done with, as a new round would answer them, what's
// queued since left for the next. A round's written on the document as it
// was when it started, its base, here the proposal's changes as they were
// then, as there's no agent to write others, and lands on the document as
// it is, through every edit since, by the editor's rebasing, its landing
// told the editor, so changes written before your edits are marked; Run
// again puts that round's requests back in the queue and starts them, or,
// for a round it didn't start, asks again, on the document as it is now. A
// request on no proposal, the document's own or the task's, in any task,
// answered with nothing to change, as there's no agent to propose one. Stop
// puts what's running back in the queue.
// A request for a change on no proposal, with the words it was sent with,
// or none, queued in the task the editor's in, started with the rest, or at
// once when asked to; one sent with no task drafting a new one, named for
// it, the editor in it from then on. Each reported as it's told.
// The editor's mode, its task at first: switched, to manual or to another
// of the project's tasks, the editor shown what's asked of it on the
// document, and its content only in the task the playground's on. The project's files, the example's, listed for the editor to
// open, an opening reported, as the playground has one document an
// example, and an editor's language its setup's.
// The board, every task of the project, under the editor, hidden till the
// editor's footer is pressed, and hidden again when it's pressed again, as
// a host shows and hides a view, told the file the editor shows: a task
// pressed switches the editor to it, as switching from the board moves
// every editor; started or stopped, as from its card; applied, canceled or
// discarded, from the board or from the card of the task an editor's in, a
// task's resolved, an editor in it going to manual; collected, it's gone.
// Each reported as it's asked
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
  const seed = seededOf__Example({
    name_Document,
    model_TextEditor,
    proposals,
    rounds_Landed,
    about_Task,
    tasks_Other,
    tasks_Resolved,
    stamp: stampOf({
      by: "AGENT"
    })
  })
  const tasks = new _Tasks_({
    model_Tasks: seed.model_Tasks,
    observers: []
  })
  const references = seed.references
  let content_Own = seed.content_Own
  let target_Mode: _Target_Switch_ = {
    kind: "TASK",
    id: about_Task.id
  }
  let document_Host = model_TextEditor.document
  let count_Request = 0
  let version = 0
  let count_Round = 0
  const rounds_Request = new Map<string, number>()
  const transactions_Logged: Array<_Logged_Transaction_> = []
  const bases_Source = new Map<string, _Base_Run_>()
  const keyOf = (
    id_Task: string,
    id: string
  ) => `${id_Task}\n${id}`
  const taskOf = (id: string) => tasks.model_Tasks.tasks.find((task) => task.id === id)
  const taskIn = () => {
    const task = target_Mode.kind === "TASK" ? taskOf(target_Mode.id) : undefined
    return task?.kind === "OPEN" ? task : undefined
  }
  const isOwn_Shown = () => taskIn()?.id === about_Task.id
  const modeOf = (): _Mode_Host_ => {
    const task = taskIn()
    return task === undefined
      ? {
        kind: "MANUAL"
      }
      : {
        kind: "TASK",
        task: taskHostOf__Task({
          task,
          name_Document,
          references
        })
      }
  }
  const proposalsOf = () => {
    const task = taskIn()
    return task === undefined || !isOwn_Shown()
      ? []
      : proposalsHostOf__Task({
        task,
        content: content_Own,
        name_Document,
        references
      })
  }
  const standingsOf = () => tasks.model_Tasks.tasks.flatMap((task) => task.kind === "OPEN"
    ? [
      standingOf__Tasks({
        task,
        name_Document
      })
    ]
    : [])
  // the project's tasks on the board, the open ones as they were made,
  // then the resolved ones in the order they were resolved
  const boardedOf = () => [
    ...tasks.model_Tasks.tasks.filter((task) => task.kind === "OPEN"),
    ...tasks.model_Tasks.tasks
      .flatMap((task) => task.kind === "RESOLVED" ? [task] : [])
      .toSorted((
        task,
        task_Other
      ) => task.resolution.stamp.at.localeCompare(task_Other.resolution.stamp.at))
  ].map((task) => boardedOf__Tasks({
    task,
    count_Editors: target_Mode.kind === "TASK" && target_Mode.id === task.id ? 1 : 0
  }))
  const updated = () => {
    if (target_Mode.kind === "TASK" && taskIn() === undefined) {
      target_Mode = {
        kind: "MANUAL"
      }
    }
    editor.update({
      model_TextEditor: {
        document: document_Host,
        proposed: isOwn_Shown() ? content_Own.proposed : []
      },
      name_Document,
      proposals: proposalsOf(),
      mode: modeOf(),
      tasks: standingsOf(),
      files,
      rounds_Landed: isOwn_Shown() ? content_Own.rounds : []
    })
    board.update({
      tasks: boardedOf(),
      paths_Shown: [name_Document]
    })
  }
  // a round landed on a proposal of the task the playground's on: its
  // changes as they were when it started, carried across every edit since
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
    content_Own = {
      ...content_Own,
      proposed: change_First === undefined
        ? content_Own.proposed
        : content_Own.proposed.map((changes_Source) => changes_Source.source === source
          ? {
            source,
            changes: [
              change_First,
              ...changes_Rest
            ]
          }
          : changes_Source),
      rounds: [
        ...content_Own.rounds.filter((round_Landed) => round_Landed.source !== source),
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
  }
  // a Start in a task, by the tasks part: the ids of what it set going
  const startedIn = (
    id_Task: string,
    scope: _Scope_Tasks_
  ) => {
    const ids_Before = idsOf__Started({
      task: taskOf(id_Task)
    })
    tasks.handle({
      kind: "START",
      id_Task,
      scope,
      stamp: stampOf({
        by: "HUMAN"
      })
    })
    return idsOf__Started({
      task: taskOf(id_Task)
    }).filter((id) => !ids_Before.includes(id))
  }
  // a Stop in a task, by the tasks part: the ids of what it put back
  const stoppedIn = (
    id_Task: string,
    scope: _Scope_Tasks_
  ) => {
    const ids_Before = idsOf__Started({
      task: taskOf(id_Task)
    })
    tasks.handle({
      kind: "STOP",
      id_Task,
      scope
    })
    const ids_After = idsOf__Started({
      task: taskOf(id_Task)
    })
    return ids_Before.filter((id) => !ids_After.includes(id))
  }
  // a Start in a task: what it set going revised, a proposal's round written
  // on its changes as they are, landing a moment later on the document as
  // it is then, in the task the playground's on, the one with proposals
  // here; the file's and the task's own requests answered with nothing to
  // change; the task the playground's on reporting what it revises
  const started = (
    id_Task: string,
    scope_Work: _Scope_Work_
  ) => {
    const task = taskOf(id_Task)
    if (task === undefined || task.kind !== "OPEN") return
    const isOwn = id_Task === about_Task.id
    const ids_Started = startedIn(
      id_Task,
      scopeOf__Work({
        scope_Work,
        task,
        name_Document
      })
    )
    const requests_Started = (taskOf(id_Task)?.requests ?? []).filter((request) => ids_Started.includes(request.id))
    const sourcesOf = (ids: Array<string>) => task.proposals.flatMap((proposal) => requests_Started.some((request) => ids.includes(request.id) && request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === proposal.id) ? [proposal.id] : [])
    const sources_Revising = sourcesOf(ids_Started)
    const ids_Document = requests_Started.flatMap((request) => request.aim.kind === "PROPOSAL" ? [] : [request.id])
    if (isOwn) {
      log({
        revising: [
          ...sources_Revising,
          ...requests_Started.some((request) => request.aim.kind === "DOCUMENT") ? ["document"] : [],
          ...requests_Started.some((request) => request.aim.kind === "TASK") ? ["task"] : []
        ].join(", "),
        requests: ids_Started.length
      })
    }
    if (ids_Started.length === 0) return
    count_Round += 1
    const round = count_Round
    for (const id of ids_Started) {
      rounds_Request.set(
        keyOf(
          id_Task,
          id
        ),
        round
      )
    }
    for (const source of isOwn ? sources_Revising : []) {
      bases_Source.set(
        source,
        {
          version,
          changes: content_Own.proposed.find((changes_Source) => changes_Source.source === source)?.changes ?? [],
          requests: requests_Started.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === source
            ? [
              {
                id: request.id,
                notes: request.notes,
                reference: references.get(request.id) ?? null,
                status: "QUEUED" as const
              }
            ]
            : [])
        }
      )
    }
    setTimeout(
      () => {
        const isCurrent = (id: string) => rounds_Request.get(keyOf(
          id_Task,
          id
        )) === round && idsOf__Started({
          task: taskOf(id_Task)
        }).includes(id)
        const ids_Current = ids_Started.filter(isCurrent)
        const sources_Landing = sourcesOf(ids_Current)
        const ids_Addressed = ids_Document.filter(isCurrent)
        if (sources_Landing.length + ids_Addressed.length === 0) return
        for (const source of sources_Landing) {
          tasks.handle({
            kind: "ADDRESS",
            id_Task,
            ids_Request: requests_Started.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === source && ids_Current.includes(request.id) ? [request.id] : []),
            answer: {
              kind: "PROPOSALS",
              ids_Proposal: [source]
            }
          })
          if (isOwn) landed(source)
        }
        if (ids_Addressed.length > 0) {
          tasks.handle({
            kind: "ADDRESS",
            id_Task,
            ids_Request: ids_Addressed,
            answer: {
              kind: "NOTHING",
              note: ""
            }
          })
        }
        if (isOwn) {
          log({
            revised: [
              ...sources_Landing,
              ...ids_Addressed.length === 0 ? [] : ["document"]
            ].join(", ")
          })
        }
        updated()
      },
      isOwn ? 1600 : 1500
    )
  }
  // a Stop in a task: what's running within its scope back in the queue,
  // its round no longer its own, so the round's end leaves it as it is; the
  // task the playground's on reporting how much
  const stopped = (
    id_Task: string,
    scope_Work: _Scope_Work_
  ) => {
    const task = taskOf(id_Task)
    if (task === undefined) return
    const ids_Stopped = stoppedIn(
      id_Task,
      scopeOf__Work({
        scope_Work,
        task,
        name_Document
      })
    )
    if (id_Task === about_Task.id) {
      log({
        stopped: scope_Work.kind,
        requests: ids_Stopped.length
      })
    }
    for (const id of ids_Stopped) {
      rounds_Request.delete(keyOf(
        id_Task,
        id
      ))
    }
  }
  // a request made in the task the editor's in, queued, its words kept for
  // the editor; or, with no task, a new one drafted with it, named for it,
  // the editor in it from then on; started at once when asked to
  const requested = (
    id: string,
    notes: string,
    aim: _Aim_Request_Tasks_,
    isStarting: boolean
  ) => {
    const task = taskIn()
    const id_Task = task?.id ?? idOf__Task_Next({
      tasks: tasks.model_Tasks.tasks
    })
    if (task === undefined) {
      tasks.handle({
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
      target_Mode = {
        kind: "TASK",
        id: id_Task
      }
    } else {
      tasks.handle({
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
      started(
        id_Task,
        {
          kind: "REQUEST",
          source: null,
          id
        }
      )
    }
  }
  // the proposals of the task the editor's in that wait on nothing but you,
  // accepted, on a file or on every file it touches
  const acceptedIn = (paths: Array<string>) => {
    const task = taskIn()
    if (task === undefined) return
    const sources_Accepted = paths.flatMap((path) => waitingOf__Task({
      task,
      path
    }).map((proposal) => proposal.id))
    for (const id_Proposal of sources_Accepted) {
      tasks.handle({
        kind: "DECIDE",
        id_Task: task.id,
        id_Proposal,
        decision: "ACCEPTED"
      })
    }
    content_Own = {
      ...content_Own,
      rounds: content_Own.rounds.filter((round_Landed) => !sources_Accepted.includes(round_Landed.source))
    }
  }
  // a task ended, applied, canceled or discarded, by the tasks part, an
  // editor in it going to manual
  const ended = (
    id_Task: string,
    kind_End: "APPLY" | "CANCEL" | "DISCARD"
  ) => {
    tasks.handle({
      kind: kind_End,
      id_Task,
      stamp: stampOf({
        by: "HUMAN"
      })
    })
  }
  const editor: _TextEditor_<State> = new _TextEditor_({
    containerElement,
    setup,
    model_TextEditor,
    name_Document,
    proposals: proposalsOf(),
    mode: modeOf(),
    tasks: standingsOf(),
    files,
    rounds_Landed,
    source_Yours: proposal_Yours.source,
    ranges_Frame,
    observers: [
      {
        applied: (applied_Edit) => {
          document_Host = applied_Edit.model_After.document
          content_Own = {
            ...content_Own,
            proposed: isOwn_Shown()
              ? applied_Edit.model_After.proposed
              : content_Own.proposed.flatMap((changes_Source) => {
                const [
                  change_First,
                  ...changes_Rest
                ] = rebasedOf__Changes({
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
          const task = taskIn()
          if (asked_Host.kind === "REQUEST") {
            log({
              requested: asked_Host.notes,
              words: asked_Host.aim.reference?.text ?? null
            })
            count_Request += 1
            const id = `document-${count_Request}`
            references.set(
              id,
              asked_Host.aim.reference
            )
            requested(
              id,
              asked_Host.notes,
              aimOf__Reference({
                kind: asked_Host.aim.kind,
                reference: asked_Host.aim.reference,
                path: name_Document
              }),
              asked_Host.isStarting
            )
          } else if (asked_Host.kind === "TASK" && asked_Host.command === "accept-here") {
            log({
              task: asked_Host.command
            })
            acceptedIn([name_Document])
          } else if (asked_Host.kind === "TASK" && asked_Host.command === "accept-task") {
            log({
              task: asked_Host.command
            })
            acceptedIn(task === undefined ? [] : [...new Set(task.proposals.map((proposal) => proposal.path))])
          } else if (asked_Host.kind === "TASK" && asked_Host.command.startsWith("accept-in:")) {
            log({
              task: asked_Host.command
            })
            acceptedIn([asked_Host.command.slice("accept-in:".length)])
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
            if (task !== undefined && task.id !== about_Task.id) {
              log({
                started: asked_Host.scope.kind,
                task: task.id
              })
            }
            if (task !== undefined) {
              started(
                task.id,
                asked_Host.scope
              )
            }
          } else if (asked_Host.kind === "STOP") {
            if (task !== undefined && task.id !== about_Task.id) {
              log({
                stopped: asked_Host.scope.kind,
                task: task.id
              })
            }
            if (task !== undefined) {
              stopped(
                task.id,
                asked_Host.scope
              )
            }
          } else if (asked_Host.kind === "END") {
            log({
              ended: asked_Host.end,
              task: task?.id ?? null
            })
            if (task !== undefined) {
              ended(
                task.id,
                asked_Host.end
              )
            }
          } else if (asked_Host.kind === "RERUN") {
            const source = asked_Host.source
            if (task === undefined) return
            const requests_Base = bases_Source.get(source)?.requests ?? []
            const requests_Again = requests_Base.length > 0
              ? requests_Base
              : [
                {
                  notes: "Again, on the document as it is now.",
                  reference: null
                }
              ]
            log({
              rerun: source,
              requests: requests_Again.length
            })
            for (const request_Again of requests_Again) {
              count_Request += 1
              const id = `${source}-${count_Request}`
              references.set(
                id,
                request_Again.reference
              )
              tasks.handle({
                kind: "REQUEST",
                id_Task: task.id,
                request: {
                  id,
                  notes: request_Again.notes,
                  aim: aimOf__Reference({
                    kind: "PROPOSAL",
                    reference: request_Again.reference,
                    path: source
                  })
                },
                stamp: stampOf({
                  by: "HUMAN"
                })
              })
            }
            started(
              task.id,
              {
                kind: "PROPOSAL",
                source
              }
            )
          } else if (asked_Host.kind === "REMOVE") {
            log({
              removed: asked_Host.id,
              proposal: asked_Host.source
            })
            if (task !== undefined) {
              tasks.handle({
                kind: "REMOVE",
                id_Task: task.id,
                id_Request: asked_Host.id
              })
            }
          } else if (asked_Host.kind === "DISMISS") {
            log({
              dismissed: asked_Host.id,
              proposal: asked_Host.source
            })
            if (task !== undefined) {
              tasks.handle({
                kind: "DISMISS",
                id_Task: task.id,
                id_Request: asked_Host.id
              })
            }
          } else if (asked_Host.kind === "EDIT") {
            log({
              edited: asked_Host.id,
              proposal: asked_Host.source,
              notes: asked_Host.notes
            })
            if (task !== undefined) {
              tasks.handle({
                kind: "EDIT",
                id_Task: task.id,
                id_Request: asked_Host.id,
                notes: asked_Host.notes
              })
            }
          } else {
            const asked_Action = asked_Host
            log({
              asked: asked_Action.command,
              proposal: asked_Action.source,
              notes: asked_Action.notes,
              words: asked_Action.reference?.text ?? null
            })
            if (task === undefined) return
            const proposal = task.proposals.find((proposal_Each) => proposal_Each.id === asked_Action.source)
            const action_Item = proposal === undefined ? undefined : shownMap_State[proposal.decision].actions.find((action_Each) => action_Each.command === asked_Action.command)
            if (action_Item === undefined) return
            const stateAfter = action_Item.stateAfter
            if (stateAfter !== "REQUESTED" && stateAfter !== "REVISING") {
              content_Own = {
                ...content_Own,
                rounds: content_Own.rounds.filter((round_Landed) => round_Landed.source !== asked_Action.source)
              }
            }
            if (stateAfter === null) {
              content_Own = {
                ...content_Own,
                proposed: content_Own.proposed.filter((changes_Source) => changes_Source.source !== asked_Action.source),
                sources_Dismissed: new Set([
                  ...content_Own.sources_Dismissed,
                  asked_Action.source
                ])
              }
            } else if (stateAfter === "REQUESTED" || stateAfter === "REVISING") {
              const notes = asked_Action.notes
              if (notes !== null) {
                count_Request += 1
                const id = `${asked_Action.source}-${count_Request}`
                references.set(
                  id,
                  asked_Action.reference
                )
                tasks.handle({
                  kind: "REQUEST",
                  id_Task: task.id,
                  request: {
                    id,
                    notes,
                    aim: aimOf__Reference({
                      kind: "PROPOSAL",
                      reference: asked_Action.reference,
                      path: asked_Action.source
                    })
                  },
                  stamp: stampOf({
                    by: "HUMAN"
                  })
                })
              }
            } else {
              tasks.handle({
                kind: "DECIDE",
                id_Task: task.id,
                id_Proposal: asked_Action.source,
                decision: stateAfter
              })
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
    tasks: boardedOf(),
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
            started(
              asked_Board.id,
              {
                kind: "TASK"
              }
            )
          } else if (asked_Board.kind === "STOP") {
            stopped(
              asked_Board.id,
              {
                kind: "TASK"
              }
            )
          } else if (asked_Board.kind === "APPLY" || asked_Board.kind === "CANCEL" || asked_Board.kind === "DISCARD") {
            ended(
              asked_Board.id,
              asked_Board.kind
            )
          } else if (asked_Board.kind === "COLLECT") {
            tasks.handle({
              kind: "COLLECT",
              ids_Task: asked_Board.ids
            })
          }
          updated()
        }
      }
    ]
  })
  return editor
}

interface _Api___stampOf_ {
  by: _Author_Tasks_
}

// a stamp of now, by you or by the agent
function stampOf({
  by
}: _Api___stampOf_): _Stamp_Tasks_ {
  return {
    at: new Date().toISOString(),
    by
  }
}

interface _Api___idsOf__Started_ {
  task: _Task_Tasks_ | undefined
}

// the ids of what's started in a task, if it's there
function idsOf__Started({
  task
}: _Api___idsOf__Started_): Array<string> {
  return (task?.requests ?? []).flatMap((request) => request.status.kind === "STARTED" ? [request.id] : [])
}

interface _Api___idOf__Task_Next_ {
  tasks: Array<_Task_Tasks_>
}

// the next id of a task, the next number after the project's last
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

// what a request's aimed at, as the tasks part says it: the task, the file
// shown, or a proposal, by its source, on the words it was sent on, by
// their text, or on all of it
function aimOf__Reference({
  kind,
  reference,
  path
}: _Api___aimOf__Reference_): _Aim_Request_Tasks_ {
  const words = reference === null
    ? {
      kind: "ALL" as const
    }
    : {
      kind: "QUOTED" as const,
      text: reference.text
    }
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
