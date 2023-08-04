import { computedFactory, signalFactory } from './signal';

function defineSignalProperty(obj: object, key: PropertyKey, initializer?: () => unknown) {
    const box = initializer 
        ? signalFactory(initializer())
        : signalFactory(void 0);
    
    Object.defineProperty(obj, key, {
        get: () => box.value,
        set: (value) => box.value = value,
    })
}

export function signalDecorator(_target: object, key: PropertyKey, descriptor: any) {
    const initializer = descriptor && descriptor.initializer;

    return {
        get() {
            defineSignalProperty(this, key, initializer && initializer.bind(this));
            return this[key];
        },
        set(value: any) {
            defineSignalProperty(this, key, initializer && initializer.bind(this));
            this[key] = value;
        },
    }
}

export function computedDecorator(_target: object, key: PropertyKey, descriptor: any) {
    return {
        get() {
            const box = computedFactory(descriptor.get.bind(this));

            Object.defineProperty(this, key, { get: () => box.value });
            return this[key];
        }
    }
}
