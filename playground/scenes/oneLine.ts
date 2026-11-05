import type { _Scene_ } from "../scene.ts"
import { parseLines_ViewModel } from "../../source/HtmlView_Editor.ts"

export {
  oneLine
}

const oneLine: _Scene_ = {
  name: "one-line",
  title: "One line",
  look: "One line of text, and no line after it: the smallest document with something in it.",
  size: "tile",
  variables: {},
  labels: [],
  invariants: [],
  model__HtmlView_Editor: { lines: parseLines_ViewModel("A single line, and nothing after it.") },
}
