import { parseModel_TextEditor, type _Changes_Host_ } from "../source/Model_TextEditor.ts"
import { viewModelOf__Model, type _Proposal_Host_ } from "../source/Projection_TextEditor.ts"
import type { _Module_Language_, _Range_Lines_, _ViewModel_TextEditor_ } from "../source/ViewModel_TextEditor.ts"

export {
  projectedOf
}

interface _Api___projectedOf_<State> {
  multilineText: string
  module_Language: _Module_Language_<State>
  proposed: Array<_Changes_Host_>
  proposals: Array<_Proposal_Host_>
  ranges_Frame: Array<_Range_Lines_>
}

// a document's view model, as the editor draws it from its lines, the
// changes proposed for them, what the playground, as host, says of each
// proposal, and the lines it frames, a function's say, beyond what the
// changes touch. Changes refused are a mistake in the playground, and throw,
// with why
function projectedOf<State>({
  multilineText,
  module_Language,
  proposed,
  proposals,
  ranges_Frame
}: _Api___projectedOf_<State>): _ViewModel_TextEditor_ {
  const result = parseModel_TextEditor({ multilineText, proposed })
  if (result.kind === "REFUSED") throw new Error(result.refusals.map((refusal) => `${refusal.source}: ${refusal.reason}`).join("\n"))
  return viewModelOf__Model({ model_TextEditor: result.model_TextEditor, proposals, ranges_Frame, module_Language })
}
