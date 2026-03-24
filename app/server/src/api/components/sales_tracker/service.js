const mongoose = require("mongoose");
const InvoiceModel = require("../invoice/model")
const SupplierInvoices = require('../supplier_invoices/model');

const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const processSummary = (summary, prevSummary) => {
  if(!summary){
    return {totalSales:0, totalOrders:0, avgOrderValue:0, activeCustomers:0, salesGrowth:0, ordersGrowth:0, averageOrderGrowth:0, customerGrowth:0}
  }
  if (!prevSummary) {
    return {
      totalSales: summary?.totalSales || 0,
      totalOrders: summary?.totalOrders || 0,
      avgOrderValue: summary?.avgOrderValue || 0,
      activeCustomers: summary?.activeCustomers || 0,
      salesGrowth: summary?.totalSales > 0 ? 100 : 0,
      ordersGrowth: summary?.totalOrders > 0 ? 100 : 0,
      averageOrderGrowth: summary?.avgOrderValue > 0 ? 100 : 0,
      customerGrowth: summary?.activeCustomers > 0 ? 100 : 0,
    }
  }
  return {
    totalSales: summary?.totalSales || 0,
    totalOrders: summary?.totalOrders || 0,
    avgOrderValue: summary?.avgOrderValue || 0,
    activeCustomers: summary?.activeCustomers || 0,
    salesGrowth: prevSummary ? calculateGrowth(summary.totalSales, prevSummary.totalSales) : 0,
    ordersGrowth: prevSummary ? calculateGrowth(summary.totalOrders, prevSummary.totalOrders) : 0,
    averageOrderGrowth: prevSummary ? calculateGrowth(summary.avgOrderValue, prevSummary.avgOrderValue) : 0,
    customerGrowth: prevSummary ? calculateGrowth(summary.activeCustomers, prevSummary.activeCustomers) : 0,
  }
}

const processMonthlySales = (monthlyData, prevYearMonthlyData) => {
  return monthlyData.map(month => {
    const monthKey = `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`;
    const prevYearMonth = `${month._id.year - 1}-${month._id.month.toString().padStart(2, '0')}`;
    const prevYearData = prevYearMonthlyData.find(m => m.month === prevYearMonth);
    const salesTarget = prevYearData ? prevYearData.totalSales * 1.05 : 0;
    return {
      month: monthKey,
      totalSales: month.totalSales,
      ordesCount: month.ordersCount,
      salesTarget: salesTarget,
      activeCustomers: month.activeCustomers || 0,
    }
  })
}

const formatMonth = (year, month) => {
  return `${month.toString().padStart(2, '0')}-${year.toString().slice(-2)}`
}

const excludeCancelledInvoices = () => {
  return [{
    $lookup: {
      from: "customerCancelledInvoicesDay",
      let: { cust: "$customer", ot: "$ot_date" },
      pipeline: [{
        $match: { $expr: { $and: [{ $eq: ["$customer", "$$cust"] }, { $eq: ["$ot_date", "$$ot"] }] } }
      }], as: 'cancelled',
    }
  },
  {
    $match: {
      $expr: { $eq: [{ $size: "$cancelled" }, 0] }
    }
  },
  { $unset: "cancelled" },]
}

const summaryFacet = [{
  $group: {
    _id: null,
    totalOrders: { $sum: 1 },
    totalSales: { $sum: "$total_incl_vat" },
    avgOrderValue: { $avg: "$total_incl_vat" },
    activeCustomers: { $addToSet: "$customer" }
  }
},
{
  $project: {
    totalOrders: 1,
    totalSales: 1,
    avgOrderValue: 1,
    activeCustomers: { $size: "$activeCustomers" }
  }
}];

const parseStartEndDateRange = (start, end) => {
  if (!start || !end) throw new Error("missing date query");
  const startDate = new Date(start);
  startDate.setUTCHours(0,0,0,0);
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);
  return { startDate, endDate };
}

const calculateSale = { $sum:{$add:[{$multiply:["$items.quantity", "$items.rate"]},{$multiply:["$items.quantity","$items.rate", {$divide:["$items.tax", 100]}]}]} }

const dashboardData = async (start_date, end_date) => {
  const { startDate, endDate } = parseStartEndDateRange(start_date, end_date);
  const prevYearStartDate = new Date(startDate);
  prevYearStartDate.setFullYear(prevYearStartDate.getFullYear() - 1);
  const prevYearEndDate = new Date(endDate);
  prevYearEndDate.setFullYear(prevYearEndDate.getFullYear() - 1);
  const pipeline = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    {
      $facet: {
        summary: [{
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSales: { $sum: "$total_incl_vat" },
            avgOrderValue: { $avg: "$total_incl_vat" },
            activeCustomers: { $addToSet: "$customer" },
          }
        }, {
          $project: {
            totalOrders: 1, totalSales: 1, avgOrderValue: 1, activeCustomers: { $size: "$activeCustomers" }
          }
        }],
        monthlySales: [{
          $group: {
            _id: { year: { $year: "$invoice_date" }, month: { $month: "$invoice_date" } },
            totalSales: { $sum: "$total_incl_vat" },
            ordersCount: { $sum: 1 },
            activeCustomers: { $addToSet: "$customer" }
          }
        }, {
          $project: { _id: 1, totalSales: 1, ordersCount: 1, activeCustomers: { $size: "$activeCustomers" } }
        }, { $sort: { "_id.year": 1, "_id.month": 1 } }],
        topProducts: [
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.barcode",
              productName: { $first: "$items.name" },
              totalSold: { $sum: "$items.quantity" },
              totalRevenue: calculateSale,
            }
          },
          { $sort: { totalRevenue: -1 } }, { $limit: 5 }
        ]
      }
    }
  ];
  const prevYearPipeline = [
    { $match: { invoice_date: { $gte: prevYearStartDate, $lte: prevYearEndDate } } },
    ...excludeCancelledInvoices(),
    {
      $facet: {
        summary: [{
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSales: { $sum: "$total_incl_vat" },
            avgOrderValue: { $avg: "$total_incl_vat" },
            activeCustomers: { $addToSet: "$customer" }
          }
        }, {
          $project: { totalOrders: 1, totalSales: 1, avgOrderValue: 1, activeCustomers: { $size: "$activeCustomers" } }
        }],
        monthlySales: [{
          $group: {
            _id: { year: { $year: "$invoice_date" }, month: { $month: "$invoice_date" } },
            totalSales: { $sum: "$total_incl_vat" },
            ordersCount: { $sum: 1 },
            activeCustomers: { $addToSet: "$customer" }
          }
        }, {
          $project: {
            _id: 0,
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: 1,
                  }
                }
              }
            }, totalSales: 1, ordersCount: 1, activeCustomers: { $size: "$activeCustomers" }
          }
        }]
      }
    }
  ]
  const [currentResults, prevYearResults] = await Promise.all([InvoiceModel.aggregate(pipeline), InvoiceModel.aggregate(prevYearPipeline)]);
  const response = {
    summary: processSummary(currentResults[0]?.summary?.[0], prevYearResults[0]?.summary?.[0]),
    monthlySales: processMonthlySales(currentResults[0].monthlySales, prevYearResults[0].monthlySales),
    topProducts: currentResults[0].topProducts,
  }
  return response
}

const salesRespData = async (start_date, end_date) => {
  const { startDate, endDate } = parseStartEndDateRange(start_date, end_date);
  const prevStartDate = new Date(startDate);
  prevStartDate.setMonth(startDate.getMonth() - 1);
  const prevEndDate = new Date(endDate);
  prevEndDate.setMonth(endDate.getMonth() - 1);
  const pipeline = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: "$customer_sales_rep",
              totalOrders: { $sum: 1 },
              totalSales: { $sum: "$total_incl_vat" },
              avgOrderValue: { $avg: "$total_incl_vat" },
              activeCustomers: { $addToSet: "$customer" }
            }
          },
          {$project: {totalOrders: 1, totalSales: 1, avgOrderValue: 1, activeCustomers: { $size: "$activeCustomers" }}}
        ],
        monthlySales: [
          {
            $group: {
              _id: {
                rep: "$customer_sales_rep",
                year: { $year: "$invoice_date" },
                month: { $month: "$invoice_date" }
              },
              totalSales: { $sum: "$total_incl_vat" },
              ordersCount: { $sum: 1 },
              activeCustomers: { $addToSet: "$customer" },
              avgOrderValue: { $avg: "$total_incl_vat" }
            }
          },
          {$project: {rep: "$_id.rep", year: "$_id.year", month: "$_id.month", totalSales: 1, ordersCount: 1, avgOrderValue: 1, activeCustomers: { $size: "$activeCustomers" }, _id: 0 }},
          { $sort: { rep: 1, year: 1, month: 1 } },
          {
            $group: {
              _id: "$rep",
              months: {
                $push: {
                  year: "$year",
                  month: "$month",
                  totalSales: "$totalSales",
                  ordersCount: "$ordersCount",
                  avgOrderValue: "$avgOrderValue",
                  activeCustomers: "$activeCustomers"
                }
              }
            }
          }
        ],
        topProducts: [
          { $unwind: "$items" },
          {
            $group: {
              _id: {
                rep: "$customer_sales_rep",
                productId: "$items._id"
              },
              productName: { $first: "$items.name" },
              totalSold: { $sum: "$items.quantity" },
              totalRevenue: calculateSale,
            }
          },
          { $sort: { "_id.rep": 1, totalRevenue: -1 } },
          {
            $group: {
              _id: "$_id.rep",
              products: {
                $push: {
                  productId: "$_id.productId",
                  name: "$productName",
                  totalSold: "$totalSold",
                  totalRevenue: "$totalRevenue"
                }
              }
            }
          },
          { $project: { products: { $slice: ["$products", 10] } } }
        ]
      }
    }
  ];

  const [result] = await InvoiceModel.aggregate(pipeline);
  const prevPipeline = [
    { $match: { invoice_date: { $gte: prevStartDate, $lte: prevEndDate } } },
    ...excludeCancelledInvoices(),
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    {
      $group: {
        _id: "$customer_sales_rep",
        totalOrders: { $sum: 1 },
        totalSales: { $sum: "$total_incl_vat" },
        avgOrderValue: { $avg: "$total_incl_vat" },
        activeCustomers: { $addToSet: "$customer" }
      }
    },
    {$project: {totalOrders: 1, totalSales: 1, avgOrderValue: 1, activeCustomers: { $size: "$activeCustomers" }}}
  ];
  const prevSummaryData = await InvoiceModel.aggregate(prevPipeline);
  const prevSummaryMap = {};
  prevSummaryData.forEach(rep => {
    prevSummaryMap[rep._id] = rep;
  });
  const topProductIdsByRep = {};
  result.topProducts.forEach(rep => {
    topProductIdsByRep[rep._id] = rep.products.map(p => p.productId);
  });
  const allTopProductIds = Object.values(topProductIdsByRep).flat();

  const prevTopProductsDetailedPipeline = [
    { $match: { invoice_date: { $gte: prevStartDate, $lte: prevEndDate } } },
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    { $unwind: "$items" },
    {
      $match: { "items._id": { $in: allTopProductIds } }
    },
    {
      $group: {
        _id: {
          rep: "$customer_sales_rep",
          productId: "$items._id"
        },
        prevTotalSold: { $sum: "$items.quantity" },
        prevTotalRevenue: calculateSale,
      }
    }
  ];
  const prevTopProductsDetailedData = await InvoiceModel.aggregate(
    prevTopProductsDetailedPipeline
  );
  const prevTopProductsDetailedMap = {};
  prevTopProductsDetailedData.forEach(item => {
    const repId = item._id.rep;
    const prodId = item._id.productId.toString();
    if (!prevTopProductsDetailedMap[repId])
      prevTopProductsDetailedMap[repId] = {};
    prevTopProductsDetailedMap[repId][prodId] = {
      prevTotalSold: item.prevTotalSold,
      prevTotalRevenue: item.prevTotalRevenue
    };
  });
  const currentTopProductsMonthlyPipeline = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    { $unwind: "$items" },
    {
      $match: { "items._id": { $in: allTopProductIds } }
    },
    {
      $group: {
        _id: {
          rep: "$customer_sales_rep",
          productId: "$items._id",
          year: { $year: "$invoice_date" },
          month: { $month: "$invoice_date" }
        },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: calculateSale,
      }
    },
    {
      $project: {
        rep: "$_id.rep",
        productId: "$_id.productId",
        year: "$_id.year",
        month: "$_id.month",
        totalSold: 1,
        totalRevenue: 1,
        _id: 0
      }
    },
    { $sort: { rep: 1, productId: 1, year: 1, month: 1 } }
  ];
  const currentTopProductsMonthlyData = await InvoiceModel.aggregate(
    currentTopProductsMonthlyPipeline
  );
  const currentTopProductsMonthlyMap = {};
  currentTopProductsMonthlyData.forEach(item => {
    const rep = item.rep;
    const pid = item.productId.toString();
    if (!currentTopProductsMonthlyMap[rep]) currentTopProductsMonthlyMap[rep] = {};
    if (!currentTopProductsMonthlyMap[rep][pid])
      currentTopProductsMonthlyMap[rep][pid] = [];
    currentTopProductsMonthlyMap[rep][pid].push({
      month: formatMonth(item.year, item.month),
      totalSold: item.totalSold,
      totalRevenue: item.totalRevenue
    });
  });

  const reps = result.summary.map(rep => {
    const prevSummary = prevSummaryMap[rep._id] || null;
    const monthlyData = result.monthlySales.find(m => m._id === rep._id)?.months || [];
    let prevMonthSales = 0;
    const processedMonths = monthlyData.map(m => {
      const monthFormatted = formatMonth(m.year, m.month);
      const salesTarget = prevMonthSales ? prevMonthSales * 1.05 : m.totalSales;
      prevMonthSales = m.totalSales;
      return {
        month: monthFormatted,
        totalSales: m.totalSales,
        ordersCount: m.ordersCount,
        avgOrderValue: m.avgOrderValue,
        activeCustomers: m.activeCustomers,
        salesTarget
      };
    });

    let topProducts = result.topProducts.find(p => p._id === rep._id)?.products || [];
    topProducts = topProducts.map(prod => {
      const prevData = prevTopProductsDetailedMap[rep._id]?.[prod.productId.toString()] || {};
      const currentMonthly = currentTopProductsMonthlyMap[rep._id]?.[prod.productId.toString()] || [];
      return {
        ...prod,
        prevTotalSold: prevData.prevTotalSold || 0,
        prevTotalRevenue: prevData.prevTotalRevenue || 0,
        monthlySales: currentMonthly,
      };
    });

    return {
      rep: rep._id,
      ...processSummary(rep, prevSummary),
      monthlyData: processedMonths,
      topProducts
    };
  });

  return reps;
};

const productData = async (start_date, end_date) => {
  const { startDate, endDate } = parseStartEndDateRange(start_date, end_date);
  const pipeline = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    {
      $facet: {
        summary: summaryFacet,
        topProducts: [
          { $unwind: "$items" },
          { $addFields: { yearMonth: { $dateToString: { format: "%Y-%m", date: "$invoice_date" } } } },
          {
            $group: {
              _id: { productId: "$items._id", yearMonth: "$yearMonth" },
              productName: { $first: "$items.name" },
              totalSold: { $sum: "$items.quantity" },
              totalRevenue: calculateSale,
              totalProfit: {$sum: {$multiply:["$items.quantity", {$subtract: ["$items.rate", "$items.cost_price"]}]}}
            }
          },
          { $sort: { "_id.yearMonth": 1 } },
          {
            $group: {
              _id: "$_id.productId",
              productName: { $first: "$productName" },
              monthlySales: {
                $push: {
                  month: "$_id.yearMonth",
                  totalSold: "$totalSold",
                  totalRevenue: "$totalRevenue"
                }
              },
              totalSoldAll: { $sum: "$totalSold" },
              totalRevenueAll: { $sum: "$totalRevenue" },
              totalAllProfit: {$sum: "$totalProfit"},
            }
          },
          { $sort: { totalRevenueAll: -1 } },
          {
            $project: {
              _id: 0,
              productId: "$_id",
              name: "$productName",
              totalSoldAll: 1,
              totalRevenueAll: 1,
              monthlySales: 1,
              totalAllProfit: 1,
            }
          },
        ]
      }
    }
  ];
  const result = await InvoiceModel.aggregate(pipeline);
  return result;
}

const orderReportData = async (start_date, end_date) => {
  const { startDate, endDate } = parseStartEndDateRange(start_date, end_date);
  const pipeline = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    {
      $facet: {
        summary: summaryFacet,
        customers: [
          {
            $addFields: {
              yearMonth: { $dateToString: { format: "%Y-%m", date: "$invoice_date" } }
            }
          },
          {
            $group: {
              _id: { customerId: "$customer", yearMonth: "$yearMonth" },
              totalRevenue: { $sum: "$total_incl_vat" },
              avgOrderValue: { $avg: "$total_incl_vat" },
              totalOrders: { $sum: 1 },
            }
          },
          { $sort: { "_id.yearMonth": 1 } },
          {
            $group: {
              _id: "$_id.customerId",
              monthlySales: {
                $push: {
                  month: "$_id.yearMonth",
                  totalRevenue: "$totalRevenue",
                  avgOrderValue: "$avgOrderValue",
                  totalOrders: "$totalOrders",
                }
              },
              totalRevenueAll: { $sum: "$totalRevenue" },
              totalOrdersAll: { $sum: "$totalOrders" }
            }
          },{
            $addFields:{avgValueAll:{$cond:[{$gt:["$totalOrdersAll", 0]}, {$divide:["$totalRevenueAll", "$totalOrdersAll"]}, 0]}}
          },
          { $sort: { totalRevenueAll: -1 } },
          {
            $lookup: {
              from: "customers",
              localField: "_id",
              foreignField: "_id",
              as: "customerInfo"
            }
          },
          { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              customerId: "$_id",
              customerName: "$customerInfo.customer_name",
              avgValueAll: 1,
              totalRevenueAll: 1,
              totalOrdersAll: 1,
              monthlySales: 1
            }
          }
        ]
      }
    }
  ];
  const result = await InvoiceModel.aggregate(pipeline);
  return result;
};

const sanitizedGraphData = (startDate, endDate) => [
  {
    $match: {
      invoice_date: {
        $gte: new Date(startDate), $lte: new Date(endDate)
      },
      profit: { $ne: null }
    }
  },
  ...excludeCancelledInvoices(),
  {
    $group: {
      _id: {
        year: { $year: "$invoice_date" }, month: { $month: "$invoice_date" }
      },
      totalProfit: { $sum: "$profit" },
      invoiceCount: { $sum: 1 },
      deliveryProfit: { $sum: { $cond: [{ $eq: ["$in_person", false] }, "$profit", 0] } },
      tradeCounterProfit: { $sum: { $cond: [{ $eq: ["$in_person", true] }, "$profit", 0] } },
      totalSale: { $sum: "$total_incl_vat" },
      totalVat: { $sum: "$vat_total" },
    }
  },

  { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $project: {
      month: {
        $concat: [{ $toString: "$_id.year" }, "-", {
          $cond: [{
            $lt: ["$_id.month", 10]
          }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }]
        }]
      },
      totalProfit: 1, invoiceCount: 1, _id: 0, deliveryProfit: 1, tradeCounterProfit: 1, totalSale: 1,totalVat: 1,
    }
  }
];

const sanitizedExpenseData = (startDate, endDate) => [
  {
    $match: { invoice_date: { $gte: new Date(startDate), $lte: new Date(endDate) }, expense_type: "Expense" }
  }, {
    $group: { _id: { year: { $year: "$invoice_date" }, month: { $month: "$invoice_date" } }, totalExpenses: { $sum: "$total" } }
  }, { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $project: {
      month: {
        $concat: [{ $toString: "$_id.year" }, "-", {
          $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }]
        }]
      }, totalExpenses: 1, _id: 0
    }
  }
]

const toMonthMap = (array, key) => {
  const map = {};
  array.forEach(item => { map[item.month] = item[key] }); return map;
}

const calculateSummary = (data) => {
  return data.reduce((acc, item) => {
    acc.totalOrders += item.invoiceCount || 0;
    acc.grossProfit += item.totalProfit || 0;
    acc.totalDeliveryProfit += item.deliveryProfit || 0;
    acc.totalCounterProfit += item.tradeCounterProfit || 0;
    acc.totalExpenses += item.totalExpenses || 0;
    acc.netProfit += item.netProfit || 0;
    acc.totalSale += item.totalSale || 0;
     acc.totalVat += item.totalVat || 0;
    return acc;
  }, { totalOrders: 0, grossProfit: 0, totalDeliveryProfit: 0, totalCounterProfit: 0, totalExpenses: 0, netProfit: 0, totalSale: 0, totalVat: 0 })
}
const businessReportData = async (start_date, end_date) => {
  const { startDate, endDate } = parseStartEndDateRange(start_date, end_date);
  const prevYearStartDate = new Date(startDate);
  prevYearStartDate.setFullYear(prevYearStartDate.getFullYear() - 1);
  const prevYearEndDate = new Date(endDate);
  prevYearEndDate.setFullYear(prevYearEndDate.getFullYear() - 1);
  const [currentYear, previousYear, currentYearExpenses, prevYearExpense] = await Promise.all([
    InvoiceModel.aggregate(sanitizedGraphData(startDate, endDate)),
    InvoiceModel.aggregate(sanitizedGraphData(prevYearStartDate, prevYearEndDate)),
    SupplierInvoices.aggregate(sanitizedExpenseData(startDate, endDate)),
    SupplierInvoices.aggregate(sanitizedExpenseData(prevYearStartDate, prevYearEndDate))
  ]);
  const currentExpenseMap = toMonthMap(currentYearExpenses, "totalExpenses");
  const previousExpenseMap = toMonthMap(prevYearExpense, "totalExpenses");
  const mergedCurrentYear = currentYear.map(item => {
    const expense = currentExpenseMap[item.month] || 0;
    return { ...item, totalExpenses: expense, netProfit: item.totalProfit - expense, deliveryProfit: item.deliveryProfit - expense };
  });
  const mergedPreviousYear = previousYear.map(item => {
    const expense = previousExpenseMap[item.month] || 0;
    return { ...item, totalExpenses: expense, netProfit: item.totalProfit - expense, deliveryProfit: item.deliveryProfit - expense }
  });
  const previousYearMap = {};
  mergedPreviousYear.forEach(item => { previousYearMap[item.month] = item; });

  const mergedWithGrowth = mergedCurrentYear.map(item => {
    const prev = previousYearMap[item.month] || {};
    return {
      ...item,
      growth: {
        ordersGrowth: calculateGrowth(item.invoiceCount || 0, prev.invoiceCount || 0),
        grossProfitGrowth: calculateGrowth(item.totalProfit || 0, prev.totalProfit || 0),
        deliveryProfitGrowth: calculateGrowth(item.deliveryProfit || 0, prev.deliveryProfit || 0),
        counterProfitGrowth: calculateGrowth(item.tradeCounterProfit || 0, prev.tradeCounterProfit || 0),
        expensesGrowth: calculateGrowth(item.totalExpenses || 0, prev.totalExpenses || 0),
        netProfitGrowth: calculateGrowth(item.netProfit || 0, prev.netProfit || 0),
        saleGrowth: calculateGrowth(item.totalSale || 0, prev.totalSale || 0),
        vatGrowth: calculateGrowth(item.totalVat || 0, prev.totalVat || 0),
      }
    };
  });
  const currentYearSummary = calculateSummary(mergedCurrentYear);
  const previousYearSummary = calculateSummary(mergedPreviousYear);
  const summaryGrowth = {
    ordersGrowth: calculateGrowth(currentYearSummary.totalOrders, previousYearSummary.totalOrders),
    grossProfitGrowth: calculateGrowth(currentYearSummary.grossProfit, previousYearSummary.grossProfit),
    deliveryProfitGrowth: calculateGrowth(currentYearSummary.totalDeliveryProfit, previousYearSummary.totalDeliveryProfit),
    counterProfitGrowth: calculateGrowth(currentYearSummary.totalCounterProfit, previousYearSummary.totalCounterProfit),
    expensesGrowth: calculateGrowth(currentYearSummary.totalExpenses, previousYearSummary.totalExpenses),
    netProfitGrowth: calculateGrowth(currentYearSummary.netProfit, previousYearSummary.netProfit),
    totalSaleGrowth: calculateGrowth(currentYearSummary.totalSale, previousYearSummary.totalSale),
    totalVatGrowth: calculateGrowth(currentYearSummary.totalVat, previousYearSummary.totalVat)
  };
  return {
    currentYearData: mergedWithGrowth, previousYearData: mergedPreviousYear,
    summary: { currentYearSummary, previousYearSummary, growth: summaryGrowth }
  }
}

const customerRepData = async (start_date, end_date) => {
  const { startDate, endDate } = parseStartEndDateRange(start_date, end_date);
  const end = new Date(endDate);
  const pipeline = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    {
      $group: {
        _id: { rep: "$customer_sales_rep", customer: "$customer" },
        lastOrderDate: { $max: "$invoice_date" },
        totalSales: { $sum: "$total_incl_vat" },
        ordersCount: { $sum: 1 },
        avgOrderValue: { $avg: "$total_incl_vat" },
      }
    },
    {
      $lookup: {
        from: "customers",
        localField: "_id.customer",
        foreignField: "_id",
        as: "customerInfo"
      }
    },
    {
      $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        rep: "$_id.rep",
        customerId: "$_id.customer",
        customerName: "$customerInfo.customer_name",
        totalSales: 1,
        ordersCount: 1,
        lastOrderDate: 1,
        avgOrderValue: 1,
      }
    },
    { $sort: { rep: 1, customerName: 1 } },
    {
      $group: {
        _id: "$rep",
        customers: {
          $push: {
            customerId: "$customerId",
            customerName: "$customerName",
            totalSales: "$totalSales",
            ordersCount: "$ordersCount",
            lastOrderDate: "$lastOrderDate",
            avgOrderValue: "$avgOrderValue",
          }
        }
      }
    }
  ];
  const productAgg = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          rep: "$customer_sales_rep",
          customer: "$customer",
          product: "$items._id"
        },
        productName: { $first: "$items.name" },
        totalQty: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum:{$add:[{$multiply:["$items.quantity", "$items.rate"]},{$multiply:["$items.quantity","$items.rate", {$divide:["$items.tax", 100]}]}]}
        },
        lastOrderDate: { $max: "$invoice_date" }
      }
    },
    {
      $group: {
        _id: { rep: "$_id.rep", customer: "$_id.customer" },
        products: {
          $push: {
            productId: "$_id.product",
            name: "$productName",
            totalQty: "$totalQty",
            totalRevenue: "$totalRevenue",
            lastOrderDate: "$lastOrderDate"
          }
        }
      }
    },
    {
      $group: {
        _id: "$_id.rep",
        customers: {
          $push: {
            customerId: "$_id.customer",
            products: "$products"
          }
        }
      }
    }
  ];
  const ordersAgg = [
    { $match: { invoice_date: { $gte: startDate, $lte: endDate } } },
    ...excludeCancelledInvoices(),
    { $addFields: { customer_sales_rep: { $toString: "$customer_sales_rep" } } },
    {
      $group: {
        _id: {
          rep: "$customer_sales_rep",
          customer: "$customer",
          invoice: "$_id"
        },
        invoice_date: { $first: "$invoice_date" },
        total_incl_vat: { $first: "$total_incl_vat" },
        itemsCount: { $sum: { $size: "$items" } }
      }
    },
    {
      $group: {
        _id: { rep: "$_id.rep", customer: "$_id.customer" },
        orders: {
          $push: {
            invoiceId: "$_id.invoice",
            invoice_date: "$invoice_date",
            total_incl_vat: "$total_incl_vat",
            itemsCount: "$itemsCount"
          }
        }
      }
    },
    {
      $group: {
        _id: "$_id.rep",
        customers: {
          $push: {
            customerId: "$_id.customer",
            orders: "$orders"
          }
        }
      }
    }
  ];
  const [baseResult, currentProducts, customerOrders] = await Promise.all([
    InvoiceModel.aggregate(pipeline),
    InvoiceModel.aggregate(productAgg),
    InvoiceModel.aggregate(ordersAgg)
  ]);
  const reps = baseResult.map(rep => {
    const repProducts = currentProducts.find(r => r._id === rep._id)?.customers || [];
    const repOrders = customerOrders.find(r => r._id === rep._id)?.customers || [];

    const customerWithFlags = rep.customers.map(cust => {
      const lastOrder = new Date(cust.lastOrderDate);
      const diffDays = (end - lastOrder) / (1000 * 60 * 60 * 24);
      let custProducts =
        repProducts.find(
          cp =>
            cp.customerId &&
            cust.customerId &&
            cp.customerId.toString() === cust.customerId.toString()
        )?.products || [];
      custProducts = custProducts.map(p => {
        const lastProductOrder = new Date(p.lastOrderDate);
        const diffDaysProduct =
          (end - lastProductOrder) / (1000 * 60 * 60 * 24);
        return {
          ...p,
          inActiveProduct7Days: diffDaysProduct > 7,
          inActiveProduct14Days: diffDaysProduct > 14
        };
      });
      custProducts.sort((a, b) => b.totalQty - a.totalQty);
      const custOrders =
        repOrders.find(
          co => co.customerId?.toString() === cust.customerId?.toString()
        )?.orders || [];

      return {
        ...cust,
        inActive7Days: diffDays > 7,
        inActive14Days: diffDays > 14,
        products: custProducts,
        orders: custOrders
      };
    });
    customerWithFlags.sort((a, b) => b.totalSales - a.totalSales);
    return { rep: rep._id, customers: customerWithFlags };
  });

  return reps;
};

module.exports = {
  dashboardData,
  salesRespData,
  productData,
  orderReportData,
  businessReportData,
  customerRepData,
};
