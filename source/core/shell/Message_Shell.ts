import type {
  _Command_Shell_,
  _State_Shell_
} from "./Shell.ts"

export {
  type _Message_Page_,
  type __BASE_Message_Page_,
  type _COMMAND_Message_Page_,
  type _OPEN_Message_Page_,
  type _Message_Shell_,
  type __BASE_Message_Shell_,
  type _STATE_Message_Shell_
}

type _Message_Page_ = _COMMAND_Message_Page_ | _OPEN_Message_Page_

interface __BASE_Message_Page_<Kind extends string> {
  kind: Kind
}

interface _COMMAND_Message_Page_ extends __BASE_Message_Page_<"COMMAND"> {
  command_Shell: _Command_Shell_
}

interface _OPEN_Message_Page_ extends __BASE_Message_Page_<"OPEN"> {
  path: string
}

type _Message_Shell_ = _STATE_Message_Shell_

interface __BASE_Message_Shell_<Kind extends string> {
  kind: Kind
}

interface _STATE_Message_Shell_ extends __BASE_Message_Shell_<"STATE"> {
  state_Shell: _State_Shell_
  files: Array<string>
  isListening_Agent: boolean
  path_First: string
  count_Edit: number
}
