import {
  _TextEditor_,
  type _Setup_TextEditor_,
  type _Proposal_Host_,
  type _Range_Lines_,
  type _Asked_Host_,
  type __BASE_Asked_Host_
} from "../source/ui/editor/index.ts"
import {
  type _Model_TextEditor_,
  type _Stale_Source_,
  _Documents_
} from "../source/core/documents/index.ts"
import {
  _Board_,
  COMPONENTMAP__VIEW_BOARD
} from "../source/ui/board/index.ts"
import { _Tasks_ } from "../source/core/tasks/index.ts"
import {
  stampOf,
  _Shell_,
  isTakeable__Job,
  landingOf__Base,
  LANDING_NONE
} from "../source/core/shell/index.ts"
import {
  _Host_,
  PROPOSAL_YOURS
} from "../source/ui/host/index.ts"
import type { _Entry_Log_ } from "./example.ts"
import {
  seededOf__Example,
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
  stale: Array<_Stale_Source_>
  about_Task: _About_Task_
  tasks_Other: Array<_Other_Task_>
  tasks_Resolved: Array<_Resolved_Task_>
  containerElement_Board: HTMLElement
  files: Array<string>
  ranges_Frame: Array<_Range_Lines_>
  isListening_Agent: boolean
  log: (entry: _Entry_Log_) => void
}

// the playground as a host: an editor of a document, and the board under
// it, told what to show by the host part, source/ui/host/, which keeps the
// editor's file and mode, makes what it and the board ask into the core's
// commands, and the core's state into what they draw; the core, the shell
// part, source/core/shell/, run here in the page, holding the project's
// tasks, by the tasks part, and the document, by the documents part,
// knowing nothing of the editor; the playground giving them what the
// example says, the task the playground's on and the project's others
// alike, open or resolved, its own task's changes on the document its head
// there, each request's words in it, and, the host's, each proposal's
// attributes; reporting what's asked, and what's done, each as it's told;
// and showing the board, hidden till the editor's footer is pressed, and
// hidden again when it's pressed again, as a host shows and hides a view.
// With no agent, the playground stands in for one, as the example says,
// listening or not, the footer saying which. A Start, at any scope, in any
// task, sets what's staged there going, a job, a proposal never revised by
// two at once. Listening, the stand-in takes each job from the core the
// moment it may, one at a time within a task, as any agent does, so it's
// drawn running, and hands it back a moment after it was started, or,
// seeded, after it took it, what's staged since left for the next; a job
// behind another of its task's, the example's seeded at work and never
// done, waiting its turn, drawn waiting till that's stopped. Not
// listening, it takes nothing, and every job waits. A job's written on the
// document as it was when it started, its base, here the proposal's
// changes as they were then, as there's no agent to write others, and
// lands on the document as it is, carried across every edit since by the
// shell, so changes written before your edits are marked; a job stopped
// before then, its requests staged again, lands nothing. A request on no
// proposal, the document's own or the task's, in any task, answered with
// nothing to change, as there's no agent to propose one
function hostedOf__Editor<State>({
  containerElement,
  setup,
  model_TextEditor,
  name_Document,
  proposals,
  stale,
  about_Task,
  tasks_Other,
  tasks_Resolved,
  containerElement_Board,
  files,
  ranges_Frame,
  isListening_Agent,
  log
}: _Api___hostedOf__Editor_<State>): _TextEditor_<State> {
  const seed = seededOf__Example({
    name_Document,
    model_TextEditor,
    proposals,
    stale,
    about_Task,
    tasks_Other,
    tasks_Resolved,
    stamp: stampOf({
      by: "AGENT"
    })
  })
  const documents = new _Documents_({
    model_Documents: {
      documents: []
    },
    observers: []
  })
  documents.handle({
    kind: "OPEN",
    path: name_Document,
    text: model_TextEditor.document
  })
  // what a Stop was asked at, the editor's or the board's, which the core,
  // knowing nothing of either, says nothing of when it reports what it put
  // back
  let kind_Stop = "TASK"
  // when each job the stand-in's given goes back, a moment after its Start
  const ats_Done = new Map<string, number>()
  const delayOf = (id_Task: string) => id_Task === about_Task.id ? 1600 : 1500
  const shell: _Shell_ = new _Shell_({
    tasks: new _Tasks_({
      model_Tasks: seed.model_Tasks,
      observers: []
    }),
    documents,
    jobs: seed.jobs,
    observers: [
      {
        changed: (state_Shell) => {
          host.heard({
            state_Shell,
            files,
            isListening_Agent,
            at: Date.now(),
            count_Edit: host.count_Sent
          })
          if (!isListening_Agent) return
          queueMicrotask(() => {
            for (const job_Shell of shell.jobs) {
              if (!isTakeable__Job({
                jobs: shell.jobs,
                job: job_Shell
              })) continue
              shell.handle({
                kind: "TAKE",
                id_Job: job_Shell.id,
                note: ""
              })
              setTimeout(
                () => {
                  const task = shell.taskOf(job_Shell.id_Task)
                  shell.handle({
                    kind: "HAND_BACK",
                    id_Job: job_Shell.id,
                    landing: task === undefined
                      ? LANDING_NONE
                      : landingOf__Base({
                        task,
                        job_Shell
                      }),
                    note: ""
                  })
                },
                Math.max(
                  0,
                  (ats_Done.get(job_Shell.id) ?? Date.now() + delayOf(job_Shell.id_Task)) - Date.now()
                )
              )
            }
          })
        },
        started: (job_Shell) => {
          const isOwn = job_Shell.id_Task === about_Task.id
          if (isOwn) {
            log({
              revising: [
                ...job_Shell.sources,
                ...job_Shell.requests.some((request) => request.aim.kind === "DOCUMENT") ? ["document"] : [],
                ...job_Shell.requests.some((request) => request.aim.kind === "TASK") ? ["task"] : []
              ].join(", "),
              requests: job_Shell.requests.length
            })
          }
          ats_Done.set(
            job_Shell.id,
            Date.now() + delayOf(job_Shell.id_Task)
          )
        },
        landed: (landing_Job) => {
          if (landing_Job.job_Shell.id_Task !== about_Task.id || landing_Job.sources.length + landing_Job.ids_Addressed.length === 0) return
          log({
            revised: [
              ...landing_Job.sources,
              ...landing_Job.ids_Addressed.length === 0 ? [] : ["document"]
            ].join(", ")
          })
        },
        stopped: (stop_Shell) => {
          if (stop_Shell.id_Task !== about_Task.id) return
          log({
            stopped: kind_Stop,
            requests: stop_Shell.ids_Request.length
          })
        }
      }
    ]
  })
  const host: _Host_ = new _Host_({
    name_Document,
    target_Mode: {
      kind: "TASK",
      id: about_Task.id
    },
    files,
    isListening_Agent,
    at: Date.now(),
    attributes: seed.attributes_Own,
    state_Shell: shell.state(),
    suffix_Id: "",
    observers: [
      {
        sent: (command_Shell) => shell.handle(command_Shell),
        // the playground has one document an example, so a file asked for,
        // reported, opens nothing
        opening: () => {},
        shown: (update_Host) => editor.update(update_Host),
        boarded: (update_Board) => board.update(update_Board)
      }
    ]
  })
  // a job gone quiet as time passes, with nothing in the core changing,
  // looked for again every few seconds
  setInterval(
    () => host.ticked(),
    15_000
  )
  const shown_Host = host.showing()
  if (shown_Host === undefined) throw new Error(`${name_Document} isn't kept`)
  const editor: _TextEditor_<State> = new _TextEditor_({
    containerElement,
    setup,
    model_TextEditor: shown_Host.update_Host.model_TextEditor,
    name_Document,
    proposals: shown_Host.update_Host.proposals,
    mode: shown_Host.update_Host.mode,
    tasks: shown_Host.update_Host.tasks,
    files,
    rounds_Landed: shown_Host.update_Host.rounds_Landed,
    isListening_Agent: shown_Host.update_Host.isListening_Agent,
    source_Yours: PROPOSAL_YOURS.source,
    ranges_Frame,
    observers: [
      {
        applied: (applied_Edit) => {
          host.edited(applied_Edit)
          log({
            edited: applied_Edit.request_Edit.kind,
            proposals: applied_Edit.sources_Changed.join(", "),
            document: applied_Edit.isChanged_Document
          })
        },
        asked: (asked_Host) => {
          if (asked_Host.kind === "STOP") kind_Stop = asked_Host.scope.kind
          logged__Asked_Host({
            asked_Host,
            host,
            shell,
            id_Task_Own: about_Task.id,
            containerElement_Board,
            log
          })
          host.asked(asked_Host)
        }
      }
    ]
  })
  const board: _Board_ = new _Board_({
    containerElement: containerElement_Board,
    componentMap: COMPONENTMAP__VIEW_BOARD,
    tasks: shown_Host.update_Board.tasks,
    paths_Shown: shown_Host.update_Board.paths_Shown,
    observers: [
      {
        asked: (asked_Board) => {
          log({
            board: asked_Board.kind,
            tasks: asked_Board.kind === "COLLECT" ? asked_Board.ids.join(", ") : asked_Board.kind === "NEW_TASK" ? null : asked_Board.id
          })
          if (asked_Board.kind === "STOP") kind_Stop = "TASK"
          host.askedBoard(asked_Board)
        }
      }
    ]
  })
  return editor
}

interface _Api___logged__Asked_Host_<Kind extends _Asked_Host_["kind"]> {
  asked_Host: Extract<
    _Asked_Host_,
    __BASE_Asked_Host_<Kind>
  >
  host: _Host_
  shell: _Shell_
  id_Task_Own: string
  containerElement_Board: HTMLElement
  log: (entry: _Entry_Log_) => void
}

// what the editor asks reported, as it's asked, before the shell takes it:
// a Start or a Stop in another task than the playground's, which reports
// its own as what they set going and put back; and the board shown or
// hidden, as a host shows and hides a view
function logged__Asked_Host<Kind extends _Asked_Host_["kind"]>({
  asked_Host,
  host,
  shell,
  id_Task_Own,
  containerElement_Board,
  log
}: _Api___logged__Asked_Host_<Kind>): void {
  const logged = logMap_Asked[asked_Host.kind]
  logged({
    asked_Host,
    host,
    shell,
    id_Task_Own,
    containerElement_Board,
    log
  })
}

type _LogMap__Asked_Host_ = {
  [Kind in _Asked_Host_["kind"]]: (api_Logged: _Api___logged__Asked_Host_<Kind>) => void
}

const logMap_Asked: _LogMap__Asked_Host_ = {
  ACTION: ({
    asked_Host,
    log
  }) => log({
    asked: asked_Host.command,
    proposal: asked_Host.source,
    notes: asked_Host.notes,
    words: asked_Host.reference?.text ?? null
  }),
  REQUEST: ({
    asked_Host,
    log
  }) => log({
    requested: asked_Host.notes,
    words: asked_Host.aim.reference?.text ?? null
  }),
  EDIT: ({
    asked_Host,
    log
  }) => log({
    edited: asked_Host.id,
    proposal: asked_Host.source,
    notes: asked_Host.notes
  }),
  REMOVE: ({
    asked_Host,
    log
  }) => log({
    removed: asked_Host.id,
    proposal: asked_Host.source
  }),
  DISMISS: ({
    asked_Host,
    log
  }) => log({
    dismissed: asked_Host.id,
    proposal: asked_Host.source
  }),
  START: ({
    asked_Host,
    host,
    id_Task_Own,
    log
  }) => {
    const task = host.taskIn()
    if (task === undefined || task.id === id_Task_Own) return
    log({
      started: asked_Host.scope.kind,
      task: task.id
    })
  },
  STOP: ({
    asked_Host,
    host,
    id_Task_Own,
    log
  }) => {
    const task = host.taskIn()
    if (task === undefined || task.id === id_Task_Own) return
    log({
      stopped: asked_Host.scope.kind,
      task: task.id
    })
  },
  TASK: ({
    asked_Host,
    log
  }) => log({
    task: asked_Host.command
  }),
  END: ({
    asked_Host,
    host,
    log
  }) => log({
    ended: asked_Host.end,
    task: host.taskIn()?.id ?? null
  }),
  SWITCH: ({
    asked_Host,
    log
  }) => log({
    switched: asked_Host.target.kind === "TASK" ? asked_Host.target.id : asked_Host.target.kind
  }),
  OPEN_FILE: ({
    asked_Host,
    log
  }) => log({
    opened: asked_Host.path
  }),
  SHOW_BOARD: ({
    containerElement_Board,
    log
  }) => {
    containerElement_Board.hidden = !containerElement_Board.hidden
    log({
      board: containerElement_Board.hidden ? "hidden" : "shown"
    })
  },
  RERUN: ({
    asked_Host,
    host,
    shell,
    log
  }) => {
    const task = host.taskIn()
    if (task === undefined) return
    log({
      rerun: asked_Host.source,
      requests: shell.requestsOf__Rerun({
        id_Task: task.id,
        source: asked_Host.source
      }).length
    })
  },
  SETTLE: ({
    asked_Host,
    log
  }) => log({
    settled: asked_Host.source,
    way: asked_Host.way
  })
}
