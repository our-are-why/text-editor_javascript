import { _TextEditor_, type _Setup_TextEditor_ } from "../source/TextEditor.ts"
import type { _Model_TextEditor_ } from "../source/Model_TextEditor.ts"
import type { _Proposal_Host_ } from "../source/Projection_TextEditor.ts"
import type { _Range_Lines_ } from "../source/ViewModel_TextEditor.ts"
import type { _Entry_Log_ } from "./example.ts"
import { proposal_Yours, shownMap_State } from "./items.ts"

export {
  hostedOf__Editor
}

interface _Api___hostedOf__Editor_<State> {
  containerElement: HTMLElement
  setup: _Setup_TextEditor_<State>
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  ranges_Frame: Array<_Range_Lines_>
  log: (entry: _Entry_Log_) => void
}

// the playground as a host: an editor of a document and its proposals,
// told of each edit, keeping the model it leaves, and of each action asked
// of a proposal, taking it at once: its state the action's, what it says
// and offers what that state's are, a revision's notes what you asked, on
// the words they're on, if they are; dismissed, it's gone, its changes
// with it; and sending the editor what it now has. A request for a change,
// with no agent to answer it, only reported. Each reported as it's told
function hostedOf__Editor<State>({
  containerElement,
  setup,
  model_TextEditor,
  proposals,
  ranges_Frame,
  log
}: _Api___hostedOf__Editor_<State>): _TextEditor_<State> {
  let model_Host = model_TextEditor
  let proposals_Host = proposals
  const editor: _TextEditor_<State> = new _TextEditor_({
    containerElement,
    setup,
    model_TextEditor,
    proposals,
    source_Yours: proposal_Yours.source,
    ranges_Frame,
    observers: [
      {
        applied: (applied_Edit) => {
          model_Host = applied_Edit.model_After
          log({
            edited: applied_Edit.request_Edit.kind,
            proposals: applied_Edit.sources_Changed.join(", "),
            document: applied_Edit.isChanged_Document
          })
        },
        asked: (asked_Host) => {
          if (asked_Host.kind === "REQUEST") {
            log({
              requested: asked_Host.notes,
              aimed: asked_Host.selected?.text ?? null
            })
            return
          }
          const asked_Action = asked_Host
          log({
            asked: asked_Action.command,
            proposal: asked_Action.source,
            notes: asked_Action.notes,
            words: asked_Action.selected?.text ?? null
          })
          const action_Item = proposals_Host.find((proposal_Host) => proposal_Host.source === asked_Action.source)?.actions.find((action_Each) => action_Each.command === asked_Action.command)
          if (action_Item === undefined) return
          const stateAfter = action_Item.stateAfter
          if (stateAfter === null) {
            proposals_Host = proposals_Host.filter((proposal_Host) => proposal_Host.source !== asked_Action.source)
            model_Host = {
              document: model_Host.document,
              proposed: model_Host.proposed.filter((changes_Source) => changes_Source.source !== asked_Action.source)
            }
          } else {
            proposals_Host = proposals_Host.map((proposal_Host) => proposal_Host.source === asked_Action.source
              ? {
                ...proposal_Host,
                state: stateAfter,
                status: shownMap_State[stateAfter].status,
                actions: shownMap_State[stateAfter].actions,
                request: asked_Action.notes === null
                  ? proposal_Host.request
                  : asked_Action.selected === null
                    ? asked_Action.notes
                    : `On “${asked_Action.selected.text}”: ${asked_Action.notes}`
              }
              : proposal_Host)
          }
          editor.update({
            model_TextEditor: model_Host,
            proposals: proposals_Host
          })
        }
      }
    ]
  })
  return editor
}
