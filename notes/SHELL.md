# the shell

The shell, the last of the parts behind the task UI, begun early as the
agent part needs it: the program that opens a project, puts the parts
together, keeps the project's `.doctor/`, serves the editor, and answers
agents. Begun 2026-11-26, when the agent part's endpoint was found to need
a real project and a real host beside it, not the playground, whose host
fakes everything inside a page. A draft of what it is and what's to
decide, before its core's built, as `TASKS.md` and `AGENT.md` were.

It starts from `TASKS.md`, whose **who holds what** gives it its job:
keeping each editor's document and mode, across reloads too; taking each
editor's commands to the part they're for; telling each open editor what it
should now show; and passing an edit made in one editor to the others
showing the same version, under **several editors**. And from `AGENT.md`,
under **what's kept, and where**, which says what's the shell's: the
project's folder, the truth of everything a task's, and the agent server.

## what's settled already

- **a project's a folder,** its files the documents, and **`.doctor/`** at
  its root, where the system keeps what it keeps, `TASKS.md`'s **where
  it's kept**: one file per task, the documents' copies by hash, each
  document's current version; and, from `AGENT.md`, the endpoint's address
  and tokens, and the working copies, wherever they turn out to live.
- **the parts it holds:** the tasks part, the documents part and the agent
  part, each its class holding its model, the shell the one place they're
  put together; never in an editor, which is told what to show.
- **agents reach it** by the `doctor` command, a thin face over a local HTTP
  endpoint the shell serves, as `AGENT.md` decided, its address and an
  agent's token in `.doctor/`.
- **the playground stays** a gallery of the editor and the board, its hosts
  faking what's behind them; end to end is a sample project.

## samples, and demos

`samples/<name>/` holds small real projects, the first `samples/retry/`, the
module and README the playground's examples draw. `bun run demo <name>`
copies one to a folder of its own in the system's temporary folder, outside
this repository, so an agent opened there works in a project of its own,
not inside doctor's, its rules and its git; makes it a git repository with
one commit; and opens doctor on it, `doctor open`, its page's address
printed, and, run in code-server's terminal, the address through its
proxy, as `VSCODE_PROXY_URI` gives it. A demo's thrown away as the
folder's cleared, and made again whenever wanted, as the
prototype's `samples/` were copied into a `playground/` to play in.

## VS Code, later

Noted 2026-11-26: a thin adapter, later, so doctor's used in VS Code, the
web's included, as code-server serves it, on the sample projects and
elsewhere: doing only what VS Code needs, never altering the core, a hook
in it only if one can't be avoided. The prototype found, in its
`notes/experiments/vscode-extension.md`, that under code-server the
extension host runs on the server, in Node, so it can start a process and
open a socket, and that a webview reaches a server's port through
code-server's proxy, `asExternalUri`, a fetch and a WebSocket both. So the
adapter: starting `doctor open` on the workspace's folder, or finding one
running by `.doctor/`; showing the shell's page in a webview, loaded
through the proxy, the page and its socket as in a browser's tab; and a
command or two, Open in doctor on a file; agents in VS Code's terminal
finding the endpoint by `.doctor/` as in any other. What it asks of the
shell from the start, none of it the adapter's alone: **the page served
under a path's prefix,** a proxy's `/proxy/4004/`, its assets and its
socket reached by relative addresses; **its token given it,** in its
address, never assumed of its origin; **the shell started on a folder and a
free port,** saying where it is in `.doctor/`; **its colours a host's,**
the editor's `--view-*` variables, VS Code's theme mapped onto them; and,
the one hook likely, **a file opened from outside,** which the page's own
picker needs anyway.

## what's to decide

1. **What runs, and where.** **Decided 2026-11-26,** as leaned, VS Code's
   adapter asking no more of it than starting it on a folder and a free
   port, and finding it by `.doctor/`: one Bun program, `doctor`, run in a
   project's folder, `doctor open`, holding the three parts, serving the
   editor's page and the agent endpoint on 127.0.0.1, and writing
   `.doctor/`'s address and tokens as it starts; the same command, given
   `wait`, `take`, `check`, `done`, an agent's face over the endpoint.
2. **How the page talks to it.** **Decided 2026-11-26,** as leaned, the
   socket's address relative and the page's token given it in its own, so a
   tab and a webview behind code-server's proxy are alike: a WebSocket the
   page opens when it loads, with the page's own token: up it, the editor's
   and the board's commands, as hosts are asked today, `SWITCH`, `START`,
   an edit made; down it, what each editor should now show, its document,
   its mode, the tasks, as the playground's host tells its editor now. The
   editor and the board unchanged: what's built against a host's API is
   given a host that's the page's end of the socket.
3. **Where the host's work lives.** **Decided 2026-11-26,** as leaned, and
   the first thing built: one implementation, run by the program and by the
   playground's host alike, its browser tests testing it still. The
   playground's host, `playground/host.ts`, does a host's real work,
   carrying every open task's head across an edit, a round landing on
   what's moved since, applying a task, settling a conflict, starting at
   any scope, beside what it fakes, the agent above all. That real work's
   moved into the shell part, plain functions over the parts, no Bun, no
   DOM, so the shell's program runs it and the playground's host does too,
   in the page, with its fake agent, nothing written twice.
4. **What's kept across a restart.** `.doctor/`'s tasks and copies,
   `TASKS.md` says; but when, and in what form. *Leaning:* not in the core;
   it starts from the folder's files and nothing else, and keeping follows
   once the core's working, so the core's never shaped round a format
   chosen early. Jobs surviving a restart are `AGENT.md`'s later want.
5. **Files changed from outside.** An editor of another kind, git, a
   formatter: the documents part reads a file changed outside and makes the
   difference edits. *Leaning:* the shell watching the project's files and
   reading what changes; not in the core.
6. **Several editors, and pages.** One page, one editor, to begin with;
   `TASKS.md`'s several editors after.
7. **Which files.** **Decided 2026-11-26,** as leaned, and built with the
   core's second step: a project's files the documents part opens as
   they're asked for, the editor's picker listing the folder's text files,
   git's own and those it doesn't ignore, never `.doctor/`'s, nor one with
   a NUL in its first 8,000 bytes; listed once, as doctor's opened.

## the core, in order

What's built first, each a step that works on its own:

1. the shell part's plain work, moved from the playground's host, the
   playground's host running it, its tests as they are. **Built
   2026-11-26:** `_Shell_`, holding the tasks and documents parts and the
   editor's session, its mode, the words each request was sent on, what's
   only the editor's of each task's proposals, and each round's base;
   taking each edit, `edited`, and what the editor and the board ask,
   `asked` and `askedBoard`, by maps of their kinds; telling its observers
   what the editor and the board should now show, each round it starts,
   what it set going written on which version, and each stop, what it put
   back; and taking a round's work back, `landed`, carried across every
   edit since, a round stopped first landing nothing. What it tells the
   editor and the board, and the actions it offers on a proposal, in
   `Projection_Shell.ts`. The playground's host left with its seed, its
   stand-in for the agent, answering a round with the changes it was
   given, its log and the board's showing. It reads the editor's and the
   board's types through their indexes, so its `tsconfig.json` has the
   DOM's types, as the board's has, though it uses nothing of the DOM;
   and a round's what the agent part's job becomes, at step 3;
2. `doctor open`: the program, the parts, `.doctor/`, the page served, its
   socket, an editor on a sample's file, editing it, switching tasks.
   **Built 2026-11-26:** `source/program/`, Bun's, `doctor open [folder]
   [--file <path>] [--port <port>]`, `bun run doctor`, on 127.0.0.1 and a
   free port unless one's given, the file shown first the one asked for,
   else the README, else the first; the shell holding the tasks part,
   empty, and the documents part, each file opened as the editor asks for
   it, the shell asking its host to read it, as it reads nothing itself;
   the page built by Bun as doctor opens and served by relative addresses,
   at its root or under a proxy's prefix, alike; its socket shut to a
   caller without the page's token, given the page in its own address;
   `.doctor/endpoint.json`, the address, the page's token and the pid,
   with a `.gitignore` keeping it out of git, taken away when doctor's
   stopped; and what moves a file, an edit in manual or a task applied,
   written to it at once, through a file in `.doctor/` renamed over it.
   `source/page/`, the DOM's: the editor and the board, made from what
   the shell first shows, every edit and ask sent up, what's shown drawn,
   the editor keeping its own model, and its undo history, while the
   shell's yet to have every edit it sent, or when what's shown is the
   same; the board shown and hidden by the page; one page at a time,
   another taking over, and a reload coming back as it was left, the shell
   holding it. The messages between them in the shell part,
   `Message_Shell.ts`, an edit saying which file it was made in, so one
   crossing a file's opening is dropped. Tested by a demo opened in
   Chromium. Not yet: a file's language, every file drawn as plain text,
   as the syntax modules are the playground's; a file's line endings,
   written with `\n`; the frame ranges a host gives, which widen and join
   the frames the editor draws round the changes, every frame drawn as in
   the playground but none of them widened, as nothing keeps the ranges
   till frames are kept with the task, and given the editor only as it's
   made, not as it's updated, which a page opening file after file will
   need; and the shell's changes to the text while the page's own edits
   are on their way, which the page leaves till they've arrived;
3. the agent endpoint and the `doctor` command, Start queuing a job an
   agent in the demo takes. **Built 2026-11-27:** each round the shell
   starts queued as a job, `j-` and the round's number, carrying what it
   was started at; Stop cancelling every job it touches, the shell
   stopping whole rounds, each one's other requests staged again, as
   `AGENT.md` decided under 10; a task ended, its jobs cancelled. The
   protocol in the agent part, `Protocol_Agent.ts`, plain data: what each
   call answers and its next step, a check-in's and a hand back's by maps
   of the job's state; the endpoint in the program, at `/agent/`, the
   agent's token in `.doctor/endpoint.json` beside the page's: a wait
   held as long as it's asked, 50 seconds unless it says, up to an hour,
   answered the moment a job it may take is queued, never given one once
   its caller's gone, and answered closed as doctor stops; an offer let
   go after a minute untaken, queued again in its place; a job offered
   with its brief, `briefOf__Job`, the shell's: its task, its requests,
   the rest of the task's requests and its proposals to inform it, and the
   task's files. `doctor wait|take|check|done`, the same command as
   `doctor open`, finding the endpoint by `.doctor/` up from where it's
   run; its answers saying the command as it can be run there, `doctor`
   on the path, else `bun` and its file. Handed back, a job's requests
   addressed with the agent's note, nothing changed, as a job's asked to
   answer in words and change no file till working copies come, doctor
   writing its own text over a file changed under it. Tested by the
   command run in a demo against doctor held in the test. Not yet: the
   note drawn in the editor, the host's API carrying none; and the editor
   telling a job queued from one being worked on, or gone quiet, step 5's
   of `AGENT.md`'s order;
4. working copies, the diff and the checker, an agent's work landing as
   proposals;
5. tests spinning up a demo, as the browser tests open the playground now.

## open

Under **what's to decide**, 1 to 3 decided 2026-11-26; 4 to 7 left as they
lean, none of them in the core, each walked through as it's come to.
