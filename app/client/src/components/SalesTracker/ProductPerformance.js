import { Box, Grid, Paper, TablePagination } from "@mui/material";
import { defaultSnackState, getSalesTrackerData } from "../formFunctions/FormFunctions";
import { useEffect, useState, useMemo } from "react";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import AsidePanel from "./AsidePanel";
import ExpandableTable from "./ExpandableTable";
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

const ProductPerformance = ({ startOfDate, endOfDate, reload, setReload }) => {
  const [snackState, setSnackState] = useState(defaultSnackState);
  const [productData, setProductData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProductData = () => {
    getSalesTrackerData({
      url: `api/salestracker/productData?start_date=${startOfDate}&end_date=${endOfDate}`,
      setState: setProductData, setReload, setSearchTerm, setPage, setSnackState, onSuccess:(data)=>setProductData(data[0])
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [startOfDate, endOfDate, reload]);

  const filteredProducts = useMemo(() => {
    if (!productData?.topProducts) return [];
    return productData?.topProducts?.filter((p) =>
      p.name?.toLowerCase().includes(searchTerm?.toLowerCase())
    );
  }, [productData, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredProducts.slice(start, start + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const summary = productData?.summary?.[0] || {};
  const stats = [
    { label: "Total Orders", value: summary.totalOrders ?? 0, CardIcon: ShoppingCartIcon },
    { label: "Total Sales", value: summary.totalSales?.toLocaleString() ?? 0, CardIcon: PointOfSaleIcon },
    { label: "Active Customers", value: summary.activeCustomers ?? 0, CardIcon: AccountBoxIcon },
    { label: "Average Order Value", value: summary.avgOrderValue ? summary.avgOrderValue.toFixed(2) : "0.00", CardIcon:CurrencyExchangeIcon },
  ];
  return (
    <Box>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <ExpandableTable
              data={paginatedProducts}
              keyProp="productId"
              columns={[
                { header: "Product", field: "name" },
                { header: "Units Sold", field: "totalSoldAll", align: "right" },
                { header: "Product Profit", field: "totalAllProfit", align: "right", render: (data)=> `£ ${data.totalAllProfit.toLocaleString()}` },
                {
                  header: "Product Revenue", field: "totalRevenueAll", align: "right",
                  render: (data) => `£ ${data.totalRevenueAll.toLocaleString()}`
                }
              ]}
              expandableColumns={[
                { header: "Month", field: "month" },
                { header: "Monthly Total Sold", field: "totalSold", align: "right" },
                {
                  header: "Monthly Total Revenue (£)", field: "totalRevenue", align: "right",
                  render: (data) => `£ ${data.totalRevenue.toLocaleString()}`
                }
              ]}
              onRowClick={setSelectedProduct}
            />
            <TablePagination
              component="div"
              count={filteredProducts?.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Paper>
        </Grid>
        <AsidePanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stats={stats}
          label={"Search Products"}
          title={'Products Monthly Reveneue Range (£)'}
          legendPosition={'top'}
          labels={selectedProduct?.monthlySales?.map(s => s.month)}
          data={selectedProduct?.monthlySales?.map(s => s.totalRevenue)}
        />
      </Grid>
    </Box>
  );
};

export default ProductPerformance;



























