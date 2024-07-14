# Local Testing
Solana Devnet can be slow and unreliable. To speed up development, we can run a local Solana validator and test our program locally.

## Install dependencies
- Solana CLI - https://docs.solanalabs.com/cli/install

## Start the local validator
On a new terminal, run the following command:
```bash
npm run local-validator
```
This will setup every programs and accounts that is needed by the Heaven program.

## Run a test
On a new terminal, run the following command:
```bash
npm run test-create-pool
npm run test-add-liquidity
npm run test-remove-liquidity
npm run test-swap-in
npm run test-swap-out
```