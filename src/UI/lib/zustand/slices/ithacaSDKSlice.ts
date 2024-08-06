import { StateCreator } from "zustand";
import { IthacaSDK, SocketOrder } from "@ithaca-finance/sdk";

import { checkAndDetectIp } from "@/services/kyc.api.service";
import { getFeatureFlag } from "@/utils/useFeature";
import { BasicDataSlice, CrossChainTransaction, IthacaSDKSlice } from "./types";
import mixPanel from "@/services/mixpanel";
import { fetchConfig } from "@/services/environment.service";
import { getSessionInfo } from "@/UI/services/PointsAPI";

export const createIthacaSDKSlice: StateCreator<IthacaSDKSlice> = (set, get) => ({
  delegatedWalletAddress: null,
  quotingParams: {
    // Initial params
    VANILLA_SPREAD: 5.25,
    DIGITAL_SPREAD: 0.05,
    FORWARD_SPREAD: 1.05,
  },
  isLoading: true,
  isLocationRestricted: false,
  isMaintenanceEnabled: false,
  isAuthenticated: false,
  ithacaSDK: undefined!,
  systemInfo: {
    chainId: 0,
    fundlockAddress: "" as `0x${string}`,
    tokenAddress: {},
    tokenDecimals: {},
    currencyPrecision: {},
    tokenManagerAddress: "" as `0x${string}`,
    networks: [],
  },
  nextAuction: 0,
  currentExpiryDate: 0,
  currentCurrencyPair: "WETH/USDC",
  currentSpotPrice: 0,
  currencyPrecision: { underlying: 0, strike: 0 },
  contractList: {},
  unFilteredContractList: [],
  expiryList: [],
  spotPrices: {},
  spotContract: {
    contractId: 0,
    payoff: "Spot",
    tradeable: true,
    referencePrice: 0,
    lowRange: 0,
    highRange: 0,
    lastPrice: 0,
    updateAt: "",
    economics: {
      currencyPair: "WETH/USDC",
      expiry: 0,
      priceCurrency: "",
      qtyCurrency: "",
    },
  },
  openOrdersCount: 0,
  toastNotifications: [],
  newToast: undefined,
  axelarSupportedChains: [],
  axelarSupportedTokens: [],
  contractsWithReferencePrices: {},
  crossChainTransactions: [],
  setIthacaSDK: async () => {
    const { API_URL, WS_URL, SUBGRAPH_URL, SQUID_API_URL } = await fetchConfig();
    // Initial chain before connecting wallet
    const ithacaSDK = new IthacaSDK({
      ithacaApiBaseUrl: API_URL,
      ithacaWsUrl: WS_URL,
      ithacaSubgraphUrl: SUBGRAPH_URL,
      squidApiBaseUrl: SQUID_API_URL,
    });
    set({ ithacaSDK });
    return ithacaSDK;
  },
  initIthacaSDK: async walletClient => {
    const { API_URL, WS_URL, SUBGRAPH_URL, SQUID_API_URL } = await fetchConfig();
    const ithacaSDK = new IthacaSDK({
      ithacaApiBaseUrl: API_URL,
      ithacaWsUrl: WS_URL,
      ithacaSubgraphUrl: SUBGRAPH_URL,
      squidApiBaseUrl: SQUID_API_URL,
      walletClient,
      wsCallbacks: {
        onClose: (ev: CloseEvent) => {
          console.log(ev);
        },
        onError: (ev: Event) => {
          console.log(ev);
        },
        onMessage: (payload: SocketOrder) => {
          set({
            openOrdersCount: payload?.totalOpenOrdersCount,
            newToast: payload,
            toastNotifications: [...get().toastNotifications, payload],
          });
        },
        onOpen: (ev: Event) => {
          console.log(ev);
        },
      },
    });

    // session exists - Already logged in user
    const ithacaSession = localStorage.getItem("ithaca.session");
    if (ithacaSession) {
      try {
        const currentSession = await ithacaSDK.auth.getSession();
        if (ithacaSession === JSON.stringify(currentSession)) {
          const crossChainTransactions = localStorage.getItem("ithaca.cross-chain-transactions");
          // POINTS_EVENTS: Awoke - service connected
          mixPanel.track("Awoke");
          set({
            ithacaSDK,
            isAuthenticated: true,
            crossChainTransactions: crossChainTransactions ? JSON.parse(crossChainTransactions) : [],
          });
          return;
        }
      } catch (error) {
        console.error("Session has timed out");
      }
    }

    // New login
    try {
      const newSession = await ithacaSDK.auth.login();
      localStorage.setItem("ithaca.session", JSON.stringify(newSession));
      localStorage.setItem("ithaca.cross-chain-transactions", JSON.stringify([]));
      window.dispatchEvent(new Event("storage"));
      // POINTS_EVENTS: Login - service connected
      mixPanel.track("Login");
      set({ ithacaSDK, isAuthenticated: true });
      return;
    } catch (error) {
      console.error("Failed to log in");
    }
  },
  disconnect: async () => {
    const { ithacaSDK } = get();

    await ithacaSDK.auth.logout();
    // POINTS_EVENTS: Logout - service connected
    mixPanel.track("Logout");
    ithacaSDK.auth.logout();
    localStorage.removeItem("ithaca.session");
    localStorage.removeItem("ithaca.cross-chain-transactions");
    const { API_URL, WS_URL, SUBGRAPH_URL, SQUID_API_URL } = await fetchConfig();
    const readOnlySDK = new IthacaSDK({
      ithacaApiBaseUrl: API_URL,
      ithacaWsUrl: WS_URL,
      ithacaSubgraphUrl: SUBGRAPH_URL,
      squidApiBaseUrl: SQUID_API_URL,
    });
    set({ ithacaSDK: readOnlySDK, isAuthenticated: false });
  },
  updateLocationRestriction: (isLocationRestricted: boolean) => {
    set({
      isLocationRestricted,
    });
  },
  setMaintenanceMode: (isMaintenanceEnabled: boolean) => {
    set({
      isMaintenanceEnabled,
    });
  },
  initIthacaProtocol: async () => {
    const { setIthacaSDK } = get();
    await setIthacaSDK();
  },
  setBasicData: ({
    quotingParams,
    systemInfo,
    spotContract,
    currencyPrecision,
    contractList,
    allContracts,
    expiryList,
    spotPrices,
    currentSpotPrice,
  }: BasicDataSlice) => {
    set({
      quotingParams: quotingParams ?? get().quotingParams,
      systemInfo,
      isMaintenanceEnabled: false,
      spotContract: spotContract || get().spotContract,
      isLoading: false,

      currencyPrecision,
      contractList: contractList,
      unFilteredContractList: allContracts,
      expiryList,
      spotPrices,
      currentSpotPrice,
    });
  },
  getContractsByPayoff: (payoff: string) => {
    const { contractList, currentCurrencyPair, currentExpiryDate } = get();
    return contractList[currentCurrencyPair][currentExpiryDate][payoff];
  },
  getContractsByExpiry: (expiry: string, payoff: string) => {
    const { contractList, currentCurrencyPair } = get();
    return contractList[currentCurrencyPair][expiry][payoff];
  },
  setCurrentExpiryDate: (date: number) => {
    set({ currentExpiryDate: date });
  },
  fetchAxelarSupportedTokens: async (chainId: number) => {
    const { ithacaSDK } = get();
    const axelarSupportedTokens = await ithacaSDK.fundlock.getTokens(chainId);
    set({ axelarSupportedTokens });
  },
  addCrossChainTransaction: (transaction: CrossChainTransaction) => {
    const crossChainTransactions = structuredClone(get().crossChainTransactions);
    crossChainTransactions.push(transaction);
    localStorage.setItem("ithaca.cross-chain-transactions", JSON.stringify(crossChainTransactions));
    window.dispatchEvent(new Event("storage"));
    set({ crossChainTransactions });
  },
  updateCrossChainTxnStatus: (transactions: CrossChainTransaction[]) => {
    localStorage.setItem("ithaca.cross-chain-transactions", JSON.stringify(transactions));
    window.dispatchEvent(new Event("storage"));
    set({ crossChainTransactions: transactions });
  },
  setDelegatedWalletAddress: (address: string | null) => {
    set({ delegatedWalletAddress: address });
  },
});
