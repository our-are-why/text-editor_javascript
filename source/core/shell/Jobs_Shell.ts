import type {
  _Scope_Tasks_,
  _Request_Tasks_
} from "../tasks/index.ts"
import type { _Changes_Source_ } from "../documents/index.ts"

export {
  jobsAfter__Command,
  type _Api___jobsAfter__Command_,
  type _Job_Shell_,
  type _State_Job_,
  type __BASE_State_Job_,
  type _QUEUED_State_Job_,
  type _BEING_WORKED_ON__State_Job_,
  type _DONE_State_Job_,
  type _CANCELLED_State_Job_,
  type _Command_Jobs_,
  type __BASE_Command_Jobs_,
  type _QUEUE_Command_Jobs_,
  type _TAKE_Command_Jobs_,
  type _CHECK_IN__Command_Jobs_,
  type _HAND_BACK__Command_Jobs_,
  type _CANCEL_Command_Jobs_,
  type _HandlerMap__Jobs_,
  HANDLERMAP__JOBS,
  jobChangedIn__Jobs,
  type _Api___jobChangedIn__Jobs_,
  isTakeable__Job,
  type _Api___isTakeable__Job_,
  isLive__Job,
  type _Api___isLive__Job_,
  jobOf__Request,
  type _Api___jobOf__Request_
}

interface _Api___jobsAfter__Command_<Kind extends _Command_Jobs_["kind"]> {
  jobs: Array<_Job_Shell_>
  command: Extract<
    _Command_Jobs_,
    __BASE_Command_Jobs_<Kind>
  >
}

function jobsAfter__Command<Kind extends _Command_Jobs_["kind"]>({
  jobs,
  command
}: _Api___jobsAfter__Command_<Kind>): Array<_Job_Shell_> {
  const handle = HANDLERMAP__JOBS[command.kind]
  return handle({
    jobs,
    command
  })
}

interface _Job_Shell_ {
  id: string
  id_Task: string
  scope: _Scope_Tasks_
  requests: Array<_Request_Tasks_>
  sources: Array<string>
  path: string
  version: string
  proposed: Array<_Changes_Source_>
  queued: number
  state: _State_Job_
}

type _State_Job_ = _QUEUED_State_Job_ | _BEING_WORKED_ON__State_Job_ | _DONE_State_Job_ | _CANCELLED_State_Job_

interface __BASE_State_Job_<Kind extends string> {
  kind: Kind
}

interface _QUEUED_State_Job_ extends __BASE_State_Job_<"QUEUED"> {}

interface _BEING_WORKED_ON__State_Job_ extends __BASE_State_Job_<"BEING_WORKED_ON"> {
  taken: number
  heard: number
  note: string
}

interface _DONE_State_Job_ extends __BASE_State_Job_<"DONE"> {
  done: number
}

interface _CANCELLED_State_Job_ extends __BASE_State_Job_<"CANCELLED"> {
  cancelled: number
}

type _Command_Jobs_ = _QUEUE_Command_Jobs_ | _TAKE_Command_Jobs_ | _CHECK_IN__Command_Jobs_ | _HAND_BACK__Command_Jobs_ | _CANCEL_Command_Jobs_

interface __BASE_Command_Jobs_<Kind extends string> {
  kind: Kind
}

interface _QUEUE_Command_Jobs_ extends __BASE_Command_Jobs_<"QUEUE"> {
  job_Shell: _Job_Shell_
}

interface _TAKE_Command_Jobs_ extends __BASE_Command_Jobs_<"TAKE"> {
  id_Job: string
  note: string
  at: number
}

interface _CHECK_IN__Command_Jobs_ extends __BASE_Command_Jobs_<"CHECK_IN"> {
  id_Job: string
  note: string
  at: number
}

interface _HAND_BACK__Command_Jobs_ extends __BASE_Command_Jobs_<"HAND_BACK"> {
  id_Job: string
  at: number
}

interface _CANCEL_Command_Jobs_ extends __BASE_Command_Jobs_<"CANCEL"> {
  id_Job: string
  at: number
}

type _HandlerMap__Jobs_ = {
  [Kind in _Command_Jobs_["kind"]]: (api_Handler: _Api___jobsAfter__Command_<Kind>) => Array<_Job_Shell_>
}

const HANDLERMAP__JOBS: _HandlerMap__Jobs_ = {
  QUEUE: ({
    jobs,
    command
  }) => command.job_Shell.requests.length === 0 || jobs.some((job) => job.id === command.job_Shell.id)
    ? jobs
    : [
      ...jobs,
      command.job_Shell
    ],
  TAKE: ({
    jobs,
    command
  }) => jobChangedIn__Jobs({
    jobs,
    id_Job: command.id_Job,
    change: (job) => isTakeable__Job({
      jobs,
      job
    })
      ? {
        ...job,
        state: {
          kind: "BEING_WORKED_ON",
          taken: command.at,
          heard: command.at,
          note: command.note
        }
      }
      : job
  }),
  CHECK_IN: ({
    jobs,
    command
  }) => jobChangedIn__Jobs({
    jobs,
    id_Job: command.id_Job,
    change: (job) => job.state.kind === "BEING_WORKED_ON"
      ? {
        ...job,
        state: {
          ...job.state,
          heard: command.at,
          note: command.note === "" ? job.state.note : command.note
        }
      }
      : job
  }),
  HAND_BACK: ({
    jobs,
    command
  }) => jobChangedIn__Jobs({
    jobs,
    id_Job: command.id_Job,
    change: (job) => job.state.kind === "BEING_WORKED_ON"
      ? {
        ...job,
        state: {
          kind: "DONE",
          done: command.at
        }
      }
      : job
  }),
  CANCEL: ({
    jobs,
    command
  }) => jobChangedIn__Jobs({
    jobs,
    id_Job: command.id_Job,
    change: (job) => isLive__Job({
      job
    })
      ? {
        ...job,
        state: {
          kind: "CANCELLED",
          cancelled: command.at
        }
      }
      : job
  })
}

interface _Api___jobChangedIn__Jobs_ {
  jobs: Array<_Job_Shell_>
  id_Job: string
  change: (job: _Job_Shell_) => _Job_Shell_
}

function jobChangedIn__Jobs({
  jobs,
  id_Job,
  change
}: _Api___jobChangedIn__Jobs_): Array<_Job_Shell_> {
  const job = jobs.find((job_Each) => job_Each.id === id_Job)
  if (job === undefined) return jobs
  const job_Changed = change(job)
  return job_Changed === job
    ? jobs
    : jobs.map((job_Each) => job_Each === job ? job_Changed : job_Each)
}

interface _Api___isTakeable__Job_ {
  jobs: Array<_Job_Shell_>
  job: _Job_Shell_
}

function isTakeable__Job({
  jobs,
  job
}: _Api___isTakeable__Job_): boolean {
  if (job.state.kind !== "QUEUED") return false
  const jobs_Task = jobs.filter((job_Each) => job_Each.id_Task === job.id_Task)
  const isTaskBusy = jobs_Task.some((job_Each) => job_Each.state.kind === "BEING_WORKED_ON")
  const isFirst = jobs_Task.find((job_Each) => job_Each.state.kind === "QUEUED")?.id === job.id
  return !isTaskBusy && isFirst
}

interface _Api___isLive__Job_ {
  job: _Job_Shell_
}

function isLive__Job({
  job
}: _Api___isLive__Job_): boolean {
  return job.state.kind === "QUEUED" || job.state.kind === "BEING_WORKED_ON"
}

interface _Api___jobOf__Request_ {
  jobs: Array<_Job_Shell_>
  id_Task: string
  id_Request: string
}

function jobOf__Request({
  jobs,
  id_Task,
  id_Request
}: _Api___jobOf__Request_): _Job_Shell_ | undefined {
  return jobs.findLast((job) => job.id_Task === id_Task && job.requests.some((request) => request.id === id_Request))
}
