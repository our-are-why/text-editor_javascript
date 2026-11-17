import {
  _View_TextEditor_,
  type _ComponentMap__View_TextEditor_,
  type _Layout_View_,
  type _Point_Screen_,
  type _Focus_Draft_
} from "./View_TextEditor.tsx"
import {
  type _ViewModel_TextEditor_,
  type _Target_Note_,
  type _Range_Lines_,
  type _Draft_Item_,
  pointedAt__ViewModel,
  draftingAt__ViewModel,
  foldedAt__ViewModel
} from "./ViewModel_TextEditor.ts"
import { CONTROLS__TEXTEDITOR } from "./Controls_TextEditor.ts"

export {
  _TextEditor_,
  type _Api__TextEditor_,
  type _Module_TextEditor_,
  type _Adapter_Event_,
  type _State_TextEditor_,
  type _Command_TextEditor_,
  type __BASE_Command_,
  type _POINT_Command_,
  type _JUMP_Command_,
  type _FOLD_Command_,
  type _DRAFT_Command_,
  type _SEND_Command_,
  type _DISCARD_Command_,
  type _HandlerMap__TextEditor_,
  HANDLERMAP__TEXTEDITOR
}

class _TextEditor_ {
  containerElement: HTMLElement
  view: _View_TextEditor_
  modules: Array<_Module_TextEditor_>
  adapters: Array<_Adapter_Event_>
  state: _State_TextEditor_
  request_Draw: number | null
  point_Screen: _Point_Screen_ | null

  constructor({
    containerElement,
    componentMap,
    modules,
    viewModel_TextEditor
  }: _Api__TextEditor_) {
    this.containerElement = containerElement
    this.view = new _View_TextEditor_({
      containerElement: this.containerElement,
      componentMap
    })
    this.modules = modules
    this.state = {
      viewModel_TextEditor,
      source_Pointed: null,
      place_Pointed: null,
      target_Pointed: null,
      target_Revealed: null,
      ranges_Folded: [],
      range_Peeked: null,
      items_Drafted: [],
      focus_Draft: null
    }
    this.request_Draw = null
    this.point_Screen = null
    this.adapters = [
      ...CONTROLS__TEXTEDITOR,
      ...this.modules.flatMap((module_TextEditor) => module_TextEditor.adapters)
    ]
    for (const event of eventsOf__Adapters(this.adapters)) {
      this.containerElement.addEventListener(
        event,
        (event_Heard) => this.hear(event_Heard)
      )
    }
    this.view.draw(viewModelOf__State(this.state))
  }

  hear(
    event: Event
  ): void {
    for (const adapter of this.adapters.filter((adapter_Each) => adapter_Each.event === event.type)) {
      const command = adapter.commandOf__Event(event)
      if (command !== null && this.dispatch(command)) return
    }
  }

  dispatch(
    command: _Command_TextEditor_
  ): boolean {
    if (command.kind === "POINT") this.point_Screen = command.point_Screen
    const state = stateAfter__Command({
      state: this.state,
      command,
      layout_View: this.view
    })
    if (state !== this.state) {
      this.state = state
      this.drawOnNextFrame()
    }
    return true
  }

  drawOnNextFrame(): void {
    if (this.request_Draw !== null) return
    this.request_Draw = requestAnimationFrame(() => {
      this.request_Draw = null
      this.view.draw(viewModelOf__State(this.state))
      if (this.state.focus_Draft !== null) {
        this.view.focusDraft(this.state.focus_Draft)
        this.state = {
          ...this.state,
          focus_Draft: null
        }
      }
      this.dispatch({
        kind: "POINT",
        point_Screen: this.point_Screen
      })
      if (this.state.target_Revealed !== null) {
        this.view.reveal(this.state.target_Revealed)
        this.state = {
          ...this.state,
          target_Revealed: null
        }
      }
    })
  }
}

interface _Api__TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
  modules: Array<_Module_TextEditor_>
  viewModel_TextEditor: _ViewModel_TextEditor_
}

interface _Module_TextEditor_ {
  name: string
  adapters: Array<_Adapter_Event_>
}

interface _Adapter_Event_ {
  event: string
  commandOf__Event: (event: Event) => _Command_TextEditor_ | null
}

type _Command_TextEditor_ = _POINT_Command_ | _JUMP_Command_ | _FOLD_Command_ | _DRAFT_Command_ | _SEND_Command_ | _DISCARD_Command_

interface __BASE_Command_<Kind extends string> {
  kind: Kind
}

interface _POINT_Command_ extends __BASE_Command_<"POINT"> {
  point_Screen: _Point_Screen_ | null
}

interface _JUMP_Command_ extends __BASE_Command_<"JUMP"> {
  target_Note: _Target_Note_
}

interface _FOLD_Command_ extends __BASE_Command_<"FOLD"> {
  range_Frame: _Range_Lines_
  point_Screen: _Point_Screen_
}

interface _DRAFT_Command_ extends __BASE_Command_<"DRAFT"> {
  draft_Item: _Draft_Item_
}

interface _SEND_Command_ extends __BASE_Command_<"SEND"> {
  draft_Item: _Draft_Item_
}

interface _DISCARD_Command_ extends __BASE_Command_<"DISCARD"> {
  draft_Item: _Draft_Item_
}

interface _State_TextEditor_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  source_Pointed: string | null
  place_Pointed: string | null
  target_Pointed: _Target_Note_ | null
  target_Revealed: _Target_Note_ | null
  ranges_Folded: Array<_Range_Lines_>
  range_Peeked: _Range_Lines_ | null
  items_Drafted: Array<_Draft_Item_>
  focus_Draft: _Focus_Draft_ | null
}

function eventsOf__Adapters(
  adapters: Array<_Adapter_Event_>
): Array<string> {
  return [...new Set(adapters.map((adapter) => adapter.event))]
}

function viewModelOf__State(
  state: _State_TextEditor_
): _ViewModel_TextEditor_ {
  return pointedAt__ViewModel({
    viewModel_TextEditor: draftingAt__ViewModel({
      viewModel_TextEditor: foldedAt__ViewModel({
        viewModel_TextEditor: state.viewModel_TextEditor,
        ranges_Folded: state.ranges_Folded,
        range_Peeked: state.range_Peeked
      }),
      items_Drafted: state.items_Drafted
    }),
    source: state.source_Pointed,
    place: state.place_Pointed,
    target_Note: state.target_Pointed
  })
}

interface _Api___stateAfter__Command_<Kind extends _Command_TextEditor_["kind"]> {
  state: _State_TextEditor_
  command: Extract<
    _Command_TextEditor_,
    __BASE_Command_<Kind>
  >
  layout_View: _Layout_View_
}

function stateAfter__Command<Kind extends _Command_TextEditor_["kind"]>({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<Kind>): _State_TextEditor_ {
  const handle = HANDLERMAP__TEXTEDITOR[command.kind]
  return handle({
    state,
    command,
    layout_View
  })
}

function POINT_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"POINT">): _State_TextEditor_ {
  const source_Pointed = command.point_Screen === null ? null : layout_View.sourceAt(command.point_Screen)
  const place_Pointed = command.point_Screen === null ? null : layout_View.placeAt(command.point_Screen)
  const target_Pointed = command.point_Screen === null ? null : layout_View.targetAt(command.point_Screen)
  const range_Peeked = command.point_Screen === null ? null : layout_View.foldAt(command.point_Screen)
  return source_Pointed === state.source_Pointed && place_Pointed === state.place_Pointed && target_Pointed?.source === state.target_Pointed?.source && target_Pointed?.side === state.target_Pointed?.side && range_Peeked?.first === state.range_Peeked?.first && range_Peeked?.last === state.range_Peeked?.last
    ? state
    : {
      ...state,
      source_Pointed,
      place_Pointed,
      target_Pointed,
      range_Peeked
    }
}

function JUMP_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"JUMP">): _State_TextEditor_ {
  return {
    ...state,
    target_Revealed: command.target_Note
  }
}

function FOLD_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"FOLD">): _State_TextEditor_ {
  if (layout_View.sourceAt(command.point_Screen) !== null) return state
  const isSame = (range_Lines: _Range_Lines_) => range_Lines.first === command.range_Frame.first && range_Lines.last === command.range_Frame.last
  return {
    ...state,
    ranges_Folded: state.ranges_Folded.some(isSame)
      ? state.ranges_Folded.filter((range_Lines) => !isSame(range_Lines))
      : [
        ...state.ranges_Folded,
        command.range_Frame
      ]
  }
}

function DRAFT_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"DRAFT">): _State_TextEditor_ {
  const isOpen = state.items_Drafted.some((draft_Item) => isSame__Draft_Item({
    draft_Item,
    draft_Item_Other: command.draft_Item
  }))
  return {
    ...state,
    items_Drafted: isOpen
      ? state.items_Drafted
      : [
        ...state.items_Drafted,
        command.draft_Item
      ],
    focus_Draft: {
      draft_Item: command.draft_Item,
      part: "NOTES"
    }
  }
}

function SEND_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"SEND">): _State_TextEditor_ {
  return closedAt__State({
    state,
    draft_Item: command.draft_Item
  })
}

function DISCARD_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"DISCARD">): _State_TextEditor_ {
  return closedAt__State({
    state,
    draft_Item: command.draft_Item
  })
}

interface _Api___closedAt__State_ {
  state: _State_TextEditor_
  draft_Item: _Draft_Item_
}

function closedAt__State({
  state,
  draft_Item
}: _Api___closedAt__State_): _State_TextEditor_ {
  const items_Drafted = state.items_Drafted.filter((draft_Item_Open) => !isSame__Draft_Item({
    draft_Item: draft_Item_Open,
    draft_Item_Other: draft_Item
  }))
  return items_Drafted.length === state.items_Drafted.length
    ? state
    : {
      ...state,
      items_Drafted,
      focus_Draft: {
        draft_Item,
        part: "REVISE"
      }
    }
}

interface _Api___isSame__Draft_Item_ {
  draft_Item: _Draft_Item_
  draft_Item_Other: _Draft_Item_
}

function isSame__Draft_Item({
  draft_Item,
  draft_Item_Other
}: _Api___isSame__Draft_Item_): boolean {
  return draft_Item.source === draft_Item_Other.source
    && draft_Item.range_Frame.first === draft_Item_Other.range_Frame.first
    && draft_Item.range_Frame.last === draft_Item_Other.range_Frame.last
}

type _HandlerMap__TextEditor_ = {
  [Kind in _Command_TextEditor_["kind"]]: (api_Handler: _Api___stateAfter__Command_<Kind>) => _State_TextEditor_
}

const HANDLERMAP__TEXTEDITOR: _HandlerMap__TextEditor_ = {
  POINT: POINT_stateAfter__Command,
  JUMP: JUMP_stateAfter__Command,
  FOLD: FOLD_stateAfter__Command,
  DRAFT: DRAFT_stateAfter__Command,
  SEND: SEND_stateAfter__Command,
  DISCARD: DISCARD_stateAfter__Command
}
