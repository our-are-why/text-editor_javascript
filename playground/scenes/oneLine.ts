import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

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
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text("A single line, and nothing after it.", MODULE_PLAINTEXT)),
}
