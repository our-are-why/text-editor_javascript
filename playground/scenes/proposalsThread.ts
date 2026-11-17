import type { _Scene_ } from "../scene.ts"
import { retry, proposed_retry, proposals_retry } from "../examples/javascript.ts"
import { MODULE_READING_TEXT } from "../../source/readings/text.ts"
import { projectedOf } from "../projected.ts"
import { module_JavaScript } from "../syntax.ts"

export {
  proposalsThread
}

// of the example's proposals, only the thread, the loop's counter, n,
// renamed round, wherever it is, in the doc comment, in retry and in
// backoff, one decision; and the removal, the onRetry hook taken out, in the
// doc comment, retry's options and its call, the thread's renaming of an n
// it takes out nested inside, applying only if the removal's rejected
const sources_Thread = ["hook", "round"]

// the retry module with three frames: its doc comment's options, retry, and
// backoff; a rename threaded through all three, and a removal through the
// first two, the rename's places inside the removal nested in it
const proposalsThread: _Scene_ = {
  name: "proposals-thread",
  title: "A thread through frames, and a removal around it",
  look: "The JavaScript module with three frames: its doc comment's options, line 10; retry, lines 13 to 27; and backoff, lines 31 to 34. One proposal, a thread, renames the loop's counter, n, to round, in nine places through all three frames: each frame lists it, saying how many of its places are there, of how many, its actions deciding it everywhere. Another takes out the onRetry hook, in three places through the first two frames. Two of the thread's places are inside what the removal takes out, line 10's n and line 22's: they're the thread's fallback there, ringed faint, at half strength, applying only if the removal's rejected, and its items say so; as proposed, with every proposal taken, they're gone with the removal.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: projectedOf({
    multilineText: retry,
    marks: [],
    module_Language: module_JavaScript,
    module_Reading: MODULE_READING_TEXT,
    proposed: proposed_retry.filter((changes_Host) => sources_Thread.includes(changes_Host.source)),
    proposals: proposals_retry.filter((proposal_Host) => sources_Thread.includes(proposal_Host.source)),
    ranges_Frame: [{ first: 13, last: 27 }, { first: 31, last: 34 }]
  }),
}
