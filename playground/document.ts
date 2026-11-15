import type { _ViewModel_TextEditor_ } from "../source/ViewModel_TextEditor.ts"

export {
  type _Document_,
  type _Section_Document_,
  type _Case_Document_,
  type _Status_Case_,
  type _Size_Case_,
  type _Open_Case_
}

// what a document is to the playground, which lists it and shows it on a
// page of its own: every case of something the view draws, enumerated, each
// drawn by the editor from what it's given, written by hand, with what it
// shows and what's still to decide. The official record of the cases, as
// the gallery is of the scenes

interface _Document_ {
  // in the playground's address: ?document=<name>
  name: string
  title: string
  // what it enumerates, and how to read it
  about: string
  sections: Array<_Section_Document_>
}

// the cases of one concern, in the order they're best read
interface _Section_Document_ {
  // in the document's address: #<name>
  name: string
  title: string
  about: string
  cases: Array<_Case_Document_>
}

interface _Case_Document_ {
  // in the document's address: #<name>
  name: string
  title: string
  status: _Status_Case_
  size: _Size_Case_
  // what it shows, and why it's drawn so: for a planned case, what's drawn
  // now, and what's to be
  drawn: string
  // what's still to decide about it; null when nothing is
  open: _Open_Case_ | null
  // what the view's given; null for a case there's nothing yet to draw of
  viewModel_TextEditor: _ViewModel_TextEditor_ | null
}

// whether a case is what the view draws, the usual or an edge of it, or
// what it's to draw, settled but not built yet
type _Status_Case_ = "normal" | "edge" | "planned"

// how wide a case is drawn: the document's width, or narrow, to see lines
// wrap
type _Size_Case_ = "wide" | "narrow"

// a question about a case, and what we'd do about it
interface _Open_Case_ {
  question: string
  recommend: string
}
