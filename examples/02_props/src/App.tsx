/** @jsxImportSource jotai-signal */

import { atom, useAtom, useSetAtom } from 'jotai';
import { signal } from 'jotai-signal';

const countAtom = atom(0);

const CounterWithSignal = () => {
  return (
    <div>
      <h1>With signal(atom)</h1>
      <div style={{ position: 'relative', left: signal(countAtom) }}>
        Count: {signal(countAtom)} ({Math.random()})
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
        Count: {count} ({Math.random()})
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
