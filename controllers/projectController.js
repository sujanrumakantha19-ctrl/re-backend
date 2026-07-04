const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/v1/projects
// @access  Public
exports.getProjects = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single project
// @route   GET /api/v1/projects/:id
// @access  Public
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('availablePlots');

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Create project
// @route   POST /api/v1/projects
// @access  Private/Admin
exports.createProject = asyncHandler(async (req, res, next) => {
  // Add user id to req.body
  req.body.user = req.user.id;

  const project = await Project.create(req.body);

  if (project.totalPlots > 0) {
    const Plot = require('../models/Plot');
    const plotsToCreate = [];
    for (let i = 1; i <= project.totalPlots; i++) {
      plotsToCreate.push({
        projectId: project._id,
        plotNumber: String(i),
        status: 'Available',
        size: project.plotSize || 200,
        sizeUnit: project.plotSizeUnit || 'Sq Yards',
      });
    }
    await Plot.insertMany(plotsToCreate);
  }

  res.status(201).json({
    success: true,
    data: project,
  });
});

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private/Admin
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is project owner
  // In a real app, you would check if the user owns the project or is admin
  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Private/Admin
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }

  // Cascade cleanup: delete associated plots
  const Plot = require('../models/Plot');
  await Plot.deleteMany({ projectId: project._id });

  await project.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get all unique project locations
// @route   GET /api/v1/projects/locations
// @access  Public
exports.getProjectLocations = asyncHandler(async (req, res, next) => {
  const locations = await Project.distinct('location');

  res.status(200).json({
    success: true,
    data: locations.filter(loc => loc != null && loc.trim() !== ''),
  });
});

// @desc    Sync missing plots for all projects
// @route   POST /api/v1/projects/sync-plots
// @access  Private/Admin
exports.syncProjectPlots = asyncHandler(async (req, res, next) => {
  const Plot = require('../models/Plot');
  const projects = await Project.find();
  
  let totalPlotsCreated = 0;
  const syncedProjects = [];

  for (const project of projects) {
    if (project.totalPlots > 0) {
      const existingPlotsCount = await Plot.countDocuments({ projectId: project._id });
      
      if (existingPlotsCount < project.totalPlots) {
        const plotsToCreate = [];
        for (let i = existingPlotsCount + 1; i <= project.totalPlots; i++) {
          plotsToCreate.push({
            projectId: project._id,
            plotNumber: String(i),
            status: 'Available',
            size: project.plotSize || 200,
            sizeUnit: project.plotSizeUnit || 'Sq Yards',
          });
        }
        
        if (plotsToCreate.length > 0) {
          await Plot.insertMany(plotsToCreate);
          totalPlotsCreated += plotsToCreate.length;
          syncedProjects.push({
            projectId: project._id,
            projectName: project.name,
            plotsAdded: plotsToCreate.length
          });
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully synced ${totalPlotsCreated} missing plots.`,
    data: syncedProjects
  });
});