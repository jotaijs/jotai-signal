import {
  createElement as createElementOrig,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  experimental_use as use,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { SECRET_INTERNAL_getScopeContext as getScopeContext } from 'jotai';
import type { Atom } from 'jotai';

type AnyAtom = Atom<unknown>;
type Scope = NonNullable<Parameters<typeof getScopeContext>[0]>;

const READ_ATOM = 'r';
const SUBSCRIBE_ATOM = 's';

const SIGNAL = Symbol();
type Subscribe = (callback: () => void) => () => void;
type Signal = {
  [SIGNAL]: {
    read: () => unknown;
    sub: Subscribe;
  };
};
const isSignal = (x: unknown): x is Signal => !!(x && (x as any)[SIGNAL]);

// Limitations:
//   - atom and scope(store) can't be dynamic.
export const signal = (atom: AnyAtom, scope?: Scope): string => {
  const ScopeContext = getScopeContext(scope);
  const { s: store } = use(ScopeContext);
  const read = () => {
    const atomState = store[READ_ATOM](atom);
    if ('v' in atomState) {
      return atomState.v;
    }
    throw new Error('no atom value');
  };
  const sub: Subscribe = (callback) => store[SUBSCRIBE_ATOM](atom, callback);
  return {
    [SIGNAL]: { read, sub },
    toString: () => String(read()),
  } as Signal & string;
};

const Rerenderer = ({
  subscribe,
  render,
}: {
  subscribe: Subscribe;
  render: () => ReactNode;
}): ReactNode => {
  const [, setRevision] = useState(0);
  useEffect(() => subscribe(() => setRevision((r) => r + 1)), [subscribe]);
  return render();
};

export const createElement = ((type: any, props?: any, ...children: any[]) => {
  // TODO patch props
  const subsInChildren = children.flatMap((child) =>
    isSignal(child) ? [child[SIGNAL].sub] : [],
  );
  if (!subsInChildren.length) {
    return createElementOrig(type, props, ...children);
  }
  const getChildren = () =>
    children.map((child) => (isSignal(child) ? child[SIGNAL].read() : child));
  const subscribe: Subscribe = (callback) => {
    const unsubs = subsInChildren.map((sub) => sub(callback));
    return () => unsubs.forEach((unsub) => unsub());
  };
  return createElementOrig(Rerenderer as any, {
    subscribe,
    render: () => createElementOrig(type, props, ...getChildren()),
  });
}) as typeof createElementOrig;
