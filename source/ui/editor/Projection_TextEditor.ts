import {
  type _Model_TextEditor_,
  type _Change_,
  type _MOVE_Change_,
  type _Text_Model_,
  type _Id_Text_,
  type _Run_Comparison_,
  type _Range_Text_,
  type _Position_Text_,
  type _Piece_Applied_,
  type _Move_Piece_,
  type _Mark_Text_,
  mapped__NonEmpty,
  textIn__Range,
  comparisonOf__Texts,
  shiftedBy__Position,
  landedOf__Move,
  piecesWith__Sources,
  parseTexts_Line,
  type _Stale_Change_,
  pairOf__Stale,
  type _Pair_Stale_,
  type _Text_Line_NonTerminated_,
  type _Selected_Text_,
  type _Piece_Text_
} from "../../core/documents/index.ts"
import {
  isLines__Part_Frame,
  type _Range_Lines_,
  type _Module_Language_,
  type _ViewModel_TextEditor_,
  type _State_Proposal_,
  type _Decision_Proposal_,
  type _Status_Request_,
  type _Stale_Item_,
  type _Task_Header_,
  type _Figure_Card_,
  type _Document_Card_,
  type _Aim_Request_,
  type _Request_Item_,
  type _State_Task_,
  type _End_Task_,
  type _State_Document_,
  type _Action_Task_,
  type _Header_ViewModel_,
  type _Switcher_Header_,
  type _Option_Switcher_,
  type _Part_Task_,
  type _Picker_Header_,
  type _Section_Picker_,
  type _File_Picker_,
  type _Part_Header_,
  type _Footer_ViewModel_,
  type _Count_Tasks_,
  type _Kind_Count_,
  type _Action_Item_,
  type _Attributes_Element_,
  type _Line_Run_,
  type _Block_ViewModel_,
  type _FRAME_Block__ViewModel_,
  type _Part_Frame_,
  type _Run_Lines_,
  type _Note_Line_,
  type _Underlay_Text_,
  type _Marker_Gutter_,
  type _Stretch_Line_,
  type _Segment_Line_,
  type _Origin_Line_,
  type _STRETCH_Underlay_Text_,
  type _Group_Underlay_,
  type _Position_Run_,
  type _Item_Proposals_,
  type _Places_Item_,
  type _Condition_Places_,
  parseLines_ViewModel,
  viewModelOf__Blocks,
  segmentsOf__Stretches,
  stretchesOf__Segments,
  underlinedIn__Blocks,
  underlinedOf__Run,
  headOf__Quote,
  sizeOf__Quote,
  peekOf__Quote,
  type _Reference_Request_,
  isSame__Id_Text,
  type _Kind_Stale_,
  type _Way_Stale_
} from "./ViewModel_TextEditor.ts"

export {
  viewModelOf__Model,
  type _Mode_Host_,
  type __BASE_Mode_Host_,
  type _MANUAL_Mode_Host_,
  type _TASK_Mode_Host_,
  type _Standing_Task_,
  type _Proposal_Host_,
  type _Request_Host_,
  type _Task_Host_,
  type _Request_Task_,
  type _Document_Task_,
  type _Counts_Proposals_,
  type _Counts_Requests_,
  type _Landed_Round_,
  type _Module_Reading_,
  type _Api___boxesOf__Replacement_,
  type _Box_Reading_,
  ISAPPLIEDMAP__DECISION_PROPOSAL,
  LABELMAP__STATE_TASK,
  NOTEMAP__STATE_TASK,
  partsOf__Counts_Task,
  type _Counts_Task_
}

interface _Api___viewModelOf__Model_<State> {
  model_TextEditor: _Model_TextEditor_
  name_Document: string
  proposals: Array<_Proposal_Host_>
  mode: _Mode_Host_
  tasks: Array<_Standing_Task_>
  files: Array<string>
  rounds_Landed: Array<_Landed_Round_>
  source_Yours: string
  ranges_Frame: Array<_Range_Lines_>
  module_Language: _Module_Language_<State>
  module_Reading: _Module_Reading_
}

type _Mode_Host_ = _MANUAL_Mode_Host_ | _TASK_Mode_Host_

interface __BASE_Mode_Host_<Kind extends string> {
  kind: Kind
}

interface _MANUAL_Mode_Host_ extends __BASE_Mode_Host_<"MANUAL"> {}

interface _TASK_Mode_Host_ extends __BASE_Mode_Host_<"TASK"> {
  task: _Task_Host_
}

interface _Standing_Task_ {
  id: string
  name: string
  state: _State_Task_
  isOnDocument: boolean
  count_Undecided: number
  count_Conflicts: number
  count_Staged: number
  count_Running: number
}

function viewModelOf__Model<State>({
  model_TextEditor,
  name_Document,
  proposals,
  mode,
  tasks,
  files,
  rounds_Landed,
  source_Yours,
  ranges_Frame,
  module_Language,
  module_Reading
}: _Api___viewModelOf__Model_<State>): _ViewModel_TextEditor_ {
  const lines_Document = markedOf__Lines({
    lines: parseLines_ViewModel({
      multilineText: model_TextEditor.document.lines.join("\n"),
      module_Language
    }),
    texts: model_TextEditor.document.lines,
    marks: model_TextEditor.document.marks
  })
  const changes_Placed = placedOf__Changes({
    model_TextEditor,
    proposals,
    rounds_Landed,
    module_Reading
  })
  const frames_Model = framesOf__Changes({
    model_TextEditor,
    changes_Placed,
    ranges_Frame,
    source_Yours
  })
  const frames_Drawn = frames_Model.map((frame_Model) => drawnOf__Frame({
    model_TextEditor,
    frame_Model,
    changes_Placed,
    lines_Document,
    rounds_Landed,
    source_Yours,
    module_Language
  }))
  const blocks: Array<_Block_ViewModel_> = []
  let line_Next = 0
  for (const frame_Drawn of frames_Drawn) {
    blocks.push(
      ...blocksOf__Lines({
        lines_Run: lines_Document.slice(
          line_Next,
          frame_Drawn.frame_Model.first
        ),
        line_First: line_Next
      }),
      frameOf__Drawn({
        model_TextEditor,
        frame_Drawn,
        changes_Placed,
        proposals,
        rounds_Landed,
        source_Yours
      })
    )
    line_Next = Math.max(
      line_Next,
      frame_Drawn.frame_Model.last + 1
    )
  }
  return {
    ...viewModelOf__Blocks(underlinedIn__Blocks({
      blocks_ViewModel: [
        ...blocks,
        ...blocksOf__Lines({
          lines_Run: lines_Document.slice(line_Next),
          line_First: line_Next
        })
      ],
      references: (mode.kind === "TASK" ? mode.task.requests : []).flatMap((request_Task) => request_Task.status !== "ADDRESSED" && request_Task.aim.reference !== null ? [request_Task.aim.reference] : []),
      references_Running: (mode.kind === "TASK" ? mode.task.requests : []).flatMap((request_Task) => request_Task.status === "RUNNING" && request_Task.aim.reference !== null ? [request_Task.aim.reference] : []),
      attributes: {
        "data-requested": ""
      }
    })),
    header: headerOf__Proposals({
      model_TextEditor,
      name_Document,
      proposals,
      source_Yours,
      mode,
      tasks,
      files
    }),
    footer: footerOf__Tasks({
      tasks
    })
  }
}

interface _Api___headerOf__Proposals_ {
  model_TextEditor: _Model_TextEditor_
  name_Document: string
  proposals: Array<_Proposal_Host_>
  source_Yours: string
  mode: _Mode_Host_
  tasks: Array<_Standing_Task_>
  files: Array<string>
}

function headerOf__Proposals({
  model_TextEditor,
  name_Document,
  proposals,
  source_Yours,
  mode,
  tasks,
  files
}: _Api___headerOf__Proposals_): _Header_ViewModel_ {
  const requests_Task = mode.kind === "TASK" ? mode.task.requests : []
  const requests_Here = requests_Task.filter((request_Task) => request_Task.aim.kind !== "TASK")
  const proposals_Here = proposals.filter((proposal_Host) => proposal_Host.source !== source_Yours && model_TextEditor.proposed.some((changes_Source) => changes_Source.source === proposal_Host.source && changes_Source.changes.length > 0))
  const count_Decided = proposals_Here.filter((proposal_Host) => proposal_Host.state !== "OPEN").length
  const requests_Counted = [
    ...proposals_Here.flatMap((proposal_Host) => proposal_Host.requests),
    ...requests_Task
  ]
  const count_Staged = requests_Counted.filter((request_Host) => request_Host.status === "STAGED").length
  const count_Running = requests_Counted.filter((request_Host) => request_Host.status === "RUNNING").length
  const parts: Array<_Part_Header_> = mode.kind === "TASK" ? [] : [
    ...proposals_Here.length === 0
      ? []
      : [
        {
          text: `${count_Decided} of ${proposals_Here.length} decided`,
          isBusy: false
        }
      ],
    ...count_Staged === 0
      ? []
      : [
        {
          text: `${count_Staged} ${count_Staged === 1 ? "request" : "requests"} staged`,
          isBusy: false
        }
      ],
    ...count_Running === 0
      ? []
      : [
        {
          text: `${count_Running} running`,
          isBusy: true
        }
      ]
  ]
  const states_Here = proposals_Here.map((proposal_Host): _State_Proposal_ => proposal_Host.state !== "OPEN"
    ? proposal_Host.state
    : proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING")
      ? "REVISING"
      : proposal_Host.requests.some((request_Host) => request_Host.status === "STAGED")
        ? "REQUESTED"
        : "OPEN")
  const counts_Here = countsOf__States(states_Here)
  const requests_Counted_Here = [
    ...proposals_Here.flatMap((proposal_Host) => proposal_Host.requests),
    ...requests_Here
  ]
  const counts_Requests_Here: _Counts_Requests_ = {
    STAGED: requests_Counted_Here.filter((request_Host) => request_Host.status === "STAGED").length,
    RUNNING: requests_Counted_Here.filter((request_Host) => request_Host.status === "RUNNING").length
  }
  const documents_Task = (mode.kind === "TASK" ? mode.task.documents : [])
    .map((document_Task) => ({
      name: document_Task.name,
      counts_Proposals: document_Task.isShown ? counts_Here : document_Task.counts_Proposals,
      counts_Requests: document_Task.isShown ? counts_Requests_Here : document_Task.counts_Requests,
      isShown: document_Task.isShown,
      actions: document_Task.actions
    }))
    .sort((
      document_Task,
      document_Task_Other
    ) => Number(document_Task_Other.isShown) - Number(document_Task.isShown))
  const counts_Task = sumOf__Counts(documents_Task.map((document_Task) => document_Task.counts_Proposals))
  const isPresented = totalOf__Counts(mode.kind === "TASK" ? counts_Task : counts_Here) > 0
  const count_Startable_Here = requests_Here.filter((request_Task) => request_Task.status === "STAGED").length + proposals_Here
    .filter((proposal_Host) => proposal_Host.state === "OPEN" && !proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING"))
    .flatMap((proposal_Host) => proposal_Host.requests)
    .filter((request_Host) => request_Host.status === "STAGED").length
  const state_Document = stateOf__Document({
    counts_Proposals: counts_Here,
    counts_Requests: counts_Requests_Here
  })
  const requests_Whole = requests_Task.filter((request_Task) => request_Task.aim.kind === "TASK")
  const counts_Requests_Task: _Counts_Requests_ = {
    STAGED: requests_Whole.filter((request_Task) => request_Task.status === "STAGED").length + documents_Task.reduce((sum, document_Task) => sum + document_Task.counts_Requests.STAGED, 0),
    RUNNING: requests_Whole.filter((request_Task) => request_Task.status === "RUNNING").length + documents_Task.reduce((sum, document_Task) => sum + document_Task.counts_Requests.RUNNING, 0)
  }
  const count_Startable_Task = count_Startable_Here
    + requests_Whole.filter((request_Task) => request_Task.status === "STAGED").length
    + documents_Task.filter((document_Task) => !document_Task.isShown).reduce((sum, document_Task) => sum + document_Task.counts_Requests.STAGED, 0)
  return {
    mode: mode.kind === "MANUAL"
      ? {
        kind: "MANUAL",
        label: "No task"
      }
      : {
        kind: "TASK",
        task: {
          id: mode.task.id,
          name: mode.task.name,
          state: mode.task.state,
          label_State: LABELMAP__STATE_TASK[mode.task.state],
          ends: ENDSMAP__STATE_TASK[mode.task.state](totalOf__Counts(counts_Task) - decidedOf__Counts(counts_Task) + counts_Requests_Task.STAGED + counts_Requests_Task.RUNNING + (tasks.find((standing_Task) => standing_Task.id === mode.task.id)?.count_Conflicts ?? 0)),
          summary: mode.task.summary,
          reason: mode.task.reason,
          proposals: {
            figure: totalOf__Counts(counts_Task) === 0
              ? null
              : {
                value: decidedOf__Label(counts_Task),
                more: breakdownOf__Counts(counts_Task)
              },
            documents: documents_Task.length < 2 || totalOf__Counts(counts_Task) === 0
              ? []
              : documents_Task.map((document_Task) => ({
                path: document_Task.name,
                folder: folderOf__Path(document_Task.name),
                name: nameOf__Path(document_Task.name),
                value: decidedOf__Label(document_Task.counts_Proposals),
                more: breakdownOf__Counts(document_Task.counts_Proposals),
                isShown: document_Task.isShown,
                isDecided: decidedOf__Counts(document_Task.counts_Proposals) === totalOf__Counts(document_Task.counts_Proposals),
                label_Open: "Open here",
                actions: document_Task.actions
              })),
            actions: mode.task.actions.filter((action_Task) => action_Task.section === "PROPOSALS")
          },
          revisions_Scope: {
            figure: figureOf__Counts_Requests(counts_Requests_Task),
            start_All: count_Startable_Task === 0
              ? null
              : {
                label: `Start all (${count_Startable_Task})`,
                title: "Starts everything staged in the task, in every file it touches"
              },
            stop_All: counts_Requests_Task.RUNNING === 0
              ? null
              : {
                label: `Stop all (${counts_Requests_Task.RUNNING})`,
                title: "Stops everything running in the task, in every file it touches, staging it again"
              },
            actions: mode.task.actions.filter((action_Task) => action_Task.section === "REVISIONS")
          },
          revisions_Level: {
            requests: requests_Whole.map((request_Task) => itemOf__Request_Task({
              request_Task,
              model_TextEditor
            })),
            isStartable_Requests: requests_Whole.some((request_Task) => request_Task.status === "STAGED"),
            isStoppable_Requests: requests_Whole.some((request_Task) => request_Task.status === "RUNNING"),
            ask: isPresented
              ? {
                label: "Revise",
                label_Form: "Revise the task"
              }
              : {
                label: "Add a request",
                label_Form: "Add a request to the task"
              }
          }
        }
      },
    switcher: switcherOf__Tasks({
      mode,
      tasks
    }),
    parts,
    document: {
      folder: folderOf__Path(name_Document),
      name: nameOf__Path(name_Document),
      state: state_Document,
      label_State: LABELMAP__STATE_DOCUMENT[state_Document],
      summary: mode.kind === "TASK" ? mode.task.summary_Document : "",
      proposals: {
        figure: totalOf__Counts(counts_Here) === 0
          ? null
          : {
            value: decidedOf__Label(counts_Here),
            more: breakdownOf__Counts(counts_Here)
          },
        documents: [],
        actions: (mode.kind === "TASK" ? mode.task.actions_Document : []).filter((action_Task) => action_Task.section === "PROPOSALS")
      },
      revisions_Scope: {
        figure: figureOf__Counts_Requests(counts_Requests_Here),
        start_All: count_Startable_Here === 0
          ? null
          : {
            label: `Start all (${count_Startable_Here})`,
            title: `Starts all ${count_Startable_Here} ${count_Startable_Here === 1 ? "request" : "requests"} staged in this file, its own and its proposals'`
          },
        stop_All: counts_Requests_Here.RUNNING === 0
          ? null
          : {
            label: `Stop all (${counts_Requests_Here.RUNNING})`,
            title: `Stops all ${counts_Requests_Here.RUNNING} running in this file, its own and its proposals', staging them again`
          },
        actions: (mode.kind === "TASK" ? mode.task.actions_Document : []).filter((action_Task) => action_Task.section === "REVISIONS")
      },
      revisions_Level: {
        requests: requests_Here.map((request_Task) => itemOf__Request_Task({
          request_Task,
          model_TextEditor
        })),
        isStartable_Requests: requests_Here.some((request_Task) => request_Task.status === "STAGED"),
        isStoppable_Requests: requests_Here.some((request_Task) => request_Task.status === "RUNNING"),
        ask: isPresented
          ? {
            label: "Revise",
            label_Form: "Revise this file"
          }
          : {
            label: "Add a request",
            label_Form: "Request a change to this file"
          }
      }
    },
    picker: pickerOf__Files({
      mode,
      documents_Task,
      name_Document,
      files
    })
  }
}

interface _Api___switcherOf__Tasks_ {
  mode: _Mode_Host_
  tasks: Array<_Standing_Task_>
}

function switcherOf__Tasks({
  mode,
  tasks
}: _Api___switcherOf__Tasks_): _Switcher_Header_ {
  const isHereOf = (standing_Task: _Standing_Task_) => mode.kind === "TASK" && mode.task.id === standing_Task.id
  const tasks_Ordered = [
    ...tasks.filter((standing_Task) => isHereOf(standing_Task)),
    ...tasks.filter((standing_Task) => !isHereOf(standing_Task) && standing_Task.isOnDocument),
    ...tasks.filter((standing_Task) => !isHereOf(standing_Task) && !standing_Task.isOnDocument)
  ]
  return {
    label: "Switch task",
    label_Here: "this editor",
    options: tasks.length === 0
      ? []
      : [
        ...tasks_Ordered.map((standing_Task): _Option_Switcher_ => ({
          kind: "TASK",
          label: standing_Task.name,
          isHere: isHereOf(standing_Task),
          id: standing_Task.id,
          state: standing_Task.state,
          parts: standing_Task.state === "DRAFT"
            ? [
              {
                kind: "STAGED",
                text: `${standing_Task.count_Staged} staged`
              }
            ]
            : partsOf__Counts_Task(standing_Task)
        })),
        {
          kind: "MANUAL",
          label: "No task",
          isHere: mode.kind === "MANUAL"
        }
      ]
  }
}

type _NoteMap__State_Task_ = {
  [State in _State_Task_]: string
}

const NOTEMAP__STATE_TASK: _NoteMap__State_Task_ = {
  DRAFT: "draft",
  WORKING: "working",
  YOUR_TURN: "needs you",
  APPLIED: "applied",
  CANCELED: "canceled",
  DISCARDED: "discarded"
}

interface _Counts_Task_ {
  count_Undecided: number
  count_Conflicts: number
  count_Running: number
  count_Staged: number
}

function partsOf__Counts_Task(
  counts_Task: _Counts_Task_
): Array<_Part_Task_> {
  const yours: Array<_Part_Task_> = [
    ...counts_Task.count_Conflicts === 0
      ? []
      : [
        {
          kind: "CONFLICT" as const,
          text: `${counts_Task.count_Conflicts} ${counts_Task.count_Conflicts === 1 ? "conflict" : "conflicts"}`
        }
      ],
    ...counts_Task.count_Undecided === 0
      ? []
      : [
        {
          kind: "YOURS" as const,
          text: `${counts_Task.count_Undecided} to decide`
        }
      ],
    ...counts_Task.count_Staged === 0
      ? []
      : [
        {
          kind: "STAGED" as const,
          text: `${counts_Task.count_Staged} staged`
        }
      ]
  ]
  const agent: Array<_Part_Task_> = counts_Task.count_Running === 0
    ? []
    : [
      {
        kind: "AGENT",
        text: `${counts_Task.count_Running} running`
      }
    ]
  const [yours_First] = yours.length === 0 && agent.length === 0
    ? [
      {
        kind: "YOURS" as const,
        text: "applicable"
      }
    ]
    : yours
  return [
    ...yours_First === undefined ? [] : [yours_First],
    ...agent
  ]
}

interface _Api___pickerOf__Files_ {
  mode: _Mode_Host_
  documents_Task: Array<_Document_Task_>
  name_Document: string
  files: Array<string>
}

function pickerOf__Files({
  mode,
  documents_Task,
  name_Document,
  files
}: _Api___pickerOf__Files_): _Picker_Header_ {
  const fileOf = (path: string, figure: string, isHere: boolean): _File_Picker_ => ({
    path,
    folder: folderOf__Path(path),
    name: nameOf__Path(path),
    figure,
    isHere
  })
  const paths_Task = documents_Task.map((document_Task) => document_Task.name)
  const sections: Array<_Section_Picker_> = mode.kind === "TASK"
    ? [
      {
        label: "Files in task",
        files: documents_Task.map((document_Task) => fileOf(
          document_Task.name,
          totalOf__Counts(document_Task.counts_Proposals) === 0 ? "" : decidedOf__Label(document_Task.counts_Proposals),
          document_Task.isShown
        ))
      },
      {
        label: "Other files",
        files: files.filter((path) => !paths_Task.includes(path)).map((path) => fileOf(
          path,
          "",
          path === name_Document
        ))
      }
    ]
    : [
      {
        label: "Files",
        files: files.map((path) => fileOf(
          path,
          "",
          path === name_Document
        ))
      }
    ]
  return {
    label: "Open a file",
    label_Here: "this editor",
    sections: sections.filter((section_Picker) => section_Picker.files.length > 0)
  }
}

interface _Api___footerOf__Tasks_ {
  tasks: Array<_Standing_Task_>
}

function footerOf__Tasks({
  tasks
}: _Api___footerOf__Tasks_): _Footer_ViewModel_ {
  const counts: Array<_Count_Tasks_> = [
    {
      kind: "YOURS" as const,
      count: tasks.filter((standing_Task) => standing_Task.state !== "DRAFT" && partsOf__Counts_Task(standing_Task).some((part_Task) => part_Task.kind !== "AGENT")).length
    },
    {
      kind: "CONFLICTS" as const,
      count: tasks.reduce((sum, standing_Task) => sum + standing_Task.count_Conflicts, 0)
    },
    {
      kind: "WORKING" as const,
      count: tasks.filter((standing_Task) => standing_Task.count_Running > 0).length
    },
    {
      kind: "DRAFTS" as const,
      count: tasks.filter((standing_Task) => standing_Task.state === "DRAFT").length
    }
  ].filter((count_Tasks) => count_Tasks.count > 0)
  return {
    title: tasks.length === 0
      ? ""
      : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}${counts.length === 0 ? "" : `: ${counts.map((count_Tasks) => WORDSMAP__KIND_COUNT[count_Tasks.kind](count_Tasks.count)).join(", ")}`}`,
    counts
  }
}

type _WordsMap__Kind_Count_ = {
  [Kind in _Kind_Count_]: (count: number) => string
}

const WORDSMAP__KIND_COUNT: _WordsMap__Kind_Count_ = {
  YOURS: (count) => `${count} ${count === 1 ? "needs" : "need"} you`,
  CONFLICTS: (count) => `${count} ${count === 1 ? "conflict" : "conflicts"}`,
  WORKING: (count) => `${count} working`,
  DRAFTS: (count) => `${count} ${count === 1 ? "draft" : "drafts"}`
}

function figureOf__Counts_Requests(
  counts_Requests: _Counts_Requests_
): _Figure_Card_ | null {
  const parts = [
    ...counts_Requests.STAGED === 0 ? [] : [`${counts_Requests.STAGED} staged`],
    ...counts_Requests.RUNNING === 0 ? [] : [`${counts_Requests.RUNNING} running`]
  ]
  return parts.length === 0
    ? null
    : {
      value: parts.join(" · "),
      more: ""
    }
}

interface _Api___stateOf__Document_ {
  counts_Proposals: _Counts_Proposals_
  counts_Requests: _Counts_Requests_
}

function stateOf__Document({
  counts_Proposals,
  counts_Requests
}: _Api___stateOf__Document_): _State_Document_ {
  return counts_Requests.RUNNING > 0
    ? "WORKING"
    : counts_Requests.STAGED > 0 || decidedOf__Counts(counts_Proposals) < totalOf__Counts(counts_Proposals)
      ? "YOUR_TURN"
      : totalOf__Counts(counts_Proposals) > 0
        ? "DONE"
        : "NONE"
}

type _LabelMap__State_Document_ = {
  [State in _State_Document_]: string
}

const LABELMAP__STATE_DOCUMENT: _LabelMap__State_Document_ = {
  NONE: "",
  YOUR_TURN: "Your turn",
  WORKING: "Working",
  DONE: "Done"
}

function folderOf__Path(
  path: string
): string {
  return path.slice(0, path.lastIndexOf("/") + 1)
}

function nameOf__Path(
  path: string
): string {
  return path.slice(path.lastIndexOf("/") + 1)
}

interface _Api___itemOf__Request_Task_ {
  request_Task: _Request_Task_
  model_TextEditor: _Model_TextEditor_
}

function itemOf__Request_Task({
  request_Task,
  model_TextEditor
}: _Api___itemOf__Request_Task_): _Request_Item_ {
  return {
    id: request_Task.id,
    notes: request_Task.notes,
    reference: referenceOf__Request({
      reference: request_Task.aim.reference,
      status: request_Task.status,
      model_TextEditor
    }),
    status: request_Task.status,
    progress: PROGRESSMAP__STATUS_REQUEST[request_Task.status],
    detail_Progress: request_Task.status === "ADDRESSED" ? detailOf__Request(request_Task) : null,
    isRunning: request_Task.status === "RUNNING",
    isStartable: request_Task.status === "STAGED",
    isRemovable: request_Task.status === "STAGED",
    isEditing: false,
    isStoppable: request_Task.status === "RUNNING",
    isDismissable: request_Task.status === "ADDRESSED"
  }
}

interface _Api___referenceOf__Request_ {
  reference: _Selected_Text_ | null
  status: _Status_Request_
  model_TextEditor: _Model_TextEditor_
}

function referenceOf__Request({
  reference,
  status,
  model_TextEditor
}: _Api___referenceOf__Request_): _Reference_Request_ | null {
  if (reference === null) return null
  const isShown = status !== "ADDRESSED"
  return {
    side: reference.side,
    head: headOf__Quote({
      text: reference.text
    }),
    size: isShown
      ? null
      : sizeOf__Quote({
        text: reference.text
      }),
    lines: isShown
      ? labelOf__Lines(rangeOf__Pieces({
        pieces: reference.pieces,
        model_TextEditor
      }))
      : null,
    peek: peekOf__Quote({
      text: reference.text
    }),
    pieces: isShown ? reference.pieces : null
  }
}

interface _Api___rangeOf__Pieces_ {
  pieces: _Selected_Text_["pieces"]
  model_TextEditor: _Model_TextEditor_
}

function rangeOf__Pieces({
  pieces,
  model_TextEditor
}: _Api___rangeOf__Pieces_): _Range_Lines_ {
  const line$ = pieces.flatMap((piece_Text) => {
    const line_Start = piece_Text.id_Text.kind === "DOCUMENT"
      ? 0
      : model_TextEditor.proposed.find((changes_Source) => piece_Text.id_Text.kind === "CHANGE" && changes_Source.source === piece_Text.id_Text.source)?.changes[piece_Text.id_Text.index]?.range.from.line ?? 0
    const line_Last = piece_Text.range.to.offset === 0 && piece_Text.range.to.line > piece_Text.range.from.line ? piece_Text.range.to.line - 1 : piece_Text.range.to.line
    return [
      line_Start + piece_Text.range.from.line,
      line_Start + line_Last
    ]
  })
  return {
    first: Math.min(...line$) + 1,
    last: Math.max(...line$) + 1
  }
}

function countsOf__States(
  states: Array<_State_Proposal_>
): _Counts_Proposals_ {
  return {
    OPEN: states.filter((state) => state === "OPEN").length,
    REQUESTED: states.filter((state) => state === "REQUESTED").length,
    REVISING: states.filter((state) => state === "REVISING").length,
    ACCEPTED: states.filter((state) => state === "ACCEPTED").length,
    REJECTED: states.filter((state) => state === "REJECTED").length,
    WITHDRAWN: states.filter((state) => state === "WITHDRAWN").length
  }
}

function sumOf__Counts(
  counts$_Proposals: Array<_Counts_Proposals_>
): _Counts_Proposals_ {
  const countOf = (state: _State_Proposal_) => counts$_Proposals.reduce(
    (sum, counts_Proposals) => sum + counts_Proposals[state],
    0
  )
  return {
    OPEN: countOf("OPEN"),
    REQUESTED: countOf("REQUESTED"),
    REVISING: countOf("REVISING"),
    ACCEPTED: countOf("ACCEPTED"),
    REJECTED: countOf("REJECTED"),
    WITHDRAWN: countOf("WITHDRAWN")
  }
}

function decidedOf__Label(
  counts_Proposals: _Counts_Proposals_
): string {
  return `${decidedOf__Counts(counts_Proposals)} of ${totalOf__Counts(counts_Proposals)} decided`
}

function totalOf__Counts(
  counts_Proposals: _Counts_Proposals_
): number {
  return STATES__PROPOSAL.reduce(
    (sum, state) => sum + counts_Proposals[state],
    0
  )
}

function decidedOf__Counts(
  counts_Proposals: _Counts_Proposals_
): number {
  return counts_Proposals.ACCEPTED + counts_Proposals.REJECTED + counts_Proposals.WITHDRAWN
}

function breakdownOf__Counts(
  counts_Proposals: _Counts_Proposals_
): string {
  return STATES__PROPOSAL.flatMap((state) => counts_Proposals[state] === 0 ? [] : [`${counts_Proposals[state]} ${LABELMAP__STATE_PROPOSAL[state]}`]).join(" · ")
}

const STATES__PROPOSAL: Array<_State_Proposal_> = ["OPEN", "REQUESTED", "REVISING", "ACCEPTED", "REJECTED", "WITHDRAWN"]

type _LabelMap__State_Proposal_ = {
  [State in _State_Proposal_]: string
}

const LABELMAP__STATE_PROPOSAL: _LabelMap__State_Proposal_ = {
  OPEN: "to review",
  REQUESTED: "revision requested",
  REVISING: "revising",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn"
}

type _LabelMap__State_Task_ = {
  [State in _State_Task_]: string
}

const LABELMAP__STATE_TASK: _LabelMap__State_Task_ = {
  DRAFT: "Draft",
  WORKING: "Working",
  YOUR_TURN: "Your turn",
  APPLIED: "Applied",
  CANCELED: "Canceled",
  DISCARDED: "Discarded"
}

type _EndsMap__State_Task_ = {
  [State in _State_Task_]: (count_Left: number) => Array<_End_Task_>
}

const ENDSMAP__STATE_TASK: _EndsMap__State_Task_ = {
  DRAFT: (count_Left) => [
    ...applyOf__Count_Left(count_Left),
    {
      kind: "DISCARD",
      label: "Cancel",
      title: "Lets the draft go, its requests and any edits made in it"
    }
  ],
  WORKING: (count_Left) => endsOf__Task_Open(count_Left),
  YOUR_TURN: (count_Left) => endsOf__Task_Open(count_Left),
  APPLIED: () => [],
  CANCELED: () => [],
  DISCARDED: () => []
}

function applyOf__Count_Left(
  count_Left: number
): Array<_End_Task_> {
  return count_Left > 0
    ? []
    : [
      {
        kind: "APPLY",
        label: "Apply",
        title: "Applies what's accepted in the task, and your edits in it, to every file it touches"
      }
    ]
}

function endsOf__Task_Open(
  count_Left: number
): Array<_End_Task_> {
  return [
    ...applyOf__Count_Left(count_Left),
    {
      kind: "CANCEL",
      label: "Cancel",
      title: "Lets the task go, what's accepted in it and your edits in it, stopping what's running"
    }
  ]
}

type _ProgressMap__Status_Request_ = {
  [Status in _Status_Request_]: string
}

const PROGRESSMAP__STATUS_REQUEST: _ProgressMap__Status_Request_ = {
  STAGED: "staged",
  RUNNING: "running",
  ADDRESSED: "done"
}

function detailOf__Request(
  request_Task: _Request_Task_
): string {
  const count = request_Task.sources_Answering.length
  return count === 0
    ? "nothing to change"
    : `${count} ${count === 1 ? "proposal" : "proposals"}`
}

interface _Api___markedOf__Lines_ {
  lines: Array<_Line_Run_>
  texts: Array<string>
  marks: Array<_Mark_Text_>
}

function markedOf__Lines({
  lines,
  texts,
  marks
}: _Api___markedOf__Lines_): Array<_Line_Run_> {
  return lines.map((
    line,
    index
  ) => {
    const text = texts[index] ?? ""
    const stretches_Mark = marks.flatMap((mark): Array<_Stretch_Line_> => {
      const from = mark.range.from.line < index ? 0 : mark.range.from.offset
      const to = mark.range.to.line > index
        ? countOf__CodePoints(text)
        : Math.min(
          mark.range.to.offset,
          countOf__CodePoints(text)
        )
      return mark.range.from.line <= index && index <= mark.range.to.line && from < to
        ? [
          {
            from: unitsOf__CodePoints({
              text,
              count: from
            }),
            to: unitsOf__CodePoints({
              text,
              count: to
            }),
            attributes: mark.data
          }
        ]
        : []
    })
    return stretches_Mark.length === 0
      ? line
      : {
        layer: line.layer,
        gutter: line.gutter,
        note: line.note,
        segments: segmentsOf__Stretches({
          text: parseTexts_Line(text)[0],
          stretches: [
            ...stretchesOf__Segments(line.segments),
            ...stretches_Mark
          ]
        }),
        origins: line.origins
      }
  })
}

interface _Proposal_Host_ {
  source: string
  title: string
  state: _Decision_Proposal_
  status: string
  rationale: string
  requests: Array<_Request_Host_>
  actions: Array<_Action_Item_>
  attributes: _Attributes_Element_
}

interface _Request_Host_ {
  id: string
  notes: string
  reference: _Selected_Text_ | null
  status: _Status_Request_
}

interface _Task_Host_ {
  id: string
  name: string
  state: _State_Task_
  summary: string
  reason: string
  documents: Array<_Document_Task_>
  summary_Document: string
  requests: Array<_Request_Task_>
  actions: Array<_Action_Task_>
  actions_Document: Array<_Action_Task_>
}

interface _Document_Task_ {
  name: string
  counts_Proposals: _Counts_Proposals_
  counts_Requests: _Counts_Requests_
  isShown: boolean
  actions: Array<_Action_Task_>
}

type _Counts_Proposals_ = {
  [State in _State_Proposal_]: number
}

interface _Counts_Requests_ {
  STAGED: number
  RUNNING: number
}

interface _Request_Task_ {
  id: string
  notes: string
  aim: _Aim_Request_
  status: _Status_Request_
  sources_Answering: Array<string>
}

interface _Landed_Round_ {
  source: string
  changes_Stale: Array<_Stale_Change_>
  count_Dropped: number
}

interface _Module_Reading_ {
  boxesOf__Replacement: (api_Replacement: _Api___boxesOf__Replacement_) => Array<_Box_Reading_>
  word_Move: string
}

interface _Api___boxesOf__Replacement_ {
  text_Before: _Text_Model_
  text_After: _Text_Model_
  runs: Array<_Run_Comparison_>
}

interface _Box_Reading_ {
  range_Before: _Range_Text_
  range_After: _Range_Text_
  word: string
}

interface _Api___placedOf__Changes_ {
  model_TextEditor: _Model_TextEditor_
  proposals: Array<_Proposal_Host_>
  rounds_Landed: Array<_Landed_Round_>
  module_Reading: _Module_Reading_
}

function placedOf__Changes({
  model_TextEditor,
  proposals,
  rounds_Landed,
  module_Reading
}: _Api___placedOf__Changes_): Array<_Placed_Change_> {
  const places_Source = new Map<
    string,
    number
  >()
  const changes_Compared = model_TextEditor.proposed
    .flatMap((changes_Source) => changes_Source.changes.map((
      change,
      index
    ) => ({
      source: changes_Source.source,
      index,
      change
    })))
    .toSorted((
      change_One,
      change_Other
    ) => orderOf__Positions({
      position: change_One.change.range.from,
      position_Other: change_Other.change.range.from
    }))
    .map((change_Model): _Compared_Change_ => {
      const change = change_Model.change
      const proposal_Host = proposals.find((proposal_Each) => proposal_Each.source === change_Model.source)
      if (proposal_Host === undefined) throw new Error(`no proposal for the source ${change_Model.source}`)
      const isApplied = ISAPPLIEDMAP__DECISION_PROPOSAL[proposal_Host.state]
      const text_Before = textIn__Range({
        text_Model: model_TextEditor.document,
        range: change.range
      })
      const runs_Comparison: Array<_Run_Comparison_> = isApplied && change.kind === "REPLACE"
        ? comparisonOf__Texts({
          text_Before,
          text_After: change.next
        })
        : []
      const runs_Change: Array<_Run_Change_> = !isApplied
        ? []
        : change.kind === "REPLACE"
          ? module_Reading.boxesOf__Replacement({
            text_Before,
            text_After: change.next,
            runs: runs_Comparison
          }).map((box_Reading) => runOf__Box({
            box_Reading,
            origin: change.range.from
          }))
          : [
            {
              kind: "MOVED",
              word: module_Reading.word_Move,
              range_Before: change.range,
              range_After: null
            }
          ]
      const runs: Array<_Run_Placed_> = []
      for (const run_Change of runs_Change) {
        const place = (places_Source.get(change_Model.source) ?? 0) + 1
        places_Source.set(
          change_Model.source,
          place
        )
        runs.push({
          ...run_Change,
          place
        })
      }
      return {
        source: change_Model.source,
        index: change_Model.index,
        change,
        isApplied,
        isStale: rounds_Landed.some((round_Landed) => round_Landed.source === change_Model.source && round_Landed.changes_Stale.some((stale_Change) => stale_Change.index === change_Model.index)),
        runs,
        ranges_Kept: runs_Comparison.flatMap((run_Comparison) => run_Comparison.kind === "KEPT"
          ? [
            shiftedBy__Range({
              range: run_Comparison.range_Before,
              origin: change.range.from
            })
          ]
          : [])
      }
    })
  return changes_Compared.map((change_Compared) => ({
    ...change_Compared,
    outer: outerOf__Change({
      change_Compared,
      changes_Compared
    })
  }))
}

interface _Api___runOf__Box_ {
  box_Reading: _Box_Reading_
  origin: _Position_Text_
}

function runOf__Box({
  box_Reading,
  origin
}: _Api___runOf__Box_): _Run_Change_ {
  return {
    kind: isEmpty__Range(box_Reading.range_Before)
      ? "INSERTED"
      : isEmpty__Range(box_Reading.range_After)
        ? "REMOVED"
        : "REPLACED",
    word: box_Reading.word,
    range_Before: shiftedBy__Range({
      range: box_Reading.range_Before,
      origin
    }),
    range_After: box_Reading.range_After
  }
}

function isEmpty__Range(
  range: _Range_Text_
): boolean {
  return orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) === 0
}

interface _Api___shiftedBy__Range_ {
  range: _Range_Text_
  origin: _Position_Text_
}

function shiftedBy__Range({
  range,
  origin
}: _Api___shiftedBy__Range_): _Range_Text_ {
  return {
    from: shiftedBy__Position({
      position: range.from,
      origin
    }),
    to: shiftedBy__Position({
      position: range.to,
      origin
    })
  }
}

interface _Placed_Change_ extends _Compared_Change_ {
  outer: _Outer_Change_ | null
}

type _IsAppliedMap__Decision_Proposal_ = {
  [Decision in _Decision_Proposal_]: boolean
}

const ISAPPLIEDMAP__DECISION_PROPOSAL: _IsAppliedMap__Decision_Proposal_ = {
  OPEN: true,
  ACCEPTED: true,
  REJECTED: false,
  WITHDRAWN: false
}

interface _Compared_Change_ {
  source: string
  index: number
  change: _Change_
  isApplied: boolean
  isStale: boolean
  runs: Array<_Run_Placed_>
  ranges_Kept: Array<_Range_Text_>
}

interface _Run_Placed_ extends _Run_Change_ {
  place: number
}

interface _Run_Change_ {
  kind: _Kind_Change_
  word: string
  range_Before: _Range_Text_
  range_After: _Range_Text_ | null
}

type _Kind_Change_ = "REMOVED" | "INSERTED" | "REPLACED" | "MOVED"

interface _Outer_Change_ {
  kind: _Kind_Outer_
  source: string
}

type _Kind_Outer_ = "WITHIN" | "CARRIED"

interface _Api___orderOf__Positions_ {
  position: _Position_Text_
  position_Other: _Position_Text_
}

function orderOf__Positions({
  position,
  position_Other
}: _Api___orderOf__Positions_): number {
  return position.line - position_Other.line || position.offset - position_Other.offset
}

interface _Api___outerOf__Change_ {
  change_Compared: _Compared_Change_
  changes_Compared: Array<_Compared_Change_>
}

function outerOf__Change({
  change_Compared,
  changes_Compared
}: _Api___outerOf__Change_): _Outer_Change_ | null {
  const range = change_Compared.change.range
  const change_Outer = changes_Compared
    .filter((change_Other) => change_Other.isApplied && change_Other.source !== change_Compared.source && isInside__Span({
      range,
      range_Outer: change_Other.change.range
    }))
    .reduce<_Compared_Change_ | null>(
      (
        change_Innermost,
        change_Other
      ) => change_Innermost === null || orderOf__Positions({
        position: change_Other.change.range.from,
        position_Other: change_Innermost.change.range.from
      }) > 0
        ? change_Other
        : change_Innermost,
      null
    )
  if (change_Outer === null) return null
  if (change_Outer.change.kind === "MOVE") return {
    kind: "CARRIED",
    source: change_Outer.source
  }
  return change_Outer.ranges_Kept.some((range_Kept) => orderOf__Positions({
    position: range_Kept.from,
    position_Other: range.from
  }) <= 0 && orderOf__Positions({
    position: range.to,
    position_Other: range_Kept.to
  }) <= 0)
    ? null
    : {
      kind: "WITHIN",
      source: change_Outer.source
    }
}

interface _Api___isInside__Span_ {
  range: _Range_Text_
  range_Outer: _Range_Text_
}

function isInside__Span({
  range,
  range_Outer
}: _Api___isInside__Span_): boolean {
  const order_From = orderOf__Positions({
    position: range_Outer.from,
    position_Other: range.from
  })
  const order_To = orderOf__Positions({
    position: range.to,
    position_Other: range_Outer.to
  })
  return orderOf__Positions({
    position: range.from,
    position_Other: range.to
  }) === 0
    ? order_From < 0 && orderOf__Positions({
      position: range.from,
      position_Other: range_Outer.to
    }) < 0
    : order_From <= 0 && order_To <= 0 && !(order_From === 0 && order_To === 0)
}

interface _Api___framesOf__Changes_ {
  model_TextEditor: _Model_TextEditor_
  changes_Placed: Array<_Placed_Change_>
  ranges_Frame: Array<_Range_Lines_>
  source_Yours: string
}

interface _Frame_Model_ {
  first: number
  last: number
  ends: Array<_End_Change_>
}

interface _End_Change_ {
  change_Placed: _Placed_Change_
  kind: _Kind_End_
}

type _Kind_End_ = "SPAN" | "LANDING"

function framesOf__Changes({
  model_TextEditor,
  changes_Placed,
  ranges_Frame,
  source_Yours
}: _Api___framesOf__Changes_): Array<_Frame_Model_> {
  return yoursJoinedOf__Frames({
    frames_Model: mergedOf__Frames([
      ...changes_Placed.flatMap((change_Placed): Array<_Frame_Model_> => {
        const change = change_Placed.change
        return [
          {
            ...linesOf__Span({
              model_TextEditor,
              change
            }),
            ends: [
              {
                change_Placed,
                kind: "SPAN"
              }
            ]
          },
          ...(change.kind === "MOVE"
            ? [
              {
                ...linesOf__Landing({
                  model_TextEditor,
                  change
                }),
                ends: [
                  {
                    change_Placed,
                    kind: "LANDING" as const
                  }
                ]
              }
            ]
            : [])
        ]
      }),
      ...ranges_Frame.map((range_Frame) => ({
        first: range_Frame.first - 1,
        last: range_Frame.last - 1,
        ends: []
      }))
    ]).filter((frame_Model) => frame_Model.ends.length > 0),
    source_Yours
  })
}

interface _Api___linesOf__Span_ {
  model_TextEditor: _Model_TextEditor_
  change: _Change_
}

interface _Lines_End_ {
  first: number
  last: number
}

function linesOf__Span({
  model_TextEditor,
  change
}: _Api___linesOf__Span_): _Lines_End_ {
  const from = change.range.from
  const to = change.range.to
  if (orderOf__Positions({
    position: from,
    position_Other: to
  }) === 0) return linesOf__Point({
    model_TextEditor,
    at: from,
    text: change.kind === "REPLACE" ? change.next.lines.join("\n") : ""
  })
  const count_From = countOf__CodePoints(model_TextEditor.document.lines[from.line] ?? "")
  const first = count_From > 0 && from.offset === count_From && to.line > from.line ? from.line + 1 : from.line
  const last = to.offset === 0 && to.line > from.line ? to.line - 1 : to.line
  return first > last
    ? {
      first: from.line,
      last: to.line
    }
    : {
      first,
      last
    }
}

interface _Api___linesOf__Point_ {
  model_TextEditor: _Model_TextEditor_
  at: _Position_Text_
  text: string
}

function linesOf__Point({
  model_TextEditor,
  at,
  text
}: _Api___linesOf__Point_): _Lines_End_ {
  if (at.offset === 0 && text.endsWith("\n")) return {
    first: at.line,
    last: at.line - 1
  }
  if (at.offset === countOf__CodePoints(model_TextEditor.document.lines[at.line] ?? "") && text.startsWith("\n")) return {
    first: at.line + 1,
    last: at.line
  }
  return {
    first: at.line,
    last: at.line
  }
}

function countOf__CodePoints(
  text: string
): number {
  return Array.from(text).length
}

interface _Api___linesOf__Landing_ {
  model_TextEditor: _Model_TextEditor_
  change: _MOVE_Change_
}

function linesOf__Landing({
  model_TextEditor,
  change
}: _Api___linesOf__Landing_): _Lines_End_ {
  return linesOf__Point({
    model_TextEditor,
    at: change.at,
    text: landedOf__Move({
      model_TextEditor,
      change
    })
  })
}

function mergedOf__Frames(
  frames_Model: Array<_Frame_Model_>
): Array<_Frame_Model_> {
  const frames_Merged: Array<_Frame_Model_> = []
  for (const frame_Model of frames_Model) {
    let frame_Joined = frame_Model
    let index = indexOf__Sharing({
      frames_Model: frames_Merged,
      frame_Model: frame_Joined
    })
    while (index !== -1) {
      const frame_Sharing = frames_Merged.splice(
        index,
        1
      )[0]
      if (frame_Sharing !== undefined) frame_Joined = joinedOf__Frames({
        frame_Model: frame_Sharing,
        frame_Other: frame_Joined
      })
      index = indexOf__Sharing({
        frames_Model: frames_Merged,
        frame_Model: frame_Joined
      })
    }
    frames_Merged.push(frame_Joined)
  }
  return frames_Merged.toSorted((
    frame_One,
    frame_Other
  ) => frame_One.first - frame_Other.first || frame_One.last - frame_Other.last)
}

interface _Api___indexOf__Sharing_ {
  frames_Model: Array<_Frame_Model_>
  frame_Model: _Frame_Model_
}

function indexOf__Sharing({
  frames_Model,
  frame_Model
}: _Api___indexOf__Sharing_): number {
  return frames_Model.findIndex((frame_Other) => isSharing__Frames({
    frame_Model,
    frame_Other
  }))
}

interface _Api___isSharing__Frames_ {
  frame_Model: _Frame_Model_
  frame_Other: _Frame_Model_
}

function isSharing__Frames({
  frame_Model,
  frame_Other
}: _Api___isSharing__Frames_): boolean {
  const isPoint = frame_Model.last < frame_Model.first
  const isPoint_Other = frame_Other.last < frame_Other.first
  if (isPoint && isPoint_Other) return frame_Model.first === frame_Other.first
  if (isPoint) return isAt__Frame({
    line: lineOf__Point(frame_Model),
    frame_Model: frame_Other
  })
  if (isPoint_Other) return isAt__Frame({
    line: lineOf__Point(frame_Other),
    frame_Model
  })
  return Math.max(
    frame_Model.first,
    frame_Other.first
  ) <= Math.min(
    frame_Model.last,
    frame_Other.last
  )
}

function lineOf__Point(
  frame_Model: _Frame_Model_
): number {
  const end_Change = frame_Model.ends[0]
  const change = end_Change?.change_Placed.change
  return end_Change === undefined || change === undefined
    ? frame_Model.first
    : end_Change.kind === "LANDING" && change.kind === "MOVE"
      ? change.at.line
      : change.range.from.line
}

interface _Api___isAt__Frame_ {
  line: number
  frame_Model: _Frame_Model_
}

function isAt__Frame({
  line,
  frame_Model
}: _Api___isAt__Frame_): boolean {
  return frame_Model.first <= line && line <= frame_Model.last
}

interface _Api___yoursJoinedOf__Frames_ {
  frames_Model: Array<_Frame_Model_>
  source_Yours: string
}

function yoursJoinedOf__Frames({
  frames_Model,
  source_Yours
}: _Api___yoursJoinedOf__Frames_): Array<_Frame_Model_> {
  const isYours = (frame_Model: _Frame_Model_): boolean => frame_Model.ends.every((end_Change) => end_Change.change_Placed.source === source_Yours)
  return frames_Model.reduce(
    (
      frames_Joined: Array<_Frame_Model_>,
      frame_Model
    ) => {
      const frame_Last = frames_Joined.at(-1)
      return frame_Last !== undefined && isYours(frame_Last) && isYours(frame_Model) && frame_Last.last + 1 === frame_Model.first
        ? [
          ...frames_Joined.slice(
            0,
            -1
          ),
          joinedOf__Frames({
            frame_Model: frame_Last,
            frame_Other: frame_Model
          })
        ]
        : [
          ...frames_Joined,
          frame_Model
        ]
    },
    []
  )
}

interface _Api___joinedOf__Frames_ {
  frame_Model: _Frame_Model_
  frame_Other: _Frame_Model_
}

function joinedOf__Frames({
  frame_Model,
  frame_Other
}: _Api___joinedOf__Frames_): _Frame_Model_ {
  const ends = [
    ...frame_Model.ends,
    ...frame_Other.ends
  ]
  if (frame_Model.last < frame_Model.first) return {
    first: frame_Other.first,
    last: frame_Other.last,
    ends
  }
  if (frame_Other.last < frame_Other.first) return {
    first: frame_Model.first,
    last: frame_Model.last,
    ends
  }
  return {
    first: Math.min(
      frame_Model.first,
      frame_Other.first
    ),
    last: Math.max(
      frame_Model.last,
      frame_Other.last
    ),
    ends
  }
}

interface _Api___drawnOf__Frame_<State> {
  model_TextEditor: _Model_TextEditor_
  frame_Model: _Frame_Model_
  changes_Placed: Array<_Placed_Change_>
  lines_Document: Array<_Line_Run_>
  rounds_Landed: Array<_Landed_Round_>
  source_Yours: string
  module_Language: _Module_Language_<State>
}

interface _Drawn_Frame_ {
  frame_Model: _Frame_Model_
  sources: Array<string>
  run_Current: _Run_Lines_ | null
  run_Proposed: _Run_Lines_
  ranges_Shown: Array<_Range_Change_>
}

function drawnOf__Frame<State>({
  model_TextEditor,
  frame_Model,
  changes_Placed,
  lines_Document,
  rounds_Landed,
  source_Yours,
  module_Language
}: _Api___drawnOf__Frame_<State>): _Drawn_Frame_ {
  const isPoint = frame_Model.last < frame_Model.first
  const isEnd_Document = frame_Model.last === model_TextEditor.document.lines.length - 1
  const texts_Current = model_TextEditor.document.lines.slice(
    frame_Model.first,
    frame_Model.last + 1
  )
  const ranges_Current = isPoint
    ? []
    : rangesBefore__Frame(frame_Model)
  const run_Current = isPoint
    ? null
    : runOf__Side({
      id: `frame-${frame_Model.first + 1}-current`,
      side: "BEFORE",
      number_First: frame_Model.first + 1,
      isEnd_Document,
      texts: texts_Current,
      ranges_Change: ranges_Current,
      lines_Syntax: lines_Document.slice(
        frame_Model.first,
        frame_Model.last + 1
      ),
      origins_Lines: lines_Document.slice(
        frame_Model.first,
        frame_Model.last + 1
      ).map((line_Run) => line_Run.origins),
      notes_Placed: notesLeaving__Frame({
        model_TextEditor,
        frame_Model,
        texts: texts_Current
      }),
      underlays_Notch: []
    })
  const sources = [
    ...new Set([
      ...frame_Model.ends.map((end_Change) => end_Change.change_Placed.source),
      ...changes_Placed
        .filter((change_Placed) => change_Placed.outer?.kind === "CARRIED" && frame_Model.ends.some((end_Change) => end_Change.kind === "LANDING" && end_Change.change_Placed.source === change_Placed.outer?.source))
        .map((change_Placed) => change_Placed.source)
    ])
  ]
  const proposed = proposedOf__Frame({
    model_TextEditor,
    frame_Model,
    changes_Placed,
    sources: sources.filter((source) => changes_Placed.some((change_Placed) => change_Placed.source === source && change_Placed.isApplied)),
    isPoint,
    isEnd_Document,
    texts_Current,
    run_Current,
    module_Language
  })
  const pairs = pairsIn__Frame({
    model_TextEditor,
    frame_Model,
    sources,
    rounds_Landed
  })
  return {
    frame_Model,
    sources,
    run_Current: run_Current === null
      ? null
      : eachOf__Yours({
        run_Lines: pairedOf__Run({
          run_Lines: run_Current,
          pairs,
          frame_Model,
          module_Language
        }),
        source_Yours
      }),
    run_Proposed: eachOf__Yours({
      run_Lines: filedOf__Run({
        run_Lines: proposed.run_Proposed,
        pairs
      }),
      source_Yours
    }),
    ranges_Shown: [
      ...ranges_Current,
      ...proposed.ranges_Change
    ]
  }
}

function rangesBefore__Frame(
  frame_Model: _Frame_Model_
): Array<_Range_Change_> {
  return frame_Model.ends
    .filter((end_Change) => end_Change.kind === "SPAN")
    .flatMap((end_Change) => end_Change.change_Placed.runs
      .filter((run_Placed) => run_Placed.kind !== "INSERTED")
      .map((run_Placed) => ({
        range: {
          from: inFrame__Position({
            position: run_Placed.range_Before.from,
            line_First: frame_Model.first
          }),
          to: inFrame__Position({
            position: run_Placed.range_Before.to,
            line_First: frame_Model.first
          })
        },
        kind: run_Placed.kind,
        word: run_Placed.word,
        source: end_Change.change_Placed.source,
        outer: end_Change.change_Placed.outer,
        place: run_Placed.place,
        isStale: end_Change.change_Placed.isStale
      })))
}

interface _Api___inFrame__Position_ {
  position: _Position_Text_
  line_First: number
}

function inFrame__Position({
  position,
  line_First
}: _Api___inFrame__Position_): _Position_Text_ {
  return position.line < line_First
    ? {
      line: 0,
      offset: 0
    }
    : {
      line: position.line - line_First,
      offset: position.offset
    }
}

interface _Range_Change_ {
  range: _Range_Text_
  kind: _Kind_Change_
  word: string
  source: string
  outer: _Outer_Change_ | null
  place: number
  isStale: boolean
}

interface _Api___notesLeaving__Frame_ {
  model_TextEditor: _Model_TextEditor_
  frame_Model: _Frame_Model_
  texts: Array<string>
}

interface _Placed_Note_ {
  line: number
  note: _Note_Line_
}

function notesLeaving__Frame({
  model_TextEditor,
  frame_Model,
  texts
}: _Api___notesLeaving__Frame_): Array<_Placed_Note_> {
  return frame_Model.ends.flatMap((end_Change): Array<_Placed_Note_> => {
    const change = end_Change.change_Placed.change
    if (end_Change.kind !== "SPAN" || change.kind !== "MOVE" || !isWhole__Move({
      model_TextEditor,
      change
    })) return []
    const lines = linesOf__Span({
      model_TextEditor,
      change
    })
    const line = Array.from(
      {
        length: lines.last - lines.first + 1
      },
      (
        _,
        index
      ) => lines.first + index - frame_Model.first
    ).find((line_Each) => (texts[line_Each] ?? "").trim() !== "") ?? lines.first - frame_Model.first
    return [
      {
        line,
        note: {
          label: "moved",
          target: {
            source: end_Change.change_Placed.source,
            side: "after"
          }
        }
      }
    ]
  })
}

interface _Api___isWhole__Move_ {
  model_TextEditor: _Model_TextEditor_
  change: _MOVE_Change_
}

function isWhole__Move({
  model_TextEditor,
  change
}: _Api___isWhole__Move_): boolean {
  const from = change.range.from
  const to = change.range.to
  const countAt = (line: number): number => countOf__CodePoints(model_TextEditor.document.lines[line] ?? "")
  return from.line !== to.line && (from.offset === 0 || from.offset === countAt(from.line)) && (to.offset === 0 || to.offset === countAt(to.line)) && (change.at.offset === 0 || change.at.offset === countAt(change.at.line))
}

interface _Api___runOf__Side_ {
  id: string
  side: _Side_Run_
  number_First: number
  isEnd_Document: boolean
  texts: Array<string>
  ranges_Change: Array<_Range_Change_>
  lines_Syntax: Array<_Line_Run_>
  origins_Lines: Array<Array<_Origin_Line_>>
  notes_Placed: Array<_Placed_Note_>
  underlays_Notch: Array<_Underlay_Text_>
}

type _Side_Run_ = "BEFORE" | "AFTER"

function runOf__Side({
  id,
  side,
  number_First,
  isEnd_Document,
  texts,
  ranges_Change,
  lines_Syntax,
  origins_Lines,
  notes_Placed,
  underlays_Notch
}: _Api___runOf__Side_): _Run_Lines_ {
  return {
    id,
    lines: texts.map((
      text,
      index
    ) => {
      const spans_Line = spansOn__Line({
        ranges_Change,
        line: index,
        text
      })
      const marker = markerOf__Line({
        side,
        texts,
        line: index,
        isEnd_Document,
        spans_Line,
        ranges_Change
      })
      return {
        layer: "DOCUMENT",
        gutter: {
          label: SIDEMAP__SIDE_RUN[side].labelOf({
            marker,
            number: number_First + index
          }),
          marker,
          pointed: "none"
        },
        note: notes_Placed.find((note_Placed) => note_Placed.line === index)?.note ?? null,
        segments: segmentsOf__Stretches({
          text: parseTexts_Line(text)[0],
          stretches: [
            ...spans_Line.map((span_Line) => ({
              from: unitsOf__CodePoints({
                text,
                count: span_Line.from
              }),
              to: unitsOf__CodePoints({
                text,
                count: span_Line.to
              }),
              attributes: attributesOf__Segment({
                side,
                range_Change: span_Line.range_Change
              })
            })),
            ...stretchesOf__Segments(lines_Syntax[index]?.segments ?? [])
          ]
        }),
        origins: origins_Lines[index] ?? []
      }
    }),
    groups: groupsWith__Notches({
      groups: groupsOf__Underlays(ranges_Change
        .filter((range_Change) => texts.some((
          text,
          index
        ) => spansOn__Line({
          ranges_Change: [
            range_Change
          ],
          line: index,
          text
        }).length > 0))
        .map((range_Change) => trimmed__Underlay({
          texts,
          underlay: {
            kind: "STRETCH",
            from: positionIn__Run({
              texts,
              position: range_Change.range.from
            }),
            to: positionIn__Run({
              texts,
              position: range_Change.range.to
            }),
            attributes: {
              "data-change": range_Change.word,
              "data-side": SIDEMAP__SIDE_RUN[side].attribute,
              "data-source": range_Change.source,
              ...(range_Change.outer === null
                ? {}
                : OUTERMAP__KIND_OUTER[range_Change.outer.kind].attributesOf__Underlay(range_Change.outer.source)),
              ...(range_Change.isStale
                ? {
                  "data-stale": ""
                }
                : {}),
              "data-place": String(range_Change.place)
            }
          }
        }))),
      underlays_Notch
    })
  }
}

interface _Api___spansOn__Line_ {
  ranges_Change: Array<_Range_Change_>
  line: number
  text: string
}

interface _Span_Line_ {
  from: number
  to: number
  range_Change: _Range_Change_
}

function spansOn__Line({
  ranges_Change,
  line,
  text
}: _Api___spansOn__Line_): Array<_Span_Line_> {
  return ranges_Change.flatMap((range_Change) => {
    const from = range_Change.range.from.line < line ? 0 : range_Change.range.from.offset
    const to = range_Change.range.to.line > line
      ? countOf__CodePoints(text)
      : Math.min(
        range_Change.range.to.offset,
        countOf__CodePoints(text)
      )
    return range_Change.range.from.line <= line && line <= range_Change.range.to.line && from < to
      ? [
        {
          from,
          to,
          range_Change
        }
      ]
      : []
  })
}

interface _Api___markerOf__Line_ {
  side: _Side_Run_
  texts: Array<string>
  line: number
  isEnd_Document: boolean
  spans_Line: Array<_Span_Line_>
  ranges_Change: Array<_Range_Change_>
}

function markerOf__Line({
  side,
  texts,
  line,
  isEnd_Document,
  spans_Line,
  ranges_Change
}: _Api___markerOf__Line_): _Marker_Gutter_ {
  const count = countOf__CodePoints(texts[line] ?? "")
  const kinds_Whole: Array<_Kind_Change_> = [
    "MOVED",
    SIDEMAP__SIDE_RUN[side].kind_Whole
  ]
  for (const kind_Whole of kinds_Whole) {
    const isWhole = count === 0
      ? ranges_Change.some((range_Change) => range_Change.kind === kind_Whole && range_Change.outer === null && isOver__Break({
        range: range_Change.range,
        texts,
        line,
        isEnd_Document
      }))
      : spans_Line
        .filter((span_Line) => span_Line.range_Change.kind === kind_Whole && span_Line.range_Change.outer === null)
        .toSorted((
          span_One,
          span_Other
        ) => span_One.from - span_Other.from)
        .reduce(
          (
            covered,
            span_Line
          ) => span_Line.from <= covered
            ? Math.max(
              covered,
              span_Line.to
            )
            : covered,
          0
        ) >= count
    if (isWhole) return MARKERMAP__KIND_CHANGE[kind_Whole]
  }
  return count > 0 && spans_Line.length > 0 ? "changed" : "none"
}

interface _Api___isOver__Break_ {
  range: _Range_Text_
  texts: Array<string>
  line: number
  isEnd_Document: boolean
}

function isOver__Break({
  range,
  texts,
  line,
  isEnd_Document
}: _Api___isOver__Break_): boolean {
  const isLast = line === texts.length - 1 && isEnd_Document
  if (isLast && line === 0) return false
  const from = isLast
    ? {
      line: line - 1,
      offset: countOf__CodePoints(texts[line - 1] ?? "")
    }
    : {
      line,
      offset: 0
    }
  const to = isLast
    ? {
      line,
      offset: 0
    }
    : {
      line: line + 1,
      offset: 0
    }
  return orderOf__Positions({
    position: range.from,
    position_Other: from
  }) <= 0 && orderOf__Positions({
    position: range.to,
    position_Other: to
  }) >= 0
}

type _MarkerMap__Kind_Change_ = {
  [Kind in _Kind_Change_]: _Marker_Gutter_
}

const MARKERMAP__KIND_CHANGE: _MarkerMap__Kind_Change_ = {
  REMOVED: "removed",
  INSERTED: "inserted",
  REPLACED: "changed",
  MOVED: "moved"
}

interface _Api___labelOf__Side_ {
  marker: _Marker_Gutter_
  number: number
}

interface _Look_Side_ {
  attribute: string
  kind_Whole: _Kind_Change_
  labelOf: (api_Label: _Api___labelOf__Side_) => string
}

type _SideMap__Side_Run_ = {
  [Side in _Side_Run_]: _Look_Side_
}

const SIDEMAP__SIDE_RUN: _SideMap__Side_Run_ = {
  BEFORE: {
    attribute: "before",
    kind_Whole: "REMOVED",
    labelOf: ({
      number
    }) => String(number)
  },
  AFTER: {
    attribute: "after",
    kind_Whole: "INSERTED",
    labelOf: ({
      marker
    }) => SIGNMAP__MARKER_GUTTER[marker]
  }
}

type _SignMap__Marker_Gutter_ = {
  [Marker in _Marker_Gutter_]: string
}

const SIGNMAP__MARKER_GUTTER: _SignMap__Marker_Gutter_ = {
  none: "",
  removed: "",
  changed: "~",
  inserted: "+",
  moved: "→"
}

interface _Api___unitsOf__CodePoints_ {
  text: string
  count: number
}

function unitsOf__CodePoints({
  text,
  count
}: _Api___unitsOf__CodePoints_): number {
  return Array.from(text).slice(
    0,
    count
  ).join("").length
}

interface _Api___attributesOf__Segment_ {
  side: _Side_Run_
  range_Change: _Range_Change_
}

function attributesOf__Segment({
  side,
  range_Change
}: _Api___attributesOf__Segment_): _Attributes_Element_ {
  return range_Change.outer === null
    ? {
      "data-change": range_Change.word,
      "data-side": SIDEMAP__SIDE_RUN[side].attribute,
      "data-source": range_Change.source
    }
    : OUTERMAP__KIND_OUTER[range_Change.outer.kind].attributesOf__Segment(range_Change)
}

interface _Look_Outer_ {
  attributesOf__Segment: (range_Change: _Range_Change_) => _Attributes_Element_
  attributesOf__Underlay: (source_Outer: string) => _Attributes_Element_
}

type _OuterMap__Kind_Outer_ = {
  [Kind in _Kind_Outer_]: _Look_Outer_
}

const OUTERMAP__KIND_OUTER: _OuterMap__Kind_Outer_ = {
  WITHIN: {
    attributesOf__Segment: (range_Change) => ({
      "data-nested-change": range_Change.word,
      "data-nested-source": range_Change.source
    }),
    attributesOf__Underlay: (source_Outer) => ({
      "data-within": source_Outer
    })
  },
  CARRIED: {
    attributesOf__Segment: (range_Change) => ({
      "data-edit-change": range_Change.word,
      "data-edit-source": range_Change.source
    }),
    attributesOf__Underlay: (source_Outer) => ({
      "data-carried": source_Outer
    })
  }
}

interface _Api___groupsWith__Notches_ {
  groups: Array<_Group_Underlay_>
  underlays_Notch: Array<_Underlay_Text_>
}

function groupsWith__Notches({
  groups,
  underlays_Notch
}: _Api___groupsWith__Notches_): Array<_Group_Underlay_> {
  return underlays_Notch.reduce(
    (
      groups_Run,
      underlay_Notch
    ) => {
      const source = underlay_Notch.attributes["data-source"] ?? ""
      return groups_Run.some((group) => group.attributes["data-source"] === source)
        ? groups_Run.map((group) => group.attributes["data-source"] === source
          ? {
            attributes: group.attributes,
            underlays: [
              ...group.underlays,
              underlay_Notch
            ]
          }
          : group)
        : [
          ...groups_Run,
          {
            attributes: {
              "data-source": source
            },
            underlays: [
              underlay_Notch
            ]
          }
        ]
    },
    groups
  )
}

function groupsOf__Underlays(
  underlays: Array<_STRETCH_Underlay_Text_>
): Array<_Group_Underlay_> {
  return [
    ...Map.groupBy(
      underlays.toSorted((
        underlay_One,
        underlay_Other
      ) => underlay_One.from.line - underlay_Other.from.line || underlay_One.from.offset - underlay_Other.from.offset),
      (underlay) => underlay.attributes["data-source"] ?? ""
    )
  ].map(([
    source,
    underlays_Source
  ]) => ({
    attributes: {
      "data-source": source
    },
    underlays: underlays_Source
  }))
}

interface _Api___trimmed__Underlay_ {
  texts: Array<string>
  underlay: _STRETCH_Underlay_Text_
}

function trimmed__Underlay({
  texts,
  underlay
}: _Api___trimmed__Underlay_): _STRETCH_Underlay_Text_ {
  const isBefore = (
    position_One: _Position_Run_,
    position_Other: _Position_Run_
  ): boolean => position_One.line < position_Other.line || (position_One.line === position_Other.line && position_One.offset < position_Other.offset)
  let from = underlay.from
  let to = underlay.to
  while (isBefore(
    from,
    to
  )) {
    const text = texts[from.line] ?? ""
    if (from.offset >= text.length) from = {
      line: from.line + 1,
      offset: 0
    }
    else if (REGEXP_SPACE.test(text[from.offset] ?? "")) from = {
      line: from.line,
      offset: from.offset + 1
    }
    else break
  }
  while (isBefore(
    from,
    to
  )) {
    if (to.offset === 0) to = {
      line: to.line - 1,
      offset: (texts[to.line - 1] ?? "").length
    }
    else if (REGEXP_SPACE.test((texts[to.line] ?? "")[to.offset - 1] ?? "")) to = {
      line: to.line,
      offset: to.offset - 1
    }
    else break
  }
  return isBefore(
    from,
    to
  )
    ? {
      kind: "STRETCH",
      from,
      to,
      attributes: underlay.attributes
    }
    : underlay
}

const REGEXP_SPACE = /\s/

interface _Api___positionIn__Run_ {
  texts: Array<string>
  position: _Position_Text_
}

function positionIn__Run({
  texts,
  position
}: _Api___positionIn__Run_): _Position_Run_ {
  const text = texts[position.line]
  return text === undefined
    ? {
      line: position.line,
      offset: 0
    }
    : {
      line: position.line,
      offset: unitsOf__CodePoints({
        text,
        count: position.offset
      })
    }
}

interface _Api___proposedOf__Frame_<State> {
  model_TextEditor: _Model_TextEditor_
  frame_Model: _Frame_Model_
  changes_Placed: Array<_Placed_Change_>
  sources: Array<string>
  isPoint: boolean
  isEnd_Document: boolean
  texts_Current: Array<string>
  run_Current: _Run_Lines_ | null
  module_Language: _Module_Language_<State>
}

interface _Proposed_Frame_ {
  run_Proposed: _Run_Lines_
  ranges_Change: Array<_Range_Change_>
}

function proposedOf__Frame<State>({
  model_TextEditor,
  frame_Model,
  changes_Placed,
  sources,
  isPoint,
  isEnd_Document,
  texts_Current,
  run_Current,
  module_Language
}: _Api___proposedOf__Frame_<State>): _Proposed_Frame_ {
  const positions_End = frame_Model.ends.flatMap((end_Change) => {
    const change = end_Change.change_Placed.change
    return end_Change.kind === "LANDING" && change.kind === "MOVE"
      ? [
        change.at
      ]
      : [
        change.range.from,
        change.range.to
      ]
  })
  const from = [
    ...(isPoint
      ? []
      : [
        {
          line: frame_Model.first,
          offset: 0
        }
      ]),
    ...positions_End
  ].reduce((
    position_Least,
    position
  ) => orderOf__Positions({
    position,
    position_Other: position_Least
  }) < 0 ? position : position_Least)
  const to = [
    ...(isPoint
      ? []
      : [
        isEnd_Document
          ? {
            line: frame_Model.last,
            offset: countOf__CodePoints(texts_Current.at(-1) ?? "")
          }
          : {
            line: frame_Model.last + 1,
            offset: 0
          }
      ]),
    ...positions_End
  ].reduce((
    position_Most,
    position
  ) => orderOf__Positions({
    position,
    position_Other: position_Most
  }) > 0 ? position : position_Most)
  const pieces_Placed = placedOf__Pieces(piecesWith__Sources({
    model_TextEditor,
    sources,
    range: {
      from,
      to
    }
  }))
  const text = pieces_Placed.map((piece_Placed) => piece_Placed.piece_Applied.text).join("")
  const isBreak_Leading = text.startsWith("\n") && (isPoint
    ? !(from.offset === 0 && text.endsWith("\n"))
    : from.line < frame_Model.first)
  const text_Inner = isBreak_Leading ? text.slice(1) : text
  const isBreak_Trailing = text_Inner.endsWith("\n") && (isPoint ? from.offset === 0 : !isEnd_Document)
  const text_Shown = isBreak_Trailing
    ? text_Inner.slice(
      0,
      -1
    )
    : text_Inner
  const isNone = !isPoint && (isEnd_Document
    ? from.line < frame_Model.first && text === ""
    : text_Inner === "")
  const texts = isNone
    ? []
    : parseTexts_Line(text_Shown)
  const marks_Proposed = pieces_Placed
    .flatMap((piece_Placed) => piece_Placed.piece_Applied.marks.map((mark) => ({
      range: {
        from: movedTo__Position({
          position: mark.range.from,
          from: piece_Placed.piece_Applied.range.from,
          to: piece_Placed.position
        }),
        to: movedTo__Position({
          position: mark.range.to,
          from: piece_Placed.piece_Applied.range.from,
          to: piece_Placed.position
        })
      },
      data: mark.data
    })))
    .map((mark) => isBreak_Leading
      ? {
        range: {
          from: shiftedUp__Position(mark.range.from),
          to: shiftedUp__Position(mark.range.to)
        },
        data: mark.data
      }
      : mark)
  const ranges_Change = rangesAfter__Pieces({
    pieces_Placed,
    changes_Placed
  }).map((range_Change) => isBreak_Leading
    ? {
      ...range_Change,
      range: {
        from: shiftedUp__Position(range_Change.range.from),
        to: shiftedUp__Position(range_Change.range.to)
      }
    }
    : range_Change)
  const lines_Before = model_TextEditor.document.lines.slice(
    0,
    frame_Model.first
  )
  return {
    run_Proposed: runOf__Side({
      id: `frame-${(isPoint ? lineOf__Point(frame_Model) : frame_Model.first) + 1}-proposed`,
      side: "AFTER",
      number_First: frame_Model.first + 1,
      isEnd_Document,
      texts,
      ranges_Change,
      lines_Syntax: markedOf__Lines({
        lines: parseLines_ViewModel({
          multilineText: [
            ...lines_Before,
            ...texts
          ].join("\n"),
          module_Language
        }).slice(lines_Before.length),
        texts,
        marks: marks_Proposed
      }),
      origins_Lines: originsOf__Pieces({
        pieces_Placed,
        isBreak_Leading,
        texts
      }),
      notes_Placed: notesLanding__Frame({
        model_TextEditor,
        frame_Model,
        ranges_Change,
        texts
      }),
      underlays_Notch: texts.length === 0 || run_Current === null
        ? []
        : notchesOf__Removals({
          pieces_Placed,
          changes_Placed,
          isBreak_Leading,
          texts_Current,
          texts,
          line_First: frame_Model.first,
          run_Current
        })
    }),
    ranges_Change
  }
}

interface _Placed_Piece_ {
  piece_Applied: _Piece_Applied_
  position: _Position_Text_
}

interface _Api___originsOf__Pieces_ {
  pieces_Placed: Array<_Placed_Piece_>
  isBreak_Leading: boolean
  texts: Array<string>
}

function originsOf__Pieces({
  pieces_Placed,
  isBreak_Leading,
  texts
}: _Api___originsOf__Pieces_): Array<Array<_Origin_Line_>> {
  const origins_Lines = texts.map((): Array<_Origin_Line_> => [])
  for (const piece_Placed of pieces_Placed) {
    const piece_Applied = piece_Placed.piece_Applied
    const id_Text: _Id_Text_ = piece_Applied.kind === "CHANGE"
      ? {
        kind: "CHANGE",
        source: piece_Applied.source,
        index: piece_Applied.index
      }
      : {
        kind: "DOCUMENT"
      }
    piece_Applied.text.split("\n").forEach((
      text_Piece,
      index
    ) => {
      const line = piece_Placed.position.line + index - (isBreak_Leading ? 1 : 0)
      const text = texts[line]
      if (text === undefined) return
      const from = unitsOf__CodePoints({
        text,
        count: index === 0 ? piece_Placed.position.offset : 0
      })
      origins_Lines[line]?.push({
        from,
        to: from + text_Piece.length,
        id_Text,
        position: index === 0
          ? piece_Applied.range.from
          : {
            line: piece_Applied.range.from.line + index,
            offset: 0
          }
      })
    })
  }
  return origins_Lines
}

function placedOf__Pieces(
  pieces: Array<_Piece_Applied_>
): Array<_Placed_Piece_> {
  const pieces_Placed: Array<_Placed_Piece_> = []
  let position: _Position_Text_ = {
    line: 0,
    offset: 0
  }
  for (const piece_Applied of pieces) {
    pieces_Placed.push({
      piece_Applied,
      position
    })
    position = endAfter__Text({
      position,
      text: piece_Applied.text
    })
  }
  return pieces_Placed
}

interface _Api___endAfter__Text_ {
  position: _Position_Text_
  text: string
}

function endAfter__Text({
  position,
  text
}: _Api___endAfter__Text_): _Position_Text_ {
  const lines = text.split("\n")
  return lines.length === 1
    ? {
      line: position.line,
      offset: position.offset + countOf__CodePoints(text)
    }
    : {
      line: position.line + lines.length - 1,
      offset: countOf__CodePoints(lines.at(-1) ?? "")
    }
}

interface _Api___rangesAfter__Pieces_ {
  pieces_Placed: Array<_Placed_Piece_>
  changes_Placed: Array<_Placed_Change_>
}

function rangesAfter__Pieces({
  pieces_Placed,
  changes_Placed
}: _Api___rangesAfter__Pieces_): Array<_Range_Change_> {
  return [
    ...rangesMoved__Pieces({
      pieces_Placed,
      changes_Placed
    }),
    ...pieces_Placed.flatMap((piece_Placed) => {
      const piece_Applied = piece_Placed.piece_Applied
      if (piece_Applied.kind !== "CHANGE") return []
      const change_Placed = changes_Placed.find((change_Each) => change_Each.source === piece_Applied.source && change_Each.index === piece_Applied.index)
      return (change_Placed?.runs ?? []).flatMap((run_Placed) => {
        const range = run_Placed.range_After === null
          ? null
          : intersectionOf__Ranges({
            range: run_Placed.range_After,
            range_Other: piece_Applied.range
          })
        return range === null
          ? []
          : [
            {
              range: {
                from: movedTo__Position({
                  position: range.from,
                  from: piece_Applied.range.from,
                  to: piece_Placed.position
                }),
                to: movedTo__Position({
                  position: range.to,
                  from: piece_Applied.range.from,
                  to: piece_Placed.position
                })
              },
              kind: run_Placed.kind,
              word: run_Placed.word,
              source: piece_Applied.source,
              outer: change_Placed?.outer ?? null,
              place: run_Placed.place,
              isStale: change_Placed?.isStale ?? false
            }
          ]
      })
    })
  ]
}

interface _Api___rangesMoved__Pieces_ {
  pieces_Placed: Array<_Placed_Piece_>
  changes_Placed: Array<_Placed_Change_>
}

function rangesMoved__Pieces({
  pieces_Placed,
  changes_Placed
}: _Api___rangesMoved__Pieces_): Array<_Range_Change_> {
  const isOfMove = (
    piece_Placed: _Placed_Piece_ | undefined,
    move: _Move_Piece_
  ): boolean => piece_Placed?.piece_Applied.move?.source === move.source && piece_Placed?.piece_Applied.move?.index === move.index
  return pieces_Placed.flatMap((
    piece_Placed,
    index
  ): Array<_Range_Change_> => {
    const move = piece_Placed.piece_Applied.move
    if (move === null || isOfMove(
      pieces_Placed[index - 1],
      move
    )) return []
    let index_Last = index
    while (isOfMove(
      pieces_Placed[index_Last + 1],
      move
    )) index_Last = index_Last + 1
    const piece_Last = pieces_Placed[index_Last]
    const change_Move = changes_Placed.find((change_Each) => change_Each.source === move.source && change_Each.index === move.index)
    const run_Move = change_Move?.runs[0]
    return piece_Last === undefined || run_Move === undefined
      ? []
      : [
        {
          range: {
            from: piece_Placed.position,
            to: endAfter__Text({
              position: piece_Last.position,
              text: piece_Last.piece_Applied.text
            })
          },
          kind: "MOVED",
          word: run_Move.word,
          source: move.source,
          outer: null,
          place: run_Move.place,
          isStale: change_Move?.isStale ?? false
        }
      ]
  })
}

interface _Api___intersectionOf__Ranges_ {
  range: _Range_Text_
  range_Other: _Range_Text_
}

function intersectionOf__Ranges({
  range,
  range_Other
}: _Api___intersectionOf__Ranges_): _Range_Text_ | null {
  const from = orderOf__Positions({
    position: range.from,
    position_Other: range_Other.from
  }) >= 0 ? range.from : range_Other.from
  const to = orderOf__Positions({
    position: range.to,
    position_Other: range_Other.to
  }) <= 0 ? range.to : range_Other.to
  return orderOf__Positions({
    position: from,
    position_Other: to
  }) < 0
    ? {
      from,
      to
    }
    : null
}

interface _Api___movedTo__Position_ {
  position: _Position_Text_
  from: _Position_Text_
  to: _Position_Text_
}

function movedTo__Position({
  position,
  from,
  to
}: _Api___movedTo__Position_): _Position_Text_ {
  return position.line === from.line
    ? {
      line: to.line,
      offset: to.offset + position.offset - from.offset
    }
    : {
      line: to.line + position.line - from.line,
      offset: position.offset
    }
}

function shiftedUp__Position(
  position: _Position_Text_
): _Position_Text_ {
  return position.line === 0
    ? {
      line: 0,
      offset: 0
    }
    : {
      line: position.line - 1,
      offset: position.offset
    }
}

interface _Api___notesLanding__Frame_ {
  model_TextEditor: _Model_TextEditor_
  frame_Model: _Frame_Model_
  ranges_Change: Array<_Range_Change_>
  texts: Array<string>
}

function notesLanding__Frame({
  model_TextEditor,
  frame_Model,
  ranges_Change,
  texts
}: _Api___notesLanding__Frame_): Array<_Placed_Note_> {
  return frame_Model.ends.flatMap((end_Change): Array<_Placed_Note_> => {
    const change = end_Change.change_Placed.change
    if (end_Change.kind !== "LANDING" || change.kind !== "MOVE" || !isWhole__Move({
      model_TextEditor,
      change
    })) return []
    const place = end_Change.change_Placed.runs[0]?.place
    const ranges_Moved = ranges_Change.filter((range_Change) => range_Change.kind === "MOVED" && range_Change.source === end_Change.change_Placed.source && range_Change.place === place)
    const line = texts.findIndex((
      text,
      index
    ) => text.trim() !== "" && spansOn__Line({
      ranges_Change: ranges_Moved,
      line: index,
      text
    }).length > 0)
    const lines = linesOf__Span({
      model_TextEditor,
      change
    })
    return line === -1
      ? []
      : [
        {
          line,
          note: {
            label: `from ${labelOf__Lines({
              first: lines.first + 1,
              last: lines.last + 1
            })}`,
            target: {
              source: end_Change.change_Placed.source,
              side: "before"
            }
          }
        }
      ]
  })
}

function labelOf__Lines(
  range_Lines: _Range_Lines_
): string {
  return range_Lines.first === range_Lines.last ? `line ${range_Lines.first}` : `lines ${range_Lines.first}–${range_Lines.last}`
}

interface _Api___notchesOf__Removals_ {
  pieces_Placed: Array<_Placed_Piece_>
  changes_Placed: Array<_Placed_Change_>
  isBreak_Leading: boolean
  texts_Current: Array<string>
  texts: Array<string>
  line_First: number
  run_Current: _Run_Lines_
}

function notchesOf__Removals({
  pieces_Placed,
  changes_Placed,
  isBreak_Leading,
  texts_Current,
  texts,
  line_First,
  run_Current
}: _Api___notchesOf__Removals_): Array<_Underlay_Text_> {
  return run_Current.groups
    .flatMap((group) => group.underlays)
    .flatMap((underlay_Removal): Array<_Underlay_Text_> => {
      if (underlay_Removal.kind !== "STRETCH" || underlay_Removal.attributes["data-change"] !== "removed" || "data-within" in underlay_Removal.attributes || "data-carried" in underlay_Removal.attributes) return []
      const source = underlay_Removal.attributes["data-source"] ?? ""
      const place = Number(underlay_Removal.attributes["data-place"])
      const change_Placed = changes_Placed.find((change_Each) => change_Each.source === source && change_Each.runs.some((run_Each) => run_Each.place === place))
      const run_Placed = change_Placed?.runs.find((run_Each) => run_Each.place === place)
      const at_Change = run_Placed?.range_After?.from
      const piece_Placed = at_Change === undefined
        ? undefined
        : pieces_Placed.find((piece_Each) => piece_Each.piece_Applied.kind === "CHANGE" && piece_Each.piece_Applied.source === source && piece_Each.piece_Applied.index === change_Placed?.index && orderOf__Positions({
          position: piece_Each.piece_Applied.range.from,
          position_Other: at_Change
        }) <= 0 && orderOf__Positions({
          position: at_Change,
          position_Other: piece_Each.piece_Applied.range.to
        }) <= 0)
      if (run_Placed === undefined || at_Change === undefined || piece_Placed === undefined) return []
      const at_Moved = movedTo__Position({
        position: at_Change,
        from: piece_Placed.piece_Applied.range.from,
        to: piece_Placed.position
      })
      const at = isBreak_Leading ? shiftedUp__Position(at_Moved) : at_Moved
      const attributes = {
        "data-change": "removed",
        "data-side": "after",
        "data-source": source,
        "data-place": String(place)
      }
      const from = run_Placed.range_Before.from
      const isBreak_First = from.offset === countOf__CodePoints(texts_Current[from.line - line_First] ?? "") && run_Placed.range_Before.to.line > from.line
      return isWhole__Lines({
        texts: texts_Current,
        underlay: underlay_Removal
      })
        ? [
          {
            kind: "BOUNDARY",
            line: isBreak_First ? at.line + 1 : at.line,
            attributes
          }
        ]
        : [
          {
            kind: "POINT",
            at: positionIn__Run({
              texts,
              position: at
            }),
            attributes
          }
        ]
    })
}

interface _Api___isWhole__Lines_ {
  texts: Array<string>
  underlay: _STRETCH_Underlay_Text_
}

function isWhole__Lines({
  texts,
  underlay
}: _Api___isWhole__Lines_): boolean {
  return (texts[underlay.from.line] ?? "").slice(
    0,
    underlay.from.offset
  ).trim() === "" && (texts[underlay.to.line] ?? "").slice(underlay.to.offset).trim() === ""
}

interface _Api___pairsIn__Frame_ {
  model_TextEditor: _Model_TextEditor_
  frame_Model: _Frame_Model_
  sources: Array<string>
  rounds_Landed: Array<_Landed_Round_>
}

interface _Pair_Frame_ {
  source: string
  stale_Change: _Stale_Change_
  change: _Change_
  pair: _Pair_Stale_
  lines_Written: _Lines_Pair_
  lines_Now: _Lines_Pair_
}

interface _Lines_Pair_ {
  first: number
  last: number
}

function pairsIn__Frame({
  model_TextEditor,
  frame_Model,
  sources,
  rounds_Landed
}: _Api___pairsIn__Frame_): Array<_Pair_Frame_> {
  return rounds_Landed
    .filter((round_Landed) => sources.includes(round_Landed.source))
    .flatMap((round_Landed) => round_Landed.changes_Stale.flatMap((stale_Change): Array<_Pair_Frame_> => {
      const change = model_TextEditor.proposed.find((changes_Source) => changes_Source.source === round_Landed.source)?.changes[stale_Change.index]
      if (change === undefined) return []
      const pair = pairOf__Stale({
        text_Model: model_TextEditor.document,
        change,
        over: stale_Change.over
      })
      const runs_Changed = pair.runs.filter((run) => run.kind === "CHANGED")
      if (runs_Changed.length === 0) return []
      const lines_Now = linesOf__Ranges([
        ...runs_Changed.map((run) => run.range_After),
        {
          from: {
            line: change.range.from.line - pair.line_First,
            offset: change.range.from.offset
          },
          to: {
            line: change.range.to.line - pair.line_First,
            offset: change.range.to.offset
          }
        }
      ])
      return pair.line_First + lines_Now.first < frame_Model.first || pair.line_First + lines_Now.last > frame_Model.last
        ? []
        : [
          {
            source: round_Landed.source,
            stale_Change,
            change,
            pair,
            lines_Written: linesOf__Ranges([
              ...runs_Changed.map((run) => run.range_Before),
              stale_Change.over.written.change.range
            ]),
            lines_Now
          }
        ]
    }))
    .reduce(
      (
        pairs_Kept: Array<_Pair_Frame_>,
        pair_Frame
      ) => pairs_Kept.some((pair_Kept) => pair_Kept.pair.line_First + pair_Kept.lines_Now.first <= pair_Frame.pair.line_First + pair_Frame.lines_Now.last && pair_Frame.pair.line_First + pair_Frame.lines_Now.first <= pair_Kept.pair.line_First + pair_Kept.lines_Now.last)
        ? pairs_Kept
        : [
          ...pairs_Kept,
          pair_Frame
        ],
      []
    )
}

function linesOf__Ranges(
  ranges: Array<_Range_Text_>
): _Lines_Pair_ {
  return {
    first: Math.min(...ranges.map((range) => range.from.line)),
    last: Math.max(...ranges.map((range) => range.to.offset === 0 && range.to.line > range.from.line ? range.to.line - 1 : range.to.line))
  }
}

interface _Api___pairedOf__Run_<State> {
  run_Lines: _Run_Lines_
  pairs: Array<_Pair_Frame_>
  frame_Model: _Frame_Model_
  module_Language: _Module_Language_<State>
}

function pairedOf__Run<State>({
  run_Lines,
  pairs,
  frame_Model,
  module_Language
}: _Api___pairedOf__Run_<State>): _Run_Lines_ {
  return pairs
    .toSorted((
      pair_One,
      pair_Other
    ) => pair_Other.pair.line_First + pair_Other.lines_Now.first - pair_One.pair.line_First - pair_One.lines_Now.first)
    .reduce(
      (
        run_Paired,
        pair_Frame
      ) => pairedWith__Pair({
        run_Lines: run_Paired,
        pair_Frame,
        row_First: pair_Frame.pair.line_First + pair_Frame.lines_Now.first - frame_Model.first,
        module_Language
      }),
      run_Lines
    )
}

interface _Api___pairedWith__Pair_<State> {
  run_Lines: _Run_Lines_
  pair_Frame: _Pair_Frame_
  row_First: number
  module_Language: _Module_Language_<State>
}

function pairedWith__Pair<State>({
  run_Lines,
  pair_Frame,
  row_First,
  module_Language
}: _Api___pairedWith__Pair_<State>): _Run_Lines_ {
  const row_Last = row_First + pair_Frame.lines_Now.last - pair_Frame.lines_Now.first
  const texts_Written = pair_Frame.stale_Change.over.written.lines.lines.slice(
    pair_Frame.lines_Written.first,
    pair_Frame.lines_Written.last + 1
  )
  const count_Written = texts_Written.length
  const lines_Syntax = parseLines_ViewModel({
    multilineText: texts_Written.join("\n"),
    module_Language
  })
  const lines_Now = run_Lines.lines.slice(
    row_First,
    row_Last + 1
  )
  const note = lines_Now.find((line_Run) => line_Run.note !== null)?.note ?? null
  const attributes_Change = lines_Now.flatMap((line_Run) => line_Run.segments).find((segment_Line) => segment_Line.attributes["data-source"] === pair_Frame.source)?.attributes ?? null
  const range_Written = pair_Frame.stale_Change.over.written.change.range
  const lines = [
    ...run_Lines.lines.slice(
      0,
      row_First
    ),
    ...texts_Written.map((
      text,
      index
    ): _Line_Run_ => ({
      layer: "WRITTEN_ON",
      gutter: {
        label: lines_Now[index]?.gutter.label ?? "",
        marker: lines_Now[index]?.gutter.marker ?? "none",
        pointed: "none"
      },
      note: index === 0 ? note : null,
      segments: segmentsOf__Stretches({
        text,
        stretches: [
          ...stretchesOf__Segments(lines_Syntax[index]?.segments ?? []),
          ...stretchesOf__Written({
            range: range_Written,
            line: pair_Frame.lines_Written.first + index,
            text,
            attributes: attributes_Change
          })
        ]
      }),
      origins: []
    })),
    ...lines_Now.map((
      line_Run,
      index
    ): _Line_Run_ => ({
      layer: "MOVED_SINCE",
      gutter: {
        ...line_Run.gutter,
        label: ""
      },
      note: null,
      segments: unmarkedOf__Segments({
        segments: line_Run.segments,
        range: pair_Frame.change.range,
        line: pair_Frame.pair.line_First + pair_Frame.lines_Now.first + index,
        source: pair_Frame.source
      }),
      origins: line_Run.origins
    })),
    ...run_Lines.lines.slice(row_Last + 1)
  ]
  const texts = lines.map((line_Run) => line_Run.segments.map((segment_Line) => segment_Line.text).join(""))
  const isRing_Stale = (underlay: _Underlay_Text_): boolean => underlay.kind === "STRETCH" && underlay.attributes["data-source"] === pair_Frame.source && "data-stale" in underlay.attributes && underlay.from.line <= row_Last && underlay.to.line >= row_First
  const underlay_Stale = run_Lines.groups.flatMap((group_Underlay) => group_Underlay.underlays.filter(isRing_Stale))[0]
  const underlays_Written: Array<_Underlay_Text_> = underlay_Stale === undefined
    ? []
    : [
      trimmed__Underlay({
        texts,
        underlay: {
          kind: "STRETCH",
          from: rowOf__Position({
            position: range_Written.from,
            line_First: pair_Frame.lines_Written.first,
            row_First,
            texts
          }),
          to: rowOf__Position({
            position: range_Written.to,
            line_First: pair_Frame.lines_Written.first,
            row_First,
            texts
          }),
          attributes: underlay_Stale.attributes
        }
      })
    ]
  const underlays_Since = pair_Frame.pair.runs
    .filter((run) => run.kind === "CHANGED")
    .map((run): _Underlay_Text_ => {
      const from = rowOf__Position({
        position: run.range_After.from,
        line_First: pair_Frame.lines_Now.first,
        row_First: row_First + count_Written,
        texts
      })
      return isEmpty__Range(run.range_After)
        ? {
          kind: "POINT",
          at: from,
          attributes: {
            "data-change": "removed",
            "data-since": ""
          }
        }
        : trimmed__Underlay({
          texts,
          underlay: {
            kind: "STRETCH",
            from,
            to: rowOf__Position({
              position: run.range_After.to,
              line_First: pair_Frame.lines_Now.first,
              row_First: row_First + count_Written,
              texts
            }),
            attributes: {
              "data-change": isEmpty__Range(run.range_Before) ? "inserted" : "replaced",
              "data-since": ""
            }
          }
        })
    })
  return {
    id: run_Lines.id,
    lines,
    groups: [
      ...run_Lines.groups.map((group_Underlay) => ({
        attributes: group_Underlay.attributes,
        underlays: [
          ...group_Underlay.underlays
            .filter((underlay) => !isRing_Stale(underlay))
            .map((underlay) => shiftedOf__Underlay({
              underlay,
              row_First,
              count: count_Written
            })),
          ...group_Underlay.attributes["data-source"] === pair_Frame.source ? underlays_Written : []
        ]
      })),
      ...underlays_Since.length === 0
        ? []
        : [
          {
            attributes: {
              "data-since": ""
            },
            underlays: underlays_Since
          }
        ]
    ]
  }
}

interface _Api___stretchesOf__Written_ {
  range: _Range_Text_
  line: number
  text: _Text_Line_NonTerminated_
  attributes: _Attributes_Element_ | null
}

function stretchesOf__Written({
  range,
  line,
  text,
  attributes
}: _Api___stretchesOf__Written_): Array<_Stretch_Line_> {
  if (attributes === null || line < range.from.line || line > range.to.line) return []
  const from = unitsOf__CodePoints({
    text,
    count: line === range.from.line ? range.from.offset : 0
  })
  const to = line === range.to.line
    ? unitsOf__CodePoints({
      text,
      count: range.to.offset
    })
    : text.length
  return from < to
    ? [
      {
        from,
        to,
        attributes: Object.fromEntries(Object.entries(attributes).filter(([name]) => NAMES_CHANGE.includes(name)))
      }
    ]
    : []
}

interface _Api___unmarkedOf__Segments_ {
  segments: Array<_Segment_Line_>
  range: _Range_Text_
  line: number
  source: string
}

function unmarkedOf__Segments({
  segments,
  range,
  line,
  source
}: _Api___unmarkedOf__Segments_): Array<_Segment_Line_> {
  if (line < range.from.line || line > range.to.line) return segments
  const text = segments.map((segment_Line) => segment_Line.text).join("")
  const from = line === range.from.line
    ? unitsOf__CodePoints({
      text,
      count: range.from.offset
    })
    : 0
  const to = line === range.to.line
    ? unitsOf__CodePoints({
      text,
      count: range.to.offset
    })
    : text.length
  const starts = segments.reduce(
    (
      starts_Segment: Array<number>,
      segment_Line
    ) => [
      ...starts_Segment,
      (starts_Segment.at(-1) ?? 0) + segment_Line.text.length
    ],
    [0]
  )
  return segments.map((
    segment_Line,
    index
  ) => segment_Line.attributes["data-source"] === source && (starts[index] ?? 0) < to && from < (starts[index + 1] ?? 0)
    ? {
      text: segment_Line.text,
      attributes: Object.fromEntries(Object.entries(segment_Line.attributes).filter(([name]) => !NAMES_CHANGE.includes(name)))
    }
    : segment_Line)
}

const NAMES_CHANGE = [
  "data-change",
  "data-side",
  "data-source"
]

interface _Api___rowOf__Position_ {
  position: _Position_Text_
  line_First: number
  row_First: number
  texts: Array<string>
}

function rowOf__Position({
  position,
  line_First,
  row_First,
  texts
}: _Api___rowOf__Position_): _Position_Run_ {
  const line = row_First + position.line - line_First
  return {
    line,
    offset: unitsOf__CodePoints({
      text: texts[line] ?? "",
      count: position.offset
    })
  }
}

interface _Api___shiftedOf__Underlay_ {
  underlay: _Underlay_Text_
  row_First: number
  count: number
}

function shiftedOf__Underlay({
  underlay,
  row_First,
  count
}: _Api___shiftedOf__Underlay_): _Underlay_Text_ {
  const shifted = (position: _Position_Run_): _Position_Run_ => position.line < row_First
    ? position
    : {
      line: position.line + count,
      offset: position.offset
    }
  return underlay.kind === "POINT"
    ? {
      ...underlay,
      at: shifted(underlay.at)
    }
    : underlay.kind === "BOUNDARY"
      ? {
        ...underlay,
        line: underlay.line < row_First ? underlay.line : underlay.line + count
      }
      : {
        ...underlay,
        from: shifted(underlay.from),
        to: shifted(underlay.to)
      }
}

interface _Api___filedOf__Run_ {
  run_Lines: _Run_Lines_
  pairs: Array<_Pair_Frame_>
}

function filedOf__Run({
  run_Lines,
  pairs
}: _Api___filedOf__Run_): _Run_Lines_ {
  const texts = run_Lines.lines.map((line_Run) => line_Run.segments.map((segment_Line) => segment_Line.text).join(""))
  const underlays = pairs.flatMap((pair_Frame) => pair_Frame.pair.runs
    .filter((run) => run.kind === "CHANGED")
    .flatMap((run) => filedOf__Range({
      range: {
        from: {
          line: run.range_After.from.line + pair_Frame.pair.line_First,
          offset: run.range_After.from.offset
        },
        to: {
          line: run.range_After.to.line + pair_Frame.pair.line_First,
          offset: run.range_After.to.offset
        }
      },
      lines: run_Lines.lines,
      texts
    })))
  return underlays.length === 0
    ? run_Lines
    : {
      id: run_Lines.id,
      lines: run_Lines.lines,
      groups: [
        ...run_Lines.groups,
        {
          attributes: {
            "data-file": ""
          },
          underlays
        }
      ]
    }
}

interface _Api___filedOf__Range_ {
  range: _Range_Text_
  lines: Array<_Line_Run_>
  texts: Array<string>
}

function filedOf__Range({
  range,
  lines,
  texts
}: _Api___filedOf__Range_): Array<_Underlay_Text_> {
  const isPoint = isEmpty__Range(range)
  const underlays = lines.flatMap((
    line_Run,
    index
  ) => line_Run.origins.flatMap((origin_Line): Array<_Underlay_Text_> => {
    const line = origin_Line.position.line
    if (origin_Line.id_Text.kind !== "DOCUMENT" || line < range.from.line || line > range.to.line) return []
    const piece = (texts[index] ?? "").slice(
      origin_Line.from,
      origin_Line.to
    )
    const start = origin_Line.position.offset
    const end = start + countOf__CodePoints(piece)
    const unitsAt = (offset: number): number => origin_Line.from + unitsOf__CodePoints({
      text: piece,
      count: offset - start
    })
    const from = line === range.from.line ? range.from.offset : 0
    const to = line === range.to.line ? range.to.offset : end
    if (isPoint) {
      return start <= from && from <= end
        ? [
          {
            kind: "POINT",
            at: {
              line: index,
              offset: unitsAt(from)
            },
            attributes: {
              "data-file": ""
            }
          }
        ]
        : []
    }
    const from_Piece = Math.max(
      from,
      start
    )
    const to_Piece = Math.min(
      to,
      end
    )
    return from_Piece < to_Piece
      ? [
        trimmed__Underlay({
          texts,
          underlay: {
            kind: "STRETCH",
            from: {
              line: index,
              offset: unitsAt(from_Piece)
            },
            to: {
              line: index,
              offset: unitsAt(to_Piece)
            },
            attributes: {
              "data-file": ""
            }
          }
        })
      ]
      : []
  }))
  return isPoint ? underlays.slice(
    0,
    1
  ) : underlays
}

interface _Api___eachOf__Yours_ {
  run_Lines: _Run_Lines_
  source_Yours: string
}

function eachOf__Yours({
  run_Lines,
  source_Yours
}: _Api___eachOf__Yours_): _Run_Lines_ {
  return run_Lines.groups.some((group_Underlay) => group_Underlay.attributes["data-source"] === source_Yours)
    ? {
      id: run_Lines.id,
      lines: run_Lines.lines,
      groups: run_Lines.groups.flatMap((group_Underlay) => group_Underlay.attributes["data-source"] === source_Yours
        ? [
          ...Map.groupBy(
            group_Underlay.underlays,
            (underlay) => underlay.attributes["data-place"] ?? ""
          )
        ].map(([
          place,
          underlays
        ]) => ({
          attributes: {
            ...group_Underlay.attributes,
            "data-place": place
          },
          underlays: underlays.map((underlay) => ({
            ...underlay,
            attributes: {
              ...underlay.attributes,
              "data-yours": ""
            }
          }))
        }))
        : [group_Underlay])
    }
    : run_Lines
}

interface _Api___blocksOf__Lines_ {
  lines_Run: Array<_Line_Run_>
  line_First: number
}

function blocksOf__Lines({
  lines_Run,
  line_First
}: _Api___blocksOf__Lines_): Array<_Block_ViewModel_> {
  return lines_Run.length === 0
    ? []
    : [
      {
        kind: "LINES",
        run: {
          id: `lines-${line_First + 1}`,
          lines: lines_Run,
          groups: []
        }
      }
    ]
}

interface _Api___frameOf__Drawn_ {
  model_TextEditor: _Model_TextEditor_
  frame_Drawn: _Drawn_Frame_
  changes_Placed: Array<_Placed_Change_>
  proposals: Array<_Proposal_Host_>
  rounds_Landed: Array<_Landed_Round_>
  source_Yours: string
}

function frameOf__Drawn({
  model_TextEditor,
  frame_Drawn,
  changes_Placed,
  proposals,
  rounds_Landed,
  source_Yours
}: _Api___frameOf__Drawn_): _FRAME_Block__ViewModel_ {
  for (const source of frame_Drawn.sources) {
    if (!proposals.some((proposal_Host) => proposal_Host.source === source)) throw new Error(`no proposal for the source ${source}`)
  }
  const [
    item_First,
    ...items_Rest
  ] = proposals
    .filter((proposal_Host) => frame_Drawn.sources.includes(proposal_Host.source))
    .map((proposal_Host): _Item_Proposals_ => {
      const isOpen = proposal_Host.state === "OPEN"
      const isRunning = proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING")
      const isStaged = proposal_Host.requests.some((request_Host) => request_Host.status === "STAGED")
      const state: _State_Proposal_ = !isOpen
        ? proposal_Host.state
        : isRunning
          ? "REVISING"
          : isStaged
            ? "REQUESTED"
            : "OPEN"
      return {
        source: proposal_Host.source,
        title: proposal_Host.title,
        state,
        status: STATUSMAP__STATE_PROPOSAL[state] ?? proposal_Host.status,
        places: placesOf__Source({
          model_TextEditor,
          source: proposal_Host.source,
          frame_Drawn,
          changes_Placed,
          proposals
        }),
        neighbors: {
          range_Previous: null,
          range_Next: null
        },
        rationale: proposal_Host.rationale,
        requests: proposal_Host.requests.map((request_Host) => ({
          id: request_Host.id,
          notes: request_Host.notes,
          reference: referenceOf__Request({
            reference: request_Host.reference,
            status: request_Host.status,
            model_TextEditor
          }),
          status: request_Host.status,
          progress: PROGRESSMAP__STATUS_REQUEST[request_Host.status],
          detail_Progress: null,
          isRunning: request_Host.status === "RUNNING",
          isStartable: isOpen && !isRunning && request_Host.status === "STAGED",
          isRemovable: request_Host.status === "STAGED",
          isEditing: false,
          isStoppable: false,
          isDismissable: false
        })),
        isRunning,
        isStartable: isOpen && !isRunning && isStaged,
        stale: staleOf__Round({
          round_Landed: rounds_Landed.find((round_Landed) => round_Landed.source === proposal_Host.source) ?? null,
          decision: proposal_Host.state,
          isRunning,
          model_TextEditor
        }),
        actions: proposal_Host.actions,
        isDrafting: false,
        confirming: null,
        attributes: proposal_Host.attributes
      }
    })
  if (item_First === undefined) throw new Error(`a frame at line ${frame_Drawn.frame_Model.first + 1} lists no proposal`)
  const references_Frame = proposals
    .filter((proposal_Host) => frame_Drawn.sources.includes(proposal_Host.source))
    .flatMap((proposal_Host) => proposal_Host.requests.flatMap((request_Host) => request_Host.status !== "ADDRESSED" && request_Host.reference !== null ? [request_Host.reference] : []))
  const references_Running = proposals
    .filter((proposal_Host) => frame_Drawn.sources.includes(proposal_Host.source))
    .flatMap((proposal_Host) => proposal_Host.requests.flatMap((request_Host) => request_Host.status === "RUNNING" && request_Host.reference !== null ? [request_Host.reference] : []))
  const part_Proposed: _Part_Frame_ = {
    kind: "PROPOSAL_LINES",
    run: underlinedOf__Run({
      run_Lines: frame_Drawn.run_Proposed,
      pieces_References: references_Frame.filter((reference) => reference.side === "PROPOSED").map((reference) => reference.pieces),
      pieces_Running: references_Running.filter((reference) => reference.side === "PROPOSED").flatMap((reference) => reference.pieces),
      attributes: {
        "data-requested": ""
      }
    })
  }
  const part_List: _Part_Frame_ = {
    kind: "PROPOSAL_LIST",
    items: [
      item_First,
      ...items_Rest
    ]
  }
  const range_Frame = {
    first: frame_Drawn.frame_Model.first + 1,
    last: frame_Drawn.frame_Model.last + 1
  }
  const parts_Listed: Array<_Part_Frame_> = frame_Drawn.sources.every((source) => source === source_Yours)
    ? []
    : [
      headOf__Frame({
        range_Frame,
        items: [
          item_First,
          ...items_Rest
        ],
        proposals_Listed: proposals.filter((proposal_Host) => frame_Drawn.sources.includes(proposal_Host.source)),
        source_Yours
      }),
      part_List
    ]
  return {
    kind: "FRAME",
    range: range_Frame,
    parts: frame_Drawn.run_Current === null
      ? [
        part_Proposed,
        ...parts_Listed
      ]
      : [
        {
          kind: "CURRENT_LINES",
          run: underlinedOf__Run({
            run_Lines: frame_Drawn.run_Current,
            pieces_References: references_Frame.filter((reference) => reference.side === "CURRENT").map((reference) => reference.pieces),
            pieces_Running: references_Running.filter((reference) => reference.side === "CURRENT").flatMap((reference) => reference.pieces),
            attributes: {
              "data-requested": ""
            }
          })
        },
        part_Proposed,
        ...parts_Listed
      ]
  }
}

interface _Api___staleOf__Round_ {
  round_Landed: _Landed_Round_ | null
  decision: _Decision_Proposal_
  isRunning: boolean
  model_TextEditor: _Model_TextEditor_
}

function staleOf__Round({
  round_Landed,
  decision,
  isRunning,
  model_TextEditor
}: _Api___staleOf__Round_): _Stale_Item_ | null {
  if (round_Landed === null || round_Landed.changes_Stale.length + round_Landed.count_Dropped === 0) return null
  return STALEMAP__KIND_STALE[decision === "ACCEPTED" ? "CONFLICT" : "STALE"]({
    round_Landed,
    decision,
    isRunning,
    model_TextEditor
  })
}

type _StaleMap__Kind_Stale_ = {
  [Kind in _Kind_Stale_]: (api_Stale: _Api___itemOf__Stale_) => _Stale_Item_
}

interface _Api___itemOf__Stale_ {
  round_Landed: _Landed_Round_
  decision: _Decision_Proposal_
  isRunning: boolean
  model_TextEditor: _Model_TextEditor_
}

const STALEMAP__KIND_STALE: _StaleMap__Kind_Stale_ = {
  STALE: STALE_itemOf__Stale,
  CONFLICT: CONFLICT_itemOf__Stale
}

function STALE_itemOf__Stale({
  round_Landed,
  decision,
  isRunning
}: _Api___itemOf__Stale_): _Stale_Item_ {
  return {
    kind: "STALE",
    head: "Stale",
    label: [
      ...round_Landed.changes_Stale.length === 0 ? [] : ["written before your edits"],
      ...droppedOf__Round(round_Landed)
    ].join(" · "),
    isRerunnable: decision === "OPEN" && !isRunning,
    ways: []
  }
}

function droppedOf__Round(
  round_Landed: _Landed_Round_
): Array<string> {
  const count_Dropped = round_Landed.count_Dropped
  return count_Dropped === 0 ? [] : [`${count_Dropped} dropped, ${count_Dropped === 1 ? "its" : "their"} text gone`]
}

function CONFLICT_itemOf__Stale({
  round_Landed,
  isRunning,
  model_TextEditor
}: _Api___itemOf__Stale_): _Stale_Item_ {
  const changes = model_TextEditor.proposed.find((changes_Source) => changes_Source.source === round_Landed.source)?.changes ?? []
  const changes_Stale = round_Landed.changes_Stale.flatMap((stale_Change) => {
    const change = changes[stale_Change.index]
    return change === undefined
      ? []
      : [
        {
          change,
          stale_Change
        }
      ]
  })
  const [change_First] = changes_Stale
  return {
    kind: "CONFLICT",
    head: "Conflict",
    label: [
      ...change_First === undefined
        ? []
        : [
          reasonOf__Pair({
            pair: pairOf__Stale({
              text_Model: model_TextEditor.document,
              change: change_First.change,
              over: change_First.stale_Change.over
            }),
            text_Written: change_First.stale_Change.over.written.lines
          })
        ],
      ...droppedOf__Round(round_Landed)
    ].join(" · "),
    isRerunnable: false,
    ways: [
      ...changes_Stale.length > 0 && changes_Stale.every((change_Stale) => change_Stale.change.kind === "REPLACE") ? [WAY_KEEP] : [],
      WAY_TAKE,
      ...changes_Stale.length > 0 && changes_Stale.every((change_Stale) => change_Stale.change.kind === "MOVE" || isEmpty__Range(change_Stale.change.range)) ? [WAY_BOTH] : [],
      ...isRunning ? [] : [WAY_RERUN]
    ]
  }
}

interface _Api___reasonOf__Pair_ {
  pair: _Pair_Stale_
  text_Written: _Text_Model_
}

function reasonOf__Pair({
  pair,
  text_Written
}: _Api___reasonOf__Pair_): string {
  const runs_Changed = pair.runs.filter((run) => run.kind === "CHANGED")
  const [
    run_First,
    ...runs_Rest
  ] = runs_Changed
  if (run_First === undefined) return "the file changed what it was written on"
  const line = pair.line_First + run_First.range_After.from.line + 1
  const before = textIn__Range({
    text_Model: text_Written,
    range: run_First.range_Before
  }).lines.join("\n").trim()
  const after = textIn__Range({
    text_Model: pair.lines,
    range: run_First.range_After
  }).lines.join("\n").trim()
  if (runs_Rest.length > 0 || !isShort__Words(before) || !isShort__Words(after)) {
    const line_Last = pair.line_First + linesOf__Ranges(runs_Changed.map((run) => run.range_After)).last + 1
    return line_Last === line ? `the file changed line ${line}` : `the file changed lines ${line}–${line_Last}`
  }
  return before === ""
    ? `the file put “${after}” in line ${line}`
    : after === ""
      ? `the file took “${before}” out of line ${line}`
      : `the file changed “${before}” to “${after}” in line ${line}`
}

function isShort__Words(
  words: string
): boolean {
  return !words.includes("\n") && countOf__CodePoints(words) <= 24
}

const WAY_KEEP: _Way_Stale_ = {
  kind: "KEEP",
  label: "Keep yours"
}

const WAY_TAKE: _Way_Stale_ = {
  kind: "TAKE",
  label: "Take the file's"
}

const WAY_BOTH: _Way_Stale_ = {
  kind: "BOTH",
  label: "Both"
}

const WAY_RERUN: _Way_Stale_ = {
  kind: "RERUN",
  label: "Run again"
}

interface _Api___headOf__Frame_ {
  range_Frame: _Range_Lines_
  items: Array<_Item_Proposals_>
  proposals_Listed: Array<_Proposal_Host_>
  source_Yours: string
}

function headOf__Frame({
  range_Frame,
  items,
  proposals_Listed,
  source_Yours
}: _Api___headOf__Frame_): _Part_Frame_ {
  const counts_Frame = countsOf__States(items.filter((item_Proposals) => item_Proposals.source !== source_Yours).map((item_Proposals) => item_Proposals.state))
  const statuses = proposals_Listed.flatMap((proposal_Host) => proposal_Host.requests.map((request_Host) => request_Host.status))
  const counts_Requests: _Counts_Requests_ = {
    STAGED: statuses.filter((status) => status === "STAGED").length,
    RUNNING: statuses.filter((status) => status === "RUNNING").length
  }
  const count_Startable = proposals_Listed
    .filter((proposal_Host) => proposal_Host.state === "OPEN" && !proposal_Host.requests.some((request_Host) => request_Host.status === "RUNNING"))
    .flatMap((proposal_Host) => proposal_Host.requests)
    .filter((request_Host) => request_Host.status === "STAGED").length
  const label_Range = labelOf__Range_Frame(range_Frame)
  const count_Acceptable = items.filter((item_Proposals) => item_Proposals.state === "OPEN" && item_Proposals.actions.some((action_Item) => action_Item.stateAfter === "ACCEPTED")).length
  return {
    kind: "PROPOSAL_HEAD",
    label_Range,
    figure: {
      value: decidedOf__Label(counts_Frame),
      more: breakdownOf__Counts(counts_Frame)
    },
    accept_All: count_Acceptable === 0
      ? null
      : {
        label: `Accept all (${count_Acceptable})`,
        title: `Accepts every open proposal listed in ${label_Range}, wherever else it's listed; one with requests waiting is left to be decided by itself`
      },
    revisions_Scope: {
      figure: figureOf__Counts_Requests(counts_Requests),
      start_All: count_Startable === 0
        ? null
        : {
          label: `Start all (${count_Startable})`,
          title: `Starts all ${count_Startable} ${count_Startable === 1 ? "request" : "requests"} staged for the proposals listed in ${label_Range}`
        },
      stop_All: counts_Requests.RUNNING === 0
        ? null
        : {
          label: `Stop all (${counts_Requests.RUNNING})`,
          title: `Stops all ${counts_Requests.RUNNING} running for the proposals listed in ${label_Range}, staging them again`
        },
      actions: []
    }
  }
}

function labelOf__Range_Frame(
  range_Frame: _Range_Lines_
): string {
  return range_Frame.last < range_Frame.first
    ? `before line ${range_Frame.first}`
    : range_Frame.first === range_Frame.last
      ? `line ${range_Frame.first}`
      : `lines ${range_Frame.first}–${range_Frame.last}`
}

type _StatusMap__State_Proposal_ = {
  [State in _State_Proposal_]: string | null
}

const STATUSMAP__STATE_PROPOSAL: _StatusMap__State_Proposal_ = {
  OPEN: null,
  REQUESTED: "Revision requested",
  REVISING: "Revising",
  ACCEPTED: null,
  REJECTED: null,
  WITHDRAWN: null
}

interface _Api___placesOf__Source_ {
  model_TextEditor: _Model_TextEditor_
  source: string
  frame_Drawn: _Drawn_Frame_
  changes_Placed: Array<_Placed_Change_>
  proposals: Array<_Proposal_Host_>
}

function placesOf__Source({
  model_TextEditor,
  source,
  frame_Drawn,
  changes_Placed,
  proposals
}: _Api___placesOf__Source_): _Places_Item_ {
  const change_Move = changes_Placed.find((change_Placed) => change_Placed.source === source && change_Placed.change.kind === "MOVE" && isWhole__Move({
    model_TextEditor,
    change: change_Placed.change
  }))?.change
  if (change_Move?.kind === "MOVE") {
    const lines = linesOf__Span({
      model_TextEditor,
      change: change_Move
    })
    return {
      kind: "MOVE",
      range: {
        first: lines.first + 1,
        last: lines.last + 1
      },
      way: linesOf__Landing({
        model_TextEditor,
        change: change_Move
      }).first < lines.first ? "UP" : "DOWN"
    }
  }
  const ranges_Here = [
    ...new Map(frame_Drawn.ranges_Shown
      .filter((range_Change) => range_Change.source === source)
      .map((range_Change) => [
        range_Change.place,
        range_Change
      ])).values()
  ]
  const count_All = changes_Placed
    .filter((change_Placed) => change_Placed.source === source)
    .reduce(
      (
        count,
        change_Placed
      ) => count + change_Placed.runs.length,
      0
    )
  const kinds_Outer: Array<_Kind_Outer_> = [
    "WITHIN",
    "CARRIED"
  ]
  const conditions: Array<_Condition_Places_> = kinds_Outer.flatMap((kind_Outer) => [
    ...Map.groupBy(
      ranges_Here.flatMap((range_Change) => range_Change.outer?.kind === kind_Outer
        ? [
          range_Change.outer.source
        ]
        : []),
      (source_Outer) => source_Outer
    )
  ].map(([
    source_Outer,
    places
  ]) => ({
    kind: kind_Outer,
    count: places.length,
    source: source_Outer,
    title: proposals.find((proposal_Host) => proposal_Host.source === source_Outer)?.title ?? source_Outer
  })))
  return ranges_Here.length === count_All && conditions.length === 0
    ? {
      kind: "NONE"
    }
    : {
      kind: "COUNT",
      count_Here: ranges_Here.length,
      count_All,
      conditions
    }
}
