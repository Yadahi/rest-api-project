const User = require("../models/user");

const { validationResult } = require("express-validator");

const updateStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Could not find user");
      error.statusCode = 404;
      throw error;
    }

    user.status = req.body.status;
    await user.save();

    res.status(200).json({ message: "Status changed." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Could not find user");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

module.exports = { updateStatus, getStatus };
