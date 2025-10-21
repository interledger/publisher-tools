import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  // Root index route
  index('routes/_index.tsx'),
  // Tool routes
  route('banner/', 'routes/banner.tsx'),
  route('link-tag/', 'routes/link-tag.tsx'),
  route('payment-confirmation/', 'routes/payment-confirmation.tsx'),
  route('prob-revshare/', 'routes/prob-revshare.tsx'),
  route('widget/', 'routes/widget.tsx'),
  // API routes
  route('api/config/:type', 'routes/api.config.$type.ts'),
  route('api/grant/:type', 'routes/api.grant.$type.tsx')
] satisfies RouteConfig
