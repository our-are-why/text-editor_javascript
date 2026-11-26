# the agent

The agent part, the third behind the task UI, after the tasks and documents
parts: how what's asked of a task reaches an agent, how what the agent
answers comes back, and how working beside one feels, ergonomic and
seamless, without the system coupled to any one harness, Claude Code or
another. A draft, begun 2026-11-25, of the questions to walk through before
it's designed: each with what doctor did, what the task model here already
settles, and a leaning, which is only where the walk starts, not a decision.

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
leans on its harness more than one launched for a single start: every
wait answered well inside a harness's command timeout, as doctor's were
within 50 seconds, two minutes being Claude Code's default; an answer of
nothing yet as short as it can be, so waiting costs an agent little of
its context; and every answer saying the next step, waiting again among
them, so an agent never falls out of the loop. And of the agent part:
an agent dropping out loses nothing, its start back to waiting for an
agent, so robustness never rests on an agent behaving.

Not yet known, and to be found before the rest is built on it: how each
harness bears a session waiting for hours, whether it keeps on, or ends
its turn and stops, how long its commands may run, how fast its context
fills. **A spike,** as soon as the first commands exist, a mailbox, a
wait and a take, tried in real sessions of Claude Code, `agy` and Codex.
And an open session looping on its own for hours is nearer human-driven
than anything headless, as doctor's was, but not the same; its terms
watched.

## what's settled here already

From `TASKS.md`, so these aren't walked through again:

- **tasks are flat, and many run at once.** The agent part serves every
  task that's started, by as many agents as that takes, and no task sees
  it. There's no turn: a task that isn't the one shown goes on as it was.
- **starting is explicit, at any scope:** a request, a proposal's revision,
  a frame, a document's requests, or the task's. A request is queued,
  yours till you start it; with the agent, `WITH_AGENT`, once you have,
  whether or not an agent's picked it up; or addressed, by proposals that
  answer it or a note that nothing needed changing. Decided 2026-11-25:
  with the agent, where it was started, `STARTED`, which read as an agent
  at work; a task's own start, begun rather than a draft, keeps the word.
- **a round:** what's started on a proposal, its next version, revised
  one round at a time, never two at once; requests asked meanwhile wait for
  the next. Run again starts a round's requests over on the file as it is.
- **versions and carrying:** a round's written on the document as it was
  when it started, and lands on the document as it is, carried across
  every edit since by the documents part, what an edit touched stale, a
  conflict if it's the task's own.
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

1. **What's handed out: a start, as you made it.** Doctor gave the whole
   task, every time. **Decided 2026-11-26:** the piece of work an agent's
   given is a start, the batch you made by pressing Start where you did,
   on a request, a proposal's revision, a frame, a document's requests or
   the task: the task, the scope and level it was pressed at, and the
   requests it started. Each start is its own, never merged with the one
   after it, nor split, and worked as its own, so a batch and another made
   quickly after are two. The agent's given a start whole, every request
   in it at once, so it can answer them together, holistically; when what
   it proposes lands, as it writes each proposal or all of it together,
   is the agent's to decide. A start's not a round: a round is still a
   proposal's next version, and a start may make several, and new
   proposals. Only what was started is in it: a proposal being revised by
   a round already with an agent is left out of a later start, as the
   task model never revises a proposal twice at once.

2. **Who drives: agents pull, always.** Doctor's agent pulled, `doctor
   wait`; the other way would have been the host starting an agent for
   each piece of work itself, through whichever harness can run without a
   person. **Decided 2026-11-26:** agents pull, always, from a mailbox the
   system puts each start into as you make it, in the order you make them;
   the system never reaches into an agent, so it needn't know what one is.
   An agent started in the background, by something that launches one, is
   a puller like any other, told to take a start, do it, and stop; how an
   agent comes to be there, you opening one or something launching it, is
   question 8's. Waiting for an agent, question 9's fourth status, is a
   start in the mailbox that no agent's taken; Stop on one no agent's
   taken, question 10's, only takes it back out.

### what an agent writes

Two questions, found 2026-11-26 to be two: the text an agent writes, on
its own, as soon as a start's settled; and how what it writes is grouped,
into proposals and into frames, which leans on what it reads, 5, and on
`TASKS.md`'s joining and splitting frames by hand. Waits on 1.

3. **The text an agent writes: a working copy.** Our changes are ranges
   and moves on a version; agents write best by editing files with their
   own tools. **Decided 2026-11-26:** taking a start, the agent's given a
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
   its last; where the copy lives, a folder per start or something like
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
   holistically, as a start's given whole. Edits apart from each other
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
   or answering a request not in its start; a move whose two sides don't
   match, apart from the edits inside it; a text between that isn't
   between; a file edited outside the start's scope; and, where the
   file's kind's module offers one, a file no longer valid of its kind,
   JSON that doesn't parse. Handing back runs it, and is refused with the
   same list, as doctor's refusals were, `{ "issues": [...] }`; and a
   preview shows how the proposals will be drawn before they're handed
   back. So what's meant is the agent's, every rule the agent's held to is
   deterministic, and it never guesses at them. **Moves, no hints:** the
   agent made its moves, so it knows them, and says them all, edited or
   not, every answer of what it changed reminding it to. Found and let go
   2026-11-26: the diff marking moves found whole, which the documents
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
   frames what's new:** at a task's first start, and whenever a start
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
   them from its first start, replacing the frame ranges the playground's
   host writes out by hand; then joining and splitting by hand; then the
   file's kinds' defaults, as the agent's starting point, JavaScript's
   blocks needing more than the playground's tokenizer has, nesting at
   least, Markdown's constructs found by line already.

### what an agent reads, and what it remembers

Settled together: if a task's rounds go on one conversation, a round can
give less, the agent remembering the rest; if each starts fresh, a round
has to give all it needs. Which is the default decides how much a round
gives. Waits on 1 and 2.

5. **What an agent reads.** The task, its summary and requests; the
   documents, whole or in part, at the round's version; the proposals in
   scope and what was asked of them; your edits, its own earlier rounds,
   other proposals in flight on the same lines, and what the file did since
   a stale round was written. How much is given at once, and how much is
   there to ask for, as doctor's `document` was. *Leaning:* the start
   given whole but lean, the rest asked for by name, so its cost follows
   what it touches. And which version it's written on: `TASKS.md` has a
   round written on the document as it was when it started, but a start
   can wait in the mailbox a while; *leaning* to the version when an agent
   takes it, so it never begins stale, which changes what `TASKS.md`
   says.

6. **A harness's own session.** Whether a task's rounds go on one
   conversation, the agent keeping what it learned of the task, or each
   starts fresh from what the protocol gives it. A harness keeps sessions
   its own way, if at all. *Leaning:* fresh by default, the protocol
   giving whatever a round needs, so nothing depends on a harness
   remembering; a session kept where a harness can, as a nicety.

### how it's carried, and how an agent learns it

Settled together: the protocol's instructions live in what carries it, a
command's `help` and the next step in each answer, so choosing how it's
carried mostly chose how an agent learns it. Decided in part 2026-11-26,
by the principle above. Waits on 2.

7. **How it's carried: a command.** A command over a local endpoint, as
   doctor's; MCP's tools; plain HTTP; files in a folder an agent watches.
   **Decided 2026-11-26:** an agent runs a command in its own shell, and
   that's all it's given, no MCP; the messages stated apart from how
   they travel, so the command's one carrier among any to come. **Decided
   2026-11-26,** what it talks to: a local endpoint, HTTP on 127.0.0.1,
   as doctor's, the command a thin interface over it, each subcommand a
   request and its answer printed as JSON, all of the protocol behind the
   endpoint; a wait held open and answered well inside a harness's
   command timeout; the endpoint the shell's to host, the playground's
   server for the spike, and able to serve the editor and the board too,
   as doctor's served its webviews. Where doctor's command found it by
   what VS Code put in the terminals it opened, so an agent in any other
   couldn't, *leaning:* the endpoint writes its address and a token to a
   file in the project's own folder, which the command reads, so an agent
   opened in any terminal in the project reaches it; the token saying an
   agent's calling, which 14 builds on. And Claude Code's channels, an MCP
   server pushing into an open session so it's told of a start rather
   than waiting, at most a nicety for one harness later, as they're MCP
   and a preview.

8. **How an agent learns the protocol, and comes to be there.** Doctor's
   prose `next`, written for whoever reads it; an instructions file each
   harness reads, `AGENTS.md`, `CLAUDE.md`; tool descriptions, MCP's; a
   `help`. And how an agent's there to pull, as every agent pulls: you
   opening one and pointing it at the mailbox, once, as doctor's person
   did, or something launching one in the background when a start's
   waiting, told to take it, do it, and stop. **Decided 2026-11-26:** you
   open it, by the principle above; launching one is a choice per harness,
   never the design's. *Leaning:* the protocol says the next step in
   every answer, as doctor's did, so no harness needs teaching beyond
   being pointed at it, once.

### claims: liveness, stopping, and many agents

Settled together: all three are who holds a round, how that's known, and
how it's let go, by an agent going quiet, by Stop, or by another agent
wanting it; apart, claims would be decided three times. Waits on 1 and 2.

9. **Liveness.** With the agent isn't an agent at work: a round can wait,
   no agent pulling, none free, none yet launched, and the editor draws
   every request with the agent as running now, shimmering, which a real
   agent part makes untrue till one has it. Who's taken a round; whether
   it's working, quiet, or gone; what happens to a round whose agent
   vanishes, back to queued or kept with what it had proposed; how long's
   too long. Doctor's presence was one agent's; here it's each round's, and
   each agent's across them. *Leaning:* the tasks part keeps with the
   agent, and the agent part says which rounds an agent has: claimed, and
   held while it's heard from, its presence read from what its agent does,
   as doctor's was; let go when it isn't, back to waiting for an agent, or
   to queued, what it proposed meanwhile kept. The editor draws a fourth
   status between queued and running, waiting for an agent, still, not
   shimmering.

10. **Stop, and what's asked mid-round.** Stop puts what's running back in
   the queue: how's an agent told, pulling, or started by the host, which
   can end it. A request on a proposal being revised waits for its next
   round, as now; a request elsewhere in the task, while a round runs, is
   another round's. Your edits under a running round land it stale, as now.
   *Leaning:* an agent learns it's stopped the next time it speaks, its
   next message refused with why, and the host ends the ones it started.

11. **Many agents, and the order of starts.** Starts of one task by
    different agents at once, starts of many tasks by one, two agents on
    the same lines; their proposals meeting, which the documents part
    already carries; and which agent gets which start, any free one, one
    chosen, or one kept for a task. And the order: a task's starts one
    after another, the next not taken till the one before's handed back,
    as a later one may build on what an earlier one changes, or taken at
    once by different agents, kept apart; and an agent holding a task's
    start shown what you start on it meanwhile, as doctor's steering was,
    or leaving it for the next. *Leaning:* one after another within a
    task, at once across tasks; any agent that asks, or the one a start
    names, the model not caring which.

### the agent talking back, and where its work shows

In order: what an agent can say back first, then where that and its
presence are drawn. Waits on 1 for the first, and on the claims for the
second.

12. **The agent talking back.** Doctor asked, and never settled, whether an
    agent can make requests, "I found two more places"; here anyone can,
    with the policy above. Not yet asked: an agent asking you something
    mid-round, which hands that part of the task to you till you answer;
    an agent declining a request, saying why; an agent proposing past
    where it was asked, which doctor called going further. *Leaning:* a
    question as its own kind, shown where the round's shown, your answer
    resuming it; this may be what makes working beside an agent feel like
    working with one.

13. **Where the agent's work shows.** Running's drawn already, its
    shimmer, the board's With agent; what's added: who's on it, whether
    it's heard from or quiet, waiting for an agent, a question waiting, a
    round let go; perhaps what it's doing as it does it, if a harness says.
    *Leaning:* presence per round in what already shows a round running,
    and per agent in the footer, as doctor's footer said where its agent
    was.

### identity, what's kept, and faking it

Last, each leaning partly elsewhere: identity's token travels as the
protocol does, after 7, and what an agent may do is a layer of
permissions nearer the shell; what's kept is the shell's; and the fake's
an adapter, so it waits on the adapters' shape, after 2 and 7.

14. **Identity and trust.** Which agent, harness, model and session did
    what, for authorship and for presence; how an agent proves it, a token
    as doctor's was; and what an agent may do beyond proposing, make
    requests that go straight in, apply, collect, which the model allows
    and a layer above decides. *Leaning:* every message carries who sent
    it, the token saying it, and the layer of permissions designed with
    the shell.

15. **What's kept, and where.** Rounds, claims and questions across a
    reload or a restart: the shell's storage, as the tasks part's is.

16. **Faking it, and testing it.** The playground's host fakes the agent
    now, a round landing a moment later as its proposal's own changes.
    *Leaning:* the fake an adapter of the protocol like any other, so the
    playground and the tests drive the real agent part, and a harness's
    adapter is tested against the same contract.

## open

Everything above, walked through group by group, each settled here as it's
decided, as `TASKS.md`'s were, before `source/agent/` is begun.
