// Packages
import { TooltipProps, Surface, Symbols } from "recharts";

// Styles
import styles from "./ChartTVL.module.scss";

const ChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const rows = payload.map((entry, index) => {
      return {
        label: entry.name,
        value: entry.value,
      };
    });

    return (
      <div className={styles.tooltip}>
        <h3>{payload[0].payload.date}</h3>
        {rows.map((row, index) => (
          <div className={styles.row}>
              <Surface width={8} height={8}>
                <Symbols cx={4} cy={4} type='circle' size={32} fill="#4bb475" />
              </Surface>
            <span style={{marginTop: "7px"}}>
              <p> {row.label}:</p>
              <div className={styles.value}>{row.value || row.value === 0 ? Math.round(row.value) : ""} $</div>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default ChartTooltip;
