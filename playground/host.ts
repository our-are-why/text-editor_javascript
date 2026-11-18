import { _TextEditor_, type _Setup_TextEditor_ } from "../source/TextEditor.ts"
import {
  type _Model_TextEditor_,
  type _Transaction_Model_,
  type _Change_,
  rebasedOf__Changes
} from "../source/Model_TextEditor.ts"
import type {
  _Proposal_Host_,
  _Landed_Round_,
  _Request_Host_
} from "../source/Projection_TextEditor.ts"
import type { _Scope_Start_ } from "../source/Viewer_TextEditor.ts"
import type {
  _Range_Lines_,
  _Decision_Proposal_,
  _Task_Header_
} from "../source/ViewModel_TextEditor.ts"
import type { _Entry_Log_ } from "./example.ts"
import { proposal_Yours, shownMap_State } from "./items.ts"

export {
  hostedOf__Editor
}

interface _Api___hostedOf__Editor_<State> {
  containerElement: HTMLElement
  setup: _Setup_TextEditor_<State>
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  rounds_Landed: Array<_Landed_Round_>
  label_Task: string
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
// A request for a change on no proposal, the document's own, about what's
// selected or the whole of it, queued with the rest, started with them, or
// at once when asked to, and done with a moment later, with no agent to
// answer it with proposals. Each reported as it's told
function hostedOf__Editor<State>({
  containerElement,
  setup,
  model_TextEditor,
  proposals,
  rounds_Landed,
  label_Task,
  ranges_Frame,
  log
}: _Api___hostedOf__Editor_<State>): _TextEditor_<State> {
  let model_Host = model_TextEditor
  let proposals_Host = proposals
  let rounds_Host = rounds_Landed
  let requests_Document: Array<_Request_Host_> = []
  let count_Request = 0
  let version = 0
  let timers_Round: Array<ReturnType<typeof setTimeout>> = []
  const transactions_Logged: Array<_Logged_Transaction_> = []
  const bases_Source = new Map<string, _Base_Run_>()
  const taskOf = () => taskOf__Proposals({
    proposals: proposals_Host,
    requests_Document,
    label_Task
  })
  const updated = () => editor.update({
    model_TextEditor: model_Host,
    proposals: proposals_Host,
    requests_Document,
    rounds_Landed: rounds_Host,
    task_Header: taskOf()
  })
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
  const started = (scope: _Scope_Start_) => {
    const ids_Started = proposals_Host.flatMap((proposal_Host) => proposal_Host.state !== "OPEN" || proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING")
      ? []
      : proposal_Host.requests
        .filter((request_Host) => request_Host.status === "QUEUED" && (scope.kind === "DOCUMENT" || (proposal_Host.source === scope.source && (scope.kind === "PROPOSAL" || request_Host.id === scope.id))))
        .map((request_Host) => request_Host.id))
    const ids_Document = requests_Document
      .filter((request_Host) => request_Host.status === "QUEUED" && (scope.kind === "DOCUMENT" || (scope.kind === "REQUEST" && scope.source === null && request_Host.id === scope.id)))
      .map((request_Host) => request_Host.id)
    const sources_Revising = proposals_Host
      .filter((proposal_Host) => proposal_Host.requests.some((request_Host) => ids_Started.includes(request_Host.id)))
      .map((proposal_Host) => proposal_Host.source)
    log({
      revising: [
        ...sources_Revising,
        ...ids_Document.length === 0 ? [] : ["document"]
      ].join(", "),
      requests: ids_Started.length + ids_Document.length
    })
    if (ids_Started.length + ids_Document.length === 0) return
    requests_Document = requests_Document.map((request_Host) => ids_Document.includes(request_Host.id)
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
    timers_Round.push(setTimeout(
      () => {
        proposals_Host = proposals_Host.map((proposal_Host) => ({
          ...proposal_Host,
          requests: proposal_Host.requests.filter((request_Host) => !ids_Started.includes(request_Host.id))
        }))
        requests_Document = requests_Document.filter((request_Host) => !ids_Document.includes(request_Host.id))
        for (const source of sources_Revising) landed(source)
        log({
          revised: [
            ...sources_Revising,
            ...ids_Document.length === 0 ? [] : ["document"]
          ].join(", ")
        })
        updated()
      },
      1600
    ))
  }
  const editor: _TextEditor_<State> = new _TextEditor_({
    containerElement,
    setup,
    model_TextEditor,
    proposals,
    requests_Document,
    rounds_Landed,
    task_Header: taskOf(),
    source_Yours: proposal_Yours.source,
    ranges_Frame,
    observers: [
      {
        applied: (applied_Edit) => {
          model_Host = applied_Edit.model_After
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
              aimed: asked_Host.selected?.text ?? null
            })
            count_Request += 1
            const id = `document-${count_Request}`
            requests_Document = [
              ...requests_Document,
              {
                id,
                notes: asked_Host.notes,
                selected: asked_Host.selected,
                status: "QUEUED"
              }
            ]
            if (asked_Host.isStarting) {
              started({
                kind: "REQUEST",
                source: null,
                id
              })
            }
          } else if (asked_Host.kind === "TASK") {
            log({
              task: asked_Host.command
            })
            for (const timer_Round of timers_Round) clearTimeout(timer_Round)
            timers_Round = []
            proposals_Host = proposals_Host.map((proposal_Host) => ({
              ...proposal_Host,
              requests: proposal_Host.requests.map((request_Host) => ({
                ...request_Host,
                status: "QUEUED"
              }))
            }))
            requests_Document = requests_Document.map((request_Host) => ({
              ...request_Host,
              status: "QUEUED"
            }))
          } else if (asked_Host.kind === "START") {
            started(asked_Host.scope)
          } else if (asked_Host.kind === "RERUN") {
            const source = asked_Host.source
            const requests_Base = bases_Source.get(source)?.requests ?? []
            const requests_Again: Array<_Request_Host_> = requests_Base.length > 0
              ? requests_Base
              : [
                {
                  id: `${source}-again`,
                  notes: "Again, on the document as it is now.",
                  selected: null,
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
            if (asked_Remove.source === null) requests_Document = requests_Document.filter((request_Host) => request_Host.id !== asked_Remove.id)
          } else {
            const asked_Action = asked_Host
            log({
              asked: asked_Action.command,
              proposal: asked_Action.source,
              notes: asked_Action.notes,
              words: asked_Action.selected?.text ?? null
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
                      selected: asked_Action.selected,
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
  return editor
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
  proposals: Array<_Proposal_Host_>
  requests_Document: Array<_Request_Host_>
  label_Task: string
}

// the task the playground says it's on, in the editor's header: its name,
// working while a round's under way, its proposals' or the document's own,
// Stop offered then
function taskOf__Proposals({
  proposals,
  requests_Document,
  label_Task
}: _Api___taskOf__Proposals_): _Task_Header_ {
  const isBusy = [
    ...proposals.flatMap((proposal_Host) => proposal_Host.requests),
    ...requests_Document
  ].some((request_Host) => request_Host.status === "RUNNING")
  return {
    label: label_Task,
    status: isBusy ? "working" : "",
    isBusy,
    actions: isBusy
      ? [
        {
          command: "stop",
          label: "Stop"
        }
      ]
      : []
  }
}
