import {
  mergedOf__Frames,
  framesOf__Changes,
  linesOf__Span,
  linesOf__Landing,
  indexOf__Position,
  positionOf__Index,
  flatOf__Text,
  textIn__Range,
  type _Changes_Source_,
  type _Model_TextEditor_,
  type _Change_,
  type _Range_Text_,
  type _Lines_End_,
  type _Kind_End_Drawn_
} from "../documents/index.ts"
import type {
  _Task_Tasks_,
  _Decision_Proposal_Tasks_,
  _Effect_Proposal_Tasks_
} from "../tasks/index.ts"
import type {
  _Job_Shell_,
  _Given_Job_
} from "./Jobs_Shell.ts"
import {
  givensOf__Copy,
  segmentsOf__Given,
  indexIn__Copy,
  type _File_Copy_,
  type _Landing_Handed_,
  type _Segment_Given_
} from "./Copy_Shell.ts"

export {
  previewOf__Landing,
  type _Api___previewOf__Landing_,
  type _File_Preview_,
  type _Frame_Preview_,
  type _Item_Preview_,
  type _Whose_Preview_,
  type _Change_Preview_,
  type __BASE_Change_Preview_,
  type _REPLACE_Change_Preview_,
  type _MOVE_Change_Preview_,
  type _LANDING_Change_Preview_,
  type _Lines_Preview_,
  linesIn__Copy,
  type _Api___linesIn__Copy_,
  changeOf__End,
  type _Api___changeOf__End_,
  titlesAround__Change,
  type _Api___titlesAround__Change_
}

interface _Api___previewOf__Landing_ {
  task: _Task_Tasks_
  job_Shell: _Job_Shell_
  files: Array<_File_Copy_>
  landing: _Landing_Handed_
}

interface _File_Preview_ {
  path: string
  frames: Array<_Frame_Preview_>
}

interface _Frame_Preview_ {
  lines: _Lines_Preview_
  items: Array<_Item_Preview_>
}

interface _Item_Preview_ {
  source: string
  title: string
  whose: _Whose_Preview_
  effect: _Effect_Proposal_Tasks_
  changes: Array<_Change_Preview_>
}

type _Whose_Preview_ = "NEW" | "REVISED" | "YOURS" | _Decision_Proposal_Tasks_

type _Change_Preview_ = _REPLACE_Change_Preview_ | _MOVE_Change_Preview_ | _LANDING_Change_Preview_

interface __BASE_Change_Preview_<Kind extends string> {
  kind: Kind
  lines: _Lines_Preview_
}

interface _REPLACE_Change_Preview_ extends __BASE_Change_Preview_<"REPLACE"> {
  before: string
  after: string
  titles_Around: Array<string>
}

interface _MOVE_Change_Preview_ extends __BASE_Change_Preview_<"MOVE"> {
  lines_At: _Lines_Preview_
}

interface _LANDING_Change_Preview_ extends __BASE_Change_Preview_<"LANDING"> {
  lines_From: _Lines_Preview_
}

interface _Lines_Preview_ {
  first: number
  last: number
}

function previewOf__Landing({
  task,
  job_Shell,
  files,
  landing
}: _Api___previewOf__Landing_): Array<_File_Preview_> {
  return givensOf__Copy({
    job_Shell,
    files
  }).flatMap((given) => {
    const proposals_Path = landing.proposals.filter((proposal) => proposal.path === given.path)
    if (proposals_Path.length === 0) return []
    const ids_Landing = proposals_Path.map((proposal) => proposal.id)
    const proposed: Array<_Changes_Source_> = [
      ...given.proposed.map((changes_Source) => {
        const proposal = proposals_Path.find((proposal_Each) => proposal_Each.id === changes_Source.source)
        return proposal === undefined
          ? changes_Source
          : {
            source: changes_Source.source,
            changes: proposal.changes
          }
      }),
      ...proposals_Path
        .filter((proposal) => !given.proposed.some((changes_Source) => changes_Source.source === proposal.id))
        .map((proposal) => ({
          source: proposal.id,
          changes: proposal.changes
        }))
    ]
    const model_TextEditor: _Model_TextEditor_ = {
      document: given.text_Document,
      proposed
    }
    const segments = segmentsOf__Given({
      given
    })
    const linesIn = (lines: _Lines_End_) => linesIn__Copy({
      given,
      segments,
      lines
    })
    const titleOf = (source: string) => proposals_Path.find((proposal) => proposal.id === source)?.title ?? task.proposals.find((proposal) => proposal.id === source)?.title ?? "Your edits"
    const effectOf = (source: string) => proposals_Path.find((proposal) => proposal.id === source)?.effect ?? task.proposals.find((proposal) => proposal.id === source)?.effect ?? "CHANGE"
    const whoseOf = (source: string): _Whose_Preview_ => ids_Landing.includes(source)
      ? given.proposed.some((changes_Source) => changes_Source.source === source) ? "REVISED" : "NEW"
      : task.proposals.find((proposal) => proposal.id === source)?.decision ?? "YOURS"
    const frames = framesOf__Changes({
      model_TextEditor,
      changes_Placed: proposed.flatMap((changes_Source) => changes_Source.changes.map((change) => ({
        source: changes_Source.source,
        change
      }))),
      ranges_Frame: mergedOf__Frames([
        ...given.frames,
        ...landing.frames.filter((frame) => frame.path === given.path)
      ]).map((frame) => ({
        first: frame.first + 1,
        last: frame.last + 1
      })),
      source_Yours: proposed.find((changes_Source) => whoseOf(changes_Source.source) === "YOURS")?.source ?? ""
    })
    return [
      {
        path: given.path,
        frames: frames
          .filter((frame) => frame.ends.some((end) => ids_Landing.includes(end.change_Placed.source)))
          .map((frame) => ({
            lines: linesIn(frame),
            items: [...new Set(frame.ends.map((end) => end.change_Placed.source))].map((source) => ({
              source,
              title: titleOf(source),
              whose: whoseOf(source),
              effect: effectOf(source),
              changes: frame.ends.flatMap((end) => end.change_Placed.source === source
                ? [
                  changeOf__End({
                    model_TextEditor,
                    change: end.change_Placed.change,
                    kind_End: end.kind,
                    titles_Around: titlesAround__Change({
                      proposed,
                      source,
                      change: end.change_Placed.change,
                      titleOf
                    }),
                    linesIn
                  })
                ]
                : []).toSorted((
                change_Preview,
                change_Preview_Other
              ) => change_Preview.lines.first - change_Preview_Other.lines.first)
            }))
          }))
      }
    ]
  })
}

interface _Api___linesIn__Copy_ {
  given: _Given_Job_
  segments: Array<_Segment_Given_>
  lines: _Lines_End_
}

function linesIn__Copy({
  given,
  segments,
  lines
}: _Api___linesIn__Copy_): _Lines_Preview_ {
  const lineOf = (line: number) => positionOf__Index({
    text_Model: given.text,
    index: indexIn__Copy({
      given,
      segments,
      index_Document: indexOf__Position({
        text_Model: given.text_Document,
        position: {
          line,
          offset: 0
        }
      })
    })
  }).line + 1
  const first = lineOf(lines.first)
  return {
    first,
    last: lines.last < lines.first ? first - 1 : lineOf(lines.last)
  }
}

interface _Api___changeOf__End_ {
  model_TextEditor: _Model_TextEditor_
  change: _Change_
  kind_End: _Kind_End_Drawn_
  titles_Around: Array<string>
  linesIn: (lines: _Lines_End_) => _Lines_Preview_
}

function changeOf__End({
  model_TextEditor,
  change,
  kind_End,
  titles_Around,
  linesIn
}: _Api___changeOf__End_): _Change_Preview_ {
  const lines = linesIn(linesOf__Span({
    model_TextEditor,
    change
  }))
  if (change.kind === "REPLACE") {
    return {
      kind: "REPLACE",
      lines,
      before: flatOf__Text(textIn__Range({
        text_Model: model_TextEditor.document,
        range: change.range
      })),
      after: flatOf__Text(change.next),
      titles_Around
    }
  }
  const lines_Landing = linesIn(linesOf__Landing({
    model_TextEditor,
    change
  }))
  return kind_End === "LANDING"
    ? {
      kind: "LANDING",
      lines: lines_Landing,
      lines_From: lines
    }
    : {
      kind: "MOVE",
      lines,
      lines_At: lines_Landing
    }
}

interface _Api___titlesAround__Change_ {
  proposed: Array<_Changes_Source_>
  source: string
  change: _Change_
  titleOf: (source: string) => string
}

function titlesAround__Change({
  proposed,
  source,
  change,
  titleOf
}: _Api___titlesAround__Change_): Array<string> {
  const isAround = (range: _Range_Text_) => {
    const isFrom = range.from.line < change.range.from.line || range.from.line === change.range.from.line && range.from.offset <= change.range.from.offset
    const isTo = change.range.to.line < range.to.line || change.range.to.line === range.to.line && change.range.to.offset <= range.to.offset
    const isSame = range.from.line === change.range.from.line && range.from.offset === change.range.from.offset && range.to.line === change.range.to.line && range.to.offset === change.range.to.offset
    return isFrom && isTo && !isSame
  }
  return proposed.flatMap((changes_Source) => changes_Source.source !== source && changes_Source.changes.some((change_Other) => isAround(change_Other.range))
    ? [titleOf(changes_Source.source)]
    : [])
}
