/** @jsxImportSource jotai-signal */

import { useSetAtom } from 'jotai/react';
import { atomSignal } from 'jotai-signal';

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
