import { describe, expect, it } from 'vitest';
import { VERSION } from './index';

describe('package entry', () => {
  it('exports the placeholder version', () => {
    expect(VERSION).toBe('0.0.0');
  });
});
