import { QuotingParams } from "@/types/calc.api";
import {
  Contract,
  IthacaSDK,
  SocketOrder,
  ReferencePrice,
  SystemInfo,
  SquidTokenData,
  GetStatusResponse,
  GetRouteResponse,
  BestBidPreciseResponse,
} from "@ithaca-finance/sdk";
import { Account, Chain, Transport, WalletClient } from "viem";

export interface ContractDetails {
  [strike: string]: Contract & ReferencePrice;
}

export interface ContractList {
  [currencyPair: string]: {
    [expiry: string]: {
      [payoff: string]: ContractDetails;
    };
  };
}

export interface CrossChainTransaction {
  route: GetRouteResponse["route"];
  status: GetStatusResponse;
  timestamp: number;
}

export interface BestBidAsk {
  [key: string]: {
    bestAsk: number | null;
    bestAskType: string | null;
    bestBid: number | null;
    bestBidType: string | null;
  };
}

export interface IthacaSDKSlice {
  delegatedWalletAddress: string | null;
  quotingParams: QuotingParams;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocationRestricted: boolean;
  isMaintenanceEnabled: boolean;
  ithacaSDK: IthacaSDK;
  systemInfo: SystemInfo;
  nextAuction: number;
  currentExpiryDate: number;
  currentCurrencyPair: string;
  currentSpotPrice: number;
  currencyPrecision: { underlying: number; strike: number };
  contractList: ContractList;
  unFilteredContractList: Contract[];
  expiryList: number[];
  spotPrices: { [currencyPair: string]: number };
  toastNotifications: SocketOrder[];
  openOrdersCount: number;
  newToast?: SocketOrder;
  contractsWithReferencePrices: { [key: string]: Contract & ReferencePrice };
  spotContract: Contract & ReferencePrice;
  axelarSupportedTokens: SquidTokenData[];
  crossChainTransactions: CrossChainTransaction[];
  setIthacaSDK: () => Promise<IthacaSDK>;
  initIthacaSDK: (
    walletClient: WalletClient<Transport, Chain, Account>,
    retryCount?: number,
    maxRetries?: number
  ) => void;
  disconnect: () => void;
  initIthacaProtocol: (retryCount?: number, maxRetries?: number) => Promise<void>;
  getContractsByPayoff: (payoff: string) => ContractDetails;
  getContractsByExpiry: (expiry: string, payoff: string) => ContractDetails;
  setCurrentExpiryDate: (date: number) => void;
  fetchAxelarSupportedTokens: (chainId: number) => Promise<void>;
  addCrossChainTransaction: (transaction: CrossChainTransaction) => void;
  updateCrossChainTxnStatus: (transactions: CrossChainTransaction[]) => void;
  setDelegatedWalletAddress: (address: string | null) => void;
  setBasicData: (data: BasicDataSlice) => void;
  setMaintenanceMode: (isMaintenanceEnabled: boolean) => void;
  updateLocationRestriction: (isLocationRestricted: boolean) => void;
}

export type BasicDataSlice = Pick<
  IthacaSDKSlice,
  | "currentSpotPrice"
  | "spotPrices"
  | "expiryList"
  | "quotingParams"
  | "systemInfo"
  | "currencyPrecision"
  | "contractList"
> & { allContracts: Contract[]; spotContract?: Contract & ReferencePrice };
