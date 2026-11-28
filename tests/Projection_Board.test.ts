import { expect, test } from "bun:test"
import { viewModelOf__Tasks_Board, type _Task_Board_ } from "../source/ui/board/Projection_Board.ts"
import type { _State_Task_ } from "../source/ui/editor/ViewModel_TextEditor.ts"

// a task as a host tells the board of it, where it stands and nothing more
// unless said
function taskOf(
  id: string,
  state: _State_Task_,
  more: Partial<_Task_Board_>
): _Task_Board_ {
  return { id, name: `Task ${id}`, state, paths: [], count_Undecided: 0, count_Conflicts: 0, count_Running: 0, count_Quiet: 0, count_Waiting: 0, count_Staged: 0, count_Editors: 0, ...more }
}

// the project's tasks, one in every state, and open ones with every mix of
// parts: yours alone, a conflict, nothing left, yours and the agent's,
// requests staged and nothing else, and the agent's alone
const tasks = [
  taskOf("T-1", "YOUR_TURN", { name: "Say what the README promises", paths: ["README.md"], count_Undecided: 3 }),
  taskOf("T-2", "YOUR_TURN", { paths: ["retry.js"], count_Undecided: 2, count_Conflicts: 1, count_Editors: 1 }),
  taskOf("T-3", "YOUR_TURN", { paths: ["retry.js"] }),
  taskOf("T-4", "WORKING", { paths: ["retry.js", "README.md"], count_Running: 2, count_Undecided: 14, count_Staged: 8, count_Editors: 2 }),
  taskOf("T-11", "YOUR_TURN", { paths: ["retry.js"], count_Staged: 2 }),
  taskOf("T-10", "WORKING", { paths: ["retry.js"], count_Running: 1 }),
  taskOf("T-5", "DRAFT", { paths: ["retry.js"], count_Staged: 1 }),
  taskOf("T-6", "APPLIED", {}),
  taskOf("T-7", "CANCELED", {}),
  taskOf("T-8", "DISCARDED", {})
]
const viewModel_Board = viewModelOf__Tasks_Board({ tasks, paths_Shown: ["retry.js"] })

test("the board: how many are open, and a column for each of who they're waiting on, in order, each with how many: anything waiting on you needing you, even while the agent works on another part of it, with the agent only what's the agent's alone", () => {
  expect(viewModel_Board.label_Count).toBe("7 open")
  expect(viewModel_Board.columns.map((column) => `${column.kind} ${column.label} ${column.count}`)).toEqual([
    "YOURS Needs you 5",
    "AGENT With agent 1",
    "DRAFTS Drafts 1",
    "RESOLVED Resolved 3"
  ])
})

test("a tile: its parts, the most pressing of yours, a conflict over the rest, applicable when nothing's left, requests staged, said so, as the editor says them, yours till started, then the agent's, or a draft's requests, staged; in file, if it touches the file an editor's showing, not named; whether an editor shows it; and what it offers behind its ···: Apply only once nothing's running or left to decide", () => {
  const tiles = viewModel_Board.columns.flatMap((column) => column.kind === "RESOLVED" ? [] : column.tiles)
  expect(tiles.map((tile) => [tile.id, tile.isInView, tile.label_InView, tile.parts.map((part) => `${part.kind} ${part.text}`).join(", "), tile.isShown, tile.actions_More.map((action) => action.label).join(" ")])).toEqual([
    ["T-1", false, "in file", "YOURS 3 to decide", false, "Cancel"],
    ["T-2", true, "in file", "CONFLICT 1 conflict", true, "Cancel"],
    ["T-3", true, "in file", "YOURS applicable", false, "Apply Cancel"],
    ["T-4", true, "in file", "YOURS 14 to decide, AGENT 2 running", true, "Start all (8) Stop Cancel"],
    ["T-11", true, "in file", "STAGED 2 staged", false, "Start all (2) Cancel"],
    ["T-10", true, "in file", "AGENT 1 running", false, "Stop Cancel"],
    ["T-5", true, "in file", "STAGED 1 staged", false, "Start all (1) Cancel"]
  ])
})

test("resolved tasks: a row each, how it ended in a word, and Delete for them all, for good; an empty column says None, its heading saying what of", () => {
  const resolved = viewModel_Board.columns.find((column) => column.kind === "RESOLVED")
  expect(resolved?.kind === "RESOLVED" ? [resolved.rows.map((row) => `${row.id} ${row.label_State}`), resolved.ids, resolved.label_Collect, resolved.title_Collect] : null).toEqual([
    ["T-6 applied", "T-7 canceled", "T-8 discarded"],
    ["T-6", "T-7", "T-8"],
    "Delete",
    "Delete every resolved task, for good"
  ])
  const empty = viewModelOf__Tasks_Board({ tasks: [], paths_Shown: [] })
  expect(empty.label_Count).toBe("0 open")
  expect(empty.columns.map((column) => column.label_Empty)).toEqual(["None", "None", "None", "None"])
})
