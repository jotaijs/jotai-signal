import React from 'react';
import { useSetAtom } from 'jotai/react';
import { atomWithSignal, inject } from 'jotai-signal';

React.createElement = inject(React.createElement);

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
