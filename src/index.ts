#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig } from './config.js';
import { createSigner } from './signer.js';

import { getAddressTool, handleGetAddress } from './tools/get-address.js';
import { checkAvailabilityTool, handleCheckAvailability } from './tools/check-availability.js';
import { signMessageTool, handleSignMessage } from './tools/sign-message.js';
import { signTransactionTool, handleSignTransaction } from './tools/sign-transaction.js';
import { signAndSendTransactionTool, handleSignAndSendTransaction } from './tools/sign-and-send-transaction.js';

async function main() {
  // --- Load config & initialize signer ---
  const config = (() => {
    try {
      return loadConfig();
    } catch (err) {
      process.stderr.write(
        `[solana-keychain-mcp] Config error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exit(1);
    }
  })();

  const signer = await createSigner(config).catch((err) => {
    process.stderr.write(
      `[solana-keychain-mcp] Failed to initialize signer (backend="${config.backend}"): ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });

  process.stderr.write(
    `[solana-keychain-mcp] Signer ready. Backend: ${config.backend} | Address: ${signer.address}\n`,
  );

  // --- Create MCP server ---
  const server = new Server(
    { name: 'solana-keychain-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [getAddressTool, checkAvailabilityTool, signMessageTool, signTransactionTool, signAndSendTransactionTool],
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_signer_address':
        return handleGetAddress(signer);

      case 'check_signer_availability':
        return handleCheckAvailability(signer, config.backend);

      case 'sign_message':
        return handleSignMessage(signer, args);

      case 'sign_transaction':
        return handleSignTransaction(signer, args);

      case 'sign_and_send_transaction':
        return handleSignAndSendTransaction(signer, args);

      default:
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Unknown tool: "${name}"` }],
        };
    }
  });

  // --- Connect transport ---
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(
    `[solana-keychain-mcp] Fatal: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
