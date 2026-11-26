import type { _Scope_Tasks_ } from "../tasks/index.ts"

export {
  modelAfter__Command,
  type _Api___modelAfter__Command_,
  type _Model_Agent_,
  type _Job_Agent_,
  type _State_Job_,
  type __BASE_State_Job_,
  type _QUEUED_State_Job_,
  type _OFFERED_State_Job_,
  type _BEING_WORKED_ON__State_Job_,
  type _DONE_State_Job_,
  type _CANCELLED_State_Job_,
  type _Command_Agent_,
  type __BASE_Command_Agent_,
  type _QUEUE_Command_Agent_,
  type _OFFER_Command_Agent_,
  type _CHECK_Command_Agent_,
  type _HAND_BACK__Command_Agent_,
  type _CANCEL_Command_Agent_,
  type _LAPSE_Command_Agent_,
  type _HandlerMap__Agent_,
  HANDLERMAP__AGENT,
  isOfferable__Job,
  type _Api___isOfferable__Job_,
  MS_LAPSE__OFFER,
  nextOf__Mailbox,
  type _Api___nextOf__Mailbox_,
  type _From_Wait_,
  type __BASE_From_Wait_,
  type _ANY_From_Wait_,
  type _TASK_From_Wait_,
  jobOf__Request,
  type _Api___jobOf__Request_
}

interface _Api___modelAfter__Command_<Kind extends _Command_Agent_["kind"]> {
  model_Agent: _Model_Agent_
  command: Extract<
    _Command_Agent_,
    __BASE_Command_Agent_<Kind>
  >
}

function modelAfter__Command<Kind extends _Command_Agent_["kind"]>({
  model_Agent,
  command
}: _Api___modelAfter__Command_<Kind>): _Model_Agent_ {
  const handle = HANDLERMAP__AGENT[command.kind]
  return handle({
    model_Agent,
    command
  })
}

interface _Model_Agent_ {
  jobs: Array<_Job_Agent_>
}

interface _Job_Agent_ {
  id: string
  id_Task: string
  scope: _Scope_Tasks_
  ids_Request: Array<string>
  queued: number
  state: _State_Job_
}

type _State_Job_ = _QUEUED_State_Job_ | _OFFERED_State_Job_ | _BEING_WORKED_ON__State_Job_ | _DONE_State_Job_ | _CANCELLED_State_Job_

interface __BASE_State_Job_<Kind extends string> {
  kind: Kind
}

interface _QUEUED_State_Job_ extends __BASE_State_Job_<"QUEUED"> {}

interface _OFFERED_State_Job_ extends __BASE_State_Job_<"OFFERED"> {
  offered: number
}

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

type _Command_Agent_ = _QUEUE_Command_Agent_ | _OFFER_Command_Agent_ | _CHECK_Command_Agent_ | _HAND_BACK__Command_Agent_ | _CANCEL_Command_Agent_ | _LAPSE_Command_Agent_

interface __BASE_Command_Agent_<Kind extends string> {
  kind: Kind
}

interface _QUEUE_Command_Agent_ extends __BASE_Command_Agent_<"QUEUE"> {
  id_Job: string
  id_Task: string
  scope: _Scope_Tasks_
  ids_Request: Array<string>
  at: number
}

interface _OFFER_Command_Agent_ extends __BASE_Command_Agent_<"OFFER"> {
  id_Job: string
  at: number
}

interface _CHECK_Command_Agent_ extends __BASE_Command_Agent_<"CHECK"> {
  id_Job: string
  note: string
  at: number
}

interface _HAND_BACK__Command_Agent_ extends __BASE_Command_Agent_<"HAND_BACK"> {
  id_Job: string
  at: number
}

interface _CANCEL_Command_Agent_ extends __BASE_Command_Agent_<"CANCEL"> {
  id_Job: string
  at: number
}

interface _LAPSE_Command_Agent_ extends __BASE_Command_Agent_<"LAPSE"> {
  at: number
}

type _HandlerMap__Agent_ = {
  [Kind in _Command_Agent_["kind"]]: (api_Handler: _Api___modelAfter__Command_<Kind>) => _Model_Agent_
}

const HANDLERMAP__AGENT: _HandlerMap__Agent_ = {
  QUEUE: QUEUE_modelAfter__Command,
  OFFER: OFFER_modelAfter__Command,
  CHECK: CHECK_modelAfter__Command,
  HAND_BACK: HAND_BACK_modelAfter__Command,
  CANCEL: CANCEL_modelAfter__Command,
  LAPSE: LAPSE_modelAfter__Command
}

function QUEUE_modelAfter__Command({
  model_Agent,
  command
}: _Api___modelAfter__Command_<"QUEUE">): _Model_Agent_ {
  if (command.ids_Request.length === 0 || model_Agent.jobs.some((job) => job.id === command.id_Job)) return model_Agent
  return {
    jobs: [
      ...model_Agent.jobs,
      {
        id: command.id_Job,
        id_Task: command.id_Task,
        scope: command.scope,
        ids_Request: command.ids_Request,
        queued: command.at,
        state: {
          kind: "QUEUED"
        }
      }
    ]
  }
}

function OFFER_modelAfter__Command({
  model_Agent,
  command
}: _Api___modelAfter__Command_<"OFFER">): _Model_Agent_ {
  return jobChangedIn__Model({
    model_Agent,
    id_Job: command.id_Job,
    change: (job) => isOfferable__Job({
      model_Agent,
      job
    })
      ? {
        ...job,
        state: {
          kind: "OFFERED",
          offered: command.at
        }
      }
      : job
  })
}

interface _Api___jobChangedIn__Model_ {
  model_Agent: _Model_Agent_
  id_Job: string
  change: (job: _Job_Agent_) => _Job_Agent_
}

function jobChangedIn__Model({
  model_Agent,
  id_Job,
  change
}: _Api___jobChangedIn__Model_): _Model_Agent_ {
  const job = model_Agent.jobs.find((job_Each) => job_Each.id === id_Job)
  if (job === undefined) return model_Agent
  const job_Changed = change(job)
  return job_Changed === job
    ? model_Agent
    : {
      jobs: model_Agent.jobs.map((job_Each) => job_Each === job ? job_Changed : job_Each)
    }
}

interface _Api___isOfferable__Job_ {
  model_Agent: _Model_Agent_
  job: _Job_Agent_
}

function isOfferable__Job({
  model_Agent,
  job
}: _Api___isOfferable__Job_): boolean {
  if (job.state.kind !== "QUEUED") return false
  const jobs_Task = model_Agent.jobs.filter((job_Each) => job_Each.id_Task === job.id_Task)
  const isTaskBusy = jobs_Task.some((job_Each) => job_Each.state.kind === "OFFERED" || job_Each.state.kind === "BEING_WORKED_ON")
  const isFirst = jobs_Task.every((job_Each) => job_Each === job || job_Each.state.kind !== "QUEUED" || orderOf__Jobs(
    job,
    job_Each
  ) < 0)
  return !isTaskBusy && isFirst
}

function orderOf__Jobs(
  job: _Job_Agent_,
  job_Other: _Job_Agent_
): number {
  return job.queued - job_Other.queued || (job.id < job_Other.id ? -1 : job.id > job_Other.id ? 1 : 0)
}

function CHECK_modelAfter__Command({
  model_Agent,
  command
}: _Api___modelAfter__Command_<"CHECK">): _Model_Agent_ {
  return jobChangedIn__Model({
    model_Agent,
    id_Job: command.id_Job,
    change: (job) => job.state.kind === "OFFERED"
      ? {
        ...job,
        state: {
          kind: "BEING_WORKED_ON",
          taken: command.at,
          heard: command.at,
          note: command.note
        }
      }
      : job.state.kind === "BEING_WORKED_ON"
        ? {
          ...job,
          state: {
            ...job.state,
            heard: command.at,
            note: command.note === "" ? job.state.note : command.note
          }
        }
        : job
  })
}

function HAND_BACK_modelAfter__Command({
  model_Agent,
  command
}: _Api___modelAfter__Command_<"HAND_BACK">): _Model_Agent_ {
  return jobChangedIn__Model({
    model_Agent,
    id_Job: command.id_Job,
    change: (job) => job.state.kind === "OFFERED" || job.state.kind === "BEING_WORKED_ON"
      ? {
        ...job,
        state: {
          kind: "DONE",
          done: command.at
        }
      }
      : job
  })
}

function CANCEL_modelAfter__Command({
  model_Agent,
  command
}: _Api___modelAfter__Command_<"CANCEL">): _Model_Agent_ {
  return jobChangedIn__Model({
    model_Agent,
    id_Job: command.id_Job,
    change: (job) => job.state.kind === "QUEUED" || job.state.kind === "OFFERED" || job.state.kind === "BEING_WORKED_ON"
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

function LAPSE_modelAfter__Command({
  model_Agent,
  command
}: _Api___modelAfter__Command_<"LAPSE">): _Model_Agent_ {
  const isLapsed = (job: _Job_Agent_) => job.state.kind === "OFFERED" && command.at - job.state.offered >= MS_LAPSE__OFFER
  if (!model_Agent.jobs.some(isLapsed)) return model_Agent
  return {
    jobs: model_Agent.jobs.map((job) => isLapsed(job)
      ? {
        ...job,
        state: {
          kind: "QUEUED"
        }
      }
      : job)
  }
}

const MS_LAPSE__OFFER = 60_000

interface _Api___nextOf__Mailbox_ {
  model_Agent: _Model_Agent_
  from: _From_Wait_
}

type _From_Wait_ = _ANY_From_Wait_ | _TASK_From_Wait_

interface __BASE_From_Wait_<Kind extends string> {
  kind: Kind
}

interface _ANY_From_Wait_ extends __BASE_From_Wait_<"ANY"> {}

interface _TASK_From_Wait_ extends __BASE_From_Wait_<"TASK"> {
  id_Task: string
}

function nextOf__Mailbox({
  model_Agent,
  from
}: _Api___nextOf__Mailbox_): _Job_Agent_ | undefined {
  return model_Agent.jobs
    .filter((job) => (from.kind === "ANY" || job.id_Task === from.id_Task) && isOfferable__Job({
      model_Agent,
      job
    }))
    .toSorted(orderOf__Jobs)[0]
}

interface _Api___jobOf__Request_ {
  model_Agent: _Model_Agent_
  id_Request: string
}

function jobOf__Request({
  model_Agent,
  id_Request
}: _Api___jobOf__Request_): _Job_Agent_ | undefined {
  return model_Agent.jobs
    .filter((job) => job.ids_Request.includes(id_Request))
    .toSorted(orderOf__Jobs)
    .at(-1)
}
