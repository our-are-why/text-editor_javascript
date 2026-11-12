import type { _Action_Item_ } from "../source/ViewModel_TextEditor.ts"

export {
  actions_Review
}

// what the playground, as host, offers to do with each of its proposals, in
// doctor's order: take it, turn it down, or send it back to be revised; the
// editor draws each as a button carrying its command, the first the main
// one, and what it does is the host's
const actions_Review: Array<_Action_Item_> = [
  { command: "accept", label: "Accept" },
  { command: "reject", label: "Reject" },
  { command: "revise", label: "Revise" },
]
