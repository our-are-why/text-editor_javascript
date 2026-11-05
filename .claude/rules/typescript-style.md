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
    _HtmlView_Editor_,
    type _Api__HtmlView_Editor_,
    type _ViewModel_Editor_
  }
  ```

- **Interfaces for object types.** `interface X { … }`, never
  `type X = { … }`, index signatures and options objects included. A union,
  or anything else an interface can't express, stays a `type` alias. A
  variant extends its base: `interface X extends Base<"kind">`.
- **Declarations in order of use.** A class first, then the types in the
  order it uses them, then the functions it calls.
- **One parameter to a line.** In every signature, each parameter, and each
  name of a destructured parameter, on its own line, no trailing comma. A
  call that passes an options object puts each property on its own line
  too.

  ```ts
  constructor({
    containerElement
  }: _Api__HtmlView_Editor_) {

  draw__HtmlView_Editor({
    viewModel_Editor,
    containerElement__HtmlView_Editor: this.containerElement
  })
  ```

- **Options objects.** A constructor, or a top-level function, takes one
  options object, typed `_Api__<Class>_` or `_Api___<function>_`, and
  destructures it in its signature. A method with a single input takes it
  plainly: `draw(viewModel_Editor)`.
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
- **Comments.** Match the file: `source/HtmlView_Editor.ts` has none.
