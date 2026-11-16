import type { _Action_Item_ } from "../source/ViewModel_TextEditor.ts"

export {
  actions_Review,
  actions_Reopen,
  actions_Dismiss
}

// what the playground, as host, offers to do with each of its proposals, in
// doctor's order: take it, turn it down, or send it back to be revised; the
// editor draws each as a button carrying its command, the first the main
// one, its words the colour of the state it leads to, and what it does is
// the host's
const actions_Review: Array<_Action_Item_> = [
  { command: "accept", label: "Accept", stateAfter: "ACCEPTED" },
  { command: "reject", label: "Reject", stateAfter: "REJECTED" },
  { command: "revise", label: "Revise", stateAfter: "REQUESTED" }
]

// what it offers once one's been decided, or a revision asked for: only to
// take it back, to open again; and nothing while the agent's revising one
const actions_Reopen: Array<_Action_Item_> = [
  { command: "reopen", label: "Reopen", stateAfter: "OPEN" }
]

// what it offers once the agent's withdrawn one, its own to take back, not
// yours, so nothing left of it to reopen: only to clear it from the list,
// no state after it, as it's gone
const actions_Dismiss: Array<_Action_Item_> = [
  { command: "dismiss", label: "Dismiss", stateAfter: null }
]
