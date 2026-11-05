import type { _Scene_ } from "../scene.ts"

export {
  prose
}

// an essay, each paragraph one long line, as prose is often written
const notebook = `On keeping a notebook at the bench

For years I kept everything in my head: which glue had been opened when, what the client had said about the finish, how far the oak had moved over the summer. It worked until it didn't, and the day it didn't was the day a drawer front I'd made twice came out a third time the wrong size, because I'd remembered the first measurement instead of the second.

The notebook that replaced my memory is nothing special. It's a stack of cheap paper on a clipboard, hung on a nail by the bench, with a pencil tied to it on a string. Anything that would cost me time to find out again goes on it, in whatever words come first, with the date at the top of the page.

What surprised me was how much of it I never read again. Most of the notes are written once and forgotten, and that's fine: writing them was the point, because writing a thing down is how I notice I've decided it. The few I do go back to are the ones that save a day, and a day saved a month pays for all the paper.

If there's a rule, it's to write the note before the work, not after. After, I remember what I meant to do; before, I still have to think about it.`

const prose: _Scene_ = {
  name: "prose",
  title: "Prose",
  look: "Paragraphs written as single long lines, as an essay often is, wrapped by the view at its width; the blank lines between them keep their height.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  model__HtmlView_Editor: { lines: notebook.split("\n").map((text) => ({ text })) },
}
