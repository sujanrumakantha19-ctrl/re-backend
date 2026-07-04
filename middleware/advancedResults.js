const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const mongoSanitize = require('mongo-sanitize');

const advancedResults = (model, populate, searchFields = []) => asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc.)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

  let parsedQuery = JSON.parse(queryStr);

  // Sanitize against NoSQL injection
  parsedQuery = mongoSanitize(parsedQuery);

  // Search
  if (req.query.search && searchFields && searchFields.length > 0) {
    const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    parsedQuery.$or = searchFields.map(field => ({
      [field]: { $regex: escapedSearch, $options: 'i' }
    }));
  }

  // Finding resource
  query = model.find(parsedQuery);

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(parsedQuery);

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    total,
    pagination,
    data: results,
  };

  next();
});

module.exports = advancedResults;