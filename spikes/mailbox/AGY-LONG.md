# the prompt for agy: a long wait

The second try with `agy`, after `AGY.md`'s: a wait held a quarter of an
hour, `wait --for 900`, to see it spends a turn only when a job lands or
the wait's up, where a 50-second wait spent one every 50 seconds; and the
check-in, so a job stopped while it's worked on is found out between
steps. The mailbox and the schedule are already running, started by
Claude; the schedule's clock starts once `agy` is waiting, and runs about
22 minutes: jobs at 1, 8, 12 and 22 minutes, the one at 12 slower, stopped
45 seconds after it's taken.

Open `agy` fresh in this project (`cd ~/project`, then `agy`), and paste
the block below. Let it run `bun` commands without asking each time.

---

You're helping test a mailbox of jobs for this project. The mailbox and a
schedule of jobs are already running: don't start anything in the
background yourself.

1. Run `bun spikes/mailbox/agent.ts wait --for 900`. It waits up to 15
   minutes, answering the moment a job lands. Your harness will move it
   into the background and wake you when it ends: set its notification
   timeout to cover it, 960 seconds, so it isn't cut off.

2. Each answer is one line of JSON: do what its "next" says, every time,
   waiting again included, keeping `--for 900`. A job's notes say what to
   do in this project; do it properly. While you work on one, check in
   between steps as the "next" says, with
   `bun spikes/mailbox/agent.ts check <job> "<what you're doing>"`; if a
   check-in says the job's stopped, stop it, leave nothing half done, and
   wait again.

3. Keep going till the schedule's done: once
   `spikes/mailbox/.state/driver-long.log` has a line saying "finished",
   stop waiting, whether or not a wait's still open.

4. Run `bun spikes/mailbox/report.ts`, and tell me:
   - how many turns you spent waiting, and how that compares with waiting
     50 seconds at a time;
   - whether any wait was cut off before it answered, or failed, and how;
   - whether a check-in told you the slow job was stopped, and when;
   - whether taking an offered job first, with a check-in of "starting",
     was clear;
   - anything in the loop that was unclear, or you had to guess at;
   - anything your harness made awkward.
