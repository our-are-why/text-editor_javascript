import { expect, test } from "bun:test"
import { MODULE_PLAINTEXT, type _Block_ViewModel_, type _Item_Proposals_ } from "../source/ViewModel_TextEditor.ts"
import { blocksWith__Frames, lineOf, blankOf } from "../playground/lines.ts"
import { attributesOf__Change, attributesOf__Edit, type _Side_Change_ } from "../playground/looks.ts"

// a text, its lines 2 and 3 moved down to before line 6, gamma renamed
// GAMMA by another proposal, decided apart, wherever the move leaves it,
// words moved after it on its line, as the playground's stand-in for the
// projection works it out: its two ends in two frames
const moved = (side: _Side_Change_) => attributesOf__Change({ side, kind: "moved", source: "move" })
const renamed = (side: _Side_Change_) => ({ ...moved(side), ...attributesOf__Edit({ kind: "replaced", source: "rename" }) })
const item: _Item_Proposals_ = { source: "move", title: "Move beta and gamma down", places: "", rationale: "", actions: [], attributes: {} }
const item_Rename: _Item_Proposals_ = { source: "rename", title: "Shout gamma", places: "", rationale: "", actions: [], attributes: {} }
const blocks = blocksWith__Frames({
  multilineText: "alpha\nbeta\ngamma ray\n\ndelta\nepsilon",
  module_Language: MODULE_PLAINTEXT,
  frames: [
    {
      kind: "FRAME",
      range: { first: 2, last: 3 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "leaving-current", lines: [lineOf({ text: "beta", attributes: moved("before") }), lineOf({ text: "gamma", attributes: renamed("before") }, { text: " ray", attributes: moved("before") })], groups: [] } },
        { kind: "PROPOSAL_LINES", run: { id: "leaving-proposed", lines: [], groups: [] } },
        { kind: "PROPOSAL_LIST", items: [item, item_Rename] },
      ],
    },
    {
      kind: "FRAME",
      range: { first: 6, last: 6 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "landing-current", lines: [lineOf("epsilon")], groups: [] } },
        { kind: "PROPOSAL_LINES", run: { id: "landing-proposed", lines: [lineOf({ text: "beta", attributes: moved("after") }), lineOf({ text: "GAMMA", attributes: renamed("after") }, { text: " ray", attributes: moved("after") }), lineOf("epsilon")], groups: [] } },
        { kind: "PROPOSAL_LIST", items: [item, item_Rename] },
      ],
    },
  ],
  moves: [{ source: "move", range: { first: 2, last: 3 }, to: 6 }],
})

// a frame's part, by its run's id
function runOf(
  blocks_Frames: Array<_Block_ViewModel_>,
  id: string
) {
  for (const block of blocks_Frames) {
    if (block.kind !== "FRAME") continue
    for (const part of block.parts) {
      if (part.kind !== "PROPOSAL_LIST" && part.run.id === id) return part.run
    }
  }
  throw new Error(`there's no run ${id}`)
}

test("a move's two ends: numbered and marked moved where it leaves, its first line's note going to where it lands, saying only that it's moved; signed → and marked moved where it lands, its first line moved in going back, saying where it's from; the line after it as it was", () => {
  const gutters = (id: string) => runOf(blocks, id).lines.map((line) => [line.gutter.label, line.gutter.marker, line.note])
  expect(gutters("leaving-current")).toEqual([["2", "moved", { label: "moved", target: { source: "move", side: "after" } }], ["3", "moved", null]])
  expect(gutters("landing-proposed")).toEqual([["→", "moved", { label: "from lines 2–3", target: { source: "move", side: "before" } }], ["→", "moved", null], ["", "none", null]])
})

test("a move is one ring over all it moves, at each end, whatever's changed on the way; a change another proposal makes to what it carries is that proposal's, its own group, a ring inside the move's, saying whose move carries it, at both ends, never within the move as a fallback", () => {
  const underlays = (id: string) => runOf(blocks, id).groups.map((group) => [group.attributes["data-source"], group.underlays.map((underlay) => [`${underlay.from.line}:${underlay.from.offset}-${underlay.to.line}:${underlay.to.offset}`, underlay.attributes])])
  expect(underlays("leaving-current")).toEqual([
    ["move", [["0:0-1:9", { "data-change": "moved", "data-side": "before", "data-source": "move", "data-place": "1" }]]],
    ["rename", [["1:0-1:5", { "data-change": "replaced", "data-side": "before", "data-source": "rename", "data-carried": "move", "data-place": "1" }]]],
  ])
  expect(underlays("landing-proposed")).toEqual([
    ["move", [["0:0-1:9", { "data-change": "moved", "data-side": "after", "data-source": "move", "data-place": "1" }]]],
    ["rename", [["1:0-1:5", { "data-change": "replaced", "data-side": "after", "data-source": "rename", "data-carried": "move", "data-place": "1" }]]],
  ])
})

test("a move's item says which lines it moves, and which way, never to which line, at both its ends; a proposal changing what it carries, its places at both, counted once, as in what it moves", () => {
  const places = blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((each) => `${each.source}: ${each.places}`) : []) : [])
  expect(places).toEqual([
    "move: moves lines 2–3 down",
    "rename: 1 place, in what “Move beta and gamma down” moves",
    "move: moves lines 2–3 down",
    "rename: 1 place, in what “Move beta and gamma down” moves",
  ])
})

test("a frame whose range is empty is a point before its first line, holding no lines as they are, the lines round it as they were; a blank line taken out or put in says so in its gutter, having no words to", () => {
  const blocks_Point = blocksWith__Frames({
    multilineText: "alpha\nbeta\n\ngamma",
    module_Language: MODULE_PLAINTEXT,
    frames: [
      {
        kind: "FRAME",
        range: { first: 3, last: 2 },
        parts: [
          { kind: "PROPOSAL_LINES", run: { id: "point-proposed", lines: [blankOf("inserted"), lineOf({ text: "new", attributes: attributesOf__Change({ side: "after", kind: "inserted", source: "new" }) })], groups: [] } },
          { kind: "PROPOSAL_LIST", items: [{ ...item, source: "new" }] },
        ],
      },
      {
        kind: "FRAME",
        range: { first: 3, last: 3 },
        parts: [
          { kind: "CURRENT_LINES", run: { id: "blank-current", lines: [blankOf("removed")], groups: [] } },
          { kind: "PROPOSAL_LINES", run: { id: "blank-proposed", lines: [], groups: [] } },
          { kind: "PROPOSAL_LIST", items: [{ ...item, source: "gap" }] },
        ],
      },
    ],
    moves: [],
  })
  expect(blocks_Point.map((block) => block.kind === "LINES" ? `${block.run.id}: ${block.run.lines.map((line) => line.gutter.label).join(" ")}` : `frame ${block.range.first}-${block.range.last}`)).toEqual(["lines-1: 1 2", "frame 3-2", "frame 3-3", "lines-4: 4"])
  expect(runOf(blocks_Point, "point-proposed").lines.map((line) => [line.gutter.label, line.gutter.marker])).toEqual([["+", "inserted"], ["+", "inserted"]])
  expect(runOf(blocks_Point, "blank-current").lines.map((line) => [line.gutter.label, line.gutter.marker])).toEqual([["3", "removed"]])
})

test("text moved within a line is moved as anywhere, both its ends in its frame, one on the line as it is, one on the line as proposed; what's between, as it was, untouched, two operands swapped round their ||; the line changed in place, with no notes, and its item, wholly here, saying nothing of where", () => {
  const order = (side: _Side_Change_) => attributesOf__Change({ side, kind: "moved", source: "order" })
  const blocks_Order = blocksWith__Frames({
    multilineText: "if (n === max || !ok) break",
    module_Language: MODULE_PLAINTEXT,
    frames: [{
      kind: "FRAME",
      range: { first: 1, last: 1 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "order-current", lines: [lineOf("if (", { text: "n === max", attributes: order("before") }, " || ", { text: "!ok", attributes: order("before") }, ") break")], groups: [] } },
        { kind: "PROPOSAL_LINES", run: { id: "order-proposed", lines: [lineOf("if (", { text: "!ok", attributes: order("after") }, " || ", { text: "n === max", attributes: order("after") }, ") break")], groups: [] } },
        { kind: "PROPOSAL_LIST", items: [{ ...item, source: "order" }] },
      ],
    }],
    moves: [],
  })
  const drawn = (id: string) => ({
    gutters: runOf(blocks_Order, id).lines.map((line) => [line.gutter.label, line.gutter.marker, line.note]),
    rings: runOf(blocks_Order, id).groups.flatMap((group) => group.underlays.map((underlay) => `${underlay.attributes["data-change"]} ${underlay.from.offset}-${underlay.to.offset}`)),
  })
  expect(drawn("order-current")).toEqual({ gutters: [["1", "changed", null]], rings: ["moved 4-13", "moved 17-20"] })
  expect(drawn("order-proposed")).toEqual({ gutters: [["~", "changed", null]], rings: ["moved 4-7", "moved 11-20"] })
  expect(blocks_Order.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((each) => each.places) : []) : [])).toEqual([""])
})

test("a proposal that moves holds only moves: one that moves text and changes text too is a mistake in the scene, and throws; what else changes in what it moves is another's, carried", () => {
  const scene = (attributes_Edit: Record<string, string>) => () => blocksWith__Frames({
    multilineText: "one two",
    module_Language: MODULE_PLAINTEXT,
    frames: [{
      kind: "FRAME",
      range: { first: 1, last: 1 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "current", lines: [lineOf({ text: "one", attributes: { ...moved("before"), ...attributes_Edit } }, " ", { text: "two", attributes: moved("before") })], groups: [] } },
        { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [lineOf({ text: "two", attributes: moved("after") }, " ", { text: "ONE", attributes: { ...moved("after"), ...attributes_Edit } })], groups: [] } },
        { kind: "PROPOSAL_LIST", items: [item] },
      ],
    }],
    moves: [],
  })
  expect(scene(attributesOf__Edit({ kind: "replaced", source: "move" }))).toThrow("the proposal move moves text and changes it too, moved, replaced")
  expect(scene(attributesOf__Edit({ kind: "replaced", source: "rename" }))).not.toThrow()
})

test("each change has a place, the same on both its sides: replaced paired with replaced in order, moved with moved, the same words first, so a swap's sides find each other; what's only put in, taken out, or inside another's removal, a place of its own", () => {
  const change = (side: _Side_Change_, kind: "moved" | "replaced" | "removed" | "inserted", source: string) => attributesOf__Change({ side, kind, source })
  const blocks_Places = blocksWith__Frames({
    multilineText: "let a = b + c\nif (x || !y) go",
    module_Language: MODULE_PLAINTEXT,
    frames: [{
      kind: "FRAME",
      range: { first: 1, last: 2 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "current", lines: [
          lineOf("let ", { text: "a", attributes: change("before", "replaced", "rename") }, " = ", { text: "b", attributes: change("before", "replaced", "rename") }, { text: " + c", attributes: change("before", "removed", "rename") }),
          lineOf("if (", { text: "x", attributes: change("before", "moved", "swap") }, " || ", { text: "!y", attributes: change("before", "moved", "swap") }, ") go"),
        ], groups: [] } },
        { kind: "PROPOSAL_LINES", run: { id: "proposed", lines: [
          lineOf("let ", { text: "A", attributes: change("after", "replaced", "rename") }, " = ", { text: "B", attributes: change("after", "replaced", "rename") }, { text: " * 2", attributes: change("after", "inserted", "rename") }),
          lineOf("if (", { text: "!y", attributes: change("after", "moved", "swap") }, " || ", { text: "x", attributes: change("after", "moved", "swap") }, ") go"),
        ], groups: [] } },
        { kind: "PROPOSAL_LIST", items: [{ ...item, source: "rename" }, { ...item, source: "swap" }] },
      ],
    }],
    moves: [],
  })
  const placed = (id: string) => runOf(blocks_Places, id).groups.flatMap((group) => group.underlays.map((underlay) => `${underlay.attributes["data-source"]} ${textOfRing(runOf(blocks_Places, id).lines, underlay)} ${underlay.attributes["data-place"]}`))
  expect(placed("current")).toEqual(["rename a 1", "rename b 2", "rename + c 3", "swap x 1", "swap !y 2"])
  expect(placed("proposed")).toEqual(["rename A 1", "rename B 2", "rename * 2 4", "swap !y 2", "swap x 1"])
})

// the words a ring is round, on its run's lines
function textOfRing(
  lines: Array<{ segments: Array<{ text: string }> }>,
  underlay: { from: { line: number, offset: number }, to: { line: number, offset: number } }
): string {
  return (lines[underlay.from.line]?.segments ?? []).map((segment) => segment.text).join("").slice(underlay.from.offset, underlay.to.offset)
}
