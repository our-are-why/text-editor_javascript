import { expect, test } from "bun:test"
import { MODULE_PLAINTEXT, type _Block_ViewModel_, type _Item_Proposals_ } from "../source/ViewModel_TextEditor.ts"
import { blocksWith__Frames, lineOf, blankOf } from "../playground/lines.ts"
import { attributesOf__Change, attributesOf__Edit, type _Side_Change_ } from "../playground/looks.ts"

// a text, its lines 2 and 3 moved down to before line 6, gamma renamed
// GAMMA on the way, words moved after it on its line, as the playground's stand-in for the projection works
// it out: its two ends in two frames
const moved = (side: _Side_Change_) => attributesOf__Change({ side, kind: "moved", source: "move" })
const renamed = (side: _Side_Change_) => ({ ...moved(side), ...attributesOf__Edit("replaced") })
const item: _Item_Proposals_ = { source: "move", title: "Move beta and gamma down", places: "", rationale: "", actions: [], attributes: {} }
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
        { kind: "PROPOSAL_LIST", items: [item] },
      ],
    },
    {
      kind: "FRAME",
      range: { first: 6, last: 6 },
      parts: [
        { kind: "CURRENT_LINES", run: { id: "landing-current", lines: [lineOf("epsilon")], groups: [] } },
        { kind: "PROPOSAL_LINES", run: { id: "landing-proposed", lines: [lineOf({ text: "beta", attributes: moved("after") }), lineOf({ text: "GAMMA", attributes: renamed("after") }, { text: " ray", attributes: moved("after") }), lineOf("epsilon")], groups: [] } },
        { kind: "PROPOSAL_LIST", items: [item] },
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

test("a move's two ends: numbered and marked moved where it leaves, its first line's note going to where it lands, saying only which way; signed → and marked moved where it lands, its first line moved in going back, saying where it's from; the line after it as it was", () => {
  const gutters = (id: string) => runOf(blocks, id).lines.map((line) => [line.gutter.label, line.gutter.marker, line.note])
  expect(gutters("leaving-current")).toEqual([["2", "moved", { label: "moves down", target: { source: "move", side: "after" } }], ["3", "moved", null]])
  expect(gutters("landing-proposed")).toEqual([["→", "moved", { label: "moved down from lines 2–3", target: { source: "move", side: "before" } }], ["→", "moved", null], ["", "none", null]])
})

test("a move is one ring over all it moves, at each end, whatever it changes on the way; what it changes is a ring of its own inside it, the move's own, so not within another's", () => {
  const underlays = (id: string) => runOf(blocks, id).groups.map((group) => [group.attributes["data-source"], group.underlays.map((underlay) => [`${underlay.from.line}:${underlay.from.offset}-${underlay.to.line}:${underlay.to.offset}`, underlay.attributes])])
  expect(underlays("leaving-current")).toEqual([["move", [
    ["0:0-1:9", { "data-change": "moved", "data-side": "before", "data-source": "move" }],
    ["1:0-1:5", { "data-change": "replaced", "data-side": "before", "data-source": "move" }],
  ]]])
  expect(underlays("landing-proposed")).toEqual([["move", [
    ["0:0-1:9", { "data-change": "moved", "data-side": "after", "data-source": "move" }],
    ["1:0-1:5", { "data-change": "replaced", "data-side": "after", "data-source": "move" }],
  ]]])
})

test("a move's item says which lines it moves, and which way, never to which line, at both its ends", () => {
  const places = blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((each) => each.places) : []) : [])
  expect(places).toEqual(["moves lines 2–3 down", "moves lines 2–3 down"])
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
