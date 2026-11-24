export {
  modelAfter__Command,
  type _Api___modelAfter__Command_,
  type _Model_Tasks_,
  type _Task_Tasks_,
  type __BASE_Task_Tasks_,
  type _OPEN_Task_Tasks_,
  type _RESOLVED_Task_Tasks_,
  type _Stamp_Tasks_,
  type _Author_Tasks_,
  type _Summary_Document_,
  type _Request_Tasks_,
  type _Aim_Request_Tasks_,
  type __BASE_Aim_Request_Tasks_,
  type _TASK_Aim_Request_Tasks_,
  type _DOCUMENT_Aim_Request_Tasks_,
  type _PROPOSAL_Aim_Request_Tasks_,
  type _Words_Aim_,
  type __BASE_Words_Aim_,
  type _ALL_Words_Aim_,
  type _QUOTED_Words_Aim_,
  type _Status_Request_Tasks_,
  type __BASE_Status_Request_Tasks_,
  type _QUEUED_Status_Request_Tasks_,
  type _STARTED_Status_Request_Tasks_,
  type _ADDRESSED_Status_Request_Tasks_,
  type _Answer_Request_,
  type __BASE_Answer_Request_,
  type _PROPOSALS_Answer_Request_,
  type _NOTHING_Answer_Request_,
  type _Proposal_Tasks_,
  type _Decision_Proposal_Tasks_,
  type _Start_Task_,
  type __BASE_Start_Task_,
  type _UNSTARTED_Start_Task_,
  type _STARTED_Start_Task_,
  type _Resolution_Task_,
  type _How_Resolution_,
  type _Command_Tasks_,
  type __BASE_Command_Tasks_,
  type _DRAFT_Command_Tasks_,
  type _Asked_Request_,
  type _REQUEST_Command_Tasks_,
  type _EDIT_Command_Tasks_,
  type _REMOVE_Command_Tasks_,
  type _DISMISS_Command_Tasks_,
  type _START_Command_Tasks_,
  type _Scope_Tasks_,
  type __BASE_Scope_Tasks_,
  type _TASK_Scope_Tasks_,
  type _DOCUMENT_Scope_Tasks_,
  type _PROPOSALS_Scope_Tasks_,
  type _REQUESTS_Scope_Tasks_,
  type _STOP_Command_Tasks_,
  type _PROPOSE_Command_Tasks_,
  type _Asked_Proposal_,
  type _ADDRESS_Command_Tasks_,
  type _DECIDE_Command_Tasks_,
  type _RENAME_Command_Tasks_,
  type _SUMMARIZE_Command_Tasks_,
  type _APPLY_Command_Tasks_,
  type _CANCEL_Command_Tasks_,
  type _DISCARD_Command_Tasks_,
  type _COLLECT_Command_Tasks_,
  type _HandlerMap__Tasks_,
  HANDLERMAP__TASKS,
  stateOf__Task,
  type _Api___stateOf__Task_,
  type _State_Task_Tasks_,
  countsOf__Task,
  type _Api___countsOf__Task_,
  type _Counts_Task_Tasks_,
  pathsOf__Task,
  type _Api___pathsOf__Task_
}

interface _Api___modelAfter__Command_<Kind extends _Command_Tasks_["kind"]> {
  model_Tasks: _Model_Tasks_
  command: Extract<
    _Command_Tasks_,
    __BASE_Command_Tasks_<Kind>
  >
}

function modelAfter__Command<Kind extends _Command_Tasks_["kind"]>({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<Kind>): _Model_Tasks_ {
  const handle = HANDLERMAP__TASKS[command.kind]
  return handle({
    model_Tasks,
    command
  })
}

interface _Model_Tasks_ {
  tasks: Array<_Task_Tasks_>
}

type _Task_Tasks_ = _OPEN_Task_Tasks_ | _RESOLVED_Task_Tasks_

interface __BASE_Task_Tasks_<Kind extends string> {
  kind: Kind
  id: string
  name: string
  made: _Stamp_Tasks_
  summary: string
  summaries_Document: Array<_Summary_Document_>
  requests: Array<_Request_Tasks_>
  proposals: Array<_Proposal_Tasks_>
  start: _Start_Task_
}

interface _OPEN_Task_Tasks_ extends __BASE_Task_Tasks_<"OPEN"> {}

interface _RESOLVED_Task_Tasks_ extends __BASE_Task_Tasks_<"RESOLVED"> {
  resolution: _Resolution_Task_
}

interface _Stamp_Tasks_ {
  at: string
  by: _Author_Tasks_
}

type _Author_Tasks_ = "HUMAN" | "AGENT"

interface _Summary_Document_ {
  path: string
  summary: string
}

interface _Request_Tasks_ {
  id: string
  notes: string
  made: _Stamp_Tasks_
  aim: _Aim_Request_Tasks_
  status: _Status_Request_Tasks_
}

type _Aim_Request_Tasks_ = _TASK_Aim_Request_Tasks_ | _DOCUMENT_Aim_Request_Tasks_ | _PROPOSAL_Aim_Request_Tasks_

interface __BASE_Aim_Request_Tasks_<Kind extends string> {
  kind: Kind
  words: _Words_Aim_
}

interface _TASK_Aim_Request_Tasks_ extends __BASE_Aim_Request_Tasks_<"TASK"> {}

interface _DOCUMENT_Aim_Request_Tasks_ extends __BASE_Aim_Request_Tasks_<"DOCUMENT"> {
  path: string
}

interface _PROPOSAL_Aim_Request_Tasks_ extends __BASE_Aim_Request_Tasks_<"PROPOSAL"> {
  id_Proposal: string
}

type _Words_Aim_ = _ALL_Words_Aim_ | _QUOTED_Words_Aim_

interface __BASE_Words_Aim_<Kind extends string> {
  kind: Kind
}

interface _ALL_Words_Aim_ extends __BASE_Words_Aim_<"ALL"> {}

interface _QUOTED_Words_Aim_ extends __BASE_Words_Aim_<"QUOTED"> {
  text: string
}

type _Status_Request_Tasks_ = _QUEUED_Status_Request_Tasks_ | _STARTED_Status_Request_Tasks_ | _ADDRESSED_Status_Request_Tasks_

interface __BASE_Status_Request_Tasks_<Kind extends string> {
  kind: Kind
}

interface _QUEUED_Status_Request_Tasks_ extends __BASE_Status_Request_Tasks_<"QUEUED"> {}

interface _STARTED_Status_Request_Tasks_ extends __BASE_Status_Request_Tasks_<"STARTED"> {
  stamp: _Stamp_Tasks_
}

interface _ADDRESSED_Status_Request_Tasks_ extends __BASE_Status_Request_Tasks_<"ADDRESSED"> {
  answer: _Answer_Request_
}

type _Answer_Request_ = _PROPOSALS_Answer_Request_ | _NOTHING_Answer_Request_

interface __BASE_Answer_Request_<Kind extends string> {
  kind: Kind
}

interface _PROPOSALS_Answer_Request_ extends __BASE_Answer_Request_<"PROPOSALS"> {
  ids_Proposal: Array<string>
}

interface _NOTHING_Answer_Request_ extends __BASE_Answer_Request_<"NOTHING"> {
  note: string
}

interface _Proposal_Tasks_ {
  id: string
  path: string
  title: string
  rationale: string
  made: _Stamp_Tasks_
  decision: _Decision_Proposal_Tasks_
}

type _Decision_Proposal_Tasks_ = "OPEN" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"

type _Start_Task_ = _UNSTARTED_Start_Task_ | _STARTED_Start_Task_

interface __BASE_Start_Task_<Kind extends string> {
  kind: Kind
}

interface _UNSTARTED_Start_Task_ extends __BASE_Start_Task_<"UNSTARTED"> {}

interface _STARTED_Start_Task_ extends __BASE_Start_Task_<"STARTED"> {
  stamp: _Stamp_Tasks_
}

interface _Resolution_Task_ {
  how: _How_Resolution_
  stamp: _Stamp_Tasks_
}

type _How_Resolution_ = "APPLIED" | "CANCELED" | "DISCARDED"

type _Command_Tasks_ = _DRAFT_Command_Tasks_ | _REQUEST_Command_Tasks_ | _EDIT_Command_Tasks_ | _REMOVE_Command_Tasks_ | _DISMISS_Command_Tasks_ | _START_Command_Tasks_ | _STOP_Command_Tasks_ | _PROPOSE_Command_Tasks_ | _ADDRESS_Command_Tasks_ | _DECIDE_Command_Tasks_ | _RENAME_Command_Tasks_ | _SUMMARIZE_Command_Tasks_ | _APPLY_Command_Tasks_ | _CANCEL_Command_Tasks_ | _DISCARD_Command_Tasks_ | _COLLECT_Command_Tasks_

interface __BASE_Command_Tasks_<Kind extends string> {
  kind: Kind
}

interface _DRAFT_Command_Tasks_ extends __BASE_Command_Tasks_<"DRAFT"> {
  id_Task: string
  name: string
  request: _Asked_Request_
  stamp: _Stamp_Tasks_
}

interface _Asked_Request_ {
  id: string
  notes: string
  aim: _Aim_Request_Tasks_
}

interface _REQUEST_Command_Tasks_ extends __BASE_Command_Tasks_<"REQUEST"> {
  id_Task: string
  request: _Asked_Request_
  stamp: _Stamp_Tasks_
}

interface _EDIT_Command_Tasks_ extends __BASE_Command_Tasks_<"EDIT"> {
  id_Task: string
  id_Request: string
  notes: string
}

interface _REMOVE_Command_Tasks_ extends __BASE_Command_Tasks_<"REMOVE"> {
  id_Task: string
  id_Request: string
}

interface _DISMISS_Command_Tasks_ extends __BASE_Command_Tasks_<"DISMISS"> {
  id_Task: string
  id_Request: string
}

interface _START_Command_Tasks_ extends __BASE_Command_Tasks_<"START"> {
  id_Task: string
  scope: _Scope_Tasks_
  stamp: _Stamp_Tasks_
}

type _Scope_Tasks_ = _TASK_Scope_Tasks_ | _DOCUMENT_Scope_Tasks_ | _PROPOSALS_Scope_Tasks_ | _REQUESTS_Scope_Tasks_

interface __BASE_Scope_Tasks_<Kind extends string> {
  kind: Kind
}

interface _TASK_Scope_Tasks_ extends __BASE_Scope_Tasks_<"TASK"> {}

interface _DOCUMENT_Scope_Tasks_ extends __BASE_Scope_Tasks_<"DOCUMENT"> {
  path: string
}

interface _PROPOSALS_Scope_Tasks_ extends __BASE_Scope_Tasks_<"PROPOSALS"> {
  ids_Proposal: Array<string>
}

interface _REQUESTS_Scope_Tasks_ extends __BASE_Scope_Tasks_<"REQUESTS"> {
  ids_Request: Array<string>
}

interface _STOP_Command_Tasks_ extends __BASE_Command_Tasks_<"STOP"> {
  id_Task: string
  scope: _Scope_Tasks_
}

interface _PROPOSE_Command_Tasks_ extends __BASE_Command_Tasks_<"PROPOSE"> {
  id_Task: string
  proposal: _Asked_Proposal_
  stamp: _Stamp_Tasks_
}

interface _Asked_Proposal_ {
  id: string
  path: string
  title: string
  rationale: string
}

interface _ADDRESS_Command_Tasks_ extends __BASE_Command_Tasks_<"ADDRESS"> {
  id_Task: string
  ids_Request: Array<string>
  answer: _Answer_Request_
}

interface _DECIDE_Command_Tasks_ extends __BASE_Command_Tasks_<"DECIDE"> {
  id_Task: string
  id_Proposal: string
  decision: _Decision_Proposal_Tasks_
}

interface _RENAME_Command_Tasks_ extends __BASE_Command_Tasks_<"RENAME"> {
  id_Task: string
  name: string
}

interface _SUMMARIZE_Command_Tasks_ extends __BASE_Command_Tasks_<"SUMMARIZE"> {
  id_Task: string
  summary: string
  summaries_Document: Array<_Summary_Document_>
}

interface _APPLY_Command_Tasks_ extends __BASE_Command_Tasks_<"APPLY"> {
  id_Task: string
  stamp: _Stamp_Tasks_
}

interface _CANCEL_Command_Tasks_ extends __BASE_Command_Tasks_<"CANCEL"> {
  id_Task: string
  stamp: _Stamp_Tasks_
}

interface _DISCARD_Command_Tasks_ extends __BASE_Command_Tasks_<"DISCARD"> {
  id_Task: string
  stamp: _Stamp_Tasks_
}

interface _COLLECT_Command_Tasks_ extends __BASE_Command_Tasks_<"COLLECT"> {
  ids_Task: Array<string>
}

type _HandlerMap__Tasks_ = {
  [Kind in _Command_Tasks_["kind"]]: (api_Handler: _Api___modelAfter__Command_<Kind>) => _Model_Tasks_
}

const HANDLERMAP__TASKS: _HandlerMap__Tasks_ = {
  DRAFT: DRAFT_modelAfter__Command,
  REQUEST: REQUEST_modelAfter__Command,
  EDIT: EDIT_modelAfter__Command,
  REMOVE: REMOVE_modelAfter__Command,
  DISMISS: DISMISS_modelAfter__Command,
  START: START_modelAfter__Command,
  STOP: STOP_modelAfter__Command,
  PROPOSE: PROPOSE_modelAfter__Command,
  ADDRESS: ADDRESS_modelAfter__Command,
  DECIDE: DECIDE_modelAfter__Command,
  RENAME: RENAME_modelAfter__Command,
  SUMMARIZE: SUMMARIZE_modelAfter__Command,
  APPLY: APPLY_modelAfter__Command,
  CANCEL: CANCEL_modelAfter__Command,
  DISCARD: DISCARD_modelAfter__Command,
  COLLECT: COLLECT_modelAfter__Command
}

function DRAFT_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"DRAFT">): _Model_Tasks_ {
  return model_Tasks.tasks.some((task) => task.id === command.id_Task)
    ? model_Tasks
    : {
      tasks: [
        ...model_Tasks.tasks,
        {
          kind: "OPEN",
          id: command.id_Task,
          name: command.name,
          made: command.stamp,
          summary: "",
          summaries_Document: [],
          requests: [
            requestOf__Asked({
              asked_Request: command.request,
              stamp: command.stamp
            })
          ],
          proposals: [],
          start: {
            kind: "UNSTARTED"
          }
        }
      ]
    }
}

interface _Api___requestOf__Asked_ {
  asked_Request: _Asked_Request_
  stamp: _Stamp_Tasks_
}

function requestOf__Asked({
  asked_Request,
  stamp
}: _Api___requestOf__Asked_): _Request_Tasks_ {
  return {
    id: asked_Request.id,
    notes: asked_Request.notes,
    made: stamp,
    aim: asked_Request.aim,
    status: {
      kind: "QUEUED"
    }
  }
}

function REQUEST_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"REQUEST">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.requests.some((request) => request.id === command.request.id)
      ? task
      : {
        ...task,
        requests: [
          ...task.requests,
          requestOf__Asked({
            asked_Request: command.request,
            stamp: command.stamp
          })
        ]
      }
  })
}

interface _Api___openChangedIn__Model_ {
  model_Tasks: _Model_Tasks_
  id_Task: string
  change: (task: _OPEN_Task_Tasks_) => _Task_Tasks_
}

function openChangedIn__Model({
  model_Tasks,
  id_Task,
  change
}: _Api___openChangedIn__Model_): _Model_Tasks_ {
  const tasks = model_Tasks.tasks.map((task) => task.id === id_Task && task.kind === "OPEN" ? change(task) : task)
  return tasks.every((
    task,
    index
  ) => task === model_Tasks.tasks[index])
    ? model_Tasks
    : {
      tasks
    }
}

function EDIT_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"EDIT">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => requestsChangedIn__Task({
      task,
      change: (request) => request.id === command.id_Request && request.status.kind === "QUEUED" && request.notes !== command.notes
        ? {
          ...request,
          notes: command.notes
        }
        : request
    })
  })
}

interface _Api___requestsChangedIn__Task_ {
  task: _OPEN_Task_Tasks_
  change: (request: _Request_Tasks_) => _Request_Tasks_
}

function requestsChangedIn__Task({
  task,
  change
}: _Api___requestsChangedIn__Task_): _OPEN_Task_Tasks_ {
  const requests = task.requests.map(change)
  return requests.every((
    request,
    index
  ) => request === task.requests[index])
    ? task
    : {
      ...task,
      requests
    }
}

function REMOVE_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"REMOVE">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.requests.some((request) => request.id === command.id_Request && request.status.kind === "QUEUED")
      ? {
        ...task,
        requests: task.requests.filter((request) => request.id !== command.id_Request)
      }
      : task
  })
}

function DISMISS_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"DISMISS">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.requests.some((request) => request.id === command.id_Request && request.status.kind === "ADDRESSED")
      ? {
        ...task,
        requests: task.requests.filter((request) => request.id !== command.id_Request)
      }
      : task
  })
}

function START_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"START">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => {
      const ids_Revising = idsOf__Proposals_Revising({
        task
      })
      const task_Started = requestsChangedIn__Task({
        task,
        change: (request) => request.status.kind !== "QUEUED" || !isInScope__Request({
          task,
          scope: command.scope,
          request
        }) || (request.aim.kind === "PROPOSAL" && ids_Revising.includes(request.aim.id_Proposal))
          ? request
          : {
            ...request,
            status: {
              kind: "STARTED",
              stamp: command.stamp
            }
          }
      })
      return task_Started === task || task_Started.start.kind === "STARTED"
        ? task_Started
        : {
          ...task_Started,
          start: {
            kind: "STARTED",
            stamp: command.stamp
          }
        }
    }
  })
}

interface _Api___idsOf__Proposals_Revising_ {
  task: _Task_Tasks_
}

function idsOf__Proposals_Revising({
  task
}: _Api___idsOf__Proposals_Revising_): Array<string> {
  return task.requests.flatMap((request) => request.status.kind === "STARTED" && request.aim.kind === "PROPOSAL" ? [request.aim.id_Proposal] : [])
}

interface _Api___isInScope__Request_<Kind extends _Scope_Tasks_["kind"]> {
  task: _Task_Tasks_
  scope: Extract<
    _Scope_Tasks_,
    __BASE_Scope_Tasks_<Kind>
  >
  request: _Request_Tasks_
}

function isInScope__Request<Kind extends _Scope_Tasks_["kind"]>({
  task,
  scope,
  request
}: _Api___isInScope__Request_<Kind>): boolean {
  const isInScope = INSCOPEMAP__KIND_SCOPE[scope.kind]
  return isInScope({
    task,
    scope,
    request
  })
}

type _InScopeMap__Kind_Scope_ = {
  [Kind in _Scope_Tasks_["kind"]]: (api_InScope: _Api___isInScope__Request_<Kind>) => boolean
}

const INSCOPEMAP__KIND_SCOPE: _InScopeMap__Kind_Scope_ = {
  TASK: () => true,
  DOCUMENT: ({
    task,
    scope,
    request
  }) => pathOf__Aim({
    task,
    aim: request.aim
  }) === scope.path,
  PROPOSALS: ({
    scope,
    request
  }) => request.aim.kind === "PROPOSAL" && scope.ids_Proposal.includes(request.aim.id_Proposal),
  REQUESTS: ({
    scope,
    request
  }) => scope.ids_Request.includes(request.id)
}

interface _Api___pathOf__Aim_ {
  task: _Task_Tasks_
  aim: _Aim_Request_Tasks_
}

function pathOf__Aim({
  task,
  aim
}: _Api___pathOf__Aim_): string {
  return aim.kind === "DOCUMENT"
    ? aim.path
    : aim.kind === "PROPOSAL"
      ? task.proposals.find((proposal) => proposal.id === aim.id_Proposal)?.path ?? ""
      : ""
}

function STOP_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"STOP">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => requestsChangedIn__Task({
      task,
      change: (request) => request.status.kind === "STARTED" && isInScope__Request({
        task,
        scope: command.scope,
        request
      })
        ? {
          ...request,
          status: {
            kind: "QUEUED"
          }
        }
        : request
    })
  })
}

function PROPOSE_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"PROPOSE">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.proposals.some((proposal) => proposal.id === command.proposal.id)
      ? {
        ...task,
        proposals: task.proposals.map((proposal) => proposal.id === command.proposal.id
          ? {
            ...proposal,
            path: command.proposal.path,
            title: command.proposal.title,
            rationale: command.proposal.rationale,
            decision: "OPEN"
          }
          : proposal)
      }
      : {
        ...task,
        proposals: [
          ...task.proposals,
          {
            id: command.proposal.id,
            path: command.proposal.path,
            title: command.proposal.title,
            rationale: command.proposal.rationale,
            made: command.stamp,
            decision: "OPEN"
          }
        ]
      }
  })
}

function ADDRESS_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"ADDRESS">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => requestsChangedIn__Task({
      task,
      change: (request) => request.status.kind === "STARTED" && command.ids_Request.includes(request.id)
        ? {
          ...request,
          status: {
            kind: "ADDRESSED",
            answer: command.answer
          }
        }
        : request
    })
  })
}

function DECIDE_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"DECIDE">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => {
      const proposal_Decided = task.proposals.find((proposal) => proposal.id === command.id_Proposal)
      return proposal_Decided === undefined || proposal_Decided.decision === command.decision
        ? task
        : {
          ...task,
          proposals: task.proposals.map((proposal) => proposal === proposal_Decided
            ? {
              ...proposal,
              decision: command.decision
            }
            : proposal),
          requests: command.decision === "OPEN"
            ? task.requests
            : task.requests.filter((request) => !(request.status.kind !== "ADDRESSED" && request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === command.id_Proposal))
        }
    }
  })
}

function RENAME_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"RENAME">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.name === command.name
      ? task
      : {
        ...task,
        name: command.name
      }
  })
}

function SUMMARIZE_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"SUMMARIZE">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => ({
      ...task,
      summary: command.summary,
      summaries_Document: command.summaries_Document
    })
  })
}

function APPLY_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"APPLY">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.requests.some((request) => request.status.kind === "STARTED")
      ? task
      : resolvedOf__Task({
        task,
        resolution: {
          how: "APPLIED",
          stamp: command.stamp
        }
      })
  })
}

interface _Api___resolvedOf__Task_ {
  task: _OPEN_Task_Tasks_
  resolution: _Resolution_Task_
}

function resolvedOf__Task({
  task,
  resolution
}: _Api___resolvedOf__Task_): _RESOLVED_Task_Tasks_ {
  return {
    ...task,
    kind: "RESOLVED",
    resolution
  }
}

function CANCEL_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"CANCEL">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.start.kind === "UNSTARTED"
      ? task
      : resolvedOf__Task({
        task: requestsChangedIn__Task({
          task,
          change: (request) => request.status.kind === "STARTED"
            ? {
              ...request,
              status: {
                kind: "QUEUED"
              }
            }
            : request
        }),
        resolution: {
          how: "CANCELED",
          stamp: command.stamp
        }
      })
  })
}

function DISCARD_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"DISCARD">): _Model_Tasks_ {
  return openChangedIn__Model({
    model_Tasks,
    id_Task: command.id_Task,
    change: (task) => task.start.kind === "STARTED"
      ? task
      : resolvedOf__Task({
        task,
        resolution: {
          how: "DISCARDED",
          stamp: command.stamp
        }
      })
  })
}

function COLLECT_modelAfter__Command({
  model_Tasks,
  command
}: _Api___modelAfter__Command_<"COLLECT">): _Model_Tasks_ {
  const tasks = model_Tasks.tasks.filter((task) => !(task.kind === "RESOLVED" && command.ids_Task.includes(task.id)))
  return tasks.length === model_Tasks.tasks.length
    ? model_Tasks
    : {
      tasks
    }
}

interface _Api___stateOf__Task_ {
  task: _Task_Tasks_
}

type _State_Task_Tasks_ = "DRAFT" | "WORKING" | "YOUR_TURN" | _How_Resolution_

function stateOf__Task({
  task
}: _Api___stateOf__Task_): _State_Task_Tasks_ {
  return task.kind === "RESOLVED"
    ? task.resolution.how
    : task.start.kind === "UNSTARTED"
      ? "DRAFT"
      : task.requests.some((request) => request.status.kind === "STARTED")
        ? "WORKING"
        : "YOUR_TURN"
}

interface _Api___countsOf__Task_ {
  task: _Task_Tasks_
}

interface _Counts_Task_Tasks_ {
  count_Undecided: number
  count_Queued: number
  count_Running: number
}

function countsOf__Task({
  task
}: _Api___countsOf__Task_): _Counts_Task_Tasks_ {
  return {
    count_Undecided: task.proposals.filter((proposal) => proposal.decision === "OPEN").length,
    count_Queued: task.requests.filter((request) => request.status.kind === "QUEUED").length,
    count_Running: task.requests.filter((request) => request.status.kind === "STARTED").length
  }
}

interface _Api___pathsOf__Task_ {
  task: _Task_Tasks_
}

function pathsOf__Task({
  task
}: _Api___pathsOf__Task_): Array<string> {
  return [
    ...new Set([
      ...task.proposals.map((proposal) => proposal.path),
      ...task.requests.flatMap((request) => request.aim.kind === "DOCUMENT" ? [request.aim.path] : []),
      ...task.summaries_Document.map((summary_Document) => summary_Document.path)
    ])
  ]
}
