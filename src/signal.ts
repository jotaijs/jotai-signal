/// <reference types="react/experimental" />

import {
  createElement as createElementOrig,
  experimental_use as experimentalUse,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Context, ReactNode } from 'react';
import { SECRET_INTERNAL_getScopeContext as getScopeContext } from 'jotai';
import type { Atom } from 'jotai';

let use = experimentalUse;
if (!use) {
  // TODO this is a temporary workaround
  // eslint-disable-next-line no-console
  console.warn(
    'experimental_use is not available. Falling back to useContext. It may not work as expected due to rules of hooks.',
  );
  use = (x: any) => {
    if (x instanceof Promise) {
      throw x;
    }
    return useContext(x);
  };
}

type ExtractContextValue<T> = T extends Context<infer V> ? V : never;

type Displayable = string | number;
type DisplayableAtom = Atom<Displayable | Promise<Displayable>>;
type Scope = NonNullable<Parameters<typeof getScopeContext>[0]>;
type Store = ExtractContextValue<ReturnType<typeof getScopeContext>>['s'];

const READ_ATOM = 'r';
const SUBSCRIBE_ATOM = 's';

const SIGNAL = Symbol();
type Unsubscribe = () => void;
type Subscribe = (callback: () => void) => Unsubscribe;
type Signal = {
  [SIGNAL]: {
    read: () => Displayable;
    sub: Subscribe;
  };
  THIS_IS_A_SIGNAL?: true;
};
const isSignal = (x: unknown): x is Signal => !!(x as any)?.[SIGNAL];

const signalCache = new WeakMap<Store, WeakMap<DisplayableAtom, Signal>>();
const getSignal = (store: Store, atom: DisplayableAtom): Signal => {
  let atomSignalCache = signalCache.get(store);
  if (!atomSignalCache) {
    atomSignalCache = new WeakMap();
    signalCache.set(store, atomSignalCache);
  }
  let signal = atomSignalCache.get(atom);
  if (!signal) {
    const read = () => {
      const atomState = store[READ_ATOM](atom);
      if ('e' in atomState) {
        throw atomState.e; // read error
      }
      if ('p' in atomState) {
        return use(atomState.p) as never; // read promise
      }
      if ('v' in atomState) {
        return atomState.v;
      }
      throw new Error('no atom value');
    };
    const sub: Subscribe = (callback) => store[SUBSCRIBE_ATOM](atom, callback);
    signal = {
      [SIGNAL]: { read, sub },
      THIS_IS_A_SIGNAL: true,
    };
    atomSignalCache.set(atom, signal);
  }
  return signal as Signal;
};

export const signal = (atom: DisplayableAtom, scope?: Scope): string => {
  const ScopeContext = getScopeContext(scope);
  const store: Store = use(ScopeContext).s;
  return getSignal(store, atom) as Signal & string; // HACK lie type
};

const useMemoList = <T>(list: T[], compareFn = (a: T, b: T) => a === b) => {
  const [state, setState] = useState(list);
  const listChanged =
    list.length !== state.length ||
    list.some((arg, index) => !compareFn(arg, state[index] as T));
  if (listChanged) {
    // schedule update, triggers re-render
    setState(list);
  }
  return listChanged ? list : state;
};

const Rerenderer = ({
  subs,
  render,
}: {
  subs: Subscribe[];
  render: () => ReactNode;
}): ReactNode => {
  const [, setRevision] = useState(0);
  const memoedSubs = useMemoList(subs);
  useEffect(() => {
    const callback = () => setRevision((r) => r + 1);
    const unsubs = memoedSubs.map((sub) => sub(callback));
    return () => unsubs.forEach((unsub) => unsub());
  }, [memoedSubs]);
  return render();
};

const findAllSignalSubs = (x: unknown): Subscribe[] => {
  if (isSignal(x)) {
    return [x[SIGNAL].sub];
  }
  if (Array.isArray(x)) {
    return x.flatMap(findAllSignalSubs);
  }
  if (typeof x === 'object' && x !== null) {
    return Object.values(x).flatMap(findAllSignalSubs);
  }
  return [];
};

const fillAllSignalValues = <T>(x: T): T => {
  if (isSignal(x)) {
    return x[SIGNAL].read() as T;
  }
  if (Array.isArray(x)) {
    let changed = false;
    const x2 = x.map((item) => {
      const item2 = fillAllSignalValues(item);
      if (item !== item2) {
        changed = true; // HACK side effect
      }
      return item2;
    });
    return changed ? (x2 as typeof x) : x;
  }
  if (typeof x === 'object' && x !== null) {
    let changed = false;
    const x2 = Object.fromEntries(
      Object.entries(x).map(([key, value]) => {
        const value2 = fillAllSignalValues(value);
        if (value !== value2) {
          changed = true; // HACK side effect
        }
        return [key, value2];
      }),
    );
    return changed ? (x2 as typeof x) : x;
  }
  return x;
};

export const createElement = ((type: any, props?: any, ...children: any[]) => {
  const subsInChildren = children.flatMap((child) =>
    isSignal(child) ? [child[SIGNAL].sub] : [],
  );
  const subsInProps = findAllSignalSubs(props);
  if (!subsInChildren.length && !subsInProps.length) {
    return createElementOrig(type, props, ...children);
  }
  const getChildren = () =>
    subsInChildren.length
      ? children.map((child) =>
          isSignal(child) ? child[SIGNAL].read() : child,
        )
      : children;
  const getProps = () =>
    subsInProps.length ? fillAllSignalValues(props) : props;
  return createElementOrig(Rerenderer as any, {
    subs: [...subsInChildren, ...subsInProps],
    render: () => createElementOrig(type, getProps(), ...getChildren()),
  });
}) as typeof createElementOrig;
