import type { _Scene_ } from "../scene.ts"
import { fieldNotes } from "./markdown.ts"

export {
  theme
}

const theme: _Scene_ = {
  name: "theme",
  title: "A host's theme",
  look: "The Markdown again, in a host's colours, font and spacing, set as the view's variables, as a dark editor theme would set them: none of the look is the view's own.",
  size: "tile",
  variables: {
    "--view-ground": "#1e1e1e",
    "--view-ink": "#d4d4d4",
    "--view-font": 'Menlo, Monaco, "Courier New", monospace',
    "--view-font-size": "12px",
    "--view-line-height": "1.5",
    "--view-tab-size": "8",
    "--view-padding": "0.5rem 0.75rem",
  },
  labels: [],
  invariants: [],
  model__HtmlView_Editor: { lines: fieldNotes.split("\n").map((text) => ({ text })) },
}
