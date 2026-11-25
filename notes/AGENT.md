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

In the order they lean on each other; each says what it waits on.

1. **What's handed out.** The unit of work an agent's given, the thing
   that's running. Doctor gave the whole task, every time. *Leaning:* a
   round: the requests started in one scope, with the task they're in, the
   documents at the version the round's written on, and the proposals in
   scope, their feedback, notes on their words and your edits to them. A
   task started whole is then as many rounds as it has scopes. Open: one
   round per proposal revised, or a start's whole scope as one job, which
   an agent might split itself.

2. **Who drives: the agent pulling, the host starting agents, or both.**
   Doctor's pull suits an agent you're talking to, in a terminal you have
   open: it asks for work and is given it. Not coupling to a harness also
   asks for the other way: the host starting an agent for a round itself,
   through whichever harness can run without a person, as most can, and
   collecting what it proposes. *Leaning:* both, as adapters of one
   protocol, the agent part knowing neither; so the protocol's the agent's
   side of things, whoever started it. Waits on 1.

3. **How it's carried.** A command over a local endpoint, as doctor's;
   MCP's tools, the nearest thing to a shared standard among harnesses;
   plain HTTP; files in a folder an agent watches. *Leaning:* the messages
   stated apart from how they travel, a command first, since anything that
   runs a shell can use it, and MCP as a second adapter. Waits on 2.

4. **What an agent reads.** The task, its summary and requests; the
   documents, whole or in part, at the round's version; the proposals in
   scope and what was asked of them; your edits, its own earlier rounds,
   other proposals in flight on the same lines, and what the file did since
   a stale round was written. How much is given at once, and how much is
   there to ask for, as doctor's `document` was. *Leaning:* the round
   given whole but lean, the rest asked for by name, so a round's cost
   follows what it touches.

5. **What an agent writes.** Our changes are ranges and moves on a
   version; agents write best by quoting what to replace, or by writing a
   file whole. *Leaning:* take both, quoted replacements and whole files,
   and make them into changes here, refusing a quote that isn't found or
   is found twice, as `str_replace` is refused, with moves said outright;
   grouped into proposals, each one idea, with its title, why, the requests
   it answers, and, revising, what this round changed. And a request
   answered with nothing to change says why. Summaries of the task and of
   each document, as doctor's, the agent's voice in the header and the
   cards.

6. **Liveness.** With the agent isn't an agent at work: a round can wait,
   no agent pulling, none free, none yet launched, and the editor draws
   every request with the agent as running now, shimmering, which a real
   agent part makes untrue till one has it. Who's taken a round; whether
   it's working, quiet, or gone; what happens to a round whose agent
   vanishes, back to queued or kept with what it had proposed; how long's
   too long. Doctor's presence was
   one agent's; here it's each round's, and each agent's across them.
   *Leaning:* the tasks part keeps with the agent, and the agent part says
   which rounds an agent has: claimed, and held while it's heard from, its
   presence read from what its agent does, as doctor's was; let go when it
   isn't, back to waiting for an agent, or to queued, what it proposed
   meanwhile kept. The editor draws a fourth status between queued and
   running, waiting for an agent, still, not shimmering. Waits on 2.

7. **Stop, and what's asked mid-round.** Stop puts what's running back in
   the queue: how's an agent told, pulling, or started by the host, which
   can end it. A request on a proposal being revised waits for its next
   round, as now; a request elsewhere in the task, while a round runs, is
   another round's. Your edits under a running round land it stale, as now.
   *Leaning:* an agent learns it's stopped the next time it speaks, its
   next message refused with why, and the host ends the ones it started.
   Waits on 2 and 6.

8. **The agent talking back.** Doctor asked, and never settled, whether an
   agent can make requests, "I found two more places"; here anyone can,
   with the policy above. Not yet asked: an agent asking you something mid-
   round, which hands that part of the task to you till you answer; an
   agent declining a request, saying why; an agent proposing past where it
   was asked, which doctor called going further. *Leaning:* a question as
   its own kind, shown where the round's shown, your answer resuming it;
   this may be what makes working beside an agent feel like working with
   one. Waits on 1.

9. **How an agent learns the protocol, and starts.** Doctor's prose
   `next`, written for whoever reads it; an instructions file each harness
   reads, `AGENTS.md`, `CLAUDE.md`; tool descriptions, MCP's; a `help`. And
   who starts it: the person, once, as doctor's did, or the host, every
   round. *Leaning:* the protocol says the next step in every answer, as
   doctor's did, so no harness needs teaching beyond being pointed at it.
   Waits on 2 and 3.

10. **Identity and trust.** Which agent, harness, model and session did
    what, for authorship and for presence; how an agent proves it, a token
    as doctor's was; and what an agent may do beyond proposing, make
    requests that go straight in, apply, collect, which the model allows
    and a layer above decides. *Leaning:* every message carries who sent
    it, the token saying it, and the layer of permissions designed with
    the shell.

11. **Many agents.** Rounds of one task by different agents at once,
    rounds of many tasks by one, two agents on the same lines; their
    proposals meeting, which the documents part already carries; and which
    agent gets which round, any free one, one chosen, or one kept for a
    task. *Leaning:* any agent that asks, or the one a start names, the
    model not caring which. Waits on 2 and 6.

12. **A harness's own session.** Whether a task's rounds go on one
    conversation, the agent keeping what it learned of the task, or each
    starts fresh from what the protocol gives it. A harness keeps sessions
    its own way, if at all. *Leaning:* fresh by default, the protocol
    giving whatever a round needs, so nothing depends on a harness
    remembering; a session kept where a harness can, as a nicety. Waits on
    2 and 4.

13. **Where the agent's work shows.** Running's drawn already, its
    shimmer, the board's With agent; what's added: who's on it, whether
    it's heard from or quiet, a question waiting, a round let go; perhaps
    what it's doing as it does it, if a harness says. *Leaning:* presence
    per round in what already shows a round running, and per agent in the
    footer, as doctor's footer said where its agent was. Waits on 6 and 8.

14. **What's kept, and where.** Rounds, claims and questions across a
    reload or a restart: the shell's storage, as the tasks part's is.
    Waits on the shell.

15. **Faking it, and testing it.** The playground's host fakes the agent
    now, a round landing a moment later as its proposal's own changes.
    *Leaning:* the fake an adapter of the protocol like any other, so the
    playground and the tests drive the real agent part, and a harness's
    adapter is tested against the same contract.

## open

Everything above; walked through in order, each settled here as it's
decided, as `TASKS.md`'s were, before `source/agent/` is begun.
