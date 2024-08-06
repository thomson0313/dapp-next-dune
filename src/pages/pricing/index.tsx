import { useEffect, useMemo } from "react";

import Main from "@/UI/layouts/Main/Main";
import Meta from "@/UI/components/Meta/Meta";
import Panel from "@/UI/layouts/Panel/Panel";
import { useQuery } from "@tanstack/react-query";
import { OptionsData } from "@/UI/constants/prices";
import { useAppStore } from "@/UI/lib/zustand/store";
import Container from "@/UI/layouts/Container/Container";
import OptionsTable from "@/UI/components/OptionsTable/OptionsTable";
import ForwardsTable from "@/UI/components/ForwardsTable/ForwardsTable";
import HeaderWithInformation from "@/UI/components/HeaderWithInformation";

import styles from "./pricing.module.scss";
import { BEST_BID_ASK_PRECISE, DEFAULT_REFETCH_INTERVAL } from "@/UI/utils/constants";
import Loader from "@/UI/components/Loader/Loader";

export const useGetFetchBestBidAskPreciseQueryKey = () => {
  const { contractsWithReferencePrices, currentExpiryDate } = useAppStore();

  return [BEST_BID_ASK_PRECISE, contractsWithReferencePrices, currentExpiryDate];
};

export const usePricingData = () => {
  const { ithacaSDK, contractsWithReferencePrices, currentExpiryDate } = useAppStore();
  const queryKey = useGetFetchBestBidAskPreciseQueryKey();
  const { data, refetch, isLoading } = useQuery({
    queryKey: queryKey,
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
    queryFn: () => ithacaSDK.analytics.bestBidAskPrecise(),
    select: data => {
      const tempData: OptionsData[] = [];
      for (const key in contractsWithReferencePrices) {
        if (contractsWithReferencePrices[key].economics.expiry === currentExpiryDate) {
          tempData.push({ ...contractsWithReferencePrices[key], ...data.payload[key] });
        }
      }

      return tempData;
    },
  });

  const { data: forwardsData, refetch: refetchForwards } = useQuery({
    queryKey: queryKey,
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
    queryFn: () => ithacaSDK.analytics.bestBidAskPrecise(),
    select: data => {
      const tempData: OptionsData[] = [];
      for (const key in contractsWithReferencePrices) {
        if (["Forward", "Spot"].includes(contractsWithReferencePrices[key].payoff)) {
          tempData.push({ ...contractsWithReferencePrices[key], ...data.payload[key] });
        }
      }

      return tempData;
    },
  });

  const options = useMemo(() => {
    return data?.filter(el => ["Put", "Call"].includes(el.payoff)) || [];
  }, [data]);

  const digitalOptions = useMemo(() => {
    return data?.filter(el => ["BinaryPut", "BinaryCall"].includes(el.payoff)) || [];
  }, [data]);

  return {
    refetch,
    options,
    digitalOptions,
    forwardsData: forwardsData ?? [],
    isLoading,
    refetchForwards,
  };
};

const Loading = () => (
  <Container size='loader' className='tw-min-h-[600px]'>
    <Loader type='lg' />
  </Container>
);

const Pricing = () => {
  const { refetch, options, digitalOptions, isLoading, refetchForwards } = usePricingData();
  const refreshPrices = () => {
    refetch();
    refetchForwards();
  };

  return (
    <>
      <Meta />
      <Main>
        <Container>
          <div className={styles.wrapper}>
            <HeaderWithInformation title='Pricing' onRefreshPrices={refreshPrices} />
            <div className={styles.tablesWrapper}>
              <div className={styles.optionsWrapper}>
                <Panel className={styles.tableContainer}>
                  <h1>Options</h1>
                  {isLoading ? <Loading /> : <OptionsTable data={options} currency={"WETH"} digitals={false} />}
                </Panel>
                <Panel className={styles.tableContainer}>
                  <h1>Digital Options</h1>
                  {isLoading ? <Loading /> : <OptionsTable data={digitalOptions} currency={"USDC"} digitals={true} />}
                </Panel>
              </div>
              <Panel className={styles.tableContainer}>
                <h1>Forwards</h1>
                <ForwardsTable />
              </Panel>
            </div>
          </div>
        </Container>
      </Main>
    </>
  );
};

export default Pricing;
