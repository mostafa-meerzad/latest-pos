"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReportsImg from "@/assets/reports_img.png";
import { Switch } from "@/components/ui/switch";

// Recharts - charts and graphs
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import BackToDashboardButton from "@/components/BackToDashboardButton";

// Small palette used for charts
const COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#f97316",
  "#10b981",
  "#ef4444",
  "#6366f1",
];

export default function ReportsPage() {
  // Filters and UI state
  const [period, setPeriod] = useState("day");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [includeDeliveries, setIncludeDeliveries] = useState(true);

  // Data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Fetch report whenever filters change
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, date, year]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "year") params.set("year", String(year));
      else params.set("date", date);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const json = await res.json();
      setReport(json);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Derived chart data helpers
  const salesVsDeliveryPie = useMemo(() => {
    if (!report) return [];
    const sales = report.breakdown?.sales?.revenue || 0;
    const deliveries = report.breakdown?.deliveries?.revenue || 0;
    return [
      { name: "Sales", value: sales },
      { name: "Deliveries", value: deliveries },
    ];
  }, [report]);

  // Prepare hourly, weekly, monthly series into arrays consumable by recharts
  const hourlySeries = useMemo(() => {
    if (!report) return [];
    const raw = report.timeSeries?.hourly || {};
    // convert keys 0..23 to array
    return Object.keys(raw)
      .map((k) => ({ hour: k, ...raw[k] }))
      .sort((a, b) => Number(a.hour) - Number(b.hour));
  }, [report]);

  const weeklySeries = useMemo(() => {
    if (!report) return [];
    const raw = report.timeSeries?.weekly || {};
    return Object.keys(raw)
      .map((k) => ({ week: k, ...raw[k] }))
      .sort((a, b) => Number(a.week) - Number(b.week));
  }, [report]);

  const monthlySeries = useMemo(() => {
    if (!report) return [];
    const raw = report.timeSeries?.monthly || {};
    // expected keys 0..11
    return Object.keys(raw)
      .map((k) => ({ monthIndex: k, ...raw[k] }))
      .sort((a, b) => Number(a.monthIndex) - Number(b.monthIndex))
      .map((m) => ({
        // short month label (Jan, Feb) - will render vertically via XAxis angle
        name: m.name?.slice(0, 3) || String(m.monthIndex),
        revenue: m.revenue || 0,
        cost: m.cost || 0,
        profit: m.profit || 0,
        itemsSold: m.itemsSold || 0,
        deliveries: m.deliveries || 0,
        count: m.count || 0,
      }));
  }, [report]);

  // yearly data for comparison: shows current vs previous
  const yearlyComparison = useMemo(() => {
    if (!report) return null;
    return report.timeSeries?.yearly || null;
  }, [report]);

  // Utility to format currency
  function fmtCurrency(v) {
    if (v === undefined || v === null) return "-";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex items-center justify-between">
          <Image
            src={ReportsImg}
            width={70}
            height={70}
            alt="delivery page logo"
          />
          <h1 className="text-2xl font-semibold">Reports Dashboard</h1>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="mr-3">
            <BackToDashboardButton />
          </div>
          {/* Period select */}
          <label className="flex flex-col">
            <Select onValueChange={(v) => setPeriod(v)} value={period}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {/* Date or Year input depending on period */}
          {period === "year" ? (
            <label className="flex flex-col">
              <Input
                type="number"
                className="w-36"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </label>
          ) : (
            <label className="flex flex-col">
              <Input
                type="date"
                className="w-44"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Include deliveries
            </span>
            <Switch
              checked={includeDeliveries}
              onCheckedChange={setIncludeDeliveries}
            />
          </div>

          <Button onClick={fetchReport} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Revenue for selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {fmtCurrency(report?.summary?.totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Sold items: {report?.summary?.totalSoldItems ?? "-"}
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
            <CardDescription>Cost of goods sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {fmtCurrency(report?.summary?.totalCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Includes sales + deliveries
            </div>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card>
          <CardHeader>
            <CardTitle>Profit</CardTitle>
            <CardDescription>Net profit for period</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl ${
                report?.summary?.totalProfit < 0
                  ? "text-rose-600"
                  : "text-green-600"
              }`}
            >
              {fmtCurrency(report?.summary?.totalProfit)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Margin: {report?.summary?.profitMargin}%
            </div>
          </CardContent>
        </Card>

        {/* Counts */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Sales & deliveries count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-lg">
              <span>Sales: {report?.breakdown?.sales?.count ?? "-"}</span>
              <span className="px-2 py-0.5  text-green-600 font-semibold">
                {fmtCurrency(report?.breakdown?.sales?.revenue)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-lg">
              <span>
                Deliveries: {report?.breakdown?.deliveries?.count ?? "-"}
              </span>
              <span className="px-2 py-0.5  text-green-600 font-semibold">
                {fmtCurrency(report?.breakdown?.deliveries?.revenue)}
              </span>
            </div>

            {/* <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Revenue Difference</div>
                <div className="text-lg">{fmtCurrency(report?.breakdown?.comparison?.revenueDifference)}</div>
              </div> */}
          </CardContent>
        </Card>
      </div>

      {/* Main charts area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Time series */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Series</CardTitle>
              <CardDescription>
                Revenue over the selected interval
              </CardDescription>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              {/* Choose chart by period */}
              {period === "day" && (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={hourlySeries}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => fmtCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={COLORS[0]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="itemsSold"
                      stroke={COLORS[1]}
                      strokeWidth={1.5}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {(period === "week" || period === "month") && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={period === "week" ? weeklySeries : monthlySeries}
                    margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {/* X axis with vertical labels for month abbreviations */}
                    <XAxis
                      dataKey={period === "week" ? "week" : "name"}
                      tick={{ fontSize: 12 }}
                      angle={-90}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number" ? fmtCurrency(value) : value
                      }
                    />
                    <Legend />

                    {/* Use thin bars (barSize small) as requested */}
                    <Bar dataKey="revenue" barSize={12} name="Revenue">
                      {(period === "week" ? weeklySeries : monthlySeries).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Bar>

                    {/* Optional cost/profit overlay when available */}
                    <Bar dataKey="profit" barSize={6} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {period === "year" && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={monthlySeries}
                    margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-90}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number" ? fmtCurrency(value) : value
                      }
                    />
                    <Legend />
                    <Bar dataKey="revenue" barSize={12} name="Revenue">
                      {monthlySeries.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke={COLORS[2]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Year over year comparison for yearly period */}
          {period === "year" && yearlyComparison && (
            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Comparison</CardTitle>
                <CardDescription>
                  Compare current year to previous year
                </CardDescription>
              </CardHeader>
              <CardContent style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={Object.values(report.timeSeries.monthly || {}).map(
                      (m, i) => ({
                        name: m.name?.slice(0, 3) || String(i),
                        current: m.revenue,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke={COLORS[0]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Pie & Top products */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales vs Deliveries</CardTitle>
              <CardDescription>Revenue split</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <div className="h-full items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={salesVsDeliveryPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      label
                    >
                      {salesVsDeliveryPie.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {salesVsDeliveryPie.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Most sold items in selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Cost Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report?.topProducts && report.topProducts.length > 0 ? (
                    report.topProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{p.product?.name}</TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell>{fmtCurrency(p.revenue)}</TableCell>
                        <TableCell>
                          {fmtCurrency(p.product?.costPrice)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No top products data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
              <CardDescription>
                Detailed revenue / cost / profit by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Sales Revenue
                  </div>
                  <div className="text-lg">
                    {fmtCurrency(report?.breakdown?.sales?.revenue)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Deliveries Revenue
                  </div>
                  <div className="text-lg">
                    {fmtCurrency(report?.breakdown?.deliveries?.revenue)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Revenue Difference
                  </div>
                  <div className="text-lg">
                    {fmtCurrency(
                      report?.breakdown?.comparison?.revenueDifference
                    )}
                  </div>
                </div>
              </div>

              {/* <div className="mt-4">
              <pre className="text-xs p-3 bg-muted rounded">{JSON.stringify(report, null, 2)}</pre>
            </div> */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading and error indicators */}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading...</div>
      )}
      {error && <div className="text-sm text-rose-600">Error: {error}</div>}
    </div>
  );
}
