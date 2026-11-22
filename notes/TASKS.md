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

## a task is a branch

Kept from doctor. The file holds the trunk until a task completes; a task's
head is kept apart from it, so anything reading the files, git included, only
ever sees finished work. Accepting a proposal applies it to the head, not the
file, which is what the editor's "accepted, not yet applied" already draws;
completing the task merges the head into the trunk. Git is the history: only
what open work needs is kept, under **what's kept, and for how long**.

## the mode: manual, or a task

Each editor is always in one mode: manual, or a task, one task at a time;
editors side by side each in their own, under **several editors**, below.
Manual is named as a mode, `MANUAL`, beside `TASK` with its task's id, never
stood for by a task left out, `null` or none. The mode says two things only:

- **what you see:** in manual, each document's trunk; in a task, its head,
  with the lines the task has changed marked, as doctor's design had it, a
  neutral mark in the gutter, applied when the task completes;
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
| `COMPLETED` | resolved: its head made the document's |
| `CANCELED` | resolved: its head let go, your edits in it too |
| `DISCARDED` | resolved: a draft let go, never started |

`DRAFT`, `WORKING` and `YOUR_TURN` are worked out from its requests' runs,
never stored: `WORKING` while any request of it is running, `DRAFT`
while none has ever been started, `YOUR_TURN` otherwise. The resolved states are stored, as they're decisions, each with
when it was made and who made it, and a resolved task's kept, with all it
held, till it's collected, under **where it's kept, and collection**. The
editor's `DONE` becomes `COMPLETED`, and `DISCARDED` is new.

How it moves:

| what happens | from | to |
|---|---|---|
| a start, at any scope: a request, a proposal's revision, a frame, a document, the task | `DRAFT`, `YOUR_TURN` | `WORKING` |
| the last run ends, or Stop | `WORKING` | `YOUR_TURN` |
| Complete | `YOUR_TURN` | `COMPLETED` |
| Cancel | `WORKING`, `YOUR_TURN` | `CANCELED` |
| Discard | `DRAFT` | `DISCARDED` |

## abilities, and what decides them

Settled 2026-11-22. The model gives abilities; who uses one, and when, is a
layer over it, never the model's to say:

- **anyone makes requests,** you or an agent: a request records who made
  it, and whether an agent's may go straight into a task, or waits for you
  to take it, is decided above the model;
- **someone completes a task,** you, or an agent you let: never the model
  on its own. Completing on its own, under conditions, is a layer to build
  over Complete, not part of it;
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
  never without one: a request sent from manual, not started, or New task,
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
- **In a task:** into its head, as the editor already makes them, likely
  to change as this goes deeper: in a frame, on proposed lines, an edit is
  the proposal's next round, yours; anywhere else it's a change of yours,
  a source the host names, `source_Yours`, described as any proposal is,
  "Your edits" in the playground, kept in the task's head as yours.

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

**What moves a document:** typing in manual, a task completing, or an edit
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
until it completes. When one completes, its head becomes the document, and
every other open task on that document is carried across it at once. So
every task always stands on the document as it is now, and completing one
never meets a conflict: its conflicts were shown and settled while it was
open, and completing just makes its head the document's. That also answers
doctor's question, replaying whenever the trunk moves or only when a task's
next active: whenever, so doctor's **behind** never arises.

What happens to a task when a document it's on moves under it:

| what it holds | untouched by the move | touched by it |
|---|---|---|
| its changes, accepted proposals and your edits | carried across, nothing said | conflicted: a frame, the document's lines, the move in them, beside the task's, decided as a proposal is, kept either way or edited |
| its open proposals | carried across | out of date, dashed as "written before your edits" is: accepted anyway, over what moved, rejected, or sent back, to be written against the text as it is |
| its requests on words | carried across | detached: kept with the words they were on; the agent reads them against the text as it is, and you aim them again or drop them |
| a round still being written | lands, and is carried across | lands, what the move touched out of date, as when you edit during a run |

In its editor, what moved in comes as the document's own text, unmarked,
as it's the document's now, but shown coming in, briefly, so text never
changes under you unseen; conflicts come as frames, counted in its header
and in the switcher. Nothing stops but its Complete, while it has
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

- **Complete** makes the head the document's, every document's: what's
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

Every editor in a task that's completed, canceled or discarded goes to
manual, and says why.

## several editors

Editors open side by side share everything but what each shows. Each shows
one document in one mode, its own, and the two together pick one version
of it: the trunk, in manual, or a task's head. Walked through, two editors:

1. **Two tasks, two files.** Each editor's edits go into its own task's
   head, its requests to its own task. Nothing passes between them until
   one task completes.
2. **Two tasks, one file.** Two versions of one file side by side, as two
   branches checked out side by side. Each edit goes into its own task's
   head. When one task completes, the other's replayed at once, its editor
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
6. **A task ending.** Completed, canceled or discarded in either editor,
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
  history, `HISTORY_EMPTY`, which two editors showing one version can't
  live with;
- **its mode,** told it, manual or a task, not a task or `null`.

## who holds what

Each part has its own interface, as the editor has: given what it needs,
telling what happened. Doctor had all four, in its extension and its
webviews; the playground's host, `playground/host.ts`, plays all four for
now, faked.

- **the editor:** nothing of tasks but what it's told. It's given the mode:
  in manual, its document's trunk; in a task, the task's head of its
  document, the task, its requests and proposals. It draws them, keeps
  only its view's state, and sends commands for the rest. Today it's given
  `task`, `_Task_Host_ | null`, manual told as `null`: that becomes the
  mode.
- **tasks:** tasks, their requests, proposals, rounds and decisions; the
  moves between states.
- **documents:** each document's current version, its hash, and one copy
  of it while an open task's on it; the edits that make each new version,
  recorded as they're made, or, the document changed from outside, worked
  out by comparing it with that copy; carrying every open task across them;
  making a completed task's head the document.
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
  tasks, each with where it stands. Manual's "Manual", at the header's
  start, where a task's name is, neither with a mark. After the mode's name, a hairline,
  then two arrows open the switcher, a card of its own beside the task's, never open with it, the
  one pointed at shown:
  the tasks, the editor's first, then those on its document, then the
  rest, then Manual, each its mark, its name, where it stands, and what's
  waiting, a conflict's in the removed red; one pressed asks the host to
  switch, `SWITCH`. New task, and All tasks…, which opens the board, come
  with drafts and the board;
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
  counted by what they're waiting on, each count after its mark in its
  ink, needing you, conflicts, at work, drafts, `● 2 ⚠ 1 ◠ 1 ◌ 1`, the
  words its title; pressed, once there's a board, it opens it;
- **the board, held:** every task, a component of its own beside the
  editor, not in it, as it may well be a VS Code view of its own, where
  switching moves every editor in the project; the editor's footer item
  opens it, revealing the view in VS Code, over the editor in the
  playground. Its columns are who each task is waiting on, needing you,
  the agent's, drafts, resolved, not its state; no dragging between them,
  as most states come from what's running, so each card's actions say it;
- a draft's header: its name, how many requests, Start, Discard;
- a task's header in each state, as now, with Complete and Cancel;
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
- **Complete when someone says,** never on its own; completing on its own,
  under conditions, a layer to build over it (2026-11-22);
- **Cancel lets your edits in the task go** with the rest of its head, its
  changes kept with it, to pick from later (2026-11-22);
- **who makes requests isn't the model's question:** anyone can, and who
  may is a layer over it (2026-11-22);
- **resolved tasks are kept,** `COMPLETED`, `CANCELED` or `DISCARDED`,
  in the system's own folder, till collected, by you or an agent
  (2026-11-22).
- **a request made in manual makes a new task,** that editor's mode, for
  now (2026-11-22);
- **your edits in a task are as the editor makes them,** a proposal's
  next round in a frame, a change of yours anywhere else, likely to change
  as this goes deeper (2026-11-22);
- **tasks are flat:** none stands on or waits on another, so a request's
  either waiting to be started, or started and running, nothing between
  (2026-11-22);
- **a new task from parts of another** isn't the model's to offer, only
  not ruled out, a canceled task's changes kept as they stood (2026-11-22).
