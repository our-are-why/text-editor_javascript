import { afterAll, describe, expect, test } from "bun:test"
import { documents } from "../../playground/documents/index.ts"
import { openDocument } from "./harness.ts"

// each of the playground's documents, opened as you'd open it to read, and
// every case it enumerates checked against its view model: drawn when it has
// one, a ring for every underlay the view model gives, nothing drawn when
// there's nothing yet to draw, and nothing thrown
for (const shown of documents) {
  const opened = await openDocument(shown.name)
  afterAll(() => opened.close())
  const drawn = await opened.page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return Object.fromEntries([...document.querySelectorAll(".case")].map((article) => [article.id, {
      editors: article.querySelectorAll(".htmlView_editor").length,
      rings: article.querySelectorAll(".underlay_htmlView").length
    }]))
  })

  describe(`the ${shown.title} document: every case drawn as its view model says`, () => {
    test("opens with nothing thrown", () => {
      expect(opened.errors).toEqual([])
    })
    for (const section of shown.sections) {
      for (const each of section.cases) {
        const viewModel = each.viewModel_TextEditor
        test(`${each.name}: ${viewModel === null ? "nothing drawn, as there's nothing yet to draw" : "drawn, a ring for every underlay"}`, () => {
          expect(drawn[each.name]).toEqual({
            editors: viewModel === null ? 0 : 1,
            rings: viewModel === null ? 0 : viewModel.runs.flatMap((run) => run.groups.flatMap((group) => group.underlays)).length
          })
        })
      }
    }
  })
}
