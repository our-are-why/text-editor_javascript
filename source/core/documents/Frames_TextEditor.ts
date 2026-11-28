import {
  orderOf__Positions,
  landedOf__Move,
  type _Model_TextEditor_,
  type _Change_,
  type _MOVE_Change_,
  type _Position_Text_
} from "./Model_TextEditor.ts"

export {
  type _Sourced_Change_,
  type _Api___framesOf__Changes_,
  type _Frame_Drawn_,
  type _End_Drawn_,
  type _Kind_End_Drawn_,
  framesOf__Changes,
  type _Api___linesOf__Span_,
  type _Lines_End_,
  linesOf__Span,
  type _Api___linesOf__Point_,
  linesOf__Point,
  countOf__CodePoints,
  type _Api___linesOf__Landing_,
  linesOf__Landing,
  mergedOf__Frames_Drawn,
  type _Api___indexOf__Sharing_,
  indexOf__Sharing,
  type _Api___isSharing__Frames_,
  isSharing__Frames,
  lineOf__Point,
  type _Api___isAt__Frame_,
  isAt__Frame,
  type _Api___yoursJoinedOf__Frames_,
  yoursJoinedOf__Frames,
  type _Api___joinedOf__Frames_,
  joinedOf__Frames
}

interface _Sourced_Change_ {
  source: string
  change: _Change_
}

interface _Api___framesOf__Changes_<Placed extends _Sourced_Change_> {
  model_TextEditor: _Model_TextEditor_
  changes_Placed: Array<Placed>
  ranges_Frame: Array<_Lines_End_>
  source_Yours: string
}

interface _Frame_Drawn_<Placed extends _Sourced_Change_> {
  first: number
  last: number
  ends: Array<_End_Drawn_<Placed>>
}

interface _End_Drawn_<Placed extends _Sourced_Change_> {
  change_Placed: Placed
  kind: _Kind_End_Drawn_
}

type _Kind_End_Drawn_ = "SPAN" | "LANDING"

function framesOf__Changes<Placed extends _Sourced_Change_>({
  model_TextEditor,
  changes_Placed,
  ranges_Frame,
  source_Yours
}: _Api___framesOf__Changes_<Placed>): Array<_Frame_Drawn_<Placed>> {
  return yoursJoinedOf__Frames({
    frames_Model: mergedOf__Frames_Drawn([
      ...changes_Placed.flatMap((change_Placed): Array<_Frame_Drawn_<Placed>> => {
        const change = change_Placed.change
        return [
          {
            ...linesOf__Span({
              model_TextEditor,
              change
            }),
            ends: [
              {
                change_Placed,
                kind: "SPAN"
              }
            ]
          },
          ...(change.kind === "MOVE"
            ? [
              {
                ...linesOf__Landing({
                  model_TextEditor,
                  change
                }),
                ends: [
                  {
                    change_Placed,
                    kind: "LANDING" as const
                  }
                ]
              }
            ]
            : [])
        ]
      }),
      ...ranges_Frame.map((range_Frame) => ({
        first: range_Frame.first - 1,
        last: range_Frame.last - 1,
        ends: []
      }))
    ]).filter((frame_Model) => frame_Model.ends.length > 0),
    source_Yours
  })
}

interface _Api___linesOf__Span_ {
  model_TextEditor: _Model_TextEditor_
  change: _Change_
}

interface _Lines_End_ {
  first: number
  last: number
}

function linesOf__Span({
  model_TextEditor,
  change
}: _Api___linesOf__Span_): _Lines_End_ {
  const from = change.range.from
  const to = change.range.to
  if (orderOf__Positions({
    position: from,
    position_Other: to
  }) === 0) return linesOf__Point({
    model_TextEditor,
    at: from,
    text: change.kind === "REPLACE" ? change.next.lines.join("\n") : ""
  })
  const count_From = countOf__CodePoints(model_TextEditor.document.lines[from.line] ?? "")
  const first = count_From > 0 && from.offset === count_From && to.line > from.line ? from.line + 1 : from.line
  const last = to.offset === 0 && to.line > from.line ? to.line - 1 : to.line
  return first > last
    ? {
      first: from.line,
      last: to.line
    }
    : {
      first,
      last
    }
}

interface _Api___linesOf__Point_ {
  model_TextEditor: _Model_TextEditor_
  at: _Position_Text_
  text: string
}

function linesOf__Point({
  model_TextEditor,
  at,
  text
}: _Api___linesOf__Point_): _Lines_End_ {
  if (at.offset === 0 && text.endsWith("\n")) return {
    first: at.line,
    last: at.line - 1
  }
  if (at.offset === countOf__CodePoints(model_TextEditor.document.lines[at.line] ?? "") && text.startsWith("\n")) return {
    first: at.line + 1,
    last: at.line
  }
  return {
    first: at.line,
    last: at.line
  }
}

function countOf__CodePoints(
  text: string
): number {
  return Array.from(text).length
}

interface _Api___linesOf__Landing_ {
  model_TextEditor: _Model_TextEditor_
  change: _MOVE_Change_
}

function linesOf__Landing({
  model_TextEditor,
  change
}: _Api___linesOf__Landing_): _Lines_End_ {
  return linesOf__Point({
    model_TextEditor,
    at: change.at,
    text: landedOf__Move({
      model_TextEditor,
      change
    })
  })
}

function mergedOf__Frames_Drawn<Placed extends _Sourced_Change_>(
  frames_Model: Array<_Frame_Drawn_<Placed>>
): Array<_Frame_Drawn_<Placed>> {
  const frames_Merged: Array<_Frame_Drawn_<Placed>> = []
  for (const frame_Model of frames_Model) {
    let frame_Joined = frame_Model
    let index = indexOf__Sharing({
      frames_Model: frames_Merged,
      frame_Model: frame_Joined
    })
    while (index !== -1) {
      const frame_Sharing = frames_Merged.splice(
        index,
        1
      )[0]
      if (frame_Sharing !== undefined) frame_Joined = joinedOf__Frames({
        frame_Model: frame_Sharing,
        frame_Other: frame_Joined
      })
      index = indexOf__Sharing({
        frames_Model: frames_Merged,
        frame_Model: frame_Joined
      })
    }
    frames_Merged.push(frame_Joined)
  }
  return frames_Merged.toSorted((
    frame_One,
    frame_Other
  ) => frame_One.first - frame_Other.first || frame_One.last - frame_Other.last)
}

interface _Api___indexOf__Sharing_<Placed extends _Sourced_Change_> {
  frames_Model: Array<_Frame_Drawn_<Placed>>
  frame_Model: _Frame_Drawn_<Placed>
}

function indexOf__Sharing<Placed extends _Sourced_Change_>({
  frames_Model,
  frame_Model
}: _Api___indexOf__Sharing_<Placed>): number {
  return frames_Model.findIndex((frame_Other) => isSharing__Frames({
    frame_Model,
    frame_Other
  }))
}

interface _Api___isSharing__Frames_<Placed extends _Sourced_Change_> {
  frame_Model: _Frame_Drawn_<Placed>
  frame_Other: _Frame_Drawn_<Placed>
}

function isSharing__Frames<Placed extends _Sourced_Change_>({
  frame_Model,
  frame_Other
}: _Api___isSharing__Frames_<Placed>): boolean {
  const isPoint = frame_Model.last < frame_Model.first
  const isPoint_Other = frame_Other.last < frame_Other.first
  if (isPoint && isPoint_Other) return frame_Model.first === frame_Other.first
  if (isPoint) return isAt__Frame({
    line: lineOf__Point(frame_Model),
    frame_Model: frame_Other
  })
  if (isPoint_Other) return isAt__Frame({
    line: lineOf__Point(frame_Other),
    frame_Model
  })
  return Math.max(
    frame_Model.first,
    frame_Other.first
  ) <= Math.min(
    frame_Model.last,
    frame_Other.last
  )
}

function lineOf__Point<Placed extends _Sourced_Change_>(
  frame_Model: _Frame_Drawn_<Placed>
): number {
  const end_Change = frame_Model.ends[0]
  const change = end_Change?.change_Placed.change
  return end_Change === undefined || change === undefined
    ? frame_Model.first
    : end_Change.kind === "LANDING" && change.kind === "MOVE"
      ? change.at.line
      : change.range.from.line
}

interface _Api___isAt__Frame_<Placed extends _Sourced_Change_> {
  line: number
  frame_Model: _Frame_Drawn_<Placed>
}

function isAt__Frame<Placed extends _Sourced_Change_>({
  line,
  frame_Model
}: _Api___isAt__Frame_<Placed>): boolean {
  return frame_Model.first <= line && line <= frame_Model.last
}

interface _Api___yoursJoinedOf__Frames_<Placed extends _Sourced_Change_> {
  frames_Model: Array<_Frame_Drawn_<Placed>>
  source_Yours: string
}

function yoursJoinedOf__Frames<Placed extends _Sourced_Change_>({
  frames_Model,
  source_Yours
}: _Api___yoursJoinedOf__Frames_<Placed>): Array<_Frame_Drawn_<Placed>> {
  const isYours = (frame_Model: _Frame_Drawn_<Placed>): boolean => frame_Model.ends.every((end_Change) => end_Change.change_Placed.source === source_Yours)
  return frames_Model.reduce(
    (
      frames_Joined: Array<_Frame_Drawn_<Placed>>,
      frame_Model
    ) => {
      const frame_Last = frames_Joined.at(-1)
      return frame_Last !== undefined && isYours(frame_Last) && isYours(frame_Model) && frame_Last.last + 1 === frame_Model.first
        ? [
          ...frames_Joined.slice(
            0,
            -1
          ),
          joinedOf__Frames({
            frame_Model: frame_Last,
            frame_Other: frame_Model
          })
        ]
        : [
          ...frames_Joined,
          frame_Model
        ]
    },
    []
  )
}

interface _Api___joinedOf__Frames_<Placed extends _Sourced_Change_> {
  frame_Model: _Frame_Drawn_<Placed>
  frame_Other: _Frame_Drawn_<Placed>
}

function joinedOf__Frames<Placed extends _Sourced_Change_>({
  frame_Model,
  frame_Other
}: _Api___joinedOf__Frames_<Placed>): _Frame_Drawn_<Placed> {
  const ends = [
    ...frame_Model.ends,
    ...frame_Other.ends
  ]
  if (frame_Model.last < frame_Model.first) return {
    first: frame_Other.first,
    last: frame_Other.last,
    ends
  }
  if (frame_Other.last < frame_Other.first) return {
    first: frame_Model.first,
    last: frame_Model.last,
    ends
  }
  return {
    first: Math.min(
      frame_Model.first,
      frame_Other.first
    ),
    last: Math.max(
      frame_Model.last,
      frame_Other.last
    ),
    ends
  }
}
