# Tools

This repository is a set of common scripts used for testing, compiling, and
deploying Solidity smart contracts. The example commands in this file assume
this repository is included as a submodule under `./tools` in the smart contract
project directory.

- Foundry: for compiling the project, unittest, deploy contracts, coverage. See the CI `test.yml` for which stable version we use. To upgrade to specific version:

  ```sh
  foundryup -v 1.5.0
  ```

- OpenzeppelinUpgrades: TypeScript package for verifying upgradeability.
- Slither: For Solidity static analysis
- Solhint: For Solidity linting
- LCOV: For processing coverage reports

### Unit Tests

To run unit tests, we provide Foundry tests written in Solidity. To execute
them, run the following command in the terminal:

```sh
./tools/run_tests.sh

# Run with default optimized compilation
FOUNDRY_PROFILE=default ./tools/run_tests.sh

# Filter tests by regex, and give gas report of functions
FOUNDRY_PROFILE=default ./tools/run_tests.sh --mt <test name filter> --gas-report
```

### Formatting

```sh
forge fmt
```

### Linting

We lint using:

- solhint
- openzeppelin's upgradeability checks since we use OZ's upgradeable contracts.
- forge codesize report, so contracts don't exceed size limit

```sh
bun install
./tools/run_lint.sh
```

### Coverage

To measure code coverage, we use coverage from forge. Run the command, and it
will generate an LCOV html report with branch coverage

```sh
./tools/run_coverage.sh
```

### Static Analysis

We use slither to perform static analysis. However, we need to clean and
recompile the project, excluding the foundry/test and foundry/script
directories, as slither has some issues with the Solidity code in those
directories. To do this, run the following command in the terminal:

```bash
./tools/run_slither.sh
```

Additionally, you can generate the Slither Markdown checklist by running:

```bash
./tools/run_slither.sh --checklist --show-ignored-findings > slither_checklist.md
```

This will help identify and address any issues detected by the static analysis.

### Run on Anvil

To run a script on anvil (such as a deployment script) and keep it running, can run

```sh
./tools/run_anvil.sh TestnetDeploy
```

## Deployment

### Environment variables for chain

Create new `.env.CHAIN_NAME` in the contracts directory and fill with the
correct details following the [`.env.anvil`](./.env.anvil) template.
This will contain important config parameters for deployment. The bare minimum are:

- `SENDER` - the public address of the deployer
- `PRIVATE_KEY` - the private key of the deployer. The smart contracts should be
  designed not to give any permissions or priveleges to the deployer. This can be
  a throw-away account, with no danger if it leaks
- `RPC_URL` - URL for the RPC endpoint to interact with a blockchain. Grab it
  from the [alchemy dashboard](https://dashboard.alchemy.com/chains).
- `VERIFIER_URL` - Etherscan v2 API for the chain like `https://api.etherscan.io/v2/api?chainid=<CHAIN_ID>`
- `VERIFIER_API_KEY` - Etherscan v2 API key. Will be used to verify the
  contracts (upload source code to Etherscan and verify the code matches the
  deployed contract)

There may be other required environment variables depending on the contracts being deployed.

```bash
cp .env.anvil .env.CHAIN_NAME
# edit .env.CHAIN_NAME with the correct details

# DO NOT CHECK THESE IN! There isn't a large risk in leaking it, but better not to.
```

### Try on a local fork of the blockchain

Launch anvil forked from the real chain in one terminal (keep it running):

```bash
source .env.CHAIN_NAME
anvil -f ${RPC_URL}
```

Do a dry run deployment on anvil. Check `./scripts` directory for Solidity
deployment scripts, and in particular the contract in the deployment script.

```bash
bun install
bun run ./tools/typescript/deployContracts.ts CHAIN_NAME DEPLOYMENT_CONTRACT --anvil-fork
```

If this fails, most likely deployment address doesn't have enough gas. Otherwise, follow error messages. You can also deploy onto the anvil fork:

```bash
bun run ./tools/typescript/deployContracts.ts CHAIN_NAME DEPLOYMENT_CONTRACT --anvil-fork --for-real
```

This will generate a few artefacts like `deploy-latest.json` for the chain. Clean these out before deploying onto the real chain, because the deployment wasn't real.


### Deploy on the real chain

Dry run on the real chain:

```bash
bun run ./tools/typescript/deployContracts.ts CHAIN_NAME DEPLOYMENT_CONTRACT
```

Deploy for real on the real chain

```bash
bun run ./tools/typescript/deployContracts.ts CHAIN_NAME DEPLOYMENT_CONTRACT --for-real
```

### Issues verifying

If for some reason verification fails the first time, it can be resumed with:

```bash
bun run ./tools/typescript/deployContracts.ts CHAIN_NAME DEPLOYMENT_CONTRACT --for-real --verify-only
```
