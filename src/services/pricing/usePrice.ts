import { transformTradingPrice } from "@/UI/utils/Numbers";
import { fetchForwardPrice, fetchPrice } from "./calcPrice.api.service";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useAppStore } from "@/UI/lib/zustand/store";
import { DEFAULT_INPUT_DATE_FORMAT, formatDate } from "@/UI/utils/DateFormatting";
import { calculateBidAsk } from "./helpers";
import { UsePriceProps } from "@/types/calc.api";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DATA_STALE_TIME } from "@/UI/utils/constants";

interface ReturnProps {
  unitPrice: string;
  isLoading: boolean;
}

export const usePrice = ({ isForward, optionType, expiryDate, strike, side }: UsePriceProps): ReturnProps => {
  const { spotContract, getContractsByPayoff, quotingParams, currentSpotPrice } = useAppStore();
  const dateInitial = formatDate(expiryDate.toString(), DEFAULT_INPUT_DATE_FORMAT, "YYYY-MM-DD");

  const fallbackPrice = () => {
    if (strike) {
      if (strike === "-" && isForward) {
        const currentForwardContract = getContractsByPayoff("Forward")["-"];
        const contract = optionType === "NEXT_AUCTION" ? spotContract : currentForwardContract;
        return contract.referencePrice;
      } else if (strike !== "-" && !isForward) {
        const contracts = getContractsByPayoff(optionType);
        return contracts[strike].referencePrice;
      }
    }
    return 0;
  };

  const fetchForward = async () => {
    try {
      const dateFinal = optionType === "NEXT_AUCTION" ? dayjs().format("YYYY-MM-DD") : dateInitial;
      const price = await fetchForwardPrice({ date: dateFinal });
      if (!price.data) {
        throw new Error("Lack of data");
      }
      return price.data;
    } catch (error) {
      console.error("fetchPriceForUnit__error", error);
      return fallbackPrice();
    }
  };

  const fetchRegular = async () => {
    try {
      const price = await fetchPrice({
        optionType: optionType,
        date: dateInitial,
        strike: strike,
      });
      if (!price.data) {
        throw new Error("Lack of data");
      }
      return price.data;
    } catch (error) {
      console.error("fetchPriceForUnit__error", error);
      return fallbackPrice();
    }
  };

  const { data: forwardPrice, isLoading: isLoadingForward } = useQuery({
    queryKey: ["forwardPrice", dateInitial, optionType, isForward],
    queryFn: fetchForward,
    enabled: isForward,
    placeholderData: fallbackPrice,
    staleTime: DEFAULT_DATA_STALE_TIME,
  });

  const { data: regularPrice, isLoading: isLoadingRegular } = useQuery({
    queryKey: ["regularPrice", dateInitial, optionType, strike],
    queryFn: fetchRegular,
    enabled: Boolean(!isForward && strike && strike !== "-"),
    placeholderData: fallbackPrice,
    staleTime: DEFAULT_DATA_STALE_TIME,
  });

  const isLoading = isForward ? isLoadingForward : isLoadingRegular;
  const unitPrice = (isForward ? forwardPrice : regularPrice) ?? 0;

  return {
    unitPrice: transformTradingPrice(
      !side
        ? unitPrice
        : calculateBidAsk({
            midPrice: Number(unitPrice),
            optionType: isForward ? "Forward" : optionType,
            side: side,
            forcedSpread: undefined,
            quotingParams: quotingParams,
            currentSpotPrice,
          })
    ),
    isLoading,
  };
};
