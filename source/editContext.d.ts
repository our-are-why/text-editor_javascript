// EditContext, Chromium's, which TypeScript's own DOM types don't hold yet: a
// text the editor keeps, the slice of a text the caret's in, which typing and
// input methods update, and is told where its caret and characters are, so
// an input method's window sits by the caret; set on an element, it makes
// the element the one text input goes to while it's focused

interface EditContextInit {
  text?: string
  selectionStart?: number
  selectionEnd?: number
}

interface TextUpdateEvent extends Event {
  readonly updateRangeStart: number
  readonly updateRangeEnd: number
  readonly text: string
  readonly selectionStart: number
  readonly selectionEnd: number
}

interface CharacterBoundsUpdateEvent extends Event {
  readonly rangeStart: number
  readonly rangeEnd: number
}

interface EditContextEventMap {
  textupdate: TextUpdateEvent
  compositionstart: CompositionEvent
  compositionend: CompositionEvent
  characterboundsupdate: CharacterBoundsUpdateEvent
}

declare class EditContext extends EventTarget {
  constructor(init?: EditContextInit)
  readonly text: string
  readonly selectionStart: number
  readonly selectionEnd: number
  updateText(rangeStart: number, rangeEnd: number, text: string): void
  updateSelection(start: number, end: number): void
  updateControlBounds(controlBounds: DOMRect): void
  updateSelectionBounds(selectionBounds: DOMRect): void
  updateCharacterBounds(rangeStart: number, characterBounds: Array<DOMRect>): void
  addEventListener<Type extends keyof EditContextEventMap>(type: Type, listener: (event: EditContextEventMap[Type]) => void): void
}

interface HTMLElement {
  editContext: EditContext | null
}
