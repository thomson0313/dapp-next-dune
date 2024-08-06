import { Currency } from "@/utils/types";
import { Contract, ReferencePrice } from "@ithaca-finance/sdk";

export type TableProps = {
  type: "puts" | "calls";
  data: OptionsData[];
  oppositeData: OptionsData[];
  strikes: number[];
  currency: Currency;
  digitals: boolean;
};

export type OptionsData = Contract &
  ReferencePrice & {
    bestAsk: number | null;
    bestAskType: string | null;
    bestBid: number | null;
    bestBidType: string | null;
    askVolume: number | null;
    bidVolume: number | null;
  };

export type OptionsTableProps = {
  data: OptionsData[];
  currency: Currency;
  digitals: boolean;
};

export type ForwardTableData = {
  index: number;
  data: OptionsData;
};

export type OptionsBidAskData = {
  bestAsk: number;
  bestBid: number;
  referencePrice: number;
  askVolume: number | null;
  bidVolume: number | null;
};
