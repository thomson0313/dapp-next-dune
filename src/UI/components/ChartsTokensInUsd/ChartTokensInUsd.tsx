import { useState } from "react";
// Packages
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Styles
import styles from "./ChartTokensInUsd.module.scss";
import { shortFormatNum } from "@/UI/utils/Numbers";
import ChartLegend from "./ChartLegend";
import ChartTooltip from "./ChartTooltip";
import { LlamaDetail } from "@/pages/analytics/useData";
// import { ExpiryList } from "@/pages/analytics";


// Types
type ChartTokensInUsdProps = {
  data: LlamaDetail[];
//   expiryList: ExpiryList[];
};

const MIN_WIDTH = 20;

const ChartTokensInUsd = ({ data }: ChartTokensInUsdProps) => {
  const [longestTick, setLongestTick] = useState("");

  const tickFormatter = (tick: number) => {
    const formattedTick = shortFormatNum(tick);
    if (longestTick.length < formattedTick.length) {
      setLongestTick(formattedTick);
    }
    return formattedTick;
  };

  const getYAxisTickLen = () => {
    const charWidth = 7;

    const width = longestTick.length * charWidth;
    return width < MIN_WIDTH ? MIN_WIDTH : width;
  };

  return (
    <ResponsiveContainer className={styles.container} width='100%' height={300}>
      <AreaChart
        data={data}
        margin={{
          top: 18,
          right: 10,
          left: 10,
          bottom: 35,
        }}
      >
        <Legend layout='horizontal' verticalAlign='bottom' align='center' content={<ChartLegend />} />
        <Tooltip cursor={false} wrapperStyle={{ zIndex: 5 }} content={<ChartTooltip />} />
        <CartesianGrid strokeDasharray='0' vertical={false} stroke='rgba(255, 255, 255, 0.2)' />
        <defs>
          <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='20%' stopColor='#5EE192' stopOpacity={0.2} />
            <stop offset='100%' stopColor='#5EE192' stopOpacity={0} />
          </linearGradient>
          <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='2' result='blur' />
          </filter>
          <linearGradient id='strokeGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#5EE192' stopOpacity={1} />
            <stop offset='100%' stopColor='#FFFFFF' stopOpacity={1} />
          </linearGradient>
        </defs>
        <XAxis dataKey='date' tickLine={false} axisLine={false} style={{ fill: "#9D9DAA", fontSize: 12 }} dy={5} />
        <YAxis
          type='number'
          tickFormatter={tickFormatter}
          width={getYAxisTickLen()}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          className={styles.chartTradeCountLabel}
        />

        {/* <Area legendType='none' dataKey='WETH' fill='url(#gradient)' filter='url(#glow)' /> */}
        <Area
          type='monotone'
          legendType='circle'
          name='WETH'
          dataKey='WETH'
          stroke='#5ee192'
          fill="transparent"
          strokeWidth={2}
          unit='$'
        />
        <Area
          type='monotone'
          legendType='circle'
          name='USDC'
          dataKey='USDC'
          stroke='#FF494A'
          strokeWidth={2}
          unit='$'
          fill='url(#gradient)'
        />
        {/* <Area name='NAFwd' type='monotone' legendType='circle' dataKey={"7Jan99"} stroke={"#31CBE0"} strokeWidth={1} /> */}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ChartTokensInUsd;
