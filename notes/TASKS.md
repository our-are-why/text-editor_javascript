# tasks

The task model for the system this repo grows into around the editor: what a
task is, which one you're in, where your edits and requests go, how a task
moves from one state to the next, and which part of the system holds what. A
draft, begun 2026-11-21, to settle before the task UI is drawn, so the UI draws
a model that won't shift under it, and the subsystems built after it have it
as their spec.

It starts from doctor's design, `notes/tasks.md` in
https://github.com/our-are-why/doctor, and from what the editor already does.
Where it keeps doctor's, it says so; where it departs, it says why. What's
still to decide is under **open**, at the end, each with a recommendation.

## words

- **document:** a file, as it's stored. Its stored text is the **trunk**.
- **task:** a branch off the trunk, across any number of documents: its
  requests, the proposals that answer them, and your edits made in it.
- **version:** a document's content at a moment, known by its hash.
- **head:** a task's version of a document: the trunk's current version
  with what's accepted into the task and what you edited in it applied.
  Never kept as text.
- **request:** something asked of the agent, aimed at the task, a document,
  some words, or a proposal (a revision).
- **run:** the agent working on requests. A request is queued, running, or
  addressed.
- **mode:** what an editor's in, always one: manual, or a task, then its
  **active task**. Each editor has its own.
- **manual:** the mode for editing the trunk itself. A mode in its own
  right, not the absence of a task.

Decided 2026-11-23: Apply, where it was Complete, which says what it
does, what's accepted in a task and your edits in it applied to every file
it touches, and doesn't sit beside the proposals' Accept all meaning
something else; a task applied shown as applied, and one with nothing left
as applicable, where ready to complete was too long. A draft's Discard is
shown as Cancel, as every task's is, and it ends as discarded. Manual is
shown as No task, in the header and the switcher, saying what's selected,
as a task's name does, not what mode the editor's in, which it never says
of a task. Decided 2026-11-24: the code and these notes say apply too,
`APPLY` and `APPLIED`, complete gone from both; they keep discard and
manual, as they keep document where what's shown says file.

## a task is a branch

Kept from doctor. The file holds the trunk until a task's applied; a task's
head is kept apart from it, so anything reading the files, git included, only
ever sees finished work. Accepting a proposal applies it to the head, not the
file, which is what the editor's "accepted, not yet applied" already draws;
applying the task merges the head into the trunk. Git is the history: only
what open work needs is kept, under **what's kept, and for how long**.

## the mode: manual, or a task

Each editor is always in one mode: manual, or a task, one task at a time;
editors side by side each in their own, under **several editors**, below.
Manual is named as a mode, `MANUAL`, beside `TASK` with its task's id, never
stood for by a task left out, `null` or none. The mode says two things only:

- **what you see:** in manual, each document's trunk; in a task, its head,
  with the lines the task has changed marked, as doctor's design had it, a
  neutral mark in the gutter, the file's once the task's applied;
- **where your edits go:** in manual, to the trunk, written to the file as
  now; in a task, into its head.

It doesn't say whether work happens. **A departure from doctor:** there,
making another task active parked the one before, `parked`, and only the
active task got the agent's turn. Here, a task that isn't active goes on as it
was: what's running keeps running, and its proposals wait for you. Switching
is only changing what you're looking at and editing. So there's no parked
state: the mode is where you are, not a state of any task.

**Tasks are flat,** settled 2026-11-22: each stands on the documents
alone, never on another task, and none waits on another. A task started
is worked on, whatever other tasks are doing: the agent part serves every
task that's started, by as many agents as that takes, and no task sees it.

Switching, in an editor, to another task or to manual, redraws that
editor's document as the mode now has it, the task's head or the trunk, and
no other editor's. Nothing is lost by switching.

## a task's states

Open, as the editor already has them, `_State_Task_`, and resolved, each
a way a task ends:

| state | means |
|---|---|
| `DRAFT` | made, nothing started yet |
| `WORKING` | something of it is running |
| `YOUR_TURN` | started before, nothing running now |
| `APPLIED` | resolved: its head made the document's |
| `CANCELED` | resolved: its head let go, your edits in it too |
| `DISCARDED` | resolved: a draft let go, never started |

`DRAFT`, `WORKING` and `YOUR_TURN` are worked out from its requests' runs,
never stored: `WORKING` while any request of it is running, `DRAFT`
while none has ever been started, `YOUR_TURN` otherwise. The resolved states are stored, as they're decisions, each with
when it was made and who made it, and a resolved task's kept, with all it
held, till it's collected, under **where it's kept, and collection**. The
editor's `DONE` becomes `APPLIED`, and `DISCARDED` is new.

How it moves:

| what happens | from | to |
|---|---|---|
| a start, at any scope: a request, a proposal's revision, a frame, a document, the task | `DRAFT`, `YOUR_TURN` | `WORKING` |
| the last run ends, or Stop | `WORKING` | `YOUR_TURN` |
| Apply, once nothing's running | `DRAFT`, `YOUR_TURN` | `APPLIED` |
| Cancel | `WORKING`, `YOUR_TURN` | `CANCELED` |
| Discard | `DRAFT` | `DISCARDED` |

Decided 2026-11-22: `WORKING` and `YOUR_TURN` say too little, as part of a
task can be the agent's while part waits on you: a round revising one
proposal while others are ready to decide. So a task has one lifecycle,
draft, open, then applied, canceled or discarded, and, while it's open,
two parts side by side, worked out from its runs and proposals, never
stored, shown together wherever a task's standing is: **yours**, a
conflict, what's to decide, requests queued and not started, or, with
nothing left on either side, that it's applicable; and **the
agent's**, what's running. Each says its most pressing, yours in the
proposals' indigo, a conflict in the file's teal, requests queued, as
the editor says them, "2 queued", in the revision's plum, still, though
they're yours till you start them, the agent's in the revision's plum.
A task's menu offers Start all for what's queued, Stop while anything's
running, and Apply only once nothing's left on either side. A task with anything of yours needs you, even while the
agent works on the rest; it's with the agent only when nothing of it
waits on you. Counted, a task counts under each part it has. The
editor's still told `_State_Task_`, `WORKING` meaning something's running,
as the header's name shimmers by, and the parts come from its counts.

## abilities, and what decides them

Settled 2026-11-22. The model gives abilities; who uses one, and when, is a
layer over it, never the model's to say:

- **anyone makes requests,** you or an agent: a request records who made
  it, and whether an agent's may go straight into a task, or waits for you
  to take it, is decided above the model;
- **someone applies a task,** you, or an agent you let: never the model
  on its own. Applying on its own, under conditions, is a layer to build
  over Apply, not part of it;
- **collection's asked for,** by you, or by an agent judging what's done
  with: under **where it's kept, and collection**.

Starting at any scope is the editor's queue, kept: a request is queued till
something starts it, a single request, a proposal's revision, a frame, a
document's or the task's. Doctor started a task whole, and gave the agent its
turn by `doctor wait`; that's how the agent's told, which belongs to the agent
subsystem, below, not to the task's states. Doctor's `submitted`, the agent
handing the task over, is a request addressed here, one by one, with what it
came to.

## drafting

Drafting is composing a task before starting it. It isn't a mode of its own,
as it was in doctor: a draft is a task in `DRAFT`, and you draft it by making
it active.

- A draft's made with its first request, as doctor's was, so a task is
  never without one: a request sent from manual, not started, or Draft task,
  which opens the request form, the task made as it's sent.
- Requests made in an editor go to its active task, queued, so in an editor
  drafting they go to the draft, in whatever document it shows, marked as
  requests are now.
- Your edits while a draft is active go into its head, so you can prepare
  changes before starting it. That answers one of doctor's open questions.
- To compose the next task while the agent works on this one, draft it in
  another editor, or in this one, the one being worked on going on as it
  was. That answers another.
- Start, in the draft's header, starts its requests; the draft becomes
  `WORKING`.

## making a request

- **In a task:** it goes to the editor's active task, queued, or started at
  once. The editor's form already offers both, `isStarting`.
- **In manual:** it makes a new task with that one request, and makes it
  that editor's mode: a draft if it's only sent, working if it's started.
  Doctor's quick task is this, started. The editor's in the new task from
  then on, its head the trunk until something's accepted or edited.
- **Aims** are the editor's, `_Aim_Request_`: the task, a document, some
  words, or a proposal, which is a revision. Doctor's node target, a block, is
  some words of it here. A request with the task as its aim reaches every
  document the task's in, or the project, narrowed by its own words, as
  doctor's untargeted ones did.

## your edits

- **In manual:** to the trunk.
- **In a task:** into its head, wherever it's typed, never the file: in a
  frame, on a proposal's words, the proposal's next round, yours; anywhere
  else, a line shown once too, a change of yours, a source the host names,
  `source_Yours`, described as any proposal is, "Your edits" in the
  playground, kept in the task's head as yours, applied with the task and
  let go with it. Decided 2026-11-25, tried in the playground first: all
  lines the same, in a frame or not, frames deciding only how it's shown.

**How your edits are shown,** decided 2026-11-25. Typed on a line shown once,
a frame of your edits opens round it, as every change is shown twice, the
line as the file has it above, hatched, read only, and as yours below; a
frame of only yours small, its lines and nothing else, no head or list, as
there's nothing in it to decide; frames of only yours on lines next to each
other one frame, a line put in between too, never joined to a proposal's
frame beside them, which stays the proposal's. The line you're typing on
held where it was as the frame opens, what's above moving up, not what's
under the caret, while an edit keeps to its line; Enter, or a line joined,
moves the caret as it would. Each edit of yours its own, pointed at alone:
a proposal's changes belong together, one idea of the agent's, so pointing
at one lights them all; yours share a source only because they're yours,
so pointing at one lights it, and only your edits' item, where a frame has
one, lights them all. Your edits' rings waved, decided 2026-11-25, drawn on the
canvas at three lengths, then in the editor, gentle chosen: a wave 13px long,
1px high, so a
frame holding a proposal's changes and yours tells them apart at a glance,
the proposal's straight; fitted to the ring as dashes are, every corner at
the wave's outermost, bent round, mirrored across its two sides, each side a
whole number of half waves as near 13px as fits, a side too short for a wave
a single dip, so a single letter's ring waves as a line's does; rows on lines
next to each other one shape only where they share columns, as every ring
is, and where a line break cuts a ring, its seam straight and dashed, the
wave meeting it midway.

Still open: **joining and splitting frames by hand,** a frame range of
yours, stated against the head's version and carried as changes are, over
the agent's or the host's, which shape the frames you're given; a change's
extent the floor, never cut, as a ring is one shape, a request's words a
soft one, kept whole by default but cut by a split you make, as an
underline drawn in two pieces is still one request. Kept with the task, by
document, beside its head. Waits on the host's frame ranges being carried
across versions, which an agent giving them needs anyway.

This keeps the editor's frames decision of 2026-11-18: there's no suggesting
mode turning every edit into a proposal. In a task, your edits are the task's,
as doctor decided, as plain edits to its head.

## versions, and conflicts

Settled 2026-11-22, as the foundation the rest stands on.

**A version** is a document's content at a moment, known by its hash.
Every change to a document makes a new version, recorded as the edits that
made it: these words put in here, those taken out there. Nothing older
than the current version is kept, and there's no history: git is that.

**The only text that's whole is a document's own:** the file, and one copy
of its current version, kept by the documents part while an open task is on
it, to tell what changed when it's changed from outside. Everything else is
a change or a range, stated against one layer:

- a task's changes, against the document's current version;
- a task's proposals, against its head: the document with the task's
  changes applied;
- requests on words, against whatever their words are in.

Each names its layer's version by its hash. A position is exact within its
layer, characters 120 to 135 of that version, found by building its layer
and reading there, never by working through deltas on deltas. Relative
across layers, never across time: when a layer changes, all that's stated
against it is restated against its new version at once, and the old one's
let go. Nothing accumulates.

**What moves a document:** typing in manual, a task applied, or an edit
made outside the system. One rule then, at every layer: what's stated
against a version that's moved is carried across it, cleanly where nothing
it touched changed, **conflicted** where something did. Nothing's guessed
at, nothing's lost, and what lands first stays as it landed: what's
carried across it adapts.

**Not relying on edits arriving through the system.** An edit made in an
editor is recorded as it's made, exactly. A document whose content doesn't
hash to its current version, changed by a `git checkout`, by another
program, or while the app was closed, is compared with the copy kept of
that version, by the editor's `comparisonOf__Texts`, and the difference
turned into edits, once, the same edits for every task; from there it's
carried across as any edit is. Only there, the edits worked out from
content, can text repeated exactly leave it unclear which copy changed,
and then nothing's guessed: each change knows how many places held its
exact text and which was its own, and if that count's changed, it's a
conflict, for you to decide.

The editor carries a round that lands after your edits now,
`rebasedOf__Changes`, its stale rounds dashed, "written before your edits":
the same carrying, at one layer.

### tasks on one document at once

Tasks are branches, apart: none sees another's changes, proposals or runs
until it's applied. When one is, its head becomes the document, and
every other open task on that document is carried across it at once. So
every task always stands on the document as it is now, and applying one
never meets a conflict: its conflicts were shown and settled while it was
open, and applying just makes its head the document's. That also answers
doctor's question, replaying whenever the trunk moves or only when a task's
next active: whenever, so doctor's **behind** never arises.

What happens to a task when a document it's on moves under it:

| what it holds | untouched by the move | touched by it |
|---|---|---|
| its changes, accepted proposals and your edits | carried across, nothing said | conflicted: in its frame, the lines it was written on above the file's, decided on its item, yours kept, the file's taken, both, or run again |
| its open proposals | carried across | stale, said so on its item, its lines drawn as a conflict's are: accepted anyway, over what moved, rejected, or sent back, to be written against the text as it is |
| its requests on words | carried across | detached: kept with the words they were on; the agent reads them against the text as it is, and you aim them again or drop them |
| a round still being written | lands, and is carried across | lands, what the move touched out of date, as when you edit during a run |

In its editor, what moved in comes as the document's own text, unmarked,
as it's the document's now, but shown coming in, briefly, so text never
changes under you unseen; conflicts come as frames, counted in its header
and in the switcher. Nothing stops but its Apply, while it has
conflicts. Tasks on other documents aren't touched.

What's hard, done first and tested hardest, by properties over random
edits, before anything leans on it:

- **moves:** a change carried through a move, and a move through edits; a
  move that collapses is dropped now. A block whose hash leaves one place
  and turns up at another has moved, and what's in it follows it;
- **deleted under an edit:** a task's edit to a paragraph the document's
  lost, or the other way round: a conflict of the paragraph against
  nothing;
- **the same edit on both sides,** a conflict at first, which could later
  carry across as one.

### a conflict, and stale, in the editor

Decided 2026-11-24, drawn on the canvas "Conflicts and out of date".

**Where it's written on, and what the file did.** A change the file moved
under, stale, is drawn in its frame as pairs of lines: the line it was
written on, numbered, in the frame's back hatch, the change ringed whole
there, at the extent it was written; and right under it, the line as the
file has it now, unnumbered, so the pair reads as one line, hatched forward
in a light teal, the file's colour, at half the strength first drawn, so
what's on it stays clear. The file's line is ringed for what the file did to
the line above, in the editor's own colours: put in green, replaced yellow,
taken out a red notch where it was. Everything on the teal line is the
file's; the change's own rings are on the line above. Always shown, nothing
to unfold.

**The file's words in the proposal.** In the proposed lines, words that are
the file's since the change was written are ringed teal, and where the file
took words out, a teal notch: teal is the file's, only, so a line made of
both reads as both, the proposal's yellow beside the file's teal, where
`const errors = []failures;` would read as broken. The same words can be
marked twice, green on the file's line, what the file did, and teal in the
proposal, whose they are.

**Stale,** an open proposal the file moved under: under its title, "Stale"
in the file's teal, "written before your edits" in the muted grey, and Run
again in the revision's plum. Its rings no longer dashed, as dashes say
restyled, and a ring's seams. Said "out of date", in orange, till
2026-11-25, when stale and conflict both took the file's teal.

**A conflict,** a change of the task's own the file moved under, an accepted
proposal's or yours: "Conflict" in the file's teal, what the file did in the
muted grey, "the file put “// why” in line 38", and on its item the ways
out, Keep yours and Take the file's in the proposals' indigo, Both, Run
again in plum. Both words the file's teal, decided 2026-11-25: the word the
colour of what it's about, the file's hatched lines and its words in the
proposal, so a note's teal is found in the text, and red, overloaded, left
to taken out alone; a conflict counted in teal too, the switcher, the
footer, the board, where it was red. The teal made bluer the same day,
`#0e7490`, `#3eb6dc` in the dark, from `#0b7a85` and `#3fc1c9`, further
from the green of put in, which it sat beside on the file's line, and no
further, short of the syntax's blue for numbers and strings.

- **Keep yours:** the change as written, over what the file did there: the
  lines it was written on, the change made on them, in place of the file's,
  narrowed to the words that differ, so another proposal's change on those
  lines isn't covered; nothing left to change, the change let go. Not
  offered for a move: kept so, it would read as a replacement.
- **Take the file's:** the change let go, the file's lines kept.
- **Both:** the change as it's carried, the file's edit in it; offered only
  where neither took the other's characters, a move, or words put in. A
  replacement the file edited inside can't be both: its words are the ones
  the file changed.
- **Run again:** the proposal sent back, to be written against the text as
  it is.

The documents part keeps, with each stale change, the lines it was written
on and the change as it was on them, found as it's found stale, as the
edits that found it are let go.

## what a task holds

The least it needs, each stated against its layer:

- **what it is:** its id; its name, its first request's or one you gave
  it; when it was made; the agent's summary of it, and of each document it
  changes. Resolved, how, when and by whom, as it ends; `DRAFT`, `WORKING`
  and `YOUR_TURN` worked out, never stored.
- **its requests:** each its text; who made it, you or an agent; its aim,
  the task, a document, words of
  a document, or a proposal or words of it, a range in what they're in;
  whether it's waiting to be started, or started, what's running now being
  the agent's to say; once addressed, the proposals that answer it, or the
  agent's note that nothing needed changing; and, detached, the words it
  was on.
- **for each document it's on:** the version its positions are stated
  against, by hash, always the document's current one; that's how, the app
  opened again, a task tells the document changed while it was closed.
- **its changes, its head:** in order, each a range in the document's
  version and the text it puts in, the text it replaces being the
  document's, there; whose it is, a proposal's, kept apart so that
  reopening the proposal takes it back out, or yours; and, conflicted, the
  text it was written over, as the document has other text there now.
- **its proposals,** open or decided: the document, the state, the
  requests it answers; its last round, its change against the head, why,
  and what the round changed; the round before's text, only to mark what
  the last one changed, no older round kept; what was asked of it when it
  was sent back; and, out of date, the text it was written against.
  Decided ones keep their last round till the task ends, to be reopened.

Out of date, conflicted and detached are found as things are carried
across, and the edits that found them are let go straight after, so each
is stored as it's found, with the text it needs. Whole text is kept only
there, where what it would be relative to is gone.

What a task never holds: a document's text, kept once by the documents
part; its head as text, which is the document with its changes applied;
any history, the edits between versions, or undo; which editors show it,
the shell's; what's running, the agent's.

## what's kept, and for how long

Kept while something open needs it, and, once nothing does, till it's
collected:

| what | needed while | then |
|---|---|---|
| a document's copy, its current version | an open task's on it | kept till collected |
| the edits between a document's versions | an open task's not yet carried across them | let go as soon as it is, at once, as they're the carrying's own, never kept |
| a task, with all it holds | it's open, carried across as its documents move | resolved, it's carried across nothing, and kept as it was resolved, till collected |
| undo | the editor's open | let go as it closes; never stored |

So there's at most one copy of a document an open task needs. A resolved
task isn't carried: what it holds stays stated against the versions it was
resolved on, which is why a canceled task's changes keep the text they
replaced, under **finishing**.

## where it's kept, and collection

Settled 2026-11-22. All the system keeps of tasks and documents, apart from
the documents' own content, is kept in a folder of its own at the project's
root, a dot folder, as doctor's `.doctor/` was, its name to be chosen:

- **one file per task,** open or resolved, as doctor's were;
- **documents' copies,** each by its hash, as doctor's `objects/` were;
- **each document's current version,** its hash.

Doctor's `history/`, a log of every change, isn't kept: git is the history.

Nothing's removed from it but by **collection**, asked for by you or by an
agent judging what's done with, as a command: the resolved tasks it's told
to remove, and the copies no open task needs. Which it removes, and when,
is a layer over it, under **abilities, and what decides them**.

## finishing

- **Apply** makes the head the document's, every document's: what's
  accepted, and your edits. Only when someone says, you, or an agent you
  let, never on its own; offered when nothing's running and every proposal
  is decided.
- **Cancel** lets the head go, your edits in it with its accepted
  proposals; what's running is stopped. Its changes stay with the canceled
  task, each with the text it replaced, so they stand on their own as the
  document moves on. A new task made from parts of another isn't the
  model's to offer; this only keeps it from being ruled out.
- **Discard** a draft: its requests, and any edits prepared in it, let go,
  the draft kept as `DISCARDED` till it's collected.

Every editor in a task that's applied, canceled or discarded goes to
manual, and says why.

## several editors

Editors open side by side share everything but what each shows. Each shows
one document in one mode, its own, and the two together pick one version
of it: the trunk, in manual, or a task's head. Walked through, two editors:

1. **Two tasks, two files.** Each editor's edits go into its own task's
   head, its requests to its own task. Nothing passes between them until
   one task's applied.
2. **Two tasks, one file.** Two versions of one file side by side, as two
   branches checked out side by side. Each edit goes into its own task's
   head. When one task's applied, the other's replayed at once, its editor
   redrawn on the trunk as it now is, any change of it that hit what the
   first changed shown there as a conflict.
3. **One version in both:** the same task and file, or manual and the same
   file. One version shown twice, as a split view is: an edit in either is
   in the other as it's made. Each editor keeps its own caret, selection
   and folds, carried across the other's edits.
4. **Manual beside a task, one file.** Typing in manual moves the trunk,
   and the task's replayed as you type: its editor shows your words come
   in, its changes carried across them. Type into text an open task
   changes, and that change is conflicted as you type; so in manual, the
   lines open tasks change are marked, quietly, in the gutter, to be seen
   before you type there.
5. **Requests.** Each editor's go to its own task. One made in an editor in
   manual makes a new task, that editor's mode, the other editor as it was.
   So composing the next task while the agent works on this one is two
   editors, nothing switched.
6. **A task ending.** Applied, canceled or discarded in either editor,
   every editor in that task goes to manual, showing the trunk, the merge
   in it, and saying why it's now in manual.
7. **Switching** in one editor changes that editor only; from the board,
   below, every open editor in the project. Each editor shows what it
   was last switched to, from either, with no following to keep track of.
8. **The agent's rounds** land in every editor showing that task, whatever
   file each shows.
9. **Undo.** Each editor undoes its own edits, carried across the others',
   as an editor shared by several people does: never, in one editor, what
   was typed in the other. One history per version would undo there what
   you can't see being undone.
10. **Reloads.** Each editor comes back in its mode, as doctor's focus did.

What it asks of the editor:

- **an edit from outside,** another editor's, a replay's or a merge's,
  applied to what it shows, carrying its caret, selection, folds and undo
  history across it. Today `update` replaces its model and empties its
  history, `HISTORY_EMPTY`, unless it's given the model it has (2026-11-24),
  which two editors showing one version can't live with;
- **its mode,** told it, manual or a task, not a task or `null`.

## who holds what

Each part has its own interface, as the editor has: given what it needs,
telling what happened. Each is a folder of `source/`, its `index.ts` its
public API, nothing else of it imported from outside, as
`.claude/rules/typescript-style.md` says under **Parts**: `editor/`,
`board/` and `jsx/`, the runtime they draw with; `tasks/` and
`documents/`, built 2026-11-24, the first of each; `agent/` and `shell/`
to come, in that order.
Doctor had all four, in its extension and its webviews; the playground's
host, `playground/host.ts`, plays all four for now, faked.

- **the editor:** nothing of tasks but what it's told. It's given the mode:
  in manual, its document's trunk; in a task, the task's head of its
  document, the task, its requests and proposals. It draws them, keeps
  only its view's state, and sends commands for the rest. Today it's given
  `task`, `_Task_Host_ | null`, manual told as `null`: that becomes the
  mode.
- **tasks:** tasks, their requests, proposals, rounds and decisions; the
  moves between states. **Built 2026-11-24, the first of it,** in
  `source/tasks/`, plain data and functions, no DOM: a task open, never
  started or started, when first, or resolved, how, when and by whom; its
  requests, each with who made it and when, its aim, the task, a file or a
  proposal, its words all of it or quoted, and its status, queued, started
  or addressed, with the proposals that answer it or a note that nothing
  needed changing; its proposals, each its file, title, why and decision;
  the moves as commands, each a pure function, `modelAfter__Command`, by a
  map of them, `HANDLERMAP__TASKS`: draft, with the first request; request,
  edit and remove, a request's only while it's queued; start and stop, at
  any scope, the task, a file, some proposals, some requests, a proposal
  never revised by two rounds at once; propose, a proposal or its next
  round, open again; address; decide, what was asked of a proposal and not
  started let go as it's decided; rename and summarize; apply, once
  nothing's running, a draft too, as its header offers Apply once nothing's
  left; cancel, a started task's, what's running stopped; discard, a
  draft's; and collect, only what's resolved; a move that changes nothing
  giving back the same model, so nothing's told. Worked out, never stored:
  a task's state, its counts and the files it touches. `_Tasks_` holds
  them, taking each command, telling its observers what changed. Started
  stands for running till the agent part says what's running of what's
  started. Not yet: a proposal's rounds' text and a task's changes, which
  need the documents part's versions; a request's words are kept by their
  text alone till then, the editor's own of them, where they're drawn,
  kept by its host. **The playground on it, 2026-11-24:** its host holds
  the project's tasks in a `_Tasks_`, made from what the example says of
  them, `playground/tasks.ts`, the editor and the board told what they
  show from it, every count the tasks part's; the host keeping only what's
  the editor's, the words requests were sent on, and, of the task the
  playground's on, its proposals' attributes, its changes its head there
  since the documents part, below. Every other task of
  the example has only requests on the file shown, real ones, on the words
  they were sent on, found in the file's card once the editor's in it,
  where at first they had only counts, made into requests and proposals
  with nothing to show, which counted what couldn't be found; none of them
  proposes anything here, as proposals with changes of their own, carried
  across edits, are the documents part's, and answers the agent's, and
  nothing here should stand in for them. What a task has on files not
  shown, as README.md, still only counted, made into as many proposals and
  requests. The agent still faked, the same for every task: a round on a
  proposal landing a moment later, a request on no proposal answered with
  nothing to change. No conflicts but those the documents part finds, the
  example's one dropped, as nothing could show it. README.md's revision,
  running, is a request, stopped and started with the rest, its round
  landing; a request sent with no task drafts a new one, named for it, the
  editor in it; your edits aren't a proposal of the task, so never one to
  decide; resolved tasks are on the board in the order they were resolved.
- **documents:** each document's current version, its hash, and one copy
  of it while an open task's on it; the edits that make each new version,
  recorded as they're made, or, the document changed from outside, worked
  out by comparing it with that copy; carrying every open task across them;
  making an applied task's head the document.
  **Built 2026-11-24, the first of it,** in `source/documents/`, plain data
  and functions, no DOM: each document kept by its path, its version the
  SHA-256 of its text, worked out there so it runs anywhere, the copy of
  that version, and the edits since the oldest version anything's still
  stated against; the moves as commands, by a map of them,
  `HANDLERMAP__DOCUMENTS`: open, a document kept as it is, or, kept already
  and changed since, read; edit, an edit made in an editor, on the document
  as it is, recorded as it's made, only its own steps, a proposal's text and
  changes not the document's; read, the document as it now is outside,
  compared with the copy by the editor's `comparisonOf__Texts`, the
  difference made into edits, once; apply, a head made the document, the
  sources it's told to, a task's own changes and what's accepted, the rest
  not, worked out the same way; release, the edits nothing's stated against
  let go; and collect, the copies no open task needs; an edit leaving the
  text as it was no new version. A head, `_Head_Document_`, a task's changes
  on a document stated against its version, carried across what moved it
  since, `carriedOf__Head`, each change by `rebasedOf__Changes`, one an edit
  touched stale, a move with nothing left of it dropped and counted; a stale
  change keeping the version it was written on and the text it was written
  over, the stretch it covers, an insertion's line, a move's from its words
  to where they land, and clean again once the document's back at that
  version, by undo or by hand, or, a change of text, once its stretch,
  whole, holds that text again, an insertion's line alone saying nothing, as
  a blank line's like any other; the editor's own task, whose changes it
  carries itself, rechecked the same way, `checkedOf__Head`; tested by
  properties over random texts and edits, an untouched change still
  replacing the text it did, the document's edit and the change landing
  together, one cut into, replaced, deleted under or made the same as it,
  stale. The editor's model moved here with it, `Model_TextEditor.ts`, the
  editor drawing it, its index no longer handing it out. The tasks part
  holds each task's heads, restated with `RESTATE`; a conflict is a stale
  change of the task's own, yours or accepted, counted, Apply held while
  there's any; a proposal still open that's stale is only out of date, drawn
  as written before your edits. **The playground on it:** the document kept
  by a `_Documents_`, every edit recorded and every other open task's head
  carried across it, a round landing carried from the version it was written
  on, those edits kept till nothing's running on an older one; Apply making
  the task's head the document, every other open task carried across it; a
  conflict typed in No task said at once in the switcher, the footer and on
  the board, the editor told its tasks keeping its undo history. Not yet:
  moves found in what's read from outside, a block's hash turning up
  elsewhere; text repeated exactly, counted, so a change of what's read
  can't land on the wrong copy; conflicts drawn as frames, to be decided,
  with the text each was written over; your edits in a task going into its
  head rather than the document, as they still do in the playground; and
  storage, the shell's.
- **the agent:** runs, which requests are running for which task; how the
  agent's given its work, doctor's `doctor wait` or otherwise; whether it's
  there and working.
- **the shell:** puts them together: keeps each editor's document and
  mode, across reloads too; takes each editor's commands to the part
  they're for; tells each open editor what it should now show, and passes
  an edit made in one editor to the others showing the same version.

## what the editor draws for it

What the task UI needs, each from what it's told, the playground's host
faking the moves, so it can all be drawn before the parts above are built:

- **built 2026-11-22: what the editor's in, and switching.** The editor's
  told its mode, `MANUAL` or `TASK` with its task, and the project's open
  tasks, each with where it stands. Manual's "No task", muted, at the
  header's start, where a task's name is, neither with a mark, saying
  what's selected, as a task's name does, never naming the mode, where
  "Manual" had, as no task's mode is named. After the mode's name,
  a hairline, then two arrows open the switcher, a card of its own beside
  the task's, never open with it, the one pointed at shown: the tasks, the
  editor's first, then those on its document, then the rest, then No
  task, each its mark, its name, and its parts, yours then the agent's,
  coloured as the board's columns are, or a draft's requests, said queued,
  in plum, as an open task's are, its name leaning, as in the header, its
  dotted mark saying it's a draft, where the word draft was said too; its
  order kept while it's open, a task switched to while it's open, from the
  board, say, marked as the one the editor's in where it is, so nothing
  moves under the pointer, and sorted again only once it's shut, the view
  holding the order it shows through each redraw while its card's open,
  and putting the view model's back once the card's closed; one pressed
  asks the host to switch, `SWITCH`, and shuts the card at once, though
  the pointer's still on it, as a menu shuts on a choice, sorted then,
  shown again only once the pointer's left it and come back, or its
  chevron's focused.
  Draft task, and All tasks…, which opens the board, come with drafts and
  the board;
- **built 2026-11-22: the file, and opening another.** An editor shows a
  file in a mode, so switching one keeps the other. The file's at the
  header's end: its name, with no mark, a hairline, then an icon of files
  opening the picker, a card of its own beside the
  document's: the files in this editor's task, how far each has got, then
  the project's others, or, in manual, the project's files. A task's card
  opens its files too, each its path pressed. Either asks the host to open
  the file, `OPEN_FILE`, as VS Code's own picker would, the host deciding
  where; the editor never opens one itself. The editor's language is its
  setup's, so a host showing another file with another language makes
  another editor. Finding a file by typing is still to come;
- **built 2026-11-22: the project's tasks in the footer,** one small item at
  its right, the rest of it left for what else a footer holds: the tasks
  counted by part, a task under each it has, each count after its mark in its
  ink, needing you, conflicts, at work, drafts, `● 2 ⚠ 1 ◠ 1 ◌ 1`, the
  words its title; pressed, it asks the host to show the board,
  `SHOW_BOARD`, revealing the view in VS Code, under the editor in the
  playground, which hides it when it's pressed again;
- **built 2026-11-22: the board:** every task, a component of its own,
  `_Board_`, beside the editor, not in it, as it may well be a VS Code view
  of its own, in its panel or its sidebar, where switching moves every
  editor in the project. It's told the project's tasks, `_Task_Board_`, each
  where it stands, the files it touches, its figures, and how many editors
  show it. Its columns are who each task is waiting on, Needs you, anything
  of it yours, With agent, only the agent's, Drafts, Resolved, not its
  state, each heading with the footer's mark for it before how many, `● 3`,
  With agent's turning while it holds anything, side by side where it's
  wide and one under another where it's narrow, by its own width, never
  scrolling as a whole, its head staying, each column's tasks scrolling on
  their own side by side, the columns together stacked, a tile's ⋮ menu
  anchored to it, so a column's edge never cuts it; no dragging between
  them, as most states come from what's running, so each tile's actions say
  it. A tile, as the board's tasks are called in code, apart from the
  header's cards, has no mark, as its column says where it stands: its name,
  on a line of its own, and under it the one figure that puts it in its
  column, a conflict over the rest, in teal, the agent's shimmering while it
  runs, in step with the editor's, and in file, in words, muted, if it
  touches the file an editor's showing, the only one of its files that
  matters there, never named, tried as its name, as in view, as a page icon,
  too vague, and as touches file and touches here, the board told which
  documents editors show, `paths_Shown`; no id; no box round it; and, while
  an editor shows it, a bar down its edge, not words; its text flush with
  its column's heading; pressed, it asks the host to switch every editor to
  it, `SWITCH`; its ⋮, three dots standing, as a menu's are, shown while the
  task's pointed at or the keyboard's in it, as a request's ellipsis is, its
  room kept so nothing moves, holds Start all for what's queued, a
  draft's too, as starting anything of it starts it, Stop while anything's
  running, Apply once nothing's left on either side, and Cancel, a draft's
  discarding it, where a draft's menu had Start and Discard: the editor's
  menu, on the proposals' band, its choices rows across it, each in the
  ink of whose move it is, Start and Stop the agent's plum, Start bold,
  Apply your indigo, Cancel, ending the task, plain, last, the words set
  to the right; under the ⋮, the ⋮ gone, while it's open, once the pointer's left
  it; an open menu over every other task's ⋮; opened by pointing at the ⋮,
  kept open while the pointer's on the menu or on an unseen strip, the ⋮'s
  own line across the menu's width, between the two whichever way the menu
  opens, none past its far edge, and only on the way from the ⋮, never on
  the way out of the menu, which shuts at whichever edge it's left by, so
  the way from the ⋮ to a choice never shuts it, however the pointer goes; a
  press on the ⋮ with the pointer not keeping it open; shown and put away as
  the header's cards are, at once and faded in, and, once the pointer's left
  it, held a moment, then faded out, so it goes as the pointer leaves it, as
  theirs do; a menu button's keys, Tab onto the ⋮ without opening it, ↓,
  Enter or Space opening it on its first choice, ↑ on its last, ↑, ↓, Home
  and End through it, Esc back to the ⋮, Tab out of it. Square, as all the
  board draws is. Tried: each task a box, everything on it, which took too
  much room; its line alone, opened as a card over the tasks under it when
  pointed at, which shifted its line and read as a box apart; opened in
  place, which was compact enough to always be; and every file it touches,
  its id, its other figures and how many editors show it, always, which said
  more than the board needs. Resolved tasks as quiet rows, each saying how
  it ended, in a word, as the column holds every way a task ends, no id, and
  Delete, in its heading, right after its count, folded behind the editor's
  ellipsis till it's pointed at, for them all, for good, `COLLECT`, with
  their ids. Draft task, `NEW_TASK`, at its head, named for what it starts,
  drafting one, which stays in Drafts till it's started, where New task said
  less, which the playground only reports, as a new task's made with its
  first request, to come with drafts;
- **built 2026-11-23: the ways a task ends, in its header,** at the end
  of its card's heading, `T-12 · Working`, folded behind an ellipsis in
  the muted ink its id's in, as a card's line's actions are, and as the
  board's ⋮ is, only ever Apply and Cancel: Apply, in the proposals'
  indigo, once nothing's left on either side, nothing to decide, being
  revised, queued or running, and Cancel, neutral, as every Cancel is, a
  draft's discarding it. A draft's starts are where every task's are, its
  Start all in its card's Scope Revisions, its requests' own Starts, as
  starting anything of it starts it; tried, a draft's Start and Discard in
  its heading. Each asked of the host, `END`, `APPLY`, `CANCEL` or
  `DISCARD`, of the task the editor's in, which it resolves, the editor
  going to manual. The playground's host tells the editor where a task
  switched to stands, as the example says, counted on the first file it
  touches, so its card's figures and actions are right, and starts and
  stops it from its card as from the board;
- lines changed in the task, marked in the gutter;
- in manual, the lines open tasks change, marked quietly in the gutter;
- behind and conflicted, where they apply.

## open

1. **The folder's name.**

Settled, of the questions this note began with:

- **work goes on in a task that isn't active,** its conflicts met anyway,
  by switching and manual (2026-11-21);
- **a mode per editor,** where doctor had one for everything, so editors
  side by side can each be in their own task (2026-11-21);
- **Apply when someone says,** never on its own; applying on its own,
  under conditions, a layer to build over it (2026-11-22);
- **Cancel lets your edits in the task go** with the rest of its head, its
  changes kept with it, to pick from later (2026-11-22);
- **who makes requests isn't the model's question:** anyone can, and who
  may is a layer over it (2026-11-22);
- **resolved tasks are kept,** `APPLIED`, `CANCELED` or `DISCARDED`,
  in the system's own folder, till collected, by you or an agent
  (2026-11-22).
- **a request made in manual makes a new task,** that editor's mode, for
  now (2026-11-22);
- **your edits in a task go into its head wherever they're typed,** a
  proposal's next round on its words, a change of yours anywhere else, a
  line shown once too, a frame of yours opening round it (2026-11-25);
- **tasks are flat:** none stands on or waits on another, so a request's
  either waiting to be started, or started and running, nothing between
  (2026-11-22);
- **a new task from parts of another** isn't the model's to offer, only
  not ruled out, a canceled task's changes kept as they stood (2026-11-22).
