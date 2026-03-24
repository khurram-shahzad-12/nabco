import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material"

const ExpandableContent = ({ data }) => {
    return (
        <>{data?.orders?.length > 0 && (
            <Box>
                <Typography variant="h6" my={2}>Order Detail</Typography>
                <Table><TableHead><TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ fontSize: 16, fontWeight: "bold" }}>Order Date</TableCell>
                    <TableCell sx={{ fontSize: 16, fontWeight: "bold" }}>Order Amount</TableCell>
                    <TableCell sx={{ fontSize: 16, fontWeight: "bold" }}>Items Count</TableCell>
                </TableRow></TableHead>
                    <TableBody>
                        {data.orders?.map((order, index) => (
                            <TableRow key={order.invoiceId || `order-${index}`}>
                                <TableCell sx={{ border: "1px solid white" }}>{new Date(order.invoice_date).toLocaleDateString()}</TableCell>
                                <TableCell sx={{ border: "1px solid white" }}>{order.total_incl_vat.toFixed(2)}</TableCell>
                                <TableCell sx={{ border: "1px solid white" }}>{order.itemsCount}</TableCell>
                            </TableRow>
                        ))}</TableBody></Table>
            </Box>
        )}
            {data?.products?.length > 0 && (
                <Box>
                    <Typography variant="h6" my={2}>Ordered Products</Typography>
                    <Table><TableHead><TableRow sx={{ bgcolor: "primary.main" }}>
                        <TableCell sx={{ fontSize: 16, fontWeight: "bold" }}>Product Name</TableCell>
                        <TableCell sx={{ fontSize: 16, fontWeight: "bold", }}>Ord Quantity</TableCell>
                        <TableCell sx={{ fontSize: 16, fontWeight: "bold", }}>Total Revenue</TableCell>
                        <TableCell sx={{ fontSize: 16, fontWeight: "bold", }}>Last Order Date</TableCell>
                        <TableCell sx={{ fontSize: 16, fontWeight: "bold", }}>InActive 7 Days</TableCell>
                        <TableCell sx={{ fontSize: 16, fontWeight: "bold", }}>InActive 14 Days</TableCell>
                    </TableRow></TableHead>
                        <TableBody>{data?.products.map((pro, index) => (
                            <TableRow key={pro.productId || `product-${index}`} sx={{ border: "1px solid white" }}>
                                <TableCell sx={{ border: "1px solid white" }}>{pro.name}</TableCell>
                                <TableCell sx={{ border: "1px solid white" }}>{pro.totalQty}</TableCell>
                                <TableCell sx={{ border: "1px solid white" }}>{pro.totalRevenue.toFixed(2)}</TableCell>
                                <TableCell sx={{ border: "1px solid white" }}>{new Date(pro.lastOrderDate).toLocaleDateString()}</TableCell>
                                <TableCell sx={{ border: "1px solid white", bgcolor: pro.inActiveProduct7Days ? "orange" : null }}>{pro.inActiveProduct7Days ? "Yes" : "No"}</TableCell>
                                <TableCell sx={{ border: "1px solid white", bgcolor: pro.inActiveProduct14Days ? "red" : null }}>{pro.inActiveProduct14Days ? "Yes" : "No"}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody></Table>
                </Box>
            )}
        </>
    )
}

export default ExpandableContent