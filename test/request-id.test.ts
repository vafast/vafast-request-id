import { describe, it, expect, vi } from 'vitest'
import { requestId, getRequestId } from '../src'

describe('requestId middleware', () => {
  it('should generate UUID by default', async () => {
    const middleware = requestId()
    const req = new Request('http://localhost/test')
    
    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await middleware(req, next)
    
    expect(next).toHaveBeenCalled()
    expect(response.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('should use custom generator', async () => {
    let counter = 0
    const middleware = requestId({
      generator: () => `custom-${++counter}`,
    })
    
    const req = new Request('http://localhost/test')
    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await middleware(req, next)
    
    expect(response.headers.get('X-Request-Id')).toBe('custom-1')
  })

  it('should use custom header name', async () => {
    const middleware = requestId({
      headerName: 'X-Correlation-Id',
    })
    
    const req = new Request('http://localhost/test')
    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await middleware(req, next)
    
    expect(response.headers.get('X-Correlation-Id')).toBeTruthy()
    expect(response.headers.get('X-Request-Id')).toBeNull()
  })

  it('should reuse existing ID from request header', async () => {
    const middleware = requestId()
    const req = new Request('http://localhost/test', {
      headers: { 'X-Request-Id': 'existing-id-123' },
    })
    
    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await middleware(req, next)
    
    expect(response.headers.get('X-Request-Id')).toBe('existing-id-123')
  })

  it('should not reuse existing ID when useExisting is false', async () => {
    const middleware = requestId({ useExisting: false })
    const req = new Request('http://localhost/test', {
      headers: { 'X-Request-Id': 'existing-id-123' },
    })
    
    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await middleware(req, next)
    
    expect(response.headers.get('X-Request-Id')).not.toBe('existing-id-123')
  })

  it('should attach id to request object', async () => {
    const middleware = requestId()
    const req = new Request('http://localhost/test')
    
    let capturedReq: Request | null = null
    const next = vi.fn().mockImplementation(() => {
      capturedReq = req
      return Promise.resolve(new Response('OK'))
    })
    
    await middleware(req, next)
    
    expect(getRequestId(capturedReq!)).toBeTruthy()
  })

  it('should use different header for existing ID', async () => {
    const middleware = requestId({
      headerName: 'X-Request-Id',
      existingHeaderName: 'X-Trace-Id',
    })
    
    const req = new Request('http://localhost/test', {
      headers: { 'X-Trace-Id': 'trace-123' },
    })
    
    const next = vi.fn().mockResolvedValue(new Response('OK'))
    
    const response = await middleware(req, next)
    
    expect(response.headers.get('X-Request-Id')).toBe('trace-123')
  })
})

