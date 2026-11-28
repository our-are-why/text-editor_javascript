import {
  type _Text_Model_,
  type _Transaction_Model_,
  type _Step_Transaction_,
  applied__Transaction,
  textWith__Sources,
  type _Changes_Source_,
  comparisonOf__Texts,
  textIn__Range,
  type _Change_,
  rebasedOf__Changes,
  type _Range_Text_,
  orderOf__Positions,
  type _Position_Text_,
  type _Run_Comparison_,
  indexOf__Position,
  type _Kind_Run_,
  positionOf__Index
} from "./Model_TextEditor.ts"

export {
  modelAfter__Command,
  type _Api___modelAfter__Command_,
  type _Model_Documents_,
  type _Document_Documents_,
  type _Edit_Documents_,
  type _Command_Documents_,
  type __BASE_Command_Documents_,
  type _OPEN_Command_Documents_,
  type _EDIT_Command_Documents_,
  type _READ_Command_Documents_,
  type _APPLY_Command_Documents_,
  type _RELEASE_Command_Documents_,
  type _COLLECT_Command_Documents_,
  type _HandlerMap__Documents_,
  HANDLERMAP__DOCUMENTS,
  versionOf__Text,
  type _Api___versionOf__Text_,
  sha256Of__Text,
  type _Api___sha256Of__Text_,
  transactionOf__Texts,
  type _Api___transactionOf__Texts_,
  carriedOf__Head,
  type _Api___carriedOf__Head_,
  type _Head_Document_,
  type _Stale_Source_,
  type _Stale_Change_,
  type _Over_Change_,
  type __BASE_Over_Change_,
  type _RANGE_Over_Change_,
  type _LINE_Over_Change_,
  type _Written_Change_,
  textAt__Version,
  type _Api___textAt__Version_,
  checkedOf__Head,
  type _Api___checkedOf__Head_,
  pairOf__Stale,
  type _Api___pairOf__Stale_,
  type _Pair_Stale_,
  narrowedOf__Run,
  type _Api___narrowedOf__Run_,
  settledOf__Head,
  type _Api___settledOf__Head_,
  type _Way_Settle_
}

interface _Api___modelAfter__Command_<Kind extends _Command_Documents_["kind"]> {
  model_Documents: _Model_Documents_
  command: Extract<
    _Command_Documents_,
    __BASE_Command_Documents_<Kind>
  >
}

function modelAfter__Command<Kind extends _Command_Documents_["kind"]>({
  model_Documents,
  command
}: _Api___modelAfter__Command_<Kind>): _Model_Documents_ {
  const handle = HANDLERMAP__DOCUMENTS[command.kind]
  return handle({
    model_Documents,
    command
  })
}

interface _Model_Documents_ {
  documents: Array<_Document_Documents_>
}

interface _Document_Documents_ {
  path: string
  version: string
  text: _Text_Model_
  isPresent: boolean
  edits: Array<_Edit_Documents_>
}

interface _Edit_Documents_ {
  version_From: string
  version_To: string
  transaction: _Transaction_Model_
  transaction_Inverse: _Transaction_Model_
}

type _Command_Documents_ = _OPEN_Command_Documents_ | _EDIT_Command_Documents_ | _READ_Command_Documents_ | _APPLY_Command_Documents_ | _RELEASE_Command_Documents_ | _COLLECT_Command_Documents_

interface __BASE_Command_Documents_<Kind extends string> {
  kind: Kind
}

interface _OPEN_Command_Documents_ extends __BASE_Command_Documents_<"OPEN"> {
  path: string
  text: _Text_Model_
  isPresent: boolean
}

interface _EDIT_Command_Documents_ extends __BASE_Command_Documents_<"EDIT"> {
  path: string
  version: string
  transaction: _Transaction_Model_
}

interface _READ_Command_Documents_ extends __BASE_Command_Documents_<"READ"> {
  path: string
  text: _Text_Model_
}

interface _APPLY_Command_Documents_ extends __BASE_Command_Documents_<"APPLY"> {
  path: string
  version: string
  proposed: Array<_Changes_Source_>
  sources: Array<string>
  isPresent: boolean
}

interface _RELEASE_Command_Documents_ extends __BASE_Command_Documents_<"RELEASE"> {
  path: string
  versions: Array<string>
}

interface _COLLECT_Command_Documents_ extends __BASE_Command_Documents_<"COLLECT"> {
  paths: Array<string>
}

type _HandlerMap__Documents_ = {
  [Kind in _Command_Documents_["kind"]]: (api_Handler: _Api___modelAfter__Command_<Kind>) => _Model_Documents_
}

const HANDLERMAP__DOCUMENTS: _HandlerMap__Documents_ = {
  OPEN: OPEN_modelAfter__Command,
  EDIT: EDIT_modelAfter__Command,
  READ: READ_modelAfter__Command,
  APPLY: APPLY_modelAfter__Command,
  RELEASE: RELEASE_modelAfter__Command,
  COLLECT: COLLECT_modelAfter__Command
}

function OPEN_modelAfter__Command({
  model_Documents,
  command
}: _Api___modelAfter__Command_<"OPEN">): _Model_Documents_ {
  return model_Documents.documents.some((document) => document.path === command.path)
    ? !command.isPresent
      ? model_Documents
      : READ_modelAfter__Command({
        model_Documents,
        command: {
          kind: "READ",
          path: command.path,
          text: command.text
        }
      })
    : {
      documents: [
        ...model_Documents.documents,
        {
          path: command.path,
          version: versionOf__Text({
            text_Model: command.text
          }),
          text: command.text,
          isPresent: command.isPresent,
          edits: []
        }
      ]
    }
}

interface _Api___versionOf__Text_ {
  text_Model: _Text_Model_
}

function versionOf__Text({
  text_Model
}: _Api___versionOf__Text_): string {
  return sha256Of__Text({
    text: text_Model.lines.join("\n")
  })
}

interface _Api___sha256Of__Text_ {
  text: string
}

function sha256Of__Text({
  text
}: _Api___sha256Of__Text_): string {
  const bytes = bytesOf__Text({
    text
  })
  const length_Padded = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(length_Padded)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(
    length_Padded - 8,
    Math.floor(bytes.length / 0x20000000)
  )
  view.setUint32(
    length_Padded - 4,
    (bytes.length * 8) >>> 0
  )
  const hash = Uint32Array.from(HASH_INITIAL_SHA256)
  const words = new Uint32Array(64)
  for (let offset = 0; offset < length_Padded; offset = offset + 64) {
    for (let index = 0; index < 16; index = index + 1) words[index] = view.getUint32(offset + index * 4)
    for (let index = 16; index < 64; index = index + 1) {
      const word_15 = words[index - 15] ?? 0
      const word_2 = words[index - 2] ?? 0
      const sigma_0 = rotatedRight({
        word: word_15,
        count: 7
      }) ^ rotatedRight({
        word: word_15,
        count: 18
      }) ^ (word_15 >>> 3)
      const sigma_1 = rotatedRight({
        word: word_2,
        count: 17
      }) ^ rotatedRight({
        word: word_2,
        count: 19
      }) ^ (word_2 >>> 10)
      words[index] = (words[index - 16] ?? 0) + sigma_0 + (words[index - 7] ?? 0) + sigma_1
    }
    const state = Uint32Array.from(hash)
    for (let index = 0; index < 64; index = index + 1) {
      const a = state[0] ?? 0
      const e = state[4] ?? 0
      const sum_1 = rotatedRight({
        word: e,
        count: 6
      }) ^ rotatedRight({
        word: e,
        count: 11
      }) ^ rotatedRight({
        word: e,
        count: 25
      })
      const choice = (e & (state[5] ?? 0)) ^ (~e & (state[6] ?? 0))
      const temp_1 = ((state[7] ?? 0) + sum_1 + choice + (CONSTANTS_ROUND_SHA256[index] ?? 0) + (words[index] ?? 0)) >>> 0
      const sum_0 = rotatedRight({
        word: a,
        count: 2
      }) ^ rotatedRight({
        word: a,
        count: 13
      }) ^ rotatedRight({
        word: a,
        count: 22
      })
      const majority = (a & (state[1] ?? 0)) ^ (a & (state[2] ?? 0)) ^ ((state[1] ?? 0) & (state[2] ?? 0))
      const temp_2 = (sum_0 + majority) >>> 0
      state.copyWithin(
        1,
        0,
        7
      )
      state[4] = (state[4] ?? 0) + temp_1
      state[0] = temp_1 + temp_2
    }
    for (let index = 0; index < 8; index = index + 1) hash[index] = (hash[index] ?? 0) + (state[index] ?? 0)
  }
  return Array.from(
    hash,
    (word) => word.toString(16).padStart(
      8,
      "0"
    )
  ).join("")
}

interface _Api___bytesOf__Text_ {
  text: string
}

function bytesOf__Text({
  text
}: _Api___bytesOf__Text_): Uint8Array {
  const bytes: Array<number> = []
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(
        0xc0 | (code >> 6),
        0x80 | (code & 0x3f)
      )
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
    }
  }
  return Uint8Array.from(bytes)
}

const HASH_INITIAL_SHA256 = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19
]

interface _Api___rotatedRight_ {
  word: number
  count: number
}

function rotatedRight({
  word,
  count
}: _Api___rotatedRight_): number {
  return (word >>> count) | (word << (32 - count))
}

const CONSTANTS_ROUND_SHA256 = [
  0x428a2f98,
  0x71374491,
  0xb5c0fbcf,
  0xe9b5dba5,
  0x3956c25b,
  0x59f111f1,
  0x923f82a4,
  0xab1c5ed5,
  0xd807aa98,
  0x12835b01,
  0x243185be,
  0x550c7dc3,
  0x72be5d74,
  0x80deb1fe,
  0x9bdc06a7,
  0xc19bf174,
  0xe49b69c1,
  0xefbe4786,
  0x0fc19dc6,
  0x240ca1cc,
  0x2de92c6f,
  0x4a7484aa,
  0x5cb0a9dc,
  0x76f988da,
  0x983e5152,
  0xa831c66d,
  0xb00327c8,
  0xbf597fc7,
  0xc6e00bf3,
  0xd5a79147,
  0x06ca6351,
  0x14292967,
  0x27b70a85,
  0x2e1b2138,
  0x4d2c6dfc,
  0x53380d13,
  0x650a7354,
  0x766a0abb,
  0x81c2c92e,
  0x92722c85,
  0xa2bfe8a1,
  0xa81a664b,
  0xc24b8b70,
  0xc76c51a3,
  0xd192e819,
  0xd6990624,
  0xf40e3585,
  0x106aa070,
  0x19a4c116,
  0x1e376c08,
  0x2748774c,
  0x34b0bcb5,
  0x391c0cb3,
  0x4ed8aa4a,
  0x5b9cca4f,
  0x682e6ff3,
  0x748f82ee,
  0x78a5636f,
  0x84c87814,
  0x8cc70208,
  0x90befffa,
  0xa4506ceb,
  0xbef9a3f7,
  0xc67178f2
]

function EDIT_modelAfter__Command({
  model_Documents,
  command
}: _Api___modelAfter__Command_<"EDIT">): _Model_Documents_ {
  return documentChangedIn__Model({
    model_Documents,
    path: command.path,
    change: (document) => {
      if (command.version !== document.version) throw new Error(`an edit made on ${command.version} isn't on ${document.path} as it is, ${document.version}`)
      const [
        step_First,
        ...steps_Rest
      ] = command.transaction.steps.filter((step_Transaction) => step_Transaction.kind === "TEXT" && step_Transaction.id_Text.kind === "DOCUMENT")
      if (step_First === undefined) return document
      const transaction: _Transaction_Model_ = {
        steps: [
          step_First,
          ...steps_Rest
        ]
      }
      const text = applied__Transaction({
        model_TextEditor: {
          document: document.text,
          proposed: []
        },
        transaction
      }).model_TextEditor.document
      return recordedIn__Document({
        document: {
          ...document,
          isPresent: document.isPresent || flatOf__Text(text).length > 0
        },
        text,
        transaction
      })
    }
  })
}

interface _Api___documentChangedIn__Model_ {
  model_Documents: _Model_Documents_
  path: string
  change: (document: _Document_Documents_) => _Document_Documents_
}

function documentChangedIn__Model({
  model_Documents,
  path,
  change
}: _Api___documentChangedIn__Model_): _Model_Documents_ {
  const document = model_Documents.documents.find((document_Each) => document_Each.path === path)
  if (document === undefined) throw new Error(`${path} isn't kept`)
  const document_Changed = change(document)
  return document_Changed === document
    ? model_Documents
    : {
      documents: model_Documents.documents.map((document_Each) => document_Each === document ? document_Changed : document_Each)
    }
}

interface _Api___recordedIn__Document_ {
  document: _Document_Documents_
  text: _Text_Model_
  transaction: _Transaction_Model_
}

function recordedIn__Document({
  document,
  text,
  transaction
}: _Api___recordedIn__Document_): _Document_Documents_ {
  const version = versionOf__Text({
    text_Model: text
  })
  if (version === document.version) {
    return {
      ...document,
      text
    }
  }
  return {
    path: document.path,
    version,
    text,
    isPresent: document.isPresent,
    edits: [
      ...document.edits,
      {
        version_From: document.version,
        version_To: version,
        transaction,
        transaction_Inverse: applied__Transaction({
          model_TextEditor: {
            document: document.text,
            proposed: []
          },
          transaction
        }).transaction_Inverse
      }
    ]
  }
}

function READ_modelAfter__Command({
  model_Documents,
  command
}: _Api___modelAfter__Command_<"READ">): _Model_Documents_ {
  return documentChangedIn__Model({
    model_Documents,
    path: command.path,
    change: (document) => {
      const transaction = transactionOf__Texts({
        text_Before: document.text,
        text_After: command.text
      })
      const document_Present = document.isPresent
        ? document
        : {
          ...document,
          isPresent: true
        }
      return transaction === null
        ? document_Present
        : recordedIn__Document({
          document: document_Present,
          text: command.text,
          transaction
        })
    }
  })
}

interface _Api___transactionOf__Texts_ {
  text_Before: _Text_Model_
  text_After: _Text_Model_
}

function transactionOf__Texts({
  text_Before,
  text_After
}: _Api___transactionOf__Texts_): _Transaction_Model_ | null {
  const [
    step_First,
    ...steps_Rest
  ] = comparisonOf__Texts({
    text_Before,
    text_After
  })
    .filter((run_Comparison) => run_Comparison.kind === "CHANGED")
    .toReversed()
    .map((run_Comparison): _Step_Transaction_ => ({
      kind: "TEXT",
      id_Text: {
        kind: "DOCUMENT"
      },
      range: run_Comparison.range_Before,
      next: textIn__Range({
        text_Model: text_After,
        range: run_Comparison.range_After
      })
    }))
  return step_First === undefined
    ? null
    : {
      steps: [
        step_First,
        ...steps_Rest
      ]
    }
}

function APPLY_modelAfter__Command({
  model_Documents,
  command
}: _Api___modelAfter__Command_<"APPLY">): _Model_Documents_ {
  return documentChangedIn__Model({
    model_Documents,
    path: command.path,
    change: (document) => {
      if (command.version !== document.version) throw new Error(`a head stated against ${command.version} isn't on ${document.path} as it is, ${document.version}`)
      const text = textWith__Sources({
        model_TextEditor: {
          document: document.text,
          proposed: command.proposed
        },
        sources: command.sources
      })
      const transaction = transactionOf__Texts({
        text_Before: document.text,
        text_After: text
      })
      const document_Placed = document.isPresent === command.isPresent
        ? document
        : {
          ...document,
          isPresent: command.isPresent
        }
      return transaction === null
        ? document_Placed
        : recordedIn__Document({
          document: document_Placed,
          text,
          transaction
        })
    }
  })
}

function RELEASE_modelAfter__Command({
  model_Documents,
  command
}: _Api___modelAfter__Command_<"RELEASE">): _Model_Documents_ {
  return documentChangedIn__Model({
    model_Documents,
    path: command.path,
    change: (document) => {
      const indexes = command.versions.filter((version) => version !== document.version).map((version) => indexOf__Version({
        document,
        version
      }))
      const edits = indexes.length === 0 ? [] : document.edits.slice(Math.min(...indexes))
      return edits.length === document.edits.length
        ? document
        : {
          ...document,
          edits
        }
    }
  })
}

interface _Api___indexOf__Version_ {
  document: _Document_Documents_
  version: string
}

function indexOf__Version({
  document,
  version
}: _Api___indexOf__Version_): number {
  const index = document.edits.findLastIndex((edit) => edit.version_From === version)
  if (index === -1) throw new Error(`${document.path}'s edits from ${version} aren't kept`)
  return index
}

function COLLECT_modelAfter__Command({
  model_Documents,
  command
}: _Api___modelAfter__Command_<"COLLECT">): _Model_Documents_ {
  const documents = model_Documents.documents.filter((document) => command.paths.includes(document.path))
  return documents.length === model_Documents.documents.length
    ? model_Documents
    : {
      documents
    }
}

interface _Api___carriedOf__Head_ {
  document: _Document_Documents_
  head: _Head_Document_
}

interface _Head_Document_ {
  path: string
  version: string
  proposed: Array<_Changes_Source_>
  stale: Array<_Stale_Source_>
}

interface _Stale_Source_ {
  source: string
  changes_Stale: Array<_Stale_Change_>
  count_Dropped: number
}

interface _Stale_Change_ {
  index: number
  over: _Over_Change_
}

type _Over_Change_ = _RANGE_Over_Change_ | _LINE_Over_Change_

interface __BASE_Over_Change_<Kind extends string> {
  kind: Kind
  version: string
  text: _Text_Model_
  written: _Written_Change_
}

interface _Written_Change_ {
  lines: _Text_Model_
  change: _Change_
}

interface _RANGE_Over_Change_ extends __BASE_Over_Change_<"RANGE"> {}

interface _LINE_Over_Change_ extends __BASE_Over_Change_<"LINE"> {}

function carriedOf__Head({
  document,
  head
}: _Api___carriedOf__Head_): _Head_Document_ {
  if (head.version === document.version) return head
  const transactions = document.edits.slice(indexOf__Version({
    document,
    version: head.version
  })).map((edit) => edit.transaction)
  const text_Head = textAt__Version({
    document,
    version: head.version
  })
  const carried = head.proposed.map((changes_Source) => carriedOf__Source({
    changes_Source,
    stale_Source: head.stale.find((stale_Each) => stale_Each.source === changes_Source.source),
    transactions,
    version_Head: head.version,
    text_Head,
    document
  }))
  return {
    path: head.path,
    version: document.version,
    proposed: carried.flatMap((carried_Source) => carried_Source.changes_Source === null ? [] : [carried_Source.changes_Source]),
    stale: carried.flatMap((carried_Source) => carried_Source.stale_Source === null ? [] : [carried_Source.stale_Source])
  }
}

interface _Api___textAt__Version_ {
  document: _Document_Documents_
  version: string
}

function textAt__Version({
  document,
  version
}: _Api___textAt__Version_): _Text_Model_ {
  if (version === document.version) return document.text
  return document.edits.slice(indexOf__Version({
    document,
    version
  })).toReversed().reduce(
    (text, edit) => applied__Transaction({
      model_TextEditor: {
        document: text,
        proposed: []
      },
      transaction: edit.transaction_Inverse
    }).model_TextEditor.document,
    document.text
  )
}

interface _Api___carriedOf__Source_ {
  changes_Source: _Changes_Source_
  stale_Source: _Stale_Source_ | undefined
  transactions: Array<_Transaction_Model_>
  version_Head: string
  text_Head: _Text_Model_
  document: _Document_Documents_
}

interface _Carried_Source_ {
  changes_Source: _Changes_Source_ | null
  stale_Source: _Stale_Source_ | null
}

function carriedOf__Source({
  changes_Source,
  stale_Source,
  transactions,
  version_Head,
  text_Head,
  document
}: _Api___carriedOf__Source_): _Carried_Source_ {
  const carried = changes_Source.changes.map((
    change,
    index
  ) => {
    const rebased = rebasedOf__Changes({
      changes: [change],
      transactions
    })
    const change_Carried = rebased.changes[0]
    const stale_Before = stale_Source?.changes_Stale.find((stale_Change) => stale_Change.index === index)
    const over = stale_Before?.over ?? overOf__Change({
      change,
      version: version_Head,
      text_Model: text_Head
    })
    const isStale = change_Carried !== undefined && (rebased.indexes_Stale.length > 0 || stale_Before !== undefined) && !isAsWritten__Document({
      over,
      change: change_Carried,
      document
    })
    return {
      change: change_Carried,
      isStale,
      over
    }
  })
  const kept = carried.flatMap((carried_Change): Array<_Kept_Change_> => carried_Change.change === undefined
    ? []
    : [
      {
        change: carried_Change.change,
        isStale: carried_Change.isStale,
        over: carried_Change.over
      }
    ])
  const [
    kept_First,
    ...kept_Rest
  ] = kept
  if (kept_First === undefined) {
    return {
      changes_Source: null,
      stale_Source: null
    }
  }
  const changes_Stale = kept.flatMap((
    kept_Change,
    index
  ): Array<_Stale_Change_> => kept_Change.isStale
    ? [
      {
        index,
        over: kept_Change.over
      }
    ]
    : [])
  const count_Dropped = (stale_Source?.count_Dropped ?? 0) + carried.length - kept.length
  return {
    changes_Source: {
      source: changes_Source.source,
      changes: [
        kept_First.change,
        ...kept_Rest.map((kept_Change) => kept_Change.change)
      ]
    },
    stale_Source: changes_Stale.length + count_Dropped === 0
      ? null
      : {
        source: changes_Source.source,
        changes_Stale,
        count_Dropped
      }
  }
}

interface _Api___overOf__Change_ {
  change: _Change_
  version: string
  text_Model: _Text_Model_
}

function overOf__Change({
  change,
  version,
  text_Model
}: _Api___overOf__Change_): _Over_Change_ {
  const kind: _Over_Change_["kind"] = change.kind === "REPLACE" && orderOf__Positions({
    position: change.range.from,
    position_Other: change.range.to
  }) === 0
    ? "LINE"
    : "RANGE"
  const span = spanOf__Over({
    kind,
    change,
    text_Model
  })
  return {
    kind,
    version,
    text: textIn__Range({
      text_Model,
      range: span
    }),
    written: writtenOf__Change({
      change,
      span,
      text_Model
    })
  }
}

interface _Api___spanOf__Over_ {
  kind: _Over_Change_["kind"]
  change: _Change_
  text_Model: _Text_Model_
}

function spanOf__Over({
  kind,
  change,
  text_Model
}: _Api___spanOf__Over_): _Range_Text_ {
  if (kind === "LINE") {
    const line = change.range.from.line
    return {
      from: {
        line,
        offset: 0
      },
      to: {
        line,
        offset: Array.from(text_Model.lines[line] ?? "").length
      }
    }
  }
  if (change.kind === "REPLACE") return change.range
  return {
    from: orderOf__Positions({
      position: change.at,
      position_Other: change.range.from
    }) < 0
      ? change.at
      : change.range.from,
    to: orderOf__Positions({
      position: change.at,
      position_Other: change.range.to
    }) > 0
      ? change.at
      : change.range.to
  }
}

interface _Api___writtenOf__Change_ {
  change: _Change_
  span: _Range_Text_
  text_Model: _Text_Model_
}

function writtenOf__Change({
  change,
  span,
  text_Model
}: _Api___writtenOf__Change_): _Written_Change_ {
  const line_First = span.from.line
  const [
    line,
    ...lines_Rest
  ] = text_Model.lines.slice(
    line_First,
    span.to.line + 1
  )
  if (line === undefined) throw new Error(`a change at line ${line_First + 1} is past its text's end`)
  return {
    lines: {
      lines: [
        line,
        ...lines_Rest
      ],
      marks: []
    },
    change: shiftedOf__Change({
      change,
      lines: -line_First
    })
  }
}

interface _Api___shiftedOf__Change_ {
  change: _Change_
  lines: number
}

function shiftedOf__Change({
  change,
  lines
}: _Api___shiftedOf__Change_): _Change_ {
  const range = {
    from: shiftedOf__Position({
      position: change.range.from,
      lines
    }),
    to: shiftedOf__Position({
      position: change.range.to,
      lines
    })
  }
  return change.kind === "MOVE"
    ? {
      kind: "MOVE",
      range,
      at: shiftedOf__Position({
        position: change.at,
        lines
      })
    }
    : {
      kind: "REPLACE",
      range,
      next: change.next
    }
}

interface _Api___shiftedOf__Position_ {
  position: _Position_Text_
  lines: number
}

function shiftedOf__Position({
  position,
  lines
}: _Api___shiftedOf__Position_): _Position_Text_ {
  return {
    line: position.line + lines,
    offset: position.offset
  }
}

interface _Api___isAsWritten__Document_ {
  over: _Over_Change_
  change: _Change_
  document: _Document_Documents_
}

function isAsWritten__Document({
  over,
  change,
  document
}: _Api___isAsWritten__Document_): boolean {
  if (document.version === over.version) return true
  if (over.kind === "LINE") return false
  const span = spanOf__Over({
    kind: over.kind,
    change,
    text_Model: document.text
  })
  return orderOf__Positions({
    position: span.from,
    position_Other: span.to
  }) < 0 && textIn__Range({
    text_Model: document.text,
    range: span
  }).lines.join("\n") === over.text.lines.join("\n")
}

interface _Kept_Change_ {
  change: _Change_
  isStale: boolean
  over: _Over_Change_
}

interface _Api___checkedOf__Head_ {
  document: _Document_Documents_
  head: _Head_Document_
}

function checkedOf__Head({
  document,
  head
}: _Api___checkedOf__Head_): _Head_Document_ {
  const stale = head.stale.flatMap((stale_Source) => {
    const changes = head.proposed.find((changes_Source) => changes_Source.source === stale_Source.source)?.changes ?? []
    const changes_Stale = stale_Source.changes_Stale.filter((stale_Change) => {
      const change = changes[stale_Change.index]
      return change === undefined || !isAsWritten__Document({
        over: stale_Change.over,
        change,
        document
      })
    })
    return changes_Stale.length === stale_Source.changes_Stale.length
      ? [stale_Source]
      : changes_Stale.length + stale_Source.count_Dropped === 0
        ? []
        : [
          {
            ...stale_Source,
            changes_Stale
          }
        ]
  })
  return stale.length === head.stale.length && stale.every((
    stale_Source,
    index
  ) => stale_Source === head.stale[index])
    ? head
    : {
      ...head,
      stale
    }
}

interface _Api___pairOf__Stale_ {
  text_Model: _Text_Model_
  change: _Change_
  over: _Over_Change_
}

interface _Pair_Stale_ {
  line_First: number
  lines: _Text_Model_
  runs: Array<_Run_Comparison_>
}

function pairOf__Stale({
  text_Model,
  change,
  over
}: _Api___pairOf__Stale_): _Pair_Stale_ {
  const span = spanOf__Over({
    kind: over.kind,
    change,
    text_Model
  })
  const line_First = span.from.line
  const [
    line,
    ...lines_Rest
  ] = text_Model.lines.slice(
    line_First,
    span.to.line + 1
  )
  if (line === undefined) throw new Error(`a stale change at line ${line_First + 1} is past its text's end`)
  const lines: _Text_Model_ = {
    lines: [
      line,
      ...lines_Rest
    ],
    marks: []
  }
  return {
    line_First,
    lines,
    runs: comparisonOf__Texts({
      text_Before: over.written.lines,
      text_After: lines
    }).flatMap((run) => narrowedOf__Run({
      run,
      text_Before: over.written.lines,
      text_After: lines
    }))
  }
}

interface _Api___narrowedOf__Run_ {
  run: _Run_Comparison_
  text_Before: _Text_Model_
  text_After: _Text_Model_
}

function narrowedOf__Run({
  run,
  text_Before,
  text_After
}: _Api___narrowedOf__Run_): Array<_Run_Comparison_> {
  if (run.kind === "KEPT") return [run]
  const before = flatOf__Text(textIn__Range({
    text_Model: text_Before,
    range: run.range_Before
  }))
  const after = flatOf__Text(textIn__Range({
    text_Model: text_After,
    range: run.range_After
  }))
  const {
    count_Head,
    count_End
  } = sharedOf__Ends({
    before,
    after
  })
  if (count_Head + count_End === 0) return [run]
  const from_Before = indexOf__Position({
    text_Model: text_Before,
    position: run.range_Before.from
  })
  const from_After = indexOf__Position({
    text_Model: text_After,
    position: run.range_After.from
  })
  const stretches: Array<_Stretch_Narrowed_> = [
    {
      kind: "KEPT",
      from_Before: 0,
      to_Before: count_Head,
      from_After: 0,
      to_After: count_Head
    },
    {
      kind: "CHANGED",
      from_Before: count_Head,
      to_Before: before.length - count_End,
      from_After: count_Head,
      to_After: after.length - count_End
    },
    {
      kind: "KEPT",
      from_Before: before.length - count_End,
      to_Before: before.length,
      from_After: after.length - count_End,
      to_After: after.length
    }
  ]
  return stretches
    .filter((stretch) => stretch.kind === "CHANGED" || stretch.to_Before > stretch.from_Before)
    .map((stretch) => ({
      kind: stretch.kind,
      range_Before: rangeOf__Indexes({
        text_Model: text_Before,
        from: from_Before + stretch.from_Before,
        to: from_Before + stretch.to_Before
      }),
      range_After: rangeOf__Indexes({
        text_Model: text_After,
        from: from_After + stretch.from_After,
        to: from_After + stretch.to_After
      })
    }))
}

function flatOf__Text(
  text_Model: _Text_Model_
): Array<string> {
  return Array.from(text_Model.lines.join("\n"))
}

interface _Api___sharedOf__Ends_ {
  before: Array<string>
  after: Array<string>
}

interface _Ends_Shared_ {
  count_Head: number
  count_End: number
}

function sharedOf__Ends({
  before,
  after
}: _Api___sharedOf__Ends_): _Ends_Shared_ {
  const count_Shorter = Math.min(
    before.length,
    after.length
  )
  let count_Head = 0
  while (count_Head < count_Shorter && before[count_Head] === after[count_Head]) count_Head = count_Head + 1
  while (count_Head > 0 && isWord__Character(before[count_Head - 1]) && (isWord__Character(before[count_Head]) || isWord__Character(after[count_Head]))) count_Head = count_Head - 1
  let count_End = 0
  while (count_End < count_Shorter - count_Head && before[before.length - 1 - count_End] === after[after.length - 1 - count_End]) count_End = count_End + 1
  while (count_End > 0 && isWord__Character(before[before.length - count_End]) && (isWord__Character(before[before.length - count_End - 1]) || isWord__Character(after[after.length - count_End - 1]))) count_End = count_End - 1
  return {
    count_Head,
    count_End
  }
}

function isWord__Character(
  character: string | undefined
): boolean {
  return character !== undefined && REGEXP_WORD.test(character)
}

const REGEXP_WORD = /[\p{L}\p{N}_]/u

interface _Stretch_Narrowed_ {
  kind: _Kind_Run_
  from_Before: number
  to_Before: number
  from_After: number
  to_After: number
}

interface _Api___rangeOf__Indexes_ {
  text_Model: _Text_Model_
  from: number
  to: number
}

function rangeOf__Indexes({
  text_Model,
  from,
  to
}: _Api___rangeOf__Indexes_): _Range_Text_ {
  return {
    from: positionOf__Index({
      text_Model,
      index: from
    }),
    to: positionOf__Index({
      text_Model,
      index: to
    })
  }
}

interface _Api___settledOf__Head_ {
  document: _Document_Documents_
  head: _Head_Document_
  source: string
  way: _Way_Settle_
}

type _Way_Settle_ = "KEEP" | "TAKE" | "BOTH"

function settledOf__Head({
  document,
  head,
  source,
  way
}: _Api___settledOf__Head_): _Head_Document_ {
  const head_Carried = carriedOf__Head({
    document,
    head
  })
  const stale_Source = head_Carried.stale.find((stale_Each) => stale_Each.source === source)
  if (stale_Source === undefined) return head_Carried
  return {
    path: head_Carried.path,
    version: head_Carried.version,
    proposed: head_Carried.proposed.flatMap((changes_Source): Array<_Changes_Source_> => {
      if (changes_Source.source !== source) return [changes_Source]
      const [
        change_First,
        ...changes_Rest
      ] = changes_Source.changes.flatMap((
        change,
        index
      ) => {
        const stale_Change = stale_Source.changes_Stale.find((stale_Each) => stale_Each.index === index)
        return stale_Change === undefined
          ? [change]
          : HANDLERMAP__WAY_SETTLE[way]({
            change,
            over: stale_Change.over,
            text_Model: document.text
          })
      })
      return change_First === undefined
        ? []
        : [
          {
            source,
            changes: [
              change_First,
              ...changes_Rest
            ]
          }
        ]
    }),
    stale: head_Carried.stale.filter((stale_Each) => stale_Each !== stale_Source)
  }
}

type _HandlerMap__Way_Settle_ = {
  [Way in _Way_Settle_]: (api_Settle: _Api___changesOf__Settle_) => Array<_Change_>
}

interface _Api___changesOf__Settle_ {
  change: _Change_
  over: _Over_Change_
  text_Model: _Text_Model_
}

const HANDLERMAP__WAY_SETTLE: _HandlerMap__Way_Settle_ = {
  KEEP: KEEP_changesOf__Settle,
  TAKE: TAKE_changesOf__Settle,
  BOTH: BOTH_changesOf__Settle
}

function KEEP_changesOf__Settle({
  change,
  over,
  text_Model
}: _Api___changesOf__Settle_): Array<_Change_> {
  const span_Written = linesOf__Span({
    span: spanOf__Over({
      kind: "RANGE",
      change: over.written.change,
      text_Model: over.written.lines
    }),
    text_Model: over.written.lines
  })
  const text_Kept = textWith__Sources({
    model_TextEditor: {
      document: over.written.lines,
      proposed: [
        {
          source: "",
          changes: [over.written.change]
        }
      ]
    },
    sources: [""]
  })
  const count_Grown = flatOf__Text(text_Kept).length - flatOf__Text(over.written.lines).length
  const range = linesOf__Span({
    span: spanOf__Over({
      kind: "RANGE",
      change,
      text_Model
    }),
    text_Model
  })
  const next = textIn__Range({
    text_Model: text_Kept,
    range: {
      from: span_Written.from,
      to: positionOf__Index({
        text_Model: text_Kept,
        index: indexOf__Position({
          text_Model: over.written.lines,
          position: span_Written.to
        }) + count_Grown
      })
    }
  })
  const before = flatOf__Text(textIn__Range({
    text_Model,
    range
  }))
  const after = flatOf__Text(next)
  const {
    count_Head,
    count_End
  } = sharedOf__Ends({
    before,
    after
  })
  if (count_Head + count_End >= before.length && before.length === after.length) return []
  const from = indexOf__Position({
    text_Model,
    position: range.from
  })
  return [
    {
      kind: "REPLACE",
      range: rangeOf__Indexes({
        text_Model,
        from: from + count_Head,
        to: from + before.length - count_End
      }),
      next: textIn__Range({
        text_Model: next,
        range: rangeOf__Indexes({
          text_Model: next,
          from: count_Head,
          to: after.length - count_End
        })
      })
    }
  ]
}

interface _Api___linesOf__Span_ {
  span: _Range_Text_
  text_Model: _Text_Model_
}

function linesOf__Span({
  span,
  text_Model
}: _Api___linesOf__Span_): _Range_Text_ {
  return {
    from: {
      line: span.from.line,
      offset: 0
    },
    to: span.to.offset === 0 && span.to.line > span.from.line
      ? span.to
      : {
        line: span.to.line,
        offset: Array.from(text_Model.lines[span.to.line] ?? "").length
      }
  }
}

function TAKE_changesOf__Settle(): Array<_Change_> {
  return []
}

function BOTH_changesOf__Settle({
  change
}: _Api___changesOf__Settle_): Array<_Change_> {
  return [change]
}
