import { examples } from "./examples/index.ts"
import { documents } from "./documents/index.ts"
import { scenes } from "./scenes/index.ts"
import { COMPONENTMAP__VIEW_TEXTEDITOR } from "../source/View_TextEditor.tsx"
import { _Viewer_TextEditor_ } from "../source/Viewer_TextEditor.ts"
import { LOOK_CHANGES } from "../source/looks/changes.ts"
import { MODULE_MOUSE } from "../source/modules/mouse.ts"
import type { _Entry_Log_, _Example_ } from "./example.ts"
import type { _Case_Document_, _Document_, _Status_Case_ } from "./document.ts"
import type { _Invariant_Scene_, _Scene_ } from "./scene.ts"

// the playground's page: the examples and documents listed beside the one
// asked for, an example (?example=<name>) shown with what it reports logged
// under it, a document (?document=<name>) with every case it enumerates
// drawn; or, with neither asked for, the gallery of every scene

const asked = new URLSearchParams(location.search).get("example")
const shown = examples.find((each) => each.name === asked)
const asked_Document = new URLSearchParams(location.search).get("document")
const shown_Document = documents.find((each) => each.name === asked_Document)

window.logged = []

const nav = document.createElement("nav")
const home = make("a", "home", "playground")
home.href = "/"
const list = document.createElement("ul")
for (const example of examples) {
  const link = make("a", "", example.title)
  link.href = `/?example=${encodeURIComponent(example.name)}`
  if (example === shown) link.setAttribute("aria-current", "page")
  const item = document.createElement("li")
  item.append(link)
  list.append(item)
}
const list_Documents = document.createElement("ul")
for (const each of documents) {
  const link = make("a", "", each.title)
  link.href = `/?document=${encodeURIComponent(each.name)}`
  if (each === shown_Document) link.setAttribute("aria-current", "page")
  const item = document.createElement("li")
  item.append(link)
  list_Documents.append(item)
}
nav.append(home, make("h2", "", "Examples"), list, make("h2", "", "Documents"), list_Documents)

const main = document.createElement("main")
document.body.append(nav, main)

if (shown !== undefined) show(shown)
else if (shown_Document !== undefined) showDocument(shown_Document)
else if (asked !== null) main.append(make("h1", "", "No such example"), make("p", "about", `There's no example called "${asked}".`))
else if (asked_Document !== null) main.append(make("h1", "", "No such document"), make("p", "about", `There's no document called "${asked_Document}".`))
else gallery()

// the example, its title and what to try over it, and what it reports under
function show(example: _Example_): void {
  document.title = `${example.title} · playground`
  const stage = make("section", "stage")
  const log = make("section", "log")
  const header = document.createElement("header")
  const clear = make("button", "", "Clear")
  clear.type = "button"
  header.append(make("h2", "", "Reported"), clear)
  const entries = document.createElement("ol")
  log.append(header, entries)
  main.append(make("h1", "", example.title), make("p", "about", example.about), stage, log)

  clear.addEventListener("click", () => {
    window.logged = []
    entries.replaceChildren()
  })
  example.mount(stage, (entry) => {
    window.logged.push(entry)
    entries.append(describe(entry))
    entries.scrollTop = entries.scrollHeight
  })
}

// a document: its title and what it enumerates, what's in it, section by
// section, with how many cases of each status, and what's still open; then
// every case, drawn, numbered through the document, to be found by its
// name in the address. The buttons show only the cases of one status, or
// those with a question open
function showDocument(shown_Document: _Document_): void {
  document.title = `${shown_Document.title} · playground`
  main.className = "document"
  const cases = shown_Document.sections.flatMap((section) => section.cases)
  const countOf = (status: _Status_Case_) => cases.filter((each) => each.status === status).length
  const opened = cases.filter((each) => each.open !== null)

  const contents = make("ol", "contents")
  for (const section of shown_Document.sections) {
    const link = make("a", "", section.title)
    link.href = `#${section.name}`
    const item = make("li", "")
    item.append(link, make("span", "count", `${section.cases.length}`))
    contents.append(item)
  }

  const questions = make("ul", "questions")
  for (const each of opened) {
    const link = make("a", "", each.title)
    link.href = `#${each.name}`
    const item = make("li", "")
    item.append(link, make("span", "question", ` ${each.open?.question ?? ""}`))
    questions.append(item)
  }

  const filters: Array<[string, string, (each: _Case_Document_) => boolean]> = [
    ["all", `All ${cases.length}`, () => true],
    ["normal", `Normal ${countOf("normal")}`, (each) => each.status === "normal"],
    ["edge", `Edge ${countOf("edge")}`, (each) => each.status === "edge"],
    ["planned", `Planned ${countOf("planned")}`, (each) => each.status === "planned"],
    ["open", `Open ${opened.length}`, (each) => each.open !== null],
  ]
  const filter = make("div", "filter")
  filter.setAttribute("role", "group")
  filter.setAttribute("aria-label", "Show cases")
  const drawn_Cases: Array<[_Case_Document_, HTMLElement]> = []
  const sections_Drawn: Array<HTMLElement> = []
  for (const [name, label, keeps] of filters) {
    const button = make("button", "", label)
    button.type = "button"
    button.dataset["filter"] = name
    button.setAttribute("aria-pressed", name === "all" ? "true" : "false")
    button.addEventListener("click", () => {
      for (const other of filter.querySelectorAll("button")) other.setAttribute("aria-pressed", other === button ? "true" : "false")
      for (const [each, article] of drawn_Cases) article.hidden = !keeps(each)
      for (const section of sections_Drawn) section.hidden = section.querySelector(".case:not([hidden])") === null
    })
    filter.append(button)
  }

  main.append(make("h1", "", shown_Document.title), make("p", "about", shown_Document.about), contents)
  if (opened.length > 0) main.append(make("h2", "", "Open questions"), questions)
  main.append(filter)

  let number = 0
  for (const section of shown_Document.sections) {
    const element = make("section", "cases")
    element.id = section.name
    element.append(make("h2", "", section.title), make("p", "about", section.about))
    for (const each of section.cases) {
      number++
      const article = drawCase(each, number)
      drawn_Cases.push([each, article])
      element.append(article)
    }
    sections_Drawn.push(element)
    main.append(element)
  }
}

// a case: its number and title, linking to itself, and its status; the
// viewer drawing what it's given, in the "changes" look, with the mouse,
// as the gallery's scenes are, or, for a case with nothing yet to
// draw, a note saying so; then what it shows, and what's open about it
function drawCase(
  each: _Case_Document_,
  number: number
): HTMLElement {
  const article = make("article", `case ${each.size}`)
  article.id = each.name
  article.dataset["status"] = each.status
  const head = make("header", "")
  const title = make("a", "title", each.title)
  title.href = `#${each.name}`
  head.append(make("span", "number", `${number}`), title, make("span", `status ${each.status}`, each.status))
  article.append(head)

  if (each.viewModel_TextEditor === null) {
    article.append(make("p", "undrawn", "Nothing to draw of it yet."))
  } else {
    const containerElement = document.createElement("div")
    containerElement.dataset["look"] = LOOK_CHANGES.name
    new _Viewer_TextEditor_({
      containerElement,
      componentMap: COMPONENTMAP__VIEW_TEXTEDITOR,
      modules: [MODULE_MOUSE],
      viewModel_TextEditor: each.viewModel_TextEditor
    })
    const drawn = make("div", "drawn")
    drawn.append(containerElement)
    article.append(drawn)
  }

  const notes = make("dl", "notes")
  notes.append(make("dt", "", "Shows"), make("dd", "", each.drawn))
  if (each.open !== null) notes.append(make("dt", "", "Open"), make("dd", "", each.open.question), make("dt", "", "Recommend"), make("dd", "", each.open.recommend))
  article.append(notes)
  return article
}

// with no example asked for, every scene, drawn side by side, to be checked
// by eye
function gallery(): void {
  document.title = "Gallery · playground"
  main.className = "gallery"
  const grid = make("div", "scenes")
  grid.append(...scenes.map(drawScene))
  main.append(
    make("h1", "", "Gallery"),
    make("p", "about", "Every scene, drawn by the view from what it's given, written by hand; under each title, what to check. First the main example, Everything, which the tests draw too; then proposals, while they're being worked out; then the simplest first."),
    grid,
  )
}

// a scene: its title, linking to itself, what to look for, and the view
// drawing what it's given, with the scene's own variables. Beside the view,
// when the scene has them, its lines' labels, and what must hold of it,
// checked live; pointing at either outlines the lines it's about, in a layer
// over the view, whose own elements are never touched
function drawScene(
  scene: _Scene_
): HTMLElement {
  const figure = make("figure", `scene ${scene.size}`)
  figure.id = scene.name
  for (const [variable, value] of Object.entries(scene.variables)) figure.style.setProperty(variable, value)
  const title = make("a", "title", scene.title)
  title.href = `#${scene.name}`
  const caption = document.createElement("figcaption")
  caption.append(title, make("span", "look", scene.look))

  // the viewer, drawing what it's given in the "changes" look, which the
  // playground, as host, has on for every scene, with the mouse, so
  // pointing at a proposal shows it
  const containerElement = document.createElement("div")
  containerElement.dataset["look"] = LOOK_CHANGES.name
  new _Viewer_TextEditor_({
    containerElement,
    componentMap: COMPONENTMAP__VIEW_TEXTEDITOR,
    modules: [MODULE_MOUSE],
    viewModel_TextEditor: scene.viewModel_TextEditor
  })
  const overlay = make("div", "overlay")
  const drawn = make("div", "drawn")
  drawn.append(containerElement, overlay)
  const labels = scene.labels.map((label) => make("div", "", label))
  const gutter = make("div", "labels")
  gutter.append(...labels)
  const checks = scene.invariants.map((invariant) => ({ invariant, ...drawInvariant(invariant) }))
  const list = make("ul", "invariants")
  list.append(...checks.map(({ item }) => item))
  const body = make("div", "body")
  body.append(gutter, drawn, list)
  figure.append(caption, body)

  const lineElements = () => [...containerElement.querySelectorAll(".line_htmlView")]
  const placesOf = (concerns: "every line" | Array<string>) =>
    concerns === "every line" ? lineElements().map((_, index) => index) : concerns.map((label) => scene.labels.indexOf(label))

  // the lines at these places outlined, and their labels lit
  const light = (places: Array<number>) => {
    const origin = drawn.getBoundingClientRect()
    overlay.replaceChildren(...lineElements().filter((_, index) => places.includes(index)).map((element) => {
      const line = element.getBoundingClientRect()
      const outline = make("div", "")
      outline.style.top = `${line.top - origin.top}px`
      outline.style.left = `${line.left - origin.left}px`
      outline.style.width = `${line.width}px`
      outline.style.height = `${line.height}px`
      return outline
    }))
    labels.forEach((label, index) => label.classList.toggle("lit", places.includes(index)))
  }
  const unlight = () => {
    light([])
    for (const { item } of checks) item.classList.remove("touches")
  }

  // pointing at an invariant outlines the lines it's about
  for (const { invariant, item } of checks) {
    const point = () => light(placesOf(invariant.concerns))
    item.addEventListener("mouseenter", point)
    item.addEventListener("focus", point)
    item.addEventListener("mouseleave", unlight)
    item.addEventListener("blur", unlight)
  }
  // pointing at a line outlines it, and marks the invariants about it;
  // pointing at a proposal is the editor's
  containerElement.addEventListener("mouseover", (event) => {
    const line = event.target instanceof Element ? event.target.closest(".line_htmlView") : null
    const place = line === null ? -1 : lineElements().indexOf(line)
    light(place === -1 ? [] : [place])
    for (const { invariant, item } of checks) item.classList.toggle("touches", placesOf(invariant.concerns).includes(place))
  })
  containerElement.addEventListener("mouseleave", unlight)

  // the labels placed beside their lines, and every invariant checked, once
  // the scene's laid out and its text underlays drawn, the frame after it's
  // first laid out, and again when fonts arrive or the window resizes
  const measure = () => {
    const top = gutter.getBoundingClientRect().top
    const row = getComputedStyle(containerElement.querySelector(".htmlView_editor") ?? containerElement).lineHeight
    labels.forEach((label, index) => {
      label.style.top = `${(lineElements()[index]?.getBoundingClientRect().top ?? top) - top}px`
      label.style.lineHeight = row
    })
    for (const { invariant, verdict, failing } of checks) {
      const names = invariant.failing(containerElement)
      verdict.textContent = names.length === 0 ? "✓" : "✗"
      verdict.className = names.length === 0 ? "verdict holds" : "verdict fails"
      failing.textContent = names.join(", ")
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(measure))
  document.fonts.ready.then(measure)
  window.addEventListener("resize", measure)
  return figure
}

// an invariant, as an item of the list beside its scene, focusable so the
// keyboard can point at it too: whether it holds, its name, and what fails it
function drawInvariant(
  invariant: _Invariant_Scene_
): _Drawn_Invariant_ {
  const item = make("li", "")
  item.tabIndex = 0
  const verdict = make("span", "verdict")
  const failing = make("span", "failing")
  item.append(verdict, make("span", "name", invariant.name), failing)
  return { item, verdict, failing }
}

// an invariant drawn: its item, and the parts of it filled in once it's checked
interface _Drawn_Invariant_ {
  item: HTMLLIElement
  verdict: HTMLSpanElement
  failing: HTMLSpanElement
}

// an entry as a line of its fields, each value as written in code, so a
// space or an empty string shows
function describe(entry: _Entry_Log_): HTMLLIElement {
  const item = document.createElement("li")
  for (const [field, value] of Object.entries(entry)) {
    const part = make("span", "field")
    part.append(make("span", "name", field), ` ${JSON.stringify(value)}`)
    item.append(part)
  }
  return item
}

function make<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, className: string, text = ""): HTMLElementTagNameMap[Tag] {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = text
  return element
}
