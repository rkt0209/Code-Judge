const { body } = require("express-validator");
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorResponse = require("../../utils/ErrorResponse");
const fs = require("fs");
const Queue = require("bull");
const Submission = require("../../models/Submission");
const Question = require("../../models/Question"); 

// Connect to Queue
const submissionQueue = new Queue("submissions", {
    redis: { port: process.env.REDIS_PORT || 6379, host: process.env.REDIS_HOST || '127.0.0.1' },
});

// --- HELPER: Create "Pending" Submission Doc ---
const createPendingSubmission = async (user_id, question_id) => {
    return await Submission.create({
        user_id,
        question_id,
        status: "PENDING", 
        execution_time: 0
    });
};

exports.checkSubmitRequest = [
    body("question_id").exists().withMessage("Question ID is Required"),
];

// --- MAIN CONTROLLER (Standard Mode) ---
// exports.submitFile = asyncHandler(async (req, res) => {
//     const user_id = req.auth_user.static_id;
//     const { question_id } = req.body;

//     let base64_encoded_data;
//     if (req.files && req.files.submission_file) {
//         const file_path = req.files.submission_file[0].path;
//         const file_buffer = fs.readFileSync(file_path);
//         base64_encoded_data = file_buffer.toString("base64");
//         fs.unlinkSync(file_path); 
//     } else {
//         throw new ErrorResponse("Submission File Missing", 400);
//     }

//     // 1. Create DB Entry FIRST
//     const submission_doc = await createPendingSubmission(user_id, question_id);

//     // 2. Add to Queue
//     const job = await submissionQueue.add({ 
//         question_id, 
//         base64_encoded_data, 
//         submission_id: submission_doc._id 
//     });

//     // 3. Wait for Worker to Finish (Standard/Blocking Mode)
//     // The worker runs in a separate process, but 'job.finished()' listens for the completion event via Redis.
//     const result = await job.finished();

//     // 4. Fetch the updated document to return to user
//     const updatedDoc = await Submission.findById(submission_doc._id);

//     res.json({
//       message: "Submitted Successfully",
//       results: updatedDoc
//     });
// });


// --- REDIS DEMO CONTROLLER (Uncomment this entire block to show Non-Blocking Queue) ---

exports.submitFile = asyncHandler(async (req, res) => {
    const user_id = req.auth_user.static_id;
    const { question_id } = req.body;

    let base64_encoded_data;
    if (req.files && req.files.submission_file) {
        const file_path = req.files.submission_file[0].path;
        const file_buffer = fs.readFileSync(file_path);
        base64_encoded_data = file_buffer.toString("base64");
        fs.unlinkSync(file_path);
    } else {
        throw new ErrorResponse("Submission File Missing", 400);
    }

    // 1. Create DB Entry
    const submission_doc = await createPendingSubmission(user_id, question_id);

    // 2. Add to Queue
    const job = await submissionQueue.add({ 
        question_id, 
        base64_encoded_data, 
        submission_id: submission_doc._id 
    });

    // 🟢 NEW WAY (Non-Blocking): Return immediately!
    // We do NOT wait for 'job.finished()' here.
    res.json({
        message: "Submission Queued! We are processing it in the background.",
        jobId: job.id,
        submissionId: submission_doc._id,
        position_in_queue: await submissionQueue.count() 
    });
});


// --- GET HISTORY ---
exports.getSubmissionHistory = asyncHandler(async (req, res) => {
    const user_id = req.auth_user.static_id;

    if (!Submission) throw new ErrorResponse("Submission Model Not Loaded", 500);

    const history = await Submission.find({ user_id: user_id })
        .populate("question_id", "title difficulty")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: history.length,
        data: history
    });
});