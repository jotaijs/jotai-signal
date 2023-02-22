import { $, atomWithSignal, createElement } from '../src/index';

describe('basic spec', () => {
  it('should export functions', () => {
    expect($).toBeDefined();
    expect(atomWithSignal).toBeDefined();
    expect(createElement).toBeDefined();
  });
});
