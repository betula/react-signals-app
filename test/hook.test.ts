import React from 'react';
import { scope } from 'unsubscriber';
import { effect, hook, signal, un } from "../src";

let unmount;
let unsubs;

beforeAll(() => {
  jest.spyOn(React, 'useMemo')
    .mockImplementation((fn, deps) => {
      expect(deps).toStrictEqual([]);
      return fn();
    });

  jest.spyOn(React, 'useEffect')
    .mockImplementation((fn, deps) => {
      expect(deps).toStrictEqual([unsubs]);
      unmount = fn();
    });
});

afterAll(() => {
  jest.restoreAllMocks()
})

it('hook works', () => {
  const create_spy = jest.fn();
  const destroy_spy = jest.fn();
  
  class A {
    @signal a: number;
    b = 0;
    constructor() {
      unsubs = scope();
      create_spy();
      un(destroy_spy);

      effect(() => {
        this.b = (this.a || 0) + 10;
      });
    }
  }

  const useA = hook(A);
  const inst = useA();

  expect(inst.b).toBe(10);
  inst.a = 10;
  expect(inst.b).toBe(20);
  
  expect(create_spy).toBeCalled();
  expect(destroy_spy).not.toBeCalled();

  unmount();
  expect(destroy_spy).toBeCalled();
});
