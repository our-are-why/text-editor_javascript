# the mailbox spike

A throwaway test of the one assumption `notes/AGENT.md` builds the agent
part on: that a real interactive session of a harness, opened by you,
can sit on a mailbox for hours, picking up jobs as they land, and keep to
the loop. Tried with Claude Code and `agy`. Not part of the system; thrown
away once it's answered.

## running it

The mailbox:

    bun spikes/mailbox/server.ts

It writes its address and two tokens, yours and the agent's, to
`spikes/mailbox/.state/endpoint.json`, and logs every call to
`spikes/mailbox/.state/log.jsonl`.

## the agent

Open Claude Code, or `agy`, in this project, and paste:

> You're working through a mailbox of jobs for this project. Run
> `bun spikes/mailbox/agent.ts wait`. Each answer is one line of JSON:
> do what its "next" says, every time, waiting again included, and keep
> going until I tell you to stop.

Let it run `bun spikes/mailbox/agent.ts` without asking each time: in
Claude Code, allow it when it first asks; in `agy`, allow `command(bun)`,
or use Turbo.

## you

    bun spikes/mailbox/drop.ts "Append the line 'one' to spikes/mailbox/sandbox/notes.md"
    bun spikes/mailbox/drop.ts status
    bun spikes/mailbox/drop.ts stop j-3

Drop a job right away, then after ten minutes, after an hour, and after a
few hours; stop one while it's being worked on. Both sessions can wait at
once: whichever's woken first takes a job.

## what we're finding out

    bun spikes/mailbox/report.ts

For each session, by its harness and a hash of its session id, never the
id: how long it kept waiting, how many waits, the gaps between an answer
and its next call, how much its answers cost it, and how fast a job was
taken. And what you see in each session: whether it keeps waiting, or ends
its turn and stops; what its command timeout does to a wait held 50
seconds; how fast waiting fills its context; whether it follows each
"next" without drifting.
