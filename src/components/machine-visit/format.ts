import moment from "moment-timezone";
import type { PeriodFilter, Period, StockUnit, Transaction } from "./types";

export const TIMEZONE = "Asia/Karachi";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const pkt = (epoch: number) => moment.unix(epoch).tz(TIMEZONE);

export const formatDateTime = (epoch: number | null | undefined) =>
  epoch ? pkt(epoch).format("ddd D MMM YYYY, h:mm A") : "—";

export const formatDate = (epoch: number | null | undefined) =>
  epoch ? pkt(epoch).format("D MMM YYYY") : "—";

export const formatShortDateTime = (epoch: number | null | undefined) =>
  epoch ? pkt(epoch).format("ddd D MMM, h:mm A") : "—";

export const formatRelative = (epoch: number | null | undefined) =>
  epoch ? moment.unix(epoch).fromNow() : "—";

/** "2 days 4 hrs", "5 hrs", "40 min" */
export const formatDuration = (fromEpoch: number, toEpoch: number) => {
  const minutes = Math.max(0, Math.round((toEpoch - fromEpoch) / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return `${days} day${days === 1 ? "" : "s"}${rest ? ` ${rest} hr${rest === 1 ? "" : "s"}` : ""}`;
};

/**
 * Transaction time in Pakistan time. epoch_time is the reliable UTC instant;
 * created_at holds Pakistan wall-clock time stamped as UTC, so it is read
 * back with moment.utc when epoch_time is missing.
 */
export const transactionTime = (tx: Transaction) =>
  tx.epoch_time
    ? pkt(tx.epoch_time).format("ddd D MMM YYYY, h:mm A")
    : moment.utc(tx.created_at).format("ddd D MMM YYYY, h:mm A");

const numberFormat = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 });

export const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : numberFormat.format(n);

export const formatMoney = (n: number | string | null | undefined) =>
  n === null || n === undefined || n === "" ? "—" : `Rs ${numberFormat.format(Number(n))}`;

export const formatQuantity = (n: number | null | undefined, unit: StockUnit) =>
  n === null || n === undefined ? "—" : `${numberFormat.format(n)} ${unit}`;

/** Transactions on dispensing machines record millilitres. */
export const transactionQuantity = (tx: Transaction, unit: StockUnit) =>
  unit === "L" ? `${numberFormat.format((Number(tx.quantity) || 0) / 1000)} L` : `${tx.quantity}`;

export const isExpired = (expiry: string | null | undefined) =>
  !!expiry && moment.tz(expiry, "YYYY-MM-DD", TIMEZONE).endOf("day").isBefore(moment());

export const expiresWithinDays = (expiry: string | null | undefined, days: number) =>
  !!expiry &&
  !isExpired(expiry) &&
  moment.tz(expiry, "YYYY-MM-DD", TIMEZONE).diff(moment(), "days") <= days;

export const monthOptions = () =>
  Array.from({ length: 12 }, (_, i) => {
    const m = moment().tz(TIMEZONE).subtract(i, "months");
    return { value: m.format("YYYY-MM"), label: m.format("MMMM YYYY") };
  });

export const refillLabel = (batch: string | null, epoch: number) =>
  `${batch ? `Refill #${batch}` : "Refill"} · ${formatShortDateTime(epoch)}`;

export const periodLabel = (period: Period) => {
  if (period.kind === "all") return "All time";
  if (period.kind === "month")
    return moment(period.month, "YYYY-MM").format("MMMM YYYY");
  const { refill } = period;
  return `${refillLabel(refill.batch_number, refill.refilled_at)} → ${
    refill.ends_at ? formatShortDateTime(refill.ends_at) : "now"
  }`;
};

/** Request fields understood by the transaction list, CSV and summary APIs. */
export const periodParams = ({ period, brandId }: PeriodFilter) => ({
  ...(period.kind === "month" && { month: period.month }),
  ...(period.kind === "refill" && {
    from: period.refill.refilled_at,
    ...(period.refill.ends_at && { to: period.refill.ends_at }),
  }),
  ...(brandId && { brand_id: brandId }),
});

const PAYMENT_LABELS: Record<string, string> = {
  davaam: "App",
  cash: "Cash",
  rfid: "RFID card",
  card: "Card",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  davaam_testing: "Test",
};

export const paymentLabel = (tx: Transaction) =>
  tx.payment_method ||
  PAYMENT_LABELS[String(tx.merchant || "").toLowerCase()] ||
  tx.merchant ||
  "—";

/** Cash sales are logged against the machine (e.g. DVMCN3112), not a person. */
export const isAnonymousCustomer = (tx: Transaction) =>
  String(tx.merchant || "").toLowerCase() === "cash" ||
  String(tx.msisdn || "").toUpperCase().startsWith("DVMCN");
