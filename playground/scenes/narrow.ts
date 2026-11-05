import type { _Scene_ } from "../scene.ts"
import { parseLines_ViewModel } from "../../source/HtmlView_Editor.ts"
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
  model__HtmlView_Editor: { lines: parseLines_ViewModel(movingTheWorkshop) },
}
