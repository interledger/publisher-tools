import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes'

export default [
  // Root index route
  layout('./layouts/MainLayout.tsx', [
    index('routes/_index.tsx'),
    // Tool routes
    route('banner/', 'routes/banner.tsx'),
    route('link-tag/', 'routes/link-tag.tsx'),
    route('prob-revshare/', 'routes/prob-revshare.tsx'),
    route('widget/', 'routes/widget.tsx'),
    route('paywall/', 'routes/paywall.tsx'),
    route('offerwall/', 'routes/offerwall.tsx'),
  ]),
  route('grant-interaction/', 'routes/grant-interaction.tsx'),
  route('banner/preview/', 'routes/banner-preview.tsx'),
  route('paywall/preview/', 'routes/paywall-preview.tsx'),
  route('offerwall/preview/', 'routes/offerwall-preview.tsx'),
  route('widget/preview/', 'routes/widget-preview.tsx'),
  // API routes
  route('api/grant/:type', 'routes/api.grant.$type.ts'),
  route('api/profiles', 'routes/api.profiles.ts'),
  route('api/profile', 'routes/api.profile.ts'),
] satisfies RouteConfig
