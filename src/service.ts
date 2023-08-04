import { provide } from "provi/client"

const INSTANTIATE_KEY = 'instantiate';

export const service = <T>(Class: (() => T) | (new () => T)) => {
  let cache;

  const ensure = () => cache ? cache : (cache = provide(Class));

  const proxy = new Proxy({}, {
    get(_target, prop) {
      if (prop === INSTANTIATE_KEY) {
        const instance = ensure();
        const method = instance[INSTANTIATE_KEY];
        return typeof method !== 'undefined' 
          ? method
          : () => void 0;
      }
      return ensure()[prop]
    },
    set(_target, prop, value) {
      ensure()[prop] = value;
      return true;
    }
  });

  return proxy as {
    instantiate(): void;
  } & T;
}