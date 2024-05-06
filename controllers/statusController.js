const User = require("../models/user");

const { validationResult } = require("express-validator");

const updateStatus = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Could not find user");
        error.statusCode = 404;
        throw error;
      }

      user.status = req.body.status;
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Status changed." });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Could not find user");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

module.exports = { updateStatus, getStatus };
