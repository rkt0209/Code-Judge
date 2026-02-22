const express = require("express");
const { getAllQuestions, getQuestionById } = require("../../controllers/user/questions");
const { validateRequestBody, checkMongoId } = require("../../middlewares/validateRequestBody");

const router = express.Router({ mergeParams: true });

// 1. GET: Fetch all available questions
router.get(
  "/",
  getAllQuestions
);

// 2. GET: Fetch a specific question by ID
router.get(
  "/:question_id",
  checkMongoId("question_id"),
  validateRequestBody,
  getQuestionById
);

module.exports = router;
