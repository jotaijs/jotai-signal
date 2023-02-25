import jsxRuntime from 'react/jsx-runtime';
import jsxDevRuntime from 'react/jsx-dev-runtime';
import { useSetAtom } from 'jotai/react';
import { atomSignal } from 'jotai-signal';
import { jsx, jsxs } from 'jotai-signal/jsx-runtime';

// This hack only works if jsxRuntime is CJS not ESM.
(jsxRuntime as any).jsx = jsx;
(jsxRuntime as any).jsxs = jsxs;
(jsxDevRuntime as any).jsx = jsx;
(jsxDevRuntime as any).jsxs = jsxs;

const count = atomSignal(0);
const doubled = atomSignal((get) => get(count) * 2);

const CounterWithSignal = () => {
  return (
    <>
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
      <button type="button" onClick={() => setCount((c) => c + 1)}>
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
