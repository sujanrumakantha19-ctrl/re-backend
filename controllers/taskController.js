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

  // Check if comments are being updated (a new comment is added)
  const oldCommentsCount = task.comments ? task.comments.length : 0;
  const newCommentsCount = req.body.comments ? req.body.comments.length : 0;
  const commentAdded = newCommentsCount > oldCommentsCount;

  const allowedFields = {
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    assignee: req.body.assignee,
    assigneeInitials: req.body.assigneeInitials,
    dueDate: req.body.dueDate,
    dueTime: req.body.dueTime,
    project: req.body.project,
    comments: req.body.comments,
  };

  Object.keys(allowedFields).forEach(key => allowedFields[key] === undefined && delete allowedFields[key]);

  task = await Task.findByIdAndUpdate(req.params.id, allowedFields, {
    returnDocument: 'after',
    runValidators: true,
  });

  // If a comment was added, send notification
  if (commentAdded) {
    const Notification = require('../models/Notification');
    const User = require('../models/User');

    if (req.user.role === 'staff') {
      // Notify all admins
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          type: 'task_assigned',
          userId: admin._id,
          entityId: task._id.toString(),
          entityType: 'Task',
          message: `Staff member ${req.user.name} commented on task: "${task.title}"`,
          actorName: req.user.name,
          isToday: true,
          isRead: false,
        });
      }
    } else if (req.user.role === 'admin') {
      // Notify the task's assignee if it's a staff member
      if (task.assignee) {
        const assigneeUser = await User.findById(task.assignee);
        if (assigneeUser && assigneeUser.role === 'staff') {
          await Notification.create({
            type: 'task_assigned',
            userId: assigneeUser._id,
            entityId: task._id.toString(),
            entityType: 'Task',
            message: `Admin ${req.user.name} commented on task: "${task.title}"`,
            actorName: req.user.name,
            isToday: true,
            isRead: false,
          });
        }
      }
    }
  }

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