import { Currency } from "@/utils/types";
import { ClientHistoricalPosition, Order, OrderLock, Position } from "@ithaca-finance/sdk";

export enum TABLE_TYPE {
  LIVE,
  ORDER,
  TRADE,
  HISTORY,
  SETTLEMENTS,
}

export type PositionsExpandedRow = {
  strike?: number;
  orderDate: string;
  currencyPair: string;
  product: string;
  tenor: string;
  side: string;
  averageSize: number;
  orderLimit: number;
  averageExecutionPrice?: number;
  type: string;
  expiryUnparsed: number;
};

export type PositionRow = {
  contractId: number;
  clientOrderId: number;
  tenor: string;
  expiry: number;
  product: string;
  strike: number;
  quantity: number;
  averagePrice: number;
  profitAndLoss?: number;
  modelPrice?: number;
  expandedInfo: PositionsExpandedRow[];
};

// Types
export type TableRowData = {
  clientOrderId: number;
  orderDate: string;
  currencyPair: string;
  product: string;
  side: string;
  tenor: string;
  wethAmount: number;
  usdcAmount: number;
  orderLimit: number;
  orderStatus: string;
  modelPrice: number;
  fill: number;
  strikeGroup: number[];
};

export type TableExpandedRowData = {
  type: string;
  side: string;
  expiryDate: string;
  size: number;
  sizeCurrency: Currency;
  strike?: number; // doesnt exist for forwards
  averageExecutionPrice?: number;
};

export type TableRowDataWithExpanded = TableRowData & {
  expandedInfo?: TableExpandedRowData[];
};

export interface PositionWithOrders extends Position {
  orders: Order[];
}

export type TableHeaders = {
  name: string;
  style: React.CSSProperties;
};

// Settlements
export interface Settlements {
  [key: string]: ClientHistoricalPosition;
}

export interface SettlementExpandedInfo {
  tenor: string;
  product: string;
  strike: string;
  avgPrice: number;
  quantity: number;
}

export interface SettlementRow {
  tenor: string;
  currencyPair: string;
  settlementPrice: number;
  payout: OrderLock;
  totalCollateral: OrderLock;
  expandedInfo: SettlementExpandedInfo[];
}

// Table order headers
export const TABLE_ORDER_HEADERS: TableHeaders[] = [
  { name: "Details", style: {} },
  { name: "Order Date", style: {} },
  { name: "Currency Pair", style: {} },
  { name: "Product", style: {} },
  { name: "Side", style: { justifyContent: "center" } },
  { name: "Strike", style: {} },
  { name: "Expiry Date", style: { justifyContent: "flex-end" } },
  { name: "Collateral Amount", style: { justifyContent: "flex-end" } },
  { name: "Order Limit", style: { justifyContent: "flex-end" } },
];

export const TABLE_ORDER_LIVE_ORDERS: TableHeaders[] = [
  ...TABLE_ORDER_HEADERS,
  { name: "Type", style: { justifyContent: "center" } },
  { name: "Status", style: { justifyContent: "flex-start" } },
  { name: "Fill %", style: { justifyContent: "center" } },
  { name: "Cancel All", style: { justifyContent: "flex-end" } },
];

export const TABLE_ORDER_HEADERS_FOR_POSITIONS: TableHeaders[] = [
  { name: "Details", style: {} },
  { name: "Expiry Date", style: { justifyContent: "" } },
  { name: "Product", style: { justifyContent: "" } },
  { name: "Strike", style: { justifyContent: "" } },
  { name: "Quantity", style: { justifyContent: "flex-end" } },
  { name: "Avg. Entry Price", style: { justifyContent: "flex-end" } },
  // { name: "Bid", style: { justifyContent: "center" } },
  { name: "", style: { justifyContent: "center" } },
  { name: "Model Price", style: { justifyContent: "flex-end" } },
  // { name: "Ask", style: { justifyContent: "center" } },
  { name: "", style: { justifyContent: "center" } },
  { name: "PNL", style: { justifyContent: "flex-end" } },
  { name: "", style: { justifyContent: "" } },
  // { name: "Close Position", style: { justifyContent: "flex-end" } },
];

export const TABLE_ORDER_SETTLEMENTS: TableHeaders[] = [
  { name: "Details", style: {} },
  { name: "Expiry", style: { justifyContent: "flex-start" } },
  { name: "Currency Pair", style: { justifyContent: "flex-start" } },
  { name: "Settlement Price", style: { justifyContent: "flex-end" } },
  { name: "Payout", style: { justifyContent: "flex-end" } },
  { name: "Collateral Released", style: { justifyContent: "flex-end" } },
];

// Table order headers
export const TABLE_HISTORY_HEADERS: TableHeaders[] = [
  { name: "Details", style: {} },
  { name: "Order Date", style: {} },
  { name: "Currency Pair", style: {} },
  { name: "Product", style: {} },
  { name: "Side", style: {} },
  { name: "Strike", style: {} },
  { name: "Expiry", style: { justifyContent: "flex-end" } },
  { name: "Collateral Amount", style: { justifyContent: "flex-end" } },
  { name: "Model Price", style: { justifyContent: "flex-end" } },
  { name: "Price Traded", style: { justifyContent: "flex-end" } },
  { name: "", style: {} },
];

// Table order expanded headers
export const TABLE_ORDER_EXPANDED_HEADERS: TableHeaders[] = [
  { name: "", style: {} },
  { name: "Type", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "", style: {} },
  { name: "", style: {} },
  { name: "Side", style: { justifyContent: "center", alignItems: "flex-center" } },
  { name: "Strike", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Expiry Date", style: { justifyContent: "flex-end", alignItems: "flex-end" } },
  { name: "Size", style: { justifyContent: "flex-end", alignItems: "flex-end" } },
  { name: "", style: {} },
];

export const TABLE_ORDER_EXPANDED_HEADERS_FOR_POSITIONS: TableHeaders[] = [
  { name: "", style: {} },
  { name: "Order date", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Currency Pair", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Product", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Side", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "", style: { justifyContent: "center", alignItems: "center" } },
  { name: "Expiry", style: { justifyContent: "flex-end", alignItems: "flex-end" } },

  { name: "Order Limit", style: { justifyContent: "flex-end", alignItems: "flex-end" } },
  { name: "", style: {} },
];

export const TABLE_ORDER_EXPANDED_HEADERS_FOR_SETTLEMENTS: TableHeaders[] = [
  { name: "", style: {} },
  { name: "Expiry", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Product", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Strike", style: { justifyContent: "flex-start", alignItems: "flex-start" } },
  { name: "Quantity", style: { justifyContent: "flex-end", alignItems: "flex-end" } },
  { name: "Average Price", style: { justifyContent: "flex-end", alignItems: "flex-end" } },
  { name: "", style: {} },
];
