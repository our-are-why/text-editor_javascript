# the prompt for agy

Paste the block below into `agy`, opened in this project (`cd ~/project`,
then `agy`). It starts a four-minute schedule of jobs itself, works through
them from the mailbox, and tells you what it found. The mailbox has to be
running first: `bun spikes/mailbox/drop.ts status` answers if it is; if it
doesn't, start it with `bun spikes/mailbox/server.ts` in another terminal.

Let it run `bun` commands without asking each time: allow `command(bun)`
when it asks, or switch to Turbo.

---

You're helping test a mailbox of jobs for this project; why it exists is in
`spikes/mailbox/README.md`, but you don't need to read it to do this.

1. Start the job schedule in the background, so it runs while you work:

   `nohup bun spikes/mailbox/driver.ts short > spikes/mailbox/.state/driver-short.log 2>&1 &`

   It drops four jobs into the mailbox over about four minutes, and stops
   one of them while it's being worked on.

2. Run `bun spikes/mailbox/agent.ts wait`. Each answer is one line of JSON:
   do what its "next" says, every time, waiting again included. A job's
   notes say what to do in this project; do it properly, then hand it back
   as the "next" says. If an answer says a job was stopped, drop that job
   as it says, and go on.

3. Keep going till the schedule's done: once a wait answers "nothing yet"
   and `spikes/mailbox/.state/driver-short.log` has a line saying
   "finished", stop waiting.

4. Run `bun spikes/mailbox/report.ts`, and tell me:
   - what it says of your session;
   - whether any wait was cut off before it answered, or failed, and how;
   - anything in the loop that was unclear, or you had to guess at;
   - anything about running a command that waits up to 50 seconds that
     your harness made awkward.
