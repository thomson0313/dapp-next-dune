// Packages
import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";

// Components
import Watermark from "@/UI/components/Icons/Watermark";
import ChartLegend from "./ChartLegend";
import ChartTooltip from "./ChartTooltip";

// Styles
import styles from "./ChartTokensBreakdown.module.scss";

const COLORS = ['#0088FE', '#FF772A'];

interface ChartOption {
    name: string;
    value: number;
}

const ChartTokensBreakdown = () => {
    const [data, setData] = useState<ChartOption[]>([]);

  const renderLabel = () => {
    return <Watermark />;
  };

  useEffect( () => {
    const fetchData = () => {
        fetch('https://api.llama.fi/protocol/ithaca-protocol')
      .then((response) => response.json())
      .then((data) => {
        const initData = (data.tokensInUsd[Number(data.tokensInUsd.length)-1]).tokens
        const transformedData = Object.keys(initData).map(key => ({
            name: key,  
            value: initData[key] 
        }));
        setData(transformedData);
      })
      .catch((error) => console.error('Error fetching data:', error));
    };
    fetchData();
  }, []);

  return (
    <div className={styles.pieContainer}>
      <div className={styles.waterMark}>{renderLabel()}</div>
      <ResponsiveContainer className={styles.container} width='100%' height={300}>
        <PieChart>
          <Legend layout='vertical' verticalAlign='top' align='left' content={<ChartLegend />} />
          <defs>
            <linearGradient id='colorGroupA' x1='0%' y1='0%' x2='0%' y2='100%'>
              <stop offset='0%' stopColor='#5CCF8A' />
              <stop offset='100%' stopColor='#4BB475' />
            </linearGradient>
            <linearGradient id='colorGroupB' x1='0%' y1='0%' x2='0%' y2='100%'>
              <stop offset='0%' stopColor='#A855F7' />
              <stop offset='100%' stopColor='#8F2BEF' />
            </linearGradient>
            <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
              <feGaussianBlur in='SourceGraphic' stdDeviation='3' result='blur' />
            </filter>
          </defs>

          <Pie
            data={data}
            fill='#B5B5F8'
            nameKey='name'
            dataKey='value'
            startAngle={90}
            endAngle={450}
            cx="50%"
            cy="50%"
          >
            {
                data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))
            }
          </Pie>
          <Tooltip content={<ChartTooltip additionalData={[...data]} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
 };

export default ChartTokensBreakdown;
