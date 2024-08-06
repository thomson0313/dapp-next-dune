import RefreshIcon from "@/assets/icons/refresh.svg";
import { useGetFetchBestBidAskPreciseQueryKey } from "@/pages/pricing";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { format } from "date-fns";
import { debounce } from "lodash";
import { useEffect, useState } from "react";

interface RefreshPricesProps {
  onRefreshPrices?: () => void;
}

const RefreshPrices = ({ onRefreshPrices }: RefreshPricesProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<undefined | number>(undefined);
  const queryClient = useQueryClient();
  const queryKey = useGetFetchBestBidAskPreciseQueryKey();

  useEffect(() => {
    updateRefreshTime();
  }, []);

  const updateRefreshTime = () => {
    const query = queryClient.getQueryState(queryKey);
    if (!query?.dataUpdatedAt && !query?.error) {
      debounced();
      return;
    }
    setLastRefreshTime(query?.dataUpdatedAt);
  };

  const debounced = debounce(updateRefreshTime, 500);

  const onClick = () => {
    setIsAnimating(true);
    onRefreshPrices?.();

    setTimeout(() => {
      setIsAnimating(false);
      updateRefreshTime();
    }, 1000);
  };

  // No possibility to refresh prices without function
  if (!onRefreshPrices) return null;

  return (
    <div className='tw-flex tw-flex-col tw-items-end'>
      <button onClick={onClick} className='tw-flex tw-cursor-pointer tw-flex-row tw-items-center tw-gap-[6px]'>
        <RefreshIcon
          className={classNames({
            "tw-animate-spin": isAnimating,
          })}
        />
        <span className='tw-text-xs tw-text-white'>Refresh prices</span>
      </button>

      <p className='tw-mt-2 tw-text-xxs'>
        Last Update: {lastRefreshTime && format(new Date(lastRefreshTime), "dd MMM - HH:mm:ss")}
      </p>
    </div>
  );
};

export default RefreshPrices;
