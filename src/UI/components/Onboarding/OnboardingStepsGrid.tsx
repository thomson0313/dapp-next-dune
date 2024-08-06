import styles from "@/pages/onboarding/onboarding.module.scss";
import { OnboardingStep, Tab, TradeType } from "@/pages/onboarding";
import OnboardingStepOne from "./OnboardingStepOne";
import OnboardingStepTwo from "./OnboardingStepTwo";
import OnboardingStepThree from "./OnboardingStepThree";
import OnboardingStepTimeline from "./OnboardingTimeline";
import { MarketOutlook } from "@/UI/constants/onboarding";

interface OnboardingStepsGridProps {
  step: OnboardingStep;
  setStep: (value: OnboardingStep) => void;
  isYieldOff: boolean;
  tradeType: TradeType;
  marketOutlook: MarketOutlook;
  activeTab: Tab;
  handleTabChange: (value: Tab) => void;
}

const tabOptions: { value: Tab; option: string }[] = [
  { option: "Principal Protected Strategies", value: "Strategies" },
  { option: "Trade", value: "Trade" },
];

const OnboardingStepsGrid = ({
  step,
  isYieldOff,
  tradeType,
  marketOutlook,
  activeTab,
  setStep,
  handleTabChange,
}: OnboardingStepsGridProps) => {
  return (
    <div className={styles.stepsContainer}>
      <OnboardingStepTimeline step={step} />
      <OnboardingStepOne isYieldOff={isYieldOff} />
      <OnboardingStepTwo
        setStep={setStep}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        marketOutlook={marketOutlook}
        step={step}
        tabOptions={tabOptions}
        tradeType={tradeType}
      />
      <OnboardingStepThree step={step} />
    </div>
  );
};

export default OnboardingStepsGrid;
