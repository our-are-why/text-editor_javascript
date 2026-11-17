import type { _Adapter_Event_ } from "./TextEditor.ts"
import type { _Draft_Item_ } from "./ViewModel_TextEditor.ts"

export {
  CONTROLS__TEXTEDITOR
}

const CONTROLS__TEXTEDITOR: Array<_Adapter_Event_> = [
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
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Revise = event.target instanceof Element ? event.target.closest(".item_htmlView[data-state='OPEN'] .action_htmlView[data-command][data-state-after='REQUESTED']") : null
      const draft_Item = element_Revise === null
        ? null
        : draftOf__Element({
          element: element_Revise
        })
      if (draft_Item === null) return null
      const element_Notes = element_Revise?.closest(".item_htmlView")?.querySelector(".notes_htmlView")
      const isWritten = element_Notes instanceof HTMLTextAreaElement && element_Notes.value.trim() !== ""
      return element_Revise?.getAttribute("aria-expanded") === "true" && !isWritten
        ? {
          kind: "DISCARD",
          draft_Item
        }
        : {
          kind: "DRAFT",
          draft_Item
        }
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Draft = event.target instanceof Element ? event.target.closest(".action_htmlView[data-draft]") : null
      const kind = element_Draft?.getAttribute("data-draft")
      const draft_Item = element_Draft === null || element_Draft === undefined
        ? null
        : draftOf__Element({
          element: element_Draft
        })
      return (kind === "SEND" || kind === "DISCARD") && draft_Item !== null
        ? {
          kind,
          draft_Item
        }
        : null
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => {
      const element_Notes = event.target instanceof Element ? event.target.closest(".notes_htmlView") : null
      const draft_Item = element_Notes === null
        ? null
        : draftOf__Element({
          element: element_Notes
        })
      if (!(event instanceof KeyboardEvent) || draft_Item === null) return null
      if (event.key === "Escape") {
        return {
          kind: "DISCARD",
          draft_Item
        }
      }
      return event.key === "Enter" && (event.metaKey || event.ctrlKey)
        ? {
          kind: "SEND",
          draft_Item
        }
        : null
    }
  }
]

interface _Api___draftOf__Element_ {
  element: Element
}

function draftOf__Element({
  element
}: _Api___draftOf__Element_): _Draft_Item_ | null {
  const source = element.closest(".item_htmlView")?.getAttribute("data-source")
  const element_Fold = element.closest(".frame_htmlView")?.querySelector(":scope > .fold_htmlView")
  const first = Number(element_Fold?.getAttribute("data-fold-first") ?? Number.NaN)
  const last = Number(element_Fold?.getAttribute("data-fold-last") ?? Number.NaN)
  return typeof source === "string" && Number.isInteger(first) && Number.isInteger(last)
    ? {
      source,
      range_Frame: {
        first,
        last
      }
    }
    : null
}
