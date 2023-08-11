import { un } from "unsubscriber";
import { effectOriginal, untracked } from "./signal";

export const effect = (expression: () => void): (() => void) => (
  un(effectOriginal(expression))
);

export const reaction = <T>(expression: () => T, listener: (value: T, previous: T) => void) => {
  let hasPrev = false;
  let prev;
  
  effect(() => {
    const value = expression();
    if (hasPrev) {
      untracked(() => listener(value, prev));
    }
    hasPrev = true;
    prev = value;
  })
};

export const fireImmediately = <T>(expression: () => T, listener: (value: T) => void) => (
  effect(() => {
    const value = expression();
    untracked(() => listener(value));
  })
);

export const when = (expression: () => boolean): Promise<void> & { cancel(): void } => {
  let shouldStop = false;
  let ok, fail;
  const promise: any = new Promise<void>((resolve, reject) => {
    ok = resolve;
    fail = reject;
  });
  let stop = effect(() => {
    let value;
    try {
      value = expression();
      if (!value) return;
      ok();
    }
    catch {
      fail();
    }
    stop ? stop() : (shouldStop = true);
  });
  if (shouldStop) stop();

  promise.cancel = stop;
  return promise;
}