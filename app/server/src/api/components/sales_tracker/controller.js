const SERVICE_TRACKORDER = require('./service');


const dashboardData  = async (req, res, next) => {  
    try {        
        const {start_date, end_date} = req.query;
        res.status(200).json(await SERVICE_TRACKORDER.dashboardData(start_date, end_date));
    } catch (e) {next(e);}
};

const salesRepData  = async (req, res, next) => {  
    try {        
        const {start_date, end_date} = req.query;  
        res.status(200).json(await SERVICE_TRACKORDER.salesRespData(start_date, end_date));
    } catch (e) {next(e);}
};

const productData  = async (req, res, next) => {    
    try {   
        const {start_date, end_date} = req.query;     
        res.status(200).json(await SERVICE_TRACKORDER.productData(start_date, end_date));
    } catch (e) {next(e);}
};

const orderReportData  = async (req, res, next) => {    
    try {      
        const {start_date, end_date} = req.query;  
        res.status(200).json(await SERVICE_TRACKORDER.orderReportData(start_date, end_date));
    } catch (e) {next(e);}
};

const businessReportData  = async (req, res, next) => {    
    try {    
        const {start_date, end_date} = req.query;    
        res.status(200).json(await SERVICE_TRACKORDER.businessReportData(start_date, end_date));
    } catch (e) {next(e);}
};

const customerRepData  = async (req, res, next) => {    
    try {     
        const {start_date, end_date} = req.query;   
        res.status(200).json(await SERVICE_TRACKORDER.customerRepData(start_date, end_date));
    } catch (e) {next(e);}
};

module.exports = { 
    dashboardData,  
    salesRepData, 
    productData, 
    orderReportData,
    businessReportData,
    customerRepData,
};

