const { body } = require('express-validator');

exports.createLeadValidator = [
  body('name').trim().notEmpty().withMessage('Lead name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('project').trim().notEmpty().withMessage('Project is required'),
  body('source').trim().notEmpty().withMessage('Source is required'),
];
