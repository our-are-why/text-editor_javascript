import { afterAll, describe, expect, test } from "bun:test"
import { openExample } from "./harness.ts"

// the Markdown example, opened as you'd open it to read: its changes read as
// Markdown first, then, its button pressed, as text, then as Markdown again;
// each time, the rings on what its default's made bold, as proposed, and
// the buttons' state, once the editor's drawn again
const opened = await openExample(
  "markdown",
  1
)
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
const linked_Requested = await opened.page.evaluate(() => {
  const link = [...document.querySelectorAll(".text_htmlView [data-syntax~=\"link\"]")].find((element) => element.textContent === "why the waits grow")
  return {
    link: link === undefined ? null : getComputedStyle(link).textDecorationLine,
    lines: document.querySelectorAll(".underlay_htmlView[data-requested]").length > 0
  }
})

describe("the Markdown example: a perspective for each way to read its changes, the buttons over it switching them, both in the changes look", () => {
  test("read as Markdown, a word made bold is one ring, restyled, round it and its asterisks", () => {
    expect(shown_Markdown).toEqual({ rings: ["restyled"], pressed: ["As Markdown true", "As text false"], look: "changes" })
  })
  test("read as text, its asterisks put in are each a ring of their own", () => {
    expect(shown_Text).toEqual({ rings: ["inserted", "inserted"], pressed: ["As Markdown false", "As text true"], look: "changes" })
  })
  test("switched back, it's read as Markdown again, and each switch is reported", async () => {
    expect(shown_Again).toEqual(shown_Markdown)
    expect((await opened.logged()).filter((entry) => "perspective" in entry)).toEqual([{ perspective: "changes" }, { perspective: "markdown" }])
  })
  test("a request on the link's words: the link keeps its own underline, the request's dotted line drawn under it, behind the text", () => {
    expect(linked_Requested).toEqual({ link: "underline", lines: true })
  })
  test("opens and switches with no error reported", () => {
    expect(opened.errors).toEqual([])
  })
})

// on the same page, read as Markdown again: the caret placed by a click
// inside the words a proposal puts in, on its line as proposed, then the
// selection extended to the line's end, past those words into the
// document's after them; then a line down, collapsed
const placed = await opened.page.evaluate(async () => {
  const divElement_text = document.querySelector(".run_htmlView[data-run=\"frame-23-proposed\"] > .line_htmlView > .text_htmlView")
  if (!(divElement_text instanceof HTMLElement)) throw new Error("no line as proposed")
  divElement_text.scrollIntoView({ block: "center" })
  const walker = document.createTreeWalker(divElement_text, NodeFilter.SHOW_TEXT)
  const texts: Array<Text> = []
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) if (node.parentElement?.closest(".note_htmlView") === null) texts.push(node)
  const rectAt = (offset: number) => {
    let start = 0
    for (const text of texts) {
      if (offset < start + text.length) {
        const range = document.createRange()
        range.setStart(text, offset - start)
        range.setEnd(text, offset - start + 1)
        return range.getBoundingClientRect()
      }
      start = start + text.length
    }
    throw new Error(`no character at ${offset}`)
  }
  const line = texts.map((text) => text.data).join("")
  return { line, five: rectAt(39).toJSON(), end: rectAt(line.length - 1).right }
})
await opened.page.mouse.click(placed.five.left + 1, placed.five.top + placed.five.height / 2)
const caretShown = () => opened.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const caret = document.querySelector(".caret_htmlView")?.getBoundingClientRect()
  return {
    focused: document.activeElement?.classList.contains("input_htmlView") ?? false,
    run: document.querySelector(".caret_htmlView")?.closest(".run_htmlView")?.getAttribute("data-run") ?? null,
    caret: caret === undefined ? null : { x: caret.left + caret.width / 2, top: caret.top },
    selected: [...document.querySelectorAll(".selected_htmlView")].map((element) => element.getBoundingClientRect().width)
  }
})
const shown_Placed = await caretShown()
await opened.page.keyboard.press("Shift+End")
const shown_Extended = await caretShown()
await opened.page.keyboard.press("ArrowDown")
const shown_Down = await caretShown()

describe("the Markdown example's caret and selection: placed by a click, extended by the keyboard, across what's drawn whatever text it's from", () => {
  test("a click inside a proposal's own words, on its line as proposed, places the caret there and focuses the editor", () => {
    expect(placed.line.slice(37, 42)).toBe("**5**")
    expect(shown_Placed.focused).toBe(true)
    expect(shown_Placed.run).toBe("frame-23-proposed")
    expect(shown_Placed.caret?.x).toBeCloseTo(placed.five.left, 0)
    expect(shown_Placed.selected).toEqual([])
  })
  test("Shift+End selects to the line's end, past the proposal's words, a box for each span it covers, the caret there", () => {
    expect(shown_Extended.caret?.x).toBeCloseTo(placed.end, 0)
    expect(shown_Extended.selected.reduce((sum, width) => sum + width, 0)).toBeCloseTo(placed.end - placed.five.left, 0)
  })
  test("Down moves the caret a row down, the selection collapsed, with no error reported", () => {
    expect(shown_Down.run).toBe("frame-23-proposed")
    expect((shown_Down.caret?.top ?? 0) - (shown_Extended.caret?.top ?? 0)).toBeGreaterThan(10)
    expect(shown_Down.selected).toEqual([])
    expect(opened.errors).toEqual([])
  })
})

// then 25 lines down, through frames and past the window's bottom: the
// caret brought into view each time it moves
for (let step = 0; step < 25; step = step + 1) await opened.page.keyboard.press("ArrowDown")
const shown_Far = await opened.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const caret = document.querySelector(".caret_htmlView")?.getBoundingClientRect()
  return { top: caret?.top ?? null, bottom: caret?.bottom ?? null, height_Window: window.innerHeight, run: document.querySelector(".caret_htmlView")?.closest(".run_htmlView")?.getAttribute("data-run") ?? null }
})

test("moved by the keyboard well past what's shown, the caret's brought into view", () => {
  expect(shown_Far.run).not.toBe("frame-23-proposed")
  expect(shown_Far.top).toBeGreaterThanOrEqual(0)
  expect(shown_Far.bottom).toBeLessThanOrEqual(shown_Far.height_Window + 1)
})

// a drag along a line of code as proposed, the README's call given a signal,
// from its first character, the document's, into the middle of the
// proposal's own words, "sig|nal", and on to its last: nothing stopping it
// where the text it's over changes
const dragged = await opened.page.evaluate(() => {
  const divElement_text = [...document.querySelectorAll(".run_htmlView[data-run=\"frame-18-proposed\"] > .line_htmlView > .text_htmlView")][0]
  if (!(divElement_text instanceof HTMLElement)) throw new Error("no line as proposed")
  divElement_text.scrollIntoView({ block: "center" })
  const walker = document.createTreeWalker(divElement_text, NodeFilter.SHOW_TEXT)
  const texts: Array<Text> = []
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) if (node.parentElement?.closest(".note_htmlView") === null) texts.push(node)
  const last = texts.at(-1)
  const first = texts[0]
  if (first === undefined || last === undefined) throw new Error("no text")
  const rectOf = (text: Text, offset: number) => {
    const range = document.createRange()
    range.setStart(text, offset)
    range.setEnd(text, offset + 1)
    return range.getBoundingClientRect()
  }
  const rect_First = rectOf(first, 0)
  const line = texts.map((each) => each.data).join("")
  // the left of the character at an offset in the line, whichever text node
  // it's in
  const leftAt = (offset: number) => {
    let start = 0
    for (const each of texts) {
      if (offset < start + each.length) return rectOf(each, offset - start).left
      start = start + each.length
    }
    throw new Error(`no character at ${offset}`)
  }
  return { line, left: rect_First.left, right: rectOf(last, last.length - 1).right, middle: leftAt(line.indexOf("signal") + 3), y: rect_First.top + rect_First.height / 2 }
})
await opened.page.mouse.move(dragged.left + 1, dragged.y)
await opened.page.mouse.down()
for (let step = 1; step <= 4; step = step + 1) await opened.page.mouse.move(dragged.left + (dragged.middle + 1 - dragged.left) * step / 4, dragged.y)
const shown_Middle = await caretShown()
for (let step = 1; step <= 4; step = step + 1) await opened.page.mouse.move(dragged.middle + (dragged.right - dragged.middle) * step / 4, dragged.y)
await opened.page.mouse.up()
const shown_Dragged = await caretShown()

test("a drag along a line as proposed selects all of it, across a proposal's own words, never stopping where the text they're from changes, one box along the row, the room a ring makes inside it", () => {
  expect(dragged.line).toContain("fetchUser(id, { signal })")
  expect(shown_Middle.caret?.x).toBeCloseTo(dragged.middle, 0)
  expect(shown_Dragged.run).toBe("frame-18-proposed")
  expect(shown_Dragged.caret?.x).toBeCloseTo(dragged.right, 0)
  expect(shown_Dragged.selected.length).toBe(1)
  expect(shown_Dragged.selected[0]).toBeCloseTo(dragged.right - dragged.left, 0)
  expect(opened.errors).toEqual([])
})

// then a drag from the middle of that line as proposed down past the frame,
// over its proposal's item and the closing fence below it: the selection
// stays in the section it began in, its head at the section's end
await opened.page.mouse.move(dragged.middle + 1, dragged.y)
await opened.page.mouse.down()
for (let step = 1; step <= 6; step = step + 1) await opened.page.mouse.move(dragged.middle, dragged.y + 40 * step)
await opened.page.mouse.up()
const shown_Below = await caretShown()

test("a drag out of a frame's section stops at the section's edge: the selection never escapes the section it began in", () => {
  expect(shown_Below.run).toBe("frame-18-proposed")
  expect(shown_Below.caret?.x).toBeCloseTo(dragged.right, 0)
  expect(shown_Below.selected.length).toBe(1)
  expect(shown_Below.selected[0]).toBeCloseTo(dragged.right - dragged.middle, 0)
  expect(opened.errors).toEqual([])
})

// typing, on the same page: the text each line of a run draws, and a click
// at a character of one
const linesOf = (id_Run: string) => opened.page.evaluate(async (id_Run) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(`.run_htmlView[data-run="${id_Run}"] > .line_htmlView > .text_htmlView`)].map((element) => [...element.childNodes].filter((node) => !(node instanceof Element && node.classList.contains("note_htmlView"))).map((node) => node.textContent).join(""))
}, id_Run)
const clickAt = async (id_Run: string, line: number, offset: number) => {
  const point = await opened.page.evaluate(({ id_Run, line, offset }) => {
    const element = [...document.querySelectorAll(`.run_htmlView[data-run="${id_Run}"] > .line_htmlView > .text_htmlView`)][line]
    if (!(element instanceof HTMLElement)) throw new Error(`no line ${line} in ${id_Run}`)
    element.scrollIntoView({ block: "center" })
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let start = 0
    for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
      if (node.parentElement?.closest(".note_htmlView") !== null) continue
      if (offset < start + node.length) {
        const range = document.createRange()
        range.setStart(node, offset - start)
        range.setEnd(node, offset - start + 1)
        const rect = range.getBoundingClientRect()
        return { x: rect.left + 1, y: rect.top + rect.height / 2 }
      }
      start = start + node.length
    }
    throw new Error(`no character at ${offset}`)
  }, { id_Run, line, offset })
  await opened.page.mouse.click(point.x, point.y)
}

// line 13, "Wrap the call in a function, ...", the tenth of run lines-4:
// typed into after "Wrap ", a character taken back, the line broken there,
// then each undone, and the typing done again
const line_Before = (await linesOf("lines-4"))[9]
await clickAt("lines-4", 9, 5)
await opened.page.keyboard.type("XY")
const line_Typed = (await linesOf("lines-4"))[9]
await opened.page.keyboard.press("Backspace")
const line_Deleted = (await linesOf("lines-4"))[9]
await opened.page.keyboard.press("Enter")
const lines_Broken = (await linesOf("lines-4")).slice(9, 11)
for (let step = 0; step < 3; step = step + 1) await opened.page.keyboard.press("Control+z")
const line_Undone = (await linesOf("lines-4"))[9]
await opened.page.keyboard.press("Control+Shift+z")
const line_Redone = (await linesOf("lines-4"))[9]

// typed into the words a proposal puts in, on line 18 as proposed; and into
// words an open proposal replaces, on line 24 as it is, which are locked
const line_Signal = (await linesOf("frame-18-proposed"))[0] ?? ""
await clickAt("frame-18-proposed", 0, line_Signal.indexOf("signal") + 2)
await opened.page.keyboard.type("Z")
const line_Signal_Typed = (await linesOf("frame-18-proposed"))[0]
const line_Locked = (await linesOf("frame-23-current"))[1] ?? ""
await clickAt("frame-23-current", 1, line_Locked.indexOf("waiting") + 2)
await opened.page.keyboard.type("Q")
const line_Locked_Typed = (await linesOf("frame-23-current"))[1]

// "Wrap" selected by a word, copied, and pasted at the line's end
await clickAt("lines-4", 9, 0)
await opened.page.keyboard.press("Shift+Alt+ArrowRight")
await opened.page.keyboard.press("Control+c")
await opened.page.keyboard.press("End")
await opened.page.keyboard.press("Control+v")
const line_Pasted = (await linesOf("lines-4"))[9]

describe("the Markdown example, typed into: the document's own words, a proposal's, and what's locked", () => {
  test("typing puts its characters in where the caret is, Backspace takes one back, Enter breaks the line there", () => {
    expect(line_Before).toBe("Wrap the call in a function, and pass it to `retry`, with any options:")
    expect(line_Typed).toBe("Wrap XYthe call in a function, and pass it to `retry`, with any options:")
    expect(line_Deleted).toBe("Wrap Xthe call in a function, and pass it to `retry`, with any options:")
    expect(lines_Broken).toEqual(["Wrap X", "the call in a function, and pass it to `retry`, with any options:"])
  })
  test("undo takes back the line's break, the character taken back, and what was typed, run together, one at a time; redo does the typing again", () => {
    expect(line_Undone).toBe(line_Before)
    expect(line_Redone).toBe(line_Typed)
  })
  test("typing in a proposal's own words edits the proposal; in the words an open proposal replaces, as they are, it's refused", () => {
    expect(line_Signal_Typed).toContain("{ siZgnal }")
    expect(line_Locked_Typed).toBe(line_Locked)
  })
  test("what's copied is what's selected, pasted where the caret is; and nothing's reported wrong", () => {
    expect(line_Pasted).toBe(`${line_Typed}Wrap`)
    expect(opened.errors).toEqual([])
  })
})

// then typed into line 18 as proposed where it's the document's own words,
// "co|nst", and a character taken back just before the proposal's own
// words; and typed into line 23 as it is, "unless", no proposal's words
// there
const line_Current_18 = (await linesOf("frame-18-current"))[0]
const line_Proposed_18 = (await linesOf("frame-18-proposed"))[0] ?? ""
await clickAt("frame-18-proposed", 0, 2)
await opened.page.keyboard.type("W")
const line_Proposed_18_Typed = (await linesOf("frame-18-proposed"))[0] ?? ""
await clickAt("frame-18-proposed", 0, line_Proposed_18_Typed.indexOf(", { siZgnal"))
await opened.page.keyboard.press("Backspace")
const line_Proposed_18_Deleted = (await linesOf("frame-18-proposed"))[0]
const line_Current_18_After = (await linesOf("frame-18-current"))[0]
const line_23 = (await linesOf("frame-23-current"))[0] ?? ""
await clickAt("frame-23-current", 0, line_23.indexOf("unless") + 2)
await opened.page.keyboard.type("W")
const line_23_Typed = (await linesOf("frame-23-current"))[0]

test("a frame's lines as proposed are typed into anywhere, the document's own words among them too, each edit there a change of yours; the frame's lines as they are, the original, read only, stay as they were through it all", () => {
  expect(line_Current_18).toBe("const user = await retry(() => fetchUser(id), { attempts: 3 });")
  expect(line_Proposed_18).toContain("{ siZgnal }")
  expect(line_Proposed_18_Typed).toBe(`coW${line_Proposed_18.slice(2)}`)
  expect(line_Proposed_18_Deleted).toBe(line_Proposed_18_Typed.replace("(id, { siZgnal", "(i, { siZgnal"))
  expect(line_Current_18_After).toBe(line_Current_18)
  expect(line_23_Typed).toBe(line_23)
  expect(opened.errors).toEqual([])
})

// typed into the moved lines as they land, "What it retries", and into the
// frame whose proposals are a revision asked for, accepted and withdrawn,
// "Each wait": each edit a change of yours, the lines as they are, where
// the move leaves and in that frame, as they were
const line_Moved = (await linesOf("frame-21-proposed"))[0] ?? ""
const lines_Leaving = await linesOf("frame-27-current")
await clickAt("frame-21-proposed", 0, line_Moved.indexOf("retries"))
await opened.page.keyboard.type("V")
const line_Moved_Typed = (await linesOf("frame-21-proposed"))[0]
const lines_Wait = await linesOf("frame-39-current")
const line_Wait = (await linesOf("frame-39-proposed"))[0] ?? ""
await clickAt("frame-39-proposed", 0, line_Wait.indexOf("twice"))
await opened.page.keyboard.type("V")
const line_Wait_Typed = (await linesOf("frame-39-proposed"))[0]
const shown_Yours = await opened.page.evaluate(() => ({
  titles: [...document.querySelectorAll(".item_htmlView[data-source=\"yours\"] .title_htmlView")].map((element) => element.textContent),
  leaving: [...document.querySelectorAll(".run_htmlView[data-run=\"frame-27-current\"] > .line_htmlView > .text_htmlView")].map((element) => [...element.childNodes].filter((node) => !(node instanceof Element && node.classList.contains("note_htmlView"))).map((node) => node.textContent).join("")),
  wait: [...document.querySelectorAll(".run_htmlView[data-run=\"frame-39-current\"] > .line_htmlView > .text_htmlView")].map((element) => element.textContent)
}))

test("typed anywhere among what's proposed, moved lines and the words round a proposal not open too, an edit's a change of yours, listed as yours where it's drawn; the lines as they are stay as they were", () => {
  expect(line_Moved_Typed).toBe(line_Moved.replace("retries", "Vretries"))
  expect(line_Wait_Typed).toBe(line_Wait.replace("twice", "Vtwice"))
  expect(shown_Yours.titles.length).toBeGreaterThan(0)
  expect(shown_Yours.titles.every((title) => title === "Your edits")).toBe(true)
  expect(shown_Yours.leaving).toEqual(lines_Leaving)
  expect(shown_Yours.wait).toEqual(lines_Wait)
  expect(opened.errors).toEqual([])
})

// then, in those moved lines, words that are there edited: "ab" typed into
// "ret|ries", three characters taken back, through what's typed into the
// document's before it, "c" typed, three selected back over it and two of
// the document's and typed over, and two deleted after the caret
const line_Existing = (await linesOf("frame-21-proposed"))[0] ?? ""
const at_Existing = line_Existing.indexOf("retries") + 3
await clickAt("frame-21-proposed", 0, at_Existing)
await opened.page.keyboard.type("ab")
const line_Existing_Typed = (await linesOf("frame-21-proposed"))[0]
for (let count = 0; count < 3; count++) await opened.page.keyboard.press("Backspace")
const line_Existing_Back = (await linesOf("frame-21-proposed"))[0]
await opened.page.keyboard.type("c")
for (let count = 0; count < 3; count++) await opened.page.keyboard.press("Shift+ArrowLeft")
await opened.page.keyboard.type("Z")
const line_Existing_Over = (await linesOf("frame-21-proposed"))[0]
for (let count = 0; count < 2; count++) await opened.page.keyboard.press("Delete")
const line_Existing_Deleted = (await linesOf("frame-21-proposed"))[0]
const lines_Leaving_After = await linesOf("frame-27-current")

test("words already there, among what's proposed, are edited as typed: every character typed goes in, taking back runs on from what's typed into the words before it, a selection over both is typed over, and deleting forward takes what's after; where the lines move from stays as it was", () => {
  expect(line_Existing_Typed).toBe(`${line_Existing.slice(0, at_Existing)}ab${line_Existing.slice(at_Existing)}`)
  expect(line_Existing_Back).toBe(`${line_Existing.slice(0, at_Existing - 1)}${line_Existing.slice(at_Existing)}`)
  expect(line_Existing_Over).toBe(`${line_Existing.slice(0, at_Existing - 3)}Z${line_Existing.slice(at_Existing)}`)
  expect(line_Existing_Deleted).toBe(`${line_Existing.slice(0, at_Existing - 3)}Z${line_Existing.slice(at_Existing + 2)}`)
  expect(lines_Leaving_After).toEqual(lines_Leaving)
  expect(opened.errors).toEqual([])
})

// the JavaScript example, its loop's condition as proposed, "... round ===
// attempts || signal?.aborted) break", the moved words ending at
// "attempts", the words a proposal puts in, " || signal?.aborted", right
// after them: an "s" typed at their meeting, and the rings drawn there
const opened_JavaScript = await openExample(
  "javascript",
  1
)
afterAll(() => opened_JavaScript.close())

// the JavaScript example as it opens, before anything's pressed: a case of
// each kind of thing asked and decided, as its host lists them
const seeded_JavaScript = await opened_JavaScript.page.evaluate(async () => {
  await document.fonts.ready
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const saidOf = (element: Element) => [
    element.querySelector(".notes_Said_htmlView")?.textContent ?? "",
    element.querySelector(".reference_Said_htmlView .words_Quote_htmlView")?.textContent ?? "",
    element.querySelector(".reference_Said_htmlView .show_Said_htmlView")?.textContent ?? "",
    element.querySelector(".progress_Said_htmlView")?.textContent ?? ""
  ].join(" | ")
  const said_Url = [...document.querySelectorAll(".card_Document_htmlView .said_htmlView")].find((element) => (element.textContent ?? "").includes("https://"))
  const rect_Said_Url = said_Url?.getBoundingClientRect()
  return {
    status: [...new Set([...document.querySelectorAll(".group_htmlView[data-source=\"status\"] > .area_htmlView[data-change]:not([data-notch])")].map((element) => getComputedStyle(element).fill === "none" ? "outline" : "filled"))],
    cap: [...(document.querySelector(".item_htmlView[data-source=\"cap\"]")?.querySelectorAll(".said_htmlView") ?? [])].map(saidOf),
    timeout: [...(document.querySelector(".item_htmlView[data-source=\"timeout\"]")?.querySelectorAll(".said_htmlView") ?? [])].map(saidOf),
    isDotted: document.querySelectorAll(".underlay_htmlView[data-requested]:not([data-many])").length > 0,
    isDashed: document.querySelectorAll(".underlay_htmlView[data-requested][data-many]").length > 0,
    isCut: document.querySelectorAll(".layer_htmlView[data-layer=\"RINGS\"][mask]").length > 0,
    runs_Requested: [...document.querySelectorAll(".run_htmlView")].flatMap((run) => {
      const count = run.querySelectorAll(".underlay_htmlView[data-requested]").length
      return count === 0 ? [] : [`${run.getAttribute("data-run")}: ${count}`]
    }),
    document: [...document.querySelectorAll(".card_Document_htmlView .said_htmlView")].map(saidOf),
    task: [...document.querySelectorAll(".card_Task_htmlView .said_htmlView")].map(saidOf),
    dropped: [...new Set([...document.querySelectorAll(".item_htmlView[data-source=\"order\"] .stale_htmlView")].map((element) => element.textContent))],
    isUrlKept: rect_Said_Url !== undefined && [...(said_Url?.querySelector(".notes_Said_htmlView")?.getClientRects() ?? [])].every((rect) => rect.right <= rect_Said_Url.right + 1)
  }
})

test("the JavaScript example opens with a case of each kind of thing asked and decided: an accepted proposal not yet applied, its move's rings filled; a request on a proposal sent with words its change puts in, dotted under them, its chip and its line; a revising one with more queued for its next round; the document's own requests, one cutting through a ring's edge, two overlapping, dashed there, one over two lines in progress, one with a link too long for its line kept inside it, two done with, by a proposal and with nothing to change, each request's words marked only on the side of a frame they were selected on, as they are or as proposed, not mirrored in its other; the task's own; and a round that dropped a move", () => {
  expect(seeded_JavaScript).toEqual({
    status: ["filled"],
    cap: [
      "make the cap an option, 30 seconds unless the caller gives another. |  |  | ",
      "Name it MAX_DELAY_MS, up with the other constants. | 30_000 | line 33 | "
    ],
    timeout: [
      "only when the request is safe to send twice, a GET or a PUT. |  |  | running",
      "Say timed out, as the status means, not before any answer. | before any answer | line 37 | "
    ],
    isDotted: true,
    isDashed: true,
    isCut: true,
    runs_Requested: ["frame-13-current: 5", "lines-28: 2", "frame-31-proposed: 1", "frame-36-proposed: 1"],
    document: [
      "Count the errors too, for the message. | lastError = error; | line 20 | ",
      "Say which round it gives up at. | n === attempts | line 21 | ",
      "Give up on an error that can't be retried before the count's checked. | attempts || !isRetryable(error) | line 21 | ",
      "Say why half a delay at random, not a whole one. | // 100ms, 200ms, 400ms, ..., and up to half as long again at random, so that… | lines 29–30 | running",
      "Say what this throws: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted | signal?.throwIfAborted(); | line 16 | ",
      "Keep every error the attempts throw, not only the last. |  |  | done (1 proposal)",
      "Check the doc comment still says what retry takes. |  |  | done (nothing to change)"
    ],
    task: ["Say in the README that onRetry is gone. |  |  | "],
    dropped: ["1 dropped, its text goneRun again"],
    isUrlKept: true
  })
})
const ringsAt = (needle: string) => opened_JavaScript.page.evaluate(async (needle) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const element_Line = [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes(needle))
  return [...element_Line?.querySelectorAll("[data-source]") ?? []].map((element) => `${element.textContent} ${element.getAttribute("data-source")}${element.hasAttribute("data-edit-source") ? `+${element.getAttribute("data-edit-source")}` : ""}`)
}, needle)
const point_Attempts = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const element_Line = [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes("round === attempts || signal"))
  if (!(element_Line instanceof HTMLElement)) throw new Error("no condition as proposed")
  element_Line.scrollIntoView({ block: "center" })
  const walker = document.createTreeWalker(element_Line, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
    const index = node.data.indexOf("attempts")
    if (index === -1) continue
    const range = document.createRange()
    range.setStart(node, index + 7)
    range.setEnd(node, index + 8)
    const rect = range.getBoundingClientRect()
    return { x: rect.right - 1, y: rect.top + rect.height / 2 }
  }
  throw new Error("no attempts")
})
await opened_JavaScript.page.mouse.click(point_Attempts.x, point_Attempts.y)
await opened_JavaScript.page.keyboard.type("s")
const rings_Attempts = await ringsAt("round === attemptss || signal")

test("typed onto the end of a word where another proposal's words begin, a letter joins the word, a change of yours over all of it, drawn where it's typed; the other proposal's words are left as they were", () => {
  expect(rings_Attempts).toContain("attemptss order+yours")
  expect(rings_Attempts.filter((ring) => ring.endsWith(" aborted"))).toEqual([" || signal?. aborted", "aborted aborted"])
  expect(opened_JavaScript.errors).toEqual([])
})

// what each page's host was told of the edits made on it, as the
// playground reports it
const logged_Markdown = await opened.logged()
const logged_JavaScript = await opened_JavaScript.logged()

test("each edit's told to the host as it's applied, as the playground reports it: what kind it was, whose proposals' changes it changed, each its next round, and whether the document changed; typing outside frames, the document; among what's proposed, a proposal's own words, that proposal, and anywhere else, yours; undoing too", () => {
  const edits = logged_Markdown.filter((entry) => "edited" in entry)
  expect(edits).toContainEqual({ edited: "TEXT", proposals: "", document: true })
  expect(edits).toContainEqual({ edited: "TEXT", proposals: "example", document: false })
  expect(edits).toContainEqual({ edited: "TEXT", proposals: "yours", document: false })
  expect(edits.some((entry) => entry["edited"] === "UNDO")).toBe(true)
  expect(logged_JavaScript.filter((entry) => "edited" in entry)).toEqual([{ edited: "TEXT", proposals: "yours", document: false }])
})

// then, on the JavaScript example, its host the playground's: "Keep every
// error" accepted; a revision of "Drop the onRetry hook" queued, what should
// change written under it; the withdrawn "Log each retry" dismissed; a
// second revision of the hook queued, both listed, and the first removed;
// Accept pressed on the hook, asked first, as it'd drop what's queued, the
// keyboard on Cancel, and Escape taking it back; then the hook's one
// request started alone, from its own Start, the hook revising, that
// request in progress; a revision of it added meanwhile, its form offering
// no Start while a round's under way, queued for the next; a revision of
// the cap added, and both its requests started from Start under them; and,
// a moment later, the host having no agent, each round back: the cap open,
// what was asked of it done with, the hook's started request done with,
// the one added meanwhile still queued; each proposal's items, and what's
// drawn, after each; and typed into again
const itemsOf = (source: string) => opened_JavaScript.page.evaluate(async (source) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(`.item_htmlView[data-source="${source}"]`)].map((element) => ({
    state: element.getAttribute("data-state"),
    actions: [...element.querySelectorAll(".action_htmlView[data-command]")].map((button) => button.textContent),
    asked: [...element.querySelectorAll(".notes_Said_htmlView")].map((said) => said.textContent),
    quoted: [...element.querySelectorAll(".reference_Said_htmlView .words_Quote_htmlView")].map((quote) => quote.textContent),
    removes: element.querySelectorAll(".remove_htmlView").length,
    starts: element.querySelectorAll(".request_htmlView .start_Request_htmlView").length,
    adds: element.querySelectorAll(".request_htmlView .add_Request_htmlView").length,
    starts_Request: element.querySelectorAll(".start_Said_htmlView").length,
    progress: element.querySelectorAll(".progress_Said_htmlView").length,
    ink_Revise: [...element.querySelectorAll(":is(.action_htmlView, .add_Request_htmlView)[data-command=\"revise\"]")].map((button) => getComputedStyle(button).color).join()
  }))
}, source)
// a control pressed as you would: the ellipsis it's folded behind pointed
// at first, its actions unfolding in its place, then the control itself
const pressedAt = async (control: ReturnType<typeof opened_JavaScript.page.locator>) => {
  const fold = control.locator("xpath=ancestor::*[contains(concat(' ', @class, ' '), ' fold_Action_htmlView ')][1]")
  if (await fold.count() > 0) {
    await fold.scrollIntoViewIfNeeded()
    const box = await fold.locator(":scope > .more_htmlView").boundingBox()
    if (box !== null) await opened_JavaScript.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const box_Control = await control.boundingBox()
    if (box !== null && box_Control !== null && box_Control.width > 1) {
      await opened_JavaScript.page.mouse.click(box_Control.x + box_Control.width / 2, box_Control.y + box_Control.height / 2)
      return
    }
  }
  await control.click()
}
const pressed = async (source: string, command: string) => {
  const button = opened_JavaScript.page.locator(`.item_htmlView[data-source="${source}"] :is(.action_htmlView, .add_Request_htmlView)[data-command="${command}"]`).first()
  await button.locator("xpath=ancestor::*[contains(concat(' ', @class, ' '), ' item_htmlView ')][1]").scrollIntoViewIfNeeded()
  await pressedAt(button)
}
// a request's own control pressed, as you would: the request pointed at
// first, its ellipsis unfolding into its actions, then the control
const pressedIn = async (said: ReturnType<typeof opened_JavaScript.page.locator>, control: string) => {
  await pressedAt(said.locator(control))
}
const revisedWith = async (source: string, notes: string, draft: "ADD" | "START") => {
  await pressed(source, "revise")
  await opened_JavaScript.page.locator(`.item_htmlView[data-source="${source}"] .notes_htmlView`).first().fill(notes)
  await opened_JavaScript.page.locator(`.item_htmlView[data-source="${source}"] .action_htmlView[data-draft="${draft}"]`).first().click()
}
// a proposal's Revise form first: its Add and Start there from the
// outset, not to be pressed till something's written in it, pressable
// once it is, and not again once it's only blank; written in again, put
// away by Revise pressed again, as its Cancel would, the keyboard back on
// Revise
await pressed("hook", "revise")
const buttonsOf_Draft = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".item_htmlView[data-source=\"hook\"] .draft_htmlView :is([data-draft=\"ADD\"], [data-draft=\"START\"])")].map((element) => `${element.textContent?.trim()} ${element instanceof HTMLButtonElement && element.disabled ? "disabled" : "enabled"}`)
})
const draft_Opened = await buttonsOf_Draft()
const notes_Held = opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .draft_htmlView .notes_htmlView").first()
await notes_Held.fill("Say why.")
const draft_Written = await buttonsOf_Draft()
await notes_Held.fill("   ")
const draft_Blank = await buttonsOf_Draft()
await notes_Held.fill("Say why.")
await pressed("hook", "revise")
const draft_Toggled = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    drafts: document.querySelectorAll(".item_htmlView[data-source=\"hook\"] .draft_htmlView").length,
    isReviseFocused: document.activeElement?.matches(".item_htmlView[data-source=\"hook\"] [data-command=\"revise\"]") === true
  }
})

test("a proposal's Revise form: Add and Start there from the outset, pressable only while something's written in it; Revise pressed again putting it away, what's written and all", () => {
  expect(draft_Opened).toEqual(["Add disabled", "Start disabled"])
  expect(draft_Written).toEqual(["Add enabled", "Start enabled"])
  expect(draft_Blank).toEqual(["Add disabled", "Start disabled"])
  expect(draft_Toggled).toEqual({ drafts: 0, isReviseFocused: true })
})

await pressed("errors", "accept")
const items_Accepted = await itemsOf("errors")
const fills_Accepted = await opened_JavaScript.page.evaluate(() => ({
  accepted: [...new Set([...document.querySelectorAll(".group_htmlView[data-source=\"errors\"] > .area_htmlView[data-change]:not([data-notch])")].map((element) => getComputedStyle(element).fill === "none" ? "outline" : "filled"))],
  open: [...new Set([...document.querySelectorAll(".group_htmlView[data-source=\"round\"] > .area_htmlView[data-change]:not([data-notch])")].map((element) => getComputedStyle(element).fill === "none" ? "outline" : "filled"))]
}))
await revisedWith("hook", "Keep the hook, but call it after the delay.", "ADD")
const items_Requested = await itemsOf("hook")
await pressed("log", "dismiss")
const items_Dismissed = await itemsOf("log")
await revisedWith("hook", "Name what it's given.", "ADD")
const items_Queued = await itemsOf("hook")
await pressedIn(opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .said_htmlView:has(.remove_htmlView)").first(), ".remove_htmlView")
const items_Removed = await itemsOf("hook")
await pressed("hook", "accept")
const confirming_Hook = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    question: document.querySelector(".item_htmlView[data-source=\"hook\"] .question_htmlView")?.textContent ?? null,
    focused: document.activeElement?.textContent ?? null
  }
})
await opened_JavaScript.page.keyboard.press("Escape")
const items_Kept = await itemsOf("hook")
await pressedIn(opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .said_htmlView:has(.start_Said_htmlView)").first(), ".start_Said_htmlView")
const items_Alone = await itemsOf("hook")
await pressed("hook", "revise")
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .notes_htmlView").first().fill("And document it.")
const draft_Running = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".item_htmlView[data-source=\"hook\"] .draft_htmlView .action_htmlView")].map((button) => button.textContent))
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .action_htmlView[data-draft=\"ADD\"]").first().click()
const items_Meanwhile = await itemsOf("hook")
await revisedWith("cap", "Say why 30.", "ADD")
await pressedAt(opened_JavaScript.page.locator(".item_htmlView[data-source=\"cap\"] .request_htmlView .start_Request_htmlView").first())
const items_Capped = await itemsOf("cap")
await opened_JavaScript.page.waitForFunction(() => [...document.querySelectorAll(".item_htmlView:is([data-source=\"hook\"], [data-source=\"cap\"])")].every((element) => element.getAttribute("data-state") !== "REVISING"))
const items_Back_Hook = await itemsOf("hook")
const items_Back_Cap = await itemsOf("cap")
const asked_JavaScript = (await opened_JavaScript.logged()).filter((entry) => "asked" in entry)
const queued_JavaScript = (await opened_JavaScript.logged()).filter((entry) => "removed" in entry || "revising" in entry || "revised" in entry)
// then the header over the document: the playground's task, named,
// working while the timeout's revised, Stop offered then, and the
// document, named, its card offering Add a request, Start, saying how many
// it starts, and the host's action for it; Stop putting what's running
// back in the queue; the document's Start setting every proposal's queued
// requests going at once; and, a moment later, nothing left asked
const headerShown = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const header = document.querySelector(".htmlView_editor > .header_htmlView")
  return {
    task: [header?.querySelector(".name_Task_htmlView")?.textContent ?? null, header?.querySelector(".mark_Task_htmlView")?.getAttribute("data-state") ?? null, header?.querySelector(".state_Task_htmlView")?.textContent ?? null],
    parts: [...header?.querySelectorAll(".part_Header_htmlView") ?? []].map((element) => element.textContent),
    spinners: header?.querySelectorAll(".spinner_htmlView").length ?? 0,
    document: [header?.querySelector(".name_Document_htmlView")?.textContent ?? null, header?.querySelector(".mark_Document_htmlView")?.getAttribute("data-state") ?? null, header?.querySelector(".state_Document_htmlView")?.textContent ?? null],
    card: [...header?.querySelectorAll(".card_Task_htmlView :is(.actions_Card_htmlView, .total_Document_Card_htmlView .actions_Document_Card_htmlView) > button") ?? []].map((element) => element.textContent),
    card_Document: [...header?.querySelectorAll(".card_Document_htmlView .actions_Card_htmlView > button") ?? []].map((element) => element.textContent),
    isSticky: header === null ? false : getComputedStyle(header).position === "sticky"
  }
})
const header_Working = await headerShown()
const cardOf_Task = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const card = document.querySelector(".header_htmlView .card_Task_htmlView")
  return {
    isShown: card === null ? false : getComputedStyle(card).visibility === "visible",
    head: card?.querySelector(".head_Card_htmlView")?.textContent ?? null,
    summary: card?.querySelector(".summary_Card_htmlView")?.textContent ?? null,
    id: card?.querySelector(".id_Card_htmlView")?.textContent ?? null,
    figures: [...card?.querySelectorAll(".section_Card_htmlView") ?? []].map((element) => {
      const value = element.querySelector(":scope > .line_Card_htmlView > .value_Card_htmlView, :scope > .total_Document_Card_htmlView > .value_Document_Card_htmlView")
      const title = (value?.closest(".total_Document_Card_htmlView") ?? value)?.getAttribute("title")
      return `${element.querySelector(".label_Card_htmlView")?.textContent}: ${value?.textContent ?? ""}${title ? ` (${title})` : ""}`
    }),
    documents: [...card?.querySelectorAll(".section_Card_htmlView[aria-label=\"Proposals\"] .list_Document_Card_htmlView > .document_Card_htmlView") ?? []].map((element) => `${element.querySelector(".name_Document_Card_htmlView")?.textContent}${element.hasAttribute("aria-current") ? " (this document)" : ""}: ${element.querySelector(".value_Document_Card_htmlView")?.textContent} (${element.getAttribute("title")})`),
    parts: [...card?.children ?? []].map((element) => element.className)
  }
})
const cardOf_Document = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const card = document.querySelector(".header_htmlView .card_Document_htmlView")
  return {
    isShown: card === null ? false : getComputedStyle(card).visibility === "visible",
    label: card?.getAttribute("aria-label") ?? null,
    summary: card?.querySelector(".summary_Card_htmlView")?.textContent ?? null,
    figures: [...card?.querySelectorAll(".section_Card_htmlView") ?? []].map((element) => {
      const value = element.querySelector(":scope > .line_Card_htmlView > .value_Card_htmlView, :scope > .total_Document_Card_htmlView > .value_Document_Card_htmlView")
      const title = (value?.closest(".total_Document_Card_htmlView") ?? value)?.getAttribute("title")
      return `${element.querySelector(".label_Card_htmlView")?.textContent}: ${value?.textContent ?? ""}${title ? ` (${title})` : ""}`
    }),
    actions: [...card?.querySelectorAll(".actions_Card_htmlView > button") ?? []].map((element) => element.getAttribute("title") ?? element.textContent)
  }
})
const card_Resting = await cardOf_Task()
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
const card_Hovered = await cardOf_Task()
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const card_Document = await cardOf_Document()
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView [data-scope=\"TASK\"][data-work=\"STOP\"]"))
const header_Stopped = await headerShown()
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView .start_htmlView"))
const header_Started = await headerShown()
await opened_JavaScript.page.waitForFunction(() => document.querySelector(".item_htmlView[data-state=\"REVISING\"], .item_htmlView[data-state=\"REQUESTED\"]") === null)
const header_Done = await headerShown()
const logged_Header = (await opened_JavaScript.logged()).filter((entry) => "stopped" in entry || "revising" in entry || "revised" in entry)
const logged_Stopped = logged_Header.slice(logged_Header.findIndex((entry) => "stopped" in entry))
// then Run again on the opening comment, its last round written before an
// edit of yours touched what it was on, its ring dashed: asked of the host,
// which starts it again, on the document as it is now, revising, the line
// still saying so, nothing to run again while it's under way; and, its
// round back, written on the document as it is, nothing marked
const staleOf_Header = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const item = document.querySelector(".item_htmlView[data-source=\"header\"]")
  const rings = [...document.querySelectorAll(".underlay_htmlView[data-source=\"header\"][data-stale]")]
  return {
    state: item?.getAttribute("data-state") ?? null,
    stale: item?.querySelector(".stale_htmlView")?.textContent ?? null,
    dashes: [...new Set(rings.flatMap((ring) => (ring.getAttribute("d") ?? "").split("M").map((part) => (part.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number)).filter((numbers) => numbers.length === 4).map(([x1 = 0, y1 = 0, x2 = 0, y2 = 0]) => Math.round(Math.hypot(x2 - x1, y2 - y1) * 100) / 100)))]
  }
})
const stale_Landed = await staleOf_Header()
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"header\"] .rerun_htmlView").first().click()
const stale_Rerunning = await staleOf_Header()
await opened_JavaScript.page.waitForFunction(() => document.querySelector(".item_htmlView[data-source=\"header\"]")?.getAttribute("data-state") === "OPEN")
const stale_Again = await staleOf_Header()
const logged_Rerun = (await opened_JavaScript.logged()).filter((entry) => "rerun" in entry || ("revising" in entry && entry["revising"] === "header"))
const lineOf_Attempts = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].map((element) => element.textContent ?? "").find((text) => text.includes("round === attemptss")) ?? ""
})
const line_Attempts = await lineOf_Attempts()
const point_Attempts_After = await opened_JavaScript.page.evaluate(() => {
  const element_Line = [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes("round === attemptss"))
  if (!(element_Line instanceof HTMLElement)) throw new Error("no condition as proposed")
  element_Line.scrollIntoView({ block: "center" })
  const walker = document.createTreeWalker(element_Line, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
    const index = node.data.indexOf("attemptss")
    if (index === -1) continue
    const range = document.createRange()
    range.setStart(node, index + 8)
    range.setEnd(node, index + 9)
    const rect = range.getBoundingClientRect()
    return { x: rect.right - 1, y: rect.top + rect.height / 2 }
  }
  throw new Error("no attemptss")
})
await opened_JavaScript.page.mouse.click(point_Attempts_After.x, point_Attempts_After.y)
await opened_JavaScript.page.keyboard.type("x")
const line_Attempts_Typed = await lineOf_Attempts()

test("a proposal's action pressed is asked of the host, which sends back what it now has: accepted, it's drawn accepted, its rings filled, an open one's outlines, Reopen its one action; a revision added, its notes asked with it, it's drawn as one requested, what you asked listed under it, still to be accepted, rejected or asked more of; dismissed, it's gone; another added, both listed, one removed; accepting one with revisions queued asked first, Cancel the keyboard's, Escape taking it back; one request started alone, from its own Start, the proposal revising, that request in progress, nothing of it to remove; one added meanwhile queued for the next round, nothing to start while a round's under way; Start under a proposal's requests starting all of them, and that proposal alone; each round back, what it answered done with, what's queued since still queued; and what's typed after goes on as before", () => {
  expect(items_Accepted.length).toBeGreaterThan(0)
  expect(items_Accepted.every((item) => item.state === "ACCEPTED" && item.actions.join() === "Reopen")).toBe(true)
  expect(fills_Accepted).toEqual({ accepted: ["filled"], open: ["outline"] })
  expect(items_Requested.length).toBeGreaterThan(0)
  expect(items_Requested.every((item) => item.state === "REQUESTED" && item.asked.join("|") === "Keep the hook, but call it after the delay." && item.actions.join() === "Accept,Reject" && item.adds === 1 && item.removes === 1 && item.starts === 1)).toBe(true)
  expect(items_Requested[0]?.ink_Revise).toBe(items_Back_Cap[0]?.ink_Revise)
  expect(items_Dismissed).toEqual([])
  expect(items_Queued.every((item) => item.asked.join("|") === "Keep the hook, but call it after the delay.|Name what it's given." && item.removes === 2)).toBe(true)
  expect(items_Removed.every((item) => item.state === "REQUESTED" && item.asked.join("|") === "Name what it's given.")).toBe(true)
  expect(confirming_Hook).toEqual({ question: "Accept and drop 1 queued request?", focused: "Cancel" })
  expect(items_Kept.every((item) => item.state === "REQUESTED" && item.actions.join() === "Accept,Reject" && item.asked.join("|") === "Name what it's given.")).toBe(true)
  const shape = (items: Awaited<ReturnType<typeof itemsOf>>) => [...new Set(items.map((item) => JSON.stringify([item.state, item.asked, item.progress, item.removes, item.starts, item.starts_Request])))]
  expect(shape(items_Alone)).toEqual([JSON.stringify(["REVISING", ["Name what it's given."], 1, 0, 0, 0])])
  expect(draft_Running).toEqual(["Add", "Cancel"])
  expect(shape(items_Meanwhile)).toEqual([JSON.stringify(["REVISING", ["Name what it's given.", "And document it."], 1, 1, 0, 0])])
  expect(items_Meanwhile.every((item) => item.actions.join() === "Accept,Reject" && item.adds === 1)).toBe(true)
  expect(shape(items_Capped)).toEqual([JSON.stringify(["REVISING", ["make the cap an option, 30 seconds unless the caller gives another.", "Name it MAX_DELAY_MS, up with the other constants.", "Say why 30."], 3, 0, 0, 0])])
  expect(shape(items_Back_Hook)).toEqual([JSON.stringify(["REQUESTED", ["And document it."], 0, 1, 1, 1])])
  expect(shape(items_Back_Cap)).toEqual([JSON.stringify(["OPEN", [], 0, 0, 0, 0])])
  expect(asked_JavaScript).toEqual([
    { asked: "accept", proposal: "errors", notes: null, words: null },
    { asked: "revise", proposal: "hook", notes: "Keep the hook, but call it after the delay.", words: null },
    { asked: "dismiss", proposal: "log", notes: null, words: null },
    { asked: "revise", proposal: "hook", notes: "Name what it's given.", words: null },
    { asked: "revise", proposal: "hook", notes: "And document it.", words: null },
    { asked: "revise", proposal: "cap", notes: "Say why 30.", words: null }
  ])
  expect(queued_JavaScript).toEqual([
    { removed: "hook-1", proposal: "hook" },
    { revising: "hook", requests: 1 },
    { revising: "cap", requests: 3 },
    { revised: "hook" },
    { revised: "cap" }
  ])
  expect(line_Attempts_Typed.length).toBe(line_Attempts.length + 1)
  expect(opened_JavaScript.errors).toEqual([])
})

test("the header over the document stays put as it scrolls, saying the host's task, its mark where it stands, the agent at work or your turn, its state in words for what reads it aloud, and the document, by its file's name, at its end, nothing between them; the task's card hidden until the task's hovered: its id and where it stands, what the agent says of it, how far its proposals have got across the documents it touches, and each document, this one marked, how far its own have got, each figure's breakdown when hovered, Add a request for the task as a whole, and the host's actions for it; the document's card, hovered, what the agent says the task does here, how far its proposals have got, and the host's action for them, how many revisions are queued and in progress, Revise, Start all and Stop all, saying how many when they're hovered; the task's Stop all putting what's in progress back in the queue; the document's Start setting every proposal's queued requests going at once, each proposal's round its own; nothing asked, nothing to start", () => {
  expect(header_Working).toEqual({ task: ["Tidy the retry loop", "WORKING", "Working"], parts: [], spinners: 0, document: ["retry.js", "WORKING", "Working"], card: ["Accept all (10)", "Start all (6)", "Stop all (3)"], card_Document: ["Accept all (7)", "Start all (5)", "Stop all (2)"], isSticky: true })
  expect(card_Resting.isShown).toBe(false)
  expect(card_Hovered).toEqual({ isShown: true, head: "T-12Working", summary: "Keeps every error, names the attempt counter round, caps the delay, and stops once the caller aborts; drops the onRetry hook and the opening comment.", id: "T-12", figures: ["Proposals: 6 of 20 decided (11 to review · 1 revision requested · 2 revising · 5 accepted · 1 rejected)", "Scope Revisions: 7 queued · 3 running", "Level Revisions: "], documents: ["retry.js (this document): 4 of 14 decided (8 to review · 1 revision requested · 1 revising · 3 accepted · 1 rejected)", "README.md: 2 of 6 decided (3 to review · 1 revising · 2 accepted)"], parts: ["head_Card_htmlView", "summary_Card_htmlView", "section_Card_htmlView", "section_Card_htmlView", "section_Card_htmlView"] })
  expect(card_Document).toEqual({ isShown: true, label: "retry.js", summary: "In retry.js: the loop's errors, its counter's name, its delays and its abort, and two things it no longer needs.", figures: ["Proposals: 4 of 14 decided (8 to review · 1 revision requested · 1 revising · 3 accepted · 1 rejected)", "Scope Revisions: 6 queued · 2 running", "Level Revisions: "], actions: ["Accept all (7)", "Starts all 5 requests queued in this document, its own and its proposals'", "Stops all 2 running in this document, its own and its proposals', putting them back in the queue"] })
  expect(header_Stopped).toEqual({ task: ["Tidy the retry loop", "YOUR_TURN", "Your turn"], parts: [], spinners: 0, document: ["retry.js", "YOUR_TURN", "Your turn"], card: ["Accept all (10)", "Start all (10)"], card_Document: ["Accept all (7)", "Start all (8)"], isSticky: true })
  expect(header_Started).toEqual({ task: ["Tidy the retry loop", "WORKING", "Working"], parts: [], spinners: 0, document: ["retry.js", "WORKING", "Working"], card: ["Accept all (10)", "Start all (2)", "Stop all (8)"], card_Document: ["Accept all (7)", "Stop all (8)"], isSticky: true })
  expect(header_Done).toEqual({ task: ["Tidy the retry loop", "YOUR_TURN", "Your turn"], parts: [], spinners: 0, document: ["retry.js", "YOUR_TURN", "Your turn"], card: ["Accept all (12)", "Start all (2)"], card_Document: ["Accept all (9)"], isSticky: true })
  expect(logged_Stopped).toEqual([{ stopped: "TASK", requests: 2 }, { revising: "hook, timeout, document", requests: 8 }, { revised: "hook, timeout, document" }])
  expect(opened_JavaScript.errors).toEqual([])
})

test("a round that landed after your edits: its changes written before them ringed dashed, its item saying how many, with Run again; pressed, asked of the host, which starts it again, the proposal revising, nothing to run again while it's under way; its round back, written on the document as it is now, nothing marked", () => {
  expect(stale_Landed).toEqual({ state: "OPEN", stale: "1 change written before your editsRun again", dashes: [3] })
  expect(stale_Rerunning).toEqual({ state: "REVISING", stale: "1 change written before your edits", dashes: [3] })
  expect(stale_Again).toEqual({ state: "OPEN", stale: null, dashes: [] })
  expect(logged_Rerun).toEqual([{ rerun: "header", requests: 1 }, { revising: "header", requests: 1 }])
  expect(opened_JavaScript.errors).toEqual([])
})

// then a right-click, on the JavaScript example: on "aborted", the words
// "Stop retrying once the caller aborts" puts in, selected by a drag, its menu, and the
// revision of the proposal its first request opens, with them, written and
// sent with the keyboard; then on the
// document's words, nothing selected, its menu, closed with Escape, opened
// again from the keyboard, and a request for a change to the document sent
const rectOf_Word = (needle: string, word: string) => opened_JavaScript.page.evaluate(({ needle, word }) => {
  const element_Line = [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes(needle))
  if (!(element_Line instanceof HTMLElement)) throw new Error(`no line with ${needle}`)
  element_Line.scrollIntoView({ block: "center" })
  const walker = document.createTreeWalker(element_Line, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
    const index = node.data.indexOf(word)
    if (index === -1) continue
    const range = document.createRange()
    range.setStart(node, index)
    range.setEnd(node, index + word.length)
    const rect = range.getBoundingClientRect()
    return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2 }
  }
  throw new Error(`no ${word}`)
}, { needle, word })
const menuShown = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    choices: [...document.querySelectorAll(".menu_htmlView > .choice_htmlView")].map((element) => element.textContent),
    focused: document.activeElement?.textContent ?? null
  }
})
const rect_Aborted = await rectOf_Word("signal?.aborted) break", "aborted")
await opened_JavaScript.page.mouse.move(rect_Aborted.left + 1, rect_Aborted.y)
await opened_JavaScript.page.mouse.down()
await opened_JavaScript.page.mouse.move(rect_Aborted.right - 1, rect_Aborted.y, { steps: 5 })
await opened_JavaScript.page.mouse.up()
await opened_JavaScript.page.mouse.click(rect_Aborted.left + 4, rect_Aborted.y, { button: "right" })
const menu_Words = await menuShown()
await opened_JavaScript.page.keyboard.press("Enter")
const form_Words = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    label: document.querySelector(".asking_htmlView > .label_Asking_htmlView")?.textContent ?? null,
    quote: document.querySelector(".asking_htmlView .words_Quote_htmlView")?.textContent ?? null,
    isFocused: document.activeElement?.matches(".asking_htmlView > .notes_htmlView") === true
  }
})
await opened_JavaScript.page.keyboard.type("Check it before the delay too.")
await opened_JavaScript.page.keyboard.press("Control+Enter")
const items_Aborted = await itemsOf("aborted")
const isSelected_Aborted = await opened_JavaScript.page.evaluate(() => document.querySelectorAll(".selected_htmlView").length > 0)
const requested_Aborted = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] .underlay_htmlView[data-requested]")].map((element) => {
    const rect = element.getBoundingClientRect()
    const y = (rect.top + rect.bottom) / 2
    const element$_Text = [...(element.closest(".run_htmlView")?.querySelectorAll(":scope > .line_htmlView > .text_htmlView") ?? [])]
    return element$_Text.flatMap((element_Text) => {
      const walker = document.createTreeWalker(element_Text, NodeFilter.SHOW_TEXT)
      const characters: Array<string> = []
      for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
        for (let index = 0; index < node.data.length; index += 1) {
          const range = document.createRange()
          range.setStart(node, index)
          range.setEnd(node, index + 1)
          const rect_Character = range.getBoundingClientRect()
          const x = (rect_Character.left + rect_Character.right) / 2
          if (rect.left - 2 <= x && x <= rect.right + 2 && Math.abs(rect_Character.bottom - y) < 3) characters.push(node.data[index] ?? "")
        }
      }
      return characters
    }).join("")
  })
})
// each word lit, where it is, and whether it's lit as it should be: a
// solid line under it, showing, and no fill behind it, which inside a ring
// would read as the ring filled, an accepted proposal's
const litOf_Words = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".text_htmlView > [data-lit]")].map((element) => {
    const rect = element.getBoundingClientRect()
    const isLined = [...element.closest(".run_htmlView")?.querySelectorAll(".underlay_htmlView[data-underline][data-lit]") ?? []].some((line) => {
      const rect_Line = line.getBoundingClientRect()
      const style = getComputedStyle(line)
      return style.visibility === "visible" && style.strokeDasharray === "none" && rect_Line.left <= rect.left + 4 && rect_Line.right >= rect.right - 4 && rect_Line.top > rect.bottom - 3 && rect_Line.top < rect.bottom + 8
    })
    return `${element.closest(".run_htmlView")?.getAttribute("data-run")?.endsWith("-proposed") === true ? "proposed" : "current"} ${element.textContent} ${isLined && getComputedStyle(element).backgroundColor === "rgba(0, 0, 0, 0)"}`
  })
})
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"aborted\"] .said_htmlView .reference_Said_htmlView").first().hover()
const lit_Pointed = await litOf_Words()
await opened_JavaScript.page.mouse.move(5, 5)
const lit_Left = await litOf_Words()
const layersOf_Aborted = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const svg = [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .underlays_htmlView")].find((element) => element.querySelector(".group_htmlView[data-requested]") !== null && element.querySelector(".group_htmlView[data-source=\"aborted\"]") !== null)
  return {
    layer: svg?.querySelector(".layer_htmlView:has(> .group_htmlView[data-source=\"aborted\"] > .underlay_htmlView)")?.getAttribute("data-layer") ?? null,
    isRingsCut: svg?.querySelector(".layer_htmlView[data-layer=\"RINGS\"]")?.hasAttribute("mask") === true,
    isMarksCut: svg?.querySelector(".layer_htmlView[data-layer=\"MARKS\"]")?.hasAttribute("mask") === true
  }
})
const layers_Resting = await layersOf_Aborted()
const rect_Aborted_Pointed = await rectOf_Word("signal?.aborted) break", "aborted")
await opened_JavaScript.page.mouse.move(rect_Aborted_Pointed.left + 3, rect_Aborted_Pointed.y)
const layers_Pointed = await layersOf_Aborted()
await opened_JavaScript.page.mouse.move(5, 5)
const rect_Backoff = await rectOf_Word("export function backoff(round)", "backoff")
await opened_JavaScript.page.mouse.click(rect_Backoff.left + 2, rect_Backoff.y)
await opened_JavaScript.page.mouse.click(rect_Backoff.left + 2, rect_Backoff.y, { button: "right" })
const menu_Document = await menuShown()
await opened_JavaScript.page.keyboard.press("Escape")
const isClosed_Menu = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return document.querySelector(".menu_htmlView") === null && document.activeElement?.matches(".input_htmlView") === true
})
await opened_JavaScript.page.keyboard.press("Shift+F10")
const menu_Keyboard = await menuShown()
await opened_JavaScript.page.keyboard.press("Enter")
await opened_JavaScript.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
await opened_JavaScript.page.keyboard.type("Say why the delay doubles.")
await opened_JavaScript.page.keyboard.press("Control+Enter")
const asked_Menu = (await opened_JavaScript.logged()).filter((entry) => "requested" in entry || entry["words"] !== undefined && entry["words"] !== null)
// then the document's own requests: the one just added, on no proposal,
// listed in the document's card, as a proposal's are under its item;
// Add, at the foot of the list, Revise gone, opening the form for the
// whole document there, Add and Cancel only, adding one, the keyboard back
// on Add, then its own Start starting it, in progress, the other still
// queued; then it addressed,
// with nothing to change, there being no agent, still listed, and the
// other removed
const requestsOf_Document = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Document_htmlView .said_htmlView:not([data-request^=\"asked-\"])")].map((element) => {
    const progress = element.querySelector(".progress_Said_htmlView")?.textContent
    return `${element.querySelector(".notes_Said_htmlView")?.textContent}${progress === undefined ? "" : ` (${progress})`}`
  })
})
const requests_Added = await requestsOf_Document()
const label_Requests = await opened_JavaScript.page.evaluate(() => {
  const label = document.querySelector(".card_Document_htmlView .request_htmlView .label_Request_htmlView")
  return label === null ? null : [label.textContent, getComputedStyle(label).color === getComputedStyle(document.querySelector(".item_htmlView .label_Request_htmlView") ?? label).color, getComputedStyle(label.closest(".request_htmlView") ?? label).borderLeftStyle]
})
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView [data-ask=\"DOCUMENT\"]"))
await opened_JavaScript.page.mouse.move(700, 700)
const form_Header = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const card = document.querySelector(".card_Document_htmlView")
  const button = document.querySelector(".card_Document_htmlView [data-ask=\"DOCUMENT\"]")?.getBoundingClientRect()
  const form = document.querySelector(".asking_htmlView")?.getBoundingClientRect()
  return {
    isInCard: document.querySelector(".card_Document_htmlView .said_htmlView[data-adding] > .asking_htmlView[data-place=\"DOCUMENT\"]") !== null,
    isReviseGone: document.querySelector(".card_Document_htmlView .actions_Card_htmlView > [data-ask]") === null,
    isCardShown: card === null ? false : getComputedStyle(card).visibility === "visible",
    label: document.querySelector(".asking_htmlView > .label_Asking_htmlView")?.textContent ?? null,
    actions: [...document.querySelectorAll(".asking_htmlView .action_htmlView")].map((element) => element.textContent),
    isFocused: document.activeElement?.matches(".asking_htmlView > .notes_htmlView") === true,
    isUnder: button !== undefined && form !== undefined && form.top >= button.bottom
  }
})
await opened_JavaScript.page.keyboard.type("Name the module's exports.")
await opened_JavaScript.page.locator(".asking_htmlView [data-request=\"ADD\"]").click()
const isAskFocused_Document = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return document.activeElement?.matches(".card_Document_htmlView .add_Request_htmlView[data-ask=\"DOCUMENT\"]") === true
})
const requests_Added_Inline = await requestsOf_Document()
await pressedIn(opened_JavaScript.page.locator(".card_Document_htmlView .said_htmlView", { hasText: "Name the module's exports." }), ".start_Said_htmlView")
const requests_Started = await requestsOf_Document()
await opened_JavaScript.page.waitForFunction(() => ![...document.querySelectorAll(".card_Document_htmlView .progress_Said_htmlView")].some((element) => element.textContent === "running"))
const requests_Done = await requestsOf_Document()
await pressedIn(opened_JavaScript.page.locator(".card_Document_htmlView .said_htmlView:has(.remove_htmlView)").first(), ".remove_htmlView")
const requests_Removed = await requestsOf_Document()
await opened_JavaScript.page.keyboard.press("Escape")

test("a right-click on a proposal's selected words offers a revision of the proposal with them, the first request focused; chosen, a form, the words quoted, the keyboard in it; added, the host's told, which queues a revision of the proposal, the words listed with what you asked, and underlined, dotted, behind the text, where they're proposed, no longer selected, and lit there while its chip's pointed at; its line over the proposal's rings, cutting them, till the proposal's pointed at, its rings then over the line, cutting it; on the document's words, nothing selected, a request for a change to the document, Escape closing it, the menu key opening it again at the caret", () => {
  expect(menu_Words.choices.filter((choice) => choice?.includes(": Request")).slice(0, 2)).toEqual(["Proposal: Request revision, with selection", "Document: Request change, with selection"])
  expect(menu_Words.focused).toBe("Proposal: Request revision, with selection")
  expect(form_Words).toEqual({ label: "Proposal Stop retrying once the caller aborts", quote: "aborted", isFocused: true })
  expect(items_Aborted.length).toBeGreaterThan(0)
  expect(items_Aborted.every((item) => item.state === "REQUESTED" && item.asked.join("|") === "Check it before the delay too." && item.quoted.join("|") === "aborted")).toBe(true)
  expect(isSelected_Aborted).toBe(false)
  expect(requested_Aborted.length).toBeGreaterThan(0)
  expect(requested_Aborted.every((words) => words === "aborted")).toBe(true)
  expect(lit_Pointed.length).toBeGreaterThan(0)
  expect(lit_Pointed.every((lit) => lit === "proposed aborted true")).toBe(true)
  expect(lit_Left).toEqual([])
  expect(layers_Resting).toEqual({ layer: "RINGS", isRingsCut: true, isMarksCut: false })
  expect(layers_Pointed).toEqual({ layer: "POINTED", isRingsCut: true, isMarksCut: true })
  expect(menu_Document.choices.filter((choice) => choice?.includes(": Request"))).toEqual(["Document: Request change", "Task: Request change"])
  expect(menu_Document.focused).toBe("Document: Request change")
  expect(isClosed_Menu).toBe(true)
  expect(menu_Keyboard.choices.filter((choice) => choice?.includes(": Request"))).toEqual(["Document: Request change", "Task: Request change"])
  expect(menu_Keyboard.focused).toBe(menu_Document.focused)
  expect(asked_Menu).toEqual([
    { asked: "revise", proposal: "aborted", notes: "Check it before the delay too.", words: "aborted" },
    { requested: "Say why the delay doubles.", words: null }
  ])
  expect(opened_JavaScript.errors).toEqual([])
})

test("a request on no proposal, the document's own, queued and listed in the document's card, as a proposal's are under its item, its heading and its rule in the same plum; Add, at the foot of the document's requests, Revise gone, there being some, a form for the whole document there, under it, the card held open, the keyboard in it, Add and Cancel, no Start, the group having its own, the keyboard back on Add after; added, then started by its own Start, in progress, the rest still queued; addressed, still listed, saying by how many proposals, here none, nothing to remove; a queued one removed, gone", () => {
  expect(requests_Added).toEqual(["Say why the delay doubles."])
  expect(isAskFocused_Document).toBe(true)
  expect(form_Header).toEqual({ isInCard: true, isReviseGone: true, isCardShown: true, label: "Revise this document", actions: ["Add", "Cancel"], isFocused: true, isUnder: true })
  expect(requests_Added_Inline).toEqual(["Say why the delay doubles.", "Name the module's exports."])
  expect(label_Requests).toEqual(["Requests", true, "solid"])
  expect(requests_Started).toEqual(["Say why the delay doubles.", "Name the module's exports. (running)"])
  expect(requests_Done).toEqual(["Say why the delay doubles.", "Name the module's exports. (done (nothing to change))"])
  expect(requests_Removed).toEqual(["Name the module's exports. (done (nothing to change))"])
  expect(opened_JavaScript.errors).toEqual([])
})

// last, on the JavaScript example, the task's card: Add a request, a form
// for the task as a whole, in the card, at its foot, the card held open
// while it's there, the pointer gone; added, listed in the task's card, not
// the document's, the keyboard back on Add a request, the card still
// open; then, in the document's card, the host's own action, accepting the
// proposals waiting on nothing but you, taken at once; and the form opened
// again, left empty, put away by a click in the text
const partsOf_Card = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [".card_Task_htmlView", ".card_Document_htmlView"].map((selector) => [...document.querySelectorAll(`${selector} .notes_Said_htmlView`)].map((element) => element.textContent))
})
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView [data-ask=\"TASK\"]"))
await opened_JavaScript.page.mouse.move(700, 700)
const cardShown = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const card = document.querySelector(".card_Task_htmlView")
  const form = card?.querySelector(".asking_htmlView[data-place=\"TASK\"]") ?? null
  return {
    isCardShown: card === null ? false : getComputedStyle(card).visibility === "visible",
    label: form?.querySelector(".label_Asking_htmlView")?.textContent ?? null,
    isLast: form !== null && form.nextElementSibling === null,
    isFocused: document.activeElement?.matches(".card_Task_htmlView .asking_htmlView > .notes_htmlView") === true,
    isAskFocused: document.activeElement?.matches(".card_Task_htmlView [data-ask=\"TASK\"]") === true,
    buttons: [...form?.querySelectorAll(":is([data-request=\"ADD\"], [data-request=\"START\"])") ?? []].filter((element) => element instanceof HTMLButtonElement && getComputedStyle(element).display !== "none").map((element) => `${element.textContent?.trim()} ${element instanceof HTMLButtonElement && element.disabled ? "disabled" : "enabled"}`),
    forms_Elsewhere: document.querySelectorAll(".asking_htmlView:not([data-place=\"TASK\"])").length
  }
})
const form_Task = await cardShown()
await opened_JavaScript.page.keyboard.type("Keep the README in step.")
const form_Typed = await cardShown()
await opened_JavaScript.page.keyboard.press("Control+Enter")
const parts_Added = await partsOf_Card()
const card_Added = await cardShown()
const waiting_Before = await opened_JavaScript.page.evaluate(() => document.querySelectorAll(".item_htmlView[data-state=\"ACCEPTED\"]").length)
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView [data-task=\"accept-here\"]"))
const waiting_After = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    accepted: document.querySelectorAll(".item_htmlView[data-state=\"ACCEPTED\"]").length,
    offered: document.querySelectorAll(".card_Document_htmlView [data-task=\"accept-here\"]").length
  }
})
const logged_Card = (await opened_JavaScript.logged()).slice(-2)
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView [data-ask=\"TASK\"]"))
const form_Again = await cardShown()
const point_Text = await opened_JavaScript.page.evaluate(() => {
  const rect_Card = document.querySelector(".card_Task_htmlView")?.getBoundingClientRect()
  const rect_Text = [...document.querySelectorAll(".document_htmlView .text_htmlView")]
    .map((element) => element.getBoundingClientRect())
    .find((rect) => rect.width > 0 && rect.top > (rect_Card?.bottom ?? 0) && rect.bottom < innerHeight)
  return rect_Text === undefined ? null : { x: rect_Text.left + 8, y: rect_Text.top + rect_Text.height / 2 }
})
if (point_Text === null) throw new Error("no text below the card to click")
await opened_JavaScript.page.mouse.click(point_Text.x, point_Text.y)
await opened_JavaScript.page.mouse.move(700, 700)
await opened_JavaScript.page.waitForFunction(() => {
  const card = document.querySelector(".card_Task_htmlView")
  return card !== null && getComputedStyle(card).visibility === "hidden"
}, undefined, { timeout: 2000 })
const form_Left = await cardShown()

test("the task's card: Add a request, a form for the task as a whole, in the card, at its foot, the card held open while it's there; added, the keyboard back on Add a request, the card still open; opened again and left empty, put away by a click in the text; added, listed in the task's card, not the document's; the host's action for the document, in its card, the proposals waiting on nothing but you accepted at once, nothing left waiting to offer it for", () => {
  expect(form_Task).toEqual({ isCardShown: true, label: "Revise the task", isLast: true, isFocused: true, isAskFocused: false, buttons: ["Add disabled"], forms_Elsewhere: 0 })
  expect(card_Added).toEqual({ isCardShown: true, label: null, isLast: false, isFocused: false, isAskFocused: true, buttons: [], forms_Elsewhere: 0 })
  expect([form_Again.label, form_Again.isFocused]).toEqual(["Revise the task", true])
  expect(form_Typed.buttons).toEqual(["Add enabled"])
  expect(form_Left).toEqual({ isCardShown: false, label: null, isLast: false, isFocused: false, isAskFocused: false, buttons: [], forms_Elsewhere: 0 })
  expect(parts_Added[0]).toEqual(["Say in the README that onRetry is gone.", "Keep the README in step."])
  expect(parts_Added[1]).not.toContain("Keep the README in step.")
  expect(waiting_After.accepted).toBeGreaterThan(waiting_Before)
  expect(waiting_After.offered).toBe(0)
  expect(logged_Card).toEqual([{ requested: "Keep the README in step.", words: null }, { task: "accept-here" }])
  expect(opened_JavaScript.errors).toEqual([])
})

// then each scope's Start, on the JavaScript example: a request's Start and
// Remove faded till it's pointed at, its group's Start till the group is;
// the document's own requests started by their group's Start, beside their
// heading, its proposals' queued revision left; the task's own by theirs;
// and the task's Start all, everything queued in it, the proposal's too
const asked_Card = async (trigger: string, card: string, kind: string, notes: string) => {
  await opened_JavaScript.page.hover(trigger)
  await pressedAt(opened_JavaScript.page.locator(`${card} [data-ask="${kind}"]`))
  await opened_JavaScript.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await opened_JavaScript.page.keyboard.type(notes)
  await opened_JavaScript.page.keyboard.press("Control+Enter")
  await opened_JavaScript.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await opened_JavaScript.page.keyboard.press("Escape")
  await opened_JavaScript.page.mouse.move(700, 700)
}
const shownOf_Starts = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const unfoldedOf = (element: Element | null) => element === null ? null : getComputedStyle(element).position !== "absolute"
  const shownOf = (element: Element | null) => element === null ? null : getComputedStyle(element).opacity !== "0"
  const said = document.querySelector(".card_Document_htmlView .said_htmlView:has(.start_Said_htmlView)")
  const more = said?.querySelector(":scope > .row_Said_htmlView > .fold_Action_htmlView > .more_htmlView") ?? null
  return {
    group: unfoldedOf(document.querySelector(".card_Document_htmlView .actions_Request_htmlView:has(> .start_Request_htmlView)")),
    actions: shownOf(said?.querySelector(":scope > .row_Said_htmlView > .fold_Action_htmlView > .actions_Said_htmlView") ?? null),
    more: more === null ? null : getComputedStyle(more).visibility === "hidden" ? "hidden" : getComputedStyle(more).display
  }
})
const startedSince = async (count_Before: number) => (await opened_JavaScript.logged()).filter((entry) => "revising" in entry).slice(count_Before)
await asked_Card(".trigger_Document_htmlView", ".card_Document_htmlView", "DOCUMENT", "Say what it retries.")
await asked_Card(".trigger_Document_htmlView", ".card_Document_htmlView", "DOCUMENT", "Name its options.")
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const starts_Resting = await shownOf_Starts()
const pointedAt = async (selector: string) => {
  const box = await opened_JavaScript.page.locator(selector).first().boundingBox()
  if (box !== null) await opened_JavaScript.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
}
await opened_JavaScript.page.hover(".card_Document_htmlView .label_Request_htmlView")
const starts_Label = await shownOf_Starts()
await pointedAt(".card_Document_htmlView .head_Request_htmlView .more_htmlView")
const starts_Group = await shownOf_Starts()
await opened_JavaScript.page.hover(".card_Document_htmlView .said_htmlView:has(.start_Said_htmlView) .notes_Said_htmlView")
const starts_Words = await shownOf_Starts()
await pointedAt(".card_Document_htmlView .said_htmlView:has(.start_Said_htmlView) .more_htmlView")
const starts_Request = await shownOf_Starts()
const count_Logged = (await opened_JavaScript.logged()).filter((entry) => "revising" in entry).length
const scopes_Group = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".header_htmlView [data-scope]")].map((element) => `${element.getAttribute("data-scope")} ${element.getAttribute("data-work")}`))
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView .start_Request_htmlView"))
const started_Document = await startedSince(count_Logged)
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView .start_Request_htmlView"))
const started_Task = await startedSince(count_Logged)
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.mouse.move(700, 700)
await asked_Card(".trigger_Document_htmlView", ".card_Document_htmlView", "DOCUMENT", "Mind the jitter.")
await asked_Card(".trigger_Task_htmlView", ".card_Task_htmlView", "TASK", "Say so in the changelog.")
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView [data-scope=\"TASK\"][data-work=\"START\"]"))
const started_All = await startedSince(count_Logged)

test("each scope's Start: a request's own actions behind an ellipsis till the ellipsis is pointed at, not its words, the ellipsis becoming them, in its place, its group's behind theirs till theirs is, not its heading; the document's own requests started by their group's Start, its proposals' queued revision left; the task's own by theirs; the task's Start all starting everything queued in it, the proposal's too", () => {
  expect(starts_Resting).toEqual({ group: false, actions: false, more: "block" })
  expect(starts_Label).toEqual({ group: false, actions: false, more: "block" })
  expect(starts_Group).toEqual({ group: true, actions: false, more: "block" })
  expect(starts_Words).toEqual({ group: false, actions: false, more: "block" })
  expect(starts_Request).toEqual({ group: false, actions: true, more: "none" })
  expect(scopes_Group).toEqual(["TASK START", "TASK_REQUESTS START", "DOCUMENT START", "DOCUMENT_REQUESTS START"])
  expect(started_Document).toEqual([{ revising: "document", requests: 2 }])
  expect(started_Task).toEqual([{ revising: "document", requests: 2 }, { revising: "task", requests: 2 }])
  expect(started_All.slice(2)).toEqual([{ revising: "aborted, document, task", requests: 3 }])
  expect(opened_JavaScript.errors).toEqual([])
})

// then a request's Edit, on the JavaScript example: a queued one of the
// document's, its words its own box, the keyboard in it, Save and Cancel
// under it, Save disabled while the box is blank, enabled again once it
// isn't; saved, the host told, its words the new ones, the keyboard back
// on its Edit; opened again, Escape, nothing asked
await asked_Card(".trigger_Document_htmlView", ".card_Document_htmlView", "DOCUMENT", "Say it once.")
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const said_Once = opened_JavaScript.page.locator(".card_Document_htmlView .said_htmlView", { hasText: "Say it once." })
await pressedIn(said_Once, ".edit_Said_htmlView")
const editing_Shown = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const said = document.querySelector(".card_Document_htmlView .said_htmlView[data-editing]")
  return {
    box: said?.querySelector(".notes_Edit_htmlView") instanceof HTMLTextAreaElement ? (said.querySelector(".notes_Edit_htmlView") as HTMLTextAreaElement).value : null,
    isFocused: document.activeElement?.matches(".said_htmlView .notes_Edit_htmlView") === true,
    actions: [...said?.querySelectorAll(".actions_Edit_htmlView > button") ?? []].map((element) => element.textContent)
  }
})
const count_Edited = (await opened_JavaScript.logged()).length
const saveOf_Edit = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const element = document.querySelector(".card_Document_htmlView .actions_Edit_htmlView > [data-edit-action=\"SAVE\"]")
  return element instanceof HTMLButtonElement && element.disabled ? "disabled" : "enabled"
})
const save_Opened = await saveOf_Edit()
await opened_JavaScript.page.locator(".card_Document_htmlView .notes_Edit_htmlView").fill("   ")
const save_Blank = await saveOf_Edit()
await opened_JavaScript.page.locator(".card_Document_htmlView .notes_Edit_htmlView").fill("Say it twice.")
const save_Written = await saveOf_Edit()
await opened_JavaScript.page.locator(".card_Document_htmlView [data-edit-action=\"SAVE\"]").click()
const edited = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    words: [...document.querySelectorAll(".card_Document_htmlView .notes_Said_htmlView")].map((element) => element.textContent).filter((words) => words === "Say it once." || words === "Say it twice."),
    isEditFocused: document.activeElement?.matches(".card_Document_htmlView .said_htmlView .fold_Action_htmlView > .actions_Said_htmlView > .edit_Said_htmlView") === true
  }
})
const logged_Edit = (await opened_JavaScript.logged()).slice(count_Edited).filter((entry) => "edited" in entry)
await pressedIn(opened_JavaScript.page.locator(".card_Document_htmlView .said_htmlView", { hasText: "Say it twice." }), ".edit_Said_htmlView")
await opened_JavaScript.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
await opened_JavaScript.page.keyboard.press("Escape")
const cancelled_Edit = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return document.querySelectorAll(".notes_Edit_htmlView").length
})
const logged_Cancelled = (await opened_JavaScript.logged()).slice(count_Edited).filter((entry) => "edited" in entry).slice(logged_Edit.length)

test("a queued request's Edit: its words its own box, the keyboard in it, Save and Cancel; saved, the host told, the request saying the new words, the keyboard back on its Edit; Escape closing it, nothing asked", () => {
  expect(editing_Shown).toEqual({ box: "Say it once.", isFocused: true, actions: ["Save", "Cancel"] })
  expect([
    save_Opened,
    save_Blank,
    save_Written
  ]).toEqual([
    "enabled",
    "disabled",
    "enabled"
  ])
  expect(edited).toEqual({ words: ["Say it twice."], isEditFocused: true })
  expect(logged_Edit).toEqual([expect.objectContaining({ proposal: null, notes: "Say it twice." })])
  expect(cancelled_Edit).toBe(0)
  expect(logged_Cancelled).toEqual([])
  expect(opened_JavaScript.errors).toEqual([])
})

// then each scope's Stop, on the JavaScript example: a document's request
// started alone, Stop after it while it's in progress, pressed, back in the
// queue, its Start again; its group started, the group's Stop, by its
// heading, putting what's in progress back
const progressOf = (notes: string) => opened_JavaScript.page.evaluate(async (notes) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const said = [...document.querySelectorAll(".card_Document_htmlView .said_htmlView")].find((element) => element.querySelector(".notes_Said_htmlView")?.textContent === notes)
  return {
    progress: said?.querySelector(".progress_Said_htmlView")?.textContent ?? null,
    controls: [...said?.querySelectorAll(":scope > .row_Said_htmlView > .fold_Action_htmlView > .actions_Said_htmlView > button") ?? []].map((element) => element.textContent)
  }
}, notes)
await asked_Card(".trigger_Document_htmlView", ".card_Document_htmlView", "DOCUMENT", "Stop me.")
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const said_Stop = opened_JavaScript.page.locator(".card_Document_htmlView .said_htmlView", { hasText: "Stop me." })
await pressedIn(said_Stop, ".start_Said_htmlView")
const stop_Running = await progressOf("Stop me.")
const count_Stopping = (await opened_JavaScript.logged()).length
await pressedIn(said_Stop, ".stop_Said_htmlView")
const stop_Stopped = await progressOf("Stop me.")
await opened_JavaScript.page.mouse.move(700, 700)
await opened_JavaScript.page.waitForTimeout(450)
const card_Kept = await opened_JavaScript.page.evaluate(() => {
  const card = document.querySelector(".card_Document_htmlView")
  return card !== null && getComputedStyle(card).visibility === "visible"
})
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView .start_Request_htmlView"))
const head_Running = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Document_htmlView .actions_Request_htmlView > button")].map((element) => element.textContent)
})
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView .stop_Request_htmlView"))
const stop_Group = await progressOf("Stop me.")
const logged_Stops = (await opened_JavaScript.logged()).slice(count_Stopping).filter((entry) => "stopped" in entry)

test("each scope's Stop: a document's request in progress, Stop after it, pressed, back in the queue, its Start again, the card kept open though the pointer's gone, its button gone with what it did; its group's Stop, by its heading, while any of them is in progress, putting them back; each asked of the host by its scope", () => {
  expect(stop_Running).toEqual({ progress: "running", controls: ["Stop"] })
  expect(stop_Stopped).toEqual({ progress: null, controls: ["Edit", "Start", "Remove"] })
  expect(card_Kept).toBe(true)
  expect(head_Running).toEqual(["Stop", "Add"])
  expect(stop_Group).toEqual({ progress: null, controls: ["Edit", "Start", "Remove"] })
  expect(logged_Stops.map((entry) => entry["stopped"])).toEqual(["REQUEST", "DOCUMENT_REQUESTS"])
  expect(logged_Stops[0]).toEqual({ stopped: "REQUEST", requests: 1 })
  expect(Number(logged_Stops[1]?.["requests"])).toBeGreaterThan(0)
  expect(opened_JavaScript.errors).toEqual([])
})

// then an addressed request's Dismiss, on the JavaScript example: offered
// once it's addressed, where Remove is on a queued one, pressed, the host
// told, the request gone from the list
const addressedOf_Card = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Document_htmlView .said_htmlView")]
    .filter((element) => element.querySelector(".progress_Said_htmlView")?.firstChild?.textContent === "done")
    .map((element) => ({
      notes: element.querySelector(".notes_Said_htmlView")?.textContent ?? null,
      controls: [...element.querySelectorAll(":scope > .row_Said_htmlView > .fold_Action_htmlView > .actions_Said_htmlView > button")].map((button) => button.textContent)
    }))
})
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const addressed_Before = await addressedOf_Card()
const count_Dismissing = (await opened_JavaScript.logged()).length
const notes_Dismissed = addressed_Before[0]?.notes ?? ""
await pressedIn(opened_JavaScript.page.locator(".card_Document_htmlView .said_htmlView", { hasText: notes_Dismissed }), ".dismiss_Said_htmlView")
const addressed_After = await addressedOf_Card()
const logged_Dismissed = (await opened_JavaScript.logged()).slice(count_Dismissing).filter((entry) => "dismissed" in entry)

test("an addressed request's Dismiss, offered where Remove is on a queued one, its only control; pressed, the host told, the request gone from the list", () => {
  expect(addressed_Before.length).toBeGreaterThan(0)
  expect(addressed_Before.every((addressed) => addressed.controls.join() === "Dismiss")).toBe(true)
  expect(addressed_After.map((addressed) => addressed.notes)).not.toContain(notes_Dismissed)
  expect(addressed_After.length).toBe(addressed_Before.length - 1)
  expect(logged_Dismissed).toEqual([expect.objectContaining({ proposal: null })])
  expect(opened_JavaScript.errors).toEqual([])
})

// then the task's documents, each on its line, the figure by its name, its
// own Accept all on the right; another's pressed, the host told, that
// document's proposals all decided
const rowsOf_Task = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Task_htmlView .section_Card_htmlView[aria-label=\"Proposals\"] .list_Document_Card_htmlView > .document_Card_htmlView")].map((element) => ({
    name: element.querySelector(".name_Document_Card_htmlView")?.textContent ?? null,
    value: element.querySelector(".value_Document_Card_htmlView")?.textContent ?? null,
    actions: [...element.querySelectorAll(".actions_Document_Card_htmlView > button")].map((button) => button.textContent)
  }))
})
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
const rows_Before = await rowsOf_Task()
const count_Accepting = (await opened_JavaScript.logged()).length
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView .document_Card_htmlView", { hasText: "README.md" }).locator(".actions_Document_Card_htmlView > button"))
const rows_After = await rowsOf_Task()
const rows_Marked = await opened_JavaScript.page.evaluate(() => {
  const rows = [...document.querySelectorAll(".card_Task_htmlView .section_Card_htmlView[aria-label=\"Proposals\"] .list_Document_Card_htmlView > .document_Card_htmlView")]
  const active = rows.find((row) => row.getAttribute("aria-current") === "true")
  const other = rows.find((row) => row.getAttribute("aria-current") !== "true")
  return {
    isSetApart: active !== undefined && other !== undefined && getComputedStyle(active).backgroundColor !== getComputedStyle(other).backgroundColor,
    words: active?.textContent?.includes("this document") ?? null
  }
})
await pressedAt(opened_JavaScript.page.locator(".card_Task_htmlView .total_Document_Card_htmlView [data-task]"))
const head_Accepted = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Task_htmlView .total_Document_Card_htmlView [data-task]")].map((button) => button.textContent)
})
const logged_Accepting = (await opened_JavaScript.logged()).slice(count_Accepting).filter((entry) => "task" in entry)

test("the task's documents, each with its own Accept all on the right, for what's waiting there, the one this editor has open set apart by its row, not in words; another document's pressed, the host told, that document's proposals all decided, nothing more to accept there; the task's own Accept all, by its figure, accepting what's waiting everywhere, nothing left to offer it for", () => {
  expect(rows_Before.find((row) => row.name === "README.md")).toEqual({ name: "README.md", value: "2 of 6 decided", actions: ["Accept all (3)"] })
  expect(rows_Before.find((row) => row.name === "retry.js")?.actions.every((action) => action?.startsWith("Accept all ("))).toBe(true)
  expect(rows_After.find((row) => row.name === "README.md")).toEqual({ name: "README.md", value: "5 of 6 decided", actions: [] })
  expect(rows_Marked).toEqual({ isSetApart: true, words: false })
  expect(head_Accepted).toEqual([])
  expect(logged_Accepting).toEqual([{ task: "accept-in:README.md" }, { task: "accept-task" }])
  expect(opened_JavaScript.errors).toEqual([])
})

// then a group's actions after a click: a request added by the form's own
// Add, pressed with the pointer, the focus back on the group's Add, the
// pointer moved off the heading: the actions folded again, the focus a
// click left not holding them open, as the keyboard's would
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
await pressedAt(opened_JavaScript.page.locator(".card_Document_htmlView [data-ask=\"DOCUMENT\"]"))
await opened_JavaScript.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
await opened_JavaScript.page.keyboard.type("Fold me.")
await opened_JavaScript.page.locator(".card_Document_htmlView .asking_htmlView [data-request=\"ADD\"]").click()
const card_Clicked = await opened_JavaScript.page.locator(".card_Document_htmlView").boundingBox()
if (card_Clicked !== null) await opened_JavaScript.page.mouse.move(card_Clicked.x + card_Clicked.width / 2, card_Clicked.y + 12)
const folded_Clicked = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const actions = document.querySelector(".card_Document_htmlView .actions_Request_htmlView")
  return {
    isFocusedOnAdd: document.activeElement?.matches(".card_Document_htmlView .add_Request_htmlView") === true,
    isFolded: actions !== null && getComputedStyle(actions).position === "absolute"
  }
})

test("a group's actions after a click: the focus a click left on its Add not holding them open once the pointer's gone", () => {
  expect(folded_Clicked).toEqual({ isFocusedOnAdd: true, isFolded: true })
  expect(opened_JavaScript.errors).toEqual([])
})

// then where the document's card opens: hugging the editor's right edge,
// the header's, with no edge of its own there, and its top on the
// header's bottom edge, level with the task's card's
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.mouse.move(700, 700)
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const hugged_Card = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const header = document.querySelector(".header_htmlView")
  const card = document.querySelector(".card_Document_htmlView")
  const card_Task = document.querySelector(".card_Task_htmlView")
  if (header === null || card === null || card_Task === null) return null
  return {
    gap_Right: header.getBoundingClientRect().right - card.getBoundingClientRect().right,
    gap_Top: header.getBoundingClientRect().bottom - parseFloat(getComputedStyle(header).borderBottomWidth) - card.getBoundingClientRect().top,
    edge_Right: getComputedStyle(card).borderRightWidth,
    isLevel: card.getBoundingClientRect().top === card_Task.getBoundingClientRect().top
  }
})

test("the document's card hugs the editor's right edge, no edge of its own there, its top on the header's edge, level with the task's", () => {
  expect(hugged_Card).toEqual({ gap_Right: 0, gap_Top: 0, edge_Right: "0px", isLevel: true })
  expect(opened_JavaScript.errors).toEqual([])
})

// then a card's Revise or Add pressed again while its form's open, with
// something written in it: the form put away, as its Cancel would, what's
// written dropped, nothing asked, the keyboard back on it, the card open
await opened_JavaScript.page.hover(".trigger_Document_htmlView")
const ask_Document = opened_JavaScript.page.locator(".card_Document_htmlView [data-ask=\"DOCUMENT\"]").first()
await pressedAt(ask_Document)
await opened_JavaScript.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
await opened_JavaScript.page.keyboard.type("Drop me.")
const form_Before = await opened_JavaScript.page.evaluate(() => document.querySelectorAll(".card_Document_htmlView .asking_htmlView").length)
await pressedAt(ask_Document)
await opened_JavaScript.page.waitForTimeout(250)
const toggled_Card = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const card = document.querySelector(".card_Document_htmlView")
  return {
    forms: card?.querySelectorAll(".asking_htmlView").length ?? null,
    isAskFocused: document.activeElement?.matches(".card_Document_htmlView [data-ask=\"DOCUMENT\"]") === true,
    isCardShown: card !== null && getComputedStyle(card).visibility === "visible",
    isAdded: [...document.querySelectorAll(".notes_Said_htmlView")].some((element) => element.textContent === "Drop me.")
  }
})

test("a card's Revise or Add pressed again while its form's open puts it away, as its Cancel would, what's written and all, the keyboard back on it", () => {
  expect(form_Before).toBe(1)
  expect(toggled_Card).toEqual({ forms: 0, isAskFocused: true, isCardShown: true, isAdded: false })
  expect(opened_JavaScript.errors).toEqual([])
})

// then a fold opened where it is: its actions in its ellipsis's place,
// nothing on any line, or under it, moving as they open, a request's, its
// group's heading, a card's line, or a document's row
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.mouse.move(700, 700)
const linesOf_Card = (card: string) => opened_JavaScript.page.evaluate(async (card) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(`${card} :is(.head_Request_htmlView, .said_htmlView, .line_Card_htmlView, .document_Card_htmlView)`)].map((element) => `${Math.round(element.getBoundingClientRect().top * 100) / 100}/${Math.round(element.getBoundingClientRect().height * 100) / 100}`)
}, card)
const moved: Array<string> = []
for (const card of [".card_Document_htmlView", ".card_Task_htmlView"]) {
  const trigger = card === ".card_Task_htmlView" ? ".trigger_Task_htmlView" : ".trigger_Document_htmlView"
  const count = await opened_JavaScript.page.locator(`${card} .fold_Action_htmlView > .more_htmlView`).count()
  for (let index = 0; index < count; index++) {
    await opened_JavaScript.page.mouse.move(700, 700)
    await opened_JavaScript.page.hover(trigger)
    const before = await linesOf_Card(card)
    const box = await opened_JavaScript.page.locator(`${card} .fold_Action_htmlView > .more_htmlView`).nth(index).boundingBox()
    if (box === null) continue
    await opened_JavaScript.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const after = await linesOf_Card(card)
    if (after.join() !== before.join()) moved.push(`${card} ${index}: ${before.join(" ")} → ${after.join(" ")}`)
  }
}
const count_Folds = await opened_JavaScript.page.evaluate(() => document.querySelectorAll(".header_htmlView .fold_Action_htmlView").length)

test("a fold opened where it is: nothing on any line, or under it, moving as its actions open, a request's, its group's heading, a card's line or a document's row", () => {
  expect(count_Folds).toBeGreaterThan(3)
  expect(moved).toEqual([])
  expect(opened_JavaScript.errors).toEqual([])
})

// then an item's arrow pressed, the pointer on it, as you would: the
// document scrolled, in its own scroller, the page not, so the arrow the
// same way on the item it goes to is under the pointer, even where that
// place is near the document's end, room made past its last line letting
// it scroll so far
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.mouse.move(700, 700)
// the document's scroll come to rest: no change in a quarter of a second
const stilled = () => opened_JavaScript.page.evaluate(async () => {
  const scroller = document.querySelector(".document_htmlView")
  let top = -1
  while (scroller !== null && scroller.scrollTop !== top) {
    top = scroller.scrollTop
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
})
const landings: Array<number> = []
let scroll_Furthest = 0
const count_Arrows = Math.min(3, await opened_JavaScript.page.locator(".neighbor_htmlView[data-way=\"NEXT\"]:not(:disabled)").count())
for (let index = 0; index < count_Arrows; index++) {
  const arrow = opened_JavaScript.page.locator(".neighbor_htmlView[data-way=\"NEXT\"]:not(:disabled)").nth(index)
  await arrow.scrollIntoViewIfNeeded()
  await stilled()
  const box = await arrow.boundingBox()
  if (box === null) continue
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await opened_JavaScript.page.mouse.move(point.x, point.y)
  await opened_JavaScript.page.mouse.down()
  await opened_JavaScript.page.mouse.up()
  await stilled()
  landings.push(await opened_JavaScript.page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest(".neighbor_htmlView")?.getAttribute("data-way") === "NEXT" ? 1 : 0, point))
  scroll_Furthest = Math.max(scroll_Furthest, await opened_JavaScript.page.evaluate(() => document.querySelector(".document_htmlView")?.scrollTop ?? 0))
}
const room = await opened_JavaScript.page.evaluate(() => {
  const scroller = document.querySelector(".document_htmlView")
  if (scroller === null) return null
  return { scroll_Past: scroller.scrollHeight - scroller.clientHeight - parseFloat(getComputedStyle(scroller, "::before").height) - parseFloat(getComputedStyle(scroller, "::after").height), scrollY }
})

test("an item's arrow pressed, the pointer on it: the arrow the same way on the item it goes to under the pointer, even near the document's end, room made past its last line letting it scroll so far; the page not scrolling", () => {
  expect(count_Arrows).toBeGreaterThan(1)
  expect(landings).toEqual(Array.from({ length: count_Arrows }, () => 1))
  expect(scroll_Furthest).toBeGreaterThan(room?.scroll_Past ?? Infinity)
  expect(room?.scrollY).toBe(0)
  expect(opened_JavaScript.errors).toEqual([])
})

// then a move's note pressed, the pointer on it: the note at its other
// end, pointing back, at the height the one pressed was, its line under
// the pointer, as an item's arrows put theirs, the room past the last line
// letting the first note's reach the end
await opened_JavaScript.page.mouse.move(700, 700)
const jumps: Array<string> = []
for (const label of ["from lines 41–50", "from line 38"]) {
  const note = opened_JavaScript.page.locator(`.note_htmlView[aria-label="${label}"]`).first()
  if (await note.count() === 0) continue
  await note.scrollIntoViewIfNeeded()
  await stilled()
  const box = await note.boundingBox()
  if (box === null) continue
  const [source, side] = await note.evaluate((element) => [element.getAttribute("data-target-source"), element.getAttribute("data-target-side")])
  await opened_JavaScript.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await opened_JavaScript.page.mouse.down()
  await opened_JavaScript.page.mouse.up()
  await stilled()
  const top_Arrived = await opened_JavaScript.page.evaluate(({ source, side }) => document.querySelector(`.note_htmlView[data-target-source="${source}"]:not([data-target-side="${side}"])`)?.getBoundingClientRect().top ?? null, { source, side })
  jumps.push(`${label}: ${top_Arrived !== null && Math.abs(top_Arrived - box.y) < 1 ? "at its height" : `${top_Arrived} for ${box.y}`}`)
}

test("a move's note pressed, the pointer on it: the note at its other end at the height the one pressed was, its line under the pointer, even where that end's near the document's end", () => {
  expect(jumps).toEqual(["from lines 41–50: at its height", "from line 38: at its height"])
  expect(opened_JavaScript.errors).toEqual([])
})

// then the room a jump makes, above the first line or past the last, only
// as much as is shown, never scrolled into: wheeled to the top and to the
// end, none; a move's note pressed near the document's end, its other end
// near the top, room made above the first line, its note under the
// pointer; wheeled down half as far as the room, the room shrinking as the
// document moves, the top still the top; wheeled up, nothing moving; the
// other note pressed, room made past the last line; wheeled up half as
// far, it shrinking; wheeled down, nothing moving
const roomOf = () => opened_JavaScript.page.evaluate(() => {
  const scroller = document.querySelector(".document_htmlView")
  const note = document.querySelector(".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"before\"]")
  if (scroller === null || note === null) return null
  return {
    scrollTop: scroller.scrollTop,
    fromEnd: scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop,
    above: parseFloat(getComputedStyle(scroller, "::before").height),
    below: parseFloat(getComputedStyle(scroller, "::after").height),
    note: note.getBoundingClientRect().top
  }
})
const pressedOf_Note = async (selector: string) => {
  const note = opened_JavaScript.page.locator(selector).first()
  await note.scrollIntoViewIfNeeded()
  await stilled()
  const box = await note.boundingBox()
  if (box === null) return null
  await opened_JavaScript.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await opened_JavaScript.page.mouse.down()
  await opened_JavaScript.page.mouse.up()
  await stilled()
  return box.y
}
const wheeled = async (delta: number) => {
  await opened_JavaScript.page.mouse.wheel(0, delta)
  await stilled()
  return await roomOf()
}
await opened_JavaScript.page.mouse.move(700, 500)
for (let index = 0; index < 6; index++) await opened_JavaScript.page.mouse.wheel(0, -3000)
await stilled()
for (let index = 0; index < 6; index++) await opened_JavaScript.page.mouse.wheel(0, 3000)
await stilled()
const room_Rest = await roomOf()
const top_Pressed_Up = await pressedOf_Note(".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"after\"]")
const room_Up = await roomOf()
const room_Up_Down = await wheeled(Math.max(
  1,
  Math.floor((room_Up?.above ?? 0) / 2)
))
const room_Up_Up = await wheeled(-400)
const top_Pressed_Down = await pressedOf_Note(".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"before\"]")
const room_Down = await roomOf()
const room_Down_Up = await wheeled(-Math.max(
  1,
  Math.floor((room_Down?.below ?? 0) / 2)
))
const room_Down_Down = await wheeled(400)

test("the room a jump makes, above the first line or past the last, is only as much as is shown, never scrolled into: none at rest; made for a jump up, its note under the pointer, shrinking as the document's scrolled down, nothing moving scrolled up; made for a jump down, shrinking scrolled up, nothing moving scrolled down", () => {
  expect(room_Rest).toMatchObject({ above: 0, below: 0 })
  expect(Math.abs(room_Rest?.fromEnd ?? -1)).toBeLessThan(1)
  expect(room_Up?.above).toBeGreaterThan(0)
  expect(room_Up?.scrollTop).toBe(0)
  expect(Math.abs((room_Up?.note ?? 0) - (top_Pressed_Up ?? -100))).toBeLessThan(1)
  expect(room_Up_Down?.above).toBeLessThan(room_Up?.above ?? 0)
  expect(room_Up_Down?.scrollTop).toBe(0)
  expect(Math.abs((room_Up?.note ?? 0) - (room_Up_Down?.note ?? 0) - ((room_Up?.above ?? 0) - (room_Up_Down?.above ?? 0)))).toBeLessThan(1)
  expect(room_Up_Up).toEqual(room_Up_Down)
  expect(top_Pressed_Down).not.toBeNull()
  expect(room_Down?.below).toBeGreaterThan(0)
  expect(Math.abs(room_Down?.fromEnd ?? -1)).toBeLessThan(1)
  expect(room_Down_Up?.below).toBeLessThan(room_Down?.below ?? 0)
  expect(Math.abs(room_Down_Up?.fromEnd ?? -1)).toBeLessThan(1)
  expect(room_Down_Down).toEqual(room_Down_Up)
  expect(opened_JavaScript.errors).toEqual([])
})

// then a move's note pressed where its other end's in a folded frame: the
// frame folded by its control, its own note gone with its rings; the note
// at the move's other end pressed, the frame unfolded as the jump goes
// there, the note there arrived at at the height the one pressed was, the
// keyboard on it, the frame left unfolded
const frame_Sleep = opened_JavaScript.page.locator(".frame_htmlView[aria-label=\"before line 6\"]")
await frame_Sleep.scrollIntoViewIfNeeded()
await frame_Sleep.hover()
await frame_Sleep.locator(":scope > .fold_htmlView").click()
await opened_JavaScript.page.mouse.move(5, 5)
await stilled()
const foldedOf_Notes = () => opened_JavaScript.page.evaluate(() => ({
  folded: [...document.querySelectorAll(".fold_htmlView[aria-expanded=\"false\"]")].map((element) => element.getAttribute("aria-label")),
  notes: [...document.querySelectorAll(".note_htmlView")].map((element) => element.getAttribute("aria-label"))
}))
const folded_Sleep = await foldedOf_Notes()
const note_Moved_Sleep = opened_JavaScript.page.locator(".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"after\"]")
await note_Moved_Sleep.scrollIntoViewIfNeeded()
await stilled()
const box_Moved = await note_Moved_Sleep.boundingBox()
if (box_Moved !== null) {
  await opened_JavaScript.page.mouse.move(box_Moved.x + box_Moved.width / 2, box_Moved.y + box_Moved.height / 2)
  await opened_JavaScript.page.mouse.down()
  await opened_JavaScript.page.mouse.up()
}
await stilled()
const unfolded_Sleep = await foldedOf_Notes()
const arrived_Sleep = await opened_JavaScript.page.evaluate(() => {
  const note = document.querySelector(".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"before\"]")
  return {
    top: note?.getBoundingClientRect().top ?? null,
    isFocused: note !== null && document.activeElement === note
  }
})

test("a move's note pressed where its other end's in a folded frame unfolds that frame as it goes there, landing on the note there at the height the one pressed was, the keyboard on it; folded, that frame's note had gone with its rings", () => {
  expect(folded_Sleep).toEqual({ folded: ["Unfold before line 6"], notes: ["moved", "from line 38", "moved"] })
  expect(unfolded_Sleep).toEqual({ folded: [], notes: ["from lines 41–50", "moved", "from line 38", "moved"] })
  expect(arrived_Sleep.isFocused).toBe(true)
  expect(Math.abs((arrived_Sleep.top ?? Number.NaN) - (box_Moved?.y ?? Number.NaN))).toBeLessThan(1)
  expect(opened_JavaScript.errors).toEqual([])
})

// then the same jumps on a display of twice the density, as a laptop's,
// scroll positions rounded to its pixels, where the browser ends the
// instant first step of a jump up, keeping what's shown still as room's
// made above, on its own, a moment into the jump: a move's note pressed up,
// then its other end's down, then up again, each landing its other end at
// the height the one pressed was, none stopped by that first step's end
const opened_Dense = await openExample(
  "javascript",
  2
)
afterAll(() => opened_Dense.close())
await opened_Dense.page.waitForSelector(".note_htmlView")
const stilled_Dense = () => opened_Dense.page.evaluate(async () => {
  const scroller = document.querySelector(".document_htmlView")
  let top = -1
  while (scroller !== null && scroller.scrollTop !== top) {
    top = scroller.scrollTop
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
})
const note_Moved = ".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"after\"]"
const note_From = ".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"before\"]"
const landedOf_Dense = async (pressed: string, counterpart: string) => {
  const box = await opened_Dense.page.locator(pressed).first().boundingBox()
  if (box === null) return "not drawn"
  await opened_Dense.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await opened_Dense.page.mouse.down()
  await opened_Dense.page.mouse.up()
  await stilled_Dense()
  const top = await opened_Dense.page.evaluate((counterpart) => document.querySelector(counterpart)?.getBoundingClientRect().top ?? null, counterpart)
  return top !== null && Math.abs(top - box.y) < 1 ? "at its height" : `at ${top} for ${box.y}`
}
await opened_Dense.page.locator(note_Moved).scrollIntoViewIfNeeded()
await stilled_Dense()
const jumps_Dense = [
  await landedOf_Dense(note_Moved, note_From),
  await landedOf_Dense(note_From, note_Moved),
  await landedOf_Dense(note_Moved, note_From)
]

test("on a display of twice the density, a move's note pressed up, then down, then up again: each landing its other end at the height the one pressed was", () => {
  expect(jumps_Dense).toEqual(["at its height", "at its height", "at its height"])
  expect(opened_Dense.errors).toEqual([])
})

// then the keyboard after a move's note's jump: on the note at its other
// end, under the pointer, as an item's arrows leave it on theirs, so Enter
// or Space jumps back from there; the document scrolled till that note's
// out of view, the keyboard on the document, so Space scrolls it on, not
// pressing a note that can't be seen, which had jumped back to where it
// goes from wherever the document had been scrolled to
await opened_Dense.page.locator(note_Moved).scrollIntoViewIfNeeded()
await stilled_Dense()
const pressed_Keyed = await landedOf_Dense(note_Moved, note_From)
const focused_Keyed = await opened_Dense.page.evaluate(() => document.activeElement?.matches(".note_htmlView[data-target-source=\"sleep\"][data-target-side=\"before\"]") === true)
await opened_Dense.page.mouse.move(700, 450)
await opened_Dense.page.mouse.wheel(0, 600)
await stilled_Dense()
const scrolled_Keyed = await opened_Dense.page.evaluate(() => ({ focus: document.activeElement?.className ?? null, top: document.querySelector(".document_htmlView")?.scrollTop ?? 0 }))
await opened_Dense.page.keyboard.press("Space")
await stilled_Dense()
const spaced_Keyed = await opened_Dense.page.evaluate(() => document.querySelector(".document_htmlView")?.scrollTop ?? 0)

test("the keyboard after a move's note's jump: on the note at its other end; that note scrolled out of view, on the document, so Space scrolls it on, not jumping back", () => {
  expect(pressed_Keyed).toBe("at its height")
  expect(focused_Keyed).toBe(true)
  expect(scrolled_Keyed.focus).toBe("document_htmlView")
  expect(spaced_Keyed).toBeGreaterThan(scrolled_Keyed.top)
  expect(opened_Dense.errors).toEqual([])
})

// then a frame's head, above its list: "Proposals", its lines, how far its
// proposals have got; Accept all for its open proposals, behind an
// ellipsis; while anything's queued or in progress for them,
// how many, Start all and Stop all behind another. Start all, pressed as
// you would, starting the requests queued for the proposals it lists;
// Accept all accepting its open proposals, the host asked for each
await opened_Dense.page.mouse.move(700, 700)
const heads_Dense = await opened_Dense.page.evaluate(() => [...document.querySelectorAll(".head_Proposals_htmlView")].map((head) => `${head.querySelector(".range_Head_htmlView")?.textContent} ${head.querySelector(".value_Head_htmlView")?.textContent} ${head.querySelector("[data-accept-all]")?.textContent ?? ""}${head.querySelector("[data-scope=\"FRAME\"]") === null ? "" : ` | ${head.querySelector(".value_Scope_htmlView")?.textContent}`}`))
const pressedIn_Dense = async (head: ReturnType<typeof opened_Dense.page.locator>, fold: string, control: string) => {
  await head.scrollIntoViewIfNeeded()
  await stilled_Dense()
  const box = await head.locator(`${fold} .more_htmlView`).first().boundingBox()
  if (box !== null) await opened_Dense.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await head.locator(control).first().click()
  await opened_Dense.page.waitForTimeout(300)
}
const logged_Before_Frame = (await opened_Dense.logged()).length
await pressedIn_Dense(opened_Dense.page.locator(".head_Proposals_htmlView", { has: opened_Dense.page.locator("[data-scope=\"FRAME\"][data-work=\"START\"]") }), ".scope_Head_htmlView", "[data-scope=\"FRAME\"][data-work=\"START\"]")
const started_Frame = (await opened_Dense.logged()).slice(logged_Before_Frame).filter((entry) => "revising" in entry)
const head_First = opened_Dense.page.locator(".head_Proposals_htmlView").first()
const opens_First = await head_First.evaluate((head) => [...(head.closest(".frame_htmlView")?.querySelectorAll(".item_htmlView[data-state=\"OPEN\"]") ?? [])].map((item) => item.getAttribute("data-source")))
const logged_Before_Accept = (await opened_Dense.logged()).length
await pressedIn_Dense(head_First, ":scope > .fold_Action_htmlView", "[data-accept-all]")
const accepted_Frame = (await opened_Dense.logged()).slice(logged_Before_Accept).filter((entry) => "asked" in entry)
const states_First = await head_First.evaluate((head) => [...(head.closest(".frame_htmlView")?.querySelectorAll(".item_htmlView") ?? [])].map((item) => item.getAttribute("data-state")))

test("a frame's head says its lines and how far its proposals have got; its Start all starts what's queued for the proposals it lists; its Accept all accepts its open proposals, the host asked for each", () => {
  expect(heads_Dense).toEqual([
    "lines 1–2 0 of 1 decided Accept all (1)",
    "before line 6 0 of 2 decided Accept all (2)",
    "line 10 0 of 2 decided Accept all (2)",
    "lines 13–27 1 of 6 decided Accept all (5)",
    "lines 31–34 1 of 3 decided Accept all (1) | 2 queued",
    "lines 36–40 2 of 3 decided  | 1 queued · 1 running",
    "lines 41–50 0 of 2 decided Accept all (2)"
  ])
  expect(started_Frame).toEqual([{ revising: "cap", requests: 2 }])
  expect(accepted_Frame).toEqual(opens_First.map((source) => ({ asked: "accept", proposal: source, notes: null, words: null })))
  expect(states_First).toEqual(["ACCEPTED"])
  expect(opened_Dense.errors).toEqual([])
})

// the menu's tiers, on a page of their own: "aborted" selected in a
// proposal's change and right-clicked, the words' tier, the proposal's,
// the document's and the task's, the narrowest first, a hairline between
// each; the document's request chosen, the words go with it for
// reference, "with" them in the form, and with them in the document's
// card once added; the proposal's chosen, the words left out with ×, the
// keyboard back in the box, and it's asked of the host with none
const opened_Tiers = await openExample(
  "javascript",
  1
)
afterAll(() => opened_Tiers.close())
await opened_Tiers.page.waitForSelector(".note_htmlView")
const rightClickedOn_Tiers = async (needle: string, word: string) => {
  const rect = await opened_Tiers.page.evaluate(({ needle, word }) => {
    const element_Line = [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes(needle))
    if (!(element_Line instanceof HTMLElement)) throw new Error(`no line with ${needle}`)
    element_Line.scrollIntoView({ block: "center" })
    const walker = document.createTreeWalker(element_Line, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
      const index = node.data.indexOf(word)
      if (index === -1) continue
      const range = document.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + word.length)
      const box = range.getBoundingClientRect()
      return { left: box.left, right: box.right, y: box.top + box.height / 2 }
    }
    throw new Error(`no ${word}`)
  }, { needle, word })
  await opened_Tiers.page.mouse.move(rect.left + 1, rect.y)
  await opened_Tiers.page.mouse.down()
  await opened_Tiers.page.mouse.move(rect.right - 1, rect.y, { steps: 5 })
  await opened_Tiers.page.mouse.up()
  await opened_Tiers.page.mouse.click(rect.left + 4, rect.y, { button: "right" })
  return opened_Tiers.page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return [...document.querySelectorAll(".menu_htmlView > *")].map((element) => element.matches(".divider_Menu_htmlView") ? "—" : `${element.getAttribute("data-tier")} ${element.textContent}`)
  })
}
const formShown_Tiers = () => opened_Tiers.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const quote = document.querySelector(".asking_htmlView > .quote_Asking_htmlView")
  return {
    label: document.querySelector(".asking_htmlView > .label_Asking_htmlView")?.textContent ?? null,
    subject: document.querySelector(".asking_htmlView > .label_Asking_htmlView > .subject_Asking_htmlView")?.textContent ?? null,
    quote: quote === null ? null : [quote.querySelector(".words_Quote_htmlView")?.textContent ?? null, quote.querySelector(".drop_Quote_htmlView") !== null],
    isFocused: document.activeElement?.matches(".asking_htmlView > .notes_htmlView") === true
  }
})
const menu_Tiers = await rightClickedOn_Tiers("signal?.aborted) break", "aborted")
const sections_Tiers = await opened_Tiers.page.evaluate(() => [...document.querySelectorAll(".menu_htmlView > .choice_htmlView")].map((element) => `${element.getAttribute("data-tier")} ${element.getAttribute("data-section")}`))
const focused_Tiers = await opened_Tiers.page.evaluate(() => document.activeElement?.textContent ?? null)
await opened_Tiers.page.locator(".menu_htmlView > .choice_htmlView[data-tier=\"DOCUMENT\"]", { hasText: "Request change" }).click()
const form_Referring = await formShown_Tiers()
await opened_Tiers.page.keyboard.type("Check for an abort everywhere it waits.")
await opened_Tiers.page.keyboard.press("Control+Enter")
const referred_Document = await opened_Tiers.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Document_htmlView .said_htmlView")].map((element) => [element.querySelector(".notes_Said_htmlView")?.textContent ?? null, element.querySelector(".reference_Said_htmlView .words_Quote_htmlView")?.textContent ?? null, element.querySelector(".reference_Said_htmlView .show_Said_htmlView")?.textContent ?? null])
})
await opened_Tiers.page.evaluate(() => {
  const element_Scroller = document.querySelector(".document_htmlView")
  if (element_Scroller instanceof HTMLElement) element_Scroller.scrollTop = 0
})
await opened_Tiers.page.hover(".trigger_Document_htmlView")
await opened_Tiers.page.locator(".card_Document_htmlView .said_htmlView", { hasText: "Check for an abort everywhere it waits." }).locator(".show_Said_htmlView").click()
await opened_Tiers.page.waitForTimeout(900)
const shown_Document = await opened_Tiers.page.evaluate(() => {
  const rect_Scroller = document.querySelector(".document_htmlView")?.getBoundingClientRect()
  const element$_Shown = [...document.querySelectorAll(".text_htmlView > [data-shown]")]
  return {
    words: [...new Set(element$_Shown.map((element) => element.textContent))],
    isInView: rect_Scroller !== undefined && element$_Shown.length > 0 && element$_Shown.every((element) => {
      const rect = element.getBoundingClientRect()
      return rect.top >= rect_Scroller.top && rect.bottom <= rect_Scroller.bottom
    }),
    isOnText: document.activeElement?.matches(".input_htmlView") === true
  }
})
await opened_Tiers.page.waitForFunction(() => document.querySelector(".text_htmlView > [data-shown]") === null)
await opened_Tiers.page.mouse.move(5, 5)
await opened_Tiers.page.waitForFunction(() => getComputedStyle(document.querySelector(".card_Document_htmlView") ?? document.body).visibility === "hidden")
await rightClickedOn_Tiers("signal?.aborted) break", "aborted")
await opened_Tiers.page.locator(".menu_htmlView > .choice_htmlView[data-tier=\"PROPOSAL\"]", { hasText: "Request revision" }).click()
await opened_Tiers.page.locator(".asking_htmlView .drop_Quote_htmlView").click()
const form_Dropped = await formShown_Tiers()
await opened_Tiers.page.keyboard.type("Say why it stops there.")
await opened_Tiers.page.keyboard.press("Control+Enter")
const asked_Tiers = (await opened_Tiers.logged()).filter((entry) => "requested" in entry || "asked" in entry)
await opened_Tiers.page.waitForSelector(".asking_htmlView", { state: "detached" })
const rect_Editor_Tiers = await opened_Tiers.page.evaluate(() => {
  const rect = document.querySelector(".htmlView_editor")?.getBoundingClientRect()
  if (rect === undefined) throw new Error("no editor")
  return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
})
await opened_Tiers.page.mouse.click(rect_Editor_Tiers.right - 40, rect_Editor_Tiers.bottom - 40, { button: "right" })
const placed_Tiers = await opened_Tiers.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const rect_Editor = document.querySelector(".htmlView_editor")?.getBoundingClientRect()
  const rect_Menu = document.querySelector(".menu_htmlView")?.getBoundingClientRect()
  const rect$_Divider = [...document.querySelectorAll(".menu_htmlView > .divider_Menu_htmlView")].map((element) => element.getBoundingClientRect())
  if (rect_Editor === undefined || rect_Menu === undefined) return null
  return {
    isInEditor: rect_Menu.left >= rect_Editor.left && rect_Menu.right <= rect_Editor.right && rect_Menu.top >= rect_Editor.top && rect_Menu.bottom <= rect_Editor.bottom,
    isAbove: rect_Menu.bottom <= rect_Editor.bottom - 40 + 1,
    isLeft: rect_Menu.right <= rect_Editor.right - 4 + 0.5,
    isDividerInset: rect$_Divider.length > 0 && rect$_Divider.every((rect) => rect.left >= rect_Menu.left + 8 && rect.right <= rect_Menu.right - 8)
  }
})
const isLitAt_Focused_Tiers = () => opened_Tiers.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const element = document.activeElement
  return element instanceof HTMLElement && element.matches(".choice_htmlView") ? getComputedStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)" : null
})
const isLit_Pointer_Tiers = await isLitAt_Focused_Tiers()
await opened_Tiers.page.keyboard.press("Escape")
await opened_Tiers.page.keyboard.press("Shift+F10")
const isLit_Keyboard_Tiers = await isLitAt_Focused_Tiers()
await opened_Tiers.page.keyboard.press("Escape")
await opened_Tiers.page.mouse.click(rect_Editor_Tiers.right - 40, rect_Editor_Tiers.bottom - 40, { button: "right" })
const scrolledWith_Menu = async (x: number, y: number) => {
  await opened_Tiers.page.mouse.move(x, y)
  const top_Before = await opened_Tiers.page.evaluate(() => document.querySelector(".document_htmlView")?.scrollTop ?? 0)
  await opened_Tiers.page.mouse.wheel(0, -240)
  return opened_Tiers.page.evaluate(async (top_Before) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return { isOpen: document.querySelector(".menu_htmlView") !== null, isScrolled: (document.querySelector(".document_htmlView")?.scrollTop ?? 0) !== top_Before }
  }, top_Before)
}
const rect_Menu_Scrolled = await opened_Tiers.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const rect = document.querySelector(".menu_htmlView")?.getBoundingClientRect()
  if (rect === undefined) throw new Error("no menu")
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
})
const wheeled_OverMenu = await scrolledWith_Menu(rect_Menu_Scrolled.x, rect_Menu_Scrolled.y)
const rect_Document_Tiers = await opened_Tiers.page.evaluate(() => {
  const rect = document.querySelector(".document_htmlView")?.getBoundingClientRect()
  if (rect === undefined) throw new Error("no document")
  return { x: rect.left + 120, y: rect.top + 120 }
})
const wheeled_OverDocument = await scrolledWith_Menu(rect_Document_Tiers.x, rect_Document_Tiers.y)
const isFocused_Input_Scrolled = await opened_Tiers.page.evaluate(() => document.activeElement?.matches(".input_htmlView") === true)

describe("the menu's tiers", () => {
  test("a right-click on a proposal's selected words offers the proposal's, the document's and the task's tiers, the narrowest first, a hairline between each, each its proposal actions first, then its revisions', the keyboard on the first request; each request has the words with it, which the form quotes, and × leaves out; sent, the host's told what it's on and the words, and the document's card lists it with them, and where they are, which, pressed, scrolls the document to them, lit a moment, the keyboard back on the text", () => {
    expect(menu_Tiers.map((choice) => choice === "—" ? choice : choice.slice(0, choice.indexOf(" "))).filter((tier, index, tiers) => tier !== tiers[index - 1])).toEqual(["PROPOSAL", "—", "DOCUMENT", "—", "TASK"])
    expect(menu_Tiers.filter((choice) => choice !== "—").every((choice) => /^(PROPOSAL Proposal|DOCUMENT Document|TASK Task): /.test(choice))).toBe(true)
    expect(sections_Tiers.filter((section, index, sections) => section !== sections[index - 1])).toEqual(["PROPOSAL PROPOSALS", "PROPOSAL REVISIONS", "DOCUMENT PROPOSALS", "DOCUMENT REVISIONS", "TASK PROPOSALS", "TASK REVISIONS"])
    expect(focused_Tiers).toBe("Proposal: Request revision, with selection")
    expect(menu_Tiers.filter((choice) => choice.includes(": Request"))).toEqual([
      "PROPOSAL Proposal: Request revision, with selection",
      "DOCUMENT Document: Request change, with selection",
      "TASK Task: Request change, with selection"
    ])
    expect(menu_Tiers.filter((choice) => choice.startsWith("PROPOSAL ") && !choice.includes(": Request"))).toEqual(["PROPOSAL Proposal: Accept", "PROPOSAL Proposal: Reject"])
    expect(menu_Tiers.filter((choice) => choice.startsWith("DOCUMENT ") && !choice.includes(": Request")).every((choice) => /^DOCUMENT Document: (Accept|Start|Stop) all \(\d+\)$/.test(choice))).toBe(true)
    expect(menu_Tiers.filter((choice) => choice.startsWith("TASK ") && !choice.includes(": Request")).every((choice) => /^TASK Task: (Accept|Start|Stop) all \(\d+\)$/.test(choice))).toBe(true)
    expect(menu_Tiers.some((choice) => /^DOCUMENT Document: Accept all \(\d+\)$/.test(choice))).toBe(true)
    expect(form_Referring).toEqual({ label: "Document retry.js", subject: "retry.js", quote: ["aborted", true], isFocused: true })
    expect(referred_Document.filter((said) => said[0] === "Check for an abort everywhere it waits.")).toEqual([["Check for an abort everywhere it waits.", "aborted", "line 21"]])
    expect(shown_Document).toEqual({ words: ["aborted"], isInView: true, isOnText: true })
    expect(form_Dropped).toEqual({ label: "Proposal Stop retrying once the caller aborts", subject: "Stop retrying once the caller aborts", quote: null, isFocused: true })
    expect(asked_Tiers).toEqual([
      { requested: "Check for an abort everywhere it waits.", words: "aborted" },
      { asked: "revise", proposal: "aborted", notes: "Say why it stops there.", words: null }
    ])
    expect(opened_Tiers.errors).toEqual([])
  })

  test("a menu opened by the editor's bottom right corner is kept in the editor, opening above the pointer and slid left, its hairlines inset from its edges; the choice the keyboard's on unlit, as it was opened by a right-click, and lit when it's opened from the keyboard", () => {
    expect(placed_Tiers).toEqual({ isInEditor: true, isAbove: true, isLeft: true, isDividerInset: true })
    expect([isLit_Pointer_Tiers, isLit_Keyboard_Tiers]).toEqual([false, true])
  })

  test("a menu open, the document scrolled under it closes it, the keyboard back in the text, as an editor's menu is; the wheel over the menu itself leaves it open, the document still", () => {
    expect(wheeled_OverMenu).toEqual({ isOpen: true, isScrolled: false })
    expect(wheeled_OverDocument).toEqual({ isOpen: false, isScrolled: true })
    expect(isFocused_Input_Scrolled).toBe(true)
  })
})

// the form a menu's choice opens, a popover: on the JavaScript example's
// "export function backoff", the document's request chosen, the form
// empty; pressed on its heading, it stays, the keyboard in its box; a line
// above it clicked, it closes, the keyboard in the text; chosen again and
// written in, a line above clicked, it stays; a right-click on the text,
// no menu, the keyboard back in its box; the document scrolled under it,
// it moves with its text; Escape, it's gone, nothing asked; chosen again,
// empty, the document scrolled, it closes
const opened_Popover = await openExample(
  "javascript",
  1
)
afterAll(() => opened_Popover.close())
await opened_Popover.page.waitForSelector(".note_htmlView")
const page_Popover = opened_Popover.page
const at_Popover = await page_Popover.evaluate(() => {
  const element_Line = [...document.querySelectorAll(".run_htmlView > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes("export function backoff"))
  if (!(element_Line instanceof HTMLElement)) throw new Error("no line")
  element_Line.scrollIntoView({ block: "center" })
  const rect = element_Line.getBoundingClientRect()
  return { x: rect.left + 60, y: rect.top + rect.height / 2 }
})
await page_Popover.waitForTimeout(300)
const formOpened_Popover = async () => {
  await page_Popover.mouse.click(at_Popover.x, at_Popover.y, { button: "right" })
  await page_Popover.locator(".menu_htmlView > .choice_htmlView[data-tier=\"DOCUMENT\"]", { hasText: "Request change" }).click()
  await page_Popover.waitForSelector(".asking_htmlView[data-place=\"POINT\"]")
}
const shown_Popover = () => page_Popover.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const element_Form = document.querySelector(".asking_htmlView[data-place=\"POINT\"]")
  return {
    isOpen: element_Form !== null,
    isMenu: document.querySelector(".menu_htmlView") !== null,
    focus: document.activeElement?.matches(".asking_htmlView > .notes_htmlView") === true ? "FORM" : document.activeElement?.matches(".input_htmlView") === true ? "TEXT" : "ELSEWHERE"
  }
})
await page_Popover.mouse.click(at_Popover.x, at_Popover.y)
await formOpened_Popover()
await page_Popover.locator(".asking_htmlView > .label_Asking_htmlView").click()
const headPressed_Popover = await shown_Popover()
await page_Popover.mouse.click(at_Popover.x + 30, at_Popover.y - 64)
const clickedAway_Empty_Popover = await shown_Popover()
await formOpened_Popover()
await page_Popover.keyboard.type("Keep this.")
await page_Popover.mouse.click(at_Popover.x + 30, at_Popover.y - 64)
const clickedAway_Written_Popover = await shown_Popover()
await page_Popover.mouse.click(at_Popover.x + 30, at_Popover.y - 64, { button: "right" })
const rightClicked_Written_Popover = await shown_Popover()
const scrolledWith_Form_Popover = async () => {
  const before = await page_Popover.evaluate(() => ({ top_Form: document.querySelector(".asking_htmlView")?.getBoundingClientRect().top ?? null, top_Scroller: document.querySelector(".document_htmlView")?.scrollTop ?? 0 }))
  const rect_Document = await page_Popover.evaluate(() => {
    const rect = document.querySelector(".document_htmlView")?.getBoundingClientRect()
    if (rect === undefined) throw new Error("no document")
    return { x: rect.left + 120, y: rect.top + 60 }
  })
  await page_Popover.mouse.move(rect_Document.x, rect_Document.y)
  await page_Popover.mouse.wheel(0, 160)
  await page_Popover.waitForTimeout(400)
  const after = await page_Popover.evaluate(() => ({ top_Form: document.querySelector(".asking_htmlView")?.getBoundingClientRect().top ?? null, top_Scroller: document.querySelector(".document_htmlView")?.scrollTop ?? 0 }))
  return {
    isScrolled: after.top_Scroller !== before.top_Scroller,
    isOpen: after.top_Form !== null,
    isMovedWithText: before.top_Form !== null && after.top_Form !== null && Math.abs((after.top_Form - before.top_Form) + (after.top_Scroller - before.top_Scroller)) <= 1
  }
}
const scrolled_Written_Popover = await scrolledWith_Form_Popover()
await page_Popover.focus(".asking_htmlView > .notes_htmlView")
await page_Popover.keyboard.press("Escape")
const escaped_Written_Popover = await shown_Popover()
await page_Popover.evaluate(() => {
  const element_Line = [...document.querySelectorAll(".run_htmlView > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes("export function backoff"))
  if (element_Line instanceof HTMLElement) element_Line.scrollIntoView({ block: "center" })
})
await page_Popover.waitForTimeout(300)
await formOpened_Popover()
const scrolled_Empty_Popover = await scrolledWith_Form_Popover()
const asked_Popover = (await opened_Popover.logged()).filter((entry) => "requested" in entry || "asked" in entry)
const at_Lines_Popover = await page_Popover.evaluate(() => {
  const element_Line = [...document.querySelectorAll(".run_htmlView > .line_htmlView > .text_htmlView")].find((element) => (element.textContent ?? "").includes("export function backoff"))
  if (!(element_Line instanceof HTMLElement)) throw new Error("no line")
  element_Line.scrollIntoView({ block: "start" })
  const rect = element_Line.getBoundingClientRect()
  return { x: rect.left + 60, y: rect.top + rect.height / 2, height: rect.height }
})
await page_Popover.waitForTimeout(300)
await page_Popover.mouse.click(at_Lines_Popover.x, at_Lines_Popover.y)
await page_Popover.mouse.move(at_Lines_Popover.x, at_Lines_Popover.y)
await page_Popover.mouse.down()
await page_Popover.mouse.move(at_Lines_Popover.x + 40, at_Lines_Popover.y + 2 * at_Lines_Popover.height, { steps: 6 })
await page_Popover.mouse.up()
await page_Popover.mouse.click(at_Lines_Popover.x + 4, at_Lines_Popover.y, { button: "right" })
await page_Popover.locator(".menu_htmlView > .choice_htmlView[data-tier=\"DOCUMENT\"]", { hasText: "Request change" }).click()
await page_Popover.waitForSelector(".asking_htmlView .chip_Quote_htmlView")
const litOf_Quoted_Popover = () => page_Popover.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const element$_Quoted = [...document.querySelectorAll(".text_htmlView > [data-quoted]")]
  const line$_Quoted = [...document.querySelectorAll(".underlay_htmlView[data-underline][data-quoted]")]
  return element$_Quoted.length > 0 && line$_Quoted.length > 0 && line$_Quoted.every((line) => getComputedStyle(line).visibility === "visible") && element$_Quoted.every((element) => getComputedStyle(element).backgroundColor === "rgba(0, 0, 0, 0)")
})
const chip_Popover = await page_Popover.evaluate(() => ({
  head: document.querySelector(".asking_htmlView .words_Quote_htmlView")?.textContent ?? null,
  size: document.querySelector(".asking_htmlView .size_Quote_htmlView")?.textContent ?? null,
  isPeekHidden: document.querySelector(".asking_htmlView .peek_Quote_htmlView")?.hasAttribute("hidden") === true
}))
const isLit_Unpointed_Popover = await litOf_Quoted_Popover()
const placed_Quoted_Popover = await page_Popover.evaluate(() => {
  const rect_Form = document.querySelector(".asking_htmlView")?.getBoundingClientRect()
  const rect$_Quoted = [...document.querySelectorAll(".text_htmlView > [data-quoted]")].flatMap((element) => [...element.getClientRects()])
  if (rect_Form === undefined || rect$_Quoted.length === 0) return null
  const top_Quoted = Math.min(...rect$_Quoted.map((rect) => rect.top))
  const bottom_Quoted = Math.max(...rect$_Quoted.map((rect) => rect.bottom))
  return { isClear: rect_Form.top >= bottom_Quoted || rect_Form.bottom <= top_Quoted, isBelow: rect_Form.top >= bottom_Quoted && rect_Form.top - bottom_Quoted < 12 }
})
await page_Popover.hover(".asking_htmlView .chip_Quote_htmlView")
const isLit_Pointed_Popover = await litOf_Quoted_Popover()
await page_Popover.waitForTimeout(600)
const peekShown_Popover = () => page_Popover.evaluate(() => {
  const element_Peek = document.querySelector(".asking_htmlView .peek_Quote_htmlView")
  return element_Peek instanceof HTMLElement && element_Peek.checkVisibility({ visibilityProperty: true }) ? element_Peek.querySelector(".text_Peek_htmlView")?.textContent ?? null : null
})
const peek_Seen_Popover = await peekShown_Popover()
await page_Popover.mouse.move(5, 5)
await page_Popover.focus(".asking_htmlView > .notes_htmlView")
await page_Popover.keyboard.type("Hm.")
const rect_Document_Peek = await page_Popover.evaluate(() => {
  const rect = document.querySelector(".document_htmlView")?.getBoundingClientRect()
  if (rect === undefined) throw new Error("no document")
  return { x: rect.right - 60, y: rect.bottom - 40 }
})
await page_Popover.mouse.move(rect_Document_Peek.x, rect_Document_Peek.y)
await page_Popover.mouse.wheel(0, 1.5 * at_Lines_Popover.height)
await page_Popover.waitForTimeout(400)
await page_Popover.hover(".asking_htmlView .words_Quote_htmlView")
await page_Popover.waitForTimeout(600)
const peek_Unseen_Popover = await peekShown_Popover()
await page_Popover.mouse.move(5, 5)
await page_Popover.waitForTimeout(300)
const isPeekGone_Popover = await page_Popover.evaluate(() => {
  const element_Peek = document.querySelector(".asking_htmlView .peek_Quote_htmlView")
  return element_Peek instanceof HTMLElement && !element_Peek.checkVisibility({ visibilityProperty: true })
})
await page_Popover.keyboard.press("Escape")

describe("the menu's form's words", () => {
  test("the form opened for words selected over three lines opens just below them, clear of them; they're shown in it by their start, cut, and how many lines; pointed at, they're lit where they are in the document, not peeked at while they can all be seen there; the first of them scrolled away, a moment after pointing, peeked at, gone when the pointer leaves", () => {
    expect(placed_Quoted_Popover).toEqual({ isClear: true, isBelow: true })
    expect(chip_Popover.size).toBe("3 lines")
    expect(chip_Popover.head?.endsWith("…")).toBe(true)
    expect(chip_Popover.isPeekHidden).toBe(true)
    expect([isLit_Unpointed_Popover, isLit_Pointed_Popover]).toEqual([false, true])
    expect(peek_Seen_Popover).toBe(null)
    expect(peek_Unseen_Popover?.split("\n").length).toBe(3)
    expect(peek_Unseen_Popover?.startsWith((chip_Popover.head ?? "").slice(0, -1))).toBe(true)
    expect(isPeekGone_Popover).toBe(true)
  })
})

describe("the menu's form, a popover", () => {
  test("empty, pressed on its heading it stays, the keyboard in its box; a click away closes it, the keyboard in the text; written, a click away leaves it open, and a right-click puts the keyboard back in it, no menu; scrolled, it moves with its text; Escape closes it, nothing asked; empty, a scroll closes it", () => {
    expect(headPressed_Popover).toEqual({ isOpen: true, isMenu: false, focus: "FORM" })
    expect(clickedAway_Empty_Popover).toEqual({ isOpen: false, isMenu: false, focus: "TEXT" })
    expect(clickedAway_Written_Popover).toEqual({ isOpen: true, isMenu: false, focus: "TEXT" })
    expect(rightClicked_Written_Popover).toEqual({ isOpen: true, isMenu: false, focus: "FORM" })
    expect(scrolled_Written_Popover).toEqual({ isScrolled: true, isOpen: true, isMovedWithText: true })
    expect(escaped_Written_Popover).toEqual({ isOpen: false, isMenu: false, focus: "TEXT" })
    expect(scrolled_Empty_Popover).toEqual({ isScrolled: true, isOpen: false, isMovedWithText: false })
    expect(asked_Popover).toEqual([])
    expect(opened_Popover.errors).toEqual([])
  })
})
