import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { actions_Review } from "../items.ts"
import { blocksWith__Frames, lineOf } from "../lines.ts"
import { attributesOf__Change, attributesOf__Marks } from "../looks.ts"
import { movingTheWorkshop } from "./plainText.ts"

export {
  proposalsProse
}

// a long line of prose framed in place, four proposals changing words of it
// at once, each a source of its own, to be decided apart: the line as it
// is, what's changed in it marked, then the line as the proposals would
// leave it, then their list, as doctor lays them out
const proposalsProse: _Scene_ = {
  name: "proposals-prose",
  title: "Proposals in a line of prose",
  look: "The whole workshop note, with a frame in place of line 22, four proposals changing it at once, each on words of its own: one makes words bold, one takes a clause out, one replaces a word and another further on, leaving the words between them as they are, one replaces words and makes them bold. As doctor lays proposals out: line 22 as it is, with what the proposals change in it marked, then line 22 as they'd leave it, unnumbered but for the ~ of a line changed in place, then the frame's list of its proposals. Each proposal's target on each line, from its first change there to its last, is boxed behind it. Point at a change to outline all of its proposal's changes, in both.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksWith__Frames({
    multilineText: movingTheWorkshop,
    module_Language: MODULE_PLAINTEXT,
    frames: [{
      kind: "FRAME",
      range: { first: 22, last: 22 },
      parts: [
        {
          kind: "CURRENT_LINES",
          run: { id: "current", lines: [
            lineOf(
              "The one thing that ",
              { text: "can't slip", attributes: attributesOf__Change({ side: "before", kind: "restyled", source: "bold" }) },
              " is the electrician",
              { text: ", because without the three-phase supply the lathe can't run", attributes: attributesOf__Change({ side: "before", kind: "removed", source: "reason" }) },
              ", and without the lathe ",
              { text: "half", attributes: attributesOf__Change({ side: "before", kind: "replaced", source: "most" }) },
              " the orders on the board can't be ",
              { text: "finished", attributes: attributesOf__Change({ side: "before", kind: "replaced", source: "most" }) },
              "; everything else can move ",
              { text: "a week", attributes: attributesOf__Change({ side: "before", kind: "replacedRestyled", source: "weeks" }) },
              " either way without anyone noticing."
            ),
          ], groups: [] },
        },
        {
          kind: "PROPOSAL_LINES",
          run: { id: "proposed", lines: [
            lineOf(
              "The one thing that ",
              { text: "can't slip", attributes: { ...attributesOf__Change({ side: "after", kind: "restyled", source: "bold" }), ...attributesOf__Marks("bold") } },
              " is the electrician, and without the lathe ",
              { text: "most of", attributes: attributesOf__Change({ side: "after", kind: "replaced", source: "most" }) },
              " the orders on the board can't be ",
              { text: "sent out", attributes: attributesOf__Change({ side: "after", kind: "replaced", source: "most" }) },
              "; everything else can move ",
              { text: "two weeks", attributes: { ...attributesOf__Change({ side: "after", kind: "replacedRestyled", source: "weeks" }), ...attributesOf__Marks("bold") } },
              " either way without anyone noticing."
            ),
          ], groups: [] },
        },
        {
          kind: "PROPOSAL_LIST",
          items: [
            {
              source: "bold",
              title: "Make “can't slip” bold",
              rationale: "It's the one thing in the note that can't move, so it should be the first thing anyone skimming it sees.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
            {
              source: "reason",
              title: "Take out why it can't slip",
              rationale: "The lathe and its supply are already in the list of what goes first; saying it again here only lengthens the sentence.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
            {
              source: "most",
              title: "Most of the orders sent out, not half finished",
              rationale: "The lathe holds up most of the orders, not half, and what's held up is getting them to customers, not finishing them.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
            {
              source: "weeks",
              title: "Two weeks, in bold",
              rationale: "There's two weeks of slack, not one, and it's the number people will plan around.",
              actions: actions_Review,
              attributes: {},
          places: "",
            },
          ],
        },
      ],
    }],
  })),
}
