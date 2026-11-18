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
  type _Position_Run_,
  type _FRAME_Block__ViewModel_,
  type _FOLDED_Block__ViewModel_,
  type _Range_Lines_,
  type _Part_Frame_,
  type __BASE_Part__Frame_,
  type _CURRENT_Part__Frame_,
  type _PROPOSED_Part__Frame_,
  type _PROPOSALS_Part__Frame_,
  type _Item_Proposals_,
  type _State_Proposal_,
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
  pointedAt__ViewModel,
  foldedAt__ViewModel,
  draftingAt__ViewModel,
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
  type _Target_Request_,
  type __BASE_Target_Request_,
  type _SELECTION_Target_Request_,
  type _DOCUMENT_Target_Request_,
  type _PROPOSAL_Target_Request_,
  type _Selected_Text_,
  type _Piece_Text_,
  type _Form_Request_,
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

type _Underlay_Text_ = _STRETCH_Underlay_Text_ | _POINT_Underlay_Text_ | _BOUNDARY_Underlay_Text_

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

type _Part_Frame_ = _CURRENT_Part__Frame_ | _PROPOSED_Part__Frame_ | _PROPOSALS_Part__Frame_

interface __BASE_Part__Frame_<Kind extends string> {
  kind: Kind
}

interface _CURRENT_Part__Frame_ extends __BASE_Part__Frame_<"CURRENT_LINES"> {
  run: _Run_Lines_
}

interface _PROPOSED_Part__Frame_ extends __BASE_Part__Frame_<"PROPOSAL_LINES"> {
  run: _Run_Lines_
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
  request: string
  actions: Array<_Action_Item_>
  isDrafting: boolean
  attributes: _Attributes_Element_
}

type _State_Proposal_ = "OPEN" | "REQUESTED" | "REVISING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"

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
    request: null
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
        map: (part_Frame): _Part_Frame_ => part_Frame.kind === "PROPOSAL_LIST"
          ? {
            ...part_Frame,
            items: decidedLast__Items(part_Frame.items)
          }
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

function decidedLast__Items(
  items_Proposals: _NonEmpty_<_Item_Proposals_>
): _NonEmpty_<_Item_Proposals_> {
  const [
    first,
    ...rest
  ] = items_Proposals.toSorted((
    item_Proposals,
    item_Proposals_other
  ) => Number(ISDECIDEDMAP__STATE_PROPOSAL[item_Proposals.state]) - Number(ISDECIDEDMAP__STATE_PROPOSAL[item_Proposals_other.state]))
  return first === undefined
    ? items_Proposals
    : [
      first,
      ...rest
    ]
}

type _IsDecidedMap__State_Proposal_ = {
  [State in _State_Proposal_]: boolean
}

const ISDECIDEDMAP__STATE_PROPOSAL: _IsDecidedMap__State_Proposal_ = {
  OPEN: false,
  REQUESTED: false,
  REVISING: false,
  ACCEPTED: true,
  REJECTED: true,
  WITHDRAWN: true
}

function runsOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): Array<_Run_Lines_> {
  return blocks_ViewModel.flatMap((block_ViewModel) =>
    block_ViewModel.kind === "FRAME"
      ? block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" ? [] : [part_Frame.run])
      : [block_ViewModel.run]
  )
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
  BOUNDARY: () => false
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
  return {
    kind: "FOLDED",
    range: block_Frame.range,
    run: {
      id: part_Proposed?.run.id ?? `folded ${block_Frame.range.first} ${block_Frame.range.last}`,
      lines: part_Proposed?.run.lines ?? [],
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
    : {
      ...part_Frame,
      run: pointedIn__Run({
        run_Lines: part_Frame.run,
        source,
        place,
        target_Note
      })
    }
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
  return menu === null && request === null
    ? viewModel_TextEditor
    : {
      ...viewModel_TextEditor,
      menu,
      request
    }
}

interface _Menu_ViewModel_ {
  point_Screen: _Point_Screen_
  items: _NonEmpty_<_Item_Menu_>
  index_Focused: number
}

interface _Point_Screen_ {
  x: number
  y: number
}

interface _Item_Menu_ {
  label: string
  quote: string | null
  target: _Target_Request_
}

type _Target_Request_ = _SELECTION_Target_Request_ | _DOCUMENT_Target_Request_ | _PROPOSAL_Target_Request_

interface __BASE_Target_Request_<Kind extends string> {
  kind: Kind
}

interface _SELECTION_Target_Request_ extends __BASE_Target_Request_<"SELECTION"> {
  selected: _Selected_Text_
}

interface _DOCUMENT_Target_Request_ extends __BASE_Target_Request_<"DOCUMENT"> {}

interface _PROPOSAL_Target_Request_ extends __BASE_Target_Request_<"PROPOSAL"> {
  source: string
  command: string
  selected: _Selected_Text_ | null
}

interface _Selected_Text_ {
  pieces: _NonEmpty_<_Piece_Text_>
  text: string
}

interface _Piece_Text_ {
  id_Text: _Id_Text_
  range: _Range_Text_
}

interface _Form_Request_ {
  point_Screen: _Point_Screen_
  label: string
  quote: string | null
  target: _Target_Request_
}

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
      if (part_Frame.kind !== "PROPOSAL_LIST" && part_Frame.run.id === id_Run) return part_Frame.kind
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
