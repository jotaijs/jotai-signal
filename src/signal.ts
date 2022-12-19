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

type Store = ReturnType<typeof getDefaultStore>;

type Unsubscribe = () => void;
type Subscribe = (callback: () => void) => Unsubscribe;
type Read = () => unknown;

const SIGNAL = Symbol('JOTAI_SIGNAL');
type Signal = {
  [SIGNAL]: { s: Subscribe; r: Read };
};
const isSignal = (x: unknown): x is Signal => !!(x as any)?.[SIGNAL];

const createSignal = (subscribe: Subscribe, read: Read): Signal => {
  const sig = new Proxy(
    (() => {
      // empty
    }) as any,
    {
      get(_target, prop) {
        if (prop === SIGNAL) {
          return { s: subscribe, r: read };
        }
        return createSignal(subscribe, () => {
          const obj = read() as any;
          if (typeof obj[prop] === 'function') {
            return obj[prop].bind(obj);
          }
          return obj[prop];
        });
      },
      apply(_target, _thisArg, args) {
        return createSignal(subscribe, () => {
          const fn = read() as any;
          return fn(...args);
        });
      },
    },
  );
  return sig;
};

const storeCacheCache = new WeakMap<Store, WeakMap<Atom<unknown>, Signal>>();

const getAtomSignal = (store: Store, atom: Atom<unknown>): Signal => {
  let atomSignalCache = storeCacheCache.get(store);
  if (!atomSignalCache) {
    atomSignalCache = new WeakMap();
    storeCacheCache.set(store, atomSignalCache);
  }
  let sig = atomSignalCache.get(atom);
  if (!sig) {
    const subscribe: Subscribe = (callback) => store.sub(atom, callback);
    const read: Read = () => store.get(atom);
    sig = createSignal(subscribe, read);
    atomSignalCache.set(atom, sig);
  }
  return sig;
};

const subscribeSignal = (sig: Signal, callback: () => void) => {
  const { s: subscribe } = sig[SIGNAL];
  return subscribe(callback);
};

const readSignal = (sig: Signal) => {
  const { r: read } = sig[SIGNAL];
  const value = read();
  if (value instanceof Promise) {
    // HACK this could violate the rule of using `use`.
    return use(value);
  }
  return value;
};

export function signal<T>(atom: Atom<Promise<T>>, store?: Store): T;

export function signal<T>(atom: Atom<T>, store?: Store): T;

export function signal<T>(atom: Atom<T>, store = getDefaultStore()) {
  return getAtomSignal(store, atom) as Signal & T; // HACK lie type
}

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
  signals,
  render,
}: {
  signals: Signal[];
  render: () => ReactNode;
}): ReactNode => {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const memoedSignals = useMemoList(signals);
  useEffect(() => {
    const unsubs = memoedSignals.map((sig) => subscribeSignal(sig, rerender));
    return () => unsubs.forEach((unsub) => unsub());
  }, [memoedSignals]);
  return render();
};

const findAllSignals = (x: unknown): Signal[] => {
  if (isSignal(x)) {
    return [x];
  }
  if (Array.isArray(x)) {
    return x.flatMap(findAllSignals);
  }
  if (typeof x === 'object' && x !== null) {
    return Object.values(x).flatMap(findAllSignals);
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
  const signalsInChildren = children.flatMap((child) =>
    isSignal(child) ? [child] : [],
  );
  const signalsInProps = findAllSignals(props);
  if (!signalsInChildren.length && !signalsInProps.length) {
    return createElementOrig(type, props, ...children);
  }
  const getChildren = () =>
    signalsInChildren.length
      ? children.map((child) => (isSignal(child) ? readSignal(child) : child))
      : children;
  const getProps = () =>
    signalsInProps.length ? fillAllSignalValues(props) : props;
  return createElementOrig(Rerenderer as any, {
    signals: [...signalsInChildren, ...signalsInProps],
    render: () => createElementOrig(type, getProps(), ...getChildren()),
  });
}) as typeof createElementOrig;
