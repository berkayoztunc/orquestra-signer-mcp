import type { SolanaSigner } from '@solana/keychain-core';
import type {
  SignerConfig,
  MemoryConfig,
  PrivyConfig,
  TurnkeyConfig,
  AwsKmsConfig,
  GcpKmsConfig,
  FireblocksConfig,
  DfnsConfig,
  VaultConfig,
  CdpConfig,
  CrossmintConfig,
  OpenfortConfig,
  ParaConfig,
} from './config.js';

function missingPackage(pkg: string): never {
  throw new Error(
    `Backend package "${pkg}" is not installed. Run: npm install ${pkg}\n` +
      `Or use the umbrella package: npm install @solana/keychain`,
  );
}

async function createMemorySigner(config: MemoryConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-memory').catch(() =>
    missingPackage('@solana/keychain-memory'),
  );
  const key = config.privateKey.trim();
  // Detect keypair file path vs inline key value
  if (key.startsWith('/') || key.startsWith('./') || key.startsWith('~/')) {
    return mod.createMemorySignerFromKeypairFile(key.replace(/^~/, process.env['HOME'] ?? '~'));
  }
  return mod.createMemorySignerFromPrivateKeyString(key);
}

async function createPrivySigner(config: PrivyConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-privy').catch(() =>
    missingPackage('@solana/keychain-privy'),
  );
  return mod.createPrivySigner({
    appId: config.appId,
    appSecret: config.appSecret,
    walletId: config.walletId,
  });
}

async function createTurnkeySigner(config: TurnkeyConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-turnkey').catch(() =>
    missingPackage('@solana/keychain-turnkey'),
  );
  return mod.createTurnkeySigner({
    apiPublicKey: config.apiPublicKey,
    apiPrivateKey: config.apiPrivateKey,
    organizationId: config.organizationId,
    privateKeyId: config.privateKeyId,
    publicKey: config.publicKey,
  });
}

async function createAwsKmsSigner(config: AwsKmsConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-aws-kms').catch(() =>
    missingPackage('@solana/keychain-aws-kms'),
  );
  return mod.createAwsKmsSigner({
    keyId: config.keyId,
    publicKey: config.publicKey,
    ...(config.region ? { region: config.region } : {}),
  });
}

async function createGcpKmsSigner(config: GcpKmsConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-gcp-kms').catch(() =>
    missingPackage('@solana/keychain-gcp-kms'),
  );
  return mod.createGcpKmsSigner({
    keyName: config.keyName,
    publicKey: config.publicKey,
  });
}

async function createFireblocksSigner(config: FireblocksConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-fireblocks').catch(() =>
    missingPackage('@solana/keychain-fireblocks'),
  );
  return mod.createFireblocksSigner({
    apiKey: config.apiKey,
    privateKeyPem: config.privateKeyPem,
    vaultAccountId: config.vaultAccountId,
  });
}

async function createDfnsSigner(config: DfnsConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-dfns').catch(() =>
    missingPackage('@solana/keychain-dfns'),
  );
  return mod.createDfnsSigner({
    authToken: config.authToken,
    credId: config.credId,
    privateKeyPem: config.privateKeyPem,
    walletId: config.walletId,
  });
}

async function createVaultSigner(config: VaultConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-vault').catch(() =>
    missingPackage('@solana/keychain-vault'),
  );
  return mod.createVaultSigner({
    keyName: config.keyName,
    publicKey: config.publicKey,
    vaultAddr: config.vaultAddr,
    vaultToken: config.vaultToken,
  });
}

async function createCdpSigner(config: CdpConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-cdp').catch(() =>
    missingPackage('@solana/keychain-cdp'),
  );
  return mod.createCdpSigner({
    address: config.address,
    cdpApiKeyId: config.cdpApiKeyId,
    cdpApiKeySecret: config.cdpApiKeySecret,
    cdpWalletSecret: config.cdpWalletSecret,
  });
}

async function createCrossmintSigner(config: CrossmintConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-crossmint').catch(() =>
    missingPackage('@solana/keychain-crossmint'),
  );
  return mod.createCrossmintSigner({
    apiKey: config.apiKey,
    walletLocator: config.walletLocator,
  });
}

async function createOpenfortSigner(config: OpenfortConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-openfort').catch(() =>
    missingPackage('@solana/keychain-openfort'),
  );
  return mod.createOpenfortSigner({
    accountId: config.accountId,
    secretKey: config.secretKey,
    walletSecret: config.walletSecret,
  });
}

async function createParaSigner(config: ParaConfig): Promise<SolanaSigner> {
  const mod = await import('@solana/keychain-para').catch(() =>
    missingPackage('@solana/keychain-para'),
  );
  return mod.createParaSigner({
    apiKey: config.apiKey,
    walletId: config.walletId,
  });
}

export async function createSigner(config: SignerConfig): Promise<SolanaSigner> {
  switch (config.backend) {
    case 'memory':
      return createMemorySigner(config);
    case 'privy':
      return createPrivySigner(config);
    case 'turnkey':
      return createTurnkeySigner(config);
    case 'aws-kms':
      return createAwsKmsSigner(config);
    case 'gcp-kms':
      return createGcpKmsSigner(config);
    case 'fireblocks':
      return createFireblocksSigner(config);
    case 'dfns':
      return createDfnsSigner(config);
    case 'vault':
      return createVaultSigner(config);
    case 'cdp':
      return createCdpSigner(config);
    case 'crossmint':
      return createCrossmintSigner(config);
    case 'openfort':
      return createOpenfortSigner(config);
    case 'para':
      return createParaSigner(config);
    default: {
      const _exhaustive: never = config;
      throw new Error(`Unhandled backend: ${(_exhaustive as SignerConfig).backend}`);
    }
  }
}
