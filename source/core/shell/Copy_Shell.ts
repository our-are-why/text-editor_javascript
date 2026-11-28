import {
  comparisonOf__Texts,
  narrowedOf__Run,
  flatOf__Text,
  textIn__Range,
  piecesWith__Sources,
  textWith__Sources,
  indexOf__Position,
  positionOf__Index,
  parseTexts_Line,
  type _Text_Model_,
  type _Range_Text_,
  type _Change_,
  type _NonEmpty_,
  type _Piece_Applied_,
  type _Position_Text_,
  type _Run_Comparison_
} from "../documents/index.ts"
import type {
  _Effect_Proposal_Tasks_,
  _Task_Tasks_
} from "../tasks/index.ts"
import type {
  _Job_Shell_,
  _Given_Job_
} from "./Jobs_Shell.ts"

export {
  changesOf__Copy,
  type _Api___changesOf__Copy_,
  type _File_Copy_,
  type _Change_Copy_,
  wholeOf__File,
  type _Api___wholeOf__File_,
  endOf__Text,
  type _Api___endOf__Text_,
  POSITION_START,
  stampOf__Changes,
  type _Api___stampOf__Changes_,
  landingOf__Grouping,
  type _Api___landingOf__Grouping_,
  movedOf__Changes,
  type _Api___movedOf__Changes_,
  type _Moved_Changes_,
  type _Move_Copy_,
  shapeOf__Move,
  type _Api___shapeOf__Move_,
  type _Shape_Move_,
  type __BASE_Shape_Move_,
  type _SHAPED_Shape_Move_,
  type _UNSHAPED_Shape_Move_,
  slidesOf,
  type _Api___slidesOf_,
  shapeOf__Texts,
  type _Api___shapeOf__Texts_,
  COUNT_MOST__SLIDE,
  COUNT_MOST__PAIR,
  issuesOf__Move,
  type _Api___issuesOf__Move_,
  type _Unplaceable_Copy_,
  type _Grouping_Job_,
  type _Move_Grouped_,
  type _Proposal_Grouped_,
  type _Aim_Grouped_,
  type __BASE_Aim_Grouped_,
  type _NEW_Aim_Grouped_,
  type _REVISION_Aim_Grouped_,
  type _Nothing_Grouped_,
  type _Checked_Landing_,
  type _Landing_Handed_,
  type _Proposal_Handed_,
  type _Nothing_Handed_,
  handedOf__Proposal,
  type _Api___handedOf__Proposal_,
  type _Handed_Proposal_,
  type _WordsMap__Effect_,
  WORDSMAP__EFFECT,
  placedOf__Changes,
  type _Api___placedOf__Changes_,
  type _Placed_Changes_,
  spanOf__Change,
  type _Api___spanOf__Change_,
  type _Span_Change_,
  type __BASE_Span_Change_,
  type _PLACED_Span_Change_,
  type _REFUSED_Span_Change_,
  segmentsOf__Given,
  type _Api___segmentsOf__Given_,
  type _Segment_Given_,
  PIECE_START,
  nameOf__Source,
  type _Api___nameOf__Source_,
  appliedOf__Changes_Copy,
  type _Api___appliedOf__Changes_Copy_,
  landingOf__Base,
  type _Api___landingOf__Base_,
  LANDING_NONE
}

interface _Api___changesOf__Copy_ {
  files: Array<_File_Copy_>
}

interface _File_Copy_ {
  given: _Given_Job_
  effect: _Effect_Proposal_Tasks_
  text_Copy: _Text_Model_
}

interface _Change_Copy_ {
  number: number
  path: string
  effect: _Effect_Proposal_Tasks_
  range: _Range_Text_
  before: string
  after: string
}

function changesOf__Copy({
  files
}: _Api___changesOf__Copy_): Array<_Change_Copy_> {
  return files
    .toSorted((
      file,
      file_Other
    ) => file.given.path < file_Other.given.path ? -1 : file.given.path > file_Other.given.path ? 1 : 0)
    .flatMap((file) => (file.effect === "CHANGE"
      ? comparisonOf__Texts({
        text_Before: file.given.text,
        text_After: file.text_Copy
      })
        .flatMap((run) => narrowedOf__Run({
          run,
          text_Before: file.given.text,
          text_After: file.text_Copy
        }))
      : [
        wholeOf__File({
          file
        })
      ])
      .flatMap((run) => run.kind === "CHANGED"
        ? [
          {
            path: file.given.path,
            effect: file.effect,
            range: run.range_Before,
            before: flatOf__Text(textIn__Range({
              text_Model: file.given.text,
              range: run.range_Before
            })),
            after: flatOf__Text(textIn__Range({
              text_Model: file.text_Copy,
              range: run.range_After
            }))
          }
        ]
        : []))
    .map((change, index) => ({
      number: index + 1,
      ...change
    }))
}

interface _Api___wholeOf__File_ {
  file: _File_Copy_
}

function wholeOf__File({
  file
}: _Api___wholeOf__File_): _Run_Comparison_ {
  return {
    kind: "CHANGED",
    range_Before: {
      from: POSITION_START,
      to: endOf__Text({
        text_Model: file.given.text
      })
    },
    range_After: {
      from: POSITION_START,
      to: endOf__Text({
        text_Model: file.text_Copy
      })
    }
  }
}

interface _Api___endOf__Text_ {
  text_Model: _Text_Model_
}

function endOf__Text({
  text_Model
}: _Api___endOf__Text_): _Position_Text_ {
  return positionOf__Index({
    text_Model,
    index: Array.from(flatOf__Text(text_Model)).length
  })
}

const POSITION_START: _Position_Text_ = {
  line: 0,
  offset: 0
}

interface _Api___stampOf__Changes_ {
  changes: Array<_Change_Copy_>
}

function stampOf__Changes({
  changes
}: _Api___stampOf__Changes_): string {
  let hash = 0x811c9dc5
  for (const character of JSON.stringify(changes)) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

interface _Api___landingOf__Grouping_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  files: Array<_File_Copy_>
  unplaceables: Array<_Unplaceable_Copy_>
  grouping: _Grouping_Job_
}

interface _Unplaceable_Copy_ {
  path: string
  why: string
}

interface _Grouping_Job_ {
  stamp: string
  moves: Array<_Move_Grouped_>
  proposals: Array<_Proposal_Grouped_>
  nothings: Array<_Nothing_Grouped_>
}

interface _Move_Grouped_ {
  number_From: number
  number_To: number
}

interface _Proposal_Grouped_ {
  aim: _Aim_Grouped_
  title: string
  why: string
  numbers: Array<number>
  ids_Request: Array<string>
}

type _Aim_Grouped_ = _NEW_Aim_Grouped_ | _REVISION_Aim_Grouped_

interface __BASE_Aim_Grouped_<Kind extends string> {
  kind: Kind
}

interface _NEW_Aim_Grouped_ extends __BASE_Aim_Grouped_<"NEW"> {}

interface _REVISION_Aim_Grouped_ extends __BASE_Aim_Grouped_<"REVISION"> {
  id_Proposal: string
}

interface _Nothing_Grouped_ {
  id_Request: string
  why: string
}

interface _Checked_Landing_ {
  issues: Array<string>
  reports: Array<string>
  landing: _Landing_Handed_
}

interface _Landing_Handed_ {
  proposals: Array<_Proposal_Handed_>
  nothings: Array<_Nothing_Handed_>
}

interface _Proposal_Handed_ {
  id: string
  path: string
  effect: _Effect_Proposal_Tasks_
  title: string
  rationale: string
  version: string
  changes: _NonEmpty_<_Change_>
  ids_Request: Array<string>
}

interface _Nothing_Handed_ {
  id_Request: string
  note: string
}

function landingOf__Grouping({
  task,
  job_Shell,
  files,
  unplaceables,
  grouping
}: _Api___landingOf__Grouping_): _Checked_Landing_ {
  const changes_Copy = changesOf__Copy({
    files
  })
  const moved = movedOf__Changes({
    files,
    changes: changes_Copy,
    moves: grouping.moves
  })
  const changes = moved.changes
  const numbers_Grouped = grouping.proposals.flatMap((proposal) => proposal.numbers)
  const ids_Job = job_Shell.requests.map((request) => request.id)
  const ids_Task = task.requests.map((request) => request.id)
  const ids_Answered = [
    ...grouping.proposals.flatMap((proposal) => proposal.ids_Request),
    ...grouping.nothings.map((nothing) => nothing.id_Request)
  ]
  const handed = grouping.proposals.map((proposal, index) => handedOf__Proposal({
    task,
    job_Shell,
    files,
    changes,
    moves: moved.moves,
    proposal,
    id: `${job_Shell.id}.${index + 1}`
  }))
  const paths_Job = pathsOf__Job({
    task,
    job_Shell
  })
  const issues = [
    ...grouping.stamp === stampOf__Changes({
      changes: changes_Copy
    })
      ? []
      : ["the copy's changed since you asked what you changed, or you've given no stamp: ask what you changed again, and hand back with the stamp it gives"],
    ...unplaceables.map((unplaceable) => `${unplaceable.path} ${unplaceable.why}`),
    ...moved.issues,
    ...moved.moves.flatMap((move) => issuesOf__Move({
      move,
      proposals: grouping.proposals
    })),
    ...numbers_Grouped.flatMap((number) => changes.some((change) => change.number === number) ? [] : [`there's no change ${number}`]),
    ...changes.flatMap((change) => {
      const count = numbers_Grouped.filter((number) => number === change.number).length
      return count === 0
        ? [`change ${change.number} is in no proposal`]
        : count > 1
          ? [`change ${change.number} is in more than one proposal`]
          : []
    }),
    ...ids_Answered.flatMap((id) => ids_Task.includes(id) ? [] : [`there's no request ${id}`]),
    ...ids_Job.flatMap((id) => ids_Answered.includes(id) ? [] : [`request ${id} isn't answered: put it in the answers of the proposal it's answered by, or say why nothing needs to change`]),
    ...grouping.nothings.flatMap((nothing) => nothing.why.trim() === "" ? [`say why request ${nothing.id_Request} needs nothing`] : []),
    ...handed.flatMap((handed_Proposal) => handed_Proposal.issues)
  ]
  const reports = [
    ...ids_Answered.flatMap((id) => ids_Task.includes(id) && !ids_Job.includes(id) ? [`request ${id} isn't this job's, so answering it here leaves it as it is`] : []),
    ...[...new Set(changes.map((change) => change.path))].flatMap((path) => paths_Job.includes(path) ? [] : [`${path} is in no request of this job: its changes are proposed all the same, for review`])
  ]
  return {
    issues,
    reports,
    landing: {
      proposals: handed.flatMap((handed_Proposal) => handed_Proposal.proposal),
      nothings: grouping.nothings.map((nothing) => ({
        id_Request: nothing.id_Request,
        note: nothing.why
      }))
    }
  }
}

interface _Api___movedOf__Changes_ {
  files: Array<_File_Copy_>
  changes: Array<_Change_Copy_>
  moves: Array<_Move_Grouped_>
}

interface _Moved_Changes_ {
  issues: Array<string>
  changes: Array<_Change_Copy_>
  moves: Array<_Move_Copy_>
}

interface _Move_Copy_ {
  change_From: _Change_Copy_
  change_To: _Change_Copy_
  range: _Range_Text_
  at: _Position_Text_
  changes_Edge: Array<_Change_Copy_>
  numbers_Inside: Array<number>
}

function movedOf__Changes({
  files,
  changes,
  moves
}: _Api___movedOf__Changes_): _Moved_Changes_ {
  const numbers_Moved = moves.flatMap((move) => [
    move.number_From,
    move.number_To
  ])
  const issues: Array<string> = []
  const moves_Copy: Array<_Move_Copy_> = []
  const changes_Inside: Array<_Change_Copy_> = []
  for (const move of moves) {
    const name = `move ${move.number_From} to ${move.number_To}`
    const change_From = changes.find((change) => change.number === move.number_From)
    const change_To = changes.find((change) => change.number === move.number_To)
    const given = files.find((file) => file.given.path === change_From?.path)?.given
    const issues_Move = [
      ...change_From === undefined ? [`${name} takes its text from change ${move.number_From}, but there's no change ${move.number_From}`] : [],
      ...change_To === undefined ? [`${name} puts its text where change ${move.number_To} is, but there's no change ${move.number_To}`] : [],
      ...change_From !== undefined && (change_From.before === "" || change_From.after !== "") ? [`change ${change_From.number} isn't only text taken out, so ${name} can't take its text from there`] : [],
      ...change_To !== undefined && (change_To.after === "" || change_To.before !== "") ? [`change ${change_To.number} isn't only text put in, so ${name} can't put its text there`] : [],
      ...change_From !== undefined && change_To !== undefined && change_From.path !== change_To.path ? [`${name} goes from ${change_From.path} to ${change_To.path}: a move stays in its file, for now, so say it as text taken out of one and put in the other`] : [],
      ...[
        move.number_From,
        move.number_To
      ].flatMap((number) => numbers_Moved.filter((number_Each) => number_Each === number).length > 1 ? [`change ${number} is in more than one move, or both sides of one`] : [])
    ]
    if (issues_Move.length > 0 || change_From === undefined || change_To === undefined || given === undefined) {
      issues.push(...issues_Move)
      continue
    }
    const shape = shapeOf__Move({
      given,
      changes,
      change_From,
      change_To,
      number_Next: changes.length + changes_Inside.length + 1
    })
    if (shape.kind === "UNSHAPED") {
      issues.push(`what change ${change_To.number} puts in isn't mostly what change ${change_From.number} takes out, starting as it does, so ${name} can't be drawn as a move: say them apart`)
      continue
    }
    changes_Inside.push(...shape.changes_Inside)
    moves_Copy.push({
      change_From,
      change_To,
      range: shape.range,
      at: shape.at,
      changes_Edge: shape.changes_Edge,
      numbers_Inside: shape.changes_Inside.map((change) => change.number)
    })
  }
  return {
    issues: [...new Set(issues)],
    changes: [
      ...changes,
      ...changes_Inside
    ],
    moves: moves_Copy
  }
}

interface _Api___shapeOf__Move_ {
  given: _Given_Job_
  changes: Array<_Change_Copy_>
  change_From: _Change_Copy_
  change_To: _Change_Copy_
  number_Next: number
}

type _Shape_Move_ = _SHAPED_Shape_Move_ | _UNSHAPED_Shape_Move_

interface __BASE_Shape_Move_<Kind extends string> {
  kind: Kind
}

interface _SHAPED_Shape_Move_ extends __BASE_Shape_Move_<"SHAPED"> {
  range: _Range_Text_
  at: _Position_Text_
  changes_Edge: Array<_Change_Copy_>
  changes_Inside: Array<_Change_Copy_>
}

interface _UNSHAPED_Shape_Move_ extends __BASE_Shape_Move_<"UNSHAPED"> {}

function shapeOf__Move({
  given,
  changes,
  change_From,
  change_To,
  number_Next
}: _Api___shapeOf__Move_): _Shape_Move_ {
  const characters = Array.from(flatOf__Text(given.text))
  const indexOf = (position: _Position_Text_) => indexOf__Position({
    text_Model: given.text,
    position
  })
  const positionOf = (index: number) => positionOf__Index({
    text_Model: given.text,
    index
  })
  const from = indexOf(change_From.range.from)
  const to = indexOf(change_From.range.to)
  const at = indexOf(change_To.range.from)
  const put = Array.from(change_To.after)
  const ends_Other = changes
    .filter((change) => change.path === given.path && change !== change_From && change !== change_To)
    .flatMap((change) => [
      indexOf(change.range.from),
      indexOf(change.range.to)
    ])
  const ends_From = [
    ...ends_Other,
    at
  ]
  const ends_To = [
    ...ends_Other,
    from,
    to
  ]
  const slides_From = slidesOf({
    isSlid: (step) => step > 0
      ? to + step - 1 < characters.length && characters[from + step - 1] === characters[to + step - 1] && ends_From.every((end) => end <= from || end >= to + step + 1)
      : from + step >= 0 && characters[from + step] === characters[to + step] && ends_From.every((end) => end >= to || end <= from + step - 1),
    count_Most: Math.min(to - from, COUNT_MOST__SLIDE)
  })
  const slides_To = slidesOf({
    isSlid: (step) => step > 0
      ? at + step - 1 < characters.length && characters[at + step - 1] === put[(step - 1) % put.length] && ends_To.every((end) => end <= at || end >= at + step + 1)
      : at + step >= 0 && characters[at + step] === put[put.length - 1 - ((-step - 1) % put.length)] && ends_To.every((end) => end >= at || end <= at + step - 1),
    count_Most: Math.min(put.length, COUNT_MOST__SLIDE)
  })
  const textOf__Slide_From = (step: number) => characters.slice(from + step, to + step).join("")
  const textOf__Slide_To = (step: number) => {
    const turn = ((step % put.length) + put.length) % put.length
    return [
      ...put.slice(turn),
      ...put.slice(0, turn)
    ].join("")
  }
  const isApart = (
    step_From: number,
    step_To: number
  ) => at + step_To < from + step_From || at + step_To > to + step_From
  const isLineStart = (index: number) => index === 0 || characters[index - 1] === "\n"
  const scoreOf = (
    step_From: number,
    step_To: number
  ) => (isLineStart(from + step_From) && isLineStart(to + step_From) && isLineStart(at + step_To) ? 0 : COUNT_MOST__SLIDE * 4) + Math.abs(step_From) + Math.abs(step_To)
  const steps_From_Same = new Map(slides_From.toReversed().map((step) => [
    textOf__Slide_From(step),
    step
  ]))
  const [pair_Same] = slides_To
    .flatMap((step_To) => {
      const step_From = steps_From_Same.get(textOf__Slide_To(step_To))
      return step_From === undefined || !isApart(step_From, step_To)
        ? []
        : [
          [
            step_From,
            step_To
          ] as const
        ]
    })
    .toSorted((
      pair,
      pair_Other
    ) => scoreOf(...pair) - scoreOf(...pair_Other))
  if (pair_Same !== undefined) {
    return {
      kind: "SHAPED",
      range: {
        from: positionOf(from + pair_Same[0]),
        to: positionOf(to + pair_Same[0])
      },
      at: positionOf(at + pair_Same[1]),
      changes_Edge: [],
      changes_Inside: []
    }
  }
  const pairs = slides_From
    .flatMap((step_From) => slides_To.map((step_To) => [
      step_From,
      step_To
    ] as const))
    .filter(([
      step_From,
      step_To
    ]) => isApart(step_From, step_To))
    .toSorted((
      pair,
      pair_Other
    ) => Math.abs(pair[0]) + Math.abs(pair[1]) - Math.abs(pair_Other[0]) - Math.abs(pair_Other[1]))
    .slice(0, COUNT_MOST__PAIR)
  const countOf__Edges = (shape: _SHAPED_Shape_Move_) => shape.changes_Edge.reduce((count, change) => count + Array.from(change.before).length + Array.from(change.after).length, 0)
  const isLines = (shape: _SHAPED_Shape_Move_) => shape.range.from.offset === 0 && shape.range.to.offset === 0 && shape.at.offset === 0
  const [shape_Best] = pairs
    .flatMap(([
      step_From,
      step_To
    ]) => {
      const shape = shapeOf__Texts({
        given,
        characters,
        ends: [
          ...ends_Other,
          from + step_From,
          to + step_From
        ],
        change_From,
        change_To,
        index_From: from + step_From,
        index_At: at + step_To,
        text_From: textOf__Slide_From(step_From),
        text_To: textOf__Slide_To(step_To),
        number_Next
      })
      return shape.kind === "SHAPED" ? [shape] : []
    })
    .toSorted((
      shape,
      shape_Other
    ) => countOf__Edges(shape) - countOf__Edges(shape_Other) || Number(isLines(shape_Other)) - Number(isLines(shape)))
  return shape_Best ?? {
    kind: "UNSHAPED"
  }
}

interface _Api___slidesOf_ {
  isSlid: (step: number) => boolean
  count_Most: number
}

function slidesOf({
  isSlid,
  count_Most
}: _Api___slidesOf_): Array<number> {
  const steps_Right: Array<number> = []
  const steps_Left: Array<number> = []
  for (let step = 1; step <= count_Most && isSlid(step); step += 1) steps_Right.push(step)
  for (let step = -1; step >= -count_Most && isSlid(step); step -= 1) steps_Left.push(step)
  return [
    0,
    ...Array.from(
      {
        length: Math.max(steps_Right.length, steps_Left.length)
      },
      (
        _,
        index
      ) => [
        ...steps_Right.slice(index, index + 1),
        ...steps_Left.slice(index, index + 1)
      ]
    ).flat()
  ]
}

interface _Api___shapeOf__Texts_ {
  given: _Given_Job_
  characters: Array<string>
  ends: Array<number>
  change_From: _Change_Copy_
  change_To: _Change_Copy_
  index_From: number
  index_At: number
  text_From: string
  text_To: string
  number_Next: number
}

function shapeOf__Texts({
  given,
  characters,
  ends,
  change_From,
  change_To,
  index_From,
  index_At,
  text_From,
  text_To,
  number_Next
}: _Api___shapeOf__Texts_): _Shape_Move_ {
  const model_From: _Text_Model_ = {
    lines: parseTexts_Line(text_From),
    marks: []
  }
  const model_To: _Text_Model_ = {
    lines: parseTexts_Line(text_To),
    marks: []
  }
  const runs = comparisonOf__Texts({
    text_Before: model_From,
    text_After: model_To
  }).flatMap((run) => narrowedOf__Run({
    run,
    text_Before: model_From,
    text_After: model_To
  }))
  const indexIn = (
    model: _Text_Model_,
    position: _Position_Text_
  ) => indexOf__Position({
    text_Model: model,
    position
  })
  const textIn = (
    model: _Text_Model_,
    range: _Range_Text_
  ) => flatOf__Text(textIn__Range({
    text_Model: model,
    range
  }))
  const indexes_Same = runs.flatMap((run, index) => run.kind === "KEPT" && indexIn(model_From, run.range_Before.from) < indexIn(model_From, run.range_Before.to) ? [index] : [])
  const index_First = indexes_Same[0]
  const index_Last = indexes_Same.at(-1)
  const run_First = index_First === undefined ? undefined : runs[index_First]
  const run_Last = index_Last === undefined ? undefined : runs[index_Last]
  const count_From = Array.from(text_From).length
  const count_Same = indexes_Same.reduce((count, index) => {
    const run = runs[index]
    return run === undefined ? count : count + Array.from(textIn(model_From, run.range_Before)).length
  }, 0)
  const characters_To = Array.from(text_To)
  const head_To = run_First === undefined ? [] : characters_To.slice(0, indexIn(model_To, run_First.range_After.from))
  const isHead_Slid = head_To.length === 0 || index_At > 0 && characters[index_At - 1] === head_To.at(-1) && ends.every((end) => end < index_At - 1 || end > index_At)
  if (index_First === undefined || index_Last === undefined || run_First === undefined || run_Last === undefined || !isHead_Slid || count_Same * 2 < count_From) {
    return {
      kind: "UNSHAPED"
    }
  }
  const run_Before_Last = index_Last - 1 > index_First ? runs[index_Last - 1] : undefined
  const text_Last = textIn(model_From, run_Last.range_Before)
  const taken_Before_Last = run_Before_Last === undefined ? "" : textIn(model_From, run_Before_Last.range_Before)
  const put_Before_Last = run_Before_Last === undefined ? "" : textIn(model_To, run_Before_Last.range_After)
  const isTaken_Slid = run_Before_Last?.kind === "CHANGED" && put_Before_Last === "" && taken_Before_Last !== "" && `${taken_Before_Last}${text_Last}`.startsWith(text_Last)
  const isPut_Slid = run_Before_Last?.kind === "CHANGED" && taken_Before_Last === "" && put_Before_Last !== "" && `${put_Before_Last}${text_Last}`.startsWith(text_Last)
  const count_Last = Array.from(text_Last).length
  const index_Start = indexIn(model_From, run_First.range_Before.from)
  const index_End = isTaken_Slid && run_Before_Last !== undefined ? indexIn(model_From, run_Before_Last.range_Before.from) + count_Last : indexIn(model_From, run_Last.range_Before.to)
  const index_End_To = isPut_Slid && run_Before_Last !== undefined ? indexIn(model_To, run_Before_Last.range_After.from) + count_Last : indexIn(model_To, run_Last.range_After.to)
  const positionOf = (index: number) => positionOf__Index({
    text_Model: given.text,
    index
  })
  const rangeOf = (
    index: number,
    index_To: number
  ): _Range_Text_ => ({
    from: positionOf(index),
    to: positionOf(index_To)
  })
  const characters_From = Array.from(text_From)
  return {
    kind: "SHAPED",
    range: rangeOf(index_From + index_Start, index_From + index_End),
    at: positionOf(index_At),
    changes_Edge: [
      ...head_To.length > 0
        ? [
          {
            ...change_To,
            range: rangeOf(index_At - 1, index_At - 1),
            after: [
              ...head_To.slice(-1),
              ...head_To.slice(0, -1)
            ].join("")
          }
        ]
        : [],
      ...index_Start > 0
        ? [
          {
            ...change_From,
            range: rangeOf(index_From, index_From + index_Start),
            before: characters_From.slice(0, index_Start).join("")
          }
        ]
        : [],
      ...index_End < count_From
        ? [
          {
            ...change_From,
            range: rangeOf(index_From + index_End, index_From + count_From),
            before: characters_From.slice(index_End).join("")
          }
        ]
        : [],
      ...index_End_To < characters_To.length
        ? [
          {
            ...change_To,
            range: rangeOf(index_At, index_At),
            after: characters_To.slice(index_End_To).join("")
          }
        ]
        : []
    ],
    changes_Inside: runs
      .slice(index_First, isTaken_Slid || isPut_Slid ? index_Last - 1 : index_Last + 1)
      .filter((run) => run.kind === "CHANGED")
      .map((run, index) => ({
        number: number_Next + index,
        path: given.path,
        effect: "CHANGE",
        range: rangeOf(index_From + indexIn(model_From, run.range_Before.from), index_From + indexIn(model_From, run.range_Before.to)),
        before: textIn(model_From, run.range_Before),
        after: textIn(model_To, run.range_After)
      }))
  }
}

const COUNT_MOST__SLIDE = 64

const COUNT_MOST__PAIR = 64

interface _Api___issuesOf__Move_ {
  move: _Move_Copy_
  proposals: Array<_Proposal_Grouped_>
}

function issuesOf__Move({
  move,
  proposals
}: _Api___issuesOf__Move_): Array<string> {
  const number_From = move.change_From.number
  const number_To = move.change_To.number
  const name = `move ${number_From} to ${number_To}`
  const proposal_From = proposals.find((proposal) => proposal.numbers.includes(number_From))
  const proposal_To = proposals.find((proposal) => proposal.numbers.includes(number_To))
  return [
    ...proposal_From !== undefined && proposal_To !== undefined && proposal_From !== proposal_To ? [`changes ${number_From} and ${number_To} are ${name}, so they go in one proposal`] : [],
    ...proposal_From?.aim.kind === "REVISION" ? [`${name} is in a revision: a move goes in a new proposal, for now`] : [],
    ...move.numbers_Inside.flatMap((number) => [
      proposal_From,
      proposal_To
    ].some((proposal) => proposal?.numbers.includes(number) === true) ? [`change ${number} is an edit in the text ${name} moves, drawn inside the move, so it goes in a proposal apart from the move's`] : [])
  ]
}

interface _Api___pathsOf__Job_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
}

function pathsOf__Job({
  task,
  job_Shell
}: _Api___pathsOf__Job_): Array<string> {
  return job_Shell.requests.some((request) => request.aim.kind === "TASK")
    ? [
      ...new Set([
        job_Shell.path,
        ...task.proposals.map((proposal) => proposal.path),
        ...task.heads.map((head) => head.path)
      ])
    ]
    : [
      ...new Set(job_Shell.requests.map((request) => {
        const aim = request.aim
        return aim.kind === "DOCUMENT"
          ? aim.path
          : aim.kind === "PROPOSAL"
            ? task.proposals.find((proposal) => proposal.id === aim.id_Proposal)?.path ?? job_Shell.path
            : job_Shell.path
      }))
    ]
}

interface _Api___handedOf__Proposal_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  files: Array<_File_Copy_>
  changes: Array<_Change_Copy_>
  moves: Array<_Move_Copy_>
  proposal: _Proposal_Grouped_
  id: string
}

interface _Handed_Proposal_ {
  issues: Array<string>
  proposal: Array<_Proposal_Handed_>
}

function handedOf__Proposal({
  task,
  job_Shell,
  files,
  changes,
  moves,
  proposal,
  id
}: _Api___handedOf__Proposal_): _Handed_Proposal_ {
  const changes_Own = changes.filter((change) => proposal.numbers.includes(change.number))
  const aim = proposal.aim
  const id_Revised = aim.kind === "REVISION" ? aim.id_Proposal : ""
  const proposal_Task = aim.kind === "REVISION" ? task.proposals.find((each) => each.id === id_Revised) : undefined
  const name = aim.kind === "REVISION" ? `the revision of ${id_Revised}` : `proposal "${proposal.title}"`
  const paths = [...new Set(changes_Own.map((change) => change.path))]
  const [path] = paths
  const file = files.find((file_Each) => file_Each.given.path === path)
  const issues_Said = [
    ...proposal.aim.kind === "NEW" && proposal.title.trim() === "" ? [`a proposal with changes ${proposal.numbers.join(", ")} has no title`] : [],
    ...proposal.aim.kind === "NEW" && proposal.why.trim() === "" ? [`${name} doesn't say why`] : [],
    ...aim.kind === "REVISION" && proposal_Task === undefined ? [`there's no proposal ${id_Revised} to revise`] : [],
    ...proposal_Task !== undefined && proposal_Task.decision !== "OPEN" ? [`proposal ${proposal_Task.id} is ${proposal_Task.decision.toLowerCase()}: only an open one's revised`] : [],
    ...proposal.aim.kind === "REVISION" && proposal_Task !== undefined && !job_Shell.sources.includes(proposal_Task.id) ? [`proposal ${proposal_Task.id} isn't one this job revises, so it isn't in your copy`] : [],
    ...changes_Own.length === 0 && proposal.numbers.length === 0 ? [`${name} has no changes`] : [],
    ...paths.length > 1 ? [`${name} changes more than one file, ${paths.join(", ")}: make one proposal a file, for now`] : [],
    ...proposal_Task !== undefined && path !== undefined && proposal_Task.path !== path ? [`proposal ${proposal_Task.id} is on ${proposal_Task.path}, but its revision's changes are on ${path}`] : [],
    ...aim.kind === "REVISION" ? changes_Own.flatMap((change) => change.effect === "CHANGE" ? [] : [`change ${change.number} ${WORDSMAP__EFFECT[change.effect]} ${change.path}: a file made or deleted goes in a new proposal of its own, not a revision`]) : []
  ]
  if (issues_Said.length > 0 || path === undefined || file === undefined) {
    return {
      issues: issues_Said,
      proposal: []
    }
  }
  const placed = aim.kind === "REVISION"
    ? revisedOf__Changes({
      task,
      job_Shell,
      given: file.given,
      source: id_Revised,
      changes: changes_Own
    })
    : placedOf__Changes({
      task,
      job_Shell,
      given: file.given,
      changes: changes_Own,
      moves: moves.filter((move) => proposal.numbers.includes(move.change_From.number) && proposal.numbers.includes(move.change_To.number))
    })
  const [
    change_First,
    ...changes_Rest
  ] = placed.changes
  if (placed.issues.length > 0 || change_First === undefined) {
    return {
      issues: placed.issues.length > 0 ? placed.issues : [`${name} leaves its proposal changing nothing`],
      proposal: []
    }
  }
  return {
    issues: [],
    proposal: [
      {
        id: proposal_Task?.id ?? id,
        path,
        effect: proposal_Task?.effect ?? file.effect,
        title: proposal.title.trim() === "" ? proposal_Task?.title ?? "" : proposal.title,
        rationale: proposal.why.trim() === "" ? proposal_Task?.rationale ?? "" : proposal.why,
        version: file.given.version,
        changes: [
          change_First,
          ...changes_Rest
        ],
        ids_Request: proposal.ids_Request
      }
    ]
  }
}

type _WordsMap__Effect_ = {
  [Effect in _Effect_Proposal_Tasks_]: string
}

const WORDSMAP__EFFECT: _WordsMap__Effect_ = {
  CHANGE: "changes",
  MAKE: "makes",
  REMOVE: "deletes"
}

interface _Api___revisedOf__Changes_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  given: _Given_Job_
  source: string
  changes: Array<_Change_Copy_>
}

function revisedOf__Changes({
  task,
  job_Shell,
  given,
  source,
  changes
}: _Api___revisedOf__Changes_): _Placed_Changes_ {
  const sources_Without = given.sources.filter((source_Each) => source_Each !== source)
  const given_Without: _Given_Job_ = {
    ...given,
    sources: sources_Without,
    text: textWith__Sources({
      model_TextEditor: {
        document: given.text_Document,
        proposed: given.proposed
      },
      sources: sources_Without
    })
  }
  const text_Revised = appliedOf__Changes_Copy({
    text_Model: given.text,
    changes
  })
  return placedOf__Changes({
    task,
    job_Shell,
    given: given_Without,
    moves: [],
    changes: changesOf__Copy({
      files: [
        {
          given: given_Without,
          effect: "CHANGE",
          text_Copy: text_Revised
        }
      ]
    })
  })
}

interface _Api___placedOf__Changes_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  given: _Given_Job_
  changes: Array<_Change_Copy_>
  moves: Array<_Move_Copy_>
}

interface _Placed_Changes_ {
  issues: Array<string>
  changes: Array<_Change_>
}

function placedOf__Changes({
  task,
  job_Shell,
  given,
  changes,
  moves
}: _Api___placedOf__Changes_): _Placed_Changes_ {
  const segments = segmentsOf__Given({
    given
  })
  const spanOf = (change: _Change_Copy_) => spanOf__Change({
    task,
    job_Shell,
    given,
    segments,
    change
  })
  const positionOf = (index: number) => positionOf__Index({
    text_Model: given.text_Document,
    index
  })
  const numbers_Moved = moves.flatMap((move) => [
    move.change_From.number,
    move.change_To.number
  ])
  const replaces = [
    ...changes.filter((change) => !numbers_Moved.includes(change.number)),
    ...moves.flatMap((move) => move.changes_Edge)
  ].map((change) => ({
    change,
    span: spanOf(change)
  }))
  const moveds = moves.map((move) => ({
    span_Range: spanOf({
      ...move.change_From,
      range: move.range
    }),
    span_At: spanOf({
      ...move.change_To,
      range: {
        from: move.at,
        to: move.at
      }
    })
  }))
  return {
    issues: [
      ...replaces.flatMap((replace) => replace.span.kind === "REFUSED" ? [replace.span.issue] : []),
      ...moveds.flatMap((moved) => [
        moved.span_Range,
        moved.span_At
      ].flatMap((span) => span.kind === "REFUSED" ? [span.issue] : []))
    ],
    changes: [
      ...replaces.flatMap((replace): Array<_Change_> => replace.span.kind === "PLACED"
        ? [
          {
            kind: "REPLACE",
            range: {
              from: positionOf(replace.span.from),
              to: positionOf(replace.span.to)
            },
            next: {
              lines: parseTexts_Line(replace.change.after),
              marks: []
            }
          }
        ]
        : []),
      ...moveds.flatMap((moved): Array<_Change_> => moved.span_Range.kind === "PLACED" && moved.span_At.kind === "PLACED"
        ? [
          {
            kind: "MOVE",
            range: {
              from: positionOf(moved.span_Range.from),
              to: positionOf(moved.span_Range.to)
            },
            at: positionOf(moved.span_At.from)
          }
        ]
        : [])
    ].toSorted((
      change,
      change_Other
    ) => change.range.from.line - change_Other.range.from.line || change.range.from.offset - change_Other.range.from.offset || change.range.to.line - change_Other.range.to.line || change.range.to.offset - change_Other.range.to.offset)
  }
}

interface _Api___spanOf__Change_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  given: _Given_Job_
  segments: Array<_Segment_Given_>
  change: _Change_Copy_
}

type _Span_Change_ = _PLACED_Span_Change_ | _REFUSED_Span_Change_

interface __BASE_Span_Change_<Kind extends string> {
  kind: Kind
}

interface _PLACED_Span_Change_ extends __BASE_Span_Change_<"PLACED"> {
  from: number
  to: number
}

interface _REFUSED_Span_Change_ extends __BASE_Span_Change_<"REFUSED"> {
  issue: string
}

function spanOf__Change({
  task,
  job_Shell,
  given,
  segments,
  change
}: _Api___spanOf__Change_): _Span_Change_ {
  const from = indexOf__Position({
    text_Model: given.text,
    position: change.range.from
  })
  const to = indexOf__Position({
    text_Model: given.text,
    position: change.range.to
  })
  const indexIn__Document = (position: _Position_Text_) => indexOf__Position({
    text_Model: given.text_Document,
    position
  })
  const refusedIn = (source: string): _Span_Change_ => ({
    kind: "REFUSED",
    issue: job_Shell.sources.includes(source)
      ? `change ${change.number} is in the text of ${nameOf__Source({ task, source })}, which this job revises: group it with its revision`
      : `change ${change.number} is in part of the text ${nameOf__Source({ task, source })} put in: a change can go around another's text, taking it all in, or stay apart from it, but not change part of it`
  })
  if (from === to) {
    const segment = segments.find((each) => each.piece.kind === "DOCUMENT" && each.from <= from && from <= each.to)
    const index = segment === undefined ? undefined : indexIn__Document(segment.piece.range.from) + from - segment.from
    const piece_Inside = segments.find((each) => each.piece.kind === "CHANGE" && each.from < from && from < each.to)?.piece
    return index !== undefined
      ? {
        kind: "PLACED",
        from: index,
        to: index
      }
      : refusedIn(piece_Inside?.kind === "CHANGE" ? piece_Inside.source : "")
  }
  const touched = segments.filter((each) => each.from < to && from < each.to)
  const piece_Revised = touched.find((each) => each.piece.kind === "CHANGE" && job_Shell.sources.includes(each.piece.source))?.piece
  if (piece_Revised?.kind === "CHANGE") return refusedIn(piece_Revised.source)
  const piece_Partial = touched.find((each) => {
    const piece = each.piece
    return piece.kind === "CHANGE" && segments.some((other) => other.piece.kind === "CHANGE" && other.piece.source === piece.source && other.piece.index === piece.index && (other.from < from || other.to > to))
  })?.piece
  if (piece_Partial?.kind === "CHANGE") return refusedIn(piece_Partial.source)
  const intervals = touched.map((each) => {
    const piece = each.piece
    if (piece.kind === "DOCUMENT") {
      const index = indexIn__Document(piece.range.from) - each.from
      return [
        index + Math.max(from, each.from),
        index + Math.min(to, each.to)
      ] as const
    }
    const change_Covered = given.proposed.find((changes_Source) => changes_Source.source === piece.source)?.changes[piece.index]
    return change_Covered === undefined
      ? [
        -1,
        -1
      ] as const
      : [
        indexIn__Document(change_Covered.range.from),
        indexIn__Document(change_Covered.range.to)
      ] as const
  }).toSorted((interval, interval_Other) => interval[0] - interval_Other[0])
  const [
    interval_First,
    ...intervals_Rest
  ] = intervals
  if (interval_First === undefined || interval_First[0] < 0) {
    return {
      kind: "REFUSED",
      issue: `change ${change.number} can't be placed on the file`
    }
  }
  let span_To = interval_First[1]
  for (const interval of intervals_Rest) {
    if (interval[0] > span_To) {
      return {
        kind: "REFUSED",
        issue: `change ${change.number} reaches across the edge of a move, taking in text from two places: change what's moved and what's around it apart`
      }
    }
    span_To = Math.max(span_To, interval[1])
  }
  return {
    kind: "PLACED",
    from: interval_First[0],
    to: span_To
  }
}

interface _Api___segmentsOf__Given_ {
  given: _Given_Job_
}

interface _Segment_Given_ {
  piece: _Piece_Applied_
  from: number
  to: number
}

function segmentsOf__Given({
  given
}: _Api___segmentsOf__Given_): Array<_Segment_Given_> {
  const pieces = piecesWith__Sources({
    model_TextEditor: {
      document: given.text_Document,
      proposed: given.proposed
    },
    sources: given.sources,
    range: {
      from: POSITION_START,
      to: endOf__Text({
        text_Model: given.text_Document
      })
    }
  })
  let index = 0
  return (pieces.some((piece) => piece.kind === "DOCUMENT")
    ? pieces
    : [
      PIECE_START,
      ...pieces
    ]).map((piece) => {
    const from = index
    index += Array.from(piece.text).length
    return {
      piece,
      from,
      to: index
    }
  })
}

const PIECE_START: _Piece_Applied_ = {
  kind: "DOCUMENT",
  text: "",
  range: {
    from: POSITION_START,
    to: POSITION_START
  },
  marks: [],
  move: null
}

interface _Api___nameOf__Source_ {
  task: _Task_Tasks_
  source: string
}

function nameOf__Source({
  task,
  source
}: _Api___nameOf__Source_): string {
  const proposal = task.proposals.find((each) => each.id === source)
  return proposal === undefined ? "your edits" : `${proposal.id}, "${proposal.title}"`
}

interface _Api___appliedOf__Changes_Copy_ {
  text_Model: _Text_Model_
  changes: Array<_Change_Copy_>
}

function appliedOf__Changes_Copy({
  text_Model,
  changes
}: _Api___appliedOf__Changes_Copy_): _Text_Model_ {
  const codePoints = Array.from(flatOf__Text(text_Model))
  for (const change of changes.toSorted((change, change_Other) => change_Other.number - change.number)) {
    codePoints.splice(
      indexOf__Position({
        text_Model,
        position: change.range.from
      }),
      Array.from(change.before).length,
      ...Array.from(change.after)
    )
  }
  return {
    lines: parseTexts_Line(codePoints.join("")),
    marks: []
  }
}

interface _Api___landingOf__Base_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
}

function landingOf__Base({
  task,
  job_Shell
}: _Api___landingOf__Base_): _Landing_Handed_ {
  return {
    proposals: job_Shell.sources.flatMap((source) => {
      const proposal = task.proposals.find((each) => each.id === source)
      const changes = job_Shell.proposed.find((changes_Source) => changes_Source.source === source)?.changes
      return proposal === undefined || changes === undefined
        ? []
        : [
          {
            id: source,
            path: job_Shell.path,
            effect: proposal.effect,
            title: proposal.title,
            rationale: proposal.rationale,
            version: job_Shell.version,
            changes,
            ids_Request: job_Shell.requests.flatMap((request) => request.aim.kind === "PROPOSAL" && request.aim.id_Proposal === source ? [request.id] : [])
          }
        ]
    }),
    nothings: []
  }
}

const LANDING_NONE: _Landing_Handed_ = {
  proposals: [],
  nothings: []
}
