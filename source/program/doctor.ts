import { resolve } from "node:path"
import { parseArgs } from "node:util"
import {
  filesOf__Project,
  pathFirstOf__Files,
  openedOf__Program,
  addressesOf__Program
} from "./index.ts"

const USAGE = "doctor open [folder] [--file <path>] [--port <port>]"

const {
  values,
  positionals
} = parseArgs({
  args: process.argv.slice(2),
  options: {
    file: {
      type: "string"
    },
    port: {
      type: "string"
    }
  },
  allowPositionals: true
})
const [
  command,
  folder
] = positionals
if (command !== "open") {
  console.log(USAGE)
  process.exit(1)
}
const dir_Project = resolve(folder ?? ".")
const files = await filesOf__Project({
  dir_Project
})
const path_Shown = values.file ?? pathFirstOf__Files({
  files
})
if (path_Shown === undefined) {
  console.log(`There's no text file in ${dir_Project} to open.`)
  process.exit(1)
}
const program = await openedOf__Program({
  dir_Project,
  files,
  path_Shown,
  port: Number(values.port ?? "0")
})
const addresses = addressesOf__Program({
  program,
  uri_Proxy: process.env["VSCODE_PROXY_URI"]
})
console.log(`doctor's open on ${dir_Project}, showing ${path_Shown}:`)
console.log(`  ${addresses.page}`)
if (addresses.page_Proxied !== undefined) console.log(`  through code-server: ${addresses.page_Proxied}`)
process.on(
  "SIGINT",
  () => {
    program.stop().then(() => process.exit(0))
  }
)
