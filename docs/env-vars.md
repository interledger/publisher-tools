# Environment Variables Setup

This guide provides detailed instructions for setting up your `.dev.vars` file for local development.

First, copy the sample environment file:

```sh
cp .env.sample .dev.vars
```

Then, edit the `.dev.vars` file to set the required values as described below.

## Variables Summary

| Variable                | Description                                             | Example Value                               |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------- |
| `OP_KEY_ID`             | UUID v4 identifier for your Open Payments key.          | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`      |
| `OP_PRIVATE_KEY`        | Base64-encoded private key for signing requests.        | (See conversion script below)               |
| `OP_WALLET_ADDRESS`     | The URL of your Open Payments wallet address.           | `https://ilp.interledger-test.dev/my-wallet`  |
| `AWS_ACCESS_KEY_ID`     | AWS access key for S3. Not used in local dev.           | `ABCDEFGHIJKLMN12OPQR`                      |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3. Not used in local dev.           | `ab1cD/2e/fGhIJ11kL13mN0pQrS45tu6V7w8X9yZ` |
| `AWS_S3_ENDPOINT`       | The endpoint for the S3-compatible storage.             | `http://localhost:8081`                     |

---

## Detailed Configuration

### Open Payments Configuration

These variables are required to connect to an Interledger wallet for handling payments. For development, you can use the Interledger Testnet.

#### `OP_KEY_ID`

This is the unique identifier for your API key.

1.  Sign up for an [Interledger Testnet wallet](https://wallet.interledger-test.dev).
2.  In your wallet dashboard, navigate to the **Settings** section from the side menu and access developer keys.
3.  Generate a new key pair.
4.  Copy the **Key ID** (which is in UUID format) and paste it into your `.dev.vars` file.

#### `OP_PRIVATE_KEY`

This is the secret key used to sign payment requests, proving you own the wallet.

1.  When you generate a key pair, your wallet will provide a private key.
2.  **Important**: This key needs to be converted to a specific format. Use the script below to do this.

**Security Note**: Never commit this value to version control.

<details>
<summary><b>Click to see Private Key Conversion Script</b></summary>

After copying your private key, run this script to convert it to the correct format.\
Replace `currentKey` value string with your copied private key, then use the output as your `OP_PRIVATE_KEY` value:

```javascript
// Paste your private key from the wallet here
const currentKey = '-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----'

// This script converts the key to the required format
const derBytes = atob(
  currentKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
)
const bytes = new Uint8Array(derBytes.length)
for (let i = 0; i < derBytes.length; i++) {
  bytes[i] = derBytes.charCodeAt(i)
}
const privateKey = bytes.slice(-32)
const keyBase64 = btoa(String.fromCharCode(...privateKey))

console.log('Your new OP_PRIVATE_KEY is:')
console.log(keyBase64)
```

</details>

#### `OP_WALLET_ADDRESS`

This is the public address of your wallet where you can receive payments.

1.  In your Interledger wallet dashboard, find your payment pointer. It will look something like `$ilp.interledger-test.dev/my-wallet`.
2.  To get the wallet address, simply replace the `$` with `https://`.

For example, if your payment pointer is `$ilp.interledger-test.dev/alice`, your `OP_WALLET_ADDRESS` would be `https://ilp.interledger-test.dev/alice`.

### AWS Configuration

These variables are for connecting to an S3 bucket, which is used to store the configuration for the publisher tools. For local development, a simulated S3 service is used, so you don't need real AWS credentials.

#### `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`

For local development, these values are ignored by the local S3 simulator. You can leave the default values from `.env.sample` as they are.

#### `AWS_S3_ENDPOINT`

This tells the application where to find the S3 storage.

*   **For Development**: Use the local S3 simulator, which runs on `http://localhost:8081`. This should be the default value in your `.dev.vars`.
*   **For Production**: When deploying the application, this would be the URL of your actual S3 bucket endpoint.

---
## Development vs Production

### Development Setup

- Uses local S3 simulation via `localenv/s3`
- Uses Interledger testnet for payments
- Safe for testing and development

### Production Setup

- Requires actual AWS S3 bucket
- Uses live payment networks
- Requires proper security measures

## Troubleshooting

### Common Issues

- **"OP_KEY_ID not found"**: Ensure your key ID is a valid UUID v4 format
- **"Invalid private key"**: Verify the private key is properly base64-encoded
- **"AWS access denied"**: Check that your IAM user has the necessary S3 permissions
- **"Connection refused to localhost:8081"**: Make sure the local S3 service is running (`pnpm -C localenv/s3 dev`)

### Testing Your Configuration

After setting up your `.dev.vars`, you can test your configuration by running:

```sh
pnpm -r --parallel dev
```

Open the application on [localhost:3000](http://localhost:3000/tools/) try to use features or trigger configuration storage

## Need Help?

- Check the main [README.md](./README.md) for general setup instructions
- Review the [contribution guidelines](.github/contributing.md)
- For Web Monetization questions, visit [webmonetization.org](https://webmonetization.org/)
- For Interledger information, see [interledger.org](https://interledger.org)
---
