import "../../../source/editor/looks/changes.css"
import { everything } from "../../../playground/scenes/everything.ts"
import { _View_TextEditor_, COMPONENTMAP__VIEW_TEXTEDITOR } from "../../../source/editor/View_TextEditor.tsx"
import { draw__Node_Jsx, jsx } from "../../../source/jsx/Jsx.ts"
import { _Viewer_TextEditor_ } from "../../../source/editor/Viewer_TextEditor.ts"
import { MODULE_MOUSE } from "../../../source/editor/modules/mouse.ts"
import { viewModelOf__Blocks, parseLines_ViewModel, MODULE_PLAINTEXT } from "../../../source/editor/ViewModel_TextEditor.ts"
import { MODULE_WORDS_TEXT } from "../../../source/editor/words/text.ts"

// the view, with its stylesheet, its "changes" look, on where a test
// sets it, and its own components, for a test to make and draw with in the
// page, the JSX runtime it draws with, and the parser that makes the lines
// it draws, with plain text's module; the editor that holds the view, and
// the mouse, its module, and what a word is, as text; and the main example, the gallery's Everything
// scene, with what must hold of it, to check as the gallery does
window._View_TextEditor_ = _View_TextEditor_
window.COMPONENTMAP__VIEW_TEXTEDITOR = COMPONENTMAP__VIEW_TEXTEDITOR
window.jsx = jsx
window.draw__Node_Jsx = draw__Node_Jsx
window.viewModelOf__Blocks = viewModelOf__Blocks
window.parseLines_ViewModel = parseLines_ViewModel
window.MODULE_PLAINTEXT = MODULE_PLAINTEXT
window._Viewer_TextEditor_ = _Viewer_TextEditor_
window.MODULE_MOUSE = MODULE_MOUSE
window.MODULE_WORDS_TEXT = MODULE_WORDS_TEXT
window.everything = everything

declare global {
  interface Window {
    _View_TextEditor_: typeof _View_TextEditor_
    COMPONENTMAP__VIEW_TEXTEDITOR: typeof COMPONENTMAP__VIEW_TEXTEDITOR
    jsx: typeof jsx
    draw__Node_Jsx: typeof draw__Node_Jsx
    viewModelOf__Blocks: typeof viewModelOf__Blocks
    parseLines_ViewModel: typeof parseLines_ViewModel
    MODULE_PLAINTEXT: typeof MODULE_PLAINTEXT
    _Viewer_TextEditor_: typeof _Viewer_TextEditor_
    MODULE_MOUSE: typeof MODULE_MOUSE
    MODULE_WORDS_TEXT: typeof MODULE_WORDS_TEXT
    everything: typeof everything
  }
}
