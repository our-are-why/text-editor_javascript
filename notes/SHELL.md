# the shell

The shell, the last of the parts behind the task UI, begun early as the
agent part needs it: the program that opens a project, puts the parts
together, keeps the project's `.doctor/`, serves the editor, and answers
agents. Begun 2026-11-26, when the agent part's endpoint was found to need
a real project and a real host beside it, not the playground, whose host
fakes everything inside a page. A draft of what it is and what's to
decide, before its core's built, as `TASKS.md` and `AGENT.md` were.

It starts from `TASKS.md`'s **who holds what**, and from `AGENT.md`'s
**what's kept, and where**, which says what's the shell's: the project's
folder, the truth of everything a task's, and the agent server. **Doctor's
core is UI-agnostic,** decided 2026-11-27: the shell puts the parts
together in their own terms and knows nothing of any view, editor, board or
page; what each editor shows, its file and its mode, across reloads too,
and how the editor's and the board's asks become the core's commands, are
the UI's, the host part's, `source/host/`, each page keeping its own.

**In layers,** decided the same day: the core, the tasks part, the
documents part and the shell, what everyone works on, knowing nothing of
who, nor how they reach it; each kind of actor its adapter over the core
and its transport, a person's the host part, over the page's socket, an
agent's the agent part, over the agent's endpoint, the `doctor` command
its face; and the program putting them together, the core, both transports
and the project's folder, no part of the core. Whether a server's the
core's is told by reaching doctor another way, an MCP server, an agent
doctor runs itself, the playground's stand-in: what stays the same is the
core. So the jobs themselves are the core's, what a Start set going and
where it stands whoever does it, a person's UI showing it too, moved into
the shell the same day, one with its rounds; the agent part keeps how an
agent's answered, an offer and its lapse, a wait, the answers and their
next steps, and the brief it's given. The folders follow the layers since,
the same day: `source/core/`, `source/ui/` and `source/agent/`, each
holding its parts, and `source/program/`; the notes before then name the
parts' old folders, `source/tasks/` for `source/core/tasks/`,
`source/agent/` for `source/agent/protocol/`, and so on; `vscode/`, beside
`source/`, a deployment target, the program composed with what VS Code
needs.

## what's settled already

- **a project's a folder,** its files the documents, and **`.doctor/`** at
  its root, where the system keeps what it keeps, `TASKS.md`'s **where
  it's kept**: one file per task, the documents' copies by hash, each
  document's current version; and, from `AGENT.md`, the endpoint's address
  and tokens, and the working copies, wherever they turn out to live.
- **the parts it holds:** the tasks part, the documents part and the agent
  part, each its class holding its model, the shell the one place they're
  put together; never in a view, which keeps its own state and draws what
  the parts' state gives it.
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

## VS Code

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

**Built 2026-11-27,** asked for as the demo's to be driven from VS Code
too: `vscode/`, a host beside the playground, run in VS Code's Node
extension host, code-server's, altering nothing of the core, its tabs each
a page of its own. **doctor's VS Code's editor for a doctor project's
files,** a custom editor, `doctor.file`, the default in a folder with
`.doctor/`, by `workbench.editorAssociations`, and **breadcrumbs off**
there, `breadcrumbs.enabled`, both set for the workspace, a single
folder's `.vscode/settings.json`, as VS Code takes the association at no
narrower scope, neither set if the workspace has it already; so VS Code
opens doctor itself, from the Explorer, Quick Open, wherever, a file open
already only brought forward, and doctor's header the one bar under a tab.
Each tab its file's, as many open as you like, doctor's page framed in it
through `asExternalUri`, code-server's proxy, as in a browser's tab, each
its own editor, `file:` and its path, the page remembering its file and
mode under it, so it comes back after a reload as it was; a file doctor
doesn't list, binary, ignored or its own, reopened in VS Code's text
editor, as the program's `GET /page/files`, behind the page's token, lists
them; a file picked in doctor's editor opened in its tab, the page asking
its host, as `host=vscode` tells it to. Found the way there the same day:
one tab for the whole project, which read as a project's, not a file's;
the custom editor, which read as doctor nested in VS Code's file view, VS
Code's breadcrumbs over doctor's header; VS Code's status bar tried for
the task and the counts, the editor's header and footer left out by the
component map, a setting choosing, and dropped as awful, doctor's chrome
its own, and no setting for it; then tabs of doctor's own, webview panels,
a file opened in VS Code's text editor moved over to one, which flickered,
and opened a tab and closed it again even for a file open already, as VS
Code opens its own editor before any extension hears of it; so the custom
editor again, breadcrumbs off. **doctor: Open This File,** from the
palette, the Explorer's and a file's tab's menus, **Open in Text Editor,**
the way back to VS Code's for a file, **Open,** and **Stop.** doctor found
on a folder by `.doctor/endpoint.json`, if it answers, or started, `doctor
open`, apart from the window, so a reload loses nothing. None of it in a
folder you've not trusted, a new one's Restricted Mode, which turned the
adapter off till it said it works there in part, files opening in VS
Code's text editor, its commands saying to trust it first. Agents in VS
Code's terminals find doctor by `.doctor/`, as in any. `bun run vscode`
builds it, `scripts/buildExtension.ts`, the program's path baked in, packs
a `.vsix` into `build/`, and installs it into the code-server running
here, as the prototype's scripts did. Not yet: VS Code's theme's colours
on the page; the board in a tab of its own, each file's tab showing it
under its editor for now; the `doctor` command on the terminals' path.

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
   page opens when it loads, with the page's own token. **Revised
   2026-11-27,** the core knowing nothing of views: up it, the core's
   commands, in the parts' terms, made by the page's host from what the
   editor and the board ask, and a file to open; down it, the core's
   state, the tasks and the documents open, with the project's files and
   how many of that page's edits are in, each page working out what it
   shows. The editor and the board unchanged: what's built against a
   host's API is given one, `source/host/`, in the page.
3. **Where the host's work lives.** **Decided 2026-11-26,** as leaned, and
   the first thing built: one implementation, run by the program and by the
   playground's host alike, its browser tests testing it still. The
   playground's host, `playground/host.ts`, does a host's real work,
   carrying every open task's head across an edit, a round landing on
   what's moved since, applying a task, settling a conflict, starting at
   any scope, beside what it fakes, the agent above all. That real work's
   moved into the shell part, plain functions over the parts, no Bun, no
   DOM, so the shell's program runs it and the playground's host does too,
   in the page, with its fake agent, nothing written twice. **Revised
   2026-11-27,** as the core must know nothing of any view: the shell part
   keeps only the core's work, in the parts' terms; what's the UI's, the
   editor's and the board's asks made into commands, what they draw, each
   editor's file and mode, moved into the host part, `source/host/`, which
   the page and the playground's host both run, nothing written twice
   still.
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
   `TASKS.md`'s several editors after. **Settled 2026-11-27,** as VS Code's
   tabs asked, first by the shell holding each editor's file and mode, till
   the core was found to have to know nothing of views: the core holds no
   editor; each page keeps its own, through the host part, remembered
   across a reload by the page itself, under its editor's id, a tab's its
   file's, a browser's `page`; so several tabs, or pages, ask nothing of
   the core, each told its state; applying a task applies its head on every
   file. Not yet: the board's switch moving every editor, as `TASKS.md` has
   it, each page's moving its own; the board counting a task's editors,
   each page counting its own; one file in two pages, each taking the
   other's text as it changes, its undo history lost; and a job's round
   written on the one file it was started from.
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
   and a round's what the agent part's job becomes, at step 3. **Split
   2026-11-27,** the core UI-agnostic: the shell part the core's
   coordinator alone, taking commands in the parts' terms by a map of them,
   `HANDLERMAP__SHELL`, a file opened, an edit, a request, a draft, Start
   and Stop, a decision, a proposal dismissed, accepting, settling, ending,
   running again, the tasks part's own passed through, and telling its
   observers its state and each round it starts and each stop, never what a
   view shows, its `tsconfig.json` without the DOM; the editor's and the
   board's asks, what they draw and the actions offered on a proposal moved
   into the host part, `source/host/`, `_Host_`, one editor's and its
   board's, with the editor's file and mode, keeping the editor's model
   after its own edit, updating it only when what it shows has changed;
   the words a request's made on kept in the task, a quoted aim holding its
   selection, the selection the documents part's, as a place in a file is
   no view's; the playground's host running the core and a host in the
   page;
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
   written with `\n`; and the shell's changes to the text while the
   page's own edits are on their way, which the page leaves till they've
   arrived. The frame ranges a host gives, once kept by nothing, the task's
   frames since 2026-11-28, given the editor on every update;
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
   telling a job gone quiet, step 5's of `AGENT.md`'s order, a job queued
   told from one being worked on since, under its 13. **The jobs moved
   into the core 2026-11-27,** as
   the parts were found to be in layers: the shell's rounds its jobs, in
   `Jobs_Shell.ts`, queued, being worked on, with when taken, last heard
   of and the latest note, done or cancelled, one at a time within a task
   in the order they were made, at once across tasks, moved by a map,
   `HANDLERMAP__JOBS`, and in the core's state, so a person's UI can show
   them; an agent taking a job, checking in and handing back the core's
   commands, `TAKE`, `CHECK_IN` and `HAND_BACK`, the hand back what lands
   a job's work; a task no longer open its jobs cancelled by the core. The
   agent part left the agent's adapter, `_Agent_`, holding only the offers
   it's made, an offer lapsing a minute on, its job keeping its place, and
   answering each call by maps of where its job stands, the core's state,
   or offered; the brief, `Brief_Agent.ts`, moved from the shell's to it,
   as it's what an agent reads; the program's glue between rounds and jobs
   gone; the playground's stand-in taking each job from the core and
   handing it back, as an agent does, with no server;
4. working copies, the diff and the checker, an agent's work landing as
   proposals. **Begun 2026-11-28,** the first slice built, in `AGENT.md`
   under 3 and 4: working copies, a git worktree per task in the user's
   cache, made as a job's taken, the program's, `Copy_Program.ts`; the
   core's pipeline, `Copy_Shell.ts`, numbering an agent's changes,
   checking how it groups them and mapping them onto the file; the agent's
   adapter answering `changes`, `verify` and `done`; proposals, new and
   revised, landed for review; nesting as the editor draws it, files made
   or deleted, moves, frames and the preview, the same day, and git only,
   doctor opening only a git repository's root with a commit. Not yet: the
   text between two ideas;
5. tests spinning up a demo, as the browser tests open the playground now.

## open

Under **what's to decide**, 1 to 3 decided 2026-11-26; 4 to 7 left as they
lean, none of them in the core, each walked through as it's come to.
