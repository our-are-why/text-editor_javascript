import {
  type _Text_Line_NonTerminated_,
  type _Id_Text_,
  type _Range_Text_,
  type _Position_Text_,
  type _NonEmpty_,
  mapped__NonEmpty,
  parseTexts_Line
} from "./Model_TextEditor.ts"

export {
  type _ViewModel_TextEditor_,
  type _Block_ViewModel_,
  type __BASE_Block__ViewModel_,
  type _LINES_Block__ViewModel_,
  type _Run_Lines_,
  type _Line_Run_,
  type _Gutter_Line_,
  type _Marker_Gutter_,
  type _Pointed_Gutter_,
  type _Note_Line_,
  type _Target_Note_,
  type _Segment_Line_,
  type _Origin_Line_,
  type _Attributes_Element_,
  type _Stretch_Line_,
  type _Module_Language_,
  type _Api___syntaxOf__Line_,
  type _Syntax_Line_,
  type _Module_Words_,
  type _Word_Text_,
  type _Group_Underlay_,
  type _Underlay_Text_,
  type __BASE_Underlay_Text_,
  type _STRETCH_Underlay_Text_,
  type _POINT_Underlay_Text_,
  type _BOUNDARY_Underlay_Text_,
  type _UNDERLINE_Underlay_Text_,
  type _Position_Run_,
  type _FRAME_Block__ViewModel_,
  type _FOLDED_Block__ViewModel_,
  type _Range_Lines_,
  type _Part_Frame_,
  type __BASE_Part__Frame_,
  type _CURRENT_Part__Frame_,
  type _PROPOSED_Part__Frame_,
  type _HEAD_Part__Frame_,
  type _Accept_Head_,
  type _PROPOSALS_Part__Frame_,
  type _Item_Proposals_,
  type _State_Proposal_,
  type _Decision_Proposal_,
  type _Status_Request_,
  type _Stale_Item_,
  type _Places_Item_,
  type __BASE_Places_Item_,
  type _NONE_Places_Item_,
  type _COUNT_Places_Item_,
  type _Condition_Places_,
  type __BASE_Condition_Places_,
  type _WITHIN_Condition_Places_,
  type _CARRIED_Condition_Places_,
  type _MOVE_Places_Item_,
  type _Way_Move_,
  type _Neighbors_Item_,
  type _Action_Item_,
  viewModelOf__Blocks,
  segmentsOf__Stretches,
  stretchesOf__Segments,
  underlinedIn__Blocks,
  underlinedOf__Run,
  headOf__Quote,
  sizeOf__Quote,
  peekOf__Quote,
  type _Peek_Quote_,
  pointedAt__ViewModel,
  foldedAt__ViewModel,
  draftingAt__ViewModel,
  confirmingAt__ViewModel,
  editingAt__ViewModel,
  wordsAt__ViewModel,
  isLines__Part_Frame,
  type _Id_Request_,
  type _Header_ViewModel_,
  type _Document_Header_,
  type _State_Document_,
  type _Proposals_Card_,
  type _Figure_Card_,
  type _Revisions_Scope_,
  type _Work_Scope_,
  type _Revisions_Level_,
  type _Ask_Card_,
  type _Document_Card_,
  type _Task_Header_,
  type _State_Task_,
  type _Action_Task_,
  type _Section_Action_,
  type _Part_Header_,
  type _Pending_Confirm_,
  type _Request_Item_,
  type _Reference_Request_,
  type _Confirm_Item_,
  type _Id_Item_,
  selectedAt__ViewModel,
  type _Selection_TextEditor_,
  type _End_Selection_,
  isSame__Selection,
  isSame__End,
  type _Selection_Drawn_,
  type _Place_Text_,
  type _Position_Drawn_,
  askingAt__ViewModel,
  type _Menu_ViewModel_,
  type _Point_Screen_,
  type _Item_Menu_,
  type __BASE_Item_Menu_,
  type _Tier_Menu_,
  type _REQUEST_Item_Menu_,
  type _ACT_Item_Menu_,
  type _WORK_Item_Menu_,
  type _TASK_Item_Menu_,
  type _Scope_Menu_,
  type __BASE_Scope_Menu_,
  type _PROPOSAL_Scope_Menu_,
  type _DOCUMENT_Scope_Menu_,
  type _TASK_Scope_Menu_,
  type _Target_Request_,
  type __BASE_Target_Request_,
  type _DOCUMENT_Target_Request_,
  type _TASK_Target_Request_,
  type _Aim_Request_,
  type __BASE_Aim_Request_,
  type _DOCUMENT_Aim_Request_,
  type _TASK_Aim_Request_,
  type _PROPOSAL_Target_Request_,
  type _Selected_Text_,
  type _Side_Text_,
  sideOf__Run,
  type _Piece_Text_,
  type _Form_Request_,
  type _Head_Form_,
  type _Quote_Form_,
  type _Place_Form_,
  type __BASE_Place_Form_,
  type _POINT_Place_Form_,
  type _TASK_Place_Form_,
  type _DOCUMENT_Place_Form_,
  drawnOf__End,
  orderOf__Positions_Drawn,
  sectionOf__Run,
  type _Kind_Section_,
  positionIn__Run,
  placeIn__Line,
  textOf__Line,
  isSame__Id_Text,
  orderOf__Positions_Run,
  parseLines_ViewModel,
  MODULE_PLAINTEXT
}

interface _ViewModel_TextEditor_ {
  charCount_Max__Label_Gutter: number
  blocks: Array<_Block_ViewModel_>
  runs: Array<_Run_Lines_>
  selection: _Selection_Drawn_ | null
  menu: _Menu_ViewModel_ | null
  request: _Form_Request_ | null
  header: _Header_ViewModel_
}

interface _Header_ViewModel_ {
  task: _Task_Header_ | null
  parts: Array<_Part_Header_>
  document: _Document_Header_
}

interface _Document_Header_ {
  folder: string
  name: string
  state: _State_Document_
  label_State: string
  summary: string
  proposals: _Proposals_Card_
  revisions_Scope: _Revisions_Scope_
  revisions_Level: _Revisions_Level_
}

type _State_Document_ = "NONE" | "YOUR_TURN" | "WORKING" | "DONE"

interface _Proposals_Card_ {
  figure: _Figure_Card_ | null
  documents: Array<_Document_Card_>
  actions: Array<_Action_Task_>
}

interface _Figure_Card_ {
  value: string
  more: string
}

interface _Revisions_Scope_ {
  figure: _Figure_Card_ | null
  start_All: _Work_Scope_ | null
  stop_All: _Work_Scope_ | null
  actions: Array<_Action_Task_>
}

interface _Work_Scope_ {
  label: string
  title: string
}

interface _Revisions_Level_ {
  requests: Array<_Request_Item_>
  isStartable_Requests: boolean
  isStoppable_Requests: boolean
  ask: _Ask_Card_
}

interface _Ask_Card_ {
  label: string
  label_Form: string
}

interface _Document_Card_ {
  folder: string
  name: string
  value: string
  more: string
  isShown: boolean
  isDecided: boolean
  actions: Array<_Action_Task_>
}

interface _Task_Header_ {
  id: string
  name: string
  state: _State_Task_
  label_State: string
  summary: string
  reason: string
  proposals: _Proposals_Card_
  revisions_Scope: _Revisions_Scope_
  revisions_Level: _Revisions_Level_
}

type _State_Task_ = "DRAFT" | "WORKING" | "YOUR_TURN" | "DONE" | "CANCELED"

interface _Action_Task_ {
  command: string
  label: string
  section: _Section_Action_
}

type _Section_Action_ = "PROPOSALS" | "REVISIONS"

interface _Part_Header_ {
  text: string
  isBusy: boolean
}

type _Block_ViewModel_ = _LINES_Block__ViewModel_ | _FRAME_Block__ViewModel_ | _FOLDED_Block__ViewModel_

interface __BASE_Block__ViewModel_<Kind extends string> {
  kind: Kind
}

interface _LINES_Block__ViewModel_ extends __BASE_Block__ViewModel_<"LINES"> {
  run: _Run_Lines_
}

interface _Run_Lines_ {
  id: string
  lines: Array<_Line_Run_>
  groups: Array<_Group_Underlay_>
}

interface _Line_Run_ {
  gutter: _Gutter_Line_
  note: _Note_Line_ | null
  segments: Array<_Segment_Line_>
  origins: Array<_Origin_Line_>
}

interface _Gutter_Line_ {
  label: string
  marker: _Marker_Gutter_
  pointed: _Pointed_Gutter_
}

type _Marker_Gutter_ = "none" | "removed" | "changed" | "inserted" | "moved"

type _Pointed_Gutter_ = "none" | "proposal" | "place"

interface _Note_Line_ {
  label: string
  target: _Target_Note_
}

interface _Target_Note_ {
  source: string
  side: string
}

interface _Segment_Line_ {
  text: _Text_Line_NonTerminated_
  attributes: _Attributes_Element_
}

interface _Attributes_Element_ {
  [name: string]: string
}

interface _Stretch_Line_ {
  from: number
  to: number
  attributes: _Attributes_Element_
}

interface _Origin_Line_ {
  from: number
  to: number
  id_Text: _Id_Text_
  position: _Position_Text_
}

interface _Group_Underlay_ {
  attributes: _Attributes_Element_
  underlays: Array<_Underlay_Text_>
}

type _Underlay_Text_ = _STRETCH_Underlay_Text_ | _POINT_Underlay_Text_ | _BOUNDARY_Underlay_Text_ | _UNDERLINE_Underlay_Text_

interface __BASE_Underlay_Text_<Kind extends string> {
  kind: Kind
  attributes: _Attributes_Element_
}

interface _STRETCH_Underlay_Text_ extends __BASE_Underlay_Text_<"STRETCH"> {
  from: _Position_Run_
  to: _Position_Run_
}

interface _POINT_Underlay_Text_ extends __BASE_Underlay_Text_<"POINT"> {
  at: _Position_Run_
}

interface _BOUNDARY_Underlay_Text_ extends __BASE_Underlay_Text_<"BOUNDARY"> {
  line: number
}

interface _UNDERLINE_Underlay_Text_ extends __BASE_Underlay_Text_<"UNDERLINE"> {
  from: _Position_Run_
  to: _Position_Run_
}

interface _Position_Run_ {
  line: number
  offset: number
}

interface _FRAME_Block__ViewModel_ extends __BASE_Block__ViewModel_<"FRAME"> {
  range: _Range_Lines_
  parts: _NonEmpty_<_Part_Frame_>
}

interface _Range_Lines_ {
  first: number
  last: number
}

interface _FOLDED_Block__ViewModel_ extends __BASE_Block__ViewModel_<"FOLDED"> {
  range: _Range_Lines_
  run: _Run_Lines_
}

type _Part_Frame_ = _CURRENT_Part__Frame_ | _PROPOSED_Part__Frame_ | _HEAD_Part__Frame_ | _PROPOSALS_Part__Frame_

interface __BASE_Part__Frame_<Kind extends string> {
  kind: Kind
}

interface _CURRENT_Part__Frame_ extends __BASE_Part__Frame_<"CURRENT_LINES"> {
  run: _Run_Lines_
}

interface _PROPOSED_Part__Frame_ extends __BASE_Part__Frame_<"PROPOSAL_LINES"> {
  run: _Run_Lines_
}

interface _HEAD_Part__Frame_ extends __BASE_Part__Frame_<"PROPOSAL_HEAD"> {
  label_Range: string
  figure: _Figure_Card_ | null
  accept_All: _Accept_Head_ | null
  revisions_Scope: _Revisions_Scope_
}

interface _Accept_Head_ {
  label: string
  title: string
}

interface _PROPOSALS_Part__Frame_ extends __BASE_Part__Frame_<"PROPOSAL_LIST"> {
  items: _NonEmpty_<_Item_Proposals_>
}

interface _Item_Proposals_ {
  source: string
  title: string
  state: _State_Proposal_
  status: string
  places: _Places_Item_
  neighbors: _Neighbors_Item_
  rationale: string
  requests: Array<_Request_Item_>
  isRunning: boolean
  isStartable: boolean
  stale: _Stale_Item_ | null
  actions: Array<_Action_Item_>
  isDrafting: boolean
  confirming: _Confirm_Item_ | null
  attributes: _Attributes_Element_
}

interface _Request_Item_ {
  id: string
  notes: string
  reference: _Reference_Request_ | null
  progress: string | null
  detail_Progress: string | null
  isRunning: boolean
  isStartable: boolean
  isRemovable: boolean
  isEditing: boolean
  isStoppable: boolean
  isDismissable: boolean
}

interface _Reference_Request_ {
  side: _Side_Text_
  head: string
  size: string | null
  lines: string | null
  peek: _Peek_Quote_ | null
  pieces: Array<_Piece_Text_> | null
}

type _Status_Request_ = "QUEUED" | "RUNNING" | "ADDRESSED"

interface _Stale_Item_ {
  label: string
  isRerunnable: boolean
}

interface _Confirm_Item_ {
  command: string
  label_Question: string
  label_Action: string
}

type _State_Proposal_ = _Decision_Proposal_ | "REQUESTED" | "REVISING"

type _Decision_Proposal_ = "OPEN" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"

type _Places_Item_ = _NONE_Places_Item_ | _COUNT_Places_Item_ | _MOVE_Places_Item_

interface __BASE_Places_Item_<Kind extends string> {
  kind: Kind
}

interface _NONE_Places_Item_ extends __BASE_Places_Item_<"NONE"> {}

interface _COUNT_Places_Item_ extends __BASE_Places_Item_<"COUNT"> {
  count_Here: number
  count_All: number
  conditions: Array<_Condition_Places_>
}

type _Condition_Places_ = _WITHIN_Condition_Places_ | _CARRIED_Condition_Places_

interface __BASE_Condition_Places_<Kind extends string> {
  kind: Kind
  count: number
  source: string
  title: string
}

interface _WITHIN_Condition_Places_ extends __BASE_Condition_Places_<"WITHIN"> {}

interface _CARRIED_Condition_Places_ extends __BASE_Condition_Places_<"CARRIED"> {}

interface _MOVE_Places_Item_ extends __BASE_Places_Item_<"MOVE"> {
  range: _Range_Lines_
  way: _Way_Move_
}

type _Way_Move_ = "UP" | "DOWN"

interface _Neighbors_Item_ {
  range_Previous: _Range_Lines_ | null
  range_Next: _Range_Lines_ | null
}

interface _Action_Item_ {
  command: string
  label: string
  stateAfter: _State_Proposal_ | null
}

function viewModelOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): _ViewModel_TextEditor_ {
  const block$_Stated = neighboredOf__Blocks(statedOf__Blocks(blocks_ViewModel))
  const runs_ViewModel = runsOf__Blocks(block$_Stated)
  return {
    charCount_Max__Label_Gutter: Math.max(
      1,
      ...runs_ViewModel.flatMap((run_Lines) => run_Lines.lines).map((line_Run) => line_Run.gutter.label.length)
    ),
    blocks: block$_Stated,
    runs: runs_ViewModel,
    selection: null,
    menu: null,
    request: null,
    header: HEADER_EMPTY
  }
}

const HEADER_EMPTY: _Header_ViewModel_ = {
  task: null,
  parts: [],
  document: {
    folder: "",
    name: "",
    state: "NONE",
    label_State: "",
    summary: "",
    proposals: {
      figure: null,
      documents: [],
      actions: []
    },
    revisions_Scope: {
      figure: null,
      start_All: null,
      stop_All: null,
      actions: []
    },
    revisions_Level: {
      requests: [],
      isStartable_Requests: false,
      isStoppable_Requests: false,
      ask: {
        label: "Add a request",
        label_Form: "Request a change to this document"
      }
    }
  }
}

function neighboredOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): Array<_Block_ViewModel_> {
  const listed$_Source = Map.groupBy(
    blocks_ViewModel.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME"
      ? block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST"
        ? part_Frame.items.map((item_Proposals) => ({
          source: item_Proposals.source,
          range_Frame: block_ViewModel.range
        }))
        : [])
      : []),
    (listed) => listed.source
  )
  return blocks_ViewModel.map((block_ViewModel): _Block_ViewModel_ => block_ViewModel.kind !== "FRAME"
    ? block_ViewModel
    : {
      ...block_ViewModel,
      parts: mapped__NonEmpty({
        items: block_ViewModel.parts,
        map: (part_Frame): _Part_Frame_ => part_Frame.kind !== "PROPOSAL_LIST"
          ? part_Frame
          : {
            ...part_Frame,
            items: mapped__NonEmpty({
              items: part_Frame.items,
              map: (item_Proposals) => {
                const listed$ = listed$_Source.get(item_Proposals.source) ?? []
                const index = listed$.findIndex((listed) => listed.range_Frame.first === block_ViewModel.range.first && listed.range_Frame.last === block_ViewModel.range.last)
                return {
                  ...item_Proposals,
                  neighbors: {
                    range_Previous: listed$[index - 1]?.range_Frame ?? null,
                    range_Next: listed$[index + 1]?.range_Frame ?? null
                  }
                }
              }
            })
          }
      })
    })
}

function isLines__Part_Frame(
  part_Frame: _Part_Frame_
): part_Frame is _CURRENT_Part__Frame_ | _PROPOSED_Part__Frame_ {
  return part_Frame.kind === "CURRENT_LINES" || part_Frame.kind === "PROPOSAL_LINES"
}

function statedOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): Array<_Block_ViewModel_> {
  const state$_Source = new Map(blocks_ViewModel.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME"
    ? block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST"
      ? part_Frame.items.map((item_Proposals): [string, _State_Proposal_] => [
        item_Proposals.source,
        item_Proposals.state
      ])
      : [])
    : []))
  if (state$_Source.size === 0) return blocks_ViewModel
  return blocks_ViewModel.map((block_ViewModel) => block_ViewModel.kind !== "FRAME"
    ? {
      ...block_ViewModel,
      run: statedIn__Run({
        run_Lines: block_ViewModel.run,
        state$_Source
      })
    }
    : {
      ...block_ViewModel,
      parts: mapped__NonEmpty({
        items: block_ViewModel.parts,
        map: (part_Frame): _Part_Frame_ => !isLines__Part_Frame(part_Frame)
          ? part_Frame
          : {
            ...part_Frame,
            run: statedIn__Run({
              run_Lines: part_Frame.run,
              state$_Source
            })
          }
      })
    })
}

interface _Api___statedIn__Run_ {
  run_Lines: _Run_Lines_
  state$_Source: Map<string, _State_Proposal_>
}

function statedIn__Run({
  run_Lines,
  state$_Source
}: _Api___statedIn__Run_): _Run_Lines_ {
  const stated = (attributes: _Attributes_Element_): _Attributes_Element_ => {
    const state = state$_Source.get(attributes["data-source"] ?? "")
    return state === undefined
      ? attributes
      : {
        ...attributes,
        "data-state": state
      }
  }
  return {
    ...run_Lines,
    lines: run_Lines.lines.map((line_Run) => ({
      ...line_Run,
      segments: line_Run.segments.map((segment_Line) => ({
        ...segment_Line,
        attributes: stated(segment_Line.attributes)
      }))
    })),
    groups: run_Lines.groups.map((group_Underlay) => ({
      ...group_Underlay,
      attributes: stated(group_Underlay.attributes)
    }))
  }
}

function runsOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): Array<_Run_Lines_> {
  return blocks_ViewModel.flatMap((block_ViewModel) =>
    block_ViewModel.kind === "FRAME"
      ? block_ViewModel.parts.flatMap((part_Frame) => isLines__Part_Frame(part_Frame) ? [part_Frame.run] : [])
      : [block_ViewModel.run]
  )
}

interface _Api___litIn__Blocks_ {
  blocks_ViewModel: Array<_Block_ViewModel_>
  pieces: Array<_Piece_Text_>
  ids_Run: Array<string> | null
  attributes: _Attributes_Element_
}

function litIn__Blocks({
  blocks_ViewModel,
  pieces,
  ids_Run,
  attributes
}: _Api___litIn__Blocks_): Array<_Block_ViewModel_> {
  if (pieces.length === 0) return blocks_ViewModel
  return runsMappedIn__Blocks({
    blocks_ViewModel,
    map: (run_Lines) => ids_Run !== null && !ids_Run.includes(run_Lines.id)
      ? run_Lines
      : underlinedOf__Run({
        run_Lines: markedOf__Run({
          run_Lines,
          pieces,
          ids_Run,
          attributes
        }),
        pieces_References: [pieces],
        attributes
      })
  })
}

interface _Api___runsMappedIn__Blocks_ {
  blocks_ViewModel: Array<_Block_ViewModel_>
  map: (
    run_Lines: _Run_Lines_,
    side: _Side_Text_
  ) => _Run_Lines_
}

function runsMappedIn__Blocks({
  blocks_ViewModel,
  map
}: _Api___runsMappedIn__Blocks_): Array<_Block_ViewModel_> {
  return blocks_ViewModel.map((block_ViewModel): _Block_ViewModel_ => block_ViewModel.kind === "FRAME"
    ? {
      ...block_ViewModel,
      parts: mapped__NonEmpty({
        items: block_ViewModel.parts,
        map: (part_Frame): _Part_Frame_ => !isLines__Part_Frame(part_Frame)
          ? part_Frame
          : {
            ...part_Frame,
            run: map(
              part_Frame.run,
              SIDEMAP__KIND_RUN[part_Frame.kind]
            )
          }
      })
    }
    : {
      ...block_ViewModel,
      run: map(
        block_ViewModel.run,
        SIDEMAP__KIND_RUN[block_ViewModel.kind]
      )
    })
}

type _SideMap__Kind_Run_ = {
  [Kind in "LINES" | "FOLDED" | "CURRENT_LINES" | "PROPOSAL_LINES"]: _Side_Text_
}

const SIDEMAP__KIND_RUN: _SideMap__Kind_Run_ = {
  LINES: "CURRENT",
  FOLDED: "PROPOSED",
  CURRENT_LINES: "CURRENT",
  PROPOSAL_LINES: "PROPOSED"
}

interface _Api___markedOf__Run_ {
  run_Lines: _Run_Lines_
  pieces: Array<_Piece_Text_>
  ids_Run: Array<string> | null
  attributes: _Attributes_Element_
}

function markedOf__Run({
  run_Lines,
  pieces,
  ids_Run,
  attributes
}: _Api___markedOf__Run_): _Run_Lines_ {
  if (pieces.length === 0 || (ids_Run !== null && !ids_Run.includes(run_Lines.id))) return run_Lines
  return {
    ...run_Lines,
    lines: run_Lines.lines.map((line_Run) => {
      const text = line_Run.segments.map((segment_Line) => segment_Line.text).join("")
      const stretches_Marked = stretchesOf__Pieces({
        line_Run,
        text,
        pieces,
        attributes
      })
      return stretches_Marked.length === 0
        ? line_Run
        : {
          ...line_Run,
          segments: segmentsOf__Stretches({
            text: parseTexts_Line(text)[0],
            stretches: [
              ...stretchesOf__Segments(line_Run.segments),
              ...stretches_Marked
            ]
          })
        }
    })
  }
}

interface _Api___stretchesOf__Pieces_ {
  line_Run: _Line_Run_
  text: string
  pieces: Array<_Piece_Text_>
  attributes: _Attributes_Element_
}

function stretchesOf__Pieces({
  line_Run,
  text,
  pieces,
  attributes
}: _Api___stretchesOf__Pieces_): Array<_Stretch_Line_> {
  return line_Run.origins.flatMap((origin_Line) => pieces.flatMap((piece_Text): Array<_Stretch_Line_> => {
    const isSame = isSame__Id_Text({
      id_Text: piece_Text.id_Text,
      id_Text_Other: origin_Line.id_Text
    })
    const line = origin_Line.position.line
    if (!isSame || line < piece_Text.range.from.line || piece_Text.range.to.line < line) return []
    const codePoints_Origin = Array.from(text.slice(
      origin_Line.from,
      origin_Line.to
    ))
    const start = origin_Line.position.offset
    const from = Math.max(
      line === piece_Text.range.from.line ? piece_Text.range.from.offset : 0,
      start
    ) - start
    const to = Math.min(
      line === piece_Text.range.to.line ? piece_Text.range.to.offset : start + codePoints_Origin.length,
      start + codePoints_Origin.length
    ) - start
    return from < to
      ? [
        {
          from: origin_Line.from + codePoints_Origin.slice(
            0,
            from
          ).join("").length,
          to: origin_Line.from + codePoints_Origin.slice(
            0,
            to
          ).join("").length,
          attributes
        }
      ]
      : []
  }))
}

interface _Api___underlinedIn__Blocks_ {
  blocks_ViewModel: Array<_Block_ViewModel_>
  references: Array<_Selected_Text_>
  attributes: _Attributes_Element_
}

function underlinedIn__Blocks({
  blocks_ViewModel,
  references,
  attributes
}: _Api___underlinedIn__Blocks_): Array<_Block_ViewModel_> {
  if (references.length === 0) return blocks_ViewModel
  return runsMappedIn__Blocks({
    blocks_ViewModel,
    map: (
      run_Lines,
      side
    ) => underlinedOf__Run({
      run_Lines,
      pieces_References: references.filter((reference) => reference.side === side).map((reference) => reference.pieces),
      attributes
    })
  })
}

interface _Api___underlinedOf__Run_ {
  run_Lines: _Run_Lines_
  pieces_References: Array<Array<_Piece_Text_>>
  attributes: _Attributes_Element_
}

function underlinedOf__Run({
  run_Lines,
  pieces_References,
  attributes
}: _Api___underlinedOf__Run_): _Run_Lines_ {
  const underlays = run_Lines.lines.flatMap((
    line_Run,
    index_Line
  ) => {
    const text = line_Run.segments.map((segment_Line) => segment_Line.text).join("")
    return spansOf__Stretches({
      stretches_References: pieces_References.map((pieces) => stretchesOf__Pieces({
        line_Run,
        text,
        pieces,
        attributes
      }))
    }).map((span_Underline): _Underlay_Text_ => ({
      kind: "UNDERLINE",
      attributes: span_Underline.isMany
        ? {
          ...attributes,
          "data-many": ""
        }
        : attributes,
      from: {
        line: index_Line,
        offset: span_Underline.from
      },
      to: {
        line: index_Line,
        offset: span_Underline.to
      }
    }))
  })
  return underlays.length === 0
    ? run_Lines
    : {
      ...run_Lines,
      groups: [
        ...run_Lines.groups,
        {
          attributes,
          underlays
        }
      ]
    }
}

interface _Api___spansOf__Stretches_ {
  stretches_References: Array<Array<_Stretch_Line_>>
}

interface _Span_Underline_ {
  from: number
  to: number
  isMany: boolean
}

function spansOf__Stretches({
  stretches_References
}: _Api___spansOf__Stretches_): Array<_Span_Underline_> {
  const offsets = [...new Set(stretches_References.flat().flatMap((stretch_Line) => [
    stretch_Line.from,
    stretch_Line.to
  ]))].sort((offset, offset_Other) => offset - offset_Other)
  return offsets.slice(1).reduce(
    (
      spans: Array<_Span_Underline_>,
      to,
      index
    ) => {
      const from = offsets[index] ?? to
      const count = stretches_References.filter((stretches) => stretches.some((stretch_Line) => stretch_Line.from < to && from < stretch_Line.to)).length
      const span_Last = spans.at(-1)
      return count === 0
        ? spans
        : span_Last !== undefined && span_Last.to === from && span_Last.isMany === count > 1
          ? [
            ...spans.slice(0, -1),
            {
              ...span_Last,
              to
            }
          ]
          : [
            ...spans,
            {
              from,
              to,
              isMany: count > 1
            }
          ]
    },
    []
  )
}

function stretchesOf__Segments(
  segments: Array<_Segment_Line_>
): Array<_Stretch_Line_> {
  const stretches: Array<_Stretch_Line_> = []
  let from = 0
  for (const segment of segments) {
    stretches.push({
      from,
      to: from + segment.text.length,
      attributes: segment.attributes
    })
    from = from + segment.text.length
  }
  return stretches
}

interface _Api___segmentsOf__Stretches_ {
  text: _Text_Line_NonTerminated_
  stretches: Array<_Stretch_Line_>
}

function segmentsOf__Stretches({
  text,
  stretches
}: _Api___segmentsOf__Stretches_): Array<_Segment_Line_> {
  const stretches_Text = stretches
    .map((stretch) => ({
      ...stretch,
      from: Math.max(
        0,
        stretch.from
      ),
      to: Math.min(
        text.length,
        stretch.to
      )
    }))
    .filter((stretch) => stretch.from < stretch.to)
  const edges = [...new Set([
    0,
    ...stretches_Text.flatMap((stretch) => [
      stretch.from,
      stretch.to
    ]),
    text.length
  ])].toSorted((
    edge,
    edge_other
  ) => edge - edge_other)
  return edges.slice(1).map((
    to,
    index
  ) => {
    const from = edges[index] ?? to
    return {
      text: parseTexts_Line(text.slice(
        from,
        to
      ))[0],
      attributes: attributesOf__Stretches(stretches_Text.filter((stretch) => stretch.from <= from && stretch.to >= to))
    }
  }).filter((segment) => segment.text !== "")
}

function attributesOf__Stretches(
  stretches: Array<_Stretch_Line_>
): _Attributes_Element_ {
  const entries_Name = Map.groupBy(
    stretches.flatMap((stretch) => Object.entries(stretch.attributes)),
    (entry) => entry[0]
  )
  return Object.fromEntries([...entries_Name].map(([
    name,
    entries
  ]) => [
    name,
    [...new Set(entries.flatMap((entry) => entry[1].split(" ")).filter((word) => word !== ""))].join(" ")
  ]))
}

interface _Api___pointedAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  source: string | null
  place: string | null
  target_Note: _Target_Note_ | null
}

function pointedAt__ViewModel({
  viewModel_TextEditor,
  source,
  place,
  target_Note
}: _Api___pointedAt__ViewModel_): _ViewModel_TextEditor_ {
  if (source === null && target_Note === null) return viewModel_TextEditor
  return viewModelOf__Blocks(viewModel_TextEditor.blocks.map((block_ViewModel) => pointedIn__Block({
    block_ViewModel,
    source,
    place,
    target_Note
  })))
}

interface _Api___pointedIn__Block_ {
  block_ViewModel: _Block_ViewModel_
  source: string | null
  place: string | null
  target_Note: _Target_Note_ | null
}

function pointedIn__Block({
  block_ViewModel,
  source,
  place,
  target_Note
}: _Api___pointedIn__Block_): _Block_ViewModel_ {
  return block_ViewModel.kind !== "FRAME"
    ? {
      ...block_ViewModel,
      run: pointedIn__Run({
        run_Lines: block_ViewModel.run,
        source,
        place,
        target_Note
      })
    }
    : {
      ...block_ViewModel,
      parts: mapped__NonEmpty({
        items: block_ViewModel.parts,
        map: (part_Frame) => pointedIn__Part({
          part_Frame,
          source,
          place,
          target_Note
        })
      })
    }
}

interface _Api___pointedIn__Run_ {
  run_Lines: _Run_Lines_
  source: string | null
  place: string | null
  target_Note: _Target_Note_ | null
}

function pointedIn__Run({
  run_Lines,
  source,
  place,
  target_Note
}: _Api___pointedIn__Run_): _Run_Lines_ {
  const underlay$_Pointed = run_Lines.groups
    .filter((group_Underlay) => source !== null && group_Underlay.attributes["data-source"] === source)
    .flatMap((group_Underlay) => group_Underlay.underlays)
  const isCovered = (
    underlay$_Text: Array<_Underlay_Text_>,
    index_Line: number
  ) => underlay$_Text.some((underlay_Text) => isCovering__Underlay_Text({
    underlay_Text,
    index_Line
  }))
  return {
    ...run_Lines,
    lines: run_Lines.lines.map((line_Run, index_Line) => ({
      ...line_Run,
      gutter: {
        ...line_Run.gutter,
        pointed: isCovered(underlay$_Pointed.filter((underlay_Text) => place !== null && underlay_Text.attributes["data-place"] === place), index_Line)
          ? "place"
          : isCovered(underlay$_Pointed, index_Line)
            ? "proposal"
            : "none"
      }
    })),
    groups: run_Lines.groups.map((group_Underlay) => ({
      ...group_Underlay,
      attributes: group_Underlay.attributes["data-source"] === source
        ? {
          ...group_Underlay.attributes,
          "data-pointed": ""
        }
        : group_Underlay.attributes,
      underlays: group_Underlay.underlays.map((underlay_Text) => ({
        ...underlay_Text,
        attributes: {
          ...underlay_Text.attributes,
          ...place !== null && underlay_Text.attributes["data-source"] === source && underlay_Text.attributes["data-place"] === place
            ? {
              "data-pointed": ""
            }
            : {},
          ...target_Note !== null && underlay_Text.attributes["data-source"] === target_Note.source && underlay_Text.attributes["data-side"] === target_Note.side
            ? {
              "data-targeted": ""
            }
            : {}
        }
      }))
    }))
  }
}

interface _Api___isCovering__Underlay_Text_<Kind extends _Underlay_Text_["kind"]> {
  underlay_Text: Extract<
    _Underlay_Text_,
    __BASE_Underlay_Text_<Kind>
  >
  index_Line: number
}

function isCovering__Underlay_Text<Kind extends _Underlay_Text_["kind"]>({
  underlay_Text,
  index_Line
}: _Api___isCovering__Underlay_Text_<Kind>): boolean {
  const isCovering = ISCOVERINGMAP__UNDERLAY_TEXT[underlay_Text.kind]
  return isCovering({
    underlay_Text,
    index_Line
  })
}

type _IsCoveringMap__Underlay_Text_ = {
  [Kind in _Underlay_Text_["kind"]]: (api_IsCovering: _Api___isCovering__Underlay_Text_<Kind>) => boolean
}

const ISCOVERINGMAP__UNDERLAY_TEXT: _IsCoveringMap__Underlay_Text_ = {
  STRETCH: ({
    underlay_Text,
    index_Line
  }) => underlay_Text.from.line <= index_Line && index_Line <= underlay_Text.to.line,
  POINT: ({
    underlay_Text,
    index_Line
  }) => underlay_Text.at.line === index_Line,
  BOUNDARY: () => false,
  UNDERLINE: ({
    underlay_Text,
    index_Line
  }) => underlay_Text.from.line <= index_Line && index_Line <= underlay_Text.to.line
}

interface _Api___foldedAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  ranges_Folded: Array<_Range_Lines_>
  range_Peeked: _Range_Lines_ | null
}

function foldedAt__ViewModel({
  viewModel_TextEditor,
  ranges_Folded,
  range_Peeked
}: _Api___foldedAt__ViewModel_): _ViewModel_TextEditor_ {
  if (ranges_Folded.length === 0) return viewModel_TextEditor
  return viewModelOf__Blocks(viewModel_TextEditor.blocks.map((block_ViewModel) => block_ViewModel.kind === "FRAME" && ranges_Folded.some((range_Lines) => range_Lines.first === block_ViewModel.range.first && range_Lines.last === block_ViewModel.range.last)
    ? foldedOf__Frame({
      block_Frame: block_ViewModel,
      isPeeked: range_Peeked?.first === block_ViewModel.range.first && range_Peeked.last === block_ViewModel.range.last
    })
    : block_ViewModel))
}

interface _Api___foldedOf__Frame_ {
  block_Frame: _FRAME_Block__ViewModel_
  isPeeked: boolean
}

function foldedOf__Frame({
  block_Frame,
  isPeeked
}: _Api___foldedOf__Frame_): _FOLDED_Block__ViewModel_ {
  const part_Proposed = block_Frame.parts.find((part_Frame) => part_Frame.kind === "PROPOSAL_LINES")
  const lines = part_Proposed?.run.lines ?? []
  return {
    kind: "FOLDED",
    range: block_Frame.range,
    run: {
      id: part_Proposed?.run.id ?? `folded ${block_Frame.range.first} ${block_Frame.range.last}`,
      lines: isPeeked
        ? lines
        : lines.map((line_Run) => ({
          ...line_Run,
          note: null
        })),
      groups: isPeeked ? part_Proposed?.run.groups ?? [] : []
    }
  }
}

interface _Api___draftingAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  items_Drafted: Array<_Id_Item_>
}

interface _Id_Item_ {
  source: string
  range_Frame: _Range_Lines_
}

function draftingAt__ViewModel({
  viewModel_TextEditor,
  items_Drafted
}: _Api___draftingAt__ViewModel_): _ViewModel_TextEditor_ {
  if (items_Drafted.length === 0) return viewModel_TextEditor
  return viewModelOf__Blocks(viewModel_TextEditor.blocks.map((block_ViewModel): _Block_ViewModel_ => {
    if (block_ViewModel.kind !== "FRAME") return block_ViewModel
    const sources_Drafted = items_Drafted
      .filter((id_Item) => id_Item.range_Frame.first === block_ViewModel.range.first && id_Item.range_Frame.last === block_ViewModel.range.last)
      .map((id_Item) => id_Item.source)
    return sources_Drafted.length === 0
      ? block_ViewModel
      : {
        ...block_ViewModel,
        parts: mapped__NonEmpty({
          items: block_ViewModel.parts,
          map: (part_Frame): _Part_Frame_ => part_Frame.kind === "PROPOSAL_LIST"
            ? {
              ...part_Frame,
              items: mapped__NonEmpty({
                items: part_Frame.items,
                map: (item_Proposals) => ({
                  ...item_Proposals,
                  isDrafting: sources_Drafted.includes(item_Proposals.source)
                })
              })
            }
            : part_Frame
        })
      }
  }))
}

interface _Api___editingAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  editing_Request: _Id_Request_ | null
}

interface _Id_Request_ {
  id_Item: _Id_Item_ | null
  id: string
}

function editingAt__ViewModel({
  viewModel_TextEditor,
  editing_Request
}: _Api___editingAt__ViewModel_): _ViewModel_TextEditor_ {
  if (editing_Request === null) return viewModel_TextEditor
  const id_Item = editing_Request.id_Item
  const editedOf = (request$_Item: Array<_Request_Item_>) => request$_Item.map((request_Item) => ({
    ...request_Item,
    isEditing: request_Item.id === editing_Request.id
  }))
  const header = viewModel_TextEditor.header
  return id_Item === null
    ? {
      ...viewModel_TextEditor,
      header: {
        ...header,
        task: header.task === null
          ? null
          : {
            ...header.task,
            revisions_Level: {
              ...header.task.revisions_Level,
              requests: editedOf(header.task.revisions_Level.requests)
            }
          },
        document: {
          ...header.document,
          revisions_Level: {
            ...header.document.revisions_Level,
            requests: editedOf(header.document.revisions_Level.requests)
          }
        }
      }
    }
    : {
      ...viewModel_TextEditor,
      blocks: viewModel_TextEditor.blocks.map((block_ViewModel): _Block_ViewModel_ => block_ViewModel.kind !== "FRAME" || block_ViewModel.range.first !== id_Item.range_Frame.first || block_ViewModel.range.last !== id_Item.range_Frame.last
        ? block_ViewModel
        : {
          ...block_ViewModel,
          parts: mapped__NonEmpty({
            items: block_ViewModel.parts,
            map: (part_Frame): _Part_Frame_ => part_Frame.kind === "PROPOSAL_LIST"
              ? {
                ...part_Frame,
                items: mapped__NonEmpty({
                  items: part_Frame.items,
                  map: (item_Proposals) => item_Proposals.source === id_Item.source
                    ? {
                      ...item_Proposals,
                      requests: editedOf(item_Proposals.requests)
                    }
                    : item_Proposals
                })
              }
              : part_Frame
          })
        })
    }
}

interface _Api___wordsAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  id_Request: _Id_Request_ | null
  attributes: _Attributes_Element_
}

function wordsAt__ViewModel({
  viewModel_TextEditor,
  id_Request,
  attributes
}: _Api___wordsAt__ViewModel_): _ViewModel_TextEditor_ {
  if (id_Request === null) return viewModel_TextEditor
  const id_Item = id_Request.id_Item
  const header = viewModel_TextEditor.header
  const part$_Frame = id_Item === null
    ? []
    : viewModel_TextEditor.blocks.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME" && block_ViewModel.range.first === id_Item.range_Frame.first && block_ViewModel.range.last === id_Item.range_Frame.last ? block_ViewModel.parts : [])
  const request$_Holder = id_Item === null
    ? [
      ...(header.task?.revisions_Level.requests ?? []),
      ...header.document.revisions_Level.requests
    ]
    : part$_Frame.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" ? part_Frame.items.flatMap((item_Proposals) => item_Proposals.source === id_Item.source ? item_Proposals.requests : []) : [])
  const reference = request$_Holder.find((request_Item) => request_Item.id === id_Request.id)?.reference ?? null
  const blocks_Lit = reference === null || reference.pieces === null
    ? viewModel_TextEditor.blocks
    : litIn__Blocks({
      blocks_ViewModel: viewModel_TextEditor.blocks,
      pieces: reference.pieces,
      ids_Run: (id_Item === null ? runsOf__Blocks(viewModel_TextEditor.blocks) : part$_Frame.flatMap((part_Frame) => isLines__Part_Frame(part_Frame) ? [part_Frame.run] : []))
        .filter((run_Lines) => sideOf__Run({
          blocks_ViewModel: viewModel_TextEditor.blocks,
          id_Run: run_Lines.id
        }) === reference.side)
        .map((run_Lines) => run_Lines.id),
      attributes
    })
  return blocks_Lit === viewModel_TextEditor.blocks
    ? viewModel_TextEditor
    : {
      ...viewModel_TextEditor,
      blocks: blocks_Lit,
      runs: runsOf__Blocks(blocks_Lit)
    }
}

interface _Api___confirmingAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  confirm_Item: _Pending_Confirm_ | null
}

interface _Pending_Confirm_ {
  id_Item: _Id_Item_
  command: string
}

function confirmingAt__ViewModel({
  viewModel_TextEditor,
  confirm_Item
}: _Api___confirmingAt__ViewModel_): _ViewModel_TextEditor_ {
  if (confirm_Item === null) return viewModel_TextEditor
  return viewModelOf__Blocks(viewModel_TextEditor.blocks.map((block_ViewModel): _Block_ViewModel_ => block_ViewModel.kind !== "FRAME" || confirm_Item.id_Item.range_Frame.first !== block_ViewModel.range.first || confirm_Item.id_Item.range_Frame.last !== block_ViewModel.range.last
    ? block_ViewModel
    : {
      ...block_ViewModel,
      parts: mapped__NonEmpty({
        items: block_ViewModel.parts,
        map: (part_Frame): _Part_Frame_ => part_Frame.kind === "PROPOSAL_LIST"
          ? {
            ...part_Frame,
            items: mapped__NonEmpty({
              items: part_Frame.items,
              map: (item_Proposals) => {
                const action_Item = item_Proposals.source === confirm_Item.id_Item.source
                  ? item_Proposals.actions.find((action_Each) => action_Each.command === confirm_Item.command)
                  : undefined
                const count = item_Proposals.requests.length
                const label_Requests = `${count} ${count === 1 ? "request" : "requests"}`
                return action_Item === undefined
                  ? item_Proposals
                  : {
                    ...item_Proposals,
                    confirming: {
                      command: action_Item.command,
                      label_Question: item_Proposals.isRunning
                        ? `${action_Item.label} and stop its revision, dropping ${label_Requests}?`
                        : `${action_Item.label} and drop ${count} queued ${count === 1 ? "request" : "requests"}?`,
                      label_Action: action_Item.label
                    }
                  }
              }
            })
          }
          : part_Frame
      })
    }))
}

interface _Api___pointedIn__Part_ {
  part_Frame: _Part_Frame_
  source: string | null
  place: string | null
  target_Note: _Target_Note_ | null
}

function pointedIn__Part({
  part_Frame,
  source,
  place,
  target_Note
}: _Api___pointedIn__Part_): _Part_Frame_ {
  return part_Frame.kind === "PROPOSAL_LIST"
    ? {
      ...part_Frame,
      items: mapped__NonEmpty({
        items: part_Frame.items,
        map: (item_Proposals) => item_Proposals.source === source
          ? {
            ...item_Proposals,
            attributes: {
              ...item_Proposals.attributes,
              "data-pointed": ""
            }
          }
          : item_Proposals
      })
    }
    : isLines__Part_Frame(part_Frame)
      ? {
        ...part_Frame,
        run: pointedIn__Run({
          run_Lines: part_Frame.run,
          source,
          place,
          target_Note
        })
      }
      : part_Frame
}

interface _Selection_TextEditor_ {
  anchor: _End_Selection_
  head: _End_Selection_
}

interface _End_Selection_ {
  id_Run: string
  id_Text: _Id_Text_
  position: _Position_Text_
}

interface _Api___isSame__Selection_ {
  selection: _Selection_TextEditor_
  selection_Other: _Selection_TextEditor_
}

function isSame__Selection({
  selection,
  selection_Other
}: _Api___isSame__Selection_): boolean {
  return isSame__End({
    end_Selection: selection.anchor,
    end_Selection_Other: selection_Other.anchor
  }) && isSame__End({
    end_Selection: selection.head,
    end_Selection_Other: selection_Other.head
  })
}

interface _Api___isSame__End_ {
  end_Selection: _End_Selection_
  end_Selection_Other: _End_Selection_
}

function isSame__End({
  end_Selection,
  end_Selection_Other
}: _Api___isSame__End_): boolean {
  return end_Selection.id_Run === end_Selection_Other.id_Run
    && isSame__Id_Text({
      id_Text: end_Selection.id_Text,
      id_Text_Other: end_Selection_Other.id_Text
    })
    && end_Selection.position.line === end_Selection_Other.position.line
    && end_Selection.position.offset === end_Selection_Other.position.offset
}

interface _Api___askingAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  menu: _Menu_ViewModel_ | null
  request: _Form_Request_ | null
}

function askingAt__ViewModel({
  viewModel_TextEditor,
  menu,
  request
}: _Api___askingAt__ViewModel_): _ViewModel_TextEditor_ {
  if (menu === null && request === null) return viewModel_TextEditor
  const blocks_Quoted = litIn__Blocks({
    blocks_ViewModel: viewModel_TextEditor.blocks,
    pieces: request?.quote?.pieces ?? [],
    ids_Run: request?.quote?.ids_Run ?? [],
    attributes: {
      "data-quoted": ""
    }
  })
  return {
    ...viewModel_TextEditor,
    blocks: blocks_Quoted,
    runs: blocks_Quoted === viewModel_TextEditor.blocks ? viewModel_TextEditor.runs : runsOf__Blocks(blocks_Quoted),
    menu,
    request
  }
}

interface _Menu_ViewModel_ {
  point_Screen: _Point_Screen_
  items: _NonEmpty_<_Item_Menu_>
  index_Focused: number
  isFocusShown: boolean
}

interface _Point_Screen_ {
  x: number
  y: number
}

type _Item_Menu_ = _REQUEST_Item_Menu_ | _ACT_Item_Menu_ | _WORK_Item_Menu_ | _TASK_Item_Menu_

interface __BASE_Item_Menu_<Kind extends string> {
  kind: Kind
  label_Tier: string
  label: string
  tier: _Tier_Menu_
  section: _Section_Action_
}

type _Tier_Menu_ = "PROPOSAL" | "DOCUMENT" | "TASK"

interface _REQUEST_Item_Menu_ extends __BASE_Item_Menu_<"REQUEST"> {
  label_Form: string
  head: _Head_Form_
  quote: _Quote_Form_ | null
  target: _Target_Request_
}

interface _ACT_Item_Menu_ extends __BASE_Item_Menu_<"ACT"> {
  id_Item: _Id_Item_
  command: string
}

interface _WORK_Item_Menu_ extends __BASE_Item_Menu_<"WORK"> {
  work: "START" | "STOP"
  scope: _Scope_Menu_
}

type _Scope_Menu_ = _PROPOSAL_Scope_Menu_ | _DOCUMENT_Scope_Menu_ | _TASK_Scope_Menu_

interface __BASE_Scope_Menu_<Kind extends string> {
  kind: Kind
}

interface _PROPOSAL_Scope_Menu_ extends __BASE_Scope_Menu_<"PROPOSAL"> {
  source: string
}

interface _DOCUMENT_Scope_Menu_ extends __BASE_Scope_Menu_<"DOCUMENT"> {}

interface _TASK_Scope_Menu_ extends __BASE_Scope_Menu_<"TASK"> {}

interface _TASK_Item_Menu_ extends __BASE_Item_Menu_<"TASK"> {
  command: string
}

type _Target_Request_ = _DOCUMENT_Target_Request_ | _TASK_Target_Request_ | _PROPOSAL_Target_Request_

interface __BASE_Target_Request_<Kind extends string> {
  kind: Kind
}

interface _DOCUMENT_Target_Request_ extends __BASE_Target_Request_<"DOCUMENT"> {
  reference: _Selected_Text_ | null
}

interface _TASK_Target_Request_ extends __BASE_Target_Request_<"TASK"> {
  reference: _Selected_Text_ | null
}

type _Aim_Request_ = _DOCUMENT_Aim_Request_ | _TASK_Aim_Request_

interface __BASE_Aim_Request_<Kind extends string> {
  kind: Kind
}

interface _DOCUMENT_Aim_Request_ extends __BASE_Aim_Request_<"DOCUMENT"> {
  reference: _Selected_Text_ | null
}

interface _TASK_Aim_Request_ extends __BASE_Aim_Request_<"TASK"> {
  reference: _Selected_Text_ | null
}

interface _PROPOSAL_Target_Request_ extends __BASE_Target_Request_<"PROPOSAL"> {
  source: string
  command: string
  reference: _Selected_Text_ | null
}

interface _Selected_Text_ {
  pieces: _NonEmpty_<_Piece_Text_>
  text: string
  side: _Side_Text_
}

type _Side_Text_ = "CURRENT" | "PROPOSED"

interface _Api___sideOf__Run_ {
  blocks_ViewModel: Array<_Block_ViewModel_>
  id_Run: string
}

function sideOf__Run({
  blocks_ViewModel,
  id_Run
}: _Api___sideOf__Run_): _Side_Text_ {
  const side$ = blocks_ViewModel.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME"
    ? block_ViewModel.parts.flatMap((part_Frame) => isLines__Part_Frame(part_Frame) && part_Frame.run.id === id_Run ? [SIDEMAP__KIND_RUN[part_Frame.kind]] : [])
    : block_ViewModel.run.id === id_Run ? [SIDEMAP__KIND_RUN[block_ViewModel.kind]] : [])
  return side$[0] ?? "CURRENT"
}

interface _Piece_Text_ {
  id_Text: _Id_Text_
  range: _Range_Text_
}

interface _Form_Request_ {
  place: _Place_Form_
  label: string
  head: _Head_Form_ | null
  quote: _Quote_Form_ | null
  isStartable: boolean
  target: _Target_Request_
}

interface _Head_Form_ {
  label_Tier: string
  subject: string
}

interface _Quote_Form_ {
  text: string
  head: string
  size: string | null
  peek: _Peek_Quote_ | null
  pieces: Array<_Piece_Text_>
  ids_Run: Array<string>
}

interface _Peek_Quote_ {
  text: string
  more: string | null
}

interface _Api___headOf__Quote_ {
  text: string
}

function headOf__Quote({
  text
}: _Api___headOf__Quote_): string {
  const lines = parseTexts_Line(text)
  const index_First = Math.max(0, lines.findIndex((line) => line.trim() !== ""))
  const line_First = lines[index_First]?.trim() ?? ""
  return lines.length - 1 > index_First ? `${line_First}…` : line_First
}

interface _Api___sizeOf__Quote_ {
  text: string
}

function sizeOf__Quote({
  text
}: _Api___sizeOf__Quote_): string | null {
  const count = parseTexts_Line(text).length
  return count < 2 ? null : `${count} lines`
}

interface _Api___peekOf__Quote_ {
  text: string
}

function peekOf__Quote({
  text
}: _Api___peekOf__Quote_): _Peek_Quote_ | null {
  const lines = parseTexts_Line(text)
  const count_More = lines.length - LINES_PEEKED__QUOTE
  return lines.length < 2 && Array.from(text).length <= LENGTH_SHOWN__QUOTE
    ? null
    : {
      text: lines.slice(0, LINES_PEEKED__QUOTE).join("\n"),
      more: count_More < 1 ? null : `… ${count_More} more ${count_More === 1 ? "line" : "lines"}`
    }
}

const LENGTH_SHOWN__QUOTE = 36

const LINES_PEEKED__QUOTE = 6

type _Place_Form_ = _POINT_Place_Form_ | _TASK_Place_Form_ | _DOCUMENT_Place_Form_

interface __BASE_Place_Form_<Kind extends string> {
  kind: Kind
}

interface _POINT_Place_Form_ extends __BASE_Place_Form_<"POINT"> {
  point_Screen: _Point_Screen_
}

interface _TASK_Place_Form_ extends __BASE_Place_Form_<"TASK"> {}

interface _DOCUMENT_Place_Form_ extends __BASE_Place_Form_<"DOCUMENT"> {}

interface _Api___selectedAt__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  selection_TextEditor: _Selection_TextEditor_ | null
}

function selectedAt__ViewModel({
  viewModel_TextEditor,
  selection_TextEditor
}: _Api___selectedAt__ViewModel_): _ViewModel_TextEditor_ {
  if (selection_TextEditor === null) return viewModel_TextEditor
  const anchor = drawnOf__End({
    viewModel_TextEditor,
    end_Selection: selection_TextEditor.anchor
  })
  const head = drawnOf__End({
    viewModel_TextEditor,
    end_Selection: selection_TextEditor.head
  })
  return anchor === null || head === null
    ? viewModel_TextEditor
    : {
      ...viewModel_TextEditor,
      selection: {
        anchor,
        head
      }
    }
}

interface _Selection_Drawn_ {
  anchor: _Position_Drawn_
  head: _Position_Drawn_
}

interface _Api___drawnOf__End_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  end_Selection: _End_Selection_
}

function drawnOf__End({
  viewModel_TextEditor,
  end_Selection
}: _Api___drawnOf__End_): _Position_Drawn_ | null {
  const runs_Shown = [
    ...viewModel_TextEditor.runs.filter((run_Lines) => run_Lines.id === end_Selection.id_Run),
    ...viewModel_TextEditor.runs.filter((run_Lines) => run_Lines.id !== end_Selection.id_Run)
  ]
  for (const run_Lines of runs_Shown) {
    const position = positionIn__Run({
      run_Lines,
      place_Text: {
        id_Text: end_Selection.id_Text,
        position: end_Selection.position
      }
    })
    if (position !== null) {
      return {
        id_Run: run_Lines.id,
        position
      }
    }
  }
  return null
}

interface _Api___positionIn__Run_ {
  run_Lines: _Run_Lines_
  place_Text: _Place_Text_
}

interface _Place_Text_ {
  id_Text: _Id_Text_
  position: _Position_Text_
}

function positionIn__Run({
  run_Lines,
  place_Text
}: _Api___positionIn__Run_): _Position_Run_ | null {
  const positions = run_Lines.lines.flatMap((
    line_Run,
    line
  ) => line_Run.origins.flatMap((origin_Line) => {
    const offset = offsetIn__Origin({
      origin_Line,
      text: textOf__Line(line_Run),
      place_Text
    })
    return offset === null
      ? []
      : [
        {
          position: {
            line,
            offset
          },
          isEmpty: origin_Line.from === origin_Line.to
        }
      ]
  }))
  return (positions.find((position) => !position.isEmpty) ?? positions[0])?.position ?? null
}

interface _Api___offsetIn__Origin_ {
  origin_Line: _Origin_Line_
  text: string
  place_Text: _Place_Text_
}

function offsetIn__Origin({
  origin_Line,
  text,
  place_Text
}: _Api___offsetIn__Origin_): number | null {
  if (!isSame__Id_Text({
    id_Text: origin_Line.id_Text,
    id_Text_Other: place_Text.id_Text
  }) || origin_Line.position.line !== place_Text.position.line) return null
  const codePoints = Array.from(text.slice(
    origin_Line.from,
    origin_Line.to
  ))
  const count = place_Text.position.offset - origin_Line.position.offset
  return count < 0 || count > codePoints.length
    ? null
    : origin_Line.from + codePoints.slice(
      0,
      count
    ).join("").length
}

interface _Api___isSame__Id_Text_ {
  id_Text: _Id_Text_
  id_Text_Other: _Id_Text_
}

function isSame__Id_Text({
  id_Text,
  id_Text_Other
}: _Api___isSame__Id_Text_): boolean {
  return id_Text.kind === "DOCUMENT"
    ? id_Text_Other.kind === "DOCUMENT"
    : id_Text_Other.kind === "CHANGE" && id_Text.source === id_Text_Other.source && id_Text.index === id_Text_Other.index
}

function textOf__Line(
  line_Run: _Line_Run_
): string {
  return line_Run.segments.map((segment_Line) => segment_Line.text).join("")
}

interface _Api___placeIn__Line_ {
  line_Run: _Line_Run_
  line_Run_Next: _Line_Run_ | null
  offset: number
  id_Text: _Id_Text_ | null
}

function placeIn__Line({
  line_Run,
  line_Run_Next,
  offset,
  id_Text
}: _Api___placeIn__Line_): _Place_Text_ | null {
  const origins_Offset = line_Run.origins.filter((origin_Line) => origin_Line.from <= offset && offset <= origin_Line.to && (id_Text === null || isSame__Id_Text({
    id_Text: origin_Line.id_Text,
    id_Text_Other: id_Text
  })))
  const origin_Break = offset === textOf__Line(line_Run).length ? line_Run_Next?.origins[0] : undefined
  const id_Text_Break = origin_Break !== undefined && origin_Break.position.offset === 0 && origin_Break.position.line > 0 ? origin_Break.id_Text : null
  const origin_Line = origins_Offset.find((origin_Each) => origin_Each.from <= offset && offset < origin_Each.to)
    ?? origins_Offset.findLast((origin_Each) => id_Text_Break !== null && isSame__Id_Text({
      id_Text: origin_Each.id_Text,
      id_Text_Other: id_Text_Break
    }))
    ?? origins_Offset.find((origin_Each) => origin_Each.from < origin_Each.to)
    ?? origins_Offset[0]
  return origin_Line === undefined
    ? null
    : {
      id_Text: origin_Line.id_Text,
      position: {
        line: origin_Line.position.line,
        offset: origin_Line.position.offset + Array.from(textOf__Line(line_Run).slice(
          origin_Line.from,
          offset
        )).length
      }
    }
}

interface _Position_Drawn_ {
  id_Run: string
  position: _Position_Run_
}

interface _Api___sectionOf__Run_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  id_Run: string
}

type _Kind_Section_ = "LINES" | "CURRENT_LINES" | "PROPOSAL_LINES" | "FOLDED"

function sectionOf__Run({
  viewModel_TextEditor,
  id_Run
}: _Api___sectionOf__Run_): _Kind_Section_ | null {
  for (const block_ViewModel of viewModel_TextEditor.blocks) {
    if (block_ViewModel.kind !== "FRAME") {
      if (block_ViewModel.run.id === id_Run) return block_ViewModel.kind
      continue
    }
    for (const part_Frame of block_ViewModel.parts) {
      if (isLines__Part_Frame(part_Frame) && part_Frame.run.id === id_Run) return part_Frame.kind
    }
  }
  return null
}

interface _Api___orderOf__Positions_Drawn_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn: _Position_Drawn_
  position_Drawn_Other: _Position_Drawn_
}

function orderOf__Positions_Drawn({
  viewModel_TextEditor,
  position_Drawn,
  position_Drawn_Other
}: _Api___orderOf__Positions_Drawn_): number {
  const indexOf = (id_Run: string) => viewModel_TextEditor.runs.findIndex((run_Lines) => run_Lines.id === id_Run)
  return indexOf(position_Drawn.id_Run) - indexOf(position_Drawn_Other.id_Run) || orderOf__Positions_Run({
    position: position_Drawn.position,
    position_Other: position_Drawn_Other.position
  })
}

interface _Api___orderOf__Positions_Run_ {
  position: _Position_Run_
  position_Other: _Position_Run_
}

function orderOf__Positions_Run({
  position,
  position_Other
}: _Api___orderOf__Positions_Run_): number {
  return position.line - position_Other.line || position.offset - position_Other.offset
}

interface _Api___parseLines_ViewModel_<State> {
  multilineText: string
  module_Language: _Module_Language_<State>
}

function parseLines_ViewModel<State>({
  multilineText,
  module_Language
}: _Api___parseLines_ViewModel_<State>): _NonEmpty_<_Line_Run_> {
  const [
    first,
    ...rest
  ] = parseTexts_Line(multilineText)
  const syntax_First = module_Language.syntaxOf__Line({
    text: first,
    state_Before: module_Language.state_Start
  })
  const lines_Rest: Array<_Line_Run_> = []
  let state_Before = syntax_First.state_After
  for (const [
    index,
    text
  ] of rest.entries()) {
    const syntax_Line = module_Language.syntaxOf__Line({
      text,
      state_Before
    })
    lines_Rest.push(lineOf__Text({
      text,
      number: index + 2,
      stretches: syntax_Line.stretches
    }))
    state_Before = syntax_Line.state_After
  }
  return [
    lineOf__Text({
      text: first,
      number: 1,
      stretches: syntax_First.stretches
    }),
    ...lines_Rest
  ]
}

interface _Module_Language_<State> {
  state_Start: State
  syntaxOf__Line: (api_Line: _Api___syntaxOf__Line_<State>) => _Syntax_Line_<State>
}

interface _Api___syntaxOf__Line_<State> {
  text: _Text_Line_NonTerminated_
  state_Before: State
}

interface _Syntax_Line_<State> {
  stretches: Array<_Stretch_Line_>
  state_After: State
}

interface _Module_Words_ {
  wordsOf: (text: string) => Array<_Word_Text_>
}

interface _Word_Text_ {
  from: number
  to: number
}

interface _Api___lineOf__Text_ {
  text: _Text_Line_NonTerminated_
  number: number
  stretches: Array<_Stretch_Line_>
}

function lineOf__Text({
  text,
  number,
  stretches
}: _Api___lineOf__Text_): _Line_Run_ {
  return {
    gutter: {
      label: String(number),
      marker: "none",
      pointed: "none"
    },
    note: null,
    segments: segmentsOf__Stretches({
      text,
      stretches
    }),
    origins: [
      {
        from: 0,
        to: text.length,
        id_Text: {
          kind: "DOCUMENT"
        },
        position: {
          line: number - 1,
          offset: 0
        }
      }
    ]
  }
}

const MODULE_PLAINTEXT: _Module_Language_<null> = {
  state_Start: null,
  syntaxOf__Line: () => ({
    stretches: [],
    state_After: null
  })
}
