import {
  pathsOf__Task,
  type _Task_Tasks_,
  type _Request_Tasks_,
  type _Proposal_Tasks_
} from "../tasks/index.ts"

export {
  briefOf__Job,
  type _Api___briefOf__Job_,
  type _Brief_Job_,
  type _Task_Brief_
}

interface _Api___briefOf__Job_ {
  task: _Task_Tasks_
  ids_Request: Array<string>
}

interface _Brief_Job_ {
  task: _Task_Brief_
  requests: Array<_Request_Tasks_>
  requests_Other: Array<_Request_Tasks_>
  proposals: Array<_Proposal_Tasks_>
  files: Array<string>
}

interface _Task_Brief_ {
  id: string
  name: string
  summary: string
}

function briefOf__Job({
  task,
  ids_Request
}: _Api___briefOf__Job_): _Brief_Job_ {
  return {
    task: {
      id: task.id,
      name: task.name,
      summary: task.summary
    },
    requests: task.requests.filter((request) => ids_Request.includes(request.id)),
    requests_Other: task.requests.filter((request) => !ids_Request.includes(request.id) && request.status.kind !== "ADDRESSED"),
    proposals: task.proposals,
    files: pathsOf__Task({
      task
    })
  }
}
