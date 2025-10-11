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

    // Calculate totals - FIXED: No double counting
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

    // Delivery revenue and cost (only count deliveries that don't have associated sales already counted)
    const uniqueDeliverySales = deliveries.filter(
      (delivery) => !sales.some((sale) => sale.id === delivery.saleId)
    );

    const totalDeliveryRevenue = uniqueDeliverySales.reduce(
      (sum, delivery) => sum + Number(delivery.sale.totalAmount),
      0
    );

    const totalDeliveryCost = uniqueDeliverySales.reduce(
      (sum, delivery) =>
        sum +
        delivery.sale.items.reduce(
          (itemSum, item) =>
            itemSum + item.quantity * Number(item.product.costPrice),
          0
        ),
      0
    );

    // Combined totals (no double counting)
    const totalRevenue = totalSalesRevenue + totalDeliveryRevenue;
    const totalCost = totalSalesCost + totalDeliveryCost;
    const totalProfit = totalRevenue - totalCost;

    // Top sold products - FIXED: Combine sales and unique deliveries
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

    // Count from unique delivery sales only
    uniqueDeliverySales.forEach((delivery) => {
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
          revenue: totalDeliveryRevenue,
          cost: totalDeliveryCost,
          profit: totalDeliveryRevenue - totalDeliveryCost,
          count: uniqueDeliverySales.length,
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

  const hourlyData = {};

  // Initialize all hours with complete data structure
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = {
      revenue: 0,
      cost: 0,
      profit: 0,
      count: 0,
      itemsSold: 0,
    };
  }

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

  const weeklyData = {};

  // Custom week calculation: Saturday to Friday
  const getCustomWeek = (date) => {
    const saturday = 6;
    const currentDay = date.getUTCDay();

    let daysSinceSaturday = currentDay - saturday;
    if (daysSinceSaturday < 0) daysSinceSaturday += 7;

    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - daysSinceSaturday);
    weekStart.setUTCHours(0, 0, 0, 0);

    return weekStart.toISOString().split("T")[0];
  };

  sales.forEach((sale) => {
    const saleDate = new Date(sale.date);
    const weekKey = getCustomWeek(saleDate);
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0
    );

    if (!weeklyData[weekKey]) {
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

      const startFormatted = weekStart.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const endFormatted = weekEnd.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      weeklyData[weekKey] = {
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0,
        itemsSold: 0,
        name: `${startFormatted} - ${endFormatted}`,
        weekKey: weekKey,
      };
    }

    weeklyData[weekKey].revenue += revenue;
    weeklyData[weekKey].cost += cost;
    weeklyData[weekKey].profit += revenue - cost;
    weeklyData[weekKey].count += 1;
    weeklyData[weekKey].itemsSold += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  return weeklyData;
}

async function getMonthlyData(startDate, endDate) {
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

  sales.forEach((sale) => {
    const saleDate = new Date(sale.date);
    const month = saleDate.getUTCMonth();
    const revenue = Number(sale.totalAmount);
    const cost = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0
    );

    if (!monthlyData[month]) {
      monthlyData[month] = {
        name: monthNames[month],
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0,
        itemsSold: 0,
      };
    }

    monthlyData[month].revenue += revenue;
    monthlyData[month].cost += cost;
    monthlyData[month].profit += revenue - cost;
    monthlyData[month].count += 1;
    monthlyData[month].itemsSold += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  // Ensure all months in range are present
  const startMonth = new Date(startDate).getUTCMonth();
  const endMonth = new Date(endDate).getUTCMonth();

  for (let month = startMonth; month <= endMonth; month++) {
    if (!monthlyData[month]) {
      monthlyData[month] = {
        name: monthNames[month],
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0,
        itemsSold: 0,
      };
    }
  }

  return monthlyData;
}

// Function for yearly monthly breakdown
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
