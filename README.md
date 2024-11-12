# Tools

- Foundry: for compiling the project, unittest, deploy contracts, coverage. See the CI `test.yml` for which stable version we use. To upgrade to specific version:

  ```sh
  foundryup -v nightly-e15e33a07c0920189fc336391f538c3dad53da73
  ```

- OpenzeppelinUpgrades: TypeScript package for verifying upgradeability.
- Slither: For Solidity static analysis
- Solhint: For Solidity linting
- LCOV: For processing coverage reports

### Unit Tests

To run unit tests, we provide Foundry tests written in Solidity. To execute
them, run the following command in the terminal:

```sh
./run_tests.sh

# Run with default optimized compilation
FOUNDRY_PROFILE=default ./run_tests.sh

# Filter tests by regex, and give gas report of functions
FOUNDRY_PROFILE=default ./run_tests.sh --mt <test name filter> --gas-report
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
./run_lint.sh
```

### Coverage

To measure code coverage, we use coverage from forge. Run the command, and it
will generate an LCOV html report with branch coverage

```sh
./run_coverage.sh
```

It's important to note that code coverage in forge is still under development
and has some known issues, such as detecting libraries. Check [these
issues](https://github.com/foundry-rs/foundry/issues/1961) for more details
about the limitations of the Foundry code coverage.

Some specific issues:

- `assert`s are counted as branches, even though they should never be triggered if
  there are no bugs in the code. This leads to lower branch coverage

### Static Analysis

We use slither to perform static analysis. However, we need to clean and
recompile the project, excluding the foundry/test and foundry/script
directories, as slither has some issues with the Solidity code in those
directories. To do this, run the following command in the terminal:

```bash
./run_slither.sh
```

Additionally, you can generate the Slither Markdown checklist by running:

```bash
./run_slither.sh --checklist --show-ignored-findings > slither_checklist.md
```

This will help identify and address any issues detected by the static analysis.

### Run on Anvil

To run a script on anvil (such as a deployment script) and keep it running, can run

```sh
./run_anvil.sh TestnetDeploy
```
