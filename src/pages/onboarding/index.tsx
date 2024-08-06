import { useCallback, useEffect, useState } from "react";

// Constants
import { rangePayoffMap, bullSpreadPayoffMap, bearSpreadPayoffMap, MarketOutlook } from "@/UI/constants/onboarding";

// Components
import Meta from "@/UI/components/Meta/Meta";
import OnboardingDisplayPanel from "@/UI/components/Onboarding/OnboardingDisplayPanel";
import OnboardingStepsGrid from "@/UI/components/Onboarding/OnboardingStepsGrid";

// Layout
import Main from "@/UI/layouts/Main/Main";
import Container from "@/UI/layouts/Container/Container";
import { HideData } from "@/UI/components/HideData";
import { useAppStore } from "@/UI/lib/zustand/store";

// Styles
import styles from "./onboarding.module.scss";

// Types
import { estimateOrderPayoff, PayoffMap } from "@/UI/utils/CalcChartPayoff";

export enum TradeType {
  MARKET = "Market",
  STORIES = "Stories",
  POSITIONS_BUILDER = "Positions Builder",
  DYNAMIC_OPTIONS_STRATEGIES = "Dynamic Options Strategies",
}

export enum OnboardingStep {
  DEPOSIT = "Deposit",
  TRADE = "Trade",
  CONFIG = "Principal Protected Strategies Configuration",
  STRATEGIES = "Principal Protected Strategies",
}

export type Tab = "Strategies" | "Trade";

const Onboarding = () => {
  const { isLocationRestricted } = useAppStore();
  const [isYieldOff, setIsYieldOff] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.CONFIG);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.MARKET);
  const [marketOutlook, setMarketOutlook] = useState<MarketOutlook>(MarketOutlook.RANGE);
  const [rangeChartData, setRangeChartData] = useState<PayoffMap[]>([]);
  const [bullChartData, setBullChartData] = useState<PayoffMap[]>([]);
  const [bearChartData, setBearChartData] = useState<PayoffMap[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Trade");

  const handleTabChange = useCallback((value: Tab) => {
    setActiveTab(value);
  }, []);

  useEffect(() => {
    setRangeChartData(rangePayoffMap);
    setBullChartData(bullSpreadPayoffMap);
    setBearChartData(bearSpreadPayoffMap);
  }, []);

  return (
    <>
      <Meta />
      <Main>
        <HideData visible={isLocationRestricted} withModal={true} title='Location Restricted'>
          <Container className='mb-15'>
            <div className={styles.layout}>
              <h1 className={styles.title}>Onboarding</h1>
              <div className={styles.gridContainer}>
                <OnboardingStepsGrid
                  isYieldOff={isYieldOff}
                  step={step}
                  setStep={setStep}
                  tradeType={tradeType}
                  marketOutlook={marketOutlook}
                  activeTab={activeTab}
                  handleTabChange={handleTabChange}
                />
                <OnboardingDisplayPanel
                  step={step}
                  isYieldOff={isYieldOff}
                  setIsYieldOff={setIsYieldOff}
                  setStep={setStep}
                  tradeType={tradeType}
                  setTradeType={setTradeType}
                  activeTradeTab={activeTab}
                  marketOutlook={marketOutlook}
                  setMarketOutlook={setMarketOutlook}
                  bearChartData={bearChartData}
                  bullChartData={bullChartData}
                  rangeChartData={rangeChartData}
                />
              </div>
            </div>
          </Container>
        </HideData>
      </Main>
    </>
  );
};

export default Onboarding;
