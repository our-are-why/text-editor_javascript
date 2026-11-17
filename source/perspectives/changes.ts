import type { _Perspective_TextEditor_ } from "../TextEditor.ts"
import { MODULE_READING_TEXT } from "../readings/text.ts"
import { LOOK_CHANGES } from "../looks/changes.ts"

export {
  PERSPECTIVE_CHANGES
}

const PERSPECTIVE_CHANGES: _Perspective_TextEditor_ = {
  name: "changes",
  module_Reading: MODULE_READING_TEXT,
  looks: [
    LOOK_CHANGES
  ]
}
