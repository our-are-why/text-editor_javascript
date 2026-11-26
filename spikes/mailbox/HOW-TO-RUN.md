# how to run the mailbox spike

Steps to follow; why it exists is in `README.md` beside this.

## 1. start the mailbox

In a terminal of your own, so it lasts as long as the test does:

    cd ~/project
    bun spikes/mailbox/server.ts

It prints its address. Leave it running. (If one's already running, from
Claude's session, stop that one first, or use it.)

## 2. open the agents

Claude Code, in a terminal in the project:

    cd ~/project
    claude

`agy`, in another terminal in the project:

    cd ~/project
    agy

Paste this into each:

    You're working through a mailbox of jobs for this project. Run
    `bun spikes/mailbox/agent.ts wait`. Each answer is one line of JSON:
    do what its "next" says, every time, waiting again included, and keep
    going until I tell you to stop.

Let each run `bun spikes/mailbox/agent.ts` without asking every time:

- Claude Code: when it first asks, choose to allow it, and not to ask
  again for that command.
- `agy`: allow `command(bun)` when it asks, or switch to Turbo.

## 3. drop jobs, over hours

In a third terminal:

    cd ~/project
    bun spikes/mailbox/drop.ts "Append the line 'one' to spikes/mailbox/sandbox/notes.md"

Then, spread out:

- right away, a job like the one above;
- after about ten minutes, another;
- after about an hour, another;
- after a few hours, another;
- once, drop a slower job, "Read every file in source/documents/ and
  write a one-paragraph summary of each to spikes/mailbox/sandbox/summary.md",
  and while it's being worked on, stop it:

      bun spikes/mailbox/drop.ts status
      bun spikes/mailbox/drop.ts stop j-5

Both agents can wait at once; whichever's woken first takes a job.

## 4. watch each session

- does it keep waiting, or end its turn and stop asking?
- does a 50-second wait ever get cut off by the harness's own timeout?
- how fast does waiting fill its context? (Claude Code: `/context`)
- does it follow each "next" without drifting, and stop when a job's
  stopped?

## 5. the numbers

    bun spikes/mailbox/report.ts

Or ask Claude to run it and read it with you.
