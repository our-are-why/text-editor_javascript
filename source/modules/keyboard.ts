import type { _Module_TextEditor_, _Unit_Move_, _Direction_Move_ } from "../Viewer_TextEditor.ts"

export {
  MODULE_KEYBOARD
}

const MODULE_KEYBOARD: _Module_TextEditor_ = {
  name: "keyboard",
  adapters: [
    {
      event: "keydown",
      commandOf__Event: (event) => {
        if (!(event instanceof KeyboardEvent) || !(event.target instanceof Element) || !event.target.classList.contains("htmlView_editor")) return null
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
    }
  ]
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
