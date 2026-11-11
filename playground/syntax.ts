import type { _Stretch_Line_, _Module_Language_, _Syntax_Line_ } from "../source/ViewModel_TextEditor.ts"

export {
  type _Syntax_,
  type _State_JavaScript_,
  module_JavaScript
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
