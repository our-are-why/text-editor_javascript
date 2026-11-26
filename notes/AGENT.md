# the agent

The agent part, the third behind the task UI, after the tasks and documents
parts: how what's asked of a task reaches an agent, how what the agent
answers comes back, and how working beside one feels, ergonomic and
seamless, without the system coupled to any one harness, Claude Code or
another. Begun 2026-11-25 as the questions to walk through before it's
built, each with what doctor did, what the task model here already
settles, and a leaning; walked through 2026-11-26, each now decided, with
what's left open, and what's noted for later, under **open**, at the end.

It starts from doctor, https://github.com/our-are-why/doctor, its
`source/cli/main.ts`, `source/extension/agent.ts`, `notes/tasks.md` and
`notes/experiments/`, and from `TASKS.md`, whose **who holds what** gives
the agent part its job: what's running, for which task; how an agent's
given its work; whether it's there and working.

## what doctor did

- **the agent pulls.** The agent ran in the person's own harness, in
  VS Code's terminal, and doctor never typed into it. Told once to run
  `doctor wait`, it waited for its turn, a long poll answered within 50
  seconds, the command asking again, and was given the task as JSON with
  `next`, the step to take, in prose: "revise proposal p3 as its feedback
  and passages ask, … then `doctor submit`, then `doctor wait`". The
  protocol carried its own instructions, so any agent that could run a
  command could take part.
- **a command over a local endpoint.** `doctor wait`, `task`, `documents`,
  `document`, `propose`, `summarize` and `submit`, everything JSON, a
  refusal `{ "issues": [...] }` and exit 1. The extension ran an HTTP and
  WebSocket server on 127.0.0.1, and every terminal VS Code opened got its
  address and the agent's token, `DOCTOR_ENDPOINT` and `DOCTOR_TOKEN`; the
  person had a token of their own, so who did what was known by who asked.
- **one active task, one turn.** It was the agent's turn while the active
  task was being worked on and it had something to do, requests new since
  it last handed over, or proposals sent back, whether or not others waited
  for review; otherwise the person's, `wait` answering what it was waiting
  on.
- **proposals.** Each one independent change, to one document, against the
  base version it was read at, naming the requests it answered and saying
  why; a revision saying what this round changed, given the feedback, notes
  on words of what it proposed, and, where the person had edited it, their
  edits, to revise from and keep. Summaries of the task and of each
  document, each with a one-line headline, replaced as they changed.
  `submit` handed the task over; it completed once every proposal was
  decided.
- **presence from what the agent did, never guessed:** waiting, with a
  `wait` open; working, handed its turn and heard from lately; quiet, its
  turn but nothing heard for five minutes, thinking or gone, which doctor
  couldn't tell; away, nothing open and not its turn.
- **tried and set aside:** doctor hosting the agent's terminal itself, a
  pty through Bun, the agent a TUI in doctor's page, before VS Code's own
  terminal made it unnecessary.

What generalises: pulling through a command; JSON in and out; the next step
said in words; proposals stated against a version; presence read from
behaviour. What was coupled: one agent and one turn; VS Code's terminals
carrying the address and token; operations made for doctor's document
tree; the person telling the agent once to start, and the agent keeping to
the loop by its own discipline, each wait's answer costing it context.

## a principle: what a person's own session does

Decided 2026-11-26: build only on what a person's own interactive session
of a harness does, which every provider bills to their subscription, and
not on what providers have tried moving to API rates: running a harness
headless, `claude -p`, `codex exec`, `agy -p`, their SDKs, or tools
driving their official commands, as Anthropic announced for 2026-06-15,
and paused, and as Google's staff say a personal subscription's scoped to
individual human-driven use. So an agent's whoever you open, in its own
harness, as you'd open it to work; it reaches the agent part by running a
command in its own shell, the one tool every harness has always had; and
nothing here needs MCP, whose servers some harnesses' headless modes
don't load or ask approval for, and which providers could price apart.
Launching an agent in the background stays possible, as the protocol
doesn't ask who started one, but only as a choice per harness, its
provider's terms permitting, never something the design leans on.

What it asks of the protocol, since an open session waiting on its own
leans on its harness more than one launched for a single job: every
wait answered well inside a harness's command timeout, as doctor's were
within 50 seconds, two minutes being Claude Code's default; an answer of
nothing yet as short as it can be, so waiting costs an agent little of
its context; and every answer saying the next step, waiting again among
them, so an agent never falls out of the loop. And of the agent part:
an agent dropping out loses nothing of yours, its job shown gone quiet,
for you to stop and start again, so robustness never rests on an agent
behaving.

**Found by the spike,** 2026-11-26, `spikes/mailbox/`, a mailbox, a wait,
a take, a hand back and a stop, each call logged, tried in real sessions
of Claude Code, 28 minutes, and `agy`, 6, Codex having no subscription
here. Both keep to the loop: waiting, woken mid-wait as a job lands,
taking it in seconds, doing it, handing it back, waiting again, and, a
job stopped, dropping it as told, `agy` leaving nothing half written; no
wait of 50 seconds cut off in either; a nothing-yet answer 90 bytes.
What a harness does round a long command differs, and shaped the
protocol: **`agy` runs a command synchronously for 10 seconds at most,**
then backgrounds it, ends its turn with a word to you, and is woken when
it ends, so every 50-second wait cost a turn and a message, some 70 an
hour, hence a wait held as long as the agent asks, 7; and **an agent
working a long job had no way to learn it was stopped,** `agy` finding
out only by reading the spike's own log, hence the check-in, 9. And
confirmed: **an agent keeps no process running past its command,**
`agy`'s `nohup … &` gone with the call, so all that lives long, the
mailbox and what feeds it, is the host's. Tried then with a wait held a
quarter of an hour, `--for 900`, `agy`'s notification timeout set to
cover it: two turns spent waiting where 50 seconds at a time would have
spent nine, a turn only as a job lands or the wait's up; and found by it,
**a wait cut short by the command's own HTTP timeout,** Bun's `fetch`
letting a connection idle five minutes at most unless told otherwise, so
the command waits as long as it asked, `timeout: false`, and anything
between it and the endpoint, remote one day, must too; and **a job given
to a wait whose caller had gone,** the server answering a connection
already closed with the job, which it then counted taken, no agent having
it: so a wait whose caller's gone is let go, never given a job, which the
spike now does, and a job given out acknowledged before it's counted
taken, 9. Tried a third time with both fixed, and a job offered till its
first check-in took it, `agy` for 22 minutes: four waits, each answered
by a job landing, held 61, 400, 224 and 533 seconds, none cut off, where
50 seconds at a time would have taken 27; every job offered, taken with a
check-in of "starting" within seconds, which `agy` found very clear; the
slow job checked in on after each file it read, its stop found at the
next check-in, 15 seconds on, nothing left half done; four jobs, three
handed back, one cancelled, as scheduled. So the spike's done: the loop
holds in the harness where waiting was hardest. Not yet known: a session left
waiting for hours, how its context holds through hundreds of waits; to
watch in use, as a session dropping out loses nothing. And an open
session looping on its own for hours is nearer human-driven than
anything headless, as doctor's was, but not the same; its terms watched.

## a principle: up-to-date awareness

Decided 2026-11-26: what an agent's fed is guided by its being in sync,
up to date, with all it works in: the project, its files, the task, and
the job in hand. Every job tells it how things stand now and what's
changed since the task last looked, as data and in more than one view,
what this system knows told outright, and where it can find out the
rest, pointed to. Never other tasks: tasks are flat, and no task sees
another.

## what's settled here already

From `TASKS.md`, so these aren't walked through again:

- **tasks are flat, and many run at once.** The agent part serves every
  task that's started, by as many agents as that takes, and no task sees
  it. There's no turn: a task that isn't the one shown goes on as it was.
- **starting is explicit, at any scope:** a request, a proposal's revision,
  a frame, a document's requests, or the task's. A request is staged,
  yours till you start it; with the agent, `WITH_AGENT`, once you have,
  whether or not an agent's picked it up; or addressed, by proposals that
  answer it or a note that nothing needed changing. Decided 2026-11-25:
  with the agent, where it was started, `STARTED`, which read as an agent
  at work; a task's own start, begun rather than a draft, keeps the word.
  Decided 2026-11-26: staged, where it was queued, `QUEUED`, so draft's
  left to a task never started and queued to a job in the mailbox; in
  the code, `STAGED`, and in the editor's words, renamed 2026-11-26.
- **a round:** what's started on a proposal, its next version, revised
  one round at a time, never two at once; requests asked meanwhile wait for
  the next. Run again starts a round's requests over on the file as it is.
- **versions and carrying:** a round's written on the document as it was
  when an agent took its job, decided under 5, where it was when it
  started, and lands on the document as it is, carried across every edit
  since by the documents part, what an edit touched stale, a conflict if
  it's the task's own.
- **anyone makes requests,** a person or an agent, each recording who;
  whether an agent's goes straight in is a layer above the model. A task's
  applied only when someone says, never on its own; collection's asked for.
- **your edits in a task are its own,** a change of yours, never a
  proposal, nothing to decide.

## the questions

Sixteen, in seven groups. A group's questions lean on each other both
ways, so they're settled together; the groups are in the order they lean on
each other, each saying what it waits on. Walked through in order.

### what's handed out, and who drives

Settled together, as an agent the host started for each piece of work
needed the piece to stand on its own, and one that pulled could take
pieces smaller, one after another. Decided 2026-11-26: both by what you
already do, pressing Start where you choose. Waits on nothing; everything
below waits on it.

1. **What's handed out: a job, as you made it.** Doctor gave the whole
   task, every time. **Decided 2026-11-26:** the piece of work an agent's
   given is a job, the batch you made by pressing Start where you did,
   on a request, a proposal's revision, a frame, a document's requests or
   the task: the task, the scope and level it was pressed at, and the
   requests it started. Each job is its own, never merged with the one
   after it, nor split, and worked as its own, so a batch and another made
   quickly after are two. The agent's given a job whole, every request
   in it at once, so it can answer them together, holistically; when what
   it proposes lands, as it writes each proposal or all of it together,
   is the agent's to decide. A job's not a round: a round is still a
   proposal's next version, and a job may make several, and new
   proposals. Only what was started is in it: a proposal being revised by
   a round already with an agent is left out of a later job, as the
   task model never revises a proposal twice at once.

2. **Who drives: agents pull, always.** Doctor's agent pulled, `doctor
   wait`; the other way would have been the host starting an agent for
   each piece of work itself, through whichever harness can run without a
   person. **Decided 2026-11-26:** agents pull, always, from a mailbox the
   system puts each job into as you make it, in the order you make them;
   the system never reaches into an agent, so it needn't know what one is.
   An agent started in the background, by something that launches one, is
   a puller like any other, told to take a job, do it, and stop; how an
   agent comes to be there, you opening one or something launching it, is
   question 8's. A job in the mailbox no agent's taken is queued, its
   requests drawn as waiting for an agent, question 9's; Stop on one,
   question 10's, cancels it.

### what an agent writes

Two questions, found 2026-11-26 to be two: the text an agent writes, on
its own, as soon as a job's settled; and how what it writes is grouped,
into proposals and into frames, which leans on what it reads, 5, and on
`TASKS.md`'s joining and splitting frames by hand. Waits on 1.

3. **The text an agent writes: a working copy.** Our changes are ranges
   and moves on a version; agents write best by editing files with their
   own tools. **Decided 2026-11-26:** taking a job, the agent's given a
   working copy of the files in its scope, as the task has them, the file
   with the task's accepted changes and your edits applied, and, revising
   a proposal, that proposal's text in place; it edits the copy as it
   edits any file; and a deterministic pipeline here makes what it did
   into changes, comparing the copy with what it was given by the
   documents part's comparison, narrowed to the words that differ, as a
   conflict's are, stated against the version the copy was made from, so
   the documents part carries them across whatever moved the file
   meanwhile, as any round's. The pipeline's dumb, and stays so: it
   compares texts and nothing more, knowing nothing of a file's kind, of
   moves, or of what an edit meant, so it's the same for every file and
   never guesses; what an edit meant is the agent's to say, 4. The agent
   never writes this system's structures, nor quotes what it means to
   replace. Still to design: a revision's next version compared with the
   file without the proposal, and what this round changed compared with
   its last; where the copy lives, a folder per job or something like
   a worktree per task, for the spike to try. Later, with a file edited as
   something other than how it's stored, as `TASKS.md` notes under the
   documents part: the copy in the form edited, by default, a module free
   to offer the stored form where agents handle it better. A request
   answered with nothing to change says why. Summaries of the task and of
   each document, as doctor's, the agent's voice in the header and the
   cards.

4. **How it's grouped: proposals, and frames.** Two groupings, kept apart.
   A proposal is what's decided together, one idea, what you accept,
   reject or revise whole, its places in as many frames as it reaches; a
   frame is what's read together, lines shown together for review.
   **Decided 2026-11-26,** for proposals: a dumb diff, the agent saying
   what it meant, and a checker. The agent edits its copy freely, all of
   it at once, as agents do; asks what it changed, and the pipeline
   answers with the changes it found, numbered, ungrouped, belonging to no
   proposal, each where it is, what was there and what's there now; and
   says what they mean: **which go together,** grouped by number into
   proposals, each its title, why, the requests it answers, and,
   revising, what this round changed, a change made to a proposal being
   revised counting as its next version; **which are moves,** a removal
   and an insertion said to be one text moved, edits inside the moved
   text staying changes of their own, grouped with the move or apart, and
   apart carried wherever it lands; and, rarely, **what came between,**
   for one stretch two ideas changed. So it groups seeing all it did,
   holistically, as a job's given whole. Edits apart from each other
   are changes apart, whatever they're for: a rename of `DELAY_MS` and
   one of `n` in `DELAY_MS * 2 ** (n - 1)` two changes; `retry` made
   `**retries**` in Markdown three, the `**` before, `retry` made
   `retries`, the `**` after, a look being text there, so the agent
   keeps the word and its bold in one proposal or puts them in two.
   **Two ideas on the same characters, first class:** `return delay +
   Math.random() * (delay / 2);` made `return capped +
   jitterOf(capped);` by capping the delay, `delay` named `capped`,
   and by naming the jitter, its expression made `jitterOf(…)`, the
   `capped` inside `jitterOf(capped)` the first's work inside the
   second's, one changed stretch to any comparison, as how it came about
   isn't in the text. The agent says the text between, `Math.random() *
   (capped / 2)` once the delay's capped, and the pipeline's deterministic
   again: the first proposal's change the text before to the text
   between, the second's the text between to the text after, stated on
   the first's text, so it's drawn nested in it and applies only with it;
   nothing edited again. The editor nests changes already, yours in a
   proposal's words, one carried by a move, a rename inside a removal; one
   proposal's change on another's text is the case to confirm when it's
   built. **The checker:** deterministic feedback the agent asks for
   whenever it likes, not only at the end, as a list of what's wrong: a
   change in no proposal, or in two; a proposal without its title or why,
   or answering a request the task hasn't got; a move whose two sides
   don't match, apart from the edits inside it; a text between that isn't
   between; and, where the file's kind's module offers one, a file no
   longer valid of its kind, JSON that doesn't parse. Handing back runs
   it, and is refused with the same list, as doctor's refusals were,
   `{ "issues": [...] }`; and a preview shows how the proposals will be
   drawn before they're handed back. **Reported, never refused,** decided
   2026-11-26 under 5: what reaches beyond the job, a change on lines
   another proposal changes, a file no request in the job is on, a
   request outside it answered, so the agent knows it's gone further, and
   goes on if it means to; what you review decides it, as every change
   becomes a proposal, so reaching further is never fenced off, only
   seen. So what's meant is the agent's, every rule the agent's held to
   is deterministic, and it never guesses at them. **Moves, no hints:**
   the agent made its moves, so it knows them, and says them all, edited
   or not, every answer of what it changed reminding it to. Found and let
   go 2026-11-26: the diff marking moves found whole, which the documents
   part will find for reading a file changed outside anyway, as it would
   say some moves and not others, and an agent, shown the whole ones,
   would read no mark as no move and miss those with edits inside. If
   ever helped, asked, not hinted: the checker listing each removal and
   insertion sharing much of their text, edited or not, and the agent
   answering each, a move or not. Tried first, and let go: proposing as a
   checkpoint, as a commit is, everything changed since the last one a
   proposal, which merged two ideas edited before a checkpoint, and could
   never regroup them.

   **Decided 2026-11-26,** for frames: a task's, built up over its life,
   established rather than final. **Fixed:** a file's lines are divided
   into frames and lines no frame holds, no line in two frames, frames
   never overlapping, and a change never divided between frames, its
   lines one frame's; what proposes where frames begin and end may reach
   the same lines, which then make one frame, but what's drawn never
   overlaps. **The task's:** kept with the task, by document, stated
   against the head's version and carried across edits as changes are,
   by the documents part, and gone with the task, your joins and cuts
   shaping this task's frames and no other's. The next task begins
   afresh; its agent framing as an earlier one did is its own memory of
   earlier work, a good thing, nothing of this system's. **The agent
   frames what's new:** at a task's first job, and whenever a job
   brings requests or changes to lines no frame holds, it proposes their
   frames, in the copy's lines as it was given, which are the head's,
   from the file's kind's defaults where a module has them, a function, a
   loop, a branch of an if, a declaration at the top level in
   JavaScript, the narrowest holding a change, a paragraph, a list, a
   code block, a table in Markdown, adjusted as it sees fit. **What's
   established carries on:** frames stay as they are from round to round,
   new changes landing in the frame they fall in. **You adjust when you
   like,** joining and splitting, which makes those frames established,
   with the most weight, as yours, not final: the agent may reshape an
   established frame, yours too, where its changes give it reason, and,
   changing one of yours, the checker asks it why, and you're shown it,
   to put back if you'd rather; so yours lead what comes next without
   binding it. An agent's given the frames as they stand when it reads,
   yours marked as yours. A request's words are a soft edge, kept whole
   by default but cut by a split, an underline in two pieces still one
   request. Frames are mostly the editor's and the tasks part's; the
   agent part carries them, out with what an agent reads and back with
   what it proposes. A frame of only your edits takes the same defaults.
   **Built in this order:** frames kept with the task and carried across
   edits, the agent framing what's new, with the agent part, as it needs
   them from its first job, replacing the frame ranges the playground's
   host writes out by hand; then joining and splitting by hand; then the
   file's kinds' defaults, as the agent's starting point, JavaScript's
   blocks needing more than the playground's tokenizer has, nesting at
   least, Markdown's constructs found by line already.

### what an agent reads, and what it remembers

Thought to be settled together, as what a session remembers would decide
how much a job gives; found 2026-11-26 to be one question, what it
remembers being the harness's and yours, not this system's. Decided
2026-11-26. Waits on 1 and 2.

5. **What an agent reads: the whole task, its job foremost.** Models
   thrive on context, and harnesses keep improving at managing it, so it's
   given generously, never kept lean, and nothing here stands in its way.
   **Decided 2026-11-26:** taking a job, an agent's given its working
   copy, made then, when it takes it, not when you pressed Start, as a
   job can wait a while and should never begin stale; and the whole task
   model: the task, its name and summary; every request, the job's marked
   as its, each one's words found in the copy; every proposal, in every
   file, its title, state, rationale, what you asked of it, your notes on
   its words, and why a decided one was decided; the frames, yours marked;
   what the file did since a stale round was written; **what's changed
   since the task last looked,** for each file in it, the edits since the
   version its last job was taken on, as a diff, each where it came from
   when that's known, you in No task, another task applied, read from
   outside, marked as the file's, as the editor marks the file's in teal,
   so a name renamed elsewhere in a file isn't news to it; and the next
   step. Beyond the task's files, the project as it's changed the agent
   finds out for itself, by git or as it likes, the manifest saying so.
   Asks of the documents part: keeping, for each open task, the version its
   last job was taken on and the edits since, let go when it takes its
   next job, or ends. And the same model shown more than one way, as it
   digests best, redundant on purpose: as data, as a digest to read, and
   each file with its requests and proposals marked, every view asked for
   again whenever it likes. **Focused by framing, not fenced:** the
   manifest and the next step say plainly which requests are its job, the
   rest there to inform it, as you'd brief someone; what's truly in scope
   is hard to say from here, so when it reaches further, into other
   proposals, other requests, or files no request names, the checker
   reports it, never refuses it, and you decide it in review, as every
   change becomes a proposal; perhaps it's for the best. The rest of the
   project it reads as it likes, from disk, as it is; a file it means to
   edit that isn't in its copy is added on asking, as the task has it,
   never refused. For the spike to try too: the copy a whole copy of the
   project as the task has it, something like a worktree, so the agent can
   run its tests and builds, not only the files its job names.

6. **A harness's own session: not this system's.** Whether a task's
   jobs go on one conversation or each begins fresh. **Decided
   2026-11-26, out of scope:** sessions are the harness's to manage, its
   compacting of context, and yours to drive, opening, clearing and
   ending one, apart from anything here; the more an agent knows the
   better, its memory of earlier jobs and tasks a gain. All this system
   owes it already holds: each job complete in itself, and an agent
   stopping whenever, losing nothing. Whether one session should take a
   task's next job, to use what it remembers, is 11's.

### how it's carried, and how an agent learns it

Settled together: the protocol's instructions live in what carries it, a
command's `help` and the next step in each answer, so choosing how it's
carried mostly chose how an agent learns it. Decided in part 2026-11-26,
by the principle above. Waits on 2.

7. **How it's carried: a command.** A command over a local endpoint, as
   doctor's; MCP's tools; plain HTTP; files in a folder an agent watches.
   **Decided 2026-11-26:** an agent runs a command in its own shell, and
   that's all it's given, no MCP; the messages stated apart from how they
   travel, so the command's one carrier among any to come. **Decided
   2026-11-26,** what it talks to: a local endpoint, HTTP on 127.0.0.1, as
   doctor's, the command a thin interface over it, each subcommand a
   request and its answer printed as JSON, all of the protocol behind the
   endpoint; a wait held open as long as the agent asks, `wait --for
   <seconds>`, as doctor's took, 50 seconds unless it says, inside any
   harness's command timeout, and far longer, a quarter of an hour or more,
   in a harness that backgrounds a long command and wakes the agent as it
   ends, `agy`, or Claude Code's commands run in the background, so a
   turn's spent only that often, or as a job lands, which answers it at
   once, found by the spike; a wait answered closed when the endpoint
   stops, so none hangs; the endpoint the shell's to host, the playground's
   server for the spike, and able to serve the editor and the board too, as
   doctor's served its webviews. Where doctor's command found it by what VS
   Code put in the terminals it opened, so an agent in any other couldn't,
   *leaning:* the endpoint writes its address and a token to a file in the
   project's own folder, which the command reads, so an agent opened in any
   terminal in the project reaches it; the token saying an agent's calling,
   which 14 builds on. And Claude Code's channels, an MCP server pushing
   into an open session so it's told of a job rather than waiting, at most
   a nicety for one harness later, as they're MCP and a preview.

8. **How an agent learns the protocol, and comes to be there.** Doctor's
   prose `next`, written for whoever reads it; an instructions file each
   harness reads, `AGENTS.md`, `CLAUDE.md`; tool descriptions, MCP's; a
   `help`. And how an agent's there to pull, as every agent pulls: you
   opening one and pointing it at the mailbox, once, as doctor's person
   did, or something launching one in the background when a job's
   waiting, told to take it, do it, and stop. **Decided 2026-11-26:** you
   open it, by the principle above; launching one is a choice per harness,
   never the design's. *Leaning:* the protocol says the next step in
   every answer, as doctor's did, so no harness needs teaching beyond
   being pointed at it, once.

### a job's lifecycle

What pressing Start makes is a job, named so 2026-11-26, where it had been
called a start, as Start's the button; and this group is its lifecycle,
from the mailbox to done, and what ends it early. Thought first to be
about who owns a job; found 2026-11-26 not to need an owner kept, only
that a job's being worked on, and when it was last heard of. Settled
together. Decided 2026-11-26. Waits on 1 and 2.

9. **A job's states.** With the agent isn't an agent at work: a job can
   wait, no agent pulling, none free, and the editor draws every request
   with the agent as running now, shimmering, which a real agent part makes
   untrue till one has it. **Decided 2026-11-26:** a job is **queued,** in
   the mailbox; **being worked on,** an agent having picked it up from
   there, the only place an agent looks for work; **done,** handed back,
   the checker holding it to its rules; or **cancelled,** stopped, at
   either stage. Being worked on, a job may be **waiting on you,** its
   agent having asked a question it can't go on without, 12, its session
   alive and its context kept, waiting for your answer, which isn't paused,
   nothing saved to be taken up later. No paused: a job can't be continued,
   which no harness offers and nothing here builds, so a job stopped and
   started again is a new one, done from scratch. No owner kept: every call
   an agent makes about its job carries the job's id, so the job knows it's
   being worked on, and when it was last heard of, taking it, asking what
   it changed, checking, asking for a view, adding a file; who did it is
   authorship, 14, kept with what it hands back. A wait isn't blind
   polling: held open, it's answered the moment a job lands in the mailbox,
   or, nothing in time, with nothing yet, and the agent waits again, so
   it's told work's come as it comes. The tasks part keeps a request with
   the agent; the agent part keeps the job; and the editor draws a request
   whose job's queued as waiting for an agent, still, not shimmering, a
   fourth status between staged and running, and one whose job's being
   worked on as running. **A job gone quiet,** its agent slow, or gone, a
   session closed, which nothing tells this system: heard of by nothing for
   a while, its requests stop shimmering and say so, muted, "quiet · 14
   min", counted in the footer and on the board, for you to stop if you
   think it's gone, never stopped on its own, as an agent deep in a run of
   its tests is quiet too. Its agent coming back to it after all carries
   on, if it hasn't been stopped; if it has, its calls are answered that
   it's stopped, and what it hands back refused, so there's never work
   landed for a job no longer wanted. Tried and let go: putting a quiet job
   back in the mailbox for another agent, its batch kept, too much for now,
   as Stop and Start again do it. **A check-in,** decided 2026-11-26, as
   the spike found an agent deep in a long job can't otherwise learn it's
   been stopped: `check <job>`, with a line on what it's doing if it likes,
   "reading the editor's files", answered with the job's state, stopped or
   not, any answer to a question it asked, and what's changed in its files
   since; so it learns it's stopped between steps, not at the end, the
   job's heard of, never quiet while it checks in, and its line shown as
   the job's latest, what an agent's doing; the answer to a job taken
   suggesting it check in between big steps. **A job given out is
   acknowledged,** found by the spike, a job answered to a wait whose
   caller had gone counted taken with no agent on it: **decided
   2026-11-26:** a job a wait answers with is offered, not yet taken, till
   the agent's first check-in, "starting", which the answer asks for first;
   one not acknowledged within a minute queued again, at the front, so a
   job's never lost between the endpoint and an agent that's gone, and a
   wait whose caller's gone is never given one at all. Asking an agent how
   it's going stays where you'd ask it now, its terminal.

10. **Stop, and what comes in while a job's being worked on.** **Decided
    2026-11-26:** Stop cancels a job, queued or being worked on; its agent
    learns it the next time it calls about it, told to drop it and go back
    to the mailbox; what it handed back already stays, in front of you as
    proposals; and its other requests are staged again, yours, to edit,
    remove or start again as a new job. New requests started while a job's
    being worked on are a new job, queued behind it, never added to it, a
    request on a proposal it's revising waiting for the next, as a
    proposal's revised one round at a time. The file changing under a job
    being worked on, by you or another task applied, is told its agent the
    next time it calls, as up-to-date awareness asks, its work landing
    carried across as any round's, stale where it was touched. Removing a
    staged request is built already: Remove among its actions, the tasks
    part's `REMOVE`; one with the agent is stopped first. **A stopped job
    needs no cleaning up,** an agent's asked in the spike what leaving
    nothing half done meant: it works in its copy, 3, and a stopped job's
    copy is let go, nothing reaching a file but what's handed back and
    checked, so stopping's never the agent's to undo.

11. **Many agents, and the order of jobs.** **Decided 2026-11-26:** one
    job at a time within a task, in the order you made them, the next not
    taken till the one before's done or cancelled, as a later one may
    build on what an earlier one changes; at once across tasks, as tasks
    are flat, by as many agents as are waiting; an agent taking the
    oldest queued job of any task, or, pointed at one, `wait --task`,
    only that task's; and told what's queued behind it in its task, to
    know, never to take on, its job its own. Two agents on the same lines,
    of different tasks, their proposals meet as the documents part already
    carries them.

### the agent talking back, and where its work shows

In order: what an agent can say back first, then where that and its work
are drawn. Decided 2026-11-26, the question the one thing new here, two
kinds of it, most else answered already by what's decided above.

12. **The agent talking back.** **Decided 2026-11-26:** two kinds of
    question. **Mid-job, urgent:** an agent needing your word to go on asks
    within its job, keeping what it's built up of it, what it's read, what
    it's half edited in its copy, how it's understood the batch, all lost
    were it to end the job to ask. Asking returns at once, so it goes on
    with what doesn't wait on the answer; your answer comes with whatever
    the endpoint next tells it; and when it can't go further without it, it
    waits for it as it waits on the mailbox, held open, answered in time
    with no answer yet, and waiting again, at little cost to its context.
    Its job's being worked on, waiting on you, 9, the question on its
    request, counted as needing you. Unanswered a long while, nothing times
    out here; but an agent may not last as long, its session closed,
    compacted, timed out, which shows, as it's known whether a wait for
    that job's open, a job no longer waited on and not heard of shown quiet
    as any; and answering one no agent's waiting on any more, you're told,
    and offered to stop it and start it again, the question and your answer
    kept with the request for the new job, its context lost but not your
    answer. **Post-job, curious:** asked as it hands back, nothing waiting:
    a request it couldn't do without your word, staged again with the
    question, for you to answer, **Answer** keeping it staged, **Answer and
    start** sending it straight back, as a form's Add and Start do, a new
    job given the question and your answer; or a question on work it did,
    "I capped it at 30 seconds; should it be an option?", on the proposal
    or request, answered by a request of yours, revising the proposal, or
    left be. An agent may choose post-job over mid-job, handing a request
    back with its question rather than waiting, where the answer can wait,
    or its harness can't. **What a question's on:** one or more of the
    job's requests, sharing one asked of them all, and, if it says, words
    of the file, underlined where they are, as a request's are. **Shown**
    on its request, under your notes, in the agent's voice, apart from
    yours, its status word question; **kept** on the request, every
    question and answer in order, all given to each later job with it, the
    latest shown and the rest folded, as long as the request's kept. **Not
    blocking other work:** within a task a job queued behind a question
    waits, as jobs run in order, and says so, "1 queued behind a question";
    across tasks, other agents take other jobs, while an agent waiting on
    you takes none, its session given to its job. What helps from here: an
    agent waiting is told what's queued meanwhile, to judge whether to hand
    back its question post-job and be free; and you're told, the footer
    counting agents waiting for work apart from agents waiting on you, so
    jobs queued with no agent free say to answer, or open another.
    **Declining** needs nothing new: a request addressed with a note that
    nothing needed changing, the note saying why, I don't think this should
    be done, because; or, needing your word, a question. **Summaries,** as
    doctor's: the task's and each file's, updated by the agent as it hands
    back, its voice in the header and the cards. **Going further,**
    proposing past what it was asked, is decided under 5, reported and
    never refused. **Not yet, noted as possible: an agent's own requests,**
    "I found two more places", the model allowing them, anyone making
    requests. Not supported for now: an agent should do what it finds,
    beyond its job if it must, reported so, and you answer with a request
    of your own, as a request of its own would let it put off doing what it
    ought to; the one case it might serve, work in the task's scope but
    apart from what's asked, waits till it's needed.

13. **Where the agent's work shows.** **Decided 2026-11-26:** beside what's
    drawn already, a request staged, running, shimmering, and addressed,
    the board's columns and the footer's counts: a request whose job's
    queued, waiting for an agent, still, not shimmering; a job gone quiet,
    marked, "quiet · 14 min", counted in the footer and on the board; a
    question waiting, on its request, counted as needing you; and whether
    any agent's listening, the footer counting the waits open, agents
    waiting for work apart from agents waiting on you, "2 agents waiting",
    and saying none's free while jobs are queued, so a Start pressed with
    no agent open, or every one waiting on you, says why nothing's
    happening: answer, or open one. Who's on a job isn't shown, as no
    owner's kept; what it's doing, later, with progress reports.

### identity, what's kept, and faking it

Last, each leaning partly elsewhere, and smaller for all that's settled
before them. Decided 2026-11-26.

14. **Identity and trust.** **Decided 2026-11-26:** **content over
    author:** nothing shows which agent, harness, model or session did
    the work, so whoever reads it judges the work, not who did it, and
    nothing here depends on knowing, a job's id carrying all its calls
    need. **A token,** as a localhost endpoint can be reached by any page
    in a browser, which a token kept in a file of the project, read by no
    page, shuts out: one an agent's calls need, written to the project's
    folder, another for the editor and the board once they call it, kept
    out of git. Local first, never assumed: the editor, the agent and its
    working copy may be remote from each other one day, so the endpoint's
    plain HTTP with tokens from the start, and its address never more
    than where to find it. **What an agent may do:** an agent does what
    it does; nothing's enforced beyond the protocol's own rules, the
    checker's among them, and the command, a face over the endpoint, the
    endpoint the protocol, says how it's meant to be used, its `help` and
    the next step in every answer, applying, deciding and collecting left
    yours, as nothing in it offers them.

15. **What's kept, and where: who holds what.** Where each thing lives,
    and which is the truth of it. **Decided 2026-11-26:** **the project's
    folder,** the dot folder `TASKS.md` keeps tasks and documents in,
    the truth of everything that's a task's: its requests and where they
    stand, the questions asked of them and your answers, its proposals
    and rounds, its heads, its frames, and, the documents part's, the
    version its last job was taken on; **the agent server,** ephemeral,
    the agent part's own: the mailbox and its jobs, queued, being worked
    on, waiting on you, the waits open, when each job was last heard of,
    the address and its tokens, and the working copies; **the editor's
    host,** its setup, the modules for language, reading and framing,
    and the view's own state; and **the agent,** its session, the
    harness's. The agent server holds nothing of a task's, naming
    requests and proposals by their ids, the task's file holding them, so
    a restart of it loses only its jobs and copies: starting, it finds
    requests the task says are with the agent with no job, and stages
    them again, saying why, for you to start again, their batches gone.
    **Later, noted as wanted: jobs surviving a restart,** queued jobs and
    their batches written to the project's folder, so a restart loses
    none, and, if it can be had, one being worked on picked up again.

16. **Faking it, and testing it.** The playground's host fakes the agent
    now, inside itself, a round landing a moment later as its proposal's
    own changes, nothing of a real agent's way through it tried.
    **Decided 2026-11-26:** the fake an agent like any other, a client of
    the protocol, a small script taking a job from the mailbox, writing
    its changes into its copy, grouping them through the checker, asking
    and answering as a test needs, and handing back, the playground's
    host no longer faking rounds itself; so the playground and the tests
    run the real agent part, the mailbox, jobs, copies, the diff, the
    checker, questions, with no model in it, every time the tests run.
    Real harnesses, Claude Code, `agy` and Codex, tried by hand in the
    spike, against the same protocol.

## open

Walked through 2026-11-26, all sixteen, and the spike run three times,
its findings under the first principle: both harnesses keep to the loop;
a wait's held as long as the agent asks, `wait --for`; a job's offered
till a first check-in takes it, and checked in on between steps, which
finds a stop. What's next: `source/agent/`, from this note, the spike in
`spikes/mailbox/` thrown away once it's built. Details still open inside
what's decided: how a revision's compared, 3; where a working copy lives,
a folder per job or a whole worktree-like copy, 3 and 5; frames' joining
and splitting by hand, and the file's kinds' defaults, after frames kept
with the task, 4; the folder's name, `TASKS.md`'s; a session left waiting
for hours, to watch in use. Later, noted as wanted or possible: an
agent's own requests, 12; jobs surviving a restart, 15; Claude Code's
channels, 7; moves asked about, never hinted, 4; and a file edited as
something other than how it's stored, under the documents part in
`TASKS.md`.
