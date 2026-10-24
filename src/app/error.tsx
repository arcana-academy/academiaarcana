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
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error)
  }, [error])

  return (
    <div className="aa-page" role="alert" aria-labelledby="route-error-title">
      <h2 id="route-error-title">Não foi possível carregar a página</h2>
      <p>Ocorreu um erro inesperado. Tente novamente para continuar.</p>
      <button className="aa-button aa-button-primary" type="button" onClick={() => reset()}>
        Tentar novamente
      </button>
    </div>
  )
}
