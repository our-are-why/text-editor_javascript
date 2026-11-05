import type { _Scene_ } from "../scene.ts"
import { parseLines_ViewModel } from "../../source/HtmlView_Editor.ts"

export {
  empty
}

const empty: _Scene_ = {
  name: "empty",
  title: "Empty",
  look: "A document with no text is one empty line, which keeps its height, so there's still somewhere for a caret.",
  size: "tile",
  variables: {},
  labels: [],
  invariants: [],
  model__HtmlView_Editor: { lines: parseLines_ViewModel("") },
}
