export {
  type _Model_TextEditor_,
  type _Text_Model_,
  type _NonEmpty_,
  type _Text_Line_NonTerminated_,
  type _Mark_Text_,
  type _Data_Mark_,
  type _Changes_Source_,
  type _Change_,
  type __BASE_Change_,
  type _Range_Text_,
  type _Position_Text_,
  type _REPLACE_Change_,
  type _MOVE_Change_,
  parseModel_TextEditor,
  type _Changes_Host_,
  type _Change_Host_,
  type __BASE_Change_Host_,
  type _REPLACE_Change_Host_,
  type _MOVE_Change_Host_,
  type _Result_Parse_,
  type __BASE_Result_Parse_,
  type _PARSED_Result_Parse_,
  type _REFUSED_Result_Parse_,
  type _Refusal_Parse_,
  parseTexts_Line,
  applied__Transaction,
  type _Transaction_Model_,
  type _Step_Transaction_,
  type __BASE_Step_Transaction_,
  type _TEXT_Step_Transaction_,
  type _Id_Text_,
  type __BASE_Id_Text_,
  type _DOCUMENT_Id_Text_,
  type _CHANGE_Id_Text_,
  type _CHANGE_Step_Transaction_,
  type _SOURCE_Step_Transaction_,
  type _Applied_Transaction_,
  mapped__NonEmpty,
  rebasedOf__Changes,
  type _Rebased_Changes_,
  carried__Position,
  type _Bias_Position_,
  textWith__Sources,
  piecesWith__Sources,
  type _Piece_Applied_,
  type __BASE_Piece_Applied_,
  type _DOCUMENT_Piece_Applied_,
  type _CHANGE_Piece_Applied_,
  type _Move_Piece_,
  landedOf__Move,
  textIn__Range,
  shiftedBy__Position,
  comparisonOf__Texts,
  type _Run_Comparison_,
  type _Kind_Run_,
  keysOf__Text,
  indexOf__Position,
  positionOf__Index
}

interface _Model_TextEditor_ {
  document: _Text_Model_
  proposed: Array<_Changes_Source_>
}

interface _Text_Model_ {
  lines: _NonEmpty_<_Text_Line_NonTerminated_>
  marks: Array<_Mark_Text_>
}

type _NonEmpty_<Item> = [
  Item,
  ...Array<Item>
]

type _Text_Line_NonTerminated_ = string & { [proof__Text_Line_NonTerminated]: true }

declare const proof__Text_Line_NonTerminated: unique symbol

interface _Mark_Text_ {
  range: _Range_Text_
  data: _Data_Mark_
}

interface _Data_Mark_ {
  [name: string]: string
}

interface _Changes_Source_ {
  source: string
  changes: _NonEmpty_<_Change_>
}

type _Change_ = _REPLACE_Change_ | _MOVE_Change_

interface __BASE_Change_<Kind extends string> {
  kind: Kind
  range: _Range_Text_
}

interface _Range_Text_ {
  from: _Position_Text_
  to: _Position_Text_
}

interface _Position_Text_ {
  line: number
  offset: number
}

interface _REPLACE_Change_ extends __BASE_Change_<"REPLACE"> {
  next: _Text_Model_
}

interface _MOVE_Change_ extends __BASE_Change_<"MOVE"> {
  at: _Position_Text_
}

interface _Api___parseModel_TextEditor_ {
  multilineText: string
  marks: Array<_Mark_Text_>
  proposed: Array<_Changes_Host_>
}

function parseModel_TextEditor({
  multilineText,
  marks,
  proposed
}: _Api___parseModel_TextEditor_): _Result_Parse_ {
  const document: _Text_Model_ = {
    lines: parseTexts_Line(multilineText),
    marks: normalizedOf__Marks(marks)
  }
  const [
    reason_Document
  ] = reasonsOf__Marks({
    text_Model: document,
    marks
  })
  if (reason_Document !== undefined) throw new Error(`the document's ${reason_Document}`)
  const changes_Proposed = proposed.flatMap((changes_Host) => changesOf__Host(changes_Host))
  const [
    refusal_First,
    ...refusals_Rest
  ] = [
    ...changes_Proposed.flatMap((changes_Source) => refusalsIn__Source({
      document,
      changes_Source
    })),
    ...refusalsAcross__Sources(changes_Proposed)
  ]
  return refusal_First === undefined
    ? {
      kind: "PARSED",
      model_TextEditor: {
        document,
        proposed: changes_Proposed
      }
    }
    : {
      kind: "REFUSED",
      refusals: [
        refusal_First,
        ...refusals_Rest
      ]
    }
}

interface _Changes_Host_ {
  source: string
  changes: Array<_Change_Host_>
}

type _Change_Host_ = _REPLACE_Change_Host_ | _MOVE_Change_Host_

interface __BASE_Change_Host_<Kind extends string> {
  kind: Kind
  range: _Range_Text_
}

interface _REPLACE_Change_Host_ extends __BASE_Change_Host_<"REPLACE"> {
  multilineText: string
  marks: Array<_Mark_Text_>
}

interface _MOVE_Change_Host_ extends __BASE_Change_Host_<"MOVE"> {
  at: _Position_Text_
}

type _Result_Parse_ = _PARSED_Result_Parse_ | _REFUSED_Result_Parse_

interface __BASE_Result_Parse_<Kind extends string> {
  kind: Kind
}

interface _PARSED_Result_Parse_ extends __BASE_Result_Parse_<"PARSED"> {
  model_TextEditor: _Model_TextEditor_
}

interface _REFUSED_Result_Parse_ extends __BASE_Result_Parse_<"REFUSED"> {
  refusals: _NonEmpty_<_Refusal_Parse_>
}

interface _Refusal_Parse_ {
  source: string
  reason: string
}

function parseTexts_Line(
  multilineText: string
): _NonEmpty_<_Text_Line_NonTerminated_> {
  const [
    first = "",
    ...rest
  ] = multilineText.split(REGEXP_LINEBREAK)
  return [
    first,
    ...rest
  ] as _NonEmpty_<_Text_Line_NonTerminated_>
}

const REGEXP_LINEBREAK = /\r\n|[\n\r\v\f\u0085\u2028\u2029]/

function normalizedOf__Marks(
  marks: Array<_Mark_Text_>
): Array<_Mark_Text_> {
  return [
    ...Map.groupBy(
      marks.filter((mark) => orderOf__Positions({
        position: mark.range.from,
        position_Other: mark.range.to
      }) < 0),
      (mark) => keyOf__Data(mark.data)
    ).values()
  ]
    .flatMap((marks_Alike) => marks_Alike
      .toSorted((
        mark_One,
        mark_Other
      ) => orderOf__Ranges({
        range: mark_One.range,
        range_Other: mark_Other.range
      }))
      .reduce(
        (
          marks_Merged: Array<_Mark_Text_>,
          mark
        ) => {
          const mark_Last = marks_Merged.at(-1)
          return mark_Last !== undefined && orderOf__Positions({
            position: mark.range.from,
            position_Other: mark_Last.range.to
          }) <= 0
            ? [
              ...marks_Merged.slice(
                0,
                -1
              ),
              {
                range: {
                  from: mark_Last.range.from,
                  to: orderOf__Positions({
                    position: mark.range.to,
                    position_Other: mark_Last.range.to
                  }) > 0 ? mark.range.to : mark_Last.range.to
                },
                data: mark_Last.data
              }
            ]
            : [
              ...marks_Merged,
              mark
            ]
        },
        []
      ))
    .toSorted((
      mark_One,
      mark_Other
    ) => orderOf__Ranges({
      range: mark_One.range,
      range_Other: mark_Other.range
    }) || keyOf__Data(mark_One.data).localeCompare(keyOf__Data(mark_Other.data)))
}

function keyOf__Data(
  data: _Data_Mark_
): string {
  return JSON.stringify(Object.entries(data).toSorted(([
    name_One
  ], [
    name_Other
  ]) => name_One.localeCompare(name_Other)))
}

interface _Api___reasonsOf__Marks_ {
  text_Model: _Text_Model_
  marks: Array<_Mark_Text_>
}

function reasonsOf__Marks({
  text_Model,
  marks
}: _Api___reasonsOf__Marks_): Array<string> {
  return marks.flatMap((mark) => isInside__Range({
    text_Model,
    range: mark.range
  })
    ? []
    : [
      `mark at ${labelOf__Range(mark.range)} isn't inside its text, or ends before it starts`
    ])
}

function changesOf__Host(
  changes_Host: _Changes_Host_
): Array<_Changes_Source_> {
  const [
    change_First,
    ...changes_Rest
  ] = changes_Host.changes
    .map((change_Host) => changeOf__Host(change_Host))
    .toSorted((
      change,
      change_Other
    ) => orderOf__Ranges({
      range: change.range,
      range_Other: change_Other.range
    }))
  return change_First === undefined
    ? []
    : [
      {
        source: changes_Host.source,
        changes: [
          change_First,
          ...changes_Rest
        ]
      }
    ]
}

function changeOf__Host(
  change_Host: _Change_Host_
): _Change_ {
  return change_Host.kind === "REPLACE"
    ? {
      kind: "REPLACE",
      range: change_Host.range,
      next: {
        lines: parseTexts_Line(change_Host.multilineText),
        marks: normalizedOf__Marks(change_Host.marks)
      }
    }
    : {
      kind: "MOVE",
      range: change_Host.range,
      at: change_Host.at
    }
}

interface _Api___orderOf__Ranges_ {
  range: _Range_Text_
  range_Other: _Range_Text_
}

function orderOf__Ranges({
  range,
  range_Other
}: _Api___orderOf__Ranges_): number {
  return orderOf__Positions({
    position: range.from,
    position_Other: range_Other.from
  }) || orderOf__Positions({
    position: range.to,
    position_Other: range_Other.to
  })
}

interface _Api___orderOf__Positions_ {
  position: _Position_Text_
  position_Other: _Position_Text_
}

function orderOf__Positions({
  position,
  position_Other
}: _Api___orderOf__Positions_): number {
  return position.line - position_Other.line || position.offset - position_Other.offset
}

interface _Api___refusalsIn__Source_ {
  document: _Text_Model_
  changes_Source: _Changes_Source_
}

function refusalsIn__Source({
  document,
  changes_Source
}: _Api___refusalsIn__Source_): Array<_Refusal_Parse_> {
  return [
    ...changes_Source.changes.flatMap((change) => reasonsOf__Change({
      document,
      change
    })),
    ...changes_Source.changes.slice(1).flatMap((
      change,
      index
    ) => {
      const change_Before = changes_Source.changes[index]
      return change_Before !== undefined && (orderOf__Positions({
        position: change_Before.range.to,
        position_Other: change.range.from
      }) > 0 || orderOf__Ranges({
        range: change_Before.range,
        range_Other: change.range
      }) === 0)
        ? [`its changes at ${labelOf__Range(change_Before.range)} and at ${labelOf__Range(change.range)} overlap`]
        : []
    })
  ].map((reason) => ({
    source: changes_Source.source,
    reason
  }))
}

interface _Api___reasonsOf__Change_ {
  document: _Text_Model_
  change: _Change_
}

function reasonsOf__Change({
  document,
  change
}: _Api___reasonsOf__Change_): Array<string> {
  if (!isInside__Range({
    text_Model: document,
    range: change.range
  })) return [`its change at ${labelOf__Range(change.range)} isn't inside the document, or ends before it starts`]
  if (change.kind === "REPLACE") return reasonsOf__Marks({
    text_Model: change.next,
    marks: change.next.marks
  }).map((reason) => `its change at ${labelOf__Range(change.range)} has a ${reason}`)
  if (orderOf__Positions({
    position: change.range.from,
    position_Other: change.range.to
  }) === 0) return [`its move at ${labelOf__Range(change.range)} moves nothing`]
  if (!isInside__Text({
    text_Model: document,
    position: change.at
  })) return [`its move at ${labelOf__Range(change.range)} goes to ${labelOf__Position(change.at)}, which isn't inside the document`]
  return orderOf__Positions({
    position: change.at,
    position_Other: change.range.from
  }) >= 0 && orderOf__Positions({
    position: change.at,
    position_Other: change.range.to
  }) <= 0
    ? [`its move at ${labelOf__Range(change.range)} goes to ${labelOf__Position(change.at)}, where it is already`]
    : []
}

interface _Api___isInside__Range_ {
  text_Model: _Text_Model_
  range: _Range_Text_
}

function isInside__Range({
  text_Model,
  range
}: _Api___isInside__Range_): boolean {
  return isInside__Text({
    text_Model,
    position: range.from
  }) && isInside__Text({
    text_Model,
    position: range.to
  }) && orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) <= 0
}

interface _Api___isInside__Text_ {
  text_Model: _Text_Model_
  position: _Position_Text_
}

function isInside__Text({
  text_Model,
  position
}: _Api___isInside__Text_): boolean {
  const text = text_Model.lines[position.line]
  return text !== undefined && Number.isInteger(position.offset) && position.offset >= 0 && position.offset <= countOf__CodePoints(text)
}

function countOf__CodePoints(
  text: string
): number {
  return Array.from(text).length
}

function labelOf__Range(
  range: _Range_Text_
): string {
  return `${labelOf__Position(range.from)} to ${labelOf__Position(range.to)}`
}

function labelOf__Position(
  position: _Position_Text_
): string {
  return `${position.line}:${position.offset}`
}

interface _Placed_Change_ {
  source: string
  change: _Change_
}

function refusalsAcross__Sources(
  changes_Proposed: Array<_Changes_Source_>
): Array<_Refusal_Parse_> {
  const changes_Placed: Array<_Placed_Change_> = changes_Proposed.flatMap((changes_Source) => changes_Source.changes.map((change) => ({
    source: changes_Source.source,
    change
  })))
  return changes_Placed.flatMap((
    change_Placed,
    index
  ) => [
    ...changes_Placed
      .slice(index + 1)
      .filter((change_Other) => change_Other.source !== change_Placed.source)
      .flatMap((change_Other) => refusalsBetween__Changes({
        change_Placed,
        change_Other
      })),
    ...refusalsOf__Landing({
      change_Placed,
      changes_Placed
    })
  ])
}

interface _Api___refusalsBetween__Changes_ {
  change_Placed: _Placed_Change_
  change_Other: _Placed_Change_
}

function refusalsBetween__Changes({
  change_Placed,
  change_Other
}: _Api___refusalsBetween__Changes_): Array<_Refusal_Parse_> {
  return REFUSALSMAP__RELATION_RANGES[relationOf__Ranges({
    range: change_Placed.change.range,
    range_Other: change_Other.change.range
  })]({
    change_Placed,
    change_Other
  })
}

type _RefusalsMap__Relation_Ranges_ = {
  [Relation in _Relation_Ranges_]: (api_Refusals: _Api___refusalsBetween__Changes_) => Array<_Refusal_Parse_>
}

type _Relation_Ranges_ = "APART" | "SAME" | "INSIDE" | "AROUND" | "CROSSING"

const REFUSALSMAP__RELATION_RANGES: _RefusalsMap__Relation_Ranges_ = {
  APART: () => [],
  SAME: ({
    change_Placed,
    change_Other
  }) => [
    {
      source: change_Other.source,
      reason: `its change at ${labelOf__Range(change_Other.change.range)} is the same span as ${change_Placed.source}'s`
    }
  ],
  INSIDE: ({
    change_Placed,
    change_Other
  }) => refusalsOf__Nested({
    change_Inner: change_Placed,
    change_Outer: change_Other
  }),
  AROUND: ({
    change_Placed,
    change_Other
  }) => refusalsOf__Nested({
    change_Inner: change_Other,
    change_Outer: change_Placed
  }),
  CROSSING: ({
    change_Placed,
    change_Other
  }) => [
    {
      source: change_Other.source,
      reason: `its change at ${labelOf__Range(change_Other.change.range)} crosses ${change_Placed.source}'s at ${labelOf__Range(change_Placed.change.range)}`
    }
  ]
}

interface _Api___refusalsOf__Nested_ {
  change_Inner: _Placed_Change_
  change_Outer: _Placed_Change_
}

function refusalsOf__Nested({
  change_Inner,
  change_Outer
}: _Api___refusalsOf__Nested_): Array<_Refusal_Parse_> {
  return change_Inner.change.kind === "MOVE"
    ? [
      {
        source: change_Inner.source,
        reason: `its move at ${labelOf__Range(change_Inner.change.range)} is inside ${change_Outer.source}'s change at ${labelOf__Range(change_Outer.change.range)}, which a move can't be yet`
      }
    ]
    : []
}

interface _Api___relationOf__Ranges_ {
  range: _Range_Text_
  range_Other: _Range_Text_
}

function relationOf__Ranges({
  range,
  range_Other
}: _Api___relationOf__Ranges_): _Relation_Ranges_ {
  if (orderOf__Ranges({
    range,
    range_Other
  }) === 0) return "SAME"
  if (orderOf__Positions({
    position: range.to,
    position_Other: range_Other.from
  }) <= 0 || orderOf__Positions({
    position: range_Other.to,
    position_Other: range.from
  }) <= 0) return "APART"
  if (orderOf__Positions({
    position: range_Other.from,
    position_Other: range.from
  }) <= 0 && orderOf__Positions({
    position: range.to,
    position_Other: range_Other.to
  }) <= 0) return "INSIDE"
  if (orderOf__Positions({
    position: range.from,
    position_Other: range_Other.from
  }) <= 0 && orderOf__Positions({
    position: range_Other.to,
    position_Other: range.to
  }) <= 0) return "AROUND"
  return "CROSSING"
}

interface _Api___refusalsOf__Landing_ {
  change_Placed: _Placed_Change_
  changes_Placed: Array<_Placed_Change_>
}

function refusalsOf__Landing({
  change_Placed,
  changes_Placed
}: _Api___refusalsOf__Landing_): Array<_Refusal_Parse_> {
  const change = change_Placed.change
  return change.kind === "MOVE"
    ? changes_Placed
      .filter((change_Other) => change_Other !== change_Placed && orderOf__Positions({
        position: change.at,
        position_Other: change_Other.change.range.from
      }) > 0 && orderOf__Positions({
        position: change.at,
        position_Other: change_Other.change.range.to
      }) < 0)
      .map((change_Other) => ({
        source: change_Placed.source,
        reason: `its move at ${labelOf__Range(change.range)} goes to ${labelOf__Position(change.at)}, inside ${change_Other.source}'s change at ${labelOf__Range(change_Other.change.range)}`
      }))
    : []
}

interface _Api___applied__Transaction_ {
  model_TextEditor: _Model_TextEditor_
  transaction: _Transaction_Model_
}

function applied__Transaction({
  model_TextEditor,
  transaction
}: _Api___applied__Transaction_): _Applied_Transaction_ {
  const [
    step_First,
    ...steps_Rest
  ] = transaction.steps
  let applied_Step = appliedOf__Step({
    model_TextEditor,
    step_Transaction: step_First
  })
  let steps_Inverse: _NonEmpty_<_Step_Transaction_> = applied_Step.steps_Inverse
  for (const step_Transaction of steps_Rest) {
    applied_Step = appliedOf__Step({
      model_TextEditor: applied_Step.model_TextEditor,
      step_Transaction
    })
    steps_Inverse = [
      ...applied_Step.steps_Inverse,
      ...steps_Inverse
    ]
  }
  return {
    model_TextEditor: applied_Step.model_TextEditor,
    transaction_Inverse: {
      steps: steps_Inverse
    }
  }
}

interface _Transaction_Model_ {
  steps: _NonEmpty_<_Step_Transaction_>
}

type _Step_Transaction_ = _TEXT_Step_Transaction_ | _CHANGE_Step_Transaction_ | _SOURCE_Step_Transaction_

interface __BASE_Step_Transaction_<Kind extends string> {
  kind: Kind
}

interface _TEXT_Step_Transaction_ extends __BASE_Step_Transaction_<"TEXT"> {
  id_Text: _Id_Text_
  range: _Range_Text_
  next: _Text_Model_
}

type _Id_Text_ = _DOCUMENT_Id_Text_ | _CHANGE_Id_Text_

interface __BASE_Id_Text_<Kind extends string> {
  kind: Kind
}

interface _DOCUMENT_Id_Text_ extends __BASE_Id_Text_<"DOCUMENT"> {}

interface _CHANGE_Id_Text_ extends __BASE_Id_Text_<"CHANGE"> {
  source: string
  index: number
}

interface _CHANGE_Step_Transaction_ extends __BASE_Step_Transaction_<"CHANGE"> {
  source: string
  index: number
  change: _Change_
}

interface _SOURCE_Step_Transaction_ extends __BASE_Step_Transaction_<"SOURCE"> {
  source: string
  changes: Array<_Change_>
}

interface _Applied_Transaction_ {
  model_TextEditor: _Model_TextEditor_
  transaction_Inverse: _Transaction_Model_
}

interface _Api___appliedOf__Step_ {
  model_TextEditor: _Model_TextEditor_
  step_Transaction: _Step_Transaction_
}

function appliedOf__Step({
  model_TextEditor,
  step_Transaction
}: _Api___appliedOf__Step_): _Applied_Step_ {
  return (APPLYMAP__KIND_STEP[step_Transaction.kind] as (api_Step: _Api___applied__Kind_Step_<_Step_Transaction_["kind"]>) => _Applied_Step_)({
    model_TextEditor,
    step_Transaction
  })
}

interface _Api___applied__Kind_Step_<Kind extends _Step_Transaction_["kind"]> {
  model_TextEditor: _Model_TextEditor_
  step_Transaction: Extract<
    _Step_Transaction_,
    __BASE_Step_Transaction_<Kind>
  >
}

type _ApplyMap__Kind_Step_ = {
  [Kind in _Step_Transaction_["kind"]]: (api_Step: _Api___applied__Kind_Step_<Kind>) => _Applied_Step_
}

const APPLYMAP__KIND_STEP: _ApplyMap__Kind_Step_ = {
  TEXT: ({
    model_TextEditor,
    step_Transaction
  }) => appliedOf__Step_Text({
    model_TextEditor,
    step_Text: step_Transaction
  }),
  CHANGE: ({
    model_TextEditor,
    step_Transaction
  }) => appliedOf__Step_Change({
    model_TextEditor,
    step_Change: step_Transaction
  }),
  SOURCE: ({
    model_TextEditor,
    step_Transaction
  }) => appliedOf__Step_Source({
    model_TextEditor,
    step_Source: step_Transaction
  })
}

interface _Applied_Step_ {
  model_TextEditor: _Model_TextEditor_
  steps_Inverse: _NonEmpty_<_Step_Transaction_>
}

interface _Api___appliedOf__Step_Text_ {
  model_TextEditor: _Model_TextEditor_
  step_Text: _TEXT_Step_Transaction_
}

function appliedOf__Step_Text({
  model_TextEditor,
  step_Text
}: _Api___appliedOf__Step_Text_): _Applied_Step_ {
  const id_Text = step_Text.id_Text
  return id_Text.kind === "DOCUMENT"
    ? appliedTo__Document({
      model_TextEditor,
      step_Text
    })
    : appliedTo__Change({
      model_TextEditor,
      step_Text,
      id_Text
    })
}

interface _Api___appliedTo__Document_ {
  model_TextEditor: _Model_TextEditor_
  step_Text: _TEXT_Step_Transaction_
}

function appliedTo__Document({
  model_TextEditor,
  step_Text
}: _Api___appliedTo__Document_): _Applied_Step_ {
  const document = model_TextEditor.document
  if (!isInside__Range({
    text_Model: document,
    range: step_Text.range
  })) throw new Error(`a step at ${labelOf__Range(step_Text.range)} isn't inside the document`)
  return {
    model_TextEditor: {
      document: replacedIn__Text({
        text_Model: document,
        range: step_Text.range,
        next: step_Text.next
      }),
      proposed: model_TextEditor.proposed.map((changes_Source) => ({
        source: changes_Source.source,
        changes: mapped__NonEmpty({
          items: changes_Source.changes,
          map: (change) => carriedOf__Change({
            change,
            range: step_Text.range,
            next: step_Text.next
          })
        })
      }))
    },
    steps_Inverse: [
      inverseOf__Step({
        text_Model: document,
        step_Text
      }),
      ...restoresOf__Step({
        model_TextEditor,
        range: step_Text.range
      })
    ]
  }
}

interface _Api___replacedIn__Text_ {
  text_Model: _Text_Model_
  range: _Range_Text_
  next: _Text_Model_
}

function replacedIn__Text({
  text_Model,
  range,
  next
}: _Api___replacedIn__Text_): _Text_Model_ {
  const line_From = lineOf__Text({
    text_Model,
    index: range.from.line
  })
  const line_To = lineOf__Text({
    text_Model,
    index: range.to.line
  })
  const before = sliceOf__Text_Line({
    text: line_From,
    from: 0,
    to: range.from.offset
  })
  const after = sliceOf__Text_Line({
    text: line_To,
    from: range.to.offset,
    to: countOf__CodePoints(line_To)
  })
  const [
    line_Next,
    ...lines_Next
  ] = next.lines
  const line_Last = lines_Next.at(-1)
  const lines_Middle: _NonEmpty_<_Text_Line_NonTerminated_> = line_Last === undefined
    ? [
      joined__Text_Line([
        before,
        line_Next,
        after
      ])
    ]
    : [
      joined__Text_Line([
        before,
        line_Next
      ]),
      ...lines_Next.slice(
        0,
        -1
      ),
      joined__Text_Line([
        line_Last,
        after
      ])
    ]
  const [
    line_First,
    ...lines_Rest
  ] = [
    ...text_Model.lines.slice(
      0,
      range.from.line
    ),
    ...lines_Middle,
    ...text_Model.lines.slice(range.to.line + 1)
  ]
  return {
    lines: line_First === undefined
      ? lines_Middle
      : [
        line_First,
        ...lines_Rest
      ],
    marks: normalizedOf__Marks([
      ...marksAround__Step({
        marks: text_Model.marks,
        range,
        next
      }),
      ...next.marks.map((mark) => ({
        range: {
          from: shiftedBy__Position({
            position: mark.range.from,
            origin: range.from
          }),
          to: shiftedBy__Position({
            position: mark.range.to,
            origin: range.from
          })
        },
        data: mark.data
      }))
    ])
  }
}

interface _Api___marksAround__Step_ {
  marks: Array<_Mark_Text_>
  range: _Range_Text_
  next: _Text_Model_
}

function marksAround__Step({
  marks,
  range,
  next
}: _Api___marksAround__Step_): Array<_Mark_Text_> {
  return marks.flatMap((mark) => [
    ...(orderOf__Positions({
      position: mark.range.from,
      position_Other: range.from
    }) < 0
      ? [
        {
          range: {
            from: mark.range.from,
            to: orderOf__Positions({
              position: mark.range.to,
              position_Other: range.from
            }) < 0 ? mark.range.to : range.from
          },
          data: mark.data
        }
      ]
      : []),
    ...(orderOf__Positions({
      position: mark.range.to,
      position_Other: range.to
    }) > 0
      ? [
        {
          range: {
            from: carried__Position({
              position: orderOf__Positions({
                position: mark.range.from,
                position_Other: range.to
              }) > 0 ? mark.range.from : range.to,
              range,
              next,
              bias: "AFTER"
            }),
            to: carried__Position({
              position: mark.range.to,
              range,
              next,
              bias: "AFTER"
            })
          },
          data: mark.data
        }
      ]
      : [])
  ])
}

interface _Api___lineOf__Text_ {
  text_Model: _Text_Model_
  index: number
}

function lineOf__Text({
  text_Model,
  index
}: _Api___lineOf__Text_): _Text_Line_NonTerminated_ {
  return text_Model.lines[index] ?? TEXT_LINE_EMPTY
}

const TEXT_LINE_EMPTY = "" as _Text_Line_NonTerminated_

interface _Api___sliceOf__Text_Line_ {
  text: _Text_Line_NonTerminated_
  from: number
  to: number
}

function sliceOf__Text_Line({
  text,
  from,
  to
}: _Api___sliceOf__Text_Line_): _Text_Line_NonTerminated_ {
  return Array.from(text).slice(
    from,
    to
  ).join("") as _Text_Line_NonTerminated_
}

function joined__Text_Line(
  texts: Array<_Text_Line_NonTerminated_>
): _Text_Line_NonTerminated_ {
  return texts.join("") as _Text_Line_NonTerminated_
}

interface _Api___mapped__NonEmpty_<Item, Mapped> {
  items: _NonEmpty_<Item>
  map: (item: Item) => Mapped
}

function mapped__NonEmpty<Item, Mapped>({
  items,
  map
}: _Api___mapped__NonEmpty_<Item, Mapped>): _NonEmpty_<Mapped> {
  const [
    first,
    ...rest
  ] = items
  return [
    map(first),
    ...rest.map((item) => map(item))
  ]
}

interface _Api___rebasedOf__Changes_ {
  changes: Array<_Change_>
  transactions: Array<_Transaction_Model_>
}

interface _Rebased_Changes_ {
  changes: Array<_Change_>
  indexes_Stale: Array<number>
  count_Dropped: number
}

function rebasedOf__Changes({
  changes,
  transactions
}: _Api___rebasedOf__Changes_): _Rebased_Changes_ {
  const steps_Document = transactions
    .flatMap((transaction) => transaction.steps)
    .filter((step_Transaction) => step_Transaction.kind === "TEXT" && step_Transaction.id_Text.kind === "DOCUMENT")
    .flatMap((step_Transaction) => step_Transaction.kind === "TEXT" ? [step_Transaction] : [])
  const changes_Carried = changes.map((change) => steps_Document.reduce(
    (carried, step_Text) => ({
      change: carriedOf__Change({
        change: carried.change,
        range: step_Text.range,
        next: step_Text.next
      }),
      isStale: carried.isStale || isTouched__Change({
        change: carried.change,
        range: step_Text.range
      })
    }),
    {
      change,
      isStale: false
    }
  ))
  const changes_Kept = changes_Carried.filter((carried) => carried.change.kind !== "MOVE" || orderOf__Positions({
    position: carried.change.range.from,
    position_Other: carried.change.range.to
  }) !== 0)
  return {
    changes: changes_Kept.map((carried) => carried.change),
    indexes_Stale: changes_Kept.flatMap((
      carried,
      index
    ) => carried.isStale ? [index] : []),
    count_Dropped: changes_Carried.length - changes_Kept.length
  }
}

interface _Api___isTouched__Change_ {
  change: _Change_
  range: _Range_Text_
}

function isTouched__Change({
  change,
  range
}: _Api___isTouched__Change_): boolean {
  const isEmpty_Step = orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) === 0
  const isOverlapping = isEmpty_Step
    ? orderOf__Positions({
      position: change.range.from,
      position_Other: range.from
    }) < 0 && orderOf__Positions({
      position: range.from,
      position_Other: change.range.to
    }) < 0
    : orderOf__Positions({
      position: range.from,
      position_Other: change.range.to
    }) < 0 && orderOf__Positions({
      position: change.range.from,
      position_Other: range.to
    }) < 0
  const isCutAt = change.kind === "MOVE" && !isEmpty_Step && orderOf__Positions({
    position: range.from,
    position_Other: change.at
  }) < 0 && orderOf__Positions({
    position: change.at,
    position_Other: range.to
  }) < 0
  return isOverlapping || isCutAt
}

interface _Api___carriedOf__Change_ {
  change: _Change_
  range: _Range_Text_
  next: _Text_Model_
}

function carriedOf__Change({
  change,
  range,
  next
}: _Api___carriedOf__Change_): _Change_ {
  const range_Carried = carriedOf__Range({
    range: change.range,
    range_Step: range,
    next
  })
  return change.kind === "REPLACE"
    ? {
      kind: "REPLACE",
      range: range_Carried,
      next: change.next
    }
    : {
      kind: "MOVE",
      range: range_Carried,
      at: carried__Position({
        position: change.at,
        range,
        next,
        bias: "BEFORE"
      })
    }
}

interface _Api___carriedOf__Range_ {
  range: _Range_Text_
  range_Step: _Range_Text_
  next: _Text_Model_
}

function carriedOf__Range({
  range,
  range_Step,
  next
}: _Api___carriedOf__Range_): _Range_Text_ {
  const isEmpty = orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) === 0
  return {
    from: carried__Position({
      position: range.from,
      range: range_Step,
      next,
      bias: isEmpty ? "BEFORE" : "AFTER"
    }),
    to: carried__Position({
      position: range.to,
      range: range_Step,
      next,
      bias: "BEFORE"
    })
  }
}

interface _Api___carried__Position_ {
  position: _Position_Text_
  range: _Range_Text_
  next: _Text_Model_
  bias: _Bias_Position_
}

function carried__Position({
  position,
  range,
  next,
  bias
}: _Api___carried__Position_): _Position_Text_ {
  const end = endOf__Next({
    from: range.from,
    next
  })
  const order_From = orderOf__Positions({
    position,
    position_Other: range.from
  })
  const order_To = orderOf__Positions({
    position,
    position_Other: range.to
  })
  if (order_From < 0) return position
  if (order_To > 0) return position.line === range.to.line
    ? {
      line: end.line,
      offset: end.offset + position.offset - range.to.offset
    }
    : {
      line: position.line + end.line - range.to.line,
      offset: position.offset
    }
  if (order_From === 0 && order_To === 0) return bias === "BEFORE" ? position : end
  if (order_To === 0) return end
  if (order_From === 0) return position
  return bias === "BEFORE" ? range.from : end
}

type _Bias_Position_ = "BEFORE" | "AFTER"

interface _Api___endOf__Next_ {
  from: _Position_Text_
  next: _Text_Model_
}

function endOf__Next({
  from,
  next
}: _Api___endOf__Next_): _Position_Text_ {
  const [
    line_First,
    ...lines_Rest
  ] = next.lines
  const line_Last = lines_Rest.at(-1)
  return line_Last === undefined
    ? {
      line: from.line,
      offset: from.offset + countOf__CodePoints(line_First)
    }
    : {
      line: from.line + lines_Rest.length,
      offset: countOf__CodePoints(line_Last)
    }
}

interface _Api___inverseOf__Step_ {
  text_Model: _Text_Model_
  step_Text: _TEXT_Step_Transaction_
}

function inverseOf__Step({
  text_Model,
  step_Text
}: _Api___inverseOf__Step_): _TEXT_Step_Transaction_ {
  return {
    kind: "TEXT",
    id_Text: step_Text.id_Text,
    range: {
      from: step_Text.range.from,
      to: endOf__Next({
        from: step_Text.range.from,
        next: step_Text.next
      })
    },
    next: textIn__Range({
      text_Model,
      range: step_Text.range
    })
  }
}

interface _Api___textIn__Range_ {
  text_Model: _Text_Model_
  range: _Range_Text_
}

function textIn__Range({
  text_Model,
  range
}: _Api___textIn__Range_): _Text_Model_ {
  const line_From = lineOf__Text({
    text_Model,
    index: range.from.line
  })
  const marks = marksIn__Range({
    marks: text_Model.marks,
    range
  }).map((mark) => ({
    range: {
      from: relativeTo__Position({
        position: mark.range.from,
        origin: range.from
      }),
      to: relativeTo__Position({
        position: mark.range.to,
        origin: range.from
      })
    },
    data: mark.data
  }))
  return range.from.line === range.to.line
    ? {
      lines: [
        sliceOf__Text_Line({
          text: line_From,
          from: range.from.offset,
          to: range.to.offset
        })
      ],
      marks
    }
    : {
      marks,
      lines: [
        sliceOf__Text_Line({
          text: line_From,
          from: range.from.offset,
          to: countOf__CodePoints(line_From)
        }),
        ...text_Model.lines.slice(
          range.from.line + 1,
          range.to.line
        ),
        sliceOf__Text_Line({
          text: lineOf__Text({
            text_Model,
            index: range.to.line
          }),
          from: 0,
          to: range.to.offset
        })
      ]
    }
}

interface _Api___marksIn__Range_ {
  marks: Array<_Mark_Text_>
  range: _Range_Text_
}

function marksIn__Range({
  marks,
  range
}: _Api___marksIn__Range_): Array<_Mark_Text_> {
  return marks.flatMap((mark) => {
    const from = orderOf__Positions({
      position: mark.range.from,
      position_Other: range.from
    }) > 0 ? mark.range.from : range.from
    const to = orderOf__Positions({
      position: mark.range.to,
      position_Other: range.to
    }) < 0 ? mark.range.to : range.to
    return orderOf__Positions({
      position: from,
      position_Other: to
    }) < 0
      ? [
        {
          range: {
            from,
            to
          },
          data: mark.data
        }
      ]
      : []
  })
}

interface _Api___relativeTo__Position_ {
  position: _Position_Text_
  origin: _Position_Text_
}

function relativeTo__Position({
  position,
  origin
}: _Api___relativeTo__Position_): _Position_Text_ {
  return position.line === origin.line
    ? {
      line: 0,
      offset: position.offset - origin.offset
    }
    : {
      line: position.line - origin.line,
      offset: position.offset
    }
}

interface _Api___restoresOf__Step_ {
  model_TextEditor: _Model_TextEditor_
  range: _Range_Text_
}

function restoresOf__Step({
  model_TextEditor,
  range
}: _Api___restoresOf__Step_): Array<_CHANGE_Step_Transaction_> {
  return orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) === 0
    ? []
    : model_TextEditor.proposed.flatMap((changes_Source) => changes_Source.changes.flatMap((
      change,
      index
    ): Array<_CHANGE_Step_Transaction_> => positionsOf__Change(change).some((position) => isAt__Range({
      position,
      range
    }))
      ? [
        {
          kind: "CHANGE",
          source: changes_Source.source,
          index,
          change
        }
      ]
      : []))
}

function positionsOf__Change(
  change: _Change_
): Array<_Position_Text_> {
  return change.kind === "MOVE"
    ? [
      change.range.from,
      change.range.to,
      change.at
    ]
    : [
      change.range.from,
      change.range.to
    ]
}

interface _Api___isAt__Range_ {
  position: _Position_Text_
  range: _Range_Text_
}

function isAt__Range({
  position,
  range
}: _Api___isAt__Range_): boolean {
  return orderOf__Positions({
    position: range.from,
    position_Other: position
  }) <= 0 && orderOf__Positions({
    position,
    position_Other: range.to
  }) <= 0
}

interface _Api___appliedTo__Change_ {
  model_TextEditor: _Model_TextEditor_
  step_Text: _TEXT_Step_Transaction_
  id_Text: _CHANGE_Id_Text_
}

function appliedTo__Change({
  model_TextEditor,
  step_Text,
  id_Text
}: _Api___appliedTo__Change_): _Applied_Step_ {
  const changes_Source = model_TextEditor.proposed.find((changes_Each) => changes_Each.source === id_Text.source)
  const change = changes_Source?.changes[id_Text.index]
  if (changes_Source === undefined || change === undefined || change.kind !== "REPLACE" || !isInside__Range({
    text_Model: change.next,
    range: step_Text.range
  })) throw new Error(`a step at ${labelOf__Range(step_Text.range)} isn't inside the text ${id_Text.source} proposes in its change ${id_Text.index}`)
  return {
    model_TextEditor: {
      document: model_TextEditor.document,
      proposed: proposedWith__Change({
        model_TextEditor,
        changes_Source,
        change,
        change_Next: {
          kind: "REPLACE",
          range: change.range,
          next: replacedIn__Text({
            text_Model: change.next,
            range: step_Text.range,
            next: step_Text.next
          })
        }
      })
    },
    steps_Inverse: [
      inverseOf__Step({
        text_Model: change.next,
        step_Text
      })
    ]
  }
}

interface _Api___proposedWith__Change_ {
  model_TextEditor: _Model_TextEditor_
  changes_Source: _Changes_Source_
  change: _Change_
  change_Next: _Change_
}

function proposedWith__Change({
  model_TextEditor,
  changes_Source,
  change,
  change_Next
}: _Api___proposedWith__Change_): Array<_Changes_Source_> {
  return model_TextEditor.proposed.map((changes_Each) => changes_Each === changes_Source
    ? {
      source: changes_Each.source,
      changes: mapped__NonEmpty({
        items: changes_Each.changes,
        map: (change_Each) => change_Each === change ? change_Next : change_Each
      })
    }
    : changes_Each)
}

interface _Api___appliedOf__Step_Change_ {
  model_TextEditor: _Model_TextEditor_
  step_Change: _CHANGE_Step_Transaction_
}

function appliedOf__Step_Change({
  model_TextEditor,
  step_Change
}: _Api___appliedOf__Step_Change_): _Applied_Step_ {
  const changes_Source = model_TextEditor.proposed.find((changes_Each) => changes_Each.source === step_Change.source)
  const change = changes_Source?.changes[step_Change.index]
  if (changes_Source === undefined || change === undefined || reasonsOf__Change({
    document: model_TextEditor.document,
    change: step_Change.change
  }).length > 0) throw new Error(`a step can't set ${step_Change.source}'s change ${step_Change.index} to one at ${labelOf__Range(step_Change.change.range)}`)
  return {
    model_TextEditor: {
      document: model_TextEditor.document,
      proposed: proposedWith__Change({
        model_TextEditor,
        changes_Source,
        change,
        change_Next: step_Change.change
      })
    },
    steps_Inverse: [
      {
        kind: "CHANGE",
        source: step_Change.source,
        index: step_Change.index,
        change
      }
    ]
  }
}

interface _Api___appliedOf__Step_Source_ {
  model_TextEditor: _Model_TextEditor_
  step_Source: _SOURCE_Step_Transaction_
}

function appliedOf__Step_Source({
  model_TextEditor,
  step_Source
}: _Api___appliedOf__Step_Source_): _Applied_Step_ {
  const changes_Before = model_TextEditor.proposed.find((changes_Each) => changes_Each.source === step_Source.source)?.changes ?? []
  const [change_First, ...changes_Rest] = step_Source.changes
  const changes_Source: _Changes_Source_ | null = change_First === undefined
    ? null
    : {
      source: step_Source.source,
      changes: [
        change_First,
        ...changes_Rest
      ]
    }
  const proposed = changes_Source === null
    ? model_TextEditor.proposed.filter((changes_Each) => changes_Each.source !== step_Source.source)
    : model_TextEditor.proposed.some((changes_Each) => changes_Each.source === step_Source.source)
      ? model_TextEditor.proposed.map((changes_Each) => changes_Each.source === step_Source.source ? changes_Source : changes_Each)
      : [
        ...model_TextEditor.proposed,
        changes_Source
      ]
  const refusals = [
    ...(changes_Source === null
      ? []
      : refusalsIn__Source({
        document: model_TextEditor.document,
        changes_Source
      })),
    ...refusalsAcross__Sources(proposed)
  ]
  if (refusals.length > 0) throw new Error(`a step can't set ${step_Source.source}'s changes: ${refusals.map((refusal) => `${refusal.source}: ${refusal.reason}`).join("; ")}`)
  return {
    model_TextEditor: {
      document: model_TextEditor.document,
      proposed
    },
    steps_Inverse: [
      {
        kind: "SOURCE",
        source: step_Source.source,
        changes: changes_Before
      }
    ]
  }
}

interface _Api___textWith__Sources_ {
  model_TextEditor: _Model_TextEditor_
  sources: Array<string>
}

function textWith__Sources({
  model_TextEditor,
  sources
}: _Api___textWith__Sources_): _Text_Model_ {
  const pieces = piecesWith__Sources({
    model_TextEditor,
    sources,
    range: {
      from: {
        line: 0,
        offset: 0
      },
      to: endOf__Next({
        from: {
          line: 0,
          offset: 0
        },
        next: model_TextEditor.document
      })
    }
  })
  const marks: Array<_Mark_Text_> = []
  let position_Piece: _Position_Text_ = {
    line: 0,
    offset: 0
  }
  for (const piece_Applied of pieces) {
    const origin = position_Piece
    marks.push(...piece_Applied.marks.map((mark) => ({
      range: {
        from: shiftedBy__Position({
          position: relativeTo__Position({
            position: mark.range.from,
            origin: piece_Applied.range.from
          }),
          origin
        }),
        to: shiftedBy__Position({
          position: relativeTo__Position({
            position: mark.range.to,
            origin: piece_Applied.range.from
          }),
          origin
        })
      },
      data: mark.data
    })))
    position_Piece = endOf__Next({
      from: position_Piece,
      next: {
        lines: parseTexts_Line(piece_Applied.text),
        marks: []
      }
    })
  }
  return {
    lines: parseTexts_Line(pieces.map((piece_Applied) => piece_Applied.text).join("")),
    marks: normalizedOf__Marks(marks)
  }
}

interface _Api___piecesWith__Sources_ {
  model_TextEditor: _Model_TextEditor_
  sources: Array<string>
  range: _Range_Text_
}

type _Piece_Applied_ = _DOCUMENT_Piece_Applied_ | _CHANGE_Piece_Applied_

interface __BASE_Piece_Applied_<Kind extends string> {
  kind: Kind
  text: string
  range: _Range_Text_
  marks: Array<_Mark_Text_>
  move: _Move_Piece_ | null
}

interface _Move_Piece_ {
  source: string
  index: number
}

interface _DOCUMENT_Piece_Applied_ extends __BASE_Piece_Applied_<"DOCUMENT"> {}

interface _CHANGE_Piece_Applied_ extends __BASE_Piece_Applied_<"CHANGE"> {
  source: string
  index: number
}

function piecesWith__Sources({
  model_TextEditor,
  sources,
  range
}: _Api___piecesWith__Sources_): Array<_Piece_Applied_> {
  const document = model_TextEditor.document
  const codePoints = Array.from(flatOf__Text(document))
  const from = indexOf__Position({
    text_Model: document,
    position: range.from
  })
  const to = indexOf__Position({
    text_Model: document,
    position: range.to
  })
  const changes_Flat = model_TextEditor.proposed
    .filter((changes_Source) => sources.includes(changes_Source.source))
    .flatMap((changes_Source) => changes_Source.changes.map((
      change,
      index
    ) => flatOf__Change({
      text_Model: document,
      source: changes_Source.source,
      index,
      change
    })))
  const changes_Top = changes_Flat.filter((change_Flat) => parentOf__Change_Flat({
    change_Flat,
    changes_Flat
  }) === null)
  return spliced({
    length: to - from,
    pieceOf: (
      piece_From,
      piece_To
    ) => pieceOf__Document({
      text_Model: document,
      codePoints,
      from: from + piece_From,
      to: from + piece_To
    }),
    splices: [
      ...changes_Top.flatMap((change_Flat) => {
        const change = change_Flat.change
        if (change.kind !== "MOVE") return []
        const at = indexOf__Position({
          text_Model: document,
          position: change.at
        })
        return at < from || at > to
          ? []
          : [
            {
              from: at - from,
              to: at - from,
              pieces: landingOf__Change_Flat({
                text_Model: document,
                change_Flat,
                changes_Flat,
                codePoints
              })
            }
          ]
      }),
      ...changes_Top
        .filter((change_Flat) => change_Flat.from >= from && change_Flat.to <= to)
        .map((change_Flat) => ({
          from: change_Flat.from - from,
          to: change_Flat.to - from,
          pieces: outputOf__Change_Flat({
            text_Model: document,
            change_Flat,
            changes_Flat,
            codePoints
          })
        }))
    ]
  })
}

function flatOf__Text(
  text_Model: _Text_Model_
): string {
  return text_Model.lines.join("\n")
}

interface _Api___indexOf__Position_ {
  text_Model: _Text_Model_
  position: _Position_Text_
}

function indexOf__Position({
  text_Model,
  position
}: _Api___indexOf__Position_): number {
  return text_Model.lines.slice(
    0,
    position.line
  ).reduce(
    (
      index,
      text
    ) => index + countOf__CodePoints(text) + 1,
    0
  ) + position.offset
}

interface _Api___flatOf__Change_ {
  text_Model: _Text_Model_
  source: string
  index: number
  change: _Change_
}

function flatOf__Change({
  text_Model,
  source,
  index,
  change
}: _Api___flatOf__Change_): _Flat_Change_ {
  return {
    source,
    index,
    change,
    from: indexOf__Position({
      text_Model,
      position: change.range.from
    }),
    to: indexOf__Position({
      text_Model,
      position: change.range.to
    })
  }
}

interface _Flat_Change_ {
  source: string
  index: number
  change: _Change_
  from: number
  to: number
}

interface _Api___parentOf__Change_Flat_ {
  change_Flat: _Flat_Change_
  changes_Flat: Array<_Flat_Change_>
}

function parentOf__Change_Flat({
  change_Flat,
  changes_Flat
}: _Api___parentOf__Change_Flat_): _Flat_Change_ | null {
  return changes_Flat
    .filter((change_Other) => change_Other.source !== change_Flat.source && isInside__Change_Flat({
      change_Flat,
      change_Flat_Outer: change_Other
    }))
    .reduce<_Flat_Change_ | null>(
      (
        change_Innermost,
        change_Other
      ) => change_Innermost === null || change_Other.from > change_Innermost.from || (change_Other.from === change_Innermost.from && change_Other.to < change_Innermost.to)
        ? change_Other
        : change_Innermost,
      null
    )
}

interface _Api___isInside__Change_Flat_ {
  change_Flat: _Flat_Change_
  change_Flat_Outer: _Flat_Change_
}

function isInside__Change_Flat({
  change_Flat,
  change_Flat_Outer
}: _Api___isInside__Change_Flat_): boolean {
  return change_Flat.from === change_Flat.to
    ? change_Flat_Outer.from < change_Flat.from && change_Flat.from < change_Flat_Outer.to
    : change_Flat_Outer.from <= change_Flat.from && change_Flat.to <= change_Flat_Outer.to && !(change_Flat_Outer.from === change_Flat.from && change_Flat_Outer.to === change_Flat.to)
}

interface _Api___spliced_ {
  length: number
  pieceOf: (
    from: number,
    to: number
  ) => _Piece_Applied_
  splices: Array<_Splice_Flat_>
}

function spliced({
  length,
  pieceOf,
  splices
}: _Api___spliced_): Array<_Piece_Applied_> {
  const pieces: Array<_Piece_Applied_> = []
  let index = 0
  for (const splice of splices.toSorted((
    splice_One,
    splice_Other
  ) => splice_One.from - splice_Other.from || splice_One.to - splice_Other.to)) {
    if (splice.from > index) pieces.push(pieceOf(
      index,
      splice.from
    ))
    pieces.push(...splice.pieces)
    index = splice.to
  }
  return index < length
    ? [
      ...pieces,
      pieceOf(
        index,
        length
      )
    ]
    : pieces
}

interface _Splice_Flat_ {
  from: number
  to: number
  pieces: Array<_Piece_Applied_>
}

interface _Api___pieceOf__Document_ {
  text_Model: _Text_Model_
  codePoints: Array<string>
  from: number
  to: number
}

function pieceOf__Document({
  text_Model,
  codePoints,
  from,
  to
}: _Api___pieceOf__Document_): _Piece_Applied_ {
  const range = {
    from: positionOf__Index({
      text_Model,
      index: from
    }),
    to: positionOf__Index({
      text_Model,
      index: to
    })
  }
  return {
    kind: "DOCUMENT",
    text: codePoints.slice(
      from,
      to
    ).join(""),
    range,
    marks: marksIn__Range({
      marks: text_Model.marks,
      range
    }),
    move: null
  }
}

interface _Api___positionOf__Index_ {
  text_Model: _Text_Model_
  index: number
}

function positionOf__Index({
  text_Model,
  index
}: _Api___positionOf__Index_): _Position_Text_ {
  let rest = index
  for (const [
    line,
    text
  ] of text_Model.lines.entries()) {
    const count = countOf__CodePoints(text)
    if (rest <= count) return {
      line,
      offset: rest
    }
    rest = rest - count - 1
  }
  return {
    line: text_Model.lines.length - 1,
    offset: countOf__CodePoints(text_Model.lines.at(-1) ?? "")
  }
}

interface _Api___landingOf__Change_Flat_ {
  text_Model: _Text_Model_
  change_Flat: _Flat_Change_
  changes_Flat: Array<_Flat_Change_>
  codePoints: Array<string>
}

function landingOf__Change_Flat({
  text_Model,
  change_Flat,
  changes_Flat,
  codePoints
}: _Api___landingOf__Change_Flat_): Array<_Piece_Applied_> {
  const change = change_Flat.change
  const rotation = change.kind === "MOVE"
    ? rotationOf__Move({
      text_Model,
      change
    })
    : "NONE"
  const from_Inner = change_Flat.from + (rotation === "BREAK_TO_END" ? 1 : 0)
  const to_Inner = change_Flat.to - (rotation === "BREAK_TO_START" ? 1 : 0)
  return [
    ...(rotation === "BREAK_TO_START"
      ? [
        pieceOf__Document({
          text_Model,
          codePoints,
          from: to_Inner,
          to: change_Flat.to
        })
      ]
      : []),
    ...spliced({
      length: to_Inner - from_Inner,
      pieceOf: (
        piece_From,
        piece_To
      ) => pieceOf__Document({
        text_Model,
        codePoints,
        from: from_Inner + piece_From,
        to: from_Inner + piece_To
      }),
      splices: childrenOf__Change_Flat({
        change_Flat,
        changes_Flat
      }).map((change_Child) => ({
        from: change_Child.from - from_Inner,
        to: change_Child.to - from_Inner,
        pieces: outputOf__Change_Flat({
          text_Model,
          change_Flat: change_Child,
          changes_Flat,
          codePoints
        })
      }))
    }),
    ...(rotation === "BREAK_TO_END"
      ? [
        pieceOf__Document({
          text_Model,
          codePoints,
          from: change_Flat.from,
          to: from_Inner
        })
      ]
      : [])
  ].map((piece_Applied) => ({
    ...piece_Applied,
    move: {
      source: change_Flat.source,
      index: change_Flat.index
    }
  }))
}

interface _Api___rotationOf__Move_ {
  text_Model: _Text_Model_
  change: _MOVE_Change_
}

type _Rotation_Move_ = "NONE" | "BREAK_TO_END" | "BREAK_TO_START"

function rotationOf__Move({
  text_Model,
  change
}: _Api___rotationOf__Move_): _Rotation_Move_ {
  const text = flatOf__Text(textIn__Range({
    text_Model,
    range: change.range
  }))
  const count_At = countOf__CodePoints(text_Model.lines[change.at.line] ?? "")
  return text.startsWith("\n") && !text.endsWith("\n") && change.at.offset === 0
    ? "BREAK_TO_END"
    : text.endsWith("\n") && !text.startsWith("\n") && change.at.offset === count_At && count_At > 0
      ? "BREAK_TO_START"
      : "NONE"
}

interface _Api___landedOf__Move_ {
  model_TextEditor: _Model_TextEditor_
  change: _MOVE_Change_
}

function landedOf__Move({
  model_TextEditor,
  change
}: _Api___landedOf__Move_): string {
  return TEXTMAP__ROTATION_MOVE[rotationOf__Move({
    text_Model: model_TextEditor.document,
    change
  })](flatOf__Text(textIn__Range({
    text_Model: model_TextEditor.document,
    range: change.range
  })))
}

type _TextMap__Rotation_Move_ = {
  [Rotation in _Rotation_Move_]: (text: string) => string
}

const TEXTMAP__ROTATION_MOVE: _TextMap__Rotation_Move_ = {
  NONE: (text) => text,
  BREAK_TO_END: (text) => `${text.slice(1)}\n`,
  BREAK_TO_START: (text) => `\n${text.slice(
    0,
    -1
  )}`
}

interface _Api___childrenOf__Change_Flat_ {
  change_Flat: _Flat_Change_
  changes_Flat: Array<_Flat_Change_>
}

function childrenOf__Change_Flat({
  change_Flat,
  changes_Flat
}: _Api___childrenOf__Change_Flat_): Array<_Flat_Change_> {
  return changes_Flat.filter((change_Other) => parentOf__Change_Flat({
    change_Flat: change_Other,
    changes_Flat
  }) === change_Flat)
}

interface _Api___outputOf__Change_Flat_ {
  text_Model: _Text_Model_
  change_Flat: _Flat_Change_
  changes_Flat: Array<_Flat_Change_>
  codePoints: Array<string>
}

function outputOf__Change_Flat({
  text_Model,
  change_Flat,
  changes_Flat,
  codePoints
}: _Api___outputOf__Change_Flat_): Array<_Piece_Applied_> {
  const change = change_Flat.change
  if (change.kind === "MOVE") return []
  const codePoints_Next = Array.from(flatOf__Text(change.next))
  const runs = runsBetween__Flat({
    text_Before: codePoints.slice(
      change_Flat.from,
      change_Flat.to
    ).join(""),
    text_After: codePoints_Next.join("")
  })
  const pieceOf = (
    piece_From: number,
    piece_To: number
  ): _Piece_Applied_ => {
    const range = {
      from: positionOf__Index({
        text_Model: change.next,
        index: piece_From
      }),
      to: positionOf__Index({
        text_Model: change.next,
        index: piece_To
      })
    }
    return {
      kind: "CHANGE",
      text: codePoints_Next.slice(
        piece_From,
        piece_To
      ).join(""),
      range,
      marks: marksIn__Range({
        marks: change.next.marks,
        range
      }),
      source: change_Flat.source,
      index: change_Flat.index,
      move: null
    }
  }
  const pieces = spliced({
    length: codePoints_Next.length,
    pieceOf,
    splices: childrenOf__Change_Flat({
      change_Flat,
      changes_Flat
    }).flatMap((change_Child) => {
      const from = change_Child.from - change_Flat.from
      const to = change_Child.to - change_Flat.from
      const run = runs.find((run_Each) => run_Each.kind === "KEPT" && run_Each.from_Before <= from && to <= run_Each.to_Before)
      return run === undefined
        ? []
        : [
          {
            from: run.from_After + from - run.from_Before,
            to: run.from_After + to - run.from_Before,
            pieces: outputOf__Change_Flat({
              text_Model,
              change_Flat: change_Child,
              changes_Flat,
              codePoints
            })
          }
        ]
    })
  })
  return pieces.length === 0
    ? [
      pieceOf(
        0,
        0
      )
    ]
    : pieces
}

interface _Api___shiftedBy__Position_ {
  position: _Position_Text_
  origin: _Position_Text_
}

function shiftedBy__Position({
  position,
  origin
}: _Api___shiftedBy__Position_): _Position_Text_ {
  return position.line === 0
    ? {
      line: origin.line,
      offset: origin.offset + position.offset
    }
    : {
      line: origin.line + position.line,
      offset: position.offset
    }
}

interface _Api___runsBetween__Flat_ {
  text_Before: string
  text_After: string
}

interface _Run_Flat_ {
  kind: _Kind_Run_
  from_Before: number
  to_Before: number
  from_After: number
  to_After: number
}

type _Kind_Run_ = "KEPT" | "CHANGED"

function runsBetween__Flat({
  text_Before,
  text_After
}: _Api___runsBetween__Flat_): Array<_Run_Flat_> {
  const lines_Before = text_Before.split("\n")
  const lines_After = text_After.split("\n")
  return runsOf__Lengths(opsOf__Lines({
    lines_Before,
    lines_After
  }).flatMap((op_Lines) => lengthsOf__Op({
    op_Lines,
    lines_Before,
    lines_After
  })))
}

function runsOf__Lengths(
  lengths: Array<_Length_Run_>
): Array<_Run_Flat_> {
  const lengths_Merged = lengths
    .filter((length_Run) => length_Run.length_Before + length_Run.length_After > 0)
    .reduce(
      (
        lengths_Run: Array<_Length_Run_>,
        length_Run
      ) => {
        const length_Last = lengths_Run.at(-1)
        return length_Last !== undefined && length_Last.kind === length_Run.kind
          ? [
            ...lengths_Run.slice(
              0,
              -1
            ),
            {
              kind: length_Run.kind,
              length_Before: length_Last.length_Before + length_Run.length_Before,
              length_After: length_Last.length_After + length_Run.length_After
            }
          ]
          : [
            ...lengths_Run,
            length_Run
          ]
      },
      []
    )
  const runs: Array<_Run_Flat_> = []
  let from_Before = 0
  let from_After = 0
  for (const length_Run of lengths_Merged) {
    runs.push({
      kind: length_Run.kind,
      from_Before,
      to_Before: from_Before + length_Run.length_Before,
      from_After,
      to_After: from_After + length_Run.length_After
    })
    from_Before = from_Before + length_Run.length_Before
    from_After = from_After + length_Run.length_After
  }
  return runs
}

interface _Length_Run_ {
  kind: _Kind_Run_
  length_Before: number
  length_After: number
}

interface _Api___opsOf__Lines_ {
  lines_Before: Array<string>
  lines_After: Array<string>
}

interface _Op_Lines_ {
  kind: _Kind_Op_
  line_Before: number | null
  line_After: number | null
}

type _Kind_Op_ = "KEEP" | "PAIR" | "DELETE" | "INSERT"

function opsOf__Lines({
  lines_Before,
  lines_After
}: _Api___opsOf__Lines_): Array<_Op_Lines_> {
  const ops: Array<_Op_Lines_> = []
  let index_Before = 0
  let index_After = 0
  for (const difference of differencesOf__CodePoints(symbolsOf__Texts({
    texts_Before: lines_Before,
    texts_After: lines_After
  }))) {
    const from_After = index_After + difference.from - index_Before
    const to_After = from_After + difference.inserted.length
    ops.push(
      ...keptOf__Lines({
        from_Before: index_Before,
        to_Before: difference.from,
        from_After: index_After
      }),
      ...opsOf__Hunk({
        lines_Before,
        lines_After,
        from_Before: difference.from,
        to_Before: difference.to,
        from_After,
        to_After
      })
    )
    index_Before = difference.to
    index_After = to_After
  }
  return [
    ...ops,
    ...keptOf__Lines({
      from_Before: index_Before,
      to_Before: lines_Before.length,
      from_After: index_After
    })
  ]
}

interface _Api___symbolsOf__Texts_ {
  texts_Before: Array<string>
  texts_After: Array<string>
}

function symbolsOf__Texts({
  texts_Before,
  texts_After
}: _Api___symbolsOf__Texts_): _Api___differencesOf__CodePoints_ {
  const symbols = new Map<
    string,
    string
  >()
  const symbolOf = (text: string): string => {
    const symbol = symbols.get(text) ?? String.fromCodePoint(CODEPOINT_FIRST__SYMBOL + symbols.size)
    symbols.set(
      text,
      symbol
    )
    return symbol
  }
  return {
    codePoints_Before: texts_Before.map(symbolOf),
    codePoints_After: texts_After.map(symbolOf)
  }
}

const CODEPOINT_FIRST__SYMBOL = 0xf0000

interface _Api___keptOf__Lines_ {
  from_Before: number
  to_Before: number
  from_After: number
}

function keptOf__Lines({
  from_Before,
  to_Before,
  from_After
}: _Api___keptOf__Lines_): Array<_Op_Lines_> {
  return Array.from(
    {
      length: to_Before - from_Before
    },
    (
      _,
      index
    ) => ({
      kind: "KEEP",
      line_Before: from_Before + index,
      line_After: from_After + index
    })
  )
}

interface _Api___opsOf__Hunk_ {
  lines_Before: Array<string>
  lines_After: Array<string>
  from_Before: number
  to_Before: number
  from_After: number
  to_After: number
}

function opsOf__Hunk({
  lines_Before,
  lines_After,
  from_Before,
  to_Before,
  from_After,
  to_After
}: _Api___opsOf__Hunk_): Array<_Op_Lines_> {
  const pairs = (to_Before - from_Before) * (to_After - from_After) > LIMIT__PAIRS
    ? []
    : pairsOf__Hunk({
      lines_Before,
      lines_After,
      from_Before,
      to_Before,
      from_After,
      to_After
    })
  const ops: Array<_Op_Lines_> = []
  let line_Before = from_Before
  let line_After = from_After
  for (const pair of [
    ...pairs,
    {
      line_Before: to_Before,
      line_After: to_After
    }
  ]) {
    for (; line_Before < pair.line_Before; line_Before = line_Before + 1) ops.push({
      kind: "DELETE",
      line_Before,
      line_After: null
    })
    for (; line_After < pair.line_After; line_After = line_After + 1) ops.push({
      kind: "INSERT",
      line_Before: null,
      line_After
    })
    if (pair.line_Before === to_Before) continue
    ops.push({
      kind: "PAIR",
      line_Before: pair.line_Before,
      line_After: pair.line_After
    })
    line_Before = line_Before + 1
    line_After = line_After + 1
  }
  return ops
}

const LIMIT__PAIRS = 2500

interface _Pair_Lines_ {
  line_Before: number
  line_After: number
}

function pairsOf__Hunk({
  lines_Before,
  lines_After,
  from_Before,
  to_Before,
  from_After,
  to_After
}: _Api___opsOf__Hunk_): Array<_Pair_Lines_> {
  const scores = Array.from(
    {
      length: to_Before - from_Before
    },
    (
      _,
      index_Before
    ) => Array.from(
      {
        length: to_After - from_After
      },
      (
        _,
        index_After
      ) => similarityOf__Lines({
        text_One: lines_Before[from_Before + index_Before] ?? "",
        text_Other: lines_After[from_After + index_After] ?? ""
      })
    )
  )
  const scoreAt = (
    index_Before: number,
    index_After: number
  ): number => scores[index_Before]?.[index_After] ?? 0
  const best = Array.from(
    {
      length: to_Before - from_Before + 1
    },
    () => new Array<number>(to_After - from_After + 1).fill(0)
  )
  const bestAt = (
    index_Before: number,
    index_After: number
  ): number => best[index_Before]?.[index_After] ?? 0
  for (let index_Before = 1; index_Before <= to_Before - from_Before; index_Before = index_Before + 1) {
    for (let index_After = 1; index_After <= to_After - from_After; index_After = index_After + 1) {
      const score = scoreAt(
        index_Before - 1,
        index_After - 1
      )
      const row_Best = best[index_Before]
      if (row_Best === undefined) continue
      row_Best[index_After] = Math.max(
        bestAt(
          index_Before - 1,
          index_After
        ),
        bestAt(
          index_Before,
          index_After - 1
        ),
        score >= THRESHOLD__SIMILARITY
          ? bestAt(
            index_Before - 1,
            index_After - 1
          ) + score
          : 0
      )
    }
  }
  const pairs: Array<_Pair_Lines_> = []
  let index_Before = to_Before - from_Before
  let index_After = to_After - from_After
  while (index_Before > 0 && index_After > 0) {
    const score = scoreAt(
      index_Before - 1,
      index_After - 1
    )
    if (score >= THRESHOLD__SIMILARITY && bestAt(
      index_Before,
      index_After
    ) === bestAt(
      index_Before - 1,
      index_After - 1
    ) + score) {
      pairs.unshift({
        line_Before: from_Before + index_Before - 1,
        line_After: from_After + index_After - 1
      })
      index_Before = index_Before - 1
      index_After = index_After - 1
    } else if (bestAt(
      index_Before,
      index_After
    ) === bestAt(
      index_Before - 1,
      index_After
    )) index_Before = index_Before - 1
    else index_After = index_After - 1
  }
  return pairs
}

const THRESHOLD__SIMILARITY = 0.5

interface _Api___similarityOf__Lines_ {
  text_One: string
  text_Other: string
}

function similarityOf__Lines({
  text_One,
  text_Other
}: _Api___similarityOf__Lines_): number {
  const tokens_One = text_One.match(REGEXP_TOKEN) ?? []
  const tokens_Other = text_Other.match(REGEXP_TOKEN) ?? []
  const weight_Both = weightOf__Tokens(tokens_One) + weightOf__Tokens(tokens_Other)
  return weight_Both === 0
    ? 1
    : 2 * weightOf__Common({
      tokens_One,
      tokens_Other
    }) / weight_Both
}

const REGEXP_TOKEN = /[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*|\s+|./gsu

function weightOf__Tokens(
  tokens: Array<string>
): number {
  return tokens.reduce(
    (
      weight,
      token
    ) => weight + weightOf__Token(token),
    0
  )
}

function weightOf__Token(
  token: string
): number {
  return REGEXP_SPACES.test(token) ? 0 : countOf__CodePoints(token)
}

const REGEXP_SPACES = /^\s+$/u

interface _Api___weightOf__Common_ {
  tokens_One: Array<string>
  tokens_Other: Array<string>
}

function weightOf__Common({
  tokens_One,
  tokens_Other
}: _Api___weightOf__Common_): number {
  let row = new Array<number>(tokens_Other.length + 1).fill(0)
  for (const token_One of tokens_One) {
    const row_Next = [
      0
    ]
    for (const [
      index,
      token_Other
    ] of tokens_Other.entries()) row_Next.push(token_One === token_Other
      ? (row[index] ?? 0) + weightOf__Token(token_One)
      : Math.max(
        row[index + 1] ?? 0,
        row_Next[index] ?? 0
      ))
    row = row_Next
  }
  return row.at(-1) ?? 0
}

interface _Api___lengthsOf__Op_ {
  op_Lines: _Op_Lines_
  lines_Before: Array<string>
  lines_After: Array<string>
}

function lengthsOf__Op({
  op_Lines,
  lines_Before,
  lines_After
}: _Api___lengthsOf__Op_): Array<_Length_Run_> {
  const length_Break_Before = op_Lines.line_Before !== null && op_Lines.line_Before > 0 ? 1 : 0
  const length_Break_After = op_Lines.line_After !== null && op_Lines.line_After > 0 ? 1 : 0
  return [
    {
      kind: length_Break_Before === 1 && length_Break_After === 1
        ? "KEPT"
        : "CHANGED",
      length_Before: length_Break_Before,
      length_After: length_Break_After
    },
    ...LENGTHSMAP__KIND_OP[op_Lines.kind]({
      text_Before: op_Lines.line_Before === null ? "" : lines_Before[op_Lines.line_Before] ?? "",
      text_After: op_Lines.line_After === null ? "" : lines_After[op_Lines.line_After] ?? ""
    })
  ]
}

type _LengthsMap__Kind_Op_ = {
  [Kind in _Kind_Op_]: (api_Lengths: _Api___runsOf__Words_) => Array<_Length_Run_>
}

const LENGTHSMAP__KIND_OP: _LengthsMap__Kind_Op_ = {
  KEEP: ({
    text_Before
  }) => [
    {
      kind: "KEPT",
      length_Before: countOf__CodePoints(text_Before),
      length_After: countOf__CodePoints(text_Before)
    }
  ],
  PAIR: ({
    text_Before,
    text_After
  }) => runsOf__Words({
    text_Before,
    text_After
  }).map((run_Flat) => ({
    kind: run_Flat.kind,
    length_Before: run_Flat.to_Before - run_Flat.from_Before,
    length_After: run_Flat.to_After - run_Flat.from_After
  })),
  DELETE: ({
    text_Before
  }) => [
    {
      kind: "CHANGED",
      length_Before: countOf__CodePoints(text_Before),
      length_After: 0
    }
  ],
  INSERT: ({
    text_After
  }) => [
    {
      kind: "CHANGED",
      length_Before: 0,
      length_After: countOf__CodePoints(text_After)
    }
  ]
}

interface _Api___runsOf__Words_ {
  text_Before: string
  text_After: string
}

function runsOf__Words({
  text_Before,
  text_After
}: _Api___runsOf__Words_): Array<_Run_Flat_> {
  const tokens_Before = text_Before.match(REGEXP_TOKEN) ?? []
  const tokens_After = text_After.match(REGEXP_TOKEN) ?? []
  const starts_Before = startsOf__Tokens(tokens_Before)
  const starts_After = startsOf__Tokens(tokens_After)
  return runsOf__Tokens({
    tokens_Before,
    tokens_After
  }).map((run_Tokens) => ({
    kind: run_Tokens.kind,
    from_Before: starts_Before[run_Tokens.from_Before] ?? 0,
    to_Before: starts_Before[run_Tokens.to_Before] ?? 0,
    from_After: starts_After[run_Tokens.from_After] ?? 0,
    to_After: starts_After[run_Tokens.to_After] ?? 0
  }))
}

function startsOf__Tokens(
  tokens: Array<string>
): Array<number> {
  return tokens.reduce(
    (
      starts,
      token
    ) => [
      ...starts,
      (starts.at(-1) ?? 0) + countOf__CodePoints(token)
    ],
    [
      0
    ]
  )
}

interface _Api___runsOf__Tokens_ {
  tokens_Before: Array<string>
  tokens_After: Array<string>
}

function runsOf__Tokens({
  tokens_Before,
  tokens_After
}: _Api___runsOf__Tokens_): Array<_Run_Flat_> {
  const runs: Array<_Run_Flat_> = []
  let index_Before = 0
  let index_After = 0
  for (const difference of differencesOf__CodePoints(symbolsOf__Texts({
    texts_Before: tokens_Before,
    texts_After: tokens_After
  }))) {
    const from_After = index_After + difference.from - index_Before
    const to_After = from_After + difference.inserted.length
    if (difference.from > index_Before) runs.push({
      kind: "KEPT",
      from_Before: index_Before,
      to_Before: difference.from,
      from_After: index_After,
      to_After: from_After
    })
    runs.push({
      kind: "CHANGED",
      from_Before: difference.from,
      to_Before: difference.to,
      from_After,
      to_After
    })
    index_Before = difference.to
    index_After = to_After
  }
  return index_Before < tokens_Before.length
    ? [
      ...runs,
      {
        kind: "KEPT",
        from_Before: index_Before,
        to_Before: tokens_Before.length,
        from_After: index_After,
        to_After: tokens_After.length
      }
    ]
    : runs
}

interface _Api___differencesOf__CodePoints_ {
  codePoints_Before: Array<string>
  codePoints_After: Array<string>
}

interface _Difference_CodePoints_ {
  from: number
  to: number
  inserted: Array<string>
}

function differencesOf__CodePoints({
  codePoints_Before,
  codePoints_After
}: _Api___differencesOf__CodePoints_): Array<_Difference_CodePoints_> {
  let prefix = 0
  while (prefix < codePoints_Before.length && prefix < codePoints_After.length && codePoints_Before[prefix] === codePoints_After[prefix]) prefix = prefix + 1
  let suffix = 0
  while (suffix < codePoints_Before.length - prefix && suffix < codePoints_After.length - prefix && codePoints_Before[codePoints_Before.length - 1 - suffix] === codePoints_After[codePoints_After.length - 1 - suffix]) suffix = suffix + 1
  const old = codePoints_Before.slice(
    prefix,
    codePoints_Before.length - suffix
  )
  const next = codePoints_After.slice(
    prefix,
    codePoints_After.length - suffix
  )
  if (old.length === 0 && next.length === 0) return []
  if (old.length + next.length > LIMIT__DIFFERENCES) return [
    {
      from: prefix,
      to: prefix + old.length,
      inserted: next
    }
  ]
  const differences: Array<_Difference_CodePoints_> = []
  let index_Old = prefix
  let index_Next = 0
  let isKeeping = true
  for (const edit of editsOf__CodePoints({
    old,
    next
  })) {
    if (edit === "KEEP") {
      index_Old = index_Old + 1
      index_Next = index_Next + 1
      isKeeping = true
      continue
    }
    const difference = isKeeping
      ? {
        from: index_Old,
        to: index_Old,
        inserted: []
      }
      : differences.pop() ?? {
        from: index_Old,
        to: index_Old,
        inserted: []
      }
    isKeeping = false
    if (edit === "DELETE") {
      differences.push({
        from: difference.from,
        to: difference.to + 1,
        inserted: difference.inserted
      })
      index_Old = index_Old + 1
    } else {
      differences.push({
        from: difference.from,
        to: difference.to,
        inserted: [
          ...difference.inserted,
          next[index_Next] ?? ""
        ]
      })
      index_Next = index_Next + 1
    }
  }
  return differences
}

const LIMIT__DIFFERENCES = 2000

interface _Api___editsOf__CodePoints_ {
  old: Array<string>
  next: Array<string>
}

type _Edit_CodePoints_ = "KEEP" | "DELETE" | "INSERT"

function editsOf__CodePoints({
  old,
  next
}: _Api___editsOf__CodePoints_): Array<_Edit_CodePoints_> {
  const max = old.length + next.length
  const trace = traceOf__Edits({
    old,
    next
  })
  const edits: Array<_Edit_CodePoints_> = []
  let x = old.length
  let y = next.length
  for (let step = trace.length - 1; step > 0; step = step - 1) {
    const furthest = trace[step] ?? []
    const diagonal = x - y
    const isDown = diagonal === -step || (diagonal !== step && (furthest[max + diagonal - 1] ?? 0) < (furthest[max + diagonal + 1] ?? 0))
    const diagonal_Previous = isDown ? diagonal + 1 : diagonal - 1
    const x_Previous = furthest[max + diagonal_Previous] ?? 0
    const y_Previous = x_Previous - diagonal_Previous
    while (x > x_Previous && y > y_Previous) {
      edits.push("KEEP")
      x = x - 1
      y = y - 1
    }
    edits.push(isDown ? "INSERT" : "DELETE")
    if (isDown) y = y - 1
    else x = x - 1
  }
  while (x > 0 && y > 0) {
    edits.push("KEEP")
    x = x - 1
    y = y - 1
  }
  return edits.toReversed()
}

interface _Api___traceOf__Edits_ {
  old: Array<string>
  next: Array<string>
}

function traceOf__Edits({
  old,
  next
}: _Api___traceOf__Edits_): Array<Array<number>> {
  const max = old.length + next.length
  const furthest = new Array<number>(2 * max + 2).fill(0)
  const trace: Array<Array<number>> = []
  for (let step = 0; step <= max; step = step + 1) {
    trace.push([
      ...furthest
    ])
    for (let diagonal = -step; diagonal <= step; diagonal = diagonal + 2) {
      const isDown = diagonal === -step || (diagonal !== step && (furthest[max + diagonal - 1] ?? 0) < (furthest[max + diagonal + 1] ?? 0))
      let x = isDown ? furthest[max + diagonal + 1] ?? 0 : (furthest[max + diagonal - 1] ?? 0) + 1
      let y = x - diagonal
      while (x < old.length && y < next.length && old[x] === next[y]) {
        x = x + 1
        y = y + 1
      }
      furthest[max + diagonal] = x
      if (x >= old.length && y >= next.length) return trace
    }
  }
  return trace
}

interface _Api___comparisonOf__Texts_ {
  text_Before: _Text_Model_
  text_After: _Text_Model_
}

interface _Run_Comparison_ {
  kind: _Kind_Run_
  range_Before: _Range_Text_
  range_After: _Range_Text_
}

function comparisonOf__Texts({
  text_Before,
  text_After
}: _Api___comparisonOf__Texts_): Array<_Run_Comparison_> {
  return runsBetween__Flat({
    text_Before: flatOf__Text(text_Before),
    text_After: flatOf__Text(text_After)
  }).map((run_Flat) => ({
    kind: run_Flat.kind,
    range_Before: {
      from: positionOf__Index({
        text_Model: text_Before,
        index: run_Flat.from_Before
      }),
      to: positionOf__Index({
        text_Model: text_Before,
        index: run_Flat.to_Before
      })
    },
    range_After: {
      from: positionOf__Index({
        text_Model: text_After,
        index: run_Flat.from_After
      }),
      to: positionOf__Index({
        text_Model: text_After,
        index: run_Flat.to_After
      })
    }
  }))
}

function keysOf__Text(
  text_Model: _Text_Model_
): Array<string> {
  const keys: Array<Array<string>> = Array.from(
    flatOf__Text(text_Model),
    () => []
  )
  for (const mark of text_Model.marks) {
    const from = indexOf__Position({
      text_Model,
      position: mark.range.from
    })
    const to = indexOf__Position({
      text_Model,
      position: mark.range.to
    })
    for (let index = from; index < to; index = index + 1) keys[index]?.push(keyOf__Data(mark.data))
  }
  return keys.map((keys_Each) => keys_Each.toSorted().join(" "))
}
