import { createElement } from 'jotai-signal';

export { Fragment } from 'react';

export const jsx = (type: any, props: any, key: any) => {
  const { children, ...rest } = props || {};
  if (Array.isArray(children)) {
    return createElement(type, { ...rest, key }, ...children);
  }
  return createElement(type, { ...rest, key }, children);
};

export const jsxs = jsx;
export const jsxDEV = jsx;
