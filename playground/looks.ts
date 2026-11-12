import type { _Attributes_Element_ } from "../source/ViewModel_TextEditor.ts"

export {
  type _Mark_,
  attributesOf__Marks,
  attributesOf__Link,
  type _Side_Change_,
  type _Kind_Change_,
  attributesOf__Change,
  attributesOf__Nested,
  attributesOf__Edit
}

// the marks the playground's scenes use, as a host would name them: the
// editor knows none of them, only the data a segment carries
type _Mark_ = "bold" | "italic" | "monospace" | "highlighted" | "struck"

// a stretch's marks, as data: one attribute, each mark a word of it, for a
// stylesheet to find with ~=
function attributesOf__Marks(
  ...marks: Array<_Mark_>
): _Attributes_Element_ {
  return { "data-marks": marks.join(" ") }
}

// a link, to where it goes, as data: following it is a command, not the
// browser's, so it's no <a>
function attributesOf__Link(
  target: string
): _Attributes_Element_ {
  return { "data-link": target }
}

// which side of a change a segment shows: what it was, taken out, or what it
// becomes, put in
type _Side_Change_ = "before" | "after"

// what happened to a stretch, as doctor's comparison names it; or moved,
// taken from where it is and put somewhere else, by a move
type _Kind_Change_ = "inserted" | "removed" | "replaced" | "replacedRestyled" | "restyled" | "moved"

interface _Api___attributesOf__Change_ {
  side: _Side_Change_
  kind: _Kind_Change_
  source: string
}

// a stretch a proposal changes, as data, never how it looks: its kind, its
// side, and its source, for what it's from to be found by pointing; with a
// stretch's marks, when it has them, on the same segment. How it looks is a
// perspective's
function attributesOf__Change({
  side,
  kind,
  source
}: _Api___attributesOf__Change_): _Attributes_Element_ {
  return { "data-change": kind, "data-side": side, "data-source": source }
}

interface _Api___attributesOf__Nested_ {
  kind: _Kind_Change_
  source: string
}

// a change nested inside another proposal's on the same words, a removal,
// so it applies only if that's rejected: its kind and source, under names of
// their own, so the removal's stay as they are on the segment
function attributesOf__Nested({
  kind,
  source
}: _Api___attributesOf__Nested_): _Attributes_Element_ {
  return { "data-nested-change": kind, "data-nested-source": source }
}

// what a move's words become on the way, where it changes them, a stretch of
// what it moves: the edit's kind, under a name of its own, so the move's stay
// as they are on the segment; it's the move's own proposal's, so it's ringed
// inside the move's ring, at full strength
function attributesOf__Edit(
  kind: _Kind_Change_
): _Attributes_Element_ {
  return { "data-edit": kind }
}

