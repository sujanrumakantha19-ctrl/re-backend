const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Attendance = require('../models/Attendance');

// @desc    Get all attendance records
// @route   GET /api/v1/attendance
// @access  Public
exports.getAttendances = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single attendance record
// @route   GET /api/v1/attendance/:id
// @access  Public
exports.getAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate({
      path: 'staffId',
      select: 'name initials role',
    });

  if (!attendance) {
    return next(new ErrorResponse(`Attendance not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Create attendance record
// @route   POST /api/v1/attendance
// @access  Private
exports.createAttendance = asyncHandler(async (req, res, next) => {
  // Add user id to req.body
  req.body.user = req.user.id;

  const attendance = await Attendance.create(req.body);

  res.status(201).json({
    success: true,
    data: attendance,
  });
});

// @desc    Update attendance record
// @route   PUT /api/v1/attendance/:id
// @access  Private
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  let attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(new ErrorResponse(`Attendance not found with id of ${req.params.id}`, 404));
  }

  attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Delete attendance record
// @route   DELETE /api/v1/attendance/:id
// @access  Private
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(new ErrorResponse(`Attendance not found with id of ${req.params.id}`, 404));
  }

  await attendance.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get attendance by staff
// @route   GET /api/v1/attendance/staff/:staffId
// @access  Public
exports.getAttendanceByStaff = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const skip = (page - 1) * limit;
  const query = { staffId: req.params.staffId };
  const total = await Attendance.countDocuments(query);
  const attendance = await Attendance.find(query).skip(skip).limit(limit).sort('-date');

  res.status(200).json({
    success: true,
    count: attendance.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: attendance,
  });
});

// @desc    Get attendance by date
// @route   GET /api/v1/attendance/date/:date
// @access  Public
exports.getAttendanceByDate = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = (page - 1) * limit;
  const query = { date: req.params.date };
  const total = await Attendance.countDocuments(query);
  const attendance = await Attendance.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: attendance.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: attendance,
  });
});

// @desc    Get today's attendance
// @route   GET /api/v1/attendance/today
// @access  Public
exports.getTodayAttendance = asyncHandler(async (req, res, next) => {
  const today = new Date().toISOString().slice(0, 10);
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = (page - 1) * limit;
  const query = { date: today };
  const total = await Attendance.countDocuments(query);
  const attendance = await Attendance.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: attendance.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: attendance,
  });
});