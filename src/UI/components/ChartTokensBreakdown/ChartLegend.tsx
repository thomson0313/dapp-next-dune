// Packages
import { Surface, Symbols } from "recharts";

// Styles
import styles from "./ChartTokensBreakdown.module.scss";

// Types
type LegendPayloadItem = {
  color: string;
  value: string;
  payload: {
    value: number;
    name: string;
  };
};

type ChartLegendProps = {
  payload?: LegendPayloadItem[];
};

const ALLOWED_LEGENDS = ["WETH", "USDC"];

const ChartLegend = ({ payload }: ChartLegendProps) => {
  return (
    <div className={styles.legend}>
      {payload &&
        payload.map((entry, index) => {
          if (!ALLOWED_LEGENDS.includes(entry.payload.name)) {
            return null;
          }

          return (
            <div className={styles.row} key={`item-${index}`}>
              <Surface width={8} height={8}>
                <Symbols cx={4} cy={4} type='circle' size={32} fill={entry.color} />
              </Surface>
              <span className={styles.label}>{entry.value}</span>
            </div>
          );
        })}
    </div>
  );
};

export default ChartLegend;
