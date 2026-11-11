# TypeScript style

For all the TypeScript we write here: `source/`, `playground/`, `scripts/`,
`tests/`. Text that only looks like code, such as the TypeScript sample in a
scene's template literal, is content: leave it as written.

- **No semicolons.** End statements, fields and type members with a newline.
  Keep one only where a line starting with `(`, `[` or a backtick would
  otherwise join the line before it. TypeScript 7 is the native compiler,
  with no JS API, so a bulk change needs a scanner that skips strings,
  templates and comments, checked by comparing `Bun.Transpiler` output
  before and after.
- **Exports hoisted.** Never put `export` on a declaration. Each file has one
  `export { … }` right after its imports (at the very top if it has none):
  one name per line, types marked `type`, no trailing comma. No default
  exports.

  ```ts
  export {
    _View_TextEditor_,
    type _Api__View_TextEditor_,
    type _ViewModel_TextEditor_
  }
  ```

- **Interfaces for object types.** `interface X { … }`, never
  `type X = { … }`, index signatures and options objects included. A union,
  or anything else an interface can't express, stays a `type` alias. A
  variant extends its base: `interface X extends Base<"kind">`.
- **Declarations in order of use.** A class first, then the types in the
  order it uses them, then the functions it calls. Depth first, from the
  file's entry, as `draw__View_TextEditor` is its file's: what a
  declaration uses comes right after it, an options or props type just
  before its function, before the next thing its user uses.
- **Imports in order of use.** An import's names in the order they're first
  met reading the file from its entry down, never alphabetical.
- **One to a line.** Wherever there's more than one, each on its own line,
  no trailing comma: parameters, in every signature, arrow functions' and
  function types' too; the names of a destructuring; a call's arguments,
  type arguments too; an object's properties; an array's items; a JSX
  tag's attributes and props; an import's names. One alone stays on its
  line. Why: what's past the start of a line isn't seen reading down the
  left edge, as `getCharCount_Max__Label_Gutter` wasn't, called in a
  `<div>`'s `style` between its `class` and its `ref`, which made the
  file's order look wrong.

  ```ts
  constructor({
    containerElement
  }: _Api__View_TextEditor_) {

  draw__View_TextEditor({
    viewModel_TextEditor,
    containerElement_View: this.containerElement
  })
  ```

- **Options objects.** A constructor, or a top-level function, takes one
  options object, typed `_Api__<Class>_` or `_Api___<function>_`, and
  destructures it in its signature. A method with a single input takes it
  plainly: `draw(viewModel_TextEditor)`.
- **No defaults.** What a function, component or constructor takes, it's
  given: no optional options, no default values, nothing falling back to
  the editor's own when a caller says nothing. A caller passes even what
  the editor ships, as a host passes `COMPONENTMAP__VIEW_TEXTEDITOR`, and
  `MODULE_PLAINTEXT` for text with no syntax.
- **Plain classes.** Classes are for what holds state, the DOM and
  listeners; data stays plain. Fields are ordinary: no `#private`, no
  TypeScript `private`, no `readonly`. Encapsulation isn't enforced; things
  are used appropriately.
- **`this` once assigned.** After `this.x = x`, read `this.x`, never the
  argument: a constructor's destructured names are only for assigning
  fields.
- **Constants in `source/` are all caps**, keeping the `_` between head and
  qualifier: `REGEXP_LINEBREAK`. Constants elsewhere keep camelCase, for
  now.
- **Comments.** Match the file: `source/ViewModel_TextEditor.ts`,
  `source/View_TextEditor.tsx` and `source/Jsx.ts` have none.
- **JSX for drawing.** Elements are written in JSX, which `source/Jsx.ts`
  makes into descriptions, as Preact does, and `draw__Node_Jsx` draws into a
  container: tags with string attributes, and components. An `<svg>`, and
  what's drawn in one, or into one, is made in SVG's namespace; what's in
  its `<foreignObject>`, in HTML's again. A node, what a child or a
  component gives, is a description, text, a DOM node made elsewhere,
  `null`, `undefined`, a boolean, or an array of them; nothing, `true` and
  `false` draw nothing. No keys, no fragments, which `tsc` rejects. A
  component is a function of its props, destructured in its signature,
  returning `JSX.Element`, or the node it gives when it gives something
  else: text, or nothing. Given more than one prop or attribute, a tag puts
  each on its own line. A `ref` only takes its element, as a reference;
  nothing's done in one: what's done to elements once they're drawn, text
  underlays measured, the class does, after it draws, where it's seen. Its
  exports, `jsx`, `jsxs`, `jsxDEV` and `JSX`, and the props `children` and
  `ref`, are JSX's names, not ours.
- **Maps, not switches, for kinds.** A union's kinds are drawn by looking
  each one's component up in a component map typed by kind,
  `componentMap_View.block[block_ViewModel.kind]`, in a component generic
  over the kind, so `tsc` checks it without a cast; never by a switch. Each
  entry gives a node, `_Node_Jsx_`. The maps are passed down the tree, never
  imported where they're used, so a host's own components draw wherever the
  editor's would: a frame's lines too, drawn by the map's `line`, as every
  run's lines are. Kinds are string literals in capitals, as their variants'
  names are, `LINES`, `CURRENT_LINES`, defined once, in their union; a map's
  keys and a constructor's `kind` spell them out, checked against it, with
  no constants for them. Where the choice is only how something reads, as a
  gutter label's text, or the gutter's width, the view model decides it, and
  the view draws what it's given.
