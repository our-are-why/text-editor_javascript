# an editor with proposals built in

The idea for an editor component with proposals built in, worked out on
2026-11-04 while building doctor, which needs it. It's an outline, not a
design to build from line by line: the problem it solves, what it's for,
the model it's built on, how it's put together, its input, commands and
modules, and the first thing it has to do. It stands on its own; doctor's
repository, for reference, is https://github.com/our-are-why/doctor, and its
`STATUS.md` says where doctor stands.

## the problem it solves

**doctor** is a VS Code extension for writing and revising documents beside
an AI agent, such as Claude Code. You ask for changes; the agent answers with
**proposals**, each one change to a document, and you review them: accept,
reject, ask for it to be changed, or change it yourself. A document can have
many proposals at once, one after another or side by side, each with its
rounds as it's asked for changes and revised.

doctor's editor is **Monaco**, VS Code's own, editing a document as lines of
text in a small syntax: `#1` for a heading, `-` for a list item, fences for
code and quotes. A proposal is drawn the way VS Code draws an inline diff or
a peek view: in the gaps Monaco leaves between its lines, the document's
line marked, and the proposal's version beneath it in green. For reading
proposals and deciding them, that works.

For editing one, it doesn't. What's drawn in those gaps isn't text Monaco
edits; only its own lines are. Three ways round that were tried:

1. **each proposed line made editable on its own,** in the page, outside
   Monaco: a selection can't cross from one block to the next; Enter and
   Backspace can't make or join blocks; pasting and undoing across lines
   don't work. Everything a document editor does between lines, missing.
2. **the proposal swapped into Monaco's own lines** while it's edited, the
   rest made read-only, the lines it replaces shown beside it, swapped back
   once it's left: much closer, as it's Monaco editing; but the lines are the
   document's, so the other proposals, the undo history, what arrives from
   elsewhere meanwhile, and keeping edits inside the proposal all have to be
   juggled round the swap, and they slip.
3. **your own edits made proposals,** as a document editor's suggesting mode
   makes them, while the agent's at work: built on the two above, it has
   their problems, and more.

Each fixes some of it and leaves the rest, as each works round one fact: in
the editor, a proposal isn't part of what's being edited. An editor whose
model has proposals in it from the start, a proposal's words real content,
edited as the rest is and kept inside it, has none of that class of problem.
That's this component.

## what a host needs from it

What doctor needs, and what any host would:

- any text-based document: code, Markdown, an essay, a report, a note;
- extended where it's needed: a part of a document, or the whole of one,
  given its own look and behavior by a module;
- a document shown with its proposals in it, many, one after another or
  side by side, each with its state, waiting, accepted or rejected, all of
  them at once, each change styled word by word;
- its proposals its own, of whatever shape, given to the editor as changes;
- each decided where it's shown: accepted, rejected, reopened;
- each edited in place, with every normal editing behavior, selection across
  its lines, Enter, Backspace, paste, undo, and edits kept inside it; an
  edit to one told to the host as the proposal's next round;
- what a round changed since the one before, shown;
- notes asked of a proposal, on words of it or the whole of it;
- your own edits among what's proposed made proposals of your own, and the
  document's own lines, where nothing's proposed, edited as they are;
- input of every kind a person uses: the keyboard alone, the mouse with it,
  voice, or a mix of them;
- accessibility tailored to the person and where they are, not one kind for
  everyone;
- only what it needs: a host that only shows a document carries none of the
  editing;
- the host's colours: in VS Code, VS Code's theme;
- the host's own controls: a proposal's bar, the form a note's asked in,
  drawn by the host where the component leaves room for them;
- running in a VS Code webview, a sandboxed page with no Node, in Chromium:
  so plain web code, for Chromium alone, TypeScript for the browser, with no
  framework, so a host built with one, as doctor is with Preact, places it as
  it would any element.

## what it's for

An editor of any text, code, Markdown, prose, in which a **proposal**, a
change someone offers to the document, is part of what's edited, not drawn
beside it. You read the
document with its proposals in it, decide them, and edit inside them as
freely as anywhere else. It knows nothing of doctor: not its documents, its
tasks, or its agent. Doctor is one host of it; any web page in Chromium
could be.

## the model

The heart of it is a model, plain code with no screen in it, of any text:
code, Markdown, an essay, a report.

- **a document:** its text, as lines of characters, each proven to hold no
  line break; and over each line's text an overlay, marks over ranges of it,
  how it looks and what it links to, as doctor's text has, a dimension of
  its own, usually empty for code and Markdown, whose look comes from their
  syntax. What kind of text it is, code in some language, Markdown, prose,
  isn't the model's to say; to the model, it's text.
- **regions:** parts of the text given a kind by a module, and with it how
  they look and what editing means in them: a block of code in Markdown, a
  heading, a function, a quoted reply; or the whole document, as a file of
  code is one. They move with every edit, as anchors do, and nest, a block
  of code in a list item in a section. Which kinds there are is the
  modules' to say.
- **changes, from sources:** what's proposed for the document, as diffs, each
  from a source, an id the host gives it and the editor only hands back.
  Proposals themselves, with their states, rounds and authors, are the
  host's, below.
- **anchors:** where a change is, held as positions in the document that
  move with every edit, so a change stays on what it's about however the
  document around it changes, and says so when what it hung on is gone.
- **one history:** every edit, to the document or inside a change, is a
  transaction, undone and redone as one, mapped through the anchors.

Positions count code points, as doctor's do, so a host and its agent, in
any language, agree on them; UTF-16, which the DOM counts, is the view's
alone.

**marks** are the host's, or a module's: of kinds they name, with the data
each kind needs, never a set the editor fixes, as doctor's five contrasts
would be. They come two ways: stored, in the overlay, as doctor's are, for
rich text, made by commands, never typed, and carried across when the
characters under them are edited; or derived, read from the text's syntax by
a region's module, as Markdown's `**bold**` is, or a code tokenizer's
keywords, worked out each time and stored nowhere. Either way, the
projection turns them into **segments**: a line's text, flat, in order, cut
wherever anything over it begins or ends, each segment its text and the data
of everything over it, from what the host or module says each kind of mark
carries: `data-marks="bold italic"`, a link's `data-link`. The view knows no
marks: it draws each segment as one span, carrying its data, and nothing
nests, so nothing's ranked and nothing's chosen, every mark cut at every
edge alike, as Monaco draws its decorations. What a mark looks like is a
stylesheet's, from the data; what one does, a link followed, is a command,
with the mark's data, which the host acts on: a page opened, a node gone to.
Doctor's links were marks too, never syntax: its lines hold only characters.

Both are built. A text's stored marks, `marks`, lie beside its lines, each a
range and its data, `_Mark_Text_`, the data the host's, names and values the
model never reads: one mark's the same as another only where their data is,
and two the same that overlap or touch are one, so a text's marks are one
way only. Through an edit, each is kept on its characters: cut where text's
taken out, or put in, as what's typed inside a bold word is bold only where
the edit says so, its own text carrying marks of its own, as a change's
does, and outside a mark at its edges; one whose characters are all taken
out is gone. What undoes an edit gives the marks back exactly as they were,
two made one by an edit two again. A change's text has marks as the
document's has; a refusal says when one's outside it. Derived marks are a
language module's, as syntax is: the playground's Markdown module,
`module_Markdown`, says a heading's #s, the asterisks round emphasis, a code
span's backticks are markers, inside the heading, the emphasis or the code
they mark, every kind a segment's inside its `data-syntax`, and the
playground's stylesheet shows what they mark as they mark it, the markers
faint and kept as they're written, doctor's hybrid; a Markdown document
holds no stored marks, and a proposal making words bold puts in asterisks.
So which marks a text has, and how they look, is the host's and its
modules', the context's: rich text stored, Markdown read, and a host like
doctor, whose source is JSON projected as Markdown-like lines, free to do
either or both.

Still open: whether regions are only read from the text, as Markdown's are
by parsing it, or can also be held by the model, as a host marking a part of
a document would.

From the model come the questions the editor answers, without a screen:
what the document is with a source's changes applied, or with all that are
accepted; whether a change still fits; what changed within one, words
added, changed and taken out, restyled; and, given a source's changes as
they were the round before, what a round changed since.

## proposals and changes

Two layers, kept apart, so the editor's model isn't tangled with any host's:

- **the host's proposals:** what they mean, how they're grouped, their
  rounds, states and authors, and what accepting one does. Doctor has its
  own, `_Proposal_Task_`, its text changed by `WRITE` and styled by `STYLE`,
  each a dimension of its own; another host would have others.
- **an adapter,** the host's code: its proposals turned into the editor's
  changes, each tagged with the proposal it's from, and the editor's events,
  a change edited, a decision asked for, turned back into its proposals'.
  Doctor's would apply a proposal's `WRITE` and `STYLE` to what they hold,
  and send each span's next state, text and overlay together.
- **the editor's changes:** what it shows, edits inside, and reports on, per
  source. It decides nothing of what a proposal means: asked to accept, it
  tells the host, which sends the document as it now is.

```ts
// the model: the document, and what each source proposes for it; plain
// data, never changed, a transaction leaving a new one
interface _Model_TextEditor_ {
  document: _Text_Model_
  proposed: Array<_Changes_Source_>
}

// a text, the document's or what a change proposes: one line at least,
// each proven to hold no line break; and its marks, an overlay, as few as
// they can be, none two the same that overlap or touch
interface _Text_Model_ {
  lines: _NonEmpty_<_Text_Line_NonTerminated_>
  marks: Array<_Mark_Text_>
}

// a range of a text and the data marking it, the host's, never read
interface _Mark_Text_ {
  range: _Range_Text_
  data: _Data_Mark_
}

interface _Data_Mark_ {
  [name: string]: string
}

// what one source proposes: its changes, in the document's order, none
// overlapping another of its own
interface _Changes_Source_ {
  source: string
  changes: _NonEmpty_<_Change_>
}

type _Change_ = _REPLACE_Change_ | _MOVE_Change_

// what every change has: its span of the document
interface __BASE_Change_<Kind extends string> {
  kind: Kind
  range: _Range_Text_
}

// a span and the whole of what it becomes, as the host gives it: an empty
// span puts text in; one taken out becomes one empty line, as "" parses
// to one
interface _REPLACE_Change_ extends __BASE_Change_<"REPLACE"> {
  next: _Text_Model_
}

// a span taken from where it is and put, as it is, at another position
interface _MOVE_Change_ extends __BASE_Change_<"MOVE"> {
  at: _Position_Text_
}

interface _Range_Text_ {
  from: _Position_Text_
  to: _Position_Text_
}

// a line's index, from 0, and a code point's offset in it
interface _Position_Text_ {
  line: number
  offset: number
}

// which text: the document's, or what one change proposes, by its source
// and its index among that source's changes
type _Id_Text_ = _DOCUMENT_Id_Text_ | _CHANGE_Id_Text_

interface __BASE_Id_Text_<Kind extends string> {
  kind: Kind
}

interface _DOCUMENT_Id_Text_ extends __BASE_Id_Text_<"DOCUMENT"> {}

interface _CHANGE_Id_Text_ extends __BASE_Id_Text_<"CHANGE"> {
  source: string
  index: number
}

// an edit, done and undone as one: its steps, in order, each on the model
// the one before leaves
interface _Transaction_Model_ {
  steps: _NonEmpty_<_Step_Transaction_>
}

type _Step_Transaction_ =
  | _TEXT_Step_Transaction_
  | _CHANGE_Step_Transaction_

interface __BASE_Step_Transaction_<Kind extends string> {
  kind: Kind
}

// a span of one text and what it becomes; on the document's, every
// change's span, and where each move goes, carried through it
interface _TEXT_Step_Transaction_ extends __BASE_Step_Transaction_<"TEXT"> {
  id_Text: _Id_Text_
  range: _Range_Text_
  next: _Text_Model_
}

// one change set as given, by its source and its index among that source's
// changes: in what undoes taking text out, each change with a span or a
// point there put back where it was
interface _CHANGE_Step_Transaction_
  extends __BASE_Step_Transaction_<"CHANGE"> {
  source: string
  index: number
  change: _Change_
}
```

Written, as `source/editor/Model_TextEditor.ts`, moved to
`source/documents/` with the documents part (2026-11-24), tested without a
screen in `tests/Model_TextEditor.test.ts`, the host's changes given as
`_Changes_Host_`, each text one string, as it writes it. It was sketched
once before, as `source/Model_Editor.ts`, and taken back out: the view's
scenes came first, written by hand as what's shown, as turning a document
and its changes into what's shown is what settles these types. The scenes
and the example are drawn now, and this is settled against them: what the
example's frames hold, a thread's places in three frames, one inside
another's removal, one carried in a move, three sources on one line.

- **a change is the host's, kept as it's given:** a span and the whole of
  what it becomes, as the agent quoted it and wrote it, a word to a
  function. What changed within it is never written down: it's derived,
  by `comparisonOf__Texts`, doctor's `compareTexts` brought over, the text
  cut into words, runs of spaces and other characters, the two compared
  word by word: which are kept and which changed, no more. What a change
  means, words removed, inserted, replaced or restyled, is a reading's,
  the host's to choose, below. How fine is a region's kind's, once there
  are regions: words for prose, tokens for code. So the two never disagree, an agent's slip shows
  as a change, and what a round changed is the same comparison, of two
  rounds. Cutting changes down to the words that differ was the other way:
  a smaller model, but a function the agent sent as one would go back to
  the host in pieces, and what's typed on the lines as proposed between two
  of its words would be no one's.
- **every character's in one text:** the document's, or what one change
  proposes, `_Id_Text_`; the caret's in one, each end of a selection's in
  one, what's drawn between them in one section selected whatever texts it
  crosses, and a step edits one, so what's typed over a selection that crosses texts is
  narrowed or refused, as editing decides, not the selection. On a frame's lines as proposed, a character's in the
  innermost change whose text holds it, or, where none does, the document's,
  shown there as it is. Typing in a change's text edits the proposal, kept
  inside it, its next round written by you, as doctor's edited round is.
  What a pending or accepted proposal's span holds on the lines as they are,
  what it takes out, replaces or moves, at both ends of a move, is locked,
  as doctor locks it: you edit its text instead, or decide it, or reopen it,
  first. So an edit to the document only ever moves a span along, never cuts
  into one, and a change loses what it hung on only by what the host sends.
  The lock's the pipeline's, as it goes by the proposals' states, which are
  the host's; the model's spans are what it's drawn from.
- **you edit what you see, one rule, no mode:** where a line's shown once,
  it's the document's, and an edit changes the document; where it's shown
  twice, as it is and as proposed, in a frame, you're editing what's
  proposed, so an edit's a proposal, a change of yours, or a proposal's own
  words edited in it, never the lines as they are. A frame's no border
  drawn at random: it's where a line's shown twice. Decided on 2026-11-18,
  as a first pass, over a suggesting mode, a host's switch making every
  edit a proposal, as doctor's `experiment/manual-proposals` designed it,
  everything edited while a task's active the task's: modes are what a
  model not yet found leaves to a switch. Why this one holds: that design's
  worry, an edit breaking a proposal made against an older version, can't
  happen here, as all a proposal touches is in a frame, and its spans move
  with the document's edits; nothing opens under the caret as it types, a
  frame where a plain line was, which that design held the line purple
  against; and what's left of it, the file kept at the trunk till a task's
  applied, your edits going with the task, is where the host keeps what's
  typed, which it's told of, every edit, by observers, not how it's typed.
  What it gives up: what you type outside frames isn't reviewed beside the
  agent's proposals; if that turns out to matter, it's looked at again.
- **spans, not lines:** a span is any range, a phrase in a long line of
  prose, a sentence, lines. A line is a granularity a host can choose:
  doctor's adapter would send a span for each line it changes, as its holders
  are lines; another host, a sentence. The editor assumes nothing.
- **one source, many changes:** what's decided together is one source;
  what's decided apart, two. The editor needs no groups of its own.
- **moves:** a change of their own, as doctor's `MOVE` is, never only a
  removal and an insertion, which loses what moved, and shows what another
  source changes in it as all new. What a move is, within a line, from line
  to line within what's shown together, or out to somewhere else in the
  document, follows from where its ends are, and isn't stored; one that
  splits is several moves of one source. Text is text: a move is text taken
  from one place and put in another, as it was, whatever it is, words, a
  line, lines, a blank line, wherever the two places are; what's between or
  round it that doesn't move, as an operator between two operands swapped,
  stays as it was, neither moved nor taken out and put in. A source that
  moves holds only moves: what else changes in what it moves, a rename on
  the way, is another source's, decided apart, applying wherever the text
  ends up, so the two decisions, where text is and what it says, are never
  tied. An agent sending a line as it becomes, a replacement, says nothing
  of moves: the comparison that derives what changed within a span derives
  them there too, text the same at both ends, in another place, and splits
  what it finds into a source that moves and one that changes, each its own.
  Moves of whole lines, and within a line, first; splits, after. To begin
  with, a move's only the host's, a `MOVE` it gives; found by the comparison
  after. Whole lines moved to a line's start or end keep their lines whole:
  the line break they bring goes to the side that keeps them so, as the
  document's last line, which has to take the break before it, put first
  needs its break after it, and the first line, taking the break after it,
  put last, its break before it; `landedOf__Move` says what a move puts
  down.
- **nested, never crossing:** a source's change may lie wholly inside
  another source's span. Where the outer one removes or replaces what the
  inner's on, the inner's its fallback there, applying only if the outer's
  rejected, `WITHIN`; where the outer keeps it, as a function the agent
  sent whole keeps most of its words, the inner applies there too, carried
  into the outer's text by the comparison; inside a move, it goes where
  the move goes, `CARRIED`. Decided in any order, they come to the same:
  both taken, the outer's text replaces the span, and the inner, carried
  through the comparison, survives where its words were kept and is
  dropped where they were taken out, as a position says when what it hung
  on is gone; the outer rejected, the inner applies; the inner taken
  first, the outer's span carries through it. Spans that cross, neither
  inside the other, are refused when the model's parsed, and why, for the
  agent to resolve or the host to split, never the editor.
- **positions are numbers, not proofs:** a line's index and a code point's
  offset, checked when the model's parsed and kept good by carrying them
  through every step, as a proof can't say which text, or which version of
  it, a position's good in. Positions count code points, as doctor's do, so
  a host and its agent, in any language, agree on them; UTF-16, which the
  DOM counts, is the view's alone. Anchors aren't things of their own:
  they're positions, a change's span, where a move goes, the caret, carried
  through each step.
- **one history, of the edits you make:** each a transaction, undone and
  redone as one, by the transaction that undoes it, which the model works
  out as it applies one. The history itself is the editor's state, held with
  the pipeline. What the host sends, a source's next round, a decision
  taken, is a new model, and for now clears it; carrying the history through
  what the host sends, so undo survives an agent's round, comes after. What
  undoes a transaction gives back the model it was applied to exactly, and
  what undoes that, the model the transaction left. Taking text out carries
  a point at its end, where a change puts text in, to where it began, where
  it can't be told from a point that was there already, as positions alone
  can't say which was which; so what undoes it puts the text back, `TEXT`,
  then each change with a span or a point there where it was, `CHANGE`,
  worked out as the text's taken out, while where each was is still known.
  Carried through what the host sends, later, those positions are carried as
  any are.
- **moved over from the view model:** `_Text_Line_NonTerminated_`, its
  parser `parseTexts_Line`, `REGEXP_LINEBREAK`, `_NonEmpty_` and
  `mapped__NonEmpty`, as the model can't depend on the view; the view model
  imports them from it.
- **not yet:** regions; moves found by the
  comparison, and moves that split; your edits made proposals; changes
  from different sources overlapping, besides nesting.

Its functions, each tested without a screen:

- `parseModel_TextEditor`: the host's document and changes, each text as it
  writes it, one string, checked, proven and made a model, `PARSED`, or
  `REFUSED`, each refusal its source and why: a span outside the document,
  or ending before it starts; a source's changes overlapping; two sources'
  crossing.
- `applied__Transaction`: the model a transaction leaves, and the
  transaction that undoes it.
- `carried__Position`: a position carried through a step, staying before
  what's put in at it, or after, as asked: a change's span keeps out what's
  typed at its edges; the caret goes after what it types.
- `textWith__Sources`: the document as it would be with some sources'
  changes applied: a frame's lines as proposed, with all its sources'; the
  document as decided, with those accepted.
- `comparisonOf__Texts`: what changed from one text to another, by lines
  first, then words: lines kept as they are kept; in what changed between
  them, each line paired with the line it became most alike, by the words
  they share, spaces aside, if they share half their words or more, and the
  pair's words compared, doctor's way, the text cut into words, runs of
  spaces and other characters, compared by Myers' algorithm; a line
  nothing's alike enough to, taken out or put in whole. Words alone,
  compared across lines, an agent's function sent whole came out wrong, a
  line's words matched with another line's, `return` replaced by `const`
  where a line was put in above. Past 2,000 differing words, taken as one
  replacement; past 2,500 lines to pair, lines unpaired. Every character's
  in one run, `KEPT` or `CHANGED`, so a change inside another's span can
  be carried through it exactly, a kept word carrying what's inside it
  whatever its marks; marks aren't compared, as what a difference in them
  means is a reading's. What's drawn leaves out spaces at a change's ends,
  as doctor does, which is the projection's.
- `piecesWith__Sources`: the document, or a range of it, as it would be with
  some sources' changes applied, as pieces, each the document's text, saying
  where in the document it's from, wherever a move puts it, or a change's,
  saying which change and where in its text; `textWith__Sources` their text,
  run together. Each piece a move puts down says which move, `move`, the
  changes it carries inside it too. A change that puts in nothing leaves an
  empty piece where it would, so where a removal went is known. The
  projection draws the lines as proposed from them, each ring from the piece
  it's in, each notch at its empty piece.

The projection, as `source/editor/Projection_TextEditor.ts`: `viewModelOf__Model`,
from the model, what the host says of each source, `_Proposal_Host_`, its
title, state, words and actions, the ranges it asks to frame, and the
language module, the view model the view draws now. Its frames are the lines
changes touch, a span ending at a line's start not touching that line, and a
point between lines, where whole lines are put in, touching none; run
together where they share a line, never back to back, the host's ranges
joining the frames they share a line with. Lines put in belong to the line
they were put in at, typed at its start or its end: a frame holding that
line takes them, so Enter at a frame's first line's start, or its last
line's end, grows the frame where it was pressed; lines put in by a line no
frame holds are a frame of their own, named for that line, as no other
frame can start on it. Once, lines put in just before a frame the changes
made were a frame of their own, named as that frame was, two runs sharing a
name, the caret lost between them. Each frame's lines as they are,
numbered, its lines as proposed, from the pieces, signed, each line's syntax
the language module's, as proposed in the document the proposals would
leave; the rings, each a box the reading makes of a change, on the lines
as they are where it covers something there, on those proposed where it
covers something there, its two sides one place, `data-place`, numbered
through the frames by source; and its list, each item's places counted. A
ring's `data-change` is the reading's word for its box; `data-side`,
`data-source`, `data-place` are the editor's, as only it works them out; the playground's own, in `playground/looks.ts`, are for Everything,
the view's own scene, its view model written by hand, as what it tests is
the view. A frame's text runs through the line break after its
last line, unless it's the document's last, so taking out its lines whole
leaves it none, and its lines as proposed are none. A change inside
another's span is the other's fallback where the other takes its words out
or replaces them: its words carry it as `data-nested-change` and
`data-nested-source`, the other's on them as they are, its ring
`data-within`, and its item a condition, `WITHIN`, the other's title with
it; where the other keeps its words, it's no condition, in the other's text
as proposed, ringed as its own. Each removal has its other side on the lines
as proposed, a notch, `POINT` or `BOUNDARY`, at the place the model's pieces
say its text went, the empty piece a change that puts in nothing leaves;
between lines where it takes whole lines, nothing but spaces round it on its
first line and its last, after the line its text began on if it begins with
a line break, or before it; none where the lines as proposed are none, nor
for one inside another's removal. A run of nothing but line breaks, a blank
line taken out, has no ring, and so no notch: there are no words to ring,
and its gutter says it. A blank line's gutter says it's taken out, or put
in, by its own line break, the one after it, or before it at the document's
end. Moves: each change has an end where its span is, and a move another
where it lands; frames are made of ends, so a move's two ends can be in two
frames, or one. A span that begins with the line break after a line with
words in it doesn't touch that line, so a move of the document's last lines
frames them alone. Where whole lines land between two lines, put in or
moved, the end's a point, a frame of its own with no lines as they are,
`range` its last line the one before its first; a host's range takes a point
on its top edge, before its first line, as it frames what lands there. Moved
text is ringed `moved` at both its ends, numbered where it leaves and signed
→ where it lands, a blank line it takes along said in the gutter; a move of
whole lines has a note at each end, on its first line with words, `moved`
where it leaves, `from line` and its lines where it lands, and its item says
which lines and which way, `MOVE`; a move within a line has neither, its
item counting its places. A change inside what a move carries goes with it,
at both ends: its words carry it as `data-edit-change` and
`data-edit-source`, the move's on them as theirs, its ring `data-carried`,
and its item a condition, `CARRIED`, the move's title with it; what's taken
out of what a move carries has no notch, as where it was is at the move's
other end. In threA decided proposal is listed where its changes are, as any
is: an accepted one's words are the document's, its change given as what's
there already, so there's nothing to ring; a rejected or withdrawn one's
change is neither ringed nor applied on the lines as proposed, and nothing
inside what it would have taken out is its fallback. In four pieces,
replacements, removals and nesting, moves, then the playground's pages: the
JavaScript example, the two scenes of code with proposals, and 34 of the
changes document's 37 cases are drawn from a document and its changes, as an
agent would write them, the example's host framing its three functions; and
each is what was drawn by hand, run ids and place numbers aside, as names,
kept as snapshots, `tests/__snapshots__/Projection_TextEditor.test.ts.snap`,
taken of the hand-drawn view models before the projection replaced them, so
it's checked against them for good. Each snapshot is text, every field of a
view model, a line for each line drawn, its gutter, its note and its
segments' words and data, then its rings, then its list, run ids and places
numbered as they come; a field the text doesn't know fails the test, so
nothing's left out unseen, and the runs a view model lists beside its blocks
are checked to be the runs in them. As JSON, a view model's every field over
many lines, the runs twice, they were 1.1 MB, every change to the view
model's shape rewriting all of them; as text, 132 KB, a change to it the
lines it changes. On the way, two cases drawn by hand were a word short, the
word a replacement takes out not ringed where it is, now ringed; one, a ring
over several lines, whose words, half kept, no longer made one ring by the
comparison, was given a line with nothing kept; two, a removal right after a
replaced word, have their notch after the replacement's ring, where the
words taken out were, where the hand-drawn cases' stand-in put it before,
counting only the text left unchanged; and two whose removals begin with the
line break after a line with words in it frame that line by a host's range,
as they were drawn. The example's revision of isRetryable, sent whole once,
is two changes now, as a move inside another's change waits. With marks in
the model, the last three were drawn from it too, each as it was drawn by
hand: the two cases whose words are restyled, and the prose scene with
proposals, a stored mark drawn as its data on the words it's over, the
document's on the lines as they are, a change's on the lines as proposed,
where its text lands. The playground's stand-in for the projection went with
them; what's left of `playground/lines.ts` writes a view model's lines by
hand, for the scenes with no proposals, and for Everything, the view's own
scene, which the browser tests draw, written by hand as it tests the view,
boxes no change makes among it. A Markdown example, `?example=markdown`, is
drawn from the start from a document and its changes: the JavaScript
example's module's README, ten proposals keeping it in step with the
module's, kept as a snapshot once it was looked over. The editor projects
now, given the model, as the examples give it; the changes document's cases
and the gallery's scenes, which show what's drawn, are view models, made
with `playground/projected.ts`, drawn by the viewer as they're given.

Where an agent writes the changes, as doctor's does, it writes them as
agents write edits reliably: the text as it is, quoted exactly, and what it
becomes, in full, small, a sentence to a function; never a line number or an
offset, which they get wrong. The quote is found where it matches once, or
the change is refused, and why, not found, or found twice, as `str_replace`
does; then turned into changes. Asked for granular changes, agents do worst;
asked for whole files, they're slow, and leave parts out, or change what
they weren't asked to. The parser for it is the host's, or one the editor
offers it.

## proposals' states

A proposal is in one of six **states**, where it stands in its decision, and
nothing else; each its own, never one state standing for two:

- **open:** waiting for your decision, on its latest round;
- **requested:** a revision asked for, your notes sent, the agent not yet at
  it;
- **revising:** the agent at it, its next round coming;
- **accepted:** decided for, to be applied to the document; when, is the
  host's, perhaps once the whole task's proposals are settled, the editor
  drawing what it's given, an accepted change not yet applied ringed as
  any, one applied nothing left to ring;
- **rejected:** never confirmed, and without a reason, though one may be
  given, later, if you choose;
- **withdrawn:** taken back by the agent, as when a newer proposal
  supersedes it.

The agent proposes, opening one; picks a requested one up, revising it;
answers with its next round, opening it again; and withdraws one open,
requested or revising. You accept an open one, reject it, ask for its
revision, or edit it, a round by you, still open; and **reopen** one
requested, accepted or rejected, the one way back to open. A requested one
is never accepted, rejected or edited as it is: its request is walked back
first, reopened, so what you sent and what you do don't cross; and an
accepted one is reopened only while it still fits.

What else there is to know of one is worked out, never a state: whether it
still fits the document, after what's been accepted, or can't be accepted
till it's revised; whether it's moot, its places gone with an accepted
removal, or how many are; whether its latest round is yours; whether you've
notes on it not yet sent, a draft, yours till they're sent; and what its
latest round changed since the one before.

Decisions are a proposal's, never part of one: what can be decided apart
already is apart, as a move and the rename it carries are; decisions meet
only through what they touch, a removal accepted mooting what's nested in
it, rejected letting it apply. The states are the host's, as doctor's are,
`proposed`, `revising`, `accepted`, `rejected` and `withdrawn`, doctor's
`revising` the two waiting ones here; the editor shows each and asks for its
transitions, an item's actions as the host gives them for its state.

The six are the editor's, built in, for every host: one lifecycle, which
looks, components and hosts can rely on, a host's own workflow mapped onto
it, its words for each in `status`. Settled in talking it over:

- **one decider:** a proposal has one decision; several reviewers, a vote,
  "approved by 1 of 2", are out of scope, a host free to say so in its
  status words, the editor never knowing.
- **no deciding part of one:** there's no accepting part of a proposal, and
  no locking parts of it while others change. What can be decided apart is
  proposed apart; keeping some of a proposal and changing the rest is the
  reviser's to take care with, the agent's, or yours editing it inline.
- **notes on what's selected:** what the editor gives the reviser, once
  there's selection: a request's notes, each on a stretch you've selected,
  of the proposal's text or of what it replaces, "keep this", "change
  this", sent with the request for the next round. Each is carried to the
  next round through the comparison of the two rounds, so the next round
  shows which were met; its words gone, it says so. The interface for it is
  the work, after editing and selection.
- **relations:** besides the ones worked out from where changes are, a
  change within another's removal or replacement its fallback, one inside a
  move carried with it, one inside another's kept words applied there,
  **alternatives** are next: two proposals for the same span, two ways to
  say it, refused now, "the same span as", excluding each other, accepting
  one settling the others. Relations no span shows, one proposal depending
  on another, as a rename's uses on its definition, would be the agent's to
  declare: not now. One that supersedes another withdraws it, as above.

How each shows: an item says its state, `state`, one of the six as a kind,
`OPEN`, `REQUESTED`, `REVISING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, and
what to call it, `status`, the host's words, as its actions are, drawn as a
word after its title, "· Revision requested", "· Revising", "· Accepted",
none for an open one; what you asked of a requested or revising one,
`requests`, each your words alone, the words it's on quoted before them,
under its words as a quote, a rule beside them and "Requests" over them,
bold, the editor's, in its state's ink, so they're yours, not the agent's,
first headed "You asked", then "Revision requests", renamed 2026-11-18 as
they became a list; a list, `Request$_Item__Html`, a bullet in that ink before each and a
little room between them, so where one ends and the next begins is seen
however many lines each wraps to, each with Remove after it while it's
queued; and its actions, the host's for its
state, as the playground's are its review actions while revisions are
queued, Reopen alone for one accepted or rejected, none while it's revised, and Dismiss alone once it's withdrawn, the agent's to
take back, not yours, so nothing left of it to reopen, only to clear from
the list, an open one's first the main one, no other's, filled in the
proposals' indigo, its words white, the others on their grey, their words
the colour of the state each leads to, outlined once, too heavy a column of
them down a long list, an action saying which, `stateAfter`, rejecting
indigo, revising plum, so a button says where it takes the proposal, and
they're still plainly buttons, ringed in it when the keyboard's on one; one
with revisions queued waiting on you as an open one is, its actions in their
colours too, Revise plum still, as asked on 2026-11-18, none of them the
main one, as what's next is yours to choose; once it's waiting on the
agent, or on no one, its actions neutral, there but not asked for, the
colour on its row its state's alone. Beside
each, in the gutter's column of numbers, as a line's number is beside its
line, an icon for where it stands: a check, accepted; a cross, rejected; an
arc going round, being revised, still where motion's reduced; an arrow
turning back, a revision requested; a circle struck through, withdrawn; none
for an open one, whose actions are what's to do. So what's been acted on,
and how it came out, is seen by its shape, its icon and its status word in
the proposals' own colour, an indigo, `--view-proposals-accent`, where
you've decided it, accepted or rejected, or their plum,
`--view-revision-accent`, where it's still going back and forth with the
agent, a revision requested or under way, redder than the indigo, plainly
another colour beside it, bluer than the rings' red for removed, tried after
a teal, which bothered, or a grey, the grey of where an item is, lighter
than its words, where the agent's withdrawn it, nothing of yours to colour,
its icon fainter than its word, three quarters as strong, as a grey shape
weighs more than a grey word, so where it stands is found at a glance, read
before the item's words, and nothing says good or bad: a hue the rings never
use, green, red, yellow and brown each keeping its one meaning there, nor
the syntax, between its blue and its violet, saturated enough to read as
live, as a slate blue, greyed, read as disabled; yours, once it's built, to
be told some other way than a purple, the indigo and the plum either side of
one, each state told by its icon's shape; a host's own colour for a state if
it gives one, `--view-state-accepted` and the rest. A revising one's status
word has three dots after it, the view's, the host's word without them,
always there, brightening in turn, a wave along them, a third of a pass
apart, as its arc goes round once a wave, one rhythm, the word itself still,
and the dot between its title and its state, the title's; tried before, a
streak across word and dots, the dots stepping one, two, three, the arc at
another pace, was three motions at two paces, too busy. Still where motion's
reduced, the three dots all there. `viewModelOf__Blocks` puts each
proposal's state, its item's, on its groups and its words, `data-state`, for
a look to show, and keeps each item where the host lists it, whatever
its state, so deciding one never moves it, as moving it once did, decided
ones after the rest; their titles and words the same as any other's,
whatever their state, told apart by their icons and their status words. The "changes" look fades a revising one's rings and the
words it proposes, breathing, as doctor's revised lines pulsed, still where
motion's asked to be reduced. An accepted one the host's applied has its
words the document's, so there's nothing left to ring, and nothing marks the lines they're on: a
check by their numbers was tried, and dropped, the gutter left to its
numbers and its signs. A rejected or withdrawn one's change is gone from the
lines proposed, the projection leaving it out. Still to come: a frame whose
proposals are all decided folding itself, the document's lines then,
numbered again, a faint bar beside them, its handle to unfold it and reopen
what's in it; and pointing at an accepted one lighting the lines it changed.
An action pressed is asked of the host, its command, which carries it out
and sends back what it now has; the playground's host takes each at once.
The JavaScript example has a proposal in every state.

## how it shows them

As a document editor's suggesting mode does, a change's own words are **in
the document**, as real content you edit, marked; what it replaces is shown
beside them, read-only. So:

- what's added reads in place, green, and is edited where it is;
- what's changed in place shows its new words, with the old ones beside;
- what's taken out shows where it was, ringed, never struck, a strike being
  a document's own mark;
- **places:** a change of a proposal is a place, as an item counts them, and
  its two sides, what it was and what it becomes, are one place: its rings
  carry it, `data-place`, the same on both, so pointing at one side points
  at the other too. The projection says it, knowing what each change was
  and became: each box the reading makes of a change a place, both its
  sides, numbered through the frames by source; a move's, the move.
- what's moved shows at both its ends: within a line, both in it; within
  what's shown together, linked in the margin; out to somewhere else, a mark
  where it leaves, "moved", and where it lands, "from line 12", each going
  to the other, as doctor's do. Drawn: a change of its own kind,
  `moved`, its two ends its two sides, "before" where it leaves, "after"
  where it lands, ringed brown, as doctor's moves are, neither lost nor new
  but both, in the dark doctor's own, its red and green mixed, darkened, in
  the light a lighter tan, as that's too dark there, near the text's ink and
  the syntax's browns; its lines numbered brown where it leaves, signed →
  where it lands; each end's first line with words has a note, a line's
  `note`, its label and its target, a change's side by its proposal, which
  the view draws after its text as a button holding no text, its label its
  `aria-label`, drawn by CSS, so nothing that reads or measures the text
  meets it; pointed at, it marks the other end's rings, heavier, so either
  end shows its counterpart; pressed, it goes there. Where it leaves, it
  says only "moved", as VS Code says "Code moved to", without the line: the
  line it goes to means little to a reader, and needn't hold once other
  proposals are decided; where it lands, only where it's from, "from lines
  41–50", the document's lines as they are, numbered in the frame it leaves;
  its item, at both ends, which lines and which way, "moves lines 41–50 up".
  What another proposal changes in what it carries, a segment's
  `data-edit-change` and `data-edit-source`, is that proposal's, decided
  apart, applying wherever the words end up: so it shows at both ends, a
  ring inside the move's, at full strength, not a fallback, saying whose
  move carries it, `data-carried`; pointed at, it lights its own proposal,
  not the move; its item, in both frames, says its places are in what the
  move moves, "2 places · 2 in what Move sleep up, beside the delays it
  waits out moves", the move's title a chip, counted once. A blank line is
  text like any: one that goes with what moves is moved, its number brown
  where it leaves, → where it lands, saying so only in its gutter, having no
  words to ring; sleep takes the one before it, so each gap stays one line.
  It lands in a frame that's a point, before a line, with nothing as it is
  there. Within a line, both its ends are in the line's frame, where it
  leaves on the line as it is, where it lands on the line as proposed, so it
  needs no notes; what doesn't move stays as it was, the `||` between two
  operands swapped unringed; the line's changed in place, its gutter yellow
  and `~`, its rings saying which words moved. Declared, a host's
  `MOVE`, as the comparison finds no moves yet. Not yet: the link in the margin
  between two ends shown together, and a move split in pieces.

**every proposal shown at once:** all of them, each change styled as what it
is, word by word, none hidden behind or put aside for another. Which
proposal a change is from isn't its colour, which keeps its meaning; it's
shown by pointing: at a change, or at its item, its proposal's rings
heavier, its items lit, in every frame it's in, the others still showing;
the keyboard moving from change to change will do the same, the one it's on
current.

**overlays and perspectives:** what a run of text is, and how it looks, kept
apart, so how it looks can be changed, and refined in a context, without
the document or its changes changing:

- **an overlay** is a layer of runs over the document's text, the host's or
  a module's, each run saying what it is, never how it looks: the changes, a
  proposal's; a tokenizer's syntax; spelling; whatever a host marks out.
  Several can lie over the same text; the projection cuts a line's text into
  segments wherever any overlay's runs begin or end, each carrying the data
  of every run over it, from every layer. For now that's
  `segmentsOf__Stretches`, a line's text and the stretches of it runs
  cover, `_Stretch_Line_`; where two give the same attribute, its value is
  their words together, once each, as a stylesheet finds with `~=`, as
  marks are.
- **syntax** is an overlay like any other: a language's module gives each
  stretch of code what it is, `data-syntax`, a keyword, a string, a
  comment, and a host's stylesheet, its theme, colours it. It's worked out a
  line at a time, each line from the state the one before it left, inside a
  block comment, a template literal, a substitution in one, so a change
  works out its own line again, and the lines after it only until one
  starts as it did before; a line needs every line above it worked out,
  but none below, so lines past the screen wait until they're drawn. The
  seam is the editor's, `_Module_Language_`: a state to start from,
  `state_Start`, its own and never looked into, and
  `syntaxOf__Line({ text, state_Before })`, giving a line's stretches and
  `state_After`, a new one, never the one it was given, changed. The
  editor drives it, for now in `parseLines_ViewModel`, a line at a time,
  each from the state the one before left, and cuts each line at its
  stretches; a host only chooses the module. Plain text is a module too,
  `MODULE_PLAINTEXT`, marking nothing, passed as any other is, nothing
  falling back to it. The playground's JavaScript tokenizer,
  `module_JavaScript` in `playground/syntax.ts`, stands in for a real
  one, its example, `?example=javascript`, drawn with it; and its
  Markdown, `module_Markdown`, its example `?example=markdown`, whose
  marks are its syntax, handing a fence's lines that say they're js to the
  JavaScript module, its state carried inside its own: modules compose as
  a host composes them, the editor driving only the outer one.
- **drawn two ways:** an overlay's runs are on the text, or under it.
  - **on the text:** a run is only data on the segments it covers, each a
    flat span: no element is a run, so no run stays whole, and none is
    ranked over another; overlapping runs are no matter. What reads as
    continuous across spans, colour, background, underline, strike, a
    look draws from the data. What has edges, a box, a ring, round
    corners, would break at every span, so it's drawn under the text. A
    span has room for one role, so what a change means isn't told by the
    text's markup: the proposals' list, and a line's description, say it.
  - **under it:** each run a text underlay, a stretch of text from one
    position to another, with data as a segment has, drawn behind the text
    it covers. It never moves the text, and nothing in it depends on how
    the text's cut into segments or drawn in spans: text underlays overlap
    freely, and draw what a span can't, as doctor's change boxes in the
    document were Monaco's decorations behind the text. Events pass through
    them, but what's pointed at is the ring: anywhere in its area, closed
    whatever sides the ring leaves open, a path of its own drawn under it,
    `area_htmlView`; between its rows too, over no word; the innermost where
    one's inside another, as far as it reaches.
  - **one `<svg>` for each run of lines:** text is drawn in runs of lines:
    the unframed lines between frames, and a frame's `CURRENT_LINES` and
    `PROPOSAL_LINES`, each drawn by the same component wherever it is, with
    one `<svg>` behind its lines; a frame's list has none. A run's svg holds
    everything behind its text, in one order: search's matches, then the
    proposals' changes, then the selection, on top. In the run, its own
    stacking context, the svg's over its lines' backgrounds, as a band a
    look might give a line, and under their text: the svg at
    `z-index: 0`, the text at 1; a section's background is under all of it.
    Each underlay is one `<path>`, tracing every row it covers, wrapped or
    across lines, as one shape, so a fill or an edge goes round all of it,
    with no lines between its rows; and SVG's paint gives changes more than
    colour to be told apart by, a stroke following the shape, dashed, a
    pattern's fill. A shape has room round its words as a look says,
    read from the run's svg when it's measured: short of its rows' top and
    bottom by `--view-underlay-inset-block`, as the room between lines is
    all there is above and below; and past its words' ends by
    `--view-underlay-inset-inline` below zero, but only into free space,
    measured, from its words to the nearest character that shows beyond them
    on the row, less `--view-underlay-clear-inline`, so never into another
    character, short of them above zero; and never nearer a shape beside it
    on its row than twice the block inset, the two sharing what's between
    them; and one inside another's stretch, worked out from their positions,
    inside it, further from its rows' top and bottom by
    `--view-underlay-nest` for each ring it's inside, twice the block inset
    given none, the "changes" look's 3px at 14px; and where it starts
    or ends with its container, it keeps its own reach past its words, its
    container reaching the nest further, the room made at that end for both,
    so a nested ring is the nest inside its container on every side they
    share, and the two don't meet even as one's drawn heavier, pointed at. So rings, on lines one over another or side by side, never
    meet, and a nested change's sits inside the removal's or the move's.
    Where a change's end presses on another character, as code's tokens do
    on its punctuation, `(n)`, `n++`, `error;`, there's
    too little free space, so the view works out the room it lacks: what its
    ring's reach and clearance take, or, where another change starts there,
    both rings' reach and the gap between them, less the space their glyphs
    leave, measured; it gives that to the element at that edge, the span
    ending or starting there, as `--view-room-inline-end` or `-start`,
    clearing what it gave before, each time it measures; and a look
    makes the room, padding it, the text after it moved along, or doesn't;
    the view then measures what it made, as it measures any space. Where a
    change's end isn't also an element's, in the middle of a span, it can't
    give room; the projection cuts spans at every change's ends. Ends and
    free space are measured by ink, where a glyph is drawn, not by the cell
    a font gives a character: in a monospace font, a comma's ink is a sliver
    1px into its cell, a y's spills past it, so by cells an end beside a
    comma looked further off than one beside a y; the view measures a
    glyph's ink with a canvas, in its span's font, once for each font and
    character. A side with no room for its line, no free space beyond the
    clearance, is left open, its top and bottom running to the change's end.
    The lengths are in any unit; the view's stylesheet resolves them on the
    run's svg, into registered lengths, where the font is the view's, so a
    length in ems is its font's, and the view reads them as pixels. The
    "changes" look makes every end the same: past its word's ink,
    into a space or into room made, as an end that differs by what's beside
    it reads as better or worse; at a 14px font, 3px past, 3px clear of its
    neighbour's, 1px short of the rows above and below, settled on by
    dragging each, and the font size, on controls over the JavaScript
    example, since taken away; given in ems, `calc(-3em / 14)`, so at any
    other size they keep to the font as they do at 14px; fixed in pixels,
    they looked right near 14px and drifted from it further off; and the
    room the view works out, so a pressed end is as any other. Fixed room,
    4px everywhere, put the rings 2.8px from some neighbours and 5.8px from
    others, by what their glyphs already left; none put some 0.8px past
    their words and left others' sides open. Doctor reached 3px past every
    end, which in code ran into the next character, and made no room. Room
    moves the text after it, 2px to 5px in code at 13px, so where it's made,
    a line's columns no longer line up with the lines round it. More room
    above and below takes a taller line, `--view-line-height`.
  - **across runs:** what's in more than one run, a proposal, before in
    `CURRENT_LINES` and after in `PROPOSAL_LINES`, or the selection, which
    follows the document's order, through a frame's `CURRENT_LINES` and
    past its proposed lines and list, is a group in each run it passes
    through, each carrying its data, `data-source`, so a look styles
    it as one.
  - **a proposal's changes, and nothing for the proposal as a whole:** a
    proposal is a group, `<g data-source>`, in each of its frame's text
    runs, saying whose its changes are, and in it a path for each of its
    changes, `data-change`, its kind, without the spaces at its ends, so
    its ring is round its words alone: flat, granular changes, each still
    its proposal's. A change is drawn there, a ring round its words in the
    "changes" look, as doctor's are, never on the spans: a span keeps
    only what's the text's own, its marks and its syntax. No path is drawn
    for all a proposal covers, from its first change to its last, or over
    the whole of what an agent sent, a function whole, say, of which a
    line's middle differs, which is the model's, its span, and nothing's
    drawn from it. A path for it was tried, filled, outlined, and outlined
    only for the proposal pointed at: it reads for one proposal alone, but
    where several cover the same lines, as in a function every proposal
    touches, it stacks into patches or crosses into a maze, and says
    nothing the rings, the gutter's labels and the list don't.
  - **measured** from the view model's positions, never read back from the
    DOM, with a `Range` over the text nodes from any offset to any other, as
    the selection's ends and search's matches fall anywhere, not only where
    the text's cut into spans; once the run's drawn and in the page, from
    the run, and again whenever the view's size changes. Only the lines on
    the screen are drawn, so it's measured over a screenful, and search over
    a whole document costs what a page of it does.
  - **in the view model,** runs and frames: unframed lines one after another
    a run of their own, beside the frames, and a frame's two text sections
    runs too, each run with an id, unique in the view, its element found by
    it; text underlays a run's, not a line's, each end a line and an offset
    in it, as a stretch can cross lines.
  - **drawn so far:** runs, each one `<svg class="underlays_htmlView">`
    first in it, a `<g>` for each of its groups, a `<path>` for each
    underlay; proposals' changes, worked out by the playground as the
    projection will; the changes' colours on the paths, not the spans. A
    ring over several lines hugs them, one outline, its side stepping in and
    out with their ends: each row's ends are its character cells', but the
    change's own start and end, which are its ink's, so lines ending in one
    column end at one place, and no step is a sliver of a glyph's margin;
    and, as a look says, `--view-underlay-step`, rows with nothing
    past them whose ends are nearer than a step share one, the further out,
    as where room made in a line moves its end on by less than a character.
    The outline holds no point twice and none on the way along a side. A row
    with something past it, a character or a line's note, which shows, keeps
    its end, clear of it. Tight was first drawn wrong, every row's ends at
    its glyphs' ink wherever a glyph was there, so a side jogged a pixel
    where one line began with a glyph and the others with spaces, lines
    ending in one column stepped by a glyph's margin, and points repeated:
    it read as broken; squared to a rectangle instead, it hid where lines
    end. A path is one shape where each row it covers reaches over the one
    after it; where one doesn't, as a stretch from a line's last word to the
    next line's first, or one a wrap cuts, its end on one row and its start
    on the next, it's in pieces, still one path, each open at the cut: the
    sides there, the first piece's right and the next's left, aren't its
    ends, so they're drawn apart, a path each after it, `seam_htmlView`,
    carrying its data, for a look to draw as it will, so the pieces
    read as one; the "changes" look dashes them, as its ring,
    otherwise. Native dashing starts at a path's start and stops wherever
    its length runs out, so a side's dashes sat differently each time; the
    view reaches each side half its stroke past the ring's top and bottom,
    which end at their lines' middles, so its end dashes are flush with
    their outer edges, the corner square, and fits its dash pattern to it,
    as the look gives it, setting its `pathLength` so it holds a
    whole number of the pattern and its first dash again: a dash at each
    end, the rest even between. The measuring walks the view model's runs,
    `runs`, and finds each one's lines and svg by its id, drawn as
    `data-run`; the class keeps the runs it last drew, to measure them again
    when the view's size changes. Not yet: search, the selection, drawing
    only what's visible.
- **in the DOM, data, not style:** what a run is, is `data-*` attributes on
  the spans it covers, each overlay's under names of its own: the changes'
  `data-change`, its kind, `data-side`, `data-source`; marks' `data-marks`.
  The editor's own stylesheet is layout, rows, gutters, frames, where text
  underlays go; without a look, a change looks like the text around it.
- **a perspective** is a way to read the proposals: a reading, what each
  change means, and the looks it's shown in, named, `_Perspective_TextEditor_`.
  A host lists the perspectives it offers, the first shown first, and
  shows another with `show(perspective)`, the editor drawing the proposals
  again with its reading and setting its looks.
- **a look** is a stylesheet, keyed on the looks the perspective shown
  names, `data-look` on the view's container, a word each, as a stylesheet
  finds with `~=`, and on the runs' data; a look's module imports its
  stylesheet, so a perspective that names it brings it, nothing for a host
  to remember. Two perspectives can share a look, as the Markdown example's
  two share the editor's, reading the same changes two ways in the same
  colours. Setting the attribute restyles all of it, the browser's doing,
  the text underlays measured again, as a look can move the text, making
  room: the view watches its container's attributes, as it watches its
  size. The editor offers one, "changes", `LOOK_CHANGES`, doctor's look,
  in `source/editor/looks/changes.css`, which a perspective names or names its
  own in its place: a ring round a change's words, red
  where they go, yellow where they're replaced, green where they're new,
  dashed where only their look changes; a line in a frame saying what it
  becomes in its gutter, its label in the same colours, a number red taken
  out, yellow changed in place, a sign green put in, yellow changed, never
  with a band across its text, which doctor has, so the code stays even, and
  the gutter's where to look for which lines change. Never the text's own
  colour, a strike or an underline: those are the text's, its marks' and its
  syntax's, which show through every change. One could mute every change but
  replacements and split those by what kind of replacement each is, from a
  `data-detail`; which is on, and how it's turned on, is the host's. A
  look needing other elements, not only other styles, is drawn again from
  the overlays by another mapping: rarer, and later.
- **a reading** is what a change means, the host's to choose, as a
  look is how it looks: no kind of change is the editor's own. The
  model's comparison says only which characters are kept and which
  changed; a reading, `_Module_Reading_`, given a replacement's text as it
  was and as it becomes, marks and all, and that comparison, gives its
  boxes, each what it covers on either side and its word, which a ring and
  its words carry as `data-change`, and gives a move its word. A
  look can only style what the boxes' words tell apart, and never
  regroup them: where one box goes round `*5*` and `**5**` and another
  reading's two go round the asterisks put in, the boxes differ, not the
  look. The editor ships one, `MODULE_READING_TEXT`, in
  `source/editor/readings/text.ts`, reading a change as text, as doctor does: a
  box for each run that changed, removed, inserted or replaced, replaced
  and restyled where the words put in are marked otherwise, and for words
  kept whose marks differ, restyled; a move, moved. A host passes it, or
  its own, as it passes a language module, nothing falling back to it.
  The projection keeps only a box's shape, worked out from what it covers,
  taken out, put in or both, for what's structural: which side has a ring,
  and a line's gutter saying it's taken out or put in whole. The
  playground's Markdown reading, `module_Reading_Markdown` in
  `playground/readings.ts`, reads a change as what it means: its words
  compared, the Markdown module's markers aside, words kept whose marks
  change restyled, one box round them and every marker round them, `*5*`
  and `**5**`; words put in, taken out or replaced boxed with the markers
  that change with them; and what differs between its boxes, a change to
  the syntax alone, as `*x*` to `_x_`, boxed as text, so what's outside
  its boxes reads the same on both sides, as a property test holds it to.
  It reads each text out of the lines round it, so a change inside a fence
  of code is read as Markdown too. To come: several readings drawn at once,
  showing another only an attribute set, as a look is, however different
  their boxes; for now, showing another projects again.
- **a setup** is what a host puts together for the editor,
  `_Setup_TextEditor_`, a slot for each concern, each filled once: its
  components, `componentMap`; its modules of input, `modules`; its language
  module; and its perspectives. Nothing in it is the editor's unless the
  host names it, as `PERSPECTIVE_CHANGES`, the editor's text reading in its
  changes look, nothing falls back to anything, and nothing's overridden:
  there's no setup to start from and change, so what's in effect is what's
  written. What ships with the editor are pieces, to put in the slots, and
  pieces that only work together ship as one, a perspective its reading and
  its looks; a pack for a kind of document, as the playground's Markdown is,
  is pieces too, its language module and its perspective. The host's
  content is apart from it: `new _TextEditor_({ containerElement, setup,
  model_TextEditor, proposals, ranges_Frame })`.

**frames:** a range of the document's lines, taken out of the flow and shown
in place of themselves, with their possible future; or a point between two
lines, its range empty, its last line the one before its first, with no
lines as they are, only what's proposed there, as where a move lands:
"before line 6". Each line of the document is drawn once, in the flow or in
a frame, and the lines after a frame are numbered as the document numbers
them, what's proposed not the document's till it's accepted. A frame's text
sits where the document's would, every line in it, as they are or as
proposed, at the same left and the same width as every line around it, in
the rhythm of the lines, as doctor's proposals' lines sit where the
document's words are: its rows' bands run from edge to edge, over the view's
padding. Every frame is set apart from what follows it by half a line of the
document's ground, below its last part, so its bar ends with it, and a frame
right after another, no line between them, plainly starts. A frame is made
of parts, in order:

- **CURRENT_LINES:** the lines as they are, numbered as the document numbers
  them: what the proposals are read against, their backdrop;
- **PROPOSAL_LINES:** the same lines as the proposals would leave them,
  their changes marked;
- **PROPOSAL_LIST:** the frame's list of the decisions present in it, a
  proposal with any of its places in the frame, one item each, in the order
  their first changes come: the editor's, linking each item to its changes,
  which one's current, the keyboard moving between them, a list with items
  to a screen reader. Each item is drawn by the editor, from what the host
  says in the view model: its title, where it is, why it's proposed, and its
  actions, each a label and a command.

There's one layout, doctor's: `CURRENT_LINES`, its lines with what's changed
in them marked, then `PROPOSAL_LINES`, then `PROPOSAL_LIST`. Proposed words
are never drawn inside a document line, as an inline diff would: a current
line holds only the document's text, a proposed line only the proposals', so
no line mixes the two, and a line's offsets are its own text's positions. A
frame is the view model's, not the model's: proposals don't belong to one,
so it can be loose, and change, and nothing be anchored again. Which lines a
frame takes is how the changes are shown, not what they are, and can differ
with the context and the use, over the same proposals. By default it's the
lines a change touches, run together where they share a line; frames back to
back, one ending on the line before the other starts, stay two. A host
widens them by giving ranges to frame, a function's lines for what's in the
function, or none, for frames as tight as the changes; and later the user,
as editor state, as folding is: more lines shown above, the whole function
taken in. A range joins the frames it shares a line with, never one it's
only back to back with. A frame never cuts through a change's lines: asked
for less, it's the change's lines. Frames never overlap, and never hold
frames: that's the invariant every framing keeps. With one proposal one
reads as doctor's does now: its lines, its version under them, its bar.

**folding:** a frame unfolded is for reviewing: its lines as they are, as
proposed, and its list. Folded, it's a preview: its lines as proposed alone,
as they'd read with its proposals taken, in place, on their band, its bar
beside them and the gutter's signs saying which lines change; no lines as
they are, and no list; and no rings, but for a peek, below. A frame that
only takes lines out has nothing left to show folded: a slim strip where its
lines were, its bar beside it. Folding is the editor's, not the host's, and
not a proposal's state: which frames are folded is the editor's state,
`ranges_Folded`, each by its range, and `foldedAt__ViewModel` makes each
folded frame a block of its own kind, `FOLDED`, its range and its lines as
proposed, drawn by its own component, which a host can put its own in place
of. Its control is a chevron in the gutter, left of its first line, in the
gutter's grey, a button: pointing right where the frame's folded, always
there; pointing down where it isn't, shown while the frame's hovered or the
button's focused, as a code editor's fold controls are; and its bar folds
and unfolds it too, either a `FOLD` command, which toggles it. Hovered,
where its frame's folded, its control peeks at it: it rings its changes, all
of them, every proposal's, each whole as far as it's in the frame, plainly,
as they'd be unfolded with nothing pointed at, room made for them, so its
text may move a little while it's peeked at; off its control, the peek's
over; folded with the pointer still on its control, it's peeked at at once,
the pointer pointing again once the fold's drawn. A peek says what a frame
changes, and where, not whose: there's no telling several proposals apart at
once, so which is whose is for unfolding it and pointing, and a folded
frame's text, and its signs, point at nothing, so reading it sets nothing
flickering. Which frame's peeked at is the editor's state, `range_Peeked`,
and the fold pass gives that folded frame its rings, and no other. A frame's
unfolded till it's folded; once proposals' states are drawn, one whose
proposals are all decided folds itself, and unfolds when one's open again,
and in between stays as you leave it. Later: a move's note unfolding the
frame it goes to; keys to fold and unfold, and to fold every decided frame.

**a frame's header, tried and set aside, 2026-11-18:** a line of its own
above a frame's lines, how far its proposals had got, decided of all, a
fraction and a segment each, hollow till decided, filled after, in its
state's ink, as doctor's status says a proposal's in a word and a mark; the
revising arc turning while one was revised; and a toggle each for its lines
as they are and as proposed, which made folding a frame's showing one of
them, the list only with both, and none while it showed one, as it read
then as the document does. It said again what the list says, a line
sooner, for a line, and the toggles were a state per frame to keep, near
the modes this editor does without; folded, it broke the lines that read as
the document's, which led to dropping it there, and then to doubting it at
all. Kept as a patch, not in the code. If a folded frame's progress turns
out to matter, its bar, beside its lines, can carry a mark, taking no line.
Selection across frames, through those showing one of their sections, was
thought of with it and put off: nothing yet asks for it but copying, and
an edit across one mixes the document's text and what's proposed.

**a proposal is a decision, a change a place, a frame a view of places:**
three things, kept apart. A proposal, a source, is what's decided, at once,
wherever its changes are; a change is a place, anchored in the text; a frame
is only some lines, near each other, shown with what they'd become, and its
list the decisions present there. So a proposal isn't a frame's, and one can
run through many:

- **a thread** is a proposal with places in several frames, as a rename is,
  everywhere its name is. Every frame it runs through lists it, the item
  saying where it is, how many of its changes are in this frame, of how
  many, "6 of 9 changes here", its actions deciding it everywhere, in every
  frame at once; for a proposal wholly in one frame it says nothing. An
  item's places are data the host works out, `places`, never its words: how
  many here, of how many, `COUNT`, and each condition on its own, `WITHIN`
  another's removal or `CARRIED` in another's move, with that proposal's
  source and title; a move's lines and which way, `MOVE`; or nothing to say,
  `NONE`. The view words them, a fact, not prose, small, upright and grey:
  the count a line, and each condition a line under it, hanging off the
  count by a hook, whatever the list's width, each a part of the count, "1
  of them only if … is rejected", "1 of them moved with …", as a place
  inside a removal shows only on the lines as they are, and the numbers
  would seem not to add up; one line, tried, ran the conditions together and
  broke names in two; the other proposal a chip, a thing to point at,
  pointing at it pointing at its proposal, which is always listed in the
  same frame, as a place inside another's removal, or carried in its move,
  is on lines that one takes too; so a chip goes nowhere, pointing at what's
  already there, where a click taking you off to it would be a trip with no
  way back, as that proposal's item needn't name this one. Why it's
  proposed, its rationale, is the item's body, its darkest words after its
  title, what's read to decide; each kind drawn by its component, looked up
  in the map's `places` and `condition`, a host's own in their place. Right
  after the count, or which lines a move takes, an arrow up and an arrow
  down to its item in the frame before and the frame after, the item's
  neighbours, `neighbors`, worked out by the view model from which frames
  list its proposal, a folded frame, showing no list, passed over; chevrons
  alone, where each goes in its tooltip and its label; the first and last
  with the arrow they haven't there off and faded, so the pair keeps its
  shape and says it's an end; none for a proposal listed once. Following one
  is `VISIT`, one of the editor's own controls, saying the item it goes to
  and the item it's from: once drawn, the view scrolls the nearest container
  that scrolls so that item's arrow the same way is where the one pressed
  was, under the pointer, so pressing again, not moving, steps on through
  the thread, faded at an end; lights the item a moment; and puts the
  keyboard on that arrow, or the other at an end. Near the document's top or
  end, where it can't scroll so far, it scrolls as far as it can, the item
  in view though not under the pointer; with the arrow pressed out of view,
  no place to keep, the item's brought to the middle. Centring it, tried
  first, put the arrow somewhere new each time, items being of different
  heights. Later, maybe: room past the last line to scroll into, as
  Monaco's, so the end's no exception, the host's to give or the editor's
  own when it scrolls itself. Later: its rationale once, where it's first
  listed, the others pointing to it, if every frame's saying it again is
  noise; a mechanical one, a rename, maybe no frame at all, its places
  ringed where they are, one item for it. Across documents it's the host's,
  which knows each source's id in each document: an item can say "and 4
  places in other files" from what the host gives, and deciding in one
  editor is a command the host sends on to the others.
- **nested places:** where a thread's place is inside another proposal's
  removal, its change there is nested, as above, and shown so: on the lines
  as they are, inside the removal's ring, its own ring ghosted, solid at
  half strength, there but latent, `data-within` the removal's source; on
  the lines as proposed, every proposal taken, gone with the removal, as it
  would be; and its item, in that frame, says it, "1 only if Drop the
  onRetry hook is rejected", its title a chip. A place is counted once: on
  the lines as they are, every change but a put-in one; on those as
  proposed, every put-in one.
- **where words were taken out:** on the lines as proposed, a removal has
  nothing left to ring, so its ring collapses to a notch, a small wedge,
  filled in the removal's red, at the point its text left: where words left
  a line, over the row, its tip down on the point; where whole lines left,
  in the gutter, cut into the frame's bar at the boundary between the lines
  either side, its tip toward the text, found reading down the gutter as
  every other change is; but none where a frame proposes no lines at all,
  the whole frame a removal, its empty band saying it. Either is the
  removal's other side, as a move has two ends: it shares the removal's
  place, so pointing at either lights both; it takes no room, and nothing's
  drawn near the text for it, so it moves nothing and is never taken for an
  underline. One notch, not a bar in the text, which read off-centre, moved
  the text and looked like a caret; not a hairline between lines, which read
  as the line above's underline. The view model says where: an underlay is
  of a kind, `STRETCH`, from a position to another, what a ring goes round;
  `POINT`, a position in a line; `BOUNDARY`, before a line, a boundary
  between lines, as a line's start and the gap before it are the same
  position in the text; and the view draws each kind by looking it up, never
  by a switch. The projection knows each removal's notch from what it took
  out: the empty piece it leaves, where its words were. Still to build: one notch where several removals fall on one
  point; words moved along where a ring would meet a notch; a notch inside
  what a move carries; a notch's hover saying what was taken out there.
  Every case is in the playground's Changes document.

Where a place is, which frame it's in, and so what an item says, is the view
model's, the projection's. The gallery's "proposals-thread" scene shows it alone; the JavaScript
example, `?example=javascript`, among every other case so far. Every case of
how a change is drawn, enumerated, each alone, is the playground's Changes
document, `?document=changes`: a case drawn by the editor from a view model
of its own, what it shows, whether it's the usual, an edge, or planned, and
what's still open about it; the removal marks, settled but not built, drawn
as the view draws them now. A browser test opens it and checks every case
draws a ring for every underlay its view model gives.

**the gutter:** a line is a row of two cells, its gutter, then its text, so
its gutter keeps to its row however its text wraps, in a frame or not, and
nothing's measured to line them up. In the gutter: a label, the document's
number for the line, or, for a line proposed, none, but a sign: `+` where
it's put in, `~` where it's changed in place; as wide as the longest label,
which the view model says, `charCount_Max__Label_Gutter`, worked out when
it's built, by `viewModelOf__Blocks`, so every row's text starts at the same
left. Then a lane, where folding goes, later. A frame, as doctor draws a
proposal, but neutral: a bar down it, grey, in the lane, at the gutter's
right, between the numbers and the text, beside everything in it, its list
too; its lines as they are hatched, as doctor hatches a line it changes, in
the grey of its lines as proposed, backwards, \, what was, stripes two to a
line running on from line to line, every one, changed or not, so they read
as one, what's being replaced, set apart from the document around them and
never taken for a band, each saying what it becomes in its gutter, as a
look says; its lines as proposed beneath them on a band of grey near
the document's own ground, but not it; its list on the same band a shade
darker, as doctor's actions are, so the three read apart, what was, what
would be, and what to decide; each item's title and why on the left, its
actions on the right, the first the main one; the list's items starting
where the lines' text does. Neutral, as doctor's are not, coloured by what
they do, as a frame holds proposals of every kind, moves and removals too:
colour is the rings', each meaning one thing, and purple stays yours. The
view model says each line's label, as the text it shows, and whether it's
pointed at, its `pointed`, by its proposal or its place, `"12"`, `"+"`,
`"~"`, `""`, already decided, and what the line becomes; the view only draws
them.

**proposal items, the editor's:** each proposal's item, in a frame's list,
is drawn by the editor, not left to the host: its title, why it's proposed,
and its actions, a button each, from what the host says in the view model,
`{ source, title, rationale, actions }`, an action a label, a command and
the state it leads to, `{ command: "accept", label: "Accept", stateAfter:
"ACCEPTED" }`, `null` for one that ends it, as dismissing does, so its
button's drawn in that state's colour without the editor knowing the host's
commands. Which actions there are, and what they're called, is the host's;
reviewing, the buttons, the keyboard, focus moving between the text and the
list, a screen reader's list, is the editor's, the same in every host. A
button carries only its command, as `data-command`: choosing it is a
command, through the pipeline, which the host hears as an observer and acts
on, what accepting means beyond the text its own; till the pipeline's built,
the buttons are drawn and do nothing. There were slots once, room left in
each item for the host to draw in; they're gone. If a host needs something
no item has, one's added for it. Hovered, an item points at its proposal, as
its rings do, and it's lit, on the proposed lines' own ground, as the lines
it proposes are, the whole row, across the list edge to edge, through the
gutter, its icon with it, beneath the frame's bar; a strip of the list's
band kept above its first item and below its last, so a lit first one
doesn't run on into the lines as proposed, nor a lit last one into the
document after the frame; the keyboard on one of its actions lights it too,
so it's seen whose they are, though it doesn't point at its proposal yet,
pointing being the mouse's till the current proposal's built. An action
hovered goes a step deeper, its grey darker, the main one's indigo deeper,
`--view-action-hover-ground` and `--view-action-main-hover-ground`, as a
click shows nothing else yet; and the keyboard's on one ringed in the page's
ink, `--view-focus-ring`, no colour, as each colour there says where a
proposal stands. In a narrow list, under 40rem, an item's actions go under
its words, not beside them, still on the right, wrapping if even that's too
narrow, so its words keep room to be read. Revise, an open or requested
item's action that leads to a revision requested, asks for your notes before
anything's added, as asking for a revision is adding them: a box for them under the
item's words and its actions, which stay as they were, the item's whole
width, the keyboard put in it, three lines tall whatever's written,
scrolling past them, so the item doesn't grow as it's written in, never
resized by hand, and under the box, on the right, Add, filled in the
revision's plum, the form's own word, not Revise again, which opens it, then
Start, its words plum, as it leads to revising, and Cancel, neutral, as
doctor's form has its buttons under its box. Revise is a
disclosure, as doctor's Amend is, a chevron after its words, pressed and
pointing up while the form's open under it, `aria-expanded`. It's in that
item alone, its proposal in its frame, `_Id_Item_`, among the editor's
`items_Drafted`, though the proposal has items in other frames too, and an
item says it's the one, `isDrafting`, a host giving `false`, as a gutter
says it's pointed at. `DRAFT` opens it, from Revise; `SEND`, from Add, Revise
now, or ⌘ or Ctrl with Enter, which adds, and `DISCARD`, from Cancel or Escape, deliberately
throwing away what's in it, or Revise pressed again, close it, the keyboard
back on Revise, the editor asking for that once it's drawn, `focus_Draft`,
as it asks for a note's target to be revealed; Revise pressed again is the
form's Cancel, what's written in it or not, decided 2026-11-19, where it
had put the keyboard back in a form with something written, as doctor's
Amend does, so the button that opened it never threw it away; a card's
Revise and Add the same, `CLOSE_REQUEST` while their form's open; all three the editor's own controls', which work with no
module in. Revise on another item opens its form too, as many open as you're
writing, each in its own item, kept as it is, what's written in it with it,
as GitHub's inline comments are, where doctor kept to one open at a time, a
written one kept and gone to instead of another opening. What's written is
the box's own, kept as what's around it's drawn again, not yet the state's,
and gone once it's closed; and Add sends Revise's command, the host's for
revising, with what was written, to the host, as the observers' `asked`;
Add with nothing written does nothing, the form kept open. Later, as
doctor's do, Accept and Reject off while something's written in the form,
so it's sent or cleared before deciding, never thrown away by it, once
what's written is the state's.

**revisions queued, decided 2026-11-18:** asking for a revision adds to it,
never sends it alone: a proposal holds every request you've made of it,
`requests`, the host's, as its state is, each your notes and the words it's
on, `selected`, if it's on some, kept by the host so a queue built over a
session outlives a reload, and processed by it. At first a proposal's
requests shared its state, one batch of everything queued, every
proposal's, started at once; the same day, that gave way to the next
entry, each request its own status, Start scoped. Start, first named Revise
now, beside Add, in Revise's form and in the menu's note on a proposal,
adds what's written, if anything is, then asks the host, `START`, to start
what's queued. A queued request is removed, `REMOVE`, by its id. Accepting or rejecting one with revisions queued
would drop them, so the editor asks first, `CONFIRM`, the item's actions
row become the question in its place, "Accept and drop 2 queued
requests?", the action and Cancel, the keyboard on Cancel, so a second
Enter doesn't decide, Escape taking it back: no dialog over the text, and
one extra press only where something would be lost; the host drops what was
queued. The words a queued or revising request is on are underlined, dotted,
in the revision's plum, where they're proposed, `data-requested` on their
segments, as doctor marked them, whatever the look, as what you asked is
yours. Start is also under a proposal's queued requests, below them,
so starting needs no form, `START` the command and what's asked. Every
Start is set apart from every other action, as nothing's revised till one's
pressed, though it's not the main one, Add is, in a form: its words bold,
in the revision's plum, on a ground tinted with that plum,
`--view-action-start-ground`, a play mark before them tried and dropped; a host
can place one in its own interface too, as the queue can span documents,
doctor's in its task bar. The menu's requests aimed at a selection or the document still go at
once, Send, as only the host has a place to show requests on no proposal;
queuing them comes with drafts. The playground's host queues, removes, drops
on a decision, and, Start pressed, sets what's queued in its scope going,
then, with no agent, a moment later, has them done with, as a round would.

**revisions as work, decided 2026-11-18:** a request is a piece of work, a
proposal a decision; the two kept apart, as a statechart's orthogonal
regions are. A host's proposal says only what's been decided of it,
`_Decision_Proposal_`, open, accepted, rejected or withdrawn; each request
its own status, `_Status_Request_`, queued or running, and its own id, the
host's; done with, it's gone, as a history of rounds is later. What an item
shows, revision requested, revising, is a rollup, as a test runner's
suite shows its tests': an open one with a request running is revising,
with one queued requested, in the editor's words, the view model's
`STATUSMAP__STATE_PROPOSAL`; the six states drawn as before. So one
proposal can have a round under way and more asked of it, queued for the
next. Starting is scoped, a filter over what's queued, not a group a
request belongs to, as a test runner runs a test, a file or all of them:
`_Scope_Work_`, one request, its own Start, a quiet word after it, a
proposal's, Start under its list or in a form, or the document's, Start in
its header; a task's the host's, its own action in the header; a frame's
left out, as a proposal runs through frames and a frame holds parts of
many. The unit of
work is a proposal's round: one at a time, so nothing's startable on a
proposal while a round of it's under way, its form offering Add alone, and
its words not to be typed into, `isLocked__Edit`, as the agent's rewriting
them; everything else stays editable, and a round lands on what's changed
since by its base version, mapped, never overwriting, as the next entry
says.
Accepting or rejecting one being revised asks first, "Accept and stop its
revision, dropping 2 requests?". A revising one's actions are in colour, as
more can be asked of it; only a decided one's are neutral.

**the header, decided 2026-11-18:** a line over the document, for the
whole of it, as doctor's bar is, `Header_TextEditor__Html`, the component
map's `header`, a host's own drawn in its place; named the header, as a
frame's fold control's already its bar. It stays put as the document
scrolls under it, sticky, across the editor's width, on the proposals'
band, flat, a faint edge under it, in the interface's font; what's
scrolled to, the caret, or a control the keyboard lands on, kept clear of
it. On its left, where the text starts, how the document stands, in as few
words as say it, apart by dots, the last cut short where there's no room:
the host's task, if it gives one; how many of the document's proposals
are decided, "3 of 14 decided"; how many requests are queued; how many in
progress, in the revision's plum, a spinner turning, unless the task's
already says it's busy, so one spinner says it. On its right, the task's
actions, neutral, and the document's Start, starting every request queued
in it. The view model's `header`, the projection's, from the host's
proposals and its task, `task_Header`, `_Task_Header_`: its name, how it's
going, whether it's busy, its actions, each a command asked of the host,
`TASK`, as a proposal's are; given to the editor with the proposals, and
with each `update`, `null` where there's none. Drawn only where there's
work, a task given or something asked, so a document with proposals and
nothing asked of them has none; layered on last, from the projection, as
the folds and the rest rebuild the view model from its blocks. The
playground's host names its task per example, working while a round's
under way, with Stop then, putting what's running back in the queue.

**the editor as a panel, decided 2026-11-18:** the view's a column, as an
app's window is: its header, always there, its document, and its footer,
always there too, the document, `document_htmlView`, taking whatever height
the host gives the view and scrolling in it, the page never scrolling, so
the header and footer are always in sight; given no height, by a host that
lets it grow, it's as tall as the document, the page scrolling, the header
and footer kept in sight, sticky, as it does. The footer's an empty bar for
now, `Footer_TextEditor__Html`, the component map's `footer`, there before
what goes in it so nothing's undone to fit it in later: where the agent is,
as doctor's footer says, kept apart from the task. A host that draws cases,
not documents being worked on, as the playground's gallery and documents
do, composes a map with neither, its own components for them giving
nothing. The playground's examples are apps: the editor the window's
height, beside what each is about and what it's reported; the browser
tests open them in a laptop's window, 1440 by 900, the size they're laid
out for.

**the task, decided 2026-11-18:** doctor's model, as a start: every request
lives within a task, and a task can cut across documents; the host drives
it, as it does its proposals, and tells the editor of it, `task`,
`_Task_Host_`, or `null`: its id, its name, where it stands,
`_State_Task_`, a draft, the agent working on it, your turn, done, or
canceled, what the agent says of it, its summary, its requests aimed at
this document, and its actions, each a command asked of the host. A
task's own requests, on no proposal, about what's selected or the whole
document, `_Request_Task_`, each its status, queued, running or
addressed, and the proposals that answer it, `sources_Answering`: once
addressed it's still listed, "addressed · 2 proposals", or "addressed ·
nothing to change", as doctor's were, so what got answered, and what the
agent missed, is seen request by request; a proposal's own requests, for
its revision, still go once answered. A request's line says how it's
going, the view model's words, `progress`, and offers Start and Remove
only where they do something. The header draws the task's mark before its
name, by where it stands, as doctor's did, a dotted ring, a spinner
turning, a dot in the revision's plum, a check, a cross; its state in
words there for what reads the page aloud, not shown beside it, so the
mark's not said twice; nothing spins beside the count of what's in
progress while the mark says the agent's at work. The playground's host
names a task per example and what it's about; the agent's at work on it
while a round's under way, Stop offered then, and otherwise it's your turn.

**the task's card, decided 2026-11-18:** the task's mark and name, at the
header's start, a button, open its card under it, as doctor's did, while
the pointer's on them or the keyboard's on them or in the card, by the
stylesheet alone, no state to keep: hidden, not gone, so the keyboard goes
on into it, and lingering a moment once the pointer's left, so it can
cross to the card and keep it; Escape in it sends the keyboard back to the
text, `CLOSE_CARD`, and it closes. In it: the task's name and where it
stands, in words; what the agent says of it; this document's proposals
counted by where each stands, "9 to review · 1 revising · 2 accepted",
the header's `breakdown`; the task's requests here, listed as a
proposal's are, each with its own Start and Remove, the band under the
header gone; and the host's actions for the task, Stop among them, moved
there from the header, which keeps Request a change and Start. Request a
change docks its form under the header, flush with it, the editor's
width, as doctor's did, a form with no point, `point_Screen: null`, a
right-click's still floating where it was asked.

**the card in doctor's two parts, decided 2026-11-18:** the card's a task's,
then a document's, as doctor's was, a faint rule between, as a task cuts
across documents. The task's part: its name, then its id, `id`, in the
editor's font, then where it stands, a floating dot after each but the
last, so a heading that wraps never starts a line with one; what the agent says of it; why it was canceled,
if it was, `reason`; its proposals across every document it touches, how
far they've got and how many stand where, the host's counting,
`counts_Proposals`, as only it knows the other documents; the requests
aimed at it as a whole; and Add a request, for the task, and the host's
actions for it. The document's part: its proposals, the editor's counting;
what the agent says of this document, `summary_Document`; the requests
aimed here; and the host's actions for it, `actions_Document`, as
doctor's "accept proposals (3)". A figure under a small label, as doctor's
were; no times yet, a clock to keep them true left for later. A request's
aim's a kind, `_Aim_Request_`: the task, this document, or some words of
it, a task's request listed in its part, the others in the document's; the
two ways to ask kept apart, as they're different things: Request a change,
in the header, aimed at this document, and Add a request, in the card,
aimed at the task, each docking its form under the header, `OPEN_REQUEST`
with its target, the card hidden while one's there. Our requests keep
their Start and Remove, as ours is a queue started at any scope, where
doctor's was a task started whole, from drafting, a mode we do without.
Not yet: requests folded under their count, which needs the view to keep
whether they're open, as it draws its markup afresh.

**the card, calmer, and the task's figures against the document's, decided
2026-11-18:** the card took doctor's look: tighter, its figures side by
side, each under a small muted label, in the text's own ink, not bold, how
many stand where only when one's hovered; what the agent says cut at three
lines, the whole when hovered; its actions links, in the proposals'
indigo, not buttons; its requests without the plum rule and heading a
proposal's list has. The task's figures and the document's are framed
against each other, the editor comparing the host's count across the
task, `counts_Proposals`, with its own of this document: every one of the
task's proposals here, they'd say the same twice, so there's one,
"Proposals: 3 of 11 decided", and the document's part has none; the task
across other documents, the task's part says "Task proposals: 5 of 20
decided" and how many files it touches, `count_Documents`, the host's, and
the document's frames this one as the task's share, each a count of so
many, "Proposals here: 14 of 20", "Decided: 3 of 14", `_Figure_Card_`, each its label, its
value and, hovered, its breakdown. The document's part's drawn only when
it has something to say. The playground's JavaScript task reaches the
README too, two files, a few proposals there; its Markdown one's all here. The header's task
is laid out as an item is: its name starting where the text does, its
mark in the gutter beside it, where a proposal's icon is beside its item,
in a box an icon's size, each state's shape drawn in it; the text's inset
worked out once, on the view, in the lines' font, `--textInset_htmlView`,
so the header, the items and a docked form start their words at the same
point, where the header, in the interface's font, had been a pixel out.

**the header, leaner, decided 2026-11-18:** with a task, the header says
its mark and its name and nothing more beside them: what's decided is in
its card, what's queued is said by Start, "Start 2", how many of the
requests aimed at this document it starts, `count_Startable`, those aimed
at the task as a whole started from their own Start in the card, and
what's under way by the mark; with no task, the document's counts stand
where its name would. The card's heading, under the name, is the task's
id and where it stands, its name not said again. A task's id's the
host's, and best mechanical, a counter, as doctor's `T-12` was, not a slug
of its name: the name says what it's about, and can change as its scope
does; the id stays put, short, unique, in order, to say or paste anywhere.
The playground's are `T-12` and `T-7`. Where a task stands is said in a word, as its
kind is, and capitalized, as a proposal's status is, "Draft", "Working",
"Your turn", "Done", "Canceled", Working's three dots waving after it on
the beat its mark turns on, as a revising proposal's do,
`LABELMAP__STATE_TASK`, in the card's heading and, for what reads the
header aloud, after its name. A task's mark and its word are in one ink,
by where it stands, as a proposal's icon and its status word are, the
proposals' own colours meaning the same here: the agent at work, the
revision's plum; your turn, or done, decided, the proposals' indigo; a
draft, or canceled, nothing under way, the grey a withdrawn proposal's
in, canceled's cross fainter than its word, as withdrawn's is;
`--ink_Task_htmlView`, a host's own `--view-state-*` colours taken where
it gives them.

**the document's requests in the header, and the task's files in its card,
decided 2026-11-18:** the requests aimed at this document, or at some words
of it, came out of the card, where they were out of sight till it was
hovered, and are listed under the header's line, as a proposal's are under
its item's words: "Requests" over them, the plum rule beside them, each
with its own Start and Remove; scrolling in themselves past a third of the
view's height, so the header never takes the document's room. Those aimed
at the task as a whole stay in the card's task part. The card says how far
the task's proposals have got across its files, "Proposals: 5 of 20
decided", and, where it touches more than one, lists them, each its name,
"this file" by the one shown, and how far its own have got, "3 of 14
decided", its breakdown when hovered, where it had said how many files and
framed this one as the task's share: the task's `documents`, the host's,
each its name, its proposals counted by where they stand, and whether it's
the one shown, whose counts the editor takes from its own, so its row
always says what's drawn; the task's figure their sum. The document's part
keeps what the agent says of it and the host's actions for it, its figures
gone, its row in the list saying them. One file, the list would say the
figure again, so it's left out. Not yet: a file in the list opening it,
which is the host's to do, an action on the row.

**each request said by what it's for, files at tens, and the task's form in
its card, decided 2026-11-18:** the document's requests, under the header,
under the task's name, read as the task's; in doctor's model, and ours,
every request is the task's, and they differ only in what they're aimed
at, so each list and each form says it: "Requests for this document" under
the header, "Requests for the whole task" in the card, each list's label
given it, `label`; and each form, where there's a task, saying where
what's written goes, beside its actions, as doctor's did, "Added to T-12,
for this document", "for these words", "for the whole task", `hint`, by
its target's aim, `AIMMAP__KIND_TARGET`, a proposal's own revisions saying
nothing, theirs being the proposal's. Each form opens where what it adds
is listed, `_Place_Form_`: at the pointer, from the menu, `POINT`; docked
under the header, Request a change's, `HEADER`; and in the card, Add a
request's, `CARD`, at the foot of the task's part, under its requests, a
band out to the card's edges, the plum bar beside it, as doctor's composer
was at the foot of its, the card held open while it's there, whatever the
pointer does, `:has(.asking_htmlView)`, its link saying it's open,
`aria-expanded`. Sent or put away, Add a request's form gives the keyboard
back to the link, the card still open, what was added in sight, where the
others give it back to the text, `FOCUSMAP__KIND_PLACE`; left empty, the
focus gone elsewhere in the editor, it's put away where the focus went,
`LEAVE_REQUEST`, as doctor's was by a click outside it, and kept, the
card with it, while something's written in it. The card's files, at tens:
the one shown first, the rest in the host's order, so none moves as
proposals are decided; past six or so, the list scrolls in itself, the
card never past the window; each path in two, its folder, `folder`, muted
and cut from its start, its file's name whole; "Files · 24", how many,
`label_Documents`; a file with nothing left to decide muted, `isDecided`,
so those still to review stand out.

**one word for what the editor shows, and requests named by what they're
for, decided 2026-11-18:** the interface says "document", never "file":
"Documents · 24" over the card's list, "this document" by the one shown,
as its part's heading, Request a change's form and the hints already said;
a host's own words, its summaries and its actions, are its own. The lists
are "Document requests", under the header, and "Task requests", in the
card, a proposal's still "Requests", it being plain whose they are there.

**the document's own card, decided 2026-11-18:** the task's card said
what the task was and what it did here, in two parts; what's the
document's is now the document's, a card of its own, the header's last
thing, opened as the task's is, by its trigger, the document's file's
name, in the editor's font, its path in its card when it's in a folder;
the header's own buttons gone, Request a change and Start, into it. Its
card: what the agent says the task does here, the document's proposals,
how far they've got, and its actions, as links, as the task's are: Add a
request, its form in the card, at its foot, as the task's is in its,
"Add a request" for both, the form saying what it's for; Start, plum,
saying how many it starts, the requests aimed here and the proposals'
queued; and the host's actions for the task here, Accept the ones
waiting here. The task's card keeps the task's alone, its requests
"Requests", it being the task's card, its documents listed. Nothing's
docked under the header now, every card form in its card, `_Place_Form_`
`TASK` or `DOCUMENT`, the keyboard back on its link after, `ASK_TASK`,
`ASK_DOCUMENT`; the one the pointer's on over the other. The document's
name is the host's, given the editor with its model, `name_Document`, on
its own, not the task's, as there's a document with no task, its card
there whatever: `_Document_Header_`, the header's `document`. The
pages that draw no header, the changes document's cases and the gallery's
scenes, name theirs nothing.

**each card's requests in it, as a proposal's are, decided 2026-11-18:**
the document's requests, aimed at it or at some words of it, are in its
card, `_Document_Header_`'s `requests`, no longer under the header,
which is one line again; "Requests" over them, as over the task's in its
card, the card saying whose. In both cards they're drawn as a proposal's
are under its item, not quieted: the heading in the revision's plum, its
rule beside them, each bulleted, its own Start and Remove. A card's held
under seven tenths of the window, scrolling in itself past that, as a
document's requests can run long.

**Revise, once the task's proposals are in, decided 2026-11-18:** what
asks for a change in each card says Revise once the task's put proposals
in front of you, in any document it touches, as a proposal's Revise
does, what's asked then revising what's been proposed; and Add a request
till then, a draft with nothing proposed, what's asked adding to it. One
decision for both cards, the task's, `isPresented`; with no task, this
document's proposals decide it. The view model says it, each card's
`ask`, `_Ask_Card_`, the link's word and its form's, "Revise the task",
"Revise this document", or "Add a request to the task", "Request a change
to this document", the viewer taking the form's from it, `ASKMAP__KIND_TARGET`,
and opening none for a task there isn't. The link in the revision's plum,
as a proposal's Revise is, whichever it says. The menu's choice for the
whole document keeps "Request a change to this document".

**the cards' links and form, smaller things, decided 2026-11-18:** a
card's link, hovered, is underlined whole, a line drawn under the button,
not the text's own underline, which skipped Revise's chevron and the gap
before what followed a word. The document's Start says "Start all", no
count after it: the count, what it'd start, the document's requests and
its proposals' queued revisions, read as a number with no meaning, and
didn't match the requests listed over it, which are only the document's
own; how many is said when it's hovered. The form in a card keeps its
band, out to the card's edges, but not the plum bar beside it, the
requests' plum rule just above it being the card's one bar; a neutral
bar, tried, is a line added back.

**every Start starts what's queued within its scope, decided 2026-11-18:**
a ladder, narrowest first. A request: its own Start, and Remove, after
it, shown while it's pointed at or the keyboard's in it, faded, not
gone, otherwise, so the keyboard still finds them and shows them, and
where nothing can be pointed at always shown; they keep their room
faded, so nothing moves as they show, an empty line where a long
request's would wrap. A group, a list of requests: Start beside its
heading, "Requests  Start", shown while the group's pointed at or
focused, a proposal's starting that proposal's, as the Start under its
list had, now gone, the document's card's the document's own requests,
`DOCUMENT_REQUESTS`, the task's card's the task's own, `TASK_REQUESTS`.
A whole scope: Start all, among a card's links, the document's for
everything queued in it, its own requests and its proposals' revisions,
`DOCUMENT`, how many in its title, and the task's for everything queued
in it, in every document, `TASK`, offered while anything's known to be:
its own requests, this document's, or a proposal requested in another,
as the host counts them. Each Start names its scope, `data-scope`, one
control taking them all, `SCOPEMAP__KIND_WORK`, where the header's
Start had been taken for the document's wherever it was in the header.
The host starts all that's queued within the scope it's given, a
proposal mid-round still waiting for its round to end.

**each card in two sections, Revise until there's a group, and requests
edited, decided 2026-11-18:** a card's actions had sat in one row, the
proposals' beside the revisions'. Each card is two sections now, each
holding what's its own: Proposals, how far they've got, the host's
actions for them, Accept the ones waiting here, and, in the task's, its
documents; Revisions, how many are queued and in progress, the requests,
Start all, and the host's actions for the work, Stop. Each its muted
label, its figure, its actions after it on the line. The host says which
section an action's for, `section`, PROPOSALS or REVISIONS, on each, as
the editor can't tell. The Revisions figure counts the scope's requests,
queued and in progress, the proposals' with the document's own, the
task's across its documents, the host counting those elsewhere,
`counts_Requests`, as it counts their proposals. Revise starts a group:
it's there while a level has no requests, a proposal's among its
actions, a card's on its Revisions line, its form with Add, Start and
Cancel, there being no group's Start yet; once there's one, Revise goes,
and Add, at the foot of the group, opens its form there, Add and Cancel
only, the group's Start, by its heading, starting them; the keyboard back
on whichever opened it. A queued request's Edit, beside its Start and
Remove, shown with them, makes it its own box, what it says in it, Save
and Cancel under it; saved, the host's asked, `EDIT`, its id and its new
words, trimmed; Escape or Cancel closing it, nothing asked; the keyboard
back on its Edit. The request being edited is the viewer's,
`editing_Request`, a proposal's by its frame's item, as a drafted one
is, or a card's, layered on the view model, `isEditing`. A card's form
lost its band: in the Revisions section, or a group's foot, it's the box
and its actions, as a proposal's is.

**a Stop beside every Start, and the group's actions together, decided
2026-11-18:** wherever there's a Start there's a Stop, for what's in
progress within its scope, putting it back in the queue: a document's
or the task's own request in progress, Stop after it, as its Start was,
a proposal's requests running together as one round, so its Stop is its
group's; a group, Stop by its heading while any of it is in progress;
a card, Stop all beside Start all while anything in its scope is, in the
revision's plum, as the Starts are, its title saying how many. Shown
wherever something's in progress, however it was started, as which Start
began a round would be one more thing to remember for a rule harder to
foresee. The host's asked `STOP` with a scope, as it's asked `START`,
the scope `_Scope_Work_`, no longer the Start's alone; the task's Stop,
the host's own action, became the editor's Stop all, as Start all is.
The playground stops by scope, its rounds each knowing their own
requests, so a round stopped, or stopped and started again, leaves them
be when its time's up. A group's own actions sit together after its
heading, a dot before each, as the card's heading's parts are, "Requests
· Start · Stop · Add", shown while the group's pointed at or focused;
Add, there now, not at the foot, puts a new request at the list's end,
its box and its actions as an edited one's, Add and Cancel, its hint
left out, the list saying whose.

**the group's actions apart from its heading, a request's status, and a
card that stays, decided 2026-11-18:** a dot between "Requests" and its
actions read as more of the heading, so a faint rule sets them apart,
and nothing between the actions themselves, side by side; they're the
heading's plum and size, not bold, the heading's the one bold thing, the
rule fading with them. A request's status says what it came to in
brackets, "addressed (nothing to change)", "addressed (1 proposal)", the
bracket in the text's muted ink, the status alone plum, `detail_Progress`
apart from `progress`, where a dot had joined them. Start and Stop are
offered only where there's something to start or stop; a form's Start,
before anything's written in it, would have nothing, so it shows once
something is. Pressing a button in a card that takes the button away,
Start, Stop, Remove, had let the card close, the focus gone with the
button and the pointer, the card a line shorter, no longer over it: the
view gives the focus back to the card when what had it went in the draw,
`keptOpen__Card`, the card holding focus, `tabindex="-1"`, so it stays
till you click elsewhere or press Escape. The playground's action for the
document says "Accept all (9)".

**an addressed request dismissed, decided 2026-11-18:** a proposal's
requests go once its round lands, what they asked for in what it now
proposes; the document's and the task's own stay, "addressed (…)", and
would pile up, so each, once addressed, offers Dismiss, where Remove is on
a queued one, shown as the rest are, as quiet. Dismissed, the host's asked
`DISMISS`, its id, apart from `REMOVE`, as the one is done with and the
other done without, a host free to keep it in a history; the playground
drops it. Not yet: a group's own Dismiss, for all of its addressed at
once, if they grow many. The group's actions, hovered, are underlined
whole, as a card's links are, Add's chevron and all.

**the task's Proposals one section, its documents and their total, and
Cancel neutral, decided 2026-11-18:** the task card's figure, "5 of 20
decided", and its documents, under their own label, read as two things;
they're one now, Proposals, the documents its rows, each how far its own
have got, and under them, a faint rule over it, their total, said as what
it sums, "2 documents", "24 documents", how far all of them have got, its
breakdown when hovered, staying put as tens of documents scroll above it;
with one document, the figure alone, as before. `_Proposals_Card_` holds
them, `label_Documents` and `documents`, the document card's empty. The
document card keeps its own figure. Every Cancel is neutral, the page's
ink on the plain ground, a proposal's form's, a card's, an edit's, an
action asked first's, where most had taken the plum or indigo they sat
beside.

**the task's sections each its figure, then its documents, decided
2026-11-18:** the total under a hairline, "2 documents", is gone; each of
the task's sections reads as the document's does, its figure on its line
with its actions, the total, and under it, where the task touches more
than one document and there's something to break down, the documents,
each its own share: Proposals, how far each's proposals have got;
Revisions, modelled on it, how many of each's revisions are queued and in
progress, the task's own requests counted in its figure and listed under
them, Revise, Start all and Stop all on its line. A document with nothing
in the section muted, `isSettled`, nothing to decide or nothing queued or
under way, where `isDecided` had been the proposals' alone.
`_Revisions_Card_` has its `documents`, as `_Proposals_Card_` does, the
document card's empty; one list, `Document$_Card__Html`, draws either.

**the revisions' documents undone, revisions by scope and by level, and a
request's actions behind an ellipsis, decided 2026-11-18:** the
Revisions' documents, modelled on the Proposals', were the wrong way to
go, and are gone, `isDecided` back for the Proposals' alone; the
Proposals keep their figure and their documents under it. Each card's
revisions are two sections now. Scope Revisions: everything in its scope,
nested however deep, the document's own requests and its proposals', or
the task's own and every document's, how many are queued and in
progress, Start all and Stop all, `_Revisions_Scope_`. Level Revisions:
that level's own, the card's group of requests, or Revise while it has
none, `_Revisions_Level_`. A group's actions, Start, Stop and Add, are
always shown now, not only when it's pointed at; a request's own, Edit,
Start, Stop, Dismiss and Remove, whichever it has, are behind a
horizontal ellipsis, "…", the ellipsis becoming them while the request's
pointed at, or the keyboard's on one of them, folded to nothing at rest,
not gone, so the keyboard still reaches them; always shown where nothing
can be pointed at. The ellipsis is an icon: three dots drawn, centred on a
faint disc of the muted ink, no ring, where the character's sat on its
baseline, the "…" kept in the markup, unseen.

**the task's documents each with its figure by its name and its own
actions, decided 2026-11-18:** under the task's Proposals figure, a faint
rule, fading at its ends, then the documents, each its name, "this
document" by the one shown, and, a dot between, how far its proposals have
got, so the right of the line is free for its own actions: Accept all, for
what's waiting there, each document's, the host's, `_Document_Task_`'s
`actions`, carried to `_Document_Card_`. The playground's: this document's
as its card has it; another's, `accept-in:` and its name, deciding what's
open there. The task's figure sits by its label, "Proposals · 5 of 20
decided", where it lists its documents, and opposite it, the task's own
Accept all, for what's waiting in every document, the host's,
`accept-task` in the playground. The document this editor has open isn't
said in words, "this document" gone: its row is set apart, a faint wash of
the proposals' indigo behind it, out a little past its words, its name
bold, as a list marks what's selected, `aria-current` saying it to what
reads aloud.

**actions folded throughout the cards, and proportions in chips, decided
2026-11-18:** every set of actions beside something, a card's line by its
figure, a document's row, a group's heading, a request, is folded behind
the ellipsis, unfolded while what it's beside is pointed at or the
keyboard's on one of them; folded, it's visually hidden and out of the
layout, `folded_htmlView`, where it had been squeezed to no width, which
left the lines' gaps behind; still focusable. A line of nothing but its
actions, Revise alone, stays as it is. The ellipsis, `More_Action$__Html`,
`more_htmlView`, one for all of them, takes the ink of what it folds, the
revision's plum for requests and revisions, the proposals' indigo for
proposals. Every proportion of proposals, the task's, a document's, the
document card's, sits in a quiet chip, a faint ground, so it reads apart
from the label or the name to its left, the dot before it no longer
needed; the task's, by its label, at the label's size; the rule under it
gone.

**the task's total its documents' last row, and the ellipsis's ink by
what it folds, decided 2026-11-18:** the task's figure, by its label, is
the last of its documents' rows now, its name a wildcard, `*`, every
document, muted, in the files' font, its chip, and its actions, Accept all
for every document, folded as a row's are; a hairline over it, solid at
the right, fading out to the left, gone three quarters of the way across;
outside the documents' scroll, so it stays as they scroll. With one
document, the figure alone, on its line, as before. The ellipsis's ink:
a request's own neutral, its actions being quiet ones; a group's heading's
the revision's plum; the revisions' plum; the proposals' indigo. The
total's name is "all (*)", no hairline over it, the rule tried, faded
in from the right and out to the left, and let go; it reads as the last
row by its name and its muted ink, as far under the last document as each
is under the one before, it being outside their list so it stays as they
scroll; the rows spaced as the total first was, 0.3rem apart, roomier
than they'd been, the list's height, six and a half rows, counting it.
The open document's band is exactly as tall as the chip in it: a row's
things centred, not set on their baselines, nothing padding it, the
chip the tallest of them. A request's own actions are all quiet, Stop,
Edit, Start, Dismiss and Remove alike, in the muted ink, the page's when
hovered, its status, "in progress", "addressed", the one thing on its
line in plum. Every Start is bold, wherever it is, a card's Start all, a
group's, a form's, and a request's own, grey as the rest of its actions
are but bold, what everything queued waits on; Stop and the rest stay
regular. Start all was made regular for a moment, and made bold again. A
form's Add and Start, the card's and a proposal's Revise, are there from
the outset, not hidden till something's written, but disabled while what's
written is blank, faded, with no hover, and an edit's Save the same, though
it opens enabled, holding the request's words, till they're cleared; the view keeps `disabled` in step
with the text, on its own `input` listener and after every draw, the text
being the textarea's alone, not the view model's, and a draw taking off
any attribute it doesn't name. The document's card hugs the editor's right
edge: placed from the header, `top: 100%; right: 0`, not from its file
name, which had left it 0.75rem in, a guess at the header's padding; no
right border of its own, the editor's edge, the host's border in the
playground, being its edge, so the line isn't doubled. An unfolded set of actions
opening into a pill of its ellipsis's ground was tried too, and let go:
they unfold plain, as they were. A group's actions unfold with nothing
between them and its heading, the rule gone, their ink and weight
setting them apart. Folded actions unfold while
what they're beside is pointed at, or the keyboard's focus is on one of
them, `:has(:focus-visible)`, not the focus a click leaves on one, which
had kept a group's "| Start Add" out after Add was used, till the focus
moved on.

**the document's own requests, decided 2026-11-18:** a request for a change
on no proposal, about what's selected or the whole document, is queued as
a proposal's is, not sent at once: every form offers Add and Start, the
menu's and the header's, Start there adding it and starting it, the ask
saying so, `isStarting`, as the host has the id to start it by. The host
keeps them beside the proposals, `requests_Document`, each its id, notes,
the words it's on and its status; the editor lists them under the header,
flush with it, scrolling with the document, `Request$_Document__Html`, the
same list a proposal's are, `Request$__Html`, each with its own Start and
Remove, and underlines the words each's about wherever the document's text
is drawn, outside frames, and in a frame's lines as they are and as
proposed. The header counts them with the rest, and its Start starts them
with the rest; a request's Start, or Remove, names no proposal,
`source: null`. The header's Request a change opens the form for the whole
document under it, as doctor's Quick task does, `OPEN_REQUEST`. What one
gets back is the host's: new proposals, answering it, as doctor's tasks'
are; the playground's host, no agent, has it done with a moment after it's
started. When the header's too narrow, its last part's cut short; its
other parts keep their words.

**a round landing on what's changed since, decided 2026-11-18:** a round's
written on the document as it was when it started, its base, and lands on
the document as it is, as optimistic concurrency does, git's and
ProseMirror's: nothing locked but the proposal's own words while its round's
under way, nothing ever overwritten. The model's `rebasedOf__Changes`, a
pure function a host calls, server side where its edits are, carries a
round's changes through each edit to the document's text since its base,
as the model carries its own, `carriedOf__Change`, and says which of them
an edit touched, overlapping it, putting something in inside it, or, a
move, cutting where it lands, an edit only coming up to it not, and how
many moves it dropped, their text gone: `_Rebased_Changes_`. The host keeps
the edits, each `applied` transaction, numbered, each run's base, and
tells the editor how each proposal's last round landed, beside the
proposals, not on them, as work is apart from decisions:
`rounds_Landed`, `_Landed_Round_`, its source, the indexes of its changes
written before your edits, how many dropped; with the proposals, and with
each `update`. Every round lands: no conflict state, nothing asked before
it's shown, as a round proposes and changes nothing; it's accepting it that
could undo what you'd written, so the review shows it: a change written
before your edits ringed dashed, `data-stale`, the "changes" look's, and its
item saying so under its title, "1 change written before your edits",
"1 dropped, its text gone", in the revision's plum, with Run again, a quiet
word, while it's open and no round of it's under way, `RERUN`, asking the
host to start that round's requests again on the document as it is now, so
the agent sees your edits. Dropping just a round, keeping the one before,
waits on a history of rounds. The playground's host keeps its edits and
each run's base, lands each round through the editor's rebasing, its round
the proposal's changes as they were, as there's no agent to write others,
and runs again what the round answered, or, a round it didn't start, asks
again; its JavaScript example starts with the opening comment's last round
landed after an edit, so its ring's dashed and Run again's offered.

Decided 2026-11-24, as `TASKS.md` says under a conflict, and out of date,
in the editor: a stale change isn't dashed any more, but drawn in its frame
as pairs of lines, the line it was written on, the change ringed whole on
it, and under it the file's line, unnumbered, `data-layer` `MOVED_SINCE`,
hatched forward in light teal, ringed by what the file did in the "changes"
look's colours, its put in, replaced and taken out, `data-since`, the
stale proposal's marks taken off its words; the written-on line
`data-layer` `WRITTEN_ON`, every other line `DOCUMENT`, the layer a line's,
`_Layer_Line_`, as the view model decides it. What the file put in, where
the proposed lines have it, ringed teal, `data-file`, and where it took
words out, a teal notch. Each stale change comes with what it was written
on, `_Written_Change_`: its lines then, and the change as it was on them,
the documents part's, kept as it was found stale. An item's stale note
says which it is, `OUT_OF_DATE`, an open proposal's, "Out of date" in
orange, or `CONFLICT`, a decided one's, "Conflict" in red and what the file
did, with its ways out, `KEEP`, `TAKE`, `BOTH` where both can stand, and
`RERUN`, each asked of the host.

Deciding is a command, on the current proposal or one named: accept, reject,
revise, amend; an item's actions are the editor's buttons for them, or,
where a host wants controls of its own by a change, the editor says where
each change's spans are on the screen.

Still to be tried, in the gallery: whether a change says which proposal
it's from with a mark of its own, a numbered tag, or only when it's pointed
at, pointing for now.

Editing inside a change changes its next state: a selection across its
lines, Enter making a line, Backspace joining two, pasting, undo, all as
anywhere else, and kept inside it, so an edit can't leak out of a change
into the document; it's told to the host as its source's, for its proposal's
next round. Editing outside one, among what's proposed, makes changes of
your own, a source of your own; outside frames, it changes the document.

## how it's built

Four parts, as Monaco's are, its text model, view model and view, and the
editor that holds them:

1. **the model**, above: the document, the changes sources propose to it,
   their anchors and the one history. Plain data and functions over it, with
   no screen in it, and knowing nothing of the editors that show it, so
   several can show one.
2. **the view model**: what one editor shows of the model, worked out from
   it without a screen: where each change sits in the flow, what changed
   within it, which parts are edited and which only read, which source each
   part is from, the frames and their parts, where old words show beside new ones, and
   how each region looks, as its module says. And that editor's own selection,
   caret and composition, in the model's positions, kept inside a proposal
   when they're in one. Positions in what's shown and positions in the model
   are converted here.
3. **the view**: the view model drawn, and nothing else. The DOM for what's
   shown, the caret and selection drawn by it; measured, and a point on it
   turned into a position. It decides nothing and edits nothing. Its look is
   themed by CSS variables, so a host's colours are its colours; in VS Code,
   VS Code's theme.
4. **the editor**: what holds the three together, and the host's interface
   to them: commands in, through one pipeline; what they did out, to
   observers; and its modules. A host gives it a document and its
   proposals, as changes, tells it what's new from elsewhere, and acts from its own
   controls, all by commands, and hears what's edited and decided as an
   observer.

The model doesn't hold them together: that would put a screen in it.

What holds state, the DOM and its listeners, the view and the editor, is a
class, so its fields show when it's inspected in the browser's tools, which
a closure's don't. Data stays plain, as `type-construction.md` says: the
model and the view model are data, and functions over it. The view is a
class, `_View_TextEditor_`, in `source/editor/View_TextEditor.tsx`, holding what
lasts between draws: its container, its components, and an observer of the
container's size. `draw(viewModel_TextEditor)` draws the view model into the
container, as an element of its own, `.htmlView_editor`, leaving the
container as the host made it, its classes, styles and attributes the
host's; then draws the text underlays, and the observer draws them again
whenever the container's size changes. The view model's types and parsers
are `source/editor/ViewModel_TextEditor.ts`.

The editor is a class too, `_TextEditor_`, in `source/editor/TextEditor.ts`: given
its container, its setup and its content, the model, the proposals and the
ranges to frame, it projects the model, with the perspective shown, and
hands the view model to its viewer, and again, `show(perspective)`, when
another's shown, setting its looks. The viewer, `_Viewer_TextEditor_`, in
`source/editor/Viewer_TextEditor.ts`, is what the reader does with what's drawn,
given a view model, as the changes document's cases and the gallery's
scenes are, and the browser tests' made by hand; `show(viewModel)` draws
another, keeping what's pointed at, folded and drafted. It holds the view,
its modules, and its state: the view model it's given, the proposal pointed at,
`source_Pointed`, and of it the place, one of its changes, both its sides,
`place_Pointed`, by the `data-place` its rings carry, and the note, by its
target, `target_Pointed`. On its container, one listener for each kind of
event its modules ask for, handing each to their adapters, in order, the
first command taken ending it. `dispatch(command)` works out the state after
it by the handler for its kind, from `HANDLERMAP__TEXTEDITOR`, a map, as the
components are, given the state, the command and the view's layout
interface, `_Layout_View_`, never the DOM; where the state's changed, it's
drawn on the next frame, all of it again for now, each line keeping its
element by its id to come. What's drawn is the state's view model:
`pointedAt__ViewModel` marks the pointed proposal's groups and items
`data-pointed`, an item's `attributes` drawn on it as a group's are, and its
place's rings `data-pointed` too, on both sides, and the gutters of the
lines its changes are on, a gutter's `pointed`, `"proposal"`, or `"place"`
where its place is, drawn `data-pointed` on the gutter, and the underlays a
pointed note goes to, its proposal's on its side, a move's other end,
`data-targeted`; the look says how they look: the proposal's rings
heavier, breathing faintly together while it's pointed at, its place's
heavier again, a faint light running round them, both sides in step,
clockwise round the lines as proposed, forwards, as their rings are drawn,
and counterclockwise round the lines as they are, backwards, as they're
hatched, one lap each in the time the place's longer ring takes at one pace,
from its length, which the view works out as it draws them,
`--lap_htmlView`, kept between two seconds and six, so its two sides go
round together and no light crawls or races, so the moment they're all lit
together lasts; one light round a ring a wrap cuts in two, as if it weren't
cut, along its top edges part after part, down its last side, back along its
bottom edges and up its first, never its cut sides, the view drawing it in
pieces, `lap_htmlView`, each its share of the lap and where on the lap it
starts, `--phase_htmlView`, as a browser starts a dash afresh on each shape
in a path, so a light run round the parts as one path showed in both at
once, or in neither; and still where motion's asked to be reduced; the
breath going on as they're drawn again, the drawing keeping the elements it
drew; the labels of the pointed lines heavier, so they're found reading down
a frame, the place's lines' heavier again, by a stroke round each glyph, not
a bolder weight, which may be wider, so no label moves, and still, the
motion being the rings'; a targeted ring heavier, so a note shows, from
either end, which change is its counterpart. Two commands so far: `POINT`, a
point on the screen or none, its handler asking the view what proposal's
there, `sourceAt`: the innermost ring whose area it's in, or else what it's
over, as a point's resolved by lowering, not by its source; what place of
it, `placeAt`, the same ring's; and what note, `targetAt`; and `JUMP`, to a
note's target, its handler keeping it in the state, which the editor, once
it's drawn, has the view reveal, `reveal`, scrolling the note at its other
end, pointing back, to the height the one pressed is, its line under the
pointer, as an item's arrows put theirs, or, with no note there, its
line to the pressed one's, or, the pressed one out of view, to the
middle (decided 2026-11-19: the middle had put it anywhere but under the
pointer; a note's at its line's end, so only its height's kept), then
forgets, as scrolling is something done, not a state to draw. It doesn't
point at what it reveals: pointing is the mouse's, and the scroll moves
what's under it. Once it's drawn, though, before revealing, it points again
where the pointer last was, a `POINT` of its own, as what's drawn can move
under a pointer that doesn't, a frame folded above it, or the one it's on,
and a pointer that doesn't move sends nothing; where nothing under it
changed, the state's the same, and nothing's drawn again. One module,
`MODULE_MOUSE`, in `source/editor/modules/mouse.ts`, every move of the pointer a
`POINT` where it is, as it can move out of a ring still over the same
element, leaving the editor a `POINT` at nothing. A click on a note, a
`JUMP`, and on a frame's fold control or its bar, a `FOLD`, are the editor's
own controls', `CONTROLS__TEXTEDITOR`, in `source/editor/Controls_TextEditor.ts`,
which it always listens with, before any module's. Not yet: the model,
lowering's stages, results beyond taken, observers, the keyboard and the
current proposal.

How it's drawn:

- **what's drawn is kept:** drawing the view model again keeps the elements
  already drawn, each matched by its tag, its class, and the data attributes
  it and the description both have: one come or gone doesn't tell them
  apart, as a ring pointed at is the ring it was, one changed does, as a
  place's light at another place is another light; wherever it is among its
  siblings, moved into place by `moveBefore`, which keeps its state; its
  attributes brought to the description's, any it doesn't give gone, as from
  a fresh one, the view then setting again what it measures. An element
  written with no children, as a run's underlays' svg is, keeps what's drawn
  into it after, the view drawing into each one every time, rings or none.
  So what the browser holds on an element holds across draws, its hover, the
  keyboard's place, a running animation: a frame's fold control doesn't
  blink as what's pointed at in it changes, the keyboard stays on an action
  as the pointer moves, a proposal's breath goes on from place to place, no
  pace kept for it.
- **state is changed at once, drawn once a frame:** each input is applied as
  it arrives, so the next one sees the state it left, and the DOM is written
  once, on the next animation frame.
- **only what changed is drawn again:** each line keeps its element, found
  by its id, and a line that's the same object it was is passed over; the
  view model is worked out again only for the lines a transaction touched.
- **only what's visible is drawn:** the lines on the screen, so what's drawn
  for a line, its spans, its underlays, search's matches on it, costs what
  a screenful does, however long the document is.
- **layout is read once a frame, after drawing:** reading it between writes
  makes the browser lay the page out again each time, which is where editors
  get slow; each line's measurements are kept until the line changes.
- **written in JSX, as descriptions:** the drawing reads as Preact's would,
  and works as it does: JSX makes descriptions, and one step,
  `draw__Node_Jsx` in `source/jsx/Jsx.ts`, ours, makes them into elements in a
  container. A component can give text, or nothing, or a DOM node a host
  made its own way. Nothing a host has to load, so it's as portable as
  hand-written DOM; no diffing yet. Nothing's done to an element in the
  drawing: once it's all drawn and in the page, the view measures the text
  underlays. It's built of components named after what they draw,
  `Line_Run__Html` drawing `.line_htmlView`: the units a reconciler would
  pass over when their props haven't changed, comparing descriptions, which
  is what they're for. Which lines are drawn again is decided a line at a
  time, as above, not by comparing whole trees.
- **drawn from component maps, not switches:** what the view model says a
  thing is, a block's kind, a frame part's, picks its component from a map,
  `_ComponentMap__View_TextEditor_`, by kind: polymorphism where the data
  decides. Which map, the configuration decides, upstream: a host passes
  one, the editor's own, `COMPONENTMAP__VIEW_TEXTEDITOR`, or one with its
  own components in some places, its own proposals list, its own lines,
  through `line`, one component beside the maps, as a line isn't a kind, and
  they draw wherever the editor's would, lines inside frames too, as the map
  is passed down the tree, not imported. Nothing is defaulted: a host passes
  the map even when it's the editor's. Which parts a frame has, its layout,
  is already decided upstream, in the view model. A host's component keeps
  what the text underlays are measured by: a run is `.run_htmlView`, with
  its id as `data-run` and its `<svg class="underlays_htmlView">` in it;
  each of its lines is `.line_htmlView`, right inside it, its text
  `.text_htmlView`, right inside that. Where a run with underlays to draw
  is missing any of it, none of them are drawn, as its positions would
  land on the wrong text, and the measuring says so, a warning in the
  console naming the run and what's missing; a run with nothing behind it
  says nothing.
- **the dispatchers stay:** `Block_TextEditor__Html` and
  `Section_Frame__Html` look each kind up in its map. The data does carry
  its component's reference, by name: its kind. Carrying the component
  itself doesn't type: where it's drawn, a union's components ask for data
  that's every kind at once. Choosing components when the view model is
  built, the view model made of descriptions, would do without them, but the
  view model would stop being plain data, readable by observers and agents,
  clonable, and free of any one view; that's kept, and the dispatchers are
  its price.

## input

The browser's own editing isn't used: no contenteditable, and not its
selection. What's taken from the browser, and what's the editor's own:

- **taken: layout.** Text is drawn as DOM, so the browser sets its fonts,
  wraps its lines and orders text written right to left; it's measured with
  `Range.getClientRects()`, and a point is turned into a position with
  `caretPositionFromPoint()`.
- **taken: text input, input methods and the clipboard,** which the system
  gives only to something focused and editable, through **EditContext**:
  typing and composition announced against a text the editor holds, and the
  editor telling it where the caret and characters are, so an input
  method's window sits where it should. Monaco does this with a hidden
  textarea; VS Code's own editor has been moving onto EditContext. It's
  Chromium's alone, which is why this runs in Chromium alone.
- **its own: the selection and caret, the keys, the mouse, and how the
  caret moves,** with words and characters found by `Intl.Segmenter`.
- **given up, or built again:** the browser's spelling, which Monaco has
  none of either; what contenteditable gives assistive technology for
  nothing, built again as modules; the handles a touch screen selects with,
  which a VS Code webview doesn't need.

Why its own selection: a selection in the DOM is one range, in the DOM's
order, and proposals side by side, and old words shown beside new ones,
aren't in one order. With the selection the editor's own, keeping it inside
a proposal is a rule on a value, not a fight with the browser.

## commands

The editor's interface is semantic: a command says what's meant, and the
pipeline is where it's adapted, lowered in stages to a transaction on the
model. Every source sends commands, the keyboard, the mouse, voice, the host
and its agent, through one entry, `dispatch`.

```
adapter   what it hears → command    Shift+ArrowDown → extend { by: line, direction: down }
lower     command → resolved         its positions in the model, against the state and the layout
lower     resolved → transaction     the model's operations, kept inside its proposal
apply     transaction → state        drawn on the next frame
```

- **a source only says what's meant:** its adapter turns what it hears into
  a command, and works nothing out; that's the pipeline's.
- **a command's target is a reference, which lowering resolves:** the
  selection, a unit from the caret, a proposal by its id, a point on the
  screen, which is "here".
- **dispatch answers at once:** whether the command was taken, so a key's
  default is stopped in time; and for copy and cut, what goes on the
  clipboard, which can only be written while its event lasts.
- **a command that needs layout,** a line up or down, a page, the end of a
  wrapped line, has a frame that's still waiting drawn first, and then
  measures: the page laid out once more, for those commands only. Lowering
  asks a small interface of the view for it, which tests fake as a grid of
  fixed widths.
- **each kind of command has its own result,** in its own terms: done, and
  what was done; nothing to do, its zero, as Backspace at the start of a
  document; or refused, and why, as outside the proposal.
- **composition is a session, not an event:** EditContext is kept told the
  text around the caret, a slice of the document, likely the lines round it,
  the selection, and where its characters are, so input methods and
  autocorrect have what they need.
- **a command that arrives late,** a phrase understood a second after it's
  said, or the agent's, has its positions carried forward through every
  transaction since, by the anchors.
- **commands are data:** the model, commands and their lowering are tested
  without a screen; the adapters, where the browser's input arrives, in
  Chromium, with its own input, trusted, as `tests/browser/` does; and a log
  of commands replays a bug.

Built so far, the first of editing, the caret and the selection, nothing
typed yet:

- **where each character's from:** every line drawn says where its text is
  from, `origins`, each stretch of it a text's, the document's or a
  change's, `_Id_Text_`, from a line and a character in it, and where in the
  line it's drawn, in the line's own units, UTF-16, the model's counted in
  code points. A frame's lines as proposed have theirs from the model's
  pieces, a change's own words its text's, what a move carries the
  document's, where it is; every other line's the document's. So a drawn
  place is a place in a text, `placeIn__Line`, at a boundary the
  character after it's, and a place in a text is where it's drawn in a run,
  `positionIn__Run`, a stretch with characters before an empty one.
- **the selection's the viewer's:** its two ends, its anchor and its head,
  each on its own a place in the model, in a text, with the run it's shown
  in, as the document's text is shown twice in a frame, as it is and as
  proposed; what's drawn between them, in the order it's drawn, is
  selected, in the section the anchor's in, a run: a frame's lines as they
  are, or as proposed, or the document's lines between frames; across its
  lines and the texts they show; leaving it, the head stops at its edge.
  Kept to one text at first, a selection stopped where its text did, at
  boundaries no one sees, in the middle of a line of code a proposal
  changes: selecting is of what's shown, keeping to one text editing's.
  Then let go of every bound, it ran out of a frame's section into the
  next, which isn't valid: a frame's two sections are two views of the
  same lines, and what's selected is of one. At a boundary between two
  texts, an end extending keeps to the anchor's. The view model says where it's drawn,
  `selection`, the view drawing it after it draws, measured from the text
  one node at a time, in a layer of each run it covers, a box along each
  row, joined across the room rings make, and a sliver past a line's end
  for its line break; the caret at its head, before the text, blinking
  while the editor's focused, brought into view each time the keyboard
  moves it. The browser's own selection is off, the editor's element
  focusable.
- **its commands:** `PLACE`, a click, or a shift-click extending;
  `DRAG`, the button held; `RELEASE`; and `MOVE` and `EXTEND`, by a
  character, a grapheme, by `Intl.Segmenter`, a word, to its end or its
  start, a line's edge, or a line, the row above or below at the caret's x,
  the layout asked, `positionAt` and `caretOf`, whatever run's there, the
  column it started at kept through shorter lines till it moves otherwise;
  a character or an edge on, at a line's end, goes to the next line, and at
  a run's, to the next run, a word on past blank lines to the next word.
  Extending moves the head alone, wherever it goes. The mouse's module
  places and drags,
  `MODULE_MOUSE`; the keyboard's moves, `MODULE_KEYBOARD`, the arrows,
  Home and End, Alt or Ctrl a word, Meta an edge, Shift extending. Lowering's
  tested on a grid, a fake of the layout, as above; the view's answers in
  Chromium, in the Markdown example.

Then typing, the second of editing:

- **text input's EditContext's,** set on an element of the editor's own, its
  input, `.input_htmlView`, focusable, not seen, kept apart from what's
  drawn: set on the editor's element, it made the proposals' buttons inside
  it not buttons, an editing host's, out of reach of the keyboard. A click
  in the text places the caret and focuses the input at once, its own
  default kept from taking the focus back, so what's typed straight after
  goes where the caret is. The EditContext's told, each time the state
  changes, the stretch of one text the caret's in, on its line, from the
  line's origins, and the selection where it's inside that stretch, so what
  it reports typed, or composed by an input method, is a range of that
  text and what it becomes; told where the editor and the caret are, so an
  input method's window sits by them. Backspace, Delete, Enter, undo and
  redo it doesn't do as the editor needs, so they're keys, the keyboard
  module's, Backspace and Delete by a character, Alt or Ctrl a word, Meta
  an edge; the clipboard's copy, cut and paste the editor's own controls'.
- **lowered by the viewer to a request,** `_Request_Edit_`: a range of one
  text and what it becomes, `TEXT`, or `UNDO` or `REDO`. What's typed
  replaces the selection; deleting takes it out, or what's drawn next to the
  caret, in the text that's from, before a proposal's words the document's
  character before them, at a line's start its line break, never across a
  section's edge. A range is asked only where what's drawn between its ends
  is one text, running on: another text's words inside it, a proposal's,
  or one text out of its order, as across a move's words, and nothing's
  asked. Copying gives what's drawn between the selection's ends.
- **each section edits its own:** the document's lines outside frames, the
  document's text; a frame's lines as they are, the original, the hatched
  ones, nothing, read only; a frame's lines as proposed, all of them,
  folded too, as a folded frame shows them, never mirrored in the lines as
  they are; folded, it stays folded as it's typed into, unringed, as a
  folded frame is. There, a proposal's own words, whatever its state, open,
  a revision asked for or under way, or accepted, are edited as they are,
  its text; anywhere else, the document's words round a proposal's, a
  line no proposal changes, the lines a move carries, an edit's a change
  of yours, a source the host names, `source_Yours`, and describes as any
  proposal, "Your edits" in the playground: made by a step of its own,
  `SOURCE`, setting a source's changes, checked as parsing checks them,
  undone by setting them back. So the document, and the lines as they are,
  never change for what's typed among what's proposed. A frame whose
  lines as proposed are none, all taken out or moved away, has nowhere to
  put a caret, and so nothing typed there, yet.
- **what a word is, the host says:** a words module, `_Module_Words_`,
  `wordsOf` a line's words, in the setup beside the language and the
  perspectives, `module_Words`; the editor's own, `MODULE_WORDS_TEXT`, in
  `source/editor/words/text.ts`, text as text, Unicode's words, letters and
  digits, `_` inside them, a `.` between letters too (`errors.push`,
  `e.g.`), what a word step's always gone by; a host passes it, or its
  own, a language's tokens, say, as text, code and prose may well want
  words of their own. Three things go by it, so they agree: a word step,
  and a word deleted; whose text a keystroke goes into, where two texts
  meet; and the shape of a change of yours.
- **where two texts meet, a keystroke goes to the word it joins:** the
  viewer says what's drawn either side of a caret typed at, the text ending
  there and the one beginning, `places_Caret`, and the editor says whose
  word what's typed joins: a letter after the document's word, the
  document's, so a change of yours, never the proposal's words after it, as
  "attempts" with an "s" put on, at the meeting with `aborted`'s " ||
  signal?.aborted", once went into theirs; a letter before their word,
  theirs, edited as their words are; what joins no word, a space, a comma,
  yours, never another proposal's. You edit a proposal only where you
  change a word it wrote.
- **a change of yours is whole words:** over every word it touches, as
  typed and as it was, "attempts" made "attemptss", a replacement of the
  word, "tried" with a letter taken out, "trid"; as agents' proposals
  quote whole words. Never past another change's edge, anyone's, nor into
  their words; your changes whose words meet run together, unless another
  proposal's words put in sit between. So a change of yours at a move's
  edge is inside it, drawn where it was typed, as an "s" put after
  "attempts", the end of what `order` moves, once was drawn where the move
  leaves. A change touching no word, a space, a new word after a bracket,
  is what was typed. Where it would be the very span of another's change,
  as typed just beside words another puts in, or at a move's very edge, it
  takes in the character beside it on the side the caret's on, as it is,
  so it's drawn where it was typed. Your changes touching the edit are
  taken into it, so typing on, or deleting on, is one change. Where it
  would cross a proposal not shown, rejected or withdrawn, whose words are
  drawn as the document has them, it takes in that proposal's whole span,
  as the model never lets two sources' changes cross. Once it's back to
  what the document says it goes with the next edit made, unless the
  caret's in it, where it stays, drawn as nothing.
- **a selection across texts,** a proposal's words and the document's,
  yours among them, or a moved line and the line it lands before, is typed
  over, or deleted, piece by piece: the viewer asks with the pieces it
  drew, in order, `ACROSS`; each stretch of the proposal's words edited in
  the proposal, each stretch of the document's that runs on, with yours,
  as one change of yours; what's typed goes in where the selection starts,
  the caret after it. The stretches after the first are edited first, so a
  change of yours the first makes doesn't change which of yours a later one
  names; a later one with nothing in it is left be.
- **where a caret is, in the model:** the text of the character after it;
  at a line's end, the text whose line break comes next, the one going on
  at the next line's start, so a caret at the end of a line before a line
  break of yours is in yours, and what's typed there goes before the break;
  and only a place drawn back where the caret is, as the document's place
  beside words of yours put in is drawn on both sides of them, and drawn
  at the first. A range's ends are where what's drawn in it starts and
  ends, so a Backspace beside where yours took the document's out takes the
  character before. The text input, the EditContext, holds the stretch of
  the caret's own text, so what the browser types goes in there. Each found
  by a fuzz, as typing into what's there went wrong: random keys at random
  places among what's proposed, each checked against a plain text box, the
  original and the document checked unchanged, and undoing checked to give
  back the start.
- **done by the editor,** `editedOf__Request`, in
  `source/editor/Editing_TextEditor.ts`, without a screen: the lock first, the
  document's text inside what a pending or accepted proposal's span holds
  refused, its edges not, nor what a rejected or withdrawn one's would; a
  proposal's own text edited only while it's open. Then the transaction,
  a `TEXT` step, applied, the caret after what it put in, and the history,
  each entry what undoes it and what redoes it, the selections before and
  after; typing run together into one undo while the caret's where the last
  left it. The editor projects again and hands the viewer the view model
  and the selection; the viewer, standing alone, as the changes document's
  and the gallery's, is given an `edit` that refuses every request.
- **not yet:** the marks of what's typed, as in a bold word;
  folds kept on their lines as lines are put in or taken out above them;
  Tab; select all; a double click selecting a word, a triple a line; a
  wrapped line's own rows' ends for Home and End; dragging past the
  editor's edge, and scrolling as it goes.

## asking, from a menu

A right-click in the editor, or the menu key, or Shift+F10, at the caret,
opens a menu of what can be asked there, `OPEN_MENU`, worked out as it
opens from what's selected and what's pointed at: on words of an open
proposal, selected, a note on them, or on the whole proposal, its title
saying which; on anything else selected, a request for a change, aimed at
it; with nothing selected, a request for a change to the document, and,
pointing at an open proposal, a note on it. One request, never a choice of
scope: doctor's notes have it that what a request's aimed at says where,
not how far, and the words written say the rest, or the agent infers it, a
name's every use, a sentence itself; what it made of it is seen in the
proposal that answers it, before it's taken, and a note sends it back if
it read it wrong. Decided on 2026-11-18, over a rename of its own beside a
change here, as doctor's requests, bound in practice to what was selected,
read a rename as one place. Choosing one, a click, or Enter on it, the
arrows moving through them, `CHOOSE_MENU`, opens a form where the menu was,
`asking_htmlView`, what it is, what it's aimed at quoted, a box to write
in, Send and Cancel, ⌘ or Ctrl with Enter and Escape; Escape, or the focus
leaving it, closes the menu, the caret back where it was. Sent, it's asked
of the host, `SEND_REQUEST`, never empty: a note on a proposal its Revise
command with the notes and the words, queued, as its draft's Add sends it,
its form offering Add and Start, as the draft's does; a request, sent
at once, what's written and what it's aimed at, each piece of it a text's
range and what it reads. Each the editor's own control, as a revision's
draft is, working with no module in; menu and form both the component
map's, `menu` and `request`, a host's own drawn in their place; the view
keeps them in the window, as doctor's menu kept itself. The playground's
host queues a note on words as a revision of its proposal, the words quoted,
and reports a request, as it's no agent to answer it. Not yet: requests on
no proposal drafted, kept and sent together, as notes on a proposal now
are, next; a button by a
selection, as a document editor's comment button is; cut, copy and paste
in the menu, the browser's own out of reach of the text; a host's own
choices in it.

## observers

What a command did is told to observers, the host's and modules', stage by
stage: the command as sent, its result, what it was resolved to, its
transaction, and the state before and after. A command refused at a stage
stops there, so a refused one has no transaction. It's told twice, as the
DOM is only written on the next frame:

- **applied:** at once, after each command; the model's, as the DOM still
  shows the state before.
- **drawn:** once a frame, after drawing and measuring, for every command
  that frame took in, with what's on the screen for each: the elements a
  line is drawn in, the rectangles of a range, the DOM's selection. It's
  read from what that frame measured, so nothing's laid out again, and good
  only while it's told, as the next frame may replace the elements.

An agent can keep to what was meant and what came of it, or go down to the
transaction, the states and what's on the screen. It costs only what the
pipeline already made, held, not copied, since data is replaced, never
changed; an observer that keeps them keeps old states alive, though states
share most of what's in them.

**So far, edits and what's asked, and what the host sends back:** the
editor's `observers`, the host's, each an `_Observer_TextEditor_`, told
`applied` once an edit's applied, typed, deleted, pasted, undone or redone,
before it's drawn, an `_Applied_Edit_`:
the request the command was resolved to, the edit's own transaction, a
keystroke run into the one before it only its own, and its inverse, the
model before and after, and, worked out from the transaction, whose
changes it changed, `sources_Changed`, each a proposal's next round, yours
among them, and whether it changed the document, `isChanged_Document`. A
host keeps what it's told as it likes: doctor, a proposal edited as its
next round, once the caret leaves it, say; the document's edits written to
the file, or kept with a task till it's applied. And told `asked`, an
`_Asked_Host_`: an `ACTION` once a proposal's action's pressed, `ACT`, or
a revision's notes sent, `SEND`, or a note on it sent from the menu: the
proposal's source, the action's command, the host's own, what was
written, or `null`, and the words it's on, if it's on words, or `null`;
or a `REQUEST`, a request for a change from the menu, what was written and
what it's aimed at, the words selected, or `null`, the document. The
editor decides nothing itself, a proposal's state being the host's. What the host
has then it sends back, `update`, an `_Update_Host_`, the model and the
proposals, which the editor draws, the caret kept where it can still be
drawn, the history cleared, as above. Observers are told just after the
command that made the edit or the asking's done, a microtask on, so a host
sending back what it has as it's told, as the playground's does, never
lands inside that command, its state written over as it finishes, which it
once was; still before what's drawn. The playground's host,
`playground/host.ts`, keeps the model each edit leaves, takes each action
at once, a proposal's state the action's, its status and actions that
state's, a revision's notes what you asked, a dismissed one gone with its
changes, sends back what it has, and reports each edit and each asking.
Not yet: commands that edit nothing, a caret moved, a selection made; the
stage drawn; modules' observers.

## modules

The editor is a core and the modules a host chooses, so a component carries
only what it needs: the core alone shows a document, read-only; a component
for reviewing proposals adds the mouse and keys to move between them and
decide them; the whole editor adds text input and the clipboard.

**the core**: the model, the view model, the view, the pipeline and the
editor's container element, and:

- **the DOM's meaning:** roles and labels, and what a module says a region
  is, a heading as a heading. It costs nothing, and the rest builds on it.
- **every action a command,** so every action is reached without a mouse.
- **listening, and handing on:** one listener for each kind of event on the
  container, handing each event to the modules that asked for it, in the
  configuration's order; the first that makes it a command that's taken
  ends it, and the browser's default with it. Besides input, it listens
  only for what keeps the view right: its size changing, fonts loading, and
  scrolling, if lines are drawn only while seen.
- **every resource the modules share:** modules ask, and the core takes
  their asks one at a time, through the pipeline, in the configuration's
  order, never in the order listeners happened to be added:
  - the events, above;
  - the DOM's selection, written as it's drawn, so a `selectionchange`
    that's the echo of the editor's own write is dropped, and only one from
    outside, as from assistive technology, reaches a module;
  - focus, moved only by commands;
  - the live region, its announcements queued, each saying how urgent it is;
  - the keybindings, one table, merged from every module's.
- **only what's used:** a mechanism is made only once a module that's in,
  and on, uses it, so the core alone has no EditContext, no listeners and no
  live region.

The core holds the mechanisms; the modules hold their uses: which key means
what, what to announce and how urgently. Modules: the keyboard, the mouse,
text input through EditContext, the clipboard, dragging, keys to move
between proposals and decide them, a screen reader's, assistive technology's
edits, voice.

The editor's own controls are the core's: what it draws to be pressed, a
frame's fold control and its bar, a move's note, a thread's arrows, an
item's Revise, its form's Add, Start and Cancel, a queued request's
Remove and Start, a confirmation's action and Cancel, and the forms' own keys, Escape
and ⌘ or Ctrl with Enter, each works as it's drawn, pressed or clicked, or
Enter or Space on it, with no module in, from `CONTROLS__TEXTEDITOR`, which
the editor listens with before any module. Pressing a button isn't an input
a host chooses; it's what a button is, and a control that did nothing
without a module would be broken, not lighter. A host that wants proposals
read only gives them no actions. Modules are the ways in a host chooses
besides: pointing by hovering, the mouse's; keys to move between proposals
and decide them; a screen reader's; voice; each another way to the same
commands, never the only one. And what a command did, a host hears as an
observer, never through a module: modules are input, observers output.

A module's own commands:

- **a module adds commands, and their handlers:** the commands are the
  core's and every module's, a set worked out from the configuration, as
  the rest is. Each is named within its module, as `navigation.next`, so two
  modules naming one alike is a collision of names, not of meaning, and
  fails when the editor is built.
- **a module's handler lowers its command to the core's:** the next proposal
  to selecting the start of it and bringing it into view. It never touches
  the model or the DOM itself; the model's operations stay the core's, so
  what the core keeps, edits inside a proposal, one history, the anchors, is
  kept in one place, and a module can't get round it.
- **one command, one transaction:** a module's command lowered to several of
  the core's is undone as one.
- **its result is its own,** in its own terms, made from the results of what
  it was lowered to. Its trace is a tree, the module's command, the core's
  it was lowered to, then the transaction, which an agent goes down through
  for what was done, literally.
- **its handler answers at once,** as dispatch does. What's slow, writing
  speech down, a model understanding a phrase, is done before, in the
  module's adapter; what's to be done later is a command sent later, its
  positions carried forward by the anchors.
- **its handler is given what the core's lowering is:** the state, and the
  view's interface for layout; never the DOM.
- **lowered to another module's command,** when it says it depends on that
  module; with the modules fixed, one missing, or a cycle, fails when the
  editor is built.
- **its own state,** as whether voice is listening, or the proposal last
  moved to, is part of the editor's state, changed only by commands and
  seen by observers; it isn't the model's, so undo leaves it alone.

A module can't replace or wrap a core command's handler: what happened
would depend on the modules' order, and the conflicts the core owns would
be back. A core command means something else where it should in two ways:

- **a binding, by its context:** Enter in a code block bound to a module's
  command; a conflict there is a binding's, handled as those are.
- **a region's kind:** what a new line means in a block of code, indented to
  match, belongs with the kind's definition, which is its module's, as the
  model says, since voice saying "new line" sends the core's command, with
  no key to bind.

Which modules, and how they're configured:

- **the modules are fixed when the editor is built,** never added or taken
  out while it runs, and the types follow from them: what can be
  configured, the commands, the observers' events. A module left out isn't
  in the bundle.
- **their configuration is live:** a module's defaults, its keybindings,
  where they hold, its options, are data, and a person changes them while
  it runs, the new values parsed into those types as they arrive. A change
  is a command: ordered with input, seen by observers, its result applied,
  applied with what it shadowed, or refused and why. The configuration is
  part of the editor's state, and the keybinding table is worked out from
  it again when it changes. Turning a module that's in on or off is an
  option.
- **what's configured is named:** a binding names its command, not its key,
  so a person's binding outlives a module changing its default; and only
  what a module declares can be configured.
- **layers:** the core's, then the modules', then the host's, then the
  person's, each over the one before, so the person's choice always wins.
- **a binding holds where it's meant,** in its contexts, as VS Code's `when`
  does: Alt+↓ the next proposal while reviewing, a line moved down while
  editing. Two conflict only where their contexts meet, and with contexts a
  finite set, from the view model, that's checked exactly.

**conflicts of meaning,** two modules each wanting a key, undecided within
one layer, are mostly decisions not yet made, not mistakes. The core finds
them; it can't make them:

- **as it was configured:** a developer's configuration, assembling the
  editor, fails when it's built; a person's, tailoring it, takes the layers'
  order, says what lost, and goes on working.
- **a lost key never loses an action:** what it did is still a command,
  reached by the palette, a menu or voice.
- **seen:** what's shadowed, and by what; what a key does here, and what
  else wanted it; and the first time a contested key is pressed, which was
  meant, asked once and kept as the person's.
- **refused, with why:** a key the browser keeps, as Cmd+Q and Cmd+W in
  Chrome, or the system, or a screen reader in use.
- **found only while it runs:** a key that types a character in the
  keyboard's layout, as Option+E types é on a Mac, goes to text input, not a
  binding, unless the person bound it so; `navigator.keyboard.getLayoutMap()`
  says which keys type what.

In doctor, VS Code has a keybinding system of its own, with people's
bindings, `when`, and its conflicts shown; a keyboard module handing keys to
it would let people manage them where they already do.

CodeMirror 6 is built this way, a small core and the rest extensions: worth
reading before ours is designed.

## voice

Three ways in:

- **the system's dictation** arrives through EditContext, as an input
  method's text does.
- **the system's voice control,** macOS Voice Control, Windows Voice Access,
  arrives through accessibility, below.
- **the editor's own, as Wispr Flow is:** heard and written down, then
  understood, tidied, "scratch that", "make that a heading", as commands; as
  commands are data, a model can write them. Its adapter takes text, what's
  still being heard and what's final, not sound, so it's written down
  wherever the microphone is: in the page, or, in doctor, perhaps the
  extension, passed through the host. What's still being heard shows as
  composition, the session an input method uses, and what's final is
  committed; what's understood late has its positions carried forward by
  the anchors.

## accessibility

Modules, tailored to the person and where they are, not one for everyone's
needs. The core gives what costs nothing: the DOM's meaning, and every
action a command.

Assistive technology reads an editor, its text, caret and selection, and
what changes, and acts on it, moving the selection and changing text, all
through the system, which the browser answers from the DOM and its
selection. With the selection the editor's own, it has to be given to the
browser:

- **a screen reader's module:** the DOM's selection kept with the editor's,
  over its text, made unseen with `::selection`; announcements, through the
  live region, as brief or full as the person wants. VS Code's input through
  EditContext does this, with a hidden element for screen readers holding
  the lines around the cursor and the selection.
- **assistive technology's edits:** a `selectionchange` from outside becomes
  a command that selects; its edits, commands that insert or replace. The
  system's voice control comes in this way, as do a braille display's
  cursor keys and VoiceOver moving through text.
- **its look:** contrast, spacing, fonts, motion, as CSS variables: a theme,
  not code.

A page can't find out what assistive technology is in use: browsers keep it
from them. So it's configured, by the person or by the host; VS Code knows
when a screen reader's on (`editor.accessibilitySupport`), so doctor can
say.

## why its own engine

CodeMirror 6 and ProseMirror were the candidates, and both are built on a
document being one sequence of content, every position on one line through
it. This editor interleaves chunks of content, the document's and its
proposals' among it, side by side, which breaks that model. Built over
either, it would be working round its engine again, as doctor works round
Monaco. The browser's own editing is passed over for the same reason: its
selection is one range, in the DOM's order.

How a part of a document looks, as its source or formatted, Markdown's
headings as `#` lines or as headings, isn't the core's to decide: it's the
module's that gives that part its kind.

## carried over from doctor

What doctor worked out holds for the component:

- each colour means one thing: green added, red removed, yellow changed in
  place, brown moved, purple yours; and within one, the line's style says
  how, solid replaced, dashed restyled;
- a proposal's rounds, each a version, consecutive ones of yours one;
  what a round changed since the one before, dotted under what's new or
  changed, a mark where words were taken out;
- amendments: a note on words of a proposal, or on the whole of it, asked
  for its next round, as one quick one or a draft sent together;
- a proposal of new lines side by side is one, however many it spans;
- what changed derived, never stored: `compareTexts`, word by word, then
  marks over the words kept, its five kinds;
- a move shown at both its ends, each going to the other.

## the first thing it has to do

Doctor's roadblock, and nothing more: a document with proposals in it, the
proposals edited in place, a selection across a proposal's lines, Enter,
Backspace, paste and undo working there as in the document, edits kept
inside the proposal they're in, and each proposal accepted or rejected.
Then, in order: the host told of edits, by observers, so an edit to a
proposal is its source's next round, and one to the document the host's to
keep; what a round changed since the one before; amendments; and doctor's editor replaced by
it, through an adapter from doctor's documents and proposals to its
document and changes.

## still to find out

Before anything's built on them:

- what keydown and EditContext announce, and in what order, for typing, an
  input method, dictation and the emoji picker;
- what assistive technology's edits arrive as on an element with an
  EditContext, and whether the DOM's selection, set there, gets in
  EditContext's way;
- whether a VS Code webview may use the microphone; VS Code Speech works
  outside one;
- how keys reach VS Code from a webview that has focus, and the answer
  comes back, for a keyboard module handing keys to it;
- whether a webview, an iframe, is allowed `navigator.keyboard.getLayoutMap()`,
  which an iframe needs permission for.

## not to begin with

Editing by several people at once; proposals of proposals; a proposal across
documents; anything doctor's tasks say, which stay doctor's; changes from
different sources crossing over the same text, beyond one inside another's
removal, and proposals competing for the same words; moves within a line,
and moves that split, after moves of whole lines.

Editing text written right to left, or both ways in one line: it's shown as
the browser lays it out, but edited in the order it's written, which isn't
always where the eye expects, as the caret, the selection and where a click
lands all differ there. Every other writing system is in, as it costs little:
the browser lays them out, and `Intl.Segmenter` finds their characters and
words, which English needs anyway, for emoji and accents.

Decided 2026-11-19: a ring replaced and restyled is dotted, its dashes
round dots, `0 4` with round caps on a 2px line, heavier pointed at, not
the longer dashes it had, nor dots at its corners and sides' middles over
its dashes, which were tried and let go; latent, it's solid at half
strength. Written before your edits, it was dashed, till 2026-11-24, when
dashes were left to restyled and seams.
Every dashed path, a ring's or a cut side's, has its dashes fitted by one
formula, `fit__Dash$`: an element on each corner, bent round it, shared
by the sides meeting there, and along each side evenly spaced, as near
the look's pattern as a whole number comes, so every side's symmetric;
half an element at an end with no side beyond. The element is what the
look's dash and cap draw, a dash, a dot, a square; a star or another
shape would need the view to draw a shape at each spot, not done. The view
draws the elements as the path's pieces, the look's `stroke-dasharray`
read and set to none on the path, as Chromium starts a dash pattern again
at each piece of a path, so a ring a wrap cuts, or open at a side, can't
be fitted with one pattern; a draw puts the look's back, and it's fitted
again. The cut sides' own fitting, `pathLength` scaled, a dash at each
end reaching half a stroke past the ring, is gone with it.

Decided 2026-11-19: folded actions open only at their ellipsis, not
anywhere on their line: the ellipsis and its actions one fold,
`Fold_Action$__Html`, `fold_Action_htmlView`, unfolded while the pointer's
on it or near it, an unseen margin 0.35em past it, under its actions so
clicks reach them, or the keyboard's on one of its actions; the actions
in the ellipsis's place on the line, the pointer then on them, so they
stay open till it leaves. (`fold_htmlView` is a frame's fold control's.)
Nothing moves as a fold opens: the fold is an inline flex box, as tall as
what it shows, as the ellipsis and the actions were as their line's own
items, not a line of text round them, which had made a document's row
taller than its chip folded, so it shrank opening; in a request's words,
inline; on a card's line, a pixel's negative margin above and below, so
actions a hair taller than the figure's chip don't grow the line.

Decided 2026-11-23: an ellipsis repeated down a list is shown only while
its row's pointed at or the keyboard's in it, its room kept, so nothing
moves: a request's, in a card or in the document, as a board task's ⋮
is, so a list of requests isn't a column of ellipses; a lone one, a group's in its
heading, Resolved's on the board, always there, as it's the only one
and easy to miss otherwise; every one shown where nothing can point, as
on a touch screen.

Decided 2026-11-23: an ellipsis, or a board task's ⋮, opens only with the
pointer on it, its disc itself: the unseen margin 0.35em round a fold
gone, and, folded, nothing of a fold but its ellipsis pointed at, so the
room a request's actions keep unseen beside it, and the line a fold is as
tall as, never open it; the ⋮'s too, only its disc, not its line. Open,
its actions, or the ⋮'s menu, pointed at in its place, so it stays open
while the pointer's on them. Where nothing can point, as before.

Decided 2026-11-23: a header's card is drawn over the footer, the header
over it, and is, at most, as tall as the room from the header down to the
editor's own bottom edge, never past it nor the window, scrolling inside
past that; still 70% of the window at most where
there's more room. The room measured as the menu's is, each time the
view draws or the editor's resized, as when the board's shown under it,
which made the editor shorter and left a card's end under the footer.
The height's kept by the view, as the document's room is, and written
back as soon as it draws, before anything's measured: a draw rewrites
the editor's own style, and a card scrolled with the pointer on its
requests redraws the editor with each request it brings under the
pointer, lighting what that one quotes; measured in between, the card
was at its fallback, 70% of the window, with a pixel to scroll, and its
scroll was pulled back to the top.

Decided 2026-11-19: room above the document's first line and past its
last, only as a jump needs it, the "later, maybe" under `VISIT`: given a
height, the editor scrolling its document itself, an item's arrow or a
move's note pressed near the document's top or end, the view makes as
much room as puts what it goes to under the pointer, keeping what's shown
where it is, then scrolls; after, the room's only as much as is shown,
never scrolled into: what's scrolled away from it's taken back, what's
shown kept where it is, so scrolling up at the top, or down at the end,
moves nothing, and at rest, or scrolled clear of it, there's none. Tried
first, and let go the same day: a room past the last line always, as
Monaco's, which scrolling could reach. The view's own measure,
`_Room_View_`, set on the document, `--roomAbove_htmlView` and
`--roomBelow_htmlView`, its `::before` and `::after`, again after every
draw, which takes the style off; kept where it is by measuring the first
block before and after and scrolling by the difference, Chromium's own
anchoring not applying at the top or where the room's shown; taken back
on `scroll`, not while a smooth jump's under way, till it ends: at a
`scrollend` where it was headed, `top_Jumped`, or, short of it, still
for 150ms after, as one the user stopped is; on a display of more than one
device pixel to a CSS pixel Chromium sends a `scrollend` for the instant
first step of a jump up, the one keeping what's shown still as room's
made above, a moment into the jump, which, taken for its end, had the room
taken back and the jump stopped, every jump up after a jump down going
nowhere; and, scroll positions rounded to those pixels, less than half a
pixel from the top or the end taken as at it;
the arrows' and the notes' scrolls handed to the class, `_Jump_View_`,
not made by them. Given no height, the page scrolling, none.

Decided 2026-11-19: the keyboard after a jump. A move's note's jump puts
it on the note at the other end, under the pointer, as an item's arrows
put it on theirs, so Enter or Space jumps back from there. A note or an
arrow with the keyboard, scrolled out of view, gives it to the document,
`tabindex="-1"`, no ring, so Space, Page Down and the arrows scroll the
document on: the note pressed had kept it, and Space, scrolling, pressed
it again, jumping back to where it goes from wherever the document had
been scrolled to.

Decided 2026-11-19: the document stands somewhere, as the task does,
`_State_Document_`, worked out by the projection from its own proposals
and requests, its proposals' too: its requests under way, `WORKING`;
something here yours, a proposal to decide or a request to start,
`YOUR_TURN`; every proposal decided, nothing queued, `DONE`; nothing
proposed, `NONE`; working first, then yours. Shown by the task's own
marks, after the file's name in the header, on its right as the document
is, as big as the task's, in the header's font, centred on the name,
about half as far from it as the task's mark is from the task's name,
the header's own gap, so the two read as a pair, not a reflection,
mirroring them tried first; in words in its card, after its path, as the
task's are after its id, Working's dots waving. The state's on what says
it, the marks and the cards' words, `data-state`, not the header's part
holding the card: the JSX runtime draws an element anew when a data
attribute changes, and the part drawn anew for a new state had closed
its card under the pointer or the keyboard, a round ending while it was
open; the task's moved there too, as it had the same flaw.

Decided 2026-11-19: a frame's head, above its list, below its lines as
proposed, not over its lines as the one set aside on 2026-11-18 was: a
part of its own, `PROPOSAL_HEAD`, drawn by the part map's
`PROPOSAL_HEAD__Section_Frame__Html`, a host's own in its place, none on
a folded frame, which shows no list. One line, on the list's band, where
the items' text starts: on the left, "Proposals", the frame's lines, how
far its proposals have got in a quiet chip, and, hugging them, Accept all
behind an ellipsis in the proposals' indigo, no Reject all, tried and
taken out the same day, as accepting a frame's proposals together is
something you'd do, rejecting them all at once isn't, the two not being
alike; on the right,
while anything's queued or in progress for its proposals, how many, Start
all and Stop all behind the revision's plum ellipsis, the cards' own
`Action$_Scope__Html`. Accept all is `ACCEPT_ALL`, the host asked, for each
open proposal the frame lists, its own action to Accepted, as if each were
pressed; one with requests waiting is left to be decided by itself,
as deciding it would drop them, which asks first. Start all is the scope
`FRAME`, its range and the sources it lists. Frame-level requests, asked
of a frame's lines, a group of its own, Revise and Add, and an aim at
lines, were built and taken out the same day: not yet. The parts with lines
are picked out by `isLines__Part_Frame`, as the head has none.

Decided 2026-11-19: the menu's words are requests, never notes, and each
choice is named for its tier first, then what it does, tersely: "Selection:
Request revision" on a proposal's selected words, "Selection: Request
change" on the document's, "Proposal: Accept", "Document: Start all",
"Task: Request change"; the form a request opens says it in full,
"Request a revision of “…”", the proposal's title there, not in the menu.
And the menu is tiered, the narrowest first, a hairline
between each, setting aside the one request without a choice of scope
decided on 2026-11-18: the words', only with a selection; the
proposal's, the one the words are in or the one pointed at; the
document's; and the task's, while there's a task. No tier for a frame,
which has no requests of its own. Each tier but the words' offers a
request at its level, and its own quick actions, each only while it has
something to act on, as its buttons elsewhere do: the proposal's own
actions but Revise, "Proposal: Accept", "Proposal: Reject", `ACT`,
asking first where it'd drop requests; the cards' host actions,
"Document: Accept all (9)"; and Start all and Stop all, the
scopes `PROPOSAL`, `DOCUMENT` and `TASK`. A choice is chosen by its
kind, `CHOSENMAP__KIND_ITEM_MENU`: a request opens the form, the rest go
through the command its button sends. In a tier, its choices are grouped
as the cards group them, `section`: its proposals' first, Accept, Reject,
Accept all, then its revisions', its request, Start all, Stop all, a
host's own revision actions; the menu opens with the keyboard on its
first request, not its first choice, so Enter asks, never accepts; the
choice it's on lit only once the keyboard's in use, `isFocusShown`, the
menu opened from the keyboard or an arrow pressed, as a native menu's is,
a right-click's lighting only what's pointed at. The document scrolled
under the menu closes it, by the wheel, the scrollbar or a touch, as
Monaco's does, so it's never left over words that have moved on; the
wheel over the menu, scrolling it where it's taller than the editor
leaves room for, leaves it open, never scrolling what's behind it. Only
what's under it moving closes it, not a scroll the browser makes to hold
what's shown still as what's above it changes, a request sent filling a
list: the view notes, as it places the menu or a form, the element under
the point it opened at and where it was, `_Placed_Popover_`, and says
whether it's moved, `isMoved`, the viewer asking it on a `SCROLL`. The
viewer listens for the events that don't bubble, `scroll` and
`scrollend`, as they're captured. The
menu and the form it opens are kept in the editor, not only the window,
`keptInEditor__View_TextEditor`: slid left from its right edge, opened
above the point where there's no room below, as wide and as tall as the
editor leaves room for, the menu scrolling inside past that; the tiers'
hairlines inset as the choices' words are. A
choice is drawn in its section's ink, the proposals' indigo or the
revisions' plum, as the ellipsis each group folds behind in the cards
is, what it does in full, its tier, `label_Tier`, faded, to 85%,
each line one colour, set apart from what follows it without a second; Start all bold, what
it does, not its tier, as every Start is. With a selection, the words go with
every tier's request below theirs, ", with selection", for reference,
not to change: an example, or what's meant, at that level. The target's
and the aim's `reference`, `DOCUMENT`, `TASK` and `PROPOSAL`, an
action's ask's too, beside `selected`, which a request is aimed at; the
form quoting them "with" them, and × leaving them out, `DROP_QUOTE`; a
request listed "with" them after what it says, muted, not ringed in the
text, as what's ringed is what a request will change. The playground's
log says what a request referred to, `referred`, where it did.

Decided 2026-11-19: Start all and Stop all say how many, as Accept all
does, everywhere they're offered: the document's and the task's cards,
a frame's head, and the menu's tiers, "Document: Start all (2)". Start
all counts what it would start, not all that's queued: a request on a
proposal being revised waits its turn, so it's left out; for the task,
the documents it touches beyond this one count what their host says is
queued, as that's all that's known of them. Stop all counts what's in
progress. The summary beside them, "2 queued · 1 in progress", stays:
it's what's seen while they're folded behind their ellipsis, and the
counts on the actions, seen once it's opened, can say more than it, one
startable of two queued. A scope's Start and Stop are `start_All` and
`stop_All`, each a label and a title or nothing, as `accept_All` is; a
request listed says whether it's in progress, `isRunning`, which a
proposal's Stop all in the menu counts. A list's own Start and Stop, over
the requests listed under them, stay as they are.

Decided 2026-11-19: the menu's form is a popover, by the rules a card's
form already kept: empty, it's let go, written in, it's held. Empty, a
click away closes it, the click doing what it would, the caret placed
there, the keyboard in the text; and the document scrolled under it
closes it, as the menu. Written in, a click away leaves it open, and the
document scrolled moves it with what it's on, the element under where it
opened, cut where it passes the document's edges, the keyboard still in
it; a right-click, or the menu key, puts the keyboard back in it,
`FOCUS_REQUEST`, no menu, so what's written can't be lost starting
another. Escape closes it, written or not, as Cancel does, anywhere in
it, not only its box; pressed on its words, not a control, it keeps the
keyboard where it is, as the menu does. Either opened and the window or
the editor resized, it's kept in the editor. It's headed by where
what's asked goes, on one line, cut where it runs out: the choice's
tier, in the revision's plum, bold, then, after a dot, fainter, as a
card's head's are, what it's on, in the text's ink a little faded, not
bold, the proposal's title, the document's name, the task's, "Proposal ·
Stop retrying once the caller aborts", the tier a kind and what it's on
the thing itself, a colon and what it's on faded in the plum tried first
the same day, then no colon and the text's ink in full; not what the choice
does, "Request revision", just chosen, said by the box and its buttons,
a change or a revision told apart by what it's on, a proposal's title or
a file's name, decided 2026-11-20, in place of the choice's words, its
tier faded, over what it's on, muted, on a line of its own; the words it's on, or
goes with, a quiet chip, quoted as they'll be listed, "with" them and ×
in it where they're for reference, ones too long for it by their start,
cut, and how many lines they run to, "· 3 lines"; pointed at, or the
keyboard on them, lit where they are in the document, and a moment
after, only where some of them can't be seen there, scrolled past the
document's edge or under the form, peeked at under the chip, the view
deciding as it keeps the form, `peekedIf__Unseen_Quoted`, by its own
`hidden`, not a data attribute, which would have the form drawn anew; lit only in the runs the selection
was made across, `ids_Run`, from its anchor's to its head's, not in every
run showing the same text, as a frame shows the document's unchanged
words twice, as it is and as proposed, where lighting both read as the
selection mirrored; a queued request's words, `data-requested`, still
marked wherever they're shown: their first six lines in the text's
font, wrapped, and how many more, "… 14 more lines", gone as the pointer
leaves, not shown in full in the form, which was tried and taken out the
same day, the form opening beside them and their light in the document
showing them better; its hint only where it goes, "Added to
T-12". A card's form, headed by nothing, keeps its hint's "for this
document". It opens out of the way of the words it quotes, as best it
can, there being no placing that always can: just below where they're
shown, or, with no room there, just above, or, with room for neither, as
the words fill the view, against the editor's edge with more room,
covering as little of them as it may; across, where the menu was. One
quoting nothing opens where the menu was.

Decided 2026-11-19: the forms say nothing under their box of where what's
written goes, "Added to T-12, for this document", as doctor's form did:
the menu's is headed by what it's on, "Document retry.js", and a card's
sits in the card it's for, the task's card naming the task. Its actions alone under the box, on the right.

Decided 2026-11-20: no tier for the words. A selection is never a
request's scope, only what it goes with: "Selection: Request change"
landed in the document's list as "Document: Request change, with
selection" does, and "Selection: Request revision" in the proposal's as
the proposal's own does, two choices for one thing, so both were let go,
and with them the target and the aim `SELECTION` and a proposal's
request's `selected`. The words a request goes with are its
`reference`, whichever tier it's asked at: quoted in the form, ×
leaving them out, and listed "with" them. While it's waiting or
under way, they're underlined, dotted, in the revision's plum, wherever
they're shown, a proposal's request's in its frame's lines as proposed,
as before; drawn behind the text, as a ring is, by a run's underlay of
its own kind, `UNDERLINE`, a line under each row its words are on,
`underlinedIn__Blocks`, never the text's own underline: set on the
words, as it was, it took the place of a link's underline and a struck
word's strike, as a word has only one. The playground's log says the
words a request went with as `words`, a document's or a task's as a
proposal's.

Decided 2026-11-20: the form's chip says only the words, no "with"
before them, the menu's choice having said they go with it, ", with
selection"; tried in the chip and found to read as clutter, a label
outside it, "Selection", the other way offered. And a request sent from
the menu's form lets go of the selection, the caret left where its head
was, so the words' underline shows at once, the request done with what
was selected; put away, Cancel, Escape or let go empty, the selection
kept, nothing having been done with it, so another choice can be made
on it.

Decided 2026-11-20: a listed request, its words below what it says. What
was asked leads, so a list reads down; the words it was sent with under
it, as an attachment is, in the chip the form quotes them in, no "with",
cut where they're longer than the line; while it's edited, under its box,
above Save and Cancel. Its ellipsis at the right of its first line,
every request's in one column, not wherever what's written ends; its
actions opening in the ellipsis's place, as every ellipsis's do, ending
where it ended, the two in one spot, the ellipsis left showing beside
them, then its room left empty beside them, so Remove wasn't under the
pointer, tried first and taken out; the room they take
kept on that first line whether they're shown or not, so nothing rewraps
as they open, the lines after it the list's whole width, as a narrow
card's would otherwise be squeezed; hidden by being clear, not clipped,
so the keyboard still reaches them. A word longer than the line, a name
written out, broken where it runs out, `overflow-wrap: anywhere`, not
left running past the list's edge. A little more room between requests.
Laid out side by side first, words above, below and inline, and below
taken; the words above put the list's bullet beside them, not the
request, and inline left them mid-paragraph on a long one.

Decided 2026-11-20: a listed request's words, pointed at or the keyboard
on them, behave as the form's do: lit where they are, `data-lit`, the
viewer told which request's by `POINT_WORDS`, `litAt__ViewModel`
marking them, a proposal's only in its frame's lines as proposed, where
they're underlined; and peeked at, a moment after, only where some of
them can't be seen, scrolled away or under the card the list is in, its
peek kept to its chip by the window, `position-anchor`, not the list, as a
card's scrolling cut it off, under the chip or flipped over it. The chip
the form's, its start, cut, and how many lines. Once the request's done
with, the words aren't lit, what's there since perhaps not what was sent,
`pieces` null, only peeked at. Words taller than the window lit where
they're shown, and, some always out of sight, peeked at, their first six
lines and how many more. Pointing never scrolls: the pointer passing over
a list on its way somewhere would jump the document about; going to the
words, if it's wanted, is a click's to ask for.

Decided 2026-11-20: after a listed request's chip, where its words are,
"lines 31–33", as a move's note says where its other end is, quiet, in the
muted ink, in place of the chip's "· 3 lines"; words in a proposal's
change named by the lines the change is on, `rangeOf__Pieces`, there
being no document line of their own. Pressed, `SHOW_WORDS`: the document
scrolled to them, in its middle, or, taller than most of it, near its
top, `revealWords__View_TextEditor`; lit a moment, `data-shown`, fading,
let go by the viewer after it, `DURATION_SHOWN__WORDS`; the keyboard back
on the text, closing a card it was pressed in once the pointer's gone,
nothing selected or moved. A link, not the chip pressed, which wouldn't
look pressable, and lights and peeks already. Once the request's done
with, no link, as no lighting, the chip saying how many lines again.

Decided 2026-11-20: requests whose words overlap underlined with one
line, however many are on them, dotted where one is, dashed where more
than one overlap, `spansOf__Stretches`, `data-many`, not drawn over each
other, which made their dots a muddle; dashed, not solid, tried first,
as a solid line reads as the text's own underline, a link's. Their dots
and dashes fitted to the words by their own fitter, `dOf__Mark$`, not the
rings', which left half a dash at each end: a whole one flush with each
end, the rest spread evenly, and a gap where a dotted stretch meets a
dashed one, found by their ends meeting, so they don't run together.
Which request is on what is the lists', a request's words lit when its
chip's pointed at, and gone to from its lines. Each request a lane of its
own, one under another where they overlapped, was tried first the same
day and let go: it didn't scale, three lanes crowding the line under them
and more piling onto the last.

Decided 2026-11-20: an accepted proposal not yet applied has its rings
filled, a faint wash of their own colour, `data-state="ACCEPTED"` on its
groups: an outline what's proposed, filled what's taken, the kind of
change still told by its colour. Laid out beside indigo rings, which said
decided most loudly but no longer what kind of change, and a check
stamped on each ring's corner, which crowded the words beside it; no
other mark is a filled ring. Applied, there's nothing left to ring, and
whether it should leave any trace is still to decide.

Decided 2026-11-20: a run's underlays are drawn in layers, one for each
thing they say, in order, bottom to top: the rings' fills, `FILLS`, the
areas, an accepted proposal's wash among them; the rings, `RINGS`, their
strokes, seams and laps, and notches; and the marks that are a request's,
`MARKS`, its words' dotted line. Each layer has a group for each of the
run's groups with something in it, carrying the group's data, so a look
reads a group's state wherever it is; a group with nothing to draw isn't
drawn. A request's line cuts a band out of the rings' layer under it, a
mask, `knockout-` the view's id and the run's, the band as far round the
line as `--view-underlay-knockout`, 2.5px given none: where the line meets
a ring's edge, running along it, as an inner ring's bottom does, or
crossing it, as a side does where the words leave the ring, the line
reads whole and the ring's edge stops short of it, rather than showing
between its dots and seeming to break it. A halo round each dot, which
kept the rings whole, was laid out beside it and let go for now: the
ring's edge left in slivers between the dots could read as a dashed ring,
which says stale, and slivers under a pixel blur on a plain screen.

Decided 2026-11-20: the layers' order gives way to what's pointed at. The
proposal pointed at, its change or its item, `data-pointed` on its
groups, has its rings drawn in a layer of their own, `POINTED`, over the
request lines, cutting a band out of them, `knockout-marks-`, as wide as
the band the lines cut, instead of being cut by them: while you're on a
proposal, its rings read whole, the lines through them stopping short;
pointed away from, the lines cut the rings again. Its fills stay in the
fills' layer. The keyboard on a proposal's item doesn't yet count as
pointing at it.

Decided 2026-11-20: the examples caught up with what's handled, a case of
each opening as the example does, the host starting with requests as it
had them, `about_Task.requests`. The JavaScript example: Work out the
status first accepted, not yet applied, its move's rings filled; Cap the
delay's second request sent with words its change puts in, 30_000;
Retry a request that timed out with one more queued for its next round
beside the one in progress; Ask about the error before the round's last
round having dropped a move; the module's own requests, on lastError =
error;, cut through the ring it crosses, two overlapping on the loop's
condition, one in progress over two lines, one whose link is too long for
its line, and two done with, by a proposal and with nothing to change;
and the task's own. The Markdown example: a request on a link's words,
the link keeping its underline. The Changes document: accepted, not yet
applied, among what a ring says, and a section of request lines, words a
request's on, requests overlapping, across a ring's edge and along a
nested one's. A run's underlays aren't measured while the editor's not
in the page, as a document's cases are drawn before they're put in it,
which had drawn rings from nothing, NaN, till they were measured again.

Decided 2026-11-20: a request's words carry the side of a frame they were
selected on, `side`, `CURRENT` as they are or `PROPOSED` as proposed,
the host keeping it with them: words in a proposal's change only ever
proposed, words outside any frame as they are, staying so if a frame
forms round them later. They're marked only on that side, underlined,
lit and gone to, a proposal's request's in its frame's lines of that
side, the document's and the task's wherever lines of that side show
them, never mirrored in a frame's other showing of the same words, which
had marked one request in two places; mirrored only where the words match
word for word was weighed and let go, as two places are two places, and
marks coming and going as another proposal touches a line would puzzle.

Decided 2026-11-20: the agent at work said by a shimmer through its word,
never three dots after it, which read as the ellipsis its actions fold
behind, a line or two below: a revising proposal's status, the task's and
the document's Working in their cards, and a request's "in progress",
which had had nothing moving, `data-running`. A soft band passes through
the word's letters, left to right, easing in and out, dimming it to half
at its middle, in 1.8 seconds, then rests 1.2, a pass every two turns of
the arc, `--time_revising_htmlView` said once, on the editor, so each
pass begins as a turn does; the word plain, in its ink, where motion's
asked to be reduced. Mocked live beside the waving dots: the word left
still; an arc after it, which put two arcs on a revising proposal; the
word breathing, which, halfway, looked greyed out, as withdrawn is; and a
first shimmer, a pass a turn, a narrow band dimming the word under a
third, too quick and too strong. Of three slower ones, a pass every two
turns with no rest, the one with a rest, and a faint band as wide as the
word every three, the one with a rest was taken.

Decided 2026-11-20: a request's status in fewer letters, "running", not "in
progress", as Start makes it and Stop ends it, and "done", not
"addressed", what came of it still after it, "done (1 proposal)", "done
(nothing to change)"; the counts "7 queued · 3 running", and Stop's
titles "Stops all 2 running in this document…". A task's Done is the
same finished, at a larger scope. The task and the document stay
"Working", covering whatever's under way in them, a first pass on one
document and revisions on another at once; a proposal "Revising", the one
thing that happens to one already proposed; Proposing and Revising for
the task and the document weighed and let go, as their work is mixed.

Decided 2026-11-20: a folded frame's lines carry no notes, a move's "from
lines 41–50" hidden with its rings, review, not the preview of the lines
as they'd read once taken, which had stayed where its rings had gone;
peeked at, its notes back with its rings, as it'd be unfolded. Its gutter
signs stay, saying which lines change, as decided for folding. A move's
note pressed where its other end's in a folded frame unfolds that frame
as it goes there, the frame holding the words it goes to, by their
`data-source` and `data-side`, taken out of `ranges_Folded` with the
jump, so it lands on the note there, at the height the one pressed was,
the keyboard on it, as any jump does; the frame left unfolded, as you'd
leave it. Its other "later", keys to fold and unfold, and to fold every
decided frame, still later.

Decided 2026-11-20: a ring across an empty line is one shape. An empty
line has no text to measure, so it gave a ring no box, and a ring across
one was cut there, its parts each with their seams, the dotted sides that
say a ring goes on; a moved block, a heading, a paragraph and a table with
blank lines between them, was three rings and four seams. Now an empty line
inside a ring is bridged, a box as wide as the narrower of the rows either
side of it, so the ring's side steps down from one to the next, one path
round the whole block, `bridge$Of__Line_Empty`. Where the rows either
side aren't one over the other, there's nothing to bridge, and the ring's
cut there with its seams, as across any line break.

Decided 2026-11-20: a revising proposal's words shimmer with its status,
not breathing on a beat of their own, the view's band passing through
them, then resting; its rings swelling as the band passes and resting
with it, `swell_htmlView`, where they'd breathed every 2.4 seconds. The
band's a mask, `--band_Shimmer_htmlView`, dimming whatever it passes,
a word's own ink, whatever it is, and any light behind it: tried first
as the word's background, clipped to its letters, it hid a word's light,
which is a background too, so words lit from a request's pill were held
still, as if their request had stopped; masked, they shimmer lit, the
band dimming their light with them, and words shown, after a jump, fade
as well. Everything at work kept in step by the view: after it draws,
every turn of an arc or a mark, pass of a band and swell of a ring
begins at one moment, `inStep__Working`, however its element was drawn,
an item drawn again as it's pointed at no longer starting its arc and
its word over, out of step with its words and its rings. Each run of
words in one ink carries its own band, so a change of several tokens
has them side by side, in step, not one band across it.

Decided 2026-11-21: a request's words lit by a line, not a fill. A
proposal's request's words are almost always in one of its rings, often
filling it, and lit with a plum fill they read as the ring filled, which
is what an accepted proposal's is, only the colour telling them apart. So
the fills are gone: lit, while its chip's pointed at, shown, a moment
once its "line N" is pressed, and quoted, by the form while the form's
chip is pointed at, its words get a line under them, solid and heavier
than the request's own dotted one, over it, in the revision's plum,
`litIn__Blocks`, marking its words as before, for the peek and the jump
to measure, and drawing the line, as a request's line is drawn, with its
own attributes. Shown, it fades back to the dotted line; quoted, it shows
only while the form's chip is pointed at. It cuts no ring, nor shapes the
dots' ends, as a request's own line does, being only for a moment, and
the form's words having no line of their own yet. A filled ring means
only accepted. Mocked beside the fill and a highlighter's band across the
lower half of the words, which, inside a ring, was still a plum wash, and
sat on the dotted line.

Decided 2026-11-21: what you're on blinks as the caret does, on its
beat, 1.1 seconds, stepping, no fading between: a request's line lit
while its chip's pointed at, or the form's quoted words' while the form's
chip is, on and off, the request's dotted line showing while it's off;
and the proposal pointed at, its rings between full and faint,
`blink_Ring_htmlView`, where they'd breathed, easing, every 2.4 seconds;
but the ring under the pointer steady, as it's where you're looking, and
blinking it there jarred, only that one, its place's other side, in the
frame's other lines, blinking with the rest, as it's somewhere else to
find: the pointer's place carries its side now, `_Place_Pointed_`, and
the ring it's on is `data-hovered`. That ring blinks between full and
full, `--faint_Blink_htmlView`, so its blink stays in step with the
others' and takes up again as the pointer leaves it, where taking its
blink away would start it over, out of step. What you're on is steady;
what it points you to blinks.
Each begins on, as the caret does once it's moved, a blink kept from ring
to ring of one proposal and begun anew at another, so it's not kept in
step with what's at work. A request's line shown once its "line N" is
pressed blinks twice on the same beat, on, off, on, off, half a beat
each, and settles, the dotted line showing, before its words are no
longer shown, where it had faded. The light running round the pointed
place's ring stays smooth: a light going round, not a shade changing.
What's at work, a revising proposal's arc, status and words, the
header's marks and a request's running, stays smooth too, a shimmer and
a swell: under way, not where you are.

Decided 2026-11-21: a request's row is pointed at, or has the keyboard,
as a proposal's item is. Anywhere in it, not only its chip, it lights its
words, if it was sent with some, as the chip did; and it's marked on its
list's rule, beside it, the rule thicker there, in its ink. A request
sent with words, `data-words`, is what you're on, not its proposal: the
pointer in its row points at no proposal, so its proposal's rings don't
blink, nor its gutter's marked, only its words lit; its item still lit,
by the pointer or the keyboard in it, as being in it, which losing its
light in an item would distort; one sent with none points at its
proposal, as the rest of its item does, being about the whole of it. Mocked against a larger bullet, small
and easily lost in a long list, and a band on the row, which, in an item
lit as its proposal's pointed at, was a band inside a band; marked on
its list's rule, beside it, the rule thicker there, in its plum, as long
as it is, and its bullet stroked, a ring of plum, its middle empty,
joined to the bar by a stroke as thick as the ring's, from the bar's
middle into the ring's edge on its middle line, painted as the bullet is
so the two meet true; the bar stroked too, filled with the ground, tried
and let go.
Mocked beside the bullet haloed, a ring round it as a radio button
checked has, and joined to the bar by a short stroke, each tried and let
go once seen, and a chevron, louder than the list. Tried in between: the page's ink inside its plum, a dot in its
bullet and a line down the middle of the rule, then the ground showing
there instead, a ring for its bullet and a thinner line of the ground
down the rule, which was too subtle. The bullets are the view's own
discs, drawn the same whatever the font. It never lays a background in
an item, and is the same in the cards.

Decided 2026-11-21: in a proposal's item, a request's ellipsis sits on
its first line, just past its last word, close to what it's for, where it
had been off at the list's right edge, every request's in one column,
which, beside a short request, left it a long way from what it's for. In
a card it stays at the right, every request's in one column, as the
card's other ellipses are, its actions ending where it ended. A group's
ellipsis is always just after its heading, in a card too. A request's
ellipsis and its actions are in the revision's plum, as its group's are,
where they'd been a quiet neutral, its status the one plum thing in it. Its actions open from
where it is, starting where it started, into room kept at the end of
that first line whether they're shown or not, so nothing rewraps as they
open, the lines after it the list's whole width. A float keeps the room
but can't follow where a wrapped first line ends, so the view measures
it, after it draws and as it's resized, and draws the ellipsis back from
the room to just past it, `hugged__Fold$_Said`, `--offset_Fold_htmlView`.

Decided 2026-11-21: a request item rebuilt from first principles: what
you asked leads, and reads uninterrupted; where it stands is in the same
place in every row, always said, queued too; what it's about, its words
and their place, is there but quieter, together on one line; what you
can do is on demand, in one place in each list. So what you asked is
alone on its first line, its ellipsis where it was, and under it one
quiet line, `meta_Said_htmlView`, smaller, all of it in the muted ink,
nothing in an item plum but what can be done with it: where it stands
first, "queued", "running", leaning, shimmering, "done" and what it came
to after it, "done · 1 proposal", then, a dot between, its words' chip,
a little smaller, and where they are, all on the one line, the chip cut
shorter to keep it so, and in a card ending short of the ellipses'
column, so nothing's under them.
A request item carries its status, `status`, and "queued" is a word as
the others are, where it had been nothing. It had trailed the text, where
it landed wherever the text ended, and "done (1 proposal)" ran into what
was asked; queued said nothing, so a list couldn't be scanned for what's
waiting; and the words were a heavy line of their own, a column of grey
chips more than of requests. Mocked against the state as the bullet, a
ring waiting, an arc turning, a check done, which a ring for a pointed
row would clash with, and what it's about first, a caption over what was
asked, as a review comment shows its line, which puts the request second.

Decided 2026-11-21: nothing in a card shrinks to fit the card's height,
`flex-shrink: 0` on its parts, the card scrolling instead: a card's a
column held to 70% of the window's height, and as its requests' lists
grew, its summary, cut at three lines and hiding what's past them, was
what shrank, to nothing, in a window short enough.

Decided 2026-11-21: a request's row, pointed at anywhere, its place too,
lights its words as its chip does, the two one in that; but its words are
peeked at, where they can't be seen, only as its chip's pointed at, not
the rest of the row, tried and let go. More room between requests, 0.8rem
where it was 0.55rem, and between what's asked and the line under it,
0.25rem where it was 0.15rem, a list of them having felt cramped.

Decided 2026-11-21: a request's words stay lit, blinking, as long as the
pointer's anywhere on its row: pressing "line N" puts the keyboard back
on the text, and the focus leaving the row had let its words go, so the
jump's two blinks were the last of them; the focus leaving it lets them
go now only where the pointer's left it too. And while they're lit, the
jump's own line, blinking twice from when it was pressed, is hidden, the
lit line's blink alone, as the two, begun half a beat apart, had blinked
out of step over the same words; it shows if the row's left before its
blinks are over.

Decided 2026-11-21: a running request's line shimmers under its words,
not the words: its dotted line where it's under them, `data-running`,
split from the rest where they begin and end, and, while they're lit,
the lit line too, the view's band passing along it as it passes through
a word, dimming it to half, then resting, in step with every shimmer,
the mask laid on the line's stroke, as a line has no height of its own
for one to cover. The words shimmering was tried first, and let go, so
that where a revising proposal's ring is on the same words, its words
shimmering, the two are told apart; then a light laid over the line, a
solid band of plum, thicker than the lit line so it showed on that too,
let go as it brightened where every other shimmer dims, and read apart
from them. Still where motion's asked to be reduced.

Decided 2026-11-21: a request's ellipsis, and its actions as they open,
line up on its first line as if they were on it, where, floated beside
it, they'd sat over it: a space in the line's own size, unseen, in the
fold, its `::after`, as its `::before` is the ground it's pressed on,
making the fold as tall as the line and giving it the line's baseline,
the actions' smaller words on it, where they'd been 2px over it, and the
ellipsis centred on the fold, on the middle of the line's letters, where
it had been a little over it. The tests read both, the actions' baseline
against the words' and the ellipsis against their middle, each within
half a pixel.

Decided 2026-11-21: a proposal being revised isn't faded as well as
shimmering, as the two said the same, the agent at it, not yet to
decide, and the band, dimming words already at 55%, took them down to a
quarter, apart from its status's and a running request's line. Its
words shimmer at full ink, and its rings rest at full and dim to half
as the band passes, `shimmer_Ring_htmlView`, where they'd rested faded
and swelled, brightening as every other shimmer dims. Faded only where
motion's asked to be reduced, as nothing moves there to say it.

Decided 2026-11-21: the light round a pointed place's rings stays the
ring's own colour, faint, a fringe either side of the ring, as over the
ring it's the ring's colour, but at 60%, where it was 38%, so it's found
on the ring under the pointer, steady at full, and on its other side;
and it's a fifth of the lap and never shorter than 24px, the ring's
length the view's, `--length_htmlView`, so on a ring of one letter it's
seen going round, where a fifth was a sliver of a corner. Mocked on
solid rings beside it: wider, wider and stronger, and, before, a deeper
shade, a pale glint, the text's ink and a solid swell, each let go, the
faint fringe reading best.

Decided 2026-11-21: the room a jump makes is taken back once the
document's scroll ends, `scrollend`, in `settled`, not at each scroll
as it goes. Taking back room above the first line sets where the
document's scrolled, to keep what's shown where it is, and setting it
stops a smooth scroll where it is: a request's words shown from the
document's card, with room left above by a move's note's jump, went
two pixels at each press and stopped, as did anything else the view
scrolled smoothly without its being a jump. What's taken back is only
room scrolled out of view, so taking it back a moment later looks the
same.

Decided 2026-11-22: the editor's told its mode, `mode`, `_Mode_Host_`,
manual or a task, `MANUAL` or `TASK` with its task, never a task or
`null`, manual being a mode of its own, as the task model,
`notes/TASKS.md`, has it; and the project's open tasks, `tasks`,
`_Standing_Task_`, each its id, its name, where it stands, whether it's on
this document, and how many proposals wait on you, conflicts, requests
queued and running. The header draws the mode by its kind,
`componentMap.mode`: a task's mark, name and card, as before; manual, a
pencil in the gutter and "Manual", no card. After it, a chevron opens the
switcher, a card of its own, never open with the task's, the one pointed
at shown, or, pointing at neither, the one the keyboard's in: the tasks,
the editor's first, then those on its document, then the rest, then
Manual, each drawn by its kind, `componentMap.option`, its mark, its
name, where it stands, a figure of what's waiting, a conflict's in the
removed red, the one the editor's in saying so and not to be pressed; one
pressed asks the host to switch, `SWITCH`, with its target, and the
keyboard goes back to the text, the card closing as it does on Escape.
Given no tasks, there's no switcher. The footer, at its right, counts
them by what they're waiting on, each count after its mark in its ink,
needing you, conflicts, at work, drafts, its words its title, the rest of
the footer left for what else a footer holds. A task's states follow the
task model: `DONE` is `APPLIED`, and `DISCARDED` is new, a cross as
canceled is. The playground's host keeps the editor's mode, the example's
task to begin with, its other tasks the example's, and, in manual or
another task, shows the document as it is, nothing proposed, its edits
carrying the task's proposals across them, so they're in place when it's
switched back.

Decided 2026-11-22: the header's two halves, each a name, a hairline,
then the way to choose. The task's at the start, where the text starts:
its name, a hairline, then two arrows, the switcher, every task's, not
this one's. The file's at the end: its name, a hairline, then an icon of
files, the picker, the name's ink, the hairline, the icon's ink and the
header's right edge evenly spaced, 17px apart. Nothing over the gutter: the
file's mark sat there, the file first, as markers about the file's lines
are, but with the task at the end its card hung from the right edge,
away from its name, and the document's opened under its own name, saying
it twice; swapped back, each card opens where it reads best, the task's
under its name, its content set under it, saying its id and where it
stands, the document's from the right edge, its head saying the file's
path. No marks in the header: a state's said by a name. The task's, as
the header only ever shows three, an editor whose task ends going to
manual: working, the name shimmering, with whatever else is at work, or,
where motion's asked to be reduced, Working shown after it; your turn,
the name as it rests, what's waiting said beside it; a draft, leaning,
in the name's own ink, no word after it, as no other state has one,
where Draft was shown after it, and the name faded, which read as
disabled, till 2026-11-23. The file's the same: its name shimmering while
work's under way on it, otherwise as it rests, the header's counts
saying how far it's got. Manual's No task, muted, what's selected, as a
task's name is, where Manual named the mode till 2026-11-23.
The switcher's list keeps every mark, as it's scanned. Spacing, measured
by the ink as drawn, read from the pixels: the task's hairline 13.2px
from its name and 13px from the arrows, which read about 13.9px and
14.7px, the arrows' side roomier by eye, as at 11.5px, reading even, and
at 12.5px they looked crowded against it, and at 13.5px too far, the
arrows drawn half a pixel right of their square's middle, as the square,
on whole pixels, can't move by half; measured as the eye takes them in, the pixels blurred as by
sight and the room read, row by row across the letters' height, to where
the blur reaches 15% of black, as a type designer spaces letters by the
white between them, not their nearest points: the bold name pulls closer
and the arrows' thin grey line ends recede; the two hairlines one step of
1.25 apart, the task's tighter, its switcher one with it, the file's at
17px, one with the edge's margin; the arrows' square, pointed at, clear
of the hairline; the task's to within half a pixel by its name, as
the name's flush with the text under it and its card's, the hairline on
a whole pixel after a name ending on a fraction, tried set at the end of
a box a whole number of pixels wide, which kept its gap the same for any
name but put it up to a pixel and a half off the text's start; the
file's even, 17px from its name's ink to the hairline, from the hairline
to its icon's ink, and from that to the header's edge, the icon's square
a whole number of pixels wide, as every icon's in the header is, so its
ink sits as far into it on either side; tried near halfway at 13.5px and
13px, 14.5px and 14px, 15.5px and 15px, and 16.5px and 16px, and at 13px
and 15px, the room widening toward the edge, as the task's was at that
end, which read lopsided beside the task's; a name's last letter keeping room past its ink, about 0.08em in
the editor's font and 0.02em in the header's bold, taken off before its
hairline; each icon's square a whole number of pixels after its
hairline, as both are drawn on whole pixels and a name isn't, so that
gap never jumps by one with a name's length. Tried, for the task's, on the left: 16.5px and 15.5px, as it was at
the end, reading as a gap after the name, 10.5px either side and 11.5px
before it, the arrows' square crowding the hairline; and at the end: 10px either side of
each, 14px either side, 13px before and 15px after, 11px before, the
header's own gap, the arrows as far after the hairline as from the edge,
halfway at 15.5px, and 16px, 16.25px and 17.5px before it; the arrows
tucked to 10px and 7px from the edge, at the header's padding, and in a
full-height cell of their own. The task's cards open from where the text
starts, the file's two hugging the editor's right edge; the header a
container of its width, so no card reaches past it, hidden or shown, in
a narrow editor. The editor's given the project's files, `files`, paths;
the picker, never open with the document's card, lists the files in this
editor's task, how far each has got, the one shown saying so, then the
others, or, in manual, the project's files; one pressed, or a task's
file pressed in its card, its path a button, asks the host to open it,
`OPEN_FILE`, and the keyboard's put back in the text. Tried before it:
the task first, its mark in the gutter, as doctor's was; the file first,
its mark in the gutter, the task at the end; the task's mark before its
name, and Manual's pencil; the arrows as a word, Switch; the arrows
before the task's name, its mark at the edge; a breadcrumb, Tasks › the
task › the file; one search across tasks and files; and both pickers in
the footer.

Decided 2026-11-23: what's shown says file, never document: the right-click
menu's middle tier, File:, the forms, Request a change to this file and
Revise this file, the tooltips on starting and stopping, every file it
touches, a quote's jump, Show … in the file; a board task touching the file
in view says in file; the switcher's Switch task. The code and these notes
keep document for the concept, the text an editor holds, as they always
have.