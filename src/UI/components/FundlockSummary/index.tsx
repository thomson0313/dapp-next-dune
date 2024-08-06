import LogoEth from "../Icons/LogoEth";
import LogoUsdc from "../Icons/LogoUsdc";
import styles from "./fundlock.module.scss";
import { formatNumberByCurrency } from "@/UI/utils/Numbers";
import { Currency } from "@/utils/types";
import classNames from "classnames";
import { useUserBalance } from "../../hooks/useUserBalance";
import { useAppStore } from "@/UI/lib/zustand/store";
import { maskString } from "@/UI/utils/Text";

interface FundlockValueProps {
  isAlwaysInline?: boolean;
}

const FundlockValue = ({ isAlwaysInline }: FundlockValueProps) => {
  const { collateralSummary } = useUserBalance();
  const { delegatedWalletAddress } = useAppStore();

  return (
    <div className='tw-flex tw-flex-col tw-gap-1'>
      {delegatedWalletAddress && (
        <div>
          <p className='tw-text-right tw-text-xxs tw-text-ithaca-green-30'>
            Delegate Wallet Control Enabled {maskString(delegatedWalletAddress)}
          </p>
        </div>
      )}
      <div
        className={classNames(styles.fundlockContainer, {
          [styles.alwaysInLine]: isAlwaysInline,
        })}
      >
        <span className={styles.title}>Available Balance</span>
        <div className={styles.valueContainer}>
          <LogoUsdc />
          <span className={styles.currency}>USDC</span>
          <span className={styles.value}>
            {formatNumberByCurrency(
              Number(collateralSummary["USDC"].availableCollateral),
              "string",
              "USDC" as Currency,
              2
            )}
          </span>
          <LogoEth />
          <span className={styles.currency}>WETH</span>
          <span className={styles.value}>
            {formatNumberByCurrency(
              Number(collateralSummary["WETH"].availableCollateral),
              "string",
              "WETH" as Currency,
              2
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FundlockValue;
