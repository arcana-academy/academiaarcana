'use client'

import { useEffect } from 'react'
import { Honeybadger } from '@honeybadger-io/react'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Displays the fallback for an uncaught route-segment error.
 *
 * Reports the captured error to Honeybadger whenever it changes. The retry
 * button asks Next.js to attempt to render the segment again.
 */
export default function ErrorFallback({ error, reset }: ErrorProps) {
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
