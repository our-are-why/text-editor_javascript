import "./View_TextEditor.css"
import {
  draw__Node_Jsx,
  type JSX,
  type _Node_Jsx_
} from "./Jsx.ts"
import type {
  _ViewModel_TextEditor_,
  _Target_Note_,
  _Id_Item_,
  _Block_ViewModel_,
  __BASE_Block__ViewModel_,
  _LINES_Block__ViewModel_,
  _Run_Lines_,
  _Line_Run_,
  _Gutter_Line_,
  _Segment_Line_,
  _Note_Line_,
  _FRAME_Block__ViewModel_,
  _FOLDED_Block__ViewModel_,
  _Range_Lines_,
  _Part_Frame_,
  __BASE_Part__Frame_,
  _CURRENT_Part__Frame_,
  _PROPOSED_Part__Frame_,
  _HEAD_Part__Frame_,
  _PROPOSALS_Part__Frame_,
  _Item_Proposals_,
  _Places_Item_,
  __BASE_Places_Item_,
  _COUNT_Places_Item_,
  _Condition_Places_,
  __BASE_Condition_Places_,
  _WITHIN_Condition_Places_,
  _CARRIED_Condition_Places_,
  _MOVE_Places_Item_,
  _Way_Move_,
  _Neighbors_Item_,
  _Request_Item_,
  _Action_Item_,
  _Attributes_Element_,
  _Underlay_Text_,
  __BASE_Underlay_Text_,
  _STRETCH_Underlay_Text_,
  _Position_Run_,
  _Selection_Drawn_,
  _Position_Drawn_,
  _Point_Screen_,
  _Header_ViewModel_,
  _Form_Request_,
  _Id_Request_,
  _Task_Header_,
  _Proposals_Card_,
  _Revisions_Scope_,
  _Revisions_Level_,
  _Document_Header_,
  _Document_Card_,
  _Menu_ViewModel_,
  _Peek_Quote_,
  _Reference_Request_,
  _State_Proposal_
} from "./ViewModel_TextEditor.ts"

export {
  _View_TextEditor_,
  type _Api__View_TextEditor_,
  type _ComponentMap__View_TextEditor_,
  type _ComponentMap_Block_,
  type _ComponentMap_Part_,
  type _ComponentMap_Places_,
  type _ComponentMap_Condition_,
  COMPONENTMAP__VIEW_TEXTEDITOR,
  type _Api___Block_TextEditor__Html_,
  type _Api___Line_Run__Html_,
  type _Api___Section_Frame__Html_,
  type _Point_Screen_,
  type _Layout_View_,
  type _Caret_Screen_,
  type _Kind_Popover_,
  type _Focus_Draft_,
  type _Visit_Item_,
  type _Focus_Asking_,
  type _Api___Header_TextEditor__Html_,
  type _Api___Menu_TextEditor__Html_,
  type _Api___Request_TextEditor__Html_
}

class _View_TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
  run$: Array<_Run_Lines_>
  selection: _Selection_Drawn_ | null
  ink$_Glyph: Map<string, _Ink_Glyph_>
  id: string
  resizeObserver_containerElement: ResizeObserver
  mutationObserver_containerElement: MutationObserver
  room: _Room_View_
  isJumping: boolean
  top_Jumped: number
  placed$: _Placed$_View_

  constructor({
    containerElement,
    componentMap
  }: _Api__View_TextEditor_) {
    this.containerElement = containerElement
    this.componentMap = componentMap
    this.run$ = []
    this.selection = null
    this.ink$_Glyph = new Map()
    this.id = crypto.randomUUID()
    this.resizeObserver_containerElement = new ResizeObserver(() => this.resized())
    this.resizeObserver_containerElement.observe(this.containerElement)
    this.mutationObserver_containerElement = new MutationObserver(() => this.measure())
    this.mutationObserver_containerElement.observe(
      this.containerElement,
      {
        attributes: true
      }
    )
    this.containerElement.addEventListener(
      "input",
      () => heldTillWritten__Form({
        containerElement_View: this.containerElement
      })
    )
    this.room = {
      above: 0,
      below: 0
    }
    this.isJumping = false
    this.top_Jumped = 0
    this.placed$ = {
      MENU: null,
      FORM: null
    }
    this.containerElement.addEventListener(
      "scroll",
      () => this.scrolled(),
      {
        capture: true,
        passive: true
      }
    )
    this.containerElement.addEventListener(
      "scrollend",
      (event) => {
        if (!(event.target instanceof Element) || !event.target.matches(".document_htmlView")) return
        this.settled(event.target)
      },
      {
        capture: true
      }
    )
  }

  draw(
    viewModel_TextEditor: _ViewModel_TextEditor_
  ): void {
    const class_Card = classOf__Card_Focused({
      containerElement_View: this.containerElement
    })
    draw__View_TextEditor({
      containerElement_View: this.containerElement,
      componentMap_View: this.componentMap,
      viewModel_TextEditor
    })
    drawRoom__View_TextEditor({
      containerElement_View: this.containerElement,
      room_View: this.room
    })
    heldTillWritten__Form({
      containerElement_View: this.containerElement
    })
    keptOpen__Card({
      containerElement_View: this.containerElement,
      class_Card
    })
    this.run$ = viewModel_TextEditor.runs
    this.selection = viewModel_TextEditor.selection
    this.measure()
    this.keep()
  }

  keep(): void {
    this.placed$ = keptInEditor__View_TextEditor({
      containerElement_View: this.containerElement,
      placed$_View: this.placed$
    })
    peekedIf__Unseen_Quoted({
      containerElement_View: this.containerElement
    })
  }

  resized(): void {
    this.measure()
    this.keep()
  }

  measure(): void {
    drawTextUnderlay$__View_TextEditor({
      containerElement_View: this.containerElement,
      run$_View: this.run$,
      ink$_Glyph_View: this.ink$_Glyph,
      id_View: this.id
    })
    drawSelection__View_TextEditor({
      containerElement_View: this.containerElement,
      selection_View: this.selection
    })
  }

  positionAt(
    point_Screen: _Point_Screen_
  ): _Position_Drawn_ | null {
    return positionAt__View_TextEditor({
      containerElement_View: this.containerElement,
      point_Screen
    })
  }

  focusAsking(
    focus_Asking: _Focus_Asking_
  ): void {
    const element = this.containerElement.querySelector(SELECTORMAP__FOCUS_ASKING[focus_Asking])
    if (element instanceof HTMLElement) element.focus()
  }

  isMoved(
    kind_Popover: _Kind_Popover_
  ): boolean {
    const placed_Popover = this.placed$[kind_Popover]
    const element_Scroller = this.containerElement.querySelector(".document_htmlView")
    if (placed_Popover === null || !(element_Scroller instanceof HTMLElement)) return false
    const shift = shiftOf__Popover({
      placed_Popover,
      element_Scroller
    })
    return Math.abs(shift.x) >= 1 || Math.abs(shift.y) >= 1
  }

  caretOf(
    position_Drawn: _Position_Drawn_
  ): _Caret_Screen_ | null {
    return caretOf__View_TextEditor({
      containerElement_View: this.containerElement,
      position_Drawn
    })
  }

  sourceAt(
    point_Screen: _Point_Screen_
  ): string | null {
    return sourceAt__View_TextEditor({
      containerElement_View: this.containerElement,
      point_Screen
    })
  }

  placeAt(
    point_Screen: _Point_Screen_
  ): string | null {
    return placeAt__View_TextEditor({
      containerElement_View: this.containerElement,
      point_Screen
    })
  }

  targetAt(
    point_Screen: _Point_Screen_
  ): _Target_Note_ | null {
    return targetAt__View_TextEditor({
      containerElement_View: this.containerElement,
      point_Screen
    })
  }

  foldAt(
    point_Screen: _Point_Screen_
  ): _Range_Lines_ | null {
    return foldAt__View_TextEditor({
      containerElement_View: this.containerElement,
      point_Screen
    })
  }

  reveal(
    target_Note: _Target_Note_
  ): void {
    const jump_View = reveal__View_TextEditor({
      containerElement_View: this.containerElement,
      target_Note
    })
    if (jump_View !== null) this.jumped(jump_View)
  }

  focusEdited(
    editing_Request: _Id_Request_
  ): void {
    focusEdited__View_TextEditor({
      containerElement_View: this.containerElement,
      editing_Request
    })
  }

  focusDraft(
    focus_Draft: _Focus_Draft_
  ): void {
    focusDraft__View_TextEditor({
      containerElement_View: this.containerElement,
      focus_Draft
    })
  }

  focusInput(): void {
    const element_Input = this.containerElement.querySelector(".input_htmlView")
    if (element_Input instanceof HTMLElement) {
      element_Input.focus({
        preventScroll: true
      })
    }
  }

  revealCaret(): void {
    this.containerElement.querySelector(".caret_htmlView")?.scrollIntoView({
      block: "nearest"
    })
  }

  revealWords(): void {
    revealWords__View_TextEditor({
      containerElement_View: this.containerElement
    })
  }

  visit(
    visit_Item: _Visit_Item_
  ): void {
    const jump_View = visit__View_TextEditor({
      containerElement_View: this.containerElement,
      visit_Item
    })
    if (jump_View !== null) this.jumped(jump_View)
  }

  jumped(
    jump_View: _Jump_View_
  ): void {
    this.isJumping = jump_View.behavior === "smooth" && Math.abs(jump_View.top) >= 1
    const jumped_View = jump__View_TextEditor({
      containerElement_View: this.containerElement,
      room_View: this.room,
      jump_View
    })
    this.room = jumped_View.room_View
    this.top_Jumped = jumped_View.top_Target
  }

  settled(
    element_Document: Element
  ): void {
    const top = element_Document.scrollTop
    if (this.isJumping && Math.abs(top - this.top_Jumped) >= 1) {
      setTimeout(
        () => {
          if (!this.isJumping || element_Document.scrollTop !== top) return
          this.isJumping = false
          this.scrolled()
        },
        150
      )
      return
    }
    this.isJumping = false
    this.scrolled()
  }

  scrolled(): void {
    this.keep()
    if (this.isJumping) return
    released__Focus_Jump({
      containerElement_View: this.containerElement
    })
    this.room = roomScrolled__View_TextEditor({
      containerElement_View: this.containerElement,
      room_View: this.room
    })
  }
}

interface _Api__View_TextEditor_ {
  containerElement: HTMLElement
  componentMap: _ComponentMap__View_TextEditor_
}

interface _Room_View_ {
  above: number
  below: number
}

interface _Api___heldTillWritten__Form_ {
  containerElement_View: HTMLElement
}

function heldTillWritten__Form({
  containerElement_View
}: _Api___heldTillWritten__Form_): void {
  for (const element_Notes of containerElement_View.querySelectorAll<HTMLTextAreaElement>(":is(.asking_htmlView, .draft_htmlView) > .notes_htmlView, .text_Said_htmlView > .notes_Edit_htmlView")) {
    const isWritten = element_Notes.value.trim() !== ""
    for (const element_Button of element_Notes.parentElement?.querySelectorAll<HTMLButtonElement>(":scope > :is(.actions_htmlView, .actions_Edit_htmlView) > :is([data-request=ADD], [data-request=START], [data-draft=ADD], [data-draft=START], [data-edit-action=SAVE])") ?? []) {
      element_Button.disabled = !isWritten
    }
  }
}

interface _Api___classOf__Card_Focused_ {
  containerElement_View: HTMLElement
}

function classOf__Card_Focused({
  containerElement_View
}: _Api___classOf__Card_Focused_): string | null {
  const element_Card = document.activeElement?.closest(".card_htmlView")
  return element_Card === null || element_Card === undefined || !containerElement_View.contains(element_Card)
    ? null
    : [...element_Card.classList].find((name) => name !== "card_htmlView") ?? null
}

interface _Api___draw__View_TextEditor_ {
  containerElement_View: HTMLElement
  componentMap_View: _ComponentMap__View_TextEditor_
  viewModel_TextEditor: _ViewModel_TextEditor_
}

function draw__View_TextEditor({
  containerElement_View,
  componentMap_View,
  viewModel_TextEditor
}: _Api___draw__View_TextEditor_): void {
  draw__Node_Jsx({
    containerElement: containerElement_View,
    node_Jsx: (
      <TextEditor_Html
        componentMap_View={componentMap_View}
        viewModel_TextEditor={viewModel_TextEditor}
      />
    )
  })
}

interface _Api___TextEditor_Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  viewModel_TextEditor: _ViewModel_TextEditor_
}

function TextEditor_Html({
  componentMap_View,
  viewModel_TextEditor
}: _Api___TextEditor_Html_): JSX.Element {
  const Component_Header = componentMap_View.header
  const Component_Footer = componentMap_View.footer
  const Component_Menu = componentMap_View.menu
  const Component_Request = componentMap_View.request
  return (
    <div
      class="htmlView_editor"
      style={`--labelWidth_htmlView: ${viewModel_TextEditor.charCount_Max__Label_Gutter}ch`}
    >
      <div
        class="input_htmlView"
        tabindex="0"
        role="textbox"
        aria-multiline="true"
        aria-label="Text"
      />
      <Component_Header
        componentMap_View={componentMap_View}
        header_ViewModel={viewModel_TextEditor.header}
        form_Request={viewModel_TextEditor.request?.place.kind === "POINT" ? null : viewModel_TextEditor.request}
      />
      <div
        class="document_htmlView"
        tabindex="-1"
      >
        {viewModel_TextEditor.blocks.map((block_ViewModel) => (
          <Block_TextEditor__Html
            componentMap_View={componentMap_View}
            block_ViewModel={block_ViewModel}
          />
        ))}
      </div>
      <Component_Footer />
      {viewModel_TextEditor.menu !== null && <Component_Menu menu_ViewModel={viewModel_TextEditor.menu} />}
      {viewModel_TextEditor.request?.place.kind === "POINT" && <Component_Request form_Request={viewModel_TextEditor.request} />}
    </div>
  )
}

interface _Api___Header_TextEditor__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  header_ViewModel: _Header_ViewModel_
  form_Request: _Form_Request_ | null
}

function Header_TextEditor__Html({
  componentMap_View,
  header_ViewModel,
  form_Request
}: _Api___Header_TextEditor__Html_): JSX.Element {
  return (
    <div class="header_htmlView">
      {header_ViewModel.task !== null && (
        <Task_Header__Html
          componentMap_View={componentMap_View}
          task_Header={header_ViewModel.task}
          form_Request={form_Request?.place.kind === "TASK" ? form_Request : null}
        />
      )}
      <p class="status_Header_htmlView">
        {header_ViewModel.parts.map((part_Header) => (
          <span
            class="part_Header_htmlView"
            data-busy={part_Header.isBusy ? "" : undefined}
          >
            {part_Header.isBusy && (
              <span
                class="spinner_htmlView"
                aria-hidden="true"
              />
            )}
            {part_Header.text}
          </span>
        ))}
      </p>
      <Document_Header__Html
        componentMap_View={componentMap_View}
        document_Header={header_ViewModel.document}
        form_Request={form_Request?.place.kind === "DOCUMENT" ? form_Request : null}
      />
    </div>
  )
}

interface _Api___Task_Header__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  task_Header: _Task_Header_
  form_Request: _Form_Request_ | null
}

function Task_Header__Html({
  componentMap_View,
  task_Header,
  form_Request
}: _Api___Task_Header__Html_): JSX.Element {
  return (
    <div class="task_Header_htmlView">
      <button
        type="button"
        class="trigger_Task_htmlView"
        aria-haspopup="dialog"
      >
        <span
          class="mark_Task_htmlView"
          data-state={task_Header.state}
          aria-hidden="true"
        />
        <span class="name_Task_htmlView">{task_Header.name}</span>
        <span class="state_Task_htmlView">{task_Header.label_State}</span>
      </button>
      <div
        class="card_htmlView card_Task_htmlView"
        role="dialog"
        tabindex="-1"
        aria-label={task_Header.name}
      >
        <p class="head_Card_htmlView">
          <span class="id_Card_htmlView">{task_Header.id}</span>
          <span
            class="state_Card_htmlView"
            data-state={task_Header.state}
          >
            {task_Header.label_State}
            <span
              class="dots_htmlView"
              aria-hidden="true"
            >
              <span class="dot_htmlView">.</span>
              <span class="dot_htmlView">.</span>
              <span class="dot_htmlView">.</span>
            </span>
          </span>
        </p>
        {task_Header.summary !== "" && (
          <p
            class="summary_Card_htmlView"
            title={task_Header.summary}
          >
            {task_Header.summary}
          </p>
        )}
        {task_Header.reason !== "" && <p class="reason_Card_htmlView">{`Why: ${task_Header.reason}`}</p>}
        <Proposals_Card__Html proposals_Card={task_Header.proposals} />
        <Revisions_Scope__Html
          revisions_Scope={task_Header.revisions_Scope}
          scope_Work="TASK"
        />
        <Revisions_Level__Html
          componentMap_View={componentMap_View}
          revisions_Level={task_Header.revisions_Level}
          ask="TASK"
          scope_Requests="TASK_REQUESTS"
          form_Request={form_Request}
        />
      </div>
    </div>
  )
}

interface _Api___Proposals_Card__Html_ {
  proposals_Card: _Proposals_Card_
}

function Proposals_Card__Html({
  proposals_Card
}: _Api___Proposals_Card__Html_): JSX.Element {
  const value = (
    <span
      class="value_Card_htmlView"
      title={proposals_Card.figure === null || proposals_Card.figure.more === "" ? undefined : proposals_Card.figure.more}
    >
      {proposals_Card.figure === null ? "None yet" : proposals_Card.figure.value}
    </span>
  )
  const actions = proposals_Card.actions.length > 0 && (
    <Fold_Action$__Html>
      <div
        class="actions_Card_htmlView folded_htmlView"
        role="group"
        aria-label="Proposal actions"
      >
        {proposals_Card.actions.map((action_Task) => (
          <button
            type="button"
            class="action_htmlView"
            data-task={action_Task.command}
          >
            {action_Task.label}
          </button>
        ))}
      </div>
    </Fold_Action$__Html>
  )
  return (
    <section
      class="section_Card_htmlView"
      aria-label="Proposals"
    >
      <p class="label_Card_htmlView">Proposals</p>
      {proposals_Card.documents.length > 0
        ? [
          <Document$_Card__Html document$={proposals_Card.documents} />,
          <p
            class="document_Card_htmlView total_Document_Card_htmlView"
            title={proposals_Card.figure === null || proposals_Card.figure.more === "" ? undefined : proposals_Card.figure.more}
          >
            <span class="path_Document_Card_htmlView">
              <span
                class="name_Document_Card_htmlView"
                title="Every document"
              >
                all (*)
              </span>
            </span>
            <span class="value_Document_Card_htmlView">{proposals_Card.figure === null ? "None yet" : proposals_Card.figure.value}</span>
            {proposals_Card.actions.length > 0 && (
              <Fold_Action$__Html>
                <span
                  class="actions_Document_Card_htmlView folded_htmlView"
                  role="group"
                  aria-label="Every document's actions"
                >
                  {proposals_Card.actions.map((action_Task) => (
                    <button
                      type="button"
                      class="action_htmlView"
                      data-task={action_Task.command}
                    >
                      {action_Task.label}
                    </button>
                  ))}
                </span>
              </Fold_Action$__Html>
            )}
          </p>
        ]
        : (
          <div class="line_Card_htmlView">
            {value}
            {actions}
          </div>
        )}
    </section>
  )
}

interface _Api___Fold_Action$__Html_ {
  children: _Node_Jsx_
}

function Fold_Action$__Html({
  children
}: _Api___Fold_Action$__Html_): JSX.Element {
  return (
    <span class="fold_Action_htmlView">
      <span
        class="more_htmlView"
        aria-hidden="true"
      >
        …
      </span>
      {children}
    </span>
  )
}

interface _Api___Document$_Card__Html_ {
  document$: Array<_Document_Card_>
}

function Document$_Card__Html({
  document$
}: _Api___Document$_Card__Html_): _Node_Jsx_ {
  return document$.length === 0
    ? null
    : (
      <ul class="list_Document_Card_htmlView">
        {document$.map((document_Card) => (
          <li
            class="document_Card_htmlView"
            aria-current={document_Card.isShown ? "true" : undefined}
            data-decided={document_Card.isDecided ? "" : undefined}
            title={document_Card.more === "" ? undefined : document_Card.more}
          >
            <span class="path_Document_Card_htmlView">
              {document_Card.folder !== "" && (
                <span class="folder_Document_Card_htmlView">
                  <bdi>{document_Card.folder}</bdi>
                </span>
              )}
              <span class="name_Document_Card_htmlView">{document_Card.name}</span>
            </span>
            <span class="value_Document_Card_htmlView">{document_Card.value}</span>
            {document_Card.actions.length > 0 && (
              <Fold_Action$__Html>
                <span
                  class="actions_Document_Card_htmlView folded_htmlView"
                  role="group"
                  aria-label={`${document_Card.folder}${document_Card.name} actions`}
                >
                  {document_Card.actions.map((action_Task) => (
                    <button
                      type="button"
                      class="action_htmlView"
                      data-task={action_Task.command}
                    >
                      {action_Task.label}
                    </button>
                  ))}
                </span>
              </Fold_Action$__Html>
            )}
          </li>
        ))}
      </ul>
    )
}

interface _Api___Revisions_Scope__Html_ {
  revisions_Scope: _Revisions_Scope_
  scope_Work: "TASK" | "DOCUMENT"
}

function Revisions_Scope__Html({
  revisions_Scope,
  scope_Work
}: _Api___Revisions_Scope__Html_): JSX.Element {
  return (
    <section
      class="section_Card_htmlView"
      aria-label="Scope Revisions"
    >
      <p class="label_Card_htmlView">Scope Revisions</p>
      <div class="line_Card_htmlView">
        <span class="value_Card_htmlView">{revisions_Scope.figure === null ? "Nothing queued" : revisions_Scope.figure.value}</span>
        <Action$_Scope__Html
          revisions_Scope={revisions_Scope}
          scope_Work={scope_Work}
        />
      </div>
    </section>
  )
}

interface _Api___Action$_Scope__Html_ {
  revisions_Scope: _Revisions_Scope_
  scope_Work: "TASK" | "DOCUMENT" | "FRAME"
}

function Action$_Scope__Html({
  revisions_Scope,
  scope_Work
}: _Api___Action$_Scope__Html_): _Node_Jsx_ {
  return revisions_Scope.start_All === null && revisions_Scope.stop_All === null && revisions_Scope.actions.length === 0
    ? null
    : (
      <Fold_Action$__Html>
        <div
          class="actions_Card_htmlView folded_htmlView"
          role="group"
          aria-label="Scope revision actions"
        >
          {revisions_Scope.start_All !== null && (
            <button
              type="button"
              class="action_htmlView start_htmlView"
              data-scope={scope_Work}
              data-work="START"
              data-state-after="REVISING"
              title={revisions_Scope.start_All.title}
            >
              {revisions_Scope.start_All.label}
            </button>
          )}
          {revisions_Scope.stop_All !== null && (
            <button
              type="button"
              class="action_htmlView stop_htmlView"
              data-scope={scope_Work}
              data-work="STOP"
              title={revisions_Scope.stop_All.title}
            >
              {revisions_Scope.stop_All.label}
            </button>
          )}
          {revisions_Scope.actions.map((action_Task) => (
            <button
              type="button"
              class="action_htmlView"
              data-task={action_Task.command}
            >
              {action_Task.label}
            </button>
          ))}
        </div>
      </Fold_Action$__Html>
    )
}

interface _Api___Revisions_Level__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  revisions_Level: _Revisions_Level_
  ask: "TASK" | "DOCUMENT"
  scope_Requests: "TASK_REQUESTS" | "DOCUMENT_REQUESTS"
  form_Request: _Form_Request_ | null
}

function Revisions_Level__Html({
  componentMap_View,
  revisions_Level,
  ask,
  scope_Requests,
  form_Request
}: _Api___Revisions_Level__Html_): JSX.Element {
  const Component_Request = componentMap_View.request
  return (
    <section
      class="section_Card_htmlView"
      aria-label="Level Revisions"
    >
      <p class="label_Card_htmlView">Level Revisions</p>
      {revisions_Level.requests.length > 0
        ? (
          <Request$__Html
            label="Requests"
            scope_Work={scope_Requests}
            isStartable={revisions_Level.isStartable_Requests}
            isStoppable={revisions_Level.isStoppable_Requests}
            add={(
              <button
                type="button"
                class="add_Request_htmlView"
                data-ask={ask}
                aria-haspopup="dialog"
                aria-expanded={form_Request !== null ? "true" : "false"}
              >
                Add
              </button>
            )}
            request$={revisions_Level.requests}
          >
            {form_Request !== null && (
              <li
                class="said_htmlView"
                data-adding=""
              >
                <Component_Request form_Request={form_Request} />
              </li>
            )}
          </Request$__Html>
        )
        : [
          <div class="line_Card_htmlView">
            <div
              class="actions_Card_htmlView"
              role="group"
              aria-label="Level revision actions"
            >
              <button
                type="button"
                class="action_htmlView"
                data-ask={ask}
                aria-haspopup="dialog"
                aria-expanded={form_Request !== null ? "true" : "false"}
              >
                {revisions_Level.ask.label}
              </button>
            </div>
          </div>,
          form_Request !== null && <Component_Request form_Request={form_Request} />
        ]}
    </section>
  )
}

interface _Api___Document_Header__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  document_Header: _Document_Header_
  form_Request: _Form_Request_ | null
}

function Document_Header__Html({
  componentMap_View,
  document_Header,
  form_Request
}: _Api___Document_Header__Html_): JSX.Element {
  return (
    <div class="document_Header_htmlView">
      <button
        type="button"
        class="trigger_Document_htmlView"
        aria-haspopup="dialog"
        title={`${document_Header.folder}${document_Header.name}`}
      >
        <span class="name_Document_htmlView">{document_Header.name}</span>
        <span
          class="mark_Document_htmlView"
          data-state={document_Header.state}
          aria-hidden="true"
        />
        {document_Header.label_State !== "" && <span class="state_Document_htmlView">{document_Header.label_State}</span>}
      </button>
      <div
        class="card_htmlView card_Document_htmlView"
        role="dialog"
        tabindex="-1"
        aria-label={document_Header.name}
      >
        {(document_Header.folder !== "" || document_Header.label_State !== "") && (
          <p class="head_Card_htmlView">
            <span class="path_Card_htmlView">{`${document_Header.folder}${document_Header.name}`}</span>
            {document_Header.label_State !== "" && (
              <span
                class="state_Card_htmlView"
                data-state={document_Header.state}
              >
                {document_Header.label_State}
                <span
                  class="dots_htmlView"
                  aria-hidden="true"
                >
                  <span class="dot_htmlView">.</span>
                  <span class="dot_htmlView">.</span>
                  <span class="dot_htmlView">.</span>
                </span>
              </span>
            )}
          </p>
        )}
        {document_Header.summary !== "" && (
          <p
            class="summary_Card_htmlView"
            title={document_Header.summary}
          >
            {document_Header.summary}
          </p>
        )}
        <Proposals_Card__Html proposals_Card={document_Header.proposals} />
        <Revisions_Scope__Html
          revisions_Scope={document_Header.revisions_Scope}
          scope_Work="DOCUMENT"
        />
        <Revisions_Level__Html
          componentMap_View={componentMap_View}
          revisions_Level={document_Header.revisions_Level}
          ask="DOCUMENT"
          scope_Requests="DOCUMENT_REQUESTS"
          form_Request={form_Request}
        />
      </div>
    </div>
  )
}

function Footer_TextEditor__Html(): JSX.Element {
  return <div class="footer_htmlView" />
}

interface _Api___Menu_TextEditor__Html_ {
  menu_ViewModel: _Menu_ViewModel_
}

function Menu_TextEditor__Html({
  menu_ViewModel
}: _Api___Menu_TextEditor__Html_): JSX.Element {
  return (
    <div
      class="menu_htmlView"
      role="menu"
      aria-label="Ask"
      style={`left: ${menu_ViewModel.point_Screen.x}px; top: ${menu_ViewModel.point_Screen.y}px`}
      data-x={String(menu_ViewModel.point_Screen.x)}
      data-y={String(menu_ViewModel.point_Screen.y)}
      data-focus-shown={menu_ViewModel.isFocusShown ? "" : undefined}
    >
      {menu_ViewModel.items.map((
        item_Menu,
        index
      ) => [
        index > 0 && menu_ViewModel.items[index - 1]?.tier !== item_Menu.tier && (
          <div
            class="divider_Menu_htmlView"
            role="separator"
          />
        ),
        <button
          type="button"
          class="choice_htmlView"
          role="menuitem"
          data-index={String(index)}
          data-tier={item_Menu.tier}
          data-section={item_Menu.section}
          data-work={item_Menu.kind === "WORK" ? item_Menu.work : undefined}
          tabindex={index === menu_ViewModel.index_Focused ? "0" : "-1"}
        >
          {`${item_Menu.label_Tier}: `}
          <span class="label_Choice_htmlView">{item_Menu.label}</span>
        </button>
      ])}
    </div>
  )
}

interface _Api___Request_TextEditor__Html_ {
  form_Request: _Form_Request_
}

function Request_TextEditor__Html({
  form_Request
}: _Api___Request_TextEditor__Html_): JSX.Element {
  return (
    <div
      class="asking_htmlView"
      role="dialog"
      aria-label={form_Request.label}
      style={form_Request.place.kind === "POINT" ? `left: ${form_Request.place.point_Screen.x}px; top: ${form_Request.place.point_Screen.y}px` : undefined}
      data-x={form_Request.place.kind === "POINT" ? String(form_Request.place.point_Screen.x) : undefined}
      data-y={form_Request.place.kind === "POINT" ? String(form_Request.place.point_Screen.y) : undefined}
      data-place={form_Request.place.kind}
    >
      {form_Request.head === null
        ? <p class="label_Asking_htmlView">{form_Request.label}</p>
        : (
          <p
            class="label_Asking_htmlView"
            data-head=""
          >
            {`${form_Request.head.label_Tier} `}
            <span class="subject_Asking_htmlView">{form_Request.head.subject}</span>
          </p>
        )}
      {form_Request.quote !== null && (
        <p class="quote_Asking_htmlView">
          <span class="chip_Quote_htmlView">
            <q
              class="words_Quote_htmlView"
              tabindex={form_Request.quote.peek === null ? undefined : "0"}
            >
              {form_Request.quote.head}
            </q>
            {form_Request.quote.size !== null && <span class="size_Quote_htmlView">{form_Request.quote.size}</span>}
            <button
              type="button"
              class="drop_Quote_htmlView"
              data-request="DROP"
              aria-label="Leave these words out"
              title="Leave these words out"
            >
              ×
            </button>
            <Peek_Quote__Html peek={form_Request.quote.peek} />
          </span>
        </p>
      )}
      <textarea
        class="notes_htmlView"
        aria-label={form_Request.label}
        placeholder="What should change?"
        rows="3"
      />
      <div class="actions_htmlView">
        <button
          type="button"
          class="action_htmlView"
          data-request="ADD"
        >
          Add
        </button>
        {form_Request.isStartable && (
          <button
            type="button"
            class="action_htmlView start_htmlView"
            data-request="START"
            data-state-after="REVISING"
          >
            Start
          </button>
        )}
        <button
          type="button"
          class="action_htmlView"
          data-request="CLOSE"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface _Api___Peek_Quote__Html_ {
  peek: _Peek_Quote_ | null
}

function Peek_Quote__Html({
  peek
}: _Api___Peek_Quote__Html_): _Node_Jsx_ {
  return peek === null
    ? null
    : (
      <span
        class="peek_Quote_htmlView"
        role="tooltip"
      >
        <span class="text_Peek_htmlView">{peek.text}</span>
        {peek.more !== null && <span class="more_Peek_htmlView">{peek.more}</span>}
      </span>
    )
}

interface _Api___Block_TextEditor__Html_<Kind extends _Block_ViewModel_["kind"]> {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: Extract<
    _Block_ViewModel_,
    __BASE_Block__ViewModel_<Kind>
  >
}

function Block_TextEditor__Html<Kind extends _Block_ViewModel_["kind"]>({
  componentMap_View,
  block_ViewModel
}: _Api___Block_TextEditor__Html_<Kind>): JSX.Element {
  const Component_Block = componentMap_View.block[block_ViewModel.kind]
  return (
    <Component_Block
      componentMap_View={componentMap_View}
      block_ViewModel={block_ViewModel}
    />
  )
}

interface _Api___LINES_Block_TextEditor__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: _LINES_Block__ViewModel_
}

function LINES_Block_TextEditor__Html({
  componentMap_View,
  block_ViewModel
}: _Api___LINES_Block_TextEditor__Html_): JSX.Element {
  return (
    <Run_Line$__Html
      componentMap_View={componentMap_View}
      run_Line$={block_ViewModel.run}
    />
  )
}

interface _Api___Run_Line$__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  run_Line$: _Run_Lines_
}

function Run_Line$__Html({
  componentMap_View,
  run_Line$
}: _Api___Run_Line$__Html_): JSX.Element {
  const Component_Line = componentMap_View.line
  return (
    <div
      class="run_htmlView"
      data-run={run_Line$.id}
    >
      <svg
        class="underlays_htmlView"
        aria-hidden="true"
      />
      <div
        class="selection_htmlView"
        aria-hidden="true"
      />
      {run_Line$.lines.map((line_Run) => <Component_Line line_Run={line_Run} />)}
    </div>
  )
}

interface _Api___Line_Run__Html_ {
  line_Run: _Line_Run_
}

function Line_Run__Html({
  line_Run
}: _Api___Line_Run__Html_): JSX.Element {
  return (
    <div
      class="line_htmlView"
      data-marker={line_Run.gutter.marker}
    >
      <Gutter_Line__Html gutter_Line={line_Run.gutter} />
      <Text_Line__Html
        segment$_Line={line_Run.segments}
        note_Line={line_Run.note}
      />
    </div>
  )
}

interface _Api___Gutter_Line__Html_ {
  gutter_Line: _Gutter_Line_
}

function Gutter_Line__Html({
  gutter_Line
}: _Api___Gutter_Line__Html_): JSX.Element {
  return (
    <div
      class="gutter_htmlView"
      aria-hidden="true"
      data-pointed={gutter_Line.pointed === "none" ? undefined : gutter_Line.pointed}
    >
      <span class="label_htmlView">{gutter_Line.label}</span>
      <span class="marker_htmlView" />
    </div>
  )
}

interface _Api___Text_Line__Html_ {
  segment$_Line: Array<_Segment_Line_>
  note_Line: _Note_Line_ | null
}

function Text_Line__Html({
  segment$_Line,
  note_Line
}: _Api___Text_Line__Html_): JSX.Element {
  return (
    <div class="text_htmlView">
      {segment$_Line.map((segment_Line) => <Segment_Text__Html segment_Line={segment_Line} />)}
      {note_Line !== null && <Note_Line__Html note_Line={note_Line} />}
    </div>
  )
}

interface _Api___Segment_Text__Html_ {
  segment_Line: _Segment_Line_
}

function Segment_Text__Html({
  segment_Line
}: _Api___Segment_Text__Html_): JSX.Element {
  return <span {...segment_Line.attributes}>{segment_Line.text}</span>
}

interface _Api___Note_Line__Html_ {
  note_Line: _Note_Line_
}

function Note_Line__Html({
  note_Line
}: _Api___Note_Line__Html_): JSX.Element {
  return (
    <button
      type="button"
      class="note_htmlView"
      aria-label={note_Line.label}
      data-target-source={note_Line.target.source}
      data-target-side={note_Line.target.side}
    />
  )
}

interface _Api___FRAME_Block_TextEditor__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: _FRAME_Block__ViewModel_
}

function FRAME_Block_TextEditor__Html({
  componentMap_View,
  block_ViewModel
}: _Api___FRAME_Block_TextEditor__Html_): JSX.Element {
  return (
    <section
      class="frame_htmlView"
      aria-label={labelOf__Range_Line$(block_ViewModel.range)}
    >
      <Fold_Frame__Html
        range_Line$={block_ViewModel.range}
        isFolded={false}
      />
      <Bar_Frame__Html range_Line$={block_ViewModel.range} />
      {block_ViewModel.parts.map((part_Frame) => (
        <Section_Frame__Html
          componentMap_View={componentMap_View}
          part_Frame={part_Frame}
        />
      ))}
    </section>
  )
}

interface _Api___Fold_Frame__Html_ {
  range_Line$: _Range_Lines_
  isFolded: boolean
}

function Fold_Frame__Html({
  range_Line$,
  isFolded
}: _Api___Fold_Frame__Html_): JSX.Element {
  return (
    <button
      type="button"
      class="fold_htmlView"
      aria-expanded={isFolded ? "false" : "true"}
      aria-label={`${isFolded ? "Unfold" : "Fold"} ${labelOf__Range_Line$(range_Line$)}`}
      data-fold-first={String(range_Line$.first)}
      data-fold-last={String(range_Line$.last)}
    />
  )
}

interface _Api___Bar_Frame__Html_ {
  range_Line$: _Range_Lines_
}

function Bar_Frame__Html({
  range_Line$
}: _Api___Bar_Frame__Html_): JSX.Element {
  return (
    <span
      class="bar_htmlView"
      aria-hidden="true"
      data-fold-first={String(range_Line$.first)}
      data-fold-last={String(range_Line$.last)}
    />
  )
}

interface _Api___FOLDED_Block_TextEditor__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  block_ViewModel: _FOLDED_Block__ViewModel_
}

function FOLDED_Block_TextEditor__Html({
  componentMap_View,
  block_ViewModel
}: _Api___FOLDED_Block_TextEditor__Html_): JSX.Element {
  return (
    <section
      class="frame_htmlView"
      aria-label={labelOf__Range_Line$(block_ViewModel.range)}
      data-folded=""
    >
      <Fold_Frame__Html
        range_Line$={block_ViewModel.range}
        isFolded={true}
      />
      <Bar_Frame__Html range_Line$={block_ViewModel.range} />
      <Section_Frame__Html
        componentMap_View={componentMap_View}
        part_Frame={{
          kind: "PROPOSAL_LINES",
          run: block_ViewModel.run
        }}
      />
    </section>
  )
}

function labelOf__Range_Line$(
  range_Line$: _Range_Lines_
): string {
  return range_Line$.last < range_Line$.first ? `before line ${range_Line$.first}` : range_Line$.first === range_Line$.last ? `line ${range_Line$.first}` : `lines ${range_Line$.first} to ${range_Line$.last}`
}

interface _Api___Section_Frame__Html_<Kind extends _Part_Frame_["kind"]> {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: Extract<
    _Part_Frame_,
    __BASE_Part__Frame_<Kind>
  >
}

function Section_Frame__Html<Kind extends _Part_Frame_["kind"]>({
  componentMap_View,
  part_Frame
}: _Api___Section_Frame__Html_<Kind>): JSX.Element {
  const Component_Part = componentMap_View.part[part_Frame.kind]
  return (
    <Component_Part
      componentMap_View={componentMap_View}
      part_Frame={part_Frame}
    />
  )
}

interface _Api___CURRENT_LINES__Section_Frame__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: _CURRENT_Part__Frame_
}

function CURRENT_LINES__Section_Frame__Html({
  componentMap_View,
  part_Frame
}: _Api___CURRENT_LINES__Section_Frame__Html_): JSX.Element {
  return (
    <div
      class="current_htmlView"
      role="group"
      aria-label="as it is"
    >
      <Run_Line$__Html
        componentMap_View={componentMap_View}
        run_Line$={part_Frame.run}
      />
    </div>
  )
}

interface _Api___PROPOSAL_LINES__Section_Frame__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: _PROPOSED_Part__Frame_
}

function PROPOSAL_LINES__Section_Frame__Html({
  componentMap_View,
  part_Frame
}: _Api___PROPOSAL_LINES__Section_Frame__Html_): JSX.Element {
  return (
    <div
      class="proposed_htmlView"
      role="group"
      aria-label="as proposed"
    >
      <Run_Line$__Html
        componentMap_View={componentMap_View}
        run_Line$={part_Frame.run}
      />
    </div>
  )
}

interface _Api___PROPOSAL_HEAD__Section_Frame__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: _HEAD_Part__Frame_
}

function PROPOSAL_HEAD__Section_Frame__Html({
  part_Frame
}: _Api___PROPOSAL_HEAD__Section_Frame__Html_): JSX.Element {
  return (
    <div
      class="head_Proposals_htmlView"
      role="group"
      aria-label={`${part_Frame.label_Range}: its proposals`}
    >
      <p class="label_Head_htmlView">
        <span class="title_Head_htmlView">Proposals</span>
        <span class="range_Head_htmlView">{part_Frame.label_Range}</span>
        {part_Frame.figure !== null && (
          <span
            class="value_Head_htmlView"
            title={part_Frame.figure.more === "" ? undefined : part_Frame.figure.more}
          >
            {part_Frame.figure.value}
          </span>
        )}
      </p>
      {part_Frame.accept_All !== null && (
        <Fold_Action$__Html>
          <div
            class="actions_Card_htmlView folded_htmlView"
            role="group"
            aria-label={`${part_Frame.label_Range}: its proposals' actions`}
          >
            <button
              type="button"
              class="action_htmlView"
              data-accept-all=""
              title={part_Frame.accept_All.title}
            >
              {part_Frame.accept_All.label}
            </button>
          </div>
        </Fold_Action$__Html>
      )}
      {part_Frame.revisions_Scope.figure !== null && (
        <div class="scope_Head_htmlView">
          <span class="value_Scope_htmlView">{part_Frame.revisions_Scope.figure.value}</span>
          <Action$_Scope__Html
            revisions_Scope={part_Frame.revisions_Scope}
            scope_Work="FRAME"
          />
        </div>
      )}
    </div>
  )
}

interface _Api___PROPOSAL_LIST__Section_Frame__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  part_Frame: _PROPOSALS_Part__Frame_
}

function PROPOSAL_LIST__Section_Frame__Html({
  componentMap_View,
  part_Frame
}: _Api___PROPOSAL_LIST__Section_Frame__Html_): JSX.Element {
  return (
    <ol
      class="proposals_htmlView"
      aria-label="proposals"
    >
      {part_Frame.items.map((item_ProposalList) => (
        <Item_ProposalList__Html
          componentMap_View={componentMap_View}
          item_ProposalList={item_ProposalList}
        />
      ))}
    </ol>
  )
}

interface _Api___Item_ProposalList__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  item_ProposalList: _Item_Proposals_
}

function Item_ProposalList__Html({
  componentMap_View,
  item_ProposalList
}: _Api___Item_ProposalList__Html_): JSX.Element {
  return (
    <li
      {...item_ProposalList.attributes}
      class="item_htmlView"
      data-source={item_ProposalList.source}
      data-state={item_ProposalList.state}
      data-drafting={item_ProposalList.isDrafting ? "" : undefined}
    >
      <p class="heading_htmlView">
        <span class="title_htmlView">{item_ProposalList.title}</span>
        <span class="status_htmlView">{item_ProposalList.status}</span>
        <span
          class="dots_htmlView"
          aria-hidden="true"
        >
          <span class="dot_htmlView">.</span>
          <span class="dot_htmlView">.</span>
          <span class="dot_htmlView">.</span>
        </span>
      </p>
      <Places_Item__Html
        componentMap_View={componentMap_View}
        places_Item={item_ProposalList.places}
        neighbors_Item={item_ProposalList.neighbors}
      />
      {item_ProposalList.stale !== null && (
        <p class="stale_htmlView">
          {item_ProposalList.stale.label}
          {item_ProposalList.stale.isRerunnable && (
            <button
              type="button"
              class="rerun_htmlView"
              data-state-after="REVISING"
            >
              Run again
            </button>
          )}
        </p>
      )}
      <p class="rationale_htmlView">{item_ProposalList.rationale}</p>
      {item_ProposalList.requests.length > 0 && (
        <Request$__Html
          label="Requests"
          scope_Work="PROPOSAL"
          isStartable={item_ProposalList.isStartable}
          isStoppable={item_ProposalList.isRunning}
          add={ISREVISABLEMAP__STATE_PROPOSAL[item_ProposalList.state] && item_ProposalList.actions
            .filter((action_Item) => action_Item.stateAfter === "REQUESTED")
            .map((action_Item) => (
              <button
                type="button"
                class="add_Request_htmlView"
                data-command={action_Item.command}
                aria-expanded={String(item_ProposalList.isDrafting)}
              >
                Add
              </button>
            ))}
          request$={item_ProposalList.requests}
        >
          {item_ProposalList.isDrafting && (
            <li
              class="said_htmlView"
              data-adding=""
            >
              <Draft_Item__Html item_ProposalList={item_ProposalList} />
            </li>
          )}
        </Request$__Html>
      )}
      {item_ProposalList.confirming === null
        ? (
          <div class="actions_htmlView">
            {item_ProposalList.actions
              .filter((action_Item) => item_ProposalList.requests.length === 0 || action_Item.stateAfter !== "REQUESTED")
              .map((action_Item) => (
                <Action_Item__Html
                  action_Item={action_Item}
                  isExpanded={ISREVISABLEMAP__STATE_PROPOSAL[item_ProposalList.state] && action_Item.stateAfter === "REQUESTED" ? item_ProposalList.isDrafting : null}
                />
              ))}
          </div>
        )
        : (
          <div
            class="actions_htmlView"
            data-confirming=""
          >
            <span class="question_htmlView">{item_ProposalList.confirming.label_Question}</span>
            <button
              type="button"
              class="action_htmlView"
              data-confirm="YES"
            >
              {item_ProposalList.confirming.label_Action}
            </button>
            <button
              type="button"
              class="action_htmlView"
              data-confirm="NO"
            >
              Cancel
            </button>
          </div>
        )}
      {item_ProposalList.isDrafting && item_ProposalList.requests.length === 0 && <Draft_Item__Html item_ProposalList={item_ProposalList} />}
    </li>
  )
}

interface _Api___Id_Item__Html_ {
  item_ProposalList: _Item_Proposals_
}

function Draft_Item__Html({
  item_ProposalList
}: _Api___Id_Item__Html_): JSX.Element {
  return (
    <div class="draft_htmlView">
      <textarea
        class="notes_htmlView"
        aria-label={`Your notes for revising “${item_ProposalList.title}”`}
        placeholder="What should change?"
        rows="3"
      />
      <div class="actions_htmlView">
        <button
          type="button"
          class="action_htmlView"
          data-draft="ADD"
          data-state-after="REQUESTED"
        >
          Add
        </button>
        {!item_ProposalList.isRunning && item_ProposalList.requests.length === 0 && (
          <button
            type="button"
            class="action_htmlView start_htmlView"
            data-draft="START"
            data-state-after="REVISING"
          >
            Start
          </button>
        )}
        <button
          type="button"
          class="action_htmlView"
          data-draft="DISCARD"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface _Api___Places_Item__Html_<Kind extends _Places_Item_["kind"]> {
  componentMap_View: _ComponentMap__View_TextEditor_
  places_Item: Extract<
    _Places_Item_,
    __BASE_Places_Item_<Kind>
  >
  neighbors_Item: _Neighbors_Item_
}

function Places_Item__Html<Kind extends _Places_Item_["kind"]>({
  componentMap_View,
  places_Item,
  neighbors_Item
}: _Api___Places_Item__Html_<Kind>): _Node_Jsx_ {
  const Component_Places = componentMap_View.places[places_Item.kind]
  return (
    <Component_Places
      componentMap_View={componentMap_View}
      places_Item={places_Item}
      neighbors_Item={neighbors_Item}
    />
  )
}

function NONE_Places_Item__Html(): _Node_Jsx_ {
  return null
}

interface _Api___COUNT_Places_Item__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  places_Item: _COUNT_Places_Item_
  neighbors_Item: _Neighbors_Item_
}

function COUNT_Places_Item__Html({
  componentMap_View,
  places_Item,
  neighbors_Item
}: _Api___COUNT_Places_Item__Html_): JSX.Element {
  return (
    <div class="places_htmlView">
      <p class="extent_htmlView">
        {places_Item.count_Here === places_Item.count_All
          ? `${places_Item.count_Here} ${places_Item.count_Here === 1 ? "change" : "changes"}`
          : `${places_Item.count_Here} of ${places_Item.count_All} changes here`}
        <Neighbors_Item__Html neighbors_Item={neighbors_Item} />
      </p>
      {places_Item.conditions.map((condition_Places) => (
        <Condition_Places__Html
          componentMap_View={componentMap_View}
          condition_Places={condition_Places}
        />
      ))}
    </div>
  )
}

interface _Api___Condition_Places__Html_<Kind extends _Condition_Places_["kind"]> {
  componentMap_View: _ComponentMap__View_TextEditor_
  condition_Places: Extract<
    _Condition_Places_,
    __BASE_Condition_Places_<Kind>
  >
}

function Condition_Places__Html<Kind extends _Condition_Places_["kind"]>({
  componentMap_View,
  condition_Places
}: _Api___Condition_Places__Html_<Kind>): _Node_Jsx_ {
  const Component_Condition = componentMap_View.condition[condition_Places.kind]
  return (
    <Component_Condition
      componentMap_View={componentMap_View}
      condition_Places={condition_Places}
    />
  )
}

interface _Api___WITHIN_Condition_Places__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  condition_Places: _WITHIN_Condition_Places_
}

function WITHIN_Condition_Places__Html({
  condition_Places
}: _Api___WITHIN_Condition_Places__Html_): JSX.Element {
  return (
    <p class="condition_htmlView">
      {`${condition_Places.count} of them only if `}
      <Reference_Condition__Html condition_Places={condition_Places} />
      {" is rejected"}
    </p>
  )
}

interface _Api___Reference_Condition__Html_ {
  condition_Places: _Condition_Places_
}

function Reference_Condition__Html({
  condition_Places
}: _Api___Reference_Condition__Html_): JSX.Element {
  return (
    <span
      class="reference_htmlView"
      data-source={condition_Places.source}
    >
      {condition_Places.title}
    </span>
  )
}

interface _Api___CARRIED_Condition_Places__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  condition_Places: _CARRIED_Condition_Places_
}

function CARRIED_Condition_Places__Html({
  condition_Places
}: _Api___CARRIED_Condition_Places__Html_): JSX.Element {
  return (
    <p class="condition_htmlView">
      {`${condition_Places.count} of them moved with `}
      <Reference_Condition__Html condition_Places={condition_Places} />
    </p>
  )
}

interface _Api___MOVE_Places_Item__Html_ {
  componentMap_View: _ComponentMap__View_TextEditor_
  places_Item: _MOVE_Places_Item_
  neighbors_Item: _Neighbors_Item_
}

function MOVE_Places_Item__Html({
  places_Item,
  neighbors_Item
}: _Api___MOVE_Places_Item__Html_): JSX.Element {
  return (
    <div class="places_htmlView">
      <p class="extent_htmlView">
        {`moves ${labelOf__Range_Line$(places_Item.range)} ${WORDMAP__WAY_MOVE[places_Item.way]}`}
        <Neighbors_Item__Html neighbors_Item={neighbors_Item} />
      </p>
    </div>
  )
}

type _WordMap_Way_ = {
  [Way in _Way_Move_]: string
}

const WORDMAP__WAY_MOVE: _WordMap_Way_ = {
  UP: "up",
  DOWN: "down"
}

interface _Api___Neighbors_Item__Html_ {
  neighbors_Item: _Neighbors_Item_
}

function Neighbors_Item__Html({
  neighbors_Item
}: _Api___Neighbors_Item__Html_): _Node_Jsx_ {
  if (neighbors_Item.range_Previous === null && neighbors_Item.range_Next === null) return null
  return (
    <span class="neighbors_htmlView">
      <Neighbor_Item__Html
        range_Frame={neighbors_Item.range_Previous}
        way="PREVIOUS"
      />
      <Neighbor_Item__Html
        range_Frame={neighbors_Item.range_Next}
        way="NEXT"
      />
    </span>
  )
}

interface _Api___Neighbor_Item__Html_ {
  range_Frame: _Range_Lines_ | null
  way: _Way_Visit_
}

type _Way_Visit_ = "PREVIOUS" | "NEXT"

function Neighbor_Item__Html({
  range_Frame,
  way
}: _Api___Neighbor_Item__Html_): JSX.Element {
  const label = range_Frame === null ? WORDMAP__NONE_VISIT[way] : `${WORDMAP__WAY_VISIT[way]} ${labelOf__Range_Line$(range_Frame)}`
  return (
    <button
      type="button"
      class="neighbor_htmlView"
      data-way={way}
      data-frame-first={range_Frame === null ? undefined : String(range_Frame.first)}
      data-frame-last={range_Frame === null ? undefined : String(range_Frame.last)}
      disabled={range_Frame === null ? "" : undefined}
      aria-label={label}
      title={label}
    />
  )
}

type _WordMap_Visit_ = {
  [Way in _Way_Visit_]: string
}

const WORDMAP__WAY_VISIT: _WordMap_Visit_ = {
  PREVIOUS: "Up to this proposal at",
  NEXT: "Down to this proposal at"
}

const WORDMAP__NONE_VISIT: _WordMap_Visit_ = {
  PREVIOUS: "No change of this proposal above",
  NEXT: "No change of this proposal below"
}

interface _Api___Request$__Html_ {
  label: string
  scope_Work: "PROPOSAL" | "DOCUMENT_REQUESTS" | "TASK_REQUESTS"
  isStartable: boolean
  isStoppable: boolean
  add: _Node_Jsx_
  request$: Array<_Request_Item_>
  children: _Node_Jsx_
}

function Request$__Html({
  label,
  scope_Work,
  isStartable,
  isStoppable,
  add,
  request$,
  children
}: _Api___Request$__Html_): JSX.Element {
  return (
    <div class="request_htmlView">
      <p class="head_Request_htmlView">
        <span class="label_Request_htmlView">{label}</span>
        <Fold_Action$__Html>
          <span class="actions_Request_htmlView folded_htmlView">
            {isStartable && (
              <button
                type="button"
                class="start_Request_htmlView"
                data-scope={scope_Work}
                data-work="START"
                data-state-after="REVISING"
                aria-label={`Start ${LABELMAP__SCOPE_WORK[scope_Work]}`}
              >
                Start
              </button>
            )}
            {isStoppable && (
              <button
                type="button"
                class="stop_Request_htmlView"
                data-scope={scope_Work}
                data-work="STOP"
                aria-label={`Stop ${LABELMAP__SCOPE_WORK[scope_Work]}`}
              >
                Stop
              </button>
            )}
            {add}
          </span>
        </Fold_Action$__Html>
      </p>
      <ol class="list_Request_htmlView">
        {request$.map((request_Item) => (
          <li
            class="said_htmlView"
            data-request={request_Item.id}
            data-editing={request_Item.isEditing ? "" : undefined}
          >
            <div class="row_Said_htmlView">
              <Action$_Said__Html request_Item={request_Item} />
              <div class="text_Said_htmlView">
                {request_Item.isEditing
                  ? <Edit_Said__Html request_Item={request_Item} />
                  : <span class="notes_Said_htmlView">{request_Item.notes}</span>}
                {request_Item.progress !== null && (
                  <span class="progress_Said_htmlView">
                    {request_Item.progress}
                    {request_Item.detail_Progress !== null && <span class="detail_Said_htmlView">{` (${request_Item.detail_Progress})`}</span>}
                  </span>
                )}
              </div>
            </div>
            {!request_Item.isEditing && <Reference_Said__Html reference={request_Item.reference} />}
          </li>
        ))}
        {children}
      </ol>
    </div>
  )
}

interface _Api___Action$_Said__Html_ {
  request_Item: _Request_Item_
}

function Action$_Said__Html({
  request_Item
}: _Api___Action$_Said__Html_): _Node_Jsx_ {
  const isOpen = !request_Item.isEditing
  const isActed = request_Item.isStoppable || request_Item.isDismissable || (isOpen && (request_Item.isRemovable || request_Item.isStartable))
  return !isActed
    ? null
    : (
      <Fold_Action$__Html>
        <span class="actions_Said_htmlView folded_htmlView">
          {request_Item.isStoppable && (
            <button
              type="button"
              class="stop_Said_htmlView"
              data-stop={request_Item.id}
              aria-label={`Stop “${request_Item.notes}”, putting it back in the queue`}
            >
              Stop
            </button>
          )}
          {request_Item.isRemovable && isOpen && (
            <button
              type="button"
              class="edit_Said_htmlView"
              data-edit={request_Item.id}
              aria-label={`Edit “${request_Item.notes}”`}
            >
              Edit
            </button>
          )}
          {request_Item.isStartable && isOpen && (
            <button
              type="button"
              class="start_Said_htmlView"
              data-start={request_Item.id}
              aria-label={`Start “${request_Item.notes}” alone`}
            >
              Start
            </button>
          )}
          {request_Item.isDismissable && (
            <button
              type="button"
              class="dismiss_Said_htmlView"
              data-dismiss={request_Item.id}
              aria-label={`Dismiss “${request_Item.notes}”, done with`}
            >
              Dismiss
            </button>
          )}
          {request_Item.isRemovable && isOpen && (
            <button
              type="button"
              class="remove_htmlView"
              data-remove={request_Item.id}
              aria-label={`Remove “${request_Item.notes}”`}
            >
              Remove
            </button>
          )}
        </span>
      </Fold_Action$__Html>
    )
}

interface _Api___Edit_Said__Html_ {
  request_Item: _Request_Item_
}

function Edit_Said__Html({
  request_Item
}: _Api___Edit_Said__Html_): _Node_Jsx_ {
  return [
    <textarea
      class="notes_Edit_htmlView"
      aria-label={`Your words for “${request_Item.notes}”`}
      rows="3"
    >
      {request_Item.notes}
    </textarea>,
    <Reference_Said__Html reference={request_Item.reference} />,
    <span class="actions_Edit_htmlView">
      <button
        type="button"
        class="action_htmlView"
        data-edit-action="SAVE"
      >
        Save
      </button>
      <button
        type="button"
        class="action_htmlView"
        data-edit-action="CANCEL"
      >
        Cancel
      </button>
    </span>
  ]
}

interface _Api___Reference_Said__Html_ {
  reference: _Reference_Request_ | null
}

function Reference_Said__Html({
  reference
}: _Api___Reference_Said__Html_): _Node_Jsx_ {
  return reference === null
    ? null
    : (
      <span class="reference_Said_htmlView">
        <span class="chip_Quote_htmlView">
          <q
            class="words_Quote_htmlView"
            tabindex={reference.peek === null ? undefined : "0"}
          >
            {reference.head}
          </q>
          {reference.size !== null && <span class="size_Quote_htmlView">{reference.size}</span>}
          <Peek_Quote__Html peek={reference.peek} />
        </span>
        {reference.lines !== null && (
          <button
            type="button"
            class="show_Said_htmlView"
            aria-label={`Show “${reference.head}” in the document, ${reference.lines}`}
          >
            {reference.lines}
          </button>
        )}
      </span>
    )
}

type _LabelMap__Scope_Work_ = {
  [Scope in _Api___Request$__Html_["scope_Work"]]: string
}

const LABELMAP__SCOPE_WORK: _LabelMap__Scope_Work_ = {
  PROPOSAL: "this proposal's requests",
  DOCUMENT_REQUESTS: "this document's own requests",
  TASK_REQUESTS: "the task's own requests"
}

interface _Api___Action_Item__Html_ {
  action_Item: _Action_Item_
  isExpanded: boolean | null
}

function Action_Item__Html({
  action_Item,
  isExpanded
}: _Api___Action_Item__Html_): JSX.Element {
  return (
    <button
      type="button"
      class="action_htmlView"
      data-command={action_Item.command}
      data-state-after={action_Item.stateAfter === null ? undefined : action_Item.stateAfter}
      aria-expanded={isExpanded === null ? undefined : String(isExpanded)}
    >
      {action_Item.label}
    </button>
  )
}

type _IsRevisableMap__State_Proposal_ = {
  [State in _State_Proposal_]: boolean
}

const ISREVISABLEMAP__STATE_PROPOSAL: _IsRevisableMap__State_Proposal_ = {
  OPEN: true,
  REQUESTED: true,
  REVISING: true,
  ACCEPTED: false,
  REJECTED: false,
  WITHDRAWN: false
}

interface _Api___drawTextUnderlay$__View_TextEditor_ {
  containerElement_View: HTMLElement
  run$_View: Array<_Run_Lines_>
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
  id_View: string
}

function drawTextUnderlay$__View_TextEditor({
  containerElement_View,
  run$_View,
  ink$_Glyph_View,
  id_View
}: _Api___drawTextUnderlay$__View_TextEditor_): void {
  const drawn$_Run = run$_View.flatMap((run_Line$) => drawn$Of__Run_Line$({
    run_Line$,
    containerElement_View
  }))
  if (!containerElement_View.isConnected) return
  makeRoom$__Drawn$_Run({
    drawn$_Run,
    ink$_Glyph_View
  })
  const measure$_Run = drawn$_Run.map((drawn_Run) => measureOf__Drawn_Run({
    drawn_Run,
    ink$_Glyph_View
  }))
  for (const {
    svgElement_underlay$,
    id_Run,
    knockout,
    measure$_Group
  } of measure$_Run) {
    const d_Knockout = measure$_Group
      .flatMap((measure_Group) => measure_Group.measure$_Underlay.map((measure_Underlay) => measure_Underlay.d_Knockout))
      .filter((d) => d !== "")
      .join(" ")
    const id_Mask = `knockout-${id_View}-${id_Run}`
    const id_Mask_Marks = `knockout-marks-${id_View}-${id_Run}`
    const isPointed = (measure_Group: _Measure_Group_) => "data-pointed" in measure_Group.attributes
    const d$_Pointed = d_Knockout === ""
      ? []
      : measure$_Group.flatMap((measure_Group) => isPointed(measure_Group)
        ? measure_Group.measure$_Underlay.flatMap((measure_Underlay) => measure_Underlay.layer === "RINGS"
          ? [
            measure_Underlay.d,
            ...measure_Underlay.d_Seam$
          ].filter((d) => d !== "")
          : [])
        : [])
    const groupsIn = (
      layer: _Layer_Underlay_,
      isPointed_Group: boolean | null,
      pathsOf: (measure_Underlay: _Measure_Underlay_) => _Node_Jsx_
    ) => measure$_Group.flatMap((measure_Group) => {
      if (isPointed_Group !== null && isPointed(measure_Group) !== isPointed_Group) return []
      const measure$_Underlay = measure_Group.measure$_Underlay.filter((measure_Underlay) => measure_Underlay.layer === layer)
      return measure$_Underlay.length === 0
        ? []
        : [
          <g
            {...measure_Group.attributes}
            class="group_htmlView"
          >
            {measure$_Underlay.map(pathsOf)}
          </g>
        ]
    })
    draw__Node_Jsx({
      containerElement: svgElement_underlay$,
      node_Jsx: [
        d_Knockout !== "" && (
          <defs>
            <mask
              id={id_Mask}
              maskUnits="userSpaceOnUse"
              x="-100000"
              y="-100000"
              width="200000"
              height="200000"
            >
              <rect
                x="-100000"
                y="-100000"
                width="200000"
                height="200000"
                fill="white"
              />
              <path
                d={d_Knockout}
                fill="black"
              />
            </mask>
            {d$_Pointed.length > 0 && (
              <mask
                id={id_Mask_Marks}
                maskUnits="userSpaceOnUse"
                x="-100000"
                y="-100000"
                width="200000"
                height="200000"
              >
                <rect
                  x="-100000"
                  y="-100000"
                  width="200000"
                  height="200000"
                  fill="white"
                />
                <path
                  d={d$_Pointed.join(" ")}
                  fill="none"
                  stroke="black"
                  stroke-width={String(2 * knockout)}
                />
              </mask>
            )}
          </defs>
        ),
        <g
          class="layer_htmlView"
          data-layer="FILLS"
        >
          {groupsIn(
            "RINGS",
            null,
            (measure_Underlay) => (
              <path
                {...measure_Underlay.attributes}
                class="area_htmlView"
                d={measure_Underlay.d_Area}
                pathLength="100"
              />
            )
          )}
        </g>,
        <g
          class="layer_htmlView"
          data-layer="RINGS"
          mask={d_Knockout === "" ? undefined : `url(#${id_Mask})`}
        >
          {groupsIn(
            "RINGS",
            false,
            pathsOf__Ring
          )}
        </g>,
        <g
          class="layer_htmlView"
          data-layer="MARKS"
          mask={d$_Pointed.length === 0 ? undefined : `url(#${id_Mask_Marks})`}
        >
          {groupsIn(
            "MARKS",
            null,
            (measure_Underlay) => (
              <path
                {...measure_Underlay.attributes}
                class="underlay_htmlView"
                d={measure_Underlay.d}
              />
            )
          )}
        </g>,
        <g
          class="layer_htmlView"
          data-layer="POINTED"
        >
          {groupsIn(
            "RINGS",
            true,
            pathsOf__Ring
          )}
        </g>
      ]
    })
    fit__Dash$({
      svgElement_underlay$
    })
  }
  fit__Lap$({
    containerElement_View
  })
}

function pathsOf__Ring(
  measure_Underlay: _Measure_Underlay_
): _Node_Jsx_ {
  return [
    <path
      {...measure_Underlay.attributes}
      class="underlay_htmlView"
      d={measure_Underlay.d}
    />,
    measure_Underlay.d_Seam$.map((d_Seam) => (
      <path
        {...measure_Underlay.attributes}
        class="seam_htmlView"
        d={d_Seam}
      />
    )),
    measure_Underlay.lap$.map((lap_Underlay) => (
      <path
        {...measure_Underlay.attributes}
        class="lap_htmlView"
        d={lap_Underlay.d}
        pathLength={String(lap_Underlay.pathLength)}
        style={`--phase_htmlView: ${lap_Underlay.phase}; --length_htmlView: ${lap_Underlay.length_Lap}`}
      />
    ))
  ]
}

interface _Api___drawn$Of__Run_Line$_ {
  run_Line$: _Run_Lines_
  containerElement_View: HTMLElement
}

function drawn$Of__Run_Line$({
  run_Line$,
  containerElement_View
}: _Api___drawn$Of__Run_Line$_): Array<_Drawn_Run_> {
  const selector_run = `.run_htmlView[data-run="${CSS.escape(run_Line$.id)}"]`
  const svgElement_underlay$ = containerElement_View.querySelector(`${selector_run} > .underlays_htmlView`)
  if (svgElement_underlay$ === null) {
    if (run_Line$.groups.length > 0) console.warn(`the text underlays of the run "${run_Line$.id}" aren't drawn: there's no ${selector_run} with its <svg class="underlays_htmlView">, which a host's component drawing the run has to keep`)
    return []
  }
  const divElement$_text = [...containerElement_View.querySelectorAll(`${selector_run} > .line_htmlView > .text_htmlView`)]
  if (run_Line$.groups.length > 0 && divElement$_text.length !== run_Line$.lines.length) {
    console.warn(`the text underlays of the run "${run_Line$.id}" aren't drawn: ${divElement$_text.length} of its ${run_Line$.lines.length} lines are a .line_htmlView right inside it with a .text_htmlView right inside that, which a host's component drawing a line has to keep`)
    return []
  }
  return [{
    run_Line$,
    svgElement_underlay$,
    divElement$_text
  }]
}

interface _Drawn_Run_ {
  run_Line$: _Run_Lines_
  svgElement_underlay$: Element
  divElement$_text: Array<Element>
}

interface _Api___makeRoom$__Drawn$_Run_ {
  drawn$_Run: Array<_Drawn_Run_>
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function makeRoom$__Drawn$_Run({
  drawn$_Run,
  ink$_Glyph_View
}: _Api___makeRoom$__Drawn$_Run_): void {
  const place$_Room = drawn$_Run.flatMap((drawn_Run) => place$Of__Drawn_Run({
    drawn_Run
  }))
  for (const place_Room of place$_Room) {
    place_Room.htmlElement_Room.style.removeProperty(place_Room.property_Room)
  }
  const room$ = place$_Room.map((place_Room) => ({
    place_Room,
    length_Room: lengthOf__Place_Room({
      place_Room,
      ink$_Glyph_View
    })
  }))
  for (const {
    place_Room,
    length_Room
  } of room$) {
    if (length_Room > 0) {
      place_Room.htmlElement_Room.style.setProperty(
        place_Room.property_Room,
        `${length_Room}px`
      )
    }
  }
}

interface _Api___place$Of__Drawn_Run_ {
  drawn_Run: _Drawn_Run_
}

function place$Of__Drawn_Run({
  drawn_Run
}: _Api___place$Of__Drawn_Run_): Array<_Place_Room_> {
  const inset_Underlay = insetOf__Element(drawn_Run.svgElement_underlay$)
  const edge$ = drawn_Run.run_Line$.groups
    .flatMap((group_Underlay) => group_Underlay.underlays)
    .flatMap((underlay_Text) => underlay_Text.kind !== "STRETCH" ? [] : [
      {
        position_Run: underlay_Text.from,
        isStart: true
      },
      {
        position_Run: underlay_Text.to,
        isStart: false
      }
    ])
  const edge$_Boundary$ = Map.groupBy(
    edge$,
    (edge) => `${edge.position_Run.line} ${edge.position_Run.offset}`
  )
  return [...edge$_Boundary$.values()].flatMap((edge$_Boundary) => place$Of__Edge$_Boundary({
    edge$_Boundary,
    divElement$_text: drawn_Run.divElement$_text,
    inset_Underlay
  }))
}

interface _Inset_Underlay_ {
  block: number
  inline: number
  clear: number
  step: number
  nest: number
  knockout: number
}

function insetOf__Element(
  element: Element
): _Inset_Underlay_ {
  const style = getComputedStyle(element)
  return {
    block: lengthOf__Value(style.getPropertyValue("--insetBlock_underlay_htmlView")),
    inline: lengthOf__Value(style.getPropertyValue("--insetInline_underlay_htmlView")),
    clear: lengthOf__Value(style.getPropertyValue("--clearInline_underlay_htmlView")),
    step: lengthOf__Value(style.getPropertyValue("--step_underlay_htmlView")),
    nest: lengthOf__Value(style.getPropertyValue("--nest_underlay_htmlView")),
    knockout: lengthOf__Value(style.getPropertyValue("--knockout_underlay_htmlView"))
  }
}

function lengthOf__Value(
  value: string
): number {
  const length = Number.parseFloat(value)
  return Number.isNaN(length) ? 0 : length
}

interface _Api___place$Of__Edge$_Boundary_ {
  edge$_Boundary: Array<_Edge_Underlay_>
  divElement$_text: Array<Element>
  inset_Underlay: _Inset_Underlay_
}

function place$Of__Edge$_Boundary({
  edge$_Boundary,
  divElement$_text,
  inset_Underlay
}: _Api___place$Of__Edge$_Boundary_): Array<_Place_Room_> {
  const [edge_First] = edge$_Boundary
  if (edge_First === undefined) return []
  const divElement_text = divElement$_text[edge_First.position_Run.line]
  if (divElement_text === undefined) return []
  const placed$_Text = placedOf__Text$(text$Of__Element(divElement_text))
  const text_Line = placed$_Text.map((placed_Text) => placed_Text.text.data).join("")
  const offset = edge_First.position_Run.offset
  if (!isVisible__Character(text_Line[offset - 1]) || !isVisible__Character(text_Line[offset])) return []
  const count_Start = edge$_Boundary.filter((edge) => edge.isStart).length
  const count_End = edge$_Boundary.filter((edge) => !edge.isStart).length
  const reach = -inset_Underlay.inline
  const reachOf = (count: number) => count === 0 ? 0 : reach + inset_Underlay.nest * (count - 1)
  const length_Needed = reachOf(count_Start) + reachOf(count_End) + (count_Start > 0 && count_End > 0 ? 2 * inset_Underlay.block : inset_Underlay.clear)
  const placed_Before = placed$_Text.find((placed_Text) => placed_Text.start + placed_Text.text.length === offset)
  const htmlElement_Before = placed_Before?.text.parentElement
  if (placed_Before !== undefined && htmlElement_Before instanceof HTMLElement && htmlElement_Before !== divElement_text && htmlElement_Before.lastChild === placed_Before.text) {
    return [{
      htmlElement_Room: htmlElement_Before,
      property_Room: "--view-room-inline-end",
      placed$_Text,
      offset,
      length_Needed
    }]
  }
  const placed_After = placed$_Text.find((placed_Text) => placed_Text.start === offset)
  const htmlElement_After = placed_After?.text.parentElement
  if (placed_After !== undefined && htmlElement_After instanceof HTMLElement && htmlElement_After !== divElement_text && htmlElement_After.firstChild === placed_After.text) {
    return [{
      htmlElement_Room: htmlElement_After,
      property_Room: "--view-room-inline-start",
      placed$_Text,
      offset,
      length_Needed
    }]
  }
  return []
}

interface _Edge_Underlay_ {
  position_Run: _Position_Run_
  isStart: boolean
}

interface _Placed_Text_ {
  text: Text
  start: number
}

function placedOf__Text$(
  text$: Array<Text>
): Array<_Placed_Text_> {
  return text$.map((
    text,
    index
  ) => ({
    text,
    start: text$
      .slice(
        0,
        index
      )
      .reduce(
        (
          length,
          each
        ) => length + each.length,
        0
      )
  }))
}

function text$Of__Element(
  element: Element
): Array<Text> {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT
  )
  const text$: Array<Text> = []
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) text$.push(node)
  return text$
}

function isVisible__Character(
  character: string | undefined
): boolean {
  return character !== undefined && !REGEXP_SPACE.test(character)
}

const REGEXP_SPACE = /\s/

interface _Place_Room_ {
  htmlElement_Room: HTMLElement
  property_Room: "--view-room-inline-start" | "--view-room-inline-end"
  placed$_Text: Array<_Placed_Text_>
  offset: number
  length_Needed: number
}

interface _Api___lengthOf__Place_Room_ {
  place_Room: _Place_Room_
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function lengthOf__Place_Room({
  place_Room,
  ink$_Glyph_View
}: _Api___lengthOf__Place_Room_): number {
  const extent_Before = extentOf__Character({
    placed$_Text: place_Room.placed$_Text,
    index: place_Room.offset - 1,
    ink$_Glyph_View
  })
  const extent_After = extentOf__Character({
    placed$_Text: place_Room.placed$_Text,
    index: place_Room.offset,
    ink$_Glyph_View
  })
  if (extent_Before === null || extent_After === null || extent_After.rect.top >= extent_Before.rect.bottom) return 0
  return Math.max(
    0,
    place_Room.length_Needed - (extent_After.left - extent_Before.right)
  )
}

interface _Api___extentOf__Character_ {
  placed$_Text: Array<_Placed_Text_>
  index: number
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function extentOf__Character({
  placed$_Text,
  index,
  ink$_Glyph_View
}: _Api___extentOf__Character_): _Extent_Character_ | null {
  const placed_Text = placed$_Text.find((placed) => placed.start <= index && index < placed.start + placed.text.length)
  if (placed_Text === undefined) return null
  const range = document.createRange()
  range.setStart(
    placed_Text.text,
    index - placed_Text.start
  )
  range.setEnd(
    placed_Text.text,
    index - placed_Text.start + 1
  )
  const rect = range.getBoundingClientRect()
  const character = placed_Text.text.data[index - placed_Text.start] ?? ""
  const element_Parent = placed_Text.text.parentElement
  if (REGEXP_SPACE.test(character) || REGEXP_SURROGATE.test(character) || element_Parent === null) {
    return {
      rect,
      left: rect.left,
      right: rect.right
    }
  }
  const ink_Glyph = inkOf__Glyph({
    character,
    font: getComputedStyle(element_Parent).font,
    ink$_Glyph_View
  })
  return {
    rect,
    left: rect.left + ink_Glyph.left,
    right: rect.right + ink_Glyph.right
  }
}

interface _Extent_Character_ {
  rect: DOMRect
  left: number
  right: number
}

const REGEXP_SURROGATE = /[\uD800-\uDFFF]/

interface _Api___inkOf__Glyph_ {
  character: string
  font: string
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function inkOf__Glyph({
  character,
  font,
  ink$_Glyph_View
}: _Api___inkOf__Glyph_): _Ink_Glyph_ {
  const key = `${font}\n${character}`
  const ink_Cached = ink$_Glyph_View.get(key)
  if (ink_Cached !== undefined) return ink_Cached
  const context = new OffscreenCanvas(
    1,
    1
  ).getContext("2d")
  if (context === null) {
    return {
      left: 0,
      right: 0
    }
  }
  context.font = font
  const metrics = context.measureText(character)
  const ink_Glyph = {
    left: -metrics.actualBoundingBoxLeft,
    right: metrics.actualBoundingBoxRight - metrics.width
  }
  ink$_Glyph_View.set(
    key,
    ink_Glyph
  )
  return ink_Glyph
}

interface _Ink_Glyph_ {
  left: number
  right: number
}

interface _Measure_Run_ {
  svgElement_underlay$: Element
  id_Run: string
  knockout: number
  measure$_Group: Array<_Measure_Group_>
}

interface _Measure_Group_ {
  attributes: _Attributes_Element_
  measure$_Underlay: Array<_Measure_Underlay_>
}

interface _Measure_Underlay_ {
  attributes: _Attributes_Element_
  layer: _Layer_Underlay_
  d_Area: string
  d: string
  d_Seam$: Array<string>
  lap$: Array<_Lap_Underlay_>
  d_Knockout: string
}

type _Layer_Underlay_ = "RINGS" | "MARKS"

interface _Lap_Underlay_ {
  d: string
  pathLength: number
  phase: number
  length_Lap: number
}

interface _Api___measureOf__Drawn_Run_ {
  drawn_Run: _Drawn_Run_
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function measureOf__Drawn_Run({
  drawn_Run,
  ink$_Glyph_View
}: _Api___measureOf__Drawn_Run_): _Measure_Run_ {
  const origin = drawn_Run.svgElement_underlay$.getBoundingClientRect()
  const inset_Underlay = insetOf__Element(drawn_Run.svgElement_underlay$)
  const stretch$_Run = drawn_Run.run_Line$.groups
    .flatMap((group_Underlay) => group_Underlay.underlays)
    .flatMap((underlay_Text) => underlay_Text.kind === "STRETCH" ? [underlay_Text] : [])
  const measure$_Box = stretch$_Run.map((underlay_Text) => ({
    underlay_Text,
    depth: depthOf__Underlay_Text({
      underlay_Text,
      stretch$_Run
    }),
    box$_Row: box$Of__Underlay_Text({
      underlay_Text,
      divElement$_text: drawn_Run.divElement$_text,
      origin,
      ink$_Glyph_View
    })
  }))
  const context_Measure: _Context_Measure_ = {
    measure$_Box,
    inset_Underlay,
    divElement$_text: drawn_Run.divElement$_text,
    svgElement_underlay$: drawn_Run.svgElement_underlay$,
    origin
  }
  return {
    svgElement_underlay$: drawn_Run.svgElement_underlay$,
    id_Run: drawn_Run.run_Line$.id,
    knockout: inset_Underlay.knockout,
    measure$_Group: drawn_Run.run_Line$.groups.map((group_Underlay) => ({
      attributes: group_Underlay.attributes,
      measure$_Underlay: group_Underlay.underlays.map((underlay_Text) => measureOf__Underlay_Text({
        underlay_Text,
        context_Measure
      }))
    }))
  }
}

interface _Api___depthOf__Underlay_Text_ {
  underlay_Text: _STRETCH_Underlay_Text_
  stretch$_Run: Array<_STRETCH_Underlay_Text_>
}

function depthOf__Underlay_Text({
  underlay_Text,
  stretch$_Run
}: _Api___depthOf__Underlay_Text_): number {
  return stretch$_Run.filter((underlay_Run) => underlay_Run !== underlay_Text && isWithin__Underlay$_Text({
    underlay_Text_inner: underlay_Text,
    underlay_Text_outer: underlay_Run
  })).length
}

interface _Api___isWithin__Underlay$_Text_ {
  underlay_Text_inner: _STRETCH_Underlay_Text_
  underlay_Text_outer: _STRETCH_Underlay_Text_
}

function isWithin__Underlay$_Text({
  underlay_Text_inner,
  underlay_Text_outer
}: _Api___isWithin__Underlay$_Text_): boolean {
  const from = compared__Position$_Run({
    position_Run: underlay_Text_outer.from,
    position_Run_other: underlay_Text_inner.from
  })
  const to = compared__Position$_Run({
    position_Run: underlay_Text_inner.to,
    position_Run_other: underlay_Text_outer.to
  })
  return from <= 0 && to <= 0 && (from < 0 || to < 0)
}

interface _Api___compared__Position$_Run_ {
  position_Run: _Position_Run_
  position_Run_other: _Position_Run_
}

function compared__Position$_Run({
  position_Run,
  position_Run_other
}: _Api___compared__Position$_Run_): number {
  return position_Run.line === position_Run_other.line ? position_Run.offset - position_Run_other.offset : position_Run.line - position_Run_other.line
}

interface _Api___box$Of__Underlay_Text_ {
  underlay_Text: _STRETCH_Underlay_Text_
  divElement$_text: Array<Element>
  origin: DOMRect
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function box$Of__Underlay_Text({
  underlay_Text,
  divElement$_text,
  origin,
  ink$_Glyph_View
}: _Api___box$Of__Underlay_Text_): Array<_Box_Row_> {
  return divElement$_text
    .slice(
      underlay_Text.from.line,
      underlay_Text.to.line + 1
    )
    .flatMap((
      divElement_text,
      index
    ) => box$Of__Stretch_Line({
      divElement_text,
      from: index === 0 ? underlay_Text.from.offset : 0,
      to: underlay_Text.from.line + index === underlay_Text.to.line ? underlay_Text.to.offset : Infinity,
      isStart: index === 0,
      isEnd: underlay_Text.from.line + index === underlay_Text.to.line,
      origin,
      ink$_Glyph_View
    }))
}

interface _Api___box$Of__Stretch_Line_ {
  divElement_text: Element
  from: number
  to: number
  isStart: boolean
  isEnd: boolean
  origin: DOMRect
  ink$_Glyph_View: Map<string, _Ink_Glyph_>
}

function box$Of__Stretch_Line({
  divElement_text,
  from,
  to,
  isStart,
  isEnd,
  origin,
  ink$_Glyph_View
}: _Api___box$Of__Stretch_Line_): Array<_Box_Row_> {
  const rect_text = divElement_text.getBoundingClientRect()
  const height = parseFloat(getComputedStyle(divElement_text).lineHeight)
  const text$ = text$Of__Element(divElement_text)
  const text_Line = text$.map((text) => text.data).join("")
  const placed$_Text = placedOf__Text$(text$)
  const rect$ = placed$_Text
    .filter(({
      text,
      start
    }) => start < to && start + text.length > from)
    .flatMap(({
      text,
      start
    }) => {
      const range = document.createRange()
      range.setStart(
        text,
        Math.max(
          from,
          start
        ) - start
      )
      range.setEnd(
        text,
        Math.min(
          to,
          start + text.length
        ) - start
      )
      return [...range.getClientRects()]
    })
  const rowOf = (rect: DOMRect) => Math.floor((rect.top + rect.height / 2 - rect_text.top) / height)
  const rect$_Row$ = Map.groupBy(
    rect$,
    rowOf
  )
  const entry$_Row = [...rect$_Row$]
  const extent_First = extentOf__Character({
    placed$_Text,
    index: from,
    ink$_Glyph_View
  })
  const extent_Last = extentOf__Character({
    placed$_Text,
    index: Math.min(
      to,
      text_Line.length
    ) - 1,
    ink$_Glyph_View
  })
  const extent_Before = extentOf__Character({
    placed$_Text,
    index: indexOf__Visible({
      text_Line,
      from: from - 1,
      step: -1
    }),
    ink$_Glyph_View
  })
  const extent_After = extentOf__Character({
    placed$_Text,
    index: indexOf__Visible({
      text_Line,
      from: to,
      step: 1
    }),
    ink$_Glyph_View
  })
  const extent_Note = extentOf__Note({
    divElement_text
  })
  const isOn = (
    extent: _Extent_Character_ | null,
    row: number
  ): extent is _Extent_Character_ => extent !== null && rowOf(extent.rect) === row
  return entry$_Row.map((
    [
      row,
      rect$_Row
    ],
    index
  ) => {
    const isFirst = index === 0
    const isLast = index === entry$_Row.length - 1
    const left = isStart && isFirst && isOn(
      extent_First,
      row
    ) ? extent_First.left : Math.min(...rect$_Row.map((rect) => rect.left))
    const right = isEnd && isLast && isOn(
      extent_Last,
      row
    ) ? extent_Last.right : Math.max(...rect$_Row.map((rect) => rect.right))
    return {
      left: left - origin.left,
      top: rect_text.top - origin.top + row * height,
      right: right - origin.left,
      bottom: rect_text.top - origin.top + (row + 1) * height,
      free_Left: isFirst && isOn(
        extent_Before,
        row
      ) ? left - extent_Before.right : Infinity,
      free_Right: isLast && isOn(
        extent_After,
        row
      ) ? extent_After.left - right : isLast && isOn(
        extent_Note,
        row
      ) ? extent_Note.left - right : Infinity
    }
  })
}

interface _Api___extentOf__Note_ {
  divElement_text: Element
}

function extentOf__Note({
  divElement_text
}: _Api___extentOf__Note_): _Extent_Character_ | null {
  const buttonElement_note = divElement_text.querySelector(":scope > .note_htmlView")
  if (buttonElement_note === null) return null
  const rect = buttonElement_note.getBoundingClientRect()
  return {
    rect,
    left: rect.left,
    right: rect.right
  }
}

interface _Api___indexOf__Visible_ {
  text_Line: string
  from: number
  step: number
}

function indexOf__Visible({
  text_Line,
  from,
  step
}: _Api___indexOf__Visible_): number {
  for (let index = from; index >= 0 && index < text_Line.length; index += step) {
    if (!REGEXP_SPACE.test(text_Line[index] ?? "")) return index
  }
  return -1
}

interface _Box_Row_ {
  left: number
  top: number
  right: number
  bottom: number
  free_Left: number
  free_Right: number
}

interface _Measure_Box_ {
  underlay_Text: _STRETCH_Underlay_Text_
  depth: number
  box$_Row: Array<_Box_Row_>
}

interface _Context_Measure_ {
  measure$_Box: Array<_Measure_Box_>
  inset_Underlay: _Inset_Underlay_
  divElement$_text: Array<Element>
  svgElement_underlay$: Element
  origin: DOMRect
}

interface _Api___measureOf__Underlay_Text_<Kind extends _Underlay_Text_["kind"]> {
  underlay_Text: Extract<
    _Underlay_Text_,
    __BASE_Underlay_Text_<Kind>
  >
  context_Measure: _Context_Measure_
}

function measureOf__Underlay_Text<Kind extends _Underlay_Text_["kind"]>({
  underlay_Text,
  context_Measure
}: _Api___measureOf__Underlay_Text_<Kind>): _Measure_Underlay_ {
  const measure = MEASUREMAP__UNDERLAY_TEXT[underlay_Text.kind]
  return measure({
    underlay_Text,
    context_Measure
  })
}

type _MeasureMap__Underlay_Text_ = {
  [Kind in _Underlay_Text_["kind"]]: (api_Measure: _Api___measureOf__Underlay_Text_<Kind>) => _Measure_Underlay_
}

const MEASUREMAP__UNDERLAY_TEXT: _MeasureMap__Underlay_Text_ = {
  STRETCH: measureOf__Stretch,
  POINT: measureOf__Point,
  BOUNDARY: measureOf__Boundary,
  UNDERLINE: measureOf__Underline
}

function measureOf__Stretch({
  underlay_Text,
  context_Measure
}: _Api___measureOf__Underlay_Text_<"STRETCH">): _Measure_Underlay_ {
  const measure_Box = context_Measure.measure$_Box.find((measure_Box_each) => measure_Box_each.underlay_Text === underlay_Text)
  return measure_Box === undefined
    ? {
      layer: "RINGS",
      attributes: underlay_Text.attributes,
      d_Area: "",
      d: "",
      d_Seam$: [],
      lap$: [],
      d_Knockout: ""
    }
    : {
      layer: "RINGS",
      attributes: underlay_Text.attributes,
      ...pathOf__Measure_Box({
        measure_Box,
        measure$_Box: context_Measure.measure$_Box,
        inset_Underlay: context_Measure.inset_Underlay
      }),
      d_Knockout: ""
    }
}

function measureOf__Point({
  underlay_Text,
  context_Measure
}: _Api___measureOf__Underlay_Text_<"POINT">): _Measure_Underlay_ {
  const size_Notch = sizeOf__Notch(context_Measure.svgElement_underlay$)
  const divElement_text = context_Measure.divElement$_text[underlay_Text.at.line]
  const caret = divElement_text === undefined
    ? null
    : caretOf__Offset({
      divElement_text,
      offset: underlay_Text.at.offset
    })
  if (caret === null) {
    return {
      layer: "RINGS",
      attributes: {
        ...underlay_Text.attributes,
        "data-notch": "point"
      },
      d_Area: "",
      d: "",
      d_Seam$: [],
      lap$: [],
      d_Knockout: ""
    }
  }
  const x = caret.x - context_Measure.origin.left
  const tip = caret.top - context_Measure.origin.top + size_Notch.gap
  const base = tip - size_Notch.length
  const half = size_Notch.width / 2
  return {
    layer: "RINGS",
    attributes: {
      ...underlay_Text.attributes,
      "data-notch": "point"
    },
    d_Area: `M ${x - half - size_Notch.reach} ${base - size_Notch.reach} H ${x + half + size_Notch.reach} V ${tip + size_Notch.reach} H ${x - half - size_Notch.reach} Z`,
    d: `M ${x - half} ${base} L ${x + half} ${base} L ${x} ${tip} Z`,
    d_Seam$: [],
    lap$: [],
    d_Knockout: ""
  }
}

function measureOf__Boundary({
  underlay_Text,
  context_Measure
}: _Api___measureOf__Underlay_Text_<"BOUNDARY">): _Measure_Underlay_ {
  const size_Notch = sizeOf__Notch(context_Measure.svgElement_underlay$)
  const rect_After = context_Measure.divElement$_text[underlay_Text.line]?.getBoundingClientRect()
  const rect_Before = context_Measure.divElement$_text[underlay_Text.line - 1]?.getBoundingClientRect()
  const y = rect_After !== undefined
    ? rect_After.top - context_Measure.origin.top
    : rect_Before !== undefined
      ? rect_Before.bottom - context_Measure.origin.top
      : 0
  const x = xOf__Bar({
    svgElement_underlay$: context_Measure.svgElement_underlay$,
    rect_Text: rect_After ?? rect_Before ?? null,
    size_Notch
  }) - context_Measure.origin.left
  const half = size_Notch.width / 2
  return {
    layer: "RINGS",
    attributes: {
      ...underlay_Text.attributes,
      "data-notch": "boundary"
    },
    d_Area: `M ${x - 2 * size_Notch.reach} ${y - half - size_Notch.reach} H ${x + size_Notch.length + size_Notch.reach} V ${y + half + size_Notch.reach} H ${x - 2 * size_Notch.reach} Z`,
    d: `M ${x} ${y - half} L ${x} ${y + half} L ${x + size_Notch.length} ${y} Z`,
    d_Seam$: [],
    lap$: [],
    d_Knockout: ""
  }
}

function measureOf__Underline({
  underlay_Text,
  context_Measure
}: _Api___measureOf__Underlay_Text_<"UNDERLINE">): _Measure_Underlay_ {
  const reach = context_Measure.inset_Underlay.knockout
  const row$ = context_Measure.divElement$_text
    .slice(
      underlay_Text.from.line,
      underlay_Text.to.line + 1
    )
    .flatMap((
      divElement_text,
      index
    ) => rowsOf__Rects(rectsOf__Offsets({
      placed$_Text: placedOf__Text$(text$Of__Element(divElement_text).filter((text) => text.parentElement?.closest(".note_htmlView") === null)),
      from: index === 0 ? underlay_Text.from.offset : 0,
      to: underlay_Text.from.line + index === underlay_Text.to.line ? underlay_Text.to.offset : Infinity
    })).map((rect_Row) => ({
      left: rect_Row.left - context_Measure.origin.left,
      right: rect_Row.right - context_Measure.origin.left,
      y: rect_Row.bottom - context_Measure.origin.top
    })))
  return {
    layer: "MARKS",
    attributes: {
      ...underlay_Text.attributes,
      "data-underline": ""
    },
    d_Area: "",
    d: row$.map((row) => `M ${row.left} ${row.y} L ${row.right} ${row.y}`).join(" "),
    d_Seam$: [],
    lap$: [],
    d_Knockout: row$.map((row) => `M ${row.left - reach} ${row.y - reach} H ${row.right + reach} V ${row.y + reach} H ${row.left - reach} Z`).join(" ")
  }
}

interface _Size_Notch_ {
  width: number
  length: number
  gap: number
  reach: number
}

function sizeOf__Notch(
  svgElement_underlay$: Element
): _Size_Notch_ {
  const em = parseFloat(getComputedStyle(svgElement_underlay$).fontSize)
  return {
    width: em * 6 / 14,
    length: em * 4 / 14,
    gap: em * 1 / 14,
    reach: em * 3 / 14
  }
}

interface _Api___caretOf__Offset_ {
  divElement_text: Element
  offset: number
}

interface _Caret_Text_ {
  x: number
  top: number
  bottom: number
}

function caretOf__Offset({
  divElement_text,
  offset
}: _Api___caretOf__Offset_): _Caret_Text_ {
  const placed$_Text = placedOf__Text$(text$Of__Element(divElement_text).filter((text) => text.parentElement?.closest(".note_htmlView") === null))
  const index = offset > 0 && placed$_Text.every(({
    text,
    start
  }) => offset >= start + text.length || offset < start) ? offset - 1 : offset
  const placed_Text = placed$_Text.find(({
    text,
    start
  }) => start <= index && index < start + text.length)
  if (placed_Text === undefined) {
    const rect = divElement_text.getBoundingClientRect()
    const style = getComputedStyle(divElement_text)
    const top = rect.top + (parseFloat(style.lineHeight) - parseFloat(style.fontSize)) / 2
    return {
      x: rect.left + parseFloat(style.paddingLeft),
      top,
      bottom: top + parseFloat(style.fontSize)
    }
  }
  const range = document.createRange()
  range.setStart(
    placed_Text.text,
    index - placed_Text.start
  )
  range.setEnd(
    placed_Text.text,
    index - placed_Text.start + 1
  )
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect()
  return {
    x: index === offset ? rect.left : rect.right,
    top: rect.top,
    bottom: rect.bottom
  }
}

interface _Api___xOf__Bar_ {
  svgElement_underlay$: Element
  rect_Text: DOMRect | null
  size_Notch: _Size_Notch_
}

function xOf__Bar({
  svgElement_underlay$,
  rect_Text,
  size_Notch
}: _Api___xOf__Bar_): number {
  const element_Bar = svgElement_underlay$.closest(".frame_htmlView")?.querySelector(":scope > .bar_htmlView")
  if (element_Bar === null || element_Bar === undefined) return (rect_Text?.left ?? svgElement_underlay$.getBoundingClientRect().left) - size_Notch.length - size_Notch.reach
  return element_Bar.getBoundingClientRect().right - parseFloat(getComputedStyle(element_Bar).paddingRight)
}

interface _Api___pathOf__Measure_Box_ {
  measure_Box: _Measure_Box_
  measure$_Box: Array<_Measure_Box_>
  inset_Underlay: _Inset_Underlay_
}

function pathOf__Measure_Box({
  measure_Box,
  measure$_Box,
  inset_Underlay
}: _Api___pathOf__Measure_Box_): _Path_Underlay_ {
  const gap = 2 * inset_Underlay.block
  const box$_Sibling = measure$_Box
    .filter((measure_Box_other) => measure_Box_other !== measure_Box && !isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box.underlay_Text,
      underlay_Text_outer: measure_Box_other.underlay_Text
    }) && !isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box_other.underlay_Text,
      underlay_Text_outer: measure_Box.underlay_Text
    }))
    .flatMap((measure_Box_other) => measure_Box_other.box$_Row)
  const box$_Container = measure$_Box
    .filter((measure_Box_other) => isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box.underlay_Text,
      underlay_Text_outer: measure_Box_other.underlay_Text
    }))
    .flatMap((measure_Box_other) => measure_Box_other.box$_Row)
  const box$_Nested = measure$_Box
    .filter((measure_Box_other) => measure_Box_other !== measure_Box && isWithin__Underlay$_Text({
      underlay_Text_inner: measure_Box_other.underlay_Text,
      underlay_Text_outer: measure_Box.underlay_Text
    }))
    .flatMap((measure_Box_other) => measure_Box_other.box$_Row)
  const chain$ = chain$Of__Box$_Row(measure_Box.box$_Row).map((chain_Box$) => levelled$Of__Chain_Box$({
    chain_Box$: roomed$Of__Chain_Box$({
      chain_Box$,
      box$_Sibling,
      box$_Container,
      box$_Nested,
      reach: -inset_Underlay.inline,
      block: inset_Underlay.block + inset_Underlay.nest * measure_Box.depth,
      gap,
      clear: inset_Underlay.clear,
      nest: inset_Underlay.nest
    }),
    step: inset_Underlay.step
  }))
  const path$_Chain = chain$.map((
    chain_Box$,
    index
  ) => pathOf__Chain_Box$({
    chain_Box$,
    clear: inset_Underlay.clear,
    isSeam_Left: index > 0,
    isSeam_Right: index < chain$.length - 1
  }))
  return {
    d_Area: path$_Chain.map((path_Chain) => path_Chain.d_Area).join(" "),
    d: path$_Chain.map((path_Chain) => path_Chain.d).join(" "),
    d_Seam$: path$_Chain.flatMap((path_Chain) => path_Chain.d_Seam$),
    lap$: lap$Of__Chain$(chain$)
  }
}

interface _Path_Underlay_ {
  d_Area: string
  d: string
  d_Seam$: Array<string>
  lap$: Array<_Lap_Underlay_>
}

function chain$Of__Box$_Row(
  box$_Row: Array<_Box_Row_>
): Array<Array<_Box_Row_>> {
  const chain$: Array<Array<_Box_Row_>> = []
  for (const box_Row of box$_Row) {
    const chain = chain$.at(-1)
    const box_Row_before = chain?.at(-1)
    if (chain !== undefined && box_Row_before !== undefined && isJoined__Box$_Row({
      box_Row_above: box_Row_before,
      box_Row_below: box_Row
    })) chain.push(box_Row)
    else chain$.push([box_Row])
  }
  return chain$
}

interface _Api___isJoined__Box$_Row_ {
  box_Row_above: _Box_Row_
  box_Row_below: _Box_Row_
}

function isJoined__Box$_Row({
  box_Row_above,
  box_Row_below
}: _Api___isJoined__Box$_Row_): boolean {
  return Math.abs(box_Row_above.bottom - box_Row_below.top) < 1 && box_Row_below.left < box_Row_above.right && box_Row_above.left < box_Row_below.right
}

interface _Api___roomed$Of__Chain_Box$_ {
  chain_Box$: Array<_Box_Row_>
  box$_Sibling: Array<_Box_Row_>
  box$_Container: Array<_Box_Row_>
  box$_Nested: Array<_Box_Row_>
  reach: number
  block: number
  gap: number
  clear: number
  nest: number
}

function roomed$Of__Chain_Box$({
  chain_Box$,
  box$_Sibling,
  box$_Container,
  box$_Nested,
  reach,
  block,
  gap,
  clear,
  nest
}: _Api___roomed$Of__Chain_Box$_): Array<_Box_Row_> {
  return chain_Box$.map((
    box_Row,
    index
  ) => {
    const box$_Row_Sibling = box$_Sibling.filter((box_Sibling) => Math.abs(box_Sibling.top - box_Row.top) < 1)
    const box$_Row_Container = box$_Container.filter((box_Container) => Math.abs(box_Container.top - box_Row.top) < 1)
    const box$_Row_Nested = box$_Nested.filter((box_Nested) => Math.abs(box_Nested.top - box_Row.top) < 1)
    const reachOf = (distance: number) => Math.max(
      reach,
      reach + nest - distance
    )
    const room_Left = Math.min(
      Math.max(
        reach,
        ...box$_Row_Nested.map((box_Nested) => reachOf(box_Nested.left - box_Row.left))
      ),
      Math.max(
        0,
        box_Row.free_Left - clear
      ),
      ...box$_Row_Sibling.filter((box_Sibling) => box_Sibling.right <= box_Row.left + 0.5).map((box_Sibling) => (box_Row.left - box_Sibling.right - gap) / 2),
      ...box$_Row_Container.map((box_Container) => box_Row.left - box_Container.left - nest + Math.min(
        reachOf(box_Row.left - box_Container.left),
        Math.max(
          0,
          box_Container.free_Left - clear
        )
      ))
    )
    const room_Right = Math.min(
      Math.max(
        reach,
        ...box$_Row_Nested.map((box_Nested) => reachOf(box_Row.right - box_Nested.right))
      ),
      Math.max(
        0,
        box_Row.free_Right - clear
      ),
      ...box$_Row_Sibling.filter((box_Sibling) => box_Sibling.left >= box_Row.right - 0.5).map((box_Sibling) => (box_Sibling.left - box_Row.right - gap) / 2),
      ...box$_Row_Container.map((box_Container) => box_Container.right - box_Row.right - nest + Math.min(
        reachOf(box_Container.right - box_Row.right),
        Math.max(
          0,
          box_Container.free_Right - clear
        )
      ))
    )
    const middle = (box_Row.left + box_Row.right) / 2
    return {
      left: Math.min(
        box_Row.left - room_Left,
        middle
      ),
      top: index === 0 ? box_Row.top + block : box_Row.top,
      right: Math.max(
        box_Row.right + room_Right,
        middle
      ),
      bottom: index === chain_Box$.length - 1 ? box_Row.bottom - block : box_Row.bottom,
      free_Left: box_Row.free_Left,
      free_Right: box_Row.free_Right
    }
  })
}

interface _Api___levelled$Of__Chain_Box$_ {
  chain_Box$: Array<_Box_Row_>
  step: number
}

function levelled$Of__Chain_Box$({
  chain_Box$,
  step
}: _Api___levelled$Of__Chain_Box$_): Array<_Box_Row_> {
  const right$ = levelled$Of__Edge$({
    edge$: chain_Box$.map((box_Row) => box_Row.right),
    isOpen$: chain_Box$.map((box_Row) => box_Row.free_Right === Infinity),
    step,
    sign: 1
  })
  const left$ = levelled$Of__Edge$({
    edge$: chain_Box$.map((box_Row) => box_Row.left),
    isOpen$: chain_Box$.map((box_Row) => box_Row.free_Left === Infinity),
    step,
    sign: -1
  })
  return chain_Box$.map((
    box_Row,
    index
  ) => ({
    ...box_Row,
    left: left$[index] ?? box_Row.left,
    right: right$[index] ?? box_Row.right
  }))
}

interface _Api___levelled$Of__Edge$_ {
  edge$: Array<number>
  isOpen$: Array<boolean>
  step: number
  sign: number
}

function levelled$Of__Edge$({
  edge$,
  isOpen$,
  step,
  sign
}: _Api___levelled$Of__Edge$_): Array<number> {
  const group$: Array<Array<number>> = []
  edge$.forEach((
    edge,
    index
  ) => {
    const group = group$.at(-1)
    const outer = group === undefined ? undefined : Math.max(...group.map((index_Group) => sign * (edge$[index_Group] ?? 0)))
    if (isOpen$[index] === true && group !== undefined && outer !== undefined && isOpen$[group[0] ?? -1] === true && Math.abs(sign * edge - outer) < step) group.push(index)
    else group$.push([index])
  })
  return group$.flatMap((group) => {
    const outer = sign * Math.max(...group.map((index_Group) => sign * (edge$[index_Group] ?? 0)))
    return group.map(() => outer)
  })
}

interface _Api___pathOf__Chain_Box$_ {
  chain_Box$: Array<_Box_Row_>
  clear: number
  isSeam_Left: boolean
  isSeam_Right: boolean
}

function pathOf__Chain_Box$({
  chain_Box$,
  clear,
  isSeam_Left,
  isSeam_Right
}: _Api___pathOf__Chain_Box$_): _Chain_Path_ {
  const corner$ = corner$Of__Chain_Box$(chain_Box$)
  const index_Right = 2 * chain_Box$.length - 2
  const index_Left = 4 * chain_Box$.length - 2
  const index$_Seam = [
    ...isSeam_Right ? [index_Right] : [],
    ...isSeam_Left ? [index_Left] : []
  ]
  const index$_Open = [
    ...(chain_Box$.at(-1)?.free_Right ?? Infinity) < clear ? [index_Right] : [],
    ...(chain_Box$[0]?.free_Left ?? Infinity) < clear ? [index_Left] : [],
    ...index$_Seam
  ]
  const pointOf = (index: number) => {
    const corner = corner$[index % corner$.length] ?? {
      x: 0,
      y: 0
    }
    return `${corner.x} ${corner.y}`
  }
  return {
    d_Area: dOf__Corner$({
      corner$,
      index$_Open: []
    }),
    d: dOf__Corner$({
      corner$,
      index$_Open
    }),
    d_Seam$: index$_Seam.map((index_Edge) => `M ${pointOf(index_Edge)} L ${pointOf(index_Edge + 1)}`)
  }
}

interface _Api___dOf__Corner$_ {
  corner$: Array<_Corner_Path_>
  index$_Open: Array<number>
}

function dOf__Corner$({
  corner$,
  index$_Open
}: _Api___dOf__Corner$_): string {
  const index_Start = index$_Open[0] ?? corner$.length - 1
  const command$ = corner$.map((
    _,
    step
  ) => {
    const index_Edge = (index_Start + step) % corner$.length
    return {
      isMove: step === 0 || index$_Open.includes(index_Edge),
      corner: corner$[(index_Edge + 1) % corner$.length] ?? {
        x: 0,
        y: 0
      }
    }
  })
  const isLevel = (
    length: number,
    length_other: number
  ) => Math.abs(length - length_other) < 0.01
  const command$_Kept = command$.filter((
    command,
    index
  ) => {
    const command_Before = command$[index - 1]
    const command_After = command$[index + 1]
    if (command.isMove || command_Before === undefined) return true
    const isAgain = isLevel(command.corner.x, command_Before.corner.x) && isLevel(command.corner.y, command_Before.corner.y)
    const isThrough = command_After !== undefined && !command_After.isMove && (isLevel(command_Before.corner.x, command.corner.x) && isLevel(command.corner.x, command_After.corner.x) || isLevel(command_Before.corner.y, command.corner.y) && isLevel(command.corner.y, command_After.corner.y))
    return !isAgain && !isThrough
  })
  const d = command$_Kept.map((command) => `${command.isMove ? "M" : "L"} ${command.corner.x} ${command.corner.y}`).join(" ")
  return index$_Open.length === 0 ? `${d} Z` : d
}


interface _Corner_Path_ {
  x: number
  y: number
}

interface _Chain_Path_ {
  d_Area: string
  d: string
  d_Seam$: Array<string>
}

function corner$Of__Chain_Box$(
  chain_Box$: Array<_Box_Row_>
): Array<_Corner_Path_> {
  return [
    ...chain_Box$.flatMap((box_Row) => [
      {
        x: box_Row.right,
        y: box_Row.top
      },
      {
        x: box_Row.right,
        y: box_Row.bottom
      }
    ]),
    ...chain_Box$.toReversed().flatMap((box_Row) => [
      {
        x: box_Row.left,
        y: box_Row.bottom
      },
      {
        x: box_Row.left,
        y: box_Row.top
      }
    ])
  ]
}

function lap$Of__Chain$(
  chain$: Array<Array<_Box_Row_>>
): Array<_Lap_Underlay_> {
  const corner$_Chain$ = chain$.map(corner$Of__Chain_Box$)
  const piece$ = piece$Of__Corner$_Chain$(corner$_Chain$)
  const length$ = piece$.map(lengthOf__Corner$)
  const length_Lap = length$.reduce(
    (
      total,
      length
    ) => total + length,
    0
  )
  if (length_Lap === 0) return []
  return piece$.flatMap((
    corner$,
    index
  ) => {
    const length = length$[index] ?? 0
    const start = length$
      .slice(
        0,
        index
      )
      .reduce(
        (
          total,
          length_before
        ) => total + length_before,
        0
      )
    return length === 0 ? [] : [{
      d: corner$.map((
        corner,
        index_Corner
      ) => `${index_Corner === 0 ? "M" : "L"} ${corner.x} ${corner.y}`).join(" "),
      pathLength: Math.round(length / length_Lap * 100000) / 1000,
      phase: Math.round(start / length_Lap * 100000) / 100000,
      length_Lap: Math.round(length_Lap * 100) / 100
    }]
  })
}

function piece$Of__Corner$_Chain$(
  corner$_Chain$: Array<Array<_Corner_Path_>>
): Array<Array<_Corner_Path_>> {
  const count = corner$_Chain$.length
  const upperOf = (corner$: Array<_Corner_Path_>) => [
    ...corner$.slice(-1),
    ...corner$.slice(
      0,
      corner$.length / 2 - 1
    )
  ]
  const lowerOf = (
    corner$: Array<_Corner_Path_>,
    isFirst: boolean
  ) => corner$.slice(
    corner$.length / 2 - 1,
    isFirst ? corner$.length : corner$.length - 1
  )
  const corner$_Last = corner$_Chain$.at(-1) ?? []
  return count === 1
    ? [[
      ...corner$_Last.slice(-1),
      ...corner$_Last
    ]]
    : [
      ...corner$_Chain$
        .slice(
          0,
          -1
        )
        .map(upperOf),
      [
        ...corner$_Last.slice(-1),
        ...corner$_Last.slice(
          0,
          -1
        )
      ],
      ...corner$_Chain$
        .slice(
          0,
          -1
        )
        .map((
          corner$,
          index
        ) => lowerOf(
          corner$,
          index === 0
        ))
        .toReversed()
    ]
}

function lengthOf__Corner$(
  corner$: Array<_Corner_Path_>
): number {
  return corner$.slice(1).reduce(
    (
      total,
      corner,
      index
    ) => {
      const corner_before = corner$[index] ?? corner
      return total + Math.hypot(
        corner.x - corner_before.x,
        corner.y - corner_before.y
      )
    },
    0
  )
}

interface _Api___fit__Dash$_ {
  svgElement_underlay$: Element
}

function fit__Dash$({
  svgElement_underlay$
}: _Api___fit__Dash$_): void {
  const point$_End = [...svgElement_underlay$.querySelectorAll(".underlay_htmlView[data-underline]")].flatMap((pathElement) => piece$Of__D(pathElement.getAttribute("d") ?? "").flatMap((piece) => [
    piece.point$[0],
    piece.point$.at(-1)
  ].flatMap((point) => point === undefined ? [] : [point])))
  for (const pathElement of svgElement_underlay$.querySelectorAll(":is(.underlay_htmlView, .seam_htmlView):not([data-notch])")) {
    if (!(pathElement instanceof SVGPathElement)) continue
    const [
      length_Dash,
      length_Gap
    ] = length$Of__Dasharray(getComputedStyle(pathElement).strokeDasharray)
    if (length_Dash === undefined || length_Gap === undefined || length_Dash + length_Gap <= 0) continue
    const piece$ = piece$Of__D(pathElement.getAttribute("d") ?? "")
    pathElement.setAttribute(
      "d",
      pathElement.hasAttribute("data-underline")
        ? dOf__Mark$({
          piece$,
          length_Mark: length_Dash,
          length_Gap,
          point$_End
        })
        : dOf__Dash$({
          piece$,
          length_Dash,
          pitch: length_Dash + length_Gap
        })
    )
    pathElement.style.setProperty(
      "stroke-dasharray",
      "none"
    )
  }
}

function piece$Of__D(
  d: string
): Array<_Piece_Dash_> {
  return d
    .split("M")
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .map((part) => {
      const number$ = (part.match(REGEXP_NUMBER) ?? []).map(Number)
      return {
        point$: Array.from(
          {
            length: Math.floor(number$.length / 2)
          },
          (
            _,
            index
          ) => ({
            x: number$[2 * index] ?? 0,
            y: number$[2 * index + 1] ?? 0
          })
        ),
        isClosed: part.endsWith("Z")
      }
    })
}

interface _Piece_Dash_ {
  point$: Array<_Corner_Path_>
  isClosed: boolean
}

const REGEXP_NUMBER = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi

interface _Api___dOf__Mark$_ {
  piece$: Array<_Piece_Dash_>
  length_Mark: number
  length_Gap: number
  point$_End: Array<_Corner_Path_>
}

function dOf__Mark$({
  piece$,
  length_Mark,
  length_Gap,
  point$_End
}: _Api___dOf__Mark$_): string {
  const isJoined = (point: _Corner_Path_) => point$_End.filter((point_End) => Math.abs(point_End.x - point.x) < 0.5 && Math.abs(point_End.y - point.y) < 0.5).length > 1
  return piece$.flatMap((piece) => {
    const point_From = piece.point$[0]
    const point_To = piece.point$.at(-1)
    if (point_From === undefined || point_To === undefined) return []
    const from = point_From.x + (isJoined(point_From) ? length_Gap / 2 : 0)
    const to = point_To.x - (isJoined(point_To) ? length_Gap / 2 : 0)
    const length = to - from
    if (length <= 0) return []
    const count = Math.max(
      1,
      Math.round((length + length_Gap) / (length_Mark + length_Gap))
    )
    const length_Each = count === 1 ? length : length_Mark
    const step = count === 1 ? 0 : (length - length_Mark) / (count - 1)
    return Array.from(
      {
        length: count
      },
      (
        _,
        index
      ) => `M ${from + index * step} ${point_From.y} L ${from + index * step + length_Each} ${point_From.y}`
    )
  }).join(" ")
}

interface _Api___dOf__Dash$_ {
  piece$: Array<_Piece_Dash_>
  length_Dash: number
  pitch: number
}

function dOf__Dash$({
  piece$,
  length_Dash,
  pitch
}: _Api___dOf__Dash$_): string {
  const reach = Math.max(
    length_Dash / 2,
    REACH_LEAST__DASH
  )
  const pointAt = (
    edge: _Edge_Dash_,
    along: number
  ) => `${edge.from.x + edge.x_Unit * along} ${edge.from.y + edge.y_Unit * along}`
  const cornerOf = (
    edge_In: _Edge_Dash_,
    edge_Out: _Edge_Dash_
  ) => `M ${pointAt(edge_In, edge_In.length - Math.min(reach, edge_In.length))} L ${pointAt(edge_Out, 0)} L ${pointAt(edge_Out, Math.min(reach, edge_Out.length))}`
  return piece$.flatMap((piece) => {
    const edge$ = edge$Of__Piece_Dash(piece)
    const edge_First = edge$[0]
    const edge_Last = edge$.at(-1)
    if (edge_First === undefined || edge_Last === undefined) return []
    return [
      ...edge$.flatMap((
        edge,
        index
      ) => {
        const edge_Before = edge$[index - 1]
        return edge_Before === undefined
          ? []
          : [
            cornerOf(
              edge_Before,
              edge
            )
          ]
      }),
      ...piece.isClosed
        ? [
          cornerOf(
            edge_Last,
            edge_First
          )
        ]
        : [
          `M ${pointAt(edge_First, 0)} L ${pointAt(edge_First, Math.min(reach, edge_First.length))}`,
          `M ${pointAt(edge_Last, edge_Last.length - Math.min(reach, edge_Last.length))} L ${pointAt(edge_Last, edge_Last.length)}`
        ],
      ...edge$.flatMap((edge) => {
        const count = Math.max(
          1,
          Math.round(edge.length / pitch)
        )
        return Array.from(
          {
            length: count - 1
          },
          (
            _,
            index
          ) => {
            const along = (index + 1) * edge.length / count
            return `M ${pointAt(edge, along - reach)} L ${pointAt(edge, along + reach)}`
          }
        )
      })
    ]
  }).join(" ")
}

function edge$Of__Piece_Dash(
  piece: _Piece_Dash_
): Array<_Edge_Dash_> {
  const point$_To = piece.isClosed
    ? [
      ...piece.point$.slice(1),
      ...piece.point$.slice(
        0,
        1
      )
    ]
    : piece.point$.slice(1)
  return point$_To.flatMap((
    to,
    index
  ) => {
    const from = piece.point$[index]
    const length = from === undefined
      ? 0
      : Math.hypot(
        to.x - from.x,
        to.y - from.y
      )
    return from === undefined || length < REACH_LEAST__DASH
      ? []
      : [
        {
          from,
          length,
          x_Unit: (to.x - from.x) / length,
          y_Unit: (to.y - from.y) / length
        }
      ]
  })
}

interface _Edge_Dash_ {
  from: _Corner_Path_
  length: number
  x_Unit: number
  y_Unit: number
}

const REACH_LEAST__DASH = 0.01

interface _Api___fit__Lap$_ {
  containerElement_View: HTMLElement
}

function fit__Lap$({
  containerElement_View
}: _Api___fit__Lap$_): void {
  const pathElement$_lap = [...containerElement_View.querySelectorAll(".lap_htmlView")].filter((element) => element instanceof SVGPathElement)
  const keyOf = (pathElement_lap: SVGPathElement) => pathElement_lap.hasAttribute("data-place") ? `${pathElement_lap.getAttribute("data-source")} ${pathElement_lap.getAttribute("data-place")}` : null
  const lengthOf = (pathElement_lap: SVGPathElement) => parseFloat(pathElement_lap.style.getPropertyValue("--length_htmlView")) || 0
  const length$_Place = new Map<string, number>()
  for (const pathElement_lap of pathElement$_lap) {
    const key = keyOf(pathElement_lap)
    if (key !== null) length$_Place.set(
      key,
      Math.max(
        length$_Place.get(key) ?? 0,
        lengthOf(pathElement_lap)
      )
    )
  }
  for (const pathElement_lap of pathElement$_lap) {
    const key = keyOf(pathElement_lap)
    const length = key === null ? lengthOf(pathElement_lap) : length$_Place.get(key) ?? 0
    pathElement_lap.style.setProperty(
      "--lap_htmlView",
      String(Math.round(length * 100) / 100)
    )
  }
}

function length$Of__Dasharray(
  value: string
): Array<number> {
  const length$ = (value.match(REGEXP_LENGTH) ?? []).map(Number)
  return length$.length % 2 === 1 ? [
    ...length$,
    ...length$
  ] : length$
}

const REGEXP_LENGTH = /\d*\.?\d+/g

interface _Layout_View_ {
  sourceAt: (point_Screen: _Point_Screen_) => string | null
  placeAt: (point_Screen: _Point_Screen_) => string | null
  targetAt: (point_Screen: _Point_Screen_) => _Target_Note_ | null
  foldAt: (point_Screen: _Point_Screen_) => _Range_Lines_ | null
  positionAt: (point_Screen: _Point_Screen_) => _Position_Drawn_ | null
  caretOf: (position_Drawn: _Position_Drawn_) => _Caret_Screen_ | null
  isMoved: (kind_Popover: _Kind_Popover_) => boolean
}

type _Kind_Popover_ = "MENU" | "FORM"

interface _Caret_Screen_ {
  x: number
  top: number
  bottom: number
  height_Row: number
}

interface _Api___revealWords__View_TextEditor_ {
  containerElement_View: HTMLElement
}

function revealWords__View_TextEditor({
  containerElement_View
}: _Api___revealWords__View_TextEditor_): void {
  const element_Scroller = containerElement_View.querySelector(".document_htmlView")
  const rect$_Shown = [...containerElement_View.querySelectorAll(".document_htmlView .text_htmlView > [data-shown]")].flatMap((element_Shown) => [...element_Shown.getClientRects()])
  if (!(element_Scroller instanceof HTMLElement) || rect$_Shown.length === 0) return
  const rect_Scroller = element_Scroller.getBoundingClientRect()
  const top = Math.min(...rect$_Shown.map((rect_Shown) => rect_Shown.top))
  const bottom = Math.max(...rect$_Shown.map((rect_Shown) => rect_Shown.bottom))
  const top_Wanted = bottom - top <= rect_Scroller.height * 0.6
    ? rect_Scroller.top + (rect_Scroller.height - (bottom - top)) / 2
    : rect_Scroller.top + rect_Scroller.height * 0.2
  element_Scroller.scrollBy({
    top: top - top_Wanted,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
  })
}

interface _Api___reveal__View_TextEditor_ {
  containerElement_View: HTMLElement
  target_Note: _Target_Note_
}

function reveal__View_TextEditor({
  containerElement_View,
  target_Note
}: _Api___reveal__View_TextEditor_): _Jump_View_ | null {
  const element_Target = containerElement_View
    .querySelector(`.text_htmlView [data-source="${CSS.escape(target_Note.source)}"][data-side="${CSS.escape(target_Note.side)}"]`)
    ?.closest(".line_htmlView")
  if (element_Target === null || element_Target === undefined) return null
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
  const element_Scroller = scrollerOf__Element({
    element: element_Target
  })
  const element_Pressed = [...containerElement_View.querySelectorAll(`.note_htmlView[data-target-source="${CSS.escape(target_Note.source)}"][data-target-side="${CSS.escape(target_Note.side)}"]`)].find((element_Note) => isShown__Element({
    element: element_Note,
    element_Scroller
  }))
  const element_Arrived = containerElement_View.querySelector(`.note_htmlView[data-target-source="${CSS.escape(target_Note.source)}"]:not([data-target-side="${CSS.escape(target_Note.side)}"])`)
  const element_From = element_Arrived === null ? element_Pressed?.closest(".line_htmlView") : element_Pressed
  if (element_Arrived instanceof HTMLElement) {
    element_Arrived.focus({
      preventScroll: true
    })
  }
  if (element_From === null || element_From === undefined) {
    element_Target.scrollIntoView({
      block: "center",
      behavior
    })
    return null
  }
  return {
    element_Scroller,
    top: (element_Arrived ?? element_Target).getBoundingClientRect().top - element_From.getBoundingClientRect().top,
    behavior
  }
}

interface _Jump_View_ {
  element_Scroller: Element
  top: number
  behavior: ScrollBehavior
}

interface _Api___scrollerOf__Element_ {
  element: Element
}

function scrollerOf__Element({
  element
}: _Api___scrollerOf__Element_): Element {
  const element_Parent = element.parentElement
  if (element_Parent === null) return document.scrollingElement ?? document.documentElement
  return /auto|scroll/.test(getComputedStyle(element_Parent).overflowY) && element_Parent.scrollHeight > element_Parent.clientHeight
    ? element_Parent
    : scrollerOf__Element({
      element: element_Parent
    })
}

interface _Api___isShown__Element_ {
  element: Element
  element_Scroller: Element
}

function isShown__Element({
  element,
  element_Scroller
}: _Api___isShown__Element_): boolean {
  const rect = element.getBoundingClientRect()
  const rect_Scroller = element_Scroller === document.scrollingElement
    ? new DOMRect(
      0,
      0,
      innerWidth,
      innerHeight
    )
    : element_Scroller.getBoundingClientRect()
  return rect.top >= Math.max(
    rect_Scroller.top,
    0
  ) && rect.bottom <= Math.min(
    rect_Scroller.bottom,
    innerHeight
  )
}

interface _Api___focusEdited__View_TextEditor_ {
  containerElement_View: HTMLElement
  editing_Request: _Id_Request_
}

function focusEdited__View_TextEditor({
  containerElement_View,
  editing_Request
}: _Api___focusEdited__View_TextEditor_): void {
  const selector_Holder = editing_Request.id_Item === null
    ? ".card_htmlView"
    : selectorOf__Id_Item({
      id_Item: editing_Request.id_Item
    })
  containerElement_View
    .querySelector<HTMLElement>(`${selector_Holder} .said_htmlView[data-request="${CSS.escape(editing_Request.id)}"] > .row_Said_htmlView > .fold_Action_htmlView > .actions_Said_htmlView > .edit_Said_htmlView`)
    ?.focus()
}

interface _Api___focusDraft__View_TextEditor_ {
  containerElement_View: HTMLElement
  focus_Draft: _Focus_Draft_
}

interface _Focus_Draft_ {
  id_Item: _Id_Item_
  part: _Part_Focus_
}

type _Part_Focus_ = "NOTES" | "ASK"

function focusDraft__View_TextEditor({
  containerElement_View,
  focus_Draft
}: _Api___focusDraft__View_TextEditor_): void {
  containerElement_View
    .querySelector<HTMLElement>(`${selectorOf__Id_Item({
      id_Item: focus_Draft.id_Item
    })} ${SELECTORMAP__PART_FOCUS[focus_Draft.part]}`)
    ?.focus()
}

interface _Api___visit__View_TextEditor_ {
  containerElement_View: HTMLElement
  visit_Item: _Visit_Item_
}

interface _Visit_Item_ {
  id_Item: _Id_Item_
  id_Item_From: _Id_Item_
  way: _Way_Visit_
}

function visit__View_TextEditor({
  containerElement_View,
  visit_Item
}: _Api___visit__View_TextEditor_): _Jump_View_ | null {
  const element_Item = containerElement_View.querySelector<HTMLElement>(selectorOf__Id_Item({
    id_Item: visit_Item.id_Item
  }))
  if (element_Item === null) return null
  const isStill = matchMedia("(prefers-reduced-motion: reduce)").matches
  const behavior = isStill ? "instant" : "smooth"
  const element_Pressed = containerElement_View.querySelector(`${selectorOf__Id_Item({
    id_Item: visit_Item.id_Item_From
  })} .neighbor_htmlView[data-way="${visit_Item.way}"]`)
  const element_Arrived = element_Item.querySelector(`.neighbor_htmlView[data-way="${visit_Item.way}"]`)
  const element_Scroller = scrollerOf__Element({
    element: element_Item
  })
  const jump_View: _Jump_View_ | null = element_Pressed !== null && element_Arrived !== null && isShown__Element({
    element: element_Pressed,
    element_Scroller
  })
    ? {
      element_Scroller,
      top: element_Arrived.getBoundingClientRect().top - element_Pressed.getBoundingClientRect().top,
      behavior
    }
    : null
  if (jump_View === null) {
    element_Item.scrollIntoView({
      block: "center",
      behavior
    })
  }
  const element_Neighbor = element_Item.querySelector<HTMLElement>(`.neighbor_htmlView[data-way="${visit_Item.way}"]:not(:disabled)`) ?? element_Item.querySelector<HTMLElement>(".neighbor_htmlView:not(:disabled)")
  element_Neighbor?.focus({
    preventScroll: true
  })
  if (!isStill) {
    element_Item.animate(
      [
        {
          boxShadow: "inset 0 0 0 100vmax color-mix(in srgb, CanvasText 12%, transparent)"
        },
        {
          boxShadow: "inset 0 0 0 100vmax transparent"
        }
      ],
      {
        duration: 1400,
        easing: "ease-out"
      }
    )
  }
  return jump_View
}

interface _Api___jump__View_TextEditor_ {
  containerElement_View: HTMLElement
  room_View: _Room_View_
  jump_View: _Jump_View_
}

function jump__View_TextEditor({
  containerElement_View,
  room_View,
  jump_View
}: _Api___jump__View_TextEditor_): _Jumped_View_ {
  const element_Document = containerElement_View.querySelector(".document_htmlView")
  const top_Wanted = jump_View.element_Scroller.scrollTop + jump_View.top
  const top_Most = jump_View.element_Scroller.scrollHeight - jump_View.element_Scroller.clientHeight
  const room_Jump = jump_View.element_Scroller === element_Document && element_Document instanceof HTMLElement
    ? keptRoom__Document({
      element_Document,
      room_View: {
        above: room_View.above + Math.max(
          0,
          -top_Wanted
        ),
        below: room_View.below + Math.max(
          0,
          top_Wanted - top_Most
        )
      }
    })
    : room_View
  const top_Target = jump_View.element_Scroller.scrollTop + jump_View.top
  jump_View.element_Scroller.scrollBy({
    top: jump_View.top,
    behavior: jump_View.behavior
  })
  return {
    room_View: room_Jump,
    top_Target
  }
}

interface _Jumped_View_ {
  room_View: _Room_View_
  top_Target: number
}

interface _Api___keptRoom__Document_ {
  element_Document: HTMLElement
  room_View: _Room_View_
}

function keptRoom__Document({
  element_Document,
  room_View
}: _Api___keptRoom__Document_): _Room_View_ {
  const element_First = element_Document.firstElementChild
  const top_Before = element_First?.getBoundingClientRect().top ?? 0
  roomed__Document({
    element_Document,
    room_View
  })
  const top_Moved = (element_First?.getBoundingClientRect().top ?? 0) - top_Before
  if (Math.abs(top_Moved) > 0.01) element_Document.scrollTop += top_Moved
  return room_View
}

interface _Api___released__Focus_Jump_ {
  containerElement_View: HTMLElement
}

function released__Focus_Jump({
  containerElement_View
}: _Api___released__Focus_Jump_): void {
  const element_Focused = document.activeElement
  const element_Document = containerElement_View.querySelector(".document_htmlView")
  if (!(element_Focused instanceof HTMLElement) || !(element_Document instanceof HTMLElement) || !element_Focused.matches(".note_htmlView, .neighbor_htmlView") || !element_Document.contains(element_Focused) || isShown__Element({
    element: element_Focused,
    element_Scroller: element_Document
  })) return
  element_Document.focus({
    preventScroll: true
  })
}

interface _Api___roomScrolled__View_TextEditor_ {
  containerElement_View: HTMLElement
  room_View: _Room_View_
}

function roomScrolled__View_TextEditor({
  containerElement_View,
  room_View
}: _Api___roomScrolled__View_TextEditor_): _Room_View_ {
  const element_Document = containerElement_View.querySelector(".document_htmlView")
  if (!(element_Document instanceof HTMLElement) || room_View.above + room_View.below === 0) return room_View
  const top = element_Document.scrollTop
  const fromEnd = element_Document.scrollHeight - element_Document.clientHeight - top
  const room_Scrolled = {
    above: top < 0.5
      ? room_View.above
      : Math.max(
        0,
        room_View.above - top
      ),
    below: fromEnd < 0.5
      ? room_View.below
      : Math.max(
        0,
        room_View.below - fromEnd
      )
  }
  return room_Scrolled.above === room_View.above && room_Scrolled.below === room_View.below
    ? room_View
    : keptRoom__Document({
      element_Document,
      room_View: room_Scrolled
    })
}

type _SelectorMap_Part_ = {
  [Part in _Part_Focus_]: string
}

const SELECTORMAP__PART_FOCUS: _SelectorMap_Part_ = {
  NOTES: ".notes_htmlView",
  ASK: "[data-command][aria-expanded]"
}

interface _Api___selectorOf__Id_Item_ {
  id_Item: _Id_Item_
}

function selectorOf__Id_Item({
  id_Item
}: _Api___selectorOf__Id_Item_): string {
  return `.frame_htmlView:has(> .fold_htmlView[data-fold-first="${id_Item.range_Frame.first}"][data-fold-last="${id_Item.range_Frame.last}"]) .item_htmlView[data-source="${CSS.escape(id_Item.source)}"]`
}

interface _Api___sourceAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function sourceAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___sourceAt__View_TextEditor_): string | null {
  return changeAt__View_TextEditor({
    containerElement_View,
    point_Screen
  })?.getAttribute("data-source")?.split(" ")[0] ?? null
}

interface _Api___changeAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function changeAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___changeAt__View_TextEditor_): Element | null {
  const element = document.elementFromPoint(
    point_Screen.x,
    point_Screen.y
  )
  if (element === null || !containerElement_View.contains(element) || element.closest("[data-folded]") !== null) return null
  return areaAt__Run({
    element_Run: element.closest(".run_htmlView"),
    point_Screen
  }) ?? areaAt__Frame({
    element_Frame: element.closest(".frame_htmlView"),
    point_Screen
  }) ?? element.closest("[data-source]")
}

interface _Api___areaAt__Frame_ {
  element_Frame: Element | null
  point_Screen: _Point_Screen_
}

function areaAt__Frame({
  element_Frame,
  point_Screen
}: _Api___areaAt__Frame_): SVGPathElement | null {
  for (const element_Run of element_Frame?.querySelectorAll(".run_htmlView") ?? []) {
    const pathElement_area = areaAt__Run({
      element_Run,
      point_Screen
    })
    if (pathElement_area !== null) return pathElement_area
  }
  return null
}

interface _Api___areaAt__Run_ {
  element_Run: Element | null
  point_Screen: _Point_Screen_
}

function areaAt__Run({
  element_Run,
  point_Screen
}: _Api___areaAt__Run_): SVGPathElement | null {
  const svgElement_underlay$ = element_Run?.querySelector(":scope > .underlays_htmlView")
  if (!(svgElement_underlay$ instanceof SVGSVGElement)) return null
  const matrix = svgElement_underlay$.getScreenCTM()
  if (matrix === null) return null
  const point_Svg = new DOMPoint(
    point_Screen.x,
    point_Screen.y
  ).matrixTransform(matrix.inverse())
  const sizeOf = (pathElement_area: SVGPathElement) => {
    const box = pathElement_area.getBBox()
    return box.width * box.height
  }
  return [...svgElement_underlay$.querySelectorAll(".area_htmlView")]
    .filter((pathElement_area): pathElement_area is SVGPathElement => pathElement_area instanceof SVGPathElement && pathElement_area.isPointInFill(point_Svg))
    .toSorted((
      pathElement_area,
      pathElement_area_other
    ) => sizeOf(pathElement_area) - sizeOf(pathElement_area_other))[0] ?? null
}

interface _Api___placeAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function placeAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___placeAt__View_TextEditor_): string | null {
  return changeAt__View_TextEditor({
    containerElement_View,
    point_Screen
  })?.getAttribute("data-place") ?? null
}

interface _Api___targetAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function targetAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___targetAt__View_TextEditor_): _Target_Note_ | null {
  const element = document.elementFromPoint(
    point_Screen.x,
    point_Screen.y
  )
  const element_Note = element !== null && containerElement_View.contains(element) ? element.closest(".note_htmlView") : null
  const source = element_Note?.getAttribute("data-target-source")
  const side = element_Note?.getAttribute("data-target-side")
  return typeof source === "string" && typeof side === "string"
    ? {
      source,
      side
    }
    : null
}

interface _Api___foldAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function foldAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___foldAt__View_TextEditor_): _Range_Lines_ | null {
  const element = document.elementFromPoint(
    point_Screen.x,
    point_Screen.y
  )
  const element_Fold = element !== null && containerElement_View.contains(element) ? element.closest(".fold_htmlView") : null
  const first = Number(element_Fold?.getAttribute("data-fold-first") ?? Number.NaN)
  const last = Number(element_Fold?.getAttribute("data-fold-last") ?? Number.NaN)
  return Number.isInteger(first) && Number.isInteger(last)
    ? {
      first,
      last
    }
    : null
}

interface _Api___drawSelection__View_TextEditor_ {
  containerElement_View: HTMLElement
  selection_View: _Selection_Drawn_ | null
}

function drawSelection__View_TextEditor({
  containerElement_View,
  selection_View
}: _Api___drawSelection__View_TextEditor_): void {
  for (const element_Layer of containerElement_View.querySelectorAll(".selection_htmlView")) element_Layer.replaceChildren()
  if (selection_View === null) return
  const element$_Run = [...containerElement_View.querySelectorAll(".run_htmlView")]
  const index_Anchor = element$_Run.findIndex((element_Run) => element_Run.getAttribute("data-run") === selection_View.anchor.id_Run)
  const index_Head = element$_Run.findIndex((element_Run) => element_Run.getAttribute("data-run") === selection_View.head.id_Run)
  if (index_Anchor === -1 || index_Head === -1) return
  const isHeadFirst = index_Head < index_Anchor || (index_Head === index_Anchor && (selection_View.head.position.line < selection_View.anchor.position.line || (selection_View.head.position.line === selection_View.anchor.position.line && selection_View.head.position.offset < selection_View.anchor.position.offset)))
  const start = isHeadFirst ? selection_View.head.position : selection_View.anchor.position
  const end = isHeadFirst ? selection_View.anchor.position : selection_View.head.position
  const index_Start = Math.min(
    index_Anchor,
    index_Head
  )
  const index_End = Math.max(
    index_Anchor,
    index_Head
  )
  for (let index = index_Start; index <= index_End; index = index + 1) {
    const element_Run = element$_Run[index]
    const element_Layer = element_Run?.querySelector(":scope > .selection_htmlView")
    if (element_Run === undefined || element_Layer === null || element_Layer === undefined) continue
    const rect_Run = element_Run.getBoundingClientRect()
    const divElement$_text = [...element_Run.querySelectorAll(":scope > .line_htmlView > .text_htmlView")]
    const line_First = index === index_Start ? start.line : 0
    const line_Last = index === index_End ? end.line : divElement$_text.length - 1
    const element$_Drawn: Array<Element> = []
    for (let line = line_First; line <= line_Last; line = line + 1) {
      const divElement_text = divElement$_text[line]
      if (!(divElement_text instanceof HTMLElement)) continue
      const placed$_Text = placedOf__Text$(text$Of__Element(divElement_text).filter((text) => text.parentElement?.closest(".note_htmlView") === null))
      const length = placed$_Text.reduce(
        (
          sum,
          placed_Text
        ) => sum + placed_Text.text.length,
        0
      )
      const isLast = index === index_End && line === line_Last
      const style_text = getComputedStyle(divElement_text)
      const rowOf = (rect: DOMRect) => rowOf__Rect({
        rect,
        top_Text: divElement_text.getBoundingClientRect().top + parseFloat(style_text.paddingTop) + parseFloat(style_text.borderTopWidth),
        height_Row: parseFloat(style_text.lineHeight)
      })
      for (const rect of rowsOf__Rects(rectsOf__Offsets({
        placed$_Text,
        from: index === index_Start && line === line_First ? start.offset : 0,
        to: isLast ? end.offset : length
      }))) {
        element$_Drawn.push(elementOf__Rect({
          className: "selected_htmlView",
          rect: rowOf(rect),
          rect_Run
        }))
      }
      if (!isLast) {
        const caret_Text = caretOf__Offset({
          divElement_text,
          offset: length
        })
        element$_Drawn.push(elementOf__Rect({
          className: "selected_htmlView",
          rect: rowOf(new DOMRect(
            caret_Text.x,
            caret_Text.top,
            parseFloat(style_text.fontSize) / 2,
            caret_Text.bottom - caret_Text.top
          )),
          rect_Run
        }))
      }
    }
    const divElement_head = index === index_Head ? divElement$_text[selection_View.head.position.line] : undefined
    if (divElement_head instanceof HTMLElement) {
      const caret_Text = caretOf__Offset({
        divElement_text: divElement_head,
        offset: selection_View.head.position.offset
      })
      element$_Drawn.push(elementOf__Rect({
        className: "caret_htmlView",
        rect: new DOMRect(
          caret_Text.x,
          caret_Text.top,
          0,
          caret_Text.bottom - caret_Text.top
        ),
        rect_Run
      }))
    }
    element_Layer.replaceChildren(...element$_Drawn)
  }
}

interface _Api___rectsOf__Offsets_ {
  placed$_Text: Array<_Placed_Text_>
  from: number
  to: number
}

function rectsOf__Offsets({
  placed$_Text,
  from,
  to
}: _Api___rectsOf__Offsets_): Array<DOMRect> {
  return placed$_Text.flatMap((placed_Text) => {
    const start = Math.max(
      from,
      placed_Text.start
    ) - placed_Text.start
    const end = Math.min(
      to,
      placed_Text.start + placed_Text.text.length
    ) - placed_Text.start
    if (start >= end) return []
    const range = document.createRange()
    range.setStart(
      placed_Text.text,
      start
    )
    range.setEnd(
      placed_Text.text,
      end
    )
    return [...range.getClientRects()]
  })
}

function rowsOf__Rects(
  rects: Array<DOMRect>
): Array<DOMRect> {
  const rows: Array<DOMRect> = []
  for (const rect of rects) {
    const row = rows.find((row_Each) => Math.min(row_Each.bottom, rect.bottom) - Math.max(row_Each.top, rect.top) > Math.min(row_Each.height, rect.height) / 2)
    if (row === undefined) rows.push(DOMRect.fromRect(rect))
    else {
      const left = Math.min(row.left, rect.left)
      const top = Math.min(row.top, rect.top)
      row.width = Math.max(row.right, rect.right) - left
      row.height = Math.max(row.bottom, rect.bottom) - top
      row.x = left
      row.y = top
    }
  }
  return rows
}

interface _Api___rowOf__Rect_ {
  rect: DOMRect
  top_Text: number
  height_Row: number
}

function rowOf__Rect({
  rect,
  top_Text,
  height_Row
}: _Api___rowOf__Rect_): DOMRect {
  if (Number.isNaN(height_Row) || height_Row <= 0) return rect
  const top = top_Text + Math.floor((rect.top + rect.height / 2 - top_Text) / height_Row) * height_Row
  return new DOMRect(
    rect.left,
    top,
    rect.width,
    height_Row
  )
}

interface _Api___elementOf__Rect_ {
  className: string
  rect: DOMRect
  rect_Run: DOMRect
}

function elementOf__Rect({
  className,
  rect,
  rect_Run
}: _Api___elementOf__Rect_): Element {
  const element = document.createElement("div")
  element.className = className
  element.style.left = `${rect.left - rect_Run.left}px`
  element.style.top = `${rect.top - rect_Run.top}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
  return element
}

interface _Api___positionAt__View_TextEditor_ {
  containerElement_View: HTMLElement
  point_Screen: _Point_Screen_
}

function positionAt__View_TextEditor({
  containerElement_View,
  point_Screen
}: _Api___positionAt__View_TextEditor_): _Position_Drawn_ | null {
  const divElement_text = [...containerElement_View.querySelectorAll(".run_htmlView > .line_htmlView > .text_htmlView")].find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.height > 0 && rect.top <= point_Screen.y && point_Screen.y < rect.bottom
  })
  const element_Line = divElement_text?.parentElement
  const element_Run = element_Line?.parentElement
  const id_Run = element_Run?.getAttribute("data-run")
  if (!(divElement_text instanceof HTMLElement) || element_Line === null || element_Line === undefined || element_Run === null || element_Run === undefined || id_Run === null || id_Run === undefined) return null
  const rect = divElement_text.getBoundingClientRect()
  const caretPosition = document.caretPositionFromPoint(
    Math.min(
      Math.max(
        point_Screen.x,
        rect.left
      ),
      rect.right - 1
    ),
    point_Screen.y
  )
  const placed$_Text = placedOf__Text$(text$Of__Element(divElement_text).filter((text) => text.parentElement?.closest(".note_htmlView") === null))
  const placed_Text = placed$_Text.find((placed_Each) => placed_Each.text === caretPosition?.offsetNode)
  const length = placed$_Text.reduce(
    (
      sum,
      placed_Each
    ) => sum + placed_Each.text.length,
    0
  )
  return {
    id_Run,
    position: {
      line: [...element_Run.querySelectorAll(":scope > .line_htmlView")].indexOf(element_Line),
      offset: placed_Text === undefined
        ? point_Screen.x <= rect.left + parseFloat(getComputedStyle(divElement_text).paddingLeft) ? 0 : length
        : placed_Text.start + (caretPosition?.offset ?? 0)
    }
  }
}

interface _Api___caretOf__View_TextEditor_ {
  containerElement_View: HTMLElement
  position_Drawn: _Position_Drawn_
}

function caretOf__View_TextEditor({
  containerElement_View,
  position_Drawn
}: _Api___caretOf__View_TextEditor_): _Caret_Screen_ | null {
  const divElement_text = containerElement_View
    .querySelector(`.run_htmlView[data-run="${CSS.escape(position_Drawn.id_Run)}"]`)
    ?.querySelectorAll(":scope > .line_htmlView > .text_htmlView")[position_Drawn.position.line]
  if (!(divElement_text instanceof HTMLElement)) return null
  const caret_Text = caretOf__Offset({
    divElement_text,
    offset: position_Drawn.position.offset
  })
  const height_Row = parseFloat(getComputedStyle(divElement_text).lineHeight)
  return {
    x: caret_Text.x,
    top: caret_Text.top,
    bottom: caret_Text.bottom,
    height_Row: Number.isNaN(height_Row) ? caret_Text.bottom - caret_Text.top : height_Row
  }
}

interface _ComponentMap__View_TextEditor_ {
  block: _ComponentMap_Block_
  part: _ComponentMap_Part_
  places: _ComponentMap_Places_
  condition: _ComponentMap_Condition_
  line: (api_Line: _Api___Line_Run__Html_) => _Node_Jsx_
  header: (api_Header: _Api___Header_TextEditor__Html_) => _Node_Jsx_
  footer: () => _Node_Jsx_
  menu: (api_Menu: _Api___Menu_TextEditor__Html_) => _Node_Jsx_
  request: (api_Request: _Api___Request_TextEditor__Html_) => _Node_Jsx_
}

type _ComponentMap_Block_ = {
  [Kind in _Block_ViewModel_["kind"]]: (api_Block: _Api___Block_TextEditor__Html_<Kind>) => _Node_Jsx_
}

type _ComponentMap_Part_ = {
  [Kind in _Part_Frame_["kind"]]: (api_Part: _Api___Section_Frame__Html_<Kind>) => _Node_Jsx_
}

type _ComponentMap_Places_ = {
  [Kind in _Places_Item_["kind"]]: (api_Places: _Api___Places_Item__Html_<Kind>) => _Node_Jsx_
}

type _ComponentMap_Condition_ = {
  [Kind in _Condition_Places_["kind"]]: (api_Condition: _Api___Condition_Places__Html_<Kind>) => _Node_Jsx_
}

const COMPONENTMAP__VIEW_TEXTEDITOR: _ComponentMap__View_TextEditor_ = {
  block: {
    LINES: LINES_Block_TextEditor__Html,
    FRAME: FRAME_Block_TextEditor__Html,
    FOLDED: FOLDED_Block_TextEditor__Html
  },
  part: {
    CURRENT_LINES: CURRENT_LINES__Section_Frame__Html,
    PROPOSAL_LINES: PROPOSAL_LINES__Section_Frame__Html,
    PROPOSAL_HEAD: PROPOSAL_HEAD__Section_Frame__Html,
    PROPOSAL_LIST: PROPOSAL_LIST__Section_Frame__Html
  },
  places: {
    NONE: NONE_Places_Item__Html,
    COUNT: COUNT_Places_Item__Html,
    MOVE: MOVE_Places_Item__Html
  },
  condition: {
    WITHIN: WITHIN_Condition_Places__Html,
    CARRIED: CARRIED_Condition_Places__Html
  },
  line: Line_Run__Html,
  header: Header_TextEditor__Html,
  footer: Footer_TextEditor__Html,
  menu: Menu_TextEditor__Html,
  request: Request_TextEditor__Html
}

type _Focus_Asking_ = "MENU" | "REQUEST" | "CONFIRM" | "ASK_TASK" | "ASK_DOCUMENT" | "EDIT"

type _SelectorMap__Focus_Asking_ = {
  [Focus in _Focus_Asking_]: string
}

const SELECTORMAP__FOCUS_ASKING: _SelectorMap__Focus_Asking_ = {
  MENU: ".menu_htmlView > .choice_htmlView[tabindex='0']",
  REQUEST: ".asking_htmlView > .notes_htmlView",
  CONFIRM: ".actions_htmlView[data-confirming] > [data-confirm='NO']",
  ASK_TASK: ".card_Task_htmlView [data-ask='TASK']",
  ASK_DOCUMENT: ".card_Document_htmlView [data-ask='DOCUMENT']",
  EDIT: ".text_Said_htmlView > .notes_Edit_htmlView"
}

interface _Api___drawRoom__View_TextEditor_ {
  containerElement_View: HTMLElement
  room_View: _Room_View_
}

function drawRoom__View_TextEditor({
  containerElement_View,
  room_View
}: _Api___drawRoom__View_TextEditor_): void {
  const element_Document = containerElement_View.querySelector(".document_htmlView")
  if (!(element_Document instanceof HTMLElement) || room_View.above + room_View.below === 0) return
  roomed__Document({
    element_Document,
    room_View
  })
}

interface _Api___roomed__Document_ {
  element_Document: HTMLElement
  room_View: _Room_View_
}

function roomed__Document({
  element_Document,
  room_View
}: _Api___roomed__Document_): void {
  element_Document.style.setProperty(
    "--roomAbove_htmlView",
    `${room_View.above}px`
  )
  element_Document.style.setProperty(
    "--roomBelow_htmlView",
    `${room_View.below}px`
  )
}

interface _Api___keptOpen__Card_ {
  containerElement_View: HTMLElement
  class_Card: string | null
}

function keptOpen__Card({
  containerElement_View,
  class_Card
}: _Api___keptOpen__Card_): void {
  if (class_Card === null || containerElement_View.contains(document.activeElement)) return
  containerElement_View.querySelector<HTMLElement>(`.${CSS.escape(class_Card)}`)?.focus({
    preventScroll: true
  })
}

interface _Api___keptInEditor__View_TextEditor_ {
  containerElement_View: HTMLElement
  placed$_View: _Placed$_View_
}

type _Placed$_View_ = {
  [Kind in _Kind_Popover_]: _Placed_Popover_ | null
}

interface _Placed_Popover_ {
  element: HTMLElement
  point_Placed: _Point_Screen_
  element_Anchor: Element | null
  point_Anchor: _Point_Screen_
  point_Scrolled: _Point_Screen_
}

function keptInEditor__View_TextEditor({
  containerElement_View,
  placed$_View
}: _Api___keptInEditor__View_TextEditor_): _Placed$_View_ {
  const element_Editor = containerElement_View.querySelector(".htmlView_editor")
  const element_Scroller = element_Editor?.querySelector(".document_htmlView")
  if (!(element_Editor instanceof HTMLElement) || !(element_Scroller instanceof HTMLElement)) {
    return {
      MENU: null,
      FORM: null
    }
  }
  const rect_Editor = element_Editor.getBoundingClientRect()
  const rect_Scroller = element_Scroller.getBoundingClientRect()
  const margin = 4
  const left_Kept = Math.max(rect_Editor.left, 0) + margin
  const right_Kept = Math.min(rect_Editor.right, window.innerWidth) - margin
  const top_Kept = Math.max(rect_Editor.top, 0) + margin
  const bottom_Kept = Math.min(rect_Editor.bottom, window.innerHeight) - margin
  element_Editor.style.setProperty("--widthKept_htmlView", `${Math.max(right_Kept - left_Kept, 0)}px`)
  element_Editor.style.setProperty("--heightKept_htmlView", `${Math.max(bottom_Kept - top_Kept, 0)}px`)
  const element_Menu = element_Editor.querySelector(".menu_htmlView[data-x][data-y]")
  const element_Form = element_Editor.querySelector(".asking_htmlView[data-x][data-y]")
  const rect$_Quoted = [...element_Scroller.querySelectorAll(".text_htmlView > [data-quoted]")]
    .flatMap((element_Quoted) => [...element_Quoted.getClientRects()])
    .filter((rect_Quoted) => rect_Quoted.bottom > rect_Scroller.top && rect_Quoted.top < rect_Scroller.bottom)
  return {
    MENU: element_Menu instanceof HTMLElement
      ? keptOf__Popover({
        element: element_Menu,
        placed_Popover_View: placed$_View.MENU,
        element_Scroller,
        isFollowing: false,
        span_Avoided: null,
        left_Kept,
        right_Kept,
        top_Kept,
        bottom_Kept
      })
      : null,
    FORM: element_Form instanceof HTMLElement
      ? keptOf__Popover({
        element: element_Form,
        placed_Popover_View: placed$_View.FORM,
        element_Scroller,
        isFollowing: true,
        span_Avoided: rect$_Quoted.length === 0
          ? null
          : {
            top: Math.max(Math.min(...rect$_Quoted.map((rect_Quoted) => rect_Quoted.top)), rect_Scroller.top),
            bottom: Math.min(Math.max(...rect$_Quoted.map((rect_Quoted) => rect_Quoted.bottom)), rect_Scroller.bottom)
          },
        left_Kept,
        right_Kept,
        top_Kept: Math.max(rect_Scroller.top, top_Kept),
        bottom_Kept: Math.min(rect_Scroller.bottom, bottom_Kept)
      })
      : null
  }
}

interface _Api___keptOf__Popover_ {
  element: HTMLElement
  placed_Popover_View: _Placed_Popover_ | null
  element_Scroller: HTMLElement
  isFollowing: boolean
  span_Avoided: _Span_Screen_ | null
  left_Kept: number
  right_Kept: number
  top_Kept: number
  bottom_Kept: number
}

function keptOf__Popover({
  element,
  placed_Popover_View,
  element_Scroller,
  isFollowing,
  span_Avoided,
  left_Kept,
  right_Kept,
  top_Kept,
  bottom_Kept
}: _Api___keptOf__Popover_): _Placed_Popover_ {
  if (placed_Popover_View?.element !== element) {
    const point_Placed = placedAt__Point({
      element,
      span_Avoided,
      left_Kept,
      right_Kept,
      top_Kept,
      bottom_Kept
    })
    const element_Anchor = document.elementsFromPoint(Number(element.dataset["x"]), Number(element.dataset["y"])).find((element_Each) => element_Each !== element_Scroller && element_Scroller.contains(element_Each)) ?? null
    const rect_Anchor = element_Anchor?.getBoundingClientRect()
    return {
      element,
      point_Placed,
      element_Anchor,
      point_Anchor: {
        x: rect_Anchor?.left ?? 0,
        y: rect_Anchor?.top ?? 0
      },
      point_Scrolled: {
        x: element_Scroller.scrollLeft,
        y: element_Scroller.scrollTop
      }
    }
  }
  const shift = isFollowing
    ? shiftOf__Popover({
      placed_Popover: placed_Popover_View,
      element_Scroller
    })
    : {
      x: 0,
      y: 0
    }
  const rect = element.getBoundingClientRect()
  const rect_Scroller = element_Scroller.getBoundingClientRect()
  const top = placed_Popover_View.point_Placed.y + shift.y
  const clip_Top = isFollowing ? Math.max(rect_Scroller.top - top, 0) : 0
  const clip_Bottom = isFollowing ? Math.max(top + rect.height - rect_Scroller.bottom, 0) : 0
  element.style.left = `${Math.max(Math.min(placed_Popover_View.point_Placed.x + shift.x, right_Kept - rect.width), left_Kept)}px`
  element.style.top = `${top}px`
  element.style.clipPath = clip_Top === 0 && clip_Bottom === 0 ? "" : `inset(${clip_Top}px 0 ${clip_Bottom}px 0)`
  return placed_Popover_View
}

interface _Api___placedAt__Point_ {
  element: HTMLElement
  span_Avoided: _Span_Screen_ | null
  left_Kept: number
  right_Kept: number
  top_Kept: number
  bottom_Kept: number
}

interface _Span_Screen_ {
  top: number
  bottom: number
}

function placedAt__Point({
  element,
  span_Avoided,
  left_Kept,
  right_Kept,
  top_Kept,
  bottom_Kept
}: _Api___placedAt__Point_): _Point_Screen_ {
  const x = Number(element.dataset["x"])
  const y = Number(element.dataset["y"])
  element.style.left = `${left_Kept}px`
  element.style.top = `${top_Kept}px`
  element.style.clipPath = ""
  const rect = element.getBoundingClientRect()
  const point_Placed = {
    x: Math.max(Math.min(x, right_Kept - rect.width), left_Kept),
    y: span_Avoided === null
      ? y + rect.height <= bottom_Kept
        ? y
        : y - rect.height >= top_Kept
          ? y - rect.height
          : Math.max(bottom_Kept - rect.height, top_Kept)
      : span_Avoided.bottom + GAP_AVOIDED + rect.height <= bottom_Kept
        ? span_Avoided.bottom + GAP_AVOIDED
        : span_Avoided.top - GAP_AVOIDED - rect.height >= top_Kept
          ? span_Avoided.top - GAP_AVOIDED - rect.height
          : bottom_Kept - span_Avoided.bottom >= span_Avoided.top - top_Kept
            ? Math.max(bottom_Kept - rect.height, top_Kept)
            : top_Kept
  }
  element.style.left = `${point_Placed.x}px`
  element.style.top = `${point_Placed.y}px`
  return point_Placed
}

const GAP_AVOIDED = 6

interface _Api___peekedIf__Unseen_Quoted_ {
  containerElement_View: HTMLElement
}

function peekedIf__Unseen_Quoted({
  containerElement_View
}: _Api___peekedIf__Unseen_Quoted_): void {
  const rect_Scroller = containerElement_View.querySelector(".document_htmlView")?.getBoundingClientRect()
  if (rect_Scroller === undefined) return
  for (const element_Peek of containerElement_View.querySelectorAll(".peek_Quote_htmlView")) {
    if (!(element_Peek instanceof HTMLElement)) continue
    const isAsking = element_Peek.closest(".asking_htmlView") !== null
    const isPointed = isAsking || element_Peek.closest(".chip_Quote_htmlView")?.matches(":hover, :focus-within") === true
    const rect_Over = element_Peek.closest(".asking_htmlView, .card_htmlView")?.getBoundingClientRect() ?? null
    const rect$_Quoted = isPointed ? [...containerElement_View.querySelectorAll(`.document_htmlView .text_htmlView > ${isAsking ? "[data-quoted]" : "[data-lit]"}`)].flatMap((element_Quoted) => [...element_Quoted.getClientRects()]) : []
    element_Peek.hidden = rect$_Quoted.length > 0 && rect$_Quoted.every((rect_Quoted) => rect_Quoted.top >= rect_Scroller.top && rect_Quoted.bottom <= rect_Scroller.bottom && rect_Quoted.left >= rect_Scroller.left && rect_Quoted.right <= rect_Scroller.right && (rect_Over === null || rect_Quoted.bottom <= rect_Over.top || rect_Quoted.top >= rect_Over.bottom || rect_Quoted.right <= rect_Over.left || rect_Quoted.left >= rect_Over.right))
  }
}

interface _Api___shiftOf__Popover_ {
  placed_Popover: _Placed_Popover_
  element_Scroller: HTMLElement
}

function shiftOf__Popover({
  placed_Popover,
  element_Scroller
}: _Api___shiftOf__Popover_): _Point_Screen_ {
  const rect_Anchor = placed_Popover.element_Anchor?.isConnected === true ? placed_Popover.element_Anchor.getBoundingClientRect() : null
  return rect_Anchor === null
    ? {
      x: placed_Popover.point_Scrolled.x - element_Scroller.scrollLeft,
      y: placed_Popover.point_Scrolled.y - element_Scroller.scrollTop
    }
    : {
      x: rect_Anchor.left - placed_Popover.point_Anchor.x,
      y: rect_Anchor.top - placed_Popover.point_Anchor.y
    }
}
