export {
  type _Entry_Log_,
  type _Example_
}

// what an example is to the playground, which lists it, shows it, and logs
// what it reports

// one thing an example reports, shown as its fields
interface _Entry_Log_ { [field: string]: string | number | boolean | null }

interface _Example_ {
  // in the playground's address: ?example=<name>
  name: string
  title: string
  // what it shows, and what to try
  about: string
  // draws the example into its root, reporting through log
  mount: (root: HTMLElement, log: (entry: _Entry_Log_) => void) => void
}

declare global {
  interface Window {
    // what the example shown has reported, in order, for the browser tests
    // to read
    logged: Array<_Entry_Log_>
  }
}
