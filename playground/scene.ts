import type { _ViewModel_TextEditor_ } from "../source/ViewModel_TextEditor.ts"

export {
  type _Size_Scene_,
  type _Scene_,
  type _Invariant_Scene_
}

// what a scene is to the gallery, which draws every one side by side, to be
// checked by eye: what the view is given, written by hand, and what to look
// for in it

// how much of the gallery a scene takes: a tile of its grid, the grid's whole
// width, or a narrow column, to see lines wrap
type _Size_Scene_ = "tile" | "wide" | "narrow"

interface _Scene_ {
  // in the gallery's address: #<name>
  name: string
  title: string
  // what to check, by eye
  look: string
  size: _Size_Scene_
  // the view's variables, set for this scene alone, as a host sets them; {}
  // for the gallery's own
  variables: { [variable: string]: string }
  // what each line is there for, by its place in the document, shown beside
  // it; [] for a scene whose lines aren't named
  labels: Array<string>
  // what must hold of the scene once it's drawn, checked in the gallery as in
  // the tests; [] for a scene that's only looked at
  invariants: Array<_Invariant_Scene_>
  viewModel_TextEditor: _ViewModel_TextEditor_
}

// something that must hold of a scene once it's drawn
interface _Invariant_Scene_ {
  name: string
  // the lines it's about, by their labels: every line, or some
  concerns: "every line" | Array<string>
  // what fails it, named, measured from the container the scene is drawn in;
  // [] when it holds
  failing: (containerElement: HTMLElement) => Array<string>
}
