const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Plot = require('../models/Plot');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// @desc    Get all plots
// @route   GET /api/v1/plots
// @access  Public
exports.getPlots = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single plot
// @route   GET /api/v1/plots/:id
// @access  Public
exports.getPlot = asyncHandler(async (req, res, next) => {
  const plot = await Plot.findById(req.params.id)
    .populate({
      path: 'projectId',
      select: 'name location status',
    });

  if (!plot) {
    return next(new ErrorResponse(`Plot not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: plot,
  });
});

// @desc    Create plot
// @route   POST /api/v1/plots
// @access  Private
exports.createPlot = asyncHandler(async (req, res, next) => {
  try {
    // Add project id to req.body if provided in params
    if (req.params.projectId) {
      req.body.projectId = req.params.projectId;
    }

    const plot = await Plot.create(req.body);

    res.status(201).json({
      success: true,
      data: plot,
    });
  } catch (error) {
    // If validation fails or duplicate key, return 400
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    // Otherwise pass to standard error handler
    return next(error);
  }
});

// @desc    Update plot
// @route   PUT /api/v1/plots/:id
// @access  Private
exports.updatePlot = asyncHandler(async (req, res, next) => {
  let plot = await Plot.findById(req.params.id);

  if (!plot) {
    return next(new ErrorResponse(`Plot not found with id of ${req.params.id}`, 404));
  }

  plot = await Plot.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: plot,
  });
});

// @desc    Book a plot (staff → Pending, admin → Booked)
// @route   PUT /api/v1/plots/:id/book
// @access  Private (staff + admin)
exports.bookPlot = asyncHandler(async (req, res, next) => {
  const isStaffBooking = req.user.role === 'staff';
  const update = isStaffBooking
    ? {
        status: 'Pending',
        pendingApproval: {
          leadId: req.body.leadId,
          customerName: req.body.customerName,
          phone: req.body.phone,
          requestedBy: req.user.name,
          requestedAt: new Date().toISOString().split('T')[0],
          paymentStatus: req.body.paymentStatus || 'Not Paid',
          notes: req.body.notes || '',
        },
      }
    : {
        status: 'Booked',
        bookedBy: {
          name: req.body.customerName,
          phone: req.body.phone,
          paymentStatus: req.body.paymentStatus || 'Not Paid',
          type: 'customer',
        },
      };

  const plot = await Plot.findOneAndUpdate(
    { _id: req.params.id, status: 'Available' },
    update,
    { new: true, runValidators: true }
  );

  if (!plot) {
    return next(new ErrorResponse('Plot not found or already booked', 400));
  }

  // Create notification for all admins if this was requested by staff
  if (isStaffBooking) {
    try {
      const project = await Project.findById(plot.projectId);
      const projectName = project ? project.name : 'Project';
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          type: 'booking',
          userId: admin._id,
          entityId: `${plot.projectId}:${plot._id}`,
          entityType: 'Project',
          message: `New booking request for Plot #${plot.plotNumber} in ${projectName} by ${req.user.name}`,
          actorName: req.user.name,
          isToday: true,
          isRead: false
        });
      }
    } catch (notifErr) {
      console.error('Failed to create booking notification:', notifErr);
    }
  }

  res.status(200).json({
    success: true,
    data: plot,
  });
});

// @desc    Approve a pending booking
// @route   PUT /api/v1/plots/:id/approve
// @access  Private (admin only)
exports.approveBooking = asyncHandler(async (req, res, next) => {
  const plot = await Plot.findById(req.params.id);
  if (!plot) return next(new ErrorResponse('Plot not found', 404));
  if (plot.status !== 'Pending' || !plot.pendingApproval) {
    return next(new ErrorResponse('No pending approval for this plot', 400));
  }

  const approval = plot.pendingApproval;
  plot.status = 'Booked';
  plot.bookedBy = {
    name: approval.customerName,
    phone: approval.phone,
    paymentStatus: approval.paymentStatus || 'Not Paid',
    type: 'customer',
  };
  plot.pendingApproval = undefined;
  await plot.save();

  res.status(200).json({ success: true, data: plot });
});

// @desc    Reject a pending booking
// @route   PUT /api/v1/plots/:id/reject
// @access  Private (admin only)
exports.rejectBooking = asyncHandler(async (req, res, next) => {
  const plot = await Plot.findById(req.params.id);
  if (!plot) return next(new ErrorResponse('Plot not found', 404));
  if (plot.status !== 'Pending' || !plot.pendingApproval) {
    return next(new ErrorResponse('No pending approval for this plot', 400));
  }

  plot.status = 'Available';
  plot.pendingApproval = undefined;
  await plot.save();

  res.status(200).json({ success: true, data: plot });
});

// @desc    Get all plots with pending approval (global)
// @route   GET /api/v1/plots/pending-approvals
// @access  Private (admin only)
exports.getPendingApprovals = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = (page - 1) * limit;
  const query = { status: 'Pending', pendingApproval: { $exists: true } };
  const total = await Plot.countDocuments(query);
  const plots = await Plot.find(query)
    .populate({ path: 'projectId', select: 'name location' })
    .skip(skip).limit(limit).sort('-pendingApproval.requestedAt');

  res.status(200).json({
    success: true,
    count: plots.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: plots,
  });
});

// @desc    Delete plot
// @route   DELETE /api/v1/plots/:id
// @access  Private
exports.deletePlot = asyncHandler(async (req, res, next) => {
  const plot = await Plot.findById(req.params.id);

  if (!plot) {
    return next(new ErrorResponse(`Plot not found with id of ${req.params.id}`, 404));
  }

  await plot.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get plots by project
// @route   GET /api/v1/projects/:projectId/plots
// @access  Public
exports.getPlotsByProject = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = (page - 1) * limit;
  const query = { projectId: req.params.projectId };
  const total = await Plot.countDocuments(query);
  const plots = await Plot.find(query).skip(skip).limit(limit).sort('plotNumber');

  res.status(200).json({
    success: true,
    count: plots.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: plots,
  });
});

// @desc    Get plots by status
// @route   GET /api/v1/plots/status/:status
// @access  Public
exports.getPlotsByStatus = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = (page - 1) * limit;
  const query = { status: req.params.status };
  const total = await Plot.countDocuments(query);
  const plots = await Plot.find(query).skip(skip).limit(limit).sort('plotNumber');

  res.status(200).json({
    success: true,
    count: plots.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: plots,
  });
});

// @desc    Get plot pending approval details
// @route   GET /api/v1/plots/:id/pending-approval
// @access  Private
exports.getPlotPendingApproval = asyncHandler(async (req, res, next) => {
  const plot = await Plot.findById(req.params.id);

  if (!plot) {
    return next(new ErrorResponse(`Plot not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: plot.pendingApproval || null,
  });
});