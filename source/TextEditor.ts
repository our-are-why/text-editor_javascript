import {
  _View_TextEditor_,
  type _ComponentMap__View_TextEditor_,
  type _Layout_View_,
  type _Point_Screen_
} from "./View_TextEditor.tsx"
import {
  type _ViewModel_TextEditor_,
  type _Target_Note_,
  pointedAt__ViewModel
} from "./ViewModel_TextEditor.ts"

export {
  _TextEditor_,
  type _Api__TextEditor_,
  type _Module_TextEditor_,
  type _Adapter_Module_,
  type _State_TextEditor_,
  type _Command_TextEditor_,
  type __BASE_Command_,
  type _POINT_Command_,
  type _JUMP_Command_,
  type _HandlerMap__TextEditor_,
  HANDLERMAP__TEXTEDITOR
}

class _TextEditor_ {
  containerElement: HTMLElement
  view: _View_TextEditor_
  modules: Array<_Module_TextEditor_>
  state: _State_TextEditor_
  request_Draw: number | null

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
      target_Pointed: null,
      target_Revealed: null
    }
    this.request_Draw = null
    for (const event of eventsOf__Modules(this.modules)) {
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
    for (const adapter of adaptersFor__Event({
      modules: this.modules,
      event
    })) {
      const command = adapter.commandOf__Event(event)
      if (command !== null && this.dispatch(command)) return
    }
  }

  dispatch(
    command: _Command_TextEditor_
  ): boolean {
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
  adapters: Array<_Adapter_Module_>
}

interface _Adapter_Module_ {
  event: string
  commandOf__Event: (event: Event) => _Command_TextEditor_ | null
}

type _Command_TextEditor_ = _POINT_Command_ | _JUMP_Command_

interface __BASE_Command_<Kind extends string> {
  kind: Kind
}

interface _POINT_Command_ extends __BASE_Command_<"POINT"> {
  point_Screen: _Point_Screen_ | null
}

interface _JUMP_Command_ extends __BASE_Command_<"JUMP"> {
  target_Note: _Target_Note_
}

interface _State_TextEditor_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  source_Pointed: string | null
  target_Pointed: _Target_Note_ | null
  target_Revealed: _Target_Note_ | null
}

function eventsOf__Modules(
  modules: Array<_Module_TextEditor_>
): Array<string> {
  return [...new Set(modules.flatMap((module_TextEditor) => module_TextEditor.adapters.map((adapter) => adapter.event)))]
}

function viewModelOf__State(
  state: _State_TextEditor_
): _ViewModel_TextEditor_ {
  return pointedAt__ViewModel({
    viewModel_TextEditor: state.viewModel_TextEditor,
    source: state.source_Pointed,
    target_Note: state.target_Pointed
  })
}

interface _Api___adaptersFor__Event_ {
  modules: Array<_Module_TextEditor_>
  event: Event
}

function adaptersFor__Event({
  modules,
  event
}: _Api___adaptersFor__Event_): Array<_Adapter_Module_> {
  return modules.flatMap((module_TextEditor) => module_TextEditor.adapters.filter((adapter) => adapter.event === event.type))
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
  const target_Pointed = command.point_Screen === null ? null : layout_View.targetAt(command.point_Screen)
  return source_Pointed === state.source_Pointed && target_Pointed?.source === state.target_Pointed?.source && target_Pointed?.side === state.target_Pointed?.side
    ? state
    : {
      ...state,
      source_Pointed,
      target_Pointed
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

type _HandlerMap__TextEditor_ = {
  [Kind in _Command_TextEditor_["kind"]]: (api_Handler: _Api___stateAfter__Command_<Kind>) => _State_TextEditor_
}

const HANDLERMAP__TEXTEDITOR: _HandlerMap__TextEditor_ = {
  POINT: POINT_stateAfter__Command,
  JUMP: JUMP_stateAfter__Command
}
