import {
  viewModelOf__Model,
  type _Proposal_Host_,
  type _Landed_Round_,
  type _Module_Reading_,
  type _Module_Language_,
  type _Range_Lines_,
  type _ViewModel_TextEditor_
} from "../source/ui/editor/index.ts"
import {
  parseModel_TextEditor,
  type _Mark_Text_,
  type _Changes_Host_,
  type _Model_TextEditor_,
  type _Stale_Source_,
  type _Range_Text_,
  _Documents_,
  type _Document_Documents_,
  parseTexts_Line,
  carriedOf__Head
} from "../source/core/documents/index.ts"
import { PROPOSAL_YOURS } from "../source/ui/host/index.ts"

export {
  modelOf,
  carriedOf__Model,
  type _Edit_Example_,
  projectedOf,
  projectedOf__Carried
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

interface _Api___carriedOf__Model_ {
  multilineText: string
  marks: Array<_Mark_Text_>
  proposed: Array<_Changes_Host_>
  stale: Array<_Stale_Source_>
  edits: Array<_Edit_Example_>
}

// an edit made to a document: a span of it and what it becomes
interface _Edit_Example_ {
  range: _Range_Text_
  multilineText: string
}

interface _Carried_Model_ {
  model_TextEditor: _Model_TextEditor_
  stale: Array<_Stale_Source_>
}

// a document's model as its changes were written on it, as modelOf makes
// it, carried across the edits made to it since, each on the document as
// the edits before it left it, by the documents part, as a host carries a
// task's head: the document as it now is, its changes where they now are,
// and those an edit touched stale, written before your edits, with what was
// stale of them already
function carriedOf__Model({
  multilineText,
  marks,
  proposed,
  stale,
  edits
}: _Api___carriedOf__Model_): _Carried_Model_ {
  const model_TextEditor = modelOf({
    multilineText,
    marks,
    proposed
  })
  const documents = new _Documents_({
    model_Documents: {
      documents: []
    },
    observers: []
  })
  documents.handle({
    kind: "OPEN",
    path: path_Carried,
    text: model_TextEditor.document,
    isPresent: true
  })
  const documentOf = (): _Document_Documents_ => {
    const document = documents.model_Documents.documents[0]
    if (document === undefined) throw new Error(`${path_Carried} isn't kept`)
    return document
  }
  const version = documentOf().version
  for (const edit of edits) {
    documents.handle({
      kind: "EDIT",
      path: path_Carried,
      version: documentOf().version,
      transaction: {
        steps: [
          {
            kind: "TEXT",
            id_Text: {
              kind: "DOCUMENT"
            },
            range: edit.range,
            next: {
              lines: parseTexts_Line(edit.multilineText),
              marks: []
            }
          }
        ]
      }
    })
  }
  const head = carriedOf__Head({
    document: documentOf(),
    head: {
      path: path_Carried,
      version,
      proposed: model_TextEditor.proposed,
      stale
    }
  })
  return {
    model_TextEditor: {
      document: documentOf().text,
      proposed: head.proposed
    },
    stale: head.stale
  }
}

// the path the documents part keeps a carried document by, its only one
const path_Carried = "carried"

interface _Api___projectedOf_<State> {
  multilineText: string
  marks: Array<_Mark_Text_>
  module_Language: _Module_Language_<State>
  module_Reading: _Module_Reading_
  proposed: Array<_Changes_Host_>
  proposals: Array<_Proposal_Host_>
  rounds_Landed: Array<_Landed_Round_>
  ranges_Frame: Array<_Range_Lines_>
}

// a document's view model, as the editor draws it from its model, its
// changes read as the reading given reads them, what the playground, as
// host, says of each proposal, how their last rounds landed, which of
// their changes were written before your edits, and the lines it frames,
// a function's say, beyond what the changes touch: for the pages that show
// what's drawn, the changes document's cases and the gallery's scenes,
// which the viewer draws as it's given them, where an example has the
// editor draw its model; a document named nothing, with no task, as these
// pages draw no header
function projectedOf<State>({
  multilineText,
  marks,
  module_Language,
  module_Reading,
  proposed,
  proposals,
  rounds_Landed,
  ranges_Frame
}: _Api___projectedOf_<State>): _ViewModel_TextEditor_ {
  return viewModelOf__Model({ isListening_Agent: true, model_TextEditor: modelOf({ multilineText, marks, proposed }), name_Document: "", proposals, rounds_Landed, source_Yours: PROPOSAL_YOURS.source, mode: { kind: "MANUAL" }, tasks: [], files: [], ranges_Frame, module_Language, module_Reading })
}

interface _Api___projectedOf__Carried_<State> {
  multilineText: string
  marks: Array<_Mark_Text_>
  module_Language: _Module_Language_<State>
  module_Reading: _Module_Reading_
  proposed: Array<_Changes_Host_>
  edits: Array<_Edit_Example_>
  proposals: Array<_Proposal_Host_>
  ranges_Frame: Array<_Range_Lines_>
}

// a document's view model, as projectedOf draws it, from its changes as
// they were written on its lines and the edits made to them since, carried
// across them, each change an edit touched drawn as written before your
// edits, as a round that landed after them is
function projectedOf__Carried<State>({
  multilineText,
  marks,
  module_Language,
  module_Reading,
  proposed,
  edits,
  proposals,
  ranges_Frame
}: _Api___projectedOf__Carried_<State>): _ViewModel_TextEditor_ {
  const carried = carriedOf__Model({
    multilineText,
    marks,
    proposed,
    stale: [],
    edits
  })
  return viewModelOf__Model({
    isListening_Agent: true,
    model_TextEditor: carried.model_TextEditor,
    name_Document: "",
    proposals,
    rounds_Landed: carried.stale,
    source_Yours: PROPOSAL_YOURS.source,
    mode: {
      kind: "MANUAL"
    },
    tasks: [],
    files: [],
    ranges_Frame,
    module_Language,
    module_Reading
  })
}
