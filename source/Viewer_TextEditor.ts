import {
  _View_TextEditor_,
  type _ComponentMap__View_TextEditor_,
  type _Layout_View_,
  type _Point_Screen_,
  type _Focus_Draft_,
  type _Visit_Item_
} from "./View_TextEditor.tsx"
import {
  type _ViewModel_TextEditor_,
  type _Target_Note_,
  type _Range_Lines_,
  type _Id_Item_,
  type _Selection_TextEditor_,
  type _End_Selection_,
  type _Position_Drawn_,
  selectedAt__ViewModel,
  pointedAt__ViewModel,
  draftingAt__ViewModel,
  foldedAt__ViewModel,
  orderOf__Positions_Drawn,
  placeIn__Line,
  textOf__Line,
  isSame__Id_Text
} from "./ViewModel_TextEditor.ts"
import type { _Id_Text_ } from "./Model_TextEditor.ts"
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
  type _SEND_Command_,
  type _DISCARD_Command_,
  type _VISIT_Command_,
  type _PLACE_Command_,
  type _DRAG_Command_,
  type _RELEASE_Command_,
  type _MOVE_Command_,
  type _EXTEND_Command_,
  type _Unit_Move_,
  type _Direction_Move_,
  type _HandlerMap__TextEditor_,
  HANDLERMAP__TEXTEDITOR
}

class _Viewer_TextEditor_ {
  containerElement: HTMLElement
  view: _View_TextEditor_
  modules: Array<_Module_TextEditor_>
  adapters: Array<_Adapter_Event_>
  state: _State__Viewer_TextEditor_
  request_Draw: number | null
  point_Screen: _Point_Screen_ | null

  constructor({
    containerElement,
    componentMap,
    modules,
    viewModel_TextEditor
  }: _Api__Viewer_TextEditor_) {
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
      focus_Draft: null,
      visit_Item: null,
      selection: null,
      isSelecting: false,
      x_Goal: null,
      isRevealing_Caret: false
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

  show(
    viewModel_TextEditor: _ViewModel_TextEditor_
  ): void {
    this.state = {
      ...this.state,
      viewModel_TextEditor
    }
    this.drawOnNextFrame()
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

type _Command_TextEditor_ = _POINT_Command_ | _JUMP_Command_ | _FOLD_Command_ | _DRAFT_Command_ | _SEND_Command_ | _DISCARD_Command_ | _VISIT_Command_ | _PLACE_Command_ | _DRAG_Command_ | _RELEASE_Command_ | _MOVE_Command_ | _EXTEND_Command_

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

interface _SEND_Command_ extends __BASE_Command_<"SEND"> {
  id_Item: _Id_Item_
}

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
}

function eventsOf__Adapters(
  adapters: Array<_Adapter_Event_>
): Array<string> {
  return [...new Set(adapters.map((adapter) => adapter.event))]
}

function viewModelOf__State(
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
}

function stateAfter__Command<Kind extends _Command_TextEditor_["kind"]>({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<Kind>): _State__Viewer_TextEditor_ {
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

function SEND_stateAfter__Command({
  state,
  command
}: _Api___stateAfter__Command_<"SEND">): _State__Viewer_TextEditor_ {
  return closedAt__State({
    state,
    id_Item: command.id_Item
  })
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
      x_Goal: null
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
  layout_View
}: _Api___stateAfter__Command_<"MOVE">): _State__Viewer_TextEditor_ {
  return movedAt__State({
    state,
    by: command.by,
    direction: command.direction,
    isExtending: false,
    layout_View
  })
}

function EXTEND_stateAfter__Command({
  state,
  command,
  layout_View
}: _Api___stateAfter__Command_<"EXTEND">): _State__Viewer_TextEditor_ {
  return movedAt__State({
    state,
    by: command.by,
    direction: command.direction,
    isExtending: true,
    layout_View
  })
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
  const line_Run = viewModel_TextEditor.runs.find((run_Each) => run_Each.id === position_Drawn.id_Run)?.lines[position_Drawn.position.line]
  if (line_Run === undefined) return null
  const place_Text = (id_Text_Kept === null
    ? null
    : placeIn__Line({
      line_Run,
      offset: position_Drawn.position.offset,
      id_Text: id_Text_Kept
    })) ?? placeIn__Line({
    line_Run,
    offset: position_Drawn.position.offset,
    id_Text: null
  })
  return place_Text === null
    ? null
    : {
      id_Run: position_Drawn.id_Run,
      id_Text: place_Text.id_Text,
      position: place_Text.position
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
}

function movedAt__State({
  state,
  by,
  direction,
  isExtending,
  layout_View
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
    layout_View
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
}

type _StepMap__Unit_Move_ = {
  [Unit in _Unit_Move_]: (api_Step: _Api___steppedOf__Position_) => _Position_Drawn_ | null
}

const STEPMAP__UNIT_MOVE: _StepMap__Unit_Move_ = {
  CHARACTER: ({
    viewModel_TextEditor,
    position_Drawn,
    direction
  }) => steppedAlong__Lines({
    viewModel_TextEditor,
    position_Drawn,
    direction,
    boundariesOf: boundariesOf__Graphemes,
    isStep_Break: true
  }),
  WORD: ({
    viewModel_TextEditor,
    position_Drawn,
    direction
  }) => steppedAlong__Lines({
    viewModel_TextEditor,
    position_Drawn,
    direction,
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
  boundariesOf: (api_Boundaries: _Api___boundariesOf_) => Array<number>
  isStep_Break: boolean
}

interface _Api___boundariesOf_ {
  text: string
  direction: _Direction_Move_
}

function steppedAlong__Lines({
  viewModel_TextEditor,
  position_Drawn,
  direction,
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
      direction
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
  direction
}: _Api___boundariesOf_): Array<number> {
  const segments_Word = Array.from(new Intl.Segmenter(
    undefined,
    {
      granularity: "word"
    }
  ).segment(text)).filter((segment) => segment.isWordLike === true)
  return direction === "FORWARD"
    ? [
      ...segments_Word.map((segment) => segment.index + segment.segment.length),
      text.length
    ]
    : [
      0,
      ...segments_Word.map((segment) => segment.index)
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
  SEND: SEND_stateAfter__Command,
  DISCARD: DISCARD_stateAfter__Command,
  VISIT: VISIT_stateAfter__Command,
  PLACE: PLACE_stateAfter__Command,
  DRAG: DRAG_stateAfter__Command,
  RELEASE: RELEASE_stateAfter__Command,
  MOVE: MOVE_stateAfter__Command,
  EXTEND: EXTEND_stateAfter__Command
}
