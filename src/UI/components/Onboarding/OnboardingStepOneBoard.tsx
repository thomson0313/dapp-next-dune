// Hooks
import { useCallback } from "react";
import { useDepositAndWithdraw } from "@/UI/hooks/useDepositAndWithdraw";

// Components
import Button from "../Button/Button";
import CheckBox from "../CheckBox/CheckBox";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import Input from "../Input/Input";
import Loader from "../Loader/Loader";

// Icons
import LogoArbitrum from "../Icons/LogoArbitrum";
import LogoUsdc from "../Icons/LogoUsdc";
import LogoEth from "../Icons/LogoEth";

// Utils
import { formatNumberByCurrency } from "@/UI/utils/Numbers";

//Styles
import cn from "classnames";
import styles from "@/pages/onboarding/onboarding.module.scss";

// Types
import { OnboardingStep } from "@/pages/onboarding";

interface OnboardingStepOneBoardProps {
  isYieldOff: boolean;
  setIsYieldOff: (val: boolean) => void;
  setStep: (value: OnboardingStep) => void;
}

const OnboardingStepOneBoard = ({ isYieldOff, setIsYieldOff, setStep }: OnboardingStepOneBoardProps) => {
  const {
    selectedChain,
    supportedChains,
    selectedCurrency,
    collateralSummary,
    deposit,
    setIsAxelarTokensLoading,
    setSourceChainCurrency,
    setSelectedChain,
    isAxelarTokensLoading,
    isTransactionInProgress,
    modalAmount,
    setModalAmount,
    fetchAxelarSupportedTokens,
    setSelectedCurrency,
    supportedTokens,
    estimatedFee,
  } = useDepositAndWithdraw();

  const handleDeposit = useCallback(async () => {
    await deposit();
    setStep(OnboardingStep.TRADE);
  }, [deposit, setStep]);

  return (
    <div className={styles.board} data-loading={isTransactionInProgress}>
      {isTransactionInProgress && (
        <div className='tw-absolute tw-left-1/2 tw-top-1/2 -tw-translate-x-1/2 -tw-translate-y-1/2'>
          <Loader />
        </div>
      )}
      <div className={styles.boardHeader}>
        <span className={styles.boardHeaderCircle}>1</span>
        <span>Deposit</span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-6 tw-text-ithaca-white-60'>
        <div className='tw-flex tw-flex-col tw-gap-4'>
          <div className='tw-text-base tw-text-white'>Deposit from your linked wallet</div>
          <div className='tw-flex tw-items-center tw-gap-2'>
            <DropdownMenu
              className='tw-flex-1'
              iconStart={<LogoArbitrum />}
              value={selectedChain}
              options={supportedChains}
              onChange={async (_, option) => {
                setSourceChainCurrency(undefined);
                setSelectedChain(option);
                setIsAxelarTokensLoading(true);
                await fetchAxelarSupportedTokens(Number(option.value));
                setIsAxelarTokensLoading(false);
              }}
            />
            <DropdownMenu
              className='tw-flex-1'
              isLoading={isAxelarTokensLoading}
              value={selectedCurrency}
              iconStart={selectedCurrency?.name == "USDC" ? <LogoUsdc /> : <LogoEth />}
              options={supportedTokens}
              onChange={(_, option) => setSelectedCurrency(option)}
            />
            <Input
              type='number'
              className='tw-flex-1'
              value={modalAmount}
              onChange={({ target }) => setModalAmount(target.value)}
            />

            <Button
              variant='secondary'
              className='tw-px-5'
              title='Select All Assets'
              onClick={() => {
                if (selectedCurrency) {
                  setModalAmount(collateralSummary[selectedCurrency.name].walletBalance);
                }
              }}
            >
              All
            </Button>
          </div>
          <div className='tw-flex tw-items-center tw-justify-between tw-text-xs'>
            <div>
              Balance: {selectedCurrency ? collateralSummary[selectedCurrency.name].walletBalance : "-"}{" "}
              {selectedCurrency?.name}
            </div>
            <div className='flex-row gap-4'>
              {(selectedCurrency?.name as string) === "ETH" ? "Total Amount" : "Estimated Fee"}:{" "}
              {estimatedFee.isLoading ? (
                <div style={{ position: "relative", margin: "0 12px" }}>
                  <Loader type='sm' />
                </div>
              ) : (
                <>
                  {formatNumberByCurrency(Number(estimatedFee.fee), "", "WETH")}
                  <span>{estimatedFee.nativeCurrency.symbol}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isYieldOff && (
          <div className='tw-flex tw-flex-col tw-gap-4'>
            <div className='tw-text-base tw-text-white'>To Receive Approximately</div>
            <div className='tw-flex tw-items-center tw-gap-2'>
              <Input
                className='tw-flex-1'
                disabled
                leftIcon={<LogoArbitrum />}
                type='text'
                value={selectedChain.name}
              />
              <DropdownMenu
                className='tw-flex-1'
                value={selectedCurrency}
                iconStart={selectedCurrency?.name == "USDC" ? <LogoUsdc /> : <LogoEth />}
                options={supportedTokens}
                onChange={(_, option) => setSelectedCurrency(option)}
              />
              <Input
                type='number'
                value={selectedCurrency ? collateralSummary[selectedCurrency.name].orderValue : ""}
                disabled
                className='tw-flex-1'
              />

              <div className='tw-w-14' />
            </div>
            <div className='tw-flex tw-items-center tw-justify-between tw-text-xs'>
              <span>
                Fund lock: {selectedCurrency ? collateralSummary[selectedCurrency.name].fundLockValue : "-"}{" "}
                {selectedCurrency?.name}
              </span>
              <span>
                Balance: {selectedCurrency ? collateralSummary[selectedCurrency.name].walletBalance : "-"}{" "}
                {selectedCurrency?.name}
              </span>
            </div>
          </div>
        )}

        <div className='tw-space-y-1'>
          <div className='tw-text-ithaca-green-30'>Airdrop Yield: 2.34%* | 1234 Points Per Day </div>
          <div className='tw-text-xs'>**Yield estimated referencing most recent last SAFT priced round.</div>
        </div>

        <div className={cn("tw-space-y-1", { "tw-opacity-50": isYieldOff })}>
          <div className={cn(isYieldOff ? "tw-text-ithaca-white-60" : "tw-text-ithaca-green-30")}>
            Baseline Yield: 2.34%**{" "}
          </div>
          <div className='tw-text-xs'>**Yield estimated referencing most recent last SAFT priced round.</div>
        </div>

        <div className='tw-space-y-1'>
          <div>
            <CheckBox
              label=''
              className='tw-text-base tw-text-white'
              checked={isYieldOff}
              onChange={() => setIsYieldOff(!isYieldOff)}
              component={
                <div className='tw-flex tw-items-baseline tw-gap-1'>
                  Opt Out of Earning Aave Yield on Deposit{" "}
                  <span className='tw-text-sm tw-italic tw-text-ithaca-white-60'>(ITHC Airdrop Applies)</span>
                </div>
              }
            />
          </div>
          <div className='tw-text-xs'>
            Yield is generated via Aave, be aware lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
          </div>
        </div>

        <Button
          className='tw-mx-auto tw-my-0 tw-w-full tw-max-w-80'
          disabled={isTransactionInProgress || modalAmount == ""}
          onClick={handleDeposit}
          title='Deposit'
        >
          Deposit
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStepOneBoard;
