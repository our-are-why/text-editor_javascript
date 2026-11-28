import type { _Scene_ } from "../scene.ts"
import {
  MODULE_PLAINTEXT,
  MODULE_READING_TEXT
} from "../../source/ui/editor/index.ts"
import { ACTIONS_REVIEW } from "../../source/ui/host/index.ts"
import { projectedOf } from "../projected.ts"

export {
  proposalsNewFile,
  proposalsDeletedFile
}

// a file an agent made in its copy, proposed: the file empty, as it isn't
// there yet, one change putting in the whole of its text, the proposal said
// to make it
const proposalsNewFile: _Scene_ = {
  name: "proposals-new-file",
  title: "A new file proposed",
  look: "A file that isn't there yet, empty, and one proposal putting in the whole of its text, every line of it put in, green. In the frame's list, the proposal says New file before its title, small and grey, so it's read first; accepted and applied, the file's made.",
  size: "tile",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: projectedOf({
    multilineText: "",
    marks: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT,
    proposed: [
      { source: "backoff", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 0 } }, multilineText: "# Backoff\n\nEach retry waits twice as long as the one before,\nup to a second.\n", marks: [] }] }
    ],
    proposals: [
      { source: "backoff", title: "Say how it backs off", state: "OPEN", effect: "MAKE", status: "", rationale: "How long each wait is is worth a page of its own; the README only says that it backs off.", requests: [], actions: ACTIONS_REVIEW, attributes: {} }
    ],
    rounds_Landed: [],
    ranges_Frame: []
  }),
}

// a file an agent deleted in its copy, proposed: one change taking out the
// whole of its text, the proposal said to delete it
const proposalsDeletedFile: _Scene_ = {
  name: "proposals-deleted-file",
  title: "A file's deletion proposed",
  look: "A file, and one proposal taking out the whole of its text, every line of it taken out, red. In the frame's list, the proposal says Deletes the file before its title, small and grey, so it's read first, as what it does to the file isn't what it does to its lines: accepted and applied, the file's deleted, not left empty.",
  size: "tile",
  variables: {},
  labels: [],
  invariants: [],
  viewModel_TextEditor: projectedOf({
    multilineText: "// the retry loop before it took options\nexport function retryOld(fn) {\n  return retry(fn, { attempts: 5 });\n}\n",
    marks: [],
    module_Language: MODULE_PLAINTEXT,
    module_Reading: MODULE_READING_TEXT,
    proposed: [
      { source: "drop", changes: [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 4, offset: 0 } }, multilineText: "", marks: [] }] }
    ],
    proposals: [
      { source: "drop", title: "Drop the old retry helper", state: "OPEN", effect: "REMOVE", status: "", rationale: "Nothing calls retryOld since retry took its options.", requests: [], actions: ACTIONS_REVIEW, attributes: {} }
    ],
    rounds_Landed: [],
    ranges_Frame: []
  }),
}
