# Publisher Tools - CDN

This package is responsible for building and delivering the final, browser-ready JavaScript assets (the banner and widget scripts) that publishers embed on their websites.

It takes the raw source code from the `@tools/components` package, bundles it using `esbuild`, and prepares it for delivery via the Cloudflare CDN.

## Build Process

The core of this package is the custom build script located at `build.js`. This script uses `esbuild` to compile the TypeScript source from `src/` and the components from the `components` package into distributable files.

The main entry points for the build are:
*   `src/banner.ts`
*   `src/widget.ts`

The output is placed in the `dist/` directory.

## Development

To build the assets and run a local development server that simulates the CDN, use the `dev` script. This will watch for file changes in both the `cdn` and `components` packages and automatically rebuild.

**From the project root:**
```sh
pnpm -C cdn dev
```

**From this directory (`cdn/`):**
```sh
pnpm dev
```

### Available Scripts

*   `pnpm dev`: Runs the development build and a local server.
*   `pnpm build`: Runs a one-time production build of all assets.
*   `pnpm deploy`: Deploys the assets to the Cloudflare CDN.
