import { $, atomSignal, createElement } from '../src/index';

describe('basic spec', () => {
  it('should export functions', () => {
    expect($).toBeDefined();
    expect(atomSignal).toBeDefined();
    expect(createElement).toBeDefined();
  });
});
