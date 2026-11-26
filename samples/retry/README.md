# retry

Retries a flaky async call, backing off further each time, until it succeeds, runs out of attempts, or the caller gives up on it.

## Install

```sh
bun add @tools/retry
```

## Use

Wrap the call in a function, and pass it to `retry`, with any options:

```js
import { retry } from "@tools/retry";

const user = await retry(() => fetchUser(id), { attempts: 3 });
```

## Options

- `attempts`: how many times to try, *5* unless you say otherwise.
- `signal`: an `AbortSignal`; once it aborts, retry stops waiting and throws.
- `onRetry`: called before each new attempt, with the error and the attempt's number.

## What it retries

A call that throws is tried again when the network failed, or when the server answered with a status that says it may work later:

| status        | retried |
|---------------|---------|
| 429           | yes     |
| 5xx, but 501  | yes     |
| 501           | no      |

## How long it waits

Each wait is twice the one before, starting at `DELAY_MS`, 100 ms, with up to half as much again added at random, so callers that failed together don't all retry together.

> A call that keeps failing waits longer each round: by the tenth attempt, almost a minute.

See [why the waits grow](https://example.com/backoff), and **please** say if anything's odd.
