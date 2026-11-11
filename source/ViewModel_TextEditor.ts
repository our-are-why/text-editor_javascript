export {
  type _ViewModel_TextEditor_,
  type _Block_ViewModel_,
  type __BASE_Block__ViewModel_,
  type _LINES_Block__ViewModel_,
  type _Run_Lines_,
  type _Line_Run_,
  type _Gutter_Line_,
  type _Marker_Gutter_,
  type _Segment_Line_,
  type _Attributes_Element_,
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
  parseLines_ViewModel,
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
  segments: Array<_Segment_Line_>
}

interface _Gutter_Line_ {
  label: string
  marker: _Marker_Gutter_
}

type _Marker_Gutter_ = "none" | "removed" | "changed" | "inserted"

interface _Segment_Line_ {
  text: _Text_Line_NonTerminated_
  attributes: _Attributes_Element_
}

interface _Attributes_Element_ {
  [name: string]: string
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
  rationale: string
  actions: Array<_Action_Item_>
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

function parseLines_ViewModel(
  multilineText: string
): _NonEmpty_<_Line_Run_> {
  const [
    first,
    ...rest
  ] = parseTexts_Line(multilineText)
  return [
    lineOf__Text({
      text: first,
      number: 1
    }),
    ...rest.map((
      text,
      index
    ) => lineOf__Text({
      text,
      number: index + 2
    }))
  ]
}

interface _Api___lineOf__Text_ {
  text: _Text_Line_NonTerminated_
  number: number
}

function lineOf__Text({
  text,
  number
}: _Api___lineOf__Text_): _Line_Run_ {
  return {
    gutter: {
      label: String(number),
      marker: "none"
    },
    segments: text === "" ? [] : [{
      text,
      attributes: {}
    }]
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
