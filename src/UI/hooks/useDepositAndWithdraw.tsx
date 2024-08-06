import { getActiveChain } from "@/UI/utils/RainbowKitHelpers";

import useToast from "@/UI/hooks/useToast";

import { useUserBalance } from "@/UI/hooks/useUserBalance";
import { useAccount, useConfig, usePublicClient, useWalletClient, useWatchBlocks } from "wagmi";
import { useAppStore } from "../lib/zustand/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GetRouteResponse } from "@ithaca-finance/sdk";
import { erc20Abi, formatEther, formatUnits, parseUnits } from "viem";
import mixPanel from "@/services/mixpanel";
import { SelectedCurrency } from "@/utils/types";
import { HOW_MANY_MINUTES_AFTER_DEPOSIT_CAN_RELEASE } from "../components/TableFundLock/SIngleRow";
import { debounce } from "lodash";
import { getNumberValue } from "../utils/Numbers";
import { isProd } from "../utils/RainbowKit";

export const useDepositAndWithdraw = () => {
  const { collateralSummary, handleFetchingBalance } = useUserBalance();

  const activeChainPublicClient = usePublicClient({ chainId: getActiveChain().id });
  const sourceChainPublicClient = usePublicClient();
  const { address, chain } = useAccount();
  const { chains } = useConfig();

  const supportedChains = useMemo(() => {
    const _chains = isProd ? chains : [getActiveChain()];
    return _chains.map(({ id, name, nativeCurrency }) => ({
      name,
      value: `${id}`,
      nativeCurrency,
    }));
  }, [chains]);

  const { data: walletClient } = useWalletClient();
  const { systemInfo, ithacaSDK, fetchAxelarSupportedTokens, addCrossChainTransaction } = useAppStore();

  const { showToast } = useToast();
  const [modalAmount, setModalAmount] = useState("");
  const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);
  const [selectedChain, setSelectedChain] = useState({
    name: getActiveChain().name,
    value: `${getActiveChain().id}`,
    nativeCurrency: getActiveChain().nativeCurrency,
  });
  const [sourceChainCurrency, setSourceChainCurrency] = useState<{
    name: string;
    value: `0x${string}`;
    decimals: number;
  }>();
  const [sourceChainAmount, setSourceChainAmount] = useState("");
  const [estimationInProgress, setEstimationInProgress] = useState(false);
  const [crossChainTxnRoute, setCrossChainTxnRoute] = useState<GetRouteResponse["route"]>();
  const [isAxelarTokensLoading, setIsAxelarTokensLoading] = useState(false);
  const [sourceChainCurrencyBalance, setSourceChainCurrencyBalance] = useState("0");
  const estimationTimeoutRef = useRef<NodeJS.Timeout>();

  const supportedTokens = useMemo(() => {
    return Object.keys(collateralSummary).map(currenyName => {
      return { name: currenyName, value: systemInfo.tokenAddress[currenyName] };
    });
  }, [collateralSummary]);

  const [selectedCurrency, setSelectedCurrency] = useState<SelectedCurrency | undefined>(supportedTokens[0]);

  const estimatedFee = useMemo(() => {
    return {
      fee: formatEther(BigInt(crossChainTxnRoute?.transactionRequest.value || "0")),
      nativeCurrency: selectedChain.nativeCurrency,
      isLoading: estimationInProgress,
    };
  }, [crossChainTxnRoute, selectedChain, estimationInProgress]);

  useWatchBlocks({
    chainId: Number(selectedChain.value),
    onBlock: async () => {
      if (!sourceChainCurrency || !sourceChainPublicClient || !address) return;
      let balance: bigint;
      if (sourceChainCurrency.value === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        balance = await sourceChainPublicClient.getBalance({ address });
      } else {
        balance = await sourceChainPublicClient.readContract({
          address: sourceChainCurrency.value,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
      }
      setSourceChainCurrencyBalance(formatUnits(balance, sourceChainCurrency.decimals));
    },
    enabled: !!(address && sourceChainPublicClient && sourceChainCurrency),
  });

  const handleSourceChainAmountChange = async (value: string) => {
    const amount = getNumberValue(value);
    setSourceChainAmount(amount);
    if (!sourceChainCurrency || !selectedCurrency) return;
    clearTimeout(estimationTimeoutRef.current);
    const estimationTimeout = setTimeout(() => {
      estimateCrossChainTxn(sourceChainCurrency, selectedCurrency, amount);
    }, 500);
    estimationTimeoutRef.current = estimationTimeout;
  };

  const retryAction = async (action: () => Promise<void>, retries: number = 10, waitTime: number = 3000) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await action();
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt < retries - 1) {
          await new Promise(res => setTimeout(res, waitTime));
        } else {
          throw new Error("All retries failed.");
        }
      }
    }
  };

  const deposit = async () => {
    if (!selectedCurrency) return;
    try {
      setIsTransactionInProgress(true);
      if (Number(selectedChain.value) === getActiveChain().id) {
        const amount = parseUnits(modalAmount, systemInfo.tokenDecimals[selectedCurrency.name]);
        const hash = await ithacaSDK.fundlock.deposit(selectedCurrency.value, amount);
        await activeChainPublicClient?.waitForTransactionReceipt({ hash });
        showToast({
          title: "Deposit successful",
          message: `${modalAmount} ${selectedCurrency.name} deposited to fundlock`,
          type: "success",
        });
        // POINTS_EVENTS: Deposit - service connected
        mixPanel.track("Deposit", {
          amount: modalAmount,
          currency: selectedCurrency.name,
        });
      } else {
        if (!walletClient || !crossChainTxnRoute) return;
        const hash = await ithacaSDK.fundlock.crossChainDeposit(walletClient, crossChainTxnRoute);
        await activeChainPublicClient?.waitForTransactionReceipt({ hash });
        const fetchAxelarStatus = async () => {
          const txnStatus = await ithacaSDK.fundlock.getCrossChainTxStatus(hash);
          addCrossChainTransaction({ route: crossChainTxnRoute, status: txnStatus, timestamp: Date.now() });
          showToast({
            title: "Cross-chain deposit successful",
            message: `${modalAmount} ${selectedCurrency.name} deposited to fundlock`,
            type: "success",
          });
          // POINTS_EVENTS: Cross-chain deposit - service connected
          mixPanel.track("Cross-chain deposit", {
            amount: modalAmount,
            currency: selectedCurrency.name,
          });
        };
        await retryAction(fetchAxelarStatus);
      }
      handleFetchingBalance(false);
    } catch (error) {
      handleFetchingBalance(true);
      showToast({
        title: "Deposit unsuccessful",
        message: `Failed to deposit, please try again.`,
        type: "error",
      });
      console.error("Failed to deposit", error);
    } finally {
      setIsTransactionInProgress(false);
    }
  };

  const withdraw = async () => {
    if (!selectedCurrency) return;
    const amount = parseUnits(modalAmount, systemInfo.tokenDecimals[selectedCurrency.name]);
    try {
      setIsTransactionInProgress(true);
      await ithacaSDK.fundlock.withdraw(selectedCurrency.value, amount);
      handleFetchingBalance(false);
      showToast({
        title: "Withdraw successful",
        message: `You can release funds in ${HOW_MANY_MINUTES_AFTER_DEPOSIT_CAN_RELEASE} Mins`,
        type: "success",
      });
      // updateStep?.(TutorialSteps.WITHDRAWAL_TRANSACTION_HISTORY_TAB);
      // POINTS_EVENTS: Withdraw - service connected
      mixPanel.track("Cross-chain deposit", {
        amount: modalAmount,
        currency: selectedCurrency.name,
      });
      // setDashboardTab?.("fundLockHistory");
      // Don't close modal after finishing deposit
      // handleCloseModal();
    } catch (error) {
      handleFetchingBalance(true);
      showToast({
        title: "Withdrawal unsuccessful",
        message: `Failed to withdraw, please try again.`,
        type: "error",
      });
      console.error("Failed to withdraw", error);
    } finally {
      setIsTransactionInProgress(false);
    }
  };

  const estimateCrossChainTxn = useCallback(
    async (
      fromToken: {
        name: string;
        value: `0x${string}`;
        decimals: number;
      },
      toToken: {
        name: string;
        value: `0x${string}`;
      },
      fromAmount: string
    ) => {
      try {
        setEstimationInProgress(true);
        const route = await ithacaSDK.fundlock.getCrossChainDepositRoute(
          Number(selectedChain.value),
          getActiveChain().id,
          fromToken.value,
          toToken.value,
          parseUnits(fromAmount, fromToken.decimals)
        );
        setCrossChainTxnRoute(route);
        setModalAmount(formatUnits(BigInt(route.estimate.toAmount), systemInfo.tokenDecimals[toToken.name]));
      } catch (error) {
        setModalAmount("");
        console.error("Failed to estimate cross chain deposit", error);
      } finally {
        setEstimationInProgress(false);
      }
    },
    [ithacaSDK, selectedChain, systemInfo]
  );

  useEffect(() => {
    if (isTransactionInProgress) return;
    if (!sourceChainCurrency || !selectedCurrency || !sourceChainAmount) return;

    const debounced = debounce(estimateCrossChainTxn, 500);
    debounced(sourceChainCurrency, selectedCurrency, sourceChainAmount);

    return () => {
      debounced.cancel();
    };
  }, [estimateCrossChainTxn, isTransactionInProgress, selectedCurrency, sourceChainAmount, sourceChainCurrency]);

  return {
    // axelarSupportedTokens,
    chain,
    isProd,
    estimatedFee,
    supportedChains,
    collateralSummary,
    crossChainTxnRoute,
    estimationInProgress,
    estimationTimeoutRef,
    isAxelarTokensLoading,
    isTransactionInProgress,
    modalAmount,
    selectedCurrency,
    selectedChain,
    sourceChainCurrency,
    sourceChainCurrencyBalance,
    sourceChainAmount,
    supportedTokens,
    deposit,
    fetchAxelarSupportedTokens,
    handleSourceChainAmountChange,
    setCrossChainTxnRoute,
    setEstimationInProgress,
    setIsTransactionInProgress,
    setIsAxelarTokensLoading,
    setModalAmount,
    setSelectedChain,
    setSelectedCurrency,
    setSourceChainCurrency,
    setSourceChainAmount,
    setSourceChainCurrencyBalance,
    withdraw,
  };
};
