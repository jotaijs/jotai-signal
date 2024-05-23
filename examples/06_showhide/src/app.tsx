/** @jsxImportSource jotai-signal */

import type { ReactElement, ReactNode } from 'react';
import { atom } from 'jotai/vanilla';
import { useAtom, useSetAtom } from 'jotai/react';
import { $ } from 'jotai-signal';

const Show = ({
  show,
  fallback,
  children,
}: {
  show: boolean;
  fallback: ReactNode;
  children: ReactNode;
}) => {
  if (show) {
    return children as ReactElement;
  }
  return fallback as ReactElement;
};

const countAtom = atom(0);
const showAtom = atom(true);

const CounterWithSignal = () => {
  return (
    <Show show={$(showAtom)} fallback={<h1>Hidden!</h1>}>
      <h1>With $(atom)</h1>
      <p>
        Count: {$(countAtom)} ({Math.random()})
      </p>
    </Show>
  );
};

const Controls = () => {
  const setCount = useSetAtom(countAtom);
  const [show, setShow] = useAtom(showAtom);
  return (
    <div>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
      <button type="button" onClick={() => setShow((x) => !x)}>
        {show ? 'Hide' : 'Show'}
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
