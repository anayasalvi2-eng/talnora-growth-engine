/**
 * Local Hono environment type for the fullstack template.
 *
 * This stays local to the template so the shared Vite reference can remain
 * aligned with upstream VibeSDK.
 */

export type { Env } from '../core-utils';

export type AppEnv = {
  Bindings: import('../core-utils').Env;
  Variables: Record<string, unknown>;
};
