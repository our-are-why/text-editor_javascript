import type {
  _Job_Agent_,
  _Command_Agent_,
  _Model_Agent_,
  _State_Job_,
  _From_Wait_
} from "./Model_Agent.ts"

export {
  answeredOf__Offer,
  type _Api___answeredOf__Offer_,
  type _Answered_Call_,
  type _Answer_Agent_,
  type __BASE_Answer_Agent_,
  type _JOB_Answer_Agent_,
  type _Offered_Job_,
  type _NOTHING_YET__Answer_Agent_,
  type _CLOSED_Answer_Agent_,
  type _TAKEN_Answer_Agent_,
  type _STILL_ON__Answer_Agent_,
  type _STOPPED_Answer_Agent_,
  type _LAPSED_Answer_Agent_,
  type _HANDED_BACK__Answer_Agent_,
  type _REFUSED_Answer_Agent_,
  answerOf__NothingYet,
  type _Api___answerOf__NothingYet_,
  ANSWER_CLOSED,
  answeredOf__Check,
  type _Api___answeredOf__Check_,
  type _Api___answeredOf__State_,
  type _AnswerMap__State_Job_,
  CHECKMAP__STATE_JOB,
  answeredOf__Done,
  type _Api___answeredOf__Done_,
  DONEMAP__STATE_JOB,
  answerOf__Refused,
  type _Api___answerOf__Refused_,
  commandOf__Wait,
  type _Api___commandOf__Wait_,
  SECONDS_WAIT,
  SECONDS_WAIT_MOST
}

interface _Api___answeredOf__Offer_ {
  job_Agent: _Job_Agent_
  brief: unknown
  at: number
  command_Agent: string
  command_Wait: string
}

interface _Answered_Call_ {
  commands_Agent: Array<_Command_Agent_>
  answer_Agent: _Answer_Agent_
}

type _Answer_Agent_ = _JOB_Answer_Agent_ | _NOTHING_YET__Answer_Agent_ | _CLOSED_Answer_Agent_ | _TAKEN_Answer_Agent_ | _STILL_ON__Answer_Agent_ | _STOPPED_Answer_Agent_ | _LAPSED_Answer_Agent_ | _HANDED_BACK__Answer_Agent_ | _REFUSED_Answer_Agent_

interface __BASE_Answer_Agent_<Kind extends string> {
  kind: Kind
  next: string
}

interface _JOB_Answer_Agent_ extends __BASE_Answer_Agent_<"JOB"> {
  job: _Offered_Job_
}

interface _Offered_Job_ {
  id: string
  brief: unknown
}

interface _NOTHING_YET__Answer_Agent_ extends __BASE_Answer_Agent_<"NOTHING_YET"> {}

interface _CLOSED_Answer_Agent_ extends __BASE_Answer_Agent_<"CLOSED"> {}

interface _TAKEN_Answer_Agent_ extends __BASE_Answer_Agent_<"TAKEN"> {}

interface _STILL_ON__Answer_Agent_ extends __BASE_Answer_Agent_<"STILL_ON"> {}

interface _STOPPED_Answer_Agent_ extends __BASE_Answer_Agent_<"STOPPED"> {}

interface _LAPSED_Answer_Agent_ extends __BASE_Answer_Agent_<"LAPSED"> {}

interface _HANDED_BACK__Answer_Agent_ extends __BASE_Answer_Agent_<"HANDED_BACK"> {}

interface _REFUSED_Answer_Agent_ extends __BASE_Answer_Agent_<"REFUSED"> {
  issues: Array<string>
}

function answeredOf__Offer({
  job_Agent,
  brief,
  at,
  command_Agent,
  command_Wait
}: _Api___answeredOf__Offer_): _Answered_Call_ {
  return {
    commands_Agent: [
      {
        kind: "OFFER",
        id_Job: job_Agent.id,
        at
      }
    ],
    answer_Agent: {
      kind: "JOB",
      job: {
        id: job_Agent.id,
        brief
      },
      next: [
        `You're offered job ${job_Agent.id}: what it asks is under "requests" in its brief; the rest of its task is there to inform you, not for you to do.`,
        `First, take it: run \`${command_Agent} check ${job_Agent.id} "starting"\` now, or it's offered to another agent in a minute.`,
        "Then work out what each of its requests asks, reading this project's files as they are, in its folder.",
        "Change no file: doctor can't take changes back yet, so answer in words.",
        `Between big steps, check in with \`${command_Agent} check ${job_Agent.id} "<what you're doing>"\`: it says whether the job's been stopped.`,
        `When it's done, run \`${command_Agent} done ${job_Agent.id} "<for each request, what you'd change and why, or why nothing needs to>"\`, then run \`${command_Wait}\` for the next job.`
      ].join(" ")
    }
  }
}

interface _Api___answerOf__NothingYet_ {
  command_Wait: string
}

function answerOf__NothingYet({
  command_Wait
}: _Api___answerOf__NothingYet_): _NOTHING_YET__Answer_Agent_ {
  return {
    kind: "NOTHING_YET",
    next: `Nothing yet. Run \`${command_Wait}\` again.`
  }
}

const ANSWER_CLOSED: _CLOSED_Answer_Agent_ = {
  kind: "CLOSED",
  next: "doctor has closed: stop waiting, and tell the person."
}

interface _Api___answeredOf__Check_ {
  model_Agent: _Model_Agent_
  id_Job: string
  note: string
  at: number
  command_Agent: string
}

function answeredOf__Check({
  model_Agent,
  id_Job,
  note,
  at,
  command_Agent
}: _Api___answeredOf__Check_): _Answered_Call_ {
  const job_Agent = model_Agent.jobs.find((job) => job.id === id_Job)
  if (job_Agent === undefined) {
    return {
      commands_Agent: [],
      answer_Agent: answerOf__Refused({
        issues: [`there's no job ${id_Job}`],
        command_Agent
      })
    }
  }
  const answered = CHECKMAP__STATE_JOB[job_Agent.state.kind]
  return answered({
    job_Agent,
    note,
    at,
    command_Agent
  })
}

interface _Api___answeredOf__State_ {
  job_Agent: _Job_Agent_
  note: string
  at: number
  command_Agent: string
}

type _AnswerMap__State_Job_ = {
  [Kind in _State_Job_["kind"]]: (api_Answered: _Api___answeredOf__State_) => _Answered_Call_
}

const CHECKMAP__STATE_JOB: _AnswerMap__State_Job_ = {
  QUEUED: ({
    job_Agent,
    command_Agent
  }) => ({
    commands_Agent: [],
    answer_Agent: {
      kind: "LAPSED",
      next: `Job ${job_Agent.id} wasn't taken in time, and is offered again: drop it, and run \`${command_Agent} wait\` for the next job.`
    }
  }),
  OFFERED: ({
    job_Agent,
    note,
    at,
    command_Agent
  }) => ({
    commands_Agent: [
      {
        kind: "CHECK",
        id_Job: job_Agent.id,
        note,
        at
      }
    ],
    answer_Agent: {
      kind: "TAKEN",
      next: `Job ${job_Agent.id}'s yours. Work out its requests, check in between big steps with \`${command_Agent} check ${job_Agent.id} "<what you're doing>"\`, and when it's done run \`${command_Agent} done ${job_Agent.id} "<for each request, what you'd change and why, or why nothing needs to>"\`.`
    }
  }),
  BEING_WORKED_ON: ({
    job_Agent,
    note,
    at,
    command_Agent
  }) => ({
    commands_Agent: [
      {
        kind: "CHECK",
        id_Job: job_Agent.id,
        note,
        at
      }
    ],
    answer_Agent: {
      kind: "STILL_ON",
      next: `Job ${job_Agent.id}'s still yours: carry on, check in again between big steps, and when it's done run \`${command_Agent} done ${job_Agent.id} "<for each request, what you'd change and why, or why nothing needs to>"\`.`
    }
  }),
  DONE: ({
    job_Agent,
    command_Agent
  }) => ({
    commands_Agent: [],
    answer_Agent: answerOf__Refused({
      issues: [`job ${job_Agent.id}'s been handed back already`],
      command_Agent
    })
  }),
  CANCELLED: ({
    job_Agent,
    command_Agent
  }) => ({
    commands_Agent: [],
    answer_Agent: {
      kind: "STOPPED",
      next: `Job ${job_Agent.id} was stopped: stop working on it, leave nothing half done, and run \`${command_Agent} wait\` for the next job.`
    }
  })
}

interface _Api___answeredOf__Done_ {
  model_Agent: _Model_Agent_
  id_Job: string
  at: number
  command_Agent: string
}

function answeredOf__Done({
  model_Agent,
  id_Job,
  at,
  command_Agent
}: _Api___answeredOf__Done_): _Answered_Call_ {
  const job_Agent = model_Agent.jobs.find((job) => job.id === id_Job)
  if (job_Agent === undefined) {
    return {
      commands_Agent: [],
      answer_Agent: answerOf__Refused({
        issues: [`there's no job ${id_Job}`],
        command_Agent
      })
    }
  }
  const answered = DONEMAP__STATE_JOB[job_Agent.state.kind]
  return answered({
    job_Agent,
    note: "",
    at,
    command_Agent
  })
}

const DONEMAP__STATE_JOB: _AnswerMap__State_Job_ = {
  QUEUED: CHECKMAP__STATE_JOB.QUEUED,
  OFFERED: ({
    job_Agent,
    at,
    command_Agent
  }) => ({
    commands_Agent: [
      {
        kind: "HAND_BACK",
        id_Job: job_Agent.id,
        at
      }
    ],
    answer_Agent: {
      kind: "HANDED_BACK",
      next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
    }
  }),
  BEING_WORKED_ON: ({
    job_Agent,
    at,
    command_Agent
  }) => ({
    commands_Agent: [
      {
        kind: "HAND_BACK",
        id_Job: job_Agent.id,
        at
      }
    ],
    answer_Agent: {
      kind: "HANDED_BACK",
      next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
    }
  }),
  DONE: CHECKMAP__STATE_JOB.DONE,
  CANCELLED: ({
    job_Agent,
    command_Agent
  }) => ({
    commands_Agent: [],
    answer_Agent: {
      kind: "STOPPED",
      next: `Job ${job_Agent.id} was stopped, so what you handed back isn't taken: drop it, and run \`${command_Agent} wait\` for the next job.`
    }
  })
}

interface _Api___answerOf__Refused_ {
  issues: Array<string>
  command_Agent: string
}

function answerOf__Refused({
  issues,
  command_Agent
}: _Api___answerOf__Refused_): _REFUSED_Answer_Agent_ {
  return {
    kind: "REFUSED",
    issues,
    next: `Run \`${command_Agent} help\` for how it's used, or \`${command_Agent} wait\` for a job.`
  }
}

interface _Api___commandOf__Wait_ {
  command_Agent: string
  seconds: number
  from: _From_Wait_
}

function commandOf__Wait({
  command_Agent,
  seconds,
  from
}: _Api___commandOf__Wait_): string {
  return [
    `${command_Agent} wait`,
    seconds === SECONDS_WAIT ? "" : ` --for ${seconds}`,
    from.kind === "TASK" ? ` --task ${from.id_Task}` : ""
  ].join("")
}

const SECONDS_WAIT = 50

const SECONDS_WAIT_MOST = 3600
