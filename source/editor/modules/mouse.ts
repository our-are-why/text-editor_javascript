import type { _Module_TextEditor_ } from "../Viewer_TextEditor.ts"

export {
  MODULE_MOUSE
}

const MODULE_MOUSE: _Module_TextEditor_ = {
  name: "mouse",
  adapters: [
    {
      event: "mousedown",
      commandOf__Event: (event) => {
        if (event.target instanceof Element && event.target.closest(".line_htmlView") !== null && event.target.closest(".note_htmlView") === null) event.preventDefault()
        return null
      }
    },
    {
      event: "pointerdown",
      commandOf__Event: (event) => event instanceof PointerEvent && event.button === 0 && event.target instanceof Element && event.target.closest(".line_htmlView") !== null && event.target.closest(".note_htmlView") === null
        ? {
          kind: "PLACE",
          point_Screen: {
            x: event.clientX,
            y: event.clientY
          },
          isExtending: event.shiftKey
        }
        : null
    },
    {
      event: "pointermove",
      commandOf__Event: (event) => event instanceof PointerEvent && (event.buttons & 1) === 1
        ? {
          kind: "DRAG",
          point_Screen: {
            x: event.clientX,
            y: event.clientY
          }
        }
        : null
    },
    {
      event: "pointerup",
      commandOf__Event: () => ({
        kind: "RELEASE"
      })
    },
    {
      event: "pointermove",
      commandOf__Event: (event) => event instanceof PointerEvent
        ? {
          kind: "POINT",
          point_Screen: {
            x: event.clientX,
            y: event.clientY
          }
        }
        : null
    },
    {
      event: "pointerleave",
      commandOf__Event: () => ({
        kind: "POINT",
        point_Screen: null
      })
    }
  ]
}
