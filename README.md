<div align="center">

# Publisher Tools

</div>

The Publisher Tools are a suite of tools designed to help content owners and publishers set up and promote Web Monetization as a model for users to support their websites.

## What are Publisher Tools?

Inspired by platforms like BuyMeACoffee and Patreon, these tools prioritize accessibility, ease of use, and low technical barriers to adoption. They allow publishers with a Web Monetization-enabled wallet to easily customize and generate embeddable components by inserting a simple script into their website's HTML.

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

- **`api/`** - Hono-based API server running on Cloudflare Workers
- **`frontend/`** - Remix-based React frontend application
- **`components/`** - Lit-based web components for publishers
- **`cdn/`** - Content delivery network package
- **`shared/`** - Shared utilities and types
  - `config-storage-service/` - Configuration and storage utilities
  - `default-data/` - Default configuration data
  - `probabilistic-revenue-share/` - Revenue sharing logic
  - `types/` - TypeScript type definitions
  - `utils/` - Common utilities
  - `defines/` - Shared constants and definitions
- **`localenv/`** - Local development environment setup

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- [pnpm](https://pnpm.io/) 9.15.9+

## Installation

1. **Install Node.js**:

   ```sh
   # For Linux/macOS
   nvm install
   nvm use

   # For Windows
   nvm install 20
   nvm use 20
   ```

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

2. **Configure your environment variables** in `.dev.vars`:

   ```env
   OP_KEY_ID="your-uuid-v4-key-here"
   OP_PRIVATE_KEY="your-base64-encoded-private-key"
   OP_WALLET_ADDRESS="https://ilp.interledger-test.dev/your-wallet"

   AWS_ACCESS_KEY_ID="your-aws-key-id"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_S3_ENDPOINT="http://localhost:8081"
   ```

### Running the Development Environment

If you're using VS Code, you can start the entire development environment with one command:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Tasks: Run Task"
3. Select "Dev" to start all development servers simultaneously

This will start the Local S3 service, CDN, API, and Frontend in parallel.

#### Manual Setup

**Frontend**:

```sh
cd frontend
pnpm dev
```

**API**:

```sh
cd api
pnpm dev
```

**Local S3 Service**:

```sh
cd localenv/s3
pnpm dev
```

## Technology Stack

- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 9.15.9
- **Frontend**: React 19 with Remix framework
- **API**: Hono framework on Cloudflare Workers
- **Components**: Lit web components
- **Styling**: TailwindCSS
- **Language**: TypeScript 5.9.2
- **Payments**: Interledger Open Payments protocol

## Available Scripts

From the root directory:

- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm lint` - Lint and fix code with ESLint
- `pnpm lint:check` - Check linting without fixing
- `pnpm typecheck` - Run TypeScript type checking across all packages
