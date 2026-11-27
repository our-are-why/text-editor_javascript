import {
  modelAfter__Command,
  type _Model_Documents_,
  type _Command_Documents_
} from "./Model_Documents.ts"

export {
  _Documents_,
  type _Api__Documents_,
  type _Observer_Documents_
}

class _Documents_ {
  model_Documents: _Model_Documents_
  observers: Array<_Observer_Documents_>

  constructor({
    model_Documents,
    observers
  }: _Api__Documents_) {
    this.model_Documents = model_Documents
    this.observers = observers
  }

  handle(
    command_Documents: _Command_Documents_
  ): void {
    const model_Documents = modelAfter__Command({
      model_Documents: this.model_Documents,
      command: command_Documents
    })
    if (model_Documents === this.model_Documents) return
    this.model_Documents = model_Documents
    for (const observer of this.observers) observer.changed(this.model_Documents)
  }
}

interface _Api__Documents_ {
  model_Documents: _Model_Documents_
  observers: Array<_Observer_Documents_>
}

interface _Observer_Documents_ {
  changed: (model_Documents: _Model_Documents_) => void
}
