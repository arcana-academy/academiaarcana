import Honeybadger from '@honeybadger-io/js'

export const config = {
  apiKey: process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY,
  environment: process.env.RENDER === 'true' ? (process.env.IS_PULL_REQUEST === 'true' ? 'preview' : process.env.NODE_ENV) : process.env.NODE_ENV,
  revision: process.env.NEXT_PUBLIC_HONEYBADGER_REVISION,
  projectRoot: 'webpack://_N_E/./',
  // debug: true,
  // reportData: true,
}

Honeybadger.configure(config)
Honeybadger.logger.debug('Honeybadger configured for edge')
