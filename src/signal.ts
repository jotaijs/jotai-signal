/// <reference types="react/experimental" />

import ReactExports from 'react';
import { getDefaultStore } from 'jotai/vanilla';
import type { Atom, WritableAtom } from 'jotai/vanilla';
import { createReactSignals } from 'create-react-signals';

type AnyAtom = Atom<unknown>;
type AnyWritableAtom = WritableAtom<unknown, unknown[], unknown>;

const isActuallyWritableAtom = (atom: AnyAtom): atom is AnyWritableAtom =>
  !!(atom as AnyWritableAtom).write;

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
type GetValue = () => unknown;
type SetValue = (path: unknown[], value: unknown) => void;

const createSignal = (
  atom: AnyAtom,
  store: Store,
): [Subscribe, GetValue, SetValue] => {
  const sub: Subscribe = (callback) => store.sub(atom, callback);
  const get: GetValue = () => store.get(atom);
  const set: SetValue = (path, value) => {
    if (!isActuallyWritableAtom(atom)) {
      throw new Error('Not writable atom');
    }
    if (path.length !== 0) {
      throw new Error('Updating subpath is not supported.');
    }
    store.set(atom, value);
  };
  return [sub, get, set];
};

const { getSignal, createElement } = createReactSignals(createSignal, use);

export { createElement };

export function $<T>(atom: Atom<T>, store?: Store): Awaited<T>;

export function $<T>(atom: Atom<T>, store = getDefaultStore()) {
  return getSignal(atom, store);
}
