/**
 * Stock status for a machine on the Machines tables, judged per row (product):
 * one empty row is a problem even when the others are full. Adding the rows
 * up used to hide that ("In Stock" with a row at 0).
 *
 * "Low" matches the backend's Low Stock / Full filter: a row at 2 or less.
 */
export const LOW_ROW_LEVEL = 2;

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

/** Three-state status from each row's remaining stock, as the forecast badge expects. */
export function machineStockStatus(rowQuantities: number[]): StockStatus {
  if (rowQuantities.length > 0 && rowQuantities.every((q) => q <= 0)) return "Out of Stock";
  if (rowQuantities.some((q) => q <= LOW_ROW_LEVEL)) return "Low Stock";
  return "In Stock";
}

/**
 * What the Stock column shows, and its colour. Names empty rows ("1 of 4 rows
 * empty") rather than the softer "Low Stock". No rows at all is "Unknown".
 */
export function machineStockFields(rowQuantities: number[] | undefined): {
  stockStatus: string;
  stockClass: string;
} {
  if (!rowQuantities?.length) {
    return { stockStatus: "Unknown", stockClass: "bg-gray-100 text-gray-800" };
  }
  const status = machineStockStatus(rowQuantities);
  const empty = rowQuantities.filter((q) => q <= 0).length;
  if (status === "Out of Stock") {
    return { stockStatus: "Out of Stock", stockClass: "bg-red-100 text-red-800" };
  }
  if (empty > 0) {
    return {
      stockStatus: `${empty} of ${rowQuantities.length} rows empty`,
      stockClass: "bg-red-100 text-red-800",
    };
  }
  if (status === "Low Stock") {
    return { stockStatus: "Low Stock", stockClass: "bg-yellow-100 text-yellow-800" };
  }
  return { stockStatus: "In Stock", stockClass: "bg-green-100 text-green-800" };
}
