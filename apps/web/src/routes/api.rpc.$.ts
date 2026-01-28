import { createFileRoute } from '@tanstack/react-router'

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001'

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      ALL: async ({ request, params }) => {
        const path = params._splat || ''
        const targetUrl = `${BACKEND_URL}/rpc/${path}`

        const headers = new Headers(request.headers)
        headers.delete('host')

        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: request.method !== 'GET' && request.method !== 'HEAD'
            ? await request.text()
            : undefined,
        })

        return new Response(response.body, {
          status: response.status,
          headers: response.headers,
        })
      },
    },
  },
})
