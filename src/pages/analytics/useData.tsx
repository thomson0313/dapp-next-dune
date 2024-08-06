import { useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useAppStore } from "@/UI/lib/zustand/store";
import { OpenInterestResponse } from "@ithaca-finance/sdk";

export interface Strike {
  [key: string]: {
    [product: string]: OpenInterestResponse;
  };
}

export type TradeDetail = {
  date: string;
  volume: number;
  [key: string]: number | string;
};

export type LlamaDetail = {
  date: string;
  volume: number;
  [key: string]: number | string;
};

export type TradeVolumes = {
  [date: string]: {
    [expiryDate: string]: number;
  };
};

export type DailyVolume = {
  [date: string]: {
    [expiryDate: string]: OpenInterestResponse;
  };
};

export type TvlVolume = {
    date: number;
    totalLiquidityUSD: number;
}

export type TokensVolume = {
  date: number;
  tokens: any;
}

export type TokensInUsdVolume = {
  date: number;
  tokens: any;
}

const DATE_FORMAT_OUTPUT = "yyyy-MM-dd";
export const EXPIRY_FORMAT_OUTPUT = "dMMMyy";

const transformTrades = (results: TradeVolumes | undefined) => {
  if (!results) return [];
  const formattedData: TradeDetail[] = Object.keys(results).map(singleDay => {
    const dayFormatted = format(new Date(singleDay), EXPIRY_FORMAT_OUTPUT);
    let volume = 0;
    const data: TradeDetail = { date: dayFormatted, volume: 0 };

    Object.keys(results[singleDay]).forEach(singleExpiry => {
      const formattedKey = format(new Date(singleExpiry), EXPIRY_FORMAT_OUTPUT);

      data[formattedKey] = results[singleDay][singleExpiry];
      volume += results[singleDay][singleExpiry];
    });

    data.volume = volume;
    return data as TradeDetail;
  });

  return formattedData;
};

const transformDailyVolume = (results: DailyVolume | undefined) => {
  if (!results) return [];
  const formattedData = Object.keys(results).map(singleDay => {
    const dayFormatted = format(new Date(singleDay), EXPIRY_FORMAT_OUTPUT);
    let volume = 0;
    const data: TradeDetail = { date: dayFormatted, volume: 0 };

    Object.keys(results[singleDay]).forEach(singleExpiry => {
      const formattedKey = format(new Date(singleExpiry), EXPIRY_FORMAT_OUTPUT);
      data[formattedKey] = results[singleDay][singleExpiry].totalInNum;
      volume += results[singleDay][singleExpiry].totalInNum;
    });

    data.volume = volume;
    return data as TradeDetail;
  });

  return formattedData;
};

const transformTvl = (props: TvlVolume[] | undefined) => {
  if (!props) return [];
  const formattedData = props.map((pair, index) => {
    const date = new Date(pair.date * 1000);
    // const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const dayFormatted = format(new Date(date), EXPIRY_FORMAT_OUTPUT);
    let volume = 0;
    const data: LlamaDetail = {date: dayFormatted, volume: 0};

    volume += pair.totalLiquidityUSD;
    data.volume = volume;
    return data as LlamaDetail;
  });
  return formattedData;
}

const transformTokens = (props: TokensVolume[] | undefined) => {
  if (!props) return [];
  const formattedData = props.map((pair, index) => {
    const date = new Date(pair.date * 1000);
    // const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const dayFormatted = format(new Date(date), EXPIRY_FORMAT_OUTPUT);
    let WETH = pair.tokens.WETH;
    let USDC = pair.tokens.USDC;
    const data: LlamaDetail = {date: dayFormatted, volume: 0, WETH, USDC};
    
    return data as LlamaDetail;
  });
  return formattedData;
}

const transformTokensInUsd = (props: TokensInUsdVolume[] | undefined) => {
  if (!props) return [];
  const formattedData = props.map((pair, index) => {
    const date = new Date(pair.date * 1000);
    const dayFormatted = format(new Date(date), EXPIRY_FORMAT_OUTPUT);
    let WETH = pair.tokens.WETH;
    let USDC = pair.tokens.USDC;
    const data: LlamaDetail = {date: dayFormatted, volume: 0, WETH, USDC};
    
    return data as LlamaDetail;
  });
  return formattedData;
}

export const useData = () => {
  const { ithacaSDK } = useAppStore();
  const [tradeCount, setTradeCount] = useState<TradeDetail[]>([]);
  const [tradeVolume, setTradeVolume] = useState<TradeDetail[]>([]);

  const [tvl, setTvl] = useState<LlamaDetail[]>([]);
  const [tokens, setTokens] = useState<LlamaDetail[]>([]);
  const [tokensInUsd, setTokensInUsd] = useState<LlamaDetail[]>([]);

  const START_DATE = format(startOfMonth(new Date()), DATE_FORMAT_OUTPUT);
  const END_DATE = format(endOfMonth(new Date()), DATE_FORMAT_OUTPUT);

  useEffect(() => {
    fetchAllTrades();
    fetchDailyVolume();
    fetchTvl();
  }, []);

  const retryAction = async <T,>(action: () => Promise<T>, retries: number = 10, waitTime: number = 5000) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await action();
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt < retries - 1) {
          await new Promise(res => setTimeout(res, waitTime));
        } else {
          throw new Error("All retries failed.");
        }
      }
    }
  };

  const fetchAllTrades = async () => {
    const getTradesDetail = () => ithacaSDK.analytics.tradesDetail("WETH", "USDC", START_DATE, END_DATE);
    const results = await retryAction(getTradesDetail);
    setTradeCount(transformTrades(results));
  };

  const fetchDailyVolume = async () => {
    const getDailyVolumeDetail = () => ithacaSDK.analytics.dailyVolumeDetail("WETH", "USDC", START_DATE, END_DATE);
    const results = await retryAction(getDailyVolumeDetail);
    setTradeVolume(transformDailyVolume(results));
  };

  const fetchTvl = async () => {
    const getTvl  = () => {
      fetch('https://api.llama.fi/protocol/ithaca-protocol')
      .then((response) => response.json())
      .then((data) => {
        setTvl(transformTvl(data.tvl));
        setTokens(transformTokens(data.tokens));
        setTokensInUsd(transformTokensInUsd(data.tokensInUsd));
      })
      .catch((error) => console.error('Error fetching data:', error));
    }
    await getTvl();
  }

  return {
    tradeCount,
    tradeVolume,
    tvl,
    tokens,
    tokensInUsd
  };
};

export default useData;
