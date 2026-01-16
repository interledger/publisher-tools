<h1 align="center">
Publisher Tools
</h1>

The Publisher Tools are a suite of tools designed to help content owners and publishers set up and promote Web Monetization as a model for users to support their websites.

## What are Publisher Tools?

Inspired by platforms like BuyMeACoffee and Patreon, these tools prioritize accessibility, ease of use, and low technical barriers to adoption. They allow publishers with a Web Monetization-enabled wallet to easily customize and generate embeddable components by inserting a simple script into their website's HTML.\
For detailed information about each tool and how to use them, visit the [Publisher Tools documentation](https://webmonetization.org/developers/tools/).

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Interledger Website](https://interledger.org)
- [Payment pointers](https://paymentpointers.org/)
- [Web monetization](https://webmonetization.org/)

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Project Structure

This is a monorepo containing several packages:

- **`api/`** - Hono-based API server running on Cloudflare Workers. Used by tools embedded on websites to fetch their config, handle payments, and manage probabilistic revenue sharing.
- **`frontend/`** - Remix-based React frontend application. Provides the configuration interface where publishers customize their Web Monetization tools (banners, widgets, link tags).
- **`components/`** - Lit-based web components for publishers. Contains reusable web components that get embedded into publisher websites.
- **`cdn/`** - Content delivery network package. Delivers the embeddable scripts and their related assets that publishers include on their websites to show monetization tools.
- **`shared/`** - Shared utilities and types
- **`localenv/`** - Local development environment setup. Provides local S3 simulation for testing configuration storage during development.

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [pnpm](https://pnpm.io/) 9.15.9+

## Installation

1. **Install Node.js**:

   ```sh
   # Install Node version required by the project
   # For Linux/macOS
   nvm use

   # For Windows
   nvm use 24
   ```

   **Don't have nvm?** See this [complete setup guide](https://gist.github.com/sidvishnoi/f795887659f5bec32f01a7ec9e788fc1) for installing Node.js and nvm on any platform.

2. **Enable pnpm**:

   ```sh
   corepack enable
   ```

   Or install manually:

   ```sh
   npm install -g pnpm
   ```

3. **Install dependencies**:
   ```sh
   pnpm i
   ```

## Development

### Environment Configuration

1. **Copy the environment file**:

   ```sh
   cp .env.sample .dev.vars
   ```

2. **Configure your environment variables** in `.dev.vars`

   📖 For detailed setup instructions for each variable, see [env-vars.md](./docs/env-vars.md)

### Running the Development Environment

If you're using VS Code, you can start the entire development environment with one command:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Tasks: Run Task"
3. Select "Dev" to start all development servers simultaneously

This will start the Local S3 service, CDN, API, and Frontend in parallel.\
You can also run the "default build task" with a keyboard shortcut.

#### Manual Setup

Alternatively, you can start each service manually.

```sh
pnpm -r --parallel dev
```

This will run all development servers in parallel in a single terminal.\
_For separate terminal output_, run each command in a separate terminal tab/window:

```sh
pnpm -C frontend dev
pnpm -C api dev
pnpm -C cdn dev
pnpm -C localenv/s3 dev
```

## Technology Stack

- **Runtime**: Cloudflare workers
- **Development**: Node.js
- **Package Manager**: pnpm 9.15.9
- **Frontend**: React 19 with Remix framework
- **API**: Hono framework on Cloudflare Workers
- **Components**: Lit web components
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Payments**: Interledger Open Payments protocol

## Helpful Scripts

From the root directory:

- `pnpm format` - Format code with Prettier
- `pnpm lint` - Lint and fix code with ESLint
- `pnpm typecheck` - Run TypeScript type checking across all packages

## Documentation

For detailed information on how to use and configure Publisher Tools, including Content Security Policy requirements and customization options, see the official documentation:

- [Banner Tool](https://webmonetization.org/publishers/banner-tool/)
- [Widget Tool](https://webmonetization.org/publishers/widget-tool/)
- [Link Tag Generator](https://webmonetization.org/publishers/link-tag-tool/)
- [Probabilistic revshare generator](https://webmonetization.org/publishers/revshare-tool/)
