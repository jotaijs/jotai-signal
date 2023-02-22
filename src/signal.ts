/// <reference types="react/experimental" />

import ReactExports from 'react';
import { atom, getDefaultStore } from 'jotai/vanilla';
import type {
  Atom,
  Getter,
  PrimitiveAtom,
  Setter,
  WritableAtom,
} from 'jotai/vanilla';
import { createReactSignals } from 'create-react-signals';

type AnyAtom = Atom<unknown>;
type AnyWritableAtom = WritableAtom<unknown, unknown[], unknown>;
type SetAtom<Args extends unknown[], Result> = <A extends Args>(
  ...args: A
) => Result;
type Read<Value, SetSelf = never> = (
  get: Getter,
  options: { readonly signal: AbortSignal; readonly setSelf: SetSelf },
) => Value;
type Write<Args extends unknown[], Result> = (
  get: Getter,
  set: Setter,
  ...args: Args
) => Result;
type WithInitialValue<Value> = {
  init: Value;
};

const isActuallyWritableAtom = (anAtom: AnyAtom): anAtom is AnyWritableAtom =>
  !!(anAtom as AnyWritableAtom).write;

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
  anAtom: AnyAtom,
  store: Store,
): readonly [Subscribe, GetValue, SetValue] => {
  const sub: Subscribe = (callback) => store.sub(anAtom, callback);
  const get: GetValue = () => store.get(anAtom);
  const set: SetValue = (path, value) => {
    if (!isActuallyWritableAtom(anAtom)) {
      throw new Error('Not writable atom');
    }
    if (path.length !== 0) {
      throw new Error('Updating subpath is not supported.');
    }
    store.set(anAtom, value);
  };
  return [sub, get, set];
};

const { getSignal, inject } = createReactSignals(
  createSignal,
  false,
  'value',
  undefined,
  use,
);

export const createElement = inject(ReactExports.createElement);

type AttachValue<T> = T & { value: T };

type Primitives = string | number | boolean | null | undefined;

export function $<T extends Primitives | Promise<Primitives>>(
  anAtom: Atom<T>,
  store?: Store,
): AttachValue<Awaited<T>>;

export function $<T>(anAtom: Atom<T>, store = getDefaultStore()) {
  return getSignal(anAtom, store);
}

// atomWithSignal util

export function atomWithSignal<Value, Args extends unknown[], Result>(
  read: Read<Value, SetAtom<Args, Result>>,
  write: Write<Args, Result>,
  store?: Store,
): WritableAtom<Value, Args, Result> &
  (Value extends Primitives ? AttachValue<Value> : never);

export function atomWithSignal<Value>(
  read: Read<Value>,
  store?: Store,
): Atom<Value> & (Value extends Primitives ? AttachValue<Value> : never);

export function atomWithSignal<Value, Args extends unknown[], Result>(
  initialValue: Value,
  write: Write<Args, Result>,
  store?: Store,
): WritableAtom<Value, Args, Result> &
  WithInitialValue<Value> &
  (Value extends Primitives ? AttachValue<Value> : never);

export function atomWithSignal<Value>(
  initialValue: Value,
  write?: never,
  store?: Store,
): PrimitiveAtom<Value> &
  WithInitialValue<Value> &
  (Value extends Primitives ? AttachValue<Value> : never);

export function atomWithSignal(read: any, write?: any, store?: any) {
  const a = atom(read, write);
  const s = $(a as any, store);
  return Object.assign(s, a) as any;
}
