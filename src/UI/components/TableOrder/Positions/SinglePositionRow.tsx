import cn from "classnames";

import Button from "@/UI/components/Button/Button";
import { formatNumberByFixedPlaces } from "@/UI/utils/Numbers";
import { renderDate } from "@/UI/utils/TableOrder";

import DropdownOutlined from "../../Icons/DropdownOutlined";
import styles from "../TableOrder.module.scss";
import { Separator } from "../components/Separator";
import { PositionRow } from "../types";
import { POSITIONS_DECIMAL_PLACES } from "@/UI/utils/constants";
import PositiveNegativeLabel from "../../TableCollateral/PositiveNegativeLabel";
import { SingleBidAskValue } from "./SingleBidAskValue";
import classNames from "classnames";

type SingleOrderRowProps = {
  row: PositionRow;
  cancelOrder?: boolean;
  rowIndex: number;
  handleRowExpand: (index: number) => void;
  expandedRow: number[];
  handleOpenPayoffDiagram?: (row: PositionRow) => void;
  handleOpenPositionCloseModal?: (row: PositionRow) => void;
};

const SinglePositionRow = (props: SingleOrderRowProps) => {
  const { row, rowIndex, handleRowExpand, expandedRow, handleOpenPositionCloseModal } = props;
  return (
    <>
      {rowIndex > 0 && <Separator />}
      <div
        onKeyDown={() => handleRowExpand(rowIndex)}
        onClick={() => handleRowExpand(rowIndex)}
        className={styles.cell}
      >
        <Button
          title='Click to expand dropdown'
          className={`${styles.dropdown} ${expandedRow.includes(rowIndex) ? styles.isActive : ""}`}
        >
          <DropdownOutlined />
        </Button>
      </div>
      <div className={styles.cellContent} style={{ padding: "8px 0px" }}>
        {row.tenor && renderDate(row.tenor)}
      </div>
      <div className={styles.cellContent}>{row.product}</div>
      <div className={styles.cellContent}>{row.strike ?? "-"}</div>
      <div className={classNames(styles.cellContent, "tw-mr-3 tw-justify-end")}>
        {formatNumberByFixedPlaces(row.quantity, POSITIONS_DECIMAL_PLACES)}
      </div>
      <div className={classNames(styles.cellContent, "tw-mr-3 tw-justify-end")}>
        {formatNumberByFixedPlaces(row.averagePrice, POSITIONS_DECIMAL_PLACES)}
      </div>
      <div>
        {/* <SingleBidAskValue type='bid' strike={row.strike} payoff={row.product} expiryDate={row.expiry} /> */}
      </div>
      <div className={classNames(styles.cellContent, "tw-mr-3 tw-justify-end !tw-text-ithaca-white-60")}>
        {row.modelPrice ? formatNumberByFixedPlaces(row.modelPrice, POSITIONS_DECIMAL_PLACES) : "-"}
      </div>
      <div>
        {/* <SingleBidAskValue type='ask' strike={row.strike} payoff={row.product} expiryDate={row.expiry} /> */}
      </div>
      <div className={classNames(styles.cellContent, "tw-mr-3 tw-justify-end")}>
        {row.profitAndLoss ? (
          <PositiveNegativeLabel
            plusMinusOnly={true}
            labelClassName='!tw-text-xs'
            className='!tw-items-end'
            value={Number(row.profitAndLoss.toFixed(POSITIONS_DECIMAL_PLACES))}
            showAbsValue={true}
          />
        ) : (
          "-"
        )}
      </div>
      <div className={cn(styles.cellContent, "tw-justify-end")}>
        <Button
          className='tw-h-[21px] tw-w-[71px] tw-border-red-500 tw-text-red-500'
          size='sm'
          variant='outline'
          title='Show Payoff Diagram'
          onClick={() => handleOpenPositionCloseModal?.(row)}
        >
          Close
        </Button>
      </div>
    </>
  );
};

export default SinglePositionRow;
