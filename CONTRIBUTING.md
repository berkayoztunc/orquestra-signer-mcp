# Contributing to @orquestradev/signer-mcp

Thank you for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/orquestra-signer-mcp.git
   cd orquestra-signer-mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build:
   ```bash
   npm run build
   ```

## Development Workflow

- Use `npm run dev` for watch mode during development.
- Add your changes in `src/`.
- Make sure the build passes (`npm run build`) before submitting.

## Adding a New Backend

1. Create a loader in `src/signer.ts` (follow the existing pattern for other backends).
2. Add the new backend to the table in `README.md`.
3. List any required environment variables.

## Pull Requests

- Keep PRs focused — one feature or fix per PR.
- Include a short description of what changed and why.
- Ensure `npm run build` succeeds with no TypeScript errors.

## Reporting Issues

Open an issue at [github.com/berkayoztunc/orquestra-signer-mcp/issues](https://github.com/berkayoztunc/orquestra-signer-mcp/issues) with a clear description and reproduction steps.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
