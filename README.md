# Publisher Tools

<a href="#what-are-publisher-tools">
  <img src="https://github.com/user-attachments/assets/f3776c29-e64d-439d-8321-6b9a03773a9d" alt="publisher tools preview image">
</a>

## What are publisher tools?

The publisher tools are a suite of tools designed to help content owners and publishers set up and promote Web Monetization as a model for users to support their websites.

Inspired by platforms like BuyMeACoffee and Patreon, these tools prioritize accessibility, ease of use, and low technical barriers to adoption. They allow publishers with a Web Monetization-enabled wallet to easily customize and generate embeddable components by inserting a simple script into their website’s HTML.

For additional information, check out the [publisher tools architecture diagram](https://github.com/interledger/web-publisher/blob/25fff6ab48b052ac1190cf3734cb96aba99ed9a2/docs/flow.png?raw=true).

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Interledger Website](https://interledger.org)
- [Payment pointers](https://paymentpointers.org/)
- [Web monetization](https://webmonetization.org/)

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Local Development Environment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [NVM](https://github.com/nvm-sh/nvm)

### Environment Setup

```sh
# Install Node 20
nvm install lts/iron
nvm use lts/iron

# Install pnpm using Corepack
corepack enable
```

If you do not have `corepack` installed locally you can use `npm` or `yarn` to install `pnpm`:

```sh
npm install pnpm -g
# or
yarn install pnpm -g
```

For alternative methods of installing `pnpm`, you can refer to the [official `pnpm` documentation](https://pnpm.io/installation).

To install dependencies, execute:

```sh
pnpm i
```

### HTTPS (required)

The app needs to run with HTTPS, for this you need to generate a self-signed certificate and key.
You can use OpenSSL for this.

Install OpenSSL (if you don't already have it):

- Windows: Download and install OpenSSL from [here](https://slproweb.com/products/Win32OpenSSL.html 'here').
- Mac: Use brew install openssl.
- Linux: Install it via your package manager (e.g: sudo apt install openssl ).

Generate the Certificate:
From the project root, run the following command in your terminal:

```sh
openssl req -x509 -newkey rsa:2048 -keyout ./certs/key.pem -out ./certs/cert.pem -days 365 -nodes
```

> **Note**
> The script will prompt for Country, address, organization, etc. As a minimum requirement specify Country (2 letter code) and Organization
> for the rest you can add . (dot) to set them as empty value

### Environment Variables

For the Publisher tools to function locally, it is also necessary to configure the environment variables appropriately. You must duplicate the example environment file, `.env.example`, into your local environment file, `.env`.

> **Note**
> The local environment file (`.env`) is **NOT** tracked in the version control system, and should **NOT** be included in any commits.

Navigate to the project's root directory and enter the following command:

```sh
cp ./docker/dev/.env.example ./docker/dev/.env
```

Using your preferred text editor, open the `./docker/dev/.env` file and configure the necessary environment variables.

The set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` you need to:

- Sign in to the AWS Management Console.
- Navigate to IAM (Identity and Access Management).
- In the left sidebar, select Users, then click the desired user.
- Go to the Security credentials tab.
- Scroll down to Access keys and click Create access key.

To start the containers (in docker)

```sh
pnpm localenv:start
```

to stop them:

```sh
pnpm localenv:stop
```
