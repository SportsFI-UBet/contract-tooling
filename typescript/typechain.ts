import { runTypeChain, glob } from "typechain";
import { projectRoot } from "./lib/core";

async function main(): Promise<void> {
  const allFiles = glob(projectRoot, [`out/[!build-info]**/[!test]*.json`]);
  const result = await runTypeChain({
    cwd: projectRoot,
    filesToProcess: allFiles,
    allFiles,
    outDir: "typechain/",
    target: "ethers-v5",
  });

  console.log("Generating TypeScript types for ethers-v5:", result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
