import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * One QueryClient per request on the server, a singleton in the browser.
 * The 60s staleTime means a page that was server-rendered (and hydrated) does
 * NOT refetch on load or on a plain refresh — the data is considered fresh.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}
