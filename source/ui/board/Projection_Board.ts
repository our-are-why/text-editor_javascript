import {
  LABELMAP__STATE_TASK,
  NOTEMAP__STATE_TASK,
  partsOf__Counts_Task,
  ISAGENTSMAP__KIND_PART,
  type _State_Task_,
  type _Part_Task_
} from "../editor/index.ts"
import type {
  _ViewModel_Board_,
  _Kind_Tiles_,
  _Column_Board_,
  _Tile_Board_,
  _Action_Tile_,
  _Row_Resolved_
} from "./ViewModel_Board.ts"

export {
  viewModelOf__Tasks_Board,
  type _Api___viewModelOf__Tasks_Board_,
  type _Task_Board_
}

interface _Api___viewModelOf__Tasks_Board_ {
  tasks: Array<_Task_Board_>
  paths_Shown: Array<string>
}

interface _Task_Board_ {
  id: string
  name: string
  state: _State_Task_
  paths: Array<string>
  count_Undecided: number
  count_Conflicts: number
  count_Running: number
  count_Quiet: number
  count_Waiting: number
  count_Staged: number
  count_Editors: number
}

function viewModelOf__Tasks_Board({
  tasks,
  paths_Shown
}: _Api___viewModelOf__Tasks_Board_): _ViewModel_Board_ {
  const tilesIn = (kind: _Kind_Tiles_) => tasks
    .filter((task_Board) => KINDMAP__STATE_TASK[task_Board.state](task_Board) === kind)
    .map((task_Board) => tileOf__Task_Board({
      task_Board,
      paths_Shown
    }))
  const tiles_Yours = tilesIn("YOURS")
  const tiles_Agent = tilesIn("AGENT")
  const tiles_Drafts = tilesIn("DRAFTS")
  const tasks_Resolved = tasks.filter((task_Board) => KINDMAP__STATE_TASK[task_Board.state](task_Board) === "RESOLVED")
  return {
    label: "Tasks",
    label_Count: `${tiles_Yours.length + tiles_Agent.length + tiles_Drafts.length} open`,
    label_New: "Draft task",
    columns: [
      {
        kind: "YOURS",
        label: "Needs you",
        count: tiles_Yours.length,
        label_Empty: "None",
        tiles: tiles_Yours
      },
      {
        kind: "AGENT",
        label: "With agent",
        count: tiles_Agent.length,
        label_Empty: "None",
        tiles: tiles_Agent
      },
      {
        kind: "DRAFTS",
        label: "Drafts",
        count: tiles_Drafts.length,
        label_Empty: "None",
        tiles: tiles_Drafts
      },
      {
        kind: "RESOLVED",
        label: "Resolved",
        count: tasks_Resolved.length,
        label_Empty: "None",
        rows: tasks_Resolved.map((task_Board) => rowOf__Task_Board(task_Board)),
        ids: tasks_Resolved.map((task_Board) => task_Board.id),
        label_Collect: "Delete",
        title_Collect: "Delete every resolved task, for good"
      }
    ]
  }
}

type _KindMap__State_Task_ = {
  [State in _State_Task_]: (task_Board: _Task_Board_) => _Column_Board_["kind"]
}

const KINDMAP__STATE_TASK: _KindMap__State_Task_ = {
  DRAFT: () => "DRAFTS",
  WAITING: (task_Board) => kindOf__Task_Open(task_Board),
  WORKING: (task_Board) => kindOf__Task_Open(task_Board),
  QUIET: (task_Board) => kindOf__Task_Open(task_Board),
  YOUR_TURN: (task_Board) => kindOf__Task_Open(task_Board),
  APPLIED: () => "RESOLVED",
  CANCELED: () => "RESOLVED",
  DISCARDED: () => "RESOLVED"
}

function kindOf__Task_Open(
  task_Board: _Task_Board_
): _Column_Board_["kind"] {
  return partsOf__Counts_Task(task_Board).some((part_Task) => !ISAGENTSMAP__KIND_PART[part_Task.kind]) ? "YOURS" : "AGENT"
}

interface _Api___tileOf__Task_Board_ {
  task_Board: _Task_Board_
  paths_Shown: Array<string>
}

function tileOf__Task_Board({
  task_Board,
  paths_Shown
}: _Api___tileOf__Task_Board_): _Tile_Board_ {
  return {
    id: task_Board.id,
    name: task_Board.name,
    state: task_Board.state,
    label_State: LABELMAP__STATE_TASK[task_Board.state],
    label_Switch: "Switch every editor to this task",
    parts: task_Board.state === "DRAFT"
      ? [
        {
          kind: "STAGED",
          text: `${task_Board.count_Staged} staged`
        }
      ]
      : partsOf__Counts_Task(task_Board),
    isInView: task_Board.paths.some((path) => paths_Shown.includes(path)),
    label_InView: "in file",
    isShown: task_Board.count_Editors > 0,
    actions_More: MOREMAP__STATE_TASK[task_Board.state](task_Board),
    label_More: "More"
  }
}

type _ActionsMap__State_Task_ = {
  [State in _State_Task_]: (task_Board: _Task_Board_) => Array<_Action_Tile_>
}

const MOREMAP__STATE_TASK: _ActionsMap__State_Task_ = {
  DRAFT: (task_Board) => actionsOf__Task_Open({
    task_Board,
    kind_Cancel: "DISCARD"
  }),
  WAITING: (task_Board) => actionsOf__Task_Open({
    task_Board,
    kind_Cancel: "CANCEL"
  }),
  WORKING: (task_Board) => actionsOf__Task_Open({
    task_Board,
    kind_Cancel: "CANCEL"
  }),
  QUIET: (task_Board) => actionsOf__Task_Open({
    task_Board,
    kind_Cancel: "CANCEL"
  }),
  YOUR_TURN: (task_Board) => actionsOf__Task_Open({
    task_Board,
    kind_Cancel: "CANCEL"
  }),
  APPLIED: () => [],
  CANCELED: () => [],
  DISCARDED: () => []
}

interface _Api___actionsOf__Task_Open_ {
  task_Board: _Task_Board_
  kind_Cancel: "CANCEL" | "DISCARD"
}

function actionsOf__Task_Open({
  task_Board,
  kind_Cancel
}: _Api___actionsOf__Task_Open_): Array<_Action_Tile_> {
  return [
    ...task_Board.count_Staged === 0
      ? []
      : [
        {
          kind: "START" as const,
          label: `Start all (${task_Board.count_Staged})`
        }
      ],
    ...task_Board.count_Running + task_Board.count_Quiet + task_Board.count_Waiting === 0
      ? []
      : [
        {
          kind: "STOP" as const,
          label: "Stop"
        }
      ],
    ...task_Board.count_Conflicts + task_Board.count_Undecided + task_Board.count_Staged + task_Board.count_Running + task_Board.count_Quiet + task_Board.count_Waiting > 0
      ? []
      : [
        {
          kind: "APPLY" as const,
          label: "Apply"
        }
      ],
    {
      kind: kind_Cancel,
      label: "Cancel"
    }
  ]
}

function rowOf__Task_Board(
  task_Board: _Task_Board_
): _Row_Resolved_ {
  return {
    id: task_Board.id,
    name: task_Board.name,
    state: task_Board.state,
    label_State: NOTEMAP__STATE_TASK[task_Board.state]
  }
}
