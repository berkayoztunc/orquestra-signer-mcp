import type { SolanaSigner } from '@solana/keychain-core';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const checkAvailabilityTool: Tool = {
  name: 'check_signer_availability',
  description:
    'Checks whether the configured signing backend is reachable and ready to sign. ' +
    'Returns the backend name and availability status.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function handleCheckAvailability(
  signer: SolanaSigner,
  backend: string,
): Promise<CallToolResult> {
  const available = await signer.isAvailable();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ available, backend }),
      },
    ],
  };
}
