import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust import path as needed

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day"; // day, week, month, year
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
        endDate.setMilliseconds(-1);
        break;

      case "week":
        const dayOfWeek = baseDate.getUTCDay();
        startDate = new Date(baseDate);
        startDate.setUTCDate(baseDate.getUTCDate() - dayOfWeek);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + 7);
        endDate.setMilliseconds(-1);
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

    // Get sales data with items (fixed cost calculation)
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

    // Convert revenue to numbers and calculate costs properly
    const totalSalesRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    );
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

    const totalSoldItems = sales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    // Calculate totals from deliveries
    const totalDeliveryRevenue = deliveries.reduce(
      (sum, delivery) => sum + Number(delivery.sale.totalAmount),
      0
    );

    const totalDeliveryCost = deliveries.reduce(
      (sum, delivery) =>
        sum +
        delivery.sale.items.reduce(
          (itemSum, item) =>
            itemSum + item.quantity * Number(item.product.costPrice),
          0
        ),
      0
    );

    // Combined totals
    const totalRevenue = totalSalesRevenue + totalDeliveryRevenue;
    const totalCost = totalSalesCost + totalDeliveryCost;
    const totalProfit = totalRevenue - totalCost;

    // Top sold products
    const productSales = {};

    // Count from sales
    sales.forEach((sale) => {
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

    // Count from delivery sales
    deliveries.forEach((delivery) => {
      delivery.sale.items.forEach((item) => {
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

    // Get time-based breakdowns based on period
    let hourlyData = {};
    let weeklyData = {};
    let monthlyData = {};
    let yearlyData = {};

    if (period === "day") {
      hourlyData = await getHourlyData(startDate, endDate);
      monthlyData = await getMonthlyData(baseDate);
    } else if (period === "week") {
      weeklyData = await getWeeklyData(startDate, endDate);
      monthlyData = await getMonthlyData(baseDate);
    } else if (period === "month") {
      weeklyData = await getWeeklyData(startDate, endDate);
      monthlyData = await getMonthlyData(baseDate);
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
            : 0,
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
          revenue: totalDeliveryRevenue,
          cost: totalDeliveryCost,
          profit: totalDeliveryRevenue - totalDeliveryCost,
          count: deliveries.length,
        },
        comparison: {
          higherRevenue:
            totalSalesRevenue > totalDeliveryRevenue ? "sales" : "deliveries",
          revenueDifference: Math.abs(totalSalesRevenue - totalDeliveryRevenue),
          higherProfit:
            totalSalesRevenue - totalSalesCost >
            totalDeliveryRevenue - totalDeliveryCost
              ? "sales"
              : "deliveries",
          profitDifference: Math.abs(
            totalSalesRevenue -
              totalSalesCost -
              (totalDeliveryRevenue - totalDeliveryCost)
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

// Fixed helper functions
async function getHourlyData(startDate, endDate) {
  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      totalAmount: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
  });

  const hourlyData = {};

  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = { revenue: 0, count: 0, itemsSold: 0 };
  }

  sales.forEach((sale) => {
    const hour = new Date(sale.date).getUTCHours();
    hourlyData[hour].revenue += Number(sale.totalAmount);
    hourlyData[hour].count += 1;
    hourlyData[hour].itemsSold += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  return hourlyData;
}

async function getWeeklyData(startDate, endDate) {
  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      totalAmount: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
  });

  const weeklyData = {};

  sales.forEach((sale) => {
    const saleDate = new Date(sale.date);
    const weekNumber = Math.ceil(saleDate.getUTCDate() / 7);

    if (!weeklyData[weekNumber]) {
      weeklyData[weekNumber] = { revenue: 0, count: 0, itemsSold: 0 };
    }
    weeklyData[weekNumber].revenue += Number(sale.totalAmount);
    weeklyData[weekNumber].count += 1;
    weeklyData[weekNumber].itemsSold += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  return weeklyData;
}

async function getMonthlyData(baseDate) {
  const yearStart = new Date(Date.UTC(baseDate.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(
    Date.UTC(baseDate.getUTCFullYear(), 11, 31, 23, 59, 59, 999)
  );

  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    select: {
      date: true,
      totalAmount: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
  });

  const monthlyData = {};

  // Initialize all months
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  for (let month = 0; month < 12; month++) {
    monthlyData[month] = {
      name: monthNames[month],
      revenue: 0,
      count: 0,
      itemsSold: 0,
    };
  }

  sales.forEach((sale) => {
    const month = new Date(sale.date).getUTCMonth();
    monthlyData[month].revenue += Number(sale.totalAmount);
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  return monthlyData;
}

// New function for yearly monthly breakdown
async function getYearlyMonthlyData(year) {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              costPrice: true,
            },
          },
        },
      },
    },
  });

  const monthlyData = {};
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize all months with complete data
  for (let month = 0; month < 12; month++) {
    monthlyData[month] = {
      name: monthNames[month],
      revenue: 0,
      cost: 0,
      profit: 0,
      count: 0,
      itemsSold: 0,
      deliveries: 0,
    };
  }

  // Process sales for the year
  sales.forEach((sale) => {
    const month = new Date(sale.date).getUTCMonth();
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0
    );

    monthlyData[month].revenue += revenue;
    monthlyData[month].cost += cost;
    monthlyData[month].profit += revenue - cost;
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Count deliveries if exists
    if (sale.delivery) {
      monthlyData[month].deliveries += 1;
    }
  });

  return monthlyData;
}

// New function for year-over-year comparison
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
