import { expect, test } from 'vitest';
import { $, atomSignal, createElement } from 'jotai-signal';

test('should export functions', () => {
  expect($).toBeDefined();
  expect(atomSignal).toBeDefined();
  expect(createElement).toBeDefined();
});
