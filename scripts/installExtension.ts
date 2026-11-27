import { builtOf__Extension } from "./buildExtension.ts"

// bun run vscode: doctor's VS Code adapter built and installed into the
// code-server running here, which installs it into itself, its window then
// reloaded, Developer: Reload Window, to run it
const path_Vsix = await builtOf__Extension()
const installed = Bun.spawnSync(
  [
    "code-server",
    "--install-extension",
    path_Vsix,
    "--force"
  ],
  {
    stdout: "inherit",
    stderr: "inherit"
  }
)
if (installed.exitCode !== 0) process.exit(installed.exitCode)
console.log("Installed: reload the window, Developer: Reload Window, then a doctor project's files open in doctor, and doctor: Open This File opens one anywhere.")
