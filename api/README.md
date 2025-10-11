# Publisher Tools - API

This package contains the Hono-based API server that powers the Publisher Tools. It runs on Cloudflare Workers and is responsible for fetching tool configurations, handling Open Payments, and managing probabilistic revenue sharing.

## Endpoints

The API exposes endpoints related to the following functionalities:

*   **Tool Configuration:** Handles fetching the configuration for the monetization tools (see `src/routes/get-config.ts`).
*   **Payments:** Manages the Open Payments flow (see `src/routes/payment.ts`).
*   **Probabilistic Revshare:** Handles logic related to probabilistic revenue sharing (see `src/routes/probabilistic-revshare.ts`).

## Development

To run the API server for local development, you can use the `dev` script from the project root:

```sh
pnpm -C api dev
```

This will start the Cloudflare Wrangler development server, which automatically reloads on file changes.
