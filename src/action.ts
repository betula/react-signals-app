import { event, listen } from 'evemin';
import { un } from 'unsubscriber';

export interface Action<T> {
  <T>(value: T): void;
  subscribe(listener: (value: T) => void): (() => void);
}

export const action = <T = void>(): Action<T> => {
  const fn = event() as any;
  fn.subscribe = (listener) => un(listen(fn, listener));
  return fn;
}