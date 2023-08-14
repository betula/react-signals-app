import { provide, destroy } from "provi/client"

const INSTANTIATE_KEY = Symbol('instantiate');
const DESTROY_KEY = Symbol('destroy');

interface ServiceFactory {
  <T>(Class: (() => T) | (new () => T)): T;
  instantiate(instance: object);
  destroy(instance: object);
}

export const service: ServiceFactory = (<T>(Class: (() => T) | (new () => T)) => {
  let instance;

  return new Proxy({}, {
    get(_target, prop) {
      if (prop === DESTROY_KEY) {
        if (instance) {
          destroy(Class);
          instance = void 0;
        }
        return;
      }
      if (!instance) {
        instance = provide(Class)
      };
      if (prop !== INSTANTIATE_KEY) {
        return instance[prop];
      }
    },
    set(_target, prop, value) {
      if (!instance) {
        instance = provide(Class);
      }
      instance[prop] = value;
      return true;
    }
  });
}) as any;

service.instantiate = (instance: object) => instance[INSTANTIATE_KEY];
service.destroy = (instance: object) => instance[DESTROY_KEY];
