import type { _Scene_ } from "../scene.ts"
import {
  MODULE_PLAINTEXT,
  type _Range_Text_,
  MODULE_READING_TEXT
} from "../../source/editor/index.ts"
import { actions_Review } from "../items.ts"
import { attributesOf__Marks } from "../looks.ts"
import { projectedOf } from "../projected.ts"
import { movingTheWorkshop } from "./plainText.ts"

export {
  proposalsProse
}

// a long line of prose framed in place, four proposals changing words of it
// at once, each a source of its own, to be decided apart: the line as it
// is, what's changed in it marked, then the line as the proposals would
// leave it, then their list, as doctor lays them out
// the line the proposals change, line 22, as they quote it
const line_Changed = movingTheWorkshop.split("\n")[21] ?? ""

// the words a proposal quotes on the line it changes
function quoted(
  quote: string
): _Range_Text_ {
  const offset = line_Changed.indexOf(quote)
  if (offset === -1) throw new Error(`no "${quote}" on line 22`)
  return { from: { line: 21, offset }, to: { line: 21, offset: offset + quote.length } }
}

const proposalsProse: _Scene_ = {
  name: "proposals-prose",
  title: "Proposals in a line of prose",
  look: "The whole workshop note, with a frame in place of line 22, four proposals changing it at once, each on words of its own: one makes words bold, one takes a clause out, one replaces a word and another further on, leaving the words between them as they are, one replaces words and makes them bold. As doctor lays proposals out: line 22 as it is, with what the proposals change in it marked, then line 22 as they'd leave it, unnumbered but for the ~ of a line changed in place, then the frame's list of its proposals. Each proposal's target on each line, from its first change there to its last, is boxed behind it. Point at a change to outline all of its proposal's changes, in both.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: projectedOf({
    multilineText: movingTheWorkshop,
    marks: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT,
    proposed: [
      { source: "bold", changes: [{ kind: "REPLACE", range: quoted("can't slip"), multilineText: "can't slip", marks: [{ range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 10 } }, data: attributesOf__Marks("bold") }] }] },
      { source: "reason", changes: [{ kind: "REPLACE", range: quoted(", because without the three-phase supply the lathe can't run"), multilineText: "", marks: [] }] },
      { source: "most", changes: [{ kind: "REPLACE", range: quoted("half"), multilineText: "most of", marks: [] }, { kind: "REPLACE", range: quoted("finished"), multilineText: "sent out", marks: [] }] },
      { source: "weeks", changes: [{ kind: "REPLACE", range: quoted("a week"), multilineText: "two weeks", marks: [{ range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 9 } }, data: attributesOf__Marks("bold") }] }] }
    ],
    proposals: [
      { source: "bold", title: "Make “can't slip” bold", state: "OPEN", status: "", rationale: "It's the one thing in the note that can't move, so it should be the first thing anyone skimming it sees.", requests: [], actions: actions_Review, attributes: {} },
      { source: "reason", title: "Take out why it can't slip", state: "OPEN", status: "", rationale: "The lathe and its supply are already in the list of what goes first; saying it again here only lengthens the sentence.", requests: [], actions: actions_Review, attributes: {} },
      { source: "most", title: "Most of the orders sent out, not half finished", state: "OPEN", status: "", rationale: "The lathe holds up most of the orders, not half, and what's held up is getting them to customers, not finishing them.", requests: [], actions: actions_Review, attributes: {} },
      { source: "weeks", title: "Two weeks, in bold", state: "OPEN", status: "", rationale: "There's two weeks of slack, not one, and it's the number people will plan around.", requests: [], actions: actions_Review, attributes: {} }
    ],
    rounds_Landed: [],
    ranges_Frame: []
  }),
}
