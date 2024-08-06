// Packages
import { debounce } from "lodash";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SwitchChainErrorType, erc20Abi, formatEther, formatUnits, parseUnits } from "viem";
import { useAccount, useConfig, usePublicClient, useWalletClient, useWatchBlocks } from "wagmi";
import { GetRouteResponse } from "@ithaca-finance/sdk";

// Constants
import { MODAL_TABS } from "@/UI/constants/tabs";
import { HOW_MANY_MINUTES_AFTER_DEPOSIT_CAN_RELEASE } from "../TableFundLock/SIngleRow";

// Store
import { useAppStore } from "@/UI/lib/zustand/store";

// Utils
import { getNumberValue } from "@/UI/utils/Numbers";
import { Currency, SelectedCurrency } from "@/utils/types";
import mixPanel from "@/services/mixpanel";

// Icons
import LogoArbitrum from "../Icons/LogoArbitrum";

// Components
import Balance from "@/UI/components/Balance/Balance";
import Button from "@/UI/components/Button/Button";
import DropdownMenu from "@/UI/components/DropdownMenu/DropdownMenu";
import Tabs from "@/UI/components/Tabs/Tabs";
import Input from "@/UI/components/Input/Input";
import Loader from "../Loader/Loader";
import { getActiveChain } from "@/UI/utils/RainbowKitHelpers";
import useToast from "@/UI/hooks/useToast";

// Styles
import styles from "./ManageFundsModal.module.scss";

import TutorialPopover from "../TutorialPopover/TutorialPopover";
import { TutorialSteps } from "@/UI/constants/tutorialsteps";
import { OnboardingContext } from "@/UI/providers/onboarding-provider";

import { isProd } from "@/UI/utils/RainbowKit";
import { useUserBalance } from "@/UI/hooks/useUserBalance";

const Modal = dynamic(() => import("@/UI/components/Modal/Modal"), {
  ssr: false,
});

interface ManageFundsModalProps {
  modalTab: "deposit" | "withdraw" | undefined;
  selectedCurrency: SelectedCurrency | undefined;
  setSelectedCurrency: (currency: SelectedCurrency | undefined) => void;
  displayModalTypeTabs?: boolean;
  setIsFetchingBalanceEnabled?: (item: boolean, currency?: SelectedCurrency) => void;
  setModalTab?: Dispatch<SetStateAction<"deposit" | "withdraw" | undefined>>;
  setDashboardTab?: Dispatch<SetStateAction<string>>;
}

const ManageFundsModal = (props: ManageFundsModalProps) => {
  const { collateralSummary } = useUserBalance();

  const activeChainPublicClient = usePublicClient({ chainId: getActiveChain().id });
  const sourceChainPublicClient = usePublicClient();
  const { address, chain } = useAccount();
  const { chains } = useConfig();

  const { data: walletClient } = useWalletClient();
  const { systemInfo, ithacaSDK, axelarSupportedTokens, fetchAxelarSupportedTokens, addCrossChainTransaction } =
    useAppStore();

  const { currentStep, updateStep, isTutorialDisabled } = useContext(OnboardingContext);
  const { showToast } = useToast();
  const {
    displayModalTypeTabs = true,
    setIsFetchingBalanceEnabled,
    modalTab,
    setModalTab,
    selectedCurrency,
    setSelectedCurrency,
    setDashboardTab,
  } = props;
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

  const handleFetchingBalance = (status: boolean) => {
    if (setIsFetchingBalanceEnabled) {
      setIsFetchingBalanceEnabled(status, selectedCurrency);
    }
  };

  const handleChangeModalTab = (tab: "deposit" | "withdraw") => {
    if (setModalTab) {
      setModalTab(tab);
      setSelectedChain({
        name: getActiveChain().name,
        value: `${getActiveChain().id}`,
        nativeCurrency: getActiveChain().nativeCurrency,
      });
    } else {
      console.warn("Set modal tab not defined");
    }
  };

  const switchNetwork = async () => {
    try {
      setIsTransactionInProgress(true);
      await walletClient?.switchChain({ id: Number(selectedChain.value) });
    } catch (error) {
      showToast({
        title: "Failed to switch network",
        message: (error as SwitchChainErrorType).message,
        type: "error",
      });
      console.error(error);
    } finally {
      setIsTransactionInProgress(false);
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
      handleCloseModal();
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
      updateStep?.(TutorialSteps.WITHDRAWAL_TRANSACTION_HISTORY_TAB);
      // POINTS_EVENTS: Withdraw - service connected
      mixPanel.track("Cross-chain deposit", {
        amount: modalAmount,
        currency: selectedCurrency.name,
      });
      setDashboardTab?.("fundLockHistory");
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

  const handleSubmit = async () => {
    if (chain?.id !== Number(selectedChain.value)) {
      await switchNetwork();
      return;
    }
    if (modalTab === "deposit") {
      await deposit();
    } else {
      await withdraw();
    }
  };

  const modalFooterText = useMemo(() => {
    if (isTransactionInProgress) {
      return <Loader />;
    }
    if (Number(selectedChain.value) !== chain?.id) {
      return "Switch network";
    }
    if (Number(selectedChain.value) !== getActiveChain().id) {
      return "Deposit Cross-Chain";
    }
    return modalTab === "deposit" ? "Deposit" : "Withdraw";
  }, [chain, isTransactionInProgress, modalTab, selectedChain.value]);

  const handleCloseModal = () => {
    updateStep?.(TutorialSteps.SUBMIT_TO_AUCTION);
    setModalTab?.(undefined);
    setSourceChainAmount("");
    setModalAmount("");
    setCrossChainTxnRoute(undefined);
    setSelectedChain({
      name: getActiveChain().name,
      value: `${getActiveChain().id}`,
      nativeCurrency: getActiveChain().nativeCurrency,
    });
    setSourceChainCurrency(undefined);
    setSelectedCurrency(undefined);
  };

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

  useEffect(() => {
    if (modalTab === "withdraw") {
      showToast({
        title: "Withdrawal",
        message: "Sign message in your wallet to approve token withdrawal from Ithaca onto your connected wallet.",
      });
    }
    if (modalTab === "deposit") {
      showToast({
        title: "Deposit",
        message: "Sign message in your wallet to approve token deposit onto Ithaca smart contract.",
      });

      showToast({
        title: "Step 2 - Approve Deposit of Funds",
        message:
          "Sign message 2 of 2 so as to approve the transfer of specified deposit amount onto Ithaca smart contract.",
      });

      // Logic to decide which initial tutorial step to show based on users balance
      if (!isTutorialDisabled && selectedCurrency && updateStep) {
        // Logic to hide if a user already has fundlockValue
        if (collateralSummary[selectedCurrency?.name].fundLockValue) {
          updateStep(undefined);
        } else if (Number(collateralSummary[selectedCurrency.name]?.walletBalance || 0)) {
          updateStep(TutorialSteps.DEPOSIT_WITH_BALANCE_CHAIN);
        } else if (selectedCurrency?.name === "WETH") {
          updateStep(TutorialSteps.DEPOSIT_WITHOUT_BALANCE_WETH);
        } else {
          updateStep(TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC);
        }
      }
    } else if (
      currentStep !== TutorialSteps.WITHDRAWAL_TRANSACTION_HISTORY_TAB &&
      currentStep !== TutorialSteps.WITHDRAWAL_RELEASE_FUNDS
    ) {
      updateStep?.(undefined);
    }
  }, [modalTab]);

  useEffect(() => {
    if (!modalTab) return;
    if (modalTab === "deposit" && !isTutorialDisabled && updateStep && selectedCurrency) {
      // If a user changes token need to show correct step based on their wallet balance
      if (currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC) {
        if (collateralSummary[selectedCurrency?.name].fundLockValue) {
          updateStep(undefined);
        } else if (Number(collateralSummary[selectedCurrency?.name]?.walletBalance || 0)) {
          updateStep(TutorialSteps.DEPOSIT_WITH_BALANCE_CHAIN);
        } else if (selectedCurrency?.name === "WETH") {
          updateStep(TutorialSteps.DEPOSIT_WITHOUT_BALANCE_WETH);
        } else {
          updateStep(TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC);
        }
      } else if (currentStep === TutorialSteps.DEPOSIT_WITH_BALANCE_TOKEN_USDC) {
        if (selectedCurrency?.name === "WETH" && Number(collateralSummary[selectedCurrency?.name].walletBalance || 0)) {
          updateStep(TutorialSteps.DEPOSIT_WITH_BALANCE_TOKEN_WETH);
        } else {
          updateStep(TutorialSteps.DEPOSIT_WITH_BALANCE_TOKEN_USDC);
        }
      }
    } else if (
      currentStep !== TutorialSteps.WITHDRAWAL_TRANSACTION_HISTORY_TAB &&
      currentStep !== TutorialSteps.WITHDRAWAL_RELEASE_FUNDS
    ) {
      updateStep?.(undefined);
    }
  }, [currentStep, collateralSummary["USDC"]?.walletBalance, collateralSummary["WETH"]?.walletBalance]);

  if (!modalTab) return null;
  return (
    <>
      <Modal
        className='p-16'
        title={Number(selectedChain.value) === getActiveChain().id ? "Manage Funds" : "Manage Funds Cross-Chain"}
        isOpen={!!modalTab}
        onCloseModal={handleCloseModal}
        isLoading={isTransactionInProgress}
        hideFooter={true}
      >
        {displayModalTypeTabs && (
          <Tabs
            tabs={MODAL_TABS}
            className='mb-20'
            activeTab={modalTab}
            onChange={tabId => handleChangeModalTab(tabId as "deposit" | "withdraw")}
          />
        )}
        {modalTab === "deposit" && Number(selectedChain.value) !== getActiveChain().id && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginTop: 0, marginBottom: 20 }}>
              <h4 className={styles.receiveTitle}>Deposit from your linked wallet</h4>
            </div>
            <div className='tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row'>
              <div className='tw-flex tw-flex-[0.7] tw-flex-row'>
                <DropdownMenu
                  hasDropdown={modalTab === "deposit"}
                  className='full-width'
                  options={chains.map(({ id, name, nativeCurrency }) => ({ name, value: `${id}`, nativeCurrency }))}
                  value={selectedChain}
                  onChange={async (_, option) => {
                    setSourceChainCurrency(undefined);
                    setSelectedChain(option);
                    setIsAxelarTokensLoading(true);
                    await fetchAxelarSupportedTokens(Number(option.value));
                    setIsAxelarTokensLoading(false);
                  }}
                />
              </div>
              <div className='tw-flex tw-flex-1 tw-gap-2'>
                <TutorialPopover
                  isOpen={currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_DEPOSIT_TOKEN}
                  align='end'
                  side='top'
                >
                  <div style={{ flex: 1.2 }}>
                    <DropdownMenu
                      isLoading={isAxelarTokensLoading}
                      className='full-width'
                      options={axelarSupportedTokens.map(({ address, decimals, symbol }) => ({
                        name: symbol,
                        value: address,
                        decimals,
                      }))}
                      value={sourceChainCurrency}
                      onChange={(_, option) => {
                        if (!isTutorialDisabled && updateStep) {
                          updateStep(TutorialSteps.DEPOSIT_WITHOUT_BALANCE_CONVERTED_TOKEN);
                        }
                        setSourceChainCurrency(option);
                      }}
                    />
                  </div>
                </TutorialPopover>

                <div style={{ flex: 1 }}>
                  <Input
                    className='full-width'
                    containerClassName='full-width'
                    value={sourceChainAmount}
                    onChange={({ target }) => handleSourceChainAmountChange(target.value)}
                  />
                </div>
                <Button
                  variant='secondary'
                  size='sm'
                  title='Select All Assets'
                  onClick={() =>
                    sourceChainCurrencyBalance && handleSourceChainAmountChange(sourceChainCurrencyBalance)
                  }
                >
                  All
                </Button>
              </div>
            </div>
            {sourceChainCurrency && (
              <div>
                <Balance
                  selectedCurrency={sourceChainCurrency.name as Currency}
                  estimatedFee={{
                    fee: formatEther(BigInt(crossChainTxnRoute?.transactionRequest.value || "0")),
                    nativeCurrency: selectedChain.nativeCurrency,
                    isLoading: estimationInProgress,
                  }}
                  balance={sourceChainCurrencyBalance}
                  margin='mtb-20'
                />
              </div>
            )}
          </div>
        )}
        {Number(selectedChain.value) !== getActiveChain().id && (
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <h4 className={styles.receiveTitle}>Receive appx. onto Ithaca smart contract</h4>
          </div>
        )}
        {modalTab === "deposit" && Number(selectedChain.value) === getActiveChain().id && (
          <div style={{ marginTop: 0, marginBottom: 20 }}>
            <h4 className={styles.receiveTitle}>Deposit from your linked wallet</h4>
          </div>
        )}
        {modalTab !== "deposit" && Number(selectedChain.value) === getActiveChain().id && (
          <div style={{ marginTop: 0, marginBottom: 20 }}>
            <h4 className={styles.receiveTitle}>Withdraw to your linked wallet</h4>
          </div>
        )}
        <div className='tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row'>
          <TutorialPopover
            isOpen={
              currentStep === TutorialSteps.DEPOSIT_WITH_BALANCE_CHAIN ||
              currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_CHAIN
            }
            align='end'
            side='top'
          >
            <div className='tw-flex tw-flex-[0.7] tw-flex-row'>
              <DropdownMenu
                disabled={Number(selectedChain.value) !== getActiveChain().id}
                hasDropdown={Number(selectedChain.value) === getActiveChain().id}
                className='full-width'
                options={(isProd ? chains : [getActiveChain()]).map(({ id, name, nativeCurrency }) => ({
                  name,
                  value: `${id}`,
                  nativeCurrency,
                }))}
                value={{
                  name: getActiveChain().name,
                  value: `${getActiveChain().id}`,
                  nativeCurrency: getActiveChain().nativeCurrency,
                }}
                onChange={async (_, option) => {
                  if (
                    !isTutorialDisabled &&
                    updateStep &&
                    (currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_CHAIN ||
                      currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC ||
                      currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_WETH)
                  ) {
                    updateStep(TutorialSteps.DEPOSIT_WITHOUT_BALANCE_DEPOSIT_TOKEN);
                  }
                  setSelectedChain(option);
                  setIsAxelarTokensLoading(true);
                  await fetchAxelarSupportedTokens(Number(option.value));
                  setIsAxelarTokensLoading(false);
                }}
                iconStart={<LogoArbitrum />}
              />
            </div>
          </TutorialPopover>
          <div className='tw-flex tw-flex-1 tw-gap-2'>
            <TutorialPopover
              isOpen={
                currentStep === TutorialSteps.DEPOSIT_WITH_BALANCE_TOKEN_USDC ||
                currentStep === TutorialSteps.DEPOSIT_WITH_BALANCE_TOKEN_WETH ||
                currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_CONVERTED_TOKEN
              }
              align='end'
              side={currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_CONVERTED_TOKEN ? "bottom" : "top"}
            >
              <div style={{ flex: 1.2 }}>
                <DropdownMenu
                  className='full-width'
                  options={[
                    {
                      name: "WETH",
                      value: systemInfo.tokenAddress["WETH"],
                    },
                    {
                      name: "USDC",
                      value: systemInfo.tokenAddress["USDC"],
                    },
                  ]}
                  value={selectedCurrency}
                  onChange={(_, option) => {
                    if (
                      !isTutorialDisabled &&
                      updateStep &&
                      (currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC ||
                        currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_WETH)
                    ) {
                      updateStep(
                        currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC
                          ? TutorialSteps.DEPOSIT_WITHOUT_BALANCE_WETH
                          : TutorialSteps.DEPOSIT_WITHOUT_BALANCE_USDC
                      );
                    }
                    setSelectedCurrency(option);
                  }}
                  iconStart={selectedCurrency && collateralSummary[selectedCurrency.name].currencyLogo}
                />
              </div>
            </TutorialPopover>
            <TutorialPopover isOpen={currentStep === TutorialSteps.DEPOSIT_WITH_BALANCE_AMOUNT} align='end' side='top'>
              <div style={{ flex: 1 }}>
                <Input
                  disabled={Number(selectedChain.value) !== getActiveChain().id}
                  className='full-width'
                  containerClassName='full-width'
                  value={modalAmount}
                  onChange={({ target }) => setModalAmount(getNumberValue(target.value))}
                  isLoading={estimationInProgress}
                />
              </div>
            </TutorialPopover>
            {Number(selectedChain.value) === getActiveChain().id ? (
              <Button
                variant='secondary'
                size='sm'
                title='Select All Assets'
                onClick={() => {
                  if (selectedCurrency) {
                    if (modalTab === "deposit") {
                      setModalAmount(collateralSummary[selectedCurrency.name].walletBalance);
                    } else {
                      setModalAmount(`${collateralSummary[selectedCurrency.name].fundLockValue}`);
                    }
                  }
                }}
              >
                All
              </Button>
            ) : (
              <></>
            )}
          </div>
        </div>
        {selectedCurrency && (
          <Balance
            selectedCurrency={selectedCurrency.name as Currency}
            fundLock={collateralSummary[selectedCurrency.name].fundLockValue}
            balance={collateralSummary[selectedCurrency.name].walletBalance}
            margin='mtb-20'
          />
        )}
        {modalTab === "withdraw" && (
          <div className={styles.withdrawalInstructions}>
            <div className='mb-7'>
              Step 1: After initiating a withdrawal you will need to wait ~180 minutes for the funds to be made
              available to be released.
            </div>
            <div className='mb-7'>
              Step 2: Once funds are ready to be released you will be notified automatically within the Ithaca App. Once
              notified, go to ‘Transaction History’ tab & click the ‘Release’ button, the funds will then be transferred
              to the connected wallet.{" "}
            </div>
            <div className='mb-18 italic'>
              You can also periodically check the Transaction History tab to see the status of all withdrawals.{" "}
            </div>
          </div>
        )}
        <TutorialPopover
          isOpen={
            currentStep === TutorialSteps.DEPOSIT_WITH_BALANCE_DEPOSIT_BUTTON ||
            currentStep === TutorialSteps.DEPOSIT_WITHOUT_BALANCE_DEPOSIT_BUTTON
          }
          align='end'
          side='bottom'
        >
          <div>
            <Button
              disabled={modalAmount == ""}
              title='Click to deposit'
              variant='primary'
              size='sm'
              role='button'
              onClick={handleSubmit}
              className='full-width'
            >
              {modalFooterText}
            </Button>
          </div>
        </TutorialPopover>
      </Modal>
    </>
  );
};

export default ManageFundsModal;
