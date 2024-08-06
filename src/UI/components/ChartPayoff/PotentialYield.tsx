// Components
import LogoUsdc from "@/UI/components/Icons/LogoUsdc";

// Styles
import styles from "./ChartPayoff.module.scss";

// Utils
import { formatNumberByCurrency } from "@/UI/utils/Numbers";
import Flex from "@/UI/layouts/Flex/Flex";
import { calculateAPY } from "@/UI/utils/APYCalc";

// Types
type PotentialYieldProps = {
  value: number;
  isChartHovered: boolean;
  risk?: number;
  expiry?: string;
};

const PotentialYield = (props: PotentialYieldProps) => {
  const { value, isChartHovered, risk, expiry } = props;
  const formattedValue = formatNumberByCurrency(value, "string", "USDC");

  const renderProfitLoss = () => {
    if (!isChartHovered) {
      return <p>-</p>;
    }

    const sign = value > 0 ? "+" : value < 0 ? "" : "";
    const className = value > 0 ? styles.greenColor : value < 0 ? styles.redColor : styles.whiteColor;
    return (
      <p className={className}>
        {sign}
        {formattedValue}
      </p>
    );
  };

  const renderAPY = () => {
    if (!isChartHovered) {
      return <p>- % APY</p>;
    }

    const sign = value > 0 ? "+" : value < 0 ? "" : "";
    const className = value > 0 ? styles.greenColor : value < 0 ? styles.redColor : styles.whiteColor;
    return (
      <p className={className}>
        {sign}
        {calculateAPY(expiry || "", risk || 0, value)}% APY
      </p>
    );
  };

  return (
    <Flex direction='column'>
      <Flex>
        <h3>Potential Yield:</h3>
        {renderProfitLoss()}
        <LogoUsdc />
      </Flex>
      <Flex classes='tw-justify-end tw-mt-1'>{renderAPY()}</Flex>
    </Flex>
  );
};

export const calculateAPYReading = (value: number) => {
  return value;
};

export default PotentialYield;
