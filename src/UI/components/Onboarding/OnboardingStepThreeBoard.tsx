import { useCallback, useEffect, useState } from "react";

// Components
import Button from "../Button/Button";
import ChartPayoff from "../ChartPayoff/ChartPayoff";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import Flex from "@/UI/layouts/Flex/Flex";
import LogoUsdc from "../Icons/LogoUsdc";
import LogoEth from "../Icons/LogoEth";
import Input from "../Input/Input";
import Panel from "@/UI/layouts/Panel/Panel";

// Types
import { OnboardingStep, Tab } from "@/pages/onboarding";
import { estimateOrderPayoff, PayoffMap } from "@/UI/utils/CalcChartPayoff";

// Styles
import styles from "@/pages/onboarding/onboarding.module.scss";
import { useAppStore } from "@/UI/lib/zustand/store";
import { DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT, formatDate } from "@/UI/utils/DateFormatting";
import LabelValue from "../LabelValue/LabelValue";
import CountdownTimer from "../CountdownTimer/CountdownTimer";
import { MarketOutlook, ONBOARDING_STRATEGIES } from "@/UI/constants/onboarding";
import { useUserBalance } from "@/UI/hooks/useUserBalance";
import { formatNumberByCurrency, isInvalidNumber } from "@/UI/utils/Numbers";
import { calculateAPY } from "@/UI/utils/APYCalc";
import { calculateNetPrice, ClientConditionalOrder, createClientOrderId, Leg } from "@ithaca-finance/sdk";
import { OrderSummaryType } from "@/types/orderSummary";
import { ContractDetails } from "@/UI/lib/zustand/slices/types";
import useToast from "@/UI/hooks/useToast";
interface OnboardingStepThreeBoardProps {
  step: OnboardingStep;
  activeTab: Tab;
  marketOutlook: MarketOutlook;
  bearChartData: PayoffMap[];
  bullChartData: PayoffMap[];
  rangeChartData: PayoffMap[];
  setStep: (value: OnboardingStep) => void;
  setMarketOutlook: (value: MarketOutlook) => void;
}

const OnboardingStepThreeBoard = ({
  step,
  activeTab,
  marketOutlook,
  rangeChartData,
  bearChartData,
  bullChartData,
  setMarketOutlook,
  setStep,
}: OnboardingStepThreeBoardProps) => {
  const { expiryList, getContractsByPayoff, spotPrices, currencyPrecision, ithacaSDK } = useAppStore();
  const [orderSummary, setOrderSummary] = useState<OrderSummaryType | undefined>();
  const { showOrderErrorToast, showOrderConfirmationToast } = useToast();
  const { collateralSummary, handleFetchingBalance } = useUserBalance();
  const handleMarketOutlookChange = useCallback(
    (value: MarketOutlook) => {
      setStep(OnboardingStep.CONFIG);
      setMarketOutlook(value);
    },
    [setMarketOutlook, setStep]
  );
  const [fullStrikeList, setFullStrikeList] = useState<string[]>([]);
  const [strike1, setStrike1] = useState<string>("");
  const [strike2, setStrike2] = useState<string>("");
  const [strike1List, setStrike1List] = useState<string[]>([]);
  const [strike2List, setStrike2List] = useState<string[]>([]);
  const [chartData, setChartData] = useState<PayoffMap[]>([]);
  const [size, setSize] = useState<string>("");
  const [maxYield, setMaxYield] = useState<number>(0);
  const [minYield, setMinYield] = useState<number>(0);
  const [selectedExpiry, setSelectedExpiry] = useState<string>(`${expiryList[0]}`);

  useEffect(() => {
    const { size, payoff, strikeIndex: strategy1StrikeIndex } = ONBOARDING_STRATEGIES[marketOutlook][0];
    const { strikeIndex: strategy2StrikeIndex } = ONBOARDING_STRATEGIES[marketOutlook][1];
    const spot = spotPrices["WETH/USDC"];
    const strikeList = Object.keys(getContractsByPayoff(payoff)).map(strike => ({ name: strike, value: strike }));
    const list = Object.values(strikeList.map(strike => strike.name));
    const closest = list.sort((a, b) => Math.abs(spot - parseFloat(a)) - Math.abs(spot - parseFloat(b)))[0];
    const index = list.sort().findIndex(a => a === closest);
    const strikePoint1 = index + strategy1StrikeIndex;
    const strikePoint2 = index + strategy2StrikeIndex;
    updateStrikes(
      list[strikePoint1 < 0 ? 0 : strikePoint1 >= list.length ? list.length - 1 : strikePoint1],
      list[strikePoint2 < 0 ? 0 : strikePoint2 >= list.length ? list.length - 1 : strikePoint2],
      list
    );
    setFullStrikeList(list);
    setSize(`${size}`);
  }, [marketOutlook]);

  const updateStrikes = (strike1: string, strike2: string, strikeList: string[]) => {
    setStrike1List(strikeList.filter(strike => strike !== strike2));
    setStrike2List(strikeList.filter(strike => strike !== strike1));
    setStrike1(strike1);
    setStrike2(strike2);
  };

  useEffect(() => {
    if (!(isInvalidNumber(Number(size)) && isInvalidNumber(Number(strike1)) && isInvalidNumber(Number(strike2)))) {
      const { payoff, side: strike1Side } = ONBOARDING_STRATEGIES[marketOutlook][0];
      const { side: strike2Side } = ONBOARDING_STRATEGIES[marketOutlook][1];
      const contracts = getContractsByPayoff(payoff);
      const legs = [
        {
          contractId: contracts[strike1].contractId,
          quantity: size as `${number}`,
          side: strike1Side,
        },
        {
          contractId: contracts[strike2].contractId,
          quantity: size as `${number}`,
          side: strike2Side,
        },
      ];
      const formattedLegs = [
        {
          ...contracts[strike1],
          ...legs[0],
          premium: contracts[strike1].referencePrice,
        },
        {
          ...contracts[strike2],
          ...legs[1],
          premium: contracts[strike2].referencePrice,
        },
      ];
      const maxStrike = Math.max(Number(strike1), Number(strike2));
      const minStrike = Math.min(Number(strike1), Number(strike2));
      const chartTransformedData = estimateOrderPayoff(
        formattedLegs,
        {
          min: minStrike - 300,
          max: maxStrike + 300,
        },
        false,
        marketOutlook === MarketOutlook.RANGE ? 1.8 : 0.3
      );
      const chartData = chartTransformedData.map(data => Number(data.total));
      setMaxYield(Math.max(...chartData));
      setMinYield(Math.min(...chartData));
      setChartData(chartTransformedData);
      createOrderSummary(legs, contracts);
    }
  }, [size, strike1, strike2]);

  const createOrderSummary = async (legs: Leg[], contracts: ContractDetails) => {
    const totalNetPrice = calculateNetPrice(
      legs,
      [contracts[strike1].referencePrice, contracts[strike2].referencePrice],
      currencyPrecision.strike
    );
    const order = {
      clientOrderId: createClientOrderId(),
      totalNetPrice,
      legs,
    };

    try {
      const [orderLock, orderFees] = await Promise.all([
        ithacaSDK.calculation.estimateOrderLockPositioned(order),
        ithacaSDK.calculation.estimateOrderFees(order),
      ]);

      setOrderSummary({
        order,
        orderLock,
        orderFees,
      });
    } catch (error) {
      setOrderSummary({
        order,
        orderLock: null,
        orderFees: null,
      });
      console.error("Order estimation for position builder failed", error);
    }
  };

  const submitToAuction = async (order: ClientConditionalOrder, orderDescr: string) => {
    try {
      await ithacaSDK.orders.newOrder(order, orderDescr);
      showOrderConfirmationToast();
    } catch (error) {
      showOrderErrorToast();
      console.error("Failed to submit order", error);
    }
  };

  // Draw graph (always positive)  out of this data
  // Submit handling
  // Wire up available collateral
  // Wire up the yields
  // Wire up the APY

  return (
    <div className={styles.board}>
      <div className={styles.boardHeader}>
        <span className={styles.boardHeaderCircle}>3</span>
        <span>Principal Protected Strategies</span>
      </div>

      <div className={styles.charts}>
        <div className={styles.chartsTitle}>Select Market outlook</div>
        <div className={styles.chartsGrid}>
          <Panel>
            <div
              tabIndex={0}
              role='button'
              className={styles.chartsBox}
              data-selected={marketOutlook == MarketOutlook.RANGE}
              onClick={() => handleMarketOutlookChange(MarketOutlook.RANGE)}
            >
              <div className={styles.chartsBoxWrapper}>
                <ChartPayoff
                  compact
                  showKeys={false}
                  showPortial={false}
                  chartData={rangeChartData}
                  height={80}
                  customDomain={{ min: 0, max: 1 }}
                  id='bet-compact-chart'
                />
              </div>
              <div>Range</div>
            </div>
          </Panel>
          <Panel>
            <div
              tabIndex={0}
              role='button'
              className={styles.chartsBox}
              data-selected={marketOutlook == MarketOutlook.BULL}
              onClick={() => handleMarketOutlookChange(MarketOutlook.BULL)}
            >
              <div className={styles.chartsBoxWrapper}>
                <ChartPayoff
                  compact
                  showKeys={false}
                  showPortial={false}
                  chartData={bullChartData}
                  height={80}
                  customDomain={{ min: 0, max: 1 }}
                  id='call-compact-chart'
                />
              </div>
              <div>Bull</div>
            </div>
          </Panel>
          <Panel>
            <div
              tabIndex={0}
              role='button'
              className={styles.chartsBox}
              data-selected={marketOutlook == MarketOutlook.BEAR}
              onClick={() => handleMarketOutlookChange(MarketOutlook.BEAR)}
            >
              <div className={styles.chartsBoxWrapper}>
                <ChartPayoff
                  compact
                  showKeys={false}
                  showPortial={false}
                  chartData={bearChartData}
                  height={80}
                  customDomain={{ min: 0, max: 1 }}
                  id='put-compact-chart'
                />
              </div>
              <div>Bear</div>
            </div>
          </Panel>
        </div>
        <div className={styles.chartsFooter}>
          Earn Baseline Yield leverage your market outlook to earn additional returns.
        </div>
      </div>

      {step == OnboardingStep.CONFIG && (
        <>
          <div className={styles.controls}>
            <div className={styles.controlsGrid}>
              <DropdownMenu
                label='Expiry'
                options={expiryList.map(expiry => ({
                  name: formatDate(expiry.toString(), DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT),
                  value: expiry.toString(),
                }))}
                onChange={value => {
                  setSelectedExpiry(value);
                }}
                value={{
                  name: formatDate(selectedExpiry.toString(), DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT),
                  value: selectedExpiry.toString(),
                }}
              />
              <Input value={size} icon={<LogoUsdc />} label='Amount' onChange={e => setSize(e.target.value)} />
              <Button variant='secondary' size='sm' className='tw-px-4' title='All'>
                All
              </Button>

              <DropdownMenu
                label='Strike 1'
                options={strike1List.map(strike => ({
                  name: strike,
                  value: strike,
                }))}
                onChange={value => {
                  updateStrikes(value, strike2, fullStrikeList);
                }}
                value={{ name: strike1, value: strike1 }}
                className='tw-ml-auto'
              />
              <DropdownMenu
                label='Strike 2'
                options={strike2List.map(strike => ({
                  name: strike,
                  value: strike,
                }))}
                onChange={value => {
                  updateStrikes(strike1, value, fullStrikeList);
                }}
                value={{ name: strike2, value: strike2 }}
              />
            </div>
            <div className={styles.controlsFooter}>
              <span>
                Available Collateral on Ithaca : &nbsp;
                {collateralSummary["USDC"]?.walletBalance !== "0" ? collateralSummary["USDC"]?.walletBalance : "-"}
              </span>{" "}
              <LogoUsdc /> <span>USDC</span>
            </div>
          </div>
          <div className={styles.info}>
            <div className={styles.infoBox}>
              <div className={styles.infoBoxTitle}>
                <LogoEth /> ETH @{" "}
                {formatDate(selectedExpiry.toString(), DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT)} Expiry
                &lt;{strike1 > strike2 ? strike2 : strike1} or &gt;{strike1 > strike2 ? strike1 : strike2} Min Potential
                Yield
              </div>
              <div className={styles.infoBoxRow}>
                <span>{formatNumberByCurrency(minYield, "string", "USDC")}</span>
                <LogoUsdc />
                <span>USDC</span>
              </div>
              <div className={styles.gray}>{calculateAPY(`${selectedExpiry}`, Number(size), minYield)}% APY</div>
            </div>
            <div className={styles.infoBox}>
              <div className={styles.gray}>
                <LogoEth className='tw-inline-block' /> ETH @{" "}
                {formatDate(selectedExpiry.toString(), DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT)} Expiry
                &lt;{strike1 > strike2 ? strike2 : strike1} or &gt;{strike1 > strike2 ? strike1 : strike2} Max Potential
                Yield
              </div>
              <div className={styles.infoBoxRow}>
                <span>{formatNumberByCurrency(maxYield, "string", "USDC")}</span>
                <LogoUsdc />
                <span>USDC</span>
              </div>
              <div className={styles.gray}>{calculateAPY(`${selectedExpiry}`, Number(size), maxYield)}% APY</div>
            </div>
            <div className={styles.infoBox}>
              <div className={styles.gray}>Airdrop</div>
              <div className='tw-mt-auto tw-flex tw-flex-col tw-gap-0.5'>
                <span className='tw-text-base tw-text-ithaca-green-30'>+1234 Points</span>
                <div className={styles.gray}>2.35% APY</div>
              </div>
            </div>
          </div>
          <div className='tw-my-8 tw-w-full tw-p-4'>
            <ChartPayoff
              isOnboarding
              showKeys={false}
              chartData={chartData}
              expiry={selectedExpiry}
              risk={Number(size)}
              height={120}
              customDomain={{ min: 0, max: 1 }}
              id='full-onboarding-chart'
            />
          </div>
          <div className={styles.footer}>
            <div className={styles.footerTitle}>Settlement in</div>

            <Flex direction='column'>
              <LabelValue label='Next Auction' value={<CountdownTimer />} />
            </Flex>

            <Button
              title=''
              className='tw-flex-1'
              onClick={() => {
                if (orderSummary) {
                  submitToAuction(orderSummary.order, marketOutlook);
                }
              }}
            >
              Submit
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
export default OnboardingStepThreeBoard;
