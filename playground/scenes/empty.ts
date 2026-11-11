import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

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
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text("")),
}
