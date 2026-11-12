import type { _Module_TextEditor_ } from "../TextEditor.ts"

export {
  MODULE_MOUSE
}

const MODULE_MOUSE: _Module_TextEditor_ = {
  name: "mouse",
  adapters: [
    {
      event: "pointerover",
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
    },
    {
      event: "click",
      commandOf__Event: (event) => {
        const element_Note = event.target instanceof Element ? event.target.closest(".note_htmlView") : null
        const source = element_Note?.getAttribute("data-target-source")
        const side = element_Note?.getAttribute("data-target-side")
        return typeof source === "string" && typeof side === "string"
          ? {
            kind: "JUMP",
            target_Note: {
              source,
              side
            }
          }
          : null
      }
    }
  ]
}
