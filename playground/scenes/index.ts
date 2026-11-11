import type { _Scene_ } from "../scene.ts"
import { code } from "./code.ts"
import { empty } from "./empty.ts"
import { everything } from "./everything.ts"
import { longWords } from "./longWords.ts"
import { markdown } from "./markdown.ts"
import { narrow } from "./narrow.ts"
import { oneLine } from "./oneLine.ts"
import { plainText } from "./plainText.ts"
import { prose } from "./prose.ts"
import { proposalsCode } from "./proposalsCode.ts"
import { proposalsProse } from "./proposalsProse.ts"
import { scripts } from "./scripts.ts"
import { theme } from "./theme.ts"

export {
  scenes
}

// every scene, in the order the gallery draws them: the main example, which
// the tests draw too; proposals, while they're being worked out; then the
// simplest first
const scenes: Array<_Scene_> = [everything, proposalsProse, proposalsCode, empty, oneLine, plainText, prose, code, markdown, theme, longWords, narrow, scripts]
