import { $, createElement } from '../src/index';

describe('basic spec', () => {
  it('should export functions', () => {
    expect($).toBeDefined();
    expect(createElement).toBeDefined();
  });
});
