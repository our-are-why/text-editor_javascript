import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

export {
  longWords
}

const longWords: _Scene_ = {
  name: "long-words",
  title: "Long words",
  look: "Words with nothing to break at, wider than the view: a link, a hash, a path, a long German word. Each breaks at the view's edge, rather than running past it.",
  size: "tile",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text([
    "A link: https://example.com/a/very/long/path/that/keeps/going/without/any/spaces?and=a&query=string&that=is&long=too",
    "A hash: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    "A path: /home/someone/projects/workshop/notes/2026/january/the-move/costs-and-questions-still-open.txt",
    "A word: Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz",
  ].join("\n"), MODULE_PLAINTEXT)),
}
