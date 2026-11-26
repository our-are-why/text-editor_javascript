import {
  stateOf__Task,
  countsOf__Task,
  pathsOf__Task,
  type _Model_Tasks_,
  type _Task_Tasks_,
  type _Request_Tasks_,
  type _Proposal_Tasks_,
  type _Stamp_Tasks_,
  type _Words_Aim_,
  type _Status_Request_Tasks_,
  type _How_Resolution_,
  type _Scope_Tasks_
} from "../source/tasks/index.ts"
import type {
  _Proposal_Host_,
  _Landed_Round_,
  _Request_Task_,
  _Request_Host_,
  _Selected_Text_,
  _Attributes_Element_,
  _Standing_Task_,
  _Task_Host_,
  _Counts_Proposals_,
  _Counts_Requests_,
  _State_Proposal_,
  _State_Task_,
  _Scope_Work_
} from "../source/editor/index.ts"
import {
  type _Model_TextEditor_,
  type _Stale_Source_,
  versionOf__Text,
  type _Head_Document_
} from "../source/documents/index.ts"
import type { _Task_Board_ } from "../source/board/index.ts"
import { proposal_Yours, shownMap_State } from "./items.ts"

export {
  seededOf__Example,
  type _Api___seededOf__Example_,
  type _About_Task_,
  type _Elsewhere_Task_,
  type _Other_Task_,
  type _Resolved_Task_,
  type _Seed_Tasks_,
  type _Content_Task_,
  standingOf__Tasks,
  boardedOf__Tasks,
  proposalsHostOf__Task,
  taskHostOf__Task,
  waitingOf__Task,
  scopeOf__Work,
  roundsOf__Stale
}

interface _Api___seededOf__Example_ {
  name_Document: string
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  stale: Array<_Stale_Source_>
  about_Task: _About_Task_
  tasks_Other: Array<_Other_Task_>
  tasks_Resolved: Array<_Resolved_Task_>
  stamp: _Stamp_Tasks_
}

// what the playground says of the task it's on: its id, a counter, as a
// host keeps one, mechanical, so it stays put however its name and its
// scope change, its name saying what it's about; what the agent says of it
// and of this document; its own requests; and what it has on the documents
// it touches elsewhere, counted, as nothing of them is shown here
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

// one of the project's other tasks, as the example says it is: whether it's
// been started, what's asked of it on the document shown, on the words it
// was asked on, and what it has on other documents, counted
interface _Other_Task_ {
  id: string
  name: string
  isStarted: boolean
  requests: Array<_Request_Task_>
  documents_Elsewhere: Array<_Elsewhere_Task_>
}

// a task the project's resolved, applied, canceled or discarded, kept till
// it's collected
interface _Resolved_Task_ {
  id: string
  name: string
  state: _State_Task_
}

// the example's tasks as the tasks part holds them, and what's only the
// editor's of them, kept beside: the words each request was sent on, as the
// editor quotes them; and what only the editor draws of the task the
// playground's on
interface _Seed_Tasks_ {
  model_Tasks: _Model_Tasks_
  references: Map<string, _Selected_Text_ | null>
  content_Own: _Content_Task_
}

// what the task the playground's on, the one with proposals here, has on
// the document shown that only the editor draws: each proposal's
// attributes, and the proposals dismissed
interface _Content_Task_ {
  attributes: Map<string, _Attributes_Element_>
  sources_Dismissed: Set<string>
}

// the example's tasks as the tasks part holds them: the task the
// playground's on and each of the project's other tasks alike, what's asked
// of each here, and, of each document it has anything on elsewhere, as many
// proposals and requests as the example counts there, the task the
// playground's on alone with proposals here, its changes on the document
// shown its head there, stated against the document's version, what landed
// on it written before your edits stale; each resolved one, as it ended;
// and what only the editor draws of the task the playground's on
function seededOf__Example({
  name_Document,
  model_TextEditor,
  proposals,
  stale,
  about_Task,
  tasks_Other,
  tasks_Resolved,
  stamp
}: _Api___seededOf__Example_): _Seed_Tasks_ {
  const proposals_Own = proposals.filter((proposal_Host) => proposal_Host.source !== proposal_Yours.source)
  const version = versionOf__Text({
    text_Model: model_TextEditor.document
  })
  return {
    model_Tasks: {
      tasks: [
        taskOf__Content({
          id: about_Task.id,
          name: about_Task.name,
          summary: about_Task.summary,
          summary_Document: about_Task.summary_Document,
          isStarted: true,
          proposals: proposals_Own,
          requests: about_Task.requests,
          documents_Elsewhere: about_Task.documents_Elsewhere,
          heads: [
            {
              path: name_Document,
              version,
              proposed: model_TextEditor.proposed,
              stale
            }
          ],
          name_Document,
          stamp
        }),
        ...tasks_Other.map((task_Other) => taskOf__Content({
          id: task_Other.id,
          name: task_Other.name,
          summary: "",
          summary_Document: "",
          isStarted: task_Other.isStarted,
          proposals: [],
          requests: task_Other.requests,
          documents_Elsewhere: task_Other.documents_Elsewhere,
          heads: [],
          name_Document,
          stamp
        })),
        ...tasks_Resolved.map((task_Resolved) => taskOf__Resolved({
          task_Resolved,
          stamp
        }))
      ]
    },
    references: new Map([
      ...proposals_Own.flatMap((proposal_Host) => proposal_Host.requests.map((request_Host): [string, _Selected_Text_ | null] => [
        request_Host.id,
        request_Host.reference
      ])),
      ...[
        about_Task,
        ...tasks_Other
      ].flatMap((task_Seed) => task_Seed.requests.map((request_Task): [string, _Selected_Text_ | null] => [
        request_Task.id,
        request_Task.aim.reference
      ]))
    ]),
    content_Own: {
      attributes: new Map(proposals_Own.map((proposal_Host) => [
        proposal_Host.source,
        proposal_Host.attributes
      ])),
      sources_Dismissed: new Set<string>()
    }
  }
}

interface _Api___taskOf__Content_ {
  id: string
  name: string
  summary: string
  summary_Document: string
  isStarted: boolean
  proposals: Array<_Proposal_Host_>
  requests: Array<_Request_Task_>
  documents_Elsewhere: Array<_Elsewhere_Task_>
  heads: Array<_Head_Document_>
  name_Document: string
  stamp: _Stamp_Tasks_
}

// an open task as the tasks part holds it, from what the example says it
// has: its proposals here, each in its state, with what's asked of them;
// its own requests, on the document shown or the task, each where it
// stands; what the example counts it has elsewhere, made into as many
// proposals and requests; and its changes, its heads
function taskOf__Content({
  id,
  name,
  summary,
  summary_Document,
  isStarted,
  proposals,
  requests,
  documents_Elsewhere,
  heads,
  name_Document,
  stamp
}: _Api___taskOf__Content_): _Task_Tasks_ {
  const elsewhere = documents_Elsewhere.map((elsewhere_Task) => countedOn__Path({
    path: elsewhere_Task.name,
    counts_Proposals: elsewhere_Task.counts_Proposals,
    counts_Requests: elsewhere_Task.counts_Requests,
    stamp
  }))
  return {
    kind: "OPEN",
    id,
    name,
    made: stamp,
    summary,
    summaries_Document: summary_Document === ""
      ? []
      : [
        {
          path: name_Document,
          summary: summary_Document
        }
      ],
    requests: [
      ...proposals.flatMap((proposal_Host) => proposal_Host.requests.map((request_Host): _Request_Tasks_ => ({
        id: request_Host.id,
        notes: request_Host.notes,
        made: stamp,
        aim: {
          kind: "PROPOSAL",
          id_Proposal: proposal_Host.source,
          words: wordsOf__Reference({
            reference: request_Host.reference
          })
        },
        status: statusOf__Host({
          request_Host,
          sources_Answering: [],
          stamp
        })
      }))),
      ...requests.map((request_Task): _Request_Tasks_ => ({
        id: request_Task.id,
        notes: request_Task.notes,
        made: stamp,
        aim: request_Task.aim.kind === "TASK"
          ? {
            kind: "TASK",
            words: wordsOf__Reference({
              reference: request_Task.aim.reference
            })
          }
          : {
            kind: "DOCUMENT",
            path: name_Document,
            words: wordsOf__Reference({
              reference: request_Task.aim.reference
            })
          },
        status: statusOf__Host({
          request_Host: request_Task,
          sources_Answering: request_Task.sources_Answering,
          stamp
        })
      })),
      ...elsewhere.flatMap((counted) => counted.requests)
    ],
    proposals: [
      ...proposals.map((proposal_Host): _Proposal_Tasks_ => ({
        id: proposal_Host.source,
        path: name_Document,
        title: proposal_Host.title,
        rationale: proposal_Host.rationale,
        made: stamp,
        decision: proposal_Host.state
      })),
      ...elsewhere.flatMap((counted) => counted.proposals)
    ],
    heads,
    start: isStarted
      ? {
        kind: "STARTED",
        stamp
      }
      : {
        kind: "UNSTARTED"
      }
  }
}

interface _Api___wordsOf__Reference_ {
  reference: _Selected_Text_ | null
}

// the words a request was sent on, by their text, the editor's own of them
// kept beside; or all of what it's aimed at
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

interface _Api___statusOf__Host_ {
  request_Host: _Request_Host_ | _Request_Task_
  sources_Answering: Array<string>
  stamp: _Stamp_Tasks_
}

// where a request the editor's told of stands, as the tasks part holds it:
// running, started; addressed, by the proposals that answer it, or with
// nothing needing to change
function statusOf__Host({
  request_Host,
  sources_Answering,
  stamp
}: _Api___statusOf__Host_): _Status_Request_Tasks_ {
  return request_Host.status === "STAGED"
    ? {
      kind: "STAGED"
    }
    : request_Host.status === "RUNNING"
      ? {
        kind: "WITH_AGENT",
        stamp
      }
      : {
        kind: "ADDRESSED",
        answer: sources_Answering.length === 0
          ? {
            kind: "NOTHING",
            note: ""
          }
          : {
            kind: "PROPOSALS",
            ids_Proposal: sources_Answering
          }
      }
}

interface _Api___countedOn__Path_ {
  path: string
  counts_Proposals: _Counts_Proposals_
  counts_Requests: _Counts_Requests_
  stamp: _Stamp_Tasks_
}

interface _Counted_Path_ {
  proposals: Array<_Proposal_Tasks_>
  requests: Array<_Request_Tasks_>
}

// as many proposals and requests on a document not shown here as the
// example counts there, as it says nothing more of them: each proposal in
// its state, one with revisions asked of it a request staged on it, one
// being revised a request running on it, and the requests counted beyond
// those, the document's own
function countedOn__Path({
  path,
  counts_Proposals,
  counts_Requests,
  stamp
}: _Api___countedOn__Path_): _Counted_Path_ {
  const states: Array<_State_Proposal_> = [
    "OPEN",
    "REQUESTED",
    "REVISING",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN"
  ]
  const proposals = states.flatMap((state) => Array.from({ length: counts_Proposals[state] }, () => state)).map((
    state,
    index
  ) => ({
    state,
    proposal: {
      id: `${path} ${index + 1}`,
      path,
      title: `Proposal ${index + 1} in ${path}`,
      rationale: "",
      made: stamp,
      decision: state === "REQUESTED" || state === "REVISING" ? "OPEN" as const : state
    }
  }))
  const requests_Proposals = proposals.flatMap(({
    state,
    proposal
  }): Array<_Request_Tasks_> => state === "REQUESTED" || state === "REVISING"
    ? [
      {
        id: `${proposal.id} request`,
        notes: `A revision of ${proposal.title}`,
        made: stamp,
        aim: {
          kind: "PROPOSAL",
          id_Proposal: proposal.id,
          words: {
            kind: "ALL"
          }
        },
        status: state === "REVISING"
          ? {
            kind: "WITH_AGENT",
            stamp
          }
          : {
            kind: "STAGED"
          }
      }
    ]
    : [])
  const count_Staged = counts_Requests.STAGED - counts_Proposals.REQUESTED
  const count_Running = counts_Requests.RUNNING - counts_Proposals.REVISING
  const requests_Path = [
    ...Array.from({ length: Math.max(count_Staged, 0) }, () => "STAGED" as const),
    ...Array.from({ length: Math.max(count_Running, 0) }, () => "WITH_AGENT" as const)
  ].map((
    kind,
    index
  ): _Request_Tasks_ => ({
    id: `${path} request ${index + 1}`,
    notes: `Request ${index + 1} on ${path}`,
    made: stamp,
    aim: {
      kind: "DOCUMENT",
      path,
      words: {
        kind: "ALL"
      }
    },
    status: kind === "STAGED"
      ? {
        kind: "STAGED"
      }
      : {
        kind: "WITH_AGENT",
        stamp
      }
  }))
  return {
    proposals: proposals.map(({ proposal }) => proposal),
    requests: [
      ...requests_Proposals,
      ...requests_Path
    ]
  }
}

interface _Api___taskOf__Resolved_ {
  task_Resolved: _Resolved_Task_
  stamp: _Stamp_Tasks_
}

// a task the example says was resolved, as it ended, nothing more said of it
function taskOf__Resolved({
  task_Resolved,
  stamp
}: _Api___taskOf__Resolved_): _Task_Tasks_ {
  const how = howOf__State({
    state: task_Resolved.state
  })
  return {
    kind: "RESOLVED",
    id: task_Resolved.id,
    name: task_Resolved.name,
    made: stamp,
    summary: "",
    summaries_Document: [],
    requests: [],
    proposals: [],
    heads: [],
    start: how === "DISCARDED"
      ? {
        kind: "UNSTARTED"
      }
      : {
        kind: "STARTED",
        stamp
      },
    resolution: {
      how,
      stamp
    }
  }
}

interface _Api___howOf__State_ {
  state: _State_Task_
}

function howOf__State({
  state
}: _Api___howOf__State_): _How_Resolution_ {
  if (state === "APPLIED" || state === "CANCELED" || state === "DISCARDED") return state
  throw new Error(`a resolved task can't be ${state}`)
}

interface _Api___standingOf__Tasks_ {
  task: _Task_Tasks_
  name_Document: string
}

// a task as the editor's told of it, for its switcher and its footer: where
// it stands and how much of each part it has, its conflicts what carrying
// it across the document's edits found, and whether it touches the file
// shown
function standingOf__Tasks({
  task,
  name_Document
}: _Api___standingOf__Tasks_): _Standing_Task_ {
  const counts = countsOf__Task({
    task
  })
  return {
    id: task.id,
    name: task.name,
    state: stateOf__Task({
      task
    }),
    isOnDocument: pathsOf__Task({
      task
    }).includes(name_Document),
    count_Undecided: counts.count_Undecided,
    count_Conflicts: counts.count_Conflicts,
    count_Staged: counts.count_Staged,
    count_Running: counts.count_Running
  }
}

interface _Api___boardedOf__Tasks_ {
  task: _Task_Tasks_
  count_Editors: number
}

// a task as the board's told of it: where it stands, what it touches, and
// how many editors show it, the playground having one
function boardedOf__Tasks({
  task,
  count_Editors
}: _Api___boardedOf__Tasks_): _Task_Board_ {
  const counts = countsOf__Task({
    task
  })
  const isOpen = task.kind === "OPEN"
  return {
    id: task.id,
    name: task.name,
    state: stateOf__Task({
      task
    }),
    paths: isOpen
      ? pathsOf__Task({
        task
      })
      : [],
    count_Undecided: isOpen ? counts.count_Undecided : 0,
    count_Conflicts: isOpen ? counts.count_Conflicts : 0,
    count_Running: isOpen ? counts.count_Running : 0,
    count_Staged: isOpen ? counts.count_Staged : 0,
    count_Editors
  }
}

interface _Api___proposalsHostOf__Task_ {
  task: _Task_Tasks_
  content: _Content_Task_
  name_Document: string
  references: Map<string, _Selected_Text_ | null>
}

// the task's proposals on the file shown, as the editor draws them, your
// own edits first: each saying and offering what its decision does, with
// what's asked of it and not yet addressed, on the words it was asked on
function proposalsHostOf__Task({
  task,
  content,
  name_Document,
  references
}: _Api___proposalsHostOf__Task_): Array<_Proposal_Host_> {
  return [
    proposal_Yours,
    ...task.proposals
      .filter((proposal) => proposal.path === name_Document && !content.sources_Dismissed.has(proposal.id))
      .map((proposal) => ({
        source: proposal.id,
        title: proposal.title,
        state: proposal.decision,
        status: shownMap_State[proposal.decision].status,
        rationale: proposal.rationale,
        requests: task.requests.flatMap((request): Array<_Request_Host_> => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === proposal.id && request.status.kind !== "ADDRESSED"
          ? [
            {
              id: request.id,
              notes: request.notes,
              reference: references.get(request.id) ?? null,
              status: request.status.kind === "WITH_AGENT" ? "RUNNING" : "STAGED"
            }
          ]
          : []),
        actions: shownMap_State[proposal.decision].actions,
        attributes: content.attributes.get(proposal.id) ?? {}
      }))
  ]
}

interface _Api___taskHostOf__Task_ {
  task: _Task_Tasks_
  name_Document: string
  references: Map<string, _Selected_Text_ | null>
}

// a task as the editor's told it, the one it's in: where it stands, what
// the agent says of it and of the file shown; each file it touches, the
// file shown first, its proposals counted by where each stands, its
// requests by whether they've been started, and Accept all for those
// waiting on nothing but you; its own requests and the file's, on the words
// they were sent on; and Accept all for the task, and for the file shown
function taskHostOf__Task({
  task,
  name_Document,
  references
}: _Api___taskHostOf__Task_): _Task_Host_ {
  const paths = pathsOf__Task({
    task
  })
  const paths_Ordered = paths.includes(name_Document)
    ? [
      name_Document,
      ...paths.filter((path) => path !== name_Document)
    ]
    : paths
  const count_Waiting = (path: string) => waitingOf__Task({
    task,
    path
  }).length
  const count_Waiting_Task = paths.reduce((
    sum,
    path
  ) => sum + count_Waiting(path), 0)
  const count_Waiting_Here = count_Waiting(name_Document)
  return {
    id: task.id,
    name: task.name,
    state: stateOf__Task({
      task
    }),
    summary: task.summary,
    reason: "",
    documents: paths_Ordered.map((path) => ({
      name: path,
      counts_Proposals: countsOf__Proposals_Path({
        task,
        path
      }),
      counts_Requests: countsOf__Requests_Path({
        task,
        path
      }),
      isShown: path === name_Document,
      actions: count_Waiting(path) === 0
        ? []
        : [
          {
            command: path === name_Document ? "accept-here" : `accept-in:${path}`,
            label: `Accept all (${count_Waiting(path)})`,
            section: "PROPOSALS"
          }
        ]
    })),
    summary_Document: task.summaries_Document.find((summary_Document) => summary_Document.path === name_Document)?.summary ?? "",
    requests: task.requests.flatMap((request): Array<_Request_Task_> => request.aim.kind === "TASK" || (request.aim.kind === "DOCUMENT" && request.aim.path === name_Document)
      ? [
        {
          id: request.id,
          notes: request.notes,
          aim: {
            kind: request.aim.kind,
            reference: references.get(request.id) ?? null
          },
          status: request.status.kind === "STAGED" ? "STAGED" : request.status.kind === "WITH_AGENT" ? "RUNNING" : "ADDRESSED",
          sources_Answering: request.status.kind === "ADDRESSED" && request.status.answer.kind === "PROPOSALS" ? request.status.answer.ids_Proposal : []
        }
      ]
      : []),
    actions: count_Waiting_Task === 0
      ? []
      : [
        {
          command: "accept-task",
          label: `Accept all (${count_Waiting_Task})`,
          section: "PROPOSALS"
        }
      ],
    actions_Document: count_Waiting_Here === 0
      ? []
      : [
        {
          command: "accept-here",
          label: `Accept all (${count_Waiting_Here})`,
          section: "PROPOSALS"
        }
      ]
  }
}

interface _Api___waitingOf__Task_ {
  task: _Task_Tasks_
  path: string
}

// a task's proposals on a file waiting on nothing but you: open, nothing
// asked of them left to address
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

interface _Api___countsOf__Proposals_Path_ {
  task: _Task_Tasks_
  path: string
}

// a task's proposals on a file counted by where each stands: decided, by
// its decision; open, being revised while something asked of it runs,
// revision requested while something's staged on it, and to review
// otherwise
function countsOf__Proposals_Path({
  task,
  path
}: _Api___countsOf__Proposals_Path_): _Counts_Proposals_ {
  const states = task.proposals.filter((proposal) => proposal.path === path).map((proposal): _State_Proposal_ => {
    const statuses = task.requests.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === proposal.id ? [request.status.kind] : [])
    return proposal.decision !== "OPEN"
      ? proposal.decision
      : statuses.includes("WITH_AGENT")
        ? "REVISING"
        : statuses.includes("STAGED")
          ? "REQUESTED"
          : "OPEN"
  })
  const countOf = (state: _State_Proposal_) => states.filter((state_Each) => state_Each === state).length
  return {
    OPEN: countOf("OPEN"),
    REQUESTED: countOf("REQUESTED"),
    REVISING: countOf("REVISING"),
    ACCEPTED: countOf("ACCEPTED"),
    REJECTED: countOf("REJECTED"),
    WITHDRAWN: countOf("WITHDRAWN")
  }
}

interface _Api___countsOf__Requests_Path_ {
  task: _Task_Tasks_
  path: string
}

// a task's requests on a file, its own and its proposals' there, counted by
// whether they're waiting or started
function countsOf__Requests_Path({
  task,
  path
}: _Api___countsOf__Requests_Path_): _Counts_Requests_ {
  const requests_Path = task.requests.filter((request) => pathOf__Request({
    task,
    request
  }) === path)
  return {
    STAGED: requests_Path.filter((request) => request.status.kind === "STAGED").length,
    RUNNING: requests_Path.filter((request) => request.status.kind === "WITH_AGENT").length
  }
}

interface _Api___pathOf__Request_ {
  task: _Task_Tasks_
  request: _Request_Tasks_
}

function pathOf__Request({
  task,
  request
}: _Api___pathOf__Request_): string | null {
  const aim = request.aim
  return aim.kind === "DOCUMENT"
    ? aim.path
    : aim.kind === "PROPOSAL"
      ? task.proposals.find((proposal) => proposal.id === aim.id_Proposal)?.path ?? null
      : null
}

interface _Api___scopeOf__Work_<Kind extends _Scope_Work_["kind"]> {
  scope_Work: Extract<
    _Scope_Work_,
    {
      kind: Kind
    }
  >
  task: _Task_Tasks_
  name_Document: string
}

// what a Start or a Stop the editor asks for takes in, as the tasks part
// says it: a request alone; a proposal's, or a frame's, the proposals it
// lists; the file's own requests, or the task's own; everything on the
// file, its own and its proposals'; or everything in the task
function scopeOf__Work<Kind extends _Scope_Work_["kind"]>({
  scope_Work,
  task,
  name_Document
}: _Api___scopeOf__Work_<Kind>): _Scope_Tasks_ {
  const scopeOf = scopeMap_Work[scope_Work.kind]
  return scopeOf({
    scope_Work,
    task,
    name_Document
  })
}

type _ScopeMap__Kind_Work_ = {
  [Kind in _Scope_Work_["kind"]]: (api_Scope: _Api___scopeOf__Work_<Kind>) => _Scope_Tasks_
}

const scopeMap_Work: _ScopeMap__Kind_Work_ = {
  REQUEST: ({
    scope_Work
  }) => ({
    kind: "REQUESTS",
    ids_Request: [scope_Work.id]
  }),
  PROPOSAL: ({
    scope_Work
  }) => ({
    kind: "PROPOSALS",
    ids_Proposal: [scope_Work.source]
  }),
  FRAME: ({
    scope_Work
  }) => ({
    kind: "PROPOSALS",
    ids_Proposal: scope_Work.sources
  }),
  DOCUMENT_REQUESTS: ({
    task,
    name_Document
  }) => ({
    kind: "REQUESTS",
    ids_Request: task.requests.flatMap((request) => request.aim.kind === "DOCUMENT" && request.aim.path === name_Document ? [request.id] : [])
  }),
  DOCUMENT: ({
    name_Document
  }) => ({
    kind: "DOCUMENT",
    path: name_Document
  }),
  TASK_REQUESTS: ({
    task
  }) => ({
    kind: "REQUESTS",
    ids_Request: task.requests.flatMap((request) => request.aim.kind === "TASK" ? [request.id] : [])
  }),
  TASK: () => ({
    kind: "TASK"
  })
}

interface _Api___roundsOf__Stale_ {
  stale: Array<_Stale_Source_>
}

// what's stale of a task's changes as the editor marks it, a round's
// changes written before your edits: each with what it was written on, and
// how many were dropped
function roundsOf__Stale({
  stale
}: _Api___roundsOf__Stale_): Array<_Landed_Round_> {
  return stale.map((stale_Source) => ({
    source: stale_Source.source,
    changes_Stale: stale_Source.changes_Stale,
    count_Dropped: stale_Source.count_Dropped
  }))
}
