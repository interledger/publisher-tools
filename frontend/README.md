# Publisher Tools - Frontend

This package contains the Remix frontend application for the Publisher Tools, providing a user-friendly dashboard for publishers to configure and manage monetization on their websites.

## Core Features

The dashboard allows users to customize and generate code for the following tools:

*   **Index (`/`):** The main landing page that offers an overview of the available monetization tools.
*   **Banner (`/banner`):** A tool to create a customizable notification banner that can be displayed on a publisher's website, often used to inform users about monetization or request consent.
*   **Widget (`/widget`):** A configuration page for the monetization widget, which provides users with a clear and interactive way to make payments or donations.
*   **Link Tag (`/link-tag`):** A simple tool for generating a monetized `<link>` tag, which can be embedded in a website to enable Web Monetization.
*   **Probabilistic Revshare (`/prob-revshare`):** A UI for setting up probabilistic revenue sharing, allowing publishers to distribute incoming payments among multiple recipients based on assigned weights.
*   **Payment Confirmation (`/payment-confirmation`):** A dedicated page to display the status of a payment to the user. Embedded tools may redirect users to this page after a payment is completed or fails.

The application also includes API routes (e.g., `api.config.$type.ts`) that are handled by the Remix server to manage configuration and other backend tasks.

## Development

To run the frontend application for local development, use the `dev` script from the project root:

```sh
pnpm -C frontend dev
```
