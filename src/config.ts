export type Backend =
  | 'memory'
  | 'privy'
  | 'turnkey'
  | 'aws-kms'
  | 'gcp-kms'
  | 'fireblocks'
  | 'dfns'
  | 'vault'
  | 'cdp'
  | 'crossmint'
  | 'openfort'
  | 'para';

export interface BaseConfig {
  backend: Backend;
}

export interface MemoryConfig extends BaseConfig {
  backend: 'memory';
  /** Base58 private key, U8Array JSON string, or path to Solana CLI keypair file */
  privateKey: string;
}

export interface PrivyConfig extends BaseConfig {
  backend: 'privy';
  appId: string;
  appSecret: string;
  walletId: string;
}

export interface TurnkeyConfig extends BaseConfig {
  backend: 'turnkey';
  apiPublicKey: string;
  apiPrivateKey: string;
  organizationId: string;
  /** Turnkey private key ID */
  privateKeyId: string;
  /** Solana public key (base58) corresponding to the private key ID */
  publicKey: string;
}

export interface AwsKmsConfig extends BaseConfig {
  backend: 'aws-kms';
  /** AWS KMS key ID or ARN (must be an ECC_NIST_EDWARDS25519 key) */
  keyId: string;
  /** Solana public key (base58) corresponding to the AWS KMS key */
  publicKey: string;
  /** Optional AWS region */
  region?: string;
}

export interface GcpKmsConfig extends BaseConfig {
  backend: 'gcp-kms';
  /** Full resource name of the crypto key version */
  keyName: string;
  /** Solana public key (base58-encoded) */
  publicKey: string;
}

export interface FireblocksConfig extends BaseConfig {
  backend: 'fireblocks';
  apiKey: string;
  /** RSA 4096 private key in PEM format for JWT signing */
  privateKeyPem: string;
  vaultAccountId: string;
}

export interface DfnsConfig extends BaseConfig {
  backend: 'dfns';
  /** Service account token or personal access token */
  authToken: string;
  /** Credential ID for user action signing */
  credId: string;
  /** Private key in PEM format for signing user action challenges */
  privateKeyPem: string;
  /** Dfns wallet ID */
  walletId: string;
}

export interface VaultConfig extends BaseConfig {
  backend: 'vault';
  /** Name of the transit key in Vault */
  keyName: string;
  /** Solana public key (base58) corresponding to the Vault key */
  publicKey: string;
  /** Vault server address (e.g. https://vault.example.com) */
  vaultAddr: string;
  /** Vault authentication token */
  vaultToken: string;
}

export interface CdpConfig extends BaseConfig {
  backend: 'cdp';
  /** The Solana account address managed by CDP */
  address: string;
  /** CDP API key ID */
  cdpApiKeyId: string;
  /** CDP API private key (base64-encoded Ed25519 64-byte key) */
  cdpApiKeySecret: string;
  /** CDP Wallet Secret (base64-encoded PKCS#8 DER EC P-256 private key) */
  cdpWalletSecret: string;
}

export interface CrossmintConfig extends BaseConfig {
  backend: 'crossmint';
  apiKey: string;
  walletLocator: string;
}

export interface OpenfortConfig extends BaseConfig {
  backend: 'openfort';
  /** Openfort backend wallet account ID (`acc_<uuid>`) */
  accountId: string;
  /** Openfort project secret key */
  secretKey: string;
  /** ECDSA P-256 PKCS#8 private key (bare base64 DER or PEM) */
  walletSecret: string;
}

export interface ParaConfig extends BaseConfig {
  backend: 'para';
  apiKey: string;
  walletId: string;
}

export type SignerConfig =
  | MemoryConfig
  | PrivyConfig
  | TurnkeyConfig
  | AwsKmsConfig
  | GcpKmsConfig
  | FireblocksConfig
  | DfnsConfig
  | VaultConfig
  | CdpConfig
  | CrossmintConfig
  | OpenfortConfig
  | ParaConfig;

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function loadConfig(): SignerConfig {
  const backend = (process.env['KEYCHAIN_BACKEND'] ?? 'memory') as Backend;

  switch (backend) {
    case 'memory':
      return {
        backend: 'memory',
        privateKey: required('KEYCHAIN_PRIVATE_KEY'),
      };

    case 'privy':
      return {
        backend: 'privy',
        appId: required('PRIVY_APP_ID'),
        appSecret: required('PRIVY_APP_SECRET'),
        walletId: required('PRIVY_WALLET_ID'),
      };

    case 'turnkey':
      return {
        backend: 'turnkey',
        apiPublicKey: required('TURNKEY_API_PUBLIC_KEY'),
        apiPrivateKey: required('TURNKEY_API_PRIVATE_KEY'),
        organizationId: required('TURNKEY_ORGANIZATION_ID'),
        privateKeyId: required('TURNKEY_PRIVATE_KEY_ID'),
        publicKey: required('TURNKEY_PUBLIC_KEY'),
      };

    case 'aws-kms':
      return {
        backend: 'aws-kms',
        keyId: required('AWS_KMS_KEY_ID'),
        publicKey: required('AWS_KMS_PUBLIC_KEY'),
        region: optional('AWS_REGION'),
      };

    case 'gcp-kms':
      return {
        backend: 'gcp-kms',
        keyName: required('GCP_KMS_KEY_NAME'),
        publicKey: required('GCP_KMS_PUBLIC_KEY'),
      };

    case 'fireblocks':
      return {
        backend: 'fireblocks',
        apiKey: required('FIREBLOCKS_API_KEY'),
        privateKeyPem: required('FIREBLOCKS_PRIVATE_KEY_PEM'),
        vaultAccountId: required('FIREBLOCKS_VAULT_ACCOUNT_ID'),
      };

    case 'dfns':
      return {
        backend: 'dfns',
        authToken: required('DFNS_AUTH_TOKEN'),
        credId: required('DFNS_CRED_ID'),
        privateKeyPem: required('DFNS_PRIVATE_KEY_PEM'),
        walletId: required('DFNS_WALLET_ID'),
      };

    case 'vault':
      return {
        backend: 'vault',
        keyName: required('VAULT_KEY_NAME'),
        publicKey: required('VAULT_PUBLIC_KEY'),
        vaultAddr: required('VAULT_ADDR'),
        vaultToken: required('VAULT_TOKEN'),
      };

    case 'cdp':
      return {
        backend: 'cdp',
        address: required('CDP_ADDRESS'),
        cdpApiKeyId: required('CDP_API_KEY_ID'),
        cdpApiKeySecret: required('CDP_API_KEY_SECRET'),
        cdpWalletSecret: required('CDP_WALLET_SECRET'),
      };

    case 'crossmint':
      return {
        backend: 'crossmint',
        apiKey: required('CROSSMINT_API_KEY'),
        walletLocator: required('CROSSMINT_WALLET_LOCATOR'),
      };

    case 'openfort':
      return {
        backend: 'openfort',
        accountId: required('OPENFORT_ACCOUNT_ID'),
        secretKey: required('OPENFORT_SECRET_KEY'),
        walletSecret: required('OPENFORT_WALLET_SECRET'),
      };

    case 'para':
      return {
        backend: 'para',
        apiKey: required('PARA_API_KEY'),
        walletId: required('PARA_WALLET_ID'),
      };

    default: {
      const _exhaustive: never = backend;
      throw new Error(`Unknown KEYCHAIN_BACKEND: ${_exhaustive}`);
    }
  }
}
