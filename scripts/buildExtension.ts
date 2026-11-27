import { rm } from "node:fs/promises"
import { join } from "node:path"

export {
  builtOf__Extension,
  type _Manifest_Extension_,
  type _Entry_Zip_,
  manifestOf__Package,
  type _Api___manifestOf__Package_,
  CONTENTTYPES_VSIX,
  zipOf__Entries,
  type _Api___zipOf__Entries_,
  DIR_EXTENSION
}

// doctor's VS Code adapter, vscode/, built into build/vscode/, its code
// bundled for VS Code's Node host, where its program is baked in, this
// repository's source/program/doctor.ts, so it can open doctor on a folder;
// and that folder packed as a .vsix for code-server to install; its path
// returned
async function builtOf__Extension(): Promise<string> {
  const dir_Root = join(import.meta.dir, "..")
  const manifest: _Manifest_Extension_ = await Bun.file(join(dir_Root, "vscode", "manifest.json")).json()
  await rm(
    DIR_EXTENSION,
    {
      recursive: true,
      force: true
    }
  )
  const built = await Bun.build({
    entrypoints: [join(dir_Root, "vscode", "extension.ts")],
    target: "node",
    format: "cjs",
    outdir: DIR_EXTENSION,
    naming: "extension.js",
    external: ["vscode"],
    define: {
      PATH_PROGRAM__DOCTOR: JSON.stringify(join(dir_Root, "source", "program", "doctor.ts"))
    }
  })
  if (!built.success) throw new AggregateError(built.logs, "doctor's VS Code adapter didn't build")
  const text_Manifest = `${JSON.stringify(manifest, null, 2)}\n`
  await Bun.write(
    join(DIR_EXTENSION, "package.json"),
    text_Manifest
  )
  const encoder = new TextEncoder()
  const path_Vsix = join(dir_Root, "build", `${manifest.name}-${manifest.version}.vsix`)
  await Bun.write(
    path_Vsix,
    zipOf__Entries({
      entries: [
        {
          name: "[Content_Types].xml",
          bytes: encoder.encode(CONTENTTYPES_VSIX)
        },
        {
          name: "extension.vsixmanifest",
          bytes: encoder.encode(manifestOf__Package({
            manifest
          }))
        },
        {
          name: "extension/package.json",
          bytes: encoder.encode(text_Manifest)
        },
        {
          name: "extension/extension.js",
          bytes: await Bun.file(join(DIR_EXTENSION, "extension.js")).bytes()
        }
      ]
    })
  )
  return path_Vsix
}

interface _Manifest_Extension_ {
  name: string
  publisher: string
  displayName: string
  description: string
  version: string
  engines: _Engines_Manifest_
}

interface _Engines_Manifest_ {
  vscode: string
}

interface _Entry_Zip_ {
  name: string
  bytes: Uint8Array<ArrayBuffer>
}

interface _Api___manifestOf__Package_ {
  manifest: _Manifest_Extension_
}

// what a .vsix says of the extension it holds, for VS Code to install it
function manifestOf__Package({
  manifest
}: _Api___manifestOf__Package_): string {
  const escaped = (text: string) => text.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`)
  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">`,
    "  <Metadata>",
    `    <Identity Language="en-US" Id="${escaped(manifest.name)}" Version="${escaped(manifest.version)}" Publisher="${escaped(manifest.publisher)}" />`,
    `    <DisplayName>${escaped(manifest.displayName)}</DisplayName>`,
    `    <Description xml:space="preserve">${escaped(manifest.description)}</Description>`,
    "    <Categories>Other</Categories>",
    `    <Properties><Property Id="Microsoft.VisualStudio.Code.Engine" Value="${escaped(manifest.engines.vscode)}" /></Properties>`,
    "  </Metadata>",
    `  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code" /></Installation>`,
    "  <Dependencies />",
    `  <Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" /></Assets>`,
    "</PackageManifest>"
  ].join("\n")
}

const CONTENTTYPES_VSIX = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension=".json" ContentType="application/json"/><Default Extension=".js" ContentType="application/javascript"/><Default Extension=".vsixmanifest" ContentType="text/xml"/></Types>`

interface _Api___zipOf__Entries_ {
  entries: Array<_Entry_Zip_>
}

// a zip of entries stored, not compressed, all a .vsix needs
function zipOf__Entries({
  entries
}: _Api___zipOf__Entries_): Blob {
  const encoder = new TextEncoder()
  const parts_File: Array<Uint8Array<ArrayBuffer>> = []
  const parts_Directory: Array<Uint8Array<ArrayBuffer>> = []
  let offset = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const crc = Bun.hash.crc32(entry.bytes)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, entry.bytes.length, true)
    local.setUint32(22, entry.bytes.length, true)
    local.setUint16(26, name.length, true)
    parts_File.push(new Uint8Array(local.buffer), name, entry.bytes)
    const record = new DataView(new ArrayBuffer(46))
    record.setUint32(0, 0x02014b50, true)
    record.setUint16(4, 20, true)
    record.setUint16(6, 20, true)
    record.setUint32(16, crc, true)
    record.setUint32(20, entry.bytes.length, true)
    record.setUint32(24, entry.bytes.length, true)
    record.setUint16(28, name.length, true)
    record.setUint32(42, offset, true)
    parts_Directory.push(new Uint8Array(record.buffer), name)
    offset += 30 + name.length + entry.bytes.length
  }
  const size_Directory = parts_Directory.reduce((sum, part) => sum + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, entries.length, true)
  end.setUint16(10, entries.length, true)
  end.setUint32(12, size_Directory, true)
  end.setUint32(16, offset, true)
  return new Blob([
    ...parts_File,
    ...parts_Directory,
    new Uint8Array(end.buffer)
  ])
}

const DIR_EXTENSION = join(import.meta.dir, "..", "build", "vscode")

// bun scripts/buildExtension.ts: the .vsix built, its path printed
if (import.meta.main) console.log(await builtOf__Extension())
