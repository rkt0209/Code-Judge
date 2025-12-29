const mongoose = require("mongoose");
const Queue = require("bull");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const axios = require("axios");
require("dotenv").config();

// Models
const Submission = require("./models/Submission");
const Question = require("./models/Question");

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ Worker Connected to MongoDB"))
    .catch((err) => console.error("❌ Worker Mongo Error:", err));

// 2. Connect to Redis Queue
const submissionQueue = new Queue("submissions", {
    redis: { 
        port: process.env.REDIS_PORT || 6379, 
        host: process.env.REDIS_HOST || '127.0.0.1' 
    },
});

console.log("🚀 Worker is running and waiting for jobs...");

// --- CONFIGURATION ---
const PROCESSING_DIR = path.resolve("./processing");
if (!fs.existsSync(PROCESSING_DIR)) {
    fs.mkdirSync(PROCESSING_DIR, { recursive: true });
}

// --- HELPER FUNCTIONS ---
// Updated helper to enforce timeout inside Node.js
const execShellCommand = (cmd, timeoutLimit = 0) => {
    return new Promise((resolve) => {
        // We pass 'timeout' (in milliseconds) to exec options
        exec(cmd, { maxBuffer: 1024 * 10000, timeout: timeoutLimit }, (error, stdout, stderr) => {
            // If the process was killed by timeout, 'error.killed' will be true
            if (error && error.killed) {
                console.log("⚠️ Process killed due to timeout!");
            }
            resolve(error ? stderr : stdout);
        });
    });
};

const compareFiles = async (file_path1, file_path2) => {
    try {
        if (!fs.existsSync(file_path2)) return false;
        const file1 = fs.readFileSync(file_path1, 'utf-8').trim().replace(/\r\n/g, '\n');
        const file2 = fs.readFileSync(file_path2, 'utf-8').trim().replace(/\r\n/g, '\n');
        return file1 === file2;
    } catch (err) {
        return false;
    }
};

const downloadFile = (file, file_path, mode) => {
    let data;
    if (mode === "TEXT") {
        data = file;
    } else {
        data = Buffer.from(file, "base64");
    }
    return new Promise((resolve, reject) => {
        fs.writeFile(file_path, data, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
};

const updateSubmissionInDB = async (submissionId, result) => {
    const { execution_time, time_limit, compiled, correctAnswer } = result;
    let status = "";
    
    if (!compiled) status = "COMPILATION ERROR";
    else if (execution_time > time_limit) status = "TIME LIMIT EXCEEDED";
    else if (!correctAnswer) status = "WRONG ANSWER";
    else status = "ACCEPTED";

    // Update the existing submission doc
    await Submission.findByIdAndUpdate(submissionId, {
        status: status,
        execution_time: execution_time
    });

    // 🟢 LOG: Final Verdict
    console.log(`📝 Verdict for ${submissionId}: ${status}`);
};

// --- WORKER LOGIC ---
submissionQueue.process(async (job, done) => {
    const { question_id, base64_encoded_data, submission_id } = job.data;
    const jobId = job.id; 

    // 🟢 LOG: Job Received
    console.log(`\n---------------------------------------------------`);
    console.log(`📥 Job Received: ID ${jobId} | Submission ${submission_id}`);

    // Unique file names
    const submission_file_path = path.join(PROCESSING_DIR, `sub_${jobId}.cpp`);
    const input_file_path = path.join(PROCESSING_DIR, `input_${jobId}.txt`);
    const solution_file_path = path.join(PROCESSING_DIR, `solution_${jobId}.txt`);
    const output_file_path = path.join(PROCESSING_DIR, `output_${jobId}.txt`);
    const executable_file_path = path.join(
        PROCESSING_DIR, 
        process.platform === 'win32' ? `a_${jobId}.exe` : `a_${jobId}.out`
    );

    try {
        // 🔴 ARTIFICIAL DELAY (Uncomment the next line to show Redis functionality)
        // console.log("zzz... Worker Sleeping for 5 seconds...");
        // await new Promise(resolve => setTimeout(resolve, 5000));

        const question = await Question.findById(question_id);
        const { time_limit, solution_file, input_file } = question;

        // 1. Setup Files
        await downloadFile(base64_encoded_data, submission_file_path, "BUFFER");

        if (input_file.startsWith("http")) {
             const { data } = await axios.get(input_file);
             await downloadFile(String(data), input_file_path, "TEXT");
        } else {
             fs.copyFileSync(path.resolve(input_file), input_file_path);
        }

        if (solution_file.startsWith("http")) {
            const { data } = await axios.get(solution_file);
            await downloadFile(String(data), solution_file_path, "TEXT");
        } else {
             fs.copyFileSync(path.resolve(solution_file), solution_file_path);
        }

        console.log("📂 Files Prepared.");

        // 2. Compile
        console.log("⚙️  Compiling...");
        let compilation_errors = await execShellCommand(`g++ "${submission_file_path}" -o "${executable_file_path}"`);

        if (!compilation_errors) {
            console.log("✅ Compilation Successful.");
            
            // 3. Run
            console.log("🚀 Running...");
            let command;
            if (process.platform === 'win32') {
                command = `"${executable_file_path}" < "${input_file_path}" > "${output_file_path}"`;
            } else {
                command = `timeout ${time_limit + 1}s "${executable_file_path}" < "${input_file_path}" > "${output_file_path}"`;
            }
            
            const startTime = process.hrtime();
            await execShellCommand(command,time_limit * 1000);
            const endTime = process.hrtime(startTime);
            const execution_time = (endTime[0] * 1000 + endTime[1] / 1e6) / 1000;

            // 4. Compare
          // ... (after comparing files) ...

            // 4. Compare
            const correctAnswer = await compareFiles(solution_file_path, output_file_path);

            // 🔴 FIX: Wait 100ms for Windows to release file locks
            await new Promise(resolve => setTimeout(resolve, 100));

            // 🔴 FIX: Safe Cleanup (Try/Catch prevents crashes)
            const filesToDelete = [
                submission_file_path, 
                input_file_path, 
                solution_file_path, 
                output_file_path, 
                executable_file_path
            ];

            filesToDelete.forEach(file => {
                try {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                } catch (err) {
                    // Just log warning, don't crash the worker
                    console.log(`⚠️ Warning: Could not delete ${path.basename(file)} (Locked by Windows)`);
                }
            });

            const result = { compiled: true, time_limit, execution_time, correctAnswer };
            await updateSubmissionInDB(submission_id, result);
            
            done(null, result);
        }

    } catch (error) {
        console.error("Worker Error:", error);
        done(new Error(error.message));
    }
});