const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator");

router.put(
  "/",
  isAuth,
  [body("status").trim().not().isEmpty()],
  statusController.updateStatus
);

router.get("/", isAuth, statusController.getStatus);

module.exports = router;
