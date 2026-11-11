import "./View_TextEditor.css"
import {
  draw__Node_Jsx,
  type JSX,
  type _Node_Jsx_
} from "./Jsx.ts"
import type {
  _ViewModel_TextEditor_,
  _Block_ViewModel_,
  __BASE_Block__ViewModel_,
  _LINES_Block__ViewModel_,
  _Run_Lines_,
  _Line_Run_,
  _Gutter_Line_,
  _Segment_Line_,
  _FRAME_Block__ViewModel_,
  _Range_Lines_,
  _Part_Frame_,
  __BASE_Part__Frame_,
  _CURRENT_Part__Frame_,
  _PROPOSED_Part__Frame_,
  _PROPOSALS_Part__Frame_,
  _Item_Proposals_,
  _Action_Item_,
  _Attributes_Element_,
  _Underlay_Text_
} from "./ViewModel_TextEditor.ts"

export {
  _View_TextEditor_,
  type _Api__View_TextEditor_,
  type _ComponentMap__View_TextEditor_,
  type _ComponentMap_Block_,
  type _ComponentMap_Part_,
  COMPONENTMAP__VIEW_TEXTEDITOR,
  type _Api___Block_TextEditor__Html_,
  type _Api___Line_Run__Html_,
  type _Api___Section_Frame__Html_
}

class _View_TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
  run$: Array<_Run_Lines_>
  resizeObserver_containerElement: ResizeObserver

  constructor({
    containerElement,
    componentMap
  }: _Api__View_TextEditor_) {
    this.containerElement = containerElement
    this.componentMap = componentMap
    this.run$ = []
    this.resizeObserver_containerElement = new ResizeObserver(
      () => drawTextUnderlay$__View_TextEditor({
        containerElement_View: this.containerElement,
        run$_View: this.run$
      })
    )
    this.resizeObserver_containerElement.observe(this.containerElement)
  }

  draw(
    viewModel_TextEditor: _ViewModel_TextEditor_
  ): void {
    draw__View_TextEditor({
      containerElement_View: this.containerElement,
      componentMap_View: this.componentMap,
      viewModel_TextEditor
    })
    this.run$ = viewModel_TextEditor.runs
    drawTextUnderlay$__View_TextEditor({
      containerElement_View: this.containerElement,
      run$_View: this.run$
    })
  }
}

interface _Api__View_TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
}

interface _Api___draw__View_TextEditor_ {
  containerElement_View: HTMLElement
  componentMap_View: _ComponentMap__View_TextEditor_
  viewModel_TextEditor: _ViewModel_TextEditor_
}

function draw__View_TextEditor({
  containerElement_View,
  componentMap_View,
  viewModel_TextEditor
}: _Api___draw__View_TextEditor_): void {
  draw__Node_Jsx({
    containerElement: containerElement_View,
    node_Jsx: (
      <TextEditor_Html
        componentMap_View={componentMap_View}
        viewModel_TextEditor={viewModel_TextEditor}
      />
    )
  })
}

interface _Api___TextEditor_Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  viewModel_TextEditor: _ViewModel_TextEditor_
}

function TextEditor_Html({
  componentMap_View,
  viewModel_TextEditor
}: _Api___TextEditor_Html_): JSX.Element {
  return (
    <div
      class="htmlView_editor"
      style={`--labelWidth_htmlView: ${viewModel_TextEditor.charCount_Max__Label_Gutter}ch`}
    >
      {viewModel_TextEditor.blocks.map((block_ViewModel) => (
        <Block_TextEditor__Html
          componentMap_View={componentMap_View}
          block_ViewModel={block_ViewModel}
        />
      ))}
    </div>
  )
}

interface _Api___Block_TextEditor__Html_<Kind extends _Block_ViewModel_["kind"]> {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: Extract<
    _Block_ViewModel_,
    __BASE_Block__ViewModel_<Kind>
  >
}

function Block_TextEditor__Html<Kind extends _Block_ViewModel_["kind"]>({
  componentMap_View,
  block_ViewModel
}: _Api___Block_TextEditor__Html_<Kind>): JSX.Element {
  const Component_Block = componentMap_View.block[block_ViewModel.kind]
  return (
    <Component_Block
      componentMap_View={componentMap_View}
      block_ViewModel={block_ViewModel}
    />
  )
}

interface _Api___LINES_Block_TextEditor__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: _LINES_Block__ViewModel_
}

function LINES_Block_TextEditor__Html({
  componentMap_View,
  block_ViewModel
}: _Api___LINES_Block_TextEditor__Html_): JSX.Element {
  return (
    <Run_Line$__Html
      componentMap_View={componentMap_View}
      run_Line$={block_ViewModel.run}
    />
  )
}

interface _Api___Run_Line$__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  run_Line$: _Run_Lines_
}

function Run_Line$__Html({
  componentMap_View,
  run_Line$
}: _Api___Run_Line$__Html_): JSX.Element {
  const Component_Line = componentMap_View.line
  return (
    <div
      class="run_htmlView"
      data-run={run_Line$.id}
    >
      <svg
        class="underlays_htmlView"
        aria-hidden="true"
      />
      {run_Line$.lines.map((line_Run) => <Component_Line line_Run={line_Run} />)}
    </div>
  )
}

interface _Api___Line_Run__Html_ {
  line_Run: _Line_Run_
}

function Line_Run__Html({
  line_Run
}: _Api___Line_Run__Html_): JSX.Element {
  return (
    <div
      class="line_htmlView"
      data-marker={line_Run.gutter.marker}
    >
      <Gutter_Line__Html gutter_Line={line_Run.gutter} />
      <Text_Line__Html segment$_Line={line_Run.segments} />
    </div>
  )
}

interface _Api___Gutter_Line__Html_ {
  gutter_Line: _Gutter_Line_
}

function Gutter_Line__Html({
  gutter_Line
}: _Api___Gutter_Line__Html_): JSX.Element {
  return (
    <div
      class="gutter_htmlView"
      aria-hidden="true"
    >
      <span class="label_htmlView">{gutter_Line.label}</span>
      <span class="marker_htmlView" />
    </div>
  )
}

interface _Api___Text_Line__Html_ {
  segment$_Line: Array<_Segment_Line_>
}

function Text_Line__Html({
  segment$_Line
}: _Api___Text_Line__Html_): JSX.Element {
  return (
    <div class="text_htmlView">
      {segment$_Line.map((segment_Line) => <Segment_Text__Html segment_Line={segment_Line} />)}
    </div>
  )
}

interface _Api___Segment_Text__Html_ {
  segment_Line: _Segment_Line_
}

function Segment_Text__Html({
  segment_Line
}: _Api___Segment_Text__Html_): JSX.Element {
  return <span {...segment_Line.attributes}>{segment_Line.text}</span>
}

interface _Api___FRAME_Block_TextEditor__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: _FRAME_Block__ViewModel_
}

function FRAME_Block_TextEditor__Html({
  componentMap_View,
  block_ViewModel
}: _Api___FRAME_Block_TextEditor__Html_): JSX.Element {
  return (
    <section
      class="frame_htmlView"
      aria-label={labelOf__Range_Line$(block_ViewModel.range)}
    >
      {block_ViewModel.parts.map((part_Frame) => (
        <Section_Frame__Html
          componentMap_View={componentMap_View}
          part_Frame={part_Frame}
        />
      ))}
    </section>
  )
}

function labelOf__Range_Line$(
  range_Line$: _Range_Lines_
): string {
  return range_Line$.first === range_Line$.last ? `line ${range_Line$.first}` : `lines ${range_Line$.first} to ${range_Line$.last}`
}

interface _Api___Section_Frame__Html_<Kind extends _Part_Frame_["kind"]> {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: Extract<
    _Part_Frame_,
    __BASE_Part__Frame_<Kind>
  >
}

function Section_Frame__Html<Kind extends _Part_Frame_["kind"]>({
  componentMap_View,
  part_Frame
}: _Api___Section_Frame__Html_<Kind>): JSX.Element {
  const Component_Part = componentMap_View.part[part_Frame.kind]
  return (
    <Component_Part
      componentMap_View={componentMap_View}
      part_Frame={part_Frame}
    />
  )
}

interface _Api___CURRENT_LINES__Section_Frame__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: _CURRENT_Part__Frame_
}

function CURRENT_LINES__Section_Frame__Html({
  componentMap_View,
  part_Frame
}: _Api___CURRENT_LINES__Section_Frame__Html_): JSX.Element {
  return (
    <div
      class="current_htmlView"
      role="group"
      aria-label="as it is"
    >
      <Run_Line$__Html
        componentMap_View={componentMap_View}
        run_Line$={part_Frame.run}
      />
    </div>
  )
}

interface _Api___PROPOSAL_LINES__Section_Frame__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: _PROPOSED_Part__Frame_
}

function PROPOSAL_LINES__Section_Frame__Html({
  componentMap_View,
  part_Frame
}: _Api___PROPOSAL_LINES__Section_Frame__Html_): JSX.Element {
  return (
    <div
      class="proposed_htmlView"
      role="group"
      aria-label="as proposed"
    >
      <Run_Line$__Html
        componentMap_View={componentMap_View}
        run_Line$={part_Frame.run}
      />
    </div>
  )
}

interface _Api___PROPOSAL_LIST__Section_Frame__Html_ {
  part_Frame: _PROPOSALS_Part__Frame_
}

function PROPOSAL_LIST__Section_Frame__Html({
  part_Frame
}: _Api___PROPOSAL_LIST__Section_Frame__Html_): JSX.Element {
  return (
    <ol
      class="proposals_htmlView"
      aria-label="proposals"
    >
      {part_Frame.items.map((item_ProposalList) => <Item_ProposalList__Html item_ProposalList={item_ProposalList} />)}
    </ol>
  )
}

interface _Api___Item_ProposalList__Html_ {
  item_ProposalList: _Item_Proposals_
}

function Item_ProposalList__Html({
  item_ProposalList
}: _Api___Item_ProposalList__Html_): JSX.Element {
  return (
    <li
      class="item_htmlView"
      data-source={item_ProposalList.source}
    >
      <span class="title_htmlView">{item_ProposalList.title}</span>
      <p class="places_htmlView">{item_ProposalList.places}</p>
      <p class="rationale_htmlView">{item_ProposalList.rationale}</p>
      <div class="actions_htmlView">
        {item_ProposalList.actions.map((action_Item) => <Action_Item__Html action_Item={action_Item} />)}
      </div>
    </li>
  )
}

interface _Api___Action_Item__Html_ {
  action_Item: _Action_Item_
}

function Action_Item__Html({
  action_Item
}: _Api___Action_Item__Html_): JSX.Element {
  return (
    <button
      type="button"
      class="action_htmlView"
      data-command={action_Item.command}
    >
      {action_Item.label}
    </button>
  )
}

interface _Api___drawTextUnderlay$__View_TextEditor_ {
  containerElement_View: HTMLElement
  run$_View: Array<_Run_Lines_>
}

function drawTextUnderlay$__View_TextEditor({
  containerElement_View,
  run$_View
}: _Api___drawTextUnderlay$__View_TextEditor_): void {
  const measure$_Run = run$_View.flatMap((run_Line$) => measure$Of__Run_Line$({
    run_Line$,
    containerElement_View
  }))
  for (const {
    svgElement_underlay$,
    measure$_Group
  } of measure$_Run) {
    draw__Node_Jsx({
      containerElement: svgElement_underlay$,
      node_Jsx: measure$_Group.map((measure_Group) => (
        <g
          {...measure_Group.attributes}
          class="group_htmlView"
        >
          {measure_Group.measure$_Underlay.map((measure_Underlay) => (
            <path
              {...measure_Underlay.attributes}
              class="underlay_htmlView"
              d={measure_Underlay.d}
            />
          ))}
        </g>
      ))
    })
  }
}

interface _Measure_Run_ {
  svgElement_underlay$: Element
  measure$_Group: Array<_Measure_Group_>
}

interface _Measure_Group_ {
  attributes: _Attributes_Element_
  measure$_Underlay: Array<_Measure_Underlay_>
}

interface _Measure_Underlay_ {
  attributes: _Attributes_Element_
  d: string
}

interface _Api___measure$Of__Run_Line$_ {
  run_Line$: _Run_Lines_
  containerElement_View: HTMLElement
}

function measure$Of__Run_Line$({
  run_Line$,
  containerElement_View
}: _Api___measure$Of__Run_Line$_): Array<_Measure_Run_> {
  if (run_Line$.groups.length === 0) return []
  const selector_run = `.run_htmlView[data-run="${CSS.escape(run_Line$.id)}"]`
  const svgElement_underlay$ = containerElement_View.querySelector(`${selector_run} > .underlays_htmlView`)
  if (svgElement_underlay$ === null) {
    console.warn(`the text underlays of the run "${run_Line$.id}" aren't drawn: there's no ${selector_run} with its <svg class="underlays_htmlView">, which a host's component drawing the run has to keep`)
    return []
  }
  const divElement$_text = [...containerElement_View.querySelectorAll(`${selector_run} > .line_htmlView > .text_htmlView`)]
  if (divElement$_text.length !== run_Line$.lines.length) {
    console.warn(`the text underlays of the run "${run_Line$.id}" aren't drawn: ${divElement$_text.length} of its ${run_Line$.lines.length} lines are a .line_htmlView right inside it with a .text_htmlView right inside that, which a host's component drawing a line has to keep`)
    return []
  }
  const origin = svgElement_underlay$.getBoundingClientRect()
  return [{
    svgElement_underlay$,
    measure$_Group: run_Line$.groups.map((group_Underlay) => ({
      attributes: group_Underlay.attributes,
      measure$_Underlay: group_Underlay.underlays.map((underlay_Text) => ({
        attributes: underlay_Text.attributes,
        d: dOf__Underlay_Text({
          underlay_Text,
          divElement$_text,
          origin
        })
      }))
    }))
  }]
}

interface _Api___dOf__Underlay_Text_ {
  underlay_Text: _Underlay_Text_
  divElement$_text: Array<Element>
  origin: DOMRect
}

function dOf__Underlay_Text({
  underlay_Text,
  divElement$_text,
  origin
}: _Api___dOf__Underlay_Text_): string {
  const box$_Row = divElement$_text
    .slice(
      underlay_Text.from.line,
      underlay_Text.to.line + 1
    )
    .flatMap((
      divElement_text,
      index
    ) => box$Of__Stretch_Line({
      divElement_text,
      from: index === 0 ? underlay_Text.from.offset : 0,
      to: underlay_Text.from.line + index === underlay_Text.to.line ? underlay_Text.to.offset : Infinity,
      origin
    }))
  return chain$Of__Box$_Row(box$_Row).map(dOf__Chain_Box$).join(" ")
}

interface _Api___box$Of__Stretch_Line_ {
  divElement_text: Element
  from: number
  to: number
  origin: DOMRect
}

function box$Of__Stretch_Line({
  divElement_text,
  from,
  to,
  origin
}: _Api___box$Of__Stretch_Line_): Array<_Box_Row_> {
  const rect_text = divElement_text.getBoundingClientRect()
  const height = parseFloat(getComputedStyle(divElement_text).lineHeight)
  const rect$ = placedOf__Text$(text$Of__Element(divElement_text))
    .filter(({
      text,
      start
    }) => start < to && start + text.length > from)
    .flatMap(({
      text,
      start
    }) => {
      const range = document.createRange()
      range.setStart(
        text,
        Math.max(
          from,
          start
        ) - start
      )
      range.setEnd(
        text,
        Math.min(
          to,
          start + text.length
        ) - start
      )
      return [...range.getClientRects()]
    })
  const rect$_Row$ = Map.groupBy(
    rect$,
    (rect) => Math.floor((rect.top + rect.height / 2 - rect_text.top) / height)
  )
  return [...rect$_Row$].map(([
    row,
    rect$_Row
  ]) => ({
    left: Math.min(...rect$_Row.map((rect) => rect.left)) - origin.left,
    top: rect_text.top - origin.top + row * height,
    right: Math.max(...rect$_Row.map((rect) => rect.right)) - origin.left,
    bottom: rect_text.top - origin.top + (row + 1) * height
  }))
}

interface _Box_Row_ {
  left: number
  top: number
  right: number
  bottom: number
}

interface _Placed_Text_ {
  text: Text
  start: number
}

function placedOf__Text$(
  text$: Array<Text>
): Array<_Placed_Text_> {
  return text$.map((
    text,
    index
  ) => ({
    text,
    start: text$
      .slice(
        0,
        index
      )
      .reduce(
        (
          length,
          each
        ) => length + each.length,
        0
      )
  }))
}

function text$Of__Element(
  element: Element
): Array<Text> {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT
  )
  const text$: Array<Text> = []
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) text$.push(node)
  return text$
}

function chain$Of__Box$_Row(
  box$_Row: Array<_Box_Row_>
): Array<Array<_Box_Row_>> {
  const chain$: Array<Array<_Box_Row_>> = []
  for (const box_Row of box$_Row) {
    const chain = chain$.at(-1)
    const box_Row_before = chain?.at(-1)
    if (chain !== undefined && box_Row_before !== undefined && isJoined__Box$_Row({
      box_Row_above: box_Row_before,
      box_Row_below: box_Row
    })) chain.push(box_Row)
    else chain$.push([box_Row])
  }
  return chain$
}

interface _Api___isJoined__Box$_Row_ {
  box_Row_above: _Box_Row_
  box_Row_below: _Box_Row_
}

function isJoined__Box$_Row({
  box_Row_above,
  box_Row_below
}: _Api___isJoined__Box$_Row_): boolean {
  return Math.abs(box_Row_above.bottom - box_Row_below.top) < 1 && box_Row_below.left < box_Row_above.right && box_Row_above.left < box_Row_below.right
}

function dOf__Chain_Box$(
  chain_Box$: Array<_Box_Row_>
): string {
  const corner$ = [
    ...chain_Box$.flatMap((box_Row) => [
      {
        x: box_Row.right,
        y: box_Row.top
      },
      {
        x: box_Row.right,
        y: box_Row.bottom
      }
    ]),
    ...chain_Box$.toReversed().flatMap((box_Row) => [
      {
        x: box_Row.left,
        y: box_Row.bottom
      },
      {
        x: box_Row.left,
        y: box_Row.top
      }
    ])
  ]
  return `M ${corner$.map((corner) => `${corner.x} ${corner.y}`).join(" L ")} Z`
}

interface _ComponentMap__View_TextEditor_ {
  block: _ComponentMap_Block_
  part: _ComponentMap_Part_
  line: (api_Line: _Api___Line_Run__Html_) => _Node_Jsx_
}

type _ComponentMap_Block_ = {
  [Kind in _Block_ViewModel_["kind"]]: (api_Block: _Api___Block_TextEditor__Html_<Kind>) => _Node_Jsx_
}

type _ComponentMap_Part_ = {
  [Kind in _Part_Frame_["kind"]]: (api_Part: _Api___Section_Frame__Html_<Kind>) => _Node_Jsx_
}

const COMPONENTMAP__VIEW_TEXTEDITOR: _ComponentMap__View_TextEditor_ = {
  block: {
    LINES: LINES_Block_TextEditor__Html,
    FRAME: FRAME_Block_TextEditor__Html
  },
  part: {
    CURRENT_LINES: CURRENT_LINES__Section_Frame__Html,
    PROPOSAL_LINES: PROPOSAL_LINES__Section_Frame__Html,
    PROPOSAL_LIST: PROPOSAL_LIST__Section_Frame__Html
  },
  line: Line_Run__Html
}
