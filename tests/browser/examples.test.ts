import { describe, expect, test } from "bun:test"
import { openExample } from "./harness.ts"

// the Markdown example, opened as you'd open it to read: its changes read as
// Markdown first, then, its button pressed, as text, then as Markdown again;
// each time, the rings on what its default's made bold, as proposed, and
// the buttons' state, once the editor's drawn again
const opened = await openExample(
  "markdown",
  1
)

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
const logged_Perspectives = (await opened.logged()).filter((entry) => "perspective" in entry)
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
  test("switched back, it's read as Markdown again, and each switch is reported", () => {
    expect(shown_Again).toEqual(shown_Markdown)
    expect(logged_Perspectives).toEqual([{ perspective: "changes" }, { perspective: "markdown" }])
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

// line 13, "Wrap the call in a function, ...", the tenth of run lines-4,
// a line shown once, in the example's task: typed into after "Wrap ", the
// caret's line held where it was as the frame of your edits opens round it,
// the line as the file has it above, its own lines as yours, no head or
// list; a character taken back, the line broken there, then each undone,
// the frame gone with the last, and the typing done again
const caretTop = () => opened.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return document.querySelector(".caret_htmlView")?.getBoundingClientRect().top ?? null
})
const line_Before = (await linesOf("lines-4"))[9]
await clickAt("lines-4", 9, 5)
const top_Typing = await caretTop()
await opened.page.keyboard.type("XY")
const top_Typed = await caretTop()
const line_Typed = (await linesOf("frame-13-proposed"))[0]
const line_File = (await linesOf("frame-13-current"))[0]
const isHeaded_Yours = await opened.page.evaluate(() => document.querySelector(".run_htmlView[data-run=\"frame-13-proposed\"]")?.closest(".frame_htmlView")?.querySelector(".head_Proposals_htmlView, .proposals_htmlView") !== null)
const logged_Typed = (await opened.logged()).at(-1)
await opened.page.keyboard.press("Backspace")
const line_Deleted = (await linesOf("frame-13-proposed"))[0]
await opened.page.keyboard.press("Enter")
const lines_Broken = (await linesOf("frame-13-proposed")).slice(0, 2)
for (let step = 0; step < 3; step = step + 1) await opened.page.keyboard.press("Control+z")
const line_Undone = (await linesOf("lines-4"))[9]
await opened.page.keyboard.press("Control+Shift+z")
const line_Redone = (await linesOf("frame-13-proposed"))[0]

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
await clickAt("frame-13-proposed", 0, 0)
await opened.page.keyboard.press("Shift+Alt+ArrowRight")
await opened.page.keyboard.press("Control+c")
await opened.page.keyboard.press("End")
await opened.page.keyboard.press("Control+v")
const line_Pasted = (await linesOf("frame-13-proposed"))[0]

describe("the Markdown example, typed into: the document's own words, a proposal's, and what's locked", () => {
  test("in a task, typing on a line shown once goes into the task's head, a change of yours, never the file: a frame of it opens round the line, the line as the file has it above, read only, as yours below, no head or list, as there's nothing to decide, the caret's line held where it was", () => {
    expect(line_File).toBe(line_Before)
    expect(isHeaded_Yours).toBe(false)
    expect(logged_Typed).toMatchObject({ proposals: "yours", document: false })
    expect(Math.abs((top_Typed ?? 0) - (top_Typing ?? 0))).toBeLessThan(1)
  })
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
      "make the cap an option, 30 seconds unless the caller gives another. |  |  | queued",
      "Name it MAX_DELAY_MS, up with the other constants. | 30_000 | line 33 | queued"
    ],
    timeout: [
      "only when the request is safe to send twice, a GET or a PUT. |  |  | running",
      "Say timed out, as the status means, not before any answer. | before any answer | line 37 | queued"
    ],
    isDotted: true,
    isDashed: true,
    isCut: true,
    runs_Requested: ["frame-13-current: 5", "lines-28: 2", "frame-31-proposed: 1", "frame-36-proposed: 1"],
    document: [
      "Count the errors too, for the message. | lastError = error; | line 20 | queued",
      "Say which round it gives up at. | n === attempts | line 21 | queued",
      "Give up on an error that can't be retried before the count's checked. | attempts || !isRetryable(error) | line 21 | queued",
      "Say why half a delay at random, not a whole one. | // 100ms, 200ms, 400ms, ..., and up to half as long again at random, so that… | lines 29–30 | running",
      "Say what this throws: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted | signal?.throwIfAborted(); | line 16 | queued",
      "Keep every error the attempts throw, not only the last. |  |  | done · 1 proposal",
      "Check the doc comment still says what retry takes. |  |  | done · nothing to change"
    ],
    task: ["Say in the README that onRetry is gone. |  |  | queued"],
    dropped: ["Stale · 1 dropped, its text goneRun again"],
    isUrlKept: true
  })
})

// then a request's row pointed at, or the keyboard in it: one sent with
// words, its words lit, a line under them, its proposal not pointed at,
// its rings still, its item lit as being in it; one sent with none, its proposal pointed at, as the
// rest of its item does; each marked on its list's rule beside it, the
// rule thicker there, in its bullet's plum, its bullet a dot as it is
const lookOf_Row = (request: string) => opened_JavaScript.page.evaluate(async (request) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const item = document.querySelector(".item_htmlView[data-source=\"timeout\"]")
  const row = document.querySelector(`.said_htmlView[data-request="${request}"]`)
  const line = row === null ? null : getComputedStyle(row, "::before")
  const bullet = row === null ? null : getComputedStyle(row, "::after")
  return {
    isProposalPointed: item?.hasAttribute("data-pointed") === true || document.querySelector(".group_htmlView[data-source=\"timeout\"][data-pointed]") !== null,
    isItemLit: item !== null && getComputedStyle(item).backgroundImage !== "none",
    isWordsLit: document.querySelector(".underlay_htmlView[data-underline][data-lit]") !== null,
    isMarked: line !== null && line.content !== "none" && line.width === "4px" && line.backgroundImage === "none" && line.backgroundColor === getComputedStyle(row?.closest(".request_htmlView") ?? document.body).borderLeftColor && bullet !== null && bullet.backgroundImage.includes("82%") && !bullet.backgroundImage.includes("linear-gradient")
  }
}, request)
await opened_JavaScript.page.locator(".frame_htmlView[aria-label=\"lines 36 to 40\"]").evaluate((element) => element.scrollIntoView({ block: "center" }))
await opened_JavaScript.page.locator(".said_htmlView[data-request=\"timeout-1\"] .notes_Said_htmlView").hover()
const row_Words = await lookOf_Row("timeout-1")
await opened_JavaScript.page.locator(".said_htmlView[data-request=\"timeout-0\"] .notes_Said_htmlView").hover()
const row_Plain = await lookOf_Row("timeout-0")
await opened_JavaScript.page.locator(".item_htmlView[data-source=\"timeout\"] .title_htmlView").hover()
const row_Item = await lookOf_Row("timeout-1")
await opened_JavaScript.page.mouse.move(5, 5)
await opened_JavaScript.page.keyboard.press("Tab")
await opened_JavaScript.page.focus(".said_htmlView[data-request=\"timeout-1\"] .show_Said_htmlView")
const row_Keyed = await lookOf_Row("timeout-1")
await opened_JavaScript.page.evaluate(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
})

test("a request's row pointed at, or the keyboard in it, is marked on its list's rule beside it, the rule thicker there, in its bullet's plum, its bullet a dot as it is; one sent with words lights its words, its proposal not pointed at, its rings not blinking, the request what you're on, its item still lit, as being in it; one sent with none points at its proposal, as the rest of its item does", () => {
  expect(row_Words).toEqual({ isProposalPointed: false, isItemLit: true, isWordsLit: true, isMarked: true })
  expect(row_Plain).toEqual({ isProposalPointed: true, isItemLit: true, isWordsLit: false, isMarked: true })
  expect(row_Item).toEqual({ isProposalPointed: true, isItemLit: true, isWordsLit: false, isMarked: false })
  expect(row_Keyed).toEqual({ isProposalPointed: false, isItemLit: true, isWordsLit: true, isMarked: true })
  expect(opened_JavaScript.errors).toEqual([])
})

// then each request's ellipsis in a proposal's item: on its first line,
// just past its last word, the same gap after it in each, its actions
// starting where it is and kept in its row; and in the document's card,
// at the right of its first line, every request's in one column; a
// group's always just after its heading, wherever it is; and a request's
// ellipsis and actions in the revision's plum, as its group's are
const hugged_Folds = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".item_htmlView .said_htmlView > .row_Said_htmlView")].flatMap((row) => {
  const more = row.querySelector(":scope > .fold_Action_htmlView > .more_htmlView")
  const actions = row.querySelector(":scope > .fold_Action_htmlView > .actions_Said_htmlView")
  const text = row.querySelector(":scope > .text_Said_htmlView")
  if (more === null || actions === null || text === null) return []
  const range = document.createRange()
  range.selectNodeContents(text)
  const [first, ...rest] = [...range.getClientRects()].filter((rect) => rect.width > 0)
  if (first === undefined) return []
  const right_First = Math.max(first.right, ...rest.filter((rect) => rect.top < first.bottom - 1).map((rect) => rect.right))
  const rect_More = more.getBoundingClientRect()
  const rect_Actions = actions.getBoundingClientRect()
  const rect_Row = row.getBoundingClientRect()
  // where the line's letters' middle is, half their height over their
  // baseline, for the ellipsis to sit on
  const probe = document.createElement("span")
  probe.style.cssText = "display: inline-block; width: 0; height: 0; vertical-align: middle"
  text.prepend(probe)
  const middle = probe.getBoundingClientRect().top
  probe.remove()
  // each baseline, where the first letter's box ends less its face's
  // descent, the request's words' and its first action's
  const context = document.createElement("canvas").getContext("2d")
  const baselineOf = (element: Element | null) => {
    const node = [...element?.childNodes ?? []].find((child) => child instanceof Text && (child.textContent ?? "").trim() !== "")
    if (!(node instanceof Text) || element === null || context === null) return Number.NaN
    const range_First = document.createRange()
    range_First.setStart(node, 0)
    range_First.setEnd(node, 1)
    const style = getComputedStyle(element)
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    return range_First.getBoundingClientRect().bottom - context.measureText("x").fontBoundingBoxDescent
  }
  return [{
    isCentred: Math.abs((rect_More.top + rect_More.bottom) / 2 - middle) < 0.5,
    isOnBaseline: Math.abs(baselineOf(actions.querySelector("button")) - baselineOf(row.querySelector(".notes_Said_htmlView"))) < 0.5,
    isOnFirstLine: rect_More.top < first.bottom && rect_More.bottom > first.top,
    gap: rect_More.left - right_First,
    isActionsInRow: rect_Actions.right <= rect_Row.right + 0.5 && Math.abs(rect_Actions.left - rect_More.left) < 0.5
  }]
}))
const rights_Card = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".card_Document_htmlView .said_htmlView > .row_Said_htmlView > .fold_Action_htmlView > .more_htmlView")].map((more) => more.getBoundingClientRect().right))
const gaps_Head = await opened_JavaScript.page.evaluate(() => [...document.querySelectorAll(".head_Request_htmlView")].flatMap((head) => {
  const label = head.querySelector(".label_Request_htmlView")
  const more = head.querySelector(":scope > .fold_Action_htmlView > .more_htmlView")
  return label === null || more === null ? [] : [more.getBoundingClientRect().left - label.getBoundingClientRect().right]
}))
const inks_Said = await opened_JavaScript.page.evaluate(() => {
  const said = document.querySelector(".card_Document_htmlView .said_htmlView:has(.edit_Said_htmlView)")
  const more = said?.querySelector(".more_htmlView")
  const label = document.querySelector(".card_Document_htmlView .label_Request_htmlView")
  return {
    more: more === null || more === undefined ? null : getComputedStyle(more).backgroundImage.includes(getComputedStyle(label ?? more).color) ? "plum" : getComputedStyle(more).backgroundImage.slice(0, 80),
    actions: [...said?.querySelectorAll(".actions_Said_htmlView > button") ?? []].map((button) => getComputedStyle(button).color === getComputedStyle(label ?? button).color ? "plum" : getComputedStyle(button).color)
  }
})

test("a request's ellipsis in a proposal's item sits on its first line, on its letters' middle, its actions on their baseline, just past its last word, close to what it's for, the same gap after it in each, its actions opening from where it is into room kept at the end of that line; in a card, at the right of its first line, every request's in one column, as the card's other ellipses are; a group's always just after its heading; a request's ellipsis and actions in the revision's plum, as its group's are", () => {
  expect(hugged_Folds.length).toBeGreaterThan(1)
  expect(hugged_Folds.every((fold) => fold.isOnFirstLine && fold.isActionsInRow && fold.isCentred && fold.isOnBaseline)).toBe(true)
  const gaps = hugged_Folds.map((fold) => fold.gap)
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(1)
  expect(gaps[0]).toBeGreaterThan(4)
  expect(gaps[0]).toBeLessThan(16)
  expect(rights_Card.length).toBeGreaterThan(3)
  expect(Math.max(...rights_Card) - Math.min(...rights_Card)).toBeLessThan(1)
  expect(gaps_Head.length).toBeGreaterThan(1)
  expect(gaps_Head.every((gap) => gap > 0 && gap < 16)).toBe(true)
  expect(inks_Said.more).toBe("plum")
  expect(inks_Said.actions.length).toBeGreaterThan(1)
  expect(inks_Said.actions.every((ink) => ink === "plum")).toBe(true)
})

// then a running request's own dotted line shimmering under the words
// it's on, the agent at work on them, the view's band dimming it as it
// dims a word, the words themselves still, so a revising proposal's words
// shimmering on the same text are told apart; a queued one's line still
const words_Running = await opened_JavaScript.page.evaluate(() => ({
  running: [...document.querySelectorAll(".underlay_htmlView[data-underline][data-running]")].map((line) => `${line.closest(".run_htmlView")?.getAttribute("data-run")} ${line.hasAttribute("data-requested") ? "dotted" : ""} ${getComputedStyle(line).animationName} ${getComputedStyle(line).maskOrigin}`),
  words: document.querySelectorAll(".text_htmlView [data-running]").length
}))

test("a running request's own line shimmers under the words it's on, the agent at work on them, the view's band dimming it as it dims a word, the words still, so a revising proposal's words shimmering on the same text are told apart; a queued one's words and line still", () => {
  expect(words_Running.running).toEqual(["lines-28 dotted shimmer_htmlView stroke-box", "lines-28 dotted shimmer_htmlView stroke-box"])
  expect(words_Running.words).toBe(0)
})

// the light round a pointed place's rings, the ring's own colour, faint,
// a fifth of its lap, and never shorter than 24px, so it's seen going
// round a ring of one letter
const lightOf = async (source: string) => {
  const point = await opened_JavaScript.page.evaluate((source) => {
    const ring = document.querySelector(`.group_htmlView > .underlay_htmlView[data-change][data-source="${source}"][data-place="2"][data-side="before"]`)
    ring?.scrollIntoView({ block: "center" })
    const rect = ring?.getBoundingClientRect()
    if (rect === undefined) throw new Error(`no ring of ${source}`)
    return { x: rect.left + 1.5, y: rect.top + rect.height / 2 }
  }, source)
  await opened_JavaScript.page.mouse.move(point.x, point.y)
  return opened_JavaScript.page.evaluate(async (source) => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const light = document.querySelector(`.lap_htmlView[data-pointed][data-source="${source}"][data-place="2"][data-side="before"]`)
    if (!(light instanceof SVGPathElement)) return null
    const style = getComputedStyle(light)
    const [dash = 0] = (style.strokeDasharray.match(/\d*\.?\d+/g) ?? []).map(Number)
    return {
      opacity: Math.round(parseFloat(style.strokeOpacity) * 100) / 100,
      dash: Math.round(dash * 10) / 10,
      length: Math.round(dash * light.getTotalLength() / Number(light.getAttribute("pathLength")) * 10) / 10
    }
  }, source)
}
const light_Letter = await lightOf("round")
const light_Word = await lightOf("errors")
await opened_JavaScript.page.mouse.move(5, 5)

test("a light runs round a pointed place's rings in the ring's own colour, faint, a fifth of the lap, never shorter than 24px, so it's seen going round a ring of one letter", () => {
  expect(light_Letter?.opacity).toBe(0.6)
  expect(light_Letter?.dash).toBeGreaterThan(20)
  expect(light_Letter?.length).toBeCloseTo(24, 0)
  expect(light_Word?.opacity).toBe(0.6)
  expect(light_Word?.dash).toBe(20)
  expect(light_Word?.length).toBeGreaterThan(24)
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

test("each edit's told to the host as it's applied, as the playground reports it: what kind it was, whose proposals' changes it changed, each its next round, and whether the document changed; in a task, never: a proposal's own words, that proposal, and anywhere else, outside frames too, yours; undoing too", () => {
  const edits = logged_Markdown.filter((entry) => "edited" in entry)
  expect(edits.filter((entry) => entry["document"] !== false)).toEqual([])
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
    progress: element.querySelectorAll(".progress_Said_htmlView[data-status=\"RUNNING\"]").length,
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
    task: [header?.querySelector(".name_Task_htmlView")?.textContent ?? null, header?.querySelector(".trigger_Task_htmlView")?.getAttribute("data-state") ?? null, header?.querySelector(".state_Task_htmlView")?.textContent ?? null],
    parts: [...header?.querySelectorAll(".part_Header_htmlView") ?? []].map((element) => element.textContent),
    spinners: header?.querySelectorAll(".spinner_htmlView").length ?? 0,
    document: [header?.querySelector(".name_Document_htmlView")?.textContent ?? null, header?.querySelector(".trigger_Document_htmlView")?.getAttribute("data-state") ?? null, header?.querySelector(".state_Document_htmlView")?.textContent ?? null],
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
// edit of yours touched what it was on, its lines drawn as it was written on
// them above the file's: asked of the host,
// which starts it again, on the document as it is now, revising, the line
// still saying so, nothing to run again while it's under way; and, its
// round back, written on the document as it is, nothing marked
const staleOf_Header = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const item = document.querySelector(".item_htmlView[data-source=\"header\"]")
  const lines = [...(item?.closest(".frame_htmlView")?.querySelectorAll(".run_htmlView[data-run$=\"-current\"] > .line_htmlView") ?? [])]
  return {
    state: item?.getAttribute("data-state") ?? null,
    stale: item?.querySelector(".stale_htmlView")?.textContent ?? null,
    lines: lines.flatMap((line) => line.getAttribute("data-layer") === "DOCUMENT" ? [] : [[line.getAttribute("data-layer"), line.querySelector(".label_htmlView")?.textContent ?? ""]])
  }
})
const stale_Landed = await staleOf_Header()
// the document's card, held open by the keyboard in it since its Start
// was pressed, put away first, as it would cover what's pressed next
await opened_JavaScript.page.keyboard.press("Escape")
await opened_JavaScript.page.mouse.move(5, 5)
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
  expect(header_Working).toEqual({ task: ["Tidy the retry loop", "WORKING", "Working"], parts: [], spinners: 0, document: ["retry.js", "WORKING", "Working"], card: ["Cancel", "Accept all (10)", "Start all (6)", "Stop all (3)"], card_Document: ["Accept all (7)", "Start all (5)", "Stop all (2)"], isSticky: true })
  expect(card_Resting.isShown).toBe(false)
  expect(card_Hovered).toEqual({ isShown: true, head: "T-12Working…Cancel", summary: "Keeps every error, names the attempt counter round, caps the delay, and stops once the caller aborts; drops the onRetry hook and the opening comment.", id: "T-12", figures: ["Proposals: 6 of 20 decided (11 to review · 1 revision requested · 2 revising · 5 accepted · 1 rejected)", "Scope Revisions: 7 queued · 3 running", "Level Revisions: "], documents: ["retry.js (this document): 4 of 14 decided (8 to review · 1 revision requested · 1 revising · 3 accepted · 1 rejected)", "README.md: 2 of 6 decided (3 to review · 1 revising · 2 accepted)"], parts: ["head_Card_htmlView", "summary_Card_htmlView", "section_Card_htmlView", "section_Card_htmlView", "section_Card_htmlView"] })
  expect(card_Document).toEqual({ isShown: true, label: "retry.js", summary: "In retry.js: the loop's errors, its counter's name, its delays and its abort, and two things it no longer needs.", figures: ["Proposals: 4 of 14 decided (8 to review · 1 revision requested · 1 revising · 3 accepted · 1 rejected)", "Scope Revisions: 6 queued · 2 running", "Level Revisions: "], actions: ["Accept all (7)", "Starts all 5 requests queued in this file, its own and its proposals'", "Stops all 2 running in this file, its own and its proposals', putting them back in the queue"] })
  expect(header_Stopped).toEqual({ task: ["Tidy the retry loop", "YOUR_TURN", "Your turn"], parts: [], spinners: 0, document: ["retry.js", "YOUR_TURN", "Your turn"], card: ["Cancel", "Accept all (10)", "Start all (10)"], card_Document: ["Accept all (7)", "Start all (8)"], isSticky: true })
  expect(header_Started).toEqual({ task: ["Tidy the retry loop", "WORKING", "Working"], parts: [], spinners: 0, document: ["retry.js", "WORKING", "Working"], card: ["Cancel", "Accept all (10)", "Start all (2)", "Stop all (8)"], card_Document: ["Accept all (7)", "Stop all (8)"], isSticky: true })
  expect(header_Done).toEqual({ task: ["Tidy the retry loop", "YOUR_TURN", "Your turn"], parts: [], spinners: 0, document: ["retry.js", "YOUR_TURN", "Your turn"], card: ["Cancel", "Accept all (12)", "Start all (2)"], card_Document: ["Accept all (9)"], isSticky: true })
  expect(logged_Stopped).toEqual([{ stopped: "TASK", requests: 3 }, { revising: "hook, timeout, document", requests: 8 }, { revised: "hook, timeout, document" }])
  expect(opened_JavaScript.errors).toEqual([])
})

test("a round that landed after your edits: stale, its item says, written before your edits, with Run again, its lines drawn as it was written on them, numbered, above the file's, unnumbered; pressed, asked of the host, which starts it again, the proposal revising, nothing to run again while it's under way; its round back, written on the document as it is now, nothing marked", () => {
  const lines_Paired = [["WRITTEN_ON", "1"], ["WRITTEN_ON", "2"], ["MOVED_SINCE", ""], ["MOVED_SINCE", ""]]
  expect(stale_Landed).toEqual({ state: "OPEN", stale: "Stale · written before your editsRun again", lines: lines_Paired })
  expect(stale_Rerunning).toEqual({ state: "REVISING", stale: "Stale · written before your edits", lines: lines_Paired })
  expect(stale_Again).toEqual({ state: "OPEN", stale: null, lines: [] })
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
// solid line under it, showing, blinking as the caret does, and no fill
// behind it, which inside a ring
// would read as the ring filled, an accepted proposal's
const litOf_Words = () => opened_JavaScript.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return [...document.querySelectorAll(".text_htmlView > [data-lit]")].map((element) => {
    const rect = element.getBoundingClientRect()
    const isLined = [...element.closest(".run_htmlView")?.querySelectorAll(".underlay_htmlView[data-underline][data-lit]") ?? []].some((line) => {
      const rect_Line = line.getBoundingClientRect()
      const style = getComputedStyle(line)
      return style.visibility === "visible" && style.strokeDasharray === "none" && style.animationName === "blink_htmlView" && rect_Line.left <= rect.left + 4 && rect_Line.right >= rect.right - 4 && rect_Line.top > rect.bottom - 3 && rect_Line.top < rect.bottom + 8
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
  expect(menu_Words.choices.filter((choice) => choice?.includes(": Request")).slice(0, 2)).toEqual(["Proposal: Request revision, with selection", "File: Request change, with selection"])
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
  expect(menu_Document.choices.filter((choice) => choice?.includes(": Request"))).toEqual(["File: Request change", "Task: Request change"])
  expect(menu_Document.focused).toBe("File: Request change")
  expect(isClosed_Menu).toBe(true)
  expect(menu_Keyboard.choices.filter((choice) => choice?.includes(": Request"))).toEqual(["File: Request change", "Task: Request change"])
  expect(menu_Keyboard.focused).toBe(menu_Document.focused)
  expect(asked_Menu).toEqual([
    { asked: "revise", proposal: "aborted", notes: "Check it before the delay too.", words: "aborted" },
    { requested: "Say why the delay doubles.", words: null }
  ])
  expect(opened_JavaScript.errors).toEqual([])
})

test("a request on no proposal, the document's own, queued and listed in the document's card, as a proposal's are under its item, its heading and its rule in the same plum; Add, at the foot of the document's requests, Revise gone, there being some, a form for the whole document there, under it, the card held open, the keyboard in it, Add and Cancel, no Start, the group having its own, the keyboard back on Add after; added, then started by its own Start, in progress, the rest still queued; addressed, still listed, saying by how many proposals, here none, nothing to remove; a queued one removed, gone", () => {
  expect(requests_Added).toEqual(["Say why the delay doubles. (queued)"])
  expect(isAskFocused_Document).toBe(true)
  expect(form_Header).toEqual({ isInCard: true, isReviseGone: true, isCardShown: true, label: "Revise this file", actions: ["Add", "Cancel"], isFocused: true, isUnder: true })
  expect(requests_Added_Inline).toEqual(["Say why the delay doubles. (queued)", "Name the module's exports. (queued)"])
  expect(label_Requests).toEqual(["Requests", true, "solid"])
  expect(requests_Started).toEqual(["Say why the delay doubles. (queued)", "Name the module's exports. (running)"])
  expect(requests_Done).toEqual(["Say why the delay doubles. (queued)", "Name the module's exports. (done · nothing to change)"])
  expect(requests_Removed).toEqual(["Name the module's exports. (done · nothing to change)"])
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
  expect(starts_Resting).toEqual({ group: false, actions: false, more: "hidden" })
  expect(starts_Label).toEqual({ group: false, actions: false, more: "hidden" })
  expect(starts_Group).toEqual({ group: true, actions: false, more: "hidden" })
  expect(starts_Words).toEqual({ group: false, actions: false, more: "block" })
  expect(starts_Request).toEqual({ group: false, actions: true, more: "none" })
  expect(scopes_Group).toEqual(["TASK START", "TASK_REQUESTS START", "DOCUMENT START", "DOCUMENT_REQUESTS START"])
  expect(started_Document).toEqual([{ revising: "document", requests: 2 }])
  expect(started_Task).toEqual([{ revising: "document", requests: 2 }, { revising: "task", requests: 2 }])
  expect(started_All.slice(2)).toEqual([{ revising: "aborted, README.md 4, document, task", requests: 4 }])
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
  expect(stop_Stopped).toEqual({ progress: "queued", controls: ["Edit", "Start", "Remove"] })
  expect(card_Kept).toBe(true)
  expect(head_Running).toEqual(["Stop", "Add"])
  expect(stop_Group).toEqual({ progress: "queued", controls: ["Edit", "Start", "Remove"] })
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
  expect(rows_Before.find((row) => row.name === "README.md")).toEqual({ name: "README.md", value: "2 of 6 decided", actions: ["Accept all (4)"] })
  expect(rows_Before.find((row) => row.name === "retry.js")?.actions.every((action) => action?.startsWith("Accept all ("))).toBe(true)
  expect(rows_After.find((row) => row.name === "README.md")).toEqual({ name: "README.md", value: "6 of 6 decided", actions: [] })
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

// then where the cards open: the document's, at the header's end, hugging
// the editor's right edge, the header's, with no edge of its own there,
// its top on the header's bottom edge, level with the task's card's,
// which opens at the header's start, its content flush with the text
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
    isLevel: card.getBoundingClientRect().top === card_Task.getBoundingClientRect().top,
    isFromText: Math.abs(card_Task.getBoundingClientRect().left + parseFloat(getComputedStyle(card_Task).borderLeftWidth) + parseFloat(getComputedStyle(card_Task).paddingLeft) - (header.getBoundingClientRect().left + parseFloat(getComputedStyle(header).paddingLeft))) < 0.6
  }
})

test("the document's card hugs the editor's right edge, no edge of its own there, its top on the header's edge, level with the task's, whose content's flush with the text", () => {
  expect(hugged_Card).toEqual({ gap_Right: 0, gap_Top: 0, edge_Right: "0px", isLevel: true, isFromText: true })
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

// then, the room made above the first line by a move's note's jump, a
// request's words shown from the document's card, its "lines 29–30"
// pressed: the document goes to them, the room taken back once it's
// there, not as it starts, which, setting where the document's scrolled,
// had stopped it a pixel or two along, again at each press
await opened_Dense.page.locator(note_Moved).scrollIntoViewIfNeeded()
await stilled_Dense()
await landedOf_Dense(note_Moved, note_From)
const room_Shown = await opened_Dense.page.evaluate(() => {
  const scroller = document.querySelector(".document_htmlView")
  return scroller === null ? null : parseFloat(getComputedStyle(scroller, "::before").height)
})
await opened_Dense.page.hover(".trigger_Document_htmlView")
await stilled_Dense()
await opened_Dense.page.locator(".card_Document_htmlView .said_htmlView[data-request=\"asked-4\"] .show_Said_htmlView").click()
await stilled_Dense()
const shown_Room = await opened_Dense.page.evaluate(() => {
  const scroller = document.querySelector(".document_htmlView")
  const line = document.querySelector(".underlay_htmlView[data-underline][data-running]")
  if (scroller === null || line === null) return null
  const rect_Scroller = scroller.getBoundingClientRect()
  const rect_Line = line.getBoundingClientRect()
  return {
    isShown: rect_Line.top >= rect_Scroller.top && rect_Line.bottom <= rect_Scroller.bottom,
    above: parseFloat(getComputedStyle(scroller, "::before").height)
  }
})

test("with room made above the first line by a jump, a request's words shown from the document's card are gone to, the room taken back once the document's there, not as it starts, which stopped it a pixel or two along", () => {
  expect(room_Shown).toBeGreaterThan(0)
  expect(shown_Room).toEqual({ isShown: true, above: 0 })
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

await opened_Dense.close()
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
    isOnText: document.activeElement?.matches(".input_htmlView") === true,
    // the line under them, read at points in its blinks: on, off, on, then
    // settled off, the request's dotted line showing; hidden while the
    // words are lit, the pointer on the row, its blinks the lit line's
    isShownHidden: [...document.querySelectorAll(".underlay_htmlView[data-underline][data-shown]")].every((line) => getComputedStyle(line).visibility === "hidden"),
    blinks: [...document.querySelectorAll(".underlay_htmlView[data-underline][data-shown]")].map((line) => {
      const [animation] = line.getAnimations()
      animation?.pause()
      return [0, 600, 1200, 1700].map((time) => {
        if (animation !== undefined) animation.currentTime = time
        return getComputedStyle(line).opacity
      }).join(" ")
    })
  }
})
await opened_Tiers.page.waitForFunction(() => document.querySelector(".text_htmlView > [data-shown]") === null)
// the jump's blinks over, the pointer still on the request's row, though
// the keyboard's gone back to the text: its words still lit, blinking
const isLit_After_Shown = await opened_Tiers.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const line = document.querySelector(".underlay_htmlView[data-underline][data-lit]")
  return line !== null && getComputedStyle(line).animationName === "blink_htmlView"
})
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

await opened_Tiers.close()
describe("the menu's tiers", () => {
  test("a right-click on a proposal's selected words offers the proposal's, the document's and the task's tiers, the narrowest first, a hairline between each, each its proposal actions first, then its revisions', the keyboard on the first request; each request has the words with it, which the form quotes, and × leaves out; sent, the host's told what it's on and the words, and the document's card lists it with them, and where they are, which, pressed, scrolls the document to them, their line solid a moment, blinking twice as the caret does, then settling back to dotted, the keyboard back on the text, and blinking on while the pointer's still on the request's row", () => {
    expect(menu_Tiers.map((choice) => choice === "—" ? choice : choice.slice(0, choice.indexOf(" "))).filter((tier, index, tiers) => tier !== tiers[index - 1])).toEqual(["PROPOSAL", "—", "DOCUMENT", "—", "TASK"])
    expect(menu_Tiers.filter((choice) => choice !== "—").every((choice) => /^(PROPOSAL Proposal|DOCUMENT File|TASK Task): /.test(choice))).toBe(true)
    expect(sections_Tiers.filter((section, index, sections) => section !== sections[index - 1])).toEqual(["PROPOSAL PROPOSALS", "PROPOSAL REVISIONS", "DOCUMENT PROPOSALS", "DOCUMENT REVISIONS", "TASK PROPOSALS", "TASK REVISIONS"])
    expect(focused_Tiers).toBe("Proposal: Request revision, with selection")
    expect(menu_Tiers.filter((choice) => choice.includes(": Request"))).toEqual([
      "PROPOSAL Proposal: Request revision, with selection",
      "DOCUMENT File: Request change, with selection",
      "TASK Task: Request change, with selection"
    ])
    expect(menu_Tiers.filter((choice) => choice.startsWith("PROPOSAL ") && !choice.includes(": Request"))).toEqual(["PROPOSAL Proposal: Accept", "PROPOSAL Proposal: Reject"])
    expect(menu_Tiers.filter((choice) => choice.startsWith("DOCUMENT ") && !choice.includes(": Request")).every((choice) => /^DOCUMENT File: (Accept|Start|Stop) all \(\d+\)$/.test(choice))).toBe(true)
    expect(menu_Tiers.filter((choice) => choice.startsWith("TASK ") && !choice.includes(": Request")).every((choice) => /^TASK Task: (Accept|Start|Stop) all \(\d+\)$/.test(choice))).toBe(true)
    expect(menu_Tiers.some((choice) => /^DOCUMENT File: Accept all \(\d+\)$/.test(choice))).toBe(true)
    expect(form_Referring).toEqual({ label: "File retry.js", subject: "retry.js", quote: ["aborted", true], isFocused: true })
    expect(referred_Document.filter((said) => said[0] === "Check for an abort everywhere it waits.")).toEqual([["Check for an abort everywhere it waits.", "aborted", "line 21"]])
    expect(shown_Document).toEqual({ words: ["aborted"], isInView: true, isOnText: true, isShownHidden: true, blinks: ["1 0 1 0"] })
    expect(isLit_After_Shown).toBe(true)
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
  return element$_Quoted.length > 0 && line$_Quoted.length > 0 && line$_Quoted.every((line) => getComputedStyle(line).visibility === "visible" && getComputedStyle(line).animationName === "blink_htmlView") && element$_Quoted.every((element) => getComputedStyle(element).backgroundColor === "rgba(0, 0, 0, 0)")
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

await opened_Popover.close()
describe("the menu's form's words", () => {
  test("the form opened for words selected over three lines opens just below them, clear of them; they're shown in it by their start, cut, and how many lines; pointed at, they're lit where they are in the file, not peeked at while they can all be seen there; the first of them scrolled away, a moment after pointing, peeked at, gone when the pointer leaves", () => {
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

// the JavaScript example, on a page of its own, switched: its header's
// chevron, after the task's name, opening the switcher's card, never with
// the task's, each the one pointed at; the project's tasks listed in it,
// the one the editor's in first, saying so, then those on retry.js, then
// the rest, then No task; the footer counting them by what they're waiting
// on; No task pressed, the host asked, the editor in manual, the file
// itself, nothing proposed, the keyboard back in the text; a line typed
// there, then the task pressed, the editor in it again, its proposals
// carried across the line, which is still there
const opened_Switch = await openExample(
  "javascript",
  1
)
await opened_Switch.page.waitForSelector(".note_htmlView")
const cardsOf_Switch = () => opened_Switch.page.evaluate(() => [".card_Task_htmlView", ".card_Switcher_htmlView"].map((selector) => {
  const element = document.querySelector(selector)
  return element === null ? "none" : getComputedStyle(element).visibility
}))
const footer_Switch = await opened_Switch.page.evaluate(() => ({
  counts: [...document.querySelectorAll(".count_Footer_htmlView")].map((count) => `${count.getAttribute("data-kind")} ${count.textContent}`),
  title: document.querySelector(".tasks_Footer_htmlView")?.getAttribute("title") ?? null
}))
await opened_Switch.page.hover(".trigger_Switcher_htmlView")
await opened_Switch.page.waitForTimeout(400)
const cards_Chevron = await cardsOf_Switch()
const options_Switch = await opened_Switch.page.evaluate(() => [...document.querySelectorAll(".choice_Switcher_htmlView")].map((choice) => [
  choice.getAttribute("data-switch"),
  choice.querySelector(".label_Option_htmlView")?.textContent,
  [...choice.querySelectorAll(".part_Option_htmlView")].map((part) => part.textContent).join(" · "),
  choice.hasAttribute("aria-current") ? "here" : ""
].join(" | ")))
await opened_Switch.page.hover(".trigger_Task_htmlView")
await opened_Switch.page.waitForTimeout(400)
const cards_Name = await cardsOf_Switch()
await opened_Switch.page.hover(".trigger_Switcher_htmlView")
await opened_Switch.page.waitForTimeout(300)
await opened_Switch.page.click(".choice_Switcher_htmlView[data-switch=\"MANUAL\"]")
await opened_Switch.page.mouse.move(5, 5)
await opened_Switch.page.waitForTimeout(500)
const manual_Switch = await opened_Switch.page.evaluate(() => ({
  name: document.querySelector(".manual_Header_htmlView .name_Manual_htmlView")?.textContent ?? null,
  frames: document.querySelectorAll(".frame_htmlView").length,
  focus: document.activeElement?.className ?? null,
  card: getComputedStyle(document.querySelector(".card_Switcher_htmlView") ?? document.body).visibility,
  logged: window.logged.at(-1) ?? null
}))
await opened_Switch.page.click(".line_htmlView .text_htmlView", { position: { x: 2, y: 5 } })
await opened_Switch.page.keyboard.type("// typed in manual\n")
await opened_Switch.page.hover(".trigger_Switcher_htmlView")
await opened_Switch.page.waitForTimeout(300)
await opened_Switch.page.click(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-12\"]")
await opened_Switch.page.mouse.move(5, 5)
await opened_Switch.page.waitForTimeout(500)
const back_Switch = await opened_Switch.page.evaluate(() => ({
  name: document.querySelector(".task_Header_htmlView .name_Task_htmlView")?.textContent ?? null,
  frames: document.querySelectorAll(".frame_htmlView").length,
  first: document.querySelector(".line_htmlView .text_htmlView")?.textContent ?? null,
  logged: window.logged.at(-1) ?? null
}))

test("a chevron after the task's name opens the switcher's card, never with the task's: the project's tasks, the editor's first, then those on its document, then the rest, then No task; the footer counting them; No task pressed, the editor's in manual, the file itself, the keyboard in the text; a line typed, the task pressed, it's back, its proposals carried across the line", () => {
  expect(footer_Switch).toEqual({ counts: ["YOURS 4", "WORKING 2", "DRAFTS 1"], title: "6 tasks: 4 need you, 2 working, 1 draft" })
  expect(cards_Chevron).toEqual(["hidden", "visible"])
  expect(cards_Name).toEqual(["visible", "hidden"])
  expect(options_Switch).toEqual([
    "TASK | Tidy the retry loop | 14 to decide · 3 running | here",
    "TASK | Log each retry | 1 running | ",
    "TASK | Rename attempts to tries | 1 queued | ",
    "TASK | Name the retry options | 2 queued | ",
    "TASK | Add a timeout option | 2 queued | ",
    "TASK | Say what the README promises | applicable | ",
    "MANUAL | No task |  | "
  ])
  expect(manual_Switch).toEqual({ name: "No task", frames: 0, focus: "input_htmlView", card: "hidden", logged: { switched: "MANUAL" } })
  expect(back_Switch).toEqual({ name: "Tidy the retry loop", frames: 7, first: "// typed in manual", logged: { switched: "T-12" } })
  expect(opened_Switch.errors).toEqual([])
})

// then the header's two halves, measured as drawn: the task's at the
// start, where the text starts, its name, a hairline, the switcher's
// arrows; the file's at the end, its name, a hairline, its files icon;
// the task's two cards' content flush with the text,
// the file's two hugging the editor's right edge
await opened_Switch.page.mouse.move(5, 5)
await opened_Switch.page.waitForTimeout(300)
const rhythm_Header = await opened_Switch.page.evaluate(() => {
  const header = document.querySelector(".header_htmlView")!.getBoundingClientRect()
  const inkOf = (selector: string) => {
    const range = document.createRange()
    range.selectNodeContents(document.querySelector(selector)!)
    return range.getBoundingClientRect()
  }
  const iconOf = (selector: string, inset: number) => {
    const element = document.querySelector(selector)!
    const box = element.getBoundingClientRect()
    const size = parseFloat(getComputedStyle(element, "::before").width)
    return { left: box.left + (box.width - size) / 2 + size * inset / 16, centre: box.left + box.width / 2 }
  }
  const boxOf = (selector: string) => document.querySelector(selector)!.getBoundingClientRect()
  const contentOf = (selector: string) => {
    const element = document.querySelector(selector)!
    return element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).borderLeftWidth) + parseFloat(getComputedStyle(element).paddingLeft)
  }
  const r = (value: number) => Math.round(value * 10) / 10
  const nameTask = inkOf(".name_Task_htmlView")
  const arrows = iconOf(".trigger_Switcher_htmlView", 2.5)
  const nameDocument = inkOf(".name_Document_htmlView")
  const files = iconOf(".trigger_Picker_htmlView", 3)
  const start_Text = header.left + parseFloat(getComputedStyle(document.querySelector(".header_htmlView")!).paddingLeft)
  return {
    order: [nameTask.right < arrows.left, arrows.centre < nameDocument.left, nameDocument.right < files.left],
    textStart: r(nameTask.left - start_Text),
    cards: [
      r(contentOf(".card_Task_htmlView") - start_Text),
      r(contentOf(".card_Switcher_htmlView") - start_Text),
      r(header.right - boxOf(".card_Document_htmlView").right),
      r(header.right - boxOf(".card_Picker_htmlView").right)
    ]
  }
})
// the picker, beside the document's card, never open with it: the task's
// files, the one shown here, then the others; one pressed, the host's
// asked to open it, the keyboard back in the text; and a task's file
// pressed in its card
await opened_Switch.page.hover(".trigger_Picker_htmlView")
await opened_Switch.page.waitForTimeout(400)
const cards_Picker = await opened_Switch.page.evaluate(() => [".card_Document_htmlView", ".card_Picker_htmlView"].map((selector) => getComputedStyle(document.querySelector(selector)!).visibility))
const files_Picker = await opened_Switch.page.evaluate(() => [...document.querySelectorAll(".card_Picker_htmlView section")].map((section) => [
  section.querySelector(".label_Card_htmlView")?.textContent,
  ...[...section.querySelectorAll(".choice_Picker_htmlView")].map((choice) => `${choice.getAttribute("data-path")}${choice.hasAttribute("aria-current") ? " here" : ""}`)
]))
await opened_Switch.page.click(".choice_Picker_htmlView[data-path=\"README.md\"]")
await opened_Switch.page.mouse.move(5, 5)
await opened_Switch.page.waitForTimeout(300)
const opened_Picker = await opened_Switch.page.evaluate(() => ({ logged: window.logged.at(-1) ?? null, focus: document.activeElement?.className ?? null }))
await opened_Switch.page.hover(".trigger_Task_htmlView")
await opened_Switch.page.waitForTimeout(400)
await opened_Switch.page.click(".document_Card_htmlView:not([aria-current]) .open_Document_Card_htmlView[data-path=\"README.md\"]")
await opened_Switch.page.mouse.move(5, 5)
await opened_Switch.page.waitForTimeout(300)
const opened_Card = await opened_Switch.page.evaluate(() => window.logged.at(-1) ?? null)

test("the header's halves on one rhythm, measured as drawn: the task's at the start, where the text starts, its switcher after it; the file's at the end; the task's name and its cards' content flush with the text, the file's cards hugging the right edge", () => {
  expect(rhythm_Header.order).toEqual([true, true, true])
  expect(Math.abs(rhythm_Header.textStart)).toBeLessThan(0.6)
  for (const offset of rhythm_Header.cards) expect(Math.abs(offset)).toBeLessThan(0.6)
})

test("the files icon opens the picker, never with the document's card: the task's files, the one shown here, then the project's others; one pressed asks the host to open it, the keyboard back in the text; a task's file pressed in its card asks the same", () => {
  expect(cards_Picker).toEqual(["hidden", "visible"])
  expect(files_Picker).toEqual([
    ["Files in task", "retry.js here", "README.md"],
    ["Other files", "CHANGELOG.md", "package.json", "source/backoff.js", "tests/retry.test.js"]
  ])
  expect(opened_Picker).toEqual({ logged: { opened: "README.md" }, focus: "input_htmlView" })
  expect(opened_Card).toEqual({ opened: "README.md" })
  expect(opened_Switch.errors).toEqual([])
})

// then each hairline where it's meant to be, between the ink either side
// of it, as drawn, read from the page's pixels at four times their size,
// each edge to the fraction of a pixel its ink covers: the task's 13.2px
// before it, to within half a pixel by the name, and 13px
// after, roomier by eye than even, as its bold name reads closer than the
// arrows' light line ends, one step of 1.25 tighter than the file's;
// the file's name's ink, its hairline, its icon's ink and the header's
// right edge evenly spaced, 17px apart; a name's last letter keeps room past its
// ink, so no box says where the ink is; every shimmer held at rest
const opened_Ink = await openExample(
  "javascript",
  4
)
await opened_Ink.page.waitForSelector(".note_htmlView")
await opened_Ink.page.mouse.move(5, 5)
const inkAround = async (selector_Name: string, selector_Part: string, selector_End: string) => {
  const scale = 4
  const box = await opened_Ink.page.evaluate(({ selector_Name, selector_Part, selector_End }) => {
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSAnimation && animation.animationName === "shimmer_htmlView") {
        animation.pause()
        animation.currentTime = 2400
      }
    }
    const range = document.createRange()
    range.selectNodeContents(document.querySelector(selector_Name)!)
    const name = range.getBoundingClientRect()
    const part = document.querySelector(selector_Part)!
    const header = document.querySelector(".header_htmlView")!.getBoundingClientRect()
    const x = Math.floor(name.right) - 8
    return {
      x,
      y: Math.floor(header.top) + 4,
      width: Math.ceil(document.querySelector(selector_End)!.getBoundingClientRect().right) - x,
      height: Math.floor(header.height) - 8,
      hairline: part.getBoundingClientRect().left + parseFloat(getComputedStyle(part, "::before").marginLeft) - x
    }
  }, { selector_Name, selector_Part, selector_End })
  const png = await opened_Ink.page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } })
  const dark = await opened_Ink.page.evaluate(async (base64) => {
    const image = new Image()
    image.src = `data:image/png;base64,${base64}`
    await image.decode()
    const canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext("2d")!
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, image.width, image.height).data
    const ground = (pixels[0] ?? 0) + (pixels[1] ?? 0) + (pixels[2] ?? 0)
    return Array.from({ length: image.width }, (_, x) => Math.max(...Array.from({ length: image.height }, (_, y) => (y * image.width + x) * 4).map((at) => ground - (pixels[at] ?? 0) - (pixels[at + 1] ?? 0) - (pixels[at + 2] ?? 0))))
  }, png.toString("base64"))
  const hairline = Math.round(box.hairline * scale)
  const columnsWhere = (isPart: (x: number) => boolean) => dark.flatMap((value, x) => isPart(x) && value > 6 ? [x] : [])
  const columns_Name = columnsWhere((x) => x < hairline - 2)
  const columns_Hairline = columnsWhere((x) => x >= hairline - 2 && x <= hairline + scale + 1)
  const columns_Icon = columnsWhere((x) => x > hairline + scale + 1)
  const coverOf = (x: number, columns: Array<number>) => (dark[x] ?? 0) / Math.max(...columns.map((each) => dark[each] ?? 0))
  const rightOf = (columns: Array<number>) => (columns.at(-1) ?? 0) + coverOf(columns.at(-1) ?? 0, columns)
  const leftOf = (columns: Array<number>) => (columns[0] ?? 0) + 1 - coverOf(columns[0] ?? 0, columns)
  return [
    (leftOf(columns_Hairline) - rightOf(columns_Name)) / scale,
    (leftOf(columns_Icon) - rightOf(columns_Hairline)) / scale,
    (dark.length - rightOf(columns_Icon)) / scale
  ].map((gap) => Math.round(gap * 100) / 100)
}
const ink_File = await inkAround(".name_Document_htmlView", ".picker_Header_htmlView", ".header_htmlView")
const ink_Task = await inkAround(".name_Task_htmlView", ".switcher_Header_htmlView", ".switcher_Header_htmlView")

await opened_Ink.close()
test("each hairline where it's meant to be between the ink either side of it, as drawn: the task's 13.2px before it and 13px after, one step of 1.25 tighter than the file's; the file's name, hairline, icon and the right edge evenly spaced, 17px apart", () => {
  const [before_File = 0, after_File = 0, edge_File = 0] = ink_File
  const [before_Task = 0, after_Task = 0] = ink_Task
  expect(Math.abs(before_Task - 13.2)).toBeLessThan(0.5)
  expect(Math.abs(after_Task - 13)).toBeLessThan(0.25)
  for (const gap of [before_File, after_File, edge_File]) expect(Math.abs(gap - 17)).toBeLessThan(0.25)
  expect(opened_Ink.errors).toEqual([])
})

// then the task's state said by its name, the header having no mark for
// it, nor for manual: working, the name shimmering, or, where motion's
// asked to be reduced, Working shown after it; a draft, leaning, in the
// name's own ink, no word after it, as no other state has one; your turn,
// the name as it rests
const nameShown = () => opened_Switch.page.evaluate(async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const trigger = document.querySelector(".trigger_Task_htmlView")!
  const name = trigger.querySelector(".name_Task_htmlView")!
  const word = trigger.querySelector(".state_Task_htmlView")!
  return {
    name: name.textContent,
    marks: document.querySelectorAll(".header_htmlView > :is(.task_Header_htmlView, .manual_Header_htmlView) :is(.mark_Task_htmlView, .mark_Manual_htmlView)").length,
    shimmers: name.getAnimations().flatMap((animation) => animation instanceof CSSAnimation ? [animation.animationName] : []),
    isFaded: getComputedStyle(name).color !== getComputedStyle(document.querySelector(".htmlView_editor")!).color,
    isLeaning: getComputedStyle(name).fontStyle === "italic",
    word: word.getBoundingClientRect().width > 2 ? word.textContent : null
  }
})
const switchedTo = async (id: string) => {
  await opened_Switch.page.hover(".trigger_Switcher_htmlView")
  await opened_Switch.page.waitForTimeout(300)
  await opened_Switch.page.click(`.choice_Switcher_htmlView[data-switch="TASK"][data-id="${id}"]`)
  await opened_Switch.page.mouse.move(5, 5)
  await opened_Switch.page.waitForTimeout(500)
}
const name_Working = await nameShown()
await opened_Switch.page.emulateMedia({ reducedMotion: "reduce" })
const name_Still = await nameShown()
await opened_Switch.page.emulateMedia({ reducedMotion: "no-preference" })
await switchedTo("T-16")
const name_Draft = await nameShown()
await switchedTo("T-14")
const name_Yours = await nameShown()

await opened_Switch.close()
test("the task's state said by its name, with no mark: working, shimmering, or Working shown where motion's asked to be reduced; a draft, leaning, in the name's own ink, no word after it; your turn, as it rests", () => {
  expect(name_Working).toEqual({ name: "Tidy the retry loop", marks: 0, shimmers: ["shimmer_htmlView"], isFaded: false, isLeaning: false, word: null })
  expect(name_Still).toEqual({ name: "Tidy the retry loop", marks: 0, shimmers: [], isFaded: false, isLeaning: false, word: "Working" })
  expect(name_Draft).toEqual({ name: "Add a timeout option", marks: 0, shimmers: [], isFaded: false, isLeaning: true, word: null })
  expect(name_Yours).toEqual({ name: "Say what the README promises", marks: 0, shimmers: [], isFaded: false, isLeaning: false, word: null })
  expect(opened_Switch.errors).toEqual([])
})

// the board, every task in the project, under the editor, hidden till the
// editor's footer is pressed, as a host shows a view: a column for each of
// who a task's waiting on, side by side, and one under another where the
// board's narrow, by its own width; each task a line, its name and its
// most pressing figure, what else it says always under it, its text
// flush with its column's heading; never
// scrolling as a whole, each
// column's tasks scrolling on their own where they're side by side, the
// columns together under its head where they're not; a task pressed switches the editor to
// it, its tile marked as shown; one canceled from behind its ···, resolved,
// the editor in it going to manual; a draft started from behind its ···,
// working, then, with
// no agent, its requests answered with nothing to change, applicable;
// Delete, in Resolved's heading, taking every resolved task away, for good; each asked of the host, which
// reports it; and pressed again, the footer hides it
const opened_Board = await openExample(
  "javascript",
  1
)
await opened_Board.page.waitForSelector(".note_htmlView")
const boardShown = () => opened_Board.page.evaluate(() => ({
  hidden: (document.querySelector(".stage > .board") as HTMLElement | null)?.hidden ?? null,
  columns: [...document.querySelectorAll(".column_Board_htmlView")].map((column) => `${column.getAttribute("data-kind")}: ${[...column.querySelectorAll(".tile_htmlView, .row_Resolved_htmlView")].map((tile) => `${tile.getAttribute("data-id")}${tile.hasAttribute("data-shown") ? " shown" : ""}`).join(" ")}`),
  mode: document.querySelector(".header_htmlView :is(.name_Task_htmlView, .name_Manual_htmlView)")?.textContent ?? null
}))
const board_Before = await boardShown()
await opened_Board.page.click(".tasks_Footer_htmlView")
await opened_Board.page.waitForTimeout(200)
const board_Shown = await boardShown()
// each column's mark after its heading's words and before how many, as
// the footer has it; with the agent's turning; a running part shimmering
const marks_Board = await opened_Board.page.evaluate(() => [...document.querySelectorAll(".column_Board_htmlView")].map((column) => {
  const label = column.querySelector(".label_Column_htmlView")!
  const mark = label.querySelector(".mark_Column_htmlView")
  const range = document.createRange()
  range.selectNodeContents(label.firstChild!)
  const words = range.getBoundingClientRect()
  const count = label.querySelector(".count_Column_htmlView")!.getBoundingClientRect()
  return mark === null
    ? `${column.getAttribute("data-kind")}: none`
    : `${column.getAttribute("data-kind")}: ${words.right <= mark.getBoundingClientRect().left && mark.getBoundingClientRect().right <= count.left ? "between" : "out of place"}${getComputedStyle(mark, "::before").animationName === "none" ? "" : " turning"}`
}))
const shimmer_Running = await opened_Board.page.evaluate(() => document.querySelector(".tile_htmlView[data-id=\"T-13\"] .part_Tile_htmlView[data-kind=\"AGENT\"]")?.getAnimations().map((animation) => animation instanceof CSSAnimation ? animation.animationName : "") ?? [])
const tracks_Board = (width: string) => opened_Board.page.evaluate((width) => {
  const board = document.querySelector(".stage > .board") as HTMLElement
  board.style.width = width
  return getComputedStyle(document.querySelector(".columns_Board_htmlView")!).gridTemplateColumns.split(" ").length
}, width)
const scrollOf_Board = () => opened_Board.page.evaluate(() => {
  const scrolls = (element: Element) => ["auto", "scroll"].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight
  return {
    board: scrolls(document.querySelector(".htmlView_board")!),
    columns: scrolls(document.querySelector(".columns_Board_htmlView")!),
    lists: [...document.querySelectorAll(".tiles_Column_htmlView, .rows_Resolved_htmlView")].filter((list) => scrolls(list)).map((list) => list.closest(".column_Board_htmlView")?.getAttribute("data-kind") ?? null)
  }
})
// a task, its name, and under it its parts and the file the editor's
// showing, if it touches it, and no other; its ⋮ hidden, its room kept;
// pointed at, its ⋮ shown, and nothing moving, the task under it where
// it was
const tileShown = () => opened_Board.page.evaluate(() => {
  const tile = document.querySelector(".tile_htmlView[data-id=\"T-14\"]")!
  const details = tile.querySelector(".details_Tile_htmlView")!
  return {
    line: tile.querySelector(".switch_Tile_htmlView")?.textContent ?? null,
    height: Math.round(tile.querySelector(".line_Tile_htmlView")!.getBoundingClientRect().height),
    more: getComputedStyle(tile.querySelector(".trigger_More_htmlView")!).opacity === "0" ? "hidden" : "visible",
    details: getComputedStyle(details).display === "none" ? null : details.textContent,
    next: Math.round(document.querySelector(".tile_htmlView[data-id=\"T-15\"]")!.getBoundingClientRect().top)
  }
})
await opened_Board.page.mouse.move(5, 5)
const tile_Resting = await tileShown()
await opened_Board.page.hover(".tile_htmlView[data-id=\"T-14\"] .switch_Tile_htmlView")
const tile_Pointed = await tileShown()
const details_Others = await opened_Board.page.evaluate(() => ["T-15", "T-12", "T-16", "T-14"].map((id) => document.querySelector(`.tile_htmlView[data-id="${id}"] .details_Tile_htmlView`)?.textContent ?? null))
await opened_Board.page.mouse.move(5, 5)
const heightOf_Board = (height: string) => opened_Board.page.evaluate((height) => {
  (document.querySelector(".stage > .board") as HTMLElement).style.height = height
}, height)
await heightOf_Board("150px")
// each column's first task's text against its heading's, flush
const flushOf_Board = () => opened_Board.page.evaluate(() => [...document.querySelectorAll(".column_Board_htmlView")].map((column) => {
  const startOf = (element: Element | null) => {
    if (element === null) return Number.NaN
    const range = document.createRange()
    range.selectNodeContents(element)
    return range.getClientRects()[0]?.left ?? Number.NaN
  }
  return Math.round(Math.abs(startOf(column.querySelector(".name_Tile_htmlView, .name_Row_htmlView")) - startOf(column.querySelector(".label_Column_htmlView"))) * 10) / 10
}))
const tracks_Wide = await tracks_Board("")
const scroll_Wide = await scrollOf_Board()
const flush_Wide = await flushOf_Board()
const tracks_Narrow = await tracks_Board("300px")
const scroll_Narrow = await scrollOf_Board()
const flush_Narrow = await flushOf_Board()
await tracks_Board("")
await heightOf_Board("")
await opened_Board.page.click(".tile_htmlView[data-id=\"T-15\"] .switch_Tile_htmlView")
await opened_Board.page.waitForTimeout(300)
const board_Switched = await boardShown()
await opened_Board.page.hover(".tile_htmlView[data-id=\"T-15\"] .switch_Tile_htmlView")
await opened_Board.page.hover(".tile_htmlView[data-id=\"T-15\"] .switch_Tile_htmlView")
await opened_Board.page.click(".tile_htmlView[data-id=\"T-15\"] .trigger_More_htmlView")
await opened_Board.page.click(".tile_htmlView[data-id=\"T-15\"] .menu_Tile_htmlView [data-ask=\"CANCEL\"]")
await opened_Board.page.waitForTimeout(300)
const board_Canceled = await boardShown()
await opened_Board.page.hover(".tile_htmlView[data-id=\"T-16\"] .switch_Tile_htmlView")
await opened_Board.page.hover(".tile_htmlView[data-id=\"T-16\"] .switch_Tile_htmlView")
await opened_Board.page.click(".tile_htmlView[data-id=\"T-16\"] .trigger_More_htmlView")
await opened_Board.page.click(".tile_htmlView[data-id=\"T-16\"] .menu_Tile_htmlView [data-ask=\"START\"]")
await opened_Board.page.waitForTimeout(200)
const board_Started = await boardShown()
await opened_Board.page.waitForTimeout(1800)
const board_Answered = await boardShown()
const figures_Answered = await opened_Board.page.evaluate(() => document.querySelector(".tile_htmlView[data-id=\"T-16\"] .part_Tile_htmlView")?.textContent ?? null)
// Delete folded behind the ellipsis in Resolved's heading, the ellipsis
// becoming it pointed at
const collectOf = () => opened_Board.page.evaluate(() => {
  const fold = document.querySelector(".column_Board_htmlView[data-kind=\"RESOLVED\"] .head_Column_htmlView > .fold_Board_htmlView")
  const button = fold?.querySelector(".collect_Board_htmlView")
  return [button?.textContent ?? null, button?.getAttribute("title") ?? null, getComputedStyle(fold!.querySelector(".more_Board_htmlView")!).display !== "none" ? "ellipsis" : "no ellipsis", getComputedStyle(fold!.querySelector(".folded_Board_htmlView")!).position === "absolute" ? "folded" : "shown"]
})
await opened_Board.page.mouse.move(5, 5)
const collect_Folded = await collectOf()
await opened_Board.page.hover(".fold_Board_htmlView")
const collect_Shown = await collectOf()
await opened_Board.page.click(".collect_Board_htmlView")
await opened_Board.page.waitForTimeout(200)
const board_Collected = await boardShown()
const collect_Placed = await opened_Board.page.evaluate(() => document.querySelector(".column_Board_htmlView[data-kind=\"RESOLVED\"] .collect_Board_htmlView") === null)
const empty_Resolved = await opened_Board.page.evaluate(() => document.querySelector(".column_Board_htmlView[data-kind=\"RESOLVED\"] .empty_Column_htmlView")?.textContent ?? null)
await opened_Board.page.click(".tasks_Footer_htmlView")
await opened_Board.page.waitForTimeout(200)
const board_Hidden = await boardShown()
const logged_Board = (await opened_Board.logged()).filter((entry) => "board" in entry)

await opened_Board.close()
test("the board, from the footer: a column for each of who a task's waiting on, side by side, one under another where it's narrow; scrolling by its columns, never as a whole; a task pressed switches the editor to it; one canceled, resolved, the editor going to manual; a draft started, working, then waiting on you; Collect; each asked of the host", () => {
  expect(board_Before.hidden).toBe(true)
  expect(board_Shown).toEqual({ hidden: false, columns: ["YOURS: T-12 shown T-14 T-15 T-17", "AGENT: T-13", "DRAFTS: T-16", "RESOLVED: T-9 T-11"], mode: "Tidy the retry loop" })
  expect([tracks_Wide, tracks_Narrow]).toEqual([4, 1])
  expect(marks_Board).toEqual(["YOURS: between", "AGENT: between turning", "DRAFTS: between", "RESOLVED: none"])
  expect(shimmer_Running).toEqual(["shimmer_Board_htmlView"])
  expect({ ...scroll_Wide, lists: scroll_Wide.lists.includes("YOURS") }).toEqual({ board: false, columns: false, lists: true })
  expect(scroll_Narrow).toEqual({ board: false, columns: true, lists: [] })
  expect([flush_Wide, flush_Narrow]).toEqual([[0, 0, 0, 0], [0, 0, 0, 0]])
  expect(tile_Resting).toEqual({ ...tile_Pointed, more: "hidden" })
  expect(tile_Pointed).toEqual({ line: "Say what the README promises", height: tile_Resting.height, more: "visible", details: "applicable", next: tile_Resting.next })
  expect(details_Others).toEqual(["1 queuedin file", "14 to decide3 runningin file", "2 queuedin file", "applicable"])
  expect(board_Switched).toEqual({ hidden: false, columns: ["YOURS: T-12 T-14 T-15 shown T-17", "AGENT: T-13", "DRAFTS: T-16", "RESOLVED: T-9 T-11"], mode: "Rename attempts to tries" })
  expect(board_Canceled).toEqual({ hidden: false, columns: ["YOURS: T-12 T-14 T-17", "AGENT: T-13", "DRAFTS: T-16", "RESOLVED: T-9 T-11 T-15"], mode: "No task" })
  expect(board_Started.columns).toEqual(["YOURS: T-12 T-14 T-17", "AGENT: T-13 T-16", "DRAFTS: ", "RESOLVED: T-9 T-11 T-15"])
  expect(board_Answered.columns).toEqual(["YOURS: T-12 T-14 T-17 T-16", "AGENT: T-13", "DRAFTS: ", "RESOLVED: T-9 T-11 T-15"])
  expect(figures_Answered).toBe("applicable")
  expect(collect_Folded).toEqual(["Delete", "Delete every resolved task, for good", "ellipsis", "folded"])
  expect(collect_Shown).toEqual(["Delete", "Delete every resolved task, for good", "no ellipsis", "shown"])
  expect(collect_Placed).toBe(true)
  expect(board_Collected.columns).toEqual(["YOURS: T-12 T-14 T-17 T-16", "AGENT: T-13", "DRAFTS: ", "RESOLVED: "])
  expect(empty_Resolved).toBe("None")
  expect(board_Hidden.hidden).toBe(true)
  expect(logged_Board).toEqual([
    { board: "shown" },
    { board: "SWITCH", tasks: "T-15" },
    { board: "CANCEL", tasks: "T-15" },
    { board: "START", tasks: "T-16" },
    { board: "COLLECT", tasks: "T-9, T-11, T-15" },
    { board: "hidden" }
  ])
  expect(opened_Board.errors).toEqual([])
})

// every ellipsis, a fold's in the document or a card, Resolved's on the
// board, or a board task's ⋮, opening only with the pointer on its disc:
// not just past it, either side, above or below, nor in its square's
// corner, past its circle, nor where a request's actions wait unseen; on
// it, open and steady, not flickering as it steps aside; open while the
// pointer goes across what it opened; shut once the pointer's gone
const opened_Discs = await openExample(
  "javascript",
  1
)
await opened_Discs.page.waitForSelector(".note_htmlView")
const pausedFor = (ms: number) => opened_Discs.page.waitForTimeout(ms)
const openedAround = async (row: string | null, disc: string, opened: string) => {
  const isOpen = () => opened_Discs.page.evaluate((opened) => {
    const element = document.querySelector(opened)
    if (element === null) return false
    const style = getComputedStyle(element)
    return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0" && style.clipPath === "none"
  }, opened)
  await opened_Discs.page.locator(disc).first().scrollIntoViewIfNeeded()
  if (row !== null) {
    const box_Row = await opened_Discs.page.locator(row).first().boundingBox()
    if (box_Row !== null) await opened_Discs.page.mouse.move(box_Row.x + 4, box_Row.y + 4)
    await pausedFor(150)
  }
  const box = await opened_Discs.page.locator(disc).first().boundingBox()
  if (box === null) return "no disc"
  const x_Middle = box.x + box.width / 2
  const y_Middle = box.y + box.height / 2
  const points_Past: Array<[number, number]> = [
    [box.x - 2, y_Middle],
    [box.x + box.width + 2, y_Middle],
    [x_Middle, box.y - 2],
    [x_Middle, box.y + box.height + 2],
    [box.x + 0.8, box.y + 0.8]
  ]
  const past: Array<boolean> = []
  for (const [x, y] of points_Past) {
    await opened_Discs.page.mouse.move(x, y)
    await pausedFor(120)
    past.push(await isOpen())
  }
  await opened_Discs.page.mouse.move(x_Middle, y_Middle)
  await pausedFor(150)
  const on: Array<boolean> = []
  for (let index = 0; index < 5; index++) {
    on.push(await isOpen())
    await pausedFor(50)
  }
  const box_Opened = await opened_Discs.page.locator(opened).first().boundingBox()
  const across: Array<boolean> = []
  if (box_Opened !== null) {
    for (let step = 0; step <= 6; step++) {
      await opened_Discs.page.mouse.move(box_Opened.x + 1 + (box_Opened.width - 2) * step / 6, box_Opened.y + box_Opened.height / 2)
      await pausedFor(60)
      across.push(await isOpen())
    }
  }
  await opened_Discs.page.mouse.move(5, 5)
  await pausedFor(300)
  return [
    past.some(Boolean) ? `opened past it: ${past.map((open) => open ? 1 : 0).join("")}` : "shut past it",
    on.every(Boolean) ? "open on it" : `on it: ${on.map((open) => open ? 1 : 0).join("")}`,
    across.length > 0 && across.every(Boolean) ? "open across" : `across: ${across.map((open) => open ? 1 : 0).join("")}`,
    await isOpen() ? "open after" : "shut after"
  ].join(", ")
}
const fold = (holder: string) => [
  `${holder} > .fold_Action_htmlView > .more_htmlView`,
  `${holder} > .fold_Action_htmlView > .folded_htmlView`
] as const
const opened_Request = await openedAround(".item_htmlView .said_htmlView > .row_Said_htmlView", ...fold(".item_htmlView .said_htmlView > .row_Said_htmlView"))
const opened_Group = await openedAround(null, ...fold(".item_htmlView .head_Request_htmlView"))
await opened_Discs.page.click(".trigger_Document_htmlView")
await opened_Discs.page.waitForSelector(".card_Document_htmlView .said_htmlView")
const opened_Line_Card = await openedAround(null, ...fold(".card_Document_htmlView .line_Card_htmlView"))
const opened_Group_Card = await openedAround(null, ...fold(".card_Document_htmlView .head_Request_htmlView"))
const opened_Request_Card = await openedAround(".card_Document_htmlView .said_htmlView > .row_Said_htmlView", ...fold(".card_Document_htmlView .said_htmlView > .row_Said_htmlView"))
await opened_Discs.page.keyboard.press("Escape")
await opened_Discs.page.click(".tasks_Footer_htmlView")
await pausedFor(200)
const opened_Resolved = await openedAround(null, ".more_Board_htmlView", ".folded_Board_htmlView")
const opened_Tile = await openedAround(".tile_htmlView[data-id=\"T-13\"]", ".tile_htmlView[data-id=\"T-13\"] .trigger_More_htmlView", ".tile_htmlView[data-id=\"T-13\"] .menu_Tile_htmlView")
test("an ellipsis, or a board task's ⋮, opens only with the pointer on its disc: not just past it, nor in its square's corners, nor where a request's actions wait unseen; on it, steady; open across what it opened; shut once the pointer's gone", () => {
  const opened = "shut past it, open on it, open across, shut after"
  expect({
    request: opened_Request,
    group: opened_Group,
    line_Card: opened_Line_Card,
    group_Card: opened_Group_Card,
    request_Card: opened_Request_Card,
    resolved: opened_Resolved,
    tile: opened_Tile
  }).toEqual({
    request: opened,
    group: opened,
    line_Card: opened,
    group_Card: opened,
    request_Card: opened,
    resolved: opened,
    tile: opened
  })
  expect(opened_Discs.errors).toEqual([])
})

// a header's card, the board shown under the editor, making it shorter,
// drawn over the footer, down to the editor's own bottom edge at most,
// never past it, scrolling inside; scrolled with the pointer on its
// requests, each lighting what it quotes as it comes under the pointer,
// redrawing the editor, its scroll kept, its height kept through each
// redraw, never its fallback's for a moment, which had left it 1px of
// scroll and pulled it back to the top
await opened_Discs.page.click(".trigger_Document_htmlView")
await opened_Discs.page.waitForSelector(".card_Document_htmlView .said_htmlView")
await opened_Discs.page.mouse.move(5, 5)
await pausedFor(300)
const card_Shorter = await opened_Discs.page.evaluate(() => {
  const card = document.querySelector(".card_Document_htmlView")!
  const rect_Card = card.getBoundingClientRect()
  const rect_Header = document.querySelector(".header_htmlView")!.getBoundingClientRect()
  const rect_Footer = document.querySelector(".footer_htmlView")!.getBoundingClientRect()
  const rect_Editor = document.querySelector(".htmlView_editor")!.getBoundingClientRect()
  return {
    board: document.querySelector(".stage > .board:not([hidden])") !== null,
    header: Math.round((rect_Card.top - rect_Header.bottom) * 10) / 10,
    editor: Math.round((rect_Editor.bottom - rect_Card.bottom) * 10) / 10,
    overFooter: document.elementFromPoint(rect_Card.left + 8, rect_Footer.top + rect_Footer.height / 2)?.closest(".card_Document_htmlView") === card,
    scrolls: card.scrollHeight > card.clientHeight
  }
})
const box_Said = await opened_Discs.page.locator(".card_Document_htmlView .said_htmlView .notes_Said_htmlView").nth(1).boundingBox()
if (box_Said !== null) await opened_Discs.page.mouse.move(box_Said.x + 10, box_Said.y + box_Said.height / 2)
await pausedFor(200)
await opened_Discs.page.mouse.wheel(0, 60)
await pausedFor(400)
const scrolled_Card = await opened_Discs.page.evaluate(() => Math.round(document.querySelector(".card_Document_htmlView")!.scrollTop))
test("a header's card, the editor made shorter by the board shown under it, drawn over the footer, down to the editor's own bottom edge at most, scrolling inside", () => {
  expect(card_Shorter).toEqual({
    board: true,
    header: -1,
    editor: 0,
    overFooter: true,
    scrolls: true
  })
  expect(scrolled_Card).toBe(60)
})

// a task's menu as a menu button's: Tab from the task's name onto its ⋮,
// the menu not opened; ↓ opening it on its first choice, lit, ↑ on its
// last; ↑ and ↓ going round it, Home and End to its ends; Esc back to
// the ⋮, the menu shut; Enter opening it; Tab out of it, shut; pressed
// with the pointer, not kept open once the pointer's gone
await opened_Discs.page.keyboard.press("Escape")
await opened_Discs.page.mouse.move(5, 300)
await pausedFor(300)
const shownOf_Menu = () => opened_Discs.page.evaluate(() => {
  const element = document.activeElement
  const tile = element?.closest(".tile_htmlView")?.getAttribute("data-id") ?? ""
  const focus = element === null ? "none" : element.matches(".action_Tile_htmlView") ? `${element.textContent}${element.matches(":focus-visible") ? " lit" : ""}` : element.matches(".trigger_More_htmlView") ? "⋮" : element.matches(".switch_Tile_htmlView") ? "name" : element.tagName
  const open = [...document.querySelectorAll(".menu_Tile_htmlView")].filter((menu) => getComputedStyle(menu).visibility === "visible").map((menu) => menu.closest(".tile_htmlView")?.getAttribute("data-id")).join(" ")
  return `${tile} ${focus}, open: ${open === "" ? "none" : open}`
})
const keys_Menu: Array<string> = []
await opened_Discs.page.focus(".tile_htmlView[data-id=\"T-13\"] .switch_Tile_htmlView")
for (const key of ["Tab", "ArrowDown", "ArrowDown", "ArrowDown", "End", "Escape", "ArrowUp", "Home", "Escape", "Enter", "Tab"]) {
  await opened_Discs.page.keyboard.press(key)
  await pausedFor(300)
  keys_Menu.push(`${key}: ${await shownOf_Menu()}`)
}
await opened_Discs.page.hover(".tile_htmlView[data-id=\"T-16\"] .switch_Tile_htmlView")
await opened_Discs.page.click(".tile_htmlView[data-id=\"T-16\"] .trigger_More_htmlView")
await opened_Discs.page.mouse.move(5, 300)
await pausedFor(300)
const pressed_Menu = await shownOf_Menu()
const box_Drafts = await opened_Discs.page.locator(".column_Board_htmlView[data-kind=\"DRAFTS\"]").boundingBox()
if (box_Drafts !== null) await opened_Discs.page.mouse.click(box_Drafts.x + box_Drafts.width / 2, box_Drafts.y + box_Drafts.height - 8)
await pausedFor(300)
const elsewhere_Menu = await shownOf_Menu()
test("a task's menu as a menu button's: Tab onto its ⋮ without opening it; ↓ or Enter opening it on its first choice, ↑ on its last; ↑, ↓, Home and End moving through it; Esc back to the ⋮; Tab out shutting it; pressed with the pointer, not kept open once the pointer's gone", () => {
  expect(keys_Menu).toEqual([
    "Tab: T-13 ⋮, open: none",
    "ArrowDown: T-13 Stop lit, open: T-13",
    "ArrowDown: T-13 Cancel lit, open: T-13",
    "ArrowDown: T-13 Stop lit, open: T-13",
    "End: T-13 Cancel lit, open: T-13",
    "Escape: T-13 ⋮, open: none",
    "ArrowUp: T-13 Cancel lit, open: T-13",
    "Home: T-13 Stop lit, open: T-13",
    "Escape: T-13 ⋮, open: none",
    "Enter: T-13 Stop lit, open: T-13",
    "Tab: T-16 name, open: none"
  ])
  expect(pressed_Menu.endsWith("open: none")).toBe(true)
  expect(elsewhere_Menu.endsWith("open: none")).toBe(true)
  expect(opened_Discs.errors).toEqual([])
})

// a task's menu pointed open, the ⋮ there while the pointer's on it, gone
// once it's left it, onto the strip beside it or into the menu; the menu
// open wherever the pointer is inside it, over the task under it too,
// whose unseen ⋮ never takes the pointer from it, and shut once the
// pointer's past its edge
await opened_Discs.page.mouse.move(5, 300)
await pausedFor(150)
const tile_Over = ".tile_htmlView[data-id=\"T-12\"]"
const shownOf_Over = () => opened_Discs.page.evaluate((tile_Over) => {
  const open = [...document.querySelectorAll(".menu_Tile_htmlView")].filter((menu) => getComputedStyle(menu).visibility === "visible").map((menu) => menu.closest(".tile_htmlView")?.getAttribute("data-id")).join(" ")
  const trigger = getComputedStyle(document.querySelector(`${tile_Over} .trigger_More_htmlView`)!).opacity === "0" ? "gone" : "shown"
  return `open: ${open === "" ? "none" : open}, ⋮ ${trigger}`
}, tile_Over)
await opened_Discs.page.hover(`${tile_Over} .switch_Tile_htmlView`)
const box_Over = await opened_Discs.page.locator(`${tile_Over} .trigger_More_htmlView`).boundingBox()
const over_Menu: Array<string> = []
if (box_Over !== null) {
  await opened_Discs.page.mouse.move(box_Over.x + box_Over.width / 2, box_Over.y + box_Over.height / 2)
  await pausedFor(150)
  over_Menu.push(`on the ⋮: ${await shownOf_Over()}`)
  await opened_Discs.page.mouse.move(box_Over.x - 15, box_Over.y + box_Over.height / 2)
  await pausedFor(100)
  over_Menu.push(`beside it: ${await shownOf_Over()}`)
  const box_Menu = await opened_Discs.page.evaluate((tile_Over) => {
    const rect = document.querySelector(`${tile_Over} .menu_Tile_htmlView`)!.getBoundingClientRect()
    const rect_Next = document.querySelector(`${tile_Over} + .tile_htmlView .trigger_More_htmlView`)!.getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      x_Next: rect_Next.left + rect_Next.width / 2,
      y_Next: rect_Next.top + rect_Next.height / 2
    }
  }, tile_Over)
  const isOverNext = box_Menu.bottom > box_Menu.y_Next
  await opened_Discs.page.mouse.move(box_Menu.x_Next, box_Menu.bottom - 4, { steps: 4 })
  await pausedFor(100)
  over_Menu.push(`in it, ${isOverNext ? "over the next task's ⋮" : "NOT over the next task"}: ${await shownOf_Over()}`)
  await opened_Discs.page.mouse.move(box_Menu.x_Next, box_Menu.y_Next)
  await pausedFor(100)
  over_Menu.push(`on the next task's unseen ⋮: ${await shownOf_Over()}`)
  await opened_Discs.page.mouse.move(box_Menu.left + 4, box_Menu.bottom + 1)
  await pausedFor(300)
  over_Menu.push(`past its edge: ${(await shownOf_Over()).split(",")[0]}`)
}
test("a task's menu pointed open: the ⋮ there while the pointer's on it, gone once it's left it; open wherever the pointer is inside it, over the task under it too, whose unseen ⋮ never takes the pointer; shut past its edge", () => {
  expect(over_Menu).toEqual([
    "on the ⋮: open: T-12, ⋮ shown",
    "beside it: open: T-12, ⋮ gone",
    "in it, over the next task's ⋮: open: T-12, ⋮ gone",
    "on the next task's unseen ⋮: open: T-12, ⋮ gone",
    "past its edge: open: none"
  ])
})

// the footer's counts of the project's tasks kept whatever's pointed at or
// focused in the document: a proposal pressed redraws the editor from its
await opened_JavaScript.close()
// blocks, which had left the footer empty, its header put back and its
// footer not
await opened_Discs.page.mouse.move(5, 300)
const footer_Before = await opened_Discs.page.evaluate(() => document.querySelector(".tasks_Footer_htmlView")?.textContent ?? null)
await opened_Discs.page.locator(".item_htmlView .title_htmlView").first().scrollIntoViewIfNeeded()
await opened_Discs.page.locator(".item_htmlView .title_htmlView").first().click()
await pausedFor(300)
const footer_Pressed = await opened_Discs.page.evaluate(() => document.querySelector(".tasks_Footer_htmlView")?.textContent ?? null)
await opened_Discs.close()
test("the footer's counts of the project's tasks stay while a proposal's pointed at or focused, the editor redrawn from its blocks keeping its footer as it keeps its header", () => {
  expect(footer_Before).not.toBe(null)
  expect(footer_Pressed).toBe(footer_Before)
})

// a task's own actions, at the end of its card's heading, folded behind
// its ellipsis till it's pointed at, the ways it ends, each in the ink of
// whose move it is: a draft, saying how many it has queued, Cancel alone,
// neutral, discarding it; a task with nothing left on either side, Apply,
// the proposals' indigo, resolving it, the editor going to manual, and
// Cancel; one with anything left, Cancel alone, its Start all where it's
// always been, in Scope Revisions, starting it, and Cancel resolving it
// as canceled; each asked of the host
const opened_Ends = await openExample(
  "javascript",
  1
)
await opened_Ends.page.waitForSelector(".note_htmlView")
const switchedTo_Ends = async (id: string) => {
  await opened_Ends.page.mouse.move(5, 300)
  await opened_Ends.page.waitForTimeout(300)
  await opened_Ends.page.hover(".trigger_Switcher_htmlView")
  await opened_Ends.page.waitForTimeout(300)
  await opened_Ends.page.click(`.choice_Switcher_htmlView[data-switch="TASK"][data-id="${id}"]`)
  await opened_Ends.page.mouse.move(5, 300)
  await opened_Ends.page.waitForTimeout(400)
}
const headOf_Ends = async () => {
  const trigger = await opened_Ends.page.locator(".trigger_Task_htmlView").boundingBox()
  if (trigger === null) throw new Error("no task")
  await opened_Ends.page.mouse.move(trigger.x + 20, trigger.y + trigger.height / 2)
  await opened_Ends.page.waitForTimeout(300)
  const head = await opened_Ends.page.locator(".card_Task_htmlView .head_Card_htmlView").boundingBox()
  if (head === null) throw new Error("no card")
  await opened_Ends.page.mouse.move(trigger.x + 20, head.y + head.height / 2, { steps: 4 })
  const shownOf = () => opened_Ends.page.evaluate(() => (document.querySelector(".card_Task_htmlView .head_Card_htmlView .actions_Card_htmlView")?.getBoundingClientRect().width ?? 0) > 2)
  const isShown_Before = await shownOf()
  const more = await opened_Ends.page.locator(".card_Task_htmlView .head_Card_htmlView .more_htmlView").boundingBox()
  if (more === null) throw new Error("no ellipsis")
  await opened_Ends.page.mouse.move(more.x + more.width / 2, more.y + more.height / 2, { steps: 8 })
  await opened_Ends.page.waitForTimeout(300)
  return {
    isShown_Before,
    isShown: await shownOf(),
    ...await opened_Ends.page.evaluate(() => {
      const editor = document.querySelector(".htmlView_editor")!
      const colorOf = (color: string) => {
        const probe = document.createElement("span")
        probe.style.color = color
        editor.append(probe)
        const computed = getComputedStyle(probe).color
        probe.remove()
        return computed
      }
      const inks = new Map([
        [colorOf("var(--accent_revision_htmlView)"), "plum"],
        [colorOf("var(--accent_proposals_htmlView)"), "indigo"],
        [colorOf("var(--view-action-ink, light-dark(#3b3b3b, #cccccc))"), "neutral"]
      ])
      return {
        queued: (document.querySelector(".card_Task_htmlView [aria-label=\"Scope Revisions\"] .value_Card_htmlView") as HTMLElement | null)?.textContent ?? null,
        actions: [...document.querySelectorAll(".card_Task_htmlView .head_Card_htmlView .actions_Card_htmlView > button")].map((button) => `${button.textContent} ${inks.get(getComputedStyle(button).color) ?? getComputedStyle(button).color}${Number(getComputedStyle(button).fontWeight) >= 600 ? " bold" : ""}`)
      }
    })
  }
}
const modeOf_Ends = () => opened_Ends.page.evaluate(() => ({
  name: document.querySelector(".header_htmlView :is(.name_Task_htmlView, .name_Manual_htmlView)")?.textContent ?? null,
  state: document.querySelector(".trigger_Task_htmlView")?.getAttribute("data-state") ?? null
}))
await switchedTo_Ends("T-16")
const head_Draft = await headOf_Ends()
await opened_Ends.page.click(".card_Task_htmlView .head_Card_htmlView [data-end=\"DISCARD\"]")
await opened_Ends.page.waitForTimeout(200)
const mode_Discarded = await modeOf_Ends()
await switchedTo_Ends("T-14")
const head_Ready = await headOf_Ends()
await opened_Ends.page.click(".card_Task_htmlView .head_Card_htmlView [data-end=\"APPLY\"]")
await opened_Ends.page.waitForTimeout(200)
const mode_Applied = await modeOf_Ends()
await switchedTo_Ends("T-17")
const head_Left = await headOf_Ends()
const more_Scope = await opened_Ends.page.locator(".card_Task_htmlView [aria-label=\"Scope Revisions\"] .more_htmlView").boundingBox()
if (more_Scope === null) throw new Error("no ellipsis")
await opened_Ends.page.mouse.move(more_Scope.x + more_Scope.width / 2, more_Scope.y + more_Scope.height / 2, { steps: 8 })
await opened_Ends.page.waitForTimeout(300)
await opened_Ends.page.click(".card_Task_htmlView [aria-label=\"Scope Revisions\"] [data-scope=\"TASK\"][data-work=\"START\"]")
await opened_Ends.page.waitForTimeout(200)
const mode_Started = await modeOf_Ends()
const head_Started = await headOf_Ends()
await opened_Ends.page.click(".card_Task_htmlView .head_Card_htmlView [data-end=\"CANCEL\"]")
await opened_Ends.page.waitForTimeout(200)
const mode_Canceled = await modeOf_Ends()
const logged_Ends = (await opened_Ends.logged()).filter((entry) => "ended" in entry || "started" in entry)
await opened_Ends.close()
test("a task's own actions, at the end of its card's heading, folded till its ellipsis is pointed at, the ways it ends: a draft's Cancel alone, neutral, discarding it; Apply, indigo, once nothing's left, resolving it, the editor going to manual; Cancel alone while anything's left, its Start all in Scope Revisions starting it; each asked of the host", () => {
  expect(head_Draft).toEqual({ isShown_Before: false, isShown: true, queued: "2 queued", actions: ["Cancel neutral"] })
  expect(mode_Discarded).toEqual({ name: "No task", state: null })
  expect(head_Ready).toEqual({ isShown_Before: false, isShown: true, queued: "Nothing queued", actions: ["Apply indigo", "Cancel neutral"] })
  expect(mode_Applied).toEqual({ name: "No task", state: null })
  expect(head_Left).toEqual({ isShown_Before: false, isShown: true, queued: "2 queued", actions: ["Cancel neutral"] })
  expect(mode_Started).toEqual({ name: "Name the retry options", state: "WORKING" })
  expect(head_Started.actions).toEqual(["Cancel neutral"])
  expect(mode_Canceled).toEqual({ name: "No task", state: null })
  expect(logged_Ends).toEqual([
    { ended: "DISCARD", task: "T-16" },
    { ended: "APPLY", task: "T-14" },
    { started: "TASK", task: "T-17" },
    { ended: "CANCEL", task: "T-17" }
  ])
  expect(opened_Ends.errors).toEqual([])
})

// the switcher's order kept while it's open: a task switched to from the
// board, the pointer on the switcher, marked as the one the editor's in
// where it is, nothing moving under the pointer, nor as it fades, and
// sorted again once it's shut, the editor's task first when it's opened
await opened.close()
// again; a task chosen in it, the switcher shut at once, though the
// pointer's still on it, sorted, still shut as the pointer moves where it
// was, shown again once the pointer's left it and come back; and chosen
// from the keyboard, shut, shown again when its chevron's focused
const opened_Order = await openExample(
  "javascript",
  1
)
await opened_Order.page.waitForSelector(".note_htmlView")
const orderOf_Switcher = () => opened_Order.page.evaluate(() => [...document.querySelectorAll(".choice_Switcher_htmlView")].map((choice) => `${choice.getAttribute("data-id") ?? "none"}${choice.hasAttribute("aria-current") ? " here" : ""}`))
const visibilityOf_Switcher = () => opened_Order.page.evaluate(() => getComputedStyle(document.querySelector(".card_Switcher_htmlView")!).visibility)
await opened_Order.page.hover(".trigger_Switcher_htmlView")
await opened_Order.page.waitForTimeout(300)
const order_Opened = await orderOf_Switcher()
const box_Choice = await opened_Order.page.locator(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-16\"]").boundingBox()
if (box_Choice === null) throw new Error("no T-16 in the switcher")
await opened_Order.page.mouse.move(box_Choice.x + 40, box_Choice.y + box_Choice.height / 2, { steps: 4 })
await opened_Order.page.evaluate(() => document.querySelector<HTMLElement>(".tile_htmlView[data-id=\"T-14\"] .switch_Tile_htmlView")?.click())
await opened_Order.page.waitForTimeout(300)
const switcher_Elsewhere = {
  order: await orderOf_Switcher(),
  visibility: await visibilityOf_Switcher()
}
await opened_Order.page.mouse.move(5, 400)
await opened_Order.page.waitForTimeout(150)
const order_Fading = await orderOf_Switcher()
await opened_Order.page.waitForTimeout(400)
await opened_Order.page.hover(".trigger_Switcher_htmlView")
await opened_Order.page.waitForTimeout(300)
const order_Reopened = await orderOf_Switcher()
const box_Pressed = await opened_Order.page.locator(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-13\"]").boundingBox()
if (box_Pressed === null) throw new Error("no T-13 in the switcher")
await opened_Order.page.mouse.move(box_Pressed.x + 40, box_Pressed.y + box_Pressed.height / 2, { steps: 4 })
const visibility_Pressed = await opened_Order.page.evaluate(() => {
  document.querySelector<HTMLElement>(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-13\"]")?.click()
  return getComputedStyle(document.querySelector(".card_Switcher_htmlView")!).visibility
})
await opened_Order.page.waitForTimeout(300)
const switcher_Shut = {
  order: await orderOf_Switcher(),
  visibility: await visibilityOf_Switcher()
}
await opened_Order.page.mouse.move(box_Pressed.x + 60, box_Pressed.y + box_Pressed.height / 2 + 10, { steps: 4 })
await opened_Order.page.waitForTimeout(300)
const visibility_Moved = await visibilityOf_Switcher()
await opened_Order.page.mouse.move(5, 400)
await opened_Order.page.waitForTimeout(300)
await opened_Order.page.hover(".trigger_Switcher_htmlView")
await opened_Order.page.waitForTimeout(300)
const visibility_Back = await visibilityOf_Switcher()
await opened_Order.page.mouse.move(5, 400)
await opened_Order.page.waitForTimeout(400)
await opened_Order.page.focus(".trigger_Switcher_htmlView")
await opened_Order.page.focus(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-17\"]")
await opened_Order.page.keyboard.press("Enter")
await opened_Order.page.waitForTimeout(400)
const visibility_Keyed = await visibilityOf_Switcher()
await opened_Order.page.focus(".trigger_Switcher_htmlView")
await opened_Order.page.waitForTimeout(300)
const visibility_Refocused = await visibilityOf_Switcher()
await opened_Order.close()
test("the switcher's order kept while it's open, a task switched to from the board marked where it is, nothing moving, nor as it fades, sorted again once it's shut; a task chosen in it, shut at once though the pointer's still on it, shown again once the pointer's left it and come back; chosen from the keyboard, shown again when its chevron's focused", () => {
  expect(order_Opened).toEqual(["T-12 here", "T-13", "T-15", "T-17", "T-16", "T-14", "none"])
  expect(switcher_Elsewhere).toEqual({ order: ["T-12", "T-13", "T-15", "T-17", "T-16", "T-14 here", "none"], visibility: "visible" })
  expect(order_Fading).toEqual(switcher_Elsewhere.order)
  expect(order_Reopened).toEqual(["T-14 here", "T-12", "T-13", "T-15", "T-17", "T-16", "none"])
  expect(visibility_Pressed).toBe("hidden")
  expect(switcher_Shut).toEqual({ order: ["T-13 here", "T-12", "T-15", "T-17", "T-16", "T-14", "none"], visibility: "hidden" })
  expect([visibility_Moved, visibility_Back]).toEqual(["hidden", "visible"])
  expect([visibility_Keyed, visibility_Refocused]).toEqual(["hidden", "visible"])
  expect(opened_Order.errors).toEqual([])
})

// a request sent with no task drafts a new one, named for it, the editor in
// it from then on, its request queued; started, from its card's Start all,
// working, and a moment later, with no agent and nothing scripted for it,
// answered with nothing to change, nothing left, your turn, applicable; the
// footer counting it each time, all of it the tasks part's
const opened_Draft = await openExample(
  "javascript",
  1
)
await opened_Draft.page.waitForSelector(".note_htmlView")
const shownOf_Draft = () => opened_Draft.page.evaluate(() => ({
  name: document.querySelector(".header_htmlView :is(.name_Task_htmlView, .name_Manual_htmlView)")?.textContent ?? null,
  state: document.querySelector(".trigger_Task_htmlView")?.getAttribute("data-state") ?? null,
  footer: document.querySelector(".tasks_Footer_htmlView")?.getAttribute("title") ?? null
}))
await opened_Draft.page.hover(".trigger_Switcher_htmlView")
await opened_Draft.page.waitForTimeout(300)
await opened_Draft.page.click(".choice_Switcher_htmlView[data-switch=\"MANUAL\"]")
await opened_Draft.page.mouse.move(5, 400)
await opened_Draft.page.waitForTimeout(500)
await opened_Draft.page.hover(".trigger_Document_htmlView")
await opened_Draft.page.waitForTimeout(300)
await opened_Draft.page.click(".card_Document_htmlView [data-ask=\"DOCUMENT\"]")
await opened_Draft.page.waitForTimeout(200)
await opened_Draft.page.keyboard.type("Say what the timeout throws.")
await opened_Draft.page.keyboard.press("Control+Enter")
await opened_Draft.page.waitForTimeout(300)
await opened_Draft.page.keyboard.press("Escape")
await opened_Draft.page.mouse.move(700, 700)
await opened_Draft.page.waitForTimeout(500)
const draft_Made = await shownOf_Draft()
await opened_Draft.page.hover(".trigger_Task_htmlView")
await opened_Draft.page.waitForTimeout(300)
const queued_Draft = await opened_Draft.page.evaluate(() => document.querySelector(".card_Task_htmlView [aria-label=\"Scope Revisions\"] .value_Card_htmlView")?.textContent ?? null)
const more_Draft = await opened_Draft.page.locator(".card_Task_htmlView [aria-label=\"Scope Revisions\"] .more_htmlView").boundingBox()
if (more_Draft === null) throw new Error("no ellipsis")
await opened_Draft.page.mouse.move(more_Draft.x + more_Draft.width / 2, more_Draft.y + more_Draft.height / 2, { steps: 8 })
await opened_Draft.page.locator(".card_Task_htmlView [aria-label=\"Scope Revisions\"] [data-work=\"START\"]").waitFor({ state: "visible", timeout: 3000 })
await opened_Draft.page.click(".card_Task_htmlView [aria-label=\"Scope Revisions\"] [data-work=\"START\"]")
await opened_Draft.page.waitForTimeout(200)
const draft_Started = await shownOf_Draft()
await opened_Draft.page.mouse.move(700, 700)
await opened_Draft.page.waitForTimeout(1800)
const draft_Answered = await shownOf_Draft()
await opened_Draft.close()
test("a request sent with no task drafts a new one, named for it, the editor in it, its request queued; started, working; answered a moment later with nothing to change, your turn, applicable; the footer counting it each time", () => {
  expect(draft_Made).toEqual({ name: "Say what the timeout throws.", state: "DRAFT", footer: "7 tasks: 4 need you, 2 working, 2 drafts" })
  expect(queued_Draft).toBe("1 queued")
  expect(draft_Started).toEqual({ name: "Say what the timeout throws.", state: "WORKING", footer: "7 tasks: 4 need you, 3 working, 1 draft" })
  expect(draft_Answered).toEqual({ name: "Say what the timeout throws.", state: "YOUR_TURN", footer: "7 tasks: 5 need you, 2 working, 1 draft" })
  expect(opened_Draft.errors).toEqual([])
})

// typing in No task over a change of the playground's task's own, the
// status line its accepted proposal moves: the documents part carries the
// task across the edit, the change it touched stale, a conflict, said at
// once in the switcher, the footer and on the board; the words taken back
// out by hand, or by undo, the text it was written over back, no conflict
// left, the editor keeping its undo history; typing beside a proposal's
// change, nothing touched; "further " taken out of the opening comment, the
// comment as its round was written on it, that round not out of date any
// more; and in the task, nothing written before your edits
const opened_Conflict = await openExample(
  "javascript",
  1
)
await opened_Conflict.page.waitForSelector(".note_htmlView")
const standingOf_Conflict = () => opened_Conflict.page.evaluate(() => ({
  switcher: [...document.querySelectorAll(".choice_Switcher_htmlView[data-id=\"T-12\"] .part_Option_htmlView")].map((part) => part.textContent).join(" · "),
  footer: document.querySelector(".tasks_Footer_htmlView")?.getAttribute("title") ?? null,
  board: [...document.querySelectorAll(".tile_htmlView[data-id=\"T-12\"] .part_Tile_htmlView")].map((part) => part.textContent).join(" · ")
}))
const lineWith_Conflict = (snippet: string) => opened_Conflict.page.evaluate((snippet) => [...document.querySelectorAll(".line_htmlView")].map((line) => line.textContent ?? "").find((text) => text.includes(snippet)) ?? null, snippet)
const typedAtEnd_Conflict = async (snippet: string, words: string) => {
  await opened_Conflict.page.locator(".line_htmlView", { hasText: snippet }).first().click()
  await opened_Conflict.page.keyboard.press("End")
  await opened_Conflict.page.keyboard.type(words)
  await opened_Conflict.page.waitForTimeout(300)
}
const writtenBefore_Conflict = () => opened_Conflict.page.evaluate(() => [...document.querySelectorAll(".item_htmlView")].filter((item) => /before your edits/i.test(item.textContent ?? "")).map((item) => item.querySelector(".title_htmlView")?.textContent ?? null))
const switchedTo_Conflict = async (selector: string) => {
  await opened_Conflict.page.mouse.move(5, 400)
  await opened_Conflict.page.waitForTimeout(300)
  await opened_Conflict.page.hover(".trigger_Switcher_htmlView")
  await opened_Conflict.page.waitForTimeout(300)
  await opened_Conflict.page.click(selector)
  await opened_Conflict.page.mouse.move(5, 400)
  await opened_Conflict.page.waitForTimeout(500)
}
const written_Seeded = await writtenBefore_Conflict()
await switchedTo_Conflict(".choice_Switcher_htmlView[data-switch=\"MANUAL\"]")
const standing_Manual = await standingOf_Conflict()
await typedAtEnd_Conflict("let lastError", " // kept")
const standing_Beside = await standingOf_Conflict()
await typedAtEnd_Conflict("const status = error?.response?.status", " // why")
const standing_Typed = await standingOf_Conflict()
const line_Conflicted = await lineWith_Conflict("const status = error?.response?.status")
for (let count = 0; count < " // why".length; count = count + 1) {
  await opened_Conflict.page.keyboard.press("Backspace")
  await opened_Conflict.page.waitForTimeout(50)
}
await opened_Conflict.page.waitForTimeout(300)
const standing_Erased = await standingOf_Conflict()
const line_Erased = await lineWith_Conflict("const status = error?.response?.status")
await typedAtEnd_Conflict("const status = error?.response?.status", " // why")
const standing_Retyped = await standingOf_Conflict()
for (let count = 0; count < 20 && (await lineWith_Conflict("const status = error?.response?.status")) !== "38  const status = error?.response?.status ?? 0;"; count = count + 1) await opened_Conflict.page.keyboard.press("Control+z")
await opened_Conflict.page.waitForTimeout(300)
const standing_Undone = await standingOf_Conflict()
const line_Undone_Conflict = await lineWith_Conflict("const status = error?.response?.status")
await opened_Conflict.page.locator(".line_htmlView", { hasText: "backing off further each time" }).first().click()
await opened_Conflict.page.keyboard.press("Home")
for (let count = 0; count < "// Retries a flaky async call, backing off ".length; count = count + 1) await opened_Conflict.page.keyboard.press("ArrowRight")
for (let count = 0; count < "further ".length; count = count + 1) {
  await opened_Conflict.page.keyboard.press("Shift+ArrowRight")
  await opened_Conflict.page.waitForTimeout(30)
}
await opened_Conflict.page.keyboard.press("Backspace")
await opened_Conflict.page.waitForTimeout(300)
const line_Comment = await lineWith_Conflict("backing off each time")
await switchedTo_Conflict(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-12\"]")
const written_After = await writtenBefore_Conflict()
await opened_Conflict.close()
test("typing in No task over a change of a task's own, one it's accepted, a conflict, said at once in the switcher, the footer and on the board; taken back out by hand, or by undo, the conflict gone with it; typing beside a proposal's change, nothing; the opening comment put back as its round was written on it, its round not out of date any more", () => {
  expect(written_Seeded).toEqual(["Drop the module's opening comment"])
  expect(standing_Manual).toEqual({ switcher: "14 to decide · 3 running", footer: "6 tasks: 4 need you, 2 working, 1 draft", board: "14 to decide · 3 running" })
  expect(standing_Beside).toEqual(standing_Manual)
  expect(standing_Typed).toEqual({ switcher: "1 conflict · 3 running", footer: "6 tasks: 4 need you, 1 conflict, 2 working, 1 draft", board: "1 conflict · 3 running" })
  expect(line_Conflicted).toBe("38  const status = error?.response?.status ?? 0; // why")
  expect([standing_Erased, line_Erased]).toEqual([standing_Manual, "38  const status = error?.response?.status ?? 0;"])
  expect([standing_Retyped, standing_Undone, line_Undone_Conflict]).toEqual([standing_Typed, standing_Manual, "38  const status = error?.response?.status ?? 0;"])
  expect(line_Comment).toBe("1// Retries a flaky async call, backing off each time, until it")
  expect(written_After).toEqual([])
  expect(opened_Conflict.errors).toEqual([])
})

// a conflict settled from its item, in the JavaScript example: in No task,
// " // why" typed at the end of the line the task's accepted move takes up,
// and the base delay's name, which an accepted replacement writes, changed;
// in the task, each a conflict, saying what the file did, the move's lines
// drawn as it was written on them above the file's, the file's words ringed
// on its line and, teal, in the proposed lines; the move settled with Both,
// the line moving with the comment in it, and the replacement kept as it
// was written, over the file's name; no conflict left
const opened_Settle = await openExample(
  "javascript",
  1
)
await opened_Settle.page.waitForSelector(".note_htmlView")
const switchedTo_Settle = async (selector: string) => {
  await opened_Settle.page.mouse.move(5, 400)
  await opened_Settle.page.waitForTimeout(300)
  await opened_Settle.page.hover(".trigger_Switcher_htmlView")
  await opened_Settle.page.waitForTimeout(300)
  await opened_Settle.page.click(selector)
  await opened_Settle.page.mouse.move(5, 400)
  await opened_Settle.page.waitForTimeout(500)
}
const itemOf_Settle = (source: string) => opened_Settle.page.evaluate((source) => {
  const item = document.querySelector(`.item_htmlView[data-source="${source}"]`)
  const frame = item?.closest(".frame_htmlView")
  return {
    stale: item?.querySelector(".stale_htmlView")?.textContent ?? null,
    ways: [...(item?.querySelectorAll(".way_htmlView") ?? [])].map((way) => way.textContent),
    lines: [...(frame?.querySelectorAll(".run_htmlView[data-run$=\"-current\"] > .line_htmlView") ?? [])].flatMap((line) => line.getAttribute("data-layer") === "DOCUMENT" ? [] : [[line.getAttribute("data-layer"), line.querySelector(".label_htmlView")?.textContent ?? "", line.querySelector(".text_htmlView")?.textContent ?? ""]]),
    rings_Since: [...(frame?.querySelectorAll(".underlay_htmlView[data-since]") ?? [])].map((ring) => ring.getAttribute("data-change")),
    rings_File: frame?.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] .underlay_htmlView[data-file]").length ?? 0
  }
}, source)
const proposedWith_Settle = (snippet: string) => opened_Settle.page.evaluate((snippet) => [...document.querySelectorAll(".run_htmlView[data-run$=\"-proposed\"] > .line_htmlView > .text_htmlView")].map((text) => text.textContent ?? "").find((text) => text.includes(snippet)) ?? null, snippet)
const conflictsOf_Settle = () => opened_Settle.page.evaluate(() => document.querySelector(".tasks_Footer_htmlView")?.getAttribute("title") ?? null)
await switchedTo_Settle(".choice_Switcher_htmlView[data-switch=\"MANUAL\"]")
await opened_Settle.page.locator(".line_htmlView", { hasText: "const status = error?.response?.status" }).first().click()
await opened_Settle.page.keyboard.press("End")
await opened_Settle.page.keyboard.type(" // why")
await opened_Settle.page.waitForTimeout(300)
await opened_Settle.page.locator(".line_htmlView", { hasText: "const delay = DELAY_MS" }).first().click()
await opened_Settle.page.keyboard.press("End")
for (let count = 0; count < "  const delay = DELAY_MS * 2 ** (n - 1);".length - "  const delay = DELAY_MS".length; count = count + 1) await opened_Settle.page.keyboard.press("ArrowLeft")
for (let count = 0; count < "DELAY_MS".length; count = count + 1) await opened_Settle.page.keyboard.press("Shift+ArrowLeft")
await opened_Settle.page.keyboard.type("BASE_MS")
await opened_Settle.page.waitForTimeout(300)
await switchedTo_Settle(".choice_Switcher_htmlView[data-switch=\"TASK\"][data-id=\"T-12\"]")
const footer_Conflicted = await conflictsOf_Settle()
const status_Conflicted = await itemOf_Settle("status")
const base_Conflicted = await itemOf_Settle("base")
await opened_Settle.page.click(".item_htmlView[data-source=\"status\"] .way_htmlView[data-way=\"BOTH\"]")
await opened_Settle.page.waitForTimeout(400)
const status_Both = await itemOf_Settle("status")
const proposed_Both = await proposedWith_Settle("const status = error?.response?.status")
await opened_Settle.page.click(".item_htmlView[data-source=\"base\"] .way_htmlView[data-way=\"KEEP\"]")
await opened_Settle.page.waitForTimeout(400)
const base_Kept = await itemOf_Settle("base")
const proposed_Kept = await proposedWith_Settle("const delay = ")
const footer_Settled = await conflictsOf_Settle()
const logged_Settle = (await opened_Settle.logged()).filter((entry) => "settled" in entry)
await opened_Settle.close()
test("a conflict settled from its item: each says what the file did and offers its ways out, a move Take the file's, Both and Run again, a replacement Keep yours, Take the file's and Run again; the move's lines drawn as it was written on them, numbered, above the file's, unnumbered, what the file put in ringed green on its line and teal in the proposed lines; Both moves the line with the comment in it, Keep yours writes the replacement over the file's name, each asked of the host, and no conflict's left", () => {
  expect(footer_Conflicted).toBe("6 tasks: 4 need you, 2 conflicts, 2 working, 1 draft")
  expect(status_Conflicted).toEqual({
    stale: "Conflict · the file put “// why” in line 38",
    ways: ["Take the file's", "Both", "Run again"],
    lines: [["WRITTEN_ON", "38", "  const status = error?.response?.status ?? 0;"], ["MOVED_SINCE", "", "  const status = error?.response?.status ?? 0; // why"]],
    rings_Since: ["inserted"],
    rings_File: 1
  })
  expect(base_Conflicted.stale).toBe("Conflict · the file changed “DELAY_MS” to “BASE_MS” in line 32")
  expect(base_Conflicted.ways).toEqual(["Keep yours", "Take the file's", "Run again"])
  expect(status_Both).toEqual({ stale: null, ways: [], lines: [], rings_Since: [], rings_File: 0 })
  expect(proposed_Both).toBe("  const status = error?.response?.status ?? 0; // why")
  expect([base_Kept.stale, base_Kept.lines]).toEqual([null, []])
  expect(proposed_Kept).toBe("  const delay = DELAY_MS * 2 ** (round - 1);")
  expect(footer_Settled).toBe("6 tasks: 4 need you, 2 working, 1 draft")
  expect(logged_Settle).toEqual([{ settled: "status", way: "BOTH" }, { settled: "base", way: "KEEP" }])
  expect(opened_Settle.errors).toEqual([])
})
