import { signalFactory, computedFactory, ReadonlySignal, Signal } from './signal';
import { signalDecorator, computedDecorator } from './decorator';


interface SignalFunction {
    <T>(value: T): Signal<T>;
    (target: object | void, key: PropertyKey | ClassFieldDecoratorContext): void;
}
export const signal = ((a, b, c) => {
    return b
        ? signalDecorator(a, b, c)
        : signalFactory(a);
}) as SignalFunction;

interface ComputedFunction {
    <T>(fn: () => T): ReadonlySignal<T>;
    (target: object | void, key: PropertyKey | ClassGetterDecoratorContext);
}
export const computed = ((a, b, c) => {
    return b
        ? computedDecorator(a, b, c)
        : computedFactory(a);
}) as ComputedFunction;
