import { usePricingData } from "@/pages/pricing";
import SingleValueCell from "../../OptionsTable/SingleValueCell";
import { formatNumberByFixedPlaces } from "@/UI/utils/Numbers";
import { getCurrencyLogo } from "@/UI/utils/Currency";
import { OptionsData } from "@/UI/constants/prices";

interface SingleBidAskValueProps {
  type: "bid" | "ask";
  strike: number | string;
  payoff: "BinaryPut" | "BinaryCall" | "Put" | "Call" | string;
  expiryDate: number;
}

const getOptionData = (options: OptionsData[], strike: number | string, payoff: string) =>
  options.find(item => item.economics.strike === strike && item.payoff === payoff);

const renderSingleValueCell = (
  value: number | null,
  volume: number | null,
  type: "bid" | "ask",
  currency: string,
  valueDecimals: number = 3,
  volumeDecimals: number = 3
) => (
  <SingleValueCell
    className='tw-w-full'
    textClassName={type === "bid" ? "tw-text-ithaca-green-30" : "tw-text-ithaca-red-20"}
    value={value ? formatNumberByFixedPlaces(value, valueDecimals) : "-"}
    depthValue={volume ? formatNumberByFixedPlaces(volume, volumeDecimals) : "-"}
    currencyIcon={getCurrencyLogo(currency)}
  />
);

export const SingleBidAskValue = ({ type, strike, payoff, expiryDate }: SingleBidAskValueProps) => {
  const { options, digitalOptions, forwardsData } = usePricingData();
  const isBid = type === "bid";

  if (payoff === "BinaryPut" || payoff === "BinaryCall") {
    const el = getOptionData(digitalOptions, strike, payoff);
    if (el) {
      return renderSingleValueCell(
        isBid ? el.bestBid : el.bestAsk,
        isBid ? el.bidVolume : el.askVolume,
        type,
        "USDC",
        3,
        0
      );
    }
  }

  if (payoff === "Put" || payoff === "Call") {
    const el = getOptionData(options, strike, payoff);
    if (el) {
      return renderSingleValueCell(isBid ? el.bestBid : el.bestAsk, isBid ? el.bidVolume : el.askVolume, type, "WETH");
    }
  }

  const forwardEl = forwardsData.find(item => item.economics.expiry === expiryDate);
  if (forwardEl) {
    return renderSingleValueCell(
      isBid ? forwardEl.bestBid : forwardEl.bestAsk,
      isBid ? forwardEl.bidVolume : forwardEl.askVolume,
      type,
      "WETH",
      1,
      3
    );
  }

  return null;
};
