import type { SolanaSigner } from '@solana/keychain-core';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const getAddressTool: Tool = {
  name: 'get_signer_address',
  description: 'Returns the Solana public key (base58 address) of the configured signer.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function handleGetAddress(signer: SolanaSigner): Promise<CallToolResult> {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ address: signer.address }),
      },
    ],
  };
}
