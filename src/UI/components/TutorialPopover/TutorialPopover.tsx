// Packages
import { ReactNode, useContext, useEffect, useState } from "react";

// Components
import Button from "@/UI/components/Button/Button";

// Styles
import styles from "./TutorialPopover.module.scss";
import * as Popover from "@radix-ui/react-popover";
import { OnboardingContext } from "@/UI/providers/onboarding-provider";
import Flex from "@/UI/layouts/Flex/Flex";
import { TUTORIAL_STEPS } from "@/UI/constants/tutorialsteps";

// Types
type TutorialPopoverProps = {
  children: ReactNode;
  isOpen: boolean;
  side: "bottom" | "top" | "right" | "left";
  align: "start" | "center" | "end";
  offset?: number;
  footer?: ReactNode;
  ignoreDisabledStatus?: boolean;
};

const TutorialPopover = ({
  children,
  isOpen,
  side,
  align,
  offset,
  footer,
  ignoreDisabledStatus = false,
}: TutorialPopoverProps) => {
  const [popoverOpen, setPopoverOpen] = useState(isOpen);

  const { updateStep, currentStep, disableTutorial, isTutorialDisabled } = useContext(OnboardingContext);

  const isPopoverVisible = ignoreDisabledStatus ? popoverOpen : !isTutorialDisabled && popoverOpen;

  useEffect(() => {
    setPopoverOpen(isOpen);
  }, [isOpen]);

  return (
    <Popover.Root open={isPopoverVisible}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      {currentStep && (
        <Popover.Content
          align={align}
          side={side}
          className={`${styles.PopoverContent} ${TUTORIAL_STEPS[currentStep].isLarge && styles.large}`}
          sideOffset={5}
          alignOffset={offset}
        >
          <>
            {TUTORIAL_STEPS[currentStep].title && (
              <div className={styles.title}>{TUTORIAL_STEPS[currentStep].title}</div>
            )}
            <div className={styles.message}>{TUTORIAL_STEPS[currentStep].message}</div>
            {footer ? (
              footer
            ) : (
              <Flex gap='5' classes='flex-nowrap justify-end'>
                <div className='flexGrow'>
                  {!!TUTORIAL_STEPS[currentStep].previousStep && (
                    <div
                      className={styles.skipButton}
                      onClick={() => {
                        updateStep && updateStep(TUTORIAL_STEPS[currentStep].previousStep);
                      }}
                    >
                      Back
                    </div>
                  )}
                </div>
                <div
                  className={styles.skipButton}
                  onClick={() => {
                    disableTutorial && disableTutorial();
                  }}
                >
                  Skip
                </div>
                <Button
                  title='Continue'
                  className='height-28 w-fit'
                  onClick={() => {
                    if (TUTORIAL_STEPS[currentStep].nextStep) {
                      updateStep && updateStep(TUTORIAL_STEPS[currentStep].nextStep);
                    } else {
                      disableTutorial && disableTutorial();
                    }
                  }}
                >
                  Continue
                </Button>
              </Flex>
            )}
            <Popover.Arrow className={styles.PopoverArrow} />
          </>
        </Popover.Content>
      )}
    </Popover.Root>
  );
};

export default TutorialPopover;
