const Question = require("../../models/Question");
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorResponse = require("../../utils/ErrorResponse");

exports.getAllQuestions = asyncHandler(async (req, res, next) => {
    // Hide secret files from users
    const questions = await Question.find().select("-solution_file -input_file");

    res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
    });
});

exports.getQuestionById = asyncHandler(async (req, res, next) => {
    const question = await Question.findById(req.params.id).select("-solution_file -input_file");

    if (!question) {
        return next(new ErrorResponse("Question not found", 404));
    }

    res.status(200).json({
        success: true,
        data: question
    });
});