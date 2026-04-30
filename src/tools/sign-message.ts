import type { SolanaSigner } from '@solana/keychain-core';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createSignableMessage } from '@solana/signers';

const MAX_MESSAGE_BYTES = 1_000_000; // 1 MB

export const signMessageTool: Tool = {
  name: 'sign_message',
  description:
    'Signs an arbitrary message with the configured Solana signer. ' +
    'Provide either a plain UTF-8 string or hex-encoded bytes (prefixed with "0x"). ' +
    'Returns a base64-encoded Ed25519 signature.',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description:
          'The message to sign. Either a plain text string or hex bytes prefixed with "0x".',
      },
    },
    required: ['message'],
  },
};

export async function handleSignMessage(
  signer: SolanaSigner,
  args: unknown,
): Promise<CallToolResult> {
  if (
    !args ||
    typeof args !== 'object' ||
    !('message' in args) ||
    typeof (args as Record<string, unknown>)['message'] !== 'string'
  ) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Invalid arguments: "message" (string) is required.' }],
    };
  }

  const raw = (args as { message: string }).message;

  let bytes: Uint8Array;
  if (raw.startsWith('0x') || raw.startsWith('0X')) {
    const hex = raw.slice(2);
    if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Invalid hex string in "message".' }],
      };
    }
    bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
  } else {
    bytes = new TextEncoder().encode(raw);
  }

  if (bytes.length > MAX_MESSAGE_BYTES) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Message too large: ${bytes.length} bytes exceeds the 1 MB limit.`,
        },
      ],
    };
  }

  const signableMessage = createSignableMessage(bytes);
  const [signatureDictionary] = await signer.signMessages([signableMessage]);

  // The dictionary maps signer address → Uint8Array signature
  const sigBytes = signatureDictionary[signer.address as keyof typeof signatureDictionary];
  if (!sigBytes) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Signer did not produce a signature.' }],
    };
  }

  const signature = Buffer.from(sigBytes).toString('base64');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ signature, signer: signer.address }),
      },
    ],
  };
}
