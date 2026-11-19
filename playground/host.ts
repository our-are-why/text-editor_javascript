import { _TextEditor_, type _Setup_TextEditor_ } from "../source/TextEditor.ts"
import {
  type _Model_TextEditor_,
  type _Transaction_Model_,
  type _Change_,
  rebasedOf__Changes
} from "../source/Model_TextEditor.ts"
import type {
  _Proposal_Host_,
  _Task_Host_,
  _Request_Task_,
  _Counts_Proposals_,
  _Counts_Requests_,
  _Landed_Round_,
  _Request_Host_
} from "../source/Projection_TextEditor.ts"
import type { _Scope_Work_ } from "../source/Viewer_TextEditor.ts"
import type {
  _Range_Lines_,
  _Decision_Proposal_,
  _State_Proposal_,
  _State_Task_
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
  name_Document: string
  proposals: Array<_Proposal_Host_>
  rounds_Landed: Array<_Landed_Round_>
  about_Task: _About_Task_
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
  documents_Elsewhere: Array<_Elsewhere_Task_>
}

interface _Elsewhere_Task_ {
  name: string
  counts_Proposals: _Counts_Proposals_
  counts_Requests: _Counts_Requests_
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
  name_Document,
  proposals,
  rounds_Landed,
  about_Task,
  ranges_Frame,
  log
}: _Api___hostedOf__Editor_<State>): _TextEditor_<State> {
  let model_Host = model_TextEditor
  let proposals_Host = proposals
  let rounds_Host = rounds_Landed
  let requests_Task: Array<_Request_Task_> = []
  let count_Request = 0
  let version = 0
  let count_Round = 0
  const rounds_Request = new Map<string, number>()
  const transactions_Logged: Array<_Logged_Transaction_> = []
  const bases_Source = new Map<string, _Base_Run_>()
  let documents_Elsewhere = about_Task.documents_Elsewhere
  const taskOf = () => taskOf__Proposals({
    model_TextEditor: model_Host,
    name_Document,
    proposals: proposals_Host,
    requests_Task,
    about_Task,
    documents_Elsewhere
  })
  const updated = () => editor.update({
    model_TextEditor: model_Host,
    name_Document,
    proposals: proposals_Host,
    task: taskOf(),
    rounds_Landed: rounds_Host
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
    task: taskOf(),
    rounds_Landed,
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
              aimed: asked_Host.aim.kind === "SELECTION" ? asked_Host.aim.selected.text : null
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
          } else if (asked_Host.kind === "START") {
            started(asked_Host.scope)
          } else if (asked_Host.kind === "STOP") {
            stopped(asked_Host.scope)
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
