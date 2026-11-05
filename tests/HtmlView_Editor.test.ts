import { expect, test } from "bun:test"
import fc from "fast-check"
import { parseLines_ViewModel } from "../source/HtmlView_Editor.ts"

// every line break a text can hold: each ends a line, "\r\n" as one
const lineBreaks = ["\r\n", "\n", "\r", "\v", "\f", "\u0085", "\u2028", "\u2029"]

// a text, as the pieces it's made of: runs of anything but a line break, and
// line breaks, in any order
const pieces = fc.array(
  fc.oneof(
    fc.string({ minLength: 1, unit: "grapheme" }).filter((run) => !lineBreaks.some((lineBreak) => run.includes(lineBreak))),
    fc.constantFrom(...lineBreaks)
  ),
  { maxLength: 30 }
)

// the lines a text's pieces make, worked out from the pieces, not by the
// parser: each break starts a new line, but a "\n" right after a "\r" is the
// "\r\n" that "\r" began, and starts nothing
function linesOf(
  pieces: Array<string>
): Array<string> {
  const lines = [""]
  pieces.forEach((piece, index) => {
    if (!lineBreaks.includes(piece)) lines[lines.length - 1] += piece
    else if (!(piece === "\n" && pieces[index - 1] === "\r")) lines.push("")
  })
  return lines
}

test("a text parses into its lines, each without its line break, and nothing else lost", () => {
  fc.assert(
    fc.property(pieces, (pieces) => {
      const texts: Array<string> = parseLines_ViewModel(pieces.join("")).map(({ text }) => text)
      expect(texts).toEqual(linesOf(pieces))
    }),
    { numRuns: 1000 }
  )
})
