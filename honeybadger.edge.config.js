import Honeybadger from '@honeybadger-io/js'

export const config = {
  apiKey: process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY,
  environment: process.env.NEXT_PUBLIC_RENDER_ENV || process.env.RENDER_ENVIRONMENT || process.env.NODE_ENV,
  revision: process.env.NEXT_PUBLIC_HONEYBADGER_REVISION,
  projectRoot: 'webpack://_N_E/./',
}

Honeybadger.configure(config)
Honeybadger.logger.debug('Honeybadger configured for edge')
