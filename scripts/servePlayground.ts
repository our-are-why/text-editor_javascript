import page from "../playground/index.html"

export {
  type _Serving_Playground_,
  servePlayground
}

// how the playground's served: to play with, bundled again as files change
// and reloaded in the page; or for the browser tests, bundled once
type _Serving_Playground_ = "playing" | "testing"

// the playground, on every interface, so the container's port mapping
// reaches it
function servePlayground(port: number, serving: _Serving_Playground_) {
  return Bun.serve({
    port,
    hostname: "0.0.0.0",
    development: serving === "playing" ? { hmr: true } : false,
    routes: { "/": page },
  })
}

// bun run playground: on 3005, which .environment/scripts/startContainer.sh
// maps to the same port on the host
if (import.meta.main) {
  servePlayground(3005, "playing")
  console.log("The playground's at http://localhost:3005")
}
