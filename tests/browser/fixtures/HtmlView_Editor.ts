import { everything } from "../../../playground/scenes/everything.ts"
import { _View_TextEditor_, COMPONENTMAP__VIEW_TEXTEDITOR } from "../../../source/View_TextEditor.tsx"
import { draw__Node_Jsx, jsx } from "../../../source/Jsx.ts"
import { viewModelOf__Blocks, parseLines_ViewModel } from "../../../source/ViewModel_TextEditor.ts"

// the view, with its stylesheet, and its own components, for a test to make
// and draw with in the page, the JSX runtime it draws with, and the
// parser that makes the lines it draws; and the main example, the
// gallery's Everything scene, with what must hold of it, to check as the
// gallery does
window._View_TextEditor_ = _View_TextEditor_
window.COMPONENTMAP__VIEW_TEXTEDITOR = COMPONENTMAP__VIEW_TEXTEDITOR
window.jsx = jsx
window.draw__Node_Jsx = draw__Node_Jsx
window.viewModelOf__Blocks = viewModelOf__Blocks
window.parseLines_ViewModel = parseLines_ViewModel
window.everything = everything

declare global {
  interface Window {
    _View_TextEditor_: typeof _View_TextEditor_
    COMPONENTMAP__VIEW_TEXTEDITOR: typeof COMPONENTMAP__VIEW_TEXTEDITOR
    jsx: typeof jsx
    draw__Node_Jsx: typeof draw__Node_Jsx
    viewModelOf__Blocks: typeof viewModelOf__Blocks
    parseLines_ViewModel: typeof parseLines_ViewModel
    everything: typeof everything
  }
}
