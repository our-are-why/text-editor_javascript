import type {
  _Task_Host_,
  _Request_Task_,
  _Counts_Proposals_,
  _State_Proposal_,
  _Counts_Requests_,
  _Proposal_Host_,
  _Request_Host_,
  _Attributes_Element_,
  _Decision_Proposal_,
  _Action_Item_,
  _Standing_Task_,
  _Landed_Round_,
  _Scope_Work_,
  __BASE_Scope_Work_
} from "../editor/index.ts"
import type { _Task_Board_ } from "../board/index.ts"
import {
  pathsOf__Task,
  stateOf__Task,
  countsOf__Task,
  type _Task_Tasks_,
  type _Request_Tasks_,
  type _Scope_Tasks_,
  type _Words_Aim_,
  type _Aim_Request_Tasks_
} from "../tasks/index.ts"
import type {
  _Stale_Source_,
  _Selected_Text_
} from "../documents/index.ts"
import { waitingOf__Task } from "../shell/index.ts"

export {
  taskHostOf__Task,
  type _Api___taskHostOf__Task_,
  referenceOf__Words,
  type _Api___referenceOf__Words_,
  countsOf__Proposals_Path,
  type _Api___countsOf__Proposals_Path_,
  countsOf__Requests_Path,
  type _Api___countsOf__Requests_Path_,
  pathOf__Request,
  type _Api___pathOf__Request_,
  proposalsHostOf__Task,
  type _Api___proposalsHostOf__Task_,
  type _Content_Task_,
  PROPOSAL_YOURS,
  SHOWNMAP_STATE,
  type _ShownMap__State_,
  type _Shown_State_,
  ACTIONS_REVIEW,
  ACTIONS_REOPEN,
  ACTIONS_DISMISS,
  standingOf__Tasks,
  type _Api___standingOf__Tasks_,
  boardedOf__Tasks,
  type _Api___boardedOf__Tasks_,
  roundsOf__Stale,
  type _Api___roundsOf__Stale_,
  scopeOf__Work,
  type _Api___scopeOf__Work_,
  type _ScopeMap__Kind_Work_,
  SCOPEMAP_WORK,
  aimOf__Reference,
  type _Api___aimOf__Reference_,
  wordsOf__Reference,
  type _Api___wordsOf__Reference_
}

interface _Api___taskHostOf__Task_ {
  task: _Task_Tasks_
  name_Document: string
}

function taskHostOf__Task({
  task,
  name_Document
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
  const count_Waiting_Task = paths.reduce(
    (
      sum,
      path
    ) => sum + count_Waiting(path),
    0
  )
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
            reference: referenceOf__Words({
              words: request.aim.words
            })
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

interface _Api___referenceOf__Words_ {
  words: _Words_Aim_
}

function referenceOf__Words({
  words
}: _Api___referenceOf__Words_): _Selected_Text_ | null {
  return words.kind === "QUOTED"
    ? {
      pieces: words.pieces,
      text: words.text,
      side: words.side
    }
    : null
}

interface _Api___countsOf__Proposals_Path_ {
  task: _Task_Tasks_
  path: string
}

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

interface _Api___proposalsHostOf__Task_ {
  task: _Task_Tasks_
  content: _Content_Task_
  name_Document: string
}

function proposalsHostOf__Task({
  task,
  content,
  name_Document
}: _Api___proposalsHostOf__Task_): Array<_Proposal_Host_> {
  return [
    PROPOSAL_YOURS,
    ...task.proposals
      .filter((proposal) => proposal.path === name_Document && !content.sources_Dismissed.has(proposal.id))
      .map((proposal) => ({
        source: proposal.id,
        title: proposal.title,
        state: proposal.decision,
        status: SHOWNMAP_STATE[proposal.decision].status,
        rationale: proposal.rationale,
        requests: task.requests.flatMap((request): Array<_Request_Host_> => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === proposal.id && request.status.kind !== "ADDRESSED"
          ? [
            {
              id: request.id,
              notes: request.notes,
              reference: referenceOf__Words({
                words: request.aim.words
              }),
              status: request.status.kind === "WITH_AGENT" ? "RUNNING" : "STAGED"
            }
          ]
          : []),
        actions: SHOWNMAP_STATE[proposal.decision].actions,
        attributes: content.attributes.get(proposal.id) ?? {}
      }))
  ]
}

interface _Content_Task_ {
  attributes: Map<string, _Attributes_Element_>
  sources_Dismissed: Set<string>
}

const PROPOSAL_YOURS: _Proposal_Host_ = {
  source: "yours",
  title: "Your edits",
  state: "OPEN",
  status: "",
  rationale: "",
  requests: [],
  actions: [],
  attributes: {}
}

type _ShownMap__State_ = {
  [Decision in _Decision_Proposal_]: _Shown_State_
}

interface _Shown_State_ {
  status: string
  actions: Array<_Action_Item_>
}

const ACTIONS_REVIEW: Array<_Action_Item_> = [
  {
    command: "accept",
    label: "Accept",
    stateAfter: "ACCEPTED"
  },
  {
    command: "reject",
    label: "Reject",
    stateAfter: "REJECTED"
  },
  {
    command: "revise",
    label: "Revise",
    stateAfter: "REQUESTED"
  }
]

const ACTIONS_REOPEN: Array<_Action_Item_> = [
  {
    command: "reopen",
    label: "Reopen",
    stateAfter: "OPEN"
  }
]

const ACTIONS_DISMISS: Array<_Action_Item_> = [
  {
    command: "dismiss",
    label: "Dismiss",
    stateAfter: null
  }
]

const SHOWNMAP_STATE: _ShownMap__State_ = {
  OPEN: {
    status: "",
    actions: ACTIONS_REVIEW
  },
  ACCEPTED: {
    status: "Accepted",
    actions: ACTIONS_REOPEN
  },
  REJECTED: {
    status: "Rejected",
    actions: ACTIONS_REOPEN
  },
  WITHDRAWN: {
    status: "Withdrawn",
    actions: ACTIONS_DISMISS
  }
}

interface _Api___standingOf__Tasks_ {
  task: _Task_Tasks_
  name_Document: string
}

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

interface _Api___roundsOf__Stale_ {
  stale: Array<_Stale_Source_>
}

function roundsOf__Stale({
  stale
}: _Api___roundsOf__Stale_): Array<_Landed_Round_> {
  return stale.map((stale_Source) => ({
    source: stale_Source.source,
    changes_Stale: stale_Source.changes_Stale,
    count_Dropped: stale_Source.count_Dropped
  }))
}

interface _Api___scopeOf__Work_<Kind extends _Scope_Work_["kind"]> {
  scope_Work: Extract<
    _Scope_Work_,
    __BASE_Scope_Work_<Kind>
  >
  task: _Task_Tasks_
  name_Document: string
}

function scopeOf__Work<Kind extends _Scope_Work_["kind"]>({
  scope_Work,
  task,
  name_Document
}: _Api___scopeOf__Work_<Kind>): _Scope_Tasks_ {
  const scopeOf = SCOPEMAP_WORK[scope_Work.kind]
  return scopeOf({
    scope_Work,
    task,
    name_Document
  })
}

type _ScopeMap__Kind_Work_ = {
  [Kind in _Scope_Work_["kind"]]: (api_Scope: _Api___scopeOf__Work_<Kind>) => _Scope_Tasks_
}

const SCOPEMAP_WORK: _ScopeMap__Kind_Work_ = {
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

interface _Api___aimOf__Reference_ {
  kind: "TASK" | "DOCUMENT" | "PROPOSAL"
  reference: _Selected_Text_ | null
  path: string
}

function aimOf__Reference({
  kind,
  reference,
  path
}: _Api___aimOf__Reference_): _Aim_Request_Tasks_ {
  const words = wordsOf__Reference({
    reference
  })
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

interface _Api___wordsOf__Reference_ {
  reference: _Selected_Text_ | null
}

function wordsOf__Reference({
  reference
}: _Api___wordsOf__Reference_): _Words_Aim_ {
  return reference === null
    ? {
      kind: "ALL"
    }
    : {
      kind: "QUOTED",
      pieces: reference.pieces,
      text: reference.text,
      side: reference.side
    }
}
