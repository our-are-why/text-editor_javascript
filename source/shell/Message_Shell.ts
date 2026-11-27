import type {
  _Applied_Edit_,
  _Asked_Host_
} from "../editor/index.ts"
import type { _Asked_Board_ } from "../board/index.ts"
import type {
  _Shell_,
  _Shown_Shell_
} from "./Shell.ts"

export {
  handle__Message_Page,
  type _Api___handle__Message_Page_,
  type _Message_Page_,
  type __BASE_Message_Page_,
  type _APPLIED_Message_Page_,
  type _ASKED_Message_Page_,
  type _ASKED_BOARD__Message_Page_,
  type _HandlerMap__Message_Page_,
  HANDLERMAP__MESSAGE_PAGE,
  type _Message_Shell_,
  type __BASE_Message_Shell_,
  type _SHOWN_Message_Shell_
}

interface _Api___handle__Message_Page_<Kind extends _Message_Page_["kind"]> {
  shell: _Shell_
  message_Page: Extract<
    _Message_Page_,
    __BASE_Message_Page_<Kind>
  >
}

function handle__Message_Page<Kind extends _Message_Page_["kind"]>({
  shell,
  message_Page
}: _Api___handle__Message_Page_<Kind>): void {
  const handle = HANDLERMAP__MESSAGE_PAGE[message_Page.kind]
  handle({
    shell,
    message_Page
  })
}

type _Message_Page_ = _APPLIED_Message_Page_ | _ASKED_Message_Page_ | _ASKED_BOARD__Message_Page_

interface __BASE_Message_Page_<Kind extends string> {
  kind: Kind
  count_Edit: number
}

interface _APPLIED_Message_Page_ extends __BASE_Message_Page_<"APPLIED"> {
  name_Document: string
  applied_Edit: _Applied_Edit_
}

interface _ASKED_Message_Page_ extends __BASE_Message_Page_<"ASKED"> {
  asked_Host: _Asked_Host_
}

interface _ASKED_BOARD__Message_Page_ extends __BASE_Message_Page_<"ASKED_BOARD"> {
  asked_Board: _Asked_Board_
}

type _HandlerMap__Message_Page_ = {
  [Kind in _Message_Page_["kind"]]: (api_Handler: _Api___handle__Message_Page_<Kind>) => void
}

const HANDLERMAP__MESSAGE_PAGE: _HandlerMap__Message_Page_ = {
  APPLIED: ({
    shell,
    message_Page
  }) => {
    if (message_Page.name_Document !== shell.name_Document) return
    shell.edited(message_Page.applied_Edit)
  },
  ASKED: ({
    shell,
    message_Page
  }) => shell.asked(message_Page.asked_Host),
  ASKED_BOARD: ({
    shell,
    message_Page
  }) => shell.askedBoard(message_Page.asked_Board)
}

type _Message_Shell_ = _SHOWN_Message_Shell_

interface __BASE_Message_Shell_<Kind extends string> {
  kind: Kind
}

interface _SHOWN_Message_Shell_ extends __BASE_Message_Shell_<"SHOWN"> {
  shown_Shell: _Shown_Shell_
  count_Edit: number
}
