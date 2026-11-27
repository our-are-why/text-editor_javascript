import type {
  _Module_TextEditor_,
  _Command_TextEditor_,
  _Unit_Move_,
  _Direction_Move_
} from "../Viewer_TextEditor.ts"

export {
  MODULE_KEYBOARD
}

const MODULE_KEYBOARD: _Module_TextEditor_ = {
  name: "keyboard",
  adapters: [
    {
      event: "keydown",
      commandOf__Event: (event) => {
        if (!isTyped__Event(event)) return null
        const move_Key = MOVEMAP__KEY[event.key]
        if (move_Key === undefined) return null
        event.preventDefault()
        const by = (event.altKey || event.ctrlKey) && move_Key.by === "CHARACTER"
          ? "WORD"
          : event.metaKey && move_Key.by === "CHARACTER" ? "EDGE" : move_Key.by
        return {
          kind: event.shiftKey ? "EXTEND" : "MOVE",
          by,
          direction: move_Key.direction
        }
      }
    },
    {
      event: "keydown",
      commandOf__Event: (event) => {
        if (!isTyped__Event(event)) return null
        const command = EDITMAP__KEY[event.key]?.(event) ?? null
        if (command !== null) event.preventDefault()
        return command
      }
    }
  ]
}

function isTyped__Event(
  event: Event
): event is KeyboardEvent {
  return event instanceof KeyboardEvent && !event.isComposing && event.target instanceof Element && event.target.classList.contains("input_htmlView")
}

interface _Move_Key_ {
  by: _Unit_Move_
  direction: _Direction_Move_
}

interface _MoveMap__Key_ {
  [key: string]: _Move_Key_
}

const MOVEMAP__KEY: _MoveMap__Key_ = {
  ArrowLeft: {
    by: "CHARACTER",
    direction: "BACKWARD"
  },
  ArrowRight: {
    by: "CHARACTER",
    direction: "FORWARD"
  },
  ArrowUp: {
    by: "LINE",
    direction: "BACKWARD"
  },
  ArrowDown: {
    by: "LINE",
    direction: "FORWARD"
  },
  Home: {
    by: "EDGE",
    direction: "BACKWARD"
  },
  End: {
    by: "EDGE",
    direction: "FORWARD"
  }
}

interface _EditMap__Key_ {
  [key: string]: (event: KeyboardEvent) => _Command_TextEditor_ | null
}

const EDITMAP__KEY: _EditMap__Key_ = {
  Backspace: (event) => ({
    kind: "DELETE",
    by: unitOf__Delete(event),
    direction: "BACKWARD"
  }),
  Delete: (event) => ({
    kind: "DELETE",
    by: unitOf__Delete(event),
    direction: "FORWARD"
  }),
  Enter: () => ({
    kind: "INSERT",
    text: "\n",
    isTyping: false
  }),
  z: undoneOf__Event,
  Z: undoneOf__Event,
  y: (event) => event.ctrlKey
    ? {
      kind: "REDO"
    }
    : null
}

function unitOf__Delete(
  event: KeyboardEvent
): _Unit_Move_ {
  return event.altKey || event.ctrlKey ? "WORD" : event.metaKey ? "EDGE" : "CHARACTER"
}

function undoneOf__Event(
  event: KeyboardEvent
): _Command_TextEditor_ | null {
  return event.ctrlKey || event.metaKey
    ? {
      kind: event.shiftKey ? "REDO" : "UNDO"
    }
    : null
}
