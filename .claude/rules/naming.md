# Naming

Names say what a thing is, head first, then what it belongs to. Generic names
(`element`, `root`, `view`, `drawLine`) get renamed. Name new things by this
scheme from the start; when unsure, propose a name in it and ask. The user
renames freely: follow the code as it stands, not an older name.

- **Types and classes** are wrapped in underscores, head first, `_` before a
  qualifier: `_HtmlView_Editor_`, `_ViewModel_Editor_`, `_Line_ViewModel_`,
  `_Size_Scene_`. `__` comes before an owner that's itself a compound name:
  `_Api__HtmlView_Editor_`, the class's constructor options. A function's
  options object is `_Api___` and the function's name:
  `_Api___draw__HtmlView_Editor_`.
- **Values, fields, parameters and functions** have a camelCase head, `_`
  before a qualifier: `containerElement`, `divElement_line`,
  `viewModel_Editor`, `line_ViewModel`. `__` comes before a compound owner,
  which keeps its capitals when it names a class or type:
  `draw__HtmlView_Editor`, `toHtmlElement__Line_ViewModel`,
  `model__HtmlView_Editor`.
- **A class's own names are plain**: `containerElement`,
  `draw(viewModel_Editor)`. The top-level function it hands work to carries
  the owner on what it takes from the class: `containerElement__HtmlView_Editor`.
- **One concept, one head.** The element a view draws into is a container
  everywhere, never a root.
- **Proofs**, branded primitives, are named for what they prove, head first:
  `_Text_Line_NonTerminated_`, its phantom symbol
  `proof__Text_Line_NonTerminated`. The field holding one keeps its plain
  name, `text`: the type carries the proof. The one function that makes it
  is its parser, `parseLines_ViewModel`.
- **Constants** in `source/` are all caps: `REGEXP_LINEBREAK`.
- **Files** are named after the class they hold: `source/HtmlView_Editor.ts`
  and `.css`. A folder's list module is `index.ts`.
- **CSS classes** follow the value scheme: `htmlView_editor` on the
  container, `line_htmlView` on a line. The variables are still `--view-*`.
