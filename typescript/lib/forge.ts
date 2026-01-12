import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { getForgeCommand } from "@foundry-rs/easy-foundryup";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { VerifyOptions } from "./core";

const execFileAsync = promisify(execFile);

export interface ForgeOptions {
  cwd: string;
}

export interface DeployOptions {
  sender: string;
  privateKey: string;
  scriptToExecute: string;
  rpcUrl: string;
  /** Whether to wait for each transaction to complete and not do things in
   * parallel */
  slow: boolean;
  /**
   * Whether to broadcast the transactions
   */
  dryRun: boolean;
  /**
   * Whether to skip deployment and only verify
   */
  verifyOnly: boolean;
  verifyOptions?: VerifyOptions;
}

export class Forge {
  private readonly _path: string;
  private readonly _options: ForgeOptions;

  private constructor(forgePath: string, options: ForgeOptions) {
    this._path = forgePath;
    this._options = options;
  }

  public static async initialize(): Promise<Forge> {
    const forgePath = await getForgeCommand();
    const options: ForgeOptions = {
      cwd: resolve(__dirname, "..", "..", ".."),
    };
    return new Forge(forgePath, options);
  }

  /**
   * Run a forge command
   * @param args command line parameters to forge
   */
  public async run(args: string[]): Promise<void> {
    console.info("Running with", {
      args,
      cwd: this._options.cwd,
    });
    const childProcess = spawn(this._path, args, {
      cwd: this._options.cwd,
      env: process.env,
      stdio: ["ignore", "inherit", "inherit"],
    });
    process.on("exit", function () {
      childProcess.kill();
    });

    process;

    return new Promise((resolve, reject) => {
      childProcess.once("error", reject);
      childProcess.once("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Exited with code ${code}`));
        }
      });
    });
  }

  public async runWithStdio(
    args: string[],
  ): Promise<{ stdout: string; stderr: string }> {
    console.info("Running with", {
      args,
    });
    return execFileAsync(this._path, args, {
      cwd: this._options.cwd,
      env: process.env,
    });
  }

  public async deploy(options: DeployOptions): Promise<void> {
    if (options.verifyOnly) {
      console.info("Skipping deployment, and only verifying");
      return;
    }

    const args: string[] = ["script", options.scriptToExecute, "-vvvv"];

    if (options.dryRun) {
      // Upgrade scripts rely on this to not write out the deployment json
      process.env["US_DRY_RUN"] = "true";
    } else {
      process.env["US_DRY_RUN"] = "false";
      args.push("--broadcast");
    }

    if (options.slow) {
      args.push("--slow");
    }

    args.push("--ffi");
    args.push("--sender", options.sender);
    args.push("--private-key", options.privateKey);
    args.push("--rpc-url", options.rpcUrl);

    await this.run(args);
  }

  public async verify(options: DeployOptions): Promise<void> {
    if (!options.verifyOptions) {
      console.warn("Skipping verification due to no verifier url or api key");
      return;
    }

    const args: string[] = ["script", options.scriptToExecute, "-vvvv"];

    args.push("--verify", "--resume", "--broadcast");
    args.push("--sender", options.sender);
    args.push("--private-key", options.privateKey);
    args.push("--verifier", "etherscan");
    args.push("--verifier-url", options.verifyOptions.url);
    args.push("--etherscan-api-key", options.verifyOptions.apiKey);
    args.push("--rpc-url", options.rpcUrl);

    await this.run(args);
  }

  public async deployAndVerify(deployOptions: DeployOptions): Promise<void> {
    await this.deploy(deployOptions);

    if (deployOptions.dryRun) {
      console.info("Skipping verification due to dry run");
      return;
    }
    if (deployOptions.rpcUrl.includes("localhost")) {
      console.info("Skipping verification due to localhost deployment");
      return;
    }

    await this.verify(deployOptions);
  }

  public async getAbi(contractName: string): Promise<string> {
    const { stdout } = await this.runWithStdio([
      "inspect",
      contractName,
      "abi",
    ]);
    return stdout;
  }
}
