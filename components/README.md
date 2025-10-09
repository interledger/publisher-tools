# Publisher Tools - Components

This package contains the core, embeddable web components for the Publisher Tools, built using the [Lit](https://lit.dev/) library. These components are intended to be placed on publishers' websites.

## Core Components

*   **Banner:** A notification banner that can be displayed on a publisher's site. The source is located in `src/banner.ts`.
*   **Widget:** The interactive monetization widget. Its source code is in the `src/widget/` directory.

## Build Process

This package contains the raw source code for the web components but does not have its own build process.

The components are imported and bundled by the **`cdn`** package, which is responsible for compiling them into a browser-ready format. Please see the `cdn` package for more details on the build and delivery process.

## Development

The only available script is for type checking.

**From the project root:**
```sh
pnpm -C components typecheck
```

**From this directory (`components/`):**
```sh
pnpm typecheck
```
