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

// ✅ NEW: Toast import
import toast from "react-hot-toast";
import { RefreshCcw } from "lucide-react";

// Chart colors
const COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#f97316",
  "#10b981",
  "#ef4444",
  "#6366f1",
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("day");
  // Replaced single date with from/to range (defaults to today -> today)
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [year, setYear] = useState(new Date().getFullYear());
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("all");

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (json.success) {
          setCurrentUser(json.data);
          // If not main branch, they can only see their own branch
          if (!json.data.isMain) {
            setSelectedBranchId(String(json.data.branchId));
          }
        }
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (currentUser?.isMain) {
      async function fetchBranches() {
        try {
          const res = await fetch("/api/branches");
          const json = await res.json();
          if (json.success) {
            setBranches(json.data);
          }
        } catch (e) {
          console.error("Failed to fetch branches", e);
        }
      }
      fetchBranches();
    }
  }, [currentUser]);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, fromDate, toDate, year, selectedProductId, selectedBranchId]);

  // Load products once for the product filter
  useEffect(() => {
    let ignore = false;
    async function loadProducts() {
      try {
        const params = new URLSearchParams();
        if (selectedBranchId && selectedBranchId !== "all") {
          params.set("branchId", String(selectedBranchId));
        } else if (selectedBranchId === "all") {
          params.set("branchId", "all");
        }
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data || data?.products || [];
        if (!ignore) setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        // silent fail for filter list
        console.error("Failed to load products for filter", e);
      }
    }
    loadProducts();
    return () => {
      ignore = true;
    };
  }, [selectedBranchId]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    const toastId = toast.loading("Loading report data...");
    try {
      // Basic validation for date range when using range periods
      if (period !== "year") {
        if (!fromDate || !toDate) {
          throw new Error("Please select both From and To dates");
        }
        if (new Date(fromDate) > new Date(toDate)) {
          throw new Error("From date cannot be after To date");
        }
      }

      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "year") {
        params.set("year", String(year));
      } else {
        params.set("from", fromDate);
        params.set("to", toDate);
      }
      if (selectedProductId && selectedProductId !== "all") {
        params.set("productId", String(selectedProductId));
      }
      if (selectedBranchId && selectedBranchId !== "all") {
        params.set("branchId", String(selectedBranchId));
      } else if (selectedBranchId === "all") {
        params.set("branchId", "all");
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      
      const json = await res.json();
      console.log(json);
      setReport(json);

      toast.success("Report data loaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
      toast.error(`Error: ${err.message || "Failed to load data"}`, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  const salesVsDeliveryPie = useMemo(() => {
    if (!report?.breakdown) return [{ name: "No Data", value: 0 }];
    const sales = report.breakdown.sales?.revenue || 0;
    const deliveries = report.breakdown.deliveries?.revenue || 0;
    if (sales === 0 && deliveries === 0) {
      return [{ name: "No Data", value: 0 }];
    }
    return [
      { name: "Sales", value: sales },
      { name: "Deliveries", value: deliveries },
    ];
  }, [report]);

  const hourlySeries = useMemo(() => {
    if (!report?.timeSeries?.hourly) return [];
    const raw = report.timeSeries.hourly;
    return Object.keys(raw)
      .map((k) => ({ hour: k, ...raw[k] }))
      .sort((a, b) => Number(a.hour) - Number(b.hour));
  }, [report]);

  const weeklySeries = useMemo(() => {
    if (!report?.timeSeries?.weekly) return [];
    const raw = report.timeSeries.weekly;
    return Object.keys(raw)
      .map((k) => ({
        week: raw[k].name || `Week ${k}`,
        ...raw[k],
      }))
      .sort((a, b) => a.weekKey?.localeCompare?.(b.weekKey) || 0);
  }, [report]);

  const monthlySeries = useMemo(() => {
    if (!report?.timeSeries?.monthly) return [];
    const raw = report.timeSeries.monthly;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return Object.keys(raw)
      .map((k) => {
        const monthIndex = Number(k);
        const monthData = raw[k];
        return {
          monthIndex,
          name: monthNames[monthIndex] || `M${monthIndex + 1}`,
          revenue: monthData.revenue || 0,
          cost: monthData.cost || 0,
          profit: monthData.profit || 0,
          deliveries: monthData.deliveries || 0,
          count: monthData.count || 0,
        };
      })
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [report]);

  const yearlyComparison = useMemo(() => {
    if (!report?.timeSeries?.yearly || !report?.timeSeries?.monthly)
      return null;

    const currentYearData = report.timeSeries.yearly.currentYear;
    const previousYearData = report.timeSeries.yearly.previousYear;
    const monthlyData = report.timeSeries.monthly;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const chartData = Object.keys(monthlyData)
      .map((monthKey) => {
        const monthIndex = Number(monthKey);
        const monthData = monthlyData[monthKey];
        return {
          name: monthNames[monthIndex] || `M${monthIndex + 1}`,
          monthIndex,
          currentYear: monthData.revenue || 0,
          previousYear: previousYearData?.revenue
            ? previousYearData.revenue / 12
            : 0,
        };
      })
      .sort((a, b) => a.monthIndex - b.monthIndex);

    return {
      ...report.timeSeries.yearly,
      chartData,
      currentYear: year,
      previousYear: year - 1,
    };
  }, [report, year]);

  function fmtCurrency(v) {
    if (v === undefined || v === null || isNaN(v)) return "-";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "AFN",
      maximumFractionDigits: 2,
    }).format(v);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 ">
        <div className="flex items-center justify-between  self-center">
          <Image
            src={ReportsImg}
            width={70}
            height={70}
            alt="delivery page logo"
          />
          <h1 className="text-2xl font-semibold">Reports Dashboard</h1>
        </div>

        <div className="flex flex-wrap-reverse gap-3 items-center justify-end self-center">
          <Button onClick={fetchReport} variant="outline">
            <RefreshCcw />
            Refresh
          </Button>

          {currentUser?.isMain && (
            <div className="flex items-center gap-2">
              <span className="px-1 text-blue-700">branch</span>
              <label className="flex flex-col">
                <Select
                  value={String(selectedBranchId)}
                  onValueChange={(v) => setSelectedBranchId(v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          )}

          {/*<label className="flex flex-col">*/}
          {/*  <Select onValueChange={(v) => setPeriod(v)} value={period}>*/}
          {/*    <SelectTrigger className="w-36">*/}
          {/*      <SelectValue placeholder="Select period" />*/}
          {/*    </SelectTrigger>*/}
          {/*    <SelectContent>*/}
          {/*      <SelectItem value="day">Day</SelectItem>*/}
          {/*      <SelectItem value="week">Week</SelectItem>*/}
          {/*      <SelectItem value="month">Month</SelectItem>*/}
          {/*      <SelectItem value="year">Year</SelectItem>*/}
          {/*    </SelectContent>*/}
          {/*  </Select>*/}
          {/*</label>*/}

          {period === "year" ? (
            <div className="flex items-center gap-2">
              <label className="flex flex-col">
                <Input
                  type="number"
                  className="w-36"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </label>
              {/* Product filter for yearly as well */}
              <span className="px-1 text-blue-700">product</span>
              <label className="flex flex-col">
                <Select
                  value={String(selectedProductId)}
                  onValueChange={(v) => setSelectedProductId(v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2">
                <span className="px-1 text-blue-700">from</span>

              <label className="flex flex-col">
                {/*<span className="text-xs text-muted-foreground">From</span>*/}
                <Input
                  type="date"
                  className="w-40"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>
              <span className="px-1 text-blue-700">to</span>
              <label className="flex flex-col">
                {/*<span className="text-xs text-muted-foreground">To</span>*/}
                <Input
                  type="date"
                  className="w-40"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
              {/* Product filter */}
              <span className="px-1 text-blue-700">product</span>
              <label className="flex flex-col">
                <Select
                  value={String(selectedProductId)}
                  onValueChange={(v) => setSelectedProductId(v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          )}

          <div className="mr-3">
            <BackToDashboardButton />
          </div>
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">
            Loading report data...
          </div>
        </div>
      ) : (
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
                        angle={period === "week" ? 0 : -90}
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
            {period === "year" &&
              yearlyComparison &&
              yearlyComparison.chartData &&
              yearlyComparison.chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Year-over-Year Comparison</CardTitle>
                    <CardDescription>
                      Compare {yearlyComparison.currentYear} to{" "}
                      {yearlyComparison.previousYear} revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={yearlyComparison.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            fmtCurrency(value),
                            name === "currentYear"
                              ? `${yearlyComparison.currentYear} Revenue`
                              : `${yearlyComparison.previousYear} Revenue`,
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="currentYear"
                          name={`${yearlyComparison.currentYear} Revenue`}
                          stroke={COLORS[0]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="previousYear"
                          name={`${yearlyComparison.previousYear} Revenue`}
                          stroke={COLORS[1]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Growth Metrics */}
                    {yearlyComparison.growth && (
                      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                        <div className="text-center">
                          <div className="text-muted-foreground">
                            Revenue Growth
                          </div>
                          <div
                            className={`font-semibold ${
                              yearlyComparison.growth.revenue > 0
                                ? "text-green-600"
                                : "text-rose-600"
                            }`}
                          >
                            {yearlyComparison.growth.revenue > 0 ? "+" : ""}
                            {yearlyComparison.growth.revenue}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">
                            Profit Growth
                          </div>
                          <div
                            className={`font-semibold ${
                              yearlyComparison.growth.profit > 0
                                ? "text-green-600"
                                : "text-rose-600"
                            }`}
                          >
                            {yearlyComparison.growth.profit > 0 ? "+" : ""}
                            {yearlyComparison.growth.profit}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">
                            Sales Growth
                          </div>
                          <div
                            className={`font-semibold ${
                              yearlyComparison.growth.salesCount > 0
                                ? "text-green-600"
                                : "text-rose-600"
                            }`}
                          >
                            {yearlyComparison.growth.salesCount > 0 ? "+" : ""}
                            {yearlyComparison.growth.salesCount}%
                          </div>
                        </div>
                      </div>
                    )}
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
                  {salesVsDeliveryPie.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        No revenue data available
                      </div>
                    </div>
                  ) : (
                    <>
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
                          <div
                            key={entry.name}
                            className="flex items-center gap-2"
                          >
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
                    </>
                  )}
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
                      <TableHead>Branch</TableHead>
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
                          <TableCell className="truncate whitespace-nowrap overflow-hidden max-w-24">{p.product?.branch?.name}</TableCell>
                          <TableCell>{Number(p.quantity).toFixed(2)}</TableCell>
                          <TableCell>{fmtCurrency(p.revenue)}</TableCell>
                          <TableCell>
                            {fmtCurrency(p.product?.costPrice)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
