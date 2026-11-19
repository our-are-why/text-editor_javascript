import type {
  _Adapter_Event_,
  _SEND_Command_,
  _SEND_REQUEST__Command_,
  _SAVE_EDIT__Command_,
  _Scope_Work_
} from "./Viewer_TextEditor.ts"
import type {
  _Id_Item_,
  _Range_Lines_
} from "./ViewModel_TextEditor.ts"

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
      const element_Revise = event.target instanceof Element ? event.target.closest(":is(.action_htmlView, .add_Request_htmlView)[data-command][aria-expanded]") : null
      const id_Item = element_Revise === null
        ? null
        : idOf__Item({
          element: element_Revise
        })
      if (id_Item === null) return null
      return element_Revise?.getAttribute("aria-expanded") === "true"
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
      const isRevise = element_Action?.matches(".action_htmlView[data-command][aria-expanded]") === true
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
      return kind === "ADD" || kind === "START"
        ? sentOf__Item({
          element: element_Draft,
          id_Item,
          isStarting: kind === "START"
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
      return isWritten__Form_Point({
        element: event.target
      })
        ? {
          kind: "FOCUS_REQUEST"
        }
        : {
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
      return isWritten__Form_Point({
        element: event.target
      })
        ? {
          kind: "FOCUS_REQUEST"
        }
        : {
          kind: "OPEN_MENU",
          point_Screen: null
        }
    }
  },
  {
    event: "mousedown",
    commandOf__Event: (event) => {
      if (event.target instanceof Element && event.target.closest(".menu_htmlView, .asking_htmlView[data-place=\"POINT\"]") !== null && event.target.closest("textarea, button") === null) event.preventDefault()
      return null
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
    event: "scroll",
    commandOf__Event: (event) => event.target instanceof Element && event.target.matches(".document_htmlView") && event.target.closest(".htmlView_editor")?.querySelector(".menu_htmlView, .asking_htmlView[data-place=\"POINT\"]") !== null
      ? {
        kind: "SCROLL",
        isWritten_Form: isWritten__Form_Point({
          element: event.target
        })
      }
      : null
  },
  {
    event: "focusout",
    commandOf__Event: (event) => {
      const element_Form = event.target instanceof Element ? event.target.closest(".asking_htmlView[data-place=\"POINT\"]") : null
      const element_Notes = element_Form?.querySelector(":scope > .notes_htmlView")
      if (!(event instanceof FocusEvent) || element_Form === null || element_Form === undefined || !(element_Notes instanceof HTMLTextAreaElement) || element_Notes.value.trim() !== "" || !document.hasFocus()) return null
      return event.relatedTarget instanceof Node && element_Form.contains(event.relatedTarget)
        ? null
        : event.relatedTarget === null
          ? event.target === element_Notes
            ? {
              kind: "CLOSE_REQUEST"
            }
            : null
          : {
            kind: "LEAVE_REQUEST"
          }
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => event instanceof KeyboardEvent && event.key === "Escape" && event.target instanceof Element && event.target.closest(".asking_htmlView[data-place=\"POINT\"]") !== null && event.target.closest(".notes_htmlView") === null
      ? {
        kind: "CLOSE_REQUEST"
      }
      : null
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
      return kind === "ADD" || kind === "START"
        ? sentOf__Request({
          element: element_Button,
          isStarting: kind === "START"
        })
        : kind === "CLOSE"
          ? {
            kind: "CLOSE_REQUEST"
          }
          : kind === "DROP"
            ? {
              kind: "DROP_QUOTE"
            }
            : kind === "SHOW"
              ? {
                kind: "TOGGLE_QUOTE"
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
        ? sentOf__Request({
          element: element_Notes,
          isStarting: false
        })
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Edit = event.target instanceof Element ? event.target.closest(".edit_Said_htmlView[data-edit]") : null
      const id = element_Edit?.getAttribute("data-edit")
      return element_Edit === null || element_Edit === undefined || typeof id !== "string"
        ? null
        : {
          kind: "EDIT",
          id_Item: idOf__Item({
            element: element_Edit
          }),
          id
        }
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Button = event.target instanceof Element ? event.target.closest(".said_htmlView [data-edit-action]") : null
      const kind = element_Button?.getAttribute("data-edit-action")
      if (element_Button === null || element_Button === undefined) return null
      return kind === "SAVE"
        ? savedOf__Edit({
          element: element_Button
        })
        : kind === "CANCEL"
          ? {
            kind: "CLOSE_EDIT"
          }
          : null
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => {
      const element_Notes = event.target instanceof Element ? event.target.closest(".notes_Edit_htmlView") : null
      if (!(event instanceof KeyboardEvent) || element_Notes === null) return null
      if (event.key === "Escape") {
        return {
          kind: "CLOSE_EDIT"
        }
      }
      return event.key === "Enter" && (event.metaKey || event.ctrlKey)
        ? savedOf__Edit({
          element: element_Notes
        })
        : null
    }
  },
  {
    event: "focusin",
    commandOf__Event: (event) => {
      const element_Notes = event.target instanceof Element ? event.target.closest(".htmlView_editor")?.querySelector(".card_htmlView .asking_htmlView > .notes_htmlView") : null
      return element_Notes instanceof HTMLTextAreaElement && element_Notes.value.trim() === "" && event.target instanceof Node && element_Notes.closest(".card_htmlView")?.contains(event.target) !== true
        ? {
          kind: "LEAVE_REQUEST"
        }
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
          id_Item,
          isStarting: false
        })
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Remove = event.target instanceof Element ? event.target.closest(".remove_htmlView[data-remove]") : null
      const id = element_Remove?.getAttribute("data-remove")
      const asked = element_Remove === null
        ? null
        : askedOf__Request({
          element: element_Remove
        })
      return asked !== null && typeof id === "string"
        ? {
          kind: "REMOVE",
          source: asked.source,
          id
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Dismiss = event.target instanceof Element ? event.target.closest(".dismiss_Said_htmlView[data-dismiss]") : null
      const id = element_Dismiss?.getAttribute("data-dismiss")
      const asked = element_Dismiss === null || element_Dismiss === undefined
        ? null
        : askedOf__Request({
          element: element_Dismiss
        })
      return asked !== null && typeof id === "string"
        ? {
          kind: "DISMISS",
          source: asked.source,
          id
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Rerun = event.target instanceof Element ? event.target.closest(".stale_htmlView > .rerun_htmlView") : null
      const id_Item = element_Rerun === null
        ? null
        : idOf__Item({
          element: element_Rerun
        })
      return id_Item === null
        ? null
        : {
          kind: "RERUN",
          id_Item
        }
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Ask = event.target instanceof Element ? event.target.closest(".header_htmlView [data-ask]") : null
      const kind = element_Ask?.getAttribute("data-ask")
      return element_Ask?.getAttribute("aria-expanded") === "true"
        ? {
          kind: "CLOSE_REQUEST"
        }
        : kind === "DOCUMENT" || kind === "TASK"
          ? {
            kind: "OPEN_REQUEST",
            target: {
              kind,
              reference: null
            }
          }
          : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Accept = event.target instanceof Element ? event.target.closest(".head_Proposals_htmlView [data-accept-all]") : null
      const range = element_Accept === null
        ? null
        : rangeOf__Frame({
          element: element_Accept
        })
      return range === null
        ? null
        : {
          kind: "ACCEPT_ALL",
          range
        }
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => event instanceof KeyboardEvent && event.key === "Escape" && event.target instanceof Element && event.target.closest(".task_Header_htmlView, .document_Header_htmlView") !== null
      ? {
        kind: "CLOSE_CARD"
      }
      : null
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const command = event.target instanceof Element ? event.target.closest(".header_htmlView .action_htmlView[data-task]")?.getAttribute("data-task") : null
      return typeof command === "string"
        ? {
          kind: "TASK",
          command
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Work = event.target instanceof Element ? event.target.closest("[data-scope][data-work]") : null
      const kind = element_Work?.getAttribute("data-scope")
      const scope = element_Work === null || element_Work === undefined || typeof kind !== "string" || !isKind__Scope_Work(kind)
        ? null
        : SCOPEMAP__KIND_WORK[kind](element_Work)
      return scope === null
        ? null
        : element_Work?.getAttribute("data-work") === "STOP"
          ? {
            kind: "STOP",
            scope
          }
          : {
            kind: "START",
            scope
          }
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Stop = event.target instanceof Element ? event.target.closest(".stop_Said_htmlView[data-stop]") : null
      const id = element_Stop?.getAttribute("data-stop")
      const asked = element_Stop === null || element_Stop === undefined
        ? null
        : askedOf__Request({
          element: element_Stop
        })
      return asked !== null && typeof id === "string"
        ? {
          kind: "STOP",
          scope: {
            kind: "REQUEST",
            source: asked.source,
            id
          }
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Start = event.target instanceof Element ? event.target.closest(".start_Said_htmlView[data-start]") : null
      const id = element_Start?.getAttribute("data-start")
      const asked = element_Start === null
        ? null
        : askedOf__Request({
          element: element_Start
        })
      return asked !== null && typeof id === "string"
        ? {
          kind: "START",
          scope: {
            kind: "REQUEST",
            source: asked.source,
            id
          }
        }
        : null
    }
  },
  {
    event: "click",
    commandOf__Event: (event) => {
      const element_Confirm = event.target instanceof Element ? event.target.closest(".actions_htmlView[data-confirming] > [data-confirm]") : null
      return element_Confirm === null
        ? null
        : {
          kind: "CONFIRM",
          isConfirmed: element_Confirm.getAttribute("data-confirm") === "YES"
        }
    }
  },
  {
    event: "keydown",
    commandOf__Event: (event) => event instanceof KeyboardEvent && event.key === "Escape" && event.target instanceof Element && event.target.closest(".actions_htmlView[data-confirming]") !== null
      ? {
        kind: "CONFIRM",
        isConfirmed: false
      }
      : null
  }
]

interface _Api___isWritten__Form_Point_ {
  element: Element
}

function isWritten__Form_Point({
  element
}: _Api___isWritten__Form_Point_): boolean {
  const element_Notes = notesOf__Form_Point({
    element
  })
  return element_Notes !== null && element_Notes.value.trim() !== ""
}

interface _Api___notesOf__Form_Point_ {
  element: Element
}

function notesOf__Form_Point({
  element
}: _Api___notesOf__Form_Point_): HTMLTextAreaElement | null {
  const element_Notes = element.closest(".htmlView_editor")?.querySelector(".asking_htmlView[data-place=\"POINT\"] > .notes_htmlView")
  return element_Notes instanceof HTMLTextAreaElement ? element_Notes : null
}

interface _Api___sentOf__Request_ {
  element: Element
  isStarting: boolean
}

function sentOf__Request({
  element,
  isStarting
}: _Api___sentOf__Request_): _SEND_REQUEST__Command_ | null {
  const element_Notes = element.closest(".asking_htmlView")?.querySelector(":scope > .notes_htmlView")
  return element_Notes instanceof HTMLTextAreaElement
    ? {
      kind: "SEND_REQUEST",
      notes: element_Notes.value,
      isStarting
    }
    : null
}

interface _Api___savedOf__Edit_ {
  element: Element
}

function savedOf__Edit({
  element
}: _Api___savedOf__Edit_): _SAVE_EDIT__Command_ | null {
  const element_Notes = element.closest(".said_htmlView")?.querySelector(":scope > .notes_Edit_htmlView")
  return element_Notes instanceof HTMLTextAreaElement
    ? {
      kind: "SAVE_EDIT",
      notes: element_Notes.value
    }
    : null
}

interface _Api___sentOf__Item_ {
  element: Element
  id_Item: _Id_Item_
  isStarting: boolean
}

function sentOf__Item({
  element,
  id_Item,
  isStarting
}: _Api___sentOf__Item_): _SEND_Command_ | null {
  const element_Item = element.closest(".item_htmlView")
  const command = element_Item?.querySelector("[data-command][aria-expanded]")?.getAttribute("data-command")
  const element_Notes = element_Item?.querySelector(".notes_htmlView")
  return typeof command === "string" && element_Notes instanceof HTMLTextAreaElement
    ? {
      kind: "SEND",
      id_Item,
      command,
      notes: element_Notes.value,
      isStarting
    }
    : null
}

interface _Api___askedOf__Request_ {
  element: Element
}

interface _Asked_Request_ {
  source: string | null
}

function askedOf__Request({
  element
}: _Api___askedOf__Request_): _Asked_Request_ | null {
  if (element.closest(".card_htmlView") !== null) {
    return {
      source: null
    }
  }
  const id_Item = idOf__Item({
    element
  })
  return id_Item === null
    ? null
    : {
      source: id_Item.source
    }
}

function isKind__Scope_Work(
  kind: string
): kind is keyof _ScopeMap__Kind_Work_ {
  return Object.hasOwn(SCOPEMAP__KIND_WORK, kind)
}

type _ScopeMap__Kind_Work_ = {
  [Kind in Exclude<_Scope_Work_["kind"], "REQUEST">]: (element: Element) => _Scope_Work_ | null
}

const SCOPEMAP__KIND_WORK: _ScopeMap__Kind_Work_ = {
  PROPOSAL: (element) => {
    const id_Item = idOf__Item({
      element
    })
    return id_Item === null
      ? null
      : {
        kind: "PROPOSAL",
        source: id_Item.source
      }
  },
  FRAME: (element) => {
    const range = rangeOf__Frame({
      element
    })
    return range === null
      ? null
      : {
        kind: "FRAME",
        range,
        sources: [...element.closest(".frame_htmlView")?.querySelectorAll(".item_htmlView[data-source]") ?? []].map((element_Item) => element_Item.getAttribute("data-source") ?? "")
      }
  },
  DOCUMENT_REQUESTS: () => ({
    kind: "DOCUMENT_REQUESTS"
  }),
  DOCUMENT: () => ({
    kind: "DOCUMENT"
  }),
  TASK_REQUESTS: () => ({
    kind: "TASK_REQUESTS"
  }),
  TASK: () => ({
    kind: "TASK"
  })
}

interface _Api___idOf__Item_ {
  element: Element
}

function idOf__Item({
  element
}: _Api___idOf__Item_): _Id_Item_ | null {
  const source = element.closest(".item_htmlView")?.getAttribute("data-source")
  const range_Frame = rangeOf__Frame({
    element
  })
  return typeof source === "string" && range_Frame !== null
    ? {
      source,
      range_Frame
    }
    : null
}

interface _Api___rangeOf__Frame_ {
  element: Element
}

function rangeOf__Frame({
  element
}: _Api___rangeOf__Frame_): _Range_Lines_ | null {
  const element_Fold = element.closest(".frame_htmlView")?.querySelector(":scope > .fold_htmlView")
  const first = Number(element_Fold?.getAttribute("data-fold-first") ?? Number.NaN)
  const last = Number(element_Fold?.getAttribute("data-fold-last") ?? Number.NaN)
  return Number.isInteger(first) && Number.isInteger(last)
    ? {
      first,
      last
    }
    : null
}

function isInput__Event(
  event: Event
): boolean {
  return event.target instanceof Element && event.target.classList.contains("input_htmlView")
}
