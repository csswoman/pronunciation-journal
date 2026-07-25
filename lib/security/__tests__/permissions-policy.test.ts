import { describe, expect, it } from 'vitest'

import nextConfig from '../../../next.config.mjs'

describe('Permissions-Policy', () => {
  it('allows same-origin microphone capture while keeping unrelated sensors disabled', async () => {
    if (!nextConfig.headers) throw new Error('Expected global security headers')
    const rules = await nextConfig.headers()
    const globalRule = rules.find((rule) => rule.source === '/:path*')
    const policy = globalRule?.headers.find(
      (header) => header.key === 'Permissions-Policy'
    )?.value

    expect(policy).toContain('microphone=(self)')
    expect(policy).toContain('camera=()')
    expect(policy).toContain('geolocation=()')
    expect(policy).not.toContain('microphone=()')
  })
})
