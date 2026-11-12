import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const host = env.DEV_HOST || 'localhost';
  const port = env.DEV_PORT ? Number(env.DEV_PORT) : 5173;

  const previewHost = env.PREVIEW_HOST || 'localhost';
  const previewPort = env.PREVIEW_PORT ? Number(env.PREVIEW_PORT) : 4173;

  const hmrHost = env.HMR_HOST || host;
  const hmrPort = env.HMR_PORT ? Number(env.HMR_PORT) : undefined;

  const devAllowedHosts = env.DEV_ALLOWED_HOSTS
    ? env.DEV_ALLOWED_HOSTS.split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : undefined;

  const previewAllowedHosts =
    env.PREVIEW_ALLOWED_HOSTS || env.PREVIEW_ALLOWED_HOST || env.DEV_ALLOWED_HOSTS
      ? (env.PREVIEW_ALLOWED_HOSTS || env.PREVIEW_ALLOWED_HOST || env.DEV_ALLOWED_HOSTS)
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean)
      : undefined;

  const hmrClientPort = env.HMR_CLIENT_PORT ? Number(env.HMR_CLIENT_PORT) : undefined;
  const hmrConfig = hmrClientPort
    ? {
        protocol: env.HMR_PROTOCOL || 'wss',
        host: env.HMR_HOST || host,
        clientPort: hmrClientPort
      }
    : { host: hmrHost, port: hmrPort };

  return {
    plugins: [tailwindcss(), sveltekit()],
    server: {
      host,
      port,
      strictPort: true,
      ...(devAllowedHosts && devAllowedHosts.length > 0 ? { allowedHosts: devAllowedHosts } : {}),
      hmr: hmrConfig
    },
    preview: {
      host: previewHost,
      port: previewPort,
      strictPort: true,
      ...(previewAllowedHosts && previewAllowedHosts.length > 0
        ? { allowedHosts: previewAllowedHosts }
        : {})
    },
    test: {
      expect: { requireAssertions: true },
      projects: [
        {
          extends: './vite.config.ts',
          test: {
            name: 'client',
            browser: {
              enabled: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }]
            },
            include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
            exclude: ['src/lib/server/**'],
            setupFiles: ['./vitest-setup-client.ts']
          }
        },
        {
          extends: './vite.config.ts',
          test: {
            name: 'server',
            environment: 'node',
            include: ['src/**/*.{test,spec}.{js,ts}'],
            exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
          }
        }
      ]
    }
  };
});
