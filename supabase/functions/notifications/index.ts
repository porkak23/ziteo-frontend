// notifications/index.ts — router for Web Push edge functions
// Routes:
//   POST /notifications/send-push     → single-user push
//   POST /notifications/broadcast-push → bulk push to all providers in a city
import { handleOptions, errorResponse } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions(req)

  const path = new URL(req.url).pathname

  if (path.endsWith('/send-push') || path.endsWith('/notifications')) {
    const { default: handler } = await import('./send-push/index.ts')
    return handler(req)
  }

  if (path.endsWith('/broadcast-push')) {
    const { default: handler } = await import('./broadcast-push/index.ts')
    return handler(req)
  }

  return errorResponse('NOT_FOUND', 'Unknown notifications sub-route', 404, req)
})
