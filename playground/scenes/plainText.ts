import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

export {
  movingTheWorkshop,
  plainText
}

// a note of thirty lines, as anyone might write one in a text editor
const movingTheWorkshop = `Moving the workshop

The lease on the old place runs out at the end of March, and the new one
is ready from the second week of February, so there's a month of overlap
to move in without stopping work.

What goes first:
    - the lathe and the drill press, which need the van and two people
    - the timber rack, taken down and rebuilt on the far wall
    - the hand tools, last, so the bench keeps working until the end

What stays:
    - the old dust extractor, which the landlord has agreed to keep
    - the shelving by the door, which was there when we came
    - the sink, which is plumbed in

Costs, roughly:
\tvan hire\ttwo days
\telectrician\thalf a day, for the three-phase supply
\tpaint\t\twhatever's left over from the house

The one thing that can't slip is the electrician, because without the three-phase supply the lathe can't run, and without the lathe half the orders on the board can't be finished; everything else can move a week either way without anyone noticing.

Questions still open:
    1. Can the skip go in the yard, or does it need a permit for the road?
    2. Who keeps the spare keys while we're in both places?
    3. Is the insurance the same for the new address, or a new policy?

Next step: ring the electrician on Monday, and ask the landlord about the
yard while we're there.`

const plainText: _Scene_ = {
  name: "plain-text",
  title: "Plain text",
  look: "Thirty lines of a plain note: paragraphs with blank lines between them, lists indented with spaces, a small table lined up with tabs, and one line long enough to wrap.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text(movingTheWorkshop, MODULE_PLAINTEXT)),
}
