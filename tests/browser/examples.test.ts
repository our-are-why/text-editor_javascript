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
    expect((await opened.logged()).filter((entry) => "perspective" in entry)).toEqual([{ perspective: "changes" }, { perspective: "markdown" }])
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
    quoted: [...element.querySelectorAll(".quote_Said_htmlView")].map((quote) => quote.textContent),
    removes: element.querySelectorAll(".remove_htmlView").length,
    starts: element.querySelectorAll(".request_htmlView > .start_htmlView").length,
    starts_Request: element.querySelectorAll(".start_Said_htmlView").length,
    progress: element.querySelectorAll(".progress_Said_htmlView").length,
    ink_Revise: [...element.querySelectorAll(".action_htmlView[data-command=\"revise\"]")].map((button) => getComputedStyle(button).color).join()
  }))
}, source)
const pressed = async (source: string, command: string) => {
  const button = opened_JavaScript.page.locator(`.item_htmlView[data-source="${source}"] .action_htmlView[data-command="${command}"]`).first()
  await button.scrollIntoViewIfNeeded()
  await button.click()
}
const revisedWith = async (source: string, notes: string, draft: "ADD" | "START") => {
  await pressed(source, "revise")
  await opened_JavaScript.page.locator(`.item_htmlView[data-source="${source}"] .notes_htmlView`).first().fill(notes)
  await opened_JavaScript.page.locator(`.item_htmlView[data-source="${source}"] .action_htmlView[data-draft="${draft}"]`).first().click()
}
await pressed("errors", "accept")
const items_Accepted = await itemsOf("errors")
await revisedWith("hook", "Keep the hook, but call it after the delay.", "ADD")
const items_Requested = await itemsOf("hook")
await pressed("log", "dismiss")
const items_Dismissed = await itemsOf("log")
await revisedWith("hook", "Name what it's given.", "ADD")
const items_Queued = await itemsOf("hook")
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .remove_htmlView").first().click()
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
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .start_Said_htmlView").first().click()
const items_Alone = await itemsOf("hook")
await pressed("hook", "revise")
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .notes_htmlView").first().fill("And document it.")
const draft_Running = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".item_htmlView[data-source=\"hook\"] .draft_htmlView .action_htmlView")].map((button) => button.textContent))
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"hook\"] .action_htmlView[data-draft=\"ADD\"]").first().click()
const items_Meanwhile = await itemsOf("hook")
await revisedWith("cap", "Say why 30.", "ADD")
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"cap\"] .request_htmlView > .start_htmlView").first().click()
const items_Capped = await itemsOf("cap")
await opened_JavaScript.page.waitForFunction(() => [...document.querySelectorAll(".item_htmlView:is([data-source=\"hook\"], [data-source=\"cap\"])")].every((element) => element.getAttribute("data-state") !== "REVISING"))
const items_Back_Hook = await itemsOf("hook")
const items_Back_Cap = await itemsOf("cap")
const asked_JavaScript = (await opened_JavaScript.logged()).filter((entry) => "asked" in entry)
const queued_JavaScript = (await opened_JavaScript.logged()).filter((entry) => "removed" in entry || "revising" in entry || "revised" in entry)
// then the header over the document: the playground's task, named,
// working while the timeout's revised, Stop offered then; how many of the
// document's proposals are decided, how many requests are queued, how many
// in progress; Stop putting what's running back in the queue; the header's
// Start setting every proposal's queued requests going at once; and, a
// moment later, nothing left asked
const headerShown = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const header = document.querySelector(".htmlView_editor > .header_htmlView")
  return {
    task: [header?.querySelector(".name_Task_htmlView")?.textContent ?? null, header?.querySelector(".task_Header_htmlView")?.getAttribute("data-state") ?? null, header?.querySelector(".state_Task_htmlView")?.textContent ?? null],
    parts: [...header?.querySelectorAll(".part_Header_htmlView") ?? []].map((element) => element.textContent),
    spinners: header?.querySelectorAll(".spinner_htmlView").length ?? 0,
    actions: [...header?.querySelectorAll(".actions_Header_htmlView > button") ?? []].map((element) => element.textContent),
    card: [...header?.querySelectorAll(".card_Task_htmlView > .part_Card_htmlView:first-child .actions_Card_htmlView > button") ?? []].map((element) => element.textContent),
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
    figures: [...card?.querySelectorAll(".part_Card_htmlView") ?? []].map((part) => [...part.querySelectorAll(".figure_Card_htmlView")].map((element) => `${element.querySelector(".label_Card_htmlView")?.textContent}: ${element.querySelector(".value_Card_htmlView")?.textContent}${element.getAttribute("title") === null ? "" : ` (${element.getAttribute("title")})`}`)),
    note: card?.querySelector(".part_Card_htmlView + .part_Card_htmlView .summary_Card_htmlView")?.textContent ?? null,
    actions_Document: [...card?.querySelectorAll(".part_Card_htmlView + .part_Card_htmlView .actions_Card_htmlView > button") ?? []].map((element) => element.textContent)
  }
})
const card_Resting = await cardOf_Task()
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
const card_Hovered = await cardOf_Task()
await opened_JavaScript.page.locator(".card_Task_htmlView .action_htmlView[data-task=\"stop\"]").click()
const header_Stopped = await headerShown()
await opened_JavaScript.page.locator(".header_htmlView .start_htmlView").click()
const header_Started = await headerShown()
await opened_JavaScript.page.waitForFunction(() => document.querySelector(".item_htmlView[data-state=\"REVISING\"], .item_htmlView[data-state=\"REQUESTED\"]") === null)
const header_Done = await headerShown()
const logged_Header = (await opened_JavaScript.logged()).filter((entry) => "task" in entry || "revising" in entry || "revised" in entry)
const logged_Stopped = logged_Header.slice(logged_Header.findIndex((entry) => "task" in entry))
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
    dashes: [...new Set(rings.map((ring) => getComputedStyle(ring).strokeDasharray))]
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

test("a proposal's action pressed is asked of the host, which sends back what it now has: accepted, it's drawn accepted, Reopen its one action; a revision added, its notes asked with it, it's drawn as one requested, what you asked listed under it, still to be accepted, rejected or asked more of; dismissed, it's gone; another added, both listed, one removed; accepting one with revisions queued asked first, Cancel the keyboard's, Escape taking it back; one request started alone, from its own Start, the proposal revising, that request in progress, nothing of it to remove; one added meanwhile queued for the next round, nothing to start while a round's under way; Start under a proposal's requests starting all of them, and that proposal alone; each round back, what it answered done with, what's queued since still queued; and what's typed after goes on as before", () => {
  expect(items_Accepted.length).toBeGreaterThan(0)
  expect(items_Accepted.every((item) => item.state === "ACCEPTED" && item.actions.join() === "Reopen")).toBe(true)
  expect(items_Requested.length).toBeGreaterThan(0)
  expect(items_Requested.every((item) => item.state === "REQUESTED" && item.asked.join("|") === "Keep the hook, but call it after the delay." && item.actions.join() === "Accept,Reject,Revise" && item.removes === 1 && item.starts === 1)).toBe(true)
  expect(items_Requested[0]?.ink_Revise).toBe(items_Back_Cap[0]?.ink_Revise)
  expect(items_Dismissed).toEqual([])
  expect(items_Queued.every((item) => item.asked.join("|") === "Keep the hook, but call it after the delay.|Name what it's given." && item.removes === 2)).toBe(true)
  expect(items_Removed.every((item) => item.state === "REQUESTED" && item.asked.join("|") === "Name what it's given.")).toBe(true)
  expect(confirming_Hook).toEqual({ question: "Accept and drop 1 queued request?", focused: "Cancel" })
  expect(items_Kept.every((item) => item.state === "REQUESTED" && item.actions.join() === "Accept,Reject,Revise" && item.asked.join("|") === "Name what it's given.")).toBe(true)
  const shape = (items: Awaited<ReturnType<typeof itemsOf>>) => [...new Set(items.map((item) => JSON.stringify([item.state, item.asked, item.progress, item.removes, item.starts, item.starts_Request])))]
  expect(shape(items_Alone)).toEqual([JSON.stringify(["REVISING", ["Name what it's given."], 1, 0, 0, 0])])
  expect(draft_Running).toEqual(["Add", "Cancel"])
  expect(shape(items_Meanwhile)).toEqual([JSON.stringify(["REVISING", ["Name what it's given.", "And document it."], 1, 1, 0, 0])])
  expect(items_Meanwhile.every((item) => item.actions.join() === "Accept,Reject,Revise")).toBe(true)
  expect(shape(items_Capped)).toEqual([JSON.stringify(["REVISING", ["make the cap an option, 30 seconds unless the caller gives another.", "Say why 30."], 2, 0, 0, 0])])
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
    { revising: "cap", requests: 2 },
    { revised: "hook" },
    { revised: "cap" }
  ])
  expect(line_Attempts_Typed.length).toBe(line_Attempts.length + 1)
  expect(opened_JavaScript.errors).toEqual([])
})

test("the header over the document stays put as it scrolls, saying the host's task, its mark where it stands, the agent at work or your turn, its state in words for what reads it aloud, how many proposals are decided, how many requests queued and in progress, nothing spinning beside the count while the task's mark says the agent's at work; its card hidden until the task's hovered, in two parts, the task's, its id, its name and where it stands, what the agent says of it, its proposals across the files it touches, and how many files, Add a request for the task as a whole, and the host's actions for it, and this document's, its proposals framed as the task's share, how many are here and how many of those decided, each figure's breakdown when hovered, what the agent says of it, and the host's actions for it, Stop putting what's running back in the queue; the header's Start setting every proposal's queued requests going at once, each proposal's round its own; nothing asked, it says only what's decided, nothing to start", () => {
  expect(header_Working).toEqual({ task: ["Tidy the retry loop", "WORKING", "the agent's working on it"], parts: ["3 of 14 decided", "1 request queued", "1 in progress"], spinners: 0, actions: ["Request a change", "Start"], card: ["Add a request", "Stop"], isSticky: true })
  expect(card_Resting.isShown).toBe(false)
  expect(card_Hovered).toEqual({ isShown: true, head: "Tidy the retry loopretry-tidythe agent's working on it", summary: "Keeps every error, names the attempt counter round, caps the delay, and stops once the caller aborts; drops the onRetry hook and the opening comment.", id: "retry-tidy", figures: [["Task proposals: 5 of 20 decided (12 to review · 1 revision requested · 2 revising · 4 accepted · 1 rejected)", "Files: 2"], ["Proposals here: 14 of 20 (9 to review · 1 revision requested · 1 revising · 2 accepted · 1 rejected)", "Decided: 3 of 14"]], note: "In retry.js: the loop's errors, its counter's name, its delays and its abort, and two things it no longer needs.", actions_Document: ["Accept the ones waiting here (8)"] })
  expect(header_Stopped).toEqual({ task: ["Tidy the retry loop", "YOUR_TURN", "waiting on you"], parts: ["3 of 14 decided", "2 requests queued"], spinners: 0, actions: ["Request a change", "Start"], card: ["Add a request"], isSticky: true })
  expect(header_Started).toEqual({ task: ["Tidy the retry loop", "WORKING", "the agent's working on it"], parts: ["3 of 14 decided", "2 in progress"], spinners: 0, actions: ["Request a change"], card: ["Add a request", "Stop"], isSticky: true })
  expect(header_Done).toEqual({ task: ["Tidy the retry loop", "YOUR_TURN", "waiting on you"], parts: ["3 of 14 decided"], spinners: 0, actions: ["Request a change"], card: ["Add a request"], isSticky: true })
  expect(logged_Stopped).toEqual([{ task: "stop" }, { revising: "hook, timeout", requests: 2 }, { revised: "hook, timeout" }])
  expect(opened_JavaScript.errors).toEqual([])
})

test("a round that landed after your edits: its changes written before them ringed dashed, its item saying how many, with Run again; pressed, asked of the host, which starts it again, the proposal revising, nothing to run again while it's under way; its round back, written on the document as it is now, nothing marked", () => {
  expect(stale_Landed).toEqual({ state: "OPEN", stale: "1 change written before your editsRun again", dashes: ["3px, 2px"] })
  expect(stale_Rerunning).toEqual({ state: "REVISING", stale: "1 change written before your edits", dashes: ["3px, 2px"] })
  expect(stale_Again).toEqual({ state: "OPEN", stale: null, dashes: [] })
  expect(logged_Rerun).toEqual([{ rerun: "header", requests: 1 }, { revising: "header", requests: 1 }])
  expect(opened_JavaScript.errors).toEqual([])
})

// then a right-click, on the JavaScript example: on "aborted", the words
// "Stop retrying once the caller aborts" puts in, selected by a drag, its menu, and the note
// its first choice opens, written and sent with the keyboard; then on the
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
    quote: document.querySelector(".asking_htmlView > .quote_Asking_htmlView")?.textContent ?? null,
    isFocused: document.activeElement?.matches(".asking_htmlView > .notes_htmlView") === true
  }
})
await opened_JavaScript.page.keyboard.type("Check it before the delay too.")
await opened_JavaScript.page.keyboard.press("Control+Enter")
const items_Aborted = await itemsOf("aborted")
const requested_Aborted = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] .text_htmlView > [data-requested]")].map((element) => element.textContent))
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
// then the task's own requests: the one just added, on no proposal,
// listed in the task's card; Request a change, in the header, opening the
// form for the whole document under it, Start there adding one and
// starting it, in progress, the other still queued; then it addressed,
// with nothing to change, there being no agent, still listed, and the
// other removed
const requestsOf_Document = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".card_Task_htmlView .said_htmlView")].map((element) => {
    const progress = element.querySelector(".progress_Said_htmlView")?.textContent
    return `${element.querySelector(".notes_Said_htmlView")?.textContent}${progress === undefined ? "" : ` (${progress})`}`
  })
})
const requests_Added = await requestsOf_Document()
await opened_JavaScript.page.locator(".header_htmlView [data-ask=\"DOCUMENT\"]").click()
const form_Header = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const button = document.querySelector(".header_htmlView [data-ask=\"DOCUMENT\"]")?.getBoundingClientRect()
  const form = document.querySelector(".asking_htmlView")?.getBoundingClientRect()
  return {
    label: document.querySelector(".asking_htmlView > .label_Asking_htmlView")?.textContent ?? null,
    actions: [...document.querySelectorAll(".asking_htmlView .action_htmlView")].map((element) => element.textContent),
    isFocused: document.activeElement?.matches(".asking_htmlView > .notes_htmlView") === true,
    isUnder: button !== undefined && form !== undefined && form.top >= button.bottom
  }
})
await opened_JavaScript.page.keyboard.type("Name the module's exports.")
await opened_JavaScript.page.locator(".asking_htmlView [data-request=\"START\"]").click()
const requests_Started = await requestsOf_Document()
await opened_JavaScript.page.waitForFunction(() => ![...document.querySelectorAll(".card_Task_htmlView .progress_Said_htmlView")].some((element) => element.textContent === "in progress"))
const requests_Done = await requestsOf_Document()
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await opened_JavaScript.page.locator(".card_Task_htmlView .remove_htmlView").first().click()
const requests_Removed = await requestsOf_Document()

test("a right-click on a proposal's selected words offers a note on them, or on the whole proposal, the first focused; chosen, a form, what it's on quoted, the keyboard in it; added, the host's told, which queues a revision of the proposal, the words quoted before what you asked, and underlined, dotted, where they're proposed; on the document's words, nothing selected, a request for a change to the document, Escape closing it, the menu key opening it again at the caret", () => {
  expect(menu_Words).toEqual({ choices: ["Note on these words of “Stop retrying once the caller aborts”", "Note on “Stop retrying once the caller aborts”"], focused: "Note on these words of “Stop retrying once the caller aborts”" })
  expect(form_Words).toEqual({ label: "Note on these words of “Stop retrying once the caller aborts”", quote: "aborted", isFocused: true })
  expect(items_Aborted.length).toBeGreaterThan(0)
  expect(items_Aborted.every((item) => item.state === "REQUESTED" && item.asked.join("|") === "Check it before the delay too." && item.quoted.join("|") === "aborted")).toBe(true)
  expect(requested_Aborted.length).toBeGreaterThan(0)
  expect(requested_Aborted.join("")).toBe("aborted".repeat(requested_Aborted.join("").length / "aborted".length))
  expect(menu_Document).toEqual({ choices: ["Request a change to this document"], focused: "Request a change to this document" })
  expect(isClosed_Menu).toBe(true)
  expect(menu_Keyboard).toEqual(menu_Document)
  expect(asked_Menu).toEqual([
    { asked: "revise", proposal: "aborted", notes: "Check it before the delay too.", words: "aborted" },
    { requested: "Say why the delay doubles.", aimed: null }
  ])
  expect(opened_JavaScript.errors).toEqual([])
})

test("a request on no proposal, the task's own, queued and listed in the task's card; Request a change, in the header, a form for the whole document under it, the keyboard in it, Add and Start; started there, added and in progress at once, the rest still queued; addressed, still listed, saying by how many proposals, here none, nothing to remove; a queued one removed, gone", () => {
  expect(requests_Added).toEqual(["Say why the delay doubles."])
  expect(form_Header).toEqual({ label: "Request a change to this document", actions: ["Add", "Start", "Cancel"], isFocused: true, isUnder: true })
  expect(requests_Started).toEqual(["Say why the delay doubles.", "Name the module's exports. (in progress)"])
  expect(requests_Done).toEqual(["Say why the delay doubles.", "Name the module's exports. (addressed · nothing to change)"])
  expect(requests_Removed).toEqual(["Name the module's exports. (addressed · nothing to change)"])
  expect(opened_JavaScript.errors).toEqual([])
})

// last, on the JavaScript example, the task's card: Add a request, in its
// task part, a form for the task as a whole, docked under the header, the
// card hidden while it's there; added, listed in the card's task part, not
// its document's; then, in its document part, the host's own action,
// accepting the proposals waiting on nothing but you, taken at once
const partsOf_Card = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const parts = [...document.querySelectorAll(".card_Task_htmlView > .part_Card_htmlView")]
  return parts.map((part) => [...part.querySelectorAll(".notes_Said_htmlView")].map((element) => element.textContent))
})
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await opened_JavaScript.page.locator(".card_Task_htmlView [data-ask=\"TASK\"]").click()
const form_Task = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const card = document.querySelector(".card_Task_htmlView")
  return {
    label: document.querySelector(".asking_htmlView[data-docked] > .label_Asking_htmlView")?.textContent ?? null,
    isCardHidden: card === null ? false : getComputedStyle(card).visibility === "hidden"
  }
})
await opened_JavaScript.page.keyboard.type("Keep the README in step.")
await opened_JavaScript.page.keyboard.press("Control+Enter")
const parts_Added = await partsOf_Card()
const waiting_Before = await opened_JavaScript.page.evaluate(() => document.querySelectorAll(".item_htmlView[data-state=\"ACCEPTED\"]").length)
await opened_JavaScript.page.hover(".trigger_Task_htmlView")
await opened_JavaScript.page.locator(".card_Task_htmlView [data-task=\"accept-here\"]").click()
const waiting_After = await opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return {
    accepted: document.querySelectorAll(".item_htmlView[data-state=\"ACCEPTED\"]").length,
    offered: document.querySelectorAll(".card_Task_htmlView [data-task=\"accept-here\"]").length
  }
})
const logged_Card = (await opened_JavaScript.logged()).slice(-2)

test("the task's card: Add a request, a form for the task as a whole, docked under the header, the card hidden while it's there; added, listed in the card's task part, not its document's; the host's action for the document there, the proposals waiting on nothing but you accepted at once, nothing left waiting to offer it for", () => {
  expect(form_Task).toEqual({ label: "Add a request to the task", isCardHidden: true })
  expect(parts_Added[0]).toEqual(["Keep the README in step."])
  expect(parts_Added[1]).not.toContain("Keep the README in step.")
  expect(waiting_After.accepted).toBeGreaterThan(waiting_Before)
  expect(waiting_After.offered).toBe(0)
  expect(logged_Card).toEqual([{ requested: "Keep the README in step.", aimed: null }, { task: "accept-here" }])
  expect(opened_JavaScript.errors).toEqual([])
})

