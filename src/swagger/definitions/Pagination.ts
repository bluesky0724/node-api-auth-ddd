const Pagination = {
    type: 'object',
    properties: {
        limit: {
            type: 'integer',
        },
        total: {
            type: 'integer',
        },
        page: {
            type: 'integer',
        },
        pages: {
            type: 'integer',
        },
    },
};

export default Pagination;