import {
  changesOf__Copy,
  stampOf__Changes,
  landingOf__Grouping,
  LANDING_NONE,
  type _Job_Shell_,
  type _State_Job_,
  type _Command_Shell_,
  type _File_Copy_,
  type _Unplaceable_Copy_,
  type _Change_Copy_,
  type _Grouping_Job_,
  type _Proposal_Grouped_,
  type _Nothing_Grouped_,
  type _Checked_Landing_,
  type _Landing_Handed_
} from "../../core/shell/index.ts"
import type {
  _Task_Tasks_,
  _Effect_Proposal_Tasks_
} from "../../core/tasks/index.ts"

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
  type _Copy_Agent_,
  type __BASE_Copy_Agent_,
  type _NONE_Copy_Agent_,
  type _MADE_Copy_Agent_,
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
  type _CHANGES_Answer_Agent_,
  type _Change_Said_,
  type _VERIFIED_Answer_Agent_,
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
  CHANGESMAP__STANDING_JOB,
  VERIFYMAP__STANDING_JOB,
  DONEMAP__STANDING_JOB,
  issuesOf__Checked,
  type _Api___issuesOf__Checked_,
  answeredOf__Untaken,
  type _Api___answeredOf__Untaken_,
  answeredOf__Copy,
  type _Api___answeredOf__Copy_,
  type _Read_Copy_,
  saidOf__Change,
  type _Api___saidOf__Change_,
  type _SaidMap__Effect_,
  SAIDMAP__EFFECT,
  groupingOf__Said,
  type _Api___groupingOf__Said_,
  type _Said_Grouping_,
  type _Proposal_Said_,
  recordOf,
  type _Api___recordOf_,
  type _Record_Said_,
  nextOf__Grouping,
  type _Api___nextOf__Grouping_,
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

type _Copy_Agent_ = _NONE_Copy_Agent_ | _MADE_Copy_Agent_

interface __BASE_Copy_Agent_<Kind extends string> {
  kind: Kind
}

interface _NONE_Copy_Agent_ extends __BASE_Copy_Agent_<"NONE"> {
  why: string
}

interface _MADE_Copy_Agent_ extends __BASE_Copy_Agent_<"MADE"> {
  path: string
  files: Array<_File_Copy_>
  unplaceables: Array<_Unplaceable_Copy_>
}

interface _Api___answerOf__Offer_ {
  id_Job: string
  brief: unknown
  copy: _Copy_Agent_
  command_Agent: string
  command_Wait: string
}

function answerOf__Offer({
  id_Job,
  brief,
  copy,
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
      copy.kind === "MADE"
        ? "Taking it gives you a working copy of the project, as the task has it, to change as you see fit."
        : `There's no working copy for this project: ${copy.why}. Change no file, and answer in words.`,
      `Between big steps, check in with \`${command_Agent} check ${id_Job} "<what you're doing>"\`: it says whether the job's been stopped.`,
      `When it's done, hand it back, as taking it tells you, then run \`${command_Wait}\` for the next job.`
    ].join(" ")
  }
}

type _Answer_Agent_ = _JOB_Answer_Agent_ | _NOTHING_YET__Answer_Agent_ | _CLOSED_Answer_Agent_ | _TAKEN_Answer_Agent_ | _STILL_ON__Answer_Agent_ | _CHANGES_Answer_Agent_ | _VERIFIED_Answer_Agent_ | _STOPPED_Answer_Agent_ | _LAPSED_Answer_Agent_ | _HANDED_BACK__Answer_Agent_ | _REFUSED_Answer_Agent_

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

interface _TAKEN_Answer_Agent_ extends __BASE_Answer_Agent_<"TAKEN"> {
  copy: string
}

interface _STILL_ON__Answer_Agent_ extends __BASE_Answer_Agent_<"STILL_ON"> {}

interface _CHANGES_Answer_Agent_ extends __BASE_Answer_Agent_<"CHANGES"> {
  stamp: string
  changes: Array<_Change_Said_>
}

interface _Change_Said_ {
  number: number
  path: string
  file: string
  lines: string
  before: string
  after: string
}

interface _VERIFIED_Answer_Agent_ extends __BASE_Answer_Agent_<"VERIFIED"> {
  issues: Array<string>
  reports: Array<string>
}

interface _STOPPED_Answer_Agent_ extends __BASE_Answer_Agent_<"STOPPED"> {}

interface _LAPSED_Answer_Agent_ extends __BASE_Answer_Agent_<"LAPSED"> {}

interface _HANDED_BACK__Answer_Agent_ extends __BASE_Answer_Agent_<"HANDED_BACK"> {
  reports: Array<string>
}

interface _REFUSED_Answer_Agent_ extends __BASE_Answer_Agent_<"REFUSED"> {
  issues: Array<string>
}

type _Kind_Call_ = "CHECK" | "CHANGES" | "VERIFY" | "DONE"

type _AnswerMaps__Call_ = {
  [Kind in _Kind_Call_]: _AnswerMap__Standing_Job_
}

type _AnswerMap__Standing_Job_ = {
  [Kind in _Standing_Job_]: (api_Answered: _Api___answeredOf__Standing_) => _Answered_Call_
}

interface _Api___answeredOf__Standing_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  note: string
  said: unknown
  copy: _Copy_Agent_
  clashesOf: (landing: _Landing_Handed_) => Array<string>
  command_Agent: string
}

interface _Answered_Call_ {
  commands_Shell: Array<_Command_Shell_>
  answer_Agent: _Answer_Agent_
}

const CHECKMAP__STANDING_JOB: _AnswerMap__Standing_Job_ = {
  QUEUED: ({
    job_Shell,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: {
      kind: "LAPSED",
      next: `Job ${job_Shell.id} wasn't taken in time, and is offered again: drop it, and run \`${command_Agent} wait\` for the next job.`
    }
  }),
  OFFERED: ({
    job_Shell,
    note,
    copy,
    command_Agent
  }) => ({
    commands_Shell: [
      {
        kind: "TAKE",
        id_Job: job_Shell.id,
        note
      }
    ],
    answer_Agent: {
      kind: "TAKEN",
      copy: copy.kind === "MADE" ? copy.path : "",
      next: copy.kind === "MADE"
        ? [
          `Job ${job_Shell.id}'s yours. Your working copy's at ${copy.path}: the whole project as the task has it: its files with the task's accepted changes and the edits made in it written in, and any proposal you're asked to revise in place.`,
          "It's a git worktree of the project, committed as it was given, so git diff there shows only what you've changed. Work there as you would anywhere: edit, run the tests, try things; node_modules, if the project has it, is the project's own, linked in, so don't install into it.",
          "Don't change the project itself, only the copy.",
          `Check in between big steps with \`${command_Agent} check ${job_Shell.id} "<what you're doing>"\`. When you're done, run \`${command_Agent} changes ${job_Shell.id}\` to see what you changed, numbered, and how to hand it back.`
        ].join(" ")
        : `Job ${job_Shell.id}'s yours. There's no working copy for this project: ${copy.why}. Change no file. Check in between big steps with \`${command_Agent} check ${job_Shell.id} "<what you're doing>"\`, and when it's done run \`${command_Agent} done ${job_Shell.id} "<for each request, what you'd change and why, or why nothing needs to>"\`.`
    }
  }),
  BEING_WORKED_ON: ({
    job_Shell,
    note,
    command_Agent
  }) => ({
    commands_Shell: [
      {
        kind: "CHECK_IN",
        id_Job: job_Shell.id,
        note
      }
    ],
    answer_Agent: {
      kind: "STILL_ON",
      next: `Job ${job_Shell.id}'s still yours: carry on, check in again between big steps, and when you're done run \`${command_Agent} changes ${job_Shell.id}\` to see what you changed and how to hand it back.`
    }
  }),
  DONE: ({
    job_Shell,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: answerOf__Refused({
      issues: [`job ${job_Shell.id}'s been handed back already`],
      command_Agent
    })
  }),
  CANCELLED: ({
    job_Shell,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: {
      kind: "STOPPED",
      next: `Job ${job_Shell.id} was stopped: stop working on it, leave its copy as it is, and run \`${command_Agent} wait\` for the next job.`
    }
  })
}

const CHANGESMAP__STANDING_JOB: _AnswerMap__Standing_Job_ = {
  QUEUED: CHECKMAP__STANDING_JOB.QUEUED,
  OFFERED: ({
    job_Shell,
    command_Agent
  }) => answeredOf__Untaken({
    job_Shell,
    command_Agent
  }),
  BEING_WORKED_ON: ({
    task,
    job_Shell,
    copy,
    command_Agent
  }) => answeredOf__Copy({
    task,
    job_Shell,
    copy,
    command_Agent,
    read: (copy_Made) => {
      const changes = changesOf__Copy({
        files: copy_Made.files
      })
      return {
        commands_Shell: [],
        answer_Agent: {
          kind: "CHANGES",
          stamp: stampOf__Changes({
            changes
          }),
          changes: changes.map((change) => saidOf__Change({
            change
          })),
          next: changes.length === 0 && copy_Made.unplaceables.length === 0
            ? `You've changed nothing in your copy. If nothing needs to change, run \`${command_Agent} done ${job_Shell.id} "<for each request, why nothing needs to change>"\`.`
            : nextOf__Grouping({
              job_Shell,
              command_Agent
            })
        }
      }
    }
  }),
  DONE: CHECKMAP__STANDING_JOB.DONE,
  CANCELLED: CHECKMAP__STANDING_JOB.CANCELLED
}

const VERIFYMAP__STANDING_JOB: _AnswerMap__Standing_Job_ = {
  QUEUED: CHECKMAP__STANDING_JOB.QUEUED,
  OFFERED: CHANGESMAP__STANDING_JOB.OFFERED,
  BEING_WORKED_ON: ({
    task,
    job_Shell,
    said,
    copy,
    clashesOf,
    command_Agent
  }) => answeredOf__Copy({
    task,
    job_Shell,
    copy,
    command_Agent,
    read: (copy_Made) => {
      const said_Grouping = groupingOf__Said({
        said
      })
      const checked = landingOf__Grouping({
        task,
        job_Shell,
        files: copy_Made.files,
        unplaceables: copy_Made.unplaceables,
        grouping: said_Grouping.grouping
      })
      const issues = issuesOf__Checked({
        said_Grouping,
        checked,
        clashesOf
      })
      return {
        commands_Shell: [],
        answer_Agent: {
          kind: "VERIFIED",
          issues,
          reports: checked.reports,
          next: issues.length === 0
            ? `It's good to hand back: run \`${command_Agent} done ${job_Shell.id} "<a note on the job as a whole>" <the same file>\`.`
            : `Fix each issue, in your copy or in your proposals, then verify again; ask \`${command_Agent} changes ${job_Shell.id}\` again if you've changed the copy since, as its numbers and stamp move with it.`
        }
      }
    }
  }),
  DONE: CHECKMAP__STANDING_JOB.DONE,
  CANCELLED: CHECKMAP__STANDING_JOB.CANCELLED
}

const DONEMAP__STANDING_JOB: _AnswerMap__Standing_Job_ = {
  QUEUED: CHECKMAP__STANDING_JOB.QUEUED,
  OFFERED: ({
    job_Shell,
    note,
    said,
    command_Agent
  }) => groupingOf__Said({
    said
  }).isGrouped
    ? answeredOf__Untaken({
      job_Shell,
      command_Agent
    })
    : {
      commands_Shell: [
        {
          kind: "TAKE",
          id_Job: job_Shell.id,
          note: ""
        },
        {
          kind: "HAND_BACK",
          id_Job: job_Shell.id,
          landing: LANDING_NONE,
          note
        }
      ],
      answer_Agent: {
        kind: "HANDED_BACK",
        reports: [],
        next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
      }
    },
  BEING_WORKED_ON: ({
    task,
    job_Shell,
    note,
    said,
    copy,
    clashesOf,
    command_Agent
  }) => {
    const said_Grouping = groupingOf__Said({
      said
    })
    if (!said_Grouping.isGrouped) {
      const count_Changed = copy.kind === "MADE"
        ? changesOf__Copy({
          files: copy.files
        }).length + copy.unplaceables.length
        : 0
      return count_Changed > 0
        ? {
          commands_Shell: [],
          answer_Agent: {
            kind: "REFUSED",
            issues: [`your copy has ${count_Changed} ${count_Changed === 1 ? "change" : "changes"}, so it can't be handed back in words alone`],
            next: `Nothing's handed back. Run \`${command_Agent} changes ${job_Shell.id}\` to see ${count_Changed === 1 ? "it" : "them"} and how to hand ${count_Changed === 1 ? "it" : "them"} back grouped into proposals, or put ${count_Changed === 1 ? "it" : "them"} back first.`
          }
        }
        : {
          commands_Shell: [
            {
              kind: "HAND_BACK",
              id_Job: job_Shell.id,
              landing: LANDING_NONE,
              note
            }
          ],
          answer_Agent: {
            kind: "HANDED_BACK",
            reports: [],
            next: `Handed back. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
          }
        }
    }
    return answeredOf__Copy({
      task,
      job_Shell,
      copy,
      command_Agent,
      read: (copy_Made) => {
        const checked = landingOf__Grouping({
          task,
          job_Shell,
          files: copy_Made.files,
          unplaceables: copy_Made.unplaceables,
          grouping: said_Grouping.grouping
        })
        const issues = issuesOf__Checked({
          said_Grouping,
          checked,
          clashesOf
        })
        return issues.length > 0
          ? {
            commands_Shell: [],
            answer_Agent: {
              kind: "REFUSED",
              issues,
              next: `Nothing's handed back. Fix each issue, check with \`${command_Agent} verify ${job_Shell.id} <file>\`, and hand back again.`
            }
          }
          : {
            commands_Shell: [
              {
                kind: "HAND_BACK",
                id_Job: job_Shell.id,
                landing: checked.landing,
                note
              }
            ],
            answer_Agent: {
              kind: "HANDED_BACK",
              reports: checked.reports,
              next: `Handed back: ${checked.landing.proposals.length} ${checked.landing.proposals.length === 1 ? "proposal" : "proposals"}, for review. Leave the copy as it is. Run \`${command_Agent} wait\` for the next job, with the same --for as before if you gave one.`
            }
          }
      }
    })
  },
  DONE: CHECKMAP__STANDING_JOB.DONE,
  CANCELLED: ({
    job_Shell,
    command_Agent
  }) => ({
    commands_Shell: [],
    answer_Agent: {
      kind: "STOPPED",
      next: `Job ${job_Shell.id} was stopped, so what you handed back isn't taken: drop it, and run \`${command_Agent} wait\` for the next job.`
    }
  })
}

const ANSWERMAPS__CALL: _AnswerMaps__Call_ = {
  CHECK: CHECKMAP__STANDING_JOB,
  CHANGES: CHANGESMAP__STANDING_JOB,
  VERIFY: VERIFYMAP__STANDING_JOB,
  DONE: DONEMAP__STANDING_JOB
}

interface _Api___issuesOf__Checked_ {
  said_Grouping: _Said_Grouping_
  checked: _Checked_Landing_
  clashesOf: (landing: _Landing_Handed_) => Array<string>
}

function issuesOf__Checked({
  said_Grouping,
  checked,
  clashesOf
}: _Api___issuesOf__Checked_): Array<string> {
  const issues = [
    ...said_Grouping.issues,
    ...checked.issues
  ]
  return issues.length > 0
    ? issues
    : clashesOf(checked.landing)
}

interface _Api___answeredOf__Untaken_ {
  job_Shell: _Job_Shell_
  command_Agent: string
}

function answeredOf__Untaken({
  job_Shell,
  command_Agent
}: _Api___answeredOf__Untaken_): _Answered_Call_ {
  return {
    commands_Shell: [],
    answer_Agent: answerOf__Refused({
      issues: [`job ${job_Shell.id} isn't taken yet: take it with \`${command_Agent} check ${job_Shell.id} "starting"\`, which gives you its copy`],
      command_Agent
    })
  }
}

interface _Api___answeredOf__Copy_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  copy: _Copy_Agent_
  command_Agent: string
  read: _Read_Copy_
}

type _Read_Copy_ = (copy_Made: _MADE_Copy_Agent_) => _Answered_Call_

function answeredOf__Copy({
  job_Shell,
  copy,
  command_Agent,
  read
}: _Api___answeredOf__Copy_): _Answered_Call_ {
  return copy.kind === "MADE"
    ? read(copy)
    : {
      commands_Shell: [],
      answer_Agent: answerOf__Refused({
        issues: [`job ${job_Shell.id} has no working copy: ${copy.why}; answer in words, with \`${command_Agent} done ${job_Shell.id} "<note>"\``],
        command_Agent
      })
    }
}

interface _Api___saidOf__Change_ {
  change: _Change_Copy_
}

function saidOf__Change({
  change
}: _Api___saidOf__Change_): _Change_Said_ {
  const line_From = change.range.from.line + 1
  const line_To = change.range.to.line + 1
  return {
    number: change.number,
    path: change.path,
    file: SAIDMAP__EFFECT[change.effect],
    lines: line_From === line_To ? String(line_From) : `${line_From}–${line_To}`,
    before: change.before,
    after: change.after
  }
}

type _SaidMap__Effect_ = {
  [Effect in _Effect_Proposal_Tasks_]: string
}

const SAIDMAP__EFFECT: _SaidMap__Effect_ = {
  CHANGE: "changed",
  MAKE: "made",
  REMOVE: "deleted"
}

interface _Api___groupingOf__Said_ {
  said: unknown
}

interface _Said_Grouping_ {
  isGrouped: boolean
  issues: Array<string>
  grouping: _Grouping_Job_
}

function groupingOf__Said({
  said
}: _Api___groupingOf__Said_): _Said_Grouping_ {
  const record = recordOf({
    value: said
  })
  const isGrouped = "proposals" in record || "nothing" in record
  const proposals_Said = Array.isArray(record["proposals"]) ? record["proposals"] : []
  const nothings_Said = Array.isArray(record["nothing"]) ? record["nothing"] : []
  const stringOf = (value: unknown) => typeof value === "string" ? value : ""
  const proposals = proposals_Said.map((proposal_Said, index): _Proposal_Said_ => {
    const proposal_Record = recordOf({
      value: proposal_Said
    })
    const numbers = Array.isArray(proposal_Record["changes"]) ? proposal_Record["changes"].filter((number): number is number => Number.isInteger(number)) : []
    const ids_Request = Array.isArray(proposal_Record["answers"]) ? proposal_Record["answers"].filter((id): id is string => typeof id === "string") : []
    const revises = stringOf(proposal_Record["revises"])
    return {
      aim: revises === ""
        ? {
          kind: "NEW"
        }
        : {
          kind: "REVISION",
          id_Proposal: revises
        },
      title: stringOf(proposal_Record["title"]),
      why: stringOf(proposal_Record["why"]),
      numbers,
      ids_Request,
      issues: [
        ...Array.isArray(proposal_Record["changes"]) && numbers.length === proposal_Record["changes"].length ? [] : [`proposal ${index + 1}'s "changes" isn't a list of change numbers`],
        ...Array.isArray(proposal_Record["answers"]) && ids_Request.length === proposal_Record["answers"].length ? [] : [`proposal ${index + 1}'s "answers" isn't a list of request ids`]
      ]
    }
  })
  const nothings = nothings_Said.map((nothing_Said): _Nothing_Grouped_ => {
    const nothing_Record = recordOf({
      value: nothing_Said
    })
    return {
      id_Request: stringOf(nothing_Record["request"]),
      why: stringOf(nothing_Record["why"])
    }
  })
  return {
    isGrouped,
    issues: [
      ...isGrouped ? [] : ["there are no proposals: give \"proposals\", and \"nothing\" for the requests that need nothing"],
      ..."proposals" in record && !Array.isArray(record["proposals"]) ? ["\"proposals\" isn't a list"] : [],
      ..."nothing" in record && !Array.isArray(record["nothing"]) ? ["\"nothing\" isn't a list"] : [],
      ...proposals.flatMap((proposal) => proposal.issues),
      ...nothings.flatMap((nothing, index) => nothing.id_Request === "" ? [`"nothing" ${index + 1} names no request`] : [])
    ],
    grouping: {
      stamp: stringOf(record["stamp"]),
      proposals: proposals.map((proposal) => ({
        aim: proposal.aim,
        title: proposal.title,
        why: proposal.why,
        numbers: proposal.numbers,
        ids_Request: proposal.ids_Request
      })),
      nothings
    }
  }
}

interface _Proposal_Said_ extends _Proposal_Grouped_ {
  issues: Array<string>
}

interface _Api___recordOf_ {
  value: unknown
}

interface _Record_Said_ {
  [name: string]: unknown
}

function recordOf({
  value
}: _Api___recordOf_): _Record_Said_ {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : {}
}

interface _Api___nextOf__Grouping_ {
  job_Shell: _Job_Shell_
  command_Agent: string
}

function nextOf__Grouping({
  job_Shell,
  command_Agent
}: _Api___nextOf__Grouping_): string {
  return [
    "These are your changes, numbered, each what was there and what's there now. Group them into proposals, each one idea, decided whole, in one file: give each a title, why, the numbers of its changes, and the ids of the requests it answers.",
    "A file you made or deleted is one change, the whole of its text, said \"made\" or \"deleted\": give it a proposal of its own, which reviews it as a new file or a deletion.",
    job_Shell.sources.length > 0 ? `A change to a proposal you're revising, ${job_Shell.sources.join(", ")}, goes in its revision, with "revises" its id instead of a title, its why saying what this round changed.` : "",
    "For a request that needs nothing changed, say why under \"nothing\".",
    `Write it as JSON, to a file outside your copy: {"stamp": "<the stamp above>", "proposals": [{"title": "...", "why": "...", "changes": [1, 2], "answers": ["<request id>"]}], "nothing": [{"request": "<request id>", "why": "..."}]}.`,
    `Check it with \`${command_Agent} verify ${job_Shell.id} <file>\` as often as you like, then hand back with \`${command_Agent} done ${job_Shell.id} "<a note on the job as a whole>" <file>\`.`
  ].filter((sentence) => sentence !== "").join(" ")
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

