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
- your own edits made proposals, as a suggesting mode, when the host says;
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
// a document: one line at least, each its text and its marks
interface _Document_Model_ {
  lines: _NonEmpty_<_Text_Model_>
}

interface _Text_Model_ {
  text: _Text_Line_NonTerminated_
  overlay: Array<_Mark_Text_>
}

// a mark over a range of a line's text: a kind the host names, bold, a link,
// and what that kind needs, a link's target; what it means is the host's
interface _Mark_Text_ extends _Range_Text_ {
  kind: _Kind_Mark_
  data: _Data_Mark_
}

// what one source proposes, as changes to the document
interface _Changes_Source_ {
  source: _Id_Source_
  changes: _NonEmpty_<_Change_>
}

type _Change_ = _REPLACE_Change_ | _MOVE_Change_

// what every change has: its span, and what it becomes, one line or several;
// a change that takes text out becomes one empty line, as "" parses to one
interface __BASE_Change_<Kind extends string> {
  kind: Kind
  range: _Range_Document_
  next: _NonEmpty_<_Text_Model_>
}

// a span and what it becomes: an empty span puts text in
interface _REPLACE_Change_ extends __BASE_Change_<"replace"> {}

// a span taken from where it is, and what it reads as where it goes
interface _MOVE_Change_ extends __BASE_Change_<"move"> {
  to: _Position_Document_
}

interface _Range_Document_ {
  from: _Position_Document_
  to: _Position_Document_
}

// a line's index, and a code point's offset in it: both proofs, made only by
// the parsers that check them
interface _Position_Document_ {
  line: _Index_Line_
  offset: _Offset_Text_
}
```

A sketch. It was written out once, as `source/Model_Editor.ts`, and taken
back out: the view's scenes come first, written by hand as what's shown, and
the projection from a document and its changes to what they show is what
settles these types. A source's id, a mark's kind and its data are the
host's, given and only handed back; offsets and line indices are proofs. The line's text proof, `_Text_Line_NonTerminated_`, and its parser
move to the model once there is one, as the model can't depend on the view.
What the parsers at the boundary check, once there are: ranges inside the
document, `from` not after `to`; marks inside their line; changes from
different sources never crossing, one only ever wholly inside another's
removal.

- **a change is a complete next state, of its span:** what the span becomes,
  text and overlay. What changed within it is never written down: it's
  derived, as doctor derives it, by `compareTexts` in its
  `source/shared/text.ts`, the text cut into words, runs of spaces and other
  characters, the two compared word by word, then the marks of the words
  kept compared character by character; so: removed, inserted, replaced,
  replaced and restyled, restyled. How fine is a presentation's choice, a
  region's kind's: words for prose, tokens for code. So the two never
  disagree, an agent's slip shows as a change, and what a round changed is
  the same comparison, of two rounds.
- **spans, not lines:** a span is any range, a phrase in a long line of
  prose, a sentence, lines. A line is a granularity a host can choose:
  doctor's adapter would send a span for each line it changes, as its holders
  are lines; another host, a sentence. The editor assumes nothing.
- **one source, many changes:** what's decided together is one source;
  what's decided apart, two. The editor needs no groups of its own.
- **moves:** explicit, as doctor's `MOVE` is, never only a removal and an
  insertion, which loses what moved, and shows a move edited on the way as
  all new. What a move is, within a line, from line to line within what's
  shown together, or out to somewhere else in the document, follows from
  where its ends are, and isn't stored; one that splits is several moves of
  one source. Moves of whole lines come first; within a line, and splits,
  after spans and frames work, the derived differences showing them till
  then as what's taken out and put in.
- **nested, never crossing:** a change from one source may lie wholly inside
  another source's removal, as a rename's place does inside lines another
  proposal takes out: it's the inside one's fallback there, applying only if
  the removal's rejected. Decided in any order, the two come to the same:
  both taken, the removal takes the lines, and the inside change, what it
  hung on gone, is dropped, as an anchor says when what it hung on is gone;
  the removal rejected, the inside change applies; the inside one taken
  first, the removal's anchors carry through it, and it takes the same
  lines. Changes that cross, neither inside the other, are a conflict the
  agent resolves, or the host splits, never the editor.
- **for now:** besides nesting, changes from different sources never
  overlap, nor does a move's span or where it goes fall in another source's;
  positions are as the document has them now, anchors that carry them
  through what's accepted coming after.

Where an agent writes the changes, as doctor's does, it writes them as
agents write edits reliably: the text as it is, quoted exactly, and what it
becomes, in full, small, a sentence to a function; never a line number or an
offset, which they get wrong. The quote is found where it matches once, or
the change is refused, and why, not found, or found twice, as `str_replace`
does; then turned into changes. Asked for granular changes, agents do worst;
asked for whole files, they're slow, and leave parts out, or change what
they weren't asked to. The parser for it is the host's, or one the editor
offers it.

## how it shows them

As a document editor's suggesting mode does, a change's own words are **in
the document**, as real content you edit, marked; what it replaces is shown
beside them, read-only. So:

- what's added reads in place, green, and is edited where it is;
- what's changed in place shows its new words, with the old ones beside;
- what's taken out shows where it was, ringed, never struck, a strike being
a document's own mark; - what's moved shows at both its ends: within a line,
both in it; within what's shown together, linked in the margin; out to
somewhere else, a mark where it leaves, "moves to line 40", and where it
lands, "moved from line 12", each going to the other, as doctor's do.

**every proposal shown at once:** all of them, each change styled as what
it is, word by word, none hidden behind or put aside for another. Which
proposal a change is from isn't its colour, which keeps its meaning; it's
shown by pointing: at a change, its proposal's changes outlined and its bar
lit, the others still showing; the keyboard moving from change to change
does the same, the one it's on current.

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
  one, its example, `?example=javascript`, drawn with it.
- **drawn two ways:** an overlay's runs are on the text, or under it.
  - **on the text:** a run is only data on the segments it covers, each a
    flat span: no element is a run, so no run stays whole, and none is
    ranked over another; overlapping runs are no matter. What reads as
    continuous across spans, colour, background, underline, strike, a
    perspective draws from the data. What has edges, a box, a ring, round
    corners, would break at every span, so it's drawn under the text. A
    span has room for one role, so what a change means isn't told by the
    text's markup: the proposals' list, and a line's description, say it.
  - **under it:** each run a text underlay, a stretch of text from one
    position to another, with data as a segment has, drawn behind the text
    it covers. It never moves the text, and nothing in it depends on how
    the text's cut into segments or drawn in spans: text underlays overlap
    freely, and draw what a span can't, as doctor's change boxes in the
    document were Monaco's decorations behind the text. They're pointed
    through, as what's pointed at is the text.
  - **one `<svg>` for each run of lines:** text is drawn in runs of lines:
    the unframed lines between frames, and a frame's `CURRENT_LINES` and
    `PROPOSAL_LINES`, each drawn by the same component wherever it is, with
    one `<svg>` behind its lines; a frame's list has none. A run's svg holds
    everything behind its text, in one order: search's matches, then the
    proposals' targets, with their changes, then the selection, on top. In
    the run, its own stacking context, the svg's over its lines'
    backgrounds, as a band a perspective might give a line, and under
    their text: the svg at `z-index: 0`, the text at 1; a
    section's background is under all of it.
    Each underlay is one `<path>`, tracing every row it covers, wrapped or
    across lines, as one shape, so a fill or an edge goes round all of it,
    with no seams between rows; and SVG's paint gives changes more than
    colour to be told apart by, a stroke following the shape, dashed, a
    pattern's fill.
  - **across runs:** what's in more than one run, a proposal, before in
    `CURRENT_LINES` and after in `PROPOSAL_LINES`, or the selection, which
    follows the document's order, through a frame's `CURRENT_LINES` and
    past its proposed lines and list, is a group in each run it passes
    through, each carrying its data, `data-source`, so a perspective styles
    it as one.
  - **a proposal's target** is a group, `<g data-source>`, in each of its
    frame's text runs: a path over its span, all it covers, what the agent
    sent a next state for, whose changes are worked out inside it, the words
    they leave as they are between and round them too, a whole function,
    say, of which a line's middle differs; with no span sent past its
    changes, from its first change to its last, `data-underlay="targets"`;
    and in the group, a path for each of its changes, `data-change`, its
    kind, without the spaces at its ends, so its ring is round its words
    alone. A change is drawn there, a ring round its words in the "changes"
    perspective, as doctor's are, never on the spans: a span keeps only
    what's the text's own, its marks and its syntax. The target is drawn
    too, but the perspective shows none: what a proposal targets, its lines'
    labels say. Shown, filled or outlined, a target reads well for one
    proposal alone, a function sent whole with a line's middle changed; but
    where several proposals' targets cover the same lines, as in a function
    every proposal touches, they stack into patches or cross into a maze,
    and say nothing of which covers what, so none. Shown for one proposal
    at a time, the one pointed at, or current, is still open.
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
    underlay; proposals' targets and their changes, worked out by the
    playground as the projection will; the changes' colours on the paths,
    not the spans. A path is one shape where each row it covers reaches over
    the one after it; where one doesn't, as a stretch from a line's last
    word to the next line's first, it's in pieces, still one path. The
    measuring walks the view model's runs, `runs`, and finds each one's
    lines and svg by its id, drawn as `data-run`; the class keeps the runs
    it last drew, to measure them again when the view's size changes. Not
    yet: search, the selection, drawing only what's visible.
- **in the DOM, data, not style:** what a run is, is `data-*` attributes on
  the spans it covers, each overlay's under names of its own: the changes'
  `data-change`, its kind, `data-side`, `data-source`; marks' `data-marks`.
  The editor ships no look for any of them: its own stylesheet is layout,
  rows, gutters, frames, where text underlays go; without a perspective, a
  change looks like the text around it.
- **a perspective** is how the overlays look, and which show: an attribute
on the view's container, `data-perspective`, and stylesheets keyed on it and
on the runs' data, so switching is one attribute set, the browser restyling
all of it, nothing drawn again. The editor offers one, "changes", doctor's
look, in `source/perspectives/changes.css`, which a host uses or puts its
own in place of: a ring round a change's words, red where they go, yellow
where they're replaced, green where they're new, dashed where only their
look changes; a line in a frame saying what it becomes in its gutter, its
label in the same colours, a number red taken out, yellow changed in place,
a sign green put in, yellow changed, never with a band across its text,
which doctor has, so the code stays even, and the gutter's where to look for
which lines change. Never the text's own colour, a strike or an underline:
those are the text's, its marks' and its syntax's, which show through every
change. One could mute every change but replacements and split those by what
kind of replacement each is, from a `data-detail`; which is on, and how it's
turned on, is the host's. A perspective needing other elements, not only
another look, is drawn again from the overlays by another mapping: rarer,
and later.

**frames:** a range of the document's lines, taken out of the flow and
shown in place of themselves, with their possible future. Each line of the
document is drawn once, in the flow or in a frame, and the lines after a
frame are numbered as the document numbers them, what's proposed not the
document's till it's accepted. A frame's text sits where the document's
would, every line in it, as they are or as proposed, at the same left and
the same width as every line around it, in the rhythm of the lines, as
doctor's proposals' lines sit where the document's words are: its rows'
bands run from edge to edge, over the view's padding. A frame is made of
parts, in order:

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
so it can be loose, and change, and nothing be anchored again. By default
it's the lines proposals touch, run together where they'd meet; a host can
widen one, a function's lines for what's in the function. Frames never
overlap, and never hold frames. With one proposal one reads as doctor's does
now: its lines, its version under them, its bar. Later: a frame folded, to
its lines alone, what it would do put away, as doctor folds a proposal.

**a proposal is a decision, a change a place, a frame a view of places:**
three things, kept apart. A proposal, a source, is what's decided, at once,
wherever its changes are; a change is a place, anchored in the text; a frame
is only some lines, near each other, shown with what they'd become, and its
list the decisions present there. So a proposal isn't a frame's, and one can
run through many:

- **a thread** is a proposal with places in several frames, as a rename is,
  everywhere its name is. Every frame it runs through lists it, the item
  saying where it is, how many of its places are in this frame, of how many,
  "6 of 9 places", its actions deciding it everywhere, in every frame at
  once; for a proposal wholly in one frame it says nothing. Later: a way to
  step to its next place, once commands are; its rationale once, where it's
  first listed, the others pointing to it, if every frame's saying it again
  is noise; a mechanical one, a rename, maybe no frame at all, its places
  ringed where they are, one item for it. Across documents it's the host's,
  which knows each source's id in each document: an item can say "and 4
  places in other files" from what the host gives, and deciding in one
  editor is a command the host sends on to the others.
- **nested places:** where a thread's place is inside another proposal's
  removal, its change there is nested, as above, and shown so: on the lines
  as they are, inside the removal's ring, its own ring dotted, `data-within`
  the removal's source; on the lines as proposed, every proposal taken, gone
  with the removal, as it would be; and its item, in that frame, says it, "1
  only if “Drop the onRetry hook” is rejected". A place is counted once: on
  the lines as they are, every change but a put-in one; on those as
  proposed, every put-in one.

Where a place is, which frame it's in, and so what an item says, is the view
model's; for now the playground's `blocksWith__Frames`, as the projection
will. The gallery's "proposals-thread" scene shows it alone; the JavaScript
example, `?example=javascript`, among every other case so far.

**the gutter:** a line is a row of two cells, its gutter, then its text, so
its gutter keeps to its row however its text wraps, in a frame or not, and
nothing's measured to line them up. In the gutter: a label, the document's
number for the line, or, for a line proposed, none, but a sign: `+` where
it's put in, `~` where it's changed in place; as wide as the longest label,
which the view model says, `charCount_Max__Label_Gutter`, worked out when
it's built, by `viewModelOf__Blocks`, so every row's text starts at the same
left. Then a lane, where folding goes, later. A frame, as doctor draws a
proposal: a bar down it, green, in the lane, at the gutter's right, between
the numbers and the text, beside everything in it, its list too; its lines
as they are on a neutral band, every one, changed or not, so they read as
one, set apart from the document around them, each saying what it becomes in
its gutter, as a perspective says; its lines as proposed on a green band;
its list on the same green a shade darker, each item's title and why on the
left, its actions on the right, the first the main one; the list's items
starting where the lines' text does. The view model says each line's label,
as the text it shows, `"12"`, `"+"`, `"~"`, `""`, already decided, and what
the line becomes; the view only draws them.

**proposal items, the editor's:** each proposal's item, in a frame's list,
is drawn by the editor, not left to the host: its title, why it's proposed,
and its actions, a button each, from what the host says in the view model,
`{ source, title, rationale, actions }`, an action a label and a command,
`{ command: "accept", label: "Accept" }`. Which actions there are, and what
they're called, is the host's; reviewing, the buttons, the keyboard, focus
moving between the text and the list, a screen reader's list, is the
editor's, the same in every host. A button carries only its command, as
`data-command`: choosing it is a command, through the pipeline, which the
host hears as an observer and acts on, what accepting means beyond the text
its own; till the pipeline's built, the buttons are drawn and do nothing.
There were slots once, room left in each item for the host to draw in;
they're gone. If a host needs something no item has, one's added for it.

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
next round. Editing outside one changes the document, or, in suggesting
mode, makes changes of your own, a source of your own.

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
class, `_View_TextEditor_`, in `source/View_TextEditor.tsx`, holding what
lasts between draws: its container, its components, and an observer of the
container's size. `draw(viewModel_TextEditor)` draws the view model into the
container, as an element of its own, `.htmlView_editor`, leaving the
container as the host made it, its classes, styles and attributes the
host's; then draws the text underlays, and the observer draws them again
whenever the container's size changes. The view model's types and parsers
are `source/ViewModel_TextEditor.ts`.

How it's drawn:

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
  `draw__Node_Jsx` in `source/Jsx.ts`, ours, makes them into elements in a
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
between proposals and decide them, a screen reader's, assistive
technology's edits, voice.

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
Then, in order: suggesting mode, your edits made proposals; what a round
changed since the one before; amendments; and doctor's editor replaced by
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
