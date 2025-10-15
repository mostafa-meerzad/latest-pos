import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day";
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const year = searchParams.get("year") || new Date().getFullYear();

    const baseDate = new Date(date);
    let startDate, endDate;

    // Calculate date ranges based on period (UTC fix)
    switch (period) {
      case "day":
        startDate = new Date(
          Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate()
          )
        );
        endDate = new Date(
          Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate() + 1
          )
        );
        endDate.setUTCMilliseconds(-1);
        break;

      case "week":
        // Custom week: Saturday to Friday
        const dayOfWeek = baseDate.getUTCDay(); // 0=Sunday, 6=Saturday
        let daysSinceSaturday = dayOfWeek - 6; // 6 = Saturday
        if (daysSinceSaturday < 0) daysSinceSaturday += 7;

        startDate = new Date(baseDate);
        startDate.setUTCDate(baseDate.getUTCDate() - daysSinceSaturday);
        startDate.setUTCHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + 6); // Friday (6 days after Saturday)
        endDate.setUTCHours(23, 59, 59, 999);
        break;

      case "month":
        startDate = new Date(
          Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1)
        );
        endDate = new Date(
          Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, 0)
        );
        endDate.setUTCHours(23, 59, 59, 999);
        break;

      case "year":
        startDate = new Date(Date.UTC(parseInt(year), 0, 1));
        endDate = new Date(Date.UTC(parseInt(year), 11, 31, 23, 59, 59, 999));
        break;

      default:
        return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    console.log(
      `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Get sales data with items
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                costPrice: true,
              },
            },
          },
        },
        delivery: true,
      },
    });

    // Get delivery data
    const deliveries = await prisma.delivery.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    costPrice: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate totals
    const undeliveredSales = sales.filter((sale) => !sale.delivery);

    // Sales revenue: include ALL sales (with and without deliveries)
    const totalSalesRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    );

    // Sales cost: cost of items for ALL sales (count once)
    const totalSalesCost = sales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce(
          (itemSum, item) =>
            itemSum + item.quantity * Number(item.product.costPrice),
          0
        ),
      0
    );

    // Total sold items (from all sales)
    const totalSoldItems = sales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    // Delivery revenue is now sum of delivery_fee values (from deliveries table)
    const totalDeliveryFee = deliveries.reduce(
      (sum, delivery) => sum + Number(delivery.deliveryFee || 0),
      0
    );

    const totalDeliveryCost = 0;

    // Combined totals
    const totalRevenue = totalSalesRevenue + totalDeliveryFee;
    const totalCost = totalSalesCost; // don't double-count sale item costs
    const totalProfit = totalRevenue - totalCost;

    // Top sold products - count items from all sales
    const productSales = {};

    // Count from all sales (each sale has items)
    const countedSaleIds = new Set();
    sales.forEach((sale) => {
      if (countedSaleIds.has(sale.id)) return;
      countedSaleIds.add(sale.id);

      sale.items.forEach((item) => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += Number(item.subtotal);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Get time-based breakdowns
    let hourlyData = {};
    let weeklyData = {};
    let monthlyData = {};
    let yearlyData = {};

    if (period === "day") {
      hourlyData = await getHourlyData(startDate, endDate);
    } else if (period === "week") {
      weeklyData = await getWeeklyData(startDate, endDate);
    } else if (period === "month") {
      monthlyData = await getMonthlyData(startDate, endDate);
    } else if (period === "year") {
      monthlyData = await getYearlyMonthlyData(parseInt(year));
      yearlyData = await getYearlyComparison(parseInt(year));
    }

    const response = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin:
          totalRevenue > 0
            ? ((totalProfit / totalRevenue) * 100).toFixed(2)
            : "0.00",
        totalSoldItems,
      },
      breakdown: {
        sales: {
          revenue: totalSalesRevenue,
          cost: totalSalesCost,
          profit: totalSalesRevenue - totalSalesCost,
          count: sales.length,
        },
        deliveries: {
          revenue: totalDeliveryFee, // <-- delivery_fee sum
          cost: totalDeliveryCost, // currently zero
          profit: totalDeliveryFee - totalDeliveryCost,
          count: deliveries.length,
        },
        comparison: {
          higherRevenue:
            totalSalesRevenue > totalDeliveryFee ? "sales" : "deliveries",
          revenueDifference: Math.abs(totalSalesRevenue - totalDeliveryFee),
          higherProfit:
            totalSalesRevenue - totalSalesCost >
            totalDeliveryFee - totalDeliveryCost
              ? "sales"
              : "deliveries",
          profitDifference: Math.abs(
            totalSalesRevenue -
              totalSalesCost -
              (totalDeliveryFee - totalDeliveryCost)
          ),
        },
      },
      topProducts,
      timeSeries: {
        hourly: hourlyData,
        weekly: weeklyData,
        monthly: monthlyData,
        yearly: yearlyData,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}

// Helper: build unified aggregates for a given period by using sales (undelivered) + deliveries (by deliveryDate)
// NOTES: use UTC consistently

async function getHourlyData(startDate, endDate) {
  // sales by sale.date (all sales)
  const sales = await prisma.sale.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: { select: { costPrice: true } } } }, delivery: true },
  });

  // deliveries by deliveryDate (delivery_fee)
  const deliveries = await prisma.delivery.findMany({
    where: { deliveryDate: { gte: startDate, lte: endDate } },
    include: { sale: { include: { items: { include: { product: { select: { costPrice: true } } } } } } },
  });

  const hourlyData = {};
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = { revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0 };
  }

  // sales (revenue = sale.totalAmount, cost = sale items cost)
  sales.forEach((sale) => {
    const hour = new Date(sale.date).getUTCHours();
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0
    );
    hourlyData[hour].revenue += revenue;
    hourlyData[hour].cost += cost;
    hourlyData[hour].profit += revenue - cost;
    hourlyData[hour].count += 1;
    hourlyData[hour].itemsSold += sale.items.reduce((s, i) => s + i.quantity, 0);
  });

  // deliveries (revenue = delivery.deliveryFee, cost = 0 here)
  deliveries.forEach((delivery) => {
    if (!delivery.deliveryDate) return;
    const hour = new Date(delivery.deliveryDate).getUTCHours();
    const revenue = Number(delivery.deliveryFee || 0);
    const cost = 0;
    hourlyData[hour].revenue += revenue;
    hourlyData[hour].cost += cost;
    hourlyData[hour].profit += revenue - cost;
    hourlyData[hour].count += 1;
    // itemsSold: we can optionally add delivered items count if you want delivery items metric:
    hourlyData[hour].itemsSold += delivery.sale?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  });

  return hourlyData;
}

async function getWeeklyData(startDate, endDate) {
  const sales = await prisma.sale.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: { select: { costPrice: true } } } }, delivery: true },
  });

  const deliveries = await prisma.delivery.findMany({
    where: { deliveryDate: { gte: startDate, lte: endDate } },
    include: { sale: { include: { items: { include: { product: { select: { costPrice: true } } } } } } },
  });

  const weeklyData = {};

  const getCustomWeek = (date) => {
    const d = new Date(date);
    const currentDay = d.getUTCDay(); // 0..6
    const saturday = 6;
    let daysSinceSaturday = currentDay - saturday;
    if (daysSinceSaturday < 0) daysSinceSaturday += 7;
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSaturday);
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart.toISOString().split("T")[0];
  };

  const ensureWeekKey = (wk) => {
    if (!weeklyData[wk]) {
      const wkStart = new Date(wk + "T00:00:00.000Z");
      const wkEnd = new Date(wkStart);
      wkEnd.setUTCDate(wkStart.getUTCDate() + 6);
      const startFormatted = wkStart.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const endFormatted = wkEnd.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      weeklyData[wk] = {
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0,
        itemsSold: 0,
        name: `${startFormatted} - ${endFormatted}`,
        weekKey: wk,
      };
    }
  };

  sales.forEach((sale) => {
    const wk = getCustomWeek(sale.date);
    ensureWeekKey(wk);
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0
    );
    weeklyData[wk].revenue += revenue;
    weeklyData[wk].cost += cost;
    weeklyData[wk].profit += revenue - cost;
    weeklyData[wk].count += 1;
    weeklyData[wk].itemsSold += sale.items.reduce((s, i) => s + i.quantity, 0);
  });

  deliveries.forEach((delivery) => {
    if (!delivery.deliveryDate) return;
    const wk = getCustomWeek(delivery.deliveryDate);
    ensureWeekKey(wk);
    const revenue = Number(delivery.deliveryFee || 0);
    const cost = 0;
    weeklyData[wk].revenue += revenue;
    weeklyData[wk].cost += cost;
    weeklyData[wk].profit += revenue - cost;
    weeklyData[wk].count += 1;
    weeklyData[wk].itemsSold += delivery.sale?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  });

  return weeklyData;
}

async function getMonthlyData(startDate, endDate) {
  const sales = await prisma.sale.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { items: { include: { product: { select: { costPrice: true } } } }, delivery: true },
  });

  const deliveries = await prisma.delivery.findMany({
    where: { deliveryDate: { gte: startDate, lte: endDate } },
    include: { sale: { include: { items: { include: { product: { select: { costPrice: true } } } } } } },
  });

  const monthlyData = {};
  const monthNames = [
    "January","February","March","April","May","June","July","August","September","October","November","December",
  ];

  const startMonth = new Date(startDate).getUTCMonth();
  const endMonth = new Date(endDate).getUTCMonth();
  for (let month = startMonth; month <= endMonth; month++) {
    monthlyData[month] = { name: monthNames[month], revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0 };
  }

  sales.forEach((sale) => {
    const month = new Date(sale.date).getUTCMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = { name: monthNames[month], revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0 };
    }
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce((sum, item) => sum + item.quantity * Number(item.product.costPrice), 0);
    monthlyData[month].revenue += revenue;
    monthlyData[month].cost += cost;
    monthlyData[month].profit += revenue - cost;
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += sale.items.reduce((s, i) => s + i.quantity, 0);
  });

  deliveries.forEach((delivery) => {
    if (!delivery.deliveryDate) return;
    const month = new Date(delivery.deliveryDate).getUTCMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = { name: monthNames[month], revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0 };
    }
    const revenue = Number(delivery.deliveryFee || 0);
    const cost = 0;
    monthlyData[month].revenue += revenue;
    monthlyData[month].cost += cost;
    monthlyData[month].profit += revenue - cost;
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += delivery.sale?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  });

  return monthlyData;
}

async function getYearlyMonthlyData(year) {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const sales = await prisma.sale.findMany({
    where: { date: { gte: yearStart, lte: yearEnd } },
    include: { items: { include: { product: { select: { costPrice: true } } } }, delivery: true },
  });
  const undelivered = sales; // we count all sales for yearly monthly; deliveries handled separately below

  const deliveries = await prisma.delivery.findMany({
    where: { deliveryDate: { gte: yearStart, lte: yearEnd } },
    include: { sale: { include: { items: { include: { product: { select: { costPrice: true } } } } } } },
  });

  const monthlyData = {};
  const monthNames = [
    "January","February","March","April","May","June","July","August","September","October","November","December",
  ];
  for (let month = 0; month < 12; month++) {
    monthlyData[month] = { name: monthNames[month], revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0, deliveries: 0 };
  }

  // sales (all sales)
  sales.forEach((sale) => {
    const month = new Date(sale.date).getUTCMonth();
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce((sum, item) => sum + item.quantity * Number(item.product.costPrice), 0);
    monthlyData[month].revenue += revenue;
    monthlyData[month].cost += cost;
    monthlyData[month].profit += revenue - cost;
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += sale.items.reduce((s, i) => s + i.quantity, 0);

    // Note: we don't increment deliveries here; deliveries are counted from deliveries list below
  });

  // deliveries (delivery_fee)
  deliveries.forEach((delivery) => {
    if (!delivery.deliveryDate) return;
    const month = new Date(delivery.deliveryDate).getUTCMonth();
    const revenue = Number(delivery.deliveryFee || 0);
    const cost = 0;
    monthlyData[month].revenue += revenue;
    monthlyData[month].profit += revenue - cost;
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += delivery.sale?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    monthlyData[month].deliveries += 1;
  });

  return monthlyData;
}


// Function for year-over-year comparison
async function getYearlyComparison(currentYear) {
  const previousYear = currentYear - 1;

  const currentYearData = await getYearlyMonthlyData(currentYear);
  const previousYearData = await getYearlyMonthlyData(previousYear);

  // Calculate totals for comparison
  const currentYearTotal = Object.values(currentYearData).reduce(
    (acc, month) => ({
      revenue: acc.revenue + month.revenue,
      cost: acc.cost + month.cost,
      profit: acc.profit + month.profit,
      count: acc.count + month.count,
      itemsSold: acc.itemsSold + month.itemsSold,
    }),
    { revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0 }
  );

  const previousYearTotal = Object.values(previousYearData).reduce(
    (acc, month) => ({
      revenue: acc.revenue + month.revenue,
      cost: acc.cost + month.cost,
      profit: acc.profit + month.profit,
      count: acc.count + month.count,
      itemsSold: acc.itemsSold + month.itemsSold,
    }),
    { revenue: 0, cost: 0, profit: 0, count: 0, itemsSold: 0 }
  );

  return {
    currentYear: currentYearTotal,
    previousYear: previousYearTotal,
    growth: {
      revenue:
        previousYearTotal.revenue > 0
          ? (
              ((currentYearTotal.revenue - previousYearTotal.revenue) /
                previousYearTotal.revenue) *
              100
            ).toFixed(2)
          : 0,
      profit:
        previousYearTotal.profit > 0
          ? (
              ((currentYearTotal.profit - previousYearTotal.profit) /
                previousYearTotal.profit) *
              100
            ).toFixed(2)
          : 0,
      salesCount:
        previousYearTotal.count > 0
          ? (
              ((currentYearTotal.count - previousYearTotal.count) /
                previousYearTotal.count) *
              100
            ).toFixed(2)
          : 0,
    },
  };
}
