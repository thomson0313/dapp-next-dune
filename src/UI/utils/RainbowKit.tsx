// Packages
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { coinbaseWallet, metaMaskWallet, rabbyWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { arbitrum, optimism, polygon, mainnet, base } from "viem/chains";
import { getActiveChain } from "./RainbowKitHelpers";
import { _chains } from "@rainbow-me/rainbowkit/dist/config/getDefaultConfig";
import { createClient } from "viem";

// Project ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("Environment variable PROJECT_ID is not set.");
}

const isProd = getActiveChain().id === arbitrum.id;

// Chains
//Arbitrum is required for dev to display stats on
// Leaderboard https://app.canary.ithacanoemon.tech/argonaut
const devChains = [getActiveChain(), arbitrum];
const prodChains = [arbitrum, optimism, polygon, mainnet, base];
const chains = (isProd ? prodChains : devChains) as unknown as _chains;

// Info
const appInfo = {
  appName: "Ithaca",
};

// Connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet, rabbyWallet],
    },
  ],
  { appName: "Ithaca", projectId }
);

// Wagmi Config
const wagmiConfig = createConfig({
  chains,
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
  connectors,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

export { appInfo, wagmiConfig, isProd };
