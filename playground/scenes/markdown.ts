import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

export {
  fieldNotes,
  markdown
}

// a short Markdown file, with a bit of everything Markdown has
const fieldNotes = `# Field notes

A small tool for keeping notes while you work, one file for each day.

## Install

\`\`\`sh
bun add field-notes
\`\`\`

## Use

- Start the day with \`notes today\`.
- Add a line with \`notes add "the glue needs a night to set"\`.
- Read back the week with \`notes week\`.

> Notes are plain text, kept on your own machine.

See [the guide](https://example.com/guide) for more, and *please* say if anything's odd.

| command | what it does               |
|---------|----------------------------|
| today   | opens today's file         |
| week    | prints the last seven days |`

const markdown: _Scene_ = {
  name: "markdown",
  title: "Markdown",
  look: "Markdown's source, as text: headings, a fenced block of code, a list, a quote, a link and a table, each shown as the characters it's written in, since no module gives any part of it a kind yet.",
  size: "tile",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text(fieldNotes, MODULE_PLAINTEXT)),
}
