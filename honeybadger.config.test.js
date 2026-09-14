import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  beforeNotify: vi.fn(),
  configure: vi.fn(),
  debug: vi.fn(),
}))

vi.mock('@honeybadger-io/react', () => ({
  Honeybadger: {
    configure: mocks.configure,
    logger: { debug: mocks.debug },
  },
}))

vi.mock('@honeybadger-io/js', () => ({
  default: {
    beforeNotify: mocks.beforeNotify,
    configure: mocks.configure,
    logger: { debug: mocks.debug },
  },
}))

describe('Honeybadger runtime configuration', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.configure.mockReturnValue({ beforeNotify: mocks.beforeNotify })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('configures the browser runtime with public deployment metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_API_KEY', 'browser-key')
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_REVISION', 'browser-revision')
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NODE_ENV', 'test')

    const { config } = await import('./honeybadger.browser.config.js')

    expect(config).toEqual({
      apiKey: 'browser-key',
      environment: 'preview',
      projectRoot: 'webpack://_N_E/./',
      revision: 'browser-revision',
    })
    expect(mocks.configure).toHaveBeenCalledOnce()
    expect(mocks.configure).toHaveBeenCalledWith(config)
    expect(mocks.debug).toHaveBeenCalledWith(
      'Honeybadger configured for browser',
    )
  })

  it('falls back through server deployment and Node environments at the edge', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '')
    vi.stubEnv('VERCEL_ENV', 'staging')
    vi.stubEnv('NODE_ENV', 'test')

    let imported = await import('./honeybadger.edge.config.js')
    expect(imported.config.environment).toBe('staging')

    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('VERCEL_ENV', '')

    imported = await import('./honeybadger.edge.config.js')
    expect(imported.config.environment).toBe('test')
    expect(mocks.configure).toHaveBeenCalledWith(imported.config)
    expect(mocks.debug).toHaveBeenCalledWith('Honeybadger configured for edge')
  })

  it('rewrites server backtrace files to their hosted asset locations', async () => {
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_ASSETS_URL', 'https://assets.example.test')

    const { config } = await import('./honeybadger.server.config.js')

    expect(config.projectRoot).toBe('webpack:///./')
    expect(mocks.configure).toHaveBeenCalledWith(config)
    expect(mocks.beforeNotify).toHaveBeenCalledOnce()
    expect(mocks.debug).toHaveBeenCalledWith('Honeybadger configured for server')
    const transformNotice = mocks.beforeNotify.mock.calls[0][0]
    const notice = {
      backtrace: [
        { file: `${process.cwd()}/.next/server/app/page.js` },
        { file: 'node:internal/process/task_queues' },
        {},
      ],
    }

    transformNotice(notice)

    expect(notice.backtrace).toEqual([
      { file: 'https://assets.example.test/../app/page.js' },
      { file: 'node:internal/process/task_queues' },
      {},
    ])
  })

  it('leaves notices untouched when no asset URL is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_ASSETS_URL', '')

    await import('./honeybadger.server.config.js')

    const transformNotice = mocks.beforeNotify.mock.calls[0][0]
    const notice = {
      backtrace: [{ file: `${process.cwd()}/.next/server/app/page.js` }],
    }

    expect(() => transformNotice(undefined)).not.toThrow()
    transformNotice(notice)

    expect(notice.backtrace[0].file).toBe(
      `${process.cwd()}/.next/server/app/page.js`,
    )
  })
})
