// Retries a flaky async call, backing off each time, until it
// succeeds, runs out of attempts, or the caller gives up on it.

const ATTEMPTS = 5;
const DELAY_MS = 100;

/**
 * @template T
 * @param {() => Promise<T>} attempt
 * @param {{ attempts?: number, signal?: AbortSignal, onRetry?: (error: unknown, n: number) => void }} [options]
 * @returns {Promise<T>}
 */
export async function retry(attempt, { attempts = ATTEMPTS, signal, onRetry } = {}) {
  let lastError;
  for (let n = 1; n <= attempts; n++) {
    signal?.throwIfAborted();
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (n === attempts || !isRetryable(error)) break;
      onRetry?.(error, n);
      await sleep(backoff(n), signal);
    }
  }
  throw new AggregateError([lastError], `gave up after ${attempts} attempts`);
}

// 100ms, 200ms, 400ms, ..., and up to half as long again at random, so that
// many clients retrying at once don't all come back at the same moment
export function backoff(n) {
  const delay = DELAY_MS * 2 ** (n - 1);
  return delay + Math.random() * (delay / 2);
}

function isRetryable(error) {
  if (error instanceof TypeError) return true; // the network failed, not the server
  const status = error?.response?.status ?? 0;
  return status === 429 || (status >= 500 && status !== 501);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}
