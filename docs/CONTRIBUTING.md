# Contributing

Thank you for contributing to the publisher tools :tada: Your contributions are essential to making this project better.

The Publisher Tools are no longer being proactively developed by the Interledger Foundation in terms of new features or integrations. We are maintaining the existing code and the tools will remain open source and available to use.

We are moving to a community-led model and welcome code contributions, including the development of new features. All code will be reviewed by the Interledger Foundation.

The Web Monetization standard will continue to be actively stewarded by the foundation.

## Before you begin

- Have you read the [code of conduct](CODE_OF_CONDUCT.md)?
- Check out the [existing issues](https://github.com/interledger/publisher-tools/issues) & see if we [accept contributions](#types-of-contributions) for your type of issue.

## Types of contributions

### :mega: Discussions, ideas & features

We use [GitHub discussions](https://github.com/interledger/publisher-tools/discussions) to discuss the tools, questions and ideas. You can either participate in existing discussions or create a new one. Actionable outcomes can then be transferred to [issues](https://github.com/interledger/publisher-tools/issues).

### :bug: Bugs

Found a bug? Please report it as an [issue](https://github.com/interledger/publisher-tools/issues/new?template=bug.yml).

Please include:

- A clear and descriptive title.
- A detailed description of the issue, including steps to reproduce if applicable.
- Information about your environment (e.g., operating system, browser, version).
- Any relevant screenshots or error messages.

### :hammer_and_wrench: Pull requests

Feel free to fork and create a pull request for [existing issues](https://github.com/interledger/publisher-tools/issues). If you have an idea, please create a [discussion](https://github.com/interledger/publisher-tools/discussions) first. This makes sure that the contribution is impactful and you don't spend time creating a PR that we will not accept.

Ensure your PR includes a clear title and description following the [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/).

If your PR addresses an issue, reference the issue in the description using `Closes #123`.

Project maintainers will review your PR for code quality, correctness, and adherence to guidelines as soon as possible. Please respond to any feedback and make necessary changes.

### :books: Documentation

Found an issue in the documentation? Please head over to the [website](https://github.com/WICG/webmonetization) repository.

## Development

### Project structure & technology stack

This is a monorepo containing several packages:

- **`api/`** - Hono-based API server running on Cloudflare Workers. Used by tools embedded on websites to fetch their config, handle payments, and manage probabilistic revenue sharing.
- **`frontend/`** - React Router (framework mode) React frontend. Provides the configuration interface where publishers customize their Web Monetization tools (banners, widgets, link tags).
- **`components/`** - Lit-based web components for publishers. Contains reusable web components that get embedded into publisher websites.
- **`cdn/`** - Content delivery network package. Delivers the embeddable scripts and their related assets that publishers include on their websites to show monetization tools.
- **`shared/`** - Shared utilities and types
- **`localenv/`** - Local development environment setup. Provides local S3 simulation for testing configuration storage during development.

### Pre-requisites

You need to have Node 24 installed. See this [complete setup guide](https://gist.github.com/sidvishnoi/f795887659f5bec32f01a7ec9e788fc1) for installing Node.js and nvm on any platform.

Then enable pnpm

```sh
corepack enable
```

or install it manually:

```sh
npm install -g pnpm
```

### Install dependencies

```sh
pnpm i
```

### Environment configuration

1. **Copy the environment file**:

   ```sh
   cp .env.sample .dev.vars
   ```

2. **Configure your environment variables** in `.dev.vars`

   📖 For detailed setup instructions for each variable, see [env-vars.md](./docs/env-vars.md)

### Running the development environment

If you're using VS Code, you can start the entire development environment with one command:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Tasks: Run Task"
3. Select "Dev" to start all development servers simultaneously

This will start the Local S3 service, CDN, API, and Frontend in parallel.\
You can also run the "default build task" with a keyboard shortcut.

#### Manual setup

Alternatively, you can start each service yourself.

```sh
pnpm -C frontend dev
pnpm -C api dev
pnpm -C cdn dev
pnpm -C localenv/s3 dev
```

### Code quality

All the code quality tools used in the project are installed and configured at the root.
This allows for consistency across the monorepo. This allows new packages to be added with
minimal configuration overhead.

We try not to put config files in workspaces, unless absolutely necessary.

Typescript config at the root is intended to be a base config that should be extended by
each package to suit the package's requirements.

#### Example commands

- `pnpm format` - Format code with Prettier
- `pnpm lint` - Lint and fix code with ESLint
- `pnpm typecheck` - Run TypeScript type checking across all packages

### CI

We use GitHub actions to manage our CI pipeline.

The workflows can be found in `.github/workflows`

### How to preview changes

For contributors without write access to the repository, deployment previews on PRs are not automatic.
