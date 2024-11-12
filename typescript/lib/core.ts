import { resolve } from "node:path";
import { config } from "dotenv";
import {
  Account,
  Chain,
  Hex,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const projectRoot: string = resolve(__dirname, "../../..");

export const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw Error(`Environment variable ${key} not found`);
  }
  return value;
};

export interface ChainVariables {
  rpcUrl: string;
  chainId: number;
  publicClient: PublicClient;
  deployerWallet: WalletClient<Transport, Chain, Account>;
  verifier?: VerifyOptions;
}

export interface VerifyOptions {
  url: string;
  apiKey: string;
}

export const loadVerifierVariables = (): VerifyOptions | undefined => {
  if (!process.env["VERIFIER_URL"]) {
    return undefined;
  }
  return {
    url: ensureEnv("VERIFIER_URL"),
    apiKey: ensureEnv("VERIFIER_API_KEY"),
  };
};

export const loadChainVariables = async (
  chain: string,
): Promise<ChainVariables> => {
  const envPath = resolve(projectRoot, `.env.${chain}`);
  config({ path: envPath });

  const rpcUrl = ensureEnv("RPC_URL");
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({
    transport,
  });
  const chainId = await publicClient.getChainId();
  console.info(`Detected id ${chainId} for chain ${chain}`);

  const deployerAccount = privateKeyToAccount(ensureEnv("PRIVATE_KEY") as Hex);

  const deployerWallet = createWalletClient({
    account: deployerAccount,
    // TODO: look up the chain from chainId
    chain: defineChain({
      id: chainId,
      name: chain,
      nativeCurrency: { name: "", symbol: "", decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
    }),
    transport,
  });

  return {
    rpcUrl,
    verifier: loadVerifierVariables(),
    chainId,
    publicClient,
    deployerWallet,
  };
};
