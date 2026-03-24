const OrderMap =require("./model");
const SERVICE_ORDERMAPDATA = require('./service');

const buildQuery = (req) => {
    const {start_date, end_date} = req.query;
    const QUERY = {};
    if(start_date || end_date) {QUERY.date = {};}
    if(start_date){QUERY.date.$gte = new Date(start_date); }
    if(end_date){QUERY.date.$lte = new Date(end_date); }
    return QUERY;
};

const fetchOrderMapData  = async (req, res, next) => {    
    try {        
        res.status(200).json(await SERVICE_ORDERMAPDATA.fetchOrderMapData(buildQuery(req)));
    } catch (e) {next(e);}
};
const updateRoute = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_ORDERMAPDATA.updateRoute(req.params.id, req.body));
    } catch (e) {next(e);}
};
const unassignedroute = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_ORDERMAPDATA.unAssignedRoute(buildQuery(req)));
    } catch (e) {next(e)}
}

module.exports = { 
    fetchOrderMapData,  
    updateRoute,
    unassignedroute, 
};

