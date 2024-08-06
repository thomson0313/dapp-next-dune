import { useEffect, useState } from "react";

import classNames from "classnames";

import { getCurrencyLogo } from "@/UI/utils/Currency";
import { formatNumberByFixedPlaces } from "@/UI/utils/Numbers";
import styles from "@/UI/components/OptionsTable/OptionsTable.module.scss";
import { DEFAULT_INPUT_DATE_FORMAT, formatDate } from "@/UI/utils/DateFormatting";
import { OptionsBidAskData, OptionsData, TableProps } from "@/UI/constants/prices";
import { fetchPriceList } from "@/services/pricing/calcPrice.api.service";
import SingleValueCell from "./SingleValueCell";
import { useAppStore } from "@/UI/lib/zustand/store";
import { useForwardPrice } from "@/services/pricing/useForwardPrices";
import { ReceivedContract } from "@/types/calc.api";

function generateStrikesToReplicate(spotPrice: number, isUp: boolean, count = 3, step = 100) {
  const strikes = [];
  const multiplier = isUp ? 1 : -1;

  for (let i = 1; i <= count; i++) {
    const strike = spotPrice + multiplier * step * i;
    strikes.push(strike);
  }

  return strikes;
}

const Table = ({ type, data, strikes, currency, digitals, oppositeData }: TableProps) => {
  const [showingData, setShowingData] = useState<OptionsBidAskData[]>([]);
  const { currentExpiryDate, currentSpotPrice } = useAppStore();
  const currentExpiryDateFormatted = formatDate(currentExpiryDate.toString(), DEFAULT_INPUT_DATE_FORMAT, "YYYY-MM-DD");
  const { data: selectedExpiryPriceData } = useForwardPrice({ date: currentExpiryDateFormatted });
  const fwdPrice = selectedExpiryPriceData?.data ?? 1; // do not divide by 0;

  useEffect(() => {
    if (!data.length) return;

    const processData = async () => {
      const tempData = processStrikes(data, strikes);
      const contracts = createContracts(tempData);
      const priceListData = await fetchPriceList({ contracts });
      const showingList = createShowingList(
        tempData,
        priceListData.data,
        type,
        currentSpotPrice,
        fwdPrice,
        oppositeData
      );
      setShowingData(showingList);
    };

    processData();
  }, [data, strikes, fwdPrice, currentSpotPrice, type, digitals, oppositeData]);

  const processStrikes = (data: OptionsData[], strikes: number[]): OptionsData[] => {
    return strikes.reduce((acc: OptionsData[], strike) => {
      const tempDataForStrike = data.reduce((best: OptionsData | undefined, current: OptionsData) => {
        if (current.economics.strike === strike) {
          if (!best || current.referencePrice > best.referencePrice) {
            return current;
          }
        }
        return best;
      }, undefined);

      if (tempDataForStrike) {
        acc.push(tempDataForStrike);
      }
      return acc;
    }, []);
  };

  const createContracts = (tempData: OptionsData[]) => {
    return tempData.map(el => ({
      contractId: el.contractId,
      payoff: el.payoff,
      expiry: formatDate(el.economics.expiry.toString(), DEFAULT_INPUT_DATE_FORMAT, "YYYY-MM-DD"),
      strike: el.economics.strike,
    }));
  };

  const createShowingList = (
    tempData: OptionsData[],
    priceData: ReceivedContract[],
    type: string,
    currentSpotPrice: number,
    fwdPrice: number,
    oppositeData: OptionsData[]
  ) => {
    const spotPriceRounded = Math.round(currentSpotPrice / 100) * 100;
    const strikesToReplicate = generateStrikesToReplicate(spotPriceRounded, type === "puts");

    return tempData.map(el => {
      const newContract = priceData.find(contract => contract.contractId === el.contractId);
      const shouldReplicate = el.economics.strike ? strikesToReplicate.includes(el.economics.strike!) : false;

      if (shouldReplicate) {
        return processReplicatedStrike(el, oppositeData, type, fwdPrice, currentSpotPrice, newContract);
      }

      return {
        askVolume: el.askVolume,
        bidVolume: el.bidVolume,
        bestBid: el.bestBid || 0,
        bestAsk: el.bestAsk || 0,
        referencePrice: newContract?.price || 0,
      };
    });
  };

  const processReplicatedStrike = (
    el: OptionsData,
    oppositeData: OptionsData[],
    type: string,
    fwdPrice: number,
    currentSpotPrice: number,
    newContract?: ReceivedContract
  ) => {
    const discountFactor = currentSpotPrice / fwdPrice;
    const findPutOrCall = oppositeData.find(item => item.economics.strike === el.economics.strike);
    const strikeAdjustment = el.economics.strike ? (fwdPrice - el.economics.strike) * discountFactor : 0;

    const baseResult = {
      askVolume: el.askVolume,
      bidVolume: el.bidVolume,
      referencePrice: newContract?.price || 0,
      bestBid: el.bestBid || 0,
      bestAsk: el.bestAsk || 0,
    };

    if (digitals) {
      return {
        ...baseResult,
        bestBid: findPutOrCall?.bestAsk ? 1 - findPutOrCall.bestAsk : 0,
        bestAsk: findPutOrCall?.bestBid ? 1 - findPutOrCall.bestBid : 0,
      };
    } else {
      if (type === "calls") {
        return {
          ...baseResult,
          bestBid: findPutOrCall?.bestBid ? findPutOrCall.bestBid + strikeAdjustment : 0,
          bestAsk: findPutOrCall?.bestAsk ? findPutOrCall.bestAsk + strikeAdjustment : 0,
        };
      }

      if (type === "puts") {
        return {
          ...baseResult,
          bestBid: findPutOrCall?.bestBid ? findPutOrCall.bestBid - strikeAdjustment : 0,
          bestAsk: findPutOrCall?.bestAsk ? findPutOrCall.bestAsk - strikeAdjustment : 0,
        };
      }
    }

    return baseResult;
  };

  return (
    <div className={styles.table}>
      <h1>{type.charAt(0).toUpperCase() + type.slice(1)}</h1>
      <div className={`${styles.header} ${styles[type]}`}>
        <div className={styles.cell}>Bid</div>
        <div className={styles.cell}>Model</div>
        <div className={styles.cell}>Ask</div>
      </div>
      {showingData.map((el, index) => {
        return (
          <div
            key={index}
            className={classNames(
              `${styles.row} ${styles[type]} ${index % 2 === 1 && styles.darkRow} ${index === 5 && styles.selectedRow}`,
              "tw-h-[54px]"
            )}
          >
            <SingleValueCell
              textClassName='tw-text-ithaca-green-30'
              value={formatNumberByFixedPlaces(el.bestBid, 3)}
              depthValue={el.bidVolume ? formatNumberByFixedPlaces(el.bidVolume, currency === "USDC" ? 0 : 3) : "-"}
              currencyIcon={getCurrencyLogo(currency)}
            />
            <div className={classNames(styles.cell, "tw-flex tw-flex-col")}>
              <span className='tw-text-ithaca-white-60'>{formatNumberByFixedPlaces(el.referencePrice, 3)}</span>
            </div>
            <SingleValueCell
              textClassName='tw-text-ithaca-red-20'
              value={formatNumberByFixedPlaces(el.bestAsk, 3)}
              depthValue={el.askVolume ? formatNumberByFixedPlaces(el.askVolume, currency === "USDC" ? 0 : 3) : "-"}
              currencyIcon={getCurrencyLogo(currency)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Table;
