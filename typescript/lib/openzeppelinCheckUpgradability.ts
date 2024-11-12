import {
  UpgradeableContract,
  SolcInput,
  SolcOutput,
  ValidationOptions,
} from "@openzeppelin/upgrades-core";
import { promises as fs } from "node:fs";
import path from "node:path";

interface ContractOptions extends ValidationOptions {
  name: string;
}

export function analyzeUpgradability(
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

export async function analyzeUpgradabilityFoundryProject(
  projectPath: string,
  contracts: ContractOptions[],
): Promise<void> {
  const baseFolder = path.resolve(projectPath, "out/build-info/");
  const jsonsInDir = (await fs.readdir(baseFolder)).filter(
    (file) => path.extname(file) === ".json",
  );

  if (jsonsInDir.length !== 1) {
    throw new Error(
      "More than one file in out/build-info.\nPlease clean and recompile with:\nforge clean & forge build --build-info",
    );
  }

  const buildFile = path.join(baseFolder, jsonsInDir[0] as string);

  const json = JSON.parse(await fs.readFile(buildFile, "utf8"));
  const solcInput: SolcInput = json.input;
  const solcOutput: SolcOutput = json.output;

  for (const contract of contracts) {
    analyzeUpgradability(contract.name, solcInput, solcOutput, contract);
  }
}
