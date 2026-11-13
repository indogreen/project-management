import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
  it('does not render content while the page load redirects', async () => {
    const { container } = await render(Page);

    expect(container.innerHTML).toBe('');
  });
});
