import jsxRuntime from 'react/jsx-runtime';
import { useSetAtom } from 'jotai/react';
import { atomWithSignal } from 'jotai-signal';
import { jsx, jsxs } from 'jotai-signal/jsx-runtime';

(jsxRuntime as any).jsx = jsx;
(jsxRuntime as any).jsxs = jsxs;

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
