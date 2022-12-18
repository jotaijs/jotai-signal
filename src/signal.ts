/// <reference types="react/experimental" />

import ReactExports, {
  createElement as createElementOrig,
  useEffect,
  useReducer,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { getDefaultStore } from 'jotai/vanilla';
import type { Atom } from 'jotai/vanilla';

const use =
  ReactExports.use ||
  (<T>(
    promise: Promise<T> & {
      status?: 'pending' | 'fulfilled' | 'rejected';
      value?: T;
      reason?: unknown;
    },
  ): T => {
    if (promise.status === 'pending') {
      throw promise;
    } else if (promise.status === 'fulfilled') {
      return promise.value as T;
    } else if (promise.status === 'rejected') {
      throw promise.reason;
    } else {
      promise.status = 'pending';
      promise.then(
        (v) => {
          promise.status = 'fulfilled';
          promise.value = v;
        },
        (e) => {
          promise.status = 'rejected';
          promise.reason = e;
        },
      );
      throw promise;
    }
  });

type Displayable = string | number;
type DisplayableAtom = Atom<Displayable | Promise<Displayable>>;
type Store = ReturnType<typeof getDefaultStore>;

const SIGNAL = Symbol();
type Unsubscribe = () => void;
type Subscribe = (callback: () => void) => Unsubscribe;
type AtomValue = unknown;
type AtomError = unknown;
type Signal = {
  [SIGNAL]: {
    s: Subscribe;
    v?: AtomValue;
    e?: AtomError;
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
    const subscribe: Subscribe = (callback) =>
      store.sub(atom, () => {
        const signalState = (signal as Signal)[SIGNAL];
        try {
          const value = store.get(atom);
          if ('v' in signalState && !Object.is(signalState.v, value)) {
            signalState.v = value;
            callback();
          }
        } catch (e) {
          if ('e' in signalState && !Object.is(signalState.e, e)) {
            signalState.v = e;
            callback();
          }
        }
      });
    signal = {
      [SIGNAL]: { s: subscribe },
      THIS_IS_A_SIGNAL: true,
    };
    try {
      const value = store.get(atom);
      signal[SIGNAL].v = value;
    } catch (e) {
      signal[SIGNAL].e = e;
    }
    atomSignalCache.set(atom, signal);
  }
  return signal as Signal;
};
const readSignal = (signal: Signal) => {
  const signalState = signal[SIGNAL];
  if ('e' in signalState) {
    throw signalState.e; // read error
  }
  if ('v' in signalState) {
    if (signalState.v instanceof Promise) {
      return use(signalState.v) as never; // read promise
    }
    return signalState.v;
  }
  throw new Error('should not reach here');
};

export const signal = (
  atom: DisplayableAtom,
  store = getDefaultStore(),
): string => {
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
  const [, rerender] = useReducer((c) => c + 1, 0);
  const memoedSubs = useMemoList(subs);
  useEffect(() => {
    const unsubs = memoedSubs.map((sub) => sub(rerender));
    return () => unsubs.forEach((unsub) => unsub());
  }, [memoedSubs]);
  return render();
};

const findAllSignalSubs = (x: unknown): Subscribe[] => {
  if (isSignal(x)) {
    return [x[SIGNAL].s];
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
    return readSignal(x) as T;
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
    isSignal(child) ? [child[SIGNAL].s] : [],
  );
  const subsInProps = findAllSignalSubs(props);
  if (!subsInChildren.length && !subsInProps.length) {
    return createElementOrig(type, props, ...children);
  }
  const getChildren = () =>
    subsInChildren.length
      ? children.map((child) => (isSignal(child) ? readSignal(child) : child))
      : children;
  const getProps = () =>
    subsInProps.length ? fillAllSignalValues(props) : props;
  return createElementOrig(Rerenderer as any, {
    subs: [...subsInChildren, ...subsInProps],
    render: () => createElementOrig(type, getProps(), ...getChildren()),
  });
}) as typeof createElementOrig;
