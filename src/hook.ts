import { useMemo, useEffect } from 'react';
import { collect, unsubscriber, run } from 'unsubscriber';

export const hook = <T>(Class: (() => T) | (new () => T)): (() => T) => {

  return () => {
    const [instance, unsubs] = useMemo(() => {
      const unsubs = unsubscriber();
      return [
        collect(unsubs, () => (
          Class.prototype === void 0
            ? (Class as () => T)()
            : new (Class as new () => T)()
        )),
        unsubs
      ]
    }, []);

    useEffect(() => () => run(unsubs), [unsubs]);
    return instance;
  }
}