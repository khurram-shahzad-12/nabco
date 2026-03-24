const opportunityModel = require("./model");
const leadModel = require("../lead/model");
const mongoose = require('mongoose');

const updateOpportunity = async (data) => {
    return await opportunityModel.findOneAndUpdate({ lead: data.lead }, data, { new: true, runValidators: true, upsert: true });
}

const dateFilter = (start_date, end_date) => {
    const leadDateFilter = {};
    if (start_date || end_date) {
        leadDateFilter["leadInfo.createdAt"] = {};
        if (start_date) { leadDateFilter["leadInfo.createdAt"].$gte = new Date(start_date); }
        if (end_date) { leadDateFilter["leadInfo.createdAt"].$lte = new Date(end_date); }
    }
    return leadDateFilter;
}
const stageLables = ["prospecting", "qualified", "proposal", "negotiation", "closed Win", "closed Lost"];
const basePipeline = () => ([
    { $match: { stage: { $ne: "not interested" } } },
    { $lookup: { from: "lead", localField: "lead", foreignField: "_id", as: "leadInfo" } },
    { $unwind: { path: "$leadInfo", preserveNullAndEmptyArrays: true } }
]);
const overallFacet = () => ([
    {
        $group: {
            _id: null,
            totalOpps: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ["$stage", "closed Win"] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ["$stage", "closed Lost"] }, 1, 0] } }
        }
    },
    { $project: { _id: 0, totalOpps: 1, won: 1, lost: 1, conversion: { $multiply: [{ $divide: ["$won", "$totalOpps"] }, 100] } } }
])
const byStageFacet = () => ([
    { $group: { _id: "$stage", count: { $sum: 1 } } },
    { $group: { _id: null, counts: { $push: { k: "$_id", v: "$count" } } } },
    {
        $project: {
            _id: 0,
            data: {
                $map: {
                    input: stageLables,
                    as: "stage",
                    in: {
                        $let: {
                            vars: { match: { $arrayElemAt: [{ $filter: { input: "$counts", cond: { $eq: ["$$this.k", "$$stage"] } } }, 0] } },
                            in: { $ifNull: ["$$match.v", 0] }
                        }
                    }
                }
            },
            labels: stageLables
        }
    }
])
const applyDashboardDefaults = (dashboard) => {
    if (!dashboard.overall || dashboard.overall.length === 0) {
        dashboard.overall = [{
            totalOpps: 0,
            won: 0,
            lost: 0,
            conversion: 0
        }];
    }
    if (!dashboard.byStage || dashboard.byStage.length === 0) {
        dashboard.byStage = [{
            data: [0, 0, 0, 0, 0, 0],
            labels: stageLables
        }];
    }
    return dashboard;
}
const buildLeadFilter = (start_date, end_date, repObjectId = null) => {
    const filter = {};
    if (start_date || end_date) {
        if (start_date) filter.createdAt = { $gte: new Date(start_date) };
        if (end_date) {
            if (!filter.createdAt) filter.createdAt = {};
            filter.createdAt.$lte = new Date(end_date);
        }
    }
    if (repObjectId) {
        filter.assigned_to = repObjectId;
    }
    return filter
}
const crmDashboard = async (start_date, end_date) => {
    const dateRange = dateFilter(start_date, end_date) || {};
    const pipeline = basePipeline();
    if (Object.keys(dateRange).length > 0) { pipeline.push({ $match: dateRange }); }
    pipeline.push({
        $facet: {
            overall: overallFacet(), byStage: byStageFacet(),
            repDetails: [
                { $match: { "leadInfo.assigned_to": { $ne: null } } },
                {
                    $group: {
                        _id: "$leadInfo.assigned_to",
                        opportunities: { $sum: 1 },
                        won: { $sum: { $cond: [{ $eq: ["$stage", "closed Win"] }, 1, 0] } },
                        lost: { $sum: { $cond: [{ $eq: ["$stage", "closed Lost"] }, 1, 0] } }
                    }
                },
                { $lookup: { from: "customerSalesRep", localField: "_id", foreignField: "_id", as: "repInfo" } },
                { $unwind: "$repInfo" },
                {
                    $lookup: {
                        from: "lead",
                        let: { repId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$assigned_to", "$$repId"] } } },
                            { $count: "leads" }
                        ],
                        as: "leadsCount"
                    }
                },
                { $addFields: { leads: { $ifNull: [{ $arrayElemAt: ["$leadsCount.leads", 0] }, 0] } } },
                {
                    $project: {
                        id: { $toString: "$_id" },
                        name: "$repInfo.name",
                        leads: 1,
                        opportunities: 1,
                        won: 1,
                        lost: 1,
                        conversion: {
                            $cond: [
                                { $gt: ["$opportunities", 0] },
                                { $multiply: [{ $divide: ["$won", "$opportunities"] }, 100] },
                                0
                            ]
                        }
                    }
                },
                { $sort: { conversion: -1 } },
                { $limit: 5 }
            ]
        }
    });
    const results = await opportunityModel.aggregate(pipeline);
    let dashboard = applyDashboardDefaults(results[0] || {});
    if (!dashboard.repDetails) {
        dashboard.repDetails = [];
    }
    const leadFilter = buildLeadFilter(start_date, end_date);
    dashboard.overall[0].totalLeads = await leadModel.countDocuments(leadFilter);
    return dashboard;
};

const teleSalesDashboard = async (start_date, end_date, repId = null) => {
    let repObjectId = null;
    if (repId && mongoose.Types.ObjectId.isValid(repId)) { repObjectId = new mongoose.Types.ObjectId(repId); }
    const dateRange = dateFilter(start_date, end_date)
    const pipeline = basePipeline();
    if (repObjectId) { pipeline.push({ $match: { "leadInfo.assigned_to": repObjectId } }); }
    if (Object.keys(dateRange).length > 0) { pipeline.push({ $match: dateRange }); }
    pipeline.push({
        $facet: {
            overall: overallFacet(),
            byStage: byStageFacet(),
        }
    });
    const results = await opportunityModel.aggregate(pipeline);
    let dashboard = applyDashboardDefaults(results[0] || {});
    const leadFilter = buildLeadFilter(start_date, end_date, repObjectId);
    dashboard.overall[0].totalLeads = await leadModel.countDocuments(leadFilter);
    return dashboard;
};
module.exports = {
    updateOpportunity,
    crmDashboard,
    teleSalesDashboard,
}