/** @jsxImportSource jotai-signal */

import { atom } from 'jotai/vanilla';
import { useSetAtom } from 'jotai/react';
import { $ as signal } from 'jotai-signal';

// Typing this is too hard...
const atomWithSignal = (read: any, write?: any, store?: any) => {
  const a = atom(read, write);
  const s = signal(a, store);
  return new Proxy(
    (() => {
      // empty
    }) as any,
    {
      get(_target, prop) {
        if (prop in a) {
          return (a as any)[prop];
        }
        return (s as any)[prop];
      },
      has(_target, prop) {
        if (prop in a) {
          return true;
        }
        return prop in s;
      },
    },
  );
};

// -----------------------------------------------

const count = atomWithSignal(0);
const doubled = atomWithSignal((get: any) => get(count) * 2);

const CounterWithSignal = () => {
  return (
    <>
      <h1>With $(atom)</h1>
      <p>
        Count: {count} ({Math.random()})
      </p>
      <p>Doubled: {doubled}</p>
    </>
  );
};

const Controls = () => {
  const setCount = useSetAtom(count);
  return (
    <div>
      <button type="button" onClick={() => setCount((c: any) => c + 1)}>
        Increment
      </button>
    </div>
  );
};

const App = () => (
  <>
    <Controls />
    <CounterWithSignal />
  </>
);

export default App;
