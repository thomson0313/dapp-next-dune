// Components
import Panel from "@/UI/layouts/Panel/Panel";

// Styles
import styles from "@/pages/onboarding/onboarding.module.scss";

interface OnboardingStepOneProps {
  isYieldOff: boolean;
}

const OnboardingStepOne = ({ isYieldOff }: OnboardingStepOneProps) => {
  return (
    <Panel>
      <div className={styles.stepCard} data-active>
        <div className={styles.stepCardTitle}>Step 1</div>
        <div className={styles.divider}></div>
        <div className='tw-flex tw-flex-col tw-gap-1'>
          <div>+ ITHC Airdrop </div>
          <div data-active={!isYieldOff}>+ Earn 2.13% Baseline Yield</div>
        </div>
      </div>
    </Panel>
  );
};

export default OnboardingStepOne;
