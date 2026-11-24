import type {
  _Action_Item_,
  _Decision_Proposal_,
  _Proposal_Host_
} from "../source/editor/index.ts"

export {
  actions_Review,
  actions_Reopen,
  actions_Dismiss,
  proposal_Yours,
  shownMap_State
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

// what it offers once one's been decided: only to take it back, to open
// again; while revisions are queued, the same as while it's open, to ask
// more of it or decide it anyway; and nothing while the agent's revising one
const actions_Reopen: Array<_Action_Item_> = [
  { command: "reopen", label: "Reopen", stateAfter: "OPEN" }
]

// what it offers once the agent's withdrawn one, its own to take back, not
// yours, so nothing left of it to reopen: only to clear it from the list,
// no state after it, as it's gone
const actions_Dismiss: Array<_Action_Item_> = [
  { command: "dismiss", label: "Dismiss", stateAfter: null }
]

// what the playground, as host, says of the proposal your own edits make,
// typed among what a frame proposes: yours, open while you make it, nothing
// to do with it yet but see it
const proposal_Yours: _Proposal_Host_ = {
  source: "yours",
  title: "Your edits",
  state: "OPEN",
  status: "",
  rationale: "",
  requests: [],
  actions: [],
  attributes: {}
}

// what the playground, as host, says of a proposal in each state, and offers
// to do with it then, as its examples give them
type _ShownMap__State_ = {
  [Decision in _Decision_Proposal_]: _Shown_State_
}

interface _Shown_State_ {
  status: string
  actions: Array<_Action_Item_>
}

const shownMap_State: _ShownMap__State_ = {
  OPEN: {
    status: "",
    actions: actions_Review
  },
  ACCEPTED: {
    status: "Accepted",
    actions: actions_Reopen
  },
  REJECTED: {
    status: "Rejected",
    actions: actions_Reopen
  },
  WITHDRAWN: {
    status: "Withdrawn",
    actions: actions_Dismiss
  }
}
