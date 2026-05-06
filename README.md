# @orquestradev/signer-mcp

MCP server for signing Solana transactions and messages using any backend supported by [`@solana/keychain`](https://github.com/solana-foundation/solana-keychain).

One command to add to any MCP client:

```json
{
  "mcpServers": {
    "solana-signer": {
      "command": "npx",
      "args": ["-y", "@orquestradev/signer-mcp"],
      "env": {
        "KEYCHAIN_BACKEND": "memory",
        "KEYCHAIN_PRIVATE_KEY": "<your-base58-private-key>",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

> `SOLANA_RPC_URL` sets the default RPC endpoint used by `sign_and_send_transaction`. You can also override it per-call by passing `rpcUrl` in the tool arguments.

## Tools

| Tool | Description |
|---|---|
| `get_signer_address` | Returns the signer's Solana public key |
| `check_signer_availability` | Pings the backend to verify it is reachable |
| `sign_message` | Signs an arbitrary message (UTF-8 or `0x`-prefixed hex) |
| `sign_transaction` | Signs a base64-encoded compiled transaction wire bytes |
| `sign_and_send_transaction` | Signs and broadcasts a transaction; returns the tx signature (base58) |

## Supported Backends

| `KEYCHAIN_BACKEND` | Required env vars | Optional package |
|---|---|---|
| `memory` | `KEYCHAIN_PRIVATE_KEY` | *(bundled)* |
| `privy` | `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `PRIVY_WALLET_ID` | `@solana/keychain-privy` |
| `turnkey` | `TURNKEY_API_PUBLIC_KEY`, `TURNKEY_API_PRIVATE_KEY`, `TURNKEY_ORGANIZATION_ID`, `TURNKEY_SIGN_WITH` | `@solana/keychain-turnkey` |
| `aws-kms` | `AWS_KMS_KEY_ID`, `AWS_REGION` | `@solana/keychain-aws-kms` |
| `gcp-kms` | `GCP_PROJECT_ID`, `GCP_LOCATION_ID`, `GCP_KEY_RING_ID`, `GCP_CRYPTO_KEY_ID`, `GCP_CRYPTO_KEY_VERSION_ID` | `@solana/keychain-gcp-kms` |
| `fireblocks` | `FIREBLOCKS_API_KEY`, `FIREBLOCKS_API_SECRET_PATH`, `FIREBLOCKS_VAULT_ACCOUNT_ID` | `@solana/keychain-fireblocks` |
| `dfns` | `DFNS_APP_ID`, `DFNS_AUTH_TOKEN`, `DFNS_WALLET_ID`, `DFNS_CREDENTIAL_ID`, `DFNS_PRIVATE_KEY_PEM_PATH` | `@solana/keychain-dfns` |
| `vault` | `VAULT_ADDR`, `VAULT_TOKEN`, `VAULT_KEY_NAME` | `@solana/keychain-vault` |
| `cdp` | `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`, `CDP_WALLET_ID`, `CDP_ADDRESS_ID` | `@solana/keychain-cdp` |
| `crossmint` | `CROSSMINT_API_KEY`, `CROSSMINT_WALLET_LOCATOR` | `@solana/keychain-crossmint` |
| `openfort` | `OPENFORT_SECRET_KEY`, `OPENFORT_ACCOUNT_ADDRESS` | `@solana/keychain-openfort` |
| `para` | `PARA_API_KEY`, `PARA_WALLET_ID`, `PARA_USER_SHARE` | `@solana/keychain-para` |

Non-memory backends require their optional package to be installed alongside this package:

```bash
npm install @orquestradev/signer-mcp @solana/keychain-privy
```

## MCP Client Config Examples

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "solana-signer": {
      "command": "npx",
      "args": ["-y", "@orquestradev/signer-mcp"],
      "env": {
        "KEYCHAIN_BACKEND": "memory",
        "KEYCHAIN_PRIVATE_KEY": "<base58-or-path-to-keypair.json>"
      }
    }
  }
}
```

### AWS KMS example

```json
{
  "mcpServers": {
    "solana-signer": {
      "command": "npx",
      "args": ["-y", "@orquestradev/signer-mcp"],
      "env": {
        "KEYCHAIN_BACKEND": "aws-kms",
        "AWS_KMS_KEY_ID": "arn:aws:kms:us-east-1:...",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### Privy example

```json
{
  "mcpServers": {
    "solana-signer": {
      "command": "npx",
      "args": ["-y", "@orquestradev/signer-mcp"],
      "env": {
        "KEYCHAIN_BACKEND": "privy",
        "PRIVY_APP_ID": "clxxxxxxxxxxxxxxxx",
        "PRIVY_APP_SECRET": "your-app-secret",
        "PRIVY_WALLET_ID": "your-wallet-id"
      }
    }
  }
}
```

### Claude Code

To add this MCP server to Claude Code, update your MCP configuration:

```bash
claude code mcp add solana-signer --command npx --args "-y" --args "@orquestradev/signer-mcp" --env KEYCHAIN_BACKEND=memory --env "KEYCHAIN_PRIVATE_KEY=<base58-or-path-to-keypair.json>" --env "SOLANA_RPC_URL=https://api.mainnet-beta.solana.com"
```

Or manually add to your Claude Code config file:

```json
{
  "mcpServers": {
    "solana-signer": {
      "command": "npx",
      "args": ["-y", "@orquestradev/signer-mcp"],
      "env": {
        "KEYCHAIN_BACKEND": "memory",
        "KEYCHAIN_PRIVATE_KEY": "<base58-or-path-to-keypair.json>",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally (memory backend)
KEYCHAIN_BACKEND=memory KEYCHAIN_PRIVATE_KEY=<base58-key> node dist/index.js
```

### sign_and_send_transaction

Accepts `transaction` (base64 wire), optional `rpcUrl`, and optional `skipPreflight`. Uses `SOLANA_RPC_URL` env var if `rpcUrl` is not passed; falls back to mainnet.

```json
{
  "transaction": "<base64-wire-bytes>",
  "rpcUrl": "https://api.devnet.solana.com",
  "skipPreflight": false
}
```

## Security

- Private keys for the `memory` backend are held in-process as non-extractable `CryptoKey` objects via the Web Crypto API.
- Never commit private keys to source control. Use environment variables or a secret manager.
- For production workloads, prefer a remote signing backend (AWS KMS, GCP KMS, Turnkey, Privy, etc.).
- All tool inputs are validated before being passed to the signer.

## License

MIT



