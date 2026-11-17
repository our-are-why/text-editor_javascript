import type { _Module_TextEditor_ } from "../Viewer_TextEditor.ts"

export {
  MODULE_MOUSE
}

const MODULE_MOUSE: _Module_TextEditor_ = {
  name: "mouse",
  adapters: [
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
