const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Public
exports.getTasks = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Public
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate({
      path: 'assignee',
      select: 'name initials role',
    });

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Create task
// @route   POST /api/v1/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user id to req.body
  req.body.user = req.user.id;

  const task = await Task.create(req.body);

  res.status(201).json({
    success: true,
    data: task,
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get tasks by project
// @route   GET /api/v1/projects/:projectId/tasks
// @access  Public
exports.getTasksByProject = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { project: req.params.projectId };
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tasks.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: tasks,
  });
});

// @desc    Get tasks by assignee
// @route   GET /api/v1/tasks/assignee/:assigneeId
// @access  Public
exports.getTasksByAssignee = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { assignee: req.params.assigneeId };
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tasks.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: tasks,
  });
});

// @desc    Get tasks by status
// @route   GET /api/v1/tasks/status/:status
// @access  Public
exports.getTasksByStatus = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { status: req.params.status };
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tasks.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: tasks,
  });
});

// @desc    Get tasks by priority
// @route   GET /api/v1/tasks/priority/:priority
// @access  Public
exports.getTasksByPriority = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const query = { priority: req.params.priority };
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query).skip(skip).limit(limit).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tasks.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: tasks,
  });
});