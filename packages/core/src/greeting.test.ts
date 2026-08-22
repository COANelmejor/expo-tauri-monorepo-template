import { describe, expect, it } from 'vitest'
import { buildGreeting } from './greeting'

describe('buildGreeting', () => {
  it('names the platform it receives', () => {
    expect(buildGreeting({ platform: 'web' })).toBe('Hello world from web')
  })

  it('falls back to neutral text when the platform is blank', () => {
    expect(buildGreeting({ platform: '   ' })).toBe('Hello world from an unknown platform')
  })
})
