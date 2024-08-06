import Flex from "@/UI/layouts/Flex/Flex";
import React, { useEffect, useState } from "react";

import { useDevice } from "@/UI/hooks/useDevice";

import LogoEth from "../Icons/LogoEth";
import Asset from "../Asset/Asset";
import LabelValue from "@/UI/components/LabelValue/LabelValue";
import CountdownTimer from "../CountdownTimer/CountdownTimer";
import { useAppStore } from "@/UI/lib/zustand/store";
import { getNumber } from "@/UI/utils/Numbers";

import styles from "./currency.module.scss";
import { DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT, formatDate } from "@/UI/utils/DateFormatting";
import NextForwardAuction from "../NextForwardAuction";
import classNames from "classnames";
import { useQueryClient } from "@tanstack/react-query";
import { SYSTEM_BASIC_DATA } from "@/UI/utils/constants";

type CurrencyProps = {
  onExpiryChange?: () => void;
};

export const Currency = ({ onExpiryChange }: CurrencyProps) => {
  const device = useDevice();
  const queryClient = useQueryClient();
  const { currentExpiryDate, expiryList, setCurrentExpiryDate } = useAppStore();
  const [list, setList] = useState([...expiryList]);
  const [date, setDate] = useState(
    formatDate(`${currentExpiryDate}`, DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT)
  );
  useEffect(() => {
    const l = [...expiryList];
    setList([...l]);
  }, [expiryList]);

  const expiryChange = (value: string) => {
    const numberValue = getNumber(value);
    if (numberValue !== currentExpiryDate) {
      onExpiryChange?.();
      setCurrentExpiryDate(numberValue);
      setDate(formatDate(value, DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT));
      queryClient.invalidateQueries({ queryKey: [SYSTEM_BASIC_DATA] });
    }
  };

  return (
    <Flex
      classes={classNames({
        "gap-5": device !== "phone",
        "gap-0": device === "phone",
      })}
    >
      <div className={`${styles.currency__info} ${styles.divider} pr-12`}>
        <Asset icon={<LogoEth />} label='ETH' />
      </div>
      <div className={`${styles.currency__info} ${styles.divider} pr-8`}>
        <LabelValue
          label='Expiry Date'
          valueList={list.map((date: number) => ({
            label: formatDate(date.toString(), DEFAULT_INPUT_DATE_FORMAT, DEFAULT_OUTPUT_DATE_FORMAT),
            value: date.toString(),
          }))}
          onChange={expiryChange}
          value={date}
          hasDropdown={true}
        />
      </div>
      <div className={`${styles.currency__info} pr-12`}>
        <LabelValue label='Next Auction' value={<CountdownTimer />} />
      </div>
      <div className={styles.currency__info}>
        <LabelValue label='Next Auction Forward' value={<NextForwardAuction />} />
      </div>
    </Flex>
  );
};
