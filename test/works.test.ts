import { computed, reaction, signal, batch, fireImmediately, when } from "../src";

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

it('computed works', () => {
  const spy = jest.fn();
  const a = signal(0);
  const b = signal(0);
  const c = computed(() => a.value + b.value);
  fireImmediately(() => c.value, (v) => spy(v));
  a.value = 1;

  batch(() => {
    a.value += 1;
    b.value += 2;
  });

  expect(spy).nthCalledWith(1, 0);
  expect(spy).nthCalledWith(2, 1);
  expect(spy).nthCalledWith(3, 4);

  batch(() => {
    a.value -= 1;
    b.value += 1;
  });
  expect(spy).toBeCalledTimes(3);
});

it('signal decorator works', () => {
  const spy = jest.fn();
  class S {
    @signal a = 10;
  }
  const s = new S();
  fireImmediately(() => s.a, (v) => spy(v));
  s.a = 1;
  s.a += 1;

  expect(spy).nthCalledWith(1, 10);
  expect(spy).nthCalledWith(2, 1);
  expect(spy).nthCalledWith(3, 2);
  expect(spy).toBeCalledTimes(3);
});

it('computed decorator works', () => {
  const spy = jest.fn();
  class S {
    @signal a = 0;
    @signal b = 0;
    @computed get c() {
      return this.a + this.b;
    }
  }
  const s = new S();

  fireImmediately(() => s.c, (v) => spy(v));
  s.a = 1;

  batch(() => {
    s.a += 1;
    s.b += 2;
  });

  expect(spy).nthCalledWith(1, 0);
  expect(spy).nthCalledWith(2, 1);
  expect(spy).nthCalledWith(3, 4);

  batch(() => {
    s.a ++;
    s.b --;
  });
  expect(spy).toBeCalledTimes(3);
});

it('decorator works with class extends', () => {
  const spy = jest.fn();
  class A {
    @signal a = 10;
  }
  class B extends A {
    @signal b = 11;
  }
  class C extends B {
    @computed get c() {
      return this.a + this.b;
    };
  }
  const s = new C();
  fireImmediately(() => s.c, (v) => spy(v));
  s.a = 1;
  s.b += 1;

  expect(spy).nthCalledWith(1, 21);
  expect(spy).nthCalledWith(2, 12);
  expect(spy).nthCalledWith(3, 13);
  expect(spy).toBeCalledTimes(3);
});

it('reaction works', () => {
  const spy = jest.fn();
  const s = signal(0);
  reaction(() => s.value, (v) => spy(v));
  expect(spy).not.toBeCalled();

  s.value += 1;
  s.value = 1;
  s.value += 1;

  expect(spy).nthCalledWith(1, 1);
  expect(spy).nthCalledWith(2, 2);
  expect(spy).toBeCalledTimes(2);
});

it('fireImmediately works', () => {
  const spy = jest.fn();
  const s = signal(0);
  fireImmediately(() => s.value, (v) => spy(v));
  expect(spy).toBeCalled();

  s.value += 1;
  s.value = 1;
  s.value += 1;

  expect(spy).nthCalledWith(1, 0);
  expect(spy).nthCalledWith(2, 1);
  expect(spy).nthCalledWith(3, 2);
  expect(spy).toBeCalledTimes(3);
});

it('when works', async () => {
  const spy = jest.fn();
  const s = signal(0);
  when(() => s.value > 0).then(() => spy());
  await new Promise(r => r(0));
  expect(spy).not.toBeCalled();
  s.value = 1;
  await new Promise(r => r(0));
  expect(spy).toBeCalled();
});

it('when rejected works', async () => {
  const spy = jest.fn();
  try {
    await when(() => {
      throw 0;
    })
  }
  catch {
    spy()
  }
  expect(spy).toBeCalled();
});