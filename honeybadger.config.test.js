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

  it('uses NODE_ENV for browser deployment metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_API_KEY', 'browser-key')
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_ENV', 'staging')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_REVISION', 'browser-revision')

    const { config } = await import('./honeybadger.browser.config.js')

    expect(config).toEqual({
      apiKey: 'browser-key',
      environment: 'production',
      projectRoot: 'webpack://_N_E/./',
      revision: 'browser-revision',
    })
    expect(mocks.configure).toHaveBeenCalledOnce()
    expect(mocks.configure).toHaveBeenCalledWith(config)
    expect(mocks.debug).toHaveBeenCalledWith(
      'Honeybadger configured for browser',
    )
  })

  it('uses NODE_ENV for edge deployment metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_ENV', 'staging')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_REVISION', 'edge-revision')

    const imported = await import('./honeybadger.edge.config.js')

    expect(imported.config.environment).toBe('production')
    expect(mocks.configure).toHaveBeenCalledWith(imported.config)
    expect(mocks.debug).toHaveBeenCalledWith('Honeybadger configured for edge')
  })

  it('uses NODE_ENV for server deployment metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NODE_ENV', 'test')

    const { config } = await import('./honeybadger.server.config.js')

    expect(config.environment).toBe('test')
    expect(mocks.configure).toHaveBeenCalledWith(config)
  })

  it('falls back to the Render commit for server revision when no public revision is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_REVISION', '')
    vi.stubEnv('RENDER_GIT_COMMIT', 'render-commit')

    const { config } = await import('./honeybadger.server.config.js')

    expect(config.revision).toBe('render-commit')
  })

  it('prefers the explicit public revision over the Render commit', async () => {
    vi.stubEnv('NEXT_PUBLIC_HONEYBADGER_REVISION', 'explicit-revision')
    vi.stubEnv('RENDER_GIT_COMMIT', 'render-commit')

    const { config } = await import('./honeybadger.server.config.js')

    expect(config.revision).toBe('explicit-revision')
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

    expect(() => transformNotice()).not.toThrow()
    transformNotice(notice)

    expect(notice.backtrace[0].file).toBe(
      `${process.cwd()}/.next/server/app/page.js`,
    )
  })
})
