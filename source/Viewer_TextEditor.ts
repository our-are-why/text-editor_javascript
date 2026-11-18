import {
  _View_TextEditor_,
  type _ComponentMap__View_TextEditor_,
  type _Layout_View_,
  type _Point_Screen_,
  type _Focus_Draft_,
  type _Visit_Item_,
  type _Focus_Asking_
} from "./View_TextEditor.tsx"
import {
  type _ViewModel_TextEditor_,
  type _Target_Note_,
  type _Range_Lines_,
  type _Id_Item_,
  type _Selection_TextEditor_,
  type _End_Selection_,
  type _Position_Drawn_,
  type _Position_Run_,
  selectedAt__ViewModel,
  pointedAt__ViewModel,
  draftingAt__ViewModel,
  foldedAt__ViewModel,
  orderOf__Positions_Drawn,
  orderOf__Positions_Run,
  sectionOf__Run,
  type _Kind_Section_,
  positionIn__Run,
  type _Place_Text_,
  placeIn__Line,
  textOf__Line,
  isSame__Id_Text,
  type _Module_Words_,
  askingAt__ViewModel,
  type _Menu_ViewModel_,
  type _Item_Menu_,
  type _Target_Request_,
  type __BASE_Target_Request_,
  type _Selected_Text_,
  type _Piece_Text_,
  type _Form_Request_
} from "./ViewModel_TextEditor.ts"
import type {
  _Id_Text_,
  _Range_Text_,
  _Position_Text_
} from "./Model_TextEditor.ts"
import type {
  _Request_Edit_,
  _Places_Caret_
} from "./Editing_TextEditor.ts"
import { CONTROLS__TEXTEDITOR } from "./Controls_TextEditor.ts"

export {
  _Viewer_TextEditor_,
  type _Api__Viewer_TextEditor_,
  type _Module_TextEditor_,
  type _Adapter_Event_,
  type _State__Viewer_TextEditor_,
  type _Command_TextEditor_,
  type __BASE_Command_,
  type _POINT_Command_,
  type _JUMP_Command_,
  type _FOLD_Command_,
  type _DRAFT_Command_,
  type _ACT_Command_,
  type _SEND_Command_,
  type _OPEN_MENU__Command_,
  type _STEP_MENU__Command_,
  type _CHOOSE_MENU__Command_,
  type _CLOSE_MENU__Command_,
  type _SEND_REQUEST__Command_,
  type _CLOSE_REQUEST__Command_,
  type _DISCARD_Command_,
  type _VISIT_Command_,
  type _PLACE_Command_,
  type _DRAG_Command_,
  type _RELEASE_Command_,
  type _MOVE_Command_,
  type _EXTEND_Command_,
  type _INSERT_Command_,
  type _REPLACE_Command_,
  type _DELETE_Command_,
  type _UNDO_Command_,
  type _REDO_Command_,
  type _COPY_Command_,
  type _CUT_Command_,
  type _PASTE_Command_,
  type _Answer_Edit_,
  type _Asked_Host_,
  type __BASE_Asked_Host_,
  type _ACTION_Asked_Host_,
  type _REQUEST_Asked_Host_,
  type _Answer_Dispatch_,
  type _Unit_Move_,
  type _Direction_Move_,
  type _HandlerMap__TextEditor_,
  HANDLERMAP__TEXTEDITOR
}

class _Viewer_TextEditor_ {
  containerElement: HTMLElement
  view: _View_TextEditor_
  modules: Array<_Module_TextEditor_>
  module_Words: _Module_Words_
  adapters: Array<_Adapter_Event_>
  state: _State__Viewer_TextEditor_
  request_Draw: number | null
  point_Screen: _Point_Screen_ | null
  edit: (request_Edit: _Request_Edit_) => _Answer_Edit_ | null
  ask: (asked_Host: _Asked_Host_) => void
  editContext: EditContext
  buffer: _Buffer_Edit_ | null
  isComposing: boolean

  constructor({
    containerElement,
    componentMap,
    modules,
    module_Words,
    viewModel_TextEditor,
    edit,
    ask
  }: _Api__Viewer_TextEditor_) {
    this.containerElement = containerElement
    this.edit = edit
    this.ask = ask
    this.editContext = new EditContext()
    this.buffer = null
    this.isComposing = false
    this.view = new _View_TextEditor_({
      containerElement: this.containerElement,
      componentMap
    })
    this.modules = modules
    this.module_Words = module_Words
    this.state = {
      viewModel_TextEditor,
      source_Pointed: null,
      place_Pointed: null,
      target_Pointed: null,
      target_Revealed: null,
      ranges_Folded: [],
      range_Peeked: null,
      items_Drafted: [],
      focus_Draft: null,
      visit_Item: null,
      selection: null,
      isSelecting: false,
      x_Goal: null,
      isRevealing_Caret: false,
      isFocusing_Input: false,
      menu: null,
      request: null,
      focus_Asking: null
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
    this.editContext.addEventListener(
      "textupdate",
      (event) => this.type(event)
    )
    this.editContext.addEventListener(
      "compositionstart",
      () => {
        this.isComposing = true
      }
    )
    this.editContext.addEventListener(
      "compositionend",
      () => {
        this.isComposing = false
        this.tell()
      }
    )
    this.editContext.addEventListener(
      "characterboundsupdate",
      (event) => {
        const rect = this.containerElement.querySelector(".caret_htmlView")?.getBoundingClientRect() ?? this.containerElement.getBoundingClientRect()
        this.editContext.updateCharacterBounds(
          event.rangeStart,
          Array.from(
            {
              length: event.rangeEnd - event.rangeStart
            },
            () => rect
          )
        )
      }
    )
    this.view.draw(viewModelOf__State(this.state))
    this.tell()
  }

  type(
    event: TextUpdateEvent
  ): void {
    const buffer = this.buffer
    const state_Before = this.state
    if (buffer !== null && (buffer.isSelection_Inside || this.isComposing)) {
      this.buffer = {
        ...buffer,
        text: buffer.text.slice(
          0,
          event.updateRangeStart
        ) + event.text + buffer.text.slice(event.updateRangeEnd)
      }
      this.dispatch({
        kind: "REPLACE",
        id_Text: buffer.id_Text,
        range: {
          from: positionIn__Buffer({
            buffer_Edit: buffer,
            offset: event.updateRangeStart
          }),
          to: positionIn__Buffer({
            buffer_Edit: buffer,
            offset: event.updateRangeEnd
          })
        },
        text: event.text
      })
    } else {
      this.dispatch({
        kind: "INSERT",
        text: event.text,
        isTyping: true
      })
    }
    if (this.state === state_Before) this.tell()
  }

  tell(): void {
    const element_Root = this.containerElement.querySelector(".htmlView_editor")
    const element_Input = element_Root?.querySelector(":scope > .input_htmlView")
    if (element_Input instanceof HTMLElement && element_Input.editContext !== this.editContext) element_Input.editContext = this.editContext
    if (this.isComposing) return
    this.buffer = bufferOf__ViewModel({
      viewModel_TextEditor: viewModelOf__State(this.state),
      selection_TextEditor: this.state.selection
    })
    const text = this.buffer?.text ?? ""
    if (this.editContext.text !== text) {
      this.editContext.updateText(
        0,
        this.editContext.text.length,
        text
      )
    }
    const start = this.buffer?.selectionStart ?? 0
    const end = this.buffer?.selectionEnd ?? 0
    if (this.editContext.selectionStart !== start || this.editContext.selectionEnd !== end) {
      this.editContext.updateSelection(
        start,
        end
      )
    }
    if (element_Root instanceof HTMLElement) this.editContext.updateControlBounds(element_Root.getBoundingClientRect())
    const rect_Caret = this.containerElement.querySelector(".caret_htmlView")?.getBoundingClientRect()
    if (rect_Caret !== undefined) this.editContext.updateSelectionBounds(rect_Caret)
  }

  show(
    viewModel_TextEditor: _ViewModel_TextEditor_
  ): void {
    const isDrawn_Selection = selectedAt__ViewModel({
      viewModel_TextEditor,
      selection_TextEditor: this.state.selection
    }).selection !== null
    this.state = {
      ...this.state,
      viewModel_TextEditor,
      selection: isDrawn_Selection ? this.state.selection : null
    }
    this.tell()
    this.drawOnNextFrame()
  }

  hear(
    event: Event
  ): void {
    for (const adapter of this.adapters.filter((adapter_Each) => adapter_Each.event === event.type)) {
      const command = adapter.commandOf__Event(event)
      if (command === null) continue
      const answer_Dispatch = this.dispatch(command)
      if (event instanceof ClipboardEvent) {
        event.preventDefault()
        if (answer_Dispatch.text_Clipboard !== null) {
          event.clipboardData?.setData(
            "text/plain",
            answer_Dispatch.text_Clipboard
          )
        }
      }
      return
    }
  }

  dispatch(
    command: _Command_TextEditor_
  ): _Answer_Dispatch_ {
    if (command.kind === "POINT") this.point_Screen = command.point_Screen
    const text_Clipboard = command.kind === "COPY" || command.kind === "CUT"
      ? textOf__Selection(viewModelOf__State(this.state))
      : null
    const state = stateAfter__Command({
      state: this.state,
      command,
      layout_View: this.view,
      module_Words: this.module_Words,
      edit_View: this.edit,
      ask_View: this.ask
    })
    if (state !== this.state) {
      this.state = state
      this.tell()
      this.drawOnNextFrame()
    }
    if (this.state.isFocusing_Input) {
      this.view.focusInput()
      this.state = {
        ...this.state,
        isFocusing_Input: false
      }
    }
    return {
      text_Clipboard
    }
  }

  drawOnNextFrame(): void {
    if (this.request_Draw !== null) return
    this.request_Draw = requestAnimationFrame(() => {
      this.request_Draw = null
      this.view.draw(viewModelOf__State(this.state))
      this.tell()
      if (this.state.focus_Draft !== null) {
        this.view.focusDraft(this.state.focus_Draft)
        this.state = {
          ...this.state,
          focus_Draft: null
        }
      }
      if (this.state.focus_Asking !== null) {
        this.view.focusAsking(this.state.focus_Asking)
        this.state = {
          ...this.state,
          focus_Asking: null
        }
      }
      if (this.state.isRevealing_Caret) {
        this.view.revealCaret()
        this.state = {
          ...this.state,
          isRevealing_Caret: false
        }
      }
      if (this.state.visit_Item !== null) {
        this.view.visit(this.state.visit_Item)
        this.state = {
          ...this.state,
          visit_Item: null
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

interface _Api__Viewer_TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
  modules: Array<_Module_TextEditor_>
  module_Words: _Module_Words_
  viewModel_TextEditor: _ViewModel_TextEditor_
  edit: (request_Edit: _Request_Edit_) => _Answer_Edit_ | null
  ask: (asked_Host: _Asked_Host_) => void
}

interface _Answer_Edit_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  selection: _Selection_TextEditor_
}

type _Asked_Host_ = _ACTION_Asked_Host_ | _REQUEST_Asked_Host_

interface __BASE_Asked_Host_<Kind extends string> {
  kind: Kind
}

interface _ACTION_Asked_Host_ extends __BASE_Asked_Host_<"ACTION"> {
  source: string
  command: string
  notes: string | null
  selected: _Selected_Text_ | null
}

interface _REQUEST_Asked_Host_ extends __BASE_Asked_Host_<"REQUEST"> {
  selected: _Selected_Text_ | null
  notes: string
}

interface _Buffer_Edit_ {
  id_Text: _Id_Text_
  position: _Position_Text_
  text: string
  selectionStart: number
  selectionEnd: number
  isSelection_Inside: boolean
}

interface _Answer_Dispatch_ {
  text_Clipboard: string | null
}

interface _Module_TextEditor_ {
  name: string
  adapters: Array<_Adapter_Event_>
}

interface _Adapter_Event_ {
  event: string
  commandOf__Event: (event: Event) => _Command_TextEditor_ | null
}

type _Command_TextEditor_ = _POINT_Command_ | _JUMP_Command_ | _FOLD_Command_ | _DRAFT_Command_ | _ACT_Command_ | _SEND_Command_ | _OPEN_MENU__Command_ | _STEP_MENU__Command_ | _CHOOSE_MENU__Command_ | _CLOSE_MENU__Command_ | _SEND_REQUEST__Command_ | _CLOSE_REQUEST__Command_ | _DISCARD_Command_ | _VISIT_Command_ | _PLACE_Command_ | _DRAG_Command_ | _RELEASE_Command_ | _MOVE_Command_ | _EXTEND_Command_ | _INSERT_Command_ | _REPLACE_Command_ | _DELETE_Command_ | _UNDO_Command_ | _REDO_Command_ | _COPY_Command_ | _CUT_Command_ | _PASTE_Command_

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
  id_Item: _Id_Item_
}

interface _ACT_Command_ extends __BASE_Command_<"ACT"> {
  id_Item: _Id_Item_
  command: string
}

interface _SEND_Command_ extends __BASE_Command_<"SEND"> {
  id_Item: _Id_Item_
  command: string
  notes: string
}

interface _OPEN_MENU__Command_ extends __BASE_Command_<"OPEN_MENU"> {
  point_Screen: _Point_Screen_ | null
}

interface _STEP_MENU__Command_ extends __BASE_Command_<"STEP_MENU"> {
  direction: _Direction_Move_
}

interface _CHOOSE_MENU__Command_ extends __BASE_Command_<"CHOOSE_MENU"> {
  index: number
}

interface _CLOSE_MENU__Command_ extends __BASE_Command_<"CLOSE_MENU"> {}

interface _SEND_REQUEST__Command_ extends __BASE_Command_<"SEND_REQUEST"> {
  notes: string
}

interface _CLOSE_REQUEST__Command_ extends __BASE_Command_<"CLOSE_REQUEST"> {}

interface _DISCARD_Command_ extends __BASE_Command_<"DISCARD"> {
  id_Item: _Id_Item_
}

interface _VISIT_Command_ extends __BASE_Command_<"VISIT"> {
  visit_Item: _Visit_Item_
}

interface _PLACE_Command_ extends __BASE_Command_<"PLACE"> {
  point_Screen: _Point_Screen_
  isExtending: boolean
}

interface _DRAG_Command_ extends __BASE_Command_<"DRAG"> {
  point_Screen: _Point_Screen_
}

interface _RELEASE_Command_ extends __BASE_Command_<"RELEASE"> {}

interface _MOVE_Command_ extends __BASE_Command_<"MOVE"> {
  by: _Unit_Move_
  direction: _Direction_Move_
}

interface _EXTEND_Command_ extends __BASE_Command_<"EXTEND"> {
  by: _Unit_Move_
  direction: _Direction_Move_
}

interface _INSERT_Command_ extends __BASE_Command_<"INSERT"> {
  text: string
  isTyping: boolean
}

interface _REPLACE_Command_ extends __BASE_Command_<"REPLACE"> {
  id_Text: _Id_Text_
  range: _Range_Text_
  text: string
}

interface _DELETE_Command_ extends __BASE_Command_<"DELETE"> {
  by: _Unit_Move_
  direction: _Direction_Move_
}

interface _UNDO_Command_ extends __BASE_Command_<"UNDO"> {}

interface _REDO_Command_ extends __BASE_Command_<"REDO"> {}

interface _COPY_Command_ extends __BASE_Command_<"COPY"> {}

interface _CUT_Command_ extends __BASE_Command_<"CUT"> {}

interface _PASTE_Command_ extends __BASE_Command_<"PASTE"> {
  text: string
}

type _Unit_Move_ = "CHARACTER" | "WORD" | "LINE" | "EDGE"

type _Direction_Move_ = "BACKWARD" | "FORWARD"

interface _State__Viewer_TextEditor_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  source_Pointed: string | null
  place_Pointed: string | null
  target_Pointed: _Target_Note_ | null
  target_Revealed: _Target_Note_ | null
  ranges_Folded: Array<_Range_Lines_>
  range_Peeked: _Range_Lines_ | null
  items_Drafted: Array<_Id_Item_>
  focus_Draft: _Focus_Draft_ | null
  visit_Item: _Visit_Item_ | null
  selection: _Selection_TextEditor_ | null
  isSelecting: boolean
  x_Goal: number | null
  isRevealing_Caret: boolean
  isFocusing_Input: boolean
  menu: _Menu_ViewModel_ | null
  request: _Form_Request_ | null
  focus_Asking: _Focus_Asking_ | null
}


function eventsOf__Adapters(
  adapters: Array<_Adapter_Event_>
): Array<string> {
  return [...new Set(adapters.map((adapter) => adapter.event))]
}

function viewModelOf__State(
  state: _State__Viewer_TextEditor_
): _ViewModel_TextEditor_ {
  return askingAt__ViewModel({
    viewModel_TextEditor: selectedOf__State(state),
    menu: state.menu,
    request: state.request
  })
}

function selectedOf__State(
  state: _State__Viewer_TextEditor_
): _ViewModel_TextEditor_ {
  return selectedAt__ViewModel({
    viewModel_TextEditor: pointedAt__ViewModel({
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
    }),
    selection_TextEditor: state.selection
  })
}

interface _Api___stateAfter__Command_<Kind extends _Command_TextEditor_["kind"]> {
  state: _State__Viewer_TextEditor_
  command: Extract<
    _Command_TextEditor_,
    __BASE_Command_<Kind>
  >
  layout_View: _Layout_View_
  module_Words: _Module_Words_
  edit_View: (request_Edit: _Request_Edit_) => _Answer_Edit_ | null
  ask_View: (asked_Host: _Asked_Host_) => void
}

function stateAfter__Command<Kind extends _Command_TextEditor_["kind"]>({
  state,
  command,
  layout_View,
  module_Words,
  edit_View,
  ask_View
}: _Api___stateAfter__Command_<Kind>): _State__Viewer_TextEditor_ {
  const handle = HANDLERMAP__TEXTEDITOR[command.kind]
  return handle({
    state,
    command,
    layout_View,
    module_Words,
    edit_View,
    ask_View
  })
}

function POINT_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"POINT">): _State__Viewer_TextEditor_ {
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
}: _Api___stateAfter__Command_<"JUMP">): _State__Viewer_TextEditor_ {
  return {
    ...state,
    target_Revealed: command.target_Note
  }
}

function FOLD_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"FOLD">): _State__Viewer_TextEditor_ {
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
}: _Api___stateAfter__Command_<"DRAFT">): _State__Viewer_TextEditor_ {
  const isOpen = state.items_Drafted.some((id_Item) => isSame__Id_Item({
    id_Item,
    id_Item_Other: command.id_Item
  }))
  return {
    ...state,
    items_Drafted: isOpen
      ? state.items_Drafted
      : [
        ...state.items_Drafted,
        command.id_Item
      ],
    focus_Draft: {
      id_Item: command.id_Item,
      part: "NOTES"
    }
  }
}

function ACT_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"ACT">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "ACTION",
    source: command.id_Item.source,
    command: command.command,
    notes: null,
    selected: null
  })
  return state
}

function SEND_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"SEND">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "ACTION",
    source: command.id_Item.source,
    command: command.command,
    notes: command.notes,
    selected: null
  })
  return closedAt__State({
    state,
    id_Item: command.id_Item
  })
}

function OPEN_MENU_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"OPEN_MENU">): _State__Viewer_TextEditor_ {
  const viewModel_TextEditor = viewModelOf__State(state)
  const caret = command.point_Screen === null && viewModel_TextEditor.selection !== null
    ? layout_View.caretOf(viewModel_TextEditor.selection.head)
    : null
  const point_Screen = command.point_Screen ?? (caret === null
    ? null
    : {
      x: caret.x,
      y: caret.bottom
    })
  if (point_Screen === null) return state
  const [item_First, ...items_Rest] = itemsOf__Menu({
    viewModel_TextEditor,
    source_Pointed: command.point_Screen === null ? null : layout_View.sourceAt(command.point_Screen)
  })
  return item_First === undefined
    ? state
    : {
      ...state,
      menu: {
        point_Screen,
        items: [
          item_First,
          ...items_Rest
        ],
        index_Focused: 0
      },
      focus_Asking: "MENU"
    }
}

interface _Api___itemsOf__Menu_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  source_Pointed: string | null
}

function itemsOf__Menu({
  viewModel_TextEditor,
  source_Pointed
}: _Api___itemsOf__Menu_): Array<_Item_Menu_> {
  const selection_Drawn = viewModel_TextEditor.selection
  const pieces = selection_Drawn === null
    ? []
    : joinedOf__Pieces(piecesOf__Drawn({
      viewModel_TextEditor,
      position_Drawn_From: selection_Drawn.anchor,
      position_Drawn_To: selection_Drawn.head
    })).filter((piece) => !piece.isEmpty)
  const [piece_First, ...pieces_Rest] = pieces
  const pieceOf = (piece: _Piece_Drawn_): _Piece_Text_ => ({
    id_Text: piece.id_Text,
    range: {
      from: piece.from,
      to: piece.to
    }
  })
  const selected: _Selected_Text_ | null = piece_First === undefined
    ? null
    : {
      pieces: [
        pieceOf(piece_First),
        ...pieces_Rest.map(pieceOf)
      ],
      text: textOf__Selection(viewModel_TextEditor) ?? ""
    }
  const items_Proposals = viewModel_TextEditor.blocks.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME"
    ? block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" ? part_Frame.items : [])
    : [])
  const reviseOf = (source: string) => {
    const item_Proposals = items_Proposals.find((item_Each) => item_Each.source === source && item_Each.state === "OPEN")
    const action_Item = item_Proposals?.actions.find((action_Each) => action_Each.stateAfter === "REQUESTED")
    return item_Proposals === undefined || action_Item === undefined
      ? null
      : {
        title: item_Proposals.title,
        command: action_Item.command
      }
  }
  const source_Words = piece_First !== undefined && piece_First.id_Text.kind === "CHANGE" && pieces.every((piece) => piece.id_Text.kind === "CHANGE" && piece.id_Text.source === (piece_First.id_Text.kind === "CHANGE" ? piece_First.id_Text.source : null))
    ? piece_First.id_Text.source
    : null
  const revise_Words = source_Words === null ? null : reviseOf(source_Words)
  if (source_Words !== null && revise_Words !== null) {
    return [
      {
        label: `Note on these words of “${revise_Words.title}”`,
        quote: selected?.text ?? null,
        target: {
          kind: "PROPOSAL",
          source: source_Words,
          command: revise_Words.command,
          selected
        }
      },
      {
        label: `Note on “${revise_Words.title}”`,
        quote: null,
        target: {
          kind: "PROPOSAL",
          source: source_Words,
          command: revise_Words.command,
          selected: null
        }
      }
    ]
  }
  const revise_Pointed = source_Pointed === null ? null : reviseOf(source_Pointed)
  return [
    selected === null
      ? {
        label: "Request a change to this document",
        quote: null,
        target: {
          kind: "DOCUMENT"
        }
      }
      : {
        label: "Request a change",
        quote: selected.text,
        target: {
          kind: "SELECTION",
          selected
        }
      },
    ...(source_Pointed === null || revise_Pointed === null
      ? []
      : [
        {
          label: `Note on “${revise_Pointed.title}”`,
          quote: null,
          target: {
            kind: "PROPOSAL" as const,
            source: source_Pointed,
            command: revise_Pointed.command,
            selected: null
          }
        }
      ])
  ]
}

function STEP_MENU_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"STEP_MENU">): _State__Viewer_TextEditor_ {
  if (state.menu === null) return state
  const count = state.menu.items.length
  return {
    ...state,
    menu: {
      ...state.menu,
      index_Focused: (state.menu.index_Focused + (command.direction === "FORWARD" ? 1 : -1) + count) % count
    },
    focus_Asking: "MENU"
  }
}

function CHOOSE_MENU_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"CHOOSE_MENU">): _State__Viewer_TextEditor_ {
  const item_Menu = state.menu?.items[command.index]
  return state.menu === null || item_Menu === undefined
    ? state
    : {
      ...state,
      menu: null,
      request: {
        point_Screen: state.menu.point_Screen,
        label: item_Menu.label,
        quote: item_Menu.quote,
        target: item_Menu.target
      },
      focus_Asking: "REQUEST"
    }
}

function CLOSE_MENU_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"CLOSE_MENU">): _State__Viewer_TextEditor_ {
  return state.menu === null
    ? state
    : {
      ...state,
      menu: null,
      isFocusing_Input: true
    }
}

function SEND_REQUEST_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"SEND_REQUEST">): _State__Viewer_TextEditor_ {
  if (state.request === null || command.notes.trim() === "") return state
  ask_View(ASKEDMAP__KIND_TARGET[state.request.target.kind]({
    target: state.request.target,
    notes: command.notes
  } as never))
  return {
    ...state,
    request: null,
    isFocusing_Input: true
  }
}

type _AskedMap__Kind_Target_ = {
  [Kind in _Target_Request_["kind"]]: (api_Asked: _Api___asked__Kind_Target_<Kind>) => _Asked_Host_
}

interface _Api___asked__Kind_Target_<Kind extends _Target_Request_["kind"]> {
  target: Extract<
    _Target_Request_,
    __BASE_Target_Request_<Kind>
  >
  notes: string
}

const ASKEDMAP__KIND_TARGET: _AskedMap__Kind_Target_ = {
  SELECTION: ({
    target,
    notes
  }) => ({
    kind: "REQUEST",
    selected: target.selected,
    notes
  }),
  DOCUMENT: ({
    notes
  }) => ({
    kind: "REQUEST",
    selected: null,
    notes
  }),
  PROPOSAL: ({
    target,
    notes
  }) => ({
    kind: "ACTION",
    source: target.source,
    command: target.command,
    notes,
    selected: target.selected
  })
}

function CLOSE_REQUEST_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"CLOSE_REQUEST">): _State__Viewer_TextEditor_ {
  return state.request === null
    ? state
    : {
      ...state,
      request: null,
      isFocusing_Input: true
    }
}

function DISCARD_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"DISCARD">): _State__Viewer_TextEditor_ {
  return closedAt__State({
    state,
    id_Item: command.id_Item
  })
}

function VISIT_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"VISIT">): _State__Viewer_TextEditor_ {
  return {
    ...state,
    visit_Item: command.visit_Item
  }
}

function PLACE_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"PLACE">): _State__Viewer_TextEditor_ {
  const position_Drawn = layout_View.positionAt(command.point_Screen)
  const viewModel_TextEditor = viewModelOf__State(state)
  const anchor_Kept = command.isExtending && viewModel_TextEditor.selection !== null ? state.selection?.anchor ?? null : null
  const end_Selection = position_Drawn === null
    ? null
    : endAt__Position({
      viewModel_TextEditor,
      position_Drawn: anchor_Kept === null || viewModel_TextEditor.selection === null
        ? position_Drawn
        : keptIn__Run({
          viewModel_TextEditor,
          position_Drawn,
          id_Run: viewModel_TextEditor.selection.anchor.id_Run
        }),
      id_Text_Kept: anchor_Kept?.id_Text ?? null
    })
  return end_Selection === null
    ? state
    : {
      ...state,
      selection: {
        anchor: anchor_Kept ?? end_Selection,
        head: end_Selection
      },
      isSelecting: true,
      x_Goal: null,
      isFocusing_Input: true
    }
}

function DRAG_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"DRAG">): _State__Viewer_TextEditor_ {
  if (!state.isSelecting || state.selection === null) return state
  const position_Drawn = layout_View.positionAt(command.point_Screen)
  const viewModel_TextEditor = viewModelOf__State(state)
  const end_Selection = position_Drawn === null || viewModel_TextEditor.selection === null
    ? null
    : endAt__Position({
      viewModel_TextEditor,
      position_Drawn: keptIn__Run({
        viewModel_TextEditor,
        position_Drawn,
        id_Run: viewModel_TextEditor.selection.anchor.id_Run
      }),
      id_Text_Kept: state.selection.anchor.id_Text
    })
  return end_Selection === null || isSame__End({
    end_Selection,
    end_Selection_Other: state.selection.head
  })
    ? state
    : {
      ...state,
      selection: {
        anchor: state.selection.anchor,
        head: end_Selection
      }
    }
}

function RELEASE_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"RELEASE">): _State__Viewer_TextEditor_ {
  return state.isSelecting
    ? {
      ...state,
      isSelecting: false
    }
    : state
}

function MOVE_stateAfter__Command({
  state,
  command,
  layout_View,
  module_Words
}: _Api___stateAfter__Command_<"MOVE">): _State__Viewer_TextEditor_ {
  return movedAt__State({
    state,
    by: command.by,
    direction: command.direction,
    isExtending: false,
    layout_View,
    module_Words
  })
}

function EXTEND_stateAfter__Command({
  state,
  command,
  layout_View,
  module_Words
}: _Api___stateAfter__Command_<"EXTEND">): _State__Viewer_TextEditor_ {
  return movedAt__State({
    state,
    by: command.by,
    direction: command.direction,
    isExtending: true,
    layout_View,
    module_Words
  })
}

function INSERT_stateAfter__Command({
  state,
  command,
  edit_View
}: _Api___stateAfter__Command_<"INSERT">): _State__Viewer_TextEditor_ {
  return insertedAt__State({
    state,
    multilineText: command.text,
    isTyping: command.isTyping,
    edit_View
  })
}

function REPLACE_stateAfter__Command({
  state,
  command,
  edit_View
}: _Api___stateAfter__Command_<"REPLACE">): _State__Viewer_TextEditor_ {
  const isAt_Caret = state.selection !== null && isSame__End({
    end_Selection: state.selection.anchor,
    end_Selection_Other: state.selection.head
  }) && isSame__Id_Text({
    id_Text: command.id_Text,
    id_Text_Other: state.selection.head.id_Text
  }) && [
    command.range.from,
    command.range.to
  ].every((position) => position.line === state.selection?.head.position.line && position.offset === state.selection.head.position.offset)
  if (isAt_Caret) {
    return insertedAt__State({
      state,
      multilineText: command.text,
      isTyping: true,
      edit_View
    })
  }
  return state.selection === null
    ? state
    : editedAt__State({
      state,
      request_Edit: {
        kind: "TEXT",
        id_Text: command.id_Text,
        range: command.range,
        multilineText: command.text,
        id_Run: state.selection.head.id_Run,
        selection_Before: state.selection,
        isTyping: true,
        isProposed: false,
        places_Caret: null
      },
      edit_View
    })
}

function DELETE_stateAfter__Command({
  state,
  command,
  layout_View,
  module_Words,
  edit_View
}: _Api___stateAfter__Command_<"DELETE">): _State__Viewer_TextEditor_ {
  const viewModel_TextEditor = viewModelOf__State(state)
  const selection_Drawn = viewModel_TextEditor.selection
  if (state.selection === null || selection_Drawn === null) return state
  if (orderOf__Positions_Drawn({
    viewModel_TextEditor,
    position_Drawn: selection_Drawn.head,
    position_Drawn_Other: selection_Drawn.anchor
  }) !== 0) {
    return insertedAt__State({
      state,
      multilineText: "",
      isTyping: false,
      edit_View
    })
  }
  const position_Stepped = STEPMAP__UNIT_MOVE[command.by]({
    viewModel_TextEditor,
    position_Drawn: selection_Drawn.head,
    direction: command.direction,
    x_Goal: null,
    layout_View,
    module_Words
  })
  if (position_Stepped === null || position_Stepped.id_Run !== selection_Drawn.head.id_Run) return state
  const isForward = command.direction === "FORWARD"
  const request_Edit = requestOf__Drawn({
    viewModel_TextEditor,
    position_Drawn_From: isForward ? selection_Drawn.head : position_Stepped,
    position_Drawn_To: isForward ? position_Stepped : selection_Drawn.head,
    multilineText: "",
    selection_Before: state.selection,
    isTyping: false
  })
  return request_Edit === null
    ? state
    : editedAt__State({
      state,
      request_Edit,
      edit_View
    })
}

function UNDO_stateAfter__Command({
  state,
  edit_View
}: _Api___stateAfter__Command_<"UNDO">): _State__Viewer_TextEditor_ {
  return editedAt__State({
    state,
    request_Edit: {
      kind: "UNDO"
    },
    edit_View
  })
}

function REDO_stateAfter__Command({
  state,
  edit_View
}: _Api___stateAfter__Command_<"REDO">): _State__Viewer_TextEditor_ {
  return editedAt__State({
    state,
    request_Edit: {
      kind: "REDO"
    },
    edit_View
  })
}

function COPY_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"COPY">): _State__Viewer_TextEditor_ {
  return state
}

function CUT_stateAfter__Command({
  state,
  edit_View
}: _Api___stateAfter__Command_<"CUT">): _State__Viewer_TextEditor_ {
  return insertedAt__State({
    state,
    multilineText: "",
    isTyping: false,
    edit_View
  })
}

function PASTE_stateAfter__Command({
  state,
  command,
  edit_View
}: _Api___stateAfter__Command_<"PASTE">): _State__Viewer_TextEditor_ {
  return insertedAt__State({
    state,
    multilineText: command.text,
    isTyping: false,
    edit_View
  })
}

interface _Api___insertedAt__State_ {
  state: _State__Viewer_TextEditor_
  multilineText: string
  isTyping: boolean
  edit_View: (request_Edit: _Request_Edit_) => _Answer_Edit_ | null
}

function insertedAt__State({
  state,
  multilineText,
  isTyping,
  edit_View
}: _Api___insertedAt__State_): _State__Viewer_TextEditor_ {
  const viewModel_TextEditor = viewModelOf__State(state)
  const selection_Drawn = viewModel_TextEditor.selection
  if (state.selection === null || selection_Drawn === null) return state
  const request_Edit: _Request_Edit_ | null = isSame__End({
    end_Selection: state.selection.anchor,
    end_Selection_Other: state.selection.head
  })
    ? {
      kind: "TEXT",
      id_Text: state.selection.head.id_Text,
      range: {
        from: state.selection.head.position,
        to: state.selection.head.position
      },
      multilineText,
      id_Run: selection_Drawn.head.id_Run,
      selection_Before: state.selection,
      isTyping,
      isProposed: false,
      places_Caret: placesOf__Caret({
        viewModel_TextEditor,
        position_Drawn: selection_Drawn.head
      })
    }
    : requestOf__Drawn({
      viewModel_TextEditor,
      position_Drawn_From: selection_Drawn.anchor,
      position_Drawn_To: selection_Drawn.head,
      multilineText,
      selection_Before: state.selection,
      isTyping
    })
  return request_Edit === null
    ? state
    : editedAt__State({
      state,
      request_Edit,
      edit_View
    })
}

interface _Api___placesOf__Caret_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn: _Position_Drawn_
}

function placesOf__Caret({
  viewModel_TextEditor,
  position_Drawn
}: _Api___placesOf__Caret_): _Places_Caret_ | null {
  const line_Run = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === position_Drawn.id_Run)?.lines[position_Drawn.position.line]
  const offset = position_Drawn.position.offset
  if (line_Run === undefined || line_Run.origins.some((origin_Line) => origin_Line.from < offset && offset < origin_Line.to)) return null
  const text_Line = textOf__Line(line_Run)
  const origin_Before = line_Run.origins.findLast((origin_Line) => origin_Line.from < origin_Line.to && origin_Line.to === offset)
  const origin_After = line_Run.origins.find((origin_Line) => origin_Line.from < origin_Line.to && origin_Line.from === offset)
  return origin_Before === undefined && origin_After === undefined
    ? null
    : {
      place_Before: origin_Before === undefined
        ? null
        : {
          id_Text: origin_Before.id_Text,
          position: {
            line: origin_Before.position.line,
            offset: origin_Before.position.offset + Array.from(text_Line.slice(
              origin_Before.from,
              origin_Before.to
            )).length
          }
        },
      place_After: origin_After === undefined
        ? null
        : {
          id_Text: origin_After.id_Text,
          position: origin_After.position
        }
    }
}

interface _Api___editedAt__State_ {
  state: _State__Viewer_TextEditor_
  request_Edit: _Request_Edit_
  edit_View: (request_Edit: _Request_Edit_) => _Answer_Edit_ | null
}

function editedAt__State({
  state,
  request_Edit,
  edit_View
}: _Api___editedAt__State_): _State__Viewer_TextEditor_ {
  const viewModel_TextEditor = viewModelOf__State(state)
  const section = request_Edit.kind === "TEXT" || request_Edit.kind === "ACROSS"
    ? sectionOf__Run({
      viewModel_TextEditor,
      id_Run: request_Edit.id_Run
    })
    : null
  if (request_Edit.kind === "TEXT" && (section === null || !EDITABLEMAP__KIND_SECTION[section][request_Edit.id_Text.kind])) return state
  if (request_Edit.kind === "ACROSS" && (section === null || !ISPROPOSEDMAP__KIND_SECTION[section])) return state
  const answer_Edit = edit_View(request_Edit.kind === "TEXT"
    ? {
      ...request_Edit,
      isProposed: section !== null && ISPROPOSEDMAP__KIND_SECTION[section]
    }
    : request_Edit)
  return answer_Edit === null
    ? state
    : {
      ...state,
      viewModel_TextEditor: answer_Edit.viewModel_TextEditor,
      selection: answer_Edit.selection,
      x_Goal: null,
      isRevealing_Caret: true
    }
}

type _EditableMap__Kind_Section_ = {
  [Kind in _Kind_Section_]: {
    [Kind_Text in _Id_Text_["kind"]]: boolean
  }
}

const EDITABLEMAP__KIND_SECTION: _EditableMap__Kind_Section_ = {
  LINES: {
    DOCUMENT: true,
    CHANGE: false
  },
  CURRENT_LINES: {
    DOCUMENT: false,
    CHANGE: false
  },
  PROPOSAL_LINES: {
    DOCUMENT: true,
    CHANGE: true
  },
  FOLDED: {
    DOCUMENT: true,
    CHANGE: true
  }
}

type _IsProposedMap__Kind_Section_ = {
  [Kind in _Kind_Section_]: boolean
}

const ISPROPOSEDMAP__KIND_SECTION: _IsProposedMap__Kind_Section_ = {
  LINES: false,
  CURRENT_LINES: false,
  PROPOSAL_LINES: true,
  FOLDED: true
}

interface _Api___requestOf__Drawn_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn_From: _Position_Drawn_
  position_Drawn_To: _Position_Drawn_
  multilineText: string
  selection_Before: _Selection_TextEditor_
  isTyping: boolean
}

function requestOf__Drawn({
  viewModel_TextEditor,
  position_Drawn_From,
  position_Drawn_To,
  multilineText,
  selection_Before,
  isTyping
}: _Api___requestOf__Drawn_): _Request_Edit_ | null {
  const [piece_First, ...pieces_Rest] = joinedOf__Pieces(piecesOf__Drawn({
    viewModel_TextEditor,
    position_Drawn_From,
    position_Drawn_To
  }))
  if (piece_First === undefined) return null
  return pieces_Rest.length === 0
    ? {
      kind: "TEXT",
      id_Text: piece_First.id_Text,
      range: {
        from: piece_First.from,
        to: piece_First.to
      },
      multilineText,
      id_Run: position_Drawn_From.id_Run,
      selection_Before,
      isTyping,
      isProposed: false,
      places_Caret: null
    }
    : {
      kind: "ACROSS",
      pieces: [
        {
          id_Text: piece_First.id_Text,
          range: {
            from: piece_First.from,
            to: piece_First.to
          }
        },
        ...pieces_Rest.map((piece) => ({
          id_Text: piece.id_Text,
          range: {
            from: piece.from,
            to: piece.to
          }
        }))
      ],
      multilineText,
      id_Run: position_Drawn_From.id_Run,
      selection_Before,
      isTyping
    }
}

function joinedOf__Pieces(
  pieces: Array<_Piece_Drawn_>
): Array<_Piece_Drawn_> {
  return pieces.reduce<Array<_Piece_Drawn_>>(
    (
      pieces_Joined,
      piece
    ) => {
      const piece_Before = pieces_Joined.at(-1)
      return piece_Before !== undefined && isSame__Id_Text({
        id_Text: piece_Before.id_Text,
        id_Text_Other: piece.id_Text
      }) && isContinuous__Pieces([
        piece_Before,
        piece
      ])
        ? [
          ...pieces_Joined.slice(
            0,
            -1
          ),
          {
            ...piece,
            from: piece_Before.from,
            isEmpty: piece_Before.isEmpty && piece.isEmpty
          }
        ]
        : [
          ...pieces_Joined,
          piece
        ]
    },
    []
  )
}

interface _Api___piecesOf__Drawn_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn_From: _Position_Drawn_
  position_Drawn_To: _Position_Drawn_
}

interface _Piece_Drawn_ {
  id_Text: _Id_Text_
  line: number
  from: _Position_Text_
  to: _Position_Text_
  isEmpty: boolean
}

function piecesOf__Drawn({
  viewModel_TextEditor,
  position_Drawn_From,
  position_Drawn_To
}: _Api___piecesOf__Drawn_): Array<_Piece_Drawn_> {
  const run_Lines = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === position_Drawn_From.id_Run)
  if (run_Lines === undefined || position_Drawn_To.id_Run !== run_Lines.id) return []
  const isBackward = orderOf__Positions_Run({
    position: position_Drawn_To.position,
    position_Other: position_Drawn_From.position
  }) < 0
  const start = isBackward ? position_Drawn_To.position : position_Drawn_From.position
  const end = isBackward ? position_Drawn_From.position : position_Drawn_To.position
  const pieces = run_Lines.lines.slice(
    start.line,
    end.line + 1
  ).flatMap((
    line_Run,
    index
  ) => {
    const line = start.line + index
    const text_Line = textOf__Line(line_Run)
    return line_Run.origins.flatMap((origin_Line) => {
      const from = line === start.line
        ? Math.max(
          origin_Line.from,
          start.offset
        )
        : origin_Line.from
      const to = line === end.line
        ? Math.min(
          origin_Line.to,
          end.offset
        )
        : origin_Line.to
      if (from > to) return []
      const offset_From = origin_Line.position.offset + Array.from(text_Line.slice(
        origin_Line.from,
        from
      )).length
      return [
        {
          id_Text: origin_Line.id_Text,
          line,
          from: {
            line: origin_Line.position.line,
            offset: offset_From
          },
          to: {
            line: origin_Line.position.line,
            offset: offset_From + Array.from(text_Line.slice(
              from,
              to
            )).length
          },
          isEmpty: from === to
        }
      ]
    })
  })
  const isKept = (
    piece: _Piece_Drawn_ | undefined,
    piece_Beside: _Piece_Drawn_ | undefined,
    isBefore: boolean
  ) => piece === undefined || piece_Beside === undefined || !piece.isEmpty || isSame__Id_Text({
    id_Text: piece.id_Text,
    id_Text_Other: piece_Beside.id_Text
  }) && isContinuous__Pieces(isBefore
    ? [
      piece,
      piece_Beside
    ]
    : [
      piece_Beside,
      piece
    ])
  while (pieces.length > 1 && !isKept(
    pieces[0],
    pieces[1],
    true
  )) pieces.shift()
  while (pieces.length > 1 && !isKept(
    pieces.at(-1),
    pieces.at(-2),
    false
  )) pieces.pop()
  return pieces
}

function isContinuous__Pieces(
  pieces: Array<_Piece_Drawn_>
): boolean {
  return pieces.slice(1).every((
    piece,
    index
  ) => {
    const piece_Before = pieces[index]
    return piece_Before !== undefined && (piece.line === piece_Before.line
      ? piece.from.line === piece_Before.to.line && piece.from.offset === piece_Before.to.offset
      : piece.from.line === piece_Before.to.line + 1 && piece.from.offset === 0)
  })
}

function textOf__Selection(
  viewModel_TextEditor: _ViewModel_TextEditor_
): string | null {
  const selection_Drawn = viewModel_TextEditor.selection
  const run_Lines = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === selection_Drawn?.anchor.id_Run)
  if (selection_Drawn === null || run_Lines === undefined || selection_Drawn.head.id_Run !== run_Lines.id) return null
  const isBackward = orderOf__Positions_Run({
    position: selection_Drawn.head.position,
    position_Other: selection_Drawn.anchor.position
  }) < 0
  const start = isBackward ? selection_Drawn.head.position : selection_Drawn.anchor.position
  const end = isBackward ? selection_Drawn.anchor.position : selection_Drawn.head.position
  return run_Lines.lines
    .slice(
      start.line,
      end.line + 1
    )
    .map((
      line_Run,
      index
    ) => textOf__Line(line_Run).slice(
      index === 0 ? start.offset : 0,
      start.line + index === end.line ? end.offset : undefined
    ))
    .join("\n")
}

interface _Api___bufferOf__ViewModel_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  selection_TextEditor: _Selection_TextEditor_ | null
}

function bufferOf__ViewModel({
  viewModel_TextEditor,
  selection_TextEditor
}: _Api___bufferOf__ViewModel_): _Buffer_Edit_ | null {
  const selection_Drawn = viewModel_TextEditor.selection
  const line_Run = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === selection_Drawn?.head.id_Run)?.lines[selection_Drawn?.head.position.line ?? -1]
  if (selection_Drawn === null || selection_TextEditor === null || line_Run === undefined) return null
  const offset = selection_Drawn.head.position.offset
  const head = selection_TextEditor.head
  const text_Line = textOf__Line(line_Run)
  const origins_Head = line_Run.origins.filter((origin_Each) => isSame__Id_Text({
    id_Text: origin_Each.id_Text,
    id_Text_Other: head.id_Text
  }) && origin_Each.from <= offset && offset <= origin_Each.to)
  const origin_Line = origins_Head.find((origin_Each) => origin_Each.position.line === head.position.line && origin_Each.position.offset + Array.from(text_Line.slice(
    origin_Each.from,
    offset
  )).length === head.position.offset) ?? origins_Head[0]
  if (origin_Line === undefined) return null
  const anchor = selection_Drawn.anchor
  const isSelection_Inside = isSame__Id_Text({
    id_Text: selection_TextEditor.anchor.id_Text,
    id_Text_Other: head.id_Text
  }) && anchor.id_Run === selection_Drawn.head.id_Run && anchor.position.line === selection_Drawn.head.position.line && origin_Line.from <= anchor.position.offset && anchor.position.offset <= origin_Line.to
  return {
    id_Text: origin_Line.id_Text,
    position: origin_Line.position,
    text: textOf__Line(line_Run).slice(
      origin_Line.from,
      origin_Line.to
    ),
    selectionStart: (isSelection_Inside ? anchor.position.offset : offset) - origin_Line.from,
    selectionEnd: offset - origin_Line.from,
    isSelection_Inside
  }
}

interface _Api___positionIn__Buffer_ {
  buffer_Edit: _Buffer_Edit_
  offset: number
}

function positionIn__Buffer({
  buffer_Edit,
  offset
}: _Api___positionIn__Buffer_): _Position_Text_ {
  return {
    line: buffer_Edit.position.line,
    offset: buffer_Edit.position.offset + Array.from(buffer_Edit.text.slice(
      0,
      offset
    )).length
  }
}

interface _Api___endAt__Position_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn: _Position_Drawn_
  id_Text_Kept: _Id_Text_ | null
}

function endAt__Position({
  viewModel_TextEditor,
  position_Drawn,
  id_Text_Kept
}: _Api___endAt__Position_): _End_Selection_ | null {
  const run_Lines = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === position_Drawn.id_Run)
  const line_Run = run_Lines?.lines[position_Drawn.position.line]
  if (run_Lines === undefined || line_Run === undefined) return null
  const line_Run_Next = run_Lines.lines[position_Drawn.position.line + 1] ?? null
  const place_Text = (id_Text_Kept === null
    ? null
    : placeIn__Line({
      line_Run,
      line_Run_Next,
      offset: position_Drawn.position.offset,
      id_Text: id_Text_Kept
    })) ?? placeIn__Line({
    line_Run,
    line_Run_Next,
    offset: position_Drawn.position.offset,
    id_Text: null
  })
  const isDrawnAt = (place_Each: _Place_Text_) => {
    const position_Run = positionIn__Run({
      run_Lines,
      place_Text: place_Each
    })
    return position_Run !== null && position_Run.line === position_Drawn.position.line && position_Run.offset === position_Drawn.position.offset
  }
  const text_Line = textOf__Line(line_Run)
  const place_Drawn = place_Text === null || isDrawnAt(place_Text)
    ? place_Text
    : line_Run.origins.filter((origin_Line) => origin_Line.from <= position_Drawn.position.offset && position_Drawn.position.offset <= origin_Line.to).map((origin_Line) => ({
      id_Text: origin_Line.id_Text,
      position: {
        line: origin_Line.position.line,
        offset: origin_Line.position.offset + Array.from(text_Line.slice(
          origin_Line.from,
          position_Drawn.position.offset
        )).length
      }
    })).find(isDrawnAt) ?? place_Text
  return place_Drawn === null
    ? null
    : {
      id_Run: position_Drawn.id_Run,
      id_Text: place_Drawn.id_Text,
      position: place_Drawn.position
    }
}

interface _Api___keptIn__Run_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn: _Position_Drawn_
  id_Run: string
}

function keptIn__Run({
  viewModel_TextEditor,
  position_Drawn,
  id_Run
}: _Api___keptIn__Run_): _Position_Drawn_ {
  if (position_Drawn.id_Run === id_Run) return position_Drawn
  const indexOf = (id_Run_Each: string) => viewModel_TextEditor.runs.findIndex((run_Each) => run_Each.id === id_Run_Each)
  return edgeOf__Run({
    viewModel_TextEditor,
    id_Run,
    direction: indexOf(position_Drawn.id_Run) > indexOf(id_Run) ? "FORWARD" : "BACKWARD"
  }) ?? position_Drawn
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

interface _Api___movedAt__State_ {
  state: _State__Viewer_TextEditor_
  by: _Unit_Move_
  direction: _Direction_Move_
  isExtending: boolean
  layout_View: _Layout_View_
  module_Words: _Module_Words_
}

function movedAt__State({
  state,
  by,
  direction,
  isExtending,
  layout_View,
  module_Words
}: _Api___movedAt__State_): _State__Viewer_TextEditor_ {
  const viewModel_TextEditor = viewModelOf__State(state)
  const selection_Drawn = viewModel_TextEditor.selection
  if (state.selection === null || selection_Drawn === null) return state
  const order = orderOf__Positions_Drawn({
    viewModel_TextEditor,
    position_Drawn: selection_Drawn.head,
    position_Drawn_Other: selection_Drawn.anchor
  })
  if (!isExtending && order !== 0 && by === "CHARACTER") {
    const end_Selection = (order < 0) === (direction === "BACKWARD") ? state.selection.head : state.selection.anchor
    return {
      ...state,
      selection: {
        anchor: end_Selection,
        head: end_Selection
      },
      x_Goal: null,
      isRevealing_Caret: true
    }
  }
  const x_Goal = by === "LINE" ? state.x_Goal ?? layout_View.caretOf(selection_Drawn.head)?.x ?? null : null
  const position_Drawn = STEPMAP__UNIT_MOVE[by]({
    viewModel_TextEditor,
    position_Drawn: selection_Drawn.head,
    direction,
    x_Goal,
    layout_View,
    module_Words
  })
  const end_Selection = position_Drawn === null
    ? null
    : endAt__Position({
      viewModel_TextEditor,
      position_Drawn: isExtending
        ? keptIn__Run({
          viewModel_TextEditor,
          position_Drawn,
          id_Run: selection_Drawn.anchor.id_Run
        })
        : position_Drawn,
      id_Text_Kept: isExtending ? state.selection.anchor.id_Text : null
    })
  return end_Selection === null
    ? state
    : {
      ...state,
      selection: {
        anchor: isExtending ? state.selection.anchor : end_Selection,
        head: end_Selection
      },
      x_Goal,
      isRevealing_Caret: true
    }
}

interface _Api___steppedOf__Position_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn: _Position_Drawn_
  direction: _Direction_Move_
  x_Goal: number | null
  layout_View: _Layout_View_
  module_Words: _Module_Words_
}

type _StepMap__Unit_Move_ = {
  [Unit in _Unit_Move_]: (api_Step: _Api___steppedOf__Position_) => _Position_Drawn_ | null
}

const STEPMAP__UNIT_MOVE: _StepMap__Unit_Move_ = {
  CHARACTER: ({
    viewModel_TextEditor,
    position_Drawn,
    direction,
    module_Words
  }) => steppedAlong__Lines({
    viewModel_TextEditor,
    position_Drawn,
    direction,
    module_Words,
    boundariesOf: boundariesOf__Graphemes,
    isStep_Break: true
  }),
  WORD: ({
    viewModel_TextEditor,
    position_Drawn,
    direction,
    module_Words
  }) => steppedAlong__Lines({
    viewModel_TextEditor,
    position_Drawn,
    direction,
    module_Words,
    boundariesOf: boundariesOf__Words,
    isStep_Break: false
  }),
  LINE: steppedAcross__Rows,
  EDGE: edgeOf__Line
}

interface _Api___steppedAlong__Lines_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  position_Drawn: _Position_Drawn_
  direction: _Direction_Move_
  module_Words: _Module_Words_
  boundariesOf: (api_Boundaries: _Api___boundariesOf_) => Array<number>
  isStep_Break: boolean
}

interface _Api___boundariesOf_ {
  text: string
  direction: _Direction_Move_
  module_Words: _Module_Words_
}

function steppedAlong__Lines({
  viewModel_TextEditor,
  position_Drawn,
  direction,
  module_Words,
  boundariesOf,
  isStep_Break
}: _Api___steppedAlong__Lines_): _Position_Drawn_ | null {
  const runs_Lines = viewModel_TextEditor.runs.filter((run_Each) => run_Each.lines.length > 0)
  let position_At = position_Drawn
  for (;;) {
    const index_Run = runs_Lines.findIndex((run_Each) => run_Each.id === position_At.id_Run)
    const run_Lines = runs_Lines[index_Run]
    const line_Run = run_Lines?.lines[position_At.position.line]
    if (run_Lines === undefined || line_Run === undefined) return null
    const boundaries = boundariesOf({
      text: textOf__Line(line_Run),
      direction,
      module_Words
    })
    const offset = position_At.position.offset
    const boundary = direction === "FORWARD"
      ? boundaries.find((boundary_Each) => boundary_Each > offset)
      : boundaries.findLast((boundary_Each) => boundary_Each < offset)
    if (boundary !== undefined) {
      return {
        id_Run: run_Lines.id,
        position: {
          line: position_At.position.line,
          offset: boundary
        }
      }
    }
    const line_Next = position_At.position.line + (direction === "FORWARD" ? 1 : -1)
    const line_Run_Next = run_Lines.lines[line_Next]
    const run_Next = runs_Lines[index_Run + (direction === "FORWARD" ? 1 : -1)]
    const position_Next = line_Run_Next !== undefined
      ? {
        id_Run: run_Lines.id,
        position: {
          line: line_Next,
          offset: direction === "FORWARD" ? 0 : textOf__Line(line_Run_Next).length
        }
      }
      : run_Next === undefined
        ? null
        : edgeOf__Run({
          viewModel_TextEditor,
          id_Run: run_Next.id,
          direction: direction === "FORWARD" ? "BACKWARD" : "FORWARD"
        })
    if (position_Next === null || isStep_Break) return position_Next
    position_At = position_Next
  }
}

function boundariesOf__Graphemes({
  text
}: _Api___boundariesOf_): Array<number> {
  return [
    ...Array.from(
      new Intl.Segmenter(
        undefined,
        {
          granularity: "grapheme"
        }
      ).segment(text),
      (segment) => segment.index
    ),
    text.length
  ]
}

function boundariesOf__Words({
  text,
  direction,
  module_Words
}: _Api___boundariesOf_): Array<number> {
  const words = module_Words.wordsOf(text)
  return direction === "FORWARD"
    ? [
      ...words.map((word_Text) => word_Text.to),
      text.length
    ]
    : [
      0,
      ...words.map((word_Text) => word_Text.from)
    ]
}

function steppedAcross__Rows({
  position_Drawn,
  direction,
  x_Goal,
  layout_View
}: _Api___steppedOf__Position_): _Position_Drawn_ | null {
  const caret_Screen = layout_View.caretOf(position_Drawn)
  if (caret_Screen === null) return null
  const y = (caret_Screen.top + caret_Screen.bottom) / 2
  for (let step = 1; step <= 60; step = step + 1) {
    const position_Found = layout_View.positionAt({
      x: x_Goal ?? caret_Screen.x,
      y: y + (direction === "FORWARD" ? step : -step) * caret_Screen.height_Row
    })
    if (position_Found !== null) return position_Found
  }
  return null
}

function edgeOf__Line({
  viewModel_TextEditor,
  position_Drawn,
  direction
}: _Api___steppedOf__Position_): _Position_Drawn_ | null {
  const line_Run = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === position_Drawn.id_Run)?.lines[position_Drawn.position.line]
  return line_Run === undefined
    ? null
    : {
      id_Run: position_Drawn.id_Run,
      position: {
        line: position_Drawn.position.line,
        offset: direction === "FORWARD" ? textOf__Line(line_Run).length : 0
      }
    }
}

interface _Api___edgeOf__Run_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  id_Run: string
  direction: _Direction_Move_
}

function edgeOf__Run({
  viewModel_TextEditor,
  id_Run,
  direction
}: _Api___edgeOf__Run_): _Position_Drawn_ | null {
  const run_Lines = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === id_Run)
  const line = direction === "FORWARD" ? (run_Lines?.lines.length ?? 0) - 1 : 0
  const line_Run = run_Lines?.lines[line]
  return line_Run === undefined
    ? null
    : {
      id_Run,
      position: {
        line,
        offset: direction === "FORWARD" ? textOf__Line(line_Run).length : 0
      }
    }
}

interface _Api___closedAt__State_ {
  state: _State__Viewer_TextEditor_
  id_Item: _Id_Item_
}

function closedAt__State({
  state,
  id_Item
}: _Api___closedAt__State_): _State__Viewer_TextEditor_ {
  const items_Drafted = state.items_Drafted.filter((id_Item_Open) => !isSame__Id_Item({
    id_Item: id_Item_Open,
    id_Item_Other: id_Item
  }))
  return items_Drafted.length === state.items_Drafted.length
    ? state
    : {
      ...state,
      items_Drafted,
      focus_Draft: {
        id_Item,
        part: "REVISE"
      }
    }
}

interface _Api___isSame__Id_Item_ {
  id_Item: _Id_Item_
  id_Item_Other: _Id_Item_
}

function isSame__Id_Item({
  id_Item,
  id_Item_Other
}: _Api___isSame__Id_Item_): boolean {
  return id_Item.source === id_Item_Other.source
    && id_Item.range_Frame.first === id_Item_Other.range_Frame.first
    && id_Item.range_Frame.last === id_Item_Other.range_Frame.last
}

type _HandlerMap__TextEditor_ = {
  [Kind in _Command_TextEditor_["kind"]]: (api_Handler: _Api___stateAfter__Command_<Kind>) => _State__Viewer_TextEditor_
}

const HANDLERMAP__TEXTEDITOR: _HandlerMap__TextEditor_ = {
  POINT: POINT_stateAfter__Command,
  JUMP: JUMP_stateAfter__Command,
  FOLD: FOLD_stateAfter__Command,
  DRAFT: DRAFT_stateAfter__Command,
  ACT: ACT_stateAfter__Command,
  SEND: SEND_stateAfter__Command,
  OPEN_MENU: OPEN_MENU_stateAfter__Command,
  STEP_MENU: STEP_MENU_stateAfter__Command,
  CHOOSE_MENU: CHOOSE_MENU_stateAfter__Command,
  CLOSE_MENU: CLOSE_MENU_stateAfter__Command,
  SEND_REQUEST: SEND_REQUEST_stateAfter__Command,
  CLOSE_REQUEST: CLOSE_REQUEST_stateAfter__Command,
  DISCARD: DISCARD_stateAfter__Command,
  VISIT: VISIT_stateAfter__Command,
  PLACE: PLACE_stateAfter__Command,
  DRAG: DRAG_stateAfter__Command,
  RELEASE: RELEASE_stateAfter__Command,
  MOVE: MOVE_stateAfter__Command,
  EXTEND: EXTEND_stateAfter__Command,
  INSERT: INSERT_stateAfter__Command,
  REPLACE: REPLACE_stateAfter__Command,
  DELETE: DELETE_stateAfter__Command,
  UNDO: UNDO_stateAfter__Command,
  REDO: REDO_stateAfter__Command,
  COPY: COPY_stateAfter__Command,
  CUT: CUT_stateAfter__Command,
  PASTE: PASTE_stateAfter__Command
}
