import type { _Observer_TextEditor_ } from "../source/TextEditor.ts"
import type { _Entry_Log_ } from "./example.ts"

export {
  observerOf__Log
}

// what the playground, as host, is told of each edit, reported as it's
// told: what kind of edit it was, whose proposals' changes it changed, each
// its next round, and whether it changed the document
function observerOf__Log(
  log: (entry: _Entry_Log_) => void
): _Observer_TextEditor_ {
  return {
    applied: (applied_Edit) => log({
      edited: applied_Edit.request_Edit.kind,
      proposals: applied_Edit.sources_Changed.join(", "),
      document: applied_Edit.isChanged_Document
    })
  }
}
