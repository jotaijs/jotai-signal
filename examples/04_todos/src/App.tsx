/** @jsxImportSource jotai-signal */

import { memo } from 'react';
import type { FormEvent } from 'react';
import { atom } from 'jotai/vanilla';
import { useAtom, useAtomValue, useSetAtom } from 'jotai/react';
import type { PrimitiveAtom } from 'jotai/vanilla';
import { $ } from 'jotai-signal';

const createRandomColor = () => `hsl(${Math.random() * 360}deg,100%,50%)`;

type Todo = {
  title: string;
  completed: boolean;
};

const filterAtom = atom<'all' | 'completed' | 'incompleted'>('all');
const todoAtomsAtom = atom<PrimitiveAtom<Todo>[]>([]);
const filteredTodoAtomsAtom = atom<PrimitiveAtom<Todo>[]>((get) => {
  const filter = get(filterAtom);
  const todoAtoms = get(todoAtomsAtom);
  if (filter === 'all') {
    return todoAtoms;
  }
  if (filter === 'completed') {
    return todoAtoms.filter((todoAtom) => get(todoAtom).completed);
  }
  return todoAtoms.filter((todoAtom) => !get(todoAtom).completed);
});

type RemoveFn = (item: PrimitiveAtom<Todo>) => void;
type TodoItemProps = {
  todoAtom: PrimitiveAtom<Todo>;
  remove: RemoveFn;
};
const TodoItem = memo(({ todoAtom, remove }: TodoItemProps) => {
  const setItem = useSetAtom(todoAtom);
  const toggleCompleted = () => {
    setItem((props) => ({ ...props, completed: !props.completed }));
  };
  return (
    <div style={{ backgroundColor: createRandomColor() }}>
      <input
        type="checkbox"
        checked={$(atom((get) => get(todoAtom).completed))}
        onChange={toggleCompleted}
      />
      <span
        style={{
          textDecoration: $(
            atom((get) => (get(todoAtom).completed ? 'line-through' : '')),
          ),
        }}
      >
        {$(atom((get) => get(todoAtom).title))}
      </span>
      <button type="button" onClick={() => remove(todoAtom)}>
        Remove
      </button>
    </div>
  );
});

const Filter = () => {
  const [filter, set] = useAtom(filterAtom);
  return (
    <div>
      {(['all', 'completed', 'incompleted'] as const).map((f) => (
        <label htmlFor={f} key={f}>
          <input
            name={f}
            type="radio"
            value={f}
            checked={filter === f}
            onChange={() => set(f)}
          />
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </label>
      ))}
    </div>
  );
};

type FilteredProps = {
  remove: RemoveFn;
};
const Filtered = ({ remove }: FilteredProps) => (
  <div style={{ padding: 30, backgroundColor: createRandomColor() }}>
    {useAtomValue(filteredTodoAtomsAtom).map((todoAtom) => (
      <TodoItem key={`${todoAtom}`} todoAtom={todoAtom} remove={remove} />
    ))}
  </div>
);

const TodoList = () => {
  const setTodos = useSetAtom(todoAtomsAtom);
  const remove: RemoveFn = (todoAtom) =>
    setTodos((prev) => prev.filter((item) => item !== todoAtom));
  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = e.currentTarget.inputTitle.value;
    e.currentTarget.inputTitle.value = '';
    setTodos((prev) => [...prev, atom<Todo>({ title, completed: false })]);
  };
  return (
    <form onSubmit={add}>
      <Filter />
      <div style={{ margin: 5 }}>
        <input name="inputTitle" placeholder="Enter title..." />
      </div>
      <Filtered remove={remove} />
    </form>
  );
};

const App = () => (
  <>
    <h1>Jotai-Signal TODOs App</h1>
    <TodoList />
  </>
);

export default App;
