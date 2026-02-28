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

// Contest controller for updating progress
const { updateContestProgress } = require("./controllers/user/contest");

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Worker Connected to MongoDB"))
    .catch((err) => console.error("❌ Worker Mongo Error:", err));

// 2. Connect to Redis Queue
const submissionQueue = new Queue("submissions", {
    redis: { 
        port: process.env.REDIS_PORT || 6379, 
        host: process.env.REDIS_HOST || '127.0.0.1' 
    },
});

// 3. Create Retry Queue
const retryQueue = new Queue("retry-submissions", {
    redis: { 
        port: process.env.REDIS_PORT || 6379, 
        host: process.env.REDIS_HOST || '127.0.0.1' 
    },
});

// --- RETRY CONFIGURATION ---
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds delay before retry

console.log("🚀 Worker is running and waiting for jobs...");
console.log("🔄 Retry queue is also running and waiting for retry jobs...");
console.log(`📊 Max retry attempts: ${MAX_RETRY_ATTEMPTS}`);
console.log(`⏱️ Retry delay: ${RETRY_DELAY}ms`);

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
            const timedOut = !!(error && error.killed);
            if (timedOut) {
                console.log("⚠️ Process killed due to timeout!");
            }
            resolve({ stdout, stderr, error, timedOut });
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

const updateSubmissionInDB = async (submissionId, result, contest_id, user_id, question_id, isRetry = false, retryInfo = null) => {
    const { execution_time, time_limit, compiled, correctAnswer, error_message } = result;
    let status = "";
    
    if (!compiled) status = "COMPILATION ERROR";
    else if (execution_time > time_limit) status = "TIME LIMIT EXCEEDED";
    else if (!correctAnswer) status = "WRONG ANSWER";
    else status = "ACCEPTED";

    const updateData = {
        status: status,
        execution_time: execution_time
    };

    // Add retry information if this is a retry attempt
    if (isRetry && retryInfo) {
        updateData.retry_count = retryInfo.retry_count;
        updateData.last_retry_at = new Date();
        updateData.$push = {
            retry_history: {
                attempt: retryInfo.retry_count,
                status: status,
                error_message: error_message || null,
                timestamp: new Date()
            }
        };
    }

    // Update the existing submission doc
    await Submission.findByIdAndUpdate(submissionId, updateData);

    // 🟢 LOG: Final Verdict
    console.log(`📝 Verdict for ${submissionId}: ${status}${isRetry ? ` (Retry ${retryInfo?.retry_count})` : ""}`);

    // Update contest progress if this is a contest submission
    if (contest_id && user_id) {
        console.log(`📊 Updating contest progress for contest ${contest_id}`);
        await updateContestProgress(contest_id, user_id, question_id, status);
    }
};

// Helper function to determine if a submission should be retried
const shouldRetry = (result) => {
    const { compiled, correctAnswer, execution_time, time_limit, error_occurred } = result;
    
    // Don't retry these cases
    if (!compiled) return false; // Compilation error
    if (correctAnswer) return false; // Accepted
    if (!correctAnswer && execution_time <= time_limit && !error_occurred) return false; // Wrong answer but ran successfully
    
    // Retry these cases
    if (execution_time > time_limit) return true; // Time limit exceeded (could be system load)
    if (error_occurred) return true; // System errors
    
    return false;
};

// Update submission status to IN_RETRY
const markSubmissionForRetry = async (submissionId, retryCount, errorMessage) => {
    await Submission.findByIdAndUpdate(submissionId, {
        status: "IN_RETRY",
        retry_count: retryCount,
        last_retry_at: new Date(),
        $push: {
            retry_history: {
                attempt: retryCount,
                status: "QUEUED_FOR_RETRY",
                error_message: errorMessage,
                timestamp: new Date()
            }
        }
    });
    console.log(`🔄 Submission ${submissionId} marked for retry (Attempt ${retryCount})`);
};

// Mark submission as failed after max retries
const markSubmissionFailedRetry = async (submissionId) => {
    await Submission.findByIdAndUpdate(submissionId, {
        status: "FAILED_RETRY",
        $push: {
            retry_history: {
                attempt: MAX_RETRY_ATTEMPTS + 1,
                status: "FAILED_MAX_RETRIES",
                error_message: "Maximum retry attempts exceeded",
                timestamp: new Date()
            }
        }
    });
    console.log(`❌ Submission ${submissionId} failed after ${MAX_RETRY_ATTEMPTS} retry attempts`);
};

// --- MAIN WORKER LOGIC ---
submissionQueue.process(async (job, done) => {
    const { question_id, base64_encoded_data, submission_id, contest_id, user_id } = job.data;
    const jobId = job.id; 

    // 🟢 LOG: Job Received
    console.log(`\n---------------------------------------------------`);
    console.log(`📥 Job Received: ID ${jobId} | Submission ${submission_id}`);

    try {
        const result = await processSubmission({
            question_id, 
            base64_encoded_data, 
            submission_id, 
            contest_id, 
            user_id, 
            jobId,
            isRetry: false
        });

        // Check if submission should be retried
        if (shouldRetry(result)) {
            const submission = await Submission.findById(submission_id);
            const currentRetryCount = submission.retry_count || 0;
            
            if (currentRetryCount < MAX_RETRY_ATTEMPTS) {
                const newRetryCount = currentRetryCount + 1;
                const errorMessage = result.error_message || "Execution failed - system error";
                
                // Mark submission for retry in database
                await markSubmissionForRetry(submission_id, newRetryCount, errorMessage);
                
                // Add to retry queue with delay
                await retryQueue.add({
                    question_id,
                    base64_encoded_data,
                    submission_id,
                    contest_id,
                    user_id,
                    retry_count: newRetryCount,
                    original_error: errorMessage
                }, {
                    delay: RETRY_DELAY * newRetryCount // Exponential backoff
                });
                
                console.log(`🔄 Submission ${submission_id} added to retry queue (Attempt ${newRetryCount})`);
                done(null, { ...result, queued_for_retry: true });
                return;
            } else {
                // Max retries exceeded
                await markSubmissionFailedRetry(submission_id);
                done(null, result);
                return;
            }
        }

        // No retry needed, update final status
        await updateSubmissionInDB(submission_id, result, contest_id, user_id, question_id);
        done(null, result);

    } catch (error) {
        console.error("Worker Error:", error);
        
        // For unexpected errors, also consider retrying
        const submission = await Submission.findById(submission_id);
        const currentRetryCount = submission.retry_count || 0;
        
        if (currentRetryCount < MAX_RETRY_ATTEMPTS) {
            const newRetryCount = currentRetryCount + 1;
            await markSubmissionForRetry(submission_id, newRetryCount, error.message);
            
            await retryQueue.add({
                question_id,
                base64_encoded_data,
                submission_id,
                contest_id,
                user_id,
                retry_count: newRetryCount,
                original_error: error.message
            }, {
                delay: RETRY_DELAY * newRetryCount
            });
            
            console.log(`🔄 Submission ${submission_id} added to retry queue due to error (Attempt ${newRetryCount})`);
            done(null, { error: true, queued_for_retry: true });
        } else {
            await markSubmissionFailedRetry(submission_id);
            done(new Error(error.message));
        }
    }
});


// --- SUBMISSION PROCESSING FUNCTION ---
const processSubmission = async ({ question_id, base64_encoded_data, submission_id, contest_id, user_id, jobId, isRetry, retryCount = 0 }) => {
    // Unique file names
    const submission_file_path = path.join(PROCESSING_DIR, `sub_${jobId || submission_id}_${Date.now()}.cpp`);
    const input_file_path = path.join(PROCESSING_DIR, `input_${jobId || submission_id}_${Date.now()}.txt`);
    const solution_file_path = path.join(PROCESSING_DIR, `solution_${jobId || submission_id}_${Date.now()}.txt`);
    const output_file_path = path.join(PROCESSING_DIR, `output_${jobId || submission_id}_${Date.now()}.txt`);
    const executable_file_path = path.join(
        PROCESSING_DIR, 
        process.platform === 'win32' ? `a_${jobId || submission_id}_${Date.now()}.exe` : `a_${jobId || submission_id}_${Date.now()}.out`
    );

    let error_occurred = false;
    let error_message = "";

    try {
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

        const cleanupFiles = async () => {
            // 🔴 FIX: Wait 100ms for Windows to release file locks
            await new Promise(resolve => setTimeout(resolve, 100));
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
        };

        // 2. Compile
        console.log("⚙️  Compiling...");
        const compileResult = await execShellCommand(`g++ "${submission_file_path}" -o "${executable_file_path}"`);

        if (compileResult.error) {
            await cleanupFiles();
            return {
                compiled: false,
                time_limit,
                execution_time: 0,
                correctAnswer: false,
                error_occurred: false,
                error_message: "Compilation failed"
            };
        }

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
        const runResult = await execShellCommand(command, time_limit * 1000);
        const endTime = process.hrtime(startTime);
        const execution_time = (endTime[0] * 1000 + endTime[1] / 1e6) / 1000;

        // Check for runtime errors
        if (runResult.error && !runResult.timedOut) {
            error_occurred = true;
            error_message = "Runtime error: " + runResult.stderr;
        }

        if (runResult.timedOut) {
            await cleanupFiles();
            return {
                compiled: true,
                time_limit,
                execution_time: execution_time,
                correctAnswer: false,
                error_occurred: false,
                error_message: "Time limit exceeded"
            };
        }

        // 4. Compare
        const correctAnswer = await compareFiles(solution_file_path, output_file_path);

        await cleanupFiles();

        return { 
            compiled: true, 
            time_limit, 
            execution_time, 
            correctAnswer,
            error_occurred,
            error_message
        };

    } catch (error) {
        console.error("Processing Error:", error);
        return {
            compiled: false,
            time_limit: 0,
            execution_time: 0,
            correctAnswer: false,
            error_occurred: true,
            error_message: error.message
        };
    }
};

// --- RETRY QUEUE PROCESSOR ---
retryQueue.process(async (job, done) => {
    const { question_id, base64_encoded_data, submission_id, contest_id, user_id, retry_count, original_error } = job.data;
    const jobId = `retry_${job.id}`;

    console.log(`\n---------------------------------------------------`);
    console.log(`🔄 Retry Job Received: ID ${jobId} | Submission ${submission_id} | Attempt ${retry_count}`);

    try {
        const result = await processSubmission({
            question_id,
            base64_encoded_data,
            submission_id,
            contest_id,
            user_id,
            jobId,
            isRetry: true,
            retryCount: retry_count
        });

        // Check if this retry attempt should be retried again
        if (shouldRetry(result) && retry_count < MAX_RETRY_ATTEMPTS) {
            const newRetryCount = retry_count + 1;
            const errorMessage = result.error_message || "Retry attempt failed - system error";
            
            // Mark submission for another retry in database
            await markSubmissionForRetry(submission_id, newRetryCount, errorMessage);
            
            // Add to retry queue again with increased delay
            await retryQueue.add({
                question_id,
                base64_encoded_data,
                submission_id,
                contest_id,
                user_id,
                retry_count: newRetryCount,
                original_error: errorMessage
            }, {
                delay: RETRY_DELAY * newRetryCount
            });
            
            console.log(`🔄 Submission ${submission_id} re-queued for retry (Attempt ${newRetryCount})`);
            done(null, { ...result, queued_for_retry: true });
            return;
        }

        // Final attempt or success - update with final status
        if (shouldRetry(result) && retry_count >= MAX_RETRY_ATTEMPTS) {
            // Max retries exceeded
            await markSubmissionFailedRetry(submission_id);
        } else {
            // Success or non-retryable failure
            await updateSubmissionInDB(submission_id, result, contest_id, user_id, question_id, true, { retry_count });
        }
        
        done(null, result);

    } catch (error) {
        console.error("Retry Worker Error:", error);
        
        if (retry_count < MAX_RETRY_ATTEMPTS) {
            const newRetryCount = retry_count + 1;
            await markSubmissionForRetry(submission_id, newRetryCount, error.message);
            
            await retryQueue.add({
                question_id,
                base64_encoded_data,
                submission_id,
                contest_id,
                user_id,
                retry_count: newRetryCount,
                original_error: error.message
            }, {
                delay: RETRY_DELAY * newRetryCount
            });
            
            console.log(`🔄 Submission ${submission_id} re-queued due to retry error (Attempt ${newRetryCount})`);
            done(null, { error: true, queued_for_retry: true });
        } else {
            await markSubmissionFailedRetry(submission_id);
            done(new Error(error.message));
        }
    }
});