# Contributing to this repository <!-- omit in toc -->

## Getting started <!-- omit in toc -->

Thank you for contributing to Publisher tools :tada: Your contributions are essential to making this project better.

## Before you begin

- Have you read the [code of conduct](CODE_OF_CONDUCT.md)?
- Check out the [existing issues](https://github.com/interledger/publisher-tools/issues) & see if we [accept contributions](#types-of-contributions) for your type of issue.

## Table of Contents <!-- omit in toc -->

- [Types of contributions](#types-of-contributions)
  - [:mega: Discussions](#mega-discussions)
  - [:hammer_and_wrench: Pull requests](#hammer_and_wrench-pull-requests)
  - [:books: Documentation](#books-documentation)
- Working in the test network repository
  - [Labels](#labels)
  - [Code quality](#code-quality)
    - [Linting](#linting)
    - [Formatting](#formatting)
    - [Testing](#testing)
    - [Language](#language)
    - [CI](#ci)
  - [Reporting Issues](#reporting-issues)
  - [Submitting Pull Requests](#submitting-pull-requests)
  - [Review Process](#review-process)

## Types of contributions

You can contribute to Test Wallet and e-commerce in several ways.

### :mega: Discussions

Discussions are where we have conversations about Test network.

If you would like to discuss topics about the broader ecosystem, have a new idea, or want to show off your work - join us in [discussions](https://github.com/interledger/publisher-tools/discussions).

### :hammer_and_wrench: Pull requests

Feel free to fork and create a pull request on changes you think you can contribute.

The team will review your pull request as soon as possible.

### :books: Documentation

The project is new and available documentation is a work in progress.

## Working in the Publisher tools repository

This project uses `pnpm`. A list of steps for setting up a [local development environment](https://github.com/interledger/publisher-tools#local-development-environment) can be found in the Readme.

> **Warning**
> DO NOT use `npm install`. This will cause the project to spontaneously self-destruct :boom:.

### Labels

We use labels to communicate the intention of issues and PRs.

- `package: wallet/*` prefix denotes issues that are partaining the wallet application (frontend and backend);
- `priority:` prefix denotes pirority of issues.
- `type:` prefix denotes the type of issues/PRs, ex. type:story represents a bigger issue with subtasks.

Some labels will be automatically assigned to issues/PRs.

### Code quality

All the code quality tools used in the project are installed and configured at the root.
This allows for consistency across the monorepo. Allows new packages to be added with
minimal configuration overhead.

We try not to put config files in workspaces, unless absolutely necessary.

#### Linting

[Eslint](https://eslint.org/) is used for linting.

```shell
./.eslintrc.js # config
./.eslintignore # ignore file
```

Eslint config should not be overridden in any packages.

#### Formatting

[Prettier](https://prettier.io/) is used for formatting.

```shell
./.prettierrc.js # config
./.prettierignore # ignore file
```

Prettier config should not be overridden in any packages.

#### Testing

[Jest](https://jestjs.io/) is used for unit and integration testing.

#### Language

[Typescript](https://www.staging-typescript.org/) is the chosen language.

```shell
./tsconfig.base.json # config
```

Typescript config at the root is intended to be a base config that should be extended by
each package to suit the package's requirements.

#### CI

We use GitHub actions to manage our CI pipeline.

The workflows can be found in `.github/workflows`

### Reporting Issues

If you encounter any issues or have a feature request, please [create a new issue](https://github.com/interledger/publisher-tools/issues/new) and provide the following details:

- A clear and descriptive title.
- A detailed description of the issue, including steps to reproduce if applicable.
- Information about your environment (e.g., operating system, browser, version).
- Any relevant screenshots or error messages.

### Submitting Pull Requests

1. [Fork](https://github.com/interledger/publisher-tools) the repository.
2. Create a new branch from `main`.
3. Make your changes and commit them.
4. Create a pull request (PR) to `main`.
5. Ensure your PR includes a clear title and description following the [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/).
6. If your PR addresses an issue, reference the issue in the description using `Closes #123`.
7. Be patient and be prepared to address feedback and make changes if needed.

### Review Process

- Project maintainers will review your PR for code quality, correctness, and adherence to guidelines.
- Please respond to any feedback promptly and make necessary changes.
- Once the PR is approved, it will be merged into the main branch.

Happy coding!
