import type { SolanaSigner } from '@solana/keychain-core';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Transaction, TransactionWithinSizeLimit, TransactionWithLifetime } from '@solana/transactions';
import type { Address } from '@solana/addresses';
import type { SignatureBytes } from '@solana/keys';
import {
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
} from '@solana/transactions';

export const signTransactionTool: Tool = {
  name: 'sign_transaction',
  description:
    'Signs a compiled Solana transaction. ' +
    'Accepts a base64-encoded compiled transaction wire format. ' +
    'Returns the signatures map as { signerAddress: base64Signature } and the ' +
    'fully-signed base64 wire transaction ready for broadcast.',
  inputSchema: {
    type: 'object',
    properties: {
      transaction: {
        type: 'string',
        description:
          'Base64-encoded compiled Solana transaction (wire format). ' +
          'Build this with @solana/transaction-messages + compileTransaction().',
      },
    },
    required: ['transaction'],
  },
};

export async function handleSignTransaction(
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

  const base64Tx = (args as { transaction: string }).transaction;
  let txBytes: Uint8Array;
  try {
    txBytes = Uint8Array.from(Buffer.from(base64Tx, 'base64'));
  } catch {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Failed to decode "transaction": invalid base64.' }],
    };
  }

  // Deserialize into a @solana/kit Transaction object using the codec.
  // The type assertion is safe: a wire-serialised transaction already satisfies
  // TransactionWithinSizeLimit (it was encoded) and TransactionWithLifetime (it has a blockhash).
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

  // signTransactions returns SignatureDictionary[] (Record<Address, SignatureBytes>), not signed txs.
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

  // Merge new signatures into the decoded transaction (SignaturesMap is Record<Address, SignatureBytes | null>)
  const mergedSignatures = {
    ...decodedTx.signatures,
    ...(sigDict as Record<Address, SignatureBytes>),
  };
  const signedTx: Transaction = {
    messageBytes: decodedTx.messageBytes,
    signatures: mergedSignatures,
  };

  // Convert signatures to base64 for JSON serialization
  const signatures: Record<string, string> = {};
  for (const [address, sigBytes] of Object.entries(signedTx.signatures)) {
    if (sigBytes) {
      signatures[address] = Buffer.from(sigBytes as Uint8Array).toString('base64');
    }
  }

  // Re-encode the fully signed transaction to base64 wire format
  const signedWireBase64 = getBase64EncodedWireTransaction(signedTx);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          signatures,
          signedTransaction: signedWireBase64,
        }),
      },
    ],
  };
}
