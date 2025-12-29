const mongoose = require("mongoose");
const { jobQueue } = require("./utils/queue");
const Submission = require("./models/Submission");
const Question = require("./models/Question");
const { executeCpp } = require("./utils/executeCpp");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Connect to DB (Worker needs its own connection)
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Worker connected to MongoDB");
});

jobQueue.process(async ({ data }) => {
    const submissionId = data.id;
    const submission = await Submission.findById(submissionId);
    const question = await Question.findById(submission.question_id);

    if (!submission || !question) {
        throw new Error("Missing Submission or Question Data");
    }

    console.log(`Processing Job: ${submissionId}`);

    try {
        // 1. Run the Code
        // We assume submission.code is the file path or content. 
        // If it's content, we saved it to a file in the controller.

        // Note: Adjust 'submission.code' logic based on how you saved it (path vs string)
        // Assuming controller saved file path in 'code' field:
        const userOutput = await executeCpp(submission.code, question.input_file);

        // 2. Read Expected Output
        const expectedOutput = fs.readFileSync(question.solution_file, "utf-8");

        // 3. Compare (Trim whitespace to be safe)
        if (userOutput.trim() === expectedOutput.trim()) {
            submission.status = "Accepted";
        } else {
            submission.status = "Wrong Answer";
        }
    } catch (err) {
        console.error("Execution Error:", err);
        submission.status = "Error"; // Or Compilation Error
    }

    await submission.save();
    console.log(`Job Finished: ${submissionId} -> ${submission.status}`);
});