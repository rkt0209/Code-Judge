const asyncHandler = require("../../middlewares/asyncHandler");
const Question = require("../../models/Question");
const ErrorResponse = require("../../utils/ErrorResponse");
const fs = require("fs");
const path = require("path");

const readMarkdownContent = (contentFilePath, fallbackContent) => {
  if (!contentFilePath) return fallbackContent || "";
  try {
    return fs.readFileSync(path.resolve(contentFilePath), "utf-8");
  } catch (err) {
    return fallbackContent || "";
  }
};

exports.getAllQuestions = asyncHandler(async (req, res) => {
  // Fetch all questions, excluding solution_file and input_file (as these are for evaluation only)
  const questions = await Question.find(
    {},
    { title: 1, content: 1, content_file: 1, time_limit: 1, difficulty: 1, createdAt: 1, updatedAt: 1 }
  ).sort({ createdAt: -1 });

  if (!questions || questions.length === 0) {
    return res.json({
      message: "No questions available yet",
      count: 0,
      data: []
    });
  }

  const hydrated = questions.map((question) => ({
    ...question.toObject(),
    content: readMarkdownContent(question.content_file, question.content)
  }));

  res.status(200).json({
    message: "Questions Fetched Successfully",
    count: hydrated.length,
    data: hydrated
  });
});

exports.getQuestionById = asyncHandler(async (req, res) => {
  const { question_id } = req.params;

  const question = await Question.findById(question_id, {
    title: 1,
    content: 1,
    content_file: 1,
    time_limit: 1,
    difficulty: 1,
    createdAt: 1,
    updatedAt: 1
  });

  if (!question) {
    throw new ErrorResponse("Question not found", 404);
  }

  res.status(200).json({
    message: "Question Fetched Successfully",
    data: {
      ...question.toObject(),
      content: readMarkdownContent(question.content_file, question.content)
    }
  });
});
