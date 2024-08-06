export const NEXT_AUCTION = "7Jan99";

export const MAXIMUM_POSITION_SIZE = 1_000_000;

export const ACCESS_MANAGEMENT_TYPES = {
  ApiKey: "ApiKey",
  Wallet: "Wallet",
} as const;

export const POSITIONS_DECIMAL_PLACES = 2;

export const DEFAULT_REFETCH_INTERVAL = 60_000;
export const DEFAULT_DATA_STALE_TIME = 30_000;
export const DEFAULT_DATA_CACHE_IN_STORAGE = 1000 * 60 * 60 * 1; // 1 hour

// Query keys
export const WALLET_SWITCH_LIST_KEY = "walletSwitchList";
export const BEST_BID_ASK_PRECISE = "fetchBestBidAskPrecise";
export const SYSTEM_BASIC_DATA = "BASIC_DATA";
