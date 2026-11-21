import { afterAll, describe, expect, test } from "bun:test"
import fc from "fast-check"
import { everything } from "../../playground/scenes/everything.ts"
import { type _Segment_Line_ } from "../../source/ViewModel_TextEditor.ts"
import { parseTexts_Line } from "../../source/Model_TextEditor.ts"
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
          places: window.COMPONENTMAP__VIEW_TEXTEDITOR.places,
          condition: window.COMPONENTMAP__VIEW_TEXTEDITOR.condition,
          header: window.COMPONENTMAP__VIEW_TEXTEDITOR.header,
          footer: window.COMPONENTMAP__VIEW_TEXTEDITOR.footer,
          menu: window.COMPONENTMAP__VIEW_TEXTEDITOR.menu,
          request: window.COMPONENTMAP__VIEW_TEXTEDITOR.request,
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
            { kind: "PROPOSAL_LIST", items: [{ source: "most", title: "Most of the orders", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
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
      const group = { attributes: {}, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 1, offset: 3 }, attributes: { "data-underlay": "box" } }] }
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

  test("pointing with the mouse at a proposal's change, or its item, marks its groups and items, and the gutters of the lines it changes, wherever they are, drawn on the next frame; pointing where nothing changes draws nothing again; and pointing away marks none", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "pointing"
      containerElement.style.width = "40rem"
      document.body.prepend(containerElement)
      const [line] = window.parseLines_ViewModel({ multilineText: "half the orders", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = line.segments
      if (segment === undefined) throw new Error("the line has no segment")
      const change = { "data-change": "replaced", "data-side": "before", "data-source": "most" }
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
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
                  { attributes: { "data-source": "most" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 4 }, attributes: change }] },
                  { attributes: { "data-source": "all" }, underlays: [] }
                ]
              }
            },
            {
              kind: "PROPOSAL_LIST",
              items: [
                { source: "most", title: "Most of the orders", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} },
                { source: "all", title: "All of them", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }
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
        pointed: [...(containerElement?.querySelectorAll("[data-pointed]:not(.layer_htmlView[data-layer=\"FILLS\"] *)") ?? [])].map((element) => element.classList.contains("gutter_htmlView") ? `gutter ${element.getAttribute("data-pointed")}` : `${element.localName} ${element.getAttribute("data-source")}`),
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
    expect(await pointed()).toEqual({ pointed: ["g most", "gutter proposal", "li most"], drawnAgain: true })
    await at(`.item_htmlView[data-source="most"] .title_htmlView`)
    expect(await pointed()).toEqual({ pointed: ["g most", "gutter proposal", "li most"], drawnAgain: false })
    await at(`.item_htmlView[data-source="all"] .title_htmlView`)
    expect(await pointed()).toEqual({ pointed: ["li all"], drawnAgain: true })
    await opened.page.mouse.move(1270, 715)
    expect(await pointed()).toEqual({ pointed: [], drawnAgain: true })
    await opened.page.evaluate(() => document.getElementById("pointing")?.remove())
  })

  test("a ring is pointed at wherever it's drawn round, between its rows too, over no word; where one's inside another, the inner one, as far as it reaches; and moving out of it, over what was under the pointer before, points at none", async () => {
    const at = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.id = "pointing-rows"
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-font-size", "14px")
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const [first, middle, last] = window.parseLines_ViewModel({ multilineText: "alpha beta gamma\ndelta epsilon\nzeta eta theta", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = first?.segments ?? []
      if (first === undefined || middle === undefined || last === undefined || segment === undefined) throw new Error("the lines weren't parsed")
      const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
      // lines 1 to 3 taken out, delta renamed inside it, by another proposal
      const removed = { "data-change": "removed", "data-side": "before", "data-source": "drop" }
      const renamed = { "data-change": "replaced", "data-side": "before", "data-source": "rename", "data-within": "drop" }
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "LINES",
          run: {
            id: "document",
            lines: [
              { ...first, segments: [{ text: textOf("alpha "), attributes: {} }, { text: textOf("beta gamma"), attributes: removed }] },
              { ...middle, segments: [{ text: textOf("delta"), attributes: renamed }, { text: textOf(" epsilon"), attributes: removed }] },
              { ...last, segments: [{ text: textOf("zeta eta"), attributes: removed }, { text: textOf(" theta"), attributes: {} }] }
            ],
            groups: [
              { attributes: { "data-source": "drop" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 6 }, to: { line: 2, offset: 8 }, attributes: removed }] },
              { attributes: { "data-source": "rename" }, underlays: [{ kind: "STRETCH" as const, from: { line: 1, offset: 0 }, to: { line: 1, offset: 5 }, attributes: renamed }] }
            ]
          }
        }])
      })
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const [textFirst, textMiddle, textLast] = [...containerElement.querySelectorAll(".text_htmlView")]
      const ringRenamed = containerElement.querySelector('.area_htmlView[data-source="rename"]')?.getBoundingClientRect()
      const removedFirst = textFirst?.querySelector('[data-source="drop"]')?.getBoundingClientRect()
      const removedLast = textLast?.querySelector('[data-source="drop"]')?.getBoundingClientRect()
      const lineMiddle = textMiddle?.closest(".line_htmlView")?.getBoundingClientRect()
      if (textFirst === undefined || textLast === undefined || ringRenamed === undefined || removedFirst === undefined || removedLast === undefined || lineMiddle === undefined) throw new Error("the rings weren't drawn")
      const middleOf = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return rect.top + rect.height / 2
      }
      return {
        // a column every row of the removal has, from the first's middle to
        // the last's
        column: (removedFirst.left + removedLast.right) / 2,
        from: Math.ceil(middleOf(textFirst)),
        to: Math.floor(middleOf(textLast)),
        // the renamed ring's reach past delta's ink, over the space after it,
        // the removal's
        reach: { x: ringRenamed.right - 1, y: ringRenamed.top + ringRenamed.height / 2 },
        // the middle line's top, between it and the first, over no word
        between: lineMiddle.top + 1,
        beyond: lineMiddle.right - 1
      }
    })
    const pointed = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return [...document.querySelectorAll("#pointing-rows .layer_htmlView[data-layer=\"POINTED\"] > .group_htmlView[data-pointed]")].map((element) => element.getAttribute("data-source")).join(" ")
    })
    const walked: Array<string> = []
    for (let y = at.from; y <= at.to; y++) {
      await opened.page.mouse.move(at.column, y)
      walked.push(await pointed())
    }
    expect([...new Set(walked)]).toEqual(["drop"])
    await opened.page.mouse.move(at.reach.x, at.reach.y)
    expect(await pointed()).toEqual("rename")
    await opened.page.mouse.move(at.column, at.between)
    expect(await pointed()).toEqual("drop")
    await opened.page.mouse.move(at.beyond, at.between)
    expect(await pointed()).toEqual("")
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => document.getElementById("pointing-rows")?.remove())
  })

  test("each state's item has its icon beside it, its status word after its title, the two in the proposals' indigo, decided by you, or their plum, a revision requested or under way, or a grey, withdrawn by the agent, never the item's words', an open one's other actions on their grey, their words the colour of the state each leads to, one's with revisions queued or under way too, still to be decided, none of its the main one, neutral once it's decided, so colour keeps its meaning in the rings, or in a host's colour for its state, if it gives one; an open one no icon; a revising one's word shimmering as its icon goes round, no dots after it, the word plain and the icon still where motion's asked to be reduced; its title the same whatever its state", async () => {
    const inksOf = () => opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.dataset["look"] = "changes"
      containerElement.style.setProperty("--view-state-rejected", "rgb(1, 2, 3)")
      document.body.append(containerElement)
      const itemOf = (state: "OPEN" | "REQUESTED" | "REVISING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN") => ({ source: state, title: state, state, status: state === "OPEN" ? "" : state, places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "FRAME",
        range: { first: 1, last: 1 },
        parts: [
          { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
          { kind: "PROPOSAL_LIST", items: [itemOf("OPEN"), itemOf("REQUESTED"), itemOf("REVISING"), itemOf("ACCEPTED"), itemOf("REJECTED"), itemOf("WITHDRAWN")] }
        ]
      }]))
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const inks = Object.fromEntries([...containerElement.querySelectorAll(".item_htmlView")].map((itemElement) => {
        const icon = getComputedStyle(itemElement, "::before")
        const word = itemElement.querySelector(".status_htmlView")
        const style = word === null ? null : getComputedStyle(word)
        const title = getComputedStyle(itemElement.querySelector(".title_htmlView") ?? itemElement)
        return [itemElement.getAttribute("data-state"), {
          title: `${title.color} ${title.fontWeight}`,
          icon: icon.content === "none" ? null : `${icon.backgroundColor}${icon.animationName === "none" ? "" : ` ${icon.animationName}`}`,
          // its ink, or, moving, what moves it
          word: style === null || word?.textContent === "" ? null : style.animationName === "none" ? style.color : style.animationName
        }]
      }))
      const muted = getComputedStyle(containerElement.querySelector(".item_htmlView[data-state='ACCEPTED'] .status_htmlView") ?? containerElement).color
      const revision = getComputedStyle(containerElement.querySelector(".item_htmlView[data-state='REQUESTED'] .status_htmlView") ?? containerElement).color
      const withdrawn = getComputedStyle(containerElement.querySelector(".item_htmlView[data-state='WITHDRAWN'] .status_htmlView") ?? containerElement).color
      const words = getComputedStyle(containerElement.querySelector(".item_htmlView[data-state='OPEN'] .rationale_htmlView") ?? containerElement).color
      // a button, as the main one and as another, in the proposals' colour
      const list = containerElement.querySelector(".proposals_htmlView")
      const buttonOf = (state: string, isMain: boolean, stateAfter: string | null) => {
        const item = document.createElement("li")
        item.className = "item_htmlView"
        item.dataset["state"] = state
        const actions = document.createElement("div")
        actions.className = "actions_htmlView"
        const main = document.createElement("button")
        main.className = "action_htmlView"
        const other = document.createElement("button")
        other.className = "action_htmlView"
        for (const button of [main, other]) {
          if (stateAfter !== null) button.dataset["stateAfter"] = stateAfter
        }
        actions.append(main, other)
        item.append(actions)
        list?.append(item)
        const style = getComputedStyle(isMain ? main : other)
        const button = {
          ground: style.backgroundColor,
          ink: style.color,
          edge: style.boxShadow
        }
        item.remove()
        return button
      }
      const buttons = {
        main: buttonOf("OPEN", true, "ACCEPTED"),
        toAccept: buttonOf("OPEN", false, "ACCEPTED"),
        toReject: buttonOf("OPEN", false, "REJECTED"),
        toRevise: buttonOf("OPEN", false, "REQUESTED"),
        toWithdraw: buttonOf("OPEN", false, "WITHDRAWN"),
        queuedFirst: buttonOf("REQUESTED", true, "ACCEPTED"),
        queuedToRevise: buttonOf("REQUESTED", false, "REQUESTED"),
        revisingFirst: buttonOf("REVISING", true, "ACCEPTED"),
        revisingToRevise: buttonOf("REVISING", false, "REQUESTED"),
        notOpen: [...new Set(["ACCEPTED", "REJECTED", "WITHDRAWN"].flatMap((state) => [buttonOf(state, true, "OPEN"), buttonOf(state, false, "REQUESTED"), buttonOf(state, false, null)]).map((button) => JSON.stringify(button)))]
      }
      containerElement.remove()
      return { inks, muted, revision, withdrawn, words, buttons }
    })
    const moving = await inksOf()
    const muted = moving.muted
    const revision = moving.revision
    const withdrawn = moving.withdrawn
    const title = moving.inks["OPEN"]?.title
    expect(moving.inks).toEqual({
      OPEN: { title, icon: null, word: null },
      REQUESTED: { title, icon: revision, word: revision },
      REVISING: { title, icon: `${revision} revising_htmlView`, word: "shimmer_htmlView" },
      ACCEPTED: { title, icon: muted, word: muted },
      REJECTED: { title, icon: "rgb(1, 2, 3)", word: "rgb(1, 2, 3)" },
      WITHDRAWN: { title, icon: moving.inks["WITHDRAWN"]?.icon, word: withdrawn }
    })
    expect(muted).not.toBe("rgb(1, 2, 3)")
    expect(muted).not.toBe(moving.words)
    expect(revision).not.toBe(muted)
    expect(revision).not.toBe(moving.words)
    // withdrawn a grey, neither colour, nor the item's words'; its icon the
    // same grey, fainter, three quarters as strong
    const [red, green, blue, alpha = "1"] = withdrawn.match(/[\d.]+/g) ?? []
    expect(red === green && green === blue).toBe(true)
    expect([muted, revision, moving.words]).not.toContain(withdrawn)
    const [red_Icon, green_Icon, blue_Icon, alpha_Icon = "1"] = moving.inks["WITHDRAWN"]?.icon?.match(/[\d.]+/g) ?? []
    expect([red_Icon, green_Icon, blue_Icon]).toEqual([red, green, blue])
    expect(Number(alpha_Icon) / Number(alpha)).toBeCloseTo(0.75, 2)
    // an open one's main action filled, white on it; another on its grey,
    // its words in the proposals' colour, the state's, unless a host gives
    // another; once it's not open, every action on that grey, its words
    // neutral, neither
    expect(moving.buttons.main.ink).toBe("rgb(255, 255, 255)")
    expect(moving.buttons.main.ground).not.toBe("rgb(255, 255, 255)")
    expect(moving.buttons.main.edge).toBe("none")
    // once it's decided, every action neutral on its grey, no edge
    expect(moving.buttons.notOpen).toHaveLength(1)
    const notOpen = JSON.parse(moving.buttons.notOpen[0] ?? "{}")
    expect(notOpen.edge).toBe("none")
    expect(notOpen.ground).not.toBe("rgba(0, 0, 0, 0)")
    expect([muted, revision, "rgb(1, 2, 3)", "rgb(255, 255, 255)"]).not.toContain(notOpen.ink)
    // an open one's others on that grey too, no edge, its words the colour
    // of the state it leads to, a host's own for it too
    const onGrey = (ink: string) => ({ ground: notOpen.ground, ink, edge: "none" })
    expect(moving.buttons.toAccept).toEqual(onGrey(muted))
    expect(moving.buttons.toReject).toEqual(onGrey("rgb(1, 2, 3)"))
    expect(moving.buttons.toRevise).toEqual(onGrey(revision))
    expect(moving.buttons.toWithdraw).toEqual(onGrey(withdrawn))
    // one with revisions queued, or under way, the same, its first not the
    // main one
    expect(moving.buttons.queuedFirst).toEqual(onGrey(muted))
    expect(moving.buttons.queuedToRevise).toEqual(onGrey(revision))
    expect(moving.buttons.revisingFirst).toEqual(onGrey(muted))
    expect(moving.buttons.revisingToRevise).toEqual(onGrey(revision))
    await opened.page.emulateMedia({ reducedMotion: "reduce" })
    const still = await inksOf()
    expect(still.inks["REVISING"]).toEqual({ title, icon: revision, word: revision })
    await opened.page.emulateMedia({ reducedMotion: "no-preference" })
  })

  test("a revising item's word shimmers, the view's, a soft band passing through its letters, left to right, easing in and out, dimming it to half at its middle, then resting, a pass every two turns of its arc, begun as a turn is; the band a mask over the word, dimming its ink; a request running shimmering on the same beat, one queued plain; no dots after the word, which would read as an ellipsis; the dot before it still", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "revising"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const requestOf = (id: string, isRunning: boolean) => ({ id, notes: "Say so.", reference: null, progress: isRunning ? "running" : null, detail_Progress: null, isRunning, isStartable: !isRunning, isRemovable: !isRunning, isEditing: false, isStoppable: isRunning, isDismissable: false })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "FRAME",
        range: { first: 1, last: 1 },
        parts: [
          { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
          { kind: "PROPOSAL_LIST", items: [{ source: "timeout", title: "Retry a timeout", state: "REVISING" as const, status: "Revising", places: { kind: "NONE" as const }, rationale: "", requests: [requestOf("running", true), requestOf("queued", false)], actions: [], isRunning: true, isStartable: true, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
        ]
      }]))
    })
    // the word's, the request's and the arc's passes: each one's delay and
    // length; the word's band a mask over it, the word in its ink;
    // where the band is, early in a pass, midway, and resting; and whether
    // anything follows the word
    const shimmer = await opened.page.evaluate(() => {
      const item = document.querySelector("#revising .item_htmlView")
      const word = document.querySelector("#revising .status_htmlView")
      if (item === null || word === null) throw new Error("no item")
      const timingOf = (animation: Animation | undefined) => {
        const computed = animation?.effect?.getComputedTiming()
        return `${animation instanceof CSSAnimation ? animation.animationName : ""} ${Math.round(Number(computed?.delay ?? Number.NaN))} ${Math.round(Number(computed?.duration ?? Number.NaN))}`
      }
      const arc = item.getAnimations({ subtree: true }).find((animation) => animation instanceof CSSAnimation && animation.animationName === "revising_htmlView")
      const [pass] = word.getAnimations()
      const style = getComputedStyle(word)
      const positionAt = (time: number) => {
        pass?.pause()
        if (pass !== undefined) pass.currentTime = time
        return getComputedStyle(word).maskPosition
      }
      return {
        word: timingOf(pass),
        arc: timingOf(arc),
        requests: [...item.querySelectorAll(".said_htmlView")].map((said) => {
          const progress = said.querySelector(".progress_Said_htmlView")
          return `${said.getAttribute("data-request")}: ${progress === null ? "plain" : timingOf(progress.getAnimations()[0])}`
        }),
        band: `${style.maskImage.startsWith("linear-gradient")} ${style.color !== "rgba(0, 0, 0, 0)"} ${style.maskSize}`,
        positions: [positionAt(0), positionAt(900), positionAt(1800), positionAt(2700)],
        after: word.nextSibling === null && word.children.length === 0
      }
    })
    expect(shimmer).toEqual({
      word: "shimmer_htmlView 0 3000",
      arc: "revising_htmlView 0 1500",
      requests: ["running: shimmer_htmlView 0 3000", "queued: plain"],
      band: "true true 250% 100%",
      positions: ["100% 0px", "50% 0px", "0px 0px", "0px 0px"],
      after: true
    })
    // the dot between title and state, the title's, still
    expect(await opened.page.evaluate(() => {
      const title = document.querySelector("#revising .title_htmlView")
      return {
        dot: title === null ? "" : getComputedStyle(title, "::after").content,
        dotStill: title === null ? false : getComputedStyle(title, "::after").animationName === "none"
      }
    })).toEqual({ dot: '" · "', dotStill: true })
    await opened.page.evaluate(() => document.getElementById("revising")?.remove())
  })

  test("an item's lit, on the proposed lines' own ground, across the list edge to edge, its gutter too, a strip of the list's band kept above the first and below the last, while its proposal's pointed at, or while the keyboard's on one of its actions, which is ringed in the page's ink, no colour, the keyboard pointing at nothing; an action hovered a step deeper, the main one too", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "lit"
      containerElement.style.width = "48rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const review = [
        { command: "accept", label: "Accept", stateAfter: "ACCEPTED" as const },
        { command: "reject", label: "Reject", stateAfter: "REJECTED" as const }
      ]
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 1 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: window.parseLines_ViewModel({ multilineText: "ONE", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
            { kind: "PROPOSAL_LIST", items: [
              { source: "open", title: "Open", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "Why.", requests: [], actions: review, isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} },
              { source: "taken", title: "Taken", state: "ACCEPTED" as const, status: "Accepted", places: { kind: "NONE" as const }, rationale: "Why.", requests: [], actions: [{ command: "reopen", label: "Reopen", stateAfter: "OPEN" as const }], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }
            ] }
          ]
        }])
      })
    })
    // each item's ground and which are pointed at; Accept's, Reject's and
    // Reopen's grounds; and Reject's ring
    const looks = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const [open, taken] = document.querySelectorAll("#lit .item_htmlView")
      const [accept, reject] = open?.querySelectorAll(".action_htmlView") ?? []
      const groundOf = (element: Element | null | undefined) => element === null || element === undefined ? "" : getComputedStyle(element).backgroundColor
      return {
        items: [groundOf(open), groundOf(taken)],
        pointed: [...document.querySelectorAll("#lit .item_htmlView[data-pointed]")].map((item) => item.getAttribute("data-source")),
        buttons: [groundOf(accept), groundOf(reject), groundOf(taken?.querySelector(".action_htmlView"))],
        ring: reject === undefined ? "" : `${getComputedStyle(reject).outlineStyle} ${getComputedStyle(reject).outlineColor}`
      }
    })
    const centerOf = (selector: string) => opened.page.evaluate((selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      if (rect === undefined) throw new Error(`no ${selector}`)
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }, selector)
    const rest = await looks()
    expect(rest.items).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"])
    expect(rest.pointed).toEqual([])
    // the pointer on Reject: its item lit, its proposal pointed at, Reject a
    // step deeper, the others as they were
    const point_Reject = await centerOf("#lit .item_htmlView .action_htmlView + .action_htmlView")
    await opened.page.mouse.move(point_Reject.x, point_Reject.y)
    const onReject = await looks()
    const lit = onReject.items[0] ?? ""
    expect(lit).not.toBe("rgba(0, 0, 0, 0)")
    // lit on the proposed lines' own ground: a pixel of the item, clear of
    // its words, as one of the proposed lines', clear of theirs
    const pixelAt = async (selector: string, where: "LEFT" | "RIGHT" | "TOP") => {
      const rect = await opened.page.evaluate(({ selector, where }) => {
        const found = document.querySelector(selector)?.getBoundingClientRect()
        if (found === undefined) throw new Error(`no ${selector}`)
        return where === "TOP"
          ? { x: Math.floor(found.right) - 4, y: Math.floor(found.top) + 1 }
          : { x: where === "LEFT" ? Math.floor(found.left) + 2 : Math.floor(found.right) - 4, y: Math.floor(found.top + found.height / 2) }
      }, { selector, where })
      const png = await opened.page.screenshot({ clip: { x: rect.x, y: rect.y, width: 1, height: 1 } })
      return opened.page.evaluate(async (base64) => {
        const image = new Image()
        image.src = `data:image/png;base64,${base64}`
        await image.decode()
        const canvas = document.createElement("canvas")
        canvas.width = 1
        canvas.height = 1
        const context = canvas.getContext("2d")
        context?.drawImage(image, 0, 0)
        return [...context?.getImageData(0, 0, 1, 1).data ?? []].slice(0, 3).join(" ")
      }, png.toString("base64"))
    }
    const ground_Lit = await pixelAt("#lit .item_htmlView", "RIGHT")
    expect(ground_Lit).toBe(await pixelAt("#lit .proposed_htmlView", "RIGHT"))
    expect(await pixelAt("#lit .item_htmlView", "LEFT")).toBe(ground_Lit)
    const ground_Band = await pixelAt("#lit .item_htmlView + .item_htmlView", "RIGHT")
    expect(ground_Lit).not.toBe(ground_Band)
    expect(await pixelAt("#lit .proposals_htmlView", "TOP")).toBe(ground_Band)
    // and edge to edge across the list, its gutter too; the list's band
    // above the first, and below the last, a strip as deep
    expect(await opened.page.evaluate(() => {
      const list = document.querySelector("#lit .proposals_htmlView")
      const box = list?.getBoundingClientRect()
      const strip = list === null ? Number.NaN : parseFloat(getComputedStyle(list).paddingTop)
      const [first, last] = [...document.querySelectorAll("#lit .item_htmlView")].map((item) => item.getBoundingClientRect())
      // its words where the lines' text starts, though in another font
      const title = document.querySelector("#lit .title_htmlView")?.getBoundingClientRect()
      const text = document.querySelector("#lit .proposed_htmlView .text_htmlView")?.getBoundingClientRect()
      return [first?.left === box?.left, first?.right === box?.right, strip > 0, first?.top === (box?.top ?? 0) + strip, last?.bottom === (box?.bottom ?? 0) - strip, title?.left === text?.left]
    })).toEqual([true, true, true, true, true, true])
    expect(onReject.items[1]).toBe("rgba(0, 0, 0, 0)")
    expect(onReject.pointed).toEqual(["open"])
    expect(onReject.buttons[1]).not.toBe(rest.buttons[1])
    expect([onReject.buttons[0], onReject.buttons[2]]).toEqual([rest.buttons[0], rest.buttons[2]])
    // on Accept, the main one a step deeper
    const point_Accept = await centerOf("#lit .item_htmlView .action_htmlView")
    await opened.page.mouse.move(point_Accept.x, point_Accept.y)
    const onAccept = await looks()
    expect(onAccept.buttons[0]).not.toBe(rest.buttons[0])
    expect(onAccept.buttons[1]).toBe(rest.buttons[1])
    // the keyboard on Reject, the pointer away: its item lit as a pointed
    // one is, Reject ringed in the page's ink; nothing pointed at
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => (document.querySelector("#lit .item_htmlView .action_htmlView") as HTMLElement | null)?.focus())
    await opened.page.keyboard.press("Tab")
    const keyed = await looks()
    expect(keyed.items).toEqual([lit, "rgba(0, 0, 0, 0)"])
    expect(keyed.pointed).toEqual([])
    expect(keyed.ring).toBe("solid rgb(0, 0, 0)")
    await opened.page.evaluate(() => document.getElementById("lit")?.remove())
  })

  test("Revise asks for your notes: a box under its item's words and actions, the keyboard in it, Add, in the revision's plum, then Start, set apart, bold and plum, nothing before its word, on a ground tinted plum, and Cancel, neutral, under it, in that item alone, though its proposal's in another frame too, Revise pressed, open; what's written kept as the pointer moves; Add, with something written, Cancel, Escape, ⌘ or Ctrl with Enter, adding, or Revise again, as Cancel, what's written or not, close it, the keyboard back on Revise; Revise on another item opens its form too, the first kept, what's written in it with it", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "drafting"
      containerElement.style.width = "48rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const review = [
        { command: "accept", label: "Accept", stateAfter: "ACCEPTED" as const },
        { command: "reject", label: "Reject", stateAfter: "REJECTED" as const },
        { command: "revise", label: "Revise", stateAfter: "REQUESTED" as const }
      ]
      const itemOf = (source: string) => ({ source, title: source, state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "Why.", requests: [], actions: review, isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })
      const lines = window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([
          { kind: "FRAME", range: { first: 1, last: 1 }, parts: [
            { kind: "CURRENT_LINES", run: { id: "first", lines, groups: [] } },
            { kind: "PROPOSAL_LIST", items: [itemOf("round"), itemOf("cap")] }
          ] },
          { kind: "FRAME", range: { first: 3, last: 3 }, parts: [
            { kind: "CURRENT_LINES", run: { id: "second", lines, groups: [] } },
            { kind: "PROPOSAL_LIST", items: [itemOf("round"), { ...itemOf("taken"), state: "ACCEPTED" as const, status: "Accepted", actions: [{ command: "reopen", label: "Reopen", stateAfter: "OPEN" as const }] }] }
          ] }
        ])
      })
    })
    const item = (first: number, source: string) => `#drafting .frame_htmlView:has(> .fold_htmlView[data-fold-first="${first}"]) .item_htmlView[data-source="${source}"]`
    // which items are drafted, each item's actions, where the keyboard is,
    // and what's written where it is
    const looks = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const frameOf = (element: Element) => element.closest(".frame_htmlView")?.querySelector(":scope > .fold_htmlView")?.getAttribute("data-fold-first")
      const focused = document.activeElement
      const item_Focused = focused?.closest("#drafting .item_htmlView")
      return {
        drafted: [...document.querySelectorAll("#drafting .item_htmlView[data-drafting]")].map((each) => `${frameOf(each)} ${each.getAttribute("data-source")}`),
        expanded: [...document.querySelectorAll("#drafting .item_htmlView .action_htmlView[aria-expanded]")].map((each) => `${frameOf(each)} ${each.closest(".item_htmlView")?.getAttribute("data-source")} ${each.getAttribute("aria-expanded")}`),
        actions: [...document.querySelectorAll("#drafting .item_htmlView")].map((each) => `${frameOf(each)} ${each.getAttribute("data-source")}: ${[...each.querySelectorAll(".action_htmlView")].map((action) => action.textContent?.trim()).join(" ")}`),
        focused: item_Focused === null || item_Focused === undefined || focused === null ? "elsewhere" : `${frameOf(item_Focused)} ${item_Focused.getAttribute("data-source")} ${focused.classList.contains("notes_htmlView") ? "notes" : focused.textContent?.trim()}`,
        written: focused instanceof HTMLTextAreaElement ? focused.value : null
      }
    })
    const press = async (selector: string) => {
      const point = await opened.page.evaluate((selector) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect()
        if (rect === undefined) throw new Error(`no ${selector}`)
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }, selector)
      await opened.page.mouse.click(point.x, point.y)
    }
    const closed = ["1 round: Accept Reject Revise", "1 cap: Accept Reject Revise", "3 round: Accept Reject Revise", "3 taken: Reopen"]
    const shut = ["1 round false", "1 cap false", "3 round false"]
    // Revise in the first frame's round: there alone, its actions kept,
    // Revise open
    await press(`${item(1, "round")} .action_htmlView[data-command="revise"]`)
    expect(await looks()).toEqual({
      drafted: ["1 round"],
      expanded: ["1 round true", "1 cap false", "3 round false"],
      actions: ["1 round: Accept Reject Revise Add Start Cancel", "1 cap: Accept Reject Revise", "3 round: Accept Reject Revise", "3 taken: Reopen"],
      focused: "1 round notes",
      written: ""
    })
    // laid out: the box under the item's words and its actions, from where
    // its words start to where its actions end, never resized by hand; Add,
    // Start and Cancel under the box, ending where it does
    expect(await opened.page.evaluate((selector) => {
      const rectOf = (child: string) => document.querySelector(`${selector} ${child}`)?.getBoundingClientRect()
      const [words, actions, notes, send, cancel] = [rectOf(".rationale_htmlView"), rectOf(".actions_htmlView"), rectOf(".notes_htmlView"), rectOf("[data-draft='ADD']"), rectOf("[data-draft='DISCARD']")]
      return [
        (notes?.top ?? 0) >= Math.max(words?.bottom ?? 0, actions?.bottom ?? 0),
        notes?.left === words?.left,
        notes?.right === actions?.right,
        (send?.top ?? 0) >= (notes?.bottom ?? 0),
        cancel?.right === notes?.right,
        getComputedStyle(document.querySelector(`${selector} .notes_htmlView`) ?? document.body).resize
      ]
    }, item(1, "round"))).toEqual([true, true, true, true, true, "none"])
    // as it looks: Add filled in plum, white on it, not Accept's indigo;
    // Start's words plum, as Revise's are, and bold, nothing before them,
    // on a ground tinted plum, neither Add's nor Cancel's; Cancel as
    // neutral as Reopen
    const inks = await opened.page.evaluate(({ drafted, other, taken }) => {
      const styleOf = (selector: string, pseudo?: string) => {
        const element = document.querySelector(selector)
        return element === null ? null : getComputedStyle(element, pseudo)
      }
      return {
        send: `${styleOf(`${drafted} [data-draft="ADD"]`)?.backgroundColor} ${styleOf(`${drafted} [data-draft="ADD"]`)?.color}`,
        start: styleOf(`${drafted} [data-draft="START"]`)?.color,
        startLook: `${styleOf(`${drafted} [data-draft="START"]`)?.fontWeight} ${styleOf(`${drafted} [data-draft="START"]`)?.backgroundColor} ${styleOf(`${drafted} [data-draft="START"]`, "::before")?.content}`,
        cancelGround: styleOf(`${drafted} [data-draft="DISCARD"]`)?.backgroundColor,
        revise: styleOf(`${drafted} .action_htmlView[data-command="revise"]`)?.color,
        accept: styleOf(`${other} .action_htmlView`)?.backgroundColor,
        cancel: styleOf(`${drafted} [data-draft="DISCARD"]`)?.color,
        reopen: styleOf(`${taken} .action_htmlView`)?.color
      }
    }, { drafted: item(1, "round"), other: item(1, "cap"), taken: item(3, "taken") })
    expect(inks.send.endsWith("rgb(255, 255, 255)")).toBe(true)
    expect(inks.send.startsWith(inks.accept ?? "")).toBe(false)
    expect(inks.cancel).toBe(inks.reopen)
    expect(inks.start).toBe(inks.revise)
    expect(inks.start).not.toBe(inks.reopen)
    const [weight, ...rest] = inks.startLook.split(" ")
    const content_Before = rest.pop()
    const ground_Start = rest.join(" ")
    expect([weight, content_Before]).toEqual(["600", "none"])
    expect([inks.send.startsWith(ground_Start), ground_Start === inks.cancelGround]).toEqual([false, false])
    // three lines tall, however many are written, scrolling past them
    const tall = () => opened.page.evaluate((selector) => {
      const notes = document.querySelector(`${selector} .notes_htmlView`)
      return notes === null ? null : { height: Math.round(notes.getBoundingClientRect().height), scrolls: notes.scrollHeight > notes.clientHeight }
    }, item(1, "round"))
    const empty = await tall()
    await opened.page.keyboard.type("one\ntwo\nthree\nfour\nfive\nsix")
    expect(await tall()).toEqual({ height: empty?.height ?? Number.NaN, scrolls: true })
    expect(empty?.scrolls).toBe(false)
    await opened.page.keyboard.press("Control+A")
    await opened.page.keyboard.press("Backspace")
    // what's written kept as the pointer moves and what's pointed at's drawn
    // again
    await opened.page.keyboard.type("only a GET or a PUT")
    await press(`${item(1, "cap")} .rationale_htmlView`)
    await opened.page.evaluate((selector) => document.querySelector<HTMLElement>(selector)?.focus(), `${item(1, "round")} .notes_htmlView`)
    expect((await looks()).written).toBe("only a GET or a PUT")
    // Escape: closed, the keyboard on Revise
    await opened.page.keyboard.press("Escape")
    expect(await looks()).toEqual({ drafted: [], expanded: shut, actions: closed, focused: "1 round Revise", written: null })
    // Revise by the keyboard: open again, empty, what was written gone
    await opened.page.keyboard.press("Enter")
    expect(await looks()).toEqual({ drafted: ["1 round"], expanded: ["1 round true", ...shut.slice(1)], actions: ["1 round: Accept Reject Revise Add Start Cancel", ...closed.slice(1)], focused: "1 round notes", written: "" })
    // Ctrl with Enter: sent, closed
    await opened.page.keyboard.type("x")
    await opened.page.keyboard.press("Control+Enter")
    expect(await looks()).toEqual({ drafted: [], expanded: shut, actions: closed, focused: "1 round Revise", written: null })
    // Revise again while it's open: closed, the keyboard still on Revise
    await press(`${item(1, "round")} .action_htmlView[data-command="revise"]`)
    expect((await looks()).drafted).toEqual(["1 round"])
    await press(`${item(1, "round")} .action_htmlView[data-command="revise"]`)
    expect(await looks()).toEqual({ drafted: [], expanded: shut, actions: closed, focused: "1 round Revise", written: null })
    // Revise on another item opens its form too, the first kept as it was,
    // what's written in it with it
    await press(`${item(1, "round")} .action_htmlView[data-command="revise"]`)
    expect((await looks()).drafted).toEqual(["1 round"])
    await opened.page.keyboard.type("keep this")
    await press(`${item(3, "round")} .action_htmlView[data-command="revise"]`)
    const both = await looks()
    expect([both.drafted, both.expanded, both.focused]).toEqual([["1 round", "3 round"], ["1 round true", "1 cap false", "3 round true"], "3 round notes"])
    expect(await opened.page.evaluate((selector) => document.querySelector<HTMLTextAreaElement>(`${selector} .notes_htmlView`)?.value, item(1, "round"))).toBe("keep this")
    // Revise again on one with something written in it, as its Cancel:
    // that one alone closed, what's written gone, the keyboard on its
    // Revise
    await press(`${item(1, "round")} .action_htmlView[data-command="revise"]`)
    const one = await looks()
    expect([one.drafted, one.focused, one.written]).toEqual([["3 round"], "1 round Revise", null])
    // Cancel, then Add, by the mouse: with nothing written, nothing added,
    // the form kept open; with something, added, closed
    await press(`${item(3, "round")} [data-draft="DISCARD"]`)
    expect(await looks()).toEqual({ drafted: [], expanded: shut, actions: closed, focused: "3 round Revise", written: null })
    await press(`${item(1, "cap")} .action_htmlView[data-command="revise"]`)
    expect((await looks()).drafted).toEqual(["1 cap"])
    await press(`${item(1, "cap")} [data-draft="ADD"]`)
    expect((await looks()).drafted).toEqual(["1 cap"])
    await opened.page.locator(`${item(1, "cap")} .notes_htmlView`).fill("y")
    await press(`${item(1, "cap")} [data-draft="ADD"]`)
    expect(await looks()).toEqual({ drafted: [], expanded: shut, actions: closed, focused: "1 cap Revise", written: null })
    await opened.page.evaluate(() => document.getElementById("drafting")?.remove())
  })

  test("the editor's own controls work as drawn with no module in: Revise opens its form, Escape closes it, its fold control folds its frame; pointing by hovering, which isn't a control, is the mouse's, a module's", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "bare"
      containerElement.style.width = "48rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 1 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: window.parseLines_ViewModel({ multilineText: "ONE", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
            { kind: "PROPOSAL_LIST", items: [{ source: "open", title: "Open", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "Why.", requests: [], actions: [{ command: "revise", label: "Revise", stateAfter: "REQUESTED" as const }], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
          ]
        }])
      })
    })
    // what's pointed at, what's drafted, where the keyboard is, and whether
    // the frame's folded
    const looks = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return {
        pointed: document.querySelectorAll("#bare [data-pointed]").length,
        drafted: document.querySelectorAll("#bare .item_htmlView[data-drafting]").length,
        typing: document.activeElement?.matches("#bare .notes_htmlView") ?? false,
        folded: document.querySelectorAll("#bare .frame_htmlView[data-folded]").length
      }
    })
    const centerOf = (selector: string) => opened.page.evaluate((selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      if (rect === undefined) throw new Error(`no ${selector}`)
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }, selector)
    const words = await centerOf("#bare .rationale_htmlView")
    await opened.page.mouse.move(words.x, words.y)
    expect(await looks()).toEqual({ pointed: 0, drafted: 0, typing: false, folded: 0 })
    const revise = await centerOf("#bare .item_htmlView .action_htmlView")
    await opened.page.mouse.click(revise.x, revise.y)
    expect(await looks()).toEqual({ pointed: 0, drafted: 1, typing: true, folded: 0 })
    await opened.page.keyboard.press("Escape")
    expect(await looks()).toEqual({ pointed: 0, drafted: 0, typing: false, folded: 0 })
    const fold = await centerOf("#bare .fold_htmlView")
    await opened.page.mouse.click(fold.x, fold.y)
    expect(await looks()).toEqual({ pointed: 0, drafted: 0, typing: false, folded: 1 })
    await opened.page.evaluate(() => document.getElementById("bare")?.remove())
  })

  test("where an item is, a fact, small and upright: its count a line, and each condition a line under it, hanging off the count by a hook, however wide the list, the proposal it names a chip; what you asked a quote, ruled and labelled in its state's ink", async () => {
    const laid = (width: string) => opened.page.evaluate((width) => {
      const containerElement = document.createElement("div")
      containerElement.style.width = width
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "FRAME",
        range: { first: 1, last: 1 },
        parts: [
          { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
          { kind: "PROPOSAL_LIST", items: [{ source: "round", title: "Rename", state: "REQUESTED" as const, status: "Revision requested", places: { kind: "COUNT" as const, count_Here: 6, count_All: 9, conditions: [{ kind: "WITHIN" as const, count: 1, source: "hook", title: "Drop the hook" }, { kind: "CARRIED" as const, count: 1, source: "order", title: "Ask first" }] }, rationale: "Why.", requests: [{ id: "option", notes: "make it an option.", reference: null, progress: null, isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }], actions: [], isRunning: false, isStartable: true, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
        ]
      }]))
      const lines = [...containerElement.querySelectorAll(".places_htmlView > *")].map((line) => line.getBoundingClientRect())
      const [condition] = containerElement.querySelectorAll(".condition_htmlView")
      const reference = containerElement.querySelector(".reference_htmlView")
      const places = containerElement.querySelector(".places_htmlView")
      const request = containerElement.querySelector(".request_htmlView")
      const status = containerElement.querySelector(".status_htmlView")
      const looks = {
        oneLine: lines.every((line) => line.top === lines[0]?.top),
        aLineEach: lines.every((line, index) => index === 0 || line.top >= (lines[index - 1]?.bottom ?? 0)),
        before: condition === undefined ? "" : getComputedStyle(condition, "::before").content,
        chip: reference === null ? "" : getComputedStyle(reference).backgroundColor !== "rgba(0, 0, 0, 0)",
        upright: places === null ? "" : `${getComputedStyle(places).fontStyle} ${parseFloat(getComputedStyle(places).fontSize) < parseFloat(getComputedStyle(containerElement.querySelector(".rationale_htmlView") ?? places).fontSize)}`,
        ruled: request === null || status === null ? false : getComputedStyle(request).borderLeftColor === getComputedStyle(status).color && getComputedStyle(request.querySelector(".label_Request_htmlView") ?? request).color === getComputedStyle(status).color
      }
      containerElement.remove()
      return looks
    }, width)
    expect(await laid("56rem")).toEqual({ oneLine: false, aLineEach: true, before: '""', chip: true, upright: "normal true", ruled: true })
    expect(await laid("28rem")).toEqual({ oneLine: false, aLineEach: true, before: '""', chip: true, upright: "normal true", ruled: true })
  })

  test("a proposal listed in several frames has an arrow up and an arrow down after its count, to its item in the frame before and after, the first and last with the arrow they haven't there off; following one, by the mouse or the keyboard, goes to that item, its arrow the same way where the one pressed was, under the pointer, the keyboard on it, or on the other at an end; the item brought into the window where the one pressed is out of it; one listed once has none", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "visiting"
      containerElement.style.width = "48rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const lineOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })
      const itemOf = (source: string, count_Here: number) => ({ source, title: source, state: "OPEN" as const, status: "", places: { kind: "COUNT" as const, count_Here, count_All: 4, conditions: [] }, rationale: "Why.", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })
      // lines enough between the frames that going from one to the next scrolls
      const between = (id: string) => ({ kind: "LINES" as const, run: { id, lines: lineOf(Array.from({ length: 40 }, (_, index) => `line ${index}`).join("\n")), groups: [] } })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([
          { kind: "FRAME", range: { first: 1, last: 1 }, parts: [{ kind: "CURRENT_LINES", run: { id: "current-1", lines: lineOf("one"), groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round", 1), itemOf("alone", 4)] }] },
          between("between-1"),
          { kind: "FRAME", range: { first: 42, last: 42 }, parts: [{ kind: "CURRENT_LINES", run: { id: "current-42", lines: lineOf("one"), groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round", 2)] }] },
          between("between-2"),
          { kind: "FRAME", range: { first: 83, last: 83 }, parts: [{ kind: "CURRENT_LINES", run: { id: "current-83", lines: lineOf("one"), groups: [] } }, { kind: "PROPOSAL_LIST", items: [itemOf("round", 1)] }] }
        ])
      })
    })
    const item = (first: number, source: string) => `#visiting .frame_htmlView:has(> .fold_htmlView[data-fold-first="${first}"]) .item_htmlView[data-source="${source}"]`
    // each item's arrows, their way, whether they're on, and their label; and
    // where the keyboard is
    const looks = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const frameOf = (element: Element) => element.closest(".frame_htmlView")?.querySelector(":scope > .fold_htmlView")?.getAttribute("data-fold-first")
      const focused = document.activeElement
      return {
        arrows: [...document.querySelectorAll("#visiting .item_htmlView")].map((each) => `${frameOf(each)} ${each.getAttribute("data-source")}: ${[...each.querySelectorAll(".extent_htmlView .neighbor_htmlView")].map((arrow) => `${arrow.getAttribute("data-way")} ${arrow.hasAttribute("disabled") ? "off" : "on"} "${arrow.getAttribute("aria-label")}"`).join(", ")}`),
        focused: focused !== null && focused.matches("#visiting .neighbor_htmlView") ? `${frameOf(focused)} ${focused.getAttribute("data-way")}` : "elsewhere"
      }
    })
    // where an item's arrow is in the window, once the scroll's done
    const arrow = (first: number, way: string) => `${item(first, "round")} .neighbor_htmlView[data-way="${way}"]`
    const topOf = (selector: string) => opened.page.evaluate(async (selector) => {
      for (let scrollY_Last = Number.NaN; scrollY_Last !== scrollY;) {
        scrollY_Last = scrollY
        await new Promise((resolve) => setTimeout(resolve, 120))
      }
      return Math.round(document.querySelector(selector)?.getBoundingClientRect().top ?? Number.NaN)
    }, selector)
    expect((await looks()).arrows).toEqual([
      `1 round: PREVIOUS off "No change of this proposal above", NEXT on "Down to this proposal at line 42"`,
      "1 alone: ",
      `42 round: PREVIOUS on "Up to this proposal at line 1", NEXT on "Down to this proposal at line 83"`,
      `83 round: PREVIOUS on "Up to this proposal at line 42", NEXT off "No change of this proposal below"`
    ])
    // down from the first, by the mouse: the middle one's arrow down where
    // the one pressed was, under the pointer, the keyboard on it
    await opened.page.evaluate(() => scrollTo(0, 0))
    const top_Pressed = await topOf(arrow(1, "NEXT"))
    const down = await opened.page.evaluate((selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      return { x: (rect?.left ?? 0) + (rect?.width ?? 0) / 2, y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2 }
    }, arrow(1, "NEXT"))
    await opened.page.mouse.click(down.x, down.y)
    expect((await looks()).focused).toBe("42 NEXT")
    expect(await topOf(arrow(42, "NEXT"))).toBe(top_Pressed)
    expect(await opened.page.evaluate(({ down, selector }) => document.elementFromPoint(down.x, down.y)?.closest(selector) !== null, { down, selector: arrow(42, "NEXT") })).toBe(true)
    // on again, by the keyboard: the last's arrow down there in its turn,
    // off, as it has none down, the keyboard on its arrow up beside it
    await opened.page.keyboard.press("Enter")
    expect((await looks()).focused).toBe("83 PREVIOUS")
    expect(await topOf(arrow(83, "NEXT"))).toBe(top_Pressed)
    // and back up, by the keyboard
    await opened.page.keyboard.press("Enter")
    expect((await looks()).focused).toBe("42 PREVIOUS")
    expect(await topOf(arrow(42, "PREVIOUS"))).toBe(top_Pressed)
    // with the arrow pressed scrolled out of the window, no place to keep:
    // the item it goes to brought into the window
    await opened.page.evaluate(() => scrollBy(0, innerHeight * 2))
    await opened.page.keyboard.press("Enter")
    expect((await looks()).focused).toBe("1 NEXT")
    const top_Fallen = await topOf(item(1, "round"))
    expect(top_Fallen >= 0 && top_Fallen < (await opened.page.evaluate(() => innerHeight))).toBe(true)
    await opened.page.evaluate(() => {
      document.getElementById("visiting")?.remove()
      scrollTo(0, 0)
    })
  })

  test("in a narrow list, an item's actions go under its words, still on the right, wrapping if they must; in a wide one, beside them", async () => {
    // where an item's actions are, against its words, in a list as wide as
    // its view
    const placed = (width: string) => opened.page.evaluate((width) => {
      const containerElement = document.createElement("div")
      containerElement.style.width = width
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const review = [
        { command: "accept", label: "Accept", stateAfter: "ACCEPTED" as const },
        { command: "reject", label: "Reject", stateAfter: "REJECTED" as const },
        { command: "revise", label: "Revise", stateAfter: "REQUESTED" as const }
      ]
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "FRAME",
        range: { first: 1, last: 1 },
        parts: [
          { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
          { kind: "PROPOSAL_LIST", items: [{ source: "open", title: "Open", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "Why it's proposed, at some length, so it wraps where it's narrow.", requests: [], actions: review, isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
        ]
      }]))
      const rectOf = (selector: string) => containerElement.querySelector(selector)?.getBoundingClientRect()
      const [words, actions, item] = [rectOf(".rationale_htmlView"), rectOf(".item_htmlView > .actions_htmlView"), containerElement.querySelector(".item_htmlView")]
      const [accept, revise] = [rectOf(".item_htmlView .action_htmlView"), rectOf(".item_htmlView .action_htmlView:last-child")]
      const right = item === null ? 0 : item.getBoundingClientRect().right - parseFloat(getComputedStyle(item).paddingRight)
      containerElement.remove()
      return {
        under: (actions?.top ?? 0) >= (words?.bottom ?? 0),
        beside: (actions?.left ?? 0) >= (words?.right ?? 0),
        right: Math.round(actions?.right ?? 0) === Math.round(right),
        wrapped: (revise?.top ?? 0) > (accept?.top ?? 0)
      }
    }, width)
    expect(await placed("56rem")).toEqual({ under: false, beside: true, right: true, wrapped: false })
    expect(await placed("28rem")).toEqual({ under: true, beside: false, right: true, wrapped: false })
    expect(await placed("12rem")).toEqual({ under: true, beside: false, right: true, wrapped: true })
  })

  test("each proposal's item shows its title, its state after it, a muted word, where it is, why it's proposed, what was asked of it, and its actions, each a button carrying its command, each of those only when it says something; its state as data; each where the host lists it, whatever its state; only an open one's first action the main one", async () => {
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
              { source: "taken", title: "Taken already", state: "ACCEPTED" as const, status: "Accepted", places: { kind: "NONE" as const }, rationale: "It was right.", requests: [], actions: [{ command: "reopen", label: "Reopen", stateAfter: "OPEN" as const }], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} },
              { source: "most", title: "Most of the orders", state: "OPEN" as const, status: "", places: { kind: "COUNT" as const, count_Here: 2, count_All: 5, conditions: [{ kind: "WITHIN" as const, count: 1, source: "lathe", title: "Cut the lathe" }, { kind: "CARRIED" as const, count: 1, source: "shift", title: "Shift it down" }] }, rationale: "Most of them need the lathe.", requests: [], actions: [{ command: "accept", label: "Accept", stateAfter: "ACCEPTED" as const }, { command: "reject", label: "Reject", stateAfter: "REJECTED" as const }], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} },
              { source: "all", title: "All of them", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [{ command: "accept", label: "Take it", stateAfter: "ACCEPTED" as const }], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} },
              { source: "capped", title: "Cap it", state: "REQUESTED" as const, status: "Revision requested", places: { kind: "NONE" as const }, rationale: "", requests: [{ id: "option", notes: "make it an option.", reference: null, progress: null, isRunning: false, isStartable: true, isRemovable: true, isEditing: false, isStoppable: false, detail_Progress: null, isDismissable: false }], actions: [{ command: "reopen", label: "Reopen", stateAfter: "OPEN" as const }], isRunning: false, isStartable: true, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }
            ]
          }
        ]
      }]))
      const isShown = (element: Element | null) => element !== null && getComputedStyle(element).display !== "none"
      return [...containerElement.querySelectorAll(".item_htmlView")].map((itemElement) => {
        const action_First = itemElement.querySelector(".actions_htmlView > button")
        return {
          source: itemElement.getAttribute("data-source"),
          state: itemElement.getAttribute("data-state"),
          shown: [...itemElement.children].filter(isShown).map((element) => element.className),
          heading: [...itemElement.querySelectorAll(".heading_htmlView > *")].filter(isShown).map((element) => [getComputedStyle(element, "::before").content, element.textContent, getComputedStyle(element, "::after").content].map((part) => part === "none" ? "" : part?.startsWith('"') ? part.replaceAll('"', "") : part).join("")).join(""),
          // each line of where it is, and the proposals it names, by source
          places: [...itemElement.querySelectorAll(".places_htmlView > *")].map((line) => line.textContent),
          references: [...itemElement.querySelectorAll(".places_htmlView .reference_htmlView")].map((reference) => `${reference.getAttribute("data-source")} ${getComputedStyle(reference).fontStyle}`),
          rationale: itemElement.querySelector(".rationale_htmlView")?.textContent,
          request: [...itemElement.querySelectorAll(".request_htmlView > *")].map((part) => part.textContent),
          actions: [...itemElement.querySelectorAll(".actions_htmlView > button")].map((buttonElement) => `${buttonElement.getAttribute("type")} ${buttonElement.getAttribute("data-command")}: ${buttonElement.textContent}`),
          main: action_First !== null && getComputedStyle(action_First).color === "rgb(255, 255, 255)"
        }
      })
    })
    expect(items).toEqual([
      { source: "taken", state: "ACCEPTED", shown: ["heading_htmlView", "rationale_htmlView", "actions_htmlView"], heading: "Taken already · Accepted", places: [], references: [], rationale: "It was right.", request: [], actions: ["button reopen: Reopen"], main: false },
      { source: "most", state: "OPEN", shown: ["heading_htmlView", "places_htmlView", "rationale_htmlView", "actions_htmlView"], heading: "Most of the orders", places: ["2 of 5 changes here", "1 of them only if Cut the lathe is rejected", "1 of them moved with Shift it down"], references: ["lathe normal", "shift normal"], rationale: "Most of them need the lathe.", request: [], actions: ["button accept: Accept", "button reject: Reject"], main: true },
      { source: "all", state: "OPEN", shown: ["heading_htmlView", "actions_htmlView"], heading: "All of them", places: [], references: [], rationale: "", request: [], actions: ["button accept: Take it"], main: true },
      { source: "capped", state: "REQUESTED", shown: ["heading_htmlView", "request_htmlView", "actions_htmlView"], heading: "Cap it · Revision requested", places: [], references: [], rationale: "", request: ["Requests…Start", "…EditStartRemovemake it an option."], actions: ["button reopen: Reopen"], main: false }
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

  test("what JSX draws again keeps what's drawn where it can: an element of the same tag and class, whose data attributes, those both have, are the same, kept, wherever it is among its siblings, its attributes the description's, any it doesn't give gone; one whose data attribute differs drawn anew; text kept and changed; more drawn, fewer gone; one written with no children keeping what's drawn into it after, as a run's underlays are; so what the browser holds on an element, the keyboard's place, holds", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      const draw = (node_Jsx: Parameters<typeof window.draw__Node_Jsx>[0]["node_Jsx"]) => window.draw__Node_Jsx({
        node_Jsx,
        containerElement
      })
      draw(window.jsx("p", { class: "drawn", title: "one", "data-gone": "", children: ["text", window.jsx("button", { "data-command": "press", children: "press" }), window.jsx("em", { "data-place": "1", children: "em" })] }))
      const [paragraph, button, em, text] = [containerElement.querySelector("p"), containerElement.querySelector("button"), containerElement.querySelector("em"), containerElement.querySelector("p")?.firstChild]
      button?.focus({ preventScroll: true })
      // as the view sets what it measures, once it's drawn
      button?.setAttribute("data-measured", "")
      draw(window.jsx("p", { class: "drawn", title: "two", "data-pointed": "", children: ["changed", window.jsx("button", { "data-command": "press", children: "press" }), window.jsx("em", { "data-place": "2", children: "em" }), window.jsx("i", {})] }))
      const again = {
        html: containerElement.innerHTML,
        kept: [containerElement.querySelector("p") === paragraph, containerElement.querySelector("p")?.firstChild === text, containerElement.querySelector("button") === button, containerElement.querySelector("em") === em],
        focused: document.activeElement === button
      }
      draw(window.jsx("p", { class: "drawn", children: "only" }))
      const fewer = {
        html: containerElement.innerHTML,
        kept: containerElement.querySelector("p") === paragraph
      }
      // siblings the other way round, each kept
      draw([window.jsx("i", { "data-x": "1" }), window.jsx("i", { "data-x": "2" })])
      const [one, two] = containerElement.children
      draw([window.jsx("i", { "data-x": "2" }), window.jsx("i", { "data-x": "1" })])
      const turned = {
        html: containerElement.innerHTML,
        kept: [containerElement.children[0] === two, containerElement.children[1] === one]
      }
      // written with no children, what's drawn into it after kept; given
      // children, even none, they're the description's
      draw(window.jsx("svg", { class: "under" }))
      const svgElement = containerElement.querySelector("svg")
      svgElement?.append(document.createElementNS("http://www.w3.org/2000/svg", "g"))
      draw(window.jsx("svg", { class: "under" }))
      const left = svgElement?.childElementCount
      draw(window.jsx("svg", { class: "under", children: [] }))
      const emptied = svgElement?.childElementCount
      containerElement.remove()
      return { again, fewer, turned, left, emptied }
    })
    expect(drawn).toEqual({
      again: { html: `<p class="drawn" title="two" data-pointed="">changed<button data-command="press">press</button><em data-place="2">em</em><i></i></p>`, kept: [true, true, true, false], focused: true },
      fewer: { html: `<p class="drawn">only</p>`, kept: true },
      turned: { html: `<i data-x="2"></i><i data-x="1"></i>`, kept: [true, true] },
      left: 1,
      emptied: 0
    })
  })

  test("a frame drawn again keeps its elements, so what the browser holds on them holds: hovered, its fold control stays shown as what's pointed at in it changes, at no draw without it; the keyboard stays on an action as the pointer moves", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "kept"
      containerElement.style.width = "48rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const review = [
        { command: "accept", label: "Accept", stateAfter: "ACCEPTED" as const },
        { command: "reject", label: "Reject", stateAfter: "REJECTED" as const }
      ]
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 1 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: window.parseLines_ViewModel({ multilineText: "ONE", module_Language: window.MODULE_PLAINTEXT }), groups: [] } },
            { kind: "PROPOSAL_LIST", items: [
              { source: "one", title: "One", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "Why one.", requests: [], actions: review, isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} },
              { source: "two", title: "Two", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "Why two.", requests: [], actions: review, isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }
            ] }
          ]
        }])
      })
    })
    const frames = () => opened.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const centerOf = (selector: string) => opened.page.evaluate((selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      if (rect === undefined) throw new Error(`no ${selector}`)
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }, selector)
    const one = await centerOf("#kept .item_htmlView:nth-child(1) .rationale_htmlView")
    const two = await centerOf("#kept .item_htmlView:nth-child(2) .rationale_htmlView")
    await opened.page.mouse.move(one.x, one.y)
    await frames()
    // at each draw, before it's painted: whether the frame's the one that
    // was there, whether it's hovered, and how shown its fold control is
    await opened.page.evaluate(() => {
      const frame = document.querySelector("#kept .frame_htmlView")
      const seen: Array<string> = []
      Object.assign(window, { seen_Kept: seen })
      new MutationObserver(() => {
        const frame_Now = document.querySelector("#kept .frame_htmlView")
        const fold = frame_Now?.querySelector(".fold_htmlView")
        seen.push(`${frame_Now === frame ? "kept" : "new"} ${frame_Now?.matches(":hover") ? "hovered" : "not hovered"} ${fold === null || fold === undefined ? "none" : getComputedStyle(fold).opacity}`)
      }).observe(document.getElementById("kept") ?? document.body, { childList: true, subtree: true, attributes: true })
    })
    for (const point of [two, one, two, one]) {
      await opened.page.mouse.move(point.x, point.y)
      await frames()
    }
    const seen = await opened.page.evaluate(() => (window as unknown as { seen_Kept: Array<string> }).seen_Kept)
    expect(seen.length).toBeGreaterThan(0)
    expect([...new Set(seen)]).toEqual(["kept hovered 1"])
    // the keyboard on the second's Reject, then the pointer on the first:
    // drawn again, the keyboard's still there
    await opened.page.mouse.move(two.x, two.y)
    await frames()
    await opened.page.evaluate(() => {
      const accept = document.querySelector<HTMLElement>("#kept .item_htmlView:nth-child(2) .action_htmlView")
      accept?.focus({ preventScroll: true })
    })
    await opened.page.keyboard.press("Tab")
    await opened.page.evaluate(() => Object.assign(window, { focused_Kept: document.activeElement }))
    await opened.page.mouse.move(one.x, one.y)
    await frames()
    expect(await opened.page.evaluate(() => {
      const focused = (window as unknown as { focused_Kept: Element | null }).focused_Kept
      return {
        pointed: [...document.querySelectorAll("#kept .item_htmlView[data-pointed]")].map((item) => item.getAttribute("data-source")),
        kept: document.activeElement === focused && focused?.isConnected === true,
        on: `${document.activeElement?.closest(".item_htmlView")?.getAttribute("data-source")} ${document.activeElement?.textContent}`
      }
    })).toEqual({ pointed: ["one"], kept: true, on: "two Reject" })
    await opened.page.evaluate(() => document.getElementById("kept")?.remove())
  })

  test("each run of lines draws one svg behind its lines' text, in layers, one for each thing its underlays say, in order: the rings' fills, the rings, the requests' marks, the pointed proposal's rings; in each, a group for each of its groups with something there, a ring's area in the first, its ring and its lap in the second, each carrying its data", async () => {
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
              { kind: "STRETCH" as const, from: { line: 0, offset: 4 }, to: { line: 1, offset: 7 }, attributes: { "data-underlay": "box" } },
              { kind: "STRETCH" as const, from: { line: 1, offset: 0 }, to: { line: 1, offset: 3 }, attributes: { "data-change": "inserted", "data-source": "most" } }
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
        layers: [...svgElement.children].map((layerElement) => ({
          tag: layerElement.localName,
          layer: layerElement.getAttribute("data-layer"),
          groups: [...layerElement.children].map((groupElement) => ({
            tag: groupElement.localName,
            source: groupElement.getAttribute("data-source"),
            paths: [...groupElement.children].map((pathElement) => ({
              tag: pathElement instanceof SVGPathElement ? "path" : pathElement.localName,
              class: pathElement.getAttribute("class"),
              attributes: [...pathElement.attributes].map((attribute) => attribute.name).filter((name) => name.startsWith("data-")),
              shapes: (pathElement.getAttribute("d")?.match(/M/g) ?? []).length,
              fill: getComputedStyle(pathElement).fill
            }))
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
      layers: [
        {
          tag: "g",
          layer: "FILLS",
          groups: [{
            tag: "g",
            source: "most",
            paths: [
              { tag: "path", class: "area_htmlView", attributes: ["data-underlay"], shapes: 1, fill: "none" },
              { tag: "path", class: "area_htmlView", attributes: ["data-change", "data-source"], shapes: 1, fill: "none" }
            ]
          }]
        },
        {
          tag: "g",
          layer: "RINGS",
          groups: [{
            tag: "g",
            source: "most",
            paths: [
              { tag: "path", class: "underlay_htmlView", attributes: ["data-underlay"], shapes: 1, fill: "none" },
              { tag: "path", class: "lap_htmlView", attributes: ["data-underlay"], shapes: 1, fill: "none" },
              { tag: "path", class: "underlay_htmlView", attributes: ["data-change", "data-source"], shapes: 1, fill: "none" },
              { tag: "path", class: "lap_htmlView", attributes: ["data-change", "data-source"], shapes: 1, fill: "none" }
            ]
          }]
        },
        {
          tag: "g",
          layer: "MARKS",
          groups: []
        },
        {
          tag: "g",
          layer: "POINTED",
          groups: []
        }
      ]
    })
  })

  test("with room a look gives them, underlays reach past their words' ink into spaces and the row's ends, never into another character, staying clear of its ink, and never meet: rows over one another twice the block inset apart, as are rings beside each other, touching or a space apart; one inside another's stretch further in; one alone its full reach", async () => {
    const gaps = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-underlay-inset-block", "1px")
      containerElement.style.setProperty("--view-underlay-inset-inline", "-6px")
      document.body.append(containerElement)
      const stretch = (line: number, from: number, to: number) => ({ kind: "STRETCH" as const, from: { line, offset: from }, to: { line, offset: to }, attributes: {} })
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

  test("a ring inside another's stretch is as much further from its rows' top and bottom as a look says, its nest, its path that far from its container's; given none, twice the block inset; and where it starts with its container, pressed on by a character, it keeps its own reach past its words, its container reaching its nest further, room made for both", async () => {
    const gaps = await opened.page.evaluate(async () => {
      const gapOf = async (variables: string) => {
        const containerElement = document.createElement("div")
        containerElement.style.width = "40rem"
        containerElement.setAttribute("style", `width: 40rem; --view-font-size: 14px; --view-underlay-inset-block: 1px; ${variables}`)
        document.body.append(containerElement)
        const [line] = window.parseLines_ViewModel({ multilineText: "drop the round here", module_Language: window.MODULE_PLAINTEXT })
        if (line === undefined) throw new Error("the line wasn't parsed")
        new window._View_TextEditor_({
          containerElement,
          componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
        }).draw(window.viewModelOf__Blocks([{
          kind: "LINES",
          run: { id: "document", lines: [line], groups: [
            { attributes: { "data-source": "drop" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 19 }, attributes: { "data-change": "removed", "data-source": "drop" } }] },
            { attributes: { "data-source": "round" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 9 }, to: { line: 0, offset: 14 }, attributes: { "data-change": "replaced", "data-source": "round", "data-within": "drop" } }] }
          ] }
        }]))
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const [outer, inner] = [...containerElement.querySelectorAll(".underlay_htmlView")].map((path) => path instanceof SVGPathElement ? path.getBBox() : new DOMRect())
        containerElement.remove()
        if (outer === undefined || inner === undefined) throw new Error("the rings weren't drawn")
        return [inner.y - outer.y, outer.y + outer.height - (inner.y + inner.height)].map((gap) => Math.round(gap * 100) / 100)
      }
      // round, inside round === max, both starting after a (, pressed on: the
      // gaps between their paths at the left, top and bottom, and whether
      // round's ring is clear of its word's cell
      const pressedOf = async () => {
        const containerElement = document.createElement("div")
        containerElement.setAttribute("style", "width: 40rem; --view-font-size: 14px")
        containerElement.dataset["look"] = "changes"
        document.body.append(containerElement)
        const [line] = window.parseLines_ViewModel({ multilineText: "if (round === max) go", module_Language: window.MODULE_PLAINTEXT })
        const [segment] = line?.segments ?? []
        if (line === undefined || segment === undefined) throw new Error("the line wasn't parsed")
        const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
        const moved = { "data-change": "moved", "data-side": "before", "data-source": "order" }
        const renamed = { "data-change": "replaced", "data-side": "before", "data-source": "round" }
        new window._View_TextEditor_({
          containerElement,
          componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
        }).draw(window.viewModelOf__Blocks([{
          kind: "LINES",
          run: { id: "document", lines: [{ ...line, segments: [{ text: textOf("if ("), attributes: {} }, { text: textOf("round"), attributes: { ...moved, "data-edit": "round" } }, { text: textOf(" === max"), attributes: moved }, { text: textOf(") go"), attributes: {} }] }], groups: [
            { attributes: { "data-source": "order" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 4 }, to: { line: 0, offset: 17 }, attributes: moved }] },
            { attributes: { "data-source": "round" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 4 }, to: { line: 0, offset: 9 }, attributes: renamed }] }
          ] }
        }]))
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const [outer, inner] = [...containerElement.querySelectorAll(".underlay_htmlView")].map((path) => path.getBoundingClientRect())
        const word = containerElement.querySelector('.text_htmlView [data-edit="round"]')?.getBoundingClientRect()
        containerElement.remove()
        if (outer === undefined || inner === undefined || word === undefined) throw new Error("the rings weren't drawn")
        return {
          gaps: [inner.left - outer.left, inner.top - outer.top, outer.bottom - inner.bottom].map((gap) => Math.round(gap * 100) / 100),
          clearOfWord: inner.right > word.right && inner.left < word.left
        }
      }
      return {
        given: await gapOf("--view-underlay-nest: 3px"),
        none: await gapOf(""),
        pressed: await pressedOf()
      }
    })
    expect(gaps).toEqual({ given: [3, 3], none: [2, 2], pressed: { gaps: [3, 3, 3], clearOfWord: true } })
  })

  test("in the changes look, a ring replaced and restyled is dotted, its dashes round dots, heavier than a restyle's dashed ring, but solid at half strength where it's latent and dashed where it was written before your edits, as every ring is; and every dashed ring's dashes fitted by one formula, an element on each corner, its sides' elements evenly spaced, near the look's own pattern", async () => {
    const rings = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.append(containerElement)
      const ringOf = (
        from: number,
        to: number,
        attributes: Record<string, string>
      ) => ({ kind: "STRETCH" as const, from: { line: 0, offset: from }, to: { line: 0, offset: to }, attributes: { "data-side": "before", "data-source": "most", ...attributes } })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: {
          id: "document",
          lines: window.parseLines_ViewModel({ multilineText: "one two three four", module_Language: window.MODULE_PLAINTEXT }),
          groups: [{
            attributes: { "data-source": "most" },
            underlays: [
              ringOf(0, 3, { "data-change": "restyled" }),
              ringOf(4, 7, { "data-change": "replacedRestyled" }),
              ringOf(8, 13, { "data-change": "replacedRestyled", "data-within": "other" }),
              ringOf(14, 18, { "data-change": "replacedRestyled", "data-stale": "" })
            ]
          }]
        }
      }]))
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      // a ring's pieces, each its points; a solid ring one piece, its
      // dashes' and dots' many, an element on each of its corners, bent
      // round it, three points, and those along its sides, two
      const piecesOf = (element: Element) => (element.getAttribute("d") ?? "").split("M").filter((part) => part.trim() !== "").map((part) => {
        const numbers = (part.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number)
        return Array.from({ length: Math.floor(numbers.length / 2) }, (_, index) => ({ x: numbers[2 * index] ?? 0, y: numbers[2 * index + 1] ?? 0 }))
      })
      const round = (length: number) => Math.round(length * 100) / 100
      const drawn = [...containerElement.querySelectorAll(".underlay_htmlView")].map((element) => {
        const style = getComputedStyle(element)
        const pieces = piecesOf(element)
        const along = [...new Set(pieces.filter((piece) => piece.length === 2).map(([from, to]) => round(Math.hypot((to?.x ?? 0) - (from?.x ?? 0), (to?.y ?? 0) - (from?.y ?? 0)))))]
        return `${element.getAttribute("data-change")}${element.hasAttribute("data-within") ? " latent" : ""}${element.hasAttribute("data-stale") ? " stale" : ""}: ${style.strokeWidth} ${style.strokeLinecap} ${style.strokeOpacity} ${pieces.length === 1 ? "solid" : `elements ${along.join(" ")}`}`
      })
      // the formula, on the restyle's ring and the dotted one: an element
      // on each of the four corners, its arms half an element each; each
      // side's corners and the middles of its elements evenly spaced, no
      // more than a third from the look's own pitch
      const fitted = [[0, 5], [1, 4]].map(([index = 0, pitch = 0]) => {
        const element = containerElement.querySelectorAll(".underlay_htmlView")[index]
        if (!(element instanceof SVGPathElement)) return null
        const box = element.getBBox()
        const pieces = piecesOf(element)
        const corners = pieces.filter((piece) => piece.length === 3)
        const isCorner = (x: number, y: number) => [box.x, box.x + box.width].some((each) => Math.abs(each - x) < 0.01) && [box.y, box.y + box.height].some((each) => Math.abs(each - y) < 0.01)
        const arms = [...new Set(corners.flatMap(([from, at, to]) => [Math.hypot((at?.x ?? 0) - (from?.x ?? 0), (at?.y ?? 0) - (from?.y ?? 0)), Math.hypot((to?.x ?? 0) - (at?.x ?? 0), (to?.y ?? 0) - (at?.y ?? 0))].map(round)))]
        const middles = pieces.filter((piece) => piece.length === 2).map(([from, to]) => ({ x: ((from?.x ?? 0) + (to?.x ?? 0)) / 2, y: ((from?.y ?? 0) + (to?.y ?? 0)) / 2 }))
        const sides = [
          { on: (y: number) => Math.abs(y - box.y) < 0.01, ofPoint: (point: { x: number, y: number }) => point.y, along: (point: { x: number, y: number }) => point.x, ends: [box.x, box.x + box.width] },
          { on: (y: number) => Math.abs(y - box.y - box.height) < 0.01, ofPoint: (point: { x: number, y: number }) => point.y, along: (point: { x: number, y: number }) => point.x, ends: [box.x, box.x + box.width] },
          { on: (x: number) => Math.abs(x - box.x) < 0.01, ofPoint: (point: { x: number, y: number }) => point.x, along: (point: { x: number, y: number }) => point.y, ends: [box.y, box.y + box.height] },
          { on: (x: number) => Math.abs(x - box.x - box.width) < 0.01, ofPoint: (point: { x: number, y: number }) => point.x, along: (point: { x: number, y: number }) => point.y, ends: [box.y, box.y + box.height] }
        ]
        const isEven = sides.every((side) => {
          const spots = [...side.ends, ...middles.filter((middle) => side.on(side.ofPoint(middle))).map(side.along)].sort((a, b) => a - b)
          const spacings = spots.slice(1).map((spot, at) => spot - (spots[at] ?? 0))
          const spacing = spacings[0] ?? 0
          return Math.max(...spacings) - Math.min(...spacings) < 0.01 && spacing > pitch * 2 / 3 && spacing < pitch * 4 / 3
        })
        return {
          corners: corners.filter(([, at]) => isCorner(at?.x ?? 0, at?.y ?? 0)).length,
          arms,
          isEven
        }
      })
      containerElement.remove()
      return { drawn, fitted }
    })
    expect(rings).toEqual({
      drawn: [
        "restyled: 1px butt 1 elements 3",
        "replacedRestyled: 2px round 1 elements 0.02",
        "replacedRestyled latent: 1px butt 0.5 solid",
        "replacedRestyled stale: 1px butt 1 elements 3"
      ],
      fitted: [
        { corners: 4, arms: [1.5], isEven: true },
        { corners: 4, arms: [0.01], isEven: true }
      ]
    })
  })

  test("switching the look on, after drawing, measures the underlays again; with it on, a change pressed on by punctuation has room made, its ring reaching past its word's ink the same on both sides", async () => {
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
          groups: [{ attributes: { "data-source": "most" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 2 }, to: { line: 0, offset: 3 }, attributes: change }] }]
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
      containerElement.dataset["look"] = "changes"
      await frames()
      return { before, after: reachOf() }
    })
    expect(widths).toEqual({ before: { left: 0, right: 0 }, after: { left: 3, right: 3 } })
  })

  test("with the look on, a change's end pressed on by another character has just the room it lacks, whatever the glyphs leave between them: its ring as far past its ink, and as clear of the other's, as at any end; two changes touching, of two proposals, their rings as far apart as any two; an end beside a space, none; all of it the font's, twice as much at twice the size", async () => {
    const endsAt = (fontSize: number) => opened.page.evaluate(async (fontSize) => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-font-size", `${fontSize}px`)
      containerElement.dataset["look"] = "changes"
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
      const underlayOf = (index: number) => ({ kind: "STRETCH" as const, from: { line: 0, offset: offsets[index] ?? 0 }, to: { line: 0, offset: (offsets[index] ?? 0) + 1 }, attributes: changeOf(pieces[index]?.[1] ?? "") })
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

  test("a ring a line break or a wrap cuts in two, its parts not one over the other, has its sides at the cut drawn apart from it, as seams, a path each: the first part's right side and the next part's left, the ring open there, each running corner to corner, its dashes fitted as every dashed path's are, half a dash at each end, its share of the corner's, the rest whole, evenly spaced, near the look's own; one whose parts are one over the other is one shape, with none", async () => {
    const cuts = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "20rem"
      containerElement.style.setProperty("--view-font-size", "14px")
      containerElement.dataset["look"] = "changes"
      document.body.append(containerElement)
      const view = new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      })
      const words = "aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk llll mmmm nnnn oooo pppp"
      const lines = window.parseLines_ViewModel({ multilineText: `the first line ends with this\nand the next starts here\n${words}`, module_Language: window.MODULE_PLAINTEXT })
      const change = { "data-change": "removed", "data-side": "before", "data-source": "most" }
      const stretch = (line: number, from: number, lineTo: number, to: number) => ({ kind: "STRETCH" as const, from: { line, offset: from }, to: { line: lineTo, offset: to }, attributes: change })
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
      // the look's own dash pattern for a path, read from a copy the view
      // hasn't fitted
      const patternOf = (element: Element) => {
        const copy = element.cloneNode()
        if (!(copy instanceof Element)) return []
        copy.removeAttribute("style")
        element.parentElement?.append(copy)
        const lengths = (getComputedStyle(copy).strokeDasharray.match(/\d*\.?\d+/g) ?? []).map(Number)
        copy.remove()
        return lengths
      }
      // a seam's dashes fitted: half a dash at each end, its share of the
      // corner's, the rest whole, their middles and the ends evenly
      // spaced, no more than a third from the look's own pattern
      const isFitted = (seamElement: Element) => {
        const [dash = 0, gap = 0] = patternOf(seamElement)
        const pieces = (seamElement.getAttribute("d") ?? "").split("M").filter((part) => part.trim() !== "").map((part) => {
          const numbers = (part.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number)
          return [numbers[1] ?? 0, numbers[3] ?? 0].sort((a, b) => a - b)
        }).sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0))
        const first = pieces[0]
        const last = pieces.at(-1)
        if (first === undefined || last === undefined || pieces.length < 2) return false
        const middles = [first[0] ?? 0, ...pieces.slice(1, -1).map(([from = 0, to = 0]) => (from + to) / 2), last[1] ?? 0]
        const spacings = middles.slice(1).map((middle, index) => middle - (middles[index] ?? 0))
        const spacing = spacings[0] ?? 0
        return Math.max(...spacings) - Math.min(...spacings) < 0.01
          && spacing > (dash + gap) * 2 / 3 && spacing < (dash + gap) * 4 / 3
          && Math.abs((first[1] ?? 0) - (first[0] ?? 0) - dash / 2) < 0.01 && Math.abs((last[1] ?? 0) - (last[0] ?? 0) - dash / 2) < 0.01
          && pieces.slice(1, -1).every(([from = 0, to = 0]) => Math.abs(to - from - dash) < 0.01)
      }
      const xsOf = (element: Element | undefined) => numbersOf(element).filter((_, index) => index % 2 === 0)
      const ysOf = (element: Element | undefined) => numbersOf(element).filter((_, index) => index % 2 === 1)
      return [...containerElement.querySelectorAll(".underlay_htmlView")].map((ringElement) => {
        const box = ringElement instanceof SVGPathElement ? ringElement.getBBox() : new DOMRect()
        const seamElements: Array<Element> = []
        for (let element = ringElement.nextElementSibling; element?.classList.contains("seam_htmlView"); element = element.nextElementSibling) seamElements.push(element)
        const xs_First = xsOf(seamElements[0])
        const xs_Next = xsOf(seamElements[1])
        const ys_First = ysOf(seamElements[0])
        const ys_Next = ysOf(seamElements[1])
        return {
          wrapped: wrap > 0,
          ringShapes: (ringElement.getAttribute("d")?.match(/M/g) ?? []).length,
          ringClosed: ringElement.getAttribute("d")?.includes("Z") ?? false,
          seams: seamElements.length,
          seamsUpright: seamElements.length === 0 || (new Set(xs_First).size === 1 && new Set(xs_Next).size === 1),
          firstAtRingsRight: seamElements.length === 0 || xs_First[0] === box.x + box.width,
          nextAtRingsLeft: seamElements.length === 0 || xs_Next[0] === box.x,
          nextBelowFirst: seamElements.length === 0 || Math.min(...ys_Next) > Math.max(...ys_First) - 0.01,
          cornerToCorner: seamElements.length === 0 || Math.abs(Math.min(...ys_First) - box.y) < 0.01 && Math.abs(Math.max(...ys_Next) - (box.y + box.height)) < 0.01,
          dashesFitted: seamElements.every(isFitted),
          seamAttributes: seamElements.map((seamElement) => [...seamElement.attributes].map((attribute) => attribute.name).filter((name) => name.startsWith("data-")))
        }
      })
    })
    const attributes = ["data-change", "data-side", "data-source"]
    const cut = { wrapped: true, ringShapes: 2, ringClosed: false, seams: 2, seamsUpright: true, firstAtRingsRight: true, nextAtRingsLeft: true, nextBelowFirst: true, cornerToCorner: true, dashesFitted: true, seamAttributes: [attributes, attributes] }
    expect(cuts).toEqual([
      cut,
      cut,
      { wrapped: true, ringShapes: 1, ringClosed: true, seams: 0, seamsUpright: true, firstAtRingsRight: true, nextAtRingsLeft: true, nextBelowFirst: true, cornerToCorner: true, dashesFitted: true, seamAttributes: [] }
    ])
  })

  test("a ring across an empty line, as a moved block's across the blank lines between its heading, its paragraph and its table, is one shape, closed, no seams, each empty line bridged as wide as the narrower of the lines either side of it; one whose lines either side of an empty line aren't one over the other still cut there, with seams", async () => {
    const rings = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.append(containerElement)
      const view = new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      })
      const lines = window.parseLines_ViewModel({ multilineText: "## a heading\n\na longer paragraph under the heading\n\n| a | table |", module_Language: window.MODULE_PLAINTEXT })
      const change = { "data-change": "moved", "data-side": "before", "data-source": "most" }
      const ringOf = async (from: { line: number, offset: number }, to: { line: number, offset: number }) => {
        view.draw(window.viewModelOf__Blocks([{
          kind: "LINES",
          run: { id: "document", lines, groups: [{ attributes: { "data-source": "most" }, underlays: [{ kind: "STRETCH" as const, from, to, attributes: change }] }] }
        }]))
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const ringElement = containerElement.querySelector(".underlay_htmlView")
        const box = ringElement instanceof SVGPathElement ? ringElement.getBBox() : new DOMRect()
        const textElements = [...containerElement.querySelectorAll(".text_htmlView")]
        const top_Svg = ringElement instanceof SVGPathElement ? ringElement.ownerSVGElement?.getBoundingClientRect().top ?? 0 : 0
        const top_First = (textElements[from.line]?.getBoundingClientRect().top ?? 0) - top_Svg
        const bottom_Last = (textElements[to.line]?.getBoundingClientRect().bottom ?? 0) - top_Svg
        const top_Third = (textElements[from.line + 2]?.getBoundingClientRect().top ?? 0) - top_Svg
        const number$ = (ringElement?.getAttribute("d")?.match(/-?[\d.]+/g) ?? []).map(Number)
        const point$ = number$.flatMap((number, index) => index % 2 === 0 ? [[number, number$[index + 1] ?? 0] as const] : [])
        const right_First = Math.max(...point$.filter(([, y]) => Math.abs(y - box.y) < 0.01).map(([x]) => x))
        return {
          shapes: (ringElement?.getAttribute("d")?.match(/M/g) ?? []).length,
          isClosed: ringElement?.getAttribute("d")?.includes("Z") ?? false,
          seams: containerElement.querySelectorAll(".seam_htmlView").length,
          spansItsLines: Math.abs(box.y - top_First) < 2 && Math.abs(box.y + box.height - bottom_Last) < 2,
          // its right side running straight down from its first row's right
          // to the top of the line after the empty one, the empty line as
          // wide as the first row, the narrower
          isBridged_Narrower: point$.some(([x, y]) => Math.abs(x - right_First) < 0.01 && Math.abs(y - top_Third) < 1)
        }
      }
      // the heading to the table, across the two empty lines, a ring's
      // height inside its lines' tops and bottoms; then from the
      // paragraph's last word, past where the table's line ends, across
      // the empty line to the table's first three characters
      const result = [await ringOf({ line: 0, offset: 0 }, { line: 4, offset: 13 }), await ringOf({ line: 2, offset: 29 }, { line: 4, offset: 3 })]
      containerElement.remove()
      return result
    })
    expect(rings).toEqual([
      { shapes: 1, isClosed: true, seams: 0, spansItsLines: true, isBridged_Narrower: true },
      { shapes: 2, isClosed: false, seams: 2, spansItsLines: true, isBridged_Narrower: false }
    ])
  })

  test("a line's note, as the view model says it, is a button after its text, its label shown, going where it says, but holding no text, so it's never part of the line's; a line without one has none", async () => {
    const notes = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      const [moving, staying] = window.parseLines_ViewModel({ multilineText: "function sleep(ms) {\n}", module_Language: window.MODULE_PLAINTEXT })
      if (moving === undefined || staying === undefined) throw new Error("the lines weren't parsed")
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: { id: "document", lines: [{ ...moving, note: { label: "moved", target: { source: "move", side: "after" } } }, staying], groups: [] }
      }]))
      return [...containerElement.querySelectorAll(".text_htmlView")].map((textElement) => {
        const buttonElement = textElement.querySelector(":scope > .note_htmlView")
        return {
          text: textElement.textContent,
          note: buttonElement === null ? null : {
            tag: buttonElement.localName,
            last: buttonElement === textElement.lastElementChild,
            label: buttonElement.getAttribute("aria-label"),
            shown: getComputedStyle(buttonElement, "::before").content,
            target: [buttonElement.getAttribute("data-target-source"), buttonElement.getAttribute("data-target-side")]
          }
        }
      })
    })
    expect(notes).toEqual([
      { text: "function sleep(ms) {", note: { tag: "button", last: true, label: "moved", shown: '"moved"', target: ["move", "after"] } },
      { text: "}", note: null }
    ])
  })

  test("a frame whose range is empty is a point between two lines: it says it's before its first, and draws only what it's given, no lines as they are", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      const lines = window.parseLines_ViewModel({ multilineText: "new", module_Language: window.MODULE_PLAINTEXT })
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "FRAME",
        range: { first: 6, last: 5 },
        parts: [{ kind: "PROPOSAL_LINES", run: { id: "point", lines, groups: [] } }]
      }]))
      const frameElement = containerElement.querySelector(".frame_htmlView")
      const drawn_Frame = { label: frameElement?.getAttribute("aria-label"), current: frameElement?.querySelectorAll(".current_htmlView").length, proposed: frameElement?.querySelectorAll(".proposed_htmlView .line_htmlView").length }
      containerElement.remove()
      return drawn_Frame
    })
    expect(drawn).toEqual({ label: "before line 6", current: 0, proposed: 1 })
  })

  test("every frame is set apart from what follows it, the document's ground below it, so its bar ends with it, and a frame right after another, no line between them, plainly starts; a frame touches the lines before it; and its proposals start where its lines' text does, though in another font", async () => {
    const drawn = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      document.body.append(containerElement)
      const [one, two, three, four] = window.parseLines_ViewModel({ multilineText: "one\ntwo\nthree\nfour", module_Language: window.MODULE_PLAINTEXT })
      if (one === undefined || two === undefined || three === undefined || four === undefined) throw new Error("the lines weren't parsed")
      const item = { source: "s", title: "Title", state: "OPEN" as const, status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([
        { kind: "LINES", run: { id: "before", lines: [one], groups: [] } },
        { kind: "FRAME", range: { first: 2, last: 2 }, parts: [{ kind: "CURRENT_LINES", run: { id: "two", lines: [two], groups: [] } }, { kind: "PROPOSAL_LIST", items: [item] }] },
        // a label three characters wide, so the text starts three of the
        // text's ch in, as the proposals must, though their font's another
        { kind: "FRAME", range: { first: 3, last: 3 }, parts: [{ kind: "CURRENT_LINES", run: { id: "three", lines: [{ ...three, gutter: { ...three.gutter, label: "100" } }], groups: [] } }] },
        { kind: "LINES", run: { id: "after", lines: [four], groups: [] } }
      ]))
      const [runBefore, frameTwo, frameThree, runAfter] = [...containerElement.querySelector(".htmlView_editor > .document_htmlView")?.children ?? []].map((element) => element.getBoundingClientRect())
      const title = containerElement.querySelector(".title_htmlView")?.getBoundingClientRect()
      const text = containerElement.querySelector(".frame_htmlView .text_htmlView")?.getBoundingClientRect()
      const lineHeight = containerElement.querySelector(".line_htmlView")?.getBoundingClientRect().height
      if (runBefore === undefined || frameTwo === undefined || frameThree === undefined || runAfter === undefined || title === undefined || text === undefined || lineHeight === undefined) throw new Error("the blocks weren't drawn")
      containerElement.remove()
      return {
        gaps: [frameTwo.top - runBefore.bottom, frameThree.top - frameTwo.bottom, runAfter.top - frameThree.bottom].map((gap) => Math.round(gap / lineHeight * 100) / 100),
        proposalsWithText: Math.abs(title.left - text.left) < 0.5
      }
    })
    expect(drawn).toEqual({ gaps: [0, 0.5, 0.5], proposalsWithText: true })
  })

  test("a frame's lines as they are are hatched backwards, at 45deg, two stripes to a line, in the grey of the lines as proposed, or in a stripe a host gives; its lines as proposed, beneath them, on a grey band, unhatched, its proposals on the same a shade darker", async () => {
    const drawn = await opened.page.evaluate(() => {
      const drawnOf = (variables: string) => {
        const hostElement = document.createElement("div")
        hostElement.setAttribute("style", variables)
        const containerElement = document.createElement("div")
        hostElement.append(containerElement)
        document.body.append(hostElement)
        const [line] = window.parseLines_ViewModel({ multilineText: "one", module_Language: window.MODULE_PLAINTEXT })
        if (line === undefined) throw new Error("the line wasn't parsed")
        new window._View_TextEditor_({
          containerElement,
          componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
        }).draw(window.viewModelOf__Blocks([{ kind: "FRAME", range: { first: 1, last: 1 }, parts: [{ kind: "CURRENT_LINES", run: { id: "current", lines: [line], groups: [] } }, { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [line], groups: [] } }, { kind: "PROPOSAL_LIST", items: [{ source: "one", title: "One", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }] }]))
        const currentElement = containerElement.querySelector(".current_htmlView")
        const proposedElement = containerElement.querySelector(".proposed_htmlView")
        const proposalsElement = containerElement.querySelector(".proposals_htmlView")
        const lineHeight = containerElement.querySelector(".line_htmlView")?.getBoundingClientRect().height
        if (currentElement === null || proposedElement === null || proposalsElement === null || lineHeight === undefined) throw new Error("the frame wasn't drawn")
        const current = getComputedStyle(currentElement)
        const proposed = getComputedStyle(proposedElement)
        const proposals = getComputedStyle(proposalsElement)
        const drawn_Frame = {
          current: {
            angle: /^linear-gradient\((\d+)deg/.exec(current.backgroundImage)?.[1] ?? "none",
            host: current.backgroundImage.includes("rgb(1, 2, 3)"),
            asProposed: current.backgroundImage.includes(proposed.backgroundColor),
            twoToALine: current.backgroundSize.split(" ").map((size) => Math.round(parseFloat(size) / lineHeight * 100) / 100)
          },
          proposed: {
            hatched: proposed.backgroundImage !== "none",
            grey: proposed.backgroundColor !== "rgba(0, 0, 0, 0)"
          },
          proposals: {
            onProposed: proposals.backgroundColor === proposed.backgroundColor,
            shaded: proposals.backgroundImage.startsWith("linear-gradient") && !proposals.backgroundImage.includes("rgba(0, 0, 0, 0)")
          }
        }
        hostElement.remove()
        return drawn_Frame
      }
      return {
        own: drawnOf(""),
        host: drawnOf("--view-current-stripe: rgb(1, 2, 3)")
      }
    })
    expect(drawn).toEqual({
      own: { current: { angle: "45", host: false, asProposed: true, twoToALine: [0.5, 0.5] }, proposed: { hatched: false, grey: true }, proposals: { onProposed: true, shaded: true } },
      host: { current: { angle: "45", host: true, asProposed: false, twoToALine: [0.5, 0.5] }, proposed: { hatched: false, grey: true }, proposals: { onProposed: true, shaded: true } }
    })
  })

  test("pressing a move's note goes to its other end: the editor scrolls it into view; and back", async () => {
    await opened.page.setViewportSize({ width: 900, height: 400 })
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "jumping"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      // a long document, its first line moving to its end, ninety lines on
      const texts = ["moving", ...Array.from({ length: 90 }, (_, index) => `line ${index + 2}`), "moving"]
      const lines = window.parseLines_ViewModel({ multilineText: texts.join("\n"), module_Language: window.MODULE_PLAINTEXT })
      const moved = (side: string) => ({ "data-change": "moved", "data-side": side, "data-source": "move" })
      const marked = lines.map((line, index) => index === 0 || index === lines.length - 1 ? {
        ...line,
        note: index === 0 ? { label: "moved", target: { source: "move", side: "after" } } : { label: "from line 1", target: { source: "move", side: "before" } },
        segments: line.segments.map((segment) => ({ ...segment, attributes: moved(index === 0 ? "before" : "after") }))
      } : line)
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "LINES",
          run: { id: "document", lines: marked, groups: [{ attributes: { "data-source": "move" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 6 }, attributes: moved("before") }, { kind: "STRETCH" as const, from: { line: lines.length - 1, offset: 0 }, to: { line: lines.length - 1, offset: 6 }, attributes: moved("after") }] }] }
        }])
      })
      scrollTo(0, 0)
    })
    // which ends are in view
    const shown = () => opened.page.evaluate(() => Object.fromEntries(["before", "after"].map((side) => {
      const rect = document.querySelector(`#jumping .text_htmlView [data-side="${side}"]`)?.getBoundingClientRect()
      return [side, rect !== undefined && rect.top >= 0 && rect.bottom <= innerHeight]
    })))
    // an end come into view, all of it, as the page scrolls to it
    const arrived = (side: string) => opened.page.waitForFunction((side) => {
      const rect = document.querySelector(`#jumping .text_htmlView [data-side="${side}"]`)?.getBoundingClientRect()
      return rect !== undefined && rect.top >= 0 && rect.bottom <= innerHeight
    }, side, { timeout: 3000 })
    expect(await shown()).toEqual({ before: true, after: false })
    await opened.page.click('#jumping .note_htmlView[data-target-side="after"]')
    await arrived("after")
    expect(await shown()).toEqual({ before: false, after: true })
    await opened.page.click('#jumping .note_htmlView[data-target-side="before"]')
    await arrived("before")
    expect(await shown()).toEqual({ before: true, after: false })
    await opened.page.evaluate(() => document.querySelector("#jumping")?.remove())
    await opened.page.setViewportSize({ width: 1280, height: 720 })
  })

  test("pointing at a move's note marks its other end, data-targeted on its rings, which the look draws heavier, from either end; its own end it leaves as it is; and pointing away marks none", async () => {
    // the pointer away from where the test before left it, over its first
    // note, where this one's is drawn: the browser may send a move of its own
    // as what's under a resting pointer changes. The page at its top at once,
    // ending the smooth scroll the test before may have left running, which
    // would move the notes as they're pointed at, and could put the first
    // under this view's header, stuck over it
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      scrollTo({
        top: 0,
        behavior: "instant"
      })
      const containerElement = document.createElement("div")
      containerElement.id = "targeting"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const lines = window.parseLines_ViewModel({ multilineText: "moving\nstaying\nmoving", module_Language: window.MODULE_PLAINTEXT })
      const moved = (side: string) => ({ "data-change": "moved", "data-side": side, "data-source": "move" })
      const marked = lines.map((line, index) => index === 1 ? line : {
        ...line,
        note: index === 0 ? { label: "moved", target: { source: "move", side: "after" } } : { label: "from line 1", target: { source: "move", side: "before" } },
        segments: line.segments.map((segment) => ({ ...segment, attributes: moved(index === 0 ? "before" : "after") }))
      })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "LINES",
          run: { id: "document", lines: marked, groups: [{ attributes: { "data-source": "move" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: 6 }, attributes: moved("before") }, { kind: "STRETCH" as const, from: { line: 2, offset: 0 }, to: { line: 2, offset: 6 }, attributes: moved("after") }] }] }
        }])
      })
    })
    // each ring, its side, and how it's drawn: whether it's targeted, and
    // its stroke's width; its area never filled
    const targeted = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return ["before", "after"].map((side) => {
        const ring = document.querySelector(`#targeting .underlay_htmlView[data-side="${side}"]`)
        const area = document.querySelector(`#targeting .area_htmlView[data-side="${side}"]`)
        if (ring === null || area === null) throw new Error(`the ${side} ring wasn't drawn`)
        return `${side}${ring.hasAttribute("data-targeted") ? " targeted" : ""} ${getComputedStyle(ring).strokeWidth}${getComputedStyle(area).fill === "none" ? "" : " filled"}`
      })
    })
    const at = async (side: string) => {
      const point = await opened.page.evaluate((side) => {
        const rect = document.querySelector(`#targeting .note_htmlView[data-target-side="${side}"]`)?.getBoundingClientRect()
        if (rect === undefined) throw new Error(`no note goes to ${side}`)
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }, side)
      await opened.page.mouse.move(point.x, point.y)
    }
    expect(await targeted()).toEqual(["before 1px", "after 1px"])
    await at("after")
    expect(await targeted()).toEqual(["before 1px", "after targeted 2px"])
    await at("before")
    expect(await targeted()).toEqual(["before targeted 2px", "after 1px"])
    await opened.page.mouse.move(1270, 715)
    expect(await targeted()).toEqual(["before 1px", "after 1px"])
    await opened.page.evaluate(() => document.getElementById("targeting")?.remove())
  })

  test("a frame folds and unfolds by its control, a chevron in the gutter at its first line, and by its bar: folded, its lines as proposed alone, nothing ringed, no room made, no list, its control always there; unfolded, its control there only while it's hovered; one that only takes lines out folds to a strip a line tall", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "folding"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      // two proposals on its first line, one on its second too, their
      // changes pressed on by brackets and a comma, so the view makes room
      // for their rings where they're drawn
      const [one, three, two] = window.parseLines_ViewModel({ multilineText: "f(one, two)\ng(three)\ntwo", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = one?.segments ?? []
      if (one === undefined || three === undefined || two === undefined || segment === undefined) throw new Error("the lines weren't parsed")
      const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
      const change = (side: string, source: string, place: string) => ({ "data-change": "replaced", "data-side": side, "data-source": source, "data-place": place })
      const pieced = (line: typeof one, pieces: Array<[string, Record<string, string>]>) => ({ ...line, segments: pieces.map(([text, attributes]) => ({ text: textOf(text), attributes })) })
      const runOf = (side: string, id: string, ones: Array<string>) => ({
        id,
        lines: [
          pieced(one, [["f(", {}], [ones[0]!, change(side, "most", "one")], [", ", {}], [ones[1]!, change(side, "more", "two")], [")", {}]]),
          pieced(three, [["g(", {}], [ones[2]!, change(side, "most", "three")], [")", {}]])
        ],
        groups: [
          { attributes: { "data-source": "most" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 2 }, to: { line: 0, offset: 5 }, attributes: change(side, "most", "one") }, { kind: "STRETCH" as const, from: { line: 1, offset: 2 }, to: { line: 1, offset: 7 }, attributes: change(side, "most", "three") }] },
          { attributes: { "data-source": "more" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 7 }, to: { line: 0, offset: 10 }, attributes: change(side, "more", "two") }] }
        ]
      })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([
          { kind: "FRAME", range: { first: 1, last: 2 }, parts: [
            { kind: "CURRENT_LINES", run: runOf("before", "current", ["one", "two", "three"]) },
            { kind: "PROPOSAL_LINES", run: runOf("after", "proposed", ["ONE", "TWO", "THREE"]) },
            { kind: "PROPOSAL_LIST", items: [{ source: "most", title: "Shout", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }, { source: "more", title: "Shout more", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
          ] },
          { kind: "FRAME", range: { first: 3, last: 3 }, parts: [
            { kind: "CURRENT_LINES", run: { id: "gone-current", lines: [two], groups: [] } },
            { kind: "PROPOSAL_LINES", run: { id: "gone-proposed", lines: [], groups: [] } }
          ] }
        ])
      })
    })
    // each frame, by its label: whether it's folded, what it shows, its
    // rings, each its proposal and its stroke's width, whether room's made
    // for them, and its control
    const frames = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return [...document.querySelectorAll("#folding .frame_htmlView")].map((frame) => {
        const control = frame.querySelector(":scope > .fold_htmlView")
        const lineHeight = parseFloat(getComputedStyle(frame).lineHeight)
        return {
          label: frame.getAttribute("aria-label"),
          folded: frame.hasAttribute("data-folded"),
          shows: [...frame.querySelectorAll(".current_htmlView, .proposed_htmlView, .proposals_htmlView")].map((part) => `${part.className} ${part.querySelectorAll(".line_htmlView, .item_htmlView").length}`),
          rings: [...frame.querySelectorAll(".underlay_htmlView")].map((ring) => `${ring.getAttribute("data-place")} ${getComputedStyle(ring).strokeWidth}`),
          room: [...frame.querySelectorAll(".text_htmlView *")].some((span) => span instanceof HTMLElement && span.style.length > 0),
          control: `${control?.localName} ${control?.getAttribute("aria-expanded")} "${control?.getAttribute("aria-label")}" ${getComputedStyle(control ?? frame).opacity}`,
          tall: Math.round(frame.getBoundingClientRect().height / lineHeight * 10) / 10
        }
      })
    })
    const at = async (label: string, selector: string) => {
      const point = await opened.page.evaluate(({ label, selector }) => {
        const frame = [...document.querySelectorAll("#folding .frame_htmlView")].find((each) => each.getAttribute("aria-label") === label)
        const rect = frame?.querySelector(selector)?.getBoundingClientRect()
        if (rect === undefined) throw new Error(`no ${selector} in ${label}`)
        return { x: rect.left + rect.width / 2, y: rect.top + Math.min(rect.height / 2, 8) }
      }, { label, selector })
      await opened.page.mouse.move(point.x, point.y)
      return point
    }
    await opened.page.mouse.move(1270, 715)
    const unfolded = await frames()
    expect(unfolded.map((frame) => [frame.folded, frame.shows, frame.rings.length, frame.room, frame.control])).toEqual([
      [false, ["current_htmlView 2", "proposed_htmlView 2", "proposals_htmlView 2"], 6, true, `button true "Fold lines 1 to 2" 0`],
      [false, ["current_htmlView 1", "proposed_htmlView 0"], 0, false, `button true "Fold line 3" 0`]
    ])
    await at("lines 1 to 2", ".line_htmlView")
    expect((await frames())[0]?.control).toBe(`button true "Fold lines 1 to 2" 1`)
    await opened.page.mouse.click(...Object.values(await at("lines 1 to 2", ".fold_htmlView")) as [number, number])
    await frames()
    await opened.page.mouse.click(...Object.values(await at("line 3", ".bar_htmlView")) as [number, number])
    await opened.page.mouse.move(1270, 715)
    const folded = await frames()
    expect(folded.map((frame) => [frame.folded, frame.shows, frame.rings, frame.room, frame.control])).toEqual([
      [true, ["proposed_htmlView 2"], [], false, `button false "Unfold lines 1 to 2" 1`],
      [true, ["proposed_htmlView 0"], [], false, `button false "Unfold line 3" 1`]
    ])
    expect(folded[1]?.tall).toBe(1)
    await opened.page.mouse.click(...Object.values(await at("lines 1 to 2", ".bar_htmlView")) as [number, number])
    await opened.page.mouse.move(1270, 715)
    expect((await frames()).map((frame) => frame.folded)).toEqual([false, true])
    await opened.page.evaluate(() => document.getElementById("folding")?.remove())
  })

  test("a folded frame's control, hovered, peeks at it: its changes ringed, all of them, every proposal's, plain, room made for them; off its control, the peek ends; folded under a still pointer, on its control, it's peeked at at once; a folded frame's text, and its lines' signs, point at nothing; what's pointed at, once a fold's drawn, what's under the pointer then", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "peeking"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const [one, three, again] = window.parseLines_ViewModel({ multilineText: "f(one, two)\ng(three)\nh(two)", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = one?.segments ?? []
      if (one === undefined || three === undefined || again === undefined || segment === undefined) throw new Error("the lines weren't parsed")
      const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
      const change = (side: string, source: string, place: string) => ({ "data-change": "replaced", "data-side": side, "data-source": source, "data-place": place })
      const pieced = (line: typeof one, pieces: Array<[string, Record<string, string>]>) => ({ ...line, segments: pieces.map(([text, attributes]) => ({ text: textOf(text), attributes })) })
      const runOf = (side: string, id: string, ones: Array<string>) => ({
        id,
        lines: [
          pieced(one, [["f(", {}], [ones[0]!, change(side, "most", "one")], [", ", {}], [ones[1]!, change(side, "more", "two")], [")", {}]]),
          pieced(three, [["g(", {}], [ones[2]!, change(side, "most", "three")], [")", {}]])
        ],
        groups: [
          { attributes: { "data-source": "most" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 2 }, to: { line: 0, offset: 5 }, attributes: change(side, "most", "one") }, { kind: "STRETCH" as const, from: { line: 1, offset: 2 }, to: { line: 1, offset: 7 }, attributes: change(side, "most", "three") }] },
          { attributes: { "data-source": "more" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 7 }, to: { line: 0, offset: 10 }, attributes: change(side, "more", "two") }] }
        ]
      })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([
          { kind: "FRAME", range: { first: 1, last: 2 }, parts: [
            { kind: "CURRENT_LINES", run: runOf("before", "current", ["one", "two", "three"]) },
            { kind: "PROPOSAL_LINES", run: runOf("after", "proposed", ["ONE", "TWO", "THREE"]) },
            { kind: "PROPOSAL_LIST", items: [{ source: "most", title: "Shout", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }, { source: "more", title: "Shout more", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
          ] },
          // another frame, unfolded, the second proposal in it too
          { kind: "FRAME", range: { first: 3, last: 3 }, parts: [
            { kind: "CURRENT_LINES", run: { id: "again-current", lines: [pieced(again, [["h(", {}], ["two", change("before", "more", "again")], [")", {}]])], groups: [{ attributes: { "data-source": "more" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 2 }, to: { line: 0, offset: 5 }, attributes: change("before", "more", "again") }] }] } },
            { kind: "PROPOSAL_LINES", run: { id: "again-proposed", lines: [pieced(again, [["h(", {}], ["TWO", change("after", "more", "again")], [")", {}]])], groups: [{ attributes: { "data-source": "more" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 2 }, to: { line: 0, offset: 5 }, attributes: change("after", "more", "again") }] }] } }
          ] }
        ])
      })
    })
    // the folded frame's rings, each its place and its stroke's width, and
    // whether room's made for them; and the other frame's rings
    const peeked = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const [frame, frame_Other] = document.querySelectorAll("#peeking .frame_htmlView")
      if (frame === undefined || frame_Other === undefined) throw new Error("the frames weren't drawn")
      const ringsOf = (element: Element) => [...element.querySelectorAll(".underlay_htmlView")].map((ring) => `${ring.getAttribute("data-place")} ${getComputedStyle(ring).strokeWidth}`)
      return {
        rings: ringsOf(frame),
        room: [...frame.querySelectorAll(".text_htmlView *")].some((span) => span instanceof HTMLElement && span.style.length > 0),
        other: ringsOf(frame_Other)
      }
    })
    const at = async (selector: string) => {
      const point = await opened.page.evaluate((selector) => {
        const rect = document.querySelector(`#peeking ${selector}`)?.getBoundingClientRect()
        if (rect === undefined) throw new Error(`no ${selector}`)
        return { x: rect.left + rect.width / 2, y: rect.top + Math.min(rect.height / 2, 8) }
      }, selector)
      await opened.page.mouse.move(point.x, point.y)
      return point
    }
    const plain = ["again 1px", "again 1px"]
    const all = ["one 1px", "three 1px", "two 1px"]
    await opened.page.mouse.click(...Object.values(await at(".fold_htmlView")) as [number, number])
    await opened.page.mouse.move(1270, 715)
    expect(await peeked()).toEqual({ rings: [], room: false, other: plain })
    await at(".fold_htmlView")
    expect(await peeked()).toEqual({ rings: all, room: true, other: plain })
    await at(".text_htmlView [data-source='more']")
    expect(await peeked()).toEqual({ rings: [], room: false, other: plain })
    await at(".line_htmlView .label_htmlView")
    expect(await peeked()).toEqual({ rings: [], room: false, other: plain })
    // unfolded and folded again, the pointer still on its control: peeked
    // at as soon as it's folded, the pointer not moving
    const point_Fold = await at(".fold_htmlView")
    await opened.page.mouse.click(point_Fold.x, point_Fold.y)
    await opened.page.mouse.click(point_Fold.x, point_Fold.y)
    expect(await peeked()).toEqual({ rings: all, room: true, other: plain })
    // the folded frame unfolded under a still pointer, on the other frame's
    // change, moving it down: what's pointed at is what's under the pointer
    // once it's drawn, as a move there finds, not what was there before
    const pointed = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      return [...new Set([...document.querySelectorAll("#peeking [data-pointed][data-source]")].map((element) => element.getAttribute("data-source")))]
    })
    const point_Again = await at(".text_htmlView [data-place='again']")
    expect(await pointed()).toEqual(["more"])
    await opened.page.evaluate(() => {
      const fold = document.querySelector("#peeking .fold_htmlView")
      const rect = fold?.getBoundingClientRect()
      fold?.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: (rect?.left ?? 0) + 2, clientY: (rect?.top ?? 0) + 2 }))
    })
    const pointed_Still = await pointed()
    await opened.page.mouse.move(1270, 715)
    await opened.page.mouse.move(point_Again.x, point_Again.y)
    const pointed_Moved = await pointed()
    expect(pointed_Moved).not.toEqual(["more"])
    expect(pointed_Still).toEqual(pointed_Moved)
    await opened.page.evaluate(() => document.getElementById("peeking")?.remove())
  })

  test("a removal's other side, where its words were, is a notch: a point in a line, a wedge over the row, its tip on the point; a boundary between lines, a wedge on the frame's bar, its tip toward the text; filled in the removal's colour, taking no room; pointed at with its removal, and pointing at it points at its removal; pressing the bar's notch presses the notch, so the frame isn't folded, and pressing the bar elsewhere folds it", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "notches"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const [sleep, retry, done] = window.parseLines_ViewModel({ multilineText: "await sleep(n, signal);\nonRetry(n);\ndone();", module_Language: window.MODULE_PLAINTEXT })
      const [slept] = window.parseLines_ViewModel({ multilineText: "await sleep(n);", module_Language: window.MODULE_PLAINTEXT })
      if (sleep === undefined || retry === undefined || done === undefined || slept === undefined) throw new Error("the lines weren't parsed")
      const out = (side: string, place: string) => ({ "data-change": "removed", "data-side": side, "data-source": "out", "data-place": place })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 3 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: [sleep, retry, done], groups: [{ attributes: { "data-source": "out" }, underlays: [
              { kind: "STRETCH" as const, from: { line: 0, offset: 13 }, to: { line: 0, offset: 21 }, attributes: out("before", "1") },
              { kind: "STRETCH" as const, from: { line: 1, offset: 0 }, to: { line: 1, offset: 11 }, attributes: out("before", "2") }
            ] }] } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [slept, done], groups: [{ attributes: { "data-source": "out" }, underlays: [
              { kind: "POINT" as const, at: { line: 0, offset: 13 }, attributes: out("after", "1") },
              { kind: "BOUNDARY" as const, line: 1, attributes: out("after", "2") }
            ] }] } },
            { kind: "PROPOSAL_LIST", items: [{ source: "out", title: "Take it out", state: "OPEN", status: "", places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} }] }
          ]
        }])
      })
    })
    // each notch: where its tip is, against where it should be, its fill,
    // and how it's drawn, pointed at or not; and whether the lines as
    // proposed moved for it
    const notches = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const container = document.getElementById("notches")
      const [point, boundary] = container?.querySelectorAll(".underlay_htmlView[data-notch]") ?? []
      const [line_Slept, line_Done] = container?.querySelectorAll(".proposed_htmlView .line_htmlView > .text_htmlView") ?? []
      const bar = container?.querySelector(".bar_htmlView")
      if (point === undefined || boundary === undefined || line_Slept === undefined || line_Done === undefined || bar === undefined || bar === null) throw new Error("the notches weren't drawn")
      const range = document.createRange()
      const text = [...line_Slept.querySelectorAll("*")].flatMap((element) => [...element.childNodes]).find((node): node is Text => node instanceof Text && node.data.includes(");"))
      if (text === undefined) throw new Error("no text for the point")
      range.setStart(text, text.data.indexOf(");"))
      range.setEnd(text, text.data.indexOf(");") + 1)
      const character = range.getBoundingClientRect()
      const box_Point = point.getBoundingClientRect()
      const box_Boundary = boundary.getBoundingClientRect()
      const barRight = bar.getBoundingClientRect().right - parseFloat(getComputedStyle(bar).paddingRight)
      const near = (one: number, other: number) => Math.abs(one - other) <= 1.5
      const drawn = (notch: Element) => `${notch.getAttribute("data-notch")} ${getComputedStyle(notch).fill === "none" ? "unfilled" : "filled"} ${notch.hasAttribute("data-pointed") ? "place" : notch.closest(".group_htmlView")?.hasAttribute("data-pointed") ? "proposal" : "-"} ${getComputedStyle(notch).strokeWidth}`
      return {
        point: `${near(box_Point.left + box_Point.width / 2, character.left) ? "on the point" : `off by ${box_Point.left + box_Point.width / 2 - character.left}`}, ${box_Point.bottom <= character.top + 2 && box_Point.bottom >= character.top - 2 ? "over the row" : `tip at ${box_Point.bottom - character.top}`}`,
        boundary: `${near(box_Boundary.left, barRight) ? "at the bar" : `off the bar by ${box_Boundary.left - barRight}`}, ${near(box_Boundary.top + box_Boundary.height / 2, line_Done.getBoundingClientRect().top) ? "on the boundary" : "off the boundary"}`,
        drawn: [drawn(point), drawn(boundary)],
        room: [...line_Slept.querySelectorAll("*")].some((span) => span instanceof HTMLElement && span.style.length > 0),
        rings: [...(container?.querySelectorAll(".current_htmlView .underlay_htmlView") ?? [])].map((ring) => ring.hasAttribute("data-pointed") ? "place" : "-")
      }
    })
    const atCenter = async (selector: string) => {
      const point = await opened.page.evaluate((selector) => {
        const rect = document.querySelector(`#notches ${selector}`)?.getBoundingClientRect()
        if (rect === undefined) throw new Error(`no ${selector}`)
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }, selector)
      await opened.page.mouse.move(point.x, point.y)
    }
    expect(await notches()).toEqual({
      point: "on the point, over the row",
      boundary: "at the bar, on the boundary",
      drawn: ["point filled - 1px", "boundary filled - 1px"],
      room: false,
      rings: ["-", "-"]
    })
    await atCenter(".current_htmlView .area_htmlView[data-place='1']")
    expect((await notches()).drawn).toEqual(["point filled place 3px", "boundary filled proposal 2px"])
    await atCenter(".underlay_htmlView[data-notch='point']")
    expect((await notches()).rings).toEqual(["place", "-"])
    await atCenter(".underlay_htmlView[data-notch='boundary']")
    expect((await notches()).rings).toEqual(["-", "place"])
    await opened.page.mouse.move(1270, 715)
    expect((await notches()).drawn).toEqual(["point filled - 1px", "boundary filled - 1px"])
    const isFolded = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return document.querySelector("#notches .frame_htmlView")?.hasAttribute("data-folded")
    })
    const notch_Bar = await opened.page.evaluate(() => {
      const rect = document.querySelector("#notches .underlay_htmlView[data-notch='boundary']")?.getBoundingClientRect()
      if (rect === undefined) throw new Error("no notch on the bar")
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })
    await opened.page.mouse.click(notch_Bar.x, notch_Bar.y)
    expect(await isFolded()).toBe(false)
    const bar_Top = await opened.page.evaluate(() => {
      const rect = document.querySelector("#notches .bar_htmlView")?.getBoundingClientRect()
      if (rect === undefined) throw new Error("no bar")
      return { x: rect.left + rect.width / 2, y: rect.top + 6 }
    })
    await opened.page.mouse.click(bar_Top.x, bar_Top.y)
    expect(await isFolded()).toBe(true)
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => document.getElementById("notches")?.remove())
  })

  test("a proposal being revised has its rings faded and the words it proposes faded, the words shimmering as its status does, lit or shown too, with no fill behind them, and its rings swelling as the band passes, all of it in step with its status and its arc, begun at one moment; an open one beside it as it was; and still where motion's asked to be reduced", async () => {
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "states"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const [asIs, kept] = window.parseLines_ViewModel({ multilineText: "if (status === 429) go(delay);\nreturn DELAY_MS;", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = asIs?.segments ?? []
      if (asIs === undefined || kept === undefined || segment === undefined) throw new Error("the lines weren't parsed")
      const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
      const change = (side: string, source: string) => ({ "data-change": "replaced", "data-side": side, "data-source": source, "data-place": "1" })
      const lineOf = (side: string) => ({ ...asIs, segments: [
        { text: textOf("if (status === "), attributes: {} },
        { text: textOf(side === "before" ? "429" : "408"), attributes: change(side, "timeout") },
        { text: textOf(") go("), attributes: {} },
        { text: textOf(side === "before" ? "delay" : "wait"), attributes: change(side, "rename") },
        { text: textOf(");"), attributes: {} }
      ] })
      const groupsOf = (side: string) => [
        { attributes: { "data-source": "timeout" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 15 }, to: { line: 0, offset: 18 }, attributes: change(side, "timeout") }] },
        { attributes: { "data-source": "rename" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 23 }, to: { line: 0, offset: side === "before" ? 28 : 27 }, attributes: change(side, "rename") }] }
      ]
      const item = (source: string, state: "OPEN" | "REVISING" | "ACCEPTED", status: string) => ({ source, title: source, state, status, places: { kind: "NONE" as const }, rationale: "", requests: [], actions: [], isRunning: false, isStartable: false, stale: null, isDrafting: false, confirming: null, neighbors: { range_Previous: null, range_Next: null }, attributes: {} })
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 2 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: [lineOf("before"), kept], groups: groupsOf("before") } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [lineOf("after"), kept], groups: groupsOf("after") } },
            { kind: "PROPOSAL_LIST", items: [item("timeout", "REVISING", "Revising…"), item("rename", "OPEN", ""), item("base", "ACCEPTED", "Accepted")] }
          ]
        }])
      })
    })
    // each ring, by its proposal and side: its opacity and what moves it;
    // and the words each proposes, as proposed
    const looks = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const container = document.getElementById("states")
      return {
        rings: [...container?.querySelectorAll(".underlay_htmlView") ?? []].map((ring) => `${ring.getAttribute("data-source")} ${ring.getAttribute("data-side")}: ${Math.round(parseFloat(getComputedStyle(ring).strokeOpacity) * 100) / 100} ${getComputedStyle(ring).animationName}`),
        // when each of the agent's passes and turns began, the item's arc
        // and status, the words and the rings
        starts: [...new Set((container?.getAnimations({ subtree: true }) ?? []).filter((animation) => animation instanceof CSSAnimation && ["revising_htmlView", "shimmer_htmlView", "swell_htmlView"].includes(animation.animationName)).map((animation) => `${(animation as CSSAnimation).animationName} ${animation.startTime}`))].sort(),
        words: [...container?.querySelectorAll(".proposed_htmlView .text_htmlView [data-source]") ?? []].map((span) => `${span.getAttribute("data-source")}: ${Math.round(parseFloat(getComputedStyle(span).opacity) * 100) / 100} ${getComputedStyle(span).animationName}`)
      }
    })
    // moving, faded, between where they rest and a little above
    const moving = await looks()
    const faded = (each: string, ceiling: number) => {
      const [label = "", rest = ""] = each.split(": ")
      const [value = "", animation = ""] = rest.split(" ")
      return parseFloat(value) < ceiling ? `${label}: faded ${animation}` : each
    }
    expect(moving.rings.map((ring) => faded(ring, 0.75))).toEqual(["timeout before: faded swell_htmlView", "rename before: 1 none", "timeout after: faded swell_htmlView", "rename after: 1 none"])
    expect(moving.words.map((word) => faded(word, 0.85))).toEqual(["timeout: faded shimmer_htmlView", "rename: 1 none"])
    expect(moving.starts).toEqual(["revising_htmlView 0", "shimmer_htmlView 0", "swell_htmlView 0"])
    // lit, as from its request's pill, or shown, as a jump to it leaves it,
    // the words still shimmering, and no fill behind them, their light a
    // line under them, which a ring's fill would be confused with
    const lit = await opened.page.evaluate(() => {
      const word = document.querySelector("#states .proposed_htmlView .text_htmlView [data-source=\"timeout\"]")
      if (word === null) throw new Error("no word")
      const lookOf = () => {
        const style = getComputedStyle(word)
        return `${style.animationName} ${style.backgroundColor !== "rgba(0, 0, 0, 0)"} ${style.maskImage.startsWith("linear-gradient")}`
      }
      word.setAttribute("data-lit", "")
      const look_Lit = lookOf()
      word.removeAttribute("data-lit")
      word.setAttribute("data-shown", "")
      const look_Shown = lookOf()
      word.removeAttribute("data-shown")
      return [look_Lit, look_Shown]
    })
    expect(lit).toEqual(["shimmer_htmlView false true", "shimmer_htmlView false true"])
    // still, at rest, where motion's asked to be reduced
    await opened.page.emulateMedia({ reducedMotion: "reduce" })
    expect((await looks()).rings).toEqual(["timeout before: 0.45 none", "rename before: 1 none", "timeout after: 0.45 none", "rename after: 1 none"])
    expect((await looks()).words).toEqual(["timeout: 0.55 none", "rename: 1 none"])
    await opened.page.emulateMedia({ reducedMotion: "no-preference" })
    await opened.page.evaluate(() => document.getElementById("states")?.remove())
  })

  test("pointing at a ring points at its proposal and at its place: the place's rings, on both sides, heavier again, a faint light running round each, clockwise round the lines as proposed and counterclockwise round the lines as they are, both sides in step, one lap each in the time the longer takes at one pace, the proposal's breathing together, at a pace kept from ring to ring of one proposal and started anew at another; the place's lines' labels in the gutter heavier again, by a stroke, not a weight, so none moves, and still; still where motion's asked to be reduced", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "placing"
      containerElement.style.width = "40rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      // alphabet becomes alphabetical, its two sides' rings of different
      // lengths
      const [line] = window.parseLines_ViewModel({ multilineText: "alphabet beta gamma", module_Language: window.MODULE_PLAINTEXT })
      const [segment] = line?.segments ?? []
      if (line === undefined || segment === undefined) throw new Error("the line wasn't parsed")
      const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
      const change = (side: string, source: string, place: string) => ({ "data-change": "replaced", "data-side": side, "data-source": source, "data-place": place })
      const first = (side: string) => side === "before" ? "alphabet" : "alphabetical"
      const lineOf = (side: string) => ({ ...line, segments: [{ text: textOf(first(side)), attributes: change(side, "rename", "1") }, { text: textOf(" "), attributes: {} }, { text: textOf("beta"), attributes: change(side, "rename", "2") }, { text: textOf(" "), attributes: {} }, { text: textOf("gamma"), attributes: change(side, "other", "1") }] })
      const groupsOf = (side: string) => {
        const at = first(side).length
        return [
          { attributes: { "data-source": "rename" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: at }, attributes: change(side, "rename", "1") }, { kind: "STRETCH" as const, from: { line: 0, offset: at + 1 }, to: { line: 0, offset: at + 5 }, attributes: change(side, "rename", "2") }] },
          { attributes: { "data-source": "other" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: at + 6 }, to: { line: 0, offset: at + 11 }, attributes: change(side, "other", "1") }] }
        ]
      }
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "FRAME",
          range: { first: 1, last: 1 },
          parts: [
            { kind: "CURRENT_LINES", run: { id: "current", lines: [lineOf("before")], groups: groupsOf("before") } },
            { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [lineOf("after")], groups: groupsOf("after") } }
          ]
        }])
      })
    })
    // each ring, by its proposal, side and place: whether its place is
    // pointed at, its stroke, and what moves it, and the pace kept
    const drawn = () => opened.page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const containerElement = document.getElementById("placing")
      return {
        rings: [...containerElement?.querySelectorAll(".underlay_htmlView") ?? []].map((ring) => {
          const light = ring.parentElement?.querySelector(`.lap_htmlView[data-side="${ring.getAttribute("data-side")}"][data-place="${ring.getAttribute("data-place")}"]`) ?? null
          const style = getComputedStyle(ring)
          const lap = light === null ? null : getComputedStyle(light)
          return `${ring.getAttribute("data-source")} ${ring.getAttribute("data-side")} ${ring.getAttribute("data-place")}: ${ring.hasAttribute("data-pointed") ? "place " : ""}${style.strokeWidth} ${style.animationName}${lap === null ? "" : `, ${lap.animationName}${lap.animationName === "none" ? "" : ` ${lap.animationDirection}${lap.stroke === style.stroke ? "" : ` in ${lap.stroke}, not ${style.stroke}`}`}`}`
        }),
        // whether each ring's area is drawn clockwise, so that running
        // forwards along it is: its signed area, on a screen, where y runs
        // down, above nothing
        clockwise: [...containerElement?.querySelectorAll(".area_htmlView") ?? []].every((area) => {
          const points = (area.getAttribute("d")?.match(/-?[\d.]+ -?[\d.]+/g) ?? []).map((pair) => pair.split(" ").map(Number))
          const twice = points.reduce((sum, [x = 0, y = 0], index) => {
            const [x_Next = 0, y_Next = 0] = points[(index + 1) % points.length] ?? []
            return sum + x * y_Next - x_Next * y
          }, 0)
          return twice > 0
        }),
        // how long the pointed proposal's rings have breathed, the least
        breath: Math.min(...[...containerElement?.querySelectorAll(".group_htmlView[data-pointed] > .underlay_htmlView") ?? []].flatMap((ring) => ring.getAnimations().filter((animation) => animation instanceof CSSAnimation && animation.animationName === "breathe_htmlView").map((animation) => Number(animation.currentTime)))),
        // each light's ring's length, and the time its lap takes
        labels: [...containerElement?.querySelectorAll(".gutter_htmlView[data-pointed]") ?? []].map((gutter) => {
          const style = getComputedStyle(gutter.querySelector(".label_htmlView") ?? gutter)
          return `${gutter.getAttribute("data-pointed")} ${style.fontWeight} ${Math.round(parseFloat(style.webkitTextStrokeWidth) * 10) / 10}px ${style.animationName}`
        }),
        laps: [...containerElement?.querySelectorAll(".lap_htmlView[data-pointed]") ?? []].map((light) => ({
          length: light instanceof SVGPathElement ? light.getTotalLength() : 0,
          ms: Math.round(parseFloat(getComputedStyle(light).animationDuration) * 1000)
        }))
      }
    })
    const at = async (source: string, place: string) => {
      const point = await opened.page.evaluate(({ source, place }) => {
        const rect = document.querySelector(`#placing .underlay_htmlView[data-source="${source}"][data-side="before"][data-place="${place}"]`)?.getBoundingClientRect()
        if (rect === undefined) throw new Error(`no ring of ${source} at ${place}`)
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }, { source, place })
      await opened.page.mouse.move(point.x, point.y)
    }
    await at("rename", "1")
    const first = await drawn()
    expect(first.rings).toEqual([
      "other before 1: 1px none, none",
      "rename before 1: place 3px breathe_htmlView, lap_htmlView reverse",
      "rename before 2: 2px breathe_htmlView, none",
      "other after 1: 1px none, none",
      "rename after 1: place 3px breathe_htmlView, lap_htmlView normal",
      "rename after 2: 2px breathe_htmlView, none"
    ])
    expect(first.clockwise).toBe(true)
    expect(first.labels).toEqual(["place 400 1.3px none", "place 400 1.3px none"])
    await opened.page.waitForTimeout(300)
    await at("rename", "2")
    const second = await drawn()
    expect(second.rings.filter((ring) => ring.includes("place"))).toEqual(["rename before 2: place 3px breathe_htmlView, lap_htmlView reverse", "rename after 2: place 3px breathe_htmlView, lap_htmlView normal"])
    expect(second.breath).toBeGreaterThan(250)
    // both sides of a place go round in one time, though their rings'
    // lengths differ: the time the longer takes, at 16ms a pixel, kept
    // between two seconds and six
    const lapOf = (laps: Array<{ length: number, ms: number }>) => ({
      lengths: new Set(laps.map((lap) => Math.round(lap.length))).size,
      times: [...new Set(laps.map((lap) => lap.ms))],
      expected: Math.round(Math.min(6000, Math.max(2000, Math.max(...laps.map((lap) => lap.length)) * 16)))
    })
    const lap = lapOf(first.laps)
    expect(lap.lengths).toBe(2)
    expect(lap.times).toEqual([lap.expected])
    expect(lap.expected).toBeGreaterThan(2000)
    expect(lapOf(second.laps).times).toEqual([2000])
    // the light moving along, a little at a time, not jumping from one end
    // of its lap to the other
    const offsets = () => opened.page.evaluate(() => [...document.querySelectorAll("#placing .lap_htmlView[data-pointed]")].map((light) => parseFloat(getComputedStyle(light).strokeDashoffset)))
    const before = await offsets()
    await opened.page.waitForTimeout(150)
    const after = await offsets()
    expect(after.map((offset, index) => offset !== before[index] && Math.abs(offset - (before[index] ?? 0)) < 25)).toEqual([true, true])
    await at("other", "1")
    expect((await drawn()).breath).toBeLessThan(100)
    await opened.page.emulateMedia({ reducedMotion: "reduce" })
    const still = await drawn()
    expect(still.rings.filter((ring) => ring.startsWith("other"))).toEqual(["other before 1: place 3px none, none", "other after 1: place 3px none, none"])
    expect(still.labels).toEqual(["place 400 1.3px none", "place 400 1.3px none"])
    await opened.page.emulateMedia({ reducedMotion: "no-preference" })
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => document.getElementById("placing")?.remove())
  })

  test("a ring cut by a wrap has one light, in its change's colour, going round it as if it weren't cut: along its top edges, part after part, down its last side, back along its bottom edges, up its first side, never its cut sides; as much of it showing all the way round, never two at once, never none", async () => {
    await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      containerElement.id = "lapping"
      containerElement.style.width = "16rem"
      containerElement.dataset["look"] = "changes"
      document.body.prepend(containerElement)
      const [line] = window.parseLines_ViewModel({ multilineText: "go: a stretch of words long enough to wrap the row it starts on", module_Language: window.MODULE_PLAINTEXT })
      if (line === undefined) throw new Error("the line wasn't parsed")
      // where the line wraps, drawn once at this width to see, so the ring
      // can end its first row and start its second, short, apart: cut
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "measure", lines: [line], groups: [] } }]))
      const texts = [...containerElement.querySelectorAll(".text_htmlView *")].flatMap((element) => [...element.childNodes]).filter((node): node is Text => node instanceof Text)
      const range = document.createRange()
      let index_Wrap = 0
      let top_First: number | null = null
      for (const textNode of texts) {
        for (let index = 0; index < textNode.data.length && index_Wrap === 0; index++) {
          range.setStart(textNode, index)
          range.setEnd(textNode, index + 1)
          const top = range.getBoundingClientRect().top
          top_First ??= top
          if (top > top_First + 4) index_Wrap = texts.slice(0, texts.indexOf(textNode)).reduce((length, each) => length + each.data.length, 0) + index
        }
      }
      if (index_Wrap === 0) throw new Error("the line didn't wrap")
      containerElement.replaceChildren()
      const change = { "data-change": "replaced", "data-side": "before", "data-source": "long", "data-place": "1" }
      new window._Viewer_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR,
        modules: [window.MODULE_MOUSE],
        module_Words: window.MODULE_WORDS_TEXT,
        edit: () => null,
        ask: () => {},
        viewModel_TextEditor: window.viewModelOf__Blocks([{
          kind: "LINES",
          run: { id: "document", lines: [line], groups: [{ attributes: { "data-source": "long" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: index_Wrap - 6 }, to: { line: 0, offset: index_Wrap + 3 }, attributes: change }] }] }
        }])
      })
    })
    // the light's pieces, and how much of the light each shows now: where
    // its dash, a fifth of the lap, falls on it, from its share of the lap
    // and its dash's offset; and whether a piece runs along a cut side
    const lit = () => opened.page.evaluate(() => {
      const pieces = [...document.querySelectorAll("#lapping .lap_htmlView")].filter((element) => element instanceof SVGPathElement)
      const seams = [...document.querySelectorAll("#lapping .seam_htmlView")].map((seam) => seam.getAttribute("d")?.match(/-?[\d.]+/g)?.map(Number) ?? [])
      const xs = seams.map(([x = 0]) => x)
      return {
        pieces: pieces.length,
        // drawn in the change's colour, so it shows at all
        stroked: pieces.every((piece) => getComputedStyle(piece).stroke !== "none" && parseFloat(getComputedStyle(piece).strokeOpacity) > 0),
        shown: Math.round(pieces.reduce((total, piece) => {
          const share = Number(piece.getAttribute("pathLength"))
          const offset = parseFloat(getComputedStyle(piece).strokeDashoffset)
          let shown = 0
          for (let at = 0; at < share; at += 0.05) if ((((at + offset) % 100) + 100) % 100 < 20) shown += 0.05
          return total + shown
        }, 0)),
        // a cut side is vertical at a seam's x: no piece goes along one
        alongCut: pieces.some((piece) => {
          const points = (piece.getAttribute("d")?.match(/-?[\d.]+ -?[\d.]+/g) ?? []).map((pair) => pair.split(" ").map(Number))
          return points.some(([x = 0, y = 0], index) => {
            const [x_Next = 0, y_Next = 0] = points[index + 1] ?? [x, y]
            return Math.abs(x - x_Next) < 0.01 && Math.abs(y - y_Next) > 1 && xs.some((x_Seam) => Math.abs(x_Seam - x) < 0.01)
          })
        })
      }
    })
    // inside the ring's first part, beside its cut side
    const point = await opened.page.evaluate(() => {
      const seam = document.querySelector("#lapping .seam_htmlView")
      const svg = seam?.closest("svg")?.getBoundingClientRect()
      const [x = 0, y_Top = 0, , y_Bottom = 0] = seam?.getAttribute("d")?.match(/-?[\d.]+/g)?.map(Number) ?? []
      if (svg === undefined) throw new Error("the ring wasn't cut")
      return { x: svg.left + x - 12, y: svg.top + (y_Top + y_Bottom) / 2 }
    })
    await opened.page.mouse.move(point.x, point.y)
    const samples = []
    for (let sample = 0; sample < 8; sample++) {
      await opened.page.waitForTimeout(260)
      samples.push(await lit())
    }
    expect(samples.every((each) => each.pieces === 3 && each.stroked && !each.alongCut)).toBe(true)
    expect(samples.map((each) => each.shown)).toEqual(samples.map(() => 20))
    await opened.page.mouse.move(1270, 715)
    await opened.page.evaluate(() => document.getElementById("lapping")?.remove())
  })

  test("a ring over several lines hugs them, one outline, nothing in it twice or on the way: its left side straight where its rows start at their lines' starts, its right stepping with their ends, never by less than half an em, so lines ending in one column, but for room made in one, share an end; a short last row stays short; a line's note shows, so the row it follows stops short of it", async () => {
    const shape = await opened.page.evaluate(async () => {
      const containerElement = document.createElement("div")
      containerElement.style.width = "40rem"
      containerElement.style.setProperty("--view-font-size", "14px")
      containerElement.dataset["look"] = "changes"
      document.body.append(containerElement)
      const lines = window.parseLines_ViewModel({ multilineText: "go {\n  a line much longer than the first one\n  run(a, b);\n  run(a, c);\n}", module_Language: window.MODULE_PLAINTEXT })
      const [first, long, plain, pressed, last] = lines
      if (first === undefined || long === undefined || plain === undefined || pressed === undefined || last === undefined) throw new Error("the lines weren't parsed")
      const change = { "data-change": "moved", "data-side": "before", "data-source": "move" }
      const edit = { "data-change": "replaced", "data-side": "before", "data-source": "move" }
      const [segment] = pressed.segments
      if (segment === undefined) throw new Error("the line has no segment")
      const textOf = (text: string) => window.parseLines_ViewModel({ multilineText: text, module_Language: window.MODULE_PLAINTEXT })[0]?.segments[0]?.text ?? segment.text
      // c, an edit on the way, its own span, pressed on by ), so room's made
      // after it, and its line ends further out than the line above, by less
      // than a character
      const pressed_Cut = { ...pressed, segments: [{ text: textOf("  run(a, "), attributes: change }, { text: textOf("c"), attributes: { ...change, "data-edit": "replaced" } }, { text: textOf(");"), attributes: change }] }
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([{
        kind: "LINES",
        run: { id: "document", lines: [{ ...first, note: { label: "moved", target: { source: "move", side: "after" } } }, long, plain, pressed_Cut, last], groups: [{ attributes: { "data-source": "move" }, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 4, offset: 1 }, attributes: change }, { kind: "STRETCH" as const, from: { line: 3, offset: 9 }, to: { line: 3, offset: 10 }, attributes: edit }] }] }
      }]))
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const path = containerElement.querySelector(".underlay_htmlView")
      const origin = containerElement.querySelector(".underlays_htmlView")?.getBoundingClientRect()
      const texts = [...containerElement.querySelectorAll(".text_htmlView")]
      const [textFirst, textLong, textPlain, textPressed, textLast] = texts
      if (!(path instanceof SVGPathElement) || origin === undefined || textFirst === undefined || textLong === undefined || textPlain === undefined || textPressed === undefined || textLast === undefined) throw new Error("the ring wasn't drawn")
      const middleOf = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return rect.top + rect.height / 2 - origin.top
      }
      // where a line's text ends: its last segment's, not its note's
      const rightOf = (element: Element) => (element.querySelector(":scope > span:last-of-type") ?? element).getBoundingClientRect().right - origin.left
      const inside = (x: number, element: Element) => path.isPointInFill(new DOMPoint(x, middleOf(element)))
      const d = path.getAttribute("d") ?? ""
      const points = (d.match(/-?[\d.]+ -?[\d.]+/g) ?? []).map((pair) => pair.split(" ").map(Number))
      const isLevel = (one: number, other: number) => Math.abs(one - other) < 0.01
      const halfEm = 7
      const noteLeft = (textFirst.querySelector(".note_htmlView")?.getBoundingClientRect().left ?? 0) - origin.left
      const leftmost = Math.min(...points.map(([x]) => x ?? 0))
      return {
        oneOutline: (d.match(/M/g) ?? []).length === 1 && d.trim().endsWith("Z"),
        nothingTwice: points.every(([x, y], index) => index === 0 || !(isLevel(x ?? 0, points[index - 1]?.[0] ?? NaN) && isLevel(y ?? 0, points[index - 1]?.[1] ?? NaN))),
        nothingOnTheWay: points.every(([x, y], index) => {
          const [xBefore, yBefore] = points[index - 1] ?? [NaN, NaN]
          const [xAfter, yAfter] = points[index + 1] ?? [NaN, NaN]
          return !(isLevel(xBefore ?? NaN, x ?? 0) && isLevel(x ?? 0, xAfter ?? NaN)) && !(isLevel(yBefore ?? NaN, y ?? 0) && isLevel(y ?? 0, yAfter ?? NaN))
        }),
        leftStraight: points.filter(([x]) => isLevel(x ?? 0, leftmost)).length === 2,
        stepsHalfAnEmOrMore: points.every(([x, y], index) => {
          const [xAfter, yAfter] = points[index + 1] ?? [NaN, NaN]
          return !isLevel(y ?? 0, yAfter ?? NaN) || Math.abs((xAfter ?? 0) - (x ?? 0)) >= halfEm
        }),
        roomShared: rightOf(textPressed) > rightOf(textPlain) && inside(rightOf(textPressed) + 1, textPlain),
        lastShort: !inside(rightOf(textLong) - 5, textLast),
        firstStopsShortOfNote: !inside(noteLeft - 3, textFirst) && inside(rightOf(textFirst) + 1, textFirst)
      }
    })
    expect(shape).toEqual({ oneOutline: true, nothingTwice: true, nothingOnTheWay: true, leftStraight: true, stepsHalfAnEmOrMore: true, roomShared: true, lastShort: true, firstStopsShortOfNote: true })
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
          groups: [{ attributes: {}, underlays: [{ kind: "STRETCH" as const, from: { line: 0, offset: 0 }, to: { line: 0, offset: Infinity }, attributes: { "data-underlay": "box" } }] }]
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

  test("a document of no lines draws a view with nothing in its document: its input, the element text input goes to, its header, saying nothing but the document's name, its card offering Add a request, its document, empty, and its footer", async () => {
    const children = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw(window.viewModelOf__Blocks([]))
      return [...containerElement.querySelector(".htmlView_editor")?.childNodes ?? []].map((node) => node instanceof Element ? `${node.className} ${node.childNodes.length}` : "#text")
    })
    expect(children).toEqual(["input_htmlView 0", "header_htmlView 2", "document_htmlView 0", "footer_htmlView 0"])
  })

  test("a task's card, in its Proposals, lists the documents it touches, their total the last row, every document's, tens of them scrolling in the list, not past the window: the one shown first, as it's given, each path's folder muted and cut from its start, its file's name whole, and the files with nothing left to decide muted", async () => {
    const files = await opened.page.evaluate(() => {
      const containerElement = document.createElement("div")
      document.body.append(containerElement)
      const documents = Array.from({ length: 24 }, (_, index) => ({
        folder: "source/a/folder/nested/deep/enough/to/run/past/the/card/",
        name: `file-${index}.ts`,
        value: `${index % 3 === 0 ? 2 : 0} of 2 decided`,
        more: "",
        isShown: index === 0,
        isDecided: index % 3 === 0,
        actions: []
      }))
      new window._View_TextEditor_({
        containerElement,
        componentMap: window.COMPONENTMAP__VIEW_TEXTEDITOR
      }).draw({
        ...window.viewModelOf__Blocks([]),
        header: {
          task: { id: "T-40", name: "Rename the retries", state: "WORKING", label_State: "Working", summary: "Renames them.", reason: "", proposals: { figure: { value: "16 of 48 decided", more: "" }, documents, actions: [] }, revisions_Scope: { figure: null, start_All: null, stop_All: null, actions: [] }, revisions_Level: { requests: [], isStartable_Requests: false, isStoppable_Requests: false, ask: { label: "Revise", label_Form: "Revise the task" } } },
          parts: [],
          document: { folder: "source/", name: "retry.ts", state: "NONE", label_State: "", summary: "", proposals: { figure: null, documents: [], actions: [] }, revisions_Scope: { figure: null, start_All: null, stop_All: null, actions: [] }, revisions_Level: { requests: [], isStartable_Requests: false, isStoppable_Requests: false, ask: { label: "Revise", label_Form: "Revise this document" } } }
        }
      })
      const card = containerElement.querySelector(".card_Task_htmlView")
      const list = containerElement.querySelector(".list_Document_Card_htmlView")
      const rows = [...containerElement.querySelectorAll(".list_Document_Card_htmlView > .document_Card_htmlView")]
      const first = rows[0]
      const folder = first?.querySelector(".folder_Document_Card_htmlView")
      const name = first?.querySelector(".name_Document_Card_htmlView")
      const inkOf = (element: Element | undefined) => element === undefined ? null : getComputedStyle(element).color
      return {
        figure: containerElement.querySelector(".card_Task_htmlView .total_Document_Card_htmlView .value_Document_Card_htmlView")?.textContent ?? null,
        rows: rows.length,
        rowsSeen: list === null || first === undefined || rows[1] === undefined ? 0 : list.clientHeight / (rows[1].getBoundingClientRect().top - first.getBoundingClientRect().top),
        isScrolling: list !== null && list.scrollHeight > list.clientHeight,
        height_Card: card?.getBoundingClientRect().height ?? 0,
        isFirstShown: first?.getAttribute("aria-current") === "true",
        isFolderCut: folder !== null && folder !== undefined && folder.scrollWidth > folder.clientWidth,
        isNameWhole: name !== null && name !== undefined && name.scrollWidth <= name.clientWidth,
        isDecidedMuted: inkOf(rows[3]) !== inkOf(rows[1])
      }
    })
    expect(files.figure).toBe("16 of 48 decided")
    expect(files.rows).toBe(24)
    expect(files.rowsSeen).toBeGreaterThan(5)
    expect(files.rowsSeen).toBeLessThan(8)
    expect(files.height_Card).toBeLessThan(400)
    expect(files).toMatchObject({ isScrolling: true, isFirstShown: true, isFolderCut: true, isNameWhole: true, isDecidedMuted: true })
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
    }).draw(window.viewModelOf__Blocks([{ kind: "LINES", run: { id: "line", lines: [{ gutter: { label: "", marker: "none", pointed: "none" }, note: null, segments: segments_Line, origins: [] }], groups: [] } }]))
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
