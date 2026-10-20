import { Activity, CalendarDays, Clock, Repeat, TrendingUp, UserCheck, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatMoney,
  formatNumber,
  periodLabel,
  WEEKDAYS,
} from "./format";
import { PeriodFilterBar } from "./period-filter";
import { ColumnChartCard, EmptyState, StatTile } from "./parts";
import type { PeriodFilter, Refill, StockUnit, TransactionSummary } from "./types";

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${suffix}`;
};

export function InsightsTab({
  filter,
  onFilterChange,
  refills,
  products,
  unit,
  summary,
  loading,
}: {
  filter: PeriodFilter;
  onFilterChange: (next: PeriodFilter) => void;
  refills: Refill[] | null;
  products: { id: number; name: string }[];
  unit: StockUnit;
  summary: TransactionSummary | null;
  loading: boolean;
}) {
  const filterBar = (
    <PeriodFilterBar
      filter={filter}
      onChange={onFilterChange}
      refills={refills}
      products={products}
      unit={unit}
    />
  );

  if (!summary) {
    return (
      <div className="space-y-6">
        {filterBar}
        <EmptyState>{loading ? "Loading insights…" : "No data for this selection."}</EmptyState>
      </div>
    );
  }

  const { totals, customers: c, byHour, byWeekday } = summary;
  const hasSales = totals.transactions > 0;
  const peakHour = byHour.indexOf(Math.max(...byHour));
  const peakDay = byWeekday.indexOf(Math.max(...byWeekday));
  const excluded = c.anonymousTransactions + c.staffTransactions;

  return (
    <div className="space-y-6">
      {filterBar}

      {!hasSales ? (
        <EmptyState>No sales in {periodLabel(filter.period).toLowerCase()}.</EmptyState>
      ) : (
        <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")}>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Customers</CardTitle>
              <CardDescription>
                Based on {formatNumber(c.identifiedTransactions)} purchases made with a
                phone number or card.
                {excluded > 0 &&
                  ` ${formatNumber(c.anonymousTransactions)} sales with no customer number (cash, mostly) and ${formatNumber(
                    c.staffTransactions,
                  )} staff test purchases aren't counted as customers.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {c.unique === 0 ? (
                <EmptyState>
                  No sale in this period has a customer number (cash or staff tests only), so there are no
                  customers to analyse.
                </EmptyState>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatTile icon={<Users className="h-4 w-4" />} label="Customers" value={formatNumber(c.unique)} />
                    <StatTile
                      icon={<Repeat className="h-4 w-4" />}
                      label="Came back"
                      value={formatNumber(c.returning)}
                      hint="bought more than once"
                    />
                    <StatTile
                      icon={<UserCheck className="h-4 w-4" />}
                      label="One-time"
                      value={formatNumber(c.oneTime)}
                    />
                    <StatTile
                      icon={<TrendingUp className="h-4 w-4" />}
                      label="Repeat rate"
                      value={`${c.repeatRate}%`}
                      hint="of customers came back"
                    />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <ColumnChartCard
                      title="How often customers buy"
                      description="Customers by number of purchases"
                      data={[
                        { label: "Once", value: c.frequency.once },
                        { label: "2–3 times", value: c.frequency.twoToThree },
                        { label: "4–10 times", value: c.frequency.fourToTen },
                        { label: "10+ times", value: c.frequency.moreThanTen },
                      ]}
                      valueLabel="Customers"
                      formatValue={formatNumber}
                      height={240}
                    />
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-900">Top customers</CardTitle>
                        <CardDescription>Most purchases in this period</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer</TableHead>
                              <TableHead className="text-right">Purchases</TableHead>
                              <TableHead className="text-right">Spent</TableHead>
                              <TableHead>Last bought</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {c.top.map((t) => (
                              <TableRow key={t.msisdn}>
                                <TableCell className="tabular-nums">{t.msisdn}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatNumber(t.transactions)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatMoney(t.revenue)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-slate-600">
                                  {formatDate(t.last_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">When this machine is used</CardTitle>
              <CardDescription>
                All {formatNumber(totals.transactions)} sales in{" "}
                {periodLabel(filter.period).toLowerCase()}, including cash. Pakistan time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatTile
                  icon={<Clock className="h-4 w-4" />}
                  label="Busiest hour"
                  value={`${hourLabel(peakHour)} – ${hourLabel((peakHour + 1) % 24)}`}
                  hint={`${formatNumber(byHour[peakHour])} sales`}
                />
                <StatTile
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Busiest day"
                  value={WEEKDAYS[peakDay]}
                  hint={`${formatNumber(byWeekday[peakDay])} sales`}
                />
                <StatTile
                  icon={<Activity className="h-4 w-4" />}
                  label="Sales per active day"
                  value={formatNumber(
                    Math.round((totals.transactions / Math.max(1, totals.active_days)) * 10) / 10,
                  )}
                  hint={`${formatNumber(totals.active_days)} days had sales`}
                />
                <StatTile
                  label="Period covered"
                  value={<span className="text-base">{formatDate(totals.first_at)}</span>}
                  hint={`to ${formatDate(totals.last_at)}`}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ColumnChartCard
                  title="Sales by hour of day"
                  data={byHour.map((v, h) => ({
                    label: hourLabel(h),
                    detail: `${hourLabel(h)} – ${hourLabel((h + 1) % 24)}`,
                    value: v,
                  }))}
                  valueLabel="Sales"
                  formatValue={formatNumber}
                  tickEvery={3}
                />
                <ColumnChartCard
                  title="Sales by day of week"
                  data={WEEKDAYS.map((d, i) => ({
                    label: d.slice(0, 3),
                    detail: d,
                    value: byWeekday[i],
                  }))}
                  valueLabel="Sales"
                  formatValue={formatNumber}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
