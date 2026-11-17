import {
  type _Model_TextEditor_,
  type _NonEmpty_
} from "./Model_TextEditor.ts"
import {
  viewModelOf__Model,
  type _Proposal_Host_,
  type _Module_Reading_
} from "./Projection_TextEditor.ts"
import {
  type _Range_Lines_,
  type _ViewModel_TextEditor_,
  type _Module_Language_
} from "./ViewModel_TextEditor.ts"
import {
  _Viewer_TextEditor_,
  type _Module_TextEditor_
} from "./Viewer_TextEditor.ts"
import type { _ComponentMap__View_TextEditor_ } from "./View_TextEditor.tsx"

export {
  _TextEditor_,
  type _Api__TextEditor_,
  type _Setup_TextEditor_,
  type _Perspective_TextEditor_,
  type _Look_TextEditor_
}

class _TextEditor_<State> {
  containerElement: HTMLElement
  setup: _Setup_TextEditor_<State>
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  ranges_Frame: Array<_Range_Lines_>
  perspective_Shown: _Perspective_TextEditor_
  viewer: _Viewer_TextEditor_

  constructor({
    containerElement,
    setup,
    model_TextEditor,
    proposals,
    ranges_Frame
  }: _Api__TextEditor_<State>) {
    this.containerElement = containerElement
    this.setup = setup
    this.model_TextEditor = model_TextEditor
    this.proposals = proposals
    this.ranges_Frame = ranges_Frame
    this.perspective_Shown = this.setup.perspectives[0]
    this.containerElement.dataset["look"] = lookOf__Perspective(this.perspective_Shown)
    this.viewer = new _Viewer_TextEditor_({
      containerElement: this.containerElement,
      componentMap: this.setup.componentMap,
      modules: this.setup.modules,
      viewModel_TextEditor: this.projected()
    })
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
  ranges_Frame: Array<_Range_Lines_>
}

interface _Setup_TextEditor_<State> {
  componentMap: _ComponentMap__View_TextEditor_
  modules: Array<_Module_TextEditor_>
  module_Language: _Module_Language_<State>
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
