import { ensureEnv, loadChainVariables } from "./lib/core";
import assert from "assert";
import { DeployOptions, Forge } from "./lib/forge";

const USAGE = `Deploy contracts onto a chain. Relies on '.env' files for
specifying sensitive variables. See .env.anvil for an example. The deployer
doesn't have to be the same one each time, as long as it has enough gas to pay
for the deployment. Ownership should be handed off to a different admin address,
the private key for which is never stored locally (e.g. ledger or multisig)

USAGE:
  bun run ./typescript/deployContracts.ts <chain> <deploy-script> [--for-real] [--anvil-fork] [--verify-only]

  deploy-script  - Name of a script contract to run with forge script
  chain          - a chain like 'anvil', 'mainnet', 'mumbai'. Used to look up appropriate .env.<chain> file
  --for-real     - required to do the deployment for real, and not a dry run
  --anvil-fork   - ignores RPC_URL and connects to anvil, assuming it is running a fork of the specified chain
  `;

const main = async (): Promise<void> => {
  if (process.argv.length < 4) {
    throw Error(USAGE);
  }

  const chain = process.argv[2];
  assert(chain);
  const chainVars = await loadChainVariables(chain);

  const scriptToExecute = process.argv[3];
  assert(scriptToExecute);

  let dryRun = true;
  let verifyOnly = false;
  for (const extraArg of process.argv.slice(4)) {
    if (extraArg == "--for-real") {
      dryRun = false;
    } else if (extraArg == "--anvil-fork") {
      chainVars.rpcUrl = "http://localhost:8545";
    } else if (extraArg == "--verify-only") {
      verifyOnly = true;
    } else {
      throw Error(USAGE);
    }
  }

  const forge = await Forge.initialize();
  const deployOptions: DeployOptions = {
    scriptToExecute,
    privateKey: ensureEnv("PRIVATE_KEY"),
    sender: ensureEnv("SENDER"),
    rpcUrl: chainVars.rpcUrl,
    dryRun,
    verifyOnly,
    verifyOptions: chainVars.verifier,
    slow: true,
  };

  await forge.deployAndVerify(deployOptions);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
