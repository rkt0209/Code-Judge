const { body } = require("express-validator");
const ErrorResponse = require("../../utils/ErrorResponse");
const asyncHandler = require("../../middlewares/asyncHandler");

const Question = require("../../models/Question");
const Admin = require("../../models/Admin");

exports.checkAddQuestionRequest = [
  body("title")
    .exists()
    .withMessage("Question Title is Required")
    .bail()
    .custom(async (value, { req }) => {
      const title_exists = await Question.findOne({ title: value });
      if (title_exists)
        throw new ErrorResponse("Question With Title Already Exists");
      return true;
    }),
  body("content").exists().withMessage("Question Content is Required").bail(),
  body("time_limit").exists().withMessage("Question Time Limit is Required").bail(),
  body().custom((value, { req }) => {
    if (!req.files?.solution_file?.length) {
      throw new ErrorResponse("Solution File is Required");
    }
    return true;
  }),
  body().custom((value, { req }) => {
    if (!req.files?.input_file?.length) {
      throw new ErrorResponse("Input File is Required");
    }
    return true;
  }),
];

exports.addQuestion = asyncHandler(async (req, res, next) => {
    const { title, content, time_limit } = req.body;

    // Normalize paths for Windows (replace backslashes with forward slashes)
    // Local storage gives you 'path', e.g., "uploads\solution-123.txt"
    const solutionPath = req.files.solution_file[0].path.replace(/\\/g, "/");
    const inputPath = req.files.input_file[0].path.replace(/\\/g, "/");

    const question = await Question.create({
        title,
        content,
        time_limit,
        solution_file: solutionPath, // Saving local path
        input_file: inputPath        // Saving local path
    });

    // ... rest of the code

  await Admin.findOneAndUpdate(
    {
      _id: admin_id,
    },
    {
      $push: {
        questions_created: { question_id: question._id },
      },
    }
  );

  return res.json({ message: "Question Added Successfully" });
});
