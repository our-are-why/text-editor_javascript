import { expect, test } from "bun:test"
import { parseLines_ViewModel } from "../source/ViewModel_TextEditor.ts"
import { retry } from "../playground/examples/javascript.ts"
import { module_JavaScript, module_Markdown } from "../playground/syntax.ts"

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

// a text's lines as the editor works them out with the playground's
// Markdown module: each line's segments, a marked one as every kind it's
// inside and its text, a plain one as its text alone, without the spaces at
// its ends, and none when it's only spaces
function syntaxOf_Markdown(
  multilineText: string
): Array<Array<string>> {
  return parseLines_ViewModel({ multilineText, module_Language: module_Markdown }).map((line) =>
    line.segments.flatMap((segment) => {
      const syntax = segment.attributes["data-syntax"]
      return syntax === undefined ? (segment.text.trim() === "" ? [] : [segment.text.trim()]) : [`${syntax}: ${segment.text}`]
    })
  )
}

test("Markdown's marks are its syntax: a heading's #s are a marker inside the heading, and what's on it is worked out in turn; strong words, emphasised ones, code and a link each hold their markers, the characters that mark them, kept as they're written", () => {
  expect(syntaxOf_Markdown("## Use *it*\nSee `retry`, **please**, or [the guide](https://example.com).")).toEqual([
    ["heading marker: ##", "heading:  Use ", "heading emphasis marker: *", "heading emphasis: it", "heading emphasis marker: *"],
    ["See", "code marker: `", "code: retry", "code marker: `", ",", "strong marker: **", "strong: please", "strong marker: **", ", or", "marker: [", "link: the guide", "marker: ](", "url: https://example.com", "marker: )", "."],
  ])
})

test("a list's bullet and a quote's > are markers, a quote's words a quote; a rule and a table's lines between its rows are markers whole, its pipes markers", () => {
  expect(syntaxOf_Markdown("- one\n12. two\n> said *so*\n---\n| a | b |\n|---|---|")).toEqual([
    ["marker: -", "one"],
    ["marker: 12.", "two"],
    ["quote marker: >", "quote:  said ", "quote emphasis marker: *", "quote emphasis: so", "quote emphasis marker: *"],
    ["marker: ---"],
    ["marker: |", "a", "marker: |", "b", "marker: |"],
    ["marker: |---|---|"],
  ])
})

test("an _ inside a word, and an escaped *, mark nothing; what's inside code isn't worked out", () => {
  expect(syntaxOf_Markdown("snake_case_name and \\*not\\* and `*code*`")).toEqual([
    ["snake_case_name and", "marker: \\", "*not", "marker: \\", "* and", "code marker: `", "code: *code*", "code marker: `"],
  ])
})

test("a fence's code is the JavaScript module's where the fence says it's js, carrying its state over its lines, as a block comment's; any other's, code as a whole; the fence closing with as many of its characters or more, and nothing inside it Markdown", () => {
  expect(syntaxOf_Markdown("```js\n/* a\nb */ const x = 1;\n```\n~~~~sh\n# no\n~~~\n~~~~~\n# yes")).toEqual([
    ["marker: ```js"],
    ["comment: /* a"],
    ["comment: b */", "keyword: const", "x =", "number: 1", ";"],
    ["marker: ```"],
    ["marker: ~~~~sh"],
    ["code: # no"],
    ["code: ~~~"],
    ["marker: ~~~~~"],
    ["heading marker: #", "heading:  yes"],
  ])
})
