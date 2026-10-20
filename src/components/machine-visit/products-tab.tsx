import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMoney, formatQuantity, formatRelative } from "./format";
import type { ProductStock, StockUnit } from "./types";

export function ProductsTab({ products, unit }: { products: ProductStock[]; unit: StockUnit }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Products & prices</CardTitle>
        <CardDescription>
          What this machine sells and what customers pay
          {unit === "L" ? " per litre" : " per piece"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Product</TableHead>
              <TableHead className="text-right">Price {unit === "L" ? "/ litre" : "/ piece"}</TableHead>
              <TableHead className="text-right">In stock now</TableHead>
              <TableHead>Last refilled</TableHead>
              <TableHead className="pr-6 text-right">Product ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                  No products are set up on this machine.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.brand_id}>
                  <TableCell className="pl-6 font-medium text-slate-900">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(p.price)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.remaining === null ? "—" : formatQuantity(Math.max(0, p.remaining), unit)}
                  </TableCell>
                  <TableCell title={formatDateTime(p.last_refill_at)}>
                    {formatRelative(p.last_refill_at)}
                  </TableCell>
                  <TableCell className="pr-6 text-right text-slate-500 tabular-nums">
                    {p.brand_id}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
