import type {
  _Module_Reading_,
  _Box_Reading_
} from "../Projection_TextEditor.ts"
import {
  keysOf__Text,
  type _Run_Comparison_,
  type _Text_Model_,
  type _Kind_Run_,
  positionOf__Index,
  indexOf__Position
} from "../../../core/documents/index.ts"

export {
  MODULE_READING_TEXT
}

const MODULE_READING_TEXT: _Module_Reading_ = {
  boxesOf__Replacement: ({
    text_Before,
    text_After,
    runs
  }) => {
    const keys_Before = keysOf__Text(text_Before)
    const keys_After = keysOf__Text(text_After)
    return runs.flatMap((run_Comparison) => BOXESMAP__KIND_RUN[run_Comparison.kind]({
      run_Comparison,
      text_Before,
      text_After,
      keys_Before,
      keys_After
    }))
  },
  word_Move: "moved"
}

interface _Api___boxesOf__Run_ {
  run_Comparison: _Run_Comparison_
  text_Before: _Text_Model_
  text_After: _Text_Model_
  keys_Before: Array<string>
  keys_After: Array<string>
}

type _BoxesMap__Kind_Run_ = {
  [Kind in _Kind_Run_]: (api_Run: _Api___boxesOf__Run_) => Array<_Box_Reading_>
}

const BOXESMAP__KIND_RUN: _BoxesMap__Kind_Run_ = {
  KEPT: restyledOf__Run,
  CHANGED: changedOf__Run
}

function restyledOf__Run({
  run_Comparison,
  text_Before,
  text_After,
  keys_Before,
  keys_After
}: _Api___boxesOf__Run_): Array<_Box_Reading_> {
  const indexes = indexesOf__Run({
    run_Comparison,
    text_Before,
    text_After
  })
  const boxes: Array<_Box_Reading_> = []
  let from_Restyled: number | null = null
  for (let index = indexes.from_Before; index <= indexes.to_Before; index = index + 1) {
    const index_After = indexes.from_After + index - indexes.from_Before
    const isRestyled = index < indexes.to_Before && (keys_Before[index] ?? "") !== (keys_After[index_After] ?? "")
    if (isRestyled && from_Restyled === null) from_Restyled = index
    if (!isRestyled && from_Restyled !== null) {
      boxes.push({
        range_Before: {
          from: positionOf__Index({
            text_Model: text_Before,
            index: from_Restyled
          }),
          to: positionOf__Index({
            text_Model: text_Before,
            index
          })
        },
        range_After: {
          from: positionOf__Index({
            text_Model: text_After,
            index: indexes.from_After + from_Restyled - indexes.from_Before
          }),
          to: positionOf__Index({
            text_Model: text_After,
            index: index_After
          })
        },
        word: "restyled"
      })
      from_Restyled = null
    }
  }
  return boxes
}

interface _Api___indexesOf__Run_ {
  run_Comparison: _Run_Comparison_
  text_Before: _Text_Model_
  text_After: _Text_Model_
}

interface _Indexes_Run_ {
  from_Before: number
  to_Before: number
  from_After: number
  to_After: number
}

function indexesOf__Run({
  run_Comparison,
  text_Before,
  text_After
}: _Api___indexesOf__Run_): _Indexes_Run_ {
  return {
    from_Before: indexOf__Position({
      text_Model: text_Before,
      position: run_Comparison.range_Before.from
    }),
    to_Before: indexOf__Position({
      text_Model: text_Before,
      position: run_Comparison.range_Before.to
    }),
    from_After: indexOf__Position({
      text_Model: text_After,
      position: run_Comparison.range_After.from
    }),
    to_After: indexOf__Position({
      text_Model: text_After,
      position: run_Comparison.range_After.to
    })
  }
}

function changedOf__Run({
  run_Comparison,
  text_Before,
  text_After,
  keys_Before,
  keys_After
}: _Api___boxesOf__Run_): Array<_Box_Reading_> {
  const indexes = indexesOf__Run({
    run_Comparison,
    text_Before,
    text_After
  })
  return [
    {
      range_Before: run_Comparison.range_Before,
      range_After: run_Comparison.range_After,
      word: indexes.from_Before === indexes.to_Before
        ? "inserted"
        : indexes.from_After === indexes.to_After
          ? "removed"
          : keysIn__Range({
            keys: keys_Before,
            from: indexes.from_Before,
            to: indexes.to_Before
          }) === keysIn__Range({
            keys: keys_After,
            from: indexes.from_After,
            to: indexes.to_After
          })
            ? "replaced"
            : "replacedRestyled"
    }
  ]
}

interface _Api___keysIn__Range_ {
  keys: Array<string>
  from: number
  to: number
}

function keysIn__Range({
  keys,
  from,
  to
}: _Api___keysIn__Range_): string {
  return [
    ...new Set(keys.slice(
      from,
      to
    ))
  ].toSorted().join("|")
}
