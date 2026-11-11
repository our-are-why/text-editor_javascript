import type { _Scene_ } from "../scene.ts"
import { viewModelOf__Blocks, MODULE_PLAINTEXT } from "../../source/ViewModel_TextEditor.ts"
import { blocksOf__Text } from "../lines.ts"

export {
  scripts
}

// a line of each of several writing systems, and lines written right to left
const greetings = `Accents, written as one character: café, naïve, Ångström, São Paulo
Accents, written as a letter, then its accent: café, naïve
Greek: Καλημέρα κόσμε
Cyrillic: Доброе утро, мир
Chinese, with no spaces to break at: 早上好，世界。这是一行没有空格的中文，看看它在哪里换行，因为它比一个视图还要宽得多。
Japanese: おはようございます。日本語の文も空白なしで続きます。
Korean: 좋은 아침입니다, 세계
Thai, with no spaces between words: สวัสดีตอนเช้าชาวโลก
Devanagari: नमस्ते दुनिया
Emoji, some made of several characters: 👍 👍🏽 🇳🇿 👩‍👩‍👧 ❤️ 🧑🏻‍💻

שלום עולם, זו שורה שכולה בעברית.
مرحبا بالعالم، هذا سطر كله بالعربية.
Both directions in one line: the word שלום means peace, as سلام does, and both read right to left.`

const scripts: _Scene_ = {
  name: "scripts",
  title: "Writing systems",
  look: "Each line laid out as the browser lays it out: accents look the same, written either way; Chinese, Japanese and Thai wrap with no spaces to break at; an emoji made of several characters shows as one. The lines in Hebrew and Arabic are shown, but editing text written right to left is left out to begin with: it'll be edited in the order it's written, which isn't always where the eye expects.",
  size: "wide",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: viewModelOf__Blocks(blocksOf__Text(greetings, MODULE_PLAINTEXT)),
}
