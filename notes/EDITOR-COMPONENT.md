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
  side by side, each with its state, waiting, accepted or rejected;
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

- **a document:** its text, as lines of characters. What kind of text it is,
  code in some language, Markdown, prose, isn't the model's to say; to the
  model, it's text.
- **regions:** parts of the text given a kind by a module, and with it how
  they look and what editing means in them: a block of code in Markdown, a
  heading, a function, a quoted reply; or the whole document, as a file of
  code is one. They move with every edit, as anchors do, and nest, a block
  of code in a list item in a section. Which kinds there are is the
  modules' to say.
- **a proposal:** a change to the document, as the operations that make it:
  text written, taken out or moved; with an id, a state, waiting, accepted
  or rejected, and its rounds, each a version of it and who wrote it.
  Proposals don't nest; a change asked of one is a round of it.
- **anchors:** where a proposal is, held as positions in the document that
  move with every edit, so a proposal stays on what it's about however the
  document around it changes, and says so when what it hung on is gone.
- **one history:** every edit, to the document or inside a proposal, is a
  transaction, undone and redone as one, mapped through the anchors.

Still open: whether regions are only read from the text, as Markdown's are
by parsing it, or can also be held by the model, as a host marking a part
of a document would.

From the model come the questions the editor answers, without a screen:
what the document is with a proposal applied, or with all that are
accepted; whether a proposal still fits; what a round changed since the one
before, words added, changed and taken out.

## how it shows them

As a document editor's suggesting mode does, the proposal's own words are
**in the document**, as real content you edit, marked; what it replaces is
shown beside them, read-only. So:

- what's added reads in place, green, and is edited where it is;
- what's changed in place shows its new words, with the old ones beside;
- what's taken out shows, struck, where it was; what's moved shows where it
  goes, a mark where it was;
- each proposal has its bar, where it's decided, drawn by the host.

Editing inside a proposal changes the proposal: a selection across its
lines, Enter making a line, Backspace joining two, pasting, undo, all as
anywhere else, and kept inside it, so an edit can't leak out of a proposal
into the document. Editing outside one changes the document, or, in
suggesting mode, makes a proposal of your own, divided as anyone's are: a
change in place for each line, a run of new lines as one.

## how it's built

Four parts, as Monaco's are, its text model, view model and view, and the
editor that holds them:

1. **the model**, above: the document, its proposals, their anchors and the
   one history. Plain data and functions over it, with no screen in it, and
   knowing nothing of the editors that show it, so several can show one.
2. **the view model**: what one editor shows of the model, worked out from
   it without a screen: where each proposal sits in the flow, which parts
   are edited and which only read, which proposal each part belongs to,
   where old words show beside new ones, and how each region looks, as its
   module says. And that editor's own selection,
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
   proposals, tells it what's new from elsewhere, and acts from its own
   controls, all by commands, and hears what's edited and decided as an
   observer.

The model doesn't hold them together: that would put a screen in it.

What holds state, the DOM and its listeners, the view and the editor, is a
class, so its fields show when it's inspected in the browser's tools, which
a closure's don't. Data stays plain, as `type-construction.md` says: the
model and the view model are data, and functions over it.

How it's drawn:

- **state is changed at once, drawn once a frame:** each input is applied as
  it arrives, so the next one sees the state it left, and the DOM is written
  once, on the next animation frame.
- **only what changed is drawn again:** each line keeps its element, found
  by its id, and a line that's the same object it was is passed over; the
  view model is worked out again only for the lines a transaction touched.
- **layout is read once a frame, after drawing:** reading it between writes
  makes the browser lay the page out again each time, which is where editors
  get slow; each line's measurements are kept until the line changes.

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
- a proposal of new lines side by side is one, however many it spans.

## the first thing it has to do

Doctor's roadblock, and nothing more: a document with proposals in it, the
proposals edited in place, a selection across a proposal's lines, Enter,
Backspace, paste and undo working there as in the document, edits kept
inside the proposal they're in, and each proposal accepted or rejected.
Then, in order: suggesting mode, your edits made proposals; what a round
changed since the one before; amendments; and doctor's editor replaced by
it, through a binding from doctor's documents and tasks to its model.

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
documents; anything doctor's tasks say, which stay doctor's.

Editing text written right to left, or both ways in one line: it's shown as
the browser lays it out, but edited in the order it's written, which isn't
always where the eye expects, as the caret, the selection and where a click
lands all differ there. Every other writing system is in, as it costs little:
the browser lays them out, and `Intl.Segmenter` finds their characters and
words, which English needs anyway, for emoji and accents.
