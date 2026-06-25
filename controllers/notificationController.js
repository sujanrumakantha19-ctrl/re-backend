const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../models/Notification');

// @desc    Get all notifications
// @route   GET /api/v1/notifications
// @access  Public
exports.getNotifications = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single notification
// @route   GET /api/v1/notifications/:id
// @access  Public
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Create notification
// @route   POST /api/v1/notifications
// @access  Private
exports.createNotification = asyncHandler(async (req, res, next) => {
  // Add user id to req.body
  req.body.user = req.user.id;

  const notification = await Notification.create(req.body);

  res.status(201).json({
    success: true,
    data: notification,
  });
});

// @desc    Update notification
// @route   PUT /api/v1/notifications/:id
// @access  Private
exports.updateNotification = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  notification = await Notification.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get unread notifications
// @route   GET /api/v1/notifications/unread
// @access  Public
exports.getUnreadNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { isRead: false, $or: [{ userId: req.user.id }, { userId: { $exists: false } }, { userId: null }] };
  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: notifications.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: notifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read/all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });

  res.status(200).json({
    success: true,
    data: {},
  });
});