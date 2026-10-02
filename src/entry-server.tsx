import { Children, StrictMode, Suspense, isValidElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { HelmetServerState } from '@dr.pogodin/react-helmet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
  type RouteObject,
} from 'react-router';

import './lib/i18n';
import RootLayout from './layouts/RootLayout';
import Spinner from './components/Spinner';
import { JsonLdSiteUrlProvider } from './lib/json-ld-site-url-context';
import { routes } from './routes';

export interface RenderResult {
  html: string;
  head: string;
  status: number;
  redirect?: string;
}

const SpinnerFallback = () => (
  <div className="flex justify-center py-8 h-screen items-center">
    <Spinner />
  </div>
);

// Mirrors the layout wrapping in App.tsx so client and server render the same
// tree. Kept separate from the client `router` in App.tsx because
// createBrowserRouter touches `window` at module load and must never be
// evaluated in the SSR bundle.
const routeTree: RouteObject[] = [
  {
    element: (
      <Suspense fallback={<SpinnerFallback />}>
        <RootLayout>
          <Outlet />
        </RootLayout>
      </Suspense>
    ),
    children: routes,
  },
];

const handler = createStaticHandler(routeTree);

type LazyType = { $$typeof?: symbol; _init?: (payload: unknown) => unknown; _payload?: unknown };
const REACT_LAZY = Symbol.for('react.lazy');

/**
 * renderToString can't wait for React.lazy: a page whose chunk hasn't been
 * loaded yet (first request after a deploy) renders as an empty Suspense
 * fallback, and the browser then has to throw the HTML away. Resolve every
 * lazy component in the matched route elements (including ones wrapped in
 * guards) before rendering.
 */
async function preloadLazy(node: ReactNode, depth = 0): Promise<void> {
  if (!isValidElement(node) || depth > 8) return;
  const type = node.type as LazyType;
  if (type && type.$$typeof === REACT_LAZY && type._init) {
    try {
      type._init(type._payload);
    } catch (thrown) {
      if (thrown && typeof (thrown as PromiseLike<unknown>).then === 'function') {
        await Promise.resolve(thrown as PromiseLike<unknown>).catch(() => {});
      }
    }
  }
  const children = (node.props as { children?: ReactNode }).children;
  for (const child of Children.toArray(children)) await preloadLazy(child, depth + 1);
}

export async function render(url: string, siteOrigin?: string): Promise<RenderResult> {
  // createStaticHandler works off a WHATWG Request. We only need the pathname +
  // search; scheme/host don't affect routing. Using a stable sentinel host
  // avoids env-dependent URL parsing.
  const context = await handler.query(new Request(`http://ssr${url}`));

  // A loader/action that throws a Response (or calls redirect()) surfaces here
  // as a Response instead of a StaticHandlerContext. Forward the redirect.
  if (context instanceof Response) {
    return {
      html: '',
      head: '',
      status: context.status,
      redirect: context.headers.get('Location') ?? undefined,
    };
  }

  await Promise.all(context.matches.map((m) => preloadLazy(m.route.element as ReactNode)));

  const router = createStaticRouter(routeTree, context);
  const helmetContext: Record<string, unknown> & { helmet?: HelmetServerState } = {};
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });

  const html = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <JsonLdSiteUrlProvider siteUrl={siteOrigin ?? ''}>
            <StaticRouterProvider router={router} context={context} />
          </JsonLdSiteUrlProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );

  const h = helmetContext.helmet;
  const head = h
    ? [
        h.title?.toString() ?? '',
        h.meta?.toString() ?? '',
        h.link?.toString() ?? '',
        h.script?.toString() ?? '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  // The catch-all route renders the 404 page; send a real 404 status with it.
  const notFound = context.matches.some((m) => m.route.id === 'airo-not-found');
  return { html, head, status: notFound ? 404 : (context.statusCode ?? 200) };
}
