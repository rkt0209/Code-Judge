// File: controllers/admin/question.js
const Question = require("../../models/Question");
const Admin = require("../../models/Admin");
const ErrorResponse = require("../../utils/ErrorResponse");
const asyncHandler = require("../../middlewares/asyncHandler");

exports.checkAddQuestionRequest = asyncHandler(async (req, res, next) => {
    const { title } = req.body;
    
    // Check if files are present
    if (!req.files || !req.files.solution_file || !req.files.input_file) {
        return next(new ErrorResponse("Both solution and input files are required", 400));
    }

    // Check unique title
    const existingQuestion = await Question.findOne({ title });
    if (existingQuestion) {
        return next(new ErrorResponse("Question with this title already exists", 400));
    }

    next();
});

exports.addQuestion = asyncHandler(async (req, res, next) => {
    const { title, content, time_limit } = req.body;

    // Save local file paths
    // We replace backslashes (\) with forward slashes (/) to avoid Windows path issues
    const solutionPath = req.files.solution_file[0].path.replace(/\\/g, "/");
    const inputPath = req.files.input_file[0].path.replace(/\\/g, "/");

    // Create Question in DB
    const question = await Question.create({
        title,
        content,
        time_limit,
        solution_file: solutionPath,
        input_file: inputPath
    });

    // Link Question to the Admin who created it
    await Admin.findByIdAndUpdate(req.auth_user._id, {
        $push: { questions_created: { question_id: question._id } }
    });

    res.status(201).json({
        success: true,
        message: "Question Added Successfully",
        data: question
    });
});
exports.deleteQuestion = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
        return next(new ErrorResponse("Question not found", 404));
    }

    // Optional: You could add logic here to delete the files from the 'uploads' folder too
    
    await Question.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Question deleted successfully"
    });
});