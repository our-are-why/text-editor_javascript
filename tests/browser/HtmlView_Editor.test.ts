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
      for (const multilineText of ["one\ntwo\nthree", "four"]) view_TextEditor.draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "document", lines: window.parseLines_ViewModel(multilineText), groups: [] } }]))
      return [...containerElement.querySelectorAll(".text_htmlView")].map((element) => element.textContent)
    })
    expect(lines).toEqual(["four"])
  })

  test("a host's own components draw in place of the editor's, wherever what they draw is", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      const lineOf = (text: string) => window.parseLines_ViewModel(text)[0]
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
            { kind: "PROPOSAL_LIST", items: [{ source: "most", title: "Most of the orders", rationale: "", actions: [] }] }
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
      const group = { attributes: {}, underlays: [{ from: { line: 0, offset: 0 }, to: { line: 1, offset: 3 }, attributes: { "data-underlay": "targets" } }] }
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
          }).draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "document", lines: window.parseLines_ViewModel("one\ntwo"), groups } }]))
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

  test("each proposal's item shows its title, then why it's proposed, then its actions, each a button carrying its command", async () => {
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
          { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel("one"), groups: [] } },
          {
            kind: "PROPOSAL_LIST",
            items: [
              { source: "most", title: "Most of the orders", rationale: "Most of them need the lathe.", actions: [{ command: "accept", label: "Accept" }, { command: "reject", label: "Reject" }] },
              { source: "all", title: "All of them", rationale: "", actions: [{ command: "accept", label: "Take it" }] }
            ]
          }
        ]
      }]))
      return [...containerElement.querySelectorAll(".item_htmlView")].map((itemElement) => ({
        source: itemElement.getAttribute("data-source"),
        shown: [...itemElement.children].filter((element) => getComputedStyle(element).display !== "none").map((element) => element.className),
        title: itemElement.querySelector(".title_htmlView")?.textContent,
        rationale: itemElement.querySelector(".rationale_htmlView")?.textContent,
        actions: [...itemElement.querySelectorAll(".actions_htmlView > button")].map((buttonElement) => `${buttonElement.getAttribute("type")} ${buttonElement.getAttribute("data-command")}: ${buttonElement.textContent}`)
      }))
    })
    expect(items).toEqual([
      { source: "most", shown: ["title_htmlView", "rationale_htmlView", "actions_htmlView"], title: "Most of the orders", rationale: "Most of them need the lathe.", actions: ["button accept: Accept", "button reject: Reject"] },
      { source: "all", shown: ["title_htmlView", "actions_htmlView"], title: "All of them", rationale: "", actions: ["button accept: Take it"] }
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
          lines: window.parseLines_ViewModel("one line\nand the next"),
          groups: [{
            attributes: { "data-source": "most" },
            underlays: [
              { from: { line: 0, offset: 4 }, to: { line: 1, offset: 7 }, attributes: { "data-underlay": "targets" } },
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
        behind: getComputedStyle(svgElement).zIndex,
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
      behind: "-1",
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

  test("a text underlay is drawn again, as one shape over all its rows, when the view's width changes", async () => {
    const rows = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "60rem"
      document.body.append(containerElement)
      const lines = window.parseLines_ViewModel("a line of words, boxed whole, long enough to wrap once the view's narrow")
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines,
          groups: [{ attributes: {}, underlays: [{ from: { line: 0, offset: 0 }, to: { line: 0, offset: Infinity }, attributes: { "data-underlay": "targets" } }] }]
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
