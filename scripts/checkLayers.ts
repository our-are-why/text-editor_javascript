import { Glob } from "bun"
import {
  join,
  relative,
  resolve,
  dirname
} from "node:path"

// what each layer of source/ may import, as the Parts rule has it: the core,
// core/, only itself; each kind of actor's adapter, ui/ and agent/, the core
// and itself, never the other's; the program, which puts them together, the
// core and the agent's, the UI's page built by its path, never imported; and
// from another part only its index.ts, its public API. Run by bun run check,
// failing on the first layer broken, saying each

interface _Allowed_Layers_ {
  [layer: string]: Array<string>
}

interface _Place_Source_ {
  layer: string
  part: string
}

interface _Api___placeOf_ {
  path: string
}

function placeOf({
  path
}: _Api___placeOf_): _Place_Source_ | undefined {
  const segments = path.split("/")
  const layer = segments[1]
  if (segments[0] !== "source" || layer === undefined || segments.length < 3) return undefined
  if (layer === "program") {
    return {
      layer,
      part: "source/program"
    }
  }
  return segments.length < 4
    ? undefined
    : {
      layer,
      part: segments.slice(0, 3).join("/")
    }
}

const dirRoot = join(import.meta.dir, "..")
const layersAllowed: _Allowed_Layers_ = {
  core: ["core"],
  agent: [
    "core",
    "agent"
  ],
  ui: [
    "core",
    "ui"
  ],
  program: [
    "core",
    "agent",
    "program"
  ]
}
const regexpImport = /(\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.\.?\/[^"']+)\2/g
const broken: Array<string> = []
for await (const path of new Glob("source/**/*.{ts,tsx}").scan(dirRoot)) {
  const place = placeOf({
    path
  })
  if (place === undefined) continue
  const text = await Bun.file(join(dirRoot, path)).text()
  for (const match of text.matchAll(regexpImport)) {
    const target = relative(
      dirRoot,
      resolve(
        dirRoot,
        dirname(path),
        match[3] ?? ""
      )
    )
    const place_Target = placeOf({
      path: target
    })
    if (place_Target === undefined || place_Target.part === place.part) continue
    if (!(layersAllowed[place.layer] ?? []).includes(place_Target.layer)) broken.push(`${path}: ${place.layer}/ imports ${place_Target.layer}/, ${target}`)
    else if (target !== `${place_Target.part}/index.ts`) broken.push(`${path}: imports inside ${place_Target.part}/, ${target}, not its index.ts`)
  }
}
if (broken.length > 0) {
  console.error(`The layers of source/ are broken:\n${broken.map((line) => `  ${line}`).join("\n")}`)
  process.exit(1)
}
