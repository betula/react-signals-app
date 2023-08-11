import { provide, destroy } from "provi/client"

const INSTANTIATE_KEY = 'instantiate';
const DESTROY_KEY = 'destroy';

export const service = <T>(Class: (() => T) | (new () => T)) => {
  let instance;

  const ensure = () => instance ? instance : (instance = provide(Class));

  const proxy = new Proxy({}, {
    get(_target, prop) {
      if (prop === INSTANTIATE_KEY) {
        ensure();
        const method = instance[INSTANTIATE_KEY];
        return typeof method !== 'undefined' 
          ? (...args) => method.apply(instance, args)
          : () => void 0;
      }
      else if (prop === DESTROY_KEY) {
        if (!instance) return () => void 0;
        const method = instance[DESTROY_KEY];
        return typeof method !== 'undefined' 
          ? (...args) => (method.apply(instance, args), destroy(Class))
          : () => destroy(Class);
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
    destroy(): void;
  } & T;
}