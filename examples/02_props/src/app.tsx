/** @jsxImportSource jotai-signal */

import { atom } from 'jotai/vanilla';
import { useAtom, useSetAtom } from 'jotai/react';
import { $ } from 'jotai-signal';

const countAtom = atom(0);

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With $(atom)</h1>
      <div style={{ position: 'relative', left: $(countAtom) }}>
        Random: {Math.random()}
      </div>
    </div>
  );
};

const Counter = () => {
  const [count] = useAtom(countAtom);
  return (
    <div>
      <h1>With useAtom(atom)</h1>
      <div style={{ position: 'relative', left: count }}>
        Random: {Math.random()}
      </div>
    </div>
  );
};

const Controls = () => {
  const setCount = useSetAtom(countAtom);
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
    <Counter />
  </>
);

export default App;
