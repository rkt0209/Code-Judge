const Submission = require("../../models/Submission");
const Question = require("../../models/Question");
const ErrorResponse = require("../../utils/ErrorResponse");
const asyncHandler = require("../../middlewares/asyncHandler");

// @desc    Submit code for a problem
// @route   POST /api/user/submission
exports.submitCode = asyncHandler(async (req, res, next) => {
    const { question_id, code, language } = req.body;

    if (!code || !language || !question_id) {
        return next(new ErrorResponse("Please provide code, language, and question ID", 400));
    }

    // 1. Verify the Question exists
    const question = await Question.findById(question_id);
    if (!question) {
        return next(new ErrorResponse("Question not found", 404));
    }

    // 2. Create the Submission entry
    const submission = await Submission.create({
        user_id: req.auth_user._id, // Got from 'authenticateUser' middleware
        question_id,
        code,
        language,
        status: "Pending" // It stays pending until the Judge processes it
    });

    res.status(201).json({
        success: true,
        message: "Code Submitted Successfully",
        data: submission
    });
});

// @desc    Get my submission history
// @route   GET /api/user/submission
exports.getMySubmissions = asyncHandler(async (req, res, next) => {
    const submissions = await Submission.find({ user_id: req.auth_user._id })
        .populate("question_id", "title") // Also fetch the Question Title
        .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
        success: true,
        count: submissions.length,
        data: submissions
    });
});