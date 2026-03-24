const getDateRangeFilter = (start_date, end_date) => {
    const filter = {};
    if (start_date || end_date) {
        filter.createdAt = {};
        if (start_date) {
            const start = new Date(start_date);
            start.setHours(0, 0, 0, 0);
            filter.createdAt.$gte = start;
        }
        if (end_date) {
            const end = new Date(end_date);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }
    return filter;
}

module.exports = {
    getDateRangeFilter
}