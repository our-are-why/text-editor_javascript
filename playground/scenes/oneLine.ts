import type { _Scene_ } from "../scene.ts"

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
  model__HtmlView_Editor: { lines: [{ text: "A single line, and nothing after it." }] },
}
