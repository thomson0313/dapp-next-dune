import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchQuotingParams } from "@/services/pricing/calcPrice.api.service";
import { DEFAULT_DATA_CACHE_IN_STORAGE, DEFAULT_REFETCH_INTERVAL, SYSTEM_BASIC_DATA } from "../utils/constants";
import { useEffect, useMemo } from "react";
import { useAppStore } from "../lib/zustand/store";
import { transformInitData } from "../lib/zustand/slices/helpers";
import { checkAndDetectIp } from "@/services/kyc.api.service";
import { useAccount } from "wagmi";

const DataProvider = () => {
  const {
    setBasicData,
    setMaintenanceMode,
    updateLocationRestriction,
    ithacaSDK,
    currentCurrencyPair,
    contractsWithReferencePrices,
    currentExpiryDate,
    setCurrentExpiryDate,
  } = useAppStore();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { data: locationData } = useQuery({
    queryKey: ["checkAndDetectIp"],
    queryFn: () =>
      checkAndDetectIp({
        walletAddress: address,
      }),
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
  });

  const { data: systemInfo, isError: systemInfoError } = useQuery({
    queryKey: [SYSTEM_BASIC_DATA, "systemInfo"],
    enabled: Boolean(ithacaSDK),
    queryFn: () => ithacaSDK.protocol.systemInfo(),
    gcTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    staleTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    meta: {
      persist: true,
    },
  });

  const { data: contractList, isError: contractListError } = useQuery({
    queryKey: [SYSTEM_BASIC_DATA, "contractList"],
    enabled: Boolean(ithacaSDK),
    queryFn: () => ithacaSDK.protocol.contractList(),
    gcTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    staleTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    meta: {
      persist: true,
    },
  });

  const { data: referencePrices, isError: referencePricesError } = useQuery({
    queryKey: [SYSTEM_BASIC_DATA, "referencePrices"],
    enabled: Boolean(ithacaSDK),
    queryFn: () => ithacaSDK.market.referencePrices(0, currentCurrencyPair),
    gcTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    staleTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    meta: {
      persist: true,
    },
  });

  const { data: spotPrices, isError: spotPricesError } = useQuery({
    queryKey: [SYSTEM_BASIC_DATA, "spotPrices"],
    enabled: Boolean(ithacaSDK),
    queryFn: () => ithacaSDK.market.spotPrices(),
    gcTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    staleTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    meta: {
      persist: true,
    },
  });

  const { data: quotingParams, isError: quotingParamsError } = useQuery({
    queryKey: [SYSTEM_BASIC_DATA, "quotingParams"],
    queryFn: () => fetchQuotingParams({ currency: "WETH" }),
    gcTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    staleTime: DEFAULT_DATA_CACHE_IN_STORAGE,
    meta: {
      persist: true,
    },
  });

  useEffect(() => {
    updateLocationRestriction(locationData?.status === 401);
  }, [locationData]);

  const hasError = useMemo(() => {
    return systemInfoError || contractListError || referencePricesError || spotPricesError || quotingParamsError;
  }, [systemInfoError, contractListError, referencePricesError, spotPricesError, quotingParamsError]);

  useEffect(() => {
    if (hasError) {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [SYSTEM_BASIC_DATA] });
      }, DEFAULT_REFETCH_INTERVAL);
    }

    setMaintenanceMode(hasError);
  }, [hasError]);

  useEffect(() => {
    if (quotingParams && systemInfo && contractList && referencePrices && spotPrices) {
      const { spotContract, currencyPrecision, filteredContractList, expiryList, currentSpotPrice } = transformInitData(
        {
          currentCurrencyPair,
          systemInfo,
          spotPrices,
          contractList,
          contractsWithReferencePrices,
          referencePrices,
        }
      );

      setBasicData({
        currentSpotPrice,
        spotPrices,
        expiryList,
        quotingParams: quotingParams.data,
        systemInfo,
        spotContract,
        currencyPrecision,
        contractList: filteredContractList,
        allContracts: contractList,
      });
      if (!currentExpiryDate) {
        setCurrentExpiryDate(expiryList[0]);
      }
    }
  }, [quotingParams, systemInfo, contractList, referencePrices, spotPrices, currentExpiryDate]);

  return <></>;
};

export default DataProvider;
