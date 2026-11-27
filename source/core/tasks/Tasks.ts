import {
  modelAfter__Command,
  type _Model_Tasks_,
  type _Command_Tasks_
} from "./Model_Tasks.ts"

export {
  _Tasks_,
  type _Api__Tasks_,
  type _Observer_Tasks_
}

class _Tasks_ {
  model_Tasks: _Model_Tasks_
  observers: Array<_Observer_Tasks_>

  constructor({
    model_Tasks,
    observers
  }: _Api__Tasks_) {
    this.model_Tasks = model_Tasks
    this.observers = observers
  }

  handle(
    command_Tasks: _Command_Tasks_
  ): void {
    const model_Tasks = modelAfter__Command({
      model_Tasks: this.model_Tasks,
      command: command_Tasks
    })
    if (model_Tasks === this.model_Tasks) return
    this.model_Tasks = model_Tasks
    for (const observer of this.observers) observer.changed(this.model_Tasks)
  }
}

interface _Api__Tasks_ {
  model_Tasks: _Model_Tasks_
  observers: Array<_Observer_Tasks_>
}

interface _Observer_Tasks_ {
  changed: (model_Tasks: _Model_Tasks_) => void
}
