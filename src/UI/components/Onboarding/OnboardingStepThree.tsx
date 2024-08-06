// Components
import Panel from "@/UI/layouts/Panel/Panel";

// Types
import { OnboardingStep } from "@/pages/onboarding";

// Styles
import styles from "@/pages/onboarding/onboarding.module.scss";

interface OnboardingStepThreeProps {
  step: OnboardingStep;
}

const OnboardingStepThree = ({ step }: OnboardingStepThreeProps) => {
  return (
    <Panel>
      <div className={styles.stepCard} data-active={step === OnboardingStep.CONFIG}>
        <div className={styles.stepCardTitle}>Step 3</div>
        <div className={styles.divider} />
        <div className='tw-flex tw-flex-col'>
          <div className='tw-mb-2 tw-text-lg tw-font-semibold'>Principal protected strategies Configuration</div>
          <div className='tw-flex tw-items-center tw-gap-1'>
            <span>Expiry</span> <span className='tw-w-[1px] tw-self-stretch tw-bg-current' /> <span>Size</span>
            <span className='tw-w-[1px] tw-self-stretch tw-bg-current' />
            <span>Range</span>
          </div>

          <div>Target Yield</div>
          <div data-active='false'>Submit to Auction</div>
        </div>
      </div>
    </Panel>
  );
};

export default OnboardingStepThree;
