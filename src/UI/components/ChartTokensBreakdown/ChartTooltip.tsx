import { useState, useEffect } from "react";
// Packages
import { Surface, Symbols, TooltipProps } from "recharts";

// Components
import LogoEth from "@/UI/components/Icons/LogoEth";

// Styles
import styles from "./ChartTokensBreakdown.module.scss";
import LogoUsdc from "../Icons/LogoUsdc";

// Types
type ValueType = number;
type NameType = string;

interface AdditionalData {
  name: string;
  value: number;
}

interface ChartTooltipProps {
  additionalData: AdditionalData[];
}

const Dot = ({ color }: { color: string }) => {
  return (
    <Surface width={8} height={8}>
      <Symbols cx={4} cy={4} type='circle' size={32} fill={color} />
    </Surface>
  );
};

const Currency = ({ name }: { name: string }) => {
  if (name.includes("USDC")) {
    return <LogoUsdc />;
  }

  return <LogoEth />;
};

const ChartTooltip = ({ active, payload, additionalData }: TooltipProps<ValueType, NameType> & ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { name: string; value: number };
    const newData = additionalData.filter(item => item.name === data.name);

    const [value, setValue] = useState<string>("");
    const [color, setColor] = useState<string>("");

    useEffect(() => {
      if (parseInt(String(data.value)).toString().length >= 7) {
        const formattedValue = (data.value / 1000000).toFixed(2);
        setValue(formattedValue + " M");
      } else if (parseInt(String(data.value)).toString().length >= 5) {
        const formattedValue = (data.value / 1000).toFixed(1);
        setValue(formattedValue + " K");
      } else {
        // Handle other cases if needed
        setValue(data.value.toString()); // Default case
      }

      if(data.name === "WETH"){
        setColor("#0088FE")
      } else {
        setColor("#FF772A")
      }

    }, [data]);

    return (
      <div className={styles.tooltip}>
        {newData.map(item => {
          return (
            <div key={`${item.name}}`} className={styles.tooltipValueContainer}>
              <Dot color={color} />
              <p >{item.name}</p>
              <p className={styles.value}>$ {value}</p>
              <Currency name={item.name} />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

export default ChartTooltip;
