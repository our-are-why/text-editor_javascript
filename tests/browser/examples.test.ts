import { afterAll, describe, expect, test } from "bun:test"
import { openExample } from "./harness.ts"

// the Markdown example, opened as you'd open it to read: its changes read as
// Markdown first, then, its button pressed, as text, then as Markdown again;
// each time, the rings on what its default's made bold, as proposed, and
// the buttons' state, once the editor's drawn again
const opened = await openExample("markdown")
afterAll(() => opened.close())

const drawnAfter = async (label: string | null) => {
  if (label !== null) await opened.page.getByRole("button", { name: label }).click()
  return opened.page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return {
      rings: [...document.querySelectorAll(".underlay_htmlView[data-source=\"stress\"][data-side=\"after\"]")].map((element) => element.getAttribute("data-change")),
      pressed: [...document.querySelectorAll(".perspectives button")].map((button) => `${button.textContent} ${button.getAttribute("aria-pressed")}`),
      look: document.querySelector(".stage [data-look]")?.getAttribute("data-look") ?? null
    }
  })
}
const shown_Markdown = await drawnAfter(null)
const shown_Text = await drawnAfter("As text")
const shown_Again = await drawnAfter("As Markdown")

describe("the Markdown example: a perspective for each way to read its changes, the buttons over it switching them, both in the changes look", () => {
  test("read as Markdown, a word made bold is one ring, restyled, round it and its asterisks", () => {
    expect(shown_Markdown).toEqual({ rings: ["restyled"], pressed: ["As Markdown true", "As text false"], look: "changes" })
  })
  test("read as text, its asterisks put in are each a ring of their own", () => {
    expect(shown_Text).toEqual({ rings: ["inserted", "inserted"], pressed: ["As Markdown false", "As text true"], look: "changes" })
  })
  test("switched back, it's read as Markdown again, and each switch is reported", async () => {
    expect(shown_Again).toEqual(shown_Markdown)
    expect(await opened.logged()).toEqual([{ perspective: "changes" }, { perspective: "markdown" }])
  })
  test("opens and switches with no error reported", () => {
    expect(opened.errors).toEqual([])
  })
})
