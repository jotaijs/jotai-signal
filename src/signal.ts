import {
  createElement as createElementOrig,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  experimental_use as use,
  useEffect,
  useState,
} from 'react';
import type { Context, ReactNode } from 'react';
import { SECRET_INTERNAL_getScopeContext as getScopeContext } from 'jotai';
import type { Atom } from 'jotai';

type ExtractContextValue<T> = T extends Context<infer V> ? V : never;

type AnyAtom = Atom<unknown>;
type Scope = NonNullable<Parameters<typeof getScopeContext>[0]>;
type Store = ExtractContextValue<ReturnType<typeof getScopeContext>>['s'];

const READ_ATOM = 'r';
const SUBSCRIBE_ATOM = 's';

const SIGNAL = Symbol();
type Unsubscribe = () => void;
type Subscribe = (callback: () => void) => Unsubscribe;
type Signal = {
  [SIGNAL]: {
    read: () => unknown;
    sub: Subscribe;
  };
  toString: () => string;
};
const isSignal = (x: unknown): x is Signal => !!(x as any)?.[SIGNAL];

const signalCache = new WeakMap<Store, WeakMap<AnyAtom, Signal>>();
const getSignal = (store: Store, atom: AnyAtom): Signal => {
  let atomSignalCache = signalCache.get(store);
  if (!atomSignalCache) {
    atomSignalCache = new WeakMap();
    signalCache.set(store, atomSignalCache);
  }
  let signal = atomSignalCache.get(atom);
  if (!signal) {
    const read = () => {
      const atomState = store[READ_ATOM](atom);
      if ('v' in atomState) {
        return atomState.v;
      }
      throw new Error('no atom value');
    };
    const sub: Subscribe = (callback) => store[SUBSCRIBE_ATOM](atom, callback);
    signal = {
      [SIGNAL]: { read, sub },
      toString: () => String(read()),
    };
    atomSignalCache.set(atom, signal);
  }
  return signal as Signal;
};

// Limitations:
//   - does not (yet?) work with async atoms.
export const signal = (atom: AnyAtom, scope?: Scope): string => {
  const ScopeContext = getScopeContext(scope);
  const { s: store } = use(ScopeContext);
  return getSignal(store, atom) as Signal & string;
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
