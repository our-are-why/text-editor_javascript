import "../source/perspectives/changes.css"
import { examples } from "./examples/index.ts"
import { scenes } from "./scenes/index.ts"
import { _View_TextEditor_, COMPONENTMAP__VIEW_TEXTEDITOR } from "../source/View_TextEditor.tsx"
import type { _Entry_Log_, _Example_ } from "./example.ts"
import type { _Invariant_Scene_, _Scene_ } from "./scene.ts"

// the playground's page: the examples listed beside the one asked for
// (?example=<name>), shown with what it reports logged under it; or, with
// none asked for, the gallery of every scene

const asked = new URLSearchParams(location.search).get("example")
const shown = examples.find((each) => each.name === asked)

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
nav.append(home, list)

const main = document.createElement("main")
document.body.append(nav, main)

if (shown !== undefined) show(shown)
else if (asked !== null) main.append(make("h1", "", "No such example"), make("p", "about", `There's no example called "${asked}".`))
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

  // the view, in the "changes" perspective, which the playground, as host,
  // has on for every scene
  const containerElement = document.createElement("div")
  containerElement.dataset["perspective"] = "changes"
  new _View_TextEditor_({
    containerElement,
    componentMap: COMPONENTMAP__VIEW_TEXTEDITOR
  }).draw(scene.viewModel_TextEditor)
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
  // a proposal's changes outlined, each row of each
  const lightSource = (source: string) => {
    const origin = drawn.getBoundingClientRect()
    const changes = [...containerElement.querySelectorAll(`.text_htmlView [data-source="${CSS.escape(source)}"]`)]
    overlay.replaceChildren(...changes.flatMap((element) => [...element.getClientRects()].map((row) => {
      const outline = make("div", "")
      outline.style.top = `${row.top - origin.top}px`
      outline.style.left = `${row.left - origin.left}px`
      outline.style.width = `${row.width}px`
      outline.style.height = `${row.height}px`
      return outline
    })))
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
  // pointing at a change outlines all of its proposal's changes; pointing at
  // a line outlines it, and marks the invariants about it
  containerElement.addEventListener("mouseover", (event) => {
    const source = event.target instanceof Element ? event.target.closest("[data-source]")?.getAttribute("data-source") : null
    if (typeof source === "string") {
      unlight()
      lightSource(source)
      return
    }
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
