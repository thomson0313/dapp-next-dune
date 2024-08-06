import { useContext, useEffect } from "react";

import classNames from "classnames";

import { TutorialSteps } from "@/UI/constants/tutorialsteps";
import { OnboardingContext } from "@/UI/providers/onboarding-provider";

import styles from "./Wallet.module.scss";
import ChevronDown from "../Icons/ChevronDown";
import TutorialPopover from "../TutorialPopover/TutorialPopover";
import Button from "../Button/Button";

interface WrongNetworkProps {
  openChainModal: () => void;
  children: React.ReactNode;
  isWrongNetwork?: boolean;
}

const WrongNetwork = ({ openChainModal, children, isWrongNetwork }: WrongNetworkProps) => {
  const { currentStep, updateStep } = useContext(OnboardingContext);

  useEffect(() => {
    if (isWrongNetwork) {
      updateStep?.(TutorialSteps.WRONG_NETWORK);
    } else {
      updateStep?.(undefined);
    }
  }, [isWrongNetwork]);

  return (
    <TutorialPopover
      footer={
        <div className='tw-flex tw-items-end tw-justify-end'>
          <Button title='Continue' className='tw-h-[28px] tw-w-1/2' onClick={openChainModal}>
            Switch Network
          </Button>
        </div>
      }
      isOpen={currentStep === TutorialSteps.WRONG_NETWORK}
      ignoreDisabledStatus={true}
      align='end'
      side='top'
    >
      <div>{children}</div>
    </TutorialPopover>
  );
};

export default WrongNetwork;
