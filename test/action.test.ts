import { action } from "../src";

it('light action works', () => {
  const spy = jest.fn();

  const a = action();
  a.subscribe(spy);

  expect(spy).not.toBeCalled();
  a();
  expect(spy).toBeCalled();
  a();
  expect(spy).toBeCalledTimes(2);
});

it('params action works', () => {
  const spy = jest.fn();

  const a = action<number>();
  a.subscribe(spy);

  expect(spy).not.toBeCalled();
  a(1);
  expect(spy).toBeCalledWith(1);
  a(2);
  expect(spy).toBeCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith(2);
});