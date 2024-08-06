import { getTruncateEthAddress } from "@/UI/utils/Points";
import { isAddress } from "viem";

export const getUserDisplayName = (
  displayName: string,
  walletAddress?: string,
  currentWalletAddress?: string
): string => {
  if (walletAddress && currentWalletAddress && walletAddress.toLowerCase() === currentWalletAddress.toLowerCase()) {
    return "You";
  }
  return isAddress(displayName) ? getTruncateEthAddress(displayName) : displayName;
};
