import { homedir } from "node:os"
import {
  basename,
  dirname,
  join
} from "node:path"
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile
} from "node:fs/promises"
import { constants } from "node:fs"
import { createHash } from "node:crypto"
import { flatOf__Text } from "../core/documents/index.ts"
import type { _Given_Job_ } from "../core/shell/index.ts"

export {
  dirOf__Copies,
  type _Api___dirOf__Copies_,
  isGit__Project,
  type _Api___isGit__Project_,
  copiedOf__Job,
  type _Api___copiedOf__Job_,
  entriesOf__Status,
  type _Api___entriesOf__Status_,
  type _Entry_Status_,
  isThere,
  type _Api___isThere_,
  readOf__Copy,
  type _Api___readOf__Copy_,
  type _Read_Copy_,
  type _Changed_Copy_,
  type _Unplaced_Copy_,
  isOwn__Path_Copy,
  type _Api___isOwn__Path_Copy_,
  removedOf__Copy,
  type _Api___removedOf__Copy_,
  NAME_DEPENDENCIES
}

interface _Api___dirOf__Copies_ {
  dir_Project: string
}

function dirOf__Copies({
  dir_Project
}: _Api___dirOf__Copies_): string {
  const dir_Cache = process.env["XDG_CACHE_HOME"] || join(homedir(), ".cache")
  const hash = createHash("sha256").update(dir_Project).digest("hex").slice(0, 8)
  return join(dir_Cache, "doctor", `${basename(dir_Project)}-${hash}`)
}

interface _Api___isGit__Project_ {
  dir_Project: string
}

async function isGit__Project({
  dir_Project
}: _Api___isGit__Project_): Promise<boolean> {
  const top = await Bun.$`git -C ${dir_Project} rev-parse --show-toplevel`.quiet().nothrow()
  const head = await Bun.$`git -C ${dir_Project} rev-parse --verify -q HEAD`.quiet().nothrow()
  return top.exitCode === 0 && head.exitCode === 0 && await realpath(top.text().trim()) === await realpath(dir_Project)
}

interface _Api___copiedOf__Job_ {
  dir_Project: string
  dir_Copy: string
  givens: Array<_Given_Job_>
  id_Job: string
  text_Endpoint: string
}

async function copiedOf__Job({
  dir_Project,
  dir_Copy,
  givens,
  id_Job,
  text_Endpoint
}: _Api___copiedOf__Job_): Promise<void> {
  const sha = (await Bun.$`git -C ${dir_Project} rev-parse HEAD`.quiet().text()).trim()
  if (await isThere({
    path: join(dir_Copy, ".git")
  })) {
    await Bun.$`git -C ${dir_Copy} checkout --detach --force -q ${sha}`.quiet()
    await Bun.$`git -C ${dir_Copy} clean -fdq`.quiet()
  } else {
    await rm(
      dir_Copy,
      {
        recursive: true,
        force: true
      }
    )
    await mkdir(
      dirname(dir_Copy),
      {
        recursive: true
      }
    )
    await Bun.$`git -C ${dir_Project} worktree prune`.quiet()
    await Bun.$`git -C ${dir_Project} worktree add --detach --force ${dir_Copy} ${sha}`.quiet()
  }
  const entries = entriesOf__Status({
    bytes: (await Bun.$`git -C ${dir_Project} status --porcelain=v1 -z --untracked-files=all`.quiet()).stdout
  })
  for (const entry of entries) {
    if (isOwn__Path_Copy({
      path: entry.path
    })) continue
    const path_Copy = join(dir_Copy, entry.path)
    if (entry.isGone) {
      await rm(
        path_Copy,
        {
          force: true
        }
      )
      continue
    }
    await mkdir(
      dirname(path_Copy),
      {
        recursive: true
      }
    )
    await copyFile(
      join(dir_Project, entry.path),
      path_Copy,
      constants.COPYFILE_FICLONE
    )
  }
  for (const given of givens) {
    const path_Copy = join(dir_Copy, given.path)
    await mkdir(
      dirname(path_Copy),
      {
        recursive: true
      }
    )
    await writeFile(
      path_Copy,
      flatOf__Text(given.text)
    )
  }
  if (await isThere({
    path: join(dir_Project, NAME_DEPENDENCIES)
  }) && !await isThere({
    path: join(dir_Copy, NAME_DEPENDENCIES)
  })) {
    await symlink(
      join(dir_Project, NAME_DEPENDENCIES),
      join(dir_Copy, NAME_DEPENDENCIES),
      "dir"
    )
  }
  await mkdir(
    join(dir_Copy, ".doctor"),
    {
      recursive: true
    }
  )
  if (!await isThere({
    path: join(dir_Copy, ".doctor", ".gitignore")
  })) {
    await writeFile(
      join(dir_Copy, ".doctor", ".gitignore"),
      "*\n"
    )
  }
  await writeFile(
    join(dir_Copy, ".doctor", "endpoint.json"),
    text_Endpoint
  )
  await Bun.$`git -C ${dir_Copy} add -A -- . ${`:(exclude)${NAME_DEPENDENCIES}`}`.quiet()
  await Bun.$`git -C ${dir_Copy} -c user.name=doctor -c user.email=doctor@localhost -c commit.gpgsign=false commit -q --no-verify --allow-empty -m ${`doctor: job ${id_Job}, as given`}`.quiet()
}

interface _Api___entriesOf__Status_ {
  bytes: Buffer
}

interface _Entry_Status_ {
  path: string
  isGone: boolean
  isNew: boolean
}

function entriesOf__Status({
  bytes
}: _Api___entriesOf__Status_): Array<_Entry_Status_> {
  const fields = bytes.toString("utf8").split("\0").filter((field) => field !== "")
  const entries: Array<_Entry_Status_> = []
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index] ?? ""
    const code = field.slice(0, 2)
    const path = field.slice(3)
    const isRenamed = code.includes("R") || code.includes("C")
    entries.push({
      path,
      isGone: code.includes("D"),
      isNew: code === "??" || code.includes("A") || isRenamed
    })
    if (isRenamed) {
      index += 1
      entries.push({
        path: fields[index] ?? "",
        isGone: true,
        isNew: false
      })
    }
  }
  return entries
}

interface _Api___isThere_ {
  path: string
}

async function isThere({
  path
}: _Api___isThere_): Promise<boolean> {
  return lstat(path).then(() => true, () => false)
}

interface _Api___readOf__Copy_ {
  dir_Copy: string
}

interface _Read_Copy_ {
  changeds: Array<_Changed_Copy_>
  unplaceds: Array<_Unplaced_Copy_>
}

interface _Changed_Copy_ {
  path: string
  text_Given: string
  text_Copy: string
}

interface _Unplaced_Copy_ {
  path: string
  why: string
}

async function readOf__Copy({
  dir_Copy
}: _Api___readOf__Copy_): Promise<_Read_Copy_> {
  const entries = entriesOf__Status({
    bytes: (await Bun.$`git -C ${dir_Copy} status --porcelain=v1 -z --untracked-files=all`.quiet()).stdout
  }).filter((entry) => !isOwn__Path_Copy({
    path: entry.path
  }))
  const changeds: Array<_Changed_Copy_> = []
  const unplaceds: Array<_Unplaced_Copy_> = []
  for (const entry of entries) {
    if (entry.isGone || entry.isNew) {
      unplaceds.push({
        path: entry.path,
        why: entry.isGone ? "was taken away in your copy: doctor lands changes only to the files it has, for now" : "was made in your copy: doctor lands changes only to the files it has, for now"
      })
      continue
    }
    const bytes = await readFile(join(dir_Copy, entry.path))
    if (bytes.subarray(0, 8000).includes(0)) {
      unplaceds.push({
        path: entry.path,
        why: "isn't text: doctor lands changes only to text files"
      })
      continue
    }
    changeds.push({
      path: entry.path,
      text_Given: (await Bun.$`git -C ${dir_Copy} show ${`HEAD:${entry.path}`}`.quiet()).text(),
      text_Copy: bytes.toString("utf8")
    })
  }
  return {
    changeds,
    unplaceds
  }
}

interface _Api___isOwn__Path_Copy_ {
  path: string
}

function isOwn__Path_Copy({
  path
}: _Api___isOwn__Path_Copy_): boolean {
  return path === NAME_DEPENDENCIES || path.startsWith(`${NAME_DEPENDENCIES}/`) || path.startsWith(".doctor/")
}

interface _Api___removedOf__Copy_ {
  dir_Project: string
  dir_Copy: string
}

async function removedOf__Copy({
  dir_Project,
  dir_Copy
}: _Api___removedOf__Copy_): Promise<void> {
  await Bun.$`git -C ${dir_Project} worktree remove --force ${dir_Copy}`.quiet().nothrow()
  await rm(
    dir_Copy,
    {
      recursive: true,
      force: true
    }
  )
  await Bun.$`git -C ${dir_Project} worktree prune`.quiet().nothrow()
}

const NAME_DEPENDENCIES = "node_modules"
