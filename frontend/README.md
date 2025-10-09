# Publisher Tools - Frontend

This package is the Remix frontend application for the Publisher Tools. It provides the dashboard where publishers configure the monetization tools for their websites.

## Core Features

The dashboard allows users to customize and generate code for the following tools:

*   **Index (`/`):** The main landing page for the tools.
*   **Banner (`/banner`):** Configuration page for the notification banner.
*   **Widget (`/widget`):** Configuration page for the monetization widget.
*   **Link Tag (`/link-tag`):** Page for generating a monetized link tag.
*   **Probabilistic Revshare (`/prob-revshare`):** UI for setting up probabilistic revenue sharing.
*   **Payment Confirmation (`/payment-confirmation`):** A page to show payment status. Embeds from site may redirect users to this page after a payment.

The application also includes API routes (e.g., `api.config.$type.ts`) that are handled by the Remix server.

## Development

To run the frontend application for local development, use the `dev` script.

**From the project root:**
```sh
pnpm -C frontend dev
```

**From this directory (`frontend/`):**
```sh
pnpm dev
```

This will start the Remix development server, typically available at `http://localhost:3000`.

### Available Scripts

*   `pnpm dev`: Starts the local development server.
*   `pnpm build`: Builds the application for production.
*   `pnpm typecheck`: Runs the TypeScript compiler to check for type errors.
*   `pnpm deploy`: Deploys the application to Cloudflare Pages.
