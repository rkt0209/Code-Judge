const express = require("express");
const router = express.Router();
const upload = require("../../config/multerUpload");

// 🟢 IMPORT BOTH MIDDLEWARES
const { 
  checkAuthorizationHeaders, 
  authenticateAdmin 
} = require("../../middlewares/authenticate");

const { createQuestion } = require("../../controllers/admin/question.js");

router.post(
  "/create",

  // 1. First: Check if Token exists and decode it
  checkAuthorizationHeaders,

  // 2. Second: Check if that Token belongs to an Admin
  authenticateAdmin,
  
  // 3. Third: Handle File Uploads
  upload.fields([
    { name: "input_file", maxCount: 1 },
    { name: "solution_file", maxCount: 1 },
    { name: "content_file", maxCount: 1 }
  ]),
  
  // 4. Finally: Run the Controller
  createQuestion
);

module.exports = router;