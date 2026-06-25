const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const logger = require('../utils/logger');

// Magic byte signatures for file validation
const MAGIC_BYTES = [
  { sig: [0xFF, 0xD8, 0xFF], name: 'JPEG' },
  { sig: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], name: 'PNG' },
  { sig: [0x47, 0x49, 0x46, 0x38], name: 'GIF' },
  { sig: [0x25, 0x50, 0x44, 0x46], name: 'PDF' },
];

// WebP signature: RIFF at 0-3, WEBP at 8-11
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_WEBP = [0x57, 0x45, 0x42, 0x50];

function isValidFileType(filepath) {
  const fd = fsSync.openSync(filepath, 'r');
  const buffer = Buffer.alloc(12);
  fsSync.readSync(fd, buffer, 0, 12, 0);
  fsSync.closeSync(fd);

  // Check standard signatures
  for (const { sig, name } of MAGIC_BYTES) {
    if (buffer.slice(0, sig.length).equals(Buffer.from(sig))) return true;
  }

  // Check WebP (RIFF + WEBP)
  if (
    buffer.slice(0, 4).equals(Buffer.from(WEBP_RIFF)) &&
    buffer.slice(8, 12).equals(Buffer.from(WEBP_WEBP))
  ) return true;

  return false;
}

// @desc    Upload files
// @route   POST /api/v1/uploads/:category
// @access  Private
exports.uploadFiles = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('Please upload at least one file', 400));
  }

  const { category } = req.params;
  const validCategories = ['projects', 'plots', 'kyc', 'general'];

  if (!validCategories.includes(category)) {
    return next(new ErrorResponse(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400));
  }

  // Validate magic bytes for each uploaded file
  for (const file of req.files) {
    const filepath = path.join(__dirname, '..', 'uploads', category, file.filename);
    if (!isValidFileType(filepath)) {
      // Clean up the invalid file
      try { await fs.unlink(filepath); } catch { /* ignore cleanup error */ }
      return next(new ErrorResponse(`Invalid file content: ${file.originalname} does not match declared type`, 400));
    }
  }

  const files = req.files.map((file) => ({
    id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    category,
    path: `/uploads/${category}/${file.filename}`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user.id,
  }));

  res.status(201).json({
    success: true,
    count: files.length,
    data: files,
  });
});

// @desc    Get all uploaded files for a category
// @route   GET /api/v1/uploads/:category
// @access  Private
exports.getFiles = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const uploadDir = path.join(__dirname, '..', 'uploads', category);

  try {
    await fs.access(uploadDir);
  } catch {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }

  const entries = await fs.readdir(uploadDir);
  const files = entries.filter((f) => f !== '.gitkeep');

  const fileList = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(uploadDir, filename);
      const stats = await fs.stat(filePath);
      return {
        filename,
        size: stats.size,
        uploadedAt: stats.birthtime.toISOString(),
        path: `/uploads/${category}/${filename}`,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: fileList.length,
    data: fileList,
  });
});

// @desc    Delete an uploaded file
// @route   DELETE /api/v1/uploads/:category/:filename
// @access  Private
exports.deleteFile = asyncHandler(async (req, res, next) => {
  const { category, filename } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', category, filename);

  try {
    await fs.access(filePath);
  } catch {
    return next(new ErrorResponse('File not found', 404));
  }

  await fs.unlink(filePath);

  res.status(200).json({
    success: true,
    data: {},
  });
});
