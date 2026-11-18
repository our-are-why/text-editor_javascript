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
const opened_JavaScript = await openExample("javascript")
afterAll(() => opened_JavaScript.close())
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
