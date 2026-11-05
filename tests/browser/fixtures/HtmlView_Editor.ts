import { everything } from "../../../playground/scenes/everything.ts"
import { _HtmlView_Editor_, parseLines_ViewModel } from "../../../source/HtmlView_Editor.ts"

// the view, with its stylesheet, for a test to make and draw with in the page,
// and the parser that makes the lines it draws; and the main example, the
// gallery's Everything scene, with what must hold of it, to check as the
// gallery does
window._HtmlView_Editor_ = _HtmlView_Editor_
window.parseLines_ViewModel = parseLines_ViewModel
window.everything = everything

declare global {
  interface Window {
    _HtmlView_Editor_: typeof _HtmlView_Editor_
    parseLines_ViewModel: typeof parseLines_ViewModel
    everything: typeof everything
  }
}
