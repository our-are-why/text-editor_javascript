import {
  modelAfter__Command,
  type _Model_Agent_,
  type _Command_Agent_
} from "./Model_Agent.ts"

export {
  _Agent_,
  type _Api__Agent_,
  type _Observer_Agent_
}

class _Agent_ {
  model_Agent: _Model_Agent_
  observers: Array<_Observer_Agent_>

  constructor({
    model_Agent,
    observers
  }: _Api__Agent_) {
    this.model_Agent = model_Agent
    this.observers = observers
  }

  handle(
    command_Agent: _Command_Agent_
  ): void {
    const model_Agent = modelAfter__Command({
      model_Agent: this.model_Agent,
      command: command_Agent
    })
    if (model_Agent === this.model_Agent) return
    this.model_Agent = model_Agent
    for (const observer of this.observers) observer.changed(this.model_Agent)
  }
}

interface _Api__Agent_ {
  model_Agent: _Model_Agent_
  observers: Array<_Observer_Agent_>
}

interface _Observer_Agent_ {
  changed: (model_Agent: _Model_Agent_) => void
}
