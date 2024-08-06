import { DEFAULT_REFETCH_INTERVAL } from "@/UI/utils/constants";
import { fetchForwardPrice, fetchPrice } from "./calcPrice.api.service";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface UseForwardPriceProps {
  date: string;
}

export const useNextForwardAuction = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["fetchPrice", today],
    queryFn: () => fetchPrice({ strike: "0", optionType: "Forward", date: today }),
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
  });
};

export const useForwardPrice = ({ date }: UseForwardPriceProps) => {
  return useQuery({
    queryKey: ["forwardPrice", date],
    queryFn: () => fetchForwardPrice({ date }),
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
  });
};
