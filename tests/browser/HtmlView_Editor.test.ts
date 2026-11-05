import { afterAll, describe, expect, test } from "bun:test"
import { everything } from "../../playground/scenes/everything.ts"
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
  new window._HtmlView_Editor_({ containerElement }).draw(window.everything.model__HtmlView_Editor)
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
  test("keeps its container, adding its class to the host's own", async () => {
    const kept = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.className = "host"
      document.body.append(containerElement)
      const htmlView_Editor = new window._HtmlView_Editor_({ containerElement })
      return {
        same: htmlView_Editor.containerElement === containerElement,
        classes: [...containerElement.classList]
      }
    })
    expect(kept).toEqual({ same: true, classes: ["host", "htmlView_editor"] })
  })

  test("drawing again replaces what was drawn", async () => {
    const lines = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      const htmlView_Editor = new window._HtmlView_Editor_({ containerElement })
      htmlView_Editor.draw({ lines: window.parseLines_ViewModel("one\ntwo\nthree") })
      htmlView_Editor.draw({ lines: window.parseLines_ViewModel("four") })
      return [...containerElement.children].map((element) => element.textContent)
    })
    expect(lines).toEqual(["four"])
  })

  test("a document of no lines draws nothing", async () => {
    const children = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      new window._HtmlView_Editor_({ containerElement }).draw({ lines: [] })
      return containerElement.childNodes.length
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
        new window._HtmlView_Editor_({ containerElement })
        const style = getComputedStyle(containerElement)
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
