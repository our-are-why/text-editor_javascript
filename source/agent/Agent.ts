import {
  isTakeable__Job,
  type _State_Shell_,
  type _Command_Shell_
} from "../shell/index.ts"
import {
  isFrom__Job,
  standingOf__Job,
  answerOf__Offer,
  answerOf__Refused,
  ANSWERMAPS__CALL,
  type _From_Wait_,
  type _Answer_Agent_,
  type _Kind_Call_
} from "./Protocol_Agent.ts"
import { briefOf__Job } from "./Brief_Agent.ts"

export {
  _Agent_,
  type _Api__Agent_,
  type _Observer_Agent_,
  type _Api___offeredOf__Agent_,
  type _Api___called__Agent_
}

class _Agent_ {
  state_Shell: _State_Shell_
  offers: Map<string, number>
  observers: Array<_Observer_Agent_>

  constructor({
    state_Shell,
    observers
  }: _Api__Agent_) {
    this.state_Shell = state_Shell
    this.offers = new Map()
    this.observers = observers
  }

  heard(
    state_Shell: _State_Shell_
  ): void {
    this.state_Shell = state_Shell
    for (const id_Job of [...this.offers.keys()]) {
      if (this.state_Shell.jobs.find((job) => job.id === id_Job)?.state.kind !== "QUEUED") this.offers.delete(id_Job)
    }
  }

  offeredOf({
    from,
    at,
    command_Agent,
    command_Wait
  }: _Api___offeredOf__Agent_): _Answer_Agent_ | undefined {
    const jobs = this.state_Shell.jobs
    const job_Shell = jobs.find((job) => isFrom__Job({
      job_Shell: job,
      from
    }) && isTakeable__Job({
      jobs,
      job
    }) && standingOf__Job({
      job_Shell: job,
      offers: this.offers,
      at
    }) === "QUEUED")
    const task = this.state_Shell.model_Tasks.tasks.find((task_Each) => task_Each.id === job_Shell?.id_Task)
    if (job_Shell === undefined || task === undefined) return undefined
    this.offers.set(
      job_Shell.id,
      at
    )
    return answerOf__Offer({
      id_Job: job_Shell.id,
      brief: briefOf__Job({
        task,
        ids_Request: job_Shell.requests.map((request) => request.id)
      }),
      command_Agent,
      command_Wait
    })
  }

  called({
    kind_Call,
    id_Job,
    note,
    at,
    command_Agent
  }: _Api___called__Agent_): _Answer_Agent_ {
    const job_Shell = this.state_Shell.jobs.find((job) => job.id === id_Job)
    if (job_Shell === undefined) {
      return answerOf__Refused({
        issues: [`there's no job ${id_Job}`],
        command_Agent
      })
    }
    const answered = ANSWERMAPS__CALL[kind_Call][standingOf__Job({
      job_Shell,
      offers: this.offers,
      at
    })]
    const answered_Call = answered({
      id_Job,
      note,
      command_Agent
    })
    for (const command_Shell of answered_Call.commands_Shell) {
      for (const observer of this.observers) observer.sent(command_Shell)
    }
    return answered_Call.answer_Agent
  }
}

interface _Api__Agent_ {
  state_Shell: _State_Shell_
  observers: Array<_Observer_Agent_>
}

interface _Observer_Agent_ {
  sent: (command_Shell: _Command_Shell_) => void
}

interface _Api___offeredOf__Agent_ {
  from: _From_Wait_
  at: number
  command_Agent: string
  command_Wait: string
}

interface _Api___called__Agent_ {
  kind_Call: _Kind_Call_
  id_Job: string
  note: string
  at: number
  command_Agent: string
}
