import { signal, createElement } from '../src/index';

describe('basic spec', () => {
  it('should export functions', () => {
    expect(signal).toBeDefined();
    expect(createElement).toBeDefined();
  });
});
