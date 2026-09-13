'use client'

import { useEffect } from 'react'
import { Honeybadger } from '@honeybadger-io/react'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Reports an uncaught error from this route segment's child components to Honeybadger
 * and renders a retry fallback.
 *
 * Selecting "Try again" asks Next.js to re-render the failed segment through the
 * provided reset callback.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
