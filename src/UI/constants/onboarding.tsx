import Image from "next/image";
import StoriesImage from "@/assets/onboarding/stories.png";
import MarketImage from "@/assets/onboarding/market.png";
import DynamicOptionsImage from "@/assets/onboarding/dynamic-options.png";
import PositionsBuilderImage from "@/assets/onboarding/positions-builder.png";

import { TradeType } from "@/pages/onboarding";
import { estimateOrderPayoff } from "../utils/CalcChartPayoff";
import { SIDE } from "@/utils/types";
import { StrategyLeg } from "./prepackagedStrategies";

export enum MarketOutlook {
  RANGE = "Range",
  BULL = "Bull",
  BEAR = "Bear",
}

export const rangePayoffMap = estimateOrderPayoff(
  [
    { ...{ payoff: "BinaryCall", economics: { strike: 3000 } }, ...{ quantity: "120", side: "BUY" }, premium: 100 },
    { ...{ payoff: "BinaryCall", economics: { strike: 3100 } }, ...{ quantity: "120", side: "SELL" }, premium: 0 },
  ],
  {
    min: 2900,
    max: 3200,
  },
  true
);

export const bullSpreadPayoffMap = estimateOrderPayoff(
  [
    { ...{ payoff: "Call", economics: { strike: 3300 } }, ...{ quantity: "1", side: "BUY" }, premium: 2 },
    { ...{ payoff: "Call", economics: { strike: 3400 } }, ...{ quantity: "1", side: "SELL" }, premium: 0 },
  ],
  {
    min: 2900,
    max: 3800,
  },
  true
);

export const bearSpreadPayoffMap = estimateOrderPayoff(
  [
    { ...{ payoff: "Put", economics: { strike: 3200 } }, ...{ quantity: "1", side: "BUY" }, premium: 2 },
    { ...{ payoff: "Put", economics: { strike: 3100 } }, ...{ quantity: "1", side: "SELL" }, premium: 0 },
  ],
  {
    min: 2900,
    max: 3400,
  },
  true
);

export const getOnboardingBoardContent = (value: TradeType) => {
  switch (value) {
    case TradeType.MARKET:
      return {
        title: "Market",
        description: "Market offers pre-configured option strategies for beginners to begin their investment journey.",
        image: <Image src={MarketImage} alt='Trade type' className='tw-w-full tw-object-contain' />,
      };

    case TradeType.STORIES:
      return {
        title: "Stories",
        description: "Stories offers pre-configured option strategies for beginners to begin their investment journey.",
        image: <Image src={StoriesImage} alt='Trade type' className='tw-w-full tw-object-contain' />,
      };

    case TradeType.DYNAMIC_OPTIONS_STRATEGIES:
      return {
        title: "Dynamic Options Strategies",
        description:
          "Market The Dynamic Strategies tab allows the user to conveniently select from a number of linear combinations and structured products with flexibility to make changes to customize each. pre-configured option strategies for beginners to begin their investment journey.",
        image: <Image src={DynamicOptionsImage} alt='Trade type' className='tw-w-full tw-object-contain' />,
      };

    case TradeType.POSITIONS_BUILDER:
      return {
        title: "Positions Builder",
        description:
          "The position builder functionality is a self contained instance of the complete protocol. A user does not need to leave the confines of the position builder if they do wish, there is no loss of generality in restricting oneself exploring it to the expense of all others sections.",
        image: <Image src={PositionsBuilderImage} alt='Trade type' className='tw-w-full tw-object-contain' />,
      };
  }
};

export const ONBOARDING_STRATEGIES: Record<MarketOutlook, StrategyLeg[]> = {
  [MarketOutlook.RANGE]: [
    {
      product: "digital-option",
      type: "BinaryCall",
      payoff: "BinaryCall",
      side: SIDE.BUY,
      size: 100,
      strikeIndex: 0,
      strike: "",
      linked: true,
      contractId: 0,
      referencePrice: 0,
    },
    {
      product: "digital-option",
      type: "BinaryCall",
      payoff: "BinaryCall",
      side: SIDE.SELL,
      size: 100,
      strikeIndex: 2,
      strike: "",
      linked: true,
      contractId: 0,
      referencePrice: 0,
    },
  ],
  [MarketOutlook.BULL]: [
    {
      product: "option",
      type: "Call",
      payoff: "Call",
      side: SIDE.BUY,
      size: 1,
      strikeIndex: 1,
      strike: "",
      linked: true,
      contractId: 0,
      referencePrice: 0,
    },
    {
      product: "option",
      type: "Call",
      payoff: "Call",
      side: SIDE.SELL,
      size: 1,
      strikeIndex: 2,
      strike: "",
      linked: true,
      contractId: 0,
      referencePrice: 0,
    },
  ],
  [MarketOutlook.BEAR]: [
    {
      product: "option",
      type: "Put",
      payoff: "Put",
      side: SIDE.BUY,
      size: 1,
      strikeIndex: 0,
      strike: "",
      linked: true,
      contractId: 0,
      referencePrice: 0,
    },
    {
      product: "option",
      type: "Put",
      payoff: "Put",
      side: SIDE.SELL,
      size: 1,
      strikeIndex: -1,
      strike: "",
      linked: true,
      contractId: 0,
      referencePrice: 0,
    },
  ],
};
