import { lazyRouteComponent, type AsyncRouteComponent } from '@tanstack/vue-router';
import { defineComponent, h, type Component } from 'vue';

const MODULE_NOT_FOUND_PREFIXES = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
];

function isModuleNotFoundError(error: unknown) {
  const message = (error as { message?: unknown } | null)?.message;
  return (
    typeof message === 'string' &&
    MODULE_NOT_FOUND_PREFIXES.some((prefix) => message.startsWith(prefix))
  );
}

const ROUTER_RELOAD_KEY_PREFIX = 'tanstack_router_reload:';

// shortcut: depends on the private key prefix of @tanstack/vue-router 1.170.42 and on the router
// writing the key only in a mounted component's `setup` (lazyRouteComponent.js:55-63); recheck on a router upgrade.
function routerCanReload() {
  // offline, the reload would land on the browser's offline page instead of the app
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    if (typeof sessionStorage === 'undefined') return false;
    sessionStorage.getItem(ROUTER_RELOAD_KEY_PREFIX); // a blocked read throws here
    for (let index = 0; index < sessionStorage.length; index += 1) {
      if (sessionStorage.key(index)?.startsWith(ROUTER_RELOAD_KEY_PREFIX)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Lazy route page. The router reloads once on a stale chunk; after that the error shows in `RouteError`.
 * `toProps` runs once in `setup` and returns a getter, e.g.
 * `() => { const search = route.useSearch(); return () => search.value; }`.
 */
export function lazyPage(
  importer: () => Promise<{ default: Component }>,
  toProps?: () => () => Record<string, unknown>,
) {
  const guardedImporter = () =>
    importer().catch((error: unknown) => {
      if (!isModuleNotFoundError(error) || routerCanReload()) throw error;
      throw new Error('The page failed to load. Reload the page.', { cause: error });
    });
  // the importer's module is a .vue default export, which the router's callable-component typing rejects
  const page = lazyRouteComponent(guardedImporter) as AsyncRouteComponent<Record<string, unknown>>;
  if (!toProps) return page;

  const wrapper = defineComponent({
    name: 'LazyPage',
    setup() {
      const getProps = toProps();
      return () => h(page, getProps());
    },
  });
  // `preload` becomes undefined on the page after its first load, so read it live
  Object.defineProperty(wrapper, 'preload', { get: () => page.preload });
  return wrapper;
}
