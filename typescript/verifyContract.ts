import { loadChainVariables } from "./lib/core";
import assert from "assert";
import { Forge } from "./lib/forge";

const USAGE = `Manually verify a contract after the fact

USAGE:
  bun run ./typescript/verifyContract.ts <chain> <address> <contract>

  chain          - a chain like 'anvil', 'mainnet', 'mumbai'. Used to look up appropriate .env.<chain> file
  address        - address of contract to verify
  contract       - name or path of contract. See https://book.getfoundry.sh/forge/deploying?highlight=verify#verifying-a-pre-existing-contract
  `;

const main = async (): Promise<void> => {
  if (process.argv.length < 5) {
    throw Error(USAGE);
  }

  const chain = process.argv[2];
  assert(chain);
  const chainVars = await loadChainVariables(chain);
  const address = process.argv[3];
  assert(address);
  const contract = process.argv[4];
  assert(contract);

  if (!chainVars.verifier) {
    throw Error("");
  }

  const scriptToExecute = process.argv[3];
  assert(scriptToExecute);

  const forge = await Forge.initialize();

  await forge.run([
    "verify-contract",
    "--watch",
    "--chain-id",
    chainVars.chainId.toString(),
    "--verifier-url",
    chainVars.verifier.url,
    "--etherscan-api-key",
    chainVars.verifier.apiKey,
    address,
    contract,
  ]);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
