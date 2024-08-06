import { useEffect, useRef, useState } from "react";

import dayjs from "dayjs";

import { useAppStore } from "@/UI/lib/zustand/store";

import styles from "./CountdownTimer.module.scss";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_DATA_STALE_TIME } from "@/UI/utils/constants";

const CountdownTimer = () => {
  const { ithacaSDK } = useAppStore();
  const queryClient = useQueryClient();
  const { data: nextAuction, refetch: refetchNextAuction } = useQuery({
    queryKey: ["nextAuction"],
    enabled: Boolean(ithacaSDK),
    staleTime: DEFAULT_DATA_STALE_TIME,
    queryFn: () => ithacaSDK.protocol.nextAuction(),
  });

  const getNextAuctionTimes = (time: number) => {
    const nextAuction = dayjs(time);
    const currentTime = dayjs();
    return {
      hours: nextAuction.diff(currentTime, "hour"),
      minutes: nextAuction.diff(currentTime, "minute") % 60,
      seconds: nextAuction.diff(currentTime, "second") % 60,
    };
  };

  const [time, setTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const lastUpdateTimeRef = useRef<number | null>(null);

  const refreshData = () => {
    refetchNextAuction();
    queryClient.refetchQueries({
      queryKey: ["spotPrices"],
      exact: false,
    });
  };

  useEffect(() => {
    if (!nextAuction || nextAuction < Date.now()) {
      refreshData();
    }

    const resetTimer = () => {
      setTime({ ...getNextAuctionTimes(nextAuction || 0) });
      lastUpdateTimeRef.current = Date.now();
    };

    const updateTime = () => {
      const now = Date.now();
      const elapsedTime = lastUpdateTimeRef.current ? now - lastUpdateTimeRef.current : 1000;
      lastUpdateTimeRef.current = now;

      setTime(prevTime => {
        let { hours, minutes, seconds } = prevTime;
        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

        totalSeconds -= Math.round(elapsedTime / 1000);

        if (totalSeconds <= 0) {
          refreshData();
          resetTimer();
          return getNextAuctionTimes(nextAuction || 0);
        }

        hours = Math.floor(totalSeconds / 3600);
        minutes = Math.floor((totalSeconds % 3600) / 60);
        seconds = totalSeconds % 60;

        return { hours, minutes, seconds };
      });
    };

    resetTimer();

    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [nextAuction, refetchNextAuction, queryClient]);

  useEffect(() => {
    if (nextAuction) {
      setTime(getNextAuctionTimes(nextAuction));
    }
  }, []);

  return (
    <div className={styles.countdownTimer}>
      {time.hours.toString().padStart(2, "0")} <span>Hrs</span> <span className={styles.white}>:</span>{" "}
      {time.minutes.toString().padStart(2, "0")}
      <span>Mins</span> <span className={styles.white}>:</span> {time.seconds.toString().padStart(2, "0")}{" "}
      <span>Secs</span>
    </div>
  );
};

export default CountdownTimer;
