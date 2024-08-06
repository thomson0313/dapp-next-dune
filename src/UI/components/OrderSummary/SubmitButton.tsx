// Components
import Button from "@/UI/components/Button/Button";
import styles from "./OrderSummary.module.scss";
import { useAppStore } from "@/UI/lib/zustand/store";
import Warning from "@/UI/components/Icons/Warning";
import { useContext, useEffect, useMemo, useState } from "react";

import ManageFundsModal from "../CollateralPanel/ManageFundsModal";
import { OrderSummaryType } from "@/types/orderSummary";
import { calculateTotalPremium, calculateTotalPremiumPlain } from "./helpers";
import { useHasEnoughFunds } from "./useHasEnoughFunds";
import LocationRestrictedModal from "../LocationRestricted/LocationRestrictedModal";
import TutorialPopover from "../TutorialPopover/TutorialPopover";
import { OnboardingContext } from "@/UI/providers/onboarding-provider";
import { TUTORIAL_STEPS, TutorialSteps } from "@/UI/constants/tutorialsteps";
import { useUserBalance } from "@/UI/hooks/useUserBalance";

interface SubmitButtonProps {
  orderSummary: OrderSummaryType | undefined;
  connected: boolean | undefined;
  openConnectModal: () => void;
  submitAuction: () => void;
  onlyProtiftableOrders: boolean;
  isSubmitButtonDisabled: boolean;
}

export const SubmitButton = ({
  orderSummary,
  connected,
  openConnectModal,
  submitAuction,
  onlyProtiftableOrders,
  isSubmitButtonDisabled,
}: SubmitButtonProps) => {
  const { systemInfo, isLocationRestricted } = useAppStore();
  const [selectedCurrency, setSelectedCurrency] = useState<{ name: string; value: `0x${string}` } | undefined>();
  const [showLocationRestrictedModal, setShowLocationRestrictedModal] = useState(false);
  const { currentStep, updateStep } = useContext(OnboardingContext);
  const premium = orderSummary?.order.totalNetPrice;
  const fee = orderSummary?.orderFees?.numeraireAmount;
  const isValidTotalPremium = premium ? calculateTotalPremium(premium, fee) !== "0.00" : false;
  const isValidConfiguration = useMemo(() => {
    return orderSummary?.orderLock && orderSummary?.orderFees;
  }, [orderSummary]);

  const { hasEnoughFunds } = useHasEnoughFunds({ orderSummary });
  const shouldDepositFunds = !hasEnoughFunds && isValidConfiguration;
  const isValid = useMemo(() => {
    const feeValue = Math.abs(Number(fee));

    // Example
    // Platform fee 1.80
    // Total premium 0.80
    // Disallow for making order
    if (onlyProtiftableOrders) {
      if (!premium) return true;

      const totalPremium = calculateTotalPremiumPlain(premium, fee);
      return feeValue < totalPremium;
    }

    return true;
  }, [onlyProtiftableOrders, premium, fee]);

  useEffect(() => {
    if (shouldDepositFunds) {
      updateStep?.(TutorialSteps.DEPOSIT_FUNDS);
    }
  }, [shouldDepositFunds]);

  const handleSubmitToAuction = () => {
    if (shouldDepositFunds) {
      // Opens modal
      setSelectedCurrency({ name: "USDC", value: systemInfo.tokenAddress["USDC"] });
    } else {
      submitAuction();
    }
  };

  const renderWarning = () => {
    if (!orderSummary) return null;
    let warningMessage = null;
    if (!isValidConfiguration) {
      warningMessage = "Check Configuration";
    } else if (!hasEnoughFunds) {
      warningMessage = "Insufficient Balance";
    }

    return warningMessage ? (
      <div className={styles.balanceWarning}>
        <Warning /> <div className={styles.balanceText}>{warningMessage}</div>
      </div>
    ) : null;
  };

  const isDisabled = isSubmitButtonDisabled || !isValidTotalPremium || !isValid;

  if (isLocationRestricted)
    return (
      <>
        <LocationRestrictedModal
          isOpen={showLocationRestrictedModal}
          onCloseModal={() => setShowLocationRestrictedModal(false)}
        />{" "}
        <button
          onClick={() => setShowLocationRestrictedModal(true)}
          type='button'
          className={styles.locationRestricted}
        >
          Location Restricted
        </button>
      </>
    );
  if (!connected) {
    return (
      <Button size='lg' className='min-width-140' title='Click to Connect Wallet' onClick={openConnectModal}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <>
      <ManageFundsModal
        displayModalTypeTabs={false}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        modalTab={selectedCurrency ? "deposit" : undefined}
      />
      <TutorialPopover
        isOpen={currentStep === TutorialSteps.DEPOSIT_FUNDS || currentStep === TutorialSteps.SUBMIT_TO_AUCTION}
        align='end'
        side='top'
      >
        {/* Used section over div because there are some global css for 5th div */}
        <section>
          {shouldDepositFunds ? (
            <Button
              size='lg'
              className='min-width-140'
              title='Click to submit to Deposit'
              onClick={handleSubmitToAuction}
            >
              Deposit
            </Button>
          ) : (
            <Button size='lg' title='Click to submit to auction' disabled={isDisabled} onClick={handleSubmitToAuction}>
              Submit to Auction
            </Button>
          )}
        </section>
      </TutorialPopover>

      {renderWarning()}
    </>
  );
};

export default SubmitButton;
