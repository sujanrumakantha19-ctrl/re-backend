const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');
const validate = require('../validators/validate');
const { createUserValidator, updateUserValidator } = require('../validators/userValidators');

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createUserValidator, validate, createUser);

router
  .route('/:id')
  .get(getUser)
  .put(updateUserValidator, validate, updateUser)
  .delete(deleteUser);

module.exports = router;
