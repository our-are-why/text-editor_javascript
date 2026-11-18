import type {
  _Adapter_Event_,
  _SEND_Command_,
  _SEND_REQUEST__Command_
} from "./Viewer_TextEditor.ts"
import type { _Id_Item_ } from "./ViewModel_TextEditor.ts"

export {
  CONTROLS__TEXTEDITOR
}

const CONTROLS__TEXTEDITOR: Array<_Adapter_Event_> = [
  {
    event: "copy",
    commandOf__Event: (event) => isInput__Event(event)
      ? {
        kind: "COPY"
      }
      : null
  },
  {
    event: "cut",
    commandOf__Event: (event) => isInput__Event(event)
      ? {
        kind: "CUT"
      }
      : null
  },
  {
    event: "paste",
    commandOf__Event: (event) => event instanceof ClipboardEvent && isInput__Event(event)
      ? {
        kind: "PASTE",
        text: event.clipboardData?.getData("text/plain") ?? ""
      }
      : null
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
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Revise = event.target instanceof Element ? event.target.closest(".item_htmlView[data-state='OPEN'] .action_htmlView[data-command][data-state-after='REQUESTED']") : null
      const id_Item = element_Revise === null
        ? null
        : idOf__Item({
          element: element_Revise
        })
      if (id_Item === null) return null
      const element_Notes = element_Revise?.closest(".item_htmlView")?.querySelector(".notes_htmlView")
      const isWritten = element_Notes instanceof HTMLTextAreaElement && element_Notes.value.trim() !== ""
      return element_Revise?.getAttribute("aria-expanded") === "true" && !isWritten
        ? {
          kind: "DISCARD",
          id_Item
        }
        : {
          kind: "DRAFT",
          id_Item
        }
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Action = event.target instanceof Element ? event.target.closest(".action_htmlView[data-command]") : null
      const command = element_Action?.getAttribute("data-command")
      const isRevise = element_Action?.matches(".item_htmlView[data-state='OPEN'] .action_htmlView[data-command][data-state-after='REQUESTED']") === true
      const id_Item = element_Action === null || element_Action === undefined || isRevise
        ? null
        : idOf__Item({
          element: element_Action
        })
      return typeof command === "string" && id_Item !== null
        ? {
          kind: "ACT",
          id_Item,
          command
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Draft = event.target instanceof Element ? event.target.closest(".action_htmlView[data-draft]") : null
      const kind = element_Draft?.getAttribute("data-draft")
      const id_Item = element_Draft === null || element_Draft === undefined
        ? null
        : idOf__Item({
          element: element_Draft
        })
      if (element_Draft === null || element_Draft === undefined || id_Item === null) return null
      return kind === "SEND"
        ? sentOf__Item({
          element: element_Draft,
          id_Item
        })
        : kind === "DISCARD"
          ? {
            kind,
            id_Item
          }
          : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Neighbor = event.target instanceof Element ? event.target.closest(".neighbor_htmlView") : null
      const id_Item_From = element_Neighbor === null ? null : idOf__Item({
        element: element_Neighbor
      })
      const way = element_Neighbor?.getAttribute("data-way")
      const first = Number(element_Neighbor?.getAttribute("data-frame-first") ?? Number.NaN)
      const last = Number(element_Neighbor?.getAttribute("data-frame-last") ?? Number.NaN)
      return id_Item_From !== null && (way === "PREVIOUS" || way === "NEXT") && Number.isInteger(first) && Number.isInteger(last)
        ? {
          kind: "VISIT",
          visit_Item: {
            id_Item: {
              source: id_Item_From.source,
              range_Frame: {
                first,
                last
              }
            },
            id_Item_From,
            way
          }
        }
        : null
    }
  },
  {
    event: "contextmenu",
    commandOf__Event: (event) => {
      if (!(event instanceof MouseEvent) || !(event.target instanceof Element) || event.target.closest(".menu_htmlView, .asking_htmlView, textarea") !== null) return null
      event.preventDefault()
      return {
        kind: "OPEN_MENU",
        point_Screen: {
          x: event.clientX,
          y: event.clientY
        }
      }
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => {
      const isMenuKey = event instanceof KeyboardEvent && (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))
      if (!isMenuKey || !(event.target instanceof Element) || event.target.closest(".input_htmlView") === null) return null
      event.preventDefault()
      return {
        kind: "OPEN_MENU",
        point_Screen: null
      }
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Choice = event.target instanceof Element ? event.target.closest(".menu_htmlView > .choice_htmlView[data-index]") : null
      const index = Number(element_Choice?.getAttribute("data-index") ?? Number.NaN)
      return Number.isInteger(index)
        ? {
          kind: "CHOOSE_MENU",
          index
        }
        : null
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => {
      if (!(event instanceof KeyboardEvent) || !(event.target instanceof Element) || event.target.closest(".menu_htmlView") === null) return null
      if (event.key === "Escape") {
        return {
          kind: "CLOSE_MENU"
        }
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return null
      event.preventDefault()
      return {
        kind: "STEP_MENU",
        direction: event.key === "ArrowDown" ? "FORWARD" : "BACKWARD"
      }
    }
  },
  {
    event: "focusout",
    commandOf__Event: (event) => {
      const element_Menu = event.target instanceof Element ? event.target.closest(".menu_htmlView") : null
      const isLeaving = event instanceof FocusEvent && element_Menu !== null && !(event.relatedTarget instanceof Node && element_Menu.contains(event.relatedTarget))
      return isLeaving
        ? {
          kind: "CLOSE_MENU"
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Button = event.target instanceof Element ? event.target.closest(".asking_htmlView [data-request]") : null
      const kind = element_Button?.getAttribute("data-request")
      if (element_Button === null || element_Button === undefined) return null
      return kind === "SEND"
        ? sentOf__Request(element_Button)
        : kind === "CLOSE"
          ? {
            kind: "CLOSE_REQUEST"
          }
          : null
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => {
      const element_Notes = event.target instanceof Element ? event.target.closest(".asking_htmlView > .notes_htmlView") : null
      if (!(event instanceof KeyboardEvent) || element_Notes === null) return null
      if (event.key === "Escape") {
        return {
          kind: "CLOSE_REQUEST"
        }
      }
      return event.key === "Enter" && (event.metaKey || event.ctrlKey)
        ? sentOf__Request(element_Notes)
        : null
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => {
      const element_Notes = event.target instanceof Element ? event.target.closest(".notes_htmlView") : null
      const id_Item = element_Notes === null
        ? null
        : idOf__Item({
          element: element_Notes
        })
      if (!(event instanceof KeyboardEvent) || id_Item === null) return null
      if (event.key === "Escape") {
        return {
          kind: "DISCARD",
          id_Item
        }
      }
      return event.key === "Enter" && (event.metaKey || event.ctrlKey) && element_Notes !== null
        ? sentOf__Item({
          element: element_Notes,
          id_Item
        })
        : null
    }
  }
]

function sentOf__Request(
  element: Element
): _SEND_REQUEST__Command_ | null {
  const element_Notes = element.closest(".asking_htmlView")?.querySelector(":scope > .notes_htmlView")
  return element_Notes instanceof HTMLTextAreaElement
    ? {
      kind: "SEND_REQUEST",
      notes: element_Notes.value
    }
    : null
}

interface _Api___sentOf__Item_ {
  element: Element
  id_Item: _Id_Item_
}

function sentOf__Item({
  element,
  id_Item
}: _Api___sentOf__Item_): _SEND_Command_ | null {
  const element_Item = element.closest(".item_htmlView")
  const command = element_Item?.querySelector(".action_htmlView[data-command][data-state-after='REQUESTED']")?.getAttribute("data-command")
  const element_Notes = element_Item?.querySelector(".notes_htmlView")
  return typeof command === "string" && element_Notes instanceof HTMLTextAreaElement
    ? {
      kind: "SEND",
      id_Item,
      command,
      notes: element_Notes.value
    }
    : null
}

interface _Api___idOf__Item_ {
  element: Element
}

function idOf__Item({
  element
}: _Api___idOf__Item_): _Id_Item_ | null {
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

function isInput__Event(
  event: Event
): boolean {
  return event.target instanceof Element && event.target.classList.contains("input_htmlView")
}
