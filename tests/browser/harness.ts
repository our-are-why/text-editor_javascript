import type { HTMLBundle } from "bun"
import { chromium, type Page } from "playwright-core"
import type { _Entry_Log_ } from "../../playground/example.ts"
import { servePlayground } from "../../scripts/servePlayground.ts"

export {
  type _Opened_Example_,
  openExample,
  type _Opened_Fixture_,
  openFixture
}

// Debian's Chromium, which .environment/Containerfile installs
const executablePath = "/usr/bin/chromium"

interface _Opened_Example_ {
  page: Page
  // what the example has reported so far, as the playground logs it
  logged: () => Promise<Array<_Entry_Log_>>
  close: () => Promise<void>
}

// opens one of the playground's examples in Chromium, as you'd open it to
// play with, from localhost, a secure origin, as the clipboard needs. What's
// sent through the page's keyboard and mouse is the browser's own input,
// trusted and with its default actions, which events a test dispatches
// itself don't have.
async function openExample(name: string): Promise<_Opened_Example_> {
  const server = servePlayground(0, "testing")
  const browser = await chromium.launch({ executablePath })
  const page = await browser.newPage()
  await page.goto(`http://localhost:${server.port}/?example=${encodeURIComponent(name)}`)
  return {
    page,
    logged: () => page.evaluate(() => window.logged),
    close: async () => {
      await browser.close()
      await server.stop(true)
    },
  }
}

interface _Opened_Fixture_ {
  page: Page
  close: () => Promise<void>
}

// opens a fixture, a page made for a test, in Chromium, served from localhost
// as the playground is, bundled once
async function openFixture(
  fixture: HTMLBundle
): Promise<_Opened_Fixture_> {
  const server = Bun.serve({ port: 0, development: false, routes: { "/": fixture } })
  const browser = await chromium.launch({ executablePath })
  const page = await browser.newPage()
  await page.goto(`http://localhost:${server.port}/`)
  return {
    page,
    close: async () => {
      await browser.close()
      await server.stop(true)
    },
  }
}
