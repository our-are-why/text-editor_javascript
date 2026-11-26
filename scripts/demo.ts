import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export {
  madeOf__Demo,
  type _Api___madeOf__Demo_
}

interface _Api___madeOf__Demo_ {
  name_Sample: string
  dir_Demos: string
}

// a sample project made into a demo: a fresh copy of samples/<name>/, in a
// folder of its own outside this repository, so an agent opened in it works
// in a project of its own, not inside doctor's, its rules and its git; made
// a git repository with one commit, as a real project would be; its folder
// returned
async function madeOf__Demo({
  name_Sample,
  dir_Demos
}: _Api___madeOf__Demo_): Promise<string> {
  const dir_Sample = join(import.meta.dir, "..", "samples", name_Sample)
  if (!existsSync(dir_Sample)) throw new Error(`there's no sample ${name_Sample}: ${readdirSync(join(import.meta.dir, "..", "samples")).join(", ")}`)
  mkdirSync(dir_Demos, {
    recursive: true
  })
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*$/, "").replace("T", "-")
  const dir_Demo = join(dir_Demos, `${name_Sample}-${stamp}`)
  cpSync(dir_Sample, dir_Demo, {
    recursive: true
  })
  await Bun.$`git init --quiet`.cwd(dir_Demo)
  await Bun.$`git add --all`.cwd(dir_Demo)
  await Bun.$`git -c user.name=doctor -c user.email=demo@doctor.invalid commit --quiet --message ${`The ${name_Sample} sample, as a project`}`.cwd(dir_Demo)
  return dir_Demo
}

// bun run demo <sample>: a demo of it, in the system's temporary folder,
// gone as it's cleared
if (import.meta.main) {
  const name_Sample = process.argv[2]
  const names_Sample = readdirSync(join(import.meta.dir, "..", "samples"))
  if (name_Sample === undefined || !names_Sample.includes(name_Sample)) {
    console.log(`bun run demo <sample>, one of: ${names_Sample.join(", ")}`)
    process.exit(1)
  }
  const dir_Demo = await madeOf__Demo({
    name_Sample,
    dir_Demos: join(tmpdir(), "doctor-demos")
  })
  console.log(`The ${name_Sample} demo's at ${dir_Demo}`)
}
