# Naming

Names say what a thing is, head first, then what it belongs to. Generic names
(`element`, `root`, `view`, `drawLine`) get renamed. Name new things by this
scheme from the start; when unsure, propose a name in it and ask. The user
renames freely: follow the code as it stands, not an older name.

- **Types and classes** are wrapped in underscores, head first, `_` before a
  qualifier: `_View_TextEditor_`, `_ViewModel_TextEditor_`,
  `_LINES_Block__ViewModel_`, `_Size_Scene_`. `__` comes before an owner
  that's itself a compound name: `_Api__View_TextEditor_`, the class's
  constructor options. A function's options object is `_Api___` and the
  function's name: `_Api___draw__View_TextEditor_`.
- **Values, fields, parameters and functions** have a camelCase head, `_`
  before a qualifier: `containerElement`, `divElement_line`,
  `viewModel_TextEditor`, `line_ViewModel`. `__` comes before a compound
  owner, which keeps its capitals when it names a class or type:
  `draw__View_TextEditor`, `rowsOf__Underlay_Text`, `labelOf__Range_Lines`.
- **Components**, the drawing's, are named head first, capitalised as JSX
  needs a component to be: what they draw, what that's part of, then
  `__Html`, what it's drawn in: `Block_TextEditor__Html`, a text editor's
  block; `Gutter_Line__Html`, a line's gutter; the whole editor is
  `TextEditor_Html`. One drawing a single kind for a dispatcher is named as
  that kind's variant of the dispatcher, the kind in capitals first, as the
  view model's variants are: `LINES_Block_TextEditor__Html`, for
  `Block_TextEditor__Html`, draws a `_LINES_Block__ViewModel_`. A kind of
  more than one word has its words in capitals joined by `_`, then `__`
  before what it's a variant of: `PROPOSAL_LIST__Section_Frame__Html` draws
  the kind `PROPOSAL_LIST`. Their props are options, as any function's are:
  `_Api___` and the component's name,
  `_Api___LINES_Block_TextEditor__Html_`. What they're drawn from, data,
  keeps the value scheme: `line_Run`, `gutter_Line`.
- **Component maps** are `_ComponentMap_` and what they draw:
  `_ComponentMap_Block_`, `_ComponentMap_Part_`, together
  `_ComponentMap__View_TextEditor_`, the editor's own
  `COMPONENTMAP__VIEW_TEXTEDITOR`; the class's own field and option
  `componentMap`, passed down the tree as `componentMap_View`. The
  components in one map take their data under one name, whatever their kind:
  `block_ViewModel`, `part_Frame`. A component looked up in one is
  `Component_Block`, capitalised as JSX needs. What isn't a kind, but a host
  may draw its own way, is one component beside the maps: `line`, every
  run's lines', looked up as `Component_Line`.
- **A class's own names are plain**: `containerElement`, `componentMap`.
  What it owns, handed to the top-level functions it gives work to, carries
  the view, `_View`, not the whole class's name: `containerElement_View`,
  `componentMap_View`. What it's given and doesn't own keeps its own name,
  whose it is: the view model is the editor's, a sibling of the view, not
  the view's, so `draw(viewModel_TextEditor)`, and it's handed on as
  `viewModel_TextEditor`.
- **Plurals** end in `$`, not an s, in the names that are ours:
  `segment$_Line`, `row$Of__Underlay_Text`, `TextUnderlay$_Line__Html`,
  `_Row$__Underlay_Text_`. Never in names that aren't: the DOM's
  (`childNodes`, `getClientRects`), JSX's (`children`), or a CSS class or
  data attribute (`underlays_htmlView`, `data-marks`), where a `$` would
  need escaping. So far in `source/View_TextEditor.tsx`; elsewhere, for
  now, an s.
- **One concept, one head.** The element a view draws into is a container
  everywhere, never a root.
- **Proofs**, branded primitives, are named for what they prove, head first:
  `_Text_Line_NonTerminated_`, its phantom symbol
  `proof__Text_Line_NonTerminated`. The field holding one keeps its plain
  name, `text`: the type carries the proof. The one function that makes it
  is its parser, `parseLines_ViewModel`.
- **Constants** in `source/` are all caps: `REGEXP_LINEBREAK`.
- **Files** are named after the class they hold, or, holding none, after
  what they hold: `source/View_TextEditor.tsx` and `.css`, the view,
  `_View_TextEditor_`, and its stylesheet;
  `source/ViewModel_TextEditor.ts`, the view model's types and parsers;
  `source/Jsx.ts`, the JSX runtime. A folder's list module is `index.ts`.
- **CSS classes** follow the value scheme: `htmlView_editor` on the view's
  own element, which it draws into the host's container, `line_htmlView` on
  a line. The variables are still `--view-*`.
