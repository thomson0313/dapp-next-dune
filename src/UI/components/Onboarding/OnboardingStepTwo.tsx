// Components
import Panel from "@/UI/layouts/Panel/Panel";
import RadioButton from "../RadioButton/RadioButton";

// Types
import { OnboardingStep, Tab, TradeType } from "@/pages/onboarding";

// Styles
import styles from "@/pages/onboarding/onboarding.module.scss";
import { MarketOutlook } from "@/UI/constants/onboarding";

interface OnboardingStepTwoProps {
  step: OnboardingStep;
  setStep: (value: OnboardingStep) => void;
  tabOptions: { value: Tab; option: string }[];
  activeTab: Tab;
  marketOutlook: MarketOutlook;
  tradeType: TradeType;
  handleTabChange: (value: Tab) => void;
}

const OnboardingStepTwo = ({
  activeTab,
  marketOutlook,
  step,
  tabOptions,
  tradeType,
  handleTabChange,
  setStep,
}: OnboardingStepTwoProps) => {
  return (
    <Panel>
      <div className={styles.stepCard} data-active={step !== OnboardingStep.DEPOSIT}>
        <div className={styles.stepCardTitle}>Step 2</div>
        <div className={styles.divider}></div>
        <div className='tw-flex tw-flex-col tw-gap-1'>
          <RadioButton
            options={tabOptions}
            selectedOption={activeTab}
            name='Trade tab'
            disabled={step == OnboardingStep.DEPOSIT}
            onChange={product => {
              const nextTab = product as Tab;
              nextTab == "Strategies" ? setStep(OnboardingStep.STRATEGIES) : setStep(OnboardingStep.TRADE);
              handleTabChange(nextTab);
            }}
          />
          <div className='tw-grid tw-grid-cols-2 tw-items-start tw-p-4'>
            <div data-active={activeTab == "Strategies"}>
              <div>Market Outlook</div>
              <div className='tw-flex tw-items-center tw-gap-2'>
                {Object.values(MarketOutlook).map(item => (
                  <div key={item} data-active={item == marketOutlook}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className='tw-space-y-1' data-active={activeTab == "Trade"}>
              {Object.values(TradeType).map(item => (
                <div key={item} data-active={item == tradeType}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default OnboardingStepTwo;
