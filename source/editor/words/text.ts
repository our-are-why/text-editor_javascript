import type { _Module_Words_ } from "../ViewModel_TextEditor.ts"

export {
  MODULE_WORDS_TEXT
}

const MODULE_WORDS_TEXT: _Module_Words_ = {
  wordsOf: (text) => Array.from(SEGMENTER_WORD.segment(text)).filter((segment) => segment.isWordLike === true).map((segment) => ({
    from: segment.index,
    to: segment.index + segment.segment.length
  }))
}

const SEGMENTER_WORD = new Intl.Segmenter(
  undefined,
  {
    granularity: "word"
  }
)
