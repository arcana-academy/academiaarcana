'use client'

import { useEffect } from 'react'
import { Honeybadger } from '@honeybadger-io/react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Reports an uncaught error from the root layout or template to Honeybadger and
 * renders a retry fallback.
 *
 * Selecting "Try again" asks Next.js to re-render the failed application boundary
 * through the provided reset callback.
 */
export default function Error({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
