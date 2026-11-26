import {
  _TextEditor_,
  type _Setup_TextEditor_,
  type _Proposal_Host_,
  type _Range_Lines_,
  type _Asked_Host_,
  type __BASE_Asked_Host_
} from "../source/editor/index.ts"
import {
  type _Model_TextEditor_,
  type _Stale_Source_,
  _Documents_
} from "../source/documents/index.ts"
import {
  _Board_,
  COMPONENTMAP__VIEW_BOARD
} from "../source/board/index.ts"
import { _Tasks_ } from "../source/tasks/index.ts"
import {
  stampOf,
  _Shell_,
  PROPOSAL_YOURS
} from "../source/shell/index.ts"
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
  log: (entry: _Entry_Log_) => void
}

// the playground as a host: an editor of a document, and the board under
// it, both told what to show by the shell, source/shell/, which does a
// host's work, as notes/SHELL.md says, holding the project's tasks, by the
// tasks part, and the document, by the documents part, and taking each edit
// and everything the editor and the board ask; the playground giving it
// what the example says, the task the playground's on and the project's
// others alike, open or resolved, its own task's changes on the document its
// head there, and what's only the editor's of them, the words every request
// was sent on and each proposal's attributes; reporting what's asked, and
// what's done, each as it's told; and showing the board, hidden till the
// editor's footer is pressed, and hidden again when it's pressed again, as
// a host shows and hides a view.
// With no agent, the playground stands in for one: a Start, at any scope,
// in any task, sets what's staged there going, a proposal never revised by
// two rounds at once, and a moment later they're done with, as a new round
// would answer them, what's staged since left for the next. A round's
// written on the document as it was when it started, its base, here the
// proposal's changes as they were then, as there's no agent to write
// others, and lands on the document as it is, carried across every edit
// since by the shell, so changes written before your edits are marked; a
// round stopped before then, staged again, lands nothing. A request on no
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
  const shell: _Shell_ = new _Shell_({
    tasks: new _Tasks_({
      model_Tasks: seed.model_Tasks,
      observers: []
    }),
    documents,
    name_Document,
    files,
    target_Mode: {
      kind: "TASK",
      id: about_Task.id
    },
    references: seed.references,
    contents: new Map([
      [
        about_Task.id,
        seed.content_Own
      ]
    ]),
    observers: [
      {
        shown: (shown_Shell) => {
          editor.update(shown_Shell.update_Host)
          board.update(shown_Shell.update_Board)
        },
        started: (round_Shell) => {
          const isOwn = round_Shell.id_Task === about_Task.id
          if (isOwn) {
            log({
              revising: [
                ...round_Shell.sources,
                ...round_Shell.requests.some((request) => request.aim.kind === "DOCUMENT") ? ["document"] : [],
                ...round_Shell.requests.some((request) => request.aim.kind === "TASK") ? ["task"] : []
              ].join(", "),
              requests: round_Shell.requests.length
            })
          }
          if (round_Shell.requests.length === 0) return
          setTimeout(
            () => {
              const answer_Landing = shell.landed({
                round_Shell,
                proposed: round_Shell.proposed
              })
              if (!isOwn || answer_Landing.sources.length + answer_Landing.ids_Addressed.length === 0) return
              log({
                revised: [
                  ...answer_Landing.sources,
                  ...answer_Landing.ids_Addressed.length === 0 ? [] : ["document"]
                ].join(", ")
              })
            },
            isOwn ? 1600 : 1500
          )
        },
        stopped: (stop_Shell) => {
          if (stop_Shell.id_Task !== about_Task.id) return
          log({
            stopped: stop_Shell.scope_Work.kind,
            requests: stop_Shell.ids_Request.length
          })
        }
      }
    ]
  })
  const shown_Shell = shell.shown()
  const editor: _TextEditor_<State> = new _TextEditor_({
    containerElement,
    setup,
    model_TextEditor,
    name_Document,
    proposals: shown_Shell.update_Host.proposals,
    mode: shown_Shell.update_Host.mode,
    tasks: shown_Shell.update_Host.tasks,
    files,
    rounds_Landed: shown_Shell.update_Host.rounds_Landed,
    source_Yours: PROPOSAL_YOURS.source,
    ranges_Frame,
    observers: [
      {
        applied: (applied_Edit) => {
          shell.edited(applied_Edit)
          log({
            edited: applied_Edit.request_Edit.kind,
            proposals: applied_Edit.sources_Changed.join(", "),
            document: applied_Edit.isChanged_Document
          })
        },
        asked: (asked_Host) => {
          logged__Asked_Host({
            asked_Host,
            shell,
            id_Task_Own: about_Task.id,
            containerElement_Board,
            log
          })
          shell.asked(asked_Host)
        }
      }
    ]
  })
  const board: _Board_ = new _Board_({
    containerElement: containerElement_Board,
    componentMap: COMPONENTMAP__VIEW_BOARD,
    tasks: shown_Shell.update_Board.tasks,
    paths_Shown: shown_Shell.update_Board.paths_Shown,
    observers: [
      {
        asked: (asked_Board) => {
          log({
            board: asked_Board.kind,
            tasks: asked_Board.kind === "COLLECT" ? asked_Board.ids.join(", ") : asked_Board.kind === "NEW_TASK" ? null : asked_Board.id
          })
          shell.askedBoard(asked_Board)
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
  shell,
  id_Task_Own,
  containerElement_Board,
  log
}: _Api___logged__Asked_Host_<Kind>): void {
  const logged = logMap_Asked[asked_Host.kind]
  logged({
    asked_Host,
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
    shell,
    id_Task_Own,
    log
  }) => {
    const task = shell.taskIn()
    if (task === undefined || task.id === id_Task_Own) return
    log({
      started: asked_Host.scope.kind,
      task: task.id
    })
  },
  STOP: ({
    asked_Host,
    shell,
    id_Task_Own,
    log
  }) => {
    const task = shell.taskIn()
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
    shell,
    log
  }) => log({
    ended: asked_Host.end,
    task: shell.taskIn()?.id ?? null
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
    shell,
    log
  }) => {
    const task = shell.taskIn()
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
