import { computed, reaction, signal, batch, fireImmediately } from "../src";

it('signal works', () => {
    const spy = jest.fn();
    const s = signal(0);
    fireImmediately(() => s.value, (v) => spy(v));
    s.value = 1;
    s.value += 1;

    expect(spy).nthCalledWith(1, 0);
    expect(spy).nthCalledWith(2, 1);
    expect(spy).nthCalledWith(3, 2);
    expect(spy).toBeCalledTimes(3);
});

// it('computed works', () => {
//     const spy = jest.fn();
//     const a = signal(0);
//     const b = signal(0);
//     const c = computed(() => a() + b());
//     reaction(c, (v) => spy(v), { fireImmediately: true });
//     a.set(1);

//     batch(() => {
//         a.update(n => n + 1);
//         b.update(n => n + 2);
//     });

//     expect(spy).nthCalledWith(1, 0);
//     expect(spy).nthCalledWith(2, 1);
//     expect(spy).nthCalledWith(3, 4);

//     batch(() => {
//         a.update(n => n - 1);
//         b.update(n => n + 1);
//     });
//     expect(spy).toBeCalledTimes(3);
// });

// it('mutate works', () => {
//     const spy = jest.fn();
//     const a = signal({ a: 0 }); 
//     reaction(a, (v) => spy(v));

//     a.mutate(h => {
//         h.a = 1;
//         h.a = 2;
//     });

//     expect(a()).toStrictEqual({ a: 2 });
//     expect(spy).toBeCalledWith({ a: 2 });
// });

// it('signal decorator works', () => {
//     const spy = jest.fn();
//     class S {
//         @signal a = 10;
//     }
//     const s = new S();
//     reaction(() => s.a, (v) => spy(v), { fireImmediately: true });
//     s.a = 1;
//     s.a += 1;

//     expect(spy).nthCalledWith(1, 10);
//     expect(spy).nthCalledWith(2, 1);
//     expect(spy).nthCalledWith(3, 2);
//     expect(spy).toBeCalledTimes(3);
// });

// it('signal decorator works', () => {
//     const spy = jest.fn();
//     class S {
//         @signal a = 0;
//         @signal b = 0;
//         @computed get c() {
//             return this.a + this.b;
//         }
//     }
//     const s = new S();

//     reaction(() => s.c, (v) => spy(v), { fireImmediately: true });
//     s.a = 1;

//     batch(() => {
//         s.a += 1;
//         s.b += 2;
//     });

//     expect(spy).nthCalledWith(1, 0);
//     expect(spy).nthCalledWith(2, 1);
//     expect(spy).nthCalledWith(3, 4);

//     batch(() => {
//         s.a ++;
//         s.b --;
//     });
//     expect(spy).toBeCalledTimes(3);
// });