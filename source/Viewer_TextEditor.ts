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
  confirmingAt__ViewModel,
  type _Pending_Confirm_,
  type _Item_Proposals_,
  type _State_Proposal_,
  type _Menu_ViewModel_,
  type _Item_Menu_,
  type __BASE_Item_Menu_,
  type _Action_Item_,
  type _Document_Header_,
  type _Quote_Form_,
  headOf__Quote,
  sizeOf__Quote,
  peekOf__Quote,
  type _Tier_Menu_,
  type _Action_Task_,
  type _Scope_Menu_,
  type _Section_Action_,
  type _REQUEST_Item_Menu_,
  type _Target_Request_,
  type __BASE_Target_Request_,
  type _DOCUMENT_Target_Request_,
  type _TASK_Target_Request_,
  type _Aim_Request_,
  type _Selected_Text_,
  type _Piece_Text_,
  type _Form_Request_,
  type _Place_Form_,
  type _Header_ViewModel_,
  type _Revisions_Level_,
  type _Task_Header_,
  wordsAt__ViewModel,
  editingAt__ViewModel,
  type _Id_Request_
} from "./ViewModel_TextEditor.ts"
import type {
  _Id_Text_,
  _Range_Text_,
  _Position_Text_,
  _NonEmpty_
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
  type _POINT_WORDS__Command_,
  type _SHOW_WORDS__Command_,
  type _JUMP_Command_,
  type _FOLD_Command_,
  type _DRAFT_Command_,
  type _ACT_Command_,
  type _ACCEPT_ALL__Command_,
  type _CONFIRM_Command_,
  type _REMOVE_Command_,
  type _DISMISS_Command_,
  type _START_Command_,
  type _STOP_Command_,
  type _TASK_Command_,
  type _RERUN_Command_,
  type _SEND_Command_,
  type _OPEN_MENU__Command_,
  type _STEP_MENU__Command_,
  type _CHOOSE_MENU__Command_,
  type _CLOSE_MENU__Command_,
  type _FOCUS_REQUEST__Command_,
  type _SCROLL_Command_,
  type _OPEN_REQUEST__Command_,
  type _CLOSE_CARD__Command_,
  type _SEND_REQUEST__Command_,
  type _CLOSE_REQUEST__Command_,
  type _DROP_QUOTE__Command_,
  type _LEAVE_REQUEST__Command_,
  type _EDIT_Command_,
  type _SAVE_EDIT__Command_,
  type _CLOSE_EDIT__Command_,
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
  type _REMOVE_Asked_Host_,
  type _DISMISS_Asked_Host_,
  type _START_Asked_Host_,
  type _STOP_Asked_Host_,
  type _Scope_Work_,
  type __BASE_Scope_Work_,
  type _REQUEST_Scope_Work_,
  type _PROPOSAL_Scope_Work_,
  type _DOCUMENT_Scope_Work_,
  type _DOCUMENT_REQUESTS__Scope_Work_,
  type _TASK_REQUESTS__Scope_Work_,
  type _TASK_Scope_Work_,
  type _FRAME_Scope_Work_,
  type _TASK_Asked_Host_,
  type _RERUN_Asked_Host_,
  type _EDIT_Asked_Host_,
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
  timeout_Shown: ReturnType<typeof setTimeout> | null
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
      focus_Asking: null,
      confirm_Item: null,
      editing_Request: null,
      focus_Edited: null,
      words_Pointed: null,
      words_Shown: null,
      isRevealing_Words: false
    }
    this.request_Draw = null
    this.point_Screen = null
    this.timeout_Shown = null
    this.adapters = [
      ...CONTROLS__TEXTEDITOR,
      ...this.modules.flatMap((module_TextEditor) => module_TextEditor.adapters)
    ]
    for (const event of eventsOf__Adapters(this.adapters)) {
      this.containerElement.addEventListener(
        event,
        (event_Heard) => this.hear(event_Heard),
        {
          capture: EVENTS_UNBUBBLED.includes(event)
        }
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
      if (this.state.focus_Edited !== null) {
        this.view.focusEdited(this.state.focus_Edited)
        this.state = {
          ...this.state,
          focus_Edited: null
        }
      }
      if (this.state.isRevealing_Caret) {
        this.view.revealCaret()
        this.state = {
          ...this.state,
          isRevealing_Caret: false
        }
      }
      if (this.state.isRevealing_Words) {
        this.view.revealWords()
        this.state = {
          ...this.state,
          isRevealing_Words: false
        }
        if (this.timeout_Shown !== null) clearTimeout(this.timeout_Shown)
        this.timeout_Shown = setTimeout(
          () => {
            this.timeout_Shown = null
            this.dispatch({
              kind: "SHOW_WORDS",
              id_Request: null
            })
          },
          DURATION_SHOWN__WORDS
        )
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

type _Asked_Host_ = _ACTION_Asked_Host_ | _REQUEST_Asked_Host_ | _EDIT_Asked_Host_ | _REMOVE_Asked_Host_ | _DISMISS_Asked_Host_ | _START_Asked_Host_ | _STOP_Asked_Host_ | _TASK_Asked_Host_ | _RERUN_Asked_Host_

interface __BASE_Asked_Host_<Kind extends string> {
  kind: Kind
}

interface _ACTION_Asked_Host_ extends __BASE_Asked_Host_<"ACTION"> {
  source: string
  command: string
  notes: string | null
  reference: _Selected_Text_ | null
}

interface _REQUEST_Asked_Host_ extends __BASE_Asked_Host_<"REQUEST"> {
  aim: _Aim_Request_
  notes: string
  isStarting: boolean
}

interface _REMOVE_Asked_Host_ extends __BASE_Asked_Host_<"REMOVE"> {
  source: string | null
  id: string
}

interface _DISMISS_Asked_Host_ extends __BASE_Asked_Host_<"DISMISS"> {
  source: string | null
  id: string
}

interface _START_Asked_Host_ extends __BASE_Asked_Host_<"START"> {
  scope: _Scope_Work_
}

interface _STOP_Asked_Host_ extends __BASE_Asked_Host_<"STOP"> {
  scope: _Scope_Work_
}

type _Scope_Work_ = _REQUEST_Scope_Work_ | _PROPOSAL_Scope_Work_ | _FRAME_Scope_Work_ | _DOCUMENT_REQUESTS__Scope_Work_ | _DOCUMENT_Scope_Work_ | _TASK_REQUESTS__Scope_Work_ | _TASK_Scope_Work_

interface __BASE_Scope_Work_<Kind extends string> {
  kind: Kind
}

interface _REQUEST_Scope_Work_ extends __BASE_Scope_Work_<"REQUEST"> {
  source: string | null
  id: string
}

interface _PROPOSAL_Scope_Work_ extends __BASE_Scope_Work_<"PROPOSAL"> {
  source: string
}

interface _FRAME_Scope_Work_ extends __BASE_Scope_Work_<"FRAME"> {
  range: _Range_Lines_
  sources: Array<string>
}

interface _DOCUMENT_REQUESTS__Scope_Work_ extends __BASE_Scope_Work_<"DOCUMENT_REQUESTS"> {}

interface _DOCUMENT_Scope_Work_ extends __BASE_Scope_Work_<"DOCUMENT"> {}

interface _TASK_REQUESTS__Scope_Work_ extends __BASE_Scope_Work_<"TASK_REQUESTS"> {}

interface _TASK_Scope_Work_ extends __BASE_Scope_Work_<"TASK"> {}

interface _TASK_Asked_Host_ extends __BASE_Asked_Host_<"TASK"> {
  command: string
}

interface _RERUN_Asked_Host_ extends __BASE_Asked_Host_<"RERUN"> {
  source: string
}

interface _EDIT_Asked_Host_ extends __BASE_Asked_Host_<"EDIT"> {
  source: string | null
  id: string
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

type _Command_TextEditor_ = _POINT_Command_ | _POINT_WORDS__Command_ | _SHOW_WORDS__Command_ | _JUMP_Command_ | _FOLD_Command_ | _DRAFT_Command_ | _ACT_Command_ | _ACCEPT_ALL__Command_ | _CONFIRM_Command_ | _REMOVE_Command_ | _DISMISS_Command_ | _START_Command_ | _STOP_Command_ | _TASK_Command_ | _RERUN_Command_ | _SEND_Command_ | _OPEN_MENU__Command_ | _STEP_MENU__Command_ | _CHOOSE_MENU__Command_ | _CLOSE_MENU__Command_ | _FOCUS_REQUEST__Command_ | _SCROLL_Command_ | _OPEN_REQUEST__Command_ | _CLOSE_CARD__Command_ | _SEND_REQUEST__Command_ | _CLOSE_REQUEST__Command_ | _DROP_QUOTE__Command_ | _LEAVE_REQUEST__Command_ | _EDIT_Command_ | _SAVE_EDIT__Command_ | _CLOSE_EDIT__Command_ | _DISCARD_Command_ | _VISIT_Command_ | _PLACE_Command_ | _DRAG_Command_ | _RELEASE_Command_ | _MOVE_Command_ | _EXTEND_Command_ | _INSERT_Command_ | _REPLACE_Command_ | _DELETE_Command_ | _UNDO_Command_ | _REDO_Command_ | _COPY_Command_ | _CUT_Command_ | _PASTE_Command_

interface __BASE_Command_<Kind extends string> {
  kind: Kind
}

interface _POINT_Command_ extends __BASE_Command_<"POINT"> {
  point_Screen: _Point_Screen_ | null
}

interface _POINT_WORDS__Command_ extends __BASE_Command_<"POINT_WORDS"> {
  id_Request: _Id_Request_ | null
}

interface _SHOW_WORDS__Command_ extends __BASE_Command_<"SHOW_WORDS"> {
  id_Request: _Id_Request_ | null
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

interface _ACCEPT_ALL__Command_ extends __BASE_Command_<"ACCEPT_ALL"> {
  range: _Range_Lines_
}

interface _CONFIRM_Command_ extends __BASE_Command_<"CONFIRM"> {
  isConfirmed: boolean
}

interface _REMOVE_Command_ extends __BASE_Command_<"REMOVE"> {
  source: string | null
  id: string
}

interface _DISMISS_Command_ extends __BASE_Command_<"DISMISS"> {
  source: string | null
  id: string
}

interface _START_Command_ extends __BASE_Command_<"START"> {
  scope: _Scope_Work_
}

interface _STOP_Command_ extends __BASE_Command_<"STOP"> {
  scope: _Scope_Work_
}

interface _TASK_Command_ extends __BASE_Command_<"TASK"> {
  command: string
}

interface _RERUN_Command_ extends __BASE_Command_<"RERUN"> {
  id_Item: _Id_Item_
}

interface _SEND_Command_ extends __BASE_Command_<"SEND"> {
  id_Item: _Id_Item_
  command: string
  notes: string
  isStarting: boolean
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

interface _FOCUS_REQUEST__Command_ extends __BASE_Command_<"FOCUS_REQUEST"> {}

interface _SCROLL_Command_ extends __BASE_Command_<"SCROLL"> {
  isWritten_Form: boolean
}

interface _OPEN_REQUEST__Command_ extends __BASE_Command_<"OPEN_REQUEST"> {
  target: _DOCUMENT_Target_Request_ | _TASK_Target_Request_
}

interface _CLOSE_CARD__Command_ extends __BASE_Command_<"CLOSE_CARD"> {}

interface _SEND_REQUEST__Command_ extends __BASE_Command_<"SEND_REQUEST"> {
  notes: string
  isStarting: boolean
}

interface _CLOSE_REQUEST__Command_ extends __BASE_Command_<"CLOSE_REQUEST"> {}

interface _DROP_QUOTE__Command_ extends __BASE_Command_<"DROP_QUOTE"> {}

interface _LEAVE_REQUEST__Command_ extends __BASE_Command_<"LEAVE_REQUEST"> {}

interface _EDIT_Command_ extends __BASE_Command_<"EDIT"> {
  id_Item: _Id_Item_ | null
  id: string
}

interface _SAVE_EDIT__Command_ extends __BASE_Command_<"SAVE_EDIT"> {
  notes: string
}

interface _CLOSE_EDIT__Command_ extends __BASE_Command_<"CLOSE_EDIT"> {}

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
  confirm_Item: _Pending_Confirm_ | null
  editing_Request: _Id_Request_ | null
  focus_Edited: _Id_Request_ | null
  words_Pointed: _Id_Request_ | null
  words_Shown: _Id_Request_ | null
  isRevealing_Words: boolean
}


function eventsOf__Adapters(
  adapters: Array<_Adapter_Event_>
): Array<string> {
  return [...new Set(adapters.map((adapter) => adapter.event))]
}

const EVENTS_UNBUBBLED = [
  "scroll",
  "scrollend"
]

const DURATION_SHOWN__WORDS = 1800

function viewModelOf__State(
  state: _State__Viewer_TextEditor_
): _ViewModel_TextEditor_ {
  return wordsAt__ViewModel({
    viewModel_TextEditor: wordsAt__ViewModel({
      viewModel_TextEditor: editingAt__ViewModel({
        viewModel_TextEditor: askingAt__ViewModel({
          viewModel_TextEditor: {
            ...selectedOf__State(state),
            header: state.viewModel_TextEditor.header
          },
          menu: state.menu,
          request: state.request
        }),
        editing_Request: state.editing_Request
      }),
      id_Request: state.words_Pointed,
      attributes: {
        "data-lit": ""
      }
    }),
    id_Request: state.words_Shown,
    attributes: {
      "data-shown": ""
    }
  })
}

function selectedOf__State(
  state: _State__Viewer_TextEditor_
): _ViewModel_TextEditor_ {
  return selectedAt__ViewModel({
    viewModel_TextEditor: pointedAt__ViewModel({
      viewModel_TextEditor: confirmingAt__ViewModel({
        viewModel_TextEditor: draftingAt__ViewModel({
        viewModel_TextEditor: foldedAt__ViewModel({
          viewModel_TextEditor: state.viewModel_TextEditor,
          ranges_Folded: state.ranges_Folded,
          range_Peeked: state.range_Peeked
        }),
          items_Drafted: state.items_Drafted
        }),
        confirm_Item: state.confirm_Item
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

function POINT_WORDS_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"POINT_WORDS">): _State__Viewer_TextEditor_ {
  return command.id_Request?.id === state.words_Pointed?.id && command.id_Request?.id_Item?.source === state.words_Pointed?.id_Item?.source
    ? state
    : {
      ...state,
      words_Pointed: command.id_Request
    }
}

function SHOW_WORDS_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"SHOW_WORDS">): _State__Viewer_TextEditor_ {
  return command.id_Request === null
    ? state.words_Shown === null
      ? state
      : {
        ...state,
        words_Shown: null
      }
    : {
      ...state,
      words_Shown: command.id_Request,
      isRevealing_Words: true,
      isFocusing_Input: true
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
  const item_Proposals = itemOf__Id({
    viewModel_TextEditor: viewModelOf__State(state),
    id_Item: command.id_Item
  })
  const action_Item = item_Proposals?.actions.find((action_Each) => action_Each.command === command.command)
  const isDropping = item_Proposals !== null && item_Proposals.requests.length > 0 && action_Item !== undefined && action_Item.stateAfter !== "REQUESTED"
  if (isDropping) {
    return {
      ...state,
      confirm_Item: {
        id_Item: command.id_Item,
        command: command.command
      },
      focus_Asking: "CONFIRM"
    }
  }
  ask_View({
    kind: "ACTION",
    source: command.id_Item.source,
    command: command.command,
    notes: null,
    reference: null
  })
  return state
}

interface _Api___itemOf__Id_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  id_Item: _Id_Item_
}

function itemOf__Id({
  viewModel_TextEditor,
  id_Item
}: _Api___itemOf__Id_): _Item_Proposals_ | null {
  return viewModel_TextEditor.blocks.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME" && block_ViewModel.range.first === id_Item.range_Frame.first && block_ViewModel.range.last === id_Item.range_Frame.last
    ? block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" ? part_Frame.items : [])
    : []).find((item_Proposals) => item_Proposals.source === id_Item.source) ?? null
}

function ACCEPT_ALL_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"ACCEPT_ALL">): _State__Viewer_TextEditor_ {
  const action$_Decided = viewModelOf__State(state).blocks
    .flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME" && block_ViewModel.range.first === command.range.first && block_ViewModel.range.last === command.range.last ? block_ViewModel.parts : [])
    .flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" ? part_Frame.items : [])
    .flatMap((item_Proposals) => {
      const action_Item = item_Proposals.actions.find((action_Each) => action_Each.stateAfter === "ACCEPTED")
      return item_Proposals.state !== "OPEN" || action_Item === undefined
        ? []
        : [
          {
            source: item_Proposals.source,
            command: action_Item.command
          }
        ]
    })
  for (const action_Decided of action$_Decided) {
    ask_View({
      kind: "ACTION",
      source: action_Decided.source,
      command: action_Decided.command,
      notes: null,
      reference: null
    })
  }
  return state
}

function CONFIRM_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"CONFIRM">): _State__Viewer_TextEditor_ {
  if (state.confirm_Item === null) return state
  if (command.isConfirmed) {
    ask_View({
      kind: "ACTION",
      source: state.confirm_Item.id_Item.source,
      command: state.confirm_Item.command,
      notes: null,
      reference: null
    })
  }
  return {
    ...state,
    confirm_Item: null
  }
}

function REMOVE_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"REMOVE">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "REMOVE",
    source: command.source,
    id: command.id
  })
  return state
}

function DISMISS_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"DISMISS">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "DISMISS",
    source: command.source,
    id: command.id
  })
  return state
}

function START_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"START">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "START",
    scope: command.scope
  })
  return state
}

function STOP_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"STOP">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "STOP",
    scope: command.scope
  })
  return state
}

function TASK_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"TASK">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "TASK",
    command: command.command
  })
  return state
}

function RERUN_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"RERUN">): _State__Viewer_TextEditor_ {
  ask_View({
    kind: "RERUN",
    source: command.id_Item.source
  })
  return state
}

function SEND_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"SEND">): _State__Viewer_TextEditor_ {
  const isWritten = command.notes.trim() !== ""
  if (!isWritten && !command.isStarting) return state
  if (isWritten) {
    ask_View({
      kind: "ACTION",
      source: command.id_Item.source,
      command: command.command,
      notes: command.notes,
      reference: null
    })
  }
  if (command.isStarting) {
    ask_View({
      kind: "START",
      scope: {
        kind: "PROPOSAL",
        source: command.id_Item.source
      }
    })
  }
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
  const items_Menu: _NonEmpty_<_Item_Menu_> | null = item_First === undefined
    ? null
    : [
      item_First,
      ...items_Rest
    ]
  return items_Menu === null
    ? state
    : {
      ...state,
      menu: {
        point_Screen,
        items: items_Menu,
        index_Focused: Math.max(0, items_Menu.findIndex((item_Menu) => item_Menu.kind === "REQUEST")),
        isFocusShown: command.point_Screen === null
      },
      request: state.request?.place.kind === "POINT" ? null : state.request,
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
  const index$_Selected = selection_Drawn === null
    ? []
    : [
      selection_Drawn.anchor.id_Run,
      selection_Drawn.head.id_Run
    ].map((id_Run) => viewModel_TextEditor.runs.findIndex((run_Lines) => run_Lines.id === id_Run))
  const ids_Run_Selected = index$_Selected.length === 0
    ? []
    : viewModel_TextEditor.runs.slice(Math.min(...index$_Selected), Math.max(...index$_Selected) + 1).map((run_Lines) => run_Lines.id)
  const listed$_Proposals = viewModel_TextEditor.blocks.flatMap((block_ViewModel) => block_ViewModel.kind === "FRAME"
    ? block_ViewModel.parts.flatMap((part_Frame) => part_Frame.kind === "PROPOSAL_LIST"
      ? part_Frame.items.map((item_Proposals) => ({
        id_Item: {
          source: item_Proposals.source,
          range_Frame: block_ViewModel.range
        },
        item_Proposals
      }))
      : [])
    : [])
  const listedOf = (source: string | null) => source === null
    ? null
    : listed$_Proposals.find((listed_Proposals) => listed_Proposals.id_Item.source === source) ?? null
  const source_Words = piece_First !== undefined && piece_First.id_Text.kind === "CHANGE" && pieces.every((piece) => piece.id_Text.kind === "CHANGE" && piece.id_Text.source === (piece_First.id_Text.kind === "CHANGE" ? piece_First.id_Text.source : null))
    ? piece_First.id_Text.source
    : null
  return [
    ...itemsOf__Tier_Proposal({
      listed_Proposal: listedOf(source_Words ?? source_Pointed),
      selected,
      ids_Run_Selected
    }),
    ...itemsOf__Tier_Document({
      document_Header: viewModel_TextEditor.header.document,
      selected,
      ids_Run_Selected
    }),
    ...itemsOf__Tier_Task({
      task_Header: viewModel_TextEditor.header.task,
      selected,
      ids_Run_Selected
    })
  ]
}

interface _Api___itemsOf__Tier_Proposal_ {
  listed_Proposal: _Listed_Proposals_ | null
  selected: _Selected_Text_ | null
  ids_Run_Selected: Array<string>
}

interface _Listed_Proposals_ {
  id_Item: _Id_Item_
  item_Proposals: _Item_Proposals_
}

function itemsOf__Tier_Proposal({
  listed_Proposal,
  selected,
  ids_Run_Selected
}: _Api___itemsOf__Tier_Proposal_): Array<_Item_Menu_> {
  if (listed_Proposal === null) return []
  const item_Proposals = listed_Proposal.item_Proposals
  const revise_Proposal = reviseOf__Item({
    item_Proposals
  })
  return [
    ...item_Proposals.actions
      .filter((action_Item) => action_Item.stateAfter !== "REQUESTED")
      .map((action_Item) => ({
        kind: "ACT" as const,
        tier: "PROPOSAL" as const,
        section: "PROPOSALS" as const,
        label_Tier: "Proposal",
        label: action_Item.label,
        id_Item: listed_Proposal.id_Item,
        command: action_Item.command
      })),
    ...itemsOf__Revisions_Menu({
      tier: "PROPOSAL",
      label_Tier: "Proposal",
      request_Item: revise_Proposal === null
        ? null
        : {
          kind: "REQUEST",
          tier: "PROPOSAL",
          section: "REVISIONS",
          label_Tier: "Proposal",
          label: `Request revision${withOf__Selected({
            selected
          })}`,
          label_Form: `Request a revision of “${item_Proposals.title}”`,
          head: {
            label_Tier: "Proposal",
            subject: item_Proposals.title
          },
          quote: referenceOf__Selected({
            selected,
            ids_Run: ids_Run_Selected
          }),
          target: {
            kind: "PROPOSAL",
            source: item_Proposals.source,
            command: revise_Proposal.command,
            reference: selected
          }
        },
      label_Start: item_Proposals.isStartable ? `Start all (${item_Proposals.requests.filter((request_Item) => request_Item.isStartable).length})` : null,
      label_Stop: item_Proposals.isRunning ? `Stop all (${item_Proposals.requests.filter((request_Item) => request_Item.isRunning).length})` : null,
      action$_Task: [],
      scope: {
        kind: "PROPOSAL",
        source: item_Proposals.source
      }
    })
  ]
}

interface _Api___reviseOf__Item_ {
  item_Proposals: _Item_Proposals_
}

function reviseOf__Item({
  item_Proposals
}: _Api___reviseOf__Item_): _Action_Item_ | null {
  return ISNOTABLEMAP__STATE_PROPOSAL[item_Proposals.state]
    ? item_Proposals.actions.find((action_Each) => action_Each.stateAfter === "REQUESTED") ?? null
    : null
}

interface _Api___withOf__Selected_ {
  selected: _Selected_Text_ | null
}

function withOf__Selected({
  selected
}: _Api___withOf__Selected_): string {
  return selected === null ? "" : ", with selection"
}

interface _Api___referenceOf__Selected_ {
  selected: _Selected_Text_ | null
  ids_Run: Array<string>
}

function referenceOf__Selected({
  selected,
  ids_Run
}: _Api___referenceOf__Selected_): _Quote_Form_ | null {
  return selected === null
    ? null
    : {
      text: selected.text,
      head: headOf__Quote({
        text: selected.text
      }),
      size: sizeOf__Quote({
        text: selected.text
      }),
      peek: peekOf__Quote({
        text: selected.text
      }),
      pieces: selected.pieces,
      ids_Run
    }
}

interface _Api___itemsOf__Revisions_Menu_ {
  tier: _Tier_Menu_
  label_Tier: string
  request_Item: _REQUEST_Item_Menu_ | null
  label_Start: string | null
  label_Stop: string | null
  action$_Task: Array<_Action_Task_>
  scope: _Scope_Menu_
}

function itemsOf__Revisions_Menu({
  tier,
  label_Tier,
  request_Item,
  label_Start,
  label_Stop,
  action$_Task,
  scope
}: _Api___itemsOf__Revisions_Menu_): Array<_Item_Menu_> {
  return [
    ...(request_Item === null
      ? []
      : [
        request_Item
      ]),
    ...(label_Start === null
      ? []
      : [
        {
          kind: "WORK" as const,
          tier,
          section: "REVISIONS" as const,
          label_Tier,
          label: label_Start,
          work: "START" as const,
          scope
        }
      ]),
    ...(label_Stop === null
      ? []
      : [
        {
          kind: "WORK" as const,
          tier,
          section: "REVISIONS" as const,
          label_Tier,
          label: label_Stop,
          work: "STOP" as const,
          scope
        }
      ]),
    ...itemsOf__Actions_Task({
      tier,
      section: "REVISIONS",
      label_Tier,
      action$_Task
    })
  ]
}

interface _Api___itemsOf__Actions_Task_ {
  tier: _Tier_Menu_
  section: _Section_Action_
  label_Tier: string
  action$_Task: Array<_Action_Task_>
}

function itemsOf__Actions_Task({
  tier,
  section,
  label_Tier,
  action$_Task
}: _Api___itemsOf__Actions_Task_): Array<_Item_Menu_> {
  return action$_Task.map((action_Task) => ({
    kind: "TASK",
    tier,
    section,
    label_Tier,
    label: action_Task.label,
    command: action_Task.command
  }))
}

interface _Api___itemsOf__Tier_Document_ {
  document_Header: _Document_Header_
  selected: _Selected_Text_ | null
  ids_Run_Selected: Array<string>
}

function itemsOf__Tier_Document({
  document_Header,
  selected,
  ids_Run_Selected
}: _Api___itemsOf__Tier_Document_): Array<_Item_Menu_> {
  return [
    ...itemsOf__Actions_Task({
      tier: "DOCUMENT",
      section: "PROPOSALS",
      label_Tier: "Document",
      action$_Task: document_Header.proposals.actions
    }),
    ...itemsOf__Revisions_Menu({
      tier: "DOCUMENT",
      label_Tier: "Document",
      request_Item: {
        kind: "REQUEST",
        tier: "DOCUMENT",
        section: "REVISIONS",
        label_Tier: "Document",
        label: `Request change${withOf__Selected({
          selected
        })}`,
        label_Form: "Request a change to this document",
        head: {
          label_Tier: "Document",
          subject: document_Header.name
        },
        quote: referenceOf__Selected({
          selected,
          ids_Run: ids_Run_Selected
        }),
        target: {
          kind: "DOCUMENT",
          reference: selected
        }
      },
      label_Start: document_Header.revisions_Scope.start_All?.label ?? null,
      label_Stop: document_Header.revisions_Scope.stop_All?.label ?? null,
      action$_Task: document_Header.revisions_Scope.actions,
      scope: {
        kind: "DOCUMENT"
      }
    })
  ]
}

interface _Api___itemsOf__Tier_Task_ {
  task_Header: _Task_Header_ | null
  selected: _Selected_Text_ | null
  ids_Run_Selected: Array<string>
}

function itemsOf__Tier_Task({
  task_Header,
  selected,
  ids_Run_Selected
}: _Api___itemsOf__Tier_Task_): Array<_Item_Menu_> {
  return task_Header === null
    ? []
    : [
      ...itemsOf__Actions_Task({
        tier: "TASK",
        section: "PROPOSALS",
        label_Tier: "Task",
        action$_Task: task_Header.proposals.actions
      }),
      ...itemsOf__Revisions_Menu({
        tier: "TASK",
        label_Tier: "Task",
        request_Item: {
          kind: "REQUEST",
          tier: "TASK",
          section: "REVISIONS",
          label_Tier: "Task",
          label: `Request change${withOf__Selected({
            selected
          })}`,
          label_Form: "Request a change to the task",
          head: {
            label_Tier: "Task",
            subject: task_Header.name
          },
          quote: referenceOf__Selected({
            selected,
            ids_Run: ids_Run_Selected
          }),
          target: {
            kind: "TASK",
            reference: selected
          }
        },
        label_Start: task_Header.revisions_Scope.start_All?.label ?? null,
        label_Stop: task_Header.revisions_Scope.stop_All?.label ?? null,
        action$_Task: task_Header.revisions_Scope.actions,
        scope: {
          kind: "TASK"
        }
      })
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
      index_Focused: (state.menu.index_Focused + (command.direction === "FORWARD" ? 1 : -1) + count) % count,
      isFocusShown: true
    },
    focus_Asking: "MENU"
  }
}

function CHOOSE_MENU_stateAfter__Command({
  state,
  command,
  layout_View,
  module_Words,
  edit_View,
  ask_View
}: _Api___stateAfter__Command_<"CHOOSE_MENU">): _State__Viewer_TextEditor_ {
  const item_Menu = state.menu?.items[command.index]
  return state.menu === null || item_Menu === undefined
    ? state
    : stateAfter__Item_Menu({
      state,
      item_Menu,
      point_Screen: state.menu.point_Screen,
      handle: (command_Chosen) => stateAfter__Command({
        state: {
          ...state,
          menu: null,
          isFocusing_Input: true
        },
        command: command_Chosen,
        layout_View,
        module_Words,
        edit_View,
        ask_View
      })
    })
}

interface _Api___stateAfter__Item_Menu_<Kind extends _Item_Menu_["kind"]> {
  state: _State__Viewer_TextEditor_
  item_Menu: Extract<
    _Item_Menu_,
    __BASE_Item_Menu_<Kind>
  >
  point_Screen: _Point_Screen_
  handle: (command_Chosen: _ACT_Command_ | _START_Command_ | _STOP_Command_ | _TASK_Command_) => _State__Viewer_TextEditor_
}

function stateAfter__Item_Menu<Kind extends _Item_Menu_["kind"]>({
  state,
  item_Menu,
  point_Screen,
  handle
}: _Api___stateAfter__Item_Menu_<Kind>): _State__Viewer_TextEditor_ {
  const choose = CHOSENMAP__KIND_ITEM_MENU[item_Menu.kind]
  return choose({
    state,
    item_Menu,
    point_Screen,
    handle
  })
}

type _ChosenMap__Kind_Item_Menu_ = {
  [Kind in _Item_Menu_["kind"]]: (api_Chosen: _Api___stateAfter__Item_Menu_<Kind>) => _State__Viewer_TextEditor_
}

const CHOSENMAP__KIND_ITEM_MENU: _ChosenMap__Kind_Item_Menu_ = {
  REQUEST: ({
    state,
    item_Menu,
    point_Screen
  }) => ({
    ...state,
    menu: null,
    request: {
      place: {
        kind: "POINT",
        point_Screen
      },
      label: item_Menu.label_Form,
      head: item_Menu.head,
      quote: item_Menu.quote,
      isStartable: item_Menu.target.kind !== "PROPOSAL" || !isRunning__Source({
        viewModel_TextEditor: viewModelOf__State(state),
        source: item_Menu.target.source
      }),
      target: item_Menu.target
    },
    focus_Asking: "REQUEST"
  }),
  ACT: ({
    item_Menu,
    handle
  }) => handle({
    kind: "ACT",
    id_Item: item_Menu.id_Item,
    command: item_Menu.command
  }),
  WORK: ({
    item_Menu,
    handle
  }) => handle({
    kind: item_Menu.work,
    scope: item_Menu.scope
  }),
  TASK: ({
    item_Menu,
    handle
  }) => handle({
    kind: "TASK",
    command: item_Menu.command
  })
}

function OPEN_REQUEST_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"OPEN_REQUEST">): _State__Viewer_TextEditor_ {
  const revisions_Level = REVISIONSMAP__KIND_TARGET[command.target.kind](state.viewModel_TextEditor.header)
  return revisions_Level === null
    ? state
    : {
      ...state,
      menu: null,
      request: {
        place: PLACEMAP__KIND_TARGET[command.target.kind],
        label: revisions_Level.ask.label_Form,
        head: null,
        quote: null,
        isStartable: revisions_Level.requests.length === 0,
        target: command.target
      },
      focus_Asking: "REQUEST"
    }
}

type _PlaceMap__Kind_Target_ = {
  [Kind in (_DOCUMENT_Target_Request_ | _TASK_Target_Request_)["kind"]]: _Place_Form_
}

const PLACEMAP__KIND_TARGET: _PlaceMap__Kind_Target_ = {
  DOCUMENT: {
    kind: "DOCUMENT"
  },
  TASK: {
    kind: "TASK"
  }
}

type _RevisionsMap__Kind_Target_ = {
  [Kind in (_DOCUMENT_Target_Request_ | _TASK_Target_Request_)["kind"]]: (header_ViewModel: _Header_ViewModel_) => _Revisions_Level_ | null
}

const REVISIONSMAP__KIND_TARGET: _RevisionsMap__Kind_Target_ = {
  DOCUMENT: (header_ViewModel) => header_ViewModel.document.revisions_Level,
  TASK: (header_ViewModel) => header_ViewModel.task?.revisions_Level ?? null
}

function CLOSE_CARD_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"CLOSE_CARD">): _State__Viewer_TextEditor_ {
  return {
    ...state,
    isFocusing_Input: true
  }
}

function FOCUS_REQUEST_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"FOCUS_REQUEST">): _State__Viewer_TextEditor_ {
  return state.request === null
    ? state
    : {
      ...state,
      menu: null,
      focus_Asking: "REQUEST"
    }
}

function SCROLL_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"SCROLL">): _State__Viewer_TextEditor_ {
  return state.menu !== null && layout_View.isMoved("MENU")
    ? {
      ...state,
      menu: null,
      isFocusing_Input: true
    }
    : state.request?.place.kind === "POINT" && !command.isWritten_Form && layout_View.isMoved("FORM")
      ? closedOf__Request({
        state,
        form_Request: state.request
      })
      : state
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
  if (state.request === null) return state
  const isWritten = command.notes.trim() !== ""
  const target = state.request.target
  const isStarting = command.isStarting && state.request.isStartable
  if (!isWritten && !(isStarting && target.kind === "PROPOSAL")) return state
  if (isWritten) {
    ask_View(ASKEDMAP__KIND_TARGET[target.kind]({
      target,
      notes: command.notes,
      isStarting
    } as never))
  }
  if (isStarting && target.kind === "PROPOSAL") {
    ask_View({
      kind: "START",
      scope: {
        kind: "PROPOSAL",
        source: target.source
      }
    })
  }
  const state_Closed = closedOf__Request({
    state,
    form_Request: state.request
  })
  return state.request.place.kind === "POINT" && state.selection !== null
    ? {
      ...state_Closed,
      selection: {
        anchor: state.selection.head,
        head: state.selection.head
      }
    }
    : state_Closed
}

interface _Api___closedOf__Request_ {
  state: _State__Viewer_TextEditor_
  form_Request: _Form_Request_
}

function closedOf__Request({
  state,
  form_Request
}: _Api___closedOf__Request_): _State__Viewer_TextEditor_ {
  const focus_Asking = FOCUSMAP__KIND_PLACE[form_Request.place.kind]
  return {
    ...state,
    request: null,
    focus_Asking,
    isFocusing_Input: focus_Asking === null
  }
}

type _FocusMap__Kind_Place_ = {
  [Kind in _Place_Form_["kind"]]: _Focus_Asking_ | null
}

const FOCUSMAP__KIND_PLACE: _FocusMap__Kind_Place_ = {
  POINT: null,
  TASK: "ASK_TASK",
  DOCUMENT: "ASK_DOCUMENT"
}

type _IsNotableMap__State_Proposal_ = {
  [State in _State_Proposal_]: boolean
}

const ISNOTABLEMAP__STATE_PROPOSAL: _IsNotableMap__State_Proposal_ = {
  OPEN: true,
  REQUESTED: true,
  REVISING: true,
  ACCEPTED: false,
  REJECTED: false,
  WITHDRAWN: false
}

interface _Api___isRunning__Source_ {
  viewModel_TextEditor: _ViewModel_TextEditor_
  source: string
}

function isRunning__Source({
  viewModel_TextEditor,
  source
}: _Api___isRunning__Source_): boolean {
  return viewModel_TextEditor.blocks.some((block_ViewModel) => block_ViewModel.kind === "FRAME" && block_ViewModel.parts.some((part_Frame) => part_Frame.kind === "PROPOSAL_LIST" && part_Frame.items.some((item_Proposals) => item_Proposals.source === source && item_Proposals.isRunning)))
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
  isStarting: boolean
}

const ASKEDMAP__KIND_TARGET: _AskedMap__Kind_Target_ = {
  DOCUMENT: ({
    target,
    notes,
    isStarting
  }) => ({
    kind: "REQUEST",
    aim: {
      kind: "DOCUMENT",
      reference: target.reference
    },
    notes,
    isStarting
  }),
  TASK: ({
    target,
    notes,
    isStarting
  }) => ({
    kind: "REQUEST",
    aim: {
      kind: "TASK",
      reference: target.reference
    },
    notes,
    isStarting
  }),
  PROPOSAL: ({
    target,
    notes
  }) => ({
    kind: "ACTION",
    source: target.source,
    command: target.command,
    notes,
    reference: target.reference
  })
}

function DROP_QUOTE_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"DROP_QUOTE">): _State__Viewer_TextEditor_ {
  const target = state.request?.target
  return state.request === null || target === undefined || state.request.quote === null
    ? state
    : {
      ...state,
      request: {
        ...state.request,
        quote: null,
        target: {
          ...target,
          reference: null
        }
      },
      focus_Asking: "REQUEST"
    }
}

function CLOSE_REQUEST_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"CLOSE_REQUEST">): _State__Viewer_TextEditor_ {
  return state.request === null
    ? state
    : closedOf__Request({
      state,
      form_Request: state.request
    })
}

function LEAVE_REQUEST_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"LEAVE_REQUEST">): _State__Viewer_TextEditor_ {
  return state.request === null
    ? state
    : {
      ...state,
      request: null
    }
}

function EDIT_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"EDIT">): _State__Viewer_TextEditor_ {
  return {
    ...state,
    editing_Request: {
      id_Item: command.id_Item,
      id: command.id
    },
    focus_Asking: "EDIT"
  }
}

function SAVE_EDIT_stateAfter__Command({
  state,
  command,
  ask_View
}: _Api___stateAfter__Command_<"SAVE_EDIT">): _State__Viewer_TextEditor_ {
  if (state.editing_Request === null || command.notes.trim() === "") return state
  ask_View({
    kind: "EDIT",
    source: state.editing_Request.id_Item?.source ?? null,
    id: state.editing_Request.id,
    notes: command.notes.trim()
  })
  return {
    ...state,
    editing_Request: null,
    focus_Edited: state.editing_Request
  }
}

function CLOSE_EDIT_stateAfter__Command({
  state
}: _Api___stateAfter__Command_<"CLOSE_EDIT">): _State__Viewer_TextEditor_ {
  return state.editing_Request === null
    ? state
    : {
      ...state,
      editing_Request: null,
      focus_Edited: state.editing_Request
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
        part: "ASK"
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
  POINT_WORDS: POINT_WORDS_stateAfter__Command,
  SHOW_WORDS: SHOW_WORDS_stateAfter__Command,
  JUMP: JUMP_stateAfter__Command,
  FOLD: FOLD_stateAfter__Command,
  DRAFT: DRAFT_stateAfter__Command,
  ACT: ACT_stateAfter__Command,
  ACCEPT_ALL: ACCEPT_ALL_stateAfter__Command,
  CONFIRM: CONFIRM_stateAfter__Command,
  REMOVE: REMOVE_stateAfter__Command,
  DISMISS: DISMISS_stateAfter__Command,
  START: START_stateAfter__Command,
  STOP: STOP_stateAfter__Command,
  TASK: TASK_stateAfter__Command,
  RERUN: RERUN_stateAfter__Command,
  SEND: SEND_stateAfter__Command,
  OPEN_MENU: OPEN_MENU_stateAfter__Command,
  STEP_MENU: STEP_MENU_stateAfter__Command,
  CHOOSE_MENU: CHOOSE_MENU_stateAfter__Command,
  CLOSE_MENU: CLOSE_MENU_stateAfter__Command,
  FOCUS_REQUEST: FOCUS_REQUEST_stateAfter__Command,
  SCROLL: SCROLL_stateAfter__Command,
  OPEN_REQUEST: OPEN_REQUEST_stateAfter__Command,
  CLOSE_CARD: CLOSE_CARD_stateAfter__Command,
  SEND_REQUEST: SEND_REQUEST_stateAfter__Command,
  CLOSE_REQUEST: CLOSE_REQUEST_stateAfter__Command,
  DROP_QUOTE: DROP_QUOTE_stateAfter__Command,
  LEAVE_REQUEST: LEAVE_REQUEST_stateAfter__Command,
  EDIT: EDIT_stateAfter__Command,
  SAVE_EDIT: SAVE_EDIT_stateAfter__Command,
  CLOSE_EDIT: CLOSE_EDIT_stateAfter__Command,
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
