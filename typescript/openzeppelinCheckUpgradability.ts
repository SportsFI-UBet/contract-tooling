/*
This script runs the openzeppelin upgradable plugin and it serves to check the upgradeability of the smart contracts.
The plugin check some basic rules that the upgradable contract should follow.
*/

import {
  UpgradeableContract,
  SolcInput,
  SolcOutput,
  ValidationOptions,
} from "@openzeppelin/upgrades-core";
import { promises as fs } from "node:fs";
import path from "node:path";

const main = async (): Promise<void> => {
  const baseFolder = "./out/build-info/";
  const jsonsInDir = (await fs.readdir(baseFolder)).filter(
    (file) => path.extname(file) === ".json",
  );

  if (jsonsInDir.length !== 1) {
    throw new Error(
      "More than one file in out/build-info.\nPlease clean and recompile with:\nbun run clean & bun run compile",
    );
  }

  const buildFile = path.join(baseFolder, jsonsInDir[0] as string);

  const json = JSON.parse(await fs.readFile(buildFile, "utf8"));
  const solcInput: SolcInput = json.input;
  const solcOutput: SolcOutput = json.output;

  analyzeUpgradability(
    "contracts/testnet/tokens/UbetBucks.sol:UbetBucks",
    solcInput,
    solcOutput,
    { kind: "uups" },
  );
  analyzeUpgradability(
    "contracts/conditions/ConditionalTokens.sol:ConditionalTokens",
    solcInput,
    solcOutput,
    {
      kind: "uups",
    },
  );
  analyzeUpgradability(
    "contracts/markets/MarketMaker.sol:MarketMaker",
    solcInput,
    solcOutput,
    // Market is just behind a proxy and is not meant to be upgraded
    { kind: "transparent" },
  );
  analyzeUpgradability(
    "contracts/funding/ParentFundingPool.sol:ParentFundingPool",
    solcInput,
    solcOutput,
    // ParentFundingPool is not meant to be upgraded
    { kind: "transparent" },
  );
};

function analyzeUpgradability(
  contractName: string,
  solcInput: SolcInput,
  solcOutput: SolcOutput,
  opts: ValidationOptions = {},
): void {
  const contract = new UpgradeableContract(
    contractName,
    solcInput,
    solcOutput,
    opts,
  );
  const errors = contract
    .getErrorReport()
    .errors.filter(
      (error) =>
        !(
          error.src.includes("openzeppelin-contracts/contracts") ||
          error.src.includes("openzeppelin-contracts-upgrades/contracts")
        ),
    );
  for (const error of errors) {
    console.error(error);
  }
  if (errors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
