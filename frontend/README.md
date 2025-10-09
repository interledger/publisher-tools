# Publisher Tools - Frontend

This package is the Remix frontend application for the Publisher Tools. It provides the dashboard where publishers configure the monetization tools for their websites.

## Core Features

The dashboard allows users to customize and generate code for the following tools:

*   **Index (`/`):** The main landing page for the tools.
*   **Banner (`/banner`):** Configuration page for the notification banner.
*   **Widget (`/widget`):** Configuration page for the monetization widget.
*   **Link Tag (`/link-tag`):** Page for generating a monetized link tag.
*   **Probabilistic Revshare (`/prob-revshare`):** UI for setting up probabilistic revenue sharing.
*   **Payment Confirmation (`/payment-confirmation`):** A page to confirm payment status.

The application also includes API routes (e.g., `api.config.$type.ts`) that are handled by the Remix server.

## Development

To run the frontend application for local development, use the `dev` script from the project root:

```sh
pnpm -C frontend dev
```

This will start the Remix development server, typically available at `http://localhost:3000`.
