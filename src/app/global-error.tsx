'use client'

import { useEffect } from 'react'
import { Honeybadger } from '@honeybadger-io/react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Displays the document-level fallback for a root layout error.
 *
 * Reports the captured error to Honeybadger whenever it changes. The retry
 * button asks Next.js to attempt to render the application again.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
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
