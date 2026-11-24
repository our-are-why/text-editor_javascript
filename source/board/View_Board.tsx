import "./View_Board.css"
import {
  draw__Node_Jsx,
  type JSX,
  type _Node_Jsx_
} from "../jsx/index.ts"
import type {
  _ViewModel_Board_,
  _Column_Board_,
  __BASE_Column_Board_,
  _YOURS_Column_Board_,
  _AGENT_Column_Board_,
  _DRAFTS_Column_Board_,
  _Tile_Board_,
  _Action_Tile_,
  _RESOLVED_Column_Board_,
  _Row_Resolved_
} from "./ViewModel_Board.ts"

export {
  draw__View_Board,
  type _Api___draw__View_Board_,
  type _ComponentMap__View_Board_,
  type _ComponentMap_Column_,
  type _Api___Column_Board__Html_,
  type _Api___Tile_Board__Html_,
  COMPONENTMAP__VIEW_BOARD
}

interface _Api___draw__View_Board_ {
  containerElement_View: HTMLElement
  componentMap_View: _ComponentMap__View_Board_
  viewModel_Board: _ViewModel_Board_
}

function draw__View_Board({
  containerElement_View,
  componentMap_View,
  viewModel_Board
}: _Api___draw__View_Board_): void {
  draw__Node_Jsx({
    containerElement: containerElement_View,
    node_Jsx: (
      <Board_Html
        componentMap_View={componentMap_View}
        viewModel_Board={viewModel_Board}
      />
    )
  })
}

interface _Api___Board_Html_ {
  componentMap_View: _ComponentMap__View_Board_
  viewModel_Board: _ViewModel_Board_
}

function Board_Html({
  componentMap_View,
  viewModel_Board
}: _Api___Board_Html_): JSX.Element {
  return (
    <div class="htmlView_board">
      <div class="head_Board_htmlView">
        <h2 class="title_Board_htmlView">{viewModel_Board.label}</h2>
        <span class="count_Board_htmlView">{viewModel_Board.label_Count}</span>
        <button
          type="button"
          class="new_Board_htmlView"
          data-ask="NEW_TASK"
        >
          {viewModel_Board.label_New}
        </button>
      </div>
      <div class="columns_Board_htmlView">
        {viewModel_Board.columns.map((column_Board) => (
          <Column_Board__Html
            componentMap_View={componentMap_View}
            column_Board={column_Board}
          />
        ))}
      </div>
    </div>
  )
}

interface _Api___Column_Board__Html_<Kind extends _Column_Board_["kind"]> {
  componentMap_View: _ComponentMap__View_Board_
  column_Board: Extract<
    _Column_Board_,
    __BASE_Column_Board_<Kind>
  >
}

function Column_Board__Html<Kind extends _Column_Board_["kind"]>({
  componentMap_View,
  column_Board
}: _Api___Column_Board__Html_<Kind>): _Node_Jsx_ {
  const Component_Column = componentMap_View.column[column_Board.kind]
  return (
    <Component_Column
      componentMap_View={componentMap_View}
      column_Board={column_Board}
    />
  )
}

interface _Api___Tiles_Column_Board__Html_ {
  componentMap_View: _ComponentMap__View_Board_
  column_Board: _YOURS_Column_Board_ | _AGENT_Column_Board_ | _DRAFTS_Column_Board_
}

function Tiles_Column_Board__Html({
  componentMap_View,
  column_Board
}: _Api___Tiles_Column_Board__Html_): JSX.Element {
  const Component_Tile = componentMap_View.tile
  return (
    <section
      class="column_Board_htmlView"
      data-kind={column_Board.kind}
    >
      <h3 class="label_Column_htmlView">
        {column_Board.label}
        <span
          class="mark_Column_htmlView"
          aria-hidden="true"
        />
        <span class="count_Column_htmlView">{String(column_Board.count)}</span>
      </h3>
      {column_Board.tiles.length === 0
        ? <p class="empty_Column_htmlView">{column_Board.label_Empty}</p>
        : (
          <ul class="tiles_Column_htmlView">
            {column_Board.tiles.map((tile_Board) => <Component_Tile tile_Board={tile_Board} />)}
          </ul>
        )}
    </section>
  )
}

interface _Api___Tile_Board__Html_ {
  tile_Board: _Tile_Board_
}

function Tile_Board__Html({
  tile_Board
}: _Api___Tile_Board__Html_): JSX.Element {
  return (
    <li
      class="tile_htmlView"
      data-state={tile_Board.state}
      data-id={tile_Board.id}
      data-shown={tile_Board.isShown ? "" : undefined}
    >
      <p class="line_Tile_htmlView">
        <button
          type="button"
          class="switch_Tile_htmlView"
          data-ask="SWITCH"
          title={tile_Board.label_Switch}
        >
          <span class="name_Tile_htmlView">{tile_Board.name}</span>
        </button>
        <span class="state_Tile_htmlView">{tile_Board.label_State}</span>
        {tile_Board.actions_More.length > 0 && (
          <span class="more_Tile_htmlView">
            <button
              type="button"
              class="trigger_More_htmlView"
              aria-haspopup="menu"
              aria-label={tile_Board.label_More}
            />
            <span
              class="menu_Tile_htmlView"
              role="menu"
            >
              {tile_Board.actions_More.map((action_Tile) => <Action_Tile__Html action_Tile={action_Tile} />)}
            </span>
            <span
              class="strip_More_htmlView"
              aria-hidden="true"
            />
          </span>
        )}
      </p>
      {(tile_Board.parts.length > 0 || tile_Board.isInView) && (
        <p class="details_Tile_htmlView">
          {tile_Board.parts.map((part_Task) => (
            <span
              class="part_Tile_htmlView"
              data-kind={part_Task.kind}
            >
              {part_Task.text}
            </span>
          ))}
          {tile_Board.isInView && <span class="inView_Tile_htmlView">{tile_Board.label_InView}</span>}
        </p>
      )}
    </li>
  )
}

interface _Api___Action_Tile__Html_ {
  action_Tile: _Action_Tile_
}

function Action_Tile__Html({
  action_Tile
}: _Api___Action_Tile__Html_): JSX.Element {
  return (
    <button
      type="button"
      class="action_Tile_htmlView"
      data-ask={action_Tile.kind}
      role="menuitem"
      tabindex="-1"
    >
      {action_Tile.label}
    </button>
  )
}

interface _Api___RESOLVED_Column_Board__Html_ {
  componentMap_View: _ComponentMap__View_Board_
  column_Board: _RESOLVED_Column_Board_
}

function RESOLVED_Column_Board__Html({
  column_Board
}: _Api___RESOLVED_Column_Board__Html_): JSX.Element {
  return (
    <section
      class="column_Board_htmlView"
      data-kind={column_Board.kind}
    >
      <div class="head_Column_htmlView">
        <h3 class="label_Column_htmlView">
          {column_Board.label}
          <span class="count_Column_htmlView">{String(column_Board.count)}</span>
        </h3>
        {column_Board.rows.length > 0 && (
          <span class="fold_Board_htmlView">
            <span
              class="more_Board_htmlView"
              aria-hidden="true"
            >
              …
            </span>
            <span class="folded_Board_htmlView">
              <button
                type="button"
                class="collect_Board_htmlView"
                data-ask="COLLECT"
                data-ids={column_Board.ids.join(" ")}
                title={column_Board.title_Collect}
              >
                {column_Board.label_Collect}
              </button>
            </span>
          </span>
        )}
      </div>
      {column_Board.rows.length === 0
        ? <p class="empty_Column_htmlView">{column_Board.label_Empty}</p>
        : (
          <ul class="rows_Resolved_htmlView">
            {column_Board.rows.map((row_Resolved) => <Row_Resolved__Html row_Resolved={row_Resolved} />)}
          </ul>
        )}
    </section>
  )
}

interface _Api___Row_Resolved__Html_ {
  row_Resolved: _Row_Resolved_
}

function Row_Resolved__Html({
  row_Resolved
}: _Api___Row_Resolved__Html_): JSX.Element {
  return (
    <li
      class="row_Resolved_htmlView"
      data-id={row_Resolved.id}
    >
      <span class="name_Row_htmlView">
        {row_Resolved.name}
        <span class="note_Row_htmlView">{row_Resolved.label_State}</span>
      </span>
    </li>
  )
}

interface _ComponentMap__View_Board_ {
  column: _ComponentMap_Column_
  tile: (api_Tile: _Api___Tile_Board__Html_) => _Node_Jsx_
}

type _ComponentMap_Column_ = {
  [Kind in _Column_Board_["kind"]]: (api_Column: _Api___Column_Board__Html_<Kind>) => _Node_Jsx_
}

const COMPONENTMAP__VIEW_BOARD: _ComponentMap__View_Board_ = {
  column: {
    YOURS: Tiles_Column_Board__Html,
    AGENT: Tiles_Column_Board__Html,
    DRAFTS: Tiles_Column_Board__Html,
    RESOLVED: RESOLVED_Column_Board__Html
  },
  tile: Tile_Board__Html
}
