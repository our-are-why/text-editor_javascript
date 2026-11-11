import type { _Invariant_Scene_, _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks } from "../../source/ViewModel_TextEditor.ts"
import type { _Line_Run_, _Group_Underlay_, _Underlay_Text_ } from "../../source/ViewModel_TextEditor.ts"
import { groupsOf__Lines, lineOf, textElementsIn } from "../lines.ts"
import { attributesOf__Link, attributesOf__Change, attributesOf__Marks } from "../looks.ts"

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
  line: _Line_Run_
}

// a link, and a change, the cases share
const link_guide = attributesOf__Link("https://example.com/guide")
const change_across = attributesOf__Change({ side: "after", kind: "inserted", source: "across" })

// two lines a text underlay runs across, from the middle of the first, on
// past its end, to the middle of the second
const text_underlayFrom = "a box from the middle of this line, on past its end"
const text_underlayTo = "into the next line, and on to the middle of it, then no further"

// every case the view's tests check, in one document
const cases_Everything: Array<_Case_Everything_> = [
  { label: "a plain line", line: lineOf("Everything the view draws, in one document.") },
  { label: "an empty line", line: lineOf("") },
  { label: "four spaces", line: lineOf("    indented by four spaces") },
  { label: "a tab", line: lineOf("\tindented by a tab, to the same place") },
  { label: "tabs between", line: lineOf("name\tkind\tnote") },
  { label: "spaces at the end", line: lineOf("spaces at the end of this line   ") },
  { label: "markup", line: lineOf("<b>not bold</b> &amp; <br> stay as they're written") },
  { label: "bold", line: lineOf("a word in ", { text: "bold", attributes: attributesOf__Marks("bold") }, " among plain ones") },
  { label: "italic inside bold", line: lineOf({ text: "bold, ", attributes: attributesOf__Marks("bold") }, { text: "bold and italic", attributes: attributesOf__Marks("bold", "italic") }, { text: ", bold again", attributes: attributesOf__Marks("bold") }) },
  { label: "a link", line: lineOf("see ", { text: "the guide", attributes: link_guide }, " for more") },
  { label: "bold across a link's edge", line: lineOf({ text: "a link, ", attributes: link_guide }, { text: "partly bold", attributes: { ...link_guide, ...attributesOf__Marks("bold") } }, { text: ", bold past it", attributes: attributesOf__Marks("bold") }) },
  { label: "code, highlighted, struck", line: lineOf({ text: "x = 1", attributes: attributesOf__Marks("monospace") }, ", ", { text: "highlighted", attributes: attributesOf__Marks("highlighted") }, ", ", { text: "struck", attributes: attributesOf__Marks("struck") }) },
  { label: "a change across marks", line: lineOf("a ", { text: "change over plain, ", attributes: change_across }, { text: "italic", attributes: { ...change_across, ...attributesOf__Marks("italic") } }, { text: " and ", attributes: change_across }, { text: "bold", attributes: { ...change_across, ...attributesOf__Marks("bold") } }, { text: " running on past it", attributes: attributesOf__Marks("bold") }) },
  { label: "a text underlay across a wrap", line: lineOf("words in a box from here, on past the end of the first row, to the second") },
  { label: "a text underlay across lines, from here", line: lineOf(text_underlayFrom) },
  { label: "a text underlay across lines, to here", line: lineOf(text_underlayTo) },
  { label: "accents", line: lineOf("café as one character, café as two") },
  { label: "emoji", line: lineOf("👍🏽 🇳🇿 👩‍👩‍👧 each made of several characters") },
  { label: "scripts", line: lineOf("Καλημέρα, Доброе утро, 早上好, こんにちは") },
  { label: "a long line of words", line: lineOf("A line of words long enough to be wider than the view, so it has to wrap, and carries on from the left edge on each row after the first.") },
  { label: "a run with nowhere to break", line: lineOf("https://example.com/a/path/with/nothing/to/break/at/anywhere/along/it") },
  { label: "an empty last line", line: lineOf("") },
]

// the text underlays behind the document: the change's proposal's, its
// target and its change, as a host's would be; then the boxes no change
// makes, one across a wrap, one from the middle of a line to the middle of
// the next
const groups_Everything: Array<_Group_Underlay_> = [
  ...groupsOf__Lines(cases_Everything.map(({ line }) => line)),
  {
    attributes: {},
    underlays: [{
      from: { line: placeOf("a text underlay across a wrap"), offset: 9 },
      to: { line: placeOf("a text underlay across a wrap"), offset: 60 },
      attributes: { "data-underlay": "targets" },
    }],
  },
  {
    attributes: {},
    underlays: [{
      from: { line: placeOf("a text underlay across lines, from here"), offset: 2 },
      to: { line: placeOf("a text underlay across lines, to here"), offset: text_underlayTo.indexOf(", then") },
      attributes: { "data-underlay": "targets" },
    }],
  },
]

// what must hold of the document once it's drawn, each measured from the
// container it's drawn in: in the gallery, live, and in the tests
const invariants_Everything: Array<_Invariant_Scene_> = [
  {
    name: "every line is an element of its own, in order, holding exactly its text",
    concerns: "every line",
    failing: (containerElement) => [
      ...textElementsIn(containerElement).flatMap((element, index) =>
        element.tagName === "DIV" &&
        element.className === "text_htmlView" &&
        element.parentElement?.className === "line_htmlView" &&
        element.textContent === textOf(cases_Everything[index]?.line)
          ? []
          : [labelAt(index)]
      ),
      ...cases_Everything.slice(textElementsIn(containerElement).length).map(({ label }) => `${label}, not drawn`),
    ],
  },
  {
    name: "each segment is drawn as one span, in order, carrying exactly its data",
    concerns: "every line",
    failing: (containerElement) =>
      cases_Everything.flatMap(({ label, line }, index) => {
        const textElement = textElementsIn(containerElement)[index] ?? containerElement
        const drawn = [...textElement.childNodes].map((node) => node instanceof Element ? { tag: node.localName, text: node.textContent, attributes: attributesOf(node) } : { tag: "", text: node.textContent, attributes: [] })
        const meant = line.segments.map((segment) => ({ tag: "span", text: segment.text, attributes: Object.entries(segment.attributes).toSorted() }))
        return JSON.stringify(drawn) === JSON.stringify(meant) ? [] : [label]
      }),
  },
  {
    name: "every line is a row tall or more, and an empty one exactly a row",
    concerns: "every line",
    failing: (containerElement) =>
      textElementsIn(containerElement).flatMap((element, index) =>
        rowsOf(element) >= 1 && (element.textContent !== "" || rowsOf(element) === 1) ? [] : [labelAt(index)]
      ),
  },
  {
    name: "nothing spills past the view",
    concerns: "every line",
    failing: (containerElement) => [
      ...textElementsIn(containerElement).flatMap((element, index) =>
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
    name: "a text underlay is drawn behind exactly its stretch of text, as one shape over every row it's on, on one line or across several",
    concerns: [...new Set(groups_Everything.flatMap((group) => group.underlays.flatMap((underlay_Text) => cases_Everything.slice(underlay_Text.from.line, underlay_Text.to.line + 1).map(({ label }) => label))))],
    failing: (containerElement) => [
      ...new Set(
        groups_Everything.flatMap((group, index_Group) =>
          group.underlays.flatMap((underlay_Text, index_Underlay) => {
            const pathElement = containerElement.querySelectorAll(".run_htmlView > .underlays_htmlView > .group_htmlView")[index_Group]?.children[index_Underlay]
            return pathElement instanceof SVGPathElement && shapeMatches(pathElement, rowsOf__Stretch(containerElement, underlay_Text)) ? [] : [labelAt(underlay_Text.from.line)]
          })
        )
      ),
    ],
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
  viewModel_TextEditor: viewModelOf__Blocks([{
    kind: "LINES",
    run: {
      id: "document",
      lines: cases_Everything.map(({ line }, index): _Line_Run_ => ({
        ...line,
        gutter: { label: String(index + 1), marker: "none" },
      })),
      groups: groups_Everything,
    },
  }]),
}

// a line's text: its segments', run together
function textOf(
  line: _Line_Run_ | undefined
): string {
  return (line?.segments ?? []).map((segment) => segment.text).join("")
}

// a drawn line's text, as the pieces it's drawn in, in order
function textsOf(
  lineElement: Element
): Array<Text> {
  const walker = document.createTreeWalker(lineElement, NodeFilter.SHOW_TEXT)
  const texts: Array<Text> = []
  while (walker.nextNode() !== null) texts.push(walker.currentNode as Text)
  return texts
}

// where a stretch of a line's text is drawn, as the browser lays it out: a
// rect for each piece of it, on each row it's on
function fragmentsOf(
  textElement: Element,
  from: number,
  to: number
): Array<DOMRect> {
  const texts = textsOf(textElement)
  return texts.flatMap((text, index) => {
    const start = texts.slice(0, index).reduce((length, each) => length + each.length, 0)
    const from_Text = Math.max(from, start) - start
    const to_Text = Math.min(to, start + text.length) - start
    if (from_Text >= to_Text) return []
    const range = document.createRange()
    range.setStart(text, from_Text)
    range.setEnd(text, to_Text)
    return [...range.getClientRects()]
  })
}

// a row of a stretch of text, as it's drawn: from its first character's
// left edge to its last's right, and the height of the row's middle
interface _Row_Stretch_ {
  left: number
  right: number
  middle: number
}

// each row a text underlay's stretch is on, on each line it runs across: on
// its first, from where it starts; on its last, to where it ends; on every
// one between, all of it
function rowsOf__Stretch(
  containerElement: HTMLElement,
  underlay_Text: _Underlay_Text_
): Array<_Row_Stretch_> {
  return textElementsIn(containerElement).slice(underlay_Text.from.line, underlay_Text.to.line + 1).flatMap((textElement, index) => {
    const line = underlay_Text.from.line + index
    const fragments = fragmentsOf(textElement, line === underlay_Text.from.line ? underlay_Text.from.offset : 0, line === underlay_Text.to.line ? underlay_Text.to.offset : Infinity)
    const top = textElement.getBoundingClientRect().top
    const height = parseFloat(getComputedStyle(textElement).lineHeight)
    return [...Map.groupBy(fragments, (fragment) => Math.floor((fragment.top + fragment.height / 2 - top) / height))].map(([row, on]) => ({
      left: Math.min(...on.map((fragment) => fragment.left)),
      right: Math.max(...on.map((fragment) => fragment.right)),
      middle: top + (row + 0.5) * height,
    }))
  })
}

// whether a path is exactly a stretch's shape: one shape, holding each row
// of the stretch from its first character to its last, and nothing beside
// it on either side, to within a pixel
function shapeMatches(
  pathElement: SVGPathElement,
  rows: Array<_Row_Stretch_>
): boolean {
  const origin = (pathElement.ownerSVGElement ?? pathElement).getBoundingClientRect()
  const inside = (x: number, y: number) => pathElement.isPointInFill(new DOMPoint(x - origin.left, y - origin.top))
  return (
    rows.length > 0 &&
    (pathElement.getAttribute("d")?.match(/M/g) ?? []).length === 1 &&
    rows.every((row) => inside(row.left + 1, row.middle) && inside(row.right - 1, row.middle) && !inside(row.left - 1, row.middle) && !inside(row.right + 1, row.middle))
  )
}

// an element's attributes, as names and values, in order of name
function attributesOf(
  element: Element
): Array<[string, string]> {
  return [...element.attributes].map((attribute): [string, string] => [attribute.name, attribute.value]).toSorted()
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
  return textElementsIn(containerElement)[cases_Everything.findIndex((each) => each.label === label)] ?? containerElement
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
  const [text] = textsOf(element)
  const index = text?.data.search(/[^ \t]/) ?? -1
  if (text === undefined || index === -1) return 0
  const range = document.createRange()
  range.setStart(text, index)
  range.setEnd(text, index + 1)
  return range.getBoundingClientRect().left - element.getBoundingClientRect().left
}

// a case's place in the document, by its label
function placeOf(
  label: string
): number {
  return cases_Everything.findIndex((each) => each.label === label)
}
