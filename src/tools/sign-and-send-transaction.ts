import type { SolanaSigner } from '@solana/keychain-core';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Transaction, TransactionWithinSizeLimit, TransactionWithLifetime } from '@solana/transactions';
import type { Address } from '@solana/addresses';
import type { SignatureBytes } from '@solana/keys';
import { getTransactionDecoder, getBase64EncodedWireTransaction } from '@solana/transactions';

const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';

/** Blocks private/loopback IPs to prevent SSRF attacks. */
function validateRpcUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'Invalid URL format.' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: 'Only http:// and https:// URLs are allowed.' };
  }
  const hostname = url.hostname.toLowerCase();
  // Block loopback / link-local / private ranges
  const blocked =
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local');
  if (blocked) {
    return { ok: false, reason: 'Private or loopback addresses are not permitted as RPC URL.' };
  }
  return { ok: true, url };
}

export const signAndSendTransactionTool: Tool = {
  name: 'sign_and_send_transaction',
  description:
    'Signs a compiled Solana transaction and immediately sends it to an RPC node. ' +
    'Accepts a base64-encoded compiled transaction wire format and an optional RPC URL. ' +
    'Returns the transaction signature (base58) on success.',
  inputSchema: {
    type: 'object',
    properties: {
      transaction: {
        type: 'string',
        description:
          'Base64-encoded compiled Solana transaction (wire format). ' +
          'Build this with @solana/transaction-messages + compileTransaction().',
      },
      rpcUrl: {
        type: 'string',
        description: `Solana RPC endpoint URL. Defaults to ${DEFAULT_RPC_URL}.`,
      },
      skipPreflight: {
        type: 'boolean',
        description:
          'Skip preflight transaction checks. Defaults to false.',
      },
    },
    required: ['transaction'],
  },
};

export async function handleSignAndSendTransaction(
  signer: SolanaSigner,
  args: unknown,
): Promise<CallToolResult> {
  if (
    !args ||
    typeof args !== 'object' ||
    !('transaction' in args) ||
    typeof (args as Record<string, unknown>)['transaction'] !== 'string'
  ) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'Invalid arguments: "transaction" (base64 string) is required.' },
      ],
    };
  }

  const a = args as { transaction: string; rpcUrl?: string; skipPreflight?: boolean };
  const rawRpcUrl = (a.rpcUrl ?? process.env['SOLANA_RPC_URL'] ?? DEFAULT_RPC_URL).trim();
  const skipPreflight = a.skipPreflight ?? false;

  const rpcValidation = validateRpcUrl(rawRpcUrl);
  if (!rpcValidation.ok) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Invalid rpcUrl: ${rpcValidation.reason}` }],
    };
  }
  const rpcUrl = rpcValidation.url.toString();

  // Decode base64 → bytes
  let txBytes: Uint8Array;
  try {
    txBytes = Uint8Array.from(Buffer.from(a.transaction, 'base64'));
  } catch {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Failed to decode "transaction": invalid base64.' }],
    };
  }

  // Deserialize wire bytes into a Transaction
  let decodedTx: Transaction;
  try {
    decodedTx = getTransactionDecoder().decode(txBytes);
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to parse transaction: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
  const typedTx = decodedTx as Transaction & TransactionWithinSizeLimit & TransactionWithLifetime;

  // Sign
  let sigDict: Readonly<Record<string, SignatureBytes>>;
  try {
    const results = await signer.signTransactions([typedTx]);
    sigDict = results[0] ?? {};
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Signing failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  // Merge signatures back into transaction
  const signedTx: Transaction = {
    messageBytes: decodedTx.messageBytes,
    signatures: {
      ...decodedTx.signatures,
      ...(sigDict as Record<Address, SignatureBytes>),
    },
  };

  // Re-encode as base64 wire transaction for sending
  const wireBase64 = getBase64EncodedWireTransaction(signedTx);

  // Send via JSON-RPC sendTransaction
  let txSignature: string;
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: [
          wireBase64,
          {
            encoding: 'base64',
            skipPreflight,
            preflightCommitment: 'confirmed',
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `RPC request failed: HTTP ${response.status} ${response.statusText}`,
          },
        ],
      };
    }

    const json = (await response.json()) as {
      result?: string;
      error?: { code?: number; message?: string; data?: unknown };
    };

    if (json.error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `RPC error ${json.error.code ?? ''}: ${json.error.message ?? 'unknown'}${
              json.error.data ? `\n${JSON.stringify(json.error.data)}` : ''
            }`,
          },
        ],
      };
    }

    txSignature = json.result ?? '';
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to send transaction: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          signature: txSignature,
          explorerUrl: `https://explorer.solana.com/tx/${txSignature}`,
          rpcUrl,
        }),
      },
    ],
  };
}
