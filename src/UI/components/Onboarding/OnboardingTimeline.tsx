// Types
import { OnboardingStep } from "@/pages/onboarding";

// Styles
import styles from "@/pages/onboarding/onboarding.module.scss";

interface OnboardingTimelineProps {
  step: OnboardingStep;
}

const getStops = (step: OnboardingStep) => {
  switch (step) {
    case OnboardingStep.DEPOSIT:
      return 0;
    case OnboardingStep.CONFIG:
      return 1;
    default:
      return 0.5;
  }
};

const OnboardingTimeline = ({ step }: OnboardingTimelineProps) => {
  const stepValue = getStops(step);

  return (
    <div className={styles.timeline} style={{ "--step": stepValue } as React.CSSProperties}>
      <div className={styles.timelineCircle} data-active='true'>
        1
      </div>
      <div className={styles.timelineCircle} data-active={step != OnboardingStep.DEPOSIT}>
        2
      </div>
      <div className={styles.timelineCircle} data-active={step == OnboardingStep.CONFIG}>
        3
      </div>
    </div>
  );
};

export default OnboardingTimeline;
