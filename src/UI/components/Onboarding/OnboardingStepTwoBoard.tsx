import { OnboardingStep, TradeType } from "@/pages/onboarding";

import Button from "../Button/Button";

//Styles
import cn from "classnames";
import styles from "@/pages/onboarding/onboarding.module.scss";
import { getOnboardingBoardContent } from "@/UI/constants/onboarding";

interface OnboardingStepTwoBoardProps {
  tradeType: TradeType;
  setTradeType: (value: TradeType) => void;
  setStep: (value: OnboardingStep) => void;
}

const OnboardingStepTwoBoard = ({ tradeType, setStep, setTradeType }: OnboardingStepTwoBoardProps) => {
  const { title, description, image } = getOnboardingBoardContent(tradeType);

  return (
    <div className={styles.board}>
      <div className={styles.boardHeader}>
        <span className={styles.boardHeaderCircle}>2</span>
        <span>Trade</span>
      </div>

      <div className='tw-flex tw-items-center tw-gap-6 tw-font-semibold tw-text-ithaca-white-60'>
        {Object.values(TradeType).map(type => (
          <button
            key={type}
            className={cn(type == tradeType && "tw-border-b tw-border-b-[#561198] tw-text-white", "tw-py-1")}
            onClick={() => setTradeType(type as TradeType)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className='tw-mt-10 tw-space-y-4 tw-rounded-xl tw-bg-[#9D9DAA]/5 tw-p-6'>
        <div className='tw-text-lg tw-font-semibold'>{title}</div>
        <div className='tw-text-xs tw-text-ithaca-white-60'>{description}</div>
        {image}
        <Button title='Trade' onClick={() => setStep(OnboardingStep.CONFIG)} className='tw-min-w-36'>
          Trade
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStepTwoBoard;
