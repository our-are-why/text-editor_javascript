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
  type _Attributes_Element_,
  type _Stretch_Line_,
  type _Module_Language_,
  type _Api___syntaxOf__Line_,
  type _Syntax_Line_,
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
  type _Text_Line_NonTerminated_,
  type _NonEmpty_,
  viewModelOf__Blocks,
  segmentsOf__Stretches,
  pointedAt__ViewModel,
  foldedAt__ViewModel,
  draftingAt__ViewModel,
  type _Id_Item_,
  parseLines_ViewModel,
  MODULE_PLAINTEXT,
  parseTexts_Line
}

interface _ViewModel_TextEditor_ {
  charCount_Max__Label_Gutter: number
  blocks: Array<_Block_ViewModel_>
  runs: Array<_Run_Lines_>
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

type _Text_Line_NonTerminated_ = string & { [proof__Text_Line_NonTerminated]: true }

declare const proof__Text_Line_NonTerminated: unique symbol

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
    runs: runs_ViewModel
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
    })
  }
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

type _NonEmpty_<Item> = [
  Item,
  ...Array<Item>
]

const MODULE_PLAINTEXT: _Module_Language_<null> = {
  state_Start: null,
  syntaxOf__Line: () => ({
    stretches: [],
    state_After: null
  })
}
