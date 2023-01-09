/** @jsxImportSource jotai-signal */

import { atom } from 'jotai/vanilla';
import { $ } from 'jotai-signal';

const countAtom = atom(0);

const inc = () => {
  const prevCount = $(countAtom).value;
  const nextCount = prevCount + 1;
  $(countAtom).value = nextCount;
};

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With $(atom)</h1>
      Count: {$(countAtom)} ({Math.random()})
    </div>
  );
};

const Controls = () => {
  return (
    <div>
      <button type="button" onClick={inc}>
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
