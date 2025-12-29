const express = require("express");
const { checkAuthorizationHeaders, authenticateUser } = require("../../middlewares/authenticate");
const { validateRequestBody } = require("../../middlewares/validateRequestBody");
const { submitFile, checkSubmitRequest } = require("../../controllers/user/submission");
const upload = require("../../config/multerUpload");
const router = express.Router({ mergeParams: true });

router.route("/").post(
  checkAuthorizationHeaders,
  validateRequestBody,
  authenticateUser,

  // 1. Upload the file first
  upload.fields([{ name: "submission_file", maxCount: 1 }]),

  // 2. FIX: Manually tell the validator the file exists
  (req, res, next) => {
    if (req.files && req.files.submission_file) {
      req.body.submission_file = "attached"; // Dummy text to pass validation
    }
    next();
  },

  checkSubmitRequest,
  validateRequestBody,
  submitFile
);

module.exports = router;