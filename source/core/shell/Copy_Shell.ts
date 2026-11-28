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
  type _Unplaceable_Copy_,
  type _Grouping_Job_,
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
  proposals: Array<_Proposal_Grouped_>
  nothings: Array<_Nothing_Grouped_>
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
  const changes = changesOf__Copy({
    files
  })
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
    proposal,
    id: `${job_Shell.id}.${index + 1}`
  }))
  const paths_Job = pathsOf__Job({
    task,
    job_Shell
  })
  const issues = [
    ...grouping.stamp === stampOf__Changes({
      changes
    })
      ? []
      : ["the copy's changed since you asked what you changed, or you've given no stamp: ask what you changed again, and hand back with the stamp it gives"],
    ...unplaceables.map((unplaceable) => `${unplaceable.path} ${unplaceable.why}`),
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
      changes: changes_Own
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
}

interface _Placed_Changes_ {
  issues: Array<string>
  changes: Array<_Change_>
}

function placedOf__Changes({
  task,
  job_Shell,
  given,
  changes
}: _Api___placedOf__Changes_): _Placed_Changes_ {
  const segments = segmentsOf__Given({
    given
  })
  const placed = changes.map((change) => spanOf__Change({
    task,
    job_Shell,
    given,
    segments,
    change
  }))
  return {
    issues: placed.flatMap((span) => span.kind === "REFUSED" ? [span.issue] : []),
    changes: placed.flatMap((span, index): Array<_Change_> => span.kind === "PLACED"
      ? [
        {
          kind: "REPLACE",
          range: {
            from: positionOf__Index({
              text_Model: given.text_Document,
              index: span.from
            }),
            to: positionOf__Index({
              text_Model: given.text_Document,
              index: span.to
            })
          },
          next: {
            lines: parseTexts_Line(changes[index]?.after ?? ""),
            marks: []
          }
        }
      ]
      : [])
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
