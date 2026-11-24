import {
  viewModelOf__Tasks_Board,
  type _Task_Board_
} from "./Projection_Board.ts"
import {
  draw__View_Board,
  type _ComponentMap__View_Board_
} from "./View_Board.tsx"

export {
  _Board_,
  type _Api__Board_,
  type _Observer_Board_,
  type _Asked_Board_,
  type __BASE_Asked_Board_,
  type _SWITCH_Asked_Board_,
  type _START_Asked_Board_,
  type _STOP_Asked_Board_,
  type _COMPLETE_Asked_Board_,
  type _CANCEL_Asked_Board_,
  type _DISCARD_Asked_Board_,
  type _COLLECT_Asked_Board_,
  type _NEW_TASK__Asked_Board_,
  type _Update_Board_
}

class _Board_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_Board_
  tasks: Array<_Task_Board_>
  paths_Shown: Array<string>
  observers: Array<_Observer_Board_>

  constructor({
    containerElement,
    componentMap,
    tasks,
    paths_Shown,
    observers
  }: _Api__Board_) {
    this.containerElement = containerElement
    this.componentMap = componentMap
    this.tasks = tasks
    this.paths_Shown = paths_Shown
    this.observers = observers
    this.containerElement.addEventListener(
      "click",
      (event) => this.clicked(event)
    )
    this.containerElement.addEventListener(
      "keydown",
      (event) => this.pressed(event)
    )
    this.draw()
  }

  update(
    update_Board: _Update_Board_
  ): void {
    this.tasks = update_Board.tasks
    this.paths_Shown = update_Board.paths_Shown
    this.draw()
  }

  draw(): void {
    draw__View_Board({
      containerElement_View: this.containerElement,
      componentMap_View: this.componentMap,
      viewModel_Board: viewModelOf__Tasks_Board({
        tasks: this.tasks,
        paths_Shown: this.paths_Shown
      })
    })
    inStep__Board({
      containerElement_View: this.containerElement
    })
  }

  clicked(
    event: MouseEvent
  ): void {
    const element_Trigger = event.target instanceof Element ? event.target.closest(".trigger_More_htmlView") : null
    if (element_Trigger !== null) {
      if (event.detail === 0) opened__Menu({
        element_Trigger,
        isFromEnd: false
      })
      return
    }
    const asked_Board = askedOf__Event(event)
    if (asked_Board === null) return
    for (const observer of this.observers) observer.asked(asked_Board)
  }

  pressed(
    event: KeyboardEvent
  ): void {
    const element_Target = event.target instanceof Element ? event.target : null
    const element_Trigger = element_Target?.closest(".trigger_More_htmlView") ?? null
    if (element_Trigger !== null && isKey__Opening(event.key)) {
      event.preventDefault()
      opened__Menu({
        element_Trigger,
        isFromEnd: OPENINGMAP__KEY[event.key]
      })
      return
    }
    const element_Action = element_Target?.closest(".menu_Tile_htmlView > .action_Tile_htmlView") ?? null
    if (element_Action === null) return
    if (event.key === "Escape") {
      event.preventDefault()
      element_Action.closest(".more_Tile_htmlView")?.querySelector<HTMLElement>(".trigger_More_htmlView")?.focus()
      return
    }
    if (!isKey__Moving(event.key)) return
    event.preventDefault()
    movedIn__Menu({
      element_Action,
      indexOf__Move: INDEXMAP__KEY[event.key]
    })
  }
}

interface _Api__Board_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_Board_
  tasks: Array<_Task_Board_>
  paths_Shown: Array<string>
  observers: Array<_Observer_Board_>
}

interface _Observer_Board_ {
  asked: (asked_Board: _Asked_Board_) => void
}

type _Asked_Board_ = _SWITCH_Asked_Board_ | _START_Asked_Board_ | _STOP_Asked_Board_ | _COMPLETE_Asked_Board_ | _CANCEL_Asked_Board_ | _DISCARD_Asked_Board_ | _COLLECT_Asked_Board_ | _NEW_TASK__Asked_Board_

interface __BASE_Asked_Board_<Kind extends string> {
  kind: Kind
}

interface _SWITCH_Asked_Board_ extends __BASE_Asked_Board_<"SWITCH"> {
  id: string
}

interface _START_Asked_Board_ extends __BASE_Asked_Board_<"START"> {
  id: string
}

interface _STOP_Asked_Board_ extends __BASE_Asked_Board_<"STOP"> {
  id: string
}

interface _COMPLETE_Asked_Board_ extends __BASE_Asked_Board_<"COMPLETE"> {
  id: string
}

interface _CANCEL_Asked_Board_ extends __BASE_Asked_Board_<"CANCEL"> {
  id: string
}

interface _DISCARD_Asked_Board_ extends __BASE_Asked_Board_<"DISCARD"> {
  id: string
}

interface _COLLECT_Asked_Board_ extends __BASE_Asked_Board_<"COLLECT"> {
  ids: Array<string>
}

interface _NEW_TASK__Asked_Board_ extends __BASE_Asked_Board_<"NEW_TASK"> {}

interface _Update_Board_ {
  tasks: Array<_Task_Board_>
  paths_Shown: Array<string>
}

interface _Api___inStep__Board_ {
  containerElement_View: HTMLElement
}

function inStep__Board({
  containerElement_View
}: _Api___inStep__Board_): void {
  for (const animation of containerElement_View.getAnimations({
    subtree: true
  })) {
    if (animation instanceof CSSAnimation && NAME$__ANIMATION_BOARD.includes(animation.animationName) && animation.startTime !== 0) animation.startTime = 0
  }
}

const NAME$__ANIMATION_BOARD = [
  "turning_Board_htmlView",
  "shimmer_Board_htmlView"
]

interface _Api___opened__Menu_ {
  element_Trigger: Element
  isFromEnd: boolean
}

function opened__Menu({
  element_Trigger,
  isFromEnd
}: _Api___opened__Menu_): void {
  const element_More = element_Trigger.closest(".more_Tile_htmlView")
  const element_Focused = [...element_More?.querySelectorAll<HTMLElement>(".menu_Tile_htmlView > .action_Tile_htmlView") ?? []].at(isFromEnd ? -1 : 0)
  if (element_More === null || element_Focused === undefined) return
  focusedHeld__Menu({
    element_More,
    element_Focused
  })
}

interface _Api___focusedHeld__Menu_ {
  element_More: Element
  element_Focused: HTMLElement
}

function focusedHeld__Menu({
  element_More,
  element_Focused
}: _Api___focusedHeld__Menu_): void {
  element_More.toggleAttribute(
    "data-held",
    true
  )
  element_Focused.focus()
  element_More.removeAttribute("data-held")
}

function askedOf__Event(
  event: MouseEvent
): _Asked_Board_ | null {
  const element = event.target instanceof Element ? event.target.closest("[data-ask]") : null
  const kind = element?.getAttribute("data-ask")
  return element === null || element === undefined || typeof kind !== "string" || !isKind__Asked_Board(kind)
    ? null
    : ASKEDMAP__KIND[kind](element)
}

function isKind__Asked_Board(
  kind: string
): kind is keyof _AskedMap__Kind_ {
  return Object.hasOwn(ASKEDMAP__KIND, kind)
}

type _AskedMap__Kind_ = {
  [Kind in _Asked_Board_["kind"]]: (element: Element) => _Asked_Board_ | null
}

const ASKEDMAP__KIND: _AskedMap__Kind_ = {
  SWITCH: (element) => askedOf__Tile({
    element,
    askedOf__Id: (id) => ({
      kind: "SWITCH",
      id
    })
  }),
  START: (element) => askedOf__Tile({
    element,
    askedOf__Id: (id) => ({
      kind: "START",
      id
    })
  }),
  STOP: (element) => askedOf__Tile({
    element,
    askedOf__Id: (id) => ({
      kind: "STOP",
      id
    })
  }),
  COMPLETE: (element) => askedOf__Tile({
    element,
    askedOf__Id: (id) => ({
      kind: "COMPLETE",
      id
    })
  }),
  CANCEL: (element) => askedOf__Tile({
    element,
    askedOf__Id: (id) => ({
      kind: "CANCEL",
      id
    })
  }),
  DISCARD: (element) => askedOf__Tile({
    element,
    askedOf__Id: (id) => ({
      kind: "DISCARD",
      id
    })
  }),
  COLLECT: (element) => ({
    kind: "COLLECT",
    ids: (element.getAttribute("data-ids") ?? "").split(" ").filter((id) => id !== "")
  }),
  NEW_TASK: () => ({
    kind: "NEW_TASK"
  })
}

interface _Api___askedOf__Tile_ {
  element: Element
  askedOf__Id: (id: string) => _Asked_Board_
}

function askedOf__Tile({
  element,
  askedOf__Id
}: _Api___askedOf__Tile_): _Asked_Board_ | null {
  const id = element.closest(".tile_htmlView[data-id]")?.getAttribute("data-id")
  return typeof id === "string" ? askedOf__Id(id) : null
}

function isKey__Opening(
  key: string
): key is keyof _OpeningMap__Key_ {
  return Object.hasOwn(OPENINGMAP__KEY, key)
}

type _OpeningMap__Key_ = {
  [Key in "ArrowDown" | "ArrowUp"]: boolean
}

const OPENINGMAP__KEY: _OpeningMap__Key_ = {
  ArrowDown: false,
  ArrowUp: true
}

function isKey__Moving(
  key: string
): key is keyof _IndexMap__Key_ {
  return Object.hasOwn(INDEXMAP__KEY, key)
}

type _IndexMap__Key_ = {
  [Key in "ArrowDown" | "ArrowUp" | "Home" | "End"]: (
    index: number,
    count: number
  ) => number
}

const INDEXMAP__KEY: _IndexMap__Key_ = {
  ArrowDown: (
    index,
    count
  ) => (index + 1) % count,
  ArrowUp: (
    index,
    count
  ) => (index - 1 + count) % count,
  Home: () => 0,
  End: (
    index,
    count
  ) => count - 1
}

interface _Api___movedIn__Menu_ {
  element_Action: Element
  indexOf__Move: (
    index: number,
    count: number
  ) => number
}

function movedIn__Menu({
  element_Action,
  indexOf__Move
}: _Api___movedIn__Menu_): void {
  const element$_Action = [...element_Action.parentElement?.querySelectorAll<HTMLElement>(":scope > .action_Tile_htmlView") ?? []]
  const index_Moved = indexOf__Move(
    element$_Action.findIndex((element) => element === element_Action),
    element$_Action.length
  )
  const element_More = element_Action.closest(".more_Tile_htmlView")
  const element_Focused = element$_Action[index_Moved]
  if (element_More === null || element_Focused === undefined) return
  focusedHeld__Menu({
    element_More,
    element_Focused
  })
}
