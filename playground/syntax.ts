import type {
  _Stretch_Line_,
  _Module_Language_,
  _Syntax_Line_
} from "../source/editor/index.ts"

export {
  type _Syntax_,
  type _State_JavaScript_,
  module_JavaScript,
  type _Syntax_Markdown_,
  type _State_Markdown_,
  type _Fence_Markdown_,
  module_Markdown
}

// what a stretch of code is, as the playground names it, the host's names,
// never how it looks: a stylesheet colours each by its data-syntax.
// Punctuation, operators and other names are left as they are
type _Syntax_ = "comment" | "string" | "number" | "keyword" | "literal" | "function" | "property" | "regexp"

// what a line of JavaScript starts inside of, carried over from the line
// before it: code, a block comment, or a template literal's text; for each
// substitution, ${…}, it's inside of, how many braces of its own are open
// in it; and whether a / here would start a regular expression, not divide
interface _State_JavaScript_ {
  inside: "code" | "comment" | "template"
  braces: Array<number>
  regexp: boolean
}

// JavaScript, as a language module the editor works each line out with,
// from the state the line before it left, starting in code: a stand-in for
// a real module, enough for the playground's code, not a parser. It knows a
// regular expression from a division by what comes before it
const module_JavaScript: _Module_Language_<_State_JavaScript_> = {
  state_Start: { inside: "code", braces: [], regexp: true },
  syntaxOf__Line: ({ text, state_Before }) => lineOf(text, state_Before),
}

const keywords = new Set(["async", "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends", "finally", "for", "from", "function", "if", "import", "in", "instanceof", "let", "new", "of", "return", "static", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"])
const literals = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"])

// after these, a / starts a regular expression, as an expression comes next
const beforeExpression = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"])

// a line's stretches, from the state the line before it left, and the state
// it leaves for the line after it, new, so a state once left never changes
function lineOf(
  text: string,
  before: _State_JavaScript_
): _Syntax_Line_<_State_JavaScript_> {
  const stretches: Array<_Stretch_Line_> = []
  // a stretch, joined to the one before it when they're the same syntax
  // and meet, as a template literal's text and its backtick do
  const mark = (from: number, to: number, syntax: _Syntax_) => {
    const last = stretches.at(-1)
    if (last !== undefined && last.to === from && last.attributes["data-syntax"] === syntax) last.to = to
    else if (from < to) stretches.push({ from, to, attributes: { "data-syntax": syntax } })
  }
  let { inside, regexp } = before
  const braces = [...before.braces]
  let afterDot = false
  let at = 0
  while (at < text.length) {
    if (inside === "comment") {
      const end = text.indexOf("*/", at)
      const to = end === -1 ? text.length : end + 2
      mark(at, to, "comment")
      if (end !== -1) inside = "code"
      at = to
      continue
    }
    if (inside === "template") {
      let end = at
      while (end < text.length && text[end] !== "`" && !text.startsWith("${", end)) end += text[end] === "\\" ? 2 : 1
      end = Math.min(end, text.length)
      if (text[end] === "`") {
        mark(at, end + 1, "string")
        inside = "code"
        regexp = false
        at = end + 1
      } else if (end < text.length) {
        mark(at, end, "string")
        braces.push(0)
        inside = "code"
        regexp = true
        at = end + 2
      } else {
        mark(at, end, "string")
        at = end
      }
      continue
    }
    const rest = text.slice(at)
    const space = /^\s+/.exec(rest)
    if (space !== null) {
      at += space[0].length
      continue
    }
    if (rest.startsWith("//")) {
      mark(at, text.length, "comment")
      at = text.length
      continue
    }
    if (rest.startsWith("/*")) {
      mark(at, at + 2, "comment")
      inside = "comment"
      at += 2
      continue
    }
    if (rest.startsWith("...")) {
      at += 3
      regexp = true
      afterDot = false
      continue
    }
    const string = /^(["'])(?:\\.|(?!\1)[^\\])*\1?/.exec(rest)
    if (string !== null) {
      mark(at, at + string[0].length, "string")
      at += string[0].length
      regexp = false
      afterDot = false
      continue
    }
    if (rest.startsWith("`")) {
      mark(at, at + 1, "string")
      inside = "template"
      at += 1
      afterDot = false
      continue
    }
    const regex = regexp ? /^\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\[])+\/[a-z]*/.exec(rest) : null
    if (regex !== null) {
      mark(at, at + regex[0].length, "regexp")
      at += regex[0].length
      regexp = false
      continue
    }
    const number = /^(?:0[xXbBoO][\da-fA-F_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/.exec(rest)
    if (number !== null) {
      mark(at, at + number[0].length, "number")
      at += number[0].length
      regexp = false
      afterDot = false
      continue
    }
    const word = /^[A-Za-z_$][\w$]*/.exec(rest)
    if (word !== null) {
      const name = word[0]
      const called = /^\s*(?:\?\.)?\(/.test(text.slice(at + name.length))
      const syntax: _Syntax_ | null =
        afterDot ? (called ? "function" : "property")
        : keywords.has(name) ? "keyword"
        : literals.has(name) ? "literal"
        : called ? "function"
        : null
      if (syntax !== null) mark(at, at + name.length, syntax)
      at += name.length
      regexp = !afterDot && beforeExpression.has(name)
      afterDot = false
      continue
    }
    const character = rest[0] ?? ""
    if (character === "{" && braces.length > 0) braces[braces.length - 1] = (braces.at(-1) ?? 0) + 1
    if (character === "}" && braces.length > 0) {
      if (braces.at(-1) === 0) {
        braces.pop()
        inside = "template"
        at += 1
        continue
      }
      braces[braces.length - 1] = (braces.at(-1) ?? 1) - 1
    }
    afterDot = character === "."
    regexp = !")]".includes(character)
    at += 1
  }
  return { stretches, state_After: { inside, braces, regexp } }
}

// what a stretch of Markdown is, as the playground names it, never how it
// looks: a stylesheet styles each by its data-syntax. A marker is syntax,
// characters written to mark what's beside them: a heading's #s, a list's
// bullet, a quote's >, the asterisks round emphasis, a code span's
// backticks, a link's brackets, a fence. What they mark is what it is: a
// heading, strong or emphasised words, code, a link's words and its
// address, a quote. Stretches overlap, a marker inside what it marks, and a
// segment carries every kind it's inside, the words of its data-syntax
type _Syntax_Markdown_ = "marker" | "heading" | "strong" | "emphasis" | "code" | "link" | "url" | "quote"

// what a line of Markdown starts inside of, carried over from the line
// before it: a fenced block of code, or nothing
interface _State_Markdown_ {
  fence: _Fence_Markdown_ | null
}

// a fence: its characters, ``` or ~~~, as many as it opened with or more
// closing it; and, where it says its code's JavaScript, the state the line
// before it left JavaScript in
interface _Fence_Markdown_ {
  characters: string
  state_JavaScript: _State_JavaScript_ | null
}

// Markdown, as a language module the editor works each line out with, a
// stand-in for a real module, enough for the playground's Markdown, not a
// parser. Its marks are its syntax: what's bold is between its asterisks,
// which stay as they're written. A fenced block's code is the JavaScript
// module's to work out where the fence says it's js; any other's, code
const module_Markdown: _Module_Language_<_State_Markdown_> = {
  state_Start: { fence: null },
  syntaxOf__Line: ({ text, state_Before }) => lineOf_Markdown(text, state_Before),
}

// the words a fence says its code is JavaScript with
const languages_JavaScript = new Set(["js", "javascript"])

// a line's stretches, from the state the line before it left, and the state
// it leaves for the line after it: inside a fence, its code, or the fence
// closing; else a fence opening, a heading, a rule, a table's row, or a line
// of words, quoted, a list's item, both or neither
function lineOf_Markdown(
  text: string,
  before: _State_Markdown_
): _Syntax_Line_<_State_Markdown_> {
  const stretches: Array<_Stretch_Line_> = []
  const mark = (from: number, to: number, syntax: _Syntax_Markdown_) => {
    if (from < to) stretches.push({ from, to, attributes: { "data-syntax": syntax } })
  }
  const [, characters_Fence = "", info_Fence = ""] = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(text) ?? []
  if (before.fence !== null) {
    const { characters, state_JavaScript } = before.fence
    if (characters_Fence[0] === characters[0] && characters_Fence.length >= characters.length && info_Fence.trim() === "") {
      mark(0, text.length, "marker")
      return { stretches, state_After: { fence: null } }
    }
    if (state_JavaScript === null) {
      mark(0, text.length, "code")
      return { stretches, state_After: { fence: { characters, state_JavaScript } } }
    }
    const line_JavaScript = lineOf(text, state_JavaScript)
    return { stretches: line_JavaScript.stretches, state_After: { fence: { characters, state_JavaScript: line_JavaScript.state_After } } }
  }
  if (characters_Fence !== "" && !(characters_Fence[0] === "`" && info_Fence.includes("`"))) {
    mark(0, text.length, "marker")
    const language = info_Fence.trim().split(/\s+/)[0] ?? ""
    return { stretches, state_After: { fence: { characters: characters_Fence, state_JavaScript: languages_JavaScript.has(language) ? module_JavaScript.state_Start : null } } }
  }
  const heading = /^( {0,3})(#{1,6})(?:[ \t]|$)/.exec(text)
  if (heading !== null) {
    const [whole, indent = "", hashes = ""] = heading
    mark(0, text.length, "heading")
    mark(indent.length, indent.length + hashes.length, "marker")
    inlineOf_Markdown(text, whole.length, text.length, mark)
    return { stretches, state_After: { fence: null } }
  }
  if (/^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(text)) {
    mark(0, text.length, "marker")
    return { stretches, state_After: { fence: null } }
  }
  if (/^[ \t]*\|/.test(text)) {
    if (/^[ \t|:-]+$/.test(text)) mark(0, text.length, "marker")
    else {
      for (const pipe of text.matchAll(/\|/g)) mark(pipe.index, pipe.index + 1, "marker")
      inlineOf_Markdown(text, 0, text.length, mark)
    }
    return { stretches, state_After: { fence: null } }
  }
  const quote = /^ {0,3}>[ \t]?/.exec(text)
  const after_Quote = quote?.[0].length ?? 0
  if (quote !== null) {
    const at = quote[0].indexOf(">")
    mark(0, text.length, "quote")
    mark(at, at + 1, "marker")
  }
  const [whole_Item = "", indent_Item = "", bullet = ""] = /^([ \t]*)([-*+]|\d{1,9}[.)])(?:[ \t]+|$)/.exec(text.slice(after_Quote)) ?? []
  mark(after_Quote + indent_Item.length, after_Quote + indent_Item.length + bullet.length, "marker")
  inlineOf_Markdown(text, after_Quote + whole_Item.length, text.length, mark)
  return { stretches, state_After: { fence: null } }
}

// the words of a line from a character to another, each stretch marked as
// what it is: a backslash's escape; code, between backticks; a link; words
// between ** or __, strong; or * or _, emphasised, an _ inside a word
// being none. What's inside a link, or strong or emphasised words, is
// worked out in turn; what's inside code, not
function inlineOf_Markdown(
  text: string,
  from: number,
  to: number,
  mark: (from: number, to: number, syntax: _Syntax_Markdown_) => void
): void {
  let at = from
  while (at < to) {
    const rest = text.slice(at, to)
    if (/^\\[!-/:-@[-`{-~]/.test(rest)) {
      mark(at, at + 1, "marker")
      at += 2
      continue
    }
    const code = /^(`+)(.+?)(?<!`)\1(?!`)/.exec(rest)
    if (code !== null) {
      const ticks = code[1]?.length ?? 0
      const end = at + code[0].length
      mark(at, end, "code")
      mark(at, at + ticks, "marker")
      mark(end - ticks, end, "marker")
      at = end
      continue
    }
    const link = /^\[([^\]]+)\]\(([^()\s]*)\)/.exec(rest)
    if (link !== null) {
      const [whole, words = "", url = ""] = link
      const from_Url = at + words.length + 3
      mark(at, at + 1, "marker")
      mark(at + 1, at + 1 + words.length, "link")
      inlineOf_Markdown(text, at + 1, at + 1 + words.length, mark)
      mark(at + 1 + words.length, from_Url, "marker")
      mark(from_Url, from_Url + url.length, "url")
      mark(from_Url + url.length, at + whole.length, "marker")
      at += whole.length
      continue
    }
    const [whole_Stressed = "", delimiter = ""] = /^(\*\*|__|\*|_)(?=\S)(.*?\S)\1/.exec(rest) ?? []
    if (whole_Stressed !== "" && !(delimiter[0] === "_" && /\w/.test(text[at - 1] ?? ""))) {
      const end = at + whole_Stressed.length
      mark(at, end, delimiter.length === 2 ? "strong" : "emphasis")
      mark(at, at + delimiter.length, "marker")
      inlineOf_Markdown(text, at + delimiter.length, end - delimiter.length, mark)
      mark(end - delimiter.length, end, "marker")
      at = end
      continue
    }
    at += 1
  }
}
