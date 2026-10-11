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
export default function Error({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <main className="aa-page" role="alert" aria-labelledby="global-error-title">
          <h1 id="global-error-title">Não foi possível carregar a Academia Arcana</h1>
          <p>Ocorreu um erro inesperado. Tente novamente para continuar.</p>
          <button className="aa-button aa-button-primary" type="button" onClick={() => reset()}>
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
