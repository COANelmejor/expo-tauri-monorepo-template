import { describe, expect, it } from 'vitest'
import { buildGreeting } from './greeting'

describe('buildGreeting', () => {
  it('nombra la plataforma recibida', () => {
    expect(buildGreeting({ platform: 'web' })).toBe('Hola mundo desde web')
  })

  it('usa un texto neutro cuando la plataforma viene vacía', () => {
    expect(buildGreeting({ platform: '   ' })).toBe('Hola mundo desde una plataforma desconocida')
  })
})
