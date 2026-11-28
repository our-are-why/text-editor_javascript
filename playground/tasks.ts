import type {
  _Model_Tasks_,
  _Task_Tasks_,
  _Request_Tasks_,
  _Proposal_Tasks_,
  _Stamp_Tasks_,
  _Status_Request_Tasks_,
  _How_Resolution_
} from "../source/core/tasks/index.ts"
import type {
  _Proposal_Host_,
  _Request_Task_,
  _Request_Host_,
  _Counts_Proposals_,
  _Counts_Requests_,
  _State_Proposal_,
  _State_Task_,
  _Attributes_Element_
} from "../source/ui/editor/index.ts"
import {
  type _Model_TextEditor_,
  type _Stale_Source_,
  versionOf__Text,
  type _Head_Document_
} from "../source/core/documents/index.ts"
import {
  PROPOSAL_YOURS,
  wordsOf__Reference
} from "../source/ui/host/index.ts"
import type {
  _Job_Shell_,
  _State_Job_
} from "../source/core/shell/index.ts"

export {
  seededOf__Example,
  type _Api___seededOf__Example_,
  type _About_Task_,
  type _Elsewhere_Task_,
  type _Other_Task_,
  type _Resolved_Task_,
  type _Seed_Tasks_,
  type _Seeded_Task_,
  type _Quiet_Seed_
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

// the example's tasks as the tasks part holds them, each request's words
// in it, where they were sent on; and, beside, what only the editor draws of
// the task the playground's on, each proposal's attributes
interface _Seed_Tasks_ {
  model_Tasks: _Model_Tasks_
  jobs: Array<_Job_Shell_>
  attributes_Own: Map<string, _Attributes_Element_>
}

// the example's tasks as the tasks part holds them: the task the
// playground's on and each of the project's other tasks alike, what's asked
// of each here, and, of each document it has anything on elsewhere, as many
// proposals and requests as the example counts there, the task the
// playground's on alone with proposals here, its changes on the document
// shown its head there, stated against the document's version, what landed
// on it written before your edits stale; each resolved one, as it ended;
// each request's words where it was sent on them, in the task; the jobs
// its requests with the agent are in where any of them wait, or have gone
// quiet, as below; and
// what only the editor draws of the task the playground's on, its
// proposals' attributes
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
  const proposals_Own = proposals.filter((proposal_Host) => proposal_Host.source !== PROPOSAL_YOURS.source)
  const version = versionOf__Text({
    text_Model: model_TextEditor.document
  })
  const seeded: Array<_Seeded_Task_> = [
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
    }))
  ]
  return {
    model_Tasks: {
      tasks: [
        ...seeded.map((seeded_Task) => seeded_Task.task),
        ...tasks_Resolved.map((task_Resolved) => taskOf__Resolved({
          task_Resolved,
          stamp
        }))
      ]
    },
    jobs: seeded.flatMap((seeded_Task) => jobsOf__Seed({
      seeded_Task,
      name_Document,
      version,
      at: Date.parse(stamp.at)
    })),
    attributes_Own: new Map(proposals_Own.map((proposal_Host) => [
      proposal_Host.source,
      proposal_Host.attributes
    ]))
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

interface _Seeded_Task_ {
  task: _Task_Tasks_
  ids_Waiting: Array<string>
  quiets: Array<_Quiet_Seed_>
}

interface _Quiet_Seed_ {
  id_Request: string
  minutes_Quiet: number
}

// an open task as the tasks part holds it, from what the example says it
// has: its proposals here, each in its state, with what's asked of them;
// its own requests, on the document shown or the task, each where it
// stands; what the example counts it has elsewhere, made into as many
// proposals and requests; and its changes, its heads; with which of its
// requests with the agent are waiting for one, and which have gone quiet,
// and how long since, for their jobs
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
}: _Api___taskOf__Content_): _Seeded_Task_ {
  const elsewhere = documents_Elsewhere.map((elsewhere_Task) => countedOn__Path({
    path: elsewhere_Task.name,
    counts_Proposals: elsewhere_Task.counts_Proposals,
    counts_Requests: elsewhere_Task.counts_Requests,
    stamp
  }))
  const requests_Said = [
    ...proposals.flatMap((proposal_Host) => proposal_Host.requests),
    ...requests
  ]
  const ids_Waiting = requests_Said.flatMap((request) => request.status === "WAITING" ? [request.id] : [])
  const task: _Task_Tasks_ = {
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
  return {
    task,
    ids_Waiting: [
      ...ids_Waiting,
      ...elsewhere.flatMap((counted) => counted.ids_Waiting)
    ],
    quiets: requests_Said.flatMap((request) => request.status === "QUIET"
      ? [
        {
          id_Request: request.id,
          minutes_Quiet: request.minutes_Quiet
        }
      ]
      : [])
  }
}

interface _Api___statusOf__Host_ {
  request_Host: _Request_Host_ | _Request_Task_
  sources_Answering: Array<string>
  stamp: _Stamp_Tasks_
}

// where a request the editor's told of stands, as the tasks part holds it:
// running, waiting for an agent, or gone quiet, with the agent, its job
// saying which;
// addressed, by the proposals that answer it, or with nothing needing to
// change
function statusOf__Host({
  request_Host,
  sources_Answering,
  stamp
}: _Api___statusOf__Host_): _Status_Request_Tasks_ {
  return request_Host.status === "STAGED"
    ? {
      kind: "STAGED"
    }
    : request_Host.status === "RUNNING" || request_Host.status === "WAITING" || request_Host.status === "QUIET"
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
  ids_Waiting: Array<string>
}

// as many proposals and requests on a document not shown here as the
// example counts there, as it says nothing more of them: each proposal in
// its state, one with revisions asked of it a request staged on it, one
// being revised a request running on it, and the requests counted beyond
// those, the document's own, those waiting for an agent last
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
    ...Array.from({ length: Math.max(count_Running, 0) }, () => "WITH_AGENT" as const),
    ...Array.from({ length: counts_Requests.WAITING }, () => "WITH_AGENT" as const)
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
    ],
    ids_Waiting: requests_Path.slice(requests_Path.length - counts_Requests.WAITING).map((request) => request.id)
  }
}

interface _Api___jobsOf__Seed_ {
  seeded_Task: _Seeded_Task_
  name_Document: string
  version: string
  at: number
}

// the jobs of a task the example seeds with requests waiting for an agent,
// or gone quiet: its running ones each a job of its own being worked on,
// never handed back, those gone quiet each one too, last heard of as many
// minutes ago as the example says, and those waiting one job queued behind
// them, so they wait, as they would behind an agent at work, till those
// are stopped; a task with none waiting or quiet none, its running requests
// jobless, as a seed's always were, so what's started in it runs at once,
// as it did
function jobsOf__Seed({
  seeded_Task,
  name_Document,
  version,
  at
}: _Api___jobsOf__Seed_): Array<_Job_Shell_> {
  const task = seeded_Task.task
  const ids_Waiting = seeded_Task.ids_Waiting
  if (ids_Waiting.length + seeded_Task.quiets.length === 0) return []
  const requests_With = task.requests.filter((request) => request.status.kind === "WITH_AGENT")
  const requests_Waiting = requests_With.filter((request) => ids_Waiting.includes(request.id))
  const heardOf = (id_Request: string) => at - (seeded_Task.quiets.find((quiet) => quiet.id_Request === id_Request)?.minutes_Quiet ?? 0) * 60_000
  return [
    ...requests_With
      .filter((request) => !ids_Waiting.includes(request.id))
      .map((request) => jobOf__Seed({
        id: `j-seed ${request.id}`,
        task,
        requests: [request],
        name_Document,
        version,
        at,
        state: {
          kind: "BEING_WORKED_ON",
          taken: heardOf(request.id),
          heard: heardOf(request.id),
          note: ""
        }
      })),
    ...requests_Waiting.length === 0 ? [] : [jobOf__Seed({
      id: `j-seed ${task.id} waiting`,
      task,
      requests: requests_Waiting,
      name_Document,
      version,
      at,
      state: {
        kind: "QUEUED"
      }
    })]
  ]
}

interface _Api___jobOf__Seed_ {
  id: string
  task: _Task_Tasks_
  requests: Array<_Request_Tasks_>
  name_Document: string
  version: string
  at: number
  state: _State_Job_
}

// a job a seed starts with, as a Start would have made it: the requests it
// started, the proposals they revise, and what those propose here
function jobOf__Seed({
  id,
  task,
  requests,
  name_Document,
  version,
  at,
  state
}: _Api___jobOf__Seed_): _Job_Shell_ {
  const sources = requests.flatMap((request) => request.aim.kind === "PROPOSAL" ? [request.aim.id_Proposal] : [])
  return {
    id,
    id_Task: task.id,
    scope: {
      kind: "REQUESTS",
      ids_Request: requests.map((request) => request.id)
    },
    requests,
    sources,
    path: name_Document,
    version,
    proposed: (task.heads.find((head) => head.path === name_Document)?.proposed ?? []).filter((changes_Source) => sources.includes(changes_Source.source)),
    queued: at,
    state
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
