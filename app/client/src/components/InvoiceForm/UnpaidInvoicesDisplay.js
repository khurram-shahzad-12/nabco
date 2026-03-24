import React from "react";
import moment from "moment";
import DataViewGrid from "../DataViewGrid/DataViewGrid";

const UnpaidInvoicesDisplay = props => {
    const {invoices, sendingData} = props;

    const getFormattedDate = params => {
        return moment(params.value).format("YYYY-MM-DD");
    };

    const getRemainingBalance = params => {
        return `£${(params.data.total_incl_vat - params.data.totalPaid).toFixed(2)}`;
    };

    const getTotalRemainingBalance = () => {
        return invoices.reduce((accumulator, currentInvoice) => {
            let remainingBalanceForInvoice = (currentInvoice.total_incl_vat - currentInvoice.totalPaid).toFixed(2);
            return (Number(accumulator) + Number(remainingBalanceForInvoice)).toFixed(2);
        }, 0);
    };

    const colDefs = [
        {
            field: "sale_number",
            headerName: "Invoice#",
            floatingFilter: false,
            filter: false
        },
        {
            field: "_id",
            headerName: "Balance",
            valueFormatter: getRemainingBalance,
            floatingFilter: false,
            filter: false,
            type: "rightAligned"
        },
        {
            field: "invoice_date",
            headerName: "Date",
            valueFormatter: getFormattedDate,
            floatingFilter: false,
            filter: false
        }
    ]

    return <div id={"unpaidInvoicesGridView"} style={{height: "90%", width: "100%"}}>
        TOTAL BALANCE TO PAY: £{getTotalRemainingBalance()}
        <DataViewGrid rowData={invoices} columnDefs={colDefs} loading={sendingData} />
    </div>;
};

export default UnpaidInvoicesDisplay;