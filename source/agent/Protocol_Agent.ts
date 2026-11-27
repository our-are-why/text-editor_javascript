import type {
  _Job_Shell_,
  _State_Job_,
  _Command_Shell_
} from "../shell/index.ts"

export {
  type _From_Wait_,
  type __BASE_From_Wait_,
  type _ANY_From_Wait_,
  type _TASK_From_Wait_,
  isFrom__Job,
  type _Api___isFrom__Job_,
  standingOf__Job,
  type _Api___standingOf__Job_,
  type _Standing_Job_,
  MS_LAPSE__OFFER,
  answerOf__Offer,
  type _Api___answerOf__Offer_,
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
  type _Kind_Call_,
  type _AnswerMaps__Call_,
  ANSWERMAPS__CALL,
  type _AnswerMap__Standing_Job_,
  type _Api___answeredOf__Standing_,
  type _Answered_Call_,
  CHECKMAP__STANDING_JOB,
  DONEMAP__STANDING_JOB,
  answerOf__Refused,
  type _Api___answerOf__Refused_,
  answerOf__NothingYet,
  type _Api___answerOf__NothingYet_,
  ANSWER_CLOSED,
  commandOf__Wait,
  type _Api___commandOf__Wait_,
  SECONDS_WAIT,
  SECONDS_WAIT_MOST
}

type _From_Wait_ = _ANY_From_Wait_ | _TASK_From_Wait_

interface __BASE_From_Wait_<Kind extends string> {
  kind: Kind
}

interface _ANY_From_Wait_ extends __BASE_From_Wait_<"ANY"> {}

interface _TASK_From_Wait_ extends __BASE_From_Wait_<"TASK"> {
  id_Task: string
}

interface _Api___isFrom__Job_ {
  job_Shell: _Job_Shell_
  from: _From_Wait_
}

function isFrom__Job({
  job_Shell,
  from
}: _Api___isFrom__Job_): boolean {
  return from.kind === "ANY" || job_Shell.id_Task === from.id_Task
}

interface _Api___standingOf__Job_ {
  job_Shell: _Job_Shell_
  offers: Map<string, number>
  at: number
}

function standingOf__Job({
  job_Shell,
  offers,
  at
}: _Api___standingOf__Job_): _Standing_Job_ {
  const offered = offers.get(job_Shell.id)
  return job_Shell.state.kind === "QUEUED" && offered !== undefined && at - offered < MS_LAPSE__OFFER
    ? "OFFERED"
    : job_Shell.state.kind
}

type _Standing_Job_ = _State_Job_["kind"] | "OFFERED"

const MS_LAPSE__OFFER = 60_000

interface _Api___answerOf__Offer_ {
  id_Job: string
  brief: unknown
  command_Agent: string
  command_Wait: string
}

function answerOf__Offer({
  id_Job,
  brief,
  command_Agent,
  command_Wait
}: _Api___answerOf__Offer_): _JOB_Answer_Agent_ {
  return {
    kind: "JOB",
    job: {
      id: id_Job,
      brief
    },
    next: [
      `You're offered job ${id_Job}: what it asks is under "requests" in its brief; the rest of its task is there to inform you, not for you to do.`,
      `First, take it: run \`${command_Agent} check ${id_Job} "starting"\` now, or it's offered to another agent in a minute.`,
      "Then work out what each of its requests asks, reading this project's files as they are, in its folder.",
      "Change no file: doctor can't take changes back yet, so answer in words.",
      `Between big steps, check in with \`${command_Agent} check ${id_Job} "<what you're doing>"\`: it says whether the job's been stopped.`,
      `When it's done, run \`${command_Agent} done ${id_Job} "<for each request, what you'd change and why, or why nothing needs to>"\`, then run \`${command_Wait}\` for the next job.`
    ].join(" ")
  }
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

type _Kind_Call_ = "CHECK" | "DONE"

type _AnswerMaps__Call_ = {
  [Kind in _Kind_Call_]: _AnswerMap__Standing_Job_
}

type _AnswerMap__Standing_Job_ = {
  [Kind in _Standing_Job_]: (api_Answered: _Api___answeredOf__Standing_) => _Answered_Call_
}

interface _Api___answeredOf__Standing_ {
  id_Job: string
  note: string
  command_Agent: string
}

interface _Answered_Call_ {
  commands_Shell: Array<_Command_Shell_>
  answer_Agent: _Answer_Agent_
}

const CHECKMAP__STANDING_JOB: _AnswerMap__Standing_Job_ = {
  QUEUED: ({
    id_Job,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: {
      kind: "LAPSED",
      next: `Job ${id_Job} wasn't taken in time, and is offered again: drop it, and run \`${command_Agent} wait\` for the next job.`
    }
  }),
  OFFERED: ({
    id_Job,
    note,
    command_Agent
  }) => ({
    commands_Shell: [
      {
        kind: "TAKE",
        id_Job,
        note
      }
    ],
    answer_Agent: {
      kind: "TAKEN",
      next: `Job ${id_Job}'s yours. Work out its requests, check in between big steps with \`${command_Agent} check ${id_Job} "<what you're doing>"\`, and when it's done run \`${command_Agent} done ${id_Job} "<for each request, what you'd change and why, or why nothing needs to>"\`.`
    }
  }),
  BEING_WORKED_ON: ({
    id_Job,
    note,
    command_Agent
  }) => ({
    commands_Shell: [
      {
        kind: "CHECK_IN",
        id_Job,
        note
      }
    ],
    answer_Agent: {
      kind: "STILL_ON",
      next: `Job ${id_Job}'s still yours: carry on, check in again between big steps, and when it's done run \`${command_Agent} done ${id_Job} "<for each request, what you'd change and why, or why nothing needs to>"\`.`
    }
  }),
  DONE: ({
    id_Job,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: answerOf__Refused({
      issues: [`job ${id_Job}'s been handed back already`],
      command_Agent
    })
  }),
  CANCELLED: ({
    id_Job,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: {
      kind: "STOPPED",
      next: `Job ${id_Job} was stopped: stop working on it, leave nothing half done, and run \`${command_Agent} wait\` for the next job.`
    }
  })
}

const DONEMAP__STANDING_JOB: _AnswerMap__Standing_Job_ = {
  QUEUED: CHECKMAP__STANDING_JOB.QUEUED,
  OFFERED: ({
    id_Job,
    note,
    command_Agent
  }) => ({
    commands_Shell: [
      {
        kind: "TAKE",
        id_Job,
        note: ""
      },
      {
        kind: "HAND_BACK",
        id_Job,
        proposed: [],
        note
      }
    ],
    answer_Agent: {
      kind: "HANDED_BACK",
      next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
    }
  }),
  BEING_WORKED_ON: ({
    id_Job,
    note,
    command_Agent
  }) => ({
    commands_Shell: [
      {
        kind: "HAND_BACK",
        id_Job,
        proposed: [],
        note
      }
    ],
    answer_Agent: {
      kind: "HANDED_BACK",
      next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
    }
  }),
  DONE: CHECKMAP__STANDING_JOB.DONE,
  CANCELLED: ({
    id_Job,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: {
      kind: "STOPPED",
      next: `Job ${id_Job} was stopped, so what you handed back isn't taken: drop it, and run \`${command_Agent} wait\` for the next job.`
    }
  })
}

const ANSWERMAPS__CALL: _AnswerMaps__Call_ = {
  CHECK: CHECKMAP__STANDING_JOB,
  DONE: DONEMAP__STANDING_JOB
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
