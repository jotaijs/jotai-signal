import { $, getValueProp, createElement } from '../src/index';

describe('basic spec', () => {
  it('should export functions', () => {
    expect($).toBeDefined();
    expect(getValueProp).toBeDefined();
    expect(createElement).toBeDefined();
  });
});
