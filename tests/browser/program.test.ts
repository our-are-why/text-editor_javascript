import {
  expect,
  test
} from "bun:test"
import {
  mkdtemp,
  rm
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { chromium } from "playwright-core"
import { madeOf__Demo } from "../../scripts/demo.ts"
import {
  filesOf__Project,
  openedOf__Program,
  addressesOf__Program,
  DIR_DOCTOR,
  NAME_ENDPOINT,
  type _Endpoint_Program_
} from "../../source/program/index.ts"

// doctor open on a fresh demo of the retry sample, its page opened in
// Chromium as you'd open it, and used as you'd use it: the file it shows
// first, typed into in manual, which moves the file on disk; a request on
// the file, which drafts a task, the editor in it; another of the project's
// files opened from the picker; and the page reloaded, which comes back as
// it was left, the shell holding it. The socket shut to a caller without
// the page's token, the page served under a proxy's prefix as at its root,
// and the endpoint's file gone once doctor's stopped

const dir_Demos = await mkdtemp(join(tmpdir(), "doctor-test-"))
const dir_Demo = await madeOf__Demo({
  name_Sample: "retry",
  dir_Demos
})
const files = await filesOf__Project({
  dir_Project: dir_Demo
})
const program = await openedOf__Program({
  dir_Project: dir_Demo,
  files,
  path_First: "README.md",
  port: 0
})
const addresses = addressesOf__Program({
  program,
  uri_Proxy: undefined
})
const endpoint: _Endpoint_Program_ = await Bun.file(join(dir_Demo, DIR_DOCTOR, NAME_ENDPOINT)).json()
const status_Unasked = (await fetch(`${addresses.address}socket`)).status
const status_Prefixed = (await fetch(`${addresses.address}proxy/4004/start.js`)).status

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium" })
const page = await browser.newPage({
  viewport: {
    width: 1280,
    height: 800
  }
})
const errors: Array<string> = []
page.on("pageerror", (error) => errors.push(error.message))
const settled = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const shownOf = () => page.evaluate(() => ({
  task: document.querySelector(".name_Task_htmlView")?.textContent ?? null,
  document: document.querySelector(".name_Document_htmlView")?.textContent ?? null,
  first: document.querySelector(".text_Line_htmlView, .line_htmlView")?.textContent ?? null
}))
await page.goto(addresses.page)
await page.waitForSelector(".htmlView_editor .line_htmlView")
const shown_Opened = await shownOf()
await page.click(".line_htmlView")
await page.keyboard.press("Control+Home")
await page.keyboard.type("Hi. ")
await page.waitForTimeout(500)
const text_Typed = await Bun.file(join(dir_Demo, "README.md")).text()
await page.hover(".trigger_Document_htmlView")
await page.waitForTimeout(300)
await page.locator(".card_Document_htmlView [data-ask=\"DOCUMENT\"]").click()
await settled()
await page.keyboard.type("Say what it retries.")
await page.keyboard.press("Control+Enter")
await page.mouse.move(5, 5)
await settled()
await page.waitForTimeout(300)
const shown_Requested = await shownOf()
await page.hover(".trigger_Picker_htmlView")
await page.waitForTimeout(400)
const choices_Picker = await page.evaluate(() => [...document.querySelectorAll(".choice_Picker_htmlView")].map((choice) => choice.getAttribute("data-path")))
await page.click(".choice_Picker_htmlView[data-path=\"retry.js\"]")
await page.mouse.move(5, 5)
await page.waitForTimeout(500)
const shown_Picked = await shownOf()
await page.reload()
await page.waitForSelector(".htmlView_editor .line_htmlView")
const shown_Reloaded = await shownOf()
await browser.close()
await program.stop()
const isEndpoint_Stopped = await Bun.file(join(dir_Demo, DIR_DOCTOR, NAME_ENDPOINT)).exists()
const text_Ignore = await Bun.file(join(dir_Demo, DIR_DOCTOR, ".gitignore")).text()
await rm(
  dir_Demos,
  {
    recursive: true
  }
)

test("doctor open writes its endpoint to .doctor/, its address, the page's token and the agent's, kept out of git", () => {
  expect(endpoint).toEqual({
    address: addresses.address,
    token_Page: program.token_Page,
    token_Agent: program.token_Agent,
    pid: process.pid
  })
  expect(text_Ignore).toBe(`${NAME_ENDPOINT}\n*.writing\n`)
})

test("the socket's shut to a caller without the page's token, and the page's served under a proxy's prefix as at its root", () => {
  expect([status_Unasked, status_Prefixed]).toEqual([403, 200])
})

test("the page opens on the file it's told, in manual, nothing thrown throughout", () => {
  expect(shown_Opened.document).toBe("README.md")
  expect(shown_Opened.task).toBeNull()
  expect(errors).toEqual([])
})

test("typed into in manual, the file moves, on disk", () => {
  expect(text_Typed.startsWith("Hi. # retry\n")).toBe(true)
})

test("a request on the file, in manual, drafts a task named for it, the editor in it", () => {
  expect(shown_Requested.task).toBe("Say what it retries.")
})

test("the picker lists the project's text files, and one pressed is opened, the editor still in its task", () => {
  expect(choices_Picker).toEqual(["README.md", "package.json", "retry.js"])
  expect([shown_Picked.document, shown_Picked.task]).toEqual(["retry.js", "Say what it retries."])
})

test("reloaded, the page comes back as it was left, the shell holding it", () => {
  expect(shown_Reloaded).toEqual(shown_Picked)
})

test("stopped, doctor takes its endpoint away", () => {
  expect(isEndpoint_Stopped).toBe(false)
})
