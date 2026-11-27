import type {
  _State_Task_,
  _Part_Task_
} from "../editor/index.ts"

export {
  type _ViewModel_Board_,
  type _Column_Board_,
  type __BASE_Column_Board_,
  type _YOURS_Column_Board_,
  type _AGENT_Column_Board_,
  type _DRAFTS_Column_Board_,
  type _Kind_Tiles_,
  type _Tile_Board_,
  type _Action_Tile_,
  type _Kind_Action_,
  type _RESOLVED_Column_Board_,
  type _Row_Resolved_
}

interface _ViewModel_Board_ {
  label: string
  label_Count: string
  label_New: string
  columns: Array<_Column_Board_>
}

type _Column_Board_ = _YOURS_Column_Board_ | _AGENT_Column_Board_ | _DRAFTS_Column_Board_ | _RESOLVED_Column_Board_

interface __BASE_Column_Board_<Kind extends string> {
  kind: Kind
  label: string
  count: number
  label_Empty: string
}

interface _YOURS_Column_Board_ extends __BASE_Column_Board_<"YOURS"> {
  tiles: Array<_Tile_Board_>
}

interface _AGENT_Column_Board_ extends __BASE_Column_Board_<"AGENT"> {
  tiles: Array<_Tile_Board_>
}

interface _DRAFTS_Column_Board_ extends __BASE_Column_Board_<"DRAFTS"> {
  tiles: Array<_Tile_Board_>
}

type _Kind_Tiles_ = "YOURS" | "AGENT" | "DRAFTS"

interface _Tile_Board_ {
  id: string
  name: string
  state: _State_Task_
  label_State: string
  label_Switch: string
  parts: Array<_Part_Task_>
  isInView: boolean
  label_InView: string
  isShown: boolean
  actions_More: Array<_Action_Tile_>
  label_More: string
}

interface _Action_Tile_ {
  kind: _Kind_Action_
  label: string
}

type _Kind_Action_ = "START" | "STOP" | "APPLY" | "CANCEL" | "DISCARD"

interface _RESOLVED_Column_Board_ extends __BASE_Column_Board_<"RESOLVED"> {
  rows: Array<_Row_Resolved_>
  ids: Array<string>
  label_Collect: string
  title_Collect: string
}

interface _Row_Resolved_ {
  id: string
  name: string
  state: _State_Task_
  label_State: string
}
