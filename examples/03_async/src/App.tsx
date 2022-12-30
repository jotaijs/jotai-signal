/** @jsxImportSource jotai-signal */

import { Suspense } from 'react';
import { atom } from 'jotai/vanilla';
import { useAtom } from 'jotai/react';
import { $ } from 'jotai-signal';

const idAtom = atom(1);
const userAtom = atom(async (get) => {
  const response = await fetch(`https://reqres.in/api/users/${get(idAtom)}`);
  const { data } = await response.json();
  return `ID: ${data.id}, Name: ${data.first_name} ${data.last_name}`;
});

const createRandomColor = () => `#${Math.random().toString(16).slice(-6)}`;

const UserWithSignal = () => {
  return (
    <div style={{ backgroundColor: createRandomColor() }}>
      User: {$(userAtom)}
    </div>
  );
};

const User = () => {
  const [user] = useAtom(userAtom);
  return (
    <div style={{ backgroundColor: createRandomColor() }}>User: {user}</div>
  );
};

const Controls = () => {
  const [id, setId] = useAtom(idAtom);
  return (
    <div>
      ID: {id}{' '}
      <button type="button" onClick={() => setId((c) => c - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setId((c) => c + 1)}>
        Next
      </button>
    </div>
  );
};

const App = () => (
  <>
    <Controls />
    <h1>With $(atom)</h1>
    <Suspense fallback="Loading...">
      <UserWithSignal />
    </Suspense>
    <h1>With useAtom(atom)</h1>
    <Suspense fallback="Loading...">
      <User />
    </Suspense>
  </>
);

export default App;
