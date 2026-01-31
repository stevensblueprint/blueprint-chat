import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook for auth-gated actions (regular async + streaming async generators).
 *
 * Features:
 * - withAuth: gate a Promise-based action behind auth; if not authed, redirects to login
 * - withAuthStream: gate an AsyncGenerator behind auth; if not authed, redirects to login and yields nothing
 *
 * Assumptions:
 * - useAuth() provides { isAuthenticated, login, refreshSession? } but we only need isAuthenticated + login here
 * - login() triggers Hosted UI / redirect sign-in
 */
export const useApi = () => {
  const { isAuthenticated, login } = useAuth();

  /**
   * Execute an action only if user is authenticated.
   * If not authenticated, redirects to login and saves current location.
   */
  const withAuth = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      if (!isAuthenticated) {
        sessionStorage.setItem(
          "oauth_redirect",
          window.location.pathname + window.location.search,
        );
        await login();
        return undefined;
      }

      return await action();
    },
    [isAuthenticated, login],
  );

  /**
   * Execute a streaming action only if user is authenticated.
   * If not authenticated, redirects to login and yields nothing.
   *
   * Usage:
   * for await (const chunk of withAuthStream(() => executeConverseStream(payload))) {
   *   ...
   * }
   */
  const withAuthStream = useCallback(
    async function* <T>(
      makeStream: () => AsyncGenerator<T>,
    ): AsyncGenerator<T> {
      const ok = await withAuth(async () => true);
      if (!ok) return;

      yield* makeStream();
    },
    [withAuth],
  );

  return {
    withAuth,
    withAuthStream,
    isAuthenticated,
  };
};
