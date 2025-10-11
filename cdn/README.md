# Publisher Tools - CDN

This package is responsible for building and delivering the final, browser-ready JavaScript assets (the banner and widget scripts) that publishers embed on their websites.

It takes the raw source code from the `@tools/components` package, bundles it using `esbuild`, and prepares it for delivery via the Cloudflare CDN.

## Build Process

The core of this package is the custom build script located at `build.js`. This script uses `esbuild` to compile the TypeScript source from `src/` and the components from the `components` package into distributable files.

The main entry points for the build are:
*   `src/banner.ts`
*   `src/widget.ts`

The output is placed in the `dist/` directory.

## Assets

This package also manages static assets required by the components, such as fonts. The build process ensures that these assets are correctly referenced and made available through the CDN. Fonts are located in the `src/assets/fonts` directory.

## Development

To build the assets and run a local development server that simulates the CDN, use the `dev` script from the project root. This will watch for file changes in both the `cdn` and `components` packages and automatically rebuild.

```sh
pnpm -C cdn dev
```
