import "./View_TextEditor.css"
import {
  draw__Node_Jsx,
  type JSX,
  type _Node_Jsx_
} from "./Jsx.ts"
import type {
  _ViewModel_TextEditor_,
  _Target_Note_,
  _Block_ViewModel_,
  __BASE_Block__ViewModel_,
  _LINES_Block__ViewModel_,
  _Run_Lines_,
  _Line_Run_,
  _Gutter_Line_,
  _Segment_Line_,
  _Note_Line_,
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
  _Underlay_Text_,
  _Position_Run_
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
  type _Api___Section_Frame__Html_,
  type _Point_Screen_,
  type _Layout_View_
}

class _View_TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
  run$: Array<_Run_Lines_>
  ink$_Glyph: Map<string, _Ink_Glyph_>
  resizeObserver_containerElement: ResizeObserver
  mutationObserver_containerElement: MutationObserver

  constructor({
    containerElement,
    componentMap
  }: _Api__View_TextEditor_) {
    this.containerElement = containerElement
    this.componentMap = componentMap
    this.run$ = []
    this.ink$_Glyph = new Map()
    this.resizeObserver_containerElement = new ResizeObserver(
      () => drawTextUnderlay$__View_TextEditor({
        containerElement_View: this.containerElement,
        run$_View: this.run$,
        ink$_Glyph_View: this.ink$_Glyph
      })
    )
    this.resizeObserver_containerElement.observe(this.containerElement)
    this.mutationObserver_containerElement = new MutationObserver(
      () => drawTextUnderlay$__View_TextEditor({
        containerElement_View: this.containerElement,
        run$_View: this.run$,
        ink$_Glyph_View: this.ink$_Glyph
      })
    )
    this.mutationObserver_containerElement.observe(
      this.containerElement,
      {
        attributes: true
      }
    )
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
      run$_View: this.run$,
      ink$_Glyph_View: this.ink$_Glyph
    })
  }

  sourceAt(
    point_Screen: _Point_Screen_
  ): string | null {
    return sourceAt__View_TextEditor({
      containerElement_View: this.containerElement,
      point_Screen
    })
  }

  reveal(
    target_Note: _Target_Note_
  ): void {
    reveal__View_TextEditor({
      containerElement_View: this.containerElement,
      target_Note
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
      <Text_Line__Html
        segment$_Line={line_Run.segments}
        note_Line={line_Run.note}
      />
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
  note_Line: _Note_Line_ | null
}

function Text_Line__Html({
  segment$_Line,
  note_Line
}: _Api___Text_Line__Html_): JSX.Element {
  return (
    <div class="text_htmlView">
      {segment$_Line.map((segment_Line) => <Segment_Text__Html segment_Line={segment_Line} />)}
      {note_Line !== null && <Note_Line__Html note_Line={note_Line} />}
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

interface _Api___Note_Line__Html_ {
  note_Line: _Note_Line_
}

function Note_Line__Html({
  note_Line
}: _Api___Note_Line__Html_): JSX.Element {
  return (
    <button
      type="button"
      class="note_htmlView"
      aria-label={note_Line.label}
      data-target-source={note_Line.target.source}
      data-target-side={note_Line.target.side}
    />
  )
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
  return range_Line$.last < range_Line$.first ? `before line ${range_Line$.first}` : range_Line$.first === range_Line$.last ? `line ${range_Line$.first}` : `lines ${range_Line$.first} to ${range_Line$.last}`
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
      {...item_ProposalList.attributes}
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
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function drawTextUnderlay$__View_TextEditor({
  containerElement_View,
  run$_View,
  ink$_Glyph_View
}: _Api___drawTextUnderlay$__View_TextEditor_): void {
  const drawn$_Run = run$_View.flatMap((run_Line$) => drawn$Of__Run_Line$({
    run_Line$,
    containerElement_View
  }))
  makeRoom$__Drawn$_Run({
    drawn$_Run,
    ink$_Glyph_View
  })
  const measure$_Run = drawn$_Run.map((drawn_Run) => measureOf__Drawn_Run({
    drawn_Run,
    ink$_Glyph_View
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
          {measure_Group.measure$_Underlay.map((measure_Underlay) => [
            <path
              {...measure_Underlay.attributes}
              class="underlay_htmlView"
              d={measure_Underlay.d}
            />,
            measure_Underlay.d_Seam$.map((d_Seam) => (
              <path
                {...measure_Underlay.attributes}
                class="seam_htmlView"
                d={d_Seam}
              />
            ))
          ])}
        </g>
      ))
    })
    fit__Seam$({
      svgElement_underlay$
    })
  }
}

interface _Api___drawn$Of__Run_Line$_ {
  run_Line$: _Run_Lines_
  containerElement_View: HTMLElement
}

function drawn$Of__Run_Line$({
  run_Line$,
  containerElement_View
}: _Api___drawn$Of__Run_Line$_): Array<_Drawn_Run_> {
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
  return [{
    run_Line$,
    svgElement_underlay$,
    divElement$_text
  }]
}

interface _Drawn_Run_ {
  run_Line$: _Run_Lines_
  svgElement_underlay$: Element
  divElement$_text: Array<Element>
}

interface _Api___makeRoom$__Drawn$_Run_ {
  drawn$_Run: Array<_Drawn_Run_>
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function makeRoom$__Drawn$_Run({
  drawn$_Run,
  ink$_Glyph_View
}: _Api___makeRoom$__Drawn$_Run_): void {
  const place$_Room = drawn$_Run.flatMap((drawn_Run) => place$Of__Drawn_Run({
    drawn_Run
  }))
  for (const place_Room of place$_Room) {
    place_Room.htmlElement_Room.style.removeProperty(place_Room.property_Room)
  }
  const room$ = place$_Room.map((place_Room) => ({
    place_Room,
    length_Room: lengthOf__Place_Room({
      place_Room,
      ink$_Glyph_View
    })
  }))
  for (const {
    place_Room,
    length_Room
  } of room$) {
    if (length_Room > 0) {
      place_Room.htmlElement_Room.style.setProperty(
        place_Room.property_Room,
        `${length_Room}px`
      )
    }
  }
}

interface _Api___place$Of__Drawn_Run_ {
  drawn_Run: _Drawn_Run_
}

function place$Of__Drawn_Run({
  drawn_Run
}: _Api___place$Of__Drawn_Run_): Array<_Place_Room_> {
  const inset_Underlay = insetOf__Element(drawn_Run.svgElement_underlay$)
  const edge$ = drawn_Run.run_Line$.groups
    .flatMap((group_Underlay) => group_Underlay.underlays)
    .flatMap((underlay_Text) => [
      {
        position_Run: underlay_Text.from,
        isStart: true
      },
      {
        position_Run: underlay_Text.to,
        isStart: false
      }
    ])
  const edge$_Boundary$ = Map.groupBy(
    edge$,
    (edge) => `${edge.position_Run.line} ${edge.position_Run.offset}`
  )
  return [...edge$_Boundary$.values()].flatMap((edge$_Boundary) => place$Of__Edge$_Boundary({
    edge$_Boundary,
    divElement$_text: drawn_Run.divElement$_text,
    inset_Underlay
  }))
}

interface _Inset_Underlay_ {
  block: number
  inline: number
  clear: number
  step: number
}

function insetOf__Element(
  element: Element
): _Inset_Underlay_ {
  const style = getComputedStyle(element)
  return {
    block: lengthOf__Value(style.getPropertyValue("--insetBlock_underlay_htmlView")),
    inline: lengthOf__Value(style.getPropertyValue("--insetInline_underlay_htmlView")),
    clear: lengthOf__Value(style.getPropertyValue("--clearInline_underlay_htmlView")),
    step: lengthOf__Value(style.getPropertyValue("--step_underlay_htmlView"))
  }
}

function lengthOf__Value(
  value: string
): number {
  const length = Number.parseFloat(value)
  return Number.isNaN(length) ? 0 : length
}

interface _Api___place$Of__Edge$_Boundary_ {
  edge$_Boundary: Array<_Edge_Underlay_>
  divElement$_text: Array<Element>
  inset_Underlay: _Inset_Underlay_
}

function place$Of__Edge$_Boundary({
  edge$_Boundary,
  divElement$_text,
  inset_Underlay
}: _Api___place$Of__Edge$_Boundary_): Array<_Place_Room_> {
  const [edge_First] = edge$_Boundary
  if (edge_First === undefined) return []
  const divElement_text = divElement$_text[edge_First.position_Run.line]
  if (divElement_text === undefined) return []
  const placed$_Text = placedOf__Text$(text$Of__Element(divElement_text))
  const text_Line = placed$_Text.map((placed_Text) => placed_Text.text.data).join("")
  const offset = edge_First.position_Run.offset
  if (!isVisible__Character(text_Line[offset - 1]) || !isVisible__Character(text_Line[offset])) return []
  const isStart = edge$_Boundary.some((edge) => edge.isStart)
  const isEnd = edge$_Boundary.some((edge) => !edge.isStart)
  const reach = -inset_Underlay.inline
  const length_Needed = (isStart ? reach : 0) + (isEnd ? reach : 0) + (isStart && isEnd ? 2 * inset_Underlay.block : inset_Underlay.clear)
  const placed_Before = placed$_Text.find((placed_Text) => placed_Text.start + placed_Text.text.length === offset)
  const htmlElement_Before = placed_Before?.text.parentElement
  if (placed_Before !== undefined && htmlElement_Before instanceof HTMLElement && htmlElement_Before !== divElement_text && htmlElement_Before.lastChild === placed_Before.text) {
    return [{
      htmlElement_Room: htmlElement_Before,
      property_Room: "--view-room-inline-end",
      placed$_Text,
      offset,
      length_Needed
    }]
  }
  const placed_After = placed$_Text.find((placed_Text) => placed_Text.start === offset)
  const htmlElement_After = placed_After?.text.parentElement
  if (placed_After !== undefined && htmlElement_After instanceof HTMLElement && htmlElement_After !== divElement_text && htmlElement_After.firstChild === placed_After.text) {
    return [{
      htmlElement_Room: htmlElement_After,
      property_Room: "--view-room-inline-start",
      placed$_Text,
      offset,
      length_Needed
    }]
  }
  return []
}

interface _Edge_Underlay_ {
  position_Run: _Position_Run_
  isStart: boolean
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

function isVisible__Character(
  character: string | undefined
): boolean {
  return character !== undefined && !REGEXP_SPACE.test(character)
}

const REGEXP_SPACE = /\s/

interface _Place_Room_ {
  htmlElement_Room: HTMLElement
  property_Room: "--view-room-inline-start" | "--view-room-inline-end"
  placed$_Text: Array<_Placed_Text_>
  offset: number
  length_Needed: number
}

interface _Api___lengthOf__Place_Room_ {
  place_Room: _Place_Room_
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function lengthOf__Place_Room({
  place_Room,
  ink$_Glyph_View
}: _Api___lengthOf__Place_Room_): number {
  const extent_Before = extentOf__Character({
    placed$_Text: place_Room.placed$_Text,
    index: place_Room.offset - 1,
    ink$_Glyph_View
  })
  const extent_After = extentOf__Character({
    placed$_Text: place_Room.placed$_Text,
    index: place_Room.offset,
    ink$_Glyph_View
  })
  if (extent_Before === null || extent_After === null || extent_After.rect.top >= extent_Before.rect.bottom) return 0
  return Math.max(
    0,
    place_Room.length_Needed - (extent_After.left - extent_Before.right)
  )
}

interface _Api___extentOf__Character_ {
  placed$_Text: Array<_Placed_Text_>
  index: number
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function extentOf__Character({
  placed$_Text,
  index,
  ink$_Glyph_View
}: _Api___extentOf__Character_): _Extent_Character_ | null {
  const placed_Text = placed$_Text.find((placed) => placed.start <= index && index < placed.start + placed.text.length)
  if (placed_Text === undefined) return null
  const range = document.createRange()
  range.setStart(
    placed_Text.text,
    index - placed_Text.start
  )
  range.setEnd(
    placed_Text.text,
    index - placed_Text.start + 1
  )
  const rect = range.getBoundingClientRect()
  const character = placed_Text.text.data[index - placed_Text.start] ?? ""
  const element_Parent = placed_Text.text.parentElement
  if (REGEXP_SPACE.test(character) || REGEXP_SURROGATE.test(character) || element_Parent === null) {
    return {
      rect,
      left: rect.left,
      right: rect.right
    }
  }
  const ink_Glyph = inkOf__Glyph({
    character,
    font: getComputedStyle(element_Parent).font,
    ink$_Glyph_View
  })
  return {
    rect,
    left: rect.left + ink_Glyph.left,
    right: rect.right + ink_Glyph.right
  }
}

interface _Extent_Character_ {
  rect: DOMRect
  left: number
  right: number
}

const REGEXP_SURROGATE = /[\uD800-\uDFFF]/

interface _Api___inkOf__Glyph_ {
  character: string
  font: string
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function inkOf__Glyph({
  character,
  font,
  ink$_Glyph_View
}: _Api___inkOf__Glyph_): _Ink_Glyph_ {
  const key = `${font}\n${character}`
  const ink_Cached = ink$_Glyph_View.get(key)
  if (ink_Cached !== undefined) return ink_Cached
  const context = new OffscreenCanvas(
    1,
    1
  ).getContext("2d")
  if (context === null) {
    return {
      left: 0,
      right: 0
    }
  }
  context.font = font
  const metrics = context.measureText(character)
  const ink_Glyph = {
    left: -metrics.actualBoundingBoxLeft,
    right: metrics.actualBoundingBoxRight - metrics.width
  }
  ink$_Glyph_View.set(
    key,
    ink_Glyph
  )
  return ink_Glyph
}

interface _Ink_Glyph_ {
  left: number
  right: number
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
  d_Seam$: Array<string>
}

interface _Api___measureOf__Drawn_Run_ {
  drawn_Run: _Drawn_Run_
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function measureOf__Drawn_Run({
  drawn_Run,
  ink$_Glyph_View
}: _Api___measureOf__Drawn_Run_): _Measure_Run_ {
  const origin = drawn_Run.svgElement_underlay$.getBoundingClientRect()
  const inset_Underlay = insetOf__Element(drawn_Run.svgElement_underlay$)
  const underlay$_Run = drawn_Run.run_Line$.groups.flatMap((group_Underlay) => group_Underlay.underlays)
  const measure$_Box = underlay$_Run.map((underlay_Text) => ({
    underlay_Text,
    depth: depthOf__Underlay_Text({
      underlay_Text,
      underlay$_Run
    }),
    box$_Row: box$Of__Underlay_Text({
      underlay_Text,
      divElement$_text: drawn_Run.divElement$_text,
      origin,
      ink$_Glyph_View
    })
  }))
  return {
    svgElement_underlay$: drawn_Run.svgElement_underlay$,
    measure$_Group: drawn_Run.run_Line$.groups.map((group_Underlay) => ({
      attributes: group_Underlay.attributes,
      measure$_Underlay: measure$_Box
        .filter((measure_Box) => group_Underlay.underlays.includes(measure_Box.underlay_Text))
        .map((measure_Box) => ({
          attributes: measure_Box.underlay_Text.attributes,
          ...pathOf__Measure_Box({
            measure_Box,
            measure$_Box,
            inset_Underlay
          })
        }))
    }))
  }
}

interface _Api___depthOf__Underlay_Text_ {
  underlay_Text: _Underlay_Text_
  underlay$_Run: Array<_Underlay_Text_>
}

function depthOf__Underlay_Text({
  underlay_Text,
  underlay$_Run
}: _Api___depthOf__Underlay_Text_): number {
  return underlay$_Run.filter((underlay_Run) => underlay_Run !== underlay_Text && isWithin__Underlay$_Text({
    underlay_Text_inner: underlay_Text,
    underlay_Text_outer: underlay_Run
  })).length
}

interface _Api___isWithin__Underlay$_Text_ {
  underlay_Text_inner: _Underlay_Text_
  underlay_Text_outer: _Underlay_Text_
}

function isWithin__Underlay$_Text({
  underlay_Text_inner,
  underlay_Text_outer
}: _Api___isWithin__Underlay$_Text_): boolean {
  const from = compared__Position$_Run({
    position_Run: underlay_Text_outer.from,
    position_Run_other: underlay_Text_inner.from
  })
  const to = compared__Position$_Run({
    position_Run: underlay_Text_inner.to,
    position_Run_other: underlay_Text_outer.to
  })
  return from <= 0 && to <= 0 && (from < 0 || to < 0)
}

interface _Api___compared__Position$_Run_ {
  position_Run: _Position_Run_
  position_Run_other: _Position_Run_
}

function compared__Position$_Run({
  position_Run,
  position_Run_other
}: _Api___compared__Position$_Run_): number {
  return position_Run.line === position_Run_other.line ? position_Run.offset - position_Run_other.offset : position_Run.line - position_Run_other.line
}

interface _Api___box$Of__Underlay_Text_ {
  underlay_Text: _Underlay_Text_
  divElement$_text: Array<Element>
  origin: DOMRect
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function box$Of__Underlay_Text({
  underlay_Text,
  divElement$_text,
  origin,
  ink$_Glyph_View
}: _Api___box$Of__Underlay_Text_): Array<_Box_Row_> {
  return divElement$_text
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
      isStart: index === 0,
      isEnd: underlay_Text.from.line + index === underlay_Text.to.line,
      origin,
      ink$_Glyph_View
    }))
}

interface _Api___box$Of__Stretch_Line_ {
  divElement_text: Element
  from: number
  to: number
  isStart: boolean
  isEnd: boolean
  origin: DOMRect
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function box$Of__Stretch_Line({
  divElement_text,
  from,
  to,
  isStart,
  isEnd,
  origin,
  ink$_Glyph_View
}: _Api___box$Of__Stretch_Line_): Array<_Box_Row_> {
  const rect_text = divElement_text.getBoundingClientRect()
  const height = parseFloat(getComputedStyle(divElement_text).lineHeight)
  const text$ = text$Of__Element(divElement_text)
  const text_Line = text$.map((text) => text.data).join("")
  const placed$_Text = placedOf__Text$(text$)
  const rect$ = placed$_Text
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
  const rowOf = (rect: DOMRect) => Math.floor((rect.top + rect.height / 2 - rect_text.top) / height)
  const rect$_Row$ = Map.groupBy(
    rect$,
    rowOf
  )
  const entry$_Row = [...rect$_Row$]
  const extent_First = extentOf__Character({
    placed$_Text,
    index: from,
    ink$_Glyph_View
  })
  const extent_Last = extentOf__Character({
    placed$_Text,
    index: Math.min(
      to,
      text_Line.length
    ) - 1,
    ink$_Glyph_View
  })
  const extent_Before = extentOf__Character({
    placed$_Text,
    index: indexOf__Visible({
      text_Line,
      from: from - 1,
      step: -1
    }),
    ink$_Glyph_View
  })
  const extent_After = extentOf__Character({
    placed$_Text,
    index: indexOf__Visible({
      text_Line,
      from: to,
      step: 1
    }),
    ink$_Glyph_View
  })
  const extent_Note = extentOf__Note({
    divElement_text
  })
  const isOn = (
    extent: _Extent_Character_ | null,
    row: number
  ): extent is _Extent_Character_ => extent !== null && rowOf(extent.rect) === row
  return entry$_Row.map((
    [
      row,
      rect$_Row
    ],
    index
  ) => {
    const isFirst = index === 0
    const isLast = index === entry$_Row.length - 1
    const left = isStart && isFirst && isOn(
      extent_First,
      row
    ) ? extent_First.left : Math.min(...rect$_Row.map((rect) => rect.left))
    const right = isEnd && isLast && isOn(
      extent_Last,
      row
    ) ? extent_Last.right : Math.max(...rect$_Row.map((rect) => rect.right))
    return {
      left: left - origin.left,
      top: rect_text.top - origin.top + row * height,
      right: right - origin.left,
      bottom: rect_text.top - origin.top + (row + 1) * height,
      free_Left: isFirst && isOn(
        extent_Before,
        row
      ) ? left - extent_Before.right : Infinity,
      free_Right: isLast && isOn(
        extent_After,
        row
      ) ? extent_After.left - right : isLast && isOn(
        extent_Note,
        row
      ) ? extent_Note.left - right : Infinity
    }
  })
}

interface _Api___extentOf__Note_ {
  divElement_text: Element
}

function extentOf__Note({
  divElement_text
}: _Api___extentOf__Note_): _Extent_Character_ | null {
  const buttonElement_note = divElement_text.querySelector(":scope > .note_htmlView")
  if (buttonElement_note === null) return null
  const rect = buttonElement_note.getBoundingClientRect()
  return {
    rect,
    left: rect.left,
    right: rect.right
  }
}

interface _Api___indexOf__Visible_ {
  text_Line: string
  from: number
  step: number
}

function indexOf__Visible({
  text_Line,
  from,
  step
}: _Api___indexOf__Visible_): number {
  for (let index = from; index >= 0 && index < text_Line.length; index += step) {
    if (!REGEXP_SPACE.test(text_Line[index] ?? "")) return index
  }
  return -1
}

interface _Box_Row_ {
  left: number
  top: number
  right: number
  bottom: number
  free_Left: number
  free_Right: number
}

interface _Measure_Box_ {
  underlay_Text: _Underlay_Text_
  depth: number
  box$_Row: Array<_Box_Row_>
}

interface _Api___pathOf__Measure_Box_ {
  measure_Box: _Measure_Box_
  measure$_Box: Array<_Measure_Box_>
  inset_Underlay: _Inset_Underlay_
}

function pathOf__Measure_Box({
  measure_Box,
  measure$_Box,
  inset_Underlay
}: _Api___pathOf__Measure_Box_): _Path_Underlay_ {
  const gap = 2 * inset_Underlay.block
  const box$_Sibling = measure$_Box
    .filter((measure_Box_other) => measure_Box_other !== measure_Box && !isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box.underlay_Text,
      underlay_Text_outer: measure_Box_other.underlay_Text
    }) && !isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box_other.underlay_Text,
      underlay_Text_outer: measure_Box.underlay_Text
    }))
    .flatMap((measure_Box_other) => measure_Box_other.box$_Row)
  const box$_Container = measure$_Box
    .filter((measure_Box_other) => isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box.underlay_Text,
      underlay_Text_outer: measure_Box_other.underlay_Text
    }))
    .flatMap((measure_Box_other) => measure_Box_other.box$_Row)
  const chain$ = chain$Of__Box$_Row(measure_Box.box$_Row)
  const path$_Chain = chain$.map((
    chain_Box$,
    index
  ) => pathOf__Chain_Box$({
    chain_Box$: levelled$Of__Chain_Box$({
      chain_Box$: roomed$Of__Chain_Box$({
        chain_Box$,
        box$_Sibling,
        box$_Container,
        reach: -inset_Underlay.inline,
        block: inset_Underlay.block * (1 + 2 * measure_Box.depth),
        gap,
        clear: inset_Underlay.clear
      }),
      step: inset_Underlay.step
    }),
    clear: inset_Underlay.clear,
    isSeam_Left: index > 0,
    isSeam_Right: index < chain$.length - 1
  }))
  return {
    d: path$_Chain.map((path_Chain) => path_Chain.d).join(" "),
    d_Seam$: path$_Chain.flatMap((path_Chain) => path_Chain.d_Seam$)
  }
}

interface _Path_Underlay_ {
  d: string
  d_Seam$: Array<string>
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

interface _Api___roomed$Of__Chain_Box$_ {
  chain_Box$: Array<_Box_Row_>
  box$_Sibling: Array<_Box_Row_>
  box$_Container: Array<_Box_Row_>
  reach: number
  block: number
  gap: number
  clear: number
}

function roomed$Of__Chain_Box$({
  chain_Box$,
  box$_Sibling,
  box$_Container,
  reach,
  block,
  gap,
  clear
}: _Api___roomed$Of__Chain_Box$_): Array<_Box_Row_> {
  return chain_Box$.map((
    box_Row,
    index
  ) => {
    const box$_Row_Sibling = box$_Sibling.filter((box_Sibling) => Math.abs(box_Sibling.top - box_Row.top) < 1)
    const box$_Row_Container = box$_Container.filter((box_Container) => Math.abs(box_Container.top - box_Row.top) < 1)
    const room_Left = Math.min(
      reach,
      Math.max(
        0,
        box_Row.free_Left - clear
      ),
      ...box$_Row_Sibling.filter((box_Sibling) => box_Sibling.right <= box_Row.left + 0.5).map((box_Sibling) => (box_Row.left - box_Sibling.right - gap) / 2),
      ...box$_Row_Container.map((box_Container) => box_Row.left - box_Container.left - gap / 2)
    )
    const room_Right = Math.min(
      reach,
      Math.max(
        0,
        box_Row.free_Right - clear
      ),
      ...box$_Row_Sibling.filter((box_Sibling) => box_Sibling.left >= box_Row.right - 0.5).map((box_Sibling) => (box_Sibling.left - box_Row.right - gap) / 2),
      ...box$_Row_Container.map((box_Container) => box_Container.right - box_Row.right - gap / 2)
    )
    const middle = (box_Row.left + box_Row.right) / 2
    return {
      left: Math.min(
        box_Row.left - room_Left,
        middle
      ),
      top: index === 0 ? box_Row.top + block : box_Row.top,
      right: Math.max(
        box_Row.right + room_Right,
        middle
      ),
      bottom: index === chain_Box$.length - 1 ? box_Row.bottom - block : box_Row.bottom,
      free_Left: box_Row.free_Left,
      free_Right: box_Row.free_Right
    }
  })
}

interface _Api___levelled$Of__Chain_Box$_ {
  chain_Box$: Array<_Box_Row_>
  step: number
}

function levelled$Of__Chain_Box$({
  chain_Box$,
  step
}: _Api___levelled$Of__Chain_Box$_): Array<_Box_Row_> {
  const right$ = levelled$Of__Edge$({
    edge$: chain_Box$.map((box_Row) => box_Row.right),
    isOpen$: chain_Box$.map((box_Row) => box_Row.free_Right === Infinity),
    step,
    sign: 1
  })
  const left$ = levelled$Of__Edge$({
    edge$: chain_Box$.map((box_Row) => box_Row.left),
    isOpen$: chain_Box$.map((box_Row) => box_Row.free_Left === Infinity),
    step,
    sign: -1
  })
  return chain_Box$.map((
    box_Row,
    index
  ) => ({
    ...box_Row,
    left: left$[index] ?? box_Row.left,
    right: right$[index] ?? box_Row.right
  }))
}

interface _Api___levelled$Of__Edge$_ {
  edge$: Array<number>
  isOpen$: Array<boolean>
  step: number
  sign: number
}

function levelled$Of__Edge$({
  edge$,
  isOpen$,
  step,
  sign
}: _Api___levelled$Of__Edge$_): Array<number> {
  const group$: Array<Array<number>> = []
  edge$.forEach((
    edge,
    index
  ) => {
    const group = group$.at(-1)
    const outer = group === undefined ? undefined : Math.max(...group.map((index_Group) => sign * (edge$[index_Group] ?? 0)))
    if (isOpen$[index] === true && group !== undefined && outer !== undefined && isOpen$[group[0] ?? -1] === true && Math.abs(sign * edge - outer) < step) group.push(index)
    else group$.push([index])
  })
  return group$.flatMap((group) => {
    const outer = sign * Math.max(...group.map((index_Group) => sign * (edge$[index_Group] ?? 0)))
    return group.map(() => outer)
  })
}

interface _Api___pathOf__Chain_Box$_ {
  chain_Box$: Array<_Box_Row_>
  clear: number
  isSeam_Left: boolean
  isSeam_Right: boolean
}

function pathOf__Chain_Box$({
  chain_Box$,
  clear,
  isSeam_Left,
  isSeam_Right
}: _Api___pathOf__Chain_Box$_): _Path_Underlay_ {
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
  const index_Right = 2 * chain_Box$.length - 2
  const index_Left = 4 * chain_Box$.length - 2
  const index$_Seam = [
    ...isSeam_Right ? [index_Right] : [],
    ...isSeam_Left ? [index_Left] : []
  ]
  const index$_Open = [
    ...(chain_Box$.at(-1)?.free_Right ?? Infinity) < clear ? [index_Right] : [],
    ...(chain_Box$[0]?.free_Left ?? Infinity) < clear ? [index_Left] : [],
    ...index$_Seam
  ]
  const pointOf = (index: number) => {
    const corner = corner$[index % corner$.length] ?? {
      x: 0,
      y: 0
    }
    return `${corner.x} ${corner.y}`
  }
  return {
    d: dOf__Corner$({
      corner$,
      index$_Open
    }),
    d_Seam$: index$_Seam.map((index_Edge) => `M ${pointOf(index_Edge)} L ${pointOf(index_Edge + 1)}`)
  }
}

interface _Api___dOf__Corner$_ {
  corner$: Array<_Corner_Path_>
  index$_Open: Array<number>
}

function dOf__Corner$({
  corner$,
  index$_Open
}: _Api___dOf__Corner$_): string {
  const index_Start = index$_Open[0] ?? corner$.length - 1
  const command$ = corner$.map((
    _,
    step
  ) => {
    const index_Edge = (index_Start + step) % corner$.length
    return {
      isMove: step === 0 || index$_Open.includes(index_Edge),
      corner: corner$[(index_Edge + 1) % corner$.length] ?? {
        x: 0,
        y: 0
      }
    }
  })
  const isLevel = (
    length: number,
    length_other: number
  ) => Math.abs(length - length_other) < 0.01
  const command$_Kept = command$.filter((
    command,
    index
  ) => {
    const command_Before = command$[index - 1]
    const command_After = command$[index + 1]
    if (command.isMove || command_Before === undefined) return true
    const isAgain = isLevel(command.corner.x, command_Before.corner.x) && isLevel(command.corner.y, command_Before.corner.y)
    const isThrough = command_After !== undefined && !command_After.isMove && (isLevel(command_Before.corner.x, command.corner.x) && isLevel(command.corner.x, command_After.corner.x) || isLevel(command_Before.corner.y, command.corner.y) && isLevel(command.corner.y, command_After.corner.y))
    return !isAgain && !isThrough
  })
  const d = command$_Kept.map((command) => `${command.isMove ? "M" : "L"} ${command.corner.x} ${command.corner.y}`).join(" ")
  return index$_Open.length === 0 ? `${d} Z` : d
}


interface _Corner_Path_ {
  x: number
  y: number
}

interface _Api___fit__Seam$_ {
  svgElement_underlay$: Element
}

function fit__Seam$({
  svgElement_underlay$
}: _Api___fit__Seam$_): void {
  for (const pathElement_seam of svgElement_underlay$.querySelectorAll(".seam_htmlView")) {
    if (!(pathElement_seam instanceof SVGPathElement)) continue
    const style = getComputedStyle(pathElement_seam)
    const length = pathElement_seam.getTotalLength()
    if (length <= 0) continue
    const point_Start = pathElement_seam.getPointAtLength(0)
    const point_End = pathElement_seam.getPointAtLength(length)
    const reach = lengthOf__Value(style.strokeWidth) / 2 / length
    const x_Reach = (point_End.x - point_Start.x) * reach
    const y_Reach = (point_End.y - point_Start.y) * reach
    pathElement_seam.setAttribute(
      "d",
      `M ${point_Start.x - x_Reach} ${point_Start.y - y_Reach} L ${point_End.x + x_Reach} ${point_End.y + y_Reach}`
    )
    const length$_Dash = length$Of__Dasharray(style.strokeDasharray)
    const length_First = length$_Dash[0]
    const period = length$_Dash.reduce(
      (
        sum,
        length
      ) => sum + length,
      0
    )
    if (length_First === undefined || period <= 0) continue
    const count = Math.max(
      0,
      Math.round((pathElement_seam.getTotalLength() - length_First) / period)
    )
    const length_Path = count * period + length_First
    if (length_Path > 0) {
      pathElement_seam.setAttribute(
        "pathLength",
        String(length_Path)
      )
    }
  }
}

function length$Of__Dasharray(
  value: string
): Array<number> {
  const length$ = (value.match(REGEXP_LENGTH) ?? []).map(Number)
  return length$.length % 2 === 1 ? [
    ...length$,
    ...length$
  ] : length$
}

const REGEXP_LENGTH = /\d*\.?\d+/g

interface _Point_Screen_ {
  x: number
  y: number
}

interface _Layout_View_ {
  sourceAt: (point_Screen: _Point_Screen_) => string | null
}

interface _Api___reveal__View_TextEditor_ {
  containerElement_View: HTMLElement
  target_Note: _Target_Note_
}

function reveal__View_TextEditor({
  containerElement_View,
  target_Note
}: _Api___reveal__View_TextEditor_): void {
  containerElement_View
    .querySelector(`.text_htmlView [data-source="${CSS.escape(target_Note.source)}"][data-side="${CSS.escape(target_Note.side)}"]`)
    ?.closest(".line_htmlView")
    ?.scrollIntoView({
      block: "center",
      behavior: "smooth"
    })
}

interface _Api___sourceAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function sourceAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___sourceAt__View_TextEditor_): string | null {
  const element = document.elementFromPoint(
    point_Screen.x,
    point_Screen.y
  )
  const element_Source = element !== null && containerElement_View.contains(element) ? element.closest("[data-source]") : null
  return element_Source?.getAttribute("data-source")?.split(" ")[0] ?? null
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
