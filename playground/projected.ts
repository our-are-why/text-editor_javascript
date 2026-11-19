import { parseModel_TextEditor, type _Mark_Text_, type _Changes_Host_, type _Model_TextEditor_ } from "../source/Model_TextEditor.ts"
import { viewModelOf__Model, type _Proposal_Host_, type _Module_Reading_ } from "../source/Projection_TextEditor.ts"
import type { _Module_Language_, _Range_Lines_, _ViewModel_TextEditor_ } from "../source/ViewModel_TextEditor.ts"

export {
  modelOf,
  projectedOf
}

interface _Api___modelOf_ {
  multilineText: string
  marks: Array<_Mark_Text_>
  proposed: Array<_Changes_Host_>
}

// a document's model, from its lines and the marks over them, and the
// changes proposed for them, as the playground, as host, writes them.
// Changes refused are a mistake in the playground, and throw, with why
function modelOf({
  multilineText,
  marks,
  proposed
}: _Api___modelOf_): _Model_TextEditor_ {
  const result = parseModel_TextEditor({ multilineText, marks, proposed })
  if (result.kind === "REFUSED") throw new Error(result.refusals.map((refusal) => `${refusal.source}: ${refusal.reason}`).join("\n"))
  return result.model_TextEditor
}

interface _Api___projectedOf_<State> {
  multilineText: string
  marks: Array<_Mark_Text_>
  module_Language: _Module_Language_<State>
  module_Reading: _Module_Reading_
  proposed: Array<_Changes_Host_>
  proposals: Array<_Proposal_Host_>
  ranges_Frame: Array<_Range_Lines_>
}

// a document's view model, as the editor draws it from its model, its
// changes read as the reading given reads them, what the playground, as
// host, says of each proposal, and the lines it frames, a function's say,
// beyond what the changes touch: for the pages that show what's drawn, the
// changes document's cases and the gallery's scenes, which the viewer draws
// as it's given them, where an example has the editor draw its model; a
// document named nothing, with no task, as these pages draw no header
function projectedOf<State>({
  multilineText,
  marks,
  module_Language,
  module_Reading,
  proposed,
  proposals,
  ranges_Frame
}: _Api___projectedOf_<State>): _ViewModel_TextEditor_ {
  return viewModelOf__Model({ model_TextEditor: modelOf({ multilineText, marks, proposed }), name_Document: "", proposals, rounds_Landed: [], task: null, ranges_Frame, module_Language, module_Reading })
}
