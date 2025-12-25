const express = require("express");
const router = express.Router();

const userAuth = require("./user/auth");
const adminAuth = require("./admin/auth");

// Mount Auth Routes
router.use("/user/auth", userAuth);
router.use("/admin/auth", adminAuth);

module.exports = router;