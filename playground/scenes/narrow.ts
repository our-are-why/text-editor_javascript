import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"
import { movingTheWorkshop } from "./plainText.ts"

export {
  narrow
}

const narrow: _Scene_ = {
  name: "narrow",
  title: "Narrow",
  look: "The plain note in a narrow view: every long line wraps, and a wrapped list item carries on from the left edge, not under its dash. Whether wrapped lines hang under their indent is a choice still to make.",
  size: "narrow",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text(movingTheWorkshop)),
}
