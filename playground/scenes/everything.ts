import type { _Invariant_Scene_, _Scene_ } from "../scene.ts"
import { parseLines_ViewModel } from "../../source/HtmlView_Editor.ts"

export {
  type _Case_Everything_,
  cases_Everything,
  invariants_Everything,
  everything
}

// a line of the document, and the case it's there for, which it's labelled
// with in the gallery, and named by when it fails
interface _Case_Everything_ {
  label: string
  text: string
}

// every case the view's tests check, in one document
const cases_Everything: Array<_Case_Everything_> = [
  { label: "a plain line", text: "Everything the view draws, in one document." },
  { label: "an empty line", text: "" },
  { label: "four spaces", text: "    indented by four spaces" },
  { label: "a tab", text: "\tindented by a tab, to the same place" },
  { label: "tabs between", text: "name\tkind\tnote" },
  { label: "spaces at the end", text: "spaces at the end of this line   " },
  { label: "markup", text: "<b>not bold</b> &amp; <br> stay as they're written" },
  { label: "accents", text: "café as one character, café as two" },
  { label: "emoji", text: "👍🏽 🇳🇿 👩‍👩‍👧 each made of several characters" },
  { label: "scripts", text: "Καλημέρα, Доброе утро, 早上好, こんにちは" },
  { label: "a long line of words", text: "A line of words long enough to be wider than the view, so it has to wrap, and carries on from the left edge on each row after the first." },
  { label: "a run with nowhere to break", text: "https://example.com/a/path/with/nothing/to/break/at/anywhere/along/it" },
  { label: "an empty last line", text: "" },
]

// what must hold of the document once it's drawn, each measured from the
// container it's drawn in: in the gallery, live, and in the tests
const invariants_Everything: Array<_Invariant_Scene_> = [
  {
    name: "every line is an element of its own, in order, holding exactly its text",
    concerns: "every line",
    failing: (containerElement) => [
      ...[...containerElement.children].flatMap((element, index) =>
        element.tagName === "DIV" &&
        element.className === "line_htmlView" &&
        element.childElementCount === 0 &&
        element.textContent === cases_Everything[index]?.text
          ? []
          : [labelAt(index)]
      ),
      ...cases_Everything.slice(containerElement.children.length).map(({ label }) => `${label}, not drawn`),
    ],
  },
  {
    name: "every line is a row tall or more, and an empty one exactly a row",
    concerns: "every line",
    failing: (containerElement) =>
      [...containerElement.children].flatMap((element, index) =>
        rowsOf(element) >= 1 && (element.textContent !== "" || rowsOf(element) === 1) ? [] : [labelAt(index)]
      ),
  },
  {
    name: "nothing spills past the view",
    concerns: "every line",
    failing: (containerElement) => [
      ...[...containerElement.children].flatMap((element, index) =>
        element.scrollWidth > element.clientWidth ? [labelAt(index)] : []
      ),
      ...(containerElement.scrollWidth > containerElement.clientWidth ? ["the view"] : []),
    ],
  },
  {
    name: "a line too long for the view wraps inside it, between words, or anywhere when it has none",
    concerns: ["a long line of words", "a run with nowhere to break"],
    failing: (containerElement) =>
      ["a long line of words", "a run with nowhere to break"].filter((label) => rowsOf(lineElementOf(containerElement, label)) <= 1),
  },
  {
    name: "a tab reaches the same stop as four spaces",
    concerns: ["four spaces", "a tab"],
    failing: (containerElement) => {
      const spaces = indentOf(lineElementOf(containerElement, "four spaces"))
      const tab = indentOf(lineElementOf(containerElement, "a tab"))
      return spaces > 0 && Math.abs(tab - spaces) < 0.5 ? [] : ["a tab"]
    },
  },
]

const everything: _Scene_ = {
  name: "everything",
  title: "Everything",
  look: "Every case the view's tests check, in one document, at the narrow width they check it at, each line labelled with the case it's there for. Beside it, what must hold of it, checked live in this browser by the same code the tests run: point at one to outline the lines it's about, or at a line to see what's checked of it.",
  size: "narrow",
  variables: {},
  labels: cases_Everything.map(({ label }) => label),
  invariants: invariants_Everything,
  model__HtmlView_Editor: { lines: cases_Everything.flatMap(({ text }) => parseLines_ViewModel(text)) },
}

// a line's label, by its place, or where it is when it's past the document's
// end
function labelAt(
  index: number
): string {
  return cases_Everything[index]?.label ?? `line ${index + 1}, past the document's end`
}

// the element a line is drawn in, by its label, or the container itself when
// it isn't drawn, which then fails what's checked of the line
function lineElementOf(
  containerElement: HTMLElement,
  label: string
): Element {
  return containerElement.children[cases_Everything.findIndex((each) => each.label === label)] ?? containerElement
}

// how many rows a line takes, at its line height
function rowsOf(
  element: Element
): number {
  return Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight))
}

// how far from its element's left edge a line's first character that isn't a
// space or a tab is drawn; 0 for a line with none
function indentOf(
  element: Element
): number {
  const text = element.firstChild
  const index = text?.textContent?.search(/[^ \t]/) ?? -1
  if (text === null || index === -1) return 0
  const range = document.createRange()
  range.setStart(text, index)
  range.setEnd(text, index + 1)
  return range.getBoundingClientRect().left - element.getBoundingClientRect().left
}
