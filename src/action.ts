import { event, listen } from 'evemin';
import { un } from 'unsubscriber';

export interface Action<T> {
  <T>(value: T): void;
  subscribe(listener: (value: T) => void): (() => void);
}

export interface LightAction extends Action<void> {
  (): void;
  subscribe(listener: () => void): (() => void);
}

export const action = <T = void>(): T extends void ? LightAction : Action<T> => {
  const fn = event() as any;
  fn.subscribe = (listener) => un(listen(fn, listener));
  return fn;
}