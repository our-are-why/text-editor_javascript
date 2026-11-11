import { expect, test } from "bun:test"
import { parseLines_ViewModel } from "../source/ViewModel_TextEditor.ts"
import { retry } from "../playground/examples/javascript.ts"
import { module_JavaScript } from "../playground/syntax.ts"

// a text's lines as the editor works them out with the playground's
// JavaScript module: each line's segments, a marked one as its syntax and
// its text, a plain one as its text alone, without the spaces at its ends,
// and none when it's only spaces
function syntaxOf(
  multilineText: string
): Array<Array<string>> {
  return parseLines_ViewModel({ multilineText, module_Language: module_JavaScript }).map((line) =>
    line.segments.flatMap((segment) => {
      const syntax = segment.attributes["data-syntax"]
      return syntax === undefined ? (segment.text.trim() === "" ? [] : [segment.text.trim()]) : [`${syntax}: ${segment.text}`]
    })
  )
}

test("the example's doc comment is a comment on every line it runs across, and the code after it is code again", () => {
  const lines = syntaxOf(retry)
  expect(lines.slice(6, 12).every((line) => line.length === 1 && line[0]?.startsWith("comment: "))).toBe(true)
  expect(lines[12]?.slice(0, 4)).toEqual(["keyword: export", "keyword: async", "keyword: function", "function: retry"])
})

test("a template literal's substitution is code again, between its text", () => {
  expect(syntaxOf(retry)[25]).toEqual(["keyword: throw", "keyword: new", "function: AggregateError", "([lastError],", "string: `gave up after ", "${attempts}", "string:  attempts`", ");"])
})

test("optional chaining: a name before ?. is a name, what comes after it a property, or a function when it's called, ?.( as much as (", () => {
  expect(syntaxOf("signal?.throwIfAborted();\nonRetry?.(error, n);\nconst status = error?.response?.status ?? 0;")).toEqual([
    ["signal?.", "function: throwIfAborted", "();"],
    ["function: onRetry", "?.(error, n);"],
    ["keyword: const", "status = error?.", "property: response", "?.", "property: status", "??", "number: 0", ";"],
  ])
})

test("a / is a regular expression where an expression comes next, and a division after a value", () => {
  expect(syntaxOf("const half = total / 2 / count;\nreturn /a\\/b/g.test(path);")).toEqual([
    ["keyword: const", "half = total /", "number: 2", "/ count;"],
    ["keyword: return", "regexp: /a\\/b/g", ".", "function: test", "(path);"],
  ])
})

test("a spread is no property access: what follows it is what it is", () => {
  expect(syntaxOf("const words = [...new Set(names)];")).toEqual([["keyword: const", "words = [...", "keyword: new", "function: Set", "(names)];"]])
})
