import type { _Module_TextEditor_ } from "../TextEditor.ts"

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
    },
    {
      event: "click",
      commandOf__Event: (event) => {
        const element_Fold = event.target instanceof Element ? event.target.closest("[data-fold-first]") : null
        const first = Number(element_Fold?.getAttribute("data-fold-first") ?? Number.NaN)
        const last = Number(element_Fold?.getAttribute("data-fold-last") ?? Number.NaN)
        return event instanceof MouseEvent && Number.isInteger(first) && Number.isInteger(last)
          ? {
            kind: "FOLD",
            range_Frame: {
              first,
              last
            },
            point_Screen: {
              x: event.clientX,
              y: event.clientY
            }
          }
          : null
      }
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
