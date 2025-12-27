const express = require("express");
const upload = require("../../config/multerUpload");
const { checkAuthorizationHeaders, authenticateAdmin } = require("../../middlewares/authenticate");
const { validateRequestBody } = require("../../middlewares/validateRequestBody");
// Import deleteQuestion here
const { checkAddQuestionRequest, addQuestion, deleteQuestion } = require("../../controllers/admin/question"); 

const router = express.Router({ mergeParams: true });

// Route: /api/admin/question
router.route("/")
  .post(
    checkAuthorizationHeaders, 
    authenticateAdmin, 
    upload.fields([{ name: "solution_file", maxCount: 1 }, { name: "input_file", maxCount: 1 }]), 
    checkAddQuestionRequest, 
    validateRequestBody, 
    addQuestion
  );

// Route: /api/admin/question/:id  (Delete)
router.route("/:id")
  .delete(
    checkAuthorizationHeaders, 
    authenticateAdmin, 
    deleteQuestion
  );

module.exports = router;