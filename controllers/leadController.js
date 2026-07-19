const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Lead = require('../models/Lead');

// @desc    Get all leads
// @route   GET /api/v1/leads
// @access  Public
exports.getLeads = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single lead
// @route   GET /api/v1/leads/:id
// @access  Public
exports.getLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id)
    .populate({
      path: 'assignedTo',
      select: 'name initials role',
    })
    .populate({
      path: 'projectId',
      select: 'name location',
    })
    .populate({
      path: 'plotId',
      select: 'plotNumber status',
    });

  if (!lead) {
    return next(new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: lead,
  });
});

// @desc    Create lead
// @route   POST /api/v1/leads
// @access  Private
exports.createLead = asyncHandler(async (req, res, next) => {
  const allowedFields = {
    customerName: req.body.customerName,
    phone: req.body.phone,
    email: req.body.email,
    city: req.body.city,
    budgetMin: req.body.budgetMin,
    budgetMax: req.body.budgetMax,
    propertyInterest: req.body.propertyInterest,
    notes: req.body.notes,
    source: req.body.source,
    sourceType: req.body.sourceType,
    assignedTo: req.body.assignedTo,
    assignedToName: req.body.assignedToName,
    status: req.body.status,
    dateAdded: req.body.dateAdded,
    projectId: req.body.projectId,
    plotId: req.body.plotId,
    paymentStatus: req.body.paymentStatus,
    paymentMethod: req.body.paymentMethod,
    bank: req.body.bank,
    bankFollowerName: req.body.bankFollowerName,
    bankFollowerPhone: req.body.bankFollowerPhone,
    dob: req.body.dob,
    followUps: req.body.followUps,
  };

  Object.keys(allowedFields).forEach(key => allowedFields[key] === undefined && delete allowedFields[key]);

  const lead = await Lead.create(allowedFields);

  res.status(201).json({
    success: true,
    data: lead,
  });
});

// @desc    Update lead
// @route   PUT /api/v1/leads/:id
// @access  Private
exports.updateLead = asyncHandler(async (req, res, next) => {
  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404));
  }

  const allowedFields = {
    customerName: req.body.customerName,
    phone: req.body.phone,
    email: req.body.email,
    city: req.body.city,
    budgetMin: req.body.budgetMin,
    budgetMax: req.body.budgetMax,
    propertyInterest: req.body.propertyInterest,
    notes: req.body.notes,
    source: req.body.source,
    sourceType: req.body.sourceType,
    assignedTo: req.body.assignedTo,
    assignedToName: req.body.assignedToName,
    status: req.body.status,
    dateAdded: req.body.dateAdded,
    projectId: req.body.projectId,
    plotId: req.body.plotId,
    paymentStatus: req.body.paymentStatus,
    paymentMethod: req.body.paymentMethod,
    bank: req.body.bank,
    bankFollowerName: req.body.bankFollowerName,
    bankFollowerPhone: req.body.bankFollowerPhone,
    dob: req.body.dob,
    followUps: req.body.followUps,
  };

  Object.keys(allowedFields).forEach(key => allowedFields[key] === undefined && delete allowedFields[key]);

  lead = await Lead.findByIdAndUpdate(req.params.id, allowedFields, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: lead,
  });
});

// @desc    Delete lead
// @route   DELETE /api/v1/leads/:id
// @access  Private
exports.deleteLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404));
  }

  await lead.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get leads by project
// @route   GET /api/v1/projects/:projectId/leads
// @access  Public
exports.getLeadsByProject = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { projectId: req.params.projectId };
  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: leads.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: leads,
  });
});

// @desc    Get leads by status
// @route   GET /api/v1/leads/status/:status
// @access  Public
exports.getLeadsByStatus = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { status: req.params.status };
  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: leads.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: leads,
  });
});

// @desc    Get leads by assigned user
// @route   GET /api/v1/leads/user/:userId
// @access  Public
exports.getLeadsByUser = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { assignedTo: req.params.userId };
  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: leads.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: leads,
  });
});