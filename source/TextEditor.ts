import {
  type _Model_TextEditor_,
  type _NonEmpty_,
  type _Transaction_Model_
} from "./Model_TextEditor.ts"
import {
  viewModelOf__Model,
  type _Proposal_Host_,
  type _Task_Host_,
  type _Landed_Round_,
  type _Module_Reading_
} from "./Projection_TextEditor.ts"
import {
  type _Task_Header_,
  type _Range_Lines_,
  type _ViewModel_TextEditor_,
  type _Module_Language_,
  type _Module_Words_
} from "./ViewModel_TextEditor.ts"
import {
  _Viewer_TextEditor_,
  type _Module_TextEditor_,
  type _Answer_Edit_,
  type _Asked_Host_
} from "./Viewer_TextEditor.ts"
import {
  editedOf__Request,
  type _Request_Edit_,
  type _History_TextEditor_,
  HISTORY_EMPTY
} from "./Editing_TextEditor.ts"
import type { _ComponentMap__View_TextEditor_ } from "./View_TextEditor.tsx"

export {
  _TextEditor_,
  type _Api__TextEditor_,
  type _Setup_TextEditor_,
  type _Perspective_TextEditor_,
  type _Look_TextEditor_,
  type _Observer_TextEditor_,
  type _Applied_Edit_,
  type _Update_Host_
}

class _TextEditor_<State> {
  containerElement: HTMLElement
  setup: _Setup_TextEditor_<State>
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  task: _Task_Host_ | null
  rounds_Landed: Array<_Landed_Round_>
  source_Yours: string
  ranges_Frame: Array<_Range_Lines_>
  observers: Array<_Observer_TextEditor_>
  perspective_Shown: _Perspective_TextEditor_
  history: _History_TextEditor_
  viewer: _Viewer_TextEditor_

  constructor({
    containerElement,
    setup,
    model_TextEditor,
    proposals,
    task,
    rounds_Landed,
    source_Yours,
    ranges_Frame,
    observers
  }: _Api__TextEditor_<State>) {
    this.containerElement = containerElement
    this.setup = setup
    this.model_TextEditor = model_TextEditor
    this.proposals = proposals
    this.task = task
    this.rounds_Landed = rounds_Landed
    this.source_Yours = source_Yours
    this.ranges_Frame = ranges_Frame
    this.observers = observers
    this.perspective_Shown = this.setup.perspectives[0]
    this.history = HISTORY_EMPTY
    this.containerElement.dataset["look"] = lookOf__Perspective(this.perspective_Shown)
    this.viewer = new _Viewer_TextEditor_({
      containerElement: this.containerElement,
      componentMap: this.setup.componentMap,
      modules: this.setup.modules,
      module_Words: this.setup.module_Words,
      viewModel_TextEditor: this.projected(),
      edit: (request_Edit) => this.edited(request_Edit),
      ask: (asked_Host) => queueMicrotask(() => {
        for (const observer of this.observers) observer.asked(asked_Host)
      })
    })
  }

  edited(
    request_Edit: _Request_Edit_
  ): _Answer_Edit_ | null {
    const edited = editedOf__Request({
      model_TextEditor: this.model_TextEditor,
      proposals: this.proposals,
      source_Yours: this.source_Yours,
      module_Words: this.setup.module_Words,
      history: this.history,
      request_Edit
    })
    if (edited === null) return null
    const model_Before = this.model_TextEditor
    this.model_TextEditor = edited.model_TextEditor
    this.history = edited.history
    const applied_Edit: _Applied_Edit_ = {
      request_Edit,
      transaction: edited.transaction,
      transaction_Inverse: edited.transaction_Inverse,
      model_Before,
      model_After: this.model_TextEditor,
      sources_Changed: sourcesOf__Transaction(edited.transaction),
      isChanged_Document: edited.transaction.steps.some((step_Transaction) => step_Transaction.kind === "TEXT" && step_Transaction.id_Text.kind === "DOCUMENT")
    }
    queueMicrotask(() => {
      for (const observer of this.observers) observer.applied(applied_Edit)
    })
    return {
      viewModel_TextEditor: this.projected(),
      selection: edited.selection
    }
  }

  update(
    update_Host: _Update_Host_
  ): void {
    this.model_TextEditor = update_Host.model_TextEditor
    this.proposals = update_Host.proposals
    this.task = update_Host.task
    this.rounds_Landed = update_Host.rounds_Landed
    this.history = HISTORY_EMPTY
    this.viewer.show(this.projected())
  }

  show(
    perspective_TextEditor: _Perspective_TextEditor_
  ): void {
    if (!this.setup.perspectives.includes(perspective_TextEditor)) throw new Error(`the perspective ${perspective_TextEditor.name} isn't one of the editor's`)
    this.perspective_Shown = perspective_TextEditor
    this.containerElement.dataset["look"] = lookOf__Perspective(this.perspective_Shown)
    this.viewer.show(this.projected())
  }

  projected(): _ViewModel_TextEditor_ {
    return viewModelOf__Model({
      model_TextEditor: this.model_TextEditor,
      proposals: this.proposals,
      task: this.task,
      rounds_Landed: this.rounds_Landed,
      ranges_Frame: this.ranges_Frame,
      module_Language: this.setup.module_Language,
      module_Reading: this.perspective_Shown.module_Reading
    })
  }
}

interface _Api__TextEditor_<State> {
  containerElement: HTMLElement
  setup: _Setup_TextEditor_<State>
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  task: _Task_Host_ | null
  rounds_Landed: Array<_Landed_Round_>
  source_Yours: string
  ranges_Frame: Array<_Range_Lines_>
  observers: Array<_Observer_TextEditor_>
}

interface _Observer_TextEditor_ {
  applied: (applied_Edit: _Applied_Edit_) => void
  asked: (asked_Host: _Asked_Host_) => void
}

interface _Applied_Edit_ {
  request_Edit: _Request_Edit_
  transaction: _Transaction_Model_
  transaction_Inverse: _Transaction_Model_
  model_Before: _Model_TextEditor_
  model_After: _Model_TextEditor_
  sources_Changed: Array<string>
  isChanged_Document: boolean
}

interface _Update_Host_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  task: _Task_Host_ | null
  rounds_Landed: Array<_Landed_Round_>
}

interface _Setup_TextEditor_<State> {
  componentMap: _ComponentMap__View_TextEditor_
  modules: Array<_Module_TextEditor_>
  module_Language: _Module_Language_<State>
  module_Words: _Module_Words_
  perspectives: _NonEmpty_<_Perspective_TextEditor_>
}

interface _Perspective_TextEditor_ {
  name: string
  module_Reading: _Module_Reading_
  looks: Array<_Look_TextEditor_>
}

interface _Look_TextEditor_ {
  name: string
}

function lookOf__Perspective(
  perspective_TextEditor: _Perspective_TextEditor_
): string {
  return perspective_TextEditor.looks.map((look) => look.name).join(" ")
}

function sourcesOf__Transaction(
  transaction: _Transaction_Model_
): Array<string> {
  return [...new Set(transaction.steps.flatMap((step_Transaction) => step_Transaction.kind === "TEXT"
    ? step_Transaction.id_Text.kind === "CHANGE"
      ? [
        step_Transaction.id_Text.source
      ]
      : []
    : [
      step_Transaction.source
    ]))]
}
