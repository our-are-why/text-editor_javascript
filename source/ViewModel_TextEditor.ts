export {
  type _ViewModel_TextEditor_,
  type _Block_ViewModel_,
  type __BASE_Block__ViewModel_,
  type _LINES_Block__ViewModel_,
  type _Run_Lines_,
  type _Line_Run_,
  type _Gutter_Line_,
  type _Marker_Gutter_,
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
  type _Position_Run_,
  type _FRAME_Block__ViewModel_,
  type _Range_Lines_,
  type _Part_Frame_,
  type __BASE_Part__Frame_,
  type _CURRENT_Part__Frame_,
  type _PROPOSED_Part__Frame_,
  type _PROPOSALS_Part__Frame_,
  type _Item_Proposals_,
  type _Action_Item_,
  type _Text_Line_NonTerminated_,
  type _NonEmpty_,
  viewModelOf__Blocks,
  segmentsOf__Stretches,
  pointedAt__ViewModel,
  parseLines_ViewModel,
  MODULE_PLAINTEXT,
  parseTexts_Line
}

interface _ViewModel_TextEditor_ {
  charCount_Max__Label_Gutter: number
  blocks: Array<_Block_ViewModel_>
  runs: Array<_Run_Lines_>
}

type _Block_ViewModel_ = _LINES_Block__ViewModel_ | _FRAME_Block__ViewModel_

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
}

type _Marker_Gutter_ = "none" | "removed" | "changed" | "inserted" | "moved"

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

interface _Underlay_Text_ {
  from: _Position_Run_
  to: _Position_Run_
  attributes: _Attributes_Element_
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
  places: string
  rationale: string
  actions: Array<_Action_Item_>
  attributes: _Attributes_Element_
}

interface _Action_Item_ {
  command: string
  label: string
}

type _Text_Line_NonTerminated_ = string & { [proof__Text_Line_NonTerminated]: true }

declare const proof__Text_Line_NonTerminated: unique symbol

function viewModelOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): _ViewModel_TextEditor_ {
  const runs_ViewModel = runsOf__Blocks(blocks_ViewModel)
  return {
    charCount_Max__Label_Gutter: Math.max(
      1,
      ...runs_ViewModel.flatMap((run_Lines) => run_Lines.lines).map((line_Run) => line_Run.gutter.label.length)
    ),
    blocks: blocks_ViewModel,
    runs: runs_ViewModel
  }
}

function runsOf__Blocks(
  blocks_ViewModel: Array<_Block_ViewModel_>
): Array<_Run_Lines_> {
  return blocks_ViewModel.flatMap((block_ViewModel) =>
    block_ViewModel.kind === "LINES"
      ? [block_ViewModel.run]
      : block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" ? [] : [part_Frame.run])
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
  return block_ViewModel.kind === "LINES"
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
  return {
    ...run_Lines,
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
      marker: "none"
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
