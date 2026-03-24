const OrderMap = require("./model");
const mongoose = require("mongoose");
const Invoice = require("../invoice/model");

const fetchOrderMapData = (query = {}, projection = {}, sort = { _id: -1 }, limit = 1) => {
  return OrderMap.find(query, projection).sort(sort).limit(limit).populate('vehicle_routes.vehicle_id', 'name');
}
const updateRoute = async (id, data) => {
  const find_route = await OrderMap.findById(id);
  if (!find_route) {
    throw new Error("Route not found");
  }
  let order_zones = []
  const sanitizedVehicleRoutes = data.merged.map((route) => {
    route.stops.forEach((stop, stopIndex)=>{
      if(stop.type === 'delivery'){
        const originalOrderIds = stop.original_order_ids || [];
        const zoneLabel = `${route.zone}(${stopIndex})`;
        originalOrderIds.forEach((orderId)=>{
          order_zones.push({
            zone: zoneLabel, order_id: orderId,
          })
        })
      }
    });
    return {
      vehicle_id: mongoose.Types.ObjectId(route.vehicle_id),
      distance_veh_km: route.distance_veh_km,
      total_weight_kg_veh: route.total_weight_kg_veh,
      zone: route.zone,
      stops: route.stops.map((stop) => {
        return {
          ...stop,
          customer_id: stop.customer_id ? mongoose.Types.ObjectId(stop.customer_id) : undefined,
          order_id: stop.order_id ? mongoose.Types.ObjectId(stop.order_id) : undefined,
        };
      }),
    };
  });
  const updateRouteZone = order_zones.map((item)=>({
    updateOne:{
      filter:{_id: mongoose.Types.ObjectId(item.order_id)}, update: {$set:{zone: item.zone}}
    }
  }));
  await Invoice.bulkWrite(updateRouteZone);
  const updateRoute = await OrderMap.findByIdAndUpdate(
    id,
    { $set: { vehicle_routes: sanitizedVehicleRoutes } },
    { new: true }
  );
  const bulkOps = [];
  for (const route of data.merged) {
    const zone = route.zone;
    for (const stop of route.stops) {
      if (stop.order_id) {
        bulkOps.push({ updateOne: { filter: { _id: stop.order_id }, update: { $set: { zone } } } })
      }
    }
  }
  if (bulkOps.length > 0) { await Invoice.bulkWrite(bulkOps) };
  const objectInvoiceIDs = data.unAssignedRouteIDs.map(id => mongoose.Types.ObjectId(id));
  await Invoice.updateMany({ _id: { $in: objectInvoiceIDs } }, { $set: { zone: "Not Assigned" } })
  return updateRoute;
};

const unAssignedRoute = async (req) => {
  let existingCustomerIDs = [];
  const assignedRoute = await fetchOrderMapData(req);
  assignedRoute[0].vehicle_routes.map((route) => {
    route.stops.forEach((stop) => {
      if (stop.type === "delivery") {
        existingCustomerIDs.push(stop.customer_id.toString());
      }
    })
  });
  const invoice_date = req.date
  const query = { invoice_date, in_person: false };
  const invoices_resp = await Invoice.find(query).populate({ path: 'customer', select: 'customer_name address latitude longitude' });
  const unAssignedInvoices = invoices_resp.filter((invoice) => {
    return !existingCustomerIDs.includes(invoice.customer._id.toString());
  });
  const sanitized_data = unAssignedInvoices.map((inv) => {
    const total_weight = inv.items.reduce((total, item) => {
      return total += (item.weight_kg || 1) * (item.quantity || 1)
    }, 0);
    return {
      'type': 'delivery',
      'order_id': inv._id,
      'customer_id': inv.customer._id,
      'cust_name': inv.customer.customer_name,
      'cust_address': inv.customer.address,
      'location': (inv.customer.latitude, inv.customer.longitude),
      'arrival_time': '0:00',
      'travel_time': '0min',
      'distance': 0,
      'departure_time': '0:00',
      'order_weight': total_weight,
      'veh_reg_no': "Not Assigned"

    }
  });
  return sanitized_data;
}
module.exports = {
  fetchOrderMapData,
  updateRoute,
  unAssignedRoute,
};

