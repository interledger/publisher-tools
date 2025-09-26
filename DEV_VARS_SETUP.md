# Development Environment Variables Setup

This guide provides detailed instructions for setting up your `.dev.vars` file for local development.</br>
Follow the sections below to configure each variable.

## Environment Variables

### Open Payments Configuration

These variables are required to enable Web Monetization functionality:

#### `OP_KEY_ID`

- **Description**: UUID v4 identifier for your Open Payments key
- **How to get it**:
  1. Sign up for a Web Monetization-compatible wallet (e.g., Interledger Testnet wallet)
  2. Navigate to the developers/API keys section
  3. Generate a new key pair
  4. Copy the Key ID (UUID format)

#### `OP_PRIVATE_KEY`

- **Description**: Base64-encoded private key for signing Open Payments requests
- **How to get it**:
  1. When generating your key pair in your wallet's developer section
  2. Download or copy the private key
  3. **Important**: The private key must be converted to the format expected by the tools using the script below
- **Security Note**: Never commit this value to version control

##### Private Key Conversion Script

After copying your private key, run this script to convert it to the correct format:

```javascript
const pemString = atob(currentKey)

// Extract the base64-encoded part between the headers
const base64Content = pemString
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '')

// Decode to get the DER bytes
const derBytes = atob(base64Content)

// Convert to Uint8Array
const bytes = new Uint8Array(derBytes.length)
for (let i = 0; i < derBytes.length; i++) {
  bytes[i] = derBytes.charCodeAt(i)
}

// Extract just the 32-byte key
const privateKey = bytes.slice(-32)

// Convert back to base64 for storage
const keyBase64 = btoa(String.fromCharCode(...privateKey))

console.log('New key format for direct use:')
console.log(keyBase64)
```

Replace `currentKey` with your copied private key, then use the output as your `OP_PRIVATE_KEY` value.

#### `OP_WALLET_ADDRESS`

- **Description**: Your wallet address URL
- **How to get it**:
  1. In your Web Monetization wallet dashboard
  2. Find your wallet address
  3. Copy the full URL

### AWS Configuration

These variables configure S3 storage for configuration data:

#### `AWS_ACCESS_KEY_ID`

- **Description**: AWS access key for S3 operations
- **Development Note**: This key is ignored when using the local S3 simulator, so it's not required for development
- **How to get it** (for production only):
  1. Sign in to the [AWS Management Console](https://aws.amazon.com/console/)
  2. Navigate to IAM (Identity and Access Management)
  3. In the left sidebar, select "Users"
  4. Click on your user or create a new user with S3 permissions
  5. Go to the "Security credentials" tab
  6. Scroll down to "Access keys" and click "Create access key"
  7. Choose "Application running outside AWS"
  8. Copy the Access key ID
- **Required Permissions**: S3 read/write access

#### `AWS_SECRET_ACCESS_KEY`

- **Description**: AWS secret key corresponding to the access key ID
- **Development Note**: This key is ignored when using the local S3 simulator, so it's not required for development
- **How to get it** (for production only): Generated alongside the Access Key ID in step 6-8 above
- **Security Note**: Never commit this value to version control

#### `AWS_S3_ENDPOINT`

- **For Development**: Use the local S3 simulator
  ```
  AWS_S3_ENDPOINT="http://localhost:8081"
  ```
- **For Production**: Use your actual S3 bucket endpoint
  ```
  AWS_S3_ENDPOINT="https://your-bucket-name.s3.your-region.amazonaws.com"
  ```

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

Check the console output for any authentication or connection errors.

## Need Help?

- Check the main [README.md](./README.md) for general setup instructions
- Review the [contribution guidelines](.github/contributing.md)
- For Web Monetization questions, visit [webmonetization.org](https://webmonetization.org/)
- For Interledger information, see [interledger.org](https://interledger.org)
