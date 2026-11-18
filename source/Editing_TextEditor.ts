import {
  type _Model_TextEditor_,
  type _Id_Text_,
  type _Range_Text_,
  type _Position_Text_,
  type _Transaction_Model_,
  type _Step_Transaction_,
  type _Text_Model_,
  type _NonEmpty_,
  type _Change_,
  applied__Transaction,
  parseTexts_Line,
  textIn__Range,
  shiftedBy__Position
} from "./Model_TextEditor.ts"
import {
  type _Proposal_Host_,
  ISAPPLIEDMAP__STATE_PROPOSAL
} from "./Projection_TextEditor.ts"
import {
  type _Selection_TextEditor_,
  type _Place_Text_,
  type _State_Proposal_,
  isSame__Selection,
  isSame__Id_Text,
  type _Module_Words_
} from "./ViewModel_TextEditor.ts"

export {
  editedOf__Request,
  type _Api___editedOf__Request_,
  type _Request_Edit_,
  type __BASE_Request_Edit_,
  type _TEXT_Request_Edit_,
  type _Places_Caret_,
  type _ACROSS_Request_Edit_,
  type _Piece_Text_,
  type _UNDO_Request_Edit_,
  type _REDO_Request_Edit_,
  type _History_TextEditor_,
  type _Entry_History_,
  type _Edited_Model_,
  HISTORY_EMPTY
}

interface _Api___editedOf__Request_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  module_Words: _Module_Words_
  history: _History_TextEditor_
  request_Edit: _Request_Edit_
}

function editedOf__Request({
  model_TextEditor,
  proposals,
  source_Yours,
  module_Words,
  history,
  request_Edit
}: _Api___editedOf__Request_): _Edited_Model_ | null {
  return (EDITMAP__KIND_REQUEST[request_Edit.kind] as (api_Edit: _Api___editedOf__Request_) => _Edited_Model_ | null)({
    model_TextEditor,
    proposals,
    source_Yours,
    module_Words,
    history,
    request_Edit
  })
}

interface _History_TextEditor_ {
  undos: Array<_Entry_History_>
  redos: Array<_Entry_History_>
}

interface _Entry_History_ {
  transaction_Undo: _Transaction_Model_
  transaction_Redo: _Transaction_Model_
  selection_Before: _Selection_TextEditor_
  selection_After: _Selection_TextEditor_
  isTyping: boolean
}

type _Request_Edit_ = _TEXT_Request_Edit_ | _ACROSS_Request_Edit_ | _UNDO_Request_Edit_ | _REDO_Request_Edit_

interface _TEXT_Request_Edit_ extends __BASE_Request_Edit_<"TEXT"> {
  id_Text: _Id_Text_
  range: _Range_Text_
  multilineText: string
  id_Run: string
  selection_Before: _Selection_TextEditor_
  isTyping: boolean
  isProposed: boolean
  places_Caret: _Places_Caret_ | null
}

interface __BASE_Request_Edit_<Kind extends string> {
  kind: Kind
}

interface _Places_Caret_ {
  place_Before: _Place_Text_ | null
  place_After: _Place_Text_ | null
}

interface _ACROSS_Request_Edit_ extends __BASE_Request_Edit_<"ACROSS"> {
  pieces: _NonEmpty_<_Piece_Text_>
  multilineText: string
  id_Run: string
  selection_Before: _Selection_TextEditor_
  isTyping: boolean
}

interface _Piece_Text_ {
  id_Text: _Id_Text_
  range: _Range_Text_
}

interface _UNDO_Request_Edit_ extends __BASE_Request_Edit_<"UNDO"> {}

interface _REDO_Request_Edit_ extends __BASE_Request_Edit_<"REDO"> {}

interface _Edited_Model_ {
  model_TextEditor: _Model_TextEditor_
  history: _History_TextEditor_
  selection: _Selection_TextEditor_
}

const EDITMAP__KIND_REQUEST: _EditMap__Kind_Request_ = {
  TEXT: TEXT_editedOf__Request,
  ACROSS: ACROSS_editedOf__Request,
  UNDO: UNDO_editedOf__Request,
  REDO: REDO_editedOf__Request
}

type _EditMap__Kind_Request_ = {
  [Kind in _Request_Edit_["kind"]]: (api_Edit: _Api___edited__Kind_<Kind>) => _Edited_Model_ | null
}

interface _Api___edited__Kind_<Kind extends _Request_Edit_["kind"]> {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  module_Words: _Module_Words_
  history: _History_TextEditor_
  request_Edit: Extract<
    _Request_Edit_,
    __BASE_Request_Edit_<Kind>
  >
}

function TEXT_editedOf__Request({
  model_TextEditor,
  proposals,
  source_Yours,
  module_Words,
  history,
  request_Edit
}: _Api___edited__Kind_<"TEXT">): _Edited_Model_ | null {
  const place_Typed = placeOf__Typing({
    model_TextEditor,
    source_Yours,
    module_Words,
    request_Edit
  })
  const edit_Text = request_Edit.isProposed && place_Typed.id_Text.kind === "DOCUMENT"
    ? yoursOf__Edit({
      model_TextEditor,
      proposals,
      source_Yours,
      place_From: {
        id_Text: place_Typed.id_Text,
        position: place_Typed.range.from
      },
      place_To: {
        id_Text: place_Typed.id_Text,
        position: place_Typed.range.to
      },
      side: place_Typed.side
    })
    : {
      id_Text: place_Typed.id_Text,
      range: place_Typed.range,
      step_Before: null
    }
  const steps = edit_Text === null
    ? null
    : stepsOf__Edit({
      model_TextEditor,
      proposals,
      edit_Text,
      multilineText: request_Edit.multilineText
    })
  return edit_Text === null || steps === null
    ? null
    : editedOf__Steps({
      model_TextEditor,
      source_Yours,
      module_Words,
      history,
      steps,
      id_Text: edit_Text.id_Text,
      position: endAfter__Text({
        position: edit_Text.range.from,
        multilineText: request_Edit.multilineText
      }),
      id_Run: request_Edit.id_Run,
      selection_Before: request_Edit.selection_Before,
      isTyping: request_Edit.isTyping
    })
}

interface _Api___placeOf__Typing_ {
  model_TextEditor: _Model_TextEditor_
  source_Yours: string
  module_Words: _Module_Words_
  request_Edit: _TEXT_Request_Edit_
}

function placeOf__Typing({
  model_TextEditor,
  source_Yours,
  module_Words,
  request_Edit
}: _Api___placeOf__Typing_): _Typed_Place_ {
  const place_Before = request_Edit.places_Caret?.place_Before ?? null
  const place_After = request_Edit.places_Caret?.place_After ?? null
  const isAt = (place_Text: _Place_Text_ | null) => place_Text !== null && isSame__Id_Text({
    id_Text: place_Text.id_Text,
    id_Text_Other: request_Edit.id_Text
  }) && orderOf__Positions({
    position: place_Text.position,
    position_Other: request_Edit.range.from
  }) === 0
  const place_Own: _Typed_Place_ = {
    id_Text: request_Edit.id_Text,
    range: request_Edit.range,
    side: isAt(place_Before) ? "BEFORE" : isAt(place_After) ? "AFTER" : null
  }
  if (request_Edit.multilineText === "" || orderOf__Positions({
    position: request_Edit.range.from,
    position_Other: request_Edit.range.to
  }) !== 0) return place_Own
  const lines_Typed = request_Edit.multilineText.split("\n")
  const isJoining_Before = place_Before !== null && extentOf__Join({
    module_Words,
    text_Before: lineOf__Place({
      model_TextEditor,
      place_Text: place_Before,
      isBefore: true
    }),
    text_After: lines_Typed[0] ?? ""
  }).before > 0
  const isJoining_After = place_After !== null && extentOf__Join({
    module_Words,
    text_Before: lines_Typed.at(-1) ?? "",
    text_After: lineOf__Place({
      model_TextEditor,
      place_Text: place_After,
      isBefore: false
    })
  }).after > 0
  const isOwn = (id_Text: _Id_Text_) => id_Text.kind === "DOCUMENT" || id_Text.source === source_Yours
  const typedAt = (
    place_Text: _Place_Text_,
    side: _Side_Place_
  ): _Typed_Place_ => ({
    id_Text: place_Text.id_Text,
    range: {
      from: place_Text.position,
      to: place_Text.position
    },
    side
  })
  if (place_Before !== null && isJoining_Before) return typedAt(
    place_Before,
    "BEFORE"
  )
  if (place_After !== null && isJoining_After) return typedAt(
    place_After,
    "AFTER"
  )
  if (isOwn(request_Edit.id_Text)) return place_Own
  if (place_Before !== null && isOwn(place_Before.id_Text)) return typedAt(
    place_Before,
    "BEFORE"
  )
  if (place_After !== null && isOwn(place_After.id_Text)) return typedAt(
    place_After,
    "AFTER"
  )
  return place_Own
}

interface _Typed_Place_ {
  id_Text: _Id_Text_
  range: _Range_Text_
  side: _Side_Place_ | null
}

type _Side_Place_ = "BEFORE" | "AFTER"

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

interface _Api___extentOf__Join_ {
  module_Words: _Module_Words_
  text_Before: string
  text_After: string
}

function extentOf__Join({
  module_Words,
  text_Before,
  text_After
}: _Api___extentOf__Join_): _Extent_Join_ {
  const at = text_Before.length
  const word_Text = module_Words.wordsOf(`${text_Before}${text_After}`).find((word_Each) => word_Each.from < at && at < word_Each.to)
  return word_Text === undefined
    ? {
      before: 0,
      after: 0
    }
    : {
      before: Array.from(text_Before.slice(word_Text.from)).length,
      after: Array.from(text_After.slice(
        0,
        word_Text.to - at
      )).length
    }
}

interface _Extent_Join_ {
  before: number
  after: number
}

interface _Api___lineOf__Place_ {
  model_TextEditor: _Model_TextEditor_
  place_Text: _Place_Text_
  isBefore: boolean
}

function lineOf__Place({
  model_TextEditor,
  place_Text,
  isBefore
}: _Api___lineOf__Place_): string {
  const id_Text = place_Text.id_Text
  const change = id_Text.kind === "CHANGE" ? model_TextEditor.proposed.find((changes_Source) => changes_Source.source === id_Text.source)?.changes[id_Text.index] : undefined
  const line = id_Text.kind === "DOCUMENT"
    ? model_TextEditor.document.lines[place_Text.position.line]
    : change?.kind === "REPLACE"
      ? change.next.lines[place_Text.position.line]
      : undefined
  const codePoints = Array.from(line ?? "")
  return (isBefore
    ? codePoints.slice(
      0,
      place_Text.position.offset
    )
    : codePoints.slice(place_Text.position.offset)).join("")
}

interface _Api___yoursOf__Edit_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  place_From: _Place_Text_
  place_To: _Place_Text_
  side: _Side_Place_ | null
}

function yoursOf__Edit({
  model_TextEditor,
  proposals,
  source_Yours,
  place_From,
  place_To,
  side
}: _Api___yoursOf__Edit_): _Edit_Text_ | null {
  const changes_Yours = model_TextEditor.proposed.find((changes_Source) => changes_Source.source === source_Yours)?.changes ?? []
  const spanOf = (place_Text: _Place_Text_) => {
    if (place_Text.id_Text.kind === "DOCUMENT") return place_Text.position
    const change = place_Text.id_Text.source === source_Yours ? changes_Yours[place_Text.id_Text.index] : undefined
    return change === undefined || change.kind !== "REPLACE" ? null : change.range
  }
  const span_From = spanOf(place_From)
  const span_To = spanOf(place_To)
  if (span_From === null || span_To === null) return null
  const range_Places = {
    from: "from" in span_From ? span_From.from : span_From,
    to: "to" in span_To ? span_To.to : span_To
  }
  if (orderOf__Positions({
    position: range_Places.from,
    position_Other: range_Places.to
  }) > 0) return null
  const range = widenedOver__Yours({
    model_TextEditor,
    proposals,
    source_Yours,
    range: range_Places
  })
  if (!isApart__Others({
    model_TextEditor,
    proposals,
    source_Yours,
    range
  })) return null
  const indexes_Touching = changes_Yours.flatMap((
    change,
    index
  ) => isTouching__Yours({
    model_TextEditor,
    proposals,
    source_Yours,
    range,
    change
  })
    ? [
      index
    ]
    : [])
  const changes_Touching = changes_Yours.filter((
    _change,
    index
  ) => indexes_Touching.includes(index))
  const changes_Apart = changes_Yours.filter((
    _change,
    index
  ) => !indexes_Touching.includes(index))
  const from = range.from
  const to = range.to
  const isEmpty = orderOf__Positions({
    position: from,
    position_Other: to
  }) === 0
  const isAt = (
    position: _Position_Text_,
    position_Other: _Position_Text_
  ) => orderOf__Positions({
    position,
    position_Other
  }) === 0
  const changes_Other = model_TextEditor.proposed.flatMap((changes_Source) => changes_Source.source === source_Yours ? [] : changes_Source.changes)
  const isSame_Other = changes_Other.some((change) => isAt(
    change.range.from,
    from
  ) && isAt(
    change.range.to,
    to
  ))
  const isEdge_Before = isEmpty && side === "BEFORE" && (isSame_Other || changes_Other.some((change) => change.kind === "MOVE" && isAt(
    change.range.to,
    from
  )))
  const isEdge_After = !isEdge_Before && (isSame_Other || isEmpty && side !== "BEFORE" && changes_Other.some((change) => change.kind === "MOVE" && isAt(
    change.range.from,
    from
  )))
  const ranges_Document = [
    isEdge_Before
      ? beforeOf__Position({
        model_TextEditor,
        position: from
      })
      : from,
    ...changes_Touching.flatMap((change) => [
      change.range.from,
      change.range.to
    ]),
    isEdge_After
      ? afterOf__Position({
        model_TextEditor,
        position: to
      })
      : to
  ].flatMap((
    position,
    index,
    positions
  ) => index % 2 === 0
    ? [
      {
        from: position,
        to: positions[index + 1] ?? position
      }
    ]
    : [])
  const texts = ranges_Document.flatMap((
    range_Document,
    index
  ) => {
    const change = changes_Touching[index]
    const text_Document = textIn__Range({
      text_Model: model_TextEditor.document,
      range: range_Document
    })
    return change === undefined || change.kind !== "REPLACE"
      ? [
        text_Document
      ]
      : [
        text_Document,
        change.next
      ]
  })
  const originOf = (count: number) => count === 0
    ? {
      line: 0,
      offset: 0
    }
    : endOf__Text(joinedOf__Texts(texts.slice(
      0,
      count
    )))
  const isInside = (
    index: number,
    position: _Position_Text_
  ) => {
    const range_Document = ranges_Document[index]
    return range_Document !== undefined && orderOf__Positions({
      position: range_Document.from,
      position_Other: position
    }) <= 0 && orderOf__Positions({
      position,
      position_Other: range_Document.to
    }) <= 0
  }
  const placedOf = (
    place_Text: _Place_Text_,
    index_Least: number
  ) => {
    if (place_Text.id_Text.kind === "CHANGE") {
      const index_Change = indexes_Touching.indexOf(place_Text.id_Text.index)
      return {
        index: index_Change + 1,
        position: shiftedBy__Position({
          position: place_Text.position,
          origin: originOf(index_Change * 2 + 1)
        })
      }
    }
    const position = place_Text.position
    const index = index_Least === -1 && side !== "BEFORE"
      ? ranges_Document.findLastIndex((
        _range,
        index_Each
      ) => isInside(
        index_Each,
        position
      ))
      : ranges_Document.findIndex((
        _range,
        index_Each
      ) => index_Each >= Math.max(
        index_Least,
        0
      ) && isInside(
        index_Each,
        position
      ))
    return {
      index,
      position: shiftedBy__Position({
        position: relativeOf__Position({
          position,
          origin: ranges_Document[index]?.from ?? from
        }),
        origin: originOf(index * 2)
      })
    }
  }
  const placed_From = placedOf(
    place_From,
    -1
  )
  const placed_To = place_From.id_Text.kind === "DOCUMENT" && place_To.id_Text.kind === "DOCUMENT" && orderOf__Positions({
    position: place_From.position,
    position_Other: place_To.position
  }) === 0
    ? placed_From
    : placedOf(
      place_To,
      place_From.id_Text.kind === "CHANGE"
        ? placed_From.index
        : Math.max(
          placed_From.index,
          0
        )
    )
  if (placed_From.index === -1 || placed_To.index === -1) return null
  const from_Span = ranges_Document[0]?.from ?? from
  const index = changes_Apart.filter((change) => orderOf__Positions({
    position: change.range.from,
    position_Other: from_Span
  }) < 0).length
  return {
    id_Text: {
      kind: "CHANGE",
      source: source_Yours,
      index
    },
    range: {
      from: placed_From.position,
      to: placed_To.position
    },
    step_Before: {
      kind: "SOURCE",
      source: source_Yours,
      changes: [
        ...changes_Apart.slice(
          0,
          index
        ),
        {
          kind: "REPLACE",
          range: {
            from: from_Span,
            to: ranges_Document.at(-1)?.to ?? to
          },
          next: joinedOf__Texts(texts)
        },
        ...changes_Apart.slice(index)
      ]
    }
  }
}

interface _Edit_Text_ {
  id_Text: _Id_Text_
  range: _Range_Text_
  step_Before: _Step_Transaction_ | null
}

interface _Api___widenedOver__Yours_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  range: _Range_Text_
}

function widenedOver__Yours({
  model_TextEditor,
  proposals,
  source_Yours,
  range
}: _Api___widenedOver__Yours_): _Range_Text_ {
  const changes_Joining = model_TextEditor.proposed.flatMap((changes_Source) => changes_Source.changes.filter((change) => changes_Source.source === source_Yours
    ? isTouching__Yours({
      model_TextEditor,
      proposals,
      source_Yours,
      range,
      change
    })
    : change.kind === "REPLACE" && !isApplied__Source({
      proposals,
      source: changes_Source.source
    }) && relationOf__Spans({
      range,
      range_Other: change.range
    }) === "CROSSING"))
  const range_Widened = changes_Joining.reduce(
    (
      range_Each,
      change
    ) => ({
      from: orderOf__Positions({
        position: change.range.from,
        position_Other: range_Each.from
      }) < 0 ? change.range.from : range_Each.from,
      to: orderOf__Positions({
        position: change.range.to,
        position_Other: range_Each.to
      }) > 0 ? change.range.to : range_Each.to
    }),
    range
  )
  return orderOf__Positions({
    position: range_Widened.from,
    position_Other: range.from
  }) === 0 && orderOf__Positions({
    position: range_Widened.to,
    position_Other: range.to
  }) === 0
    ? range
    : widenedOver__Yours({
      model_TextEditor,
      proposals,
      source_Yours,
      range: range_Widened
    })
}

interface _Api___isTouching__Yours_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  range: _Range_Text_
  change: _Change_
}

function isTouching__Yours({
  model_TextEditor,
  proposals,
  source_Yours,
  range,
  change
}: _Api___isTouching__Yours_): boolean {
  if (change.kind !== "REPLACE" || orderOf__Positions({
    position: range.from,
    position_Other: change.range.to
  }) > 0 || orderOf__Positions({
    position: change.range.from,
    position_Other: range.to
  }) > 0) return false
  const isAt = (
    position: _Position_Text_,
    position_Other: _Position_Text_
  ) => orderOf__Positions({
    position,
    position_Other
  }) === 0
  const position_Met = isAt(
    change.range.to,
    range.from
  )
    ? range.from
    : isAt(
      change.range.from,
      range.to
    )
      ? range.to
      : null
  return position_Met === null || !model_TextEditor.proposed.some((changes_Source) => changes_Source.source !== source_Yours && isApplied__Source({
    proposals,
    source: changes_Source.source
  }) && changes_Source.changes.some((change_Other) => change_Other.kind === "MOVE"
    ? [
      change_Other.at,
      change_Other.range.from,
      change_Other.range.to
    ].some((position) => isAt(
      position,
      position_Met
    ))
    : isAt(
      change_Other.range.from,
      position_Met
    ) && isAt(
      change_Other.range.to,
      position_Met
    )))
}

interface _Api___isApplied__Source_ {
  proposals: Array<_Proposal_Host_>
  source: string
}

function isApplied__Source({
  proposals,
  source
}: _Api___isApplied__Source_): boolean {
  const proposal_Host = proposals.find((proposal_Each) => proposal_Each.source === source)
  return proposal_Host === undefined || ISAPPLIEDMAP__STATE_PROPOSAL[proposal_Host.state]
}

interface _Api___relationOf__Spans_ {
  range: _Range_Text_
  range_Other: _Range_Text_
}

function relationOf__Spans({
  range,
  range_Other
}: _Api___relationOf__Spans_): _Relation_Spans_ {
  const isOverlapping = orderOf__Positions({
    position: range_Other.from,
    position_Other: range.to
  }) < 0 && orderOf__Positions({
    position: range.from,
    position_Other: range_Other.to
  }) < 0
  if (!isOverlapping) return "APART"
  if (orderOf__Positions({
    position: range.from,
    position_Other: range_Other.from
  }) <= 0 && orderOf__Positions({
    position: range_Other.to,
    position_Other: range.to
  }) <= 0) return "AROUND"
  if (orderOf__Positions({
    position: range_Other.from,
    position_Other: range.from
  }) <= 0 && orderOf__Positions({
    position: range.to,
    position_Other: range_Other.to
  }) <= 0) return "INSIDE"
  return "CROSSING"
}

type _Relation_Spans_ = "APART" | "AROUND" | "INSIDE" | "CROSSING"

interface _Api___isApart__Others_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  range: _Range_Text_
}

function isApart__Others({
  model_TextEditor,
  proposals,
  source_Yours,
  range
}: _Api___isApart__Others_): boolean {
  const isBetween = (position: _Position_Text_) => orderOf__Positions({
    position: range.from,
    position_Other: position
  }) < 0 && orderOf__Positions({
    position,
    position_Other: range.to
  }) < 0
  return model_TextEditor.proposed.every((changes_Source) => changes_Source.source === source_Yours || changes_Source.changes.every((change) => {
    if (change.kind === "REPLACE" && !isApplied__Source({
      proposals,
      source: changes_Source.source
    })) {
      return relationOf__Spans({
        range,
        range_Other: change.range
      }) !== "CROSSING"
    }
    const isAround = orderOf__Positions({
      position: change.range.from,
      position_Other: range.from
    }) <= 0 && orderOf__Positions({
      position: range.to,
      position_Other: change.range.to
    }) <= 0
    const isOverlapping = orderOf__Positions({
      position: change.range.from,
      position_Other: range.to
    }) < 0 && orderOf__Positions({
      position: range.from,
      position_Other: change.range.to
    }) < 0
    return (isAround || !isOverlapping) && !isBetween(change.range.from) && !isBetween(change.range.to) && (change.kind !== "MOVE" || !isBetween(change.at))
  }))
}

interface _Api___beforeOf__Position_ {
  model_TextEditor: _Model_TextEditor_
  position: _Position_Text_
}

function beforeOf__Position({
  model_TextEditor,
  position
}: _Api___beforeOf__Position_): _Position_Text_ {
  return position.offset > 0
    ? {
      line: position.line,
      offset: position.offset - 1
    }
    : position.line > 0
      ? {
        line: position.line - 1,
        offset: Array.from(model_TextEditor.document.lines[position.line - 1] ?? "").length
      }
      : position
}

interface _Api___afterOf__Position_ {
  model_TextEditor: _Model_TextEditor_
  position: _Position_Text_
}

function afterOf__Position({
  model_TextEditor,
  position
}: _Api___afterOf__Position_): _Position_Text_ {
  const length = Array.from(model_TextEditor.document.lines[position.line] ?? "").length
  return position.offset < length || position.line + 1 >= model_TextEditor.document.lines.length
    ? {
      line: position.line,
      offset: Math.min(
        position.offset + 1,
        length
      )
    }
    : {
      line: position.line + 1,
      offset: 0
    }
}

function endOf__Text(
  text_Model: _Text_Model_
): _Position_Text_ {
  return {
    line: text_Model.lines.length - 1,
    offset: Array.from(text_Model.lines.at(-1) ?? "").length
  }
}

function joinedOf__Texts(
  texts: Array<_Text_Model_>
): _Text_Model_ {
  return texts.reduce((
    text_Joined,
    text_Model
  ) => {
    const origin = endOf__Text(text_Joined)
    const [line_First, ...lines_Rest] = text_Model.lines
    const lines_Joined = text_Joined.lines.slice(
      0,
      -1
    )
    return {
      lines: [
        ...lines_Joined,
        parseTexts_Line(`${text_Joined.lines.at(-1) ?? ""}${line_First}`)[0],
        ...lines_Rest
      ] as _NonEmpty_<_Text_Model_["lines"][number]>,
      marks: [
        ...text_Joined.marks,
        ...text_Model.marks.map((mark) => ({
          range: {
            from: shiftedBy__Position({
              position: mark.range.from,
              origin
            }),
            to: shiftedBy__Position({
              position: mark.range.to,
              origin
            })
          },
          data: mark.data
        }))
      ]
    }
  })
}

interface _Api___relativeOf__Position_ {
  position: _Position_Text_
  origin: _Position_Text_
}

function relativeOf__Position({
  position,
  origin
}: _Api___relativeOf__Position_): _Position_Text_ {
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

interface _Api___stepsOf__Edit_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  edit_Text: _Edit_Text_
  multilineText: string
}

function stepsOf__Edit({
  model_TextEditor,
  proposals,
  edit_Text,
  multilineText
}: _Api___stepsOf__Edit_): _NonEmpty_<_Step_Transaction_> | null {
  if (isLocked__Edit({
    model_TextEditor,
    proposals,
    id_Text: edit_Text.id_Text,
    range: edit_Text.range
  })) return null
  const step_Text: _Step_Transaction_ = {
    kind: "TEXT",
    id_Text: edit_Text.id_Text,
    range: edit_Text.range,
    next: {
      lines: parseTexts_Line(multilineText),
      marks: []
    }
  }
  return edit_Text.step_Before === null
    ? [
      step_Text
    ]
    : [
      edit_Text.step_Before,
      step_Text
    ]
}

interface _Api___isLocked__Edit_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  id_Text: _Id_Text_
  range: _Range_Text_
}

function isLocked__Edit({
  model_TextEditor,
  proposals,
  id_Text,
  range
}: _Api___isLocked__Edit_): boolean {
  const stateOf = (source: string) => proposals.find((proposal_Host) => proposal_Host.source === source)?.state ?? null
  if (id_Text.kind === "CHANGE") {
    const state = stateOf(id_Text.source)
    return state === null || !ISEDITABLEMAP__STATE_PROPOSAL[state]
  }
  const isEmpty = orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) === 0
  return model_TextEditor.proposed.some((changes_Source) => {
    const state = stateOf(changes_Source.source)
    return state !== null && ISLOCKINGMAP__STATE_PROPOSAL[state] && changes_Source.changes.some((change) => isEmpty
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
      }) < 0)
  })
}

const ISEDITABLEMAP__STATE_PROPOSAL: _IsMap__State_Proposal_ = {
  OPEN: true,
  REQUESTED: true,
  REVISING: true,
  ACCEPTED: true,
  REJECTED: false,
  WITHDRAWN: false
}

type _IsMap__State_Proposal_ = {
  [State in _State_Proposal_]: boolean
}

const ISLOCKINGMAP__STATE_PROPOSAL: _IsMap__State_Proposal_ = {
  OPEN: true,
  REQUESTED: true,
  REVISING: true,
  ACCEPTED: true,
  REJECTED: false,
  WITHDRAWN: false
}

interface _Api___editedOf__Steps_ {
  model_TextEditor: _Model_TextEditor_
  source_Yours: string
  module_Words: _Module_Words_
  history: _History_TextEditor_
  steps: _NonEmpty_<_Step_Transaction_>
  id_Text: _Id_Text_
  position: _Position_Text_
  id_Run: string
  selection_Before: _Selection_TextEditor_
  isTyping: boolean
}

function editedOf__Steps({
  model_TextEditor,
  source_Yours,
  module_Words,
  history,
  steps,
  id_Text,
  position,
  id_Run,
  selection_Before,
  isTyping
}: _Api___editedOf__Steps_): _Edited_Model_ | null {
  const settled = settledOf__Edit({
    model_TextEditor,
    source_Yours,
    module_Words,
    steps,
    id_Text,
    position
  })
  if (settled === null) return null
  const { transaction_Redo, applied } = settled
  const end_Selection = {
    id_Run,
    id_Text: settled.id_Text,
    position: settled.position
  }
  const selection_After = {
    anchor: end_Selection,
    head: end_Selection
  }
  const entry_Last = history.undos.at(-1)
  const isJoined = isTyping && entry_Last !== undefined && entry_Last.isTyping && isSame__Selection({
    selection: entry_Last.selection_After,
    selection_Other: selection_Before
  })
  const entry_History: _Entry_History_ = isJoined && entry_Last !== undefined
    ? {
      transaction_Undo: joinedOf__Transactions({
        transaction: applied.transaction_Inverse,
        transaction_Then: entry_Last.transaction_Undo
      }),
      transaction_Redo: joinedOf__Transactions({
        transaction: entry_Last.transaction_Redo,
        transaction_Then: transaction_Redo
      }),
      selection_Before: entry_Last.selection_Before,
      selection_After,
      isTyping: true
    }
    : {
      transaction_Undo: applied.transaction_Inverse,
      transaction_Redo,
      selection_Before,
      selection_After,
      isTyping
    }
  return {
    model_TextEditor: applied.model_TextEditor,
    history: {
      undos: [
        ...(isJoined ? history.undos.slice(
          0,
          -1
        ) : history.undos),
        entry_History
      ],
      redos: []
    },
    selection: selection_After
  }
}

interface _Api___settledOf__Edit_ {
  model_TextEditor: _Model_TextEditor_
  source_Yours: string
  module_Words: _Module_Words_
  steps: _NonEmpty_<_Step_Transaction_>
  id_Text: _Id_Text_
  position: _Position_Text_
}

function settledOf__Edit({
  model_TextEditor,
  source_Yours,
  module_Words,
  steps,
  id_Text,
  position
}: _Api___settledOf__Edit_): _Settled_Edit_ | null {
  const applied = appliedOrNull__Transaction({
    model_TextEditor,
    transaction: {
      steps
    }
  })
  if (applied === null) return null
  const changes_Yours = applied.model_TextEditor.proposed.find((changes_Source) => changes_Source.source === source_Yours)?.changes ?? []
  const index_Caret = id_Text.kind === "CHANGE" && id_Text.source === source_Yours ? id_Text.index : -1
  const groups_Words = groupsOf__Words({
    model_TextEditor: applied.model_TextEditor,
    source_Yours,
    module_Words
  })
  const settledWith = (groups: Array<_Group_Changes_>) => {
    const isUnchanged = (group_Changes: _Group_Changes_) => !group_Changes.indexes.includes(index_Caret) && group_Changes.change.kind === "REPLACE" && group_Changes.change.next.lines.join("\n") === textIn__Range({
      text_Model: applied.model_TextEditor.document,
      range: group_Changes.change.range
    }).lines.join("\n")
    const groups_Kept = groups.filter((group_Changes) => !isUnchanged(group_Changes))
    const isSame = groups_Kept.length === changes_Yours.length && groups_Kept.every((
      group_Changes,
      index
    ) => group_Changes.change === changes_Yours[index])
    if (isSame) {
      return {
        transaction_Redo: {
          steps
        },
        applied,
        id_Text,
        position
      }
    }
    const steps_Settled: _NonEmpty_<_Step_Transaction_> = [
      ...steps,
      {
        kind: "SOURCE",
        source: source_Yours,
        changes: groups_Kept.map((group_Changes) => group_Changes.change)
      }
    ]
    const applied_Settled = appliedOrNull__Transaction({
      model_TextEditor,
      transaction: {
        steps: steps_Settled
      }
    })
    const index_Group = groups_Kept.findIndex((group_Changes) => group_Changes.indexes.includes(index_Caret))
    const origin = groups_Kept[index_Group]?.origins[groups_Kept[index_Group]?.indexes.indexOf(index_Caret) ?? -1]
    return applied_Settled === null
      ? null
      : {
        transaction_Redo: {
          steps: steps_Settled
        },
        applied: applied_Settled,
        id_Text: index_Caret === -1
          ? id_Text
          : {
            kind: "CHANGE" as const,
            source: source_Yours,
            index: index_Group
          },
        position: origin === undefined
          ? position
          : shiftedBy__Position({
            position,
            origin
          })
      }
  }
  return settledWith(groups_Words) ?? settledWith(changes_Yours.map((
    change,
    index
  ) => ({
    change,
    indexes: [
      index
    ],
    origins: [
      {
        line: 0,
        offset: 0
      }
    ]
  })))
}

interface _Settled_Edit_ {
  transaction_Redo: _Transaction_Model_
  applied: ReturnType<typeof applied__Transaction>
  id_Text: _Id_Text_
  position: _Position_Text_
}

interface _Api___appliedOrNull__Transaction_ {
  model_TextEditor: _Model_TextEditor_
  transaction: _Transaction_Model_
}

function appliedOrNull__Transaction({
  model_TextEditor,
  transaction
}: _Api___appliedOrNull__Transaction_): ReturnType<typeof applied__Transaction> | null {
  try {
    return applied__Transaction({
      model_TextEditor,
      transaction
    })
  } catch {
    return null
  }
}

interface _Api___groupsOf__Words_ {
  model_TextEditor: _Model_TextEditor_
  source_Yours: string
  module_Words: _Module_Words_
}

function groupsOf__Words({
  model_TextEditor,
  source_Yours,
  module_Words
}: _Api___groupsOf__Words_): Array<_Group_Changes_> {
  const document = model_TextEditor.document
  const changes_Yours: Array<_Change_> = model_TextEditor.proposed.find((changes_Source) => changes_Source.source === source_Yours)?.changes ?? []
  const positions_Other = model_TextEditor.proposed.flatMap((changes_Source) => changes_Source.changes.flatMap((change) => [
    change.range.from,
    change.range.to,
    ...(change.kind === "MOVE"
      ? [
        change.at
      ]
      : [])
  ].map((position) => ({
    position,
    change
  }))))
  const spans = changes_Yours.map((change) => {
    if (change.kind !== "REPLACE") return change.range
    const from = change.range.from
    const to = change.range.to
    const codePoints_From = Array.from(document.lines[from.line] ?? "")
    const codePoints_To = Array.from(document.lines[to.line] ?? "")
    const limit_From = Math.max(
      0,
      ...positions_Other.filter((each) => each.change !== change && each.position.line === from.line && each.position.offset <= from.offset).map((each) => each.position.offset)
    )
    const limit_To = Math.min(
      codePoints_To.length,
      ...positions_Other.filter((each) => each.change !== change && each.position.line === to.line && each.position.offset >= to.offset).map((each) => each.position.offset)
    )
    const text_Before = codePoints_From.slice(
      limit_From,
      from.offset
    ).join("")
    const text_After = codePoints_To.slice(
      to.offset,
      limit_To
    ).join("")
    const isOneLine_Next = change.next.lines.length === 1
    const isOneLine_Span = from.line === to.line
    const next_First = change.next.lines[0] ?? ""
    const next_Last = change.next.lines.at(-1) ?? ""
    const span_First = codePoints_From.slice(
      from.offset,
      isOneLine_Span ? to.offset : codePoints_From.length
    ).join("")
    const span_Last = codePoints_To.slice(
      isOneLine_Span ? from.offset : 0,
      to.offset
    ).join("")
    const extent_Before = Math.max(
      extentOf__Join({
        module_Words,
        text_Before,
        text_After: isOneLine_Next ? `${next_First}${text_After}` : next_First
      }).before,
      extentOf__Join({
        module_Words,
        text_Before,
        text_After: isOneLine_Span ? `${span_First}${text_After}` : span_First
      }).before
    )
    const extent_After = Math.max(
      extentOf__Join({
        module_Words,
        text_Before: isOneLine_Next ? `${text_Before}${next_Last}` : next_Last,
        text_After
      }).after,
      extentOf__Join({
        module_Words,
        text_Before: isOneLine_Span ? `${text_Before}${span_Last}` : span_Last,
        text_After
      }).after
    )
    return {
      from: {
        line: from.line,
        offset: from.offset - extent_Before
      },
      to: {
        line: to.line,
        offset: to.offset + extent_After
      }
    }
  })
  const isParted = (position: _Position_Text_) => positions_Other.some((each) => !changes_Yours.includes(each.change) && orderOf__Positions({
    position: each.position,
    position_Other: position
  }) === 0)
  const members = changes_Yours.reduce<Array<_Members_Group_>>(
    (
      groups,
      change,
      index
    ) => {
      const span = spans[index] ?? change.range
      const group_Last = groups.at(-1)
      const order = group_Last === undefined
        ? 1
        : orderOf__Positions({
          position: span.from,
          position_Other: group_Last.span.to
        })
      const isJoining = group_Last !== undefined && change.kind === "REPLACE" && (order < 0 || (order === 0 && !isParted(span.from)))
      return group_Last !== undefined && isJoining
        ? [
          ...groups.slice(
            0,
            -1
          ),
          {
            indexes: [
              ...group_Last.indexes,
              index
            ],
            span: {
              from: group_Last.span.from,
              to: orderOf__Positions({
                position: span.to,
                position_Other: group_Last.span.to
              }) > 0 ? span.to : group_Last.span.to
            }
          }
        ]
        : [
          ...groups,
          {
            indexes: [
              index
            ],
            span
          }
        ]
    },
    []
  )
  return members.map((members_Group) => {
    const changes = members_Group.indexes.flatMap((index) => {
      const change = changes_Yours[index]
      return change === undefined
        ? []
        : [
          change
        ]
    })
    const [change_First] = changes
    if (changes.length === 1 && change_First !== undefined && orderOf__Positions({
      position: members_Group.span.from,
      position_Other: change_First.range.from
    }) === 0 && orderOf__Positions({
      position: members_Group.span.to,
      position_Other: change_First.range.to
    }) === 0) {
      return {
        change: change_First,
        indexes: members_Group.indexes,
        origins: [
          {
            line: 0,
            offset: 0
          }
        ]
      }
    }
    const texts = [
      members_Group.span.from,
      ...changes.flatMap((change) => [
        change.range.from,
        change.range.to
      ]),
      members_Group.span.to
    ].flatMap((
      position,
      index,
      positions
    ) => {
      if (index % 2 !== 0) return []
      const change = changes[index / 2]
      const text_Document = textIn__Range({
        text_Model: document,
        range: {
          from: position,
          to: positions[index + 1] ?? position
        }
      })
      return change === undefined
        ? [
          text_Document
        ]
        : [
          text_Document,
          change.kind === "REPLACE"
            ? change.next
            : textIn__Range({
              text_Model: document,
              range: change.range
            })
        ]
    })
    return {
      change: {
        kind: "REPLACE",
        range: members_Group.span,
        next: joinedOf__Texts(texts)
      },
      indexes: members_Group.indexes,
      origins: changes.map((
        _change,
        index
      ) => endOf__Text(joinedOf__Texts(texts.slice(
        0,
        index * 2 + 1
      ))))
    }
  })
}

interface _Group_Changes_ {
  change: _Change_
  indexes: Array<number>
  origins: Array<_Position_Text_>
}

interface _Members_Group_ {
  indexes: Array<number>
  span: _Range_Text_
}

interface _Api___joinedOf__Transactions_ {
  transaction: _Transaction_Model_
  transaction_Then: _Transaction_Model_
}

function joinedOf__Transactions({
  transaction,
  transaction_Then
}: _Api___joinedOf__Transactions_): _Transaction_Model_ {
  return {
    steps: [
      transaction.steps[0],
      ...transaction.steps.slice(1),
      ...transaction_Then.steps
    ]
  }
}

interface _Api___endAfter__Text_ {
  position: _Position_Text_
  multilineText: string
}

function endAfter__Text({
  position,
  multilineText
}: _Api___endAfter__Text_): _Position_Text_ {
  const lines = parseTexts_Line(multilineText)
  const last = lines.at(-1) ?? ""
  return lines.length === 1
    ? {
      line: position.line,
      offset: position.offset + Array.from(last).length
    }
    : {
      line: position.line + lines.length - 1,
      offset: Array.from(last).length
    }
}

function ACROSS_editedOf__Request({
  model_TextEditor,
  proposals,
  source_Yours,
  module_Words,
  history,
  request_Edit
}: _Api___edited__Kind_<"ACROSS">): _Edited_Model_ | null {
  const done = regionsOf__Pieces({
    model_TextEditor,
    pieces: request_Edit.pieces,
    source_Yours
  }).reduceRight<_Done_Regions_ | null>(
    (
      done_Regions,
      region,
      index
    ) => {
      if (done_Regions === null) return null
      if (index > 0 && region.pieces.every((piece) => orderOf__Positions({
        position: piece.range.from,
        position_Other: piece.range.to
      }) === 0)) return done_Regions
      const multilineText = index === 0 ? request_Edit.multilineText : ""
      const piece_First = region.pieces[0]
      const piece_Last = region.pieces.at(-1) ?? piece_First
      const edit_Text = region.isYours
        ? yoursOf__Edit({
          model_TextEditor: done_Regions.model_TextEditor,
          proposals,
          source_Yours,
          place_From: {
            id_Text: piece_First.id_Text,
            position: piece_First.range.from
          },
          place_To: {
            id_Text: piece_Last.id_Text,
            position: piece_Last.range.to
          },
          side: null
        })
        : {
          id_Text: piece_First.id_Text,
          range: {
            from: piece_First.range.from,
            to: piece_Last.range.to
          },
          step_Before: null
        }
      const steps = edit_Text === null
        ? null
        : stepsOf__Edit({
          model_TextEditor: done_Regions.model_TextEditor,
          proposals,
          edit_Text,
          multilineText
        })
      const applied = steps === null
        ? null
        : appliedOrNull__Transaction({
          model_TextEditor: done_Regions.model_TextEditor,
          transaction: {
            steps
          }
        })
      if (edit_Text === null || steps === null || applied === null) return null
      return {
        model_TextEditor: applied.model_TextEditor,
        steps: [
          ...done_Regions.steps,
          ...steps
        ],
        place_End: index === 0
          ? {
            id_Text: edit_Text.id_Text,
            position: endAfter__Text({
              position: edit_Text.range.from,
              multilineText
            })
          }
          : done_Regions.place_End
      }
    },
    {
      model_TextEditor,
      steps: [],
      place_End: null
    }
  )
  const [step_First, ...steps_Rest] = done?.steps ?? []
  if (done === null || done.place_End === null || step_First === undefined) return null
  return editedOf__Steps({
    model_TextEditor,
    source_Yours,
    module_Words,
    history,
    steps: [
      step_First,
      ...steps_Rest
    ],
    id_Text: done.place_End.id_Text,
    position: done.place_End.position,
    id_Run: request_Edit.id_Run,
    selection_Before: request_Edit.selection_Before,
    isTyping: request_Edit.isTyping
  })
}

interface _Api___regionsOf__Pieces_ {
  model_TextEditor: _Model_TextEditor_
  pieces: _NonEmpty_<_Piece_Text_>
  source_Yours: string
}

function regionsOf__Pieces({
  model_TextEditor,
  pieces,
  source_Yours
}: _Api___regionsOf__Pieces_): Array<_Region_Edit_> {
  const changes_Yours = model_TextEditor.proposed.find((changes_Source) => changes_Source.source === source_Yours)?.changes ?? []
  const spanOf = (piece: _Piece_Text_) => piece.id_Text.kind === "DOCUMENT"
    ? piece.range
    : piece.id_Text.source === source_Yours
      ? changes_Yours[piece.id_Text.index]?.range ?? null
      : null
  return pieces.reduce<Array<_Region_Edit_>>(
    (
      regions,
      piece
    ) => {
      const isYours = piece.id_Text.kind === "DOCUMENT" || piece.id_Text.source === source_Yours
      const region_Last = regions.at(-1)
      const piece_Before = region_Last?.pieces.at(-1)
      const span_Before = piece_Before === undefined ? null : spanOf(piece_Before)
      const span = spanOf(piece)
      const isBroken = piece_Before !== undefined && (isSame__Id_Text({
        id_Text: piece_Before.id_Text,
        id_Text_Other: piece.id_Text
      }) && piece.id_Text.kind === "CHANGE" && piece.id_Text.source !== source_Yours
        ? orderOf__Positions({
          position: piece_Before.range.to,
          position_Other: piece.range.from
        }) !== 0
        : span_Before !== null && span !== null && orderOf__Positions({
          position: span_Before.to,
          position_Other: span.from
        }) !== 0)
      return region_Last !== undefined && !isBroken && region_Last.isYours === isYours && (isYours || isSame__Id_Text({
        id_Text: region_Last.pieces[0].id_Text,
        id_Text_Other: piece.id_Text
      }))
        ? [
          ...regions.slice(
            0,
            -1
          ),
          {
            isYours,
            pieces: [
              ...region_Last.pieces,
              piece
            ]
          }
        ]
        : [
          ...regions,
          {
            isYours,
            pieces: [
              piece
            ]
          }
        ]
    },
    []
  )
}

interface _Region_Edit_ {
  isYours: boolean
  pieces: _NonEmpty_<_Piece_Text_>
}

interface _Done_Regions_ {
  model_TextEditor: _Model_TextEditor_
  steps: Array<_Step_Transaction_>
  place_End: _Place_Text_ | null
}

function UNDO_editedOf__Request({
  model_TextEditor,
  history
}: _Api___edited__Kind_<"UNDO">): _Edited_Model_ | null {
  const entry_Last = history.undos.at(-1)
  if (entry_Last === undefined) return null
  const applied = applied__Transaction({
    model_TextEditor,
    transaction: entry_Last.transaction_Undo
  })
  return {
    model_TextEditor: applied.model_TextEditor,
    history: {
      undos: history.undos.slice(
        0,
        -1
      ),
      redos: [
        ...history.redos,
        {
          ...entry_Last,
          transaction_Redo: applied.transaction_Inverse
        }
      ]
    },
    selection: entry_Last.selection_Before
  }
}

function REDO_editedOf__Request({
  model_TextEditor,
  history
}: _Api___edited__Kind_<"REDO">): _Edited_Model_ | null {
  const entry_Last = history.redos.at(-1)
  if (entry_Last === undefined) return null
  const applied = applied__Transaction({
    model_TextEditor,
    transaction: entry_Last.transaction_Redo
  })
  return {
    model_TextEditor: applied.model_TextEditor,
    history: {
      undos: [
        ...history.undos,
        {
          ...entry_Last,
          transaction_Undo: applied.transaction_Inverse
        }
      ],
      redos: history.redos.slice(
        0,
        -1
      )
    },
    selection: entry_Last.selection_After
  }
}

const HISTORY_EMPTY: _History_TextEditor_ = {
  undos: [],
  redos: []
}
