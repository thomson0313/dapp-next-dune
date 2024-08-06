// Components
import Panel from "@/UI/layouts/Panel/Panel";
import OnboardingStepOneBoard from "./OnboardingStepOneBoard";
import OnboardingStepTwoBoard from "./OnboardingStepTwoBoard";
import OnboardingStepThreeBoard from "./OnboardingStepThreeBoard";

// Types
import { PayoffMap } from "@/UI/utils/CalcChartPayoff";
import { OnboardingStep, Tab, TradeType } from "@/pages/onboarding";

// Styles
import styles from "@/pages/onboarding/onboarding.module.scss";
import { MarketOutlook } from "@/UI/constants/onboarding";
interface OnboardingDisplayPanelProps {
  step: OnboardingStep;
  isYieldOff: boolean;
  tradeType: TradeType;
  activeTradeTab: Tab;
  marketOutlook: MarketOutlook;
  rangeChartData: PayoffMap[];
  bearChartData: PayoffMap[];
  bullChartData: PayoffMap[];
  setMarketOutlook: (value: MarketOutlook) => void;
  setTradeType: (value: TradeType) => void;
  setIsYieldOff: (value: boolean) => void;
  setStep: (val: OnboardingStep) => void;
}

const OnboardingDisplayPanel = ({
  step,
  isYieldOff,
  tradeType,
  activeTradeTab,
  marketOutlook,
  bearChartData,
  bullChartData,
  rangeChartData,
  setMarketOutlook,
  setIsYieldOff,
  setStep,
  setTradeType,
}: OnboardingDisplayPanelProps) => {
  return (
    <Panel>
      <div className={`${styles.displayPanel}`}>
        {step == OnboardingStep.DEPOSIT ? (
          <OnboardingStepOneBoard isYieldOff={isYieldOff} setIsYieldOff={setIsYieldOff} setStep={setStep} />
        ) : step == OnboardingStep.TRADE ? (
          <OnboardingStepTwoBoard setStep={setStep} setTradeType={setTradeType} tradeType={tradeType} />
        ) : (
          <OnboardingStepThreeBoard
            step={step}
            activeTab={activeTradeTab}
            bearChartData={bearChartData}
            bullChartData={bullChartData}
            marketOutlook={marketOutlook}
            rangeChartData={rangeChartData}
            setMarketOutlook={setMarketOutlook}
            setStep={setStep}
          />
        )}
      </div>
    </Panel>
  );
};

export default OnboardingDisplayPanel;
