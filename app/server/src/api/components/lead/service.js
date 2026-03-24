const { getDateRangeFilter } = require('../../../utils/crmUtility');
const leadModel = require('./model');
const activityModel = require('../activity/model');
const opportunityModel = require('../opportunity/model');
const mongoose = require("mongoose");

const checkLead = async(query = {}) => { return await leadModel.exists(query);};
const getAllLeads = async (start_date, end_date) => {
    const filter = getDateRangeFilter(start_date, end_date);
    return await leadModel.find(filter).sort({createdAt: -1}).populate('assigned_to', 'name').populate('opportunities').populate('activities');
};
const getOnlyLeads = async () => {
    return await leadModel.find().select("customer_name phone").sort({createdAt: -1});
}
const getSingleLead = async (id) => {
    const lead = await leadModel.findById(id).populate('assigned_to', 'name').populate('opportunities').populate('activities');
    if (!lead) throw new Error("lead does not exist");
    return lead;
};
const createNewLead = async (lead) => { return await leadModel.create(lead);}
const updateLead = async (id, lead) => {
    const updatedLead = await leadModel.findByIdAndUpdate(id, lead, { new: true, runValidators: true });
    if (!updatedLead) throw new Error('lead does not exit');
    return updatedLead
}
const deleteLead = async (id) => {
    const lead = await leadModel.findById(id);
    if(!lead) throw new Error("lead not found");
    await opportunityModel.deleteMany({lead: id});
    await activityModel.deleteMany({lead: id})
    await leadModel.findByIdAndDelete(id);
    return lead
}
const getAllLeadOfSingleRep = async (start_date, end_date, repId = null, page = 1, limit = 5) => {
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 5;
    const dateFilter = getDateRangeFilter(start_date, end_date);
    const leadMatch = {};
    if (Object.keys(dateFilter).length > 0) {Object.assign(leadMatch, dateFilter);}
    if (repId) {
        if (!mongoose.Types.ObjectId.isValid(repId)) {
            throw new Error('Invalid repId');
        }
        leadMatch.assigned_to = new mongoose.Types.ObjectId(repId);
    }
    const skip = (page - 1) * limit;
    const pipeline = [
        { $match: leadMatch },
        {
            $lookup: {
                from: 'opportunity',
                let: { leadId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$lead', '$$leadId'] } } },
                    { $sort: { createdAt: -1 } }
                ],
                as: 'opportunities'
            }
        },
        {
            $lookup: {
                from: 'activity',
                let: { leadId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$lead', '$$leadId'] } } },
                    { $sort: { createdAt: -1 } }
                ],
                as: 'activities'
            }
        },
        {
            $lookup: {
                from: 'customerSalesRep',
                localField: 'assigned_to',
                foreignField: '_id',
                as: 'repInfo'
            }
        },
        {
            $addFields: {
                latestOpportunity: { $arrayElemAt: ['$opportunities', 0] },
                repName: { $arrayElemAt: ['$repInfo.name', 0] }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        }
    ];
    const result = await leadModel.aggregate(pipeline);
    const metadata = result[0].metadata[0] || { total: 0 };
    const leads = result[0].data;
    const formattedLeads = leads.map(lead => ({
        id: lead._id,
        customer_name: lead.customer_name,
        contact_name: lead.contact_name,
        phone: lead.phone,
        email: lead.email,
        lead_source: lead.lead_source,
        assigned_to: lead.assigned_to || null,
        assignedToName: lead.repName || null,
        customer: lead.customer,
        notes: lead.notes,
        createdAt: lead.createdAt,
        stage: lead.latestOpportunity?.stage || null,
        expected_close_date: lead.latestOpportunity?.expected_close_date || null,
        opportunities: lead.opportunities,
        activities: lead.activities
    }));
    return {
        data: formattedLeads,
        pagination: {
            page,
            limit,
            total: metadata.total,
            totalPages: Math.ceil(metadata.total / limit)
        }
    };
};
module.exports = {
    getAllLeads,
    getSingleLead,
    createNewLead,
    updateLead,
    deleteLead,
    getAllLeadOfSingleRep,
    checkLead,
    getOnlyLeads,
};
