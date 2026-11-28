import { expect, test } from "bun:test"
import { _Tasks_ } from "../source/core/tasks/index.ts"
import { _Documents_, parseTexts_Line, flatOf__Text, textWith__Sources, refusalsAcross__Sources, type _Text_Model_, type _Change_ } from "../source/core/documents/index.ts"
import { _Host_ } from "../source/ui/host/index.ts"
import { viewModelOf__Model, MODULE_PLAINTEXT } from "../source/ui/editor/index.ts"
import { MODULE_READING_TEXT } from "../source/ui/editor/readings/text.ts"
import { _Shell_, changesOf__Copy, stampOf__Changes, landingOf__Grouping, movedOf__Changes, framesOf__Copy, LANDING_NONE, type _Grouping_Job_, type _Job_Shell_, type _Landing_Handed_, type _File_Copy_, type _Given_Job_, type _Move_Grouped_, type _Proposal_Grouped_ } from "../source/core/shell/index.ts"

// an agent's working copy as the core sees it: what it's given, each file
// of its task as the task has it; what it changed, numbered, narrowed to
// the words that differ; and its hand back, grouped into proposals, checked
// and mapped onto the file, through your edits, a revision a proposal's next
// version, landed on the task

const TEXT = "const ATTEMPTS = 5;\nconst DELAY_MS = 100;\n\nexport function retry() {}\n"
const textOf = (text: string): _Text_Model_ => ({ lines: parseTexts_Line(text), marks: [] })
const madeOf = (id: string, notes: string) => ({ id, notes, aim: { kind: "DOCUMENT" as const, path: "retry.js", words: { kind: "ALL" as const } } })
const shellMade = () => {
  const shell = new _Shell_({
    tasks: new _Tasks_({ model_Tasks: { tasks: [] }, observers: [] }),
    documents: new _Documents_({ model_Documents: { documents: [] }, observers: [] }),
    jobs: [],
    observers: [{ changed: () => {}, started: () => {}, stopped: () => {}, landed: () => {} }]
  })
  shell.handle({ kind: "OPEN_DOCUMENT", path: "retry.js", text: textOf(TEXT), isPresent: true })
  return shell
}
const takenOf = (shell: _Shell_, id_Job: string) => {
  shell.handle({ kind: "TAKE", id_Job, note: "starting" })
  const job_Shell = shell.jobOf(id_Job)
  if (job_Shell === undefined || job_Shell.state.kind !== "BEING_WORKED_ON") throw new Error(`${id_Job} isn't taken`)
  return { job_Shell, givens: job_Shell.state.givens }
}
// every file framed whole, so no change is on lines no frame holds
const framesWholeOf = (files: Array<_File_Copy_>) => files.map((file) => ({ path: file.given.path, first: 1, last: file.given.text.lines.length }))
const checkedOf = (shell: _Shell_, job_Shell: _Job_Shell_, text_Copy: string, grouping: (stamp: string) => Omit<_Grouping_Job_, "stamp" | "moves" | "frames">) => {
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens[0] : undefined
  const task = shell.taskOf(job_Shell.id_Task)
  if (given === undefined || task === undefined) throw new Error("no given")
  const files = [{ given, effect: "CHANGE" as const, text_Copy: textOf(text_Copy) }]
  const stamp = stampOf__Changes({ changes: changesOf__Copy({ files }) })
  return landingOf__Grouping({ task, job_Shell, files, unplaceables: [], grouping: { stamp, moves: [], frames: framesWholeOf(files), ...grouping(stamp) } })
}

test("an agent's changes in its copy, numbered across its files, each narrowed to the words that differ, what was there and what's there now", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { givens } = takenOf(shell, "j-1")
  const changes = changesOf__Copy({ files: [{ given: givens[0]!, effect: "CHANGE", text_Copy: textOf(TEXT.replace("= 5;", "= 3;").replace("retry()", "retry(attempt)")) }] })
  expect(changes.map((change) => [change.number, change.path, change.range.from.line + 1, change.before, change.after])).toEqual([[1, "retry.js", 1, "5", "3"], [2, "retry.js", 4, "", "attempt"]])
})

test("handed back grouped, a new proposal lands on the task's head, its changes placed on the file as given, its request answered by it; the file itself unchanged, for review", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { job_Shell } = takenOf(shell, "j-1")
  const checked = checkedOf(shell, job_Shell, TEXT.replace("= 5;", "= 3;"), () => ({ proposals: [{ aim: { kind: "NEW" }, title: "Fewer attempts", why: "Five is too many.", numbers: [1], ids_Request: ["r-1"] }], nothings: [] }))
  expect([checked.issues, checked.reports]).toEqual([[], []])
  shell.handle({ kind: "HAND_BACK", id_Job: "j-1", landing: checked.landing, note: "Done." })
  const task = shell.taskOf("T-1")
  const head = task?.heads.find((head_Each) => head_Each.path === "retry.js")
  const model = { document: shell.documentOf("retry.js").text, proposed: head?.proposed ?? [] }
  expect(task?.proposals.map((proposal) => [proposal.id, proposal.title, proposal.rationale, proposal.decision])).toEqual([["j-1.1", "Fewer attempts", "Five is too many.", "OPEN"]])
  expect(task?.requests.map((request) => request.status)).toEqual([{ kind: "ADDRESSED", answer: { kind: "PROPOSALS", ids_Proposal: ["j-1.1"] } }])
  expect(flatOf__Text(textWith__Sources({ model_TextEditor: model, sources: ["j-1.1"] }))).toBe(TEXT.replace("= 5;", "= 3;"))
  expect(flatOf__Text(shell.documentOf("retry.js").text)).toBe(TEXT)
})

test("a hand back's issues, each said: a stamp that's not the changes', a change in no proposal and one in two, a request unanswered and one that isn't, a proposal without its title or why, and a file it can't place; a request answered with nothing, its why; and reports, never refusals, of a request outside the job answered", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: false, path: "retry.js" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("r-2", "Name it."), isStarting: false, path: "retry.js" })
  shell.handle({ kind: "START", id_Task: "T-1", scope: { kind: "REQUESTS", ids_Request: ["r-1"] }, path: "retry.js" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("r-3", "Later."), isStarting: false, path: "retry.js" })
  const { job_Shell } = takenOf(shell, "j-1")
  const text_Copy = TEXT.replace("= 5;", "= 3;").replace("= 100;", "= 250;")
  const checked_Bad = checkedOf(shell, job_Shell, text_Copy, () => ({ proposals: [{ aim: { kind: "NEW" }, title: "", why: "", numbers: [1, 9], ids_Request: ["r-9"] }], nothings: [] }))
  const task = shell.taskOf("T-1")!
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens[0]! : undefined!
  const checked_Stale = landingOf__Grouping({ task, job_Shell, files: [{ given, effect: "CHANGE", text_Copy: textOf(text_Copy) }], unplaceables: [{ path: "notes.md", why: "was made in your copy" }], grouping: { stamp: "old", moves: [], frames: [{ path: "retry.js", first: 1, last: given.text.lines.length }], proposals: [], nothings: [{ id_Request: "r-1", why: "" }] } })
  const checked_Twice = checkedOf(shell, job_Shell, text_Copy, () => ({ proposals: [{ aim: { kind: "NEW" }, title: "One", why: "Why.", numbers: [1, 2], ids_Request: ["r-1"] }, { aim: { kind: "NEW" }, title: "Two", why: "Why.", numbers: [2], ids_Request: ["r-3"] }], nothings: [] }))
  expect(checked_Bad.issues).toEqual([
    "there's no change 9",
    "change 2 is in no proposal",
    "there's no request r-9",
    "request r-1 isn't answered: put it in the answers of the proposal it's answered by, or say why nothing needs to change",
    "a proposal with changes 1, 9 has no title",
    "proposal \"\" doesn't say why"
  ])
  expect(checked_Stale.issues).toEqual([
    "the copy's changed since you asked what you changed, or you've given no stamp: ask what you changed again, and hand back with the stamp it gives",
    "notes.md was made in your copy",
    "change 1 is in no proposal",
    "change 2 is in no proposal",
    "say why request r-1 needs nothing"
  ])
  expect([checked_Twice.issues, checked_Twice.reports]).toEqual([["change 2 is in more than one proposal"], ["request r-3 isn't this job's, so answering it here leaves it as it is"]])
})

// files made or deleted in a copy: a file the project hasn't opened absent,
// empty, as the program opens it, given as it is; a copy's files grouped,
// one proposal a file, and landed, as a hand back lands them
const givenOf = (shell: _Shell_, path: string): _Given_Job_ => {
  const document = shell.documentOf(path)
  return { path, version: document.version, text_Document: document.text, proposed: [], sources: [], text: document.text, isPresent: document.isPresent, frames: [] }
}
const absentOpened = (shell: _Shell_, path: string) => shell.handle({ kind: "OPEN_DOCUMENT", path, text: textOf(""), isPresent: false })
const filesLanded = (shell: _Shell_, job_Shell: _Job_Shell_, files: Array<_File_Copy_>, titles: Array<string>, id_Request: string) => {
  const task = shell.taskOf(job_Shell.id_Task)
  if (task === undefined) throw new Error("no task")
  const changes = changesOf__Copy({ files })
  const checked = landingOf__Grouping({ task, job_Shell, files, unplaceables: [], grouping: { stamp: stampOf__Changes({ changes }), moves: [], frames: framesWholeOf(files), proposals: titles.map((title, index) => ({ aim: { kind: "NEW" as const }, title, why: "Why.", numbers: [index + 1], ids_Request: [id_Request] })), nothings: [] } })
  if (checked.issues.length === 0) shell.handle({ kind: "HAND_BACK", id_Job: job_Shell.id, landing: checked.landing, note: "" })
  return { changes, checked }
}
// each proposal the editor lists in a file's frames, and what it says it
// does to the file, through the host, as a page draws it
const itemsDrawnOf = (shell: _Shell_, path: string) => {
  const host = new _Host_({ name_Document: path, target_Mode: { kind: "TASK", id: "T-1" }, files: ["retry.js"], isListening_Agent: false, at: Date.now(), attributes: new Map(), state_Shell: shell.state(), suffix_Id: "", observers: [{ sent: () => {}, opening: () => {}, gone: () => {}, shown: () => {}, boarded: () => {} }] })
  const update_Host = host.showing()?.update_Host
  if (update_Host === undefined) throw new Error("nothing shown")
  const viewModel = viewModelOf__Model({ ...update_Host, source_Yours: "yours", ranges_Frame: [], module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT })
  return viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => [item.source, item.label_Effect]) : []) : [])
}
const BACKOFF = "# Backoff\n\nEach retry waits twice as long as the one before.\n"

test("a file made in the copy lands as a new file: one change, its whole text, on the file opened absent and empty, the proposal said to make it and drawn as a new file; the file not there till it's accepted and the task applied, a job given it meanwhile as the task has it, there once accepted; one rejected never made", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Say how it backs off."), isStarting: true, path: "retry.js" })
  const first = takenOf(shell, "j-1")
  absentOpened(shell, "docs/backoff.md")
  absentOpened(shell, "docs/jitter.md")
  const { changes, checked } = filesLanded(shell, first.job_Shell, [
    { given: givenOf(shell, "docs/backoff.md"), effect: "MAKE", text_Copy: textOf(BACKOFF) },
    { given: givenOf(shell, "docs/jitter.md"), effect: "MAKE", text_Copy: textOf("# Jitter\n") }
  ], ["Say how it backs off", "Say it jitters"], "r-1")
  expect(changes.map((change) => [change.number, change.path, change.effect, change.before, change.after])).toEqual([[1, "docs/backoff.md", "MAKE", "", BACKOFF], [2, "docs/jitter.md", "MAKE", "", "# Jitter\n"]])
  expect(checked.issues).toEqual([])
  expect(checked.landing.proposals.map((proposal) => [proposal.id, proposal.path, proposal.effect, proposal.changes])).toEqual([
    ["j-1.1", "docs/backoff.md", "MAKE", [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 0 } }, next: textOf(BACKOFF) }]],
    ["j-1.2", "docs/jitter.md", "MAKE", [{ kind: "REPLACE", range: { from: { line: 0, offset: 0 }, to: { line: 0, offset: 0 } }, next: textOf("# Jitter\n") }]]
  ])
  expect(itemsDrawnOf(shell, "docs/backoff.md")).toEqual([["j-1.1", "New file"]])
  expect(shell.documentOf("docs/backoff.md").isPresent).toBe(false)
  shell.handle({ kind: "DECIDE", id_Task: "T-1", id_Proposal: "j-1.1", decision: "ACCEPTED" })
  shell.handle({ kind: "DECIDE", id_Task: "T-1", id_Proposal: "j-1.2", decision: "REJECTED" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf("r-2", "Check it."), isStarting: true, path: "retry.js" })
  const second = takenOf(shell, "j-2")
  expect(second.givens.map((given) => [given.path, given.isPresent, flatOf__Text(given.text)])).toEqual([["retry.js", true, TEXT], ["docs/backoff.md", true, BACKOFF], ["docs/jitter.md", false, ""]])
  shell.handle({ kind: "HAND_BACK", id_Job: "j-2", landing: LANDING_NONE, note: "Nothing to change." })
  shell.handle({ kind: "END", id_Task: "T-1", kind_End: "APPLY" })
  expect(["docs/backoff.md", "docs/jitter.md"].map((path) => [path, shell.documentOf(path).isPresent, flatOf__Text(shell.documentOf(path).text)])).toEqual([["docs/backoff.md", true, BACKOFF], ["docs/jitter.md", false, ""]])
})

test("a file deleted in the copy lands as a deletion: one change, its whole text taken away, the proposal said to delete it and drawn so; once accepted a job given it absent, as the task has it, its revision refused to make it again, as a file made goes in a proposal of its own; the task applied, the file absent", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Drop it."), isStarting: true, path: "retry.js" })
  const first = takenOf(shell, "j-1")
  const { changes, checked } = filesLanded(shell, first.job_Shell, [{ given: first.givens[0]!, effect: "REMOVE", text_Copy: textOf("") }], ["Drop retry.js"], "r-1")
  expect(changes.map((change) => [change.number, change.effect, change.range, change.before, change.after])).toEqual([[1, "REMOVE", { from: { line: 0, offset: 0 }, to: { line: 4, offset: 0 } }, TEXT, ""]])
  expect([checked.issues, checked.landing.proposals.map((proposal) => [proposal.id, proposal.effect])]).toEqual([[], [["j-1.1", "REMOVE"]]])
  expect(itemsDrawnOf(shell, "retry.js")).toEqual([["j-1.1", "Deletes the file"]])
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Keep it after all.", aim: { kind: "PROPOSAL", id_Proposal: "j-1.1", words: { kind: "ALL" } } }, isStarting: true, path: "retry.js" })
  const second = takenOf(shell, "j-2")
  const given = second.givens[0]!
  const task = shell.taskOf("T-1")!
  const files: Array<_File_Copy_> = [{ given, effect: "MAKE", text_Copy: textOf(TEXT) }]
  const revised = landingOf__Grouping({ task, job_Shell: second.job_Shell, files, unplaceables: [], grouping: { stamp: stampOf__Changes({ changes: changesOf__Copy({ files }) }), moves: [], frames: framesWholeOf(files), proposals: [{ aim: { kind: "REVISION", id_Proposal: "j-1.1" }, title: "", why: "Kept.", numbers: [1], ids_Request: ["r-2"] }], nothings: [] } })
  expect([given.isPresent, flatOf__Text(given.text)]).toEqual([false, ""])
  expect(revised.issues).toEqual(["change 1 makes retry.js: a file made or deleted goes in a new proposal of its own, not a revision"])
  shell.handle({ kind: "HAND_BACK", id_Job: "j-2", landing: LANDING_NONE, note: "Left as it was." })
  shell.handle({ kind: "DECIDE", id_Task: "T-1", id_Proposal: "j-1.1", decision: "ACCEPTED" })
  shell.handle({ kind: "END", id_Task: "T-1", kind_End: "APPLY" })
  expect([shell.documentOf("retry.js").isPresent, flatOf__Text(shell.documentOf("retry.js").text)]).toEqual([false, ""])
})

// text an agent moved in its copy: a file of functions, one moved, as the
// agent says, its two sides one move, and an edit in it, if any, a proposal
// of its own; what lands applied all of it the copy, every way round
const blockOf = (name: string, value: string) => `function ${name}() {\n  return ${value}\n}\n`
const FUNCTIONS = [
  "function attempts() {\n  return 5\n}\n",
  "function delayOf(attempt) {\n  const base = 100\n  return base * 2 ** attempt\n}\n",
  "export async function retry(fn) {\n  for (let attempt = 0; attempt < attempts(); attempt += 1) {\n    try {\n      return await fn()\n    } catch {\n      await sleep(delayOf(attempt))\n    }\n  }\n}\n",
  "function sleep(ms) {\n  return new Promise((resolve) => setTimeout(resolve, ms))\n}\n"
]
const movesLanded = (text_Before: string, text_After: string, sides: (changes: Array<{ number: number, before: string, after: string }>) => Array<_Move_Grouped_>, proposals: (moves: Array<{ numbers: Array<number>, numbers_Inside: Array<number> }>, numbers: Array<number>) => Array<Omit<_Proposal_Grouped_, "aim" | "why" | "ids_Request">>) => {
  const shell = shellMade()
  shell.handle({ kind: "OPEN_DOCUMENT", path: "moves.js", text: textOf(text_Before), isPresent: true })
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { job_Shell } = takenOf(shell, "j-1")
  const files: Array<_File_Copy_> = [{ given: givenOf(shell, "moves.js"), effect: "CHANGE", text_Copy: textOf(text_After) }]
  const changes = changesOf__Copy({ files })
  const moves = sides(changes)
  const moved = movedOf__Changes({ files, changes, moves })
  const grouped = proposals(moved.moves.map((move) => ({ numbers: [move.change_From.number, move.change_To.number], numbers_Inside: move.numbers_Inside })), moved.changes.map((change) => change.number))
  const checked = landingOf__Grouping({ task: shell.taskOf("T-1")!, job_Shell, files, unplaceables: [], grouping: { stamp: stampOf__Changes({ changes }), moves, frames: framesWholeOf(files), proposals: grouped.map((proposal) => ({ ...proposal, aim: { kind: "NEW" as const }, why: "Why.", ids_Request: ["r-1"] })), nothings: [] } })
  const clashes = checked.issues.length > 0 ? [] : shell.clashesOf({ id_Task: "T-1", landing: checked.landing })
  if (checked.issues.length === 0 && clashes.length === 0) shell.handle({ kind: "HAND_BACK", id_Job: "j-1", landing: checked.landing, note: "" })
  const head = shell.taskOf("T-1")?.heads.find((head_Each) => head_Each.path === "moves.js")
  const textWith = (sources: Array<string>) => flatOf__Text(textWith__Sources({ model_TextEditor: { document: shell.documentOf("moves.js").text, proposed: head?.proposed ?? [] }, sources }))
  return { shell, changes, moved, checked, clashes, head, textWith }
}
const sidesOf = (changes: Array<{ number: number, before: string, after: string }>): Array<_Move_Grouped_> => {
  const removal = changes.filter((change) => change.after === "").toSorted((change, change_Other) => change_Other.before.length - change.before.length)[0]
  const insertion = changes.filter((change) => change.before === "").toSorted((change, change_Other) => change_Other.after.length - change.after.length)[0]
  return removal === undefined || insertion === undefined ? [] : [{ number_From: removal.number, number_To: insertion.number }]
}

test("every way a function's moved in a file of four, edited inside or not, said as one move: its sides found, slid till they match, landed as one move, an edit in it a proposal of its own drawn inside it, and what lands, applied, the copy", () => {
  const failures: Array<string> = []
  for (const [index_From, block] of FUNCTIONS.entries()) {
    for (const index_To of FUNCTIONS.keys()) {
      if (index_To === index_From) continue
      for (const isEdited of [false, true]) {
        const rest = FUNCTIONS.filter((_, index) => index !== index_From)
        const block_Moved = isEdited ? block.replace(") {\n", ") { // moved\n") : block
        const text_After = [...rest.slice(0, index_To), block_Moved, ...rest.slice(index_To)].join("\n")
        const landed = movesLanded(FUNCTIONS.join("\n"), text_After, sidesOf, (moves, numbers) => [
          { title: "Move it", numbers: moves.flatMap((move) => move.numbers) },
          ...moves.some((move) => move.numbers_Inside.length > 0) ? [{ title: "Edit it", numbers: moves.flatMap((move) => move.numbers_Inside) }] : [],
          ...numbers.filter((number) => !moves.some((move) => move.numbers.includes(number) || move.numbers_Inside.includes(number))).length > 0 ? [{ title: "The rest", numbers: numbers.filter((number) => !moves.some((move) => move.numbers.includes(number) || move.numbers_Inside.includes(number))) }] : []
        ])
        const name = `${"abcd"[index_From]} to ${index_To}${isEdited ? ", edited" : ""}`
        const proposal_Move = landed.checked.landing.proposals[0]
        if (landed.moved.moves.length !== 1) failures.push(`${name}: no move found in ${landed.changes.length} changes`)
        else if (landed.checked.issues.length > 0 || landed.clashes.length > 0) failures.push(`${name}: ${[...landed.checked.issues, ...landed.clashes].join("; ")}`)
        else if (proposal_Move?.changes.filter((change) => change.kind === "MOVE").length !== 1) failures.push(`${name}: no one move`)
        else if (landed.textWith(landed.checked.landing.proposals.map((proposal) => proposal.id)) !== text_After) failures.push(`${name}: applied, not the copy`)
      }
    }
  }
  expect(failures).toEqual([])
})

test("a function moved down, the comparison's sides each turned by a closing brace and a line, slid till they're the same text: one move, nothing else, drawn as one; and one moved to the top of a file, whose last function has no line after it, its sides slid to the shape that leaves least at its edges: the function moved whole, the line before it taken out and a line put in after it the move's own changes", () => {
  const helper = "const x = 1\n\nfunction helper() {\n  return x\n}\n\nexport function main() {\n  return helper()\n}\n"
  const helper_Moved = "const x = 1\n\nexport function main() {\n  return helper()\n}\n\nfunction helper() {\n  return x\n}\n"
  const down = movesLanded(helper, helper_Moved, sidesOf, (moves) => [{ title: "Helpers after", numbers: moves.flatMap((move) => move.numbers) }])
  const top = movesLanded(FUNCTIONS.join("\n"), [FUNCTIONS[3], ...FUNCTIONS.slice(0, 3)].join("\n"), sidesOf, (moves) => [{ title: "d first", numbers: moves.flatMap((move) => move.numbers) }])
  expect(down.changes.map((change) => [change.before, change.after])).toEqual([["\nfunction helper() {\n  return x\n}\n", ""], ["", "\n}\n\nfunction helper() {\n  return x"]])
  expect([down.checked.issues, down.clashes, down.checked.landing.proposals[0]?.changes]).toEqual([[], [], [{ kind: "MOVE", range: { from: { line: 1, offset: 0 }, to: { line: 5, offset: 0 } }, at: { line: 9, offset: 0 } }]])
  expect(itemsDrawnOf(down.shell, "moves.js")).toEqual([["j-1.1", ""], ["j-1.1", ""]])
  expect(down.textWith(["j-1.1"])).toBe(helper_Moved)
  expect([top.checked.issues, top.clashes, top.checked.landing.proposals[0]?.changes.map((change) => change.kind === "MOVE" ? ["MOVE", change.range.from.line, change.range.to.line, change.at.line] : ["REPLACE", change.range.from.line, change.range.to.line, flatOf__Text(change.next)])]).toEqual([[], [], [["REPLACE", 0, 0, "\n"], ["REPLACE", 18, 19, ""], ["MOVE", 19, 22, 0]]])
  expect(top.textWith(["j-1.1"])).toBe([FUNCTIONS[3], ...FUNCTIONS.slice(0, 3)].join("\n"))
})

test("a move's issues, each said: its sides in two proposals; an edit in it in the move's own; a side that isn't only text taken out or put in; one that's no change; a move between two files; text put in that isn't mostly what's taken out; one change in two moves; and a move in a revision", () => {
  const text_After = [FUNCTIONS[1], FUNCTIONS[2], FUNCTIONS[0]!.replace(") {\n", ") { // moved\n"), FUNCTIONS[3]].join("\n")
  const split = movesLanded(FUNCTIONS.join("\n"), text_After, sidesOf, (moves) => [{ title: "Out", numbers: [moves[0]!.numbers[0]!] }, { title: "In", numbers: [moves[0]!.numbers[1]!, ...moves[0]!.numbers_Inside] }])
  const swapped = movesLanded(FUNCTIONS.join("\n"), text_After, (changes) => sidesOf(changes).map((move) => ({ number_From: move.number_To, number_To: move.number_From })), (_, numbers) => [{ title: "All", numbers }])
  const unlike = movesLanded(FUNCTIONS.join("\n"), [FUNCTIONS[1], FUNCTIONS[2], "const LIMIT = 10\n", FUNCTIONS[3]].join("\n"), sidesOf, (_, numbers) => [{ title: "All", numbers }])
  const twice = movesLanded(FUNCTIONS.join("\n"), text_After, (changes) => [...sidesOf(changes), ...sidesOf(changes), { number_From: 9, number_To: 1 }], (_, numbers) => [{ title: "All", numbers }])
  expect(split.checked.issues).toEqual(["changes 1 and 2 are move 1 to 2, so they go in one proposal", "change 3 is an edit in the text move 1 to 2 moves, drawn inside the move, so it goes in a proposal apart from the move's"])
  expect(swapped.checked.issues).toEqual(["change 2 isn't only text taken out, so move 2 to 1 can't take its text from there", "change 1 isn't only text put in, so move 2 to 1 can't put its text there"])
  expect(unlike.checked.issues).toEqual(["what change 2 puts in isn't mostly what change 1 takes out, starting as it does, so move 1 to 2 can't be drawn as a move: say them apart"])
  expect(twice.checked.issues).toEqual(["change 1 is in more than one move, or both sides of one", "change 2 is in more than one move, or both sides of one", "move 9 to 1 takes its text from change 9, but there's no change 9", "change 1 isn't only text put in, so move 9 to 1 can't put its text there"])
  const shell = shellMade()
  shell.handle({ kind: "OPEN_DOCUMENT", path: "moves.js", text: textOf(FUNCTIONS.join("\n")), isPresent: true })
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { job_Shell, givens } = takenOf(shell, "j-1")
  const files: Array<_File_Copy_> = [{ given: givens[0]!, effect: "CHANGE", text_Copy: textOf(TEXT.replace("const ATTEMPTS = 5;\n", "")) }, { given: givenOf(shell, "moves.js"), effect: "CHANGE", text_Copy: textOf(FUNCTIONS.join("\n") + "const ATTEMPTS = 5;\n") }]
  const changes = changesOf__Copy({ files })
  const across = landingOf__Grouping({ task: shell.taskOf("T-1")!, job_Shell, files, unplaceables: [], grouping: { stamp: stampOf__Changes({ changes }), moves: sidesOf(changes), frames: framesWholeOf(files), proposals: [{ aim: { kind: "REVISION", id_Proposal: "p" }, title: "", why: "Why.", numbers: [1, 2], ids_Request: ["r-1"] }], nothings: [] } })
  expect(changes.map((change) => [change.number, change.path])).toEqual([[1, "moves.js"], [2, "retry.js"]])
  expect(across.issues.filter((issue) => issue.startsWith("move "))).toEqual(["move 2 to 1 goes from retry.js to moves.js: a move stays in its file, for now, so say it as text taken out of one and put in the other"])
  const files_Moved: Array<_File_Copy_> = [{ given: givenOf(shell, "moves.js"), effect: "CHANGE", text_Copy: textOf(text_After) }]
  const changes_Moved = changesOf__Copy({ files: files_Moved })
  const revised = landingOf__Grouping({ task: shell.taskOf("T-1")!, job_Shell, files: files_Moved, unplaceables: [], grouping: { stamp: stampOf__Changes({ changes: changes_Moved }), moves: sidesOf(changes_Moved), frames: framesWholeOf(files_Moved), proposals: [{ aim: { kind: "REVISION", id_Proposal: "p" }, title: "", why: "Why.", numbers: changes_Moved.map((change) => change.number), ids_Request: ["r-1"] }], nothings: [] } })
  expect(revised.issues.filter((issue) => issue.startsWith("move "))).toEqual(["move 1 to 2 is in a revision: a move goes in a new proposal, for now"])
})

// frames, lines read together, the task's: an agent framing what it changed
// on lines no frame holds, in its copy's lines, past what you typed; landed
// on the task's head, merged where they share lines, carried across edits,
// and drawn whole by the editor
const framedLanded = (shell: _Shell_, job_Shell: _Job_Shell_, id_Request: string, edit: (text: string) => string, frames: Array<{ path: string, first: number, last: number }>) => {
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens.find((given_Each) => given_Each.path === "retry.js") : undefined
  if (given === undefined) throw new Error("no given")
  const files: Array<_File_Copy_> = [{ given, effect: "CHANGE", text_Copy: textOf(edit(flatOf__Text(given.text))) }]
  const changes = changesOf__Copy({ files })
  const checked = landingOf__Grouping({ task: shell.taskOf("T-1")!, job_Shell, files, unplaceables: [], grouping: { stamp: stampOf__Changes({ changes }), moves: [], frames, proposals: [{ aim: { kind: "NEW" }, title: "Agent's", why: "Why.", numbers: changes.map((change) => change.number), ids_Request: [id_Request] }], nothings: [] } })
  if (checked.issues.length === 0) shell.handle({ kind: "HAND_BACK", id_Job: job_Shell.id, landing: checked.landing, note: "" })
  return { given, checked, listed: framesOf__Copy({ givens: [given] }) }
}
const framesOf = (shell: _Shell_) => shell.taskOf("T-1")?.heads.find((head) => head.path === "retry.js")?.frames

test("an agent's change on lines no frame holds refused till it frames it, in its copy's lines past the line you typed above it; its frame landed on the task's head in the file's lines; the next job given it in its copy's lines, a change in it needing no other, a frame reaching it making one frame with it; carried across your typing, growing with what's typed in it; and the editor drawing the change's frame whole", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: false, path: "retry.js" })
  yoursBy(shell, [replaceOf(0, 0, 0, "// top\n")])
  const first = jobFor(shell, "r-2")
  const bare = framedLanded(shell, first.job_Shell, "r-2", (text) => text.replace("= 5;", "= 3;"), [])
  const framed = framedLanded(shell, first.job_Shell, "r-2", (text) => text.replace("= 5;", "= 3;"), [{ path: "retry.js", first: 2, last: 3 }])
  const frames_First = framesOf(shell)
  const second = jobFor(shell, "r-3")
  const inside = framedLanded(shell, second.job_Shell, "r-3", (text) => text.replace("= 100;", "= 50;"), [{ path: "retry.js", first: 3, last: 5 }])
  const frames_Second = framesOf(shell)
  shell.handle({ kind: "EDIT", path: "retry.js", transaction: { steps: [{ kind: "TEXT", id_Text: { kind: "DOCUMENT" }, range: { from: { line: 2, offset: 0 }, to: { line: 2, offset: 0 } }, next: textOf("// gap\n") }] }, mode: { kind: "MANUAL" } })
  const host = new _Host_({ name_Document: "retry.js", target_Mode: { kind: "TASK", id: "T-1" }, files: ["retry.js"], isListening_Agent: false, at: Date.now(), attributes: new Map(), state_Shell: shell.state(), suffix_Id: "", observers: [{ sent: () => {}, opening: () => {}, gone: () => {}, shown: () => {}, boarded: () => {} }] })
  const update_Host = host.showing()?.update_Host
  if (update_Host === undefined) throw new Error("nothing shown")
  const viewModel = viewModelOf__Model({ ...update_Host, source_Yours: "yours", module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT })
  expect(flatOf__Text(first.givens[0]!.text).startsWith("// top\nconst ATTEMPTS = 5;")).toBe(true)
  expect(bare.checked.issues).toEqual(["change 1, on line 2 of retry.js, is on lines no frame holds: say the frame it's read in under \"frames\", {\"path\": \"retry.js\", \"first\": <line>, \"last\": <line>}, in your copy's lines, the narrowest whole unit holding it"])
  expect(framed.checked.issues).toEqual([])
  expect(framed.checked.landing.frames.map((frame) => [frame.path, frame.first, frame.last])).toEqual([["retry.js", 0, 1]])
  expect(frames_First).toEqual([{ first: 0, last: 1 }])
  expect(second.givens[0]?.frames).toEqual([{ first: 0, last: 1 }])
  expect(inside.listed).toEqual([{ path: "retry.js", first: 2, last: 3 }])
  expect(inside.checked.issues).toEqual([])
  expect(frames_Second).toEqual([{ first: 0, last: 3 }])
  expect(framesOf(shell)).toEqual([{ first: 0, last: 4 }])
  expect([update_Host.ranges_Frame, viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? [block.range] : [])]).toEqual([[{ first: 1, last: 5 }], [{ first: 1, last: 5 }]])
})

test("a frame said wrong, each said: on a file the job wasn't given and didn't change, and on lines that aren't the file's", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const { job_Shell } = takenOf(shell, "j-1")
  const checked = framedLanded(shell, job_Shell, "r-1", (text) => text.replace("= 5;", "= 3;"), [{ path: "notes.md", first: 1, last: 2 }, { path: "retry.js", first: 3, last: 2 }, { path: "retry.js", first: 1, last: 9 }, { path: "retry.js", first: 1, last: 1 }])
  expect(checked.checked.issues).toEqual(["frame 1 is on notes.md, which isn't a file you were given or changed", "frame 2, lines 3–2 of retry.js, isn't lines of it as you were given it, 1 to 5", "frame 3, lines 1–9 of retry.js, isn't lines of it as you were given it, 1 to 5"])
})

// a job's work handed back on a task with changes of its own, the case's
// first job landing them, as given, whatever the editor would draw: yours,
// typed in the task, and proposals, open or accepted, a move among them
const landedBy = (shell: _Shell_, id_Job: string, id_Proposal: string, changes: [_Change_, ...Array<_Change_>]) => {
  shell.handle({ kind: "TAKE", id_Job, note: "" })
  shell.handle({ kind: "HAND_BACK", id_Job, landing: { proposals: [{ id: id_Proposal, path: "retry.js", effect: "CHANGE", title: id_Proposal, rationale: "", version: shell.documentOf("retry.js").version, changes, ids_Request: [] }], nothings: [], frames: [] }, note: "" })
}
const yoursBy = (shell: _Shell_, changes: [_Change_, ...Array<_Change_>]) => shell.handle({ kind: "EDIT", path: "retry.js", transaction: { steps: [{ kind: "SOURCE", source: "yours", changes }] }, mode: { kind: "TASK", id_Task: "T-1", proposed: [{ source: "yours", changes }] } })
const replaceOf = (line: number, from: number, to: number, next: string): _Change_ => ({ kind: "REPLACE", range: { from: { line, offset: from }, to: { line, offset: to } }, next: textOf(next) })
const jobFor = (shell: _Shell_, id_Request: string) => {
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: madeOf(id_Request, "Tidy it."), isStarting: true, path: "retry.js" })
  return takenOf(shell, `j-${shell.count_Job}`)
}
const handedOf = (shell: _Shell_, job_Shell: _Job_Shell_, id_Request: string, edit: (text: string) => string) => {
  const given = job_Shell.state.kind === "BEING_WORKED_ON" ? job_Shell.state.givens[0] : undefined
  if (given === undefined) throw new Error("no given")
  const text_Copy = edit(flatOf__Text(given.text))
  const numbers = changesOf__Copy({ files: [{ given, effect: "CHANGE", text_Copy: textOf(text_Copy) }] }).map((change) => change.number)
  const checked = checkedOf(shell, job_Shell, text_Copy, () => ({ proposals: [{ aim: { kind: "NEW" }, title: "Agent's", why: "Why.", numbers, ids_Request: [id_Request] }], nothings: [] }))
  return { checked, clashes: checked.issues.length > 0 ? [] : shell.clashesOf({ id_Task: "T-1", landing: checked.landing }) }
}
const drawableAfter = (shell: _Shell_, job_Shell: _Job_Shell_, landing: _Landing_Handed_) => {
  shell.handle({ kind: "HAND_BACK", id_Job: job_Shell.id, landing, note: "" })
  const head = shell.taskOf("T-1")?.heads.find((head_Each) => head_Each.path === "retry.js")
  return { refusals: refusalsAcross__Sources(head?.proposed ?? []), head, sources_Drawn: sourcesDrawnOf(shell) }
}
// the task as the editor draws it, through the host, as a page would: the
// proposals it lists in its frames
const sourcesDrawnOf = (shell: _Shell_) => {
  const host = new _Host_({ name_Document: "retry.js", target_Mode: { kind: "TASK", id: "T-1" }, files: ["retry.js"], isListening_Agent: false, at: Date.now(), attributes: new Map(), state_Shell: shell.state(), suffix_Id: "", observers: [{ sent: () => {}, opening: () => {}, gone: () => {}, shown: () => {}, boarded: () => {} }] })
  const update_Host = host.showing()?.update_Host
  if (update_Host === undefined) throw new Error("nothing shown")
  const viewModel = viewModelOf__Model({ ...update_Host, source_Yours: "yours", ranges_Frame: [], module_Language: MODULE_PLAINTEXT, module_Reading: MODULE_READING_TEXT })
  return [...new Set(viewModel.blocks.flatMap((block) => block.kind === "FRAME" ? block.parts.flatMap((part) => part.kind === "PROPOSAL_LIST" ? part.items.map((item) => item.source) : []) : []))].toSorted()
}

test("around your edits, as the editor nests: a change taking in the whole of what you typed lands with yours nested in it; one with just your span, which the editor can't draw, refused as a clash; one in part of what you typed refused, as no change goes in another's text", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: false, path: "retry.js" })
  yoursBy(shell, [replaceOf(0, 6, 14, "MAX_ATTEMPTS = 7")])
  const job = jobFor(shell, "r-2")
  const around = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("MAX_ATTEMPTS = 7 = 5", "RETRIES = 3"))
  const same = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("MAX_ATTEMPTS = 7", "TRIES"))
  const part = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("= 7", "= 3"))
  expect(flatOf__Text(job.givens[0]!.text).startsWith("const MAX_ATTEMPTS = 7 = 5;")).toBe(true)
  expect([around.checked.issues, around.clashes, around.checked.landing.proposals[0]?.changes]).toEqual([[], [], [replaceOf(0, 6, 18, "RETRIES = 3")]])
  expect(same.checked.issues).toEqual([])
  expect(same.clashes).toEqual(["proposal \"Agent's\" can't be drawn with the person's own edits on retry.js: one of its changes shares the span of one of theirs, or crosses its edge; a change has to take in another's whole span, or stay apart from it"])
  expect(part.checked.issues).toEqual(["change 1 is in part of the text your edits put in: a change can go around another's text, taking it all in, or stay apart from it, but not change part of it"])
  const drawn = drawableAfter(shell, job.job_Shell, around.checked.landing)
  expect([drawn.refusals, drawn.sources_Drawn]).toEqual([[], ["j-1.1", "yours"]])
})

test("an open proposal, not in the copy, its words the file's there: a change inside its span lands nested, applying only if it's rejected; one crossing its edge, which the editor can't draw, refused as a clash", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  landedBy(shell, "j-1", "p", [replaceOf(0, 6, 18, "TRIES = 3")])
  const job = jobFor(shell, "r-2")
  const inside = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("ATTEMPTS =", "RETRIES ="))
  const crossing = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("const ATTEMPTS", "let TRIES"))
  expect(flatOf__Text(job.givens[0]!.text)).toBe(TEXT)
  expect([inside.checked.issues, inside.clashes]).toEqual([[], []])
  expect(crossing.clashes).toEqual(["proposal \"Agent's\" can't be drawn with proposal \"p\" on retry.js: one of its changes shares the span of one of theirs, or crosses its edge; a change has to take in another's whole span, or stay apart from it"])
  const drawn = drawableAfter(shell, job.job_Shell, inside.checked.landing)
  expect([drawn.refusals, drawn.sources_Drawn]).toEqual([[], ["j-2.1", "p"]])
})

test("an accepted move, in the copy where it lands: a change inside the text it carries lands on that text where the move takes it from, carried by it; one reaching across its edge refused, as it takes in text from two places", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  landedBy(shell, "j-1", "m", [{ kind: "MOVE", range: { from: { line: 3, offset: 0 }, to: { line: 4, offset: 0 } }, at: { line: 0, offset: 0 } }])
  shell.handle({ kind: "DECIDE", id_Task: "T-1", id_Proposal: "m", decision: "ACCEPTED" })
  const job = jobFor(shell, "r-2")
  const inside = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("retry()", "retry(attempt)"))
  const across = handedOf(shell, job.job_Shell, "r-2", (text) => text.replace("retry() {}\nconst ATTEMPTS", "retryAttempts"))
  expect(flatOf__Text(job.givens[0]!.text).startsWith("export function retry() {}\nconst ATTEMPTS")).toBe(true)
  expect([inside.checked.issues, inside.clashes, inside.checked.landing.proposals[0]?.changes]).toEqual([[], [], [{ kind: "REPLACE", range: { from: { line: 3, offset: 22 }, to: { line: 3, offset: 22 } }, next: textOf("attempt") }]])
  expect(across.checked.issues).toEqual(["change 2 reaches across the edge of a move, taking in text from two places: change what's moved and what's around it apart"])
  const drawn = drawableAfter(shell, job.job_Shell, inside.checked.landing)
  expect([drawn.refusals, drawn.sources_Drawn]).toEqual([[], ["j-2.1", "m"]])
  expect(flatOf__Text(textWith__Sources({ model_TextEditor: { document: shell.documentOf("retry.js").text, proposed: drawn.head?.proposed ?? [] }, sources: ["m", "j-2.1"] })).startsWith("export function retry(attempt) {}\nconst ATTEMPTS")).toBe(true)
})

test("revising a proposal, its text in the copy in place, a change to it grouped as its revision makes its next version, compared with the file without it, landed in its place, its request answered by it", () => {
  const shell = shellMade()
  shell.handle({ kind: "DRAFT", request: madeOf("r-1", "Tidy it."), isStarting: true, path: "retry.js" })
  const first = takenOf(shell, "j-1")
  const checked_First = checkedOf(shell, first.job_Shell, TEXT.replace("= 5;", "= 3;"), () => ({ proposals: [{ aim: { kind: "NEW" }, title: "Fewer attempts", why: "Five is too many.", numbers: [1], ids_Request: ["r-1"] }], nothings: [] }))
  shell.handle({ kind: "HAND_BACK", id_Job: "j-1", landing: checked_First.landing, note: "" })
  shell.handle({ kind: "REQUEST", id_Task: "T-1", request: { id: "r-2", notes: "Two, not three.", aim: { kind: "PROPOSAL", id_Proposal: "j-1.1", words: { kind: "ALL" } } }, isStarting: true, path: "retry.js" })
  const second = takenOf(shell, "j-2")
  const text_Given = flatOf__Text(second.givens[0]!.text)
  const checked = checkedOf(shell, second.job_Shell, text_Given.replace("= 3;", "= 2;"), () => ({ proposals: [{ aim: { kind: "REVISION", id_Proposal: "j-1.1" }, title: "", why: "Two's enough.", numbers: [1], ids_Request: ["r-2"] }], nothings: [] }))
  shell.handle({ kind: "HAND_BACK", id_Job: "j-2", landing: checked.landing, note: "" })
  const task = shell.taskOf("T-1")
  const head = task?.heads.find((head_Each) => head_Each.path === "retry.js")
  expect(text_Given.startsWith("const ATTEMPTS = 3;")).toBe(true)
  expect(checked.issues).toEqual([])
  expect(task?.proposals.map((proposal) => [proposal.id, proposal.title, proposal.rationale])).toEqual([["j-1.1", "Fewer attempts", "Two's enough."]])
  expect(flatOf__Text(textWith__Sources({ model_TextEditor: { document: shell.documentOf("retry.js").text, proposed: head?.proposed ?? [] }, sources: ["j-1.1"] }))).toBe(TEXT.replace("= 5;", "= 2;"))
  expect(task?.requests.find((request) => request.id === "r-2")?.status).toEqual({ kind: "ADDRESSED", answer: { kind: "PROPOSALS", ids_Proposal: ["j-1.1"] } })
})
