import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { isOnline } from './connectivity';

describe('Connectivity Store (connectivity.ts)', () => {
  it('memiliki nilai awal boolean (default true di Node/SSR)', () => {
    const value = get(isOnline);
    expect(typeof value).toBe('boolean');
  });

  it('dapat memperbarui nilai konektivitas secara reaktif', () => {
    isOnline.set(false);
    expect(get(isOnline)).toBe(false);

    isOnline.set(true);
    expect(get(isOnline)).toBe(true);
  });
});
