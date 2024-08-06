// Packages
import { useContext, useEffect, useState } from "react";
import classNames from "classnames";
// Constants
import { TableFundLockDataProps } from "@/UI/constants/tableFundLock";

// Utils
import { renderDate } from "@/UI/utils/TableOrder";

// Components
import Asset from "@/UI/components/Asset/Asset";
import Button from "@/UI/components/Button/Button";
import CurrencyDisplay from "@/UI/components/CurrencyDisplay/CurrencyDisplay";
import LogoEth from "@/UI/components/Icons/LogoEth";
import LogoUsdc from "@/UI/components/Icons/LogoUsdc";

// Styles
import { useAppStore } from "@/UI/lib/zustand/store";
import { addMinutes } from "date-fns";
import Loader from "../Loader/Loader";
import styles from "./TableFundLock.module.scss";
import { OnboardingContext } from "@/UI/providers/onboarding-provider";
import TutorialPopover from "../TutorialPopover/TutorialPopover";
import { TutorialSteps } from "@/UI/constants/tutorialsteps";
import useToast from "@/UI/hooks/useToast";

export const HOW_MANY_MINUTES_AFTER_DEPOSIT_CAN_RELEASE = 180;

interface SingleFundlockRowProps {
  item: TableFundLockDataProps;
  showTutorial: boolean;
}

const SingleFundlockRow = ({ item, showTutorial }: SingleFundlockRowProps) => {
  const { ithacaSDK } = useAppStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [timeTillRelease, setTimeTillRelease] = useState("");
  const [isReleaseAvailable, setIsReleaseAvailable] = useState(false);
  const { timestamp, orderDate, withdrawalSlot, asset, auction, currency, amount, token } = item;
  const { currentStep } = useContext(OnboardingContext);
  const handleReleaseClick = (token: `0x${string}`, withdrawalSlot?: string) => async () => {
    try {
      setIsLoading(true);
      await ithacaSDK.fundlock.release(token, Number(withdrawalSlot));
      showToast(
        {
          title: "Token Release Approved",
          message: "Funds will be released to your connected wallet shortly.",
        },
        { autoClose: false }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const timeDiff =
        addMinutes(new Date(Number(timestamp) * 1000), HOW_MANY_MINUTES_AFTER_DEPOSIT_CAN_RELEASE).getTime() -
        Date.now();
      const minutes = Math.floor(timeDiff / 1000 / 60);
      const seconds = Math.floor((timeDiff / 1000) % 60);
      if (timeDiff <= 0) {
        setTimeTillRelease("Estimated time until release 00:00");
        setIsReleaseAvailable(true);
        clearInterval(interval);
        return;
      }
      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTimeTillRelease(`Estimated time until release ${formattedTime}`);
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [timestamp]);

  return (
    <>
      <div className={styles.cell}>{renderDate(orderDate)}</div>
      <div className={styles.cell}>
        <Asset size='sm' icon={asset === "USDC" ? <LogoUsdc /> : <LogoEth />} label={asset} />
      </div>
      <div className={styles.cell}>{auction?.toLowerCase() === "release" ? "Withdraw" : auction}</div>
      <div className={styles.cell}>
        <CurrencyDisplay
          size='md'
          amount={amount}
          symbol={currency === "USDC" ? <LogoUsdc /> : <LogoEth />}
          currency={currency}
        />
      </div>
      <div className={styles.cell}>
        <span className={styles.releaseInfo} style={{ display: "flex", justifyContent: "flex-start" }}>
          {auction === "Withdraw" ? (
            !isReleaseAvailable ? (
              timeTillRelease
            ) : (
              <span className={styles.readyReleased}>Funds are Ready to be Released</span>
            )
          ) : auction?.toLowerCase() === "release" ? (
            "Released"
          ) : (
            <></>
          )}
        </span>
      </div>
      <TutorialPopover
        isOpen={currentStep === TutorialSteps.WITHDRAWAL_RELEASE_FUNDS && auction === "Withdraw" && showTutorial}
        align='end'
        side='bottom'
      >
        <div className={classNames(styles.cell, styles.releaseButtonCell)}>
          {auction === "Withdraw" && (
            <Button
              disabled={!isReleaseAvailable}
              size='sm'
              title='Click to release'
              className={styles.releaseButton}
              onClick={handleReleaseClick(token, withdrawalSlot)}
            >
              {isLoading ? <Loader type='sm' /> : "Release"}
            </Button>
          )}
        </div>
      </TutorialPopover>
    </>
  );
};

export default SingleFundlockRow;
