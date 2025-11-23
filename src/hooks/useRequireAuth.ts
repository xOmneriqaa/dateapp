import { useEffect } from 'react'
import type { NavigateFn } from '@tanstack/react-router'

type RequireAuthOptions = {
  isLoaded: boolean
  isSignedIn: boolean | undefined
  navigate: NavigateFn
  redirectTo?: string
}

/**
 * Redirects guests away from protected routes while letting loading states render.
 * Returns `true` when the current view should continue rendering.
 */
export function useRequireAuth({
  isLoaded,
  isSignedIn,
  navigate,
  redirectTo = '/login',
}: RequireAuthOptions) {
  const shouldRedirect = isLoaded && !isSignedIn

  useEffect(() => {
    if (shouldRedirect) {
      void navigate({ to: redirectTo })
    }
  }, [navigate, redirectTo, shouldRedirect])

  return !shouldRedirect
}
