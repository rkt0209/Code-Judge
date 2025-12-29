const { body } = require("express-validator");
const asyncHandler = require("../../middlewares/asyncHandler");
const { exec } = require("child_process");
const ErrorResponse = require("../../utils/ErrorResponse");
const fs = require("fs");
const path = require("path");
const Question = require("../../models/Question");
const axios = require("axios");
const Queue = require("bull");
const Submission = require("../../models/Submission");

// --- CONFIGURATION ---
// We use path.resolve to get the FULL Absolute Path (e.g., C:\Users\Rohit kumar\...)
const submission_file_path = path.resolve("./processing/sub.cpp");
// Windows needs .exe, Linux needs .out
const executable_file_path = path.resolve(process.platform === 'win32' ? "./a.exe" : "./a.out");
const input_file_path = path.resolve("./input.txt");
const solution_file_path = path.resolve("./solution.txt");
const output_file_path = path.resolve("./output.txt");

const submissionQueue = new Queue("submissions", {
    redis: { port: process.env.REDIS_PORT || 6379, host: process.env.REDIS_HOST || '127.0.0.1' },
});

// --- WORKER PROCESSOR ---
submissionQueue.process(async (job, done) => {
    try {
        const { question_id, base64_encoded_data } = job.data;

        // 1. Prepare Files
        const question = await Question.findById(question_id);
        const { time_limit, solution_file, input_file } = question;

        // Save User Code
        await downloadFile(base64_encoded_data, submission_file_path, "BUFFER");

        // Save Input File
        if (input_file.startsWith("http")) {
             const { data: inputData } = await axios.get(input_file);
             await downloadFile(String(inputData), input_file_path, "TEXT");
        } else {
             // Read from local uploads and write to processing path
             // We handle the source path carefully too
             const srcPath = path.resolve(input_file);
             fs.copyFileSync(srcPath, input_file_path);
        }

        // Save Solution File
        if (solution_file.startsWith("http")) {
            const { data: solData } = await axios.get(solution_file);
            await downloadFile(String(solData), solution_file_path, "TEXT");
        } else {
             const srcPath = path.resolve(solution_file);
             fs.copyFileSync(srcPath, solution_file_path);
        }

        // 2. Compile (Use Quotes for paths with spaces!)
        // cmd: g++ "C:\Users\Rohit kumar\..." -o "C:\Users\Rohit kumar\..."
        let compilation_errors = await execShellCommand(`g++ "${submission_file_path}" -o "${executable_file_path}"`);

        if (!compilation_errors) {
            // 3. Execute
            // We construct the command carefully for Windows CMD
            // Format: "Executable" < "Input" > "Output"
            
            let command;
            if (process.platform === 'win32') {
                // Windows Command requires specific quoting for redirection to work with spaces
                command = `"${executable_file_path}" < "${input_file_path}" > "${output_file_path}"`;
            } else {
                command = `timeout ${time_limit + 1}s "${executable_file_path}" < "${input_file_path}" > "${output_file_path}"`;
            }
            
            // Run it
            const startTime = process.hrtime();
            await execShellCommand(command);
            const endTime = process.hrtime(startTime);
            const execution_time = (endTime[0] * 1000 + endTime[1] / 1e6) / 1000;

            // 4. Compare Results
            const correctAnswer = await compareFiles(solution_file_path, output_file_path);

            done(null, {
                message: "Executed",
                compiled: true,
                time_limit: time_limit,
                execution_time: execution_time,
                correctAnswer: correctAnswer,
            });
        } else {
            done(null, {
                message: "Compilation Error",
                compiled: false,
                time_limit: time_limit,
                execution_time: 0,
                correctAnswer: false,
            });
        }
    } catch (error) {
        console.log("Worker Error:", error);
        done(new Error(error.message));
    }
});

// Helper: Run Shell Command
const execShellCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        // We increase buffer size to avoid crashes on large outputs
        exec(cmd, { maxBuffer: 1024 * 10000 }, (error, stdout, stderr) => {
            // Start listening!
            resolve(error ? stderr : stdout);
        });
    });
};

// Helper: Compare Files (Ignores extra newlines/spaces)
const compareFiles = async (file_path1, file_path2) => {
    try {
        if (!fs.existsSync(file_path2)) return false;

        // Read files and trim whitespace/newlines
        const file1 = fs.readFileSync(file_path1, 'utf-8').trim().replace(/\r\n/g, '\n');
        const file2 = fs.readFileSync(file_path2, 'utf-8').trim().replace(/\r\n/g, '\n');

        console.log("--------------------------------");
        console.log("DEBUG JUDGE:");
        console.log("Solution:", JSON.stringify(file1));
        console.log("User Out:", JSON.stringify(file2));
        console.log("--------------------------------");

        return file1 === file2;
    } catch (err) {
        console.log("Comparison Error:", err);
        return false;
    }
};

const downloadFile = (file, file_path, mode) => {
    let data;
    if (mode == "TEXT") {
        data = file;
    } else {
        data = Buffer.from(file, "base64");
    }
    return new Promise((resolve, reject) => {
        // Ensure directory exists
        const dir = path.dirname(file_path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFile(file_path, data, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
};

exports.checkSubmitRequest = [
    body("question_id").exists().withMessage("Question ID is Required"),
];

const createSubmissionDoc = asyncHandler(
    async (user_id, question_id, result) => {
        const { execution_time, time_limit, compiled, correctAnswer } = result;
        let status = "";
        if (!compiled) {
            status = "COMPILATION ERROR";
        } else if (execution_time > time_limit) {
            status = "TIME LIMIT EXCEEDED";
        } else if (!correctAnswer) {
            status = "WRONG ANSWER";
        } else {
            status = "ACCEPTED";
        }

        const submission_doc = await Submission.create({
          user_id: user_id,
          question_id: question_id,
          status: status
        })

        return submission_doc;
    }
);

exports.submitFile = asyncHandler(async (req, res) => {
    // Auth User
    const user_id = req.auth_user.static_id;
    const { question_id } = req.body;

    let base64_encoded_data;
    if (req.files && req.files.submission_file) {
        const file_path = req.files.submission_file[0].path;
        const file_buffer = fs.readFileSync(file_path);
        base64_encoded_data = file_buffer.toString("base64");
    } else {
        throw new ErrorResponse("Submission File Missing", 400);
    }

    const job = await submissionQueue.add({ question_id, base64_encoded_data });
    const result = await job.finished();

    const submission_doc = await createSubmissionDoc(
        user_id,
        question_id,
        result);

    res.json({
      message: "Submitted Successfully", // Fixed Typo
      results: submission_doc
    });
});