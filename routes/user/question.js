const express = require("express");
const { getAllQuestions, getQuestionById } = require("../../controllers/user/question");
const { checkAuthorizationHeaders, authenticateUser } = require("../../middlewares/authenticate");

const router = express.Router();

// Public: Get all questions
router.route("/").get(getAllQuestions);

// Protected: Get specific question (Only logged in users)
router.route("/:id").get(checkAuthorizationHeaders, authenticateUser, getQuestionById);

module.exports = router;