import { afterAll, describe, expect, test } from "bun:test"
import fc from "fast-check"
import { everything } from "../../playground/scenes/everything.ts"
import { parseTexts_Line, type _Segment_Line_ } from "../../source/ViewModel_TextEditor.ts"
import fixture from "./fixtures/HtmlView_Editor.html"
import { openFixture } from "./harness.ts"

// opened as the file loads: if it can't be, the file fails with why, and
// there's nothing to close
const opened = await openFixture(fixture)
afterAll(() => opened.close())

// the main example, the gallery's Everything scene, drawn once at the
// gallery's narrow width, and each of its invariants checked in the page by
// the same code the gallery runs: what fails it, by name
const failing = await opened.page.evaluate(() => {
  const containerElement = document.createElement("div")
  containerElement.style.width = "18rem"
  document.body.append(containerElement)
  new window._View_TextEditor_({
    containerElement,
    componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
  }).draw(window.everything.viewModel_TextEditor)
  return Object.fromEntries(window.everything.invariants.map((invariant) => [invariant.name, invariant.failing(containerElement)]))
})

describe("the main example, Everything: what must hold of it, as the gallery checks it", () => {
  for (const { name } of everything.invariants) {
    test(name, () => {
      expect(failing[name]).toEqual([])
    })
  }
})

describe("beside it: what can't live in one document", () => {
  test("draws its own element into the container, once however often it draws, leaving the container as the host made it", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.className = "host"
      document.body.append(containerElement)
      const view_TextEditor = new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      })
      for (const _ of [1, 2]) view_TextEditor.draw(window.viewModelOf__Blocks([]))
      return {
        container: [...containerElement.attributes].map((attribute) => `${attribute.name}=${attribute.value}`),
        children: [...containerElement.children].map((element) => element.className)
      }
    })
    expect(drawn).toEqual({ container: ["class=host"], children: ["htmlView_editor"] })
  })

  test("drawing again replaces what was drawn", async () => {
    const lines = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      const view_TextEditor = new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      })
      for (const multilineText of ["one\ntwo\nthree", "four"]) view_TextEditor.draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "document", lines: window.parseLines_ViewModel({ multilineText, module_Language: window.MODULE_PLAINTEXT }), groups: [] } }]))
      return [...containerElement.querySelectorAll(".text_htmlView")].map((element) => element.textContent)
    })
    expect(lines).toEqual(["four"])
  })

  test("a host's own components draw in place of the editor's, wherever what they draw is", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      const lineOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]
      new window._View_TextEditor_({
        containerElement,
        componentMap: {
          block: window.COMPONENTMAP__VIEW_TEXTEDITOR.block,
          line: ({ line_Run }) => {
            const pElement_line = document.createElement("p")
            pElement_line.className = "line_host"
            pElement_line.textContent = line_Run.segments.map((segment) => segment.text).join("")
            return pElement_line
          },
          part: {
            ...window.COMPONENTMAP__VIEW_TEXTEDITOR.part,
            PROPOSAL_LIST: () => {
              const asideElement_proposals = document.createElement("aside")
              asideElement_proposals.className = "proposals_host"
              return asideElement_proposals
            }
          }
        }
      }).draw(window.viewModelOf__Blocks([
        { kind: "LINES", run: { id: "before", lines: [lineOf("one")], groups: [] } },
        {
          kind: "FRAME",
          range: { first: 2, last: 2 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: [lineOf("two")], groups: [] } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [lineOf("two, proposed")], groups: [] } },
            { kind: "PROPOSAL_LIST", items: [{ source: "most", title: "Most of the orders", places: "", rationale: "", actions: [], attributes: {} }] }
          ]
        },
        { kind: "LINES", run: { id: "after", lines: [lineOf("three")], groups: [] } }
      ]))
      return {
        lines_host: [...containerElement.querySelectorAll(".line_host")].map((element) => element.textContent),
        lines_editor: containerElement.querySelectorAll(".line_htmlView").length,
        proposals_host: containerElement.querySelectorAll(".frame_htmlView > .proposals_host").length,
        proposals_editor: containerElement.querySelectorAll(".proposals_htmlView").length
      }
    })
    expect(drawn).toEqual({
      lines_host: ["one", "two", "two, proposed", "three"],
      lines_editor: 0,
      proposals_host: 1,
      proposals_editor: 0
    })
  })

  test("when a host's components leave out what a run's text underlays are measured by, it says so, and draws none of them; a run with nothing behind it says nothing", async () => {
    const warned = await opened.page.evaluate(() => {
      const group = { attributes: {}, underlays: [{ from: { line: 0, offset: 0 }, to: { line: 1, offset: 3 }, attributes: { "data-underlay": "box" } }] }
      const pElementOf = ({ line_Run }: { line_Run: { segments: Array<{ text: string }> } }) => {
        const pElement_line = document.createElement("p")
        pElement_line.textContent = line_Run.segments.map((segment) => segment.text).join("")
        return pElement_line
      }
      const drawnWith = (
        componentMap: typeof window.COMPONENTMAP__VIEW_TEXTEDITOR,
        groups: Array<typeof group>
      ) => {
        const warnings: Array<string> = []
        const warn = console.warn
        console.warn = (message: string) => {
          warnings.push(message)
        }
        const containerElement = document.createElement("div")
        try {
          new window._View_TextEditor_({
            containerElement,
            componentMap
          }).draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "document", lines: window.parseLines_ViewModel({ multilineText: "one\ntwo", module_Language: window.MODULE_PLAINTEXT }), groups } }]))
        } finally {
          console.warn = warn
        }
        return { warnings, paths: containerElement.querySelectorAll(".underlay_htmlView").length }
      }
      return {
        lines_host: drawnWith({ ...window.COMPONENTMAP__VIEW_TEXTEDITOR, line: pElementOf }, [group]),
        run_host: drawnWith({ ...window.COMPONENTMAP__VIEW_TEXTEDITOR, block: { ...window.COMPONENTMAP__VIEW_TEXTEDITOR.block, LINES: () => document.createElement("div") } }, [group]),
        nothing_behind: drawnWith({ ...window.COMPONENTMAP__VIEW_TEXTEDITOR, line: pElementOf }, [])
      }
    })
    expect(warned).toEqual({
      lines_host: {
        warnings: [`the text underlays of the run "document" aren't drawn: 0 of its 2 lines are a .line_htmlView right inside it with a .text_htmlView right inside that, which a host's component drawing a line has to keep`],
        paths: 0
      },
      run_host: {
        warnings: [`the text underlays of the run "document" aren't drawn: there's no .run_htmlView[data-run="document"] with its <svg class="underlays_htmlView">, which a host's component drawing the run has to keep`],
        paths: 0
      },
      nothing_behind: { warnings: [], paths: 0 }
    })
  })

  test("pointing with the mouse at a proposal's change, or its item, marks its groups and items, wherever they are, drawn on the next frame; pointing where nothing changes draws nothing again; and pointing away marks none", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "pointing"
      containerElement.style.width = "40rem"
      document.body.prepend(containerElement)
      const [line] = window.parseLines_ViewModel({ multilineText: "half the orders", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = line.segments
      if (segment === undefined) throw new Error("the line has no segment")
      const change = { "data-change": "replaced", "data-side": "before", "data-source": "most" }
      new window._TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 1 },
          parts: [
            {
              kind: "CURRENT_LINES",
              run: {
                id: "current",
                lines: [{ ...line, segments: [{ ...segment, attributes: change }] }],
                groups: [
                  { attributes: { "data-source": "most" }, underlays: [{ from: { line: 0, offset: 0 }, to: { line: 0, offset: 4 }, attributes: change }] },
                  { attributes: { "data-source": "all" }, underlays: [] }
                ]
              }
            },
            {
              kind: "PROPOSAL_LIST",
              items: [
                { source: "most", title: "Most of the orders", places: "", rationale: "", actions: [], attributes: {} },
                { source: "all", title: "All of them", places: "", rationale: "", actions: [], attributes: {} }
              ]
            }
          ]
        }])
      })
    })
    const pointed = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const containerElement = document.getElementById("pointing")
      const rootElement = containerElement?.querySelector(".htmlView_editor")
      const drawnAgain = rootElement?.getAttribute("data-seen") === null
      rootElement?.setAttribute("data-seen", "")
      return {
        pointed: [...(containerElement?.querySelectorAll("[data-pointed]") ?? [])].map((element) => `${element.localName} ${element.getAttribute("data-source")}`),
        drawnAgain
      }
    })
    const middleOf = (selector: string) => opened.page.evaluate((selector) => {
      const rect = document.querySelector(`#pointing ${selector}`)?.getBoundingClientRect()
      if (rect === undefined) throw new Error(`nothing at ${selector}`)
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }, selector)
    const at = async (selector: string) => {
      const point = await middleOf(selector)
      await opened.page.mouse.move(point.x, point.y)
    }
    expect(await pointed()).toEqual({ pointed: [], drawnAgain: true })
    await at(`.text_htmlView [data-source="most"]`)
    expect(await pointed()).toEqual({ pointed: ["g most", "li most"], drawnAgain: true })
    await at(`.item_htmlView[data-source="most"] .title_htmlView`)
    expect(await pointed()).toEqual({ pointed: ["g most", "li most"], drawnAgain: false })
    await at(`.item_htmlView[data-source="all"] .title_htmlView`)
    expect(await pointed()).toEqual({ pointed: ["g all", "li all"], drawnAgain: true })
    await opened.page.mouse.move(1270, 715)
    expect(await pointed()).toEqual({ pointed: [], drawnAgain: true })
    await opened.page.evaluate(() => document.getElementById("pointing")?.remove())
  })

  test("each proposal's item shows its title, where it is, why it's proposed, and its actions, each a button carrying its command, where it is and why only when they say something", async () => {
    const items = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "FRAME",
        range: { first: 1, last: 1 },
        parts: [
          { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
          {
            kind: "PROPOSAL_LIST",
            items: [
              { source: "most", title: "Most of the orders", places: "2 of 5 places, 1 only if “Cut the lathe” is rejected", rationale: "Most of them need the lathe.", actions: [{ command: "accept", label: "Accept" }, { command: "reject", label: "Reject" }], attributes: {} },
              { source: "all", title: "All of them", places: "", rationale: "", actions: [{ command: "accept", label: "Take it" }], attributes: {} }
            ]
          }
        ]
      }]))
      return [...containerElement.querySelectorAll(".item_htmlView")].map((itemElement) => ({
        source: itemElement.getAttribute("data-source"),
        shown: [...itemElement.children].filter((element) => getComputedStyle(element).display !== "none").map((element) => element.className),
        title: itemElement.querySelector(".title_htmlView")?.textContent,
        places: itemElement.querySelector(".places_htmlView")?.textContent,
        rationale: itemElement.querySelector(".rationale_htmlView")?.textContent,
        actions: [...itemElement.querySelectorAll(".actions_htmlView > button")].map((buttonElement) => `${buttonElement.getAttribute("type")} ${buttonElement.getAttribute("data-command")}: ${buttonElement.textContent}`)
      }))
    })
    expect(items).toEqual([
      { source: "most", shown: ["title_htmlView", "places_htmlView", "rationale_htmlView", "actions_htmlView"], title: "Most of the orders", places: "2 of 5 places, 1 only if “Cut the lathe” is rejected", rationale: "Most of them need the lathe.", actions: ["button accept: Accept", "button reject: Reject"] },
      { source: "all", shown: ["title_htmlView", "actions_htmlView"], title: "All of them", places: "", rationale: "", actions: ["button accept: Take it"] }
    ])
  })

  test("what JSX draws: a description as its element, text as text, a node made elsewhere as itself, an array as what's in it, nothing as nothing", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      const spanElement_made = document.createElement("span")
      spanElement_made.textContent = "made"
      window.draw__Node_Jsx({
        node_Jsx: window.jsx("p", {
          class: "drawn",
          children: [
            "text, ",
            null,
            undefined,
            false,
            true,
            [window.jsx("em", { children: "nested" })],
            window.jsx(() => ", given", {}),
            window.jsx(() => null, {}),
            window.jsx(() => spanElement_made, {}),
            window.jsx(() => [", several", [", nested"], window.jsx("b", { children: ", at once" })], {})
          ]
        }),
        containerElement
      })
      return containerElement.innerHTML
    })
    expect(drawn).toBe(`<p class="drawn">text, <em>nested</em>, given<span>made</span>, several, nested<b>, at once</b></p>`)
  })

  test("what JSX draws in an svg is SVG's, in SVG's namespace, as is what's drawn into one, and what's in a foreignObject is HTML's again", async () => {
    const namespaces = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      window.draw__Node_Jsx({
        node_Jsx: window.jsx("svg", {
          children: [
            window.jsx("g", { children: window.jsx("path", { d: "M 0 0 L 1 1 Z" }) }),
            window.jsx("foreignObject", { children: window.jsx("p", { children: "text" }) })
          ]
        }),
        containerElement
      })
      const svgElement = containerElement.querySelector("svg")
      if (svgElement === null) throw new Error("the svg wasn't drawn")
      window.draw__Node_Jsx({
        node_Jsx: window.jsx("circle", { r: "1" }),
        containerElement: svgElement.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"))
      })
      return [...containerElement.querySelectorAll("*")].map((element) => `${element.localName} ${element.namespaceURI}`)
    })
    expect(namespaces).toEqual([
      "svg http://www.w3.org/2000/svg",
      "g http://www.w3.org/2000/svg",
      "path http://www.w3.org/2000/svg",
      "foreignObject http://www.w3.org/2000/svg",
      "p http://www.w3.org/1999/xhtml",
      "g http://www.w3.org/2000/svg",
      "circle http://www.w3.org/2000/svg"
    ])
  })

  test("each run of lines draws one svg behind its lines' text, a group for each of its groups, a path in it for each underlay, carrying its data", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines: window.parseLines_ViewModel({ multilineText: "one line\nand the next", module_Language: window.MODULE_PLAINTEXT }),
          groups: [{
            attributes: { "data-source": "most" },
            underlays: [
              { from: { line: 0, offset: 4 }, to: { line: 1, offset: 7 }, attributes: { "data-underlay": "box" } },
              { from: { line: 1, offset: 0 }, to: { line: 1, offset: 3 }, attributes: { "data-change": "inserted", "data-source": "most" } }
            ]
          }]
        }
      }]))
      const runElement = containerElement.querySelector(".run_htmlView")
      const svgElement = runElement?.firstElementChild
      if (!(svgElement instanceof SVGSVGElement)) throw new Error("the run's svg wasn't drawn first in it")
      return {
        run: runElement?.getAttribute("data-run"),
        svgs: containerElement.querySelectorAll(".run_htmlView > svg").length,
        lines: runElement?.querySelectorAll(":scope > .line_htmlView").length,
        isolated: runElement === null ? "" : getComputedStyle(runElement).isolation,
        stacked: [
          getComputedStyle(svgElement).zIndex,
          getComputedStyle(runElement?.querySelector(".text_htmlView") ?? svgElement).zIndex
        ],
        groups: [...svgElement.children].map((groupElement) => ({
          tag: groupElement.localName,
          source: groupElement.getAttribute("data-source"),
          paths: [...groupElement.children].map((pathElement) => ({
            tag: pathElement instanceof SVGPathElement ? "path" : pathElement.localName,
            attributes: [...pathElement.attributes].map((attribute) => attribute.name).filter((name) => name.startsWith("data-")),
            shapes: (pathElement.getAttribute("d")?.match(/M/g) ?? []).length,
            fill: getComputedStyle(pathElement).fill
          }))
        }))
      }
    })
    expect(drawn).toEqual({
      run: "document",
      svgs: 1,
      lines: 2,
      isolated: "isolate",
      stacked: ["0", "1"],
      groups: [{
        tag: "g",
        source: "most",
        paths: [
          { tag: "path", attributes: ["data-underlay"], shapes: 1, fill: "none" },
          { tag: "path", attributes: ["data-change", "data-source"], shapes: 1, fill: "none" }
        ]
      }]
    })
  })

  test("with room a perspective gives them, underlays reach past their words' ink into spaces and the row's ends, never into another character, staying clear of its ink, and never meet: rows over one another twice the block inset apart, as are rings beside each other, touching or a space apart; one inside another's stretch further in; one alone its full reach", async () => {
    const gaps = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-underlay-inset-block", "1px")
      containerElement.style.setProperty("--view-underlay-inset-inline", "-6px")
      document.body.append(containerElement)
      const stretch = (line: number, from: number, to: number) => ({ from: { line, offset: from }, to: { line, offset: to }, attributes: {} })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines: window.parseLines_ViewModel({ multilineText: "one two\none two\nlone\none two\nf(n)", module_Language: window.MODULE_PLAINTEXT }),
          groups: [
            { attributes: {}, underlays: [stretch(0, 0, 3), stretch(0, 3, 7), stretch(1, 0, 3), stretch(2, 0, 4), stretch(3, 0, 3), stretch(3, 4, 7), stretch(4, 2, 3)] },
            { attributes: {}, underlays: [stretch(1, 1, 2)] }
          ]
        }
      }]))
      const [above, touching, below, lone, spaced, spacedAfter, closed, inside] = [...containerElement.querySelectorAll(".underlay_htmlView")].map((element) => {
        const box = element instanceof SVGPathElement ? element.getBBox() : new DOMRect()
        return { top: box.y, bottom: box.y + box.height, left: box.x, right: box.x + box.width }
      })
      // the ink of the characters from to to on a line, where its glyphs
      // are drawn, which isn't all of their cells, in the svg's coordinates
      const origin = containerElement.querySelector(".underlays_htmlView")?.getBoundingClientRect() ?? new DOMRect()
      const inkOf = (line: number, from: number, to: number) => {
        const text = containerElement.querySelectorAll(".text_htmlView")[line]?.firstChild?.firstChild
        if (!(text instanceof Text) || text.parentElement === null) throw new Error(`line ${line}'s text wasn't drawn`)
        const context = new OffscreenCanvas(1, 1).getContext("2d")
        if (context === null) throw new Error("there's no canvas to measure ink with")
        context.font = getComputedStyle(text.parentElement).font
        const cellOf = (at: number) => {
          const range = document.createRange()
          range.setStart(text, at)
          range.setEnd(text, at + 1)
          return range.getBoundingClientRect()
        }
        const first = context.measureText(text.data[from] ?? "")
        const last = context.measureText(text.data[to - 1] ?? "")
        return {
          left: cellOf(from).left - first.actualBoundingBoxLeft - origin.left,
          right: cellOf(to - 1).right + last.actualBoundingBoxRight - last.width - origin.left
        }
      }
      if (above === undefined || touching === undefined || below === undefined || lone === undefined || spaced === undefined || spacedAfter === undefined || closed === undefined || inside === undefined) throw new Error("the underlays weren't drawn")
      const round = (length: number) => Math.round(length * 10) / 10
      return {
        aboveBelow: round(below.top - above.bottom),
        touching: round(touching.left - above.right),
        spaced: round(spacedAfter.left - spaced.right),
        insideTop: round(inside.top - below.top),
        insideBottom: round(below.bottom - inside.bottom),
        loneReach: { left: round(inkOf(2, 0, 1).left - lone.left), right: round(lone.right - inkOf(2, 3, 4).right) },
        closedClear: { left: round(closed.left - inkOf(4, 1, 2).right), right: round(inkOf(4, 3, 4).left - closed.right) }
      }
    })
    expect(gaps).toEqual({ aboveBelow: 2, touching: 2, spaced: 2, insideTop: 2, insideBottom: 2, loneReach: { left: 6, right: 6 }, closedClear: { left: 1, right: 1 } })
  })

  test("switching the perspective on, after drawing, measures the underlays again; with it on, a change pressed on by punctuation has room made, its ring reaching past its word's ink the same on both sides", async () => {
    const widths = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-font-size", "14px")
      document.body.append(containerElement)
      const [line] = window.parseLines_ViewModel({ multilineText: "f(n)", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = line.segments
      if (segment === undefined) throw new Error("the line has no segment")
      const change = { "data-change": "replaced", "data-side": "before", "data-source": "most" }
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines: [{
            ...line,
            segments: [
              { text: window.parseLines_ViewModel({ multilineText: "f(", module_Language: window.MODULE_PLAINTEXT })[0].segments[0]?.text ?? segment.text, attributes: {} },
              { text: window.parseLines_ViewModel({ multilineText: "n", module_Language: window.MODULE_PLAINTEXT })[0].segments[0]?.text ?? segment.text, attributes: change },
              { text: window.parseLines_ViewModel({ multilineText: ")", module_Language: window.MODULE_PLAINTEXT })[0].segments[0]?.text ?? segment.text, attributes: {} }
            ]
          }],
          groups: [{ attributes: { "data-source": "most" }, underlays: [{ from: { line: 0, offset: 2 }, to: { line: 0, offset: 3 }, attributes: change }] }]
        }
      }]))
      const word = () => containerElement.querySelector(`.text_htmlView [data-change]`)?.firstChild
      // how far the ring reaches past the word's ink, its glyph's, which
      // isn't all of its cell, on each side
      const reachOf = () => {
        const path = containerElement.querySelector(".underlay_htmlView")
        const text = word()
        const origin = containerElement.querySelector(".underlays_htmlView")?.getBoundingClientRect()
        const context = new OffscreenCanvas(1, 1).getContext("2d")
        if (!(path instanceof SVGPathElement) || !(text instanceof Text) || text.parentElement === null || origin === undefined || context === null) throw new Error("the change wasn't drawn")
        context.font = getComputedStyle(text.parentElement).font
        const ink = context.measureText(text.data)
        const range = document.createRange()
        range.selectNodeContents(text)
        const cell = range.getBoundingClientRect()
        const box = path.getBBox()
        const round = (length: number) => Math.round(length * 10) / 10
        return {
          left: round(cell.left - ink.actualBoundingBoxLeft - origin.left - box.x),
          right: round(box.x + box.width - (cell.right + ink.actualBoundingBoxRight - ink.width - origin.left))
        }
      }
      const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await frames()
      const before = reachOf()
      containerElement.dataset["perspective"] = "changes"
      await frames()
      return { before, after: reachOf() }
    })
    expect(widths).toEqual({ before: { left: 0, right: 0 }, after: { left: 3, right: 3 } })
  })

  test("with the perspective on, a change's end pressed on by another character has just the room it lacks, whatever the glyphs leave between them: its ring as far past its ink, and as clear of the other's, as at any end; two changes touching, of two proposals, their rings as far apart as any two; an end beside a space, none; all of it the font's, twice as much at twice the size", async () => {
    const endsAt = (fontSize: number) => opened.page.evaluate(async (fontSize) => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-font-size", `${fontSize}px`)
      containerElement.dataset["perspective"] = "changes"
      document.body.append(containerElement)
      const textOf = (text: string) => {
        const [segment] = window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0].segments
        if (segment === undefined) throw new Error(`${text} has no segment`)
        return segment.text
      }
      const changeOf = (source: string) => ({ "data-change": "replaced", "data-side": "before", "data-source": source })
      // the changes' letters, n, m, k, x and y, each pressed on by
      // punctuation with its own ink margins, m after a space, x and y
      // touching, y another proposal's
      const pieces: Array<[string, string | null]> = [["f(", null], ["n", "one"], [") ", null], ["m", "one"], [", ", null], ["k", "one"], ["++ ", null], ["x", "one"], ["y", "two"], [";", null]]
      const [line] = window.parseLines_ViewModel({ multilineText: pieces.map(([text]) => text).join(""), module_Language: window.MODULE_PLAINTEXT })
      const offsets = pieces.map((_, index) => pieces.slice(0, index).reduce((length, [text]) => length + text.length, 0))
      const underlayOf = (index: number) => ({ from: { line: 0, offset: offsets[index] ?? 0 }, to: { line: 0, offset: (offsets[index] ?? 0) + 1 }, attributes: changeOf(pieces[index]?.[1] ?? "") })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines: [{ ...line, segments: pieces.map(([text, source]) => ({ text: textOf(text), attributes: source === null ? {} : changeOf(source) })) }],
          groups: [
            { attributes: { "data-source": "one" }, underlays: [underlayOf(1), underlayOf(3), underlayOf(5), underlayOf(7)] },
            { attributes: { "data-source": "two" }, underlays: [underlayOf(8)] }
          ]
        }
      }]))
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      // every character's ink, where its glyph is drawn, in the svg's
      // coordinates, and the span it's in
      const origin = containerElement.querySelector(".underlays_htmlView")?.getBoundingClientRect() ?? new DOMRect()
      const context = new OffscreenCanvas(1, 1).getContext("2d")
      if (context === null) throw new Error("there's no canvas to measure ink with")
      const characters = [...containerElement.querySelectorAll(".text_htmlView span")].flatMap((spanElement) => {
        const text = spanElement.firstChild
        if (!(text instanceof Text)) return []
        context.font = getComputedStyle(spanElement).font
        return [...text.data].map((character, at) => {
          const range = document.createRange()
          range.setStart(text, at)
          range.setEnd(text, at + 1)
          const cell = range.getBoundingClientRect()
          const metrics = context.measureText(character)
          return { character, spanElement, left: cell.left - metrics.actualBoundingBoxLeft - origin.left, right: cell.right + metrics.actualBoundingBoxRight - metrics.width - origin.left }
        })
      })
      const rings = [...containerElement.querySelectorAll(".underlay_htmlView")].map((pathElement) => pathElement instanceof SVGPathElement ? pathElement.getBBox() : new DOMRect())
      const round = (length: number) => Math.round(length * 10) / 10
      // each change: how far its ring is clear of the character before it,
      // reaches past its own ink, before and after, and is clear of the
      // character after it, where one presses on it
      const measured = Object.fromEntries(["n", "m", "k", "x", "y"].map((letter, index) => {
        const at = characters.findIndex((each) => each.character === letter && each.spanElement.hasAttribute("data-change"))
        const ring = rings[index] ?? new DOMRect()
        const [before, own, after] = [characters[at - 1], characters[at], characters[at + 1]]
        if (own === undefined) throw new Error(`${letter} wasn't drawn`)
        const isPressing = (each: typeof own | undefined) => each !== undefined && /\S/.test(each.character)
        return [letter, [
          isPressing(before) ? round(ring.x - (before?.right ?? 0)) : "-",
          round(own.left - ring.x),
          round(ring.x + ring.width - own.right),
          isPressing(after) ? round((after?.left ?? 0) - ring.x - ring.width) : "-"
        ]]
      }))
      const spanElement_m = characters.find((each) => each.character === "m")?.spanElement
      return {
        measured,
        apart: round((rings[4]?.x ?? 0) - (rings[3]?.x ?? 0) - (rings[3]?.width ?? 0)),
        beside_Space: spanElement_m === undefined ? "" : getComputedStyle(spanElement_m).paddingInlineStart
      }
    }, fontSize)
    expect(await endsAt(14)).toEqual({
      measured: {
        n: [3, 3, 3, 3],
        m: ["-", 3, 3, 3],
        k: ["-", 3, 3, 3],
        x: ["-", 3, 3, 5],
        y: [5, 3, 3, 3]
      },
      apart: 2,
      beside_Space: "0px"
    })
    expect(await endsAt(28)).toEqual({
      measured: {
        n: [6, 6, 6, 6],
        m: ["-", 6, 6, 6],
        k: ["-", 6, 6, 6],
        x: ["-", 6, 6, 10],
        y: [10, 6, 6, 6]
      },
      apart: 4,
      beside_Space: "0px"
    })
  })

  test("a ring a line break or a wrap cuts in two, its parts not one over the other, has its sides at the cut drawn apart from it, as seams, a path each: the first part's right side and the next part's left, the ring open there, reaching half a stroke past its top and bottom, flush with their outer edges, their dashes fitted to them, whole, one at each end; one whose parts are one over the other is one shape, with none", async () => {
    const cuts = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "20rem"
      containerElement.style.setProperty("--view-font-size", "14px")
      containerElement.dataset["perspective"] = "changes"
      document.body.append(containerElement)
      const view = new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      })
      const words = "aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk llll mmmm nnnn oooo pppp"
      const lines = window.parseLines_ViewModel({ multilineText: `the first line ends with this\nand the next starts here\n${words}`, module_Language: window.MODULE_PLAINTEXT })
      const change = { "data-change": "removed", "data-side": "before", "data-source": "most" }
      const stretch = (line: number, from: number, lineTo: number, to: number) => ({ from: { line, offset: from }, to: { line: lineTo, offset: to }, attributes: change })
      const draw = (underlays: Array<ReturnType<typeof stretch>>) => view.draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: { id: "document", lines, groups: [{ attributes: { "data-source": "most" }, underlays }] }
      }]))
      // where the words wrap: the first character on the line's second row
      draw([])
      const text = containerElement.querySelectorAll(".text_htmlView")[2]?.firstChild?.firstChild
      if (!(text instanceof Text)) throw new Error("the words weren't drawn")
      const topOf = (at: number) => {
        const range = document.createRange()
        range.setStart(text, at)
        range.setEnd(text, at + 1)
        return range.getBoundingClientRect().top
      }
      const wrap = [...words].findIndex((_, at) => topOf(at) > topOf(0) + 1)
      // this to and, cut by the line break; the last word on the words'
      // first row to the first on their second, cut by the wrap; and from
      // the first row's second word to the second row's second, its parts
      // one over the other
      draw([stretch(0, 25, 1, 3), stretch(2, wrap - 5, 2, wrap + 4), stretch(2, 5, 2, wrap + 9)])
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const numbersOf = (element: Element | undefined) => (element?.getAttribute("d") ?? "").match(/-?[\d.]+/g)?.map(Number) ?? []
      // a seam's dashes, as the perspective gives them, fitted: a whole
      // number of the pattern, and its first dash again, so a dash at each
      // end, each dash scaled no more than a third from its own length
      const isFitted = (seamElement: Element) => {
        if (!(seamElement instanceof SVGPathElement)) return false
        const lengths = (getComputedStyle(seamElement).strokeDasharray.match(/\d*\.?\d+/g) ?? []).map(Number)
        const period = lengths.reduce((sum, length) => sum + length, 0)
        const length_Path = Number(seamElement.getAttribute("pathLength"))
        const repeats = (length_Path - (lengths[0] ?? 0)) / period
        const scale = seamElement.getTotalLength() / length_Path
        return lengths.length > 0 && Math.abs(repeats - Math.round(repeats)) < 0.001 && scale > 0.75 && scale < 1.34
      }
      return [...containerElement.querySelectorAll(".underlay_htmlView")].map((ringElement) => {
        const box = ringElement instanceof SVGPathElement ? ringElement.getBBox() : new DOMRect()
        const seamElements: Array<Element> = []
        for (let element = ringElement.nextElementSibling; element?.classList.contains("seam_htmlView"); element = element.nextElementSibling) seamElements.push(element)
        const [x1, y1, x2, y2] = numbersOf(seamElements[0])
        const [x3, y3, x4, y4] = numbersOf(seamElements[1])
        return {
          wrapped: wrap > 0,
          ringShapes: (ringElement.getAttribute("d")?.match(/M/g) ?? []).length,
          ringClosed: ringElement.getAttribute("d")?.includes("Z") ?? false,
          seams: seamElements.map((seamElement) => (seamElement.getAttribute("d")?.match(/M/g) ?? []).length),
          seamsUpright: seamElements.length === 0 || (x1 === x2 && x3 === x4),
          firstAtRingsRight: seamElements.length === 0 || x1 === box.x + box.width,
          nextAtRingsLeft: seamElements.length === 0 || x3 === box.x,
          nextBelowFirst: seamElements.length === 0 || Math.min(y3 ?? 0, y4 ?? 0) > Math.max(y1 ?? 0, y2 ?? 0) - 0.01,
          flush: seamElements.length === 0 || (() => {
            const halfStroke = Number.parseFloat(getComputedStyle(seamElements[0] ?? ringElement).strokeWidth) / 2
            return halfStroke > 0 && Math.abs(Math.min(y1 ?? 0, y2 ?? 0) - (box.y - halfStroke)) < 0.01 && Math.abs(Math.max(y3 ?? 0, y4 ?? 0) - (box.y + box.height + halfStroke)) < 0.01
          })(),
          dashesFitted: seamElements.every(isFitted),
          seamAttributes: seamElements.map((seamElement) => [...seamElement.attributes].map((attribute) => attribute.name).filter((name) => name.startsWith("data-")))
        }
      })
    })
    const attributes = ["data-change", "data-side", "data-source"]
    const cut = { wrapped: true, ringShapes: 2, ringClosed: false, seams: [1, 1], seamsUpright: true, firstAtRingsRight: true, nextAtRingsLeft: true, nextBelowFirst: true, flush: true, dashesFitted: true, seamAttributes: [attributes, attributes] }
    expect(cuts).toEqual([
      cut,
      cut,
      { wrapped: true, ringShapes: 1, ringClosed: true, seams: [], seamsUpright: true, firstAtRingsRight: true, nextAtRingsLeft: true, nextBelowFirst: true, flush: true, dashesFitted: true, seamAttributes: [] }
    ])
  })

  test("a text underlay is drawn again, as one shape over all its rows, when the view's width changes", async () => {
    const rows = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "60rem"
      document.body.append(containerElement)
      const lines = window.parseLines_ViewModel({ multilineText: "a line of words, boxed whole, long enough to wrap once the view's narrow", module_Language: window.MODULE_PLAINTEXT })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines,
          groups: [{ attributes: {}, underlays: [{ from: { line: 0, offset: 0 }, to: { line: 0, offset: Infinity }, attributes: { "data-underlay": "box" } }] }]
        }
      }]))
      const textElement = containerElement.querySelector(".text_htmlView")
      if (textElement === null) throw new Error("the line's text wasn't drawn")
      const height = parseFloat(getComputedStyle(textElement).lineHeight)
      const shape = () => {
        const pathElement = containerElement.querySelector(".underlay_htmlView")
        return {
          shapes: (pathElement?.getAttribute("d")?.match(/M/g) ?? []).length,
          rows: pathElement instanceof SVGPathElement ? Math.round(pathElement.getBBox().height / height) : 0
        }
      }
      const wide = shape()
      containerElement.style.width = "12rem"
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const narrow = shape()
      return { wide, narrow, lines: Math.round(textElement.getBoundingClientRect().height / height) }
    })
    expect(rows.wide).toEqual({ shapes: 1, rows: 1 })
    expect(rows.narrow.shapes).toBe(1)
    expect(rows.narrow.rows).toBeGreaterThan(1)
    expect(rows.narrow.rows).toBe(rows.lines)
  })

  test("a document of no lines draws a view with nothing in it", async () => {
    const children = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([]))
      return containerElement.querySelector(".htmlView_editor")?.childNodes.length
    })
    expect(children).toBe(0)
  })

  test("its look comes from variables a host sets above it, or else its own defaults", async () => {
    const looks = await opened.page.evaluate(() => {
      const look = (variables: string) => {
        const hostElement = document.createElement("div")
        hostElement.setAttribute("style", variables)
        const containerElement = document.createElement("div")
        hostElement.append(containerElement)
        document.body.append(hostElement)
        new window._View_TextEditor_({
          containerElement,
          componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
        }).draw(window.viewModelOf__Blocks([]))
        const style = getComputedStyle(containerElement.querySelector(".htmlView_editor") ?? containerElement)
        return {
          ground: style.backgroundColor,
          ink: style.color,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          tabSize: style.tabSize
        }
      }
      return {
        host: look("--view-ground: rgb(10, 20, 30); --view-ink: rgb(200, 210, 220); --view-font-size: 20px; --view-line-height: 2; --view-tab-size: 8"),
        own: look("")
      }
    })
    expect(looks.host).toEqual({ ground: "rgb(10, 20, 30)", ink: "rgb(200, 210, 220)", fontSize: "20px", lineHeight: "40px", tabSize: "8" })
    expect(looks.own).toEqual({ ground: "rgb(255, 255, 255)", ink: "rgb(0, 0, 0)", fontSize: "13px", lineHeight: "20.8px", tabSize: "4" })
  })
})

// a line's segments as the view model gives them: each a little text, with
// characters HTML would read as markup among it, and data from a small pool,
// so the same data often recurs, beside itself and in other company
const segments = fc.array(
  fc.record({
    text: fc.string({ unit: fc.constantFrom("a", "b", " ", "<", "&"), minLength: 1, maxLength: 4 }).map((text) => parseTexts_Line(text)[0]),
    attributes: fc.dictionary(
      fc.constantFrom("data-marks", "data-change", "data-side", "data-source", "data-link"),
      fc.constantFrom("bold", "bold italic", "inserted", "after", "one", "https://example.com/?a=<&>"),
      { maxKeys: 4 }
    )
  }),
  { maxLength: 8 }
)

// a node a line's text is drawn as: its tag, or #text, its text, and its
// attributes, as names and values, in order of name
interface _Drawn_Segment_ {
  tag: string
  text: string
  attributes: Array<[string, string]>
}

// a line of these segments, drawn in the page, and read back node by node
async function drawnOf(
  segments_Line: Array<_Segment_Line_>
): Promise<Array<_Drawn_Segment_>> {
  return opened.page.evaluate((segments_Line) => {
    const containerElement = document.createElement("div")
    new window._View_TextEditor_({
      containerElement,
      componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
    }).draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "line", lines: [{ gutter: { label: "", marker: "none" }, segments: segments_Line }], groups: [] } }]))
    const textElement = containerElement.querySelector(".text_htmlView")
    if (textElement === null) throw new Error("the line's text wasn't drawn")
    return [...textElement.childNodes].map((node) => ({
      tag: node instanceof Element ? node.localName : "#text",
      text: String(node.textContent),
      attributes: node instanceof Element ? [...node.attributes].map((attribute): [string, string] => [attribute.name, attribute.value]).toSorted() : []
    }))
  }, segments_Line)
}

describe("any line, whatever its segments carry: what holds of every one", () => {
  test("each segment is drawn as one span, in order, its text as it's written, carrying exactly its data, and nothing else is drawn", async () => {
    await fc.assert(
      fc.asyncProperty(segments, async (segments_Line) => {
        expect(await drawnOf(segments_Line)).toEqual(
          segments_Line.map((segment_Line) => ({ tag: "span", text: segment_Line.text, attributes: Object.entries(segment_Line.attributes).toSorted() }))
        )
      }),
      { numRuns: 300 }
    )
  })
})
